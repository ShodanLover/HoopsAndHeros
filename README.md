# Basketball Empire

A mobile-first idle RPG about building a basketball dynasty: you start with one terrible player
(Marcus "Bricks" Bell) on a cracked neighborhood court and grow into a 10-world empire, ending in the
Basketball Multiverse. It runs as plain HTML/CSS/JavaScript with no build step, framework, or assets
to download. All art is drawn in code (in a 16-bit pixel style) and all sound is synthesized with Web Audio.

> **Handoff note for Claude (Desktop/Code):** read this whole file first. It explains the architecture,
> where each system lives, how to run and test it, and what is in progress. Keep the module pattern and
> the rule that `data.js` holds content and balance while the other files hold systems.

---

## Working on it with Claude

Open this folder in Claude Code (or the Code tab of Claude Desktop). `CLAUDE.md` holds the working
rules. `.claude/agents/` has 10 specialists (art director, technical artist, game designer, economy designer,
UI/UX, sound, QA, live ops, performance, accessibility) and `.claude/skills/` has `/playtest`,
`/balance-check`, `/add-content`, `/make-sprite`, `/asset-audit` and `/perf-profile`.
`design/` holds the one-page brief, the 16-bit art bible and the monetization policy. These are adapted
from Claude Code Game Studios; see `THIRD_PARTY_NOTICES.md`. First-time setup, including the
agent-sprite-forge plugin, is in `setup/DESKTOP-SETUP.md`.

## Play it

- **Quickest:** open `dist/basketball-empire.html` in any browser. It's a single self-contained file.
- **From source:** serve the folder (for example `npx serve .` or `python3 -m http.server`) and open
  `index.html`. Opening `index.html` straight from disk also works because the game uses classic `<script>`
  tags, not ES modules.
- **Rebuild the single-file bundles** after editing any source file:
  ```bash
  node tools/build.js
  ```
  This writes `dist/basketball-empire.html` (a standalone page) and `dist/artifact.html` (the same game
  without the `<html>`/`<head>` wrapper, for the claude.ai Artifact publisher).

The layout is portrait and touch-first, and also works on desktop. Progress is saved to `localStorage`
every 5 seconds and when the page is hidden. On claude.ai it also uses an optional per-user cloud save.

---

## Tests and tools (Node 18+; Playwright for browser tests)

| Command | What it does |
|---|---|
| `node tests/calibrate.js` | Win probability and stage length of the challenger stream against power ratio, for squads of 1, 3 and 5 |
| `node tests/progression.js [hours] [prestiges]` | A greedy bot plays the real game loop and reports time to reach each world, the progression wall, and how much faster runs get after prestige |
| `node tests/smoke.js` | Loads the bundle in headless Chromium at phone size and screenshots the first minute |
| `node tests/e2e.js` | Full playthrough: tutorial, every screen and most buttons, recruiting, gear, facilities, shop, every hub modal, contests, a championship, offline earnings, prestige, and save/reload. Fails on any page error. Screenshots go to `tests/shots/` (gitignored) |

`tests/load.js` loads the browser modules into a Node `vm` context, so the economy and simulation can be
tested headlessly.

---

## Architecture

Every file is an IIFE that attaches to one global namespace, `window.BE`. Scripts load in this order
(see `index.html`):

| File | Responsibility |
|---|---|
| `js/util.js` | Seeded RNG (mulberry32), number formatting (K/M/B/…/Dc), date keys (day/week/month), easing, event bus `BE.bus` |
| `js/data.js` | **All content and balance**: balance constants, attributes, positions, rarities, archetypes and abilities, personalities, names, the 10 worlds (formats, teams, arena themes, unlocks), feature-unlock gates, Team Growth stats, the Franchise Story quest chain (generated), facilities, coaches, gear types with slot unlocks, owned-effect tables, active abilities, tactics, prestige perks, cosmetics, login rewards, mission pools, achievements, products/IAP, gem shop, boosts, spin wheel, ad placements, alliances |
| `js/athletes.js` | A deterministic catalog of 300 collectible athletes (30 per world: 9 Common, 7 Uncommon, 6 Rare, 4 Epic, 3 Legendary, 1 Mythic) plus the starter. Effective attributes (base, stars, training, gear), opponent generation, and procedural SVG portraits |
| `js/state.js` | Default save, type-safe merge/validation, migration, runtime indexes, localStorage with a backup slot, optional claude.ai cloud save (`claude.use('db')` at `data/users/<id>/save`), export/import save codes |
| `js/economy.js` | Formulas and mutating actions: opponent power curve, rewards, the cached modifiers aggregate (`mods`), Team Growth, owned effects (athletes, milestones, world sets, gear), athlete/team power, leveling, training, facilities, coaches, gear (make/equip/upgrade/merge/salvage/craft/auto-equip, slots by stage), recruitment with banner levels, pity, wish list and duplicate conversion, shard exchange, `grant()`, prestige |
| `js/stream.js` | **The stage model: formation combat.** The squad sits in a formation of seats (columns back to front: 1, 1-2, 2-1-2; bigs auto-seated in front). Ten defenders enter from the right in groups of 2–3 (pressers attack the front column, snipers hit any seat), then the boss. Every squad member attacks on their own rhythm; only the front column drives and dunks, guards and wings shoot from their seats. Each player has their own Stamina: a gassed player sits out 5 s and returns at 35%; if the whole front column is gassed the stage is lost. The boss telegraphs a big play every third play that Lockdown shuts down. Headless; drives the court, offline progress, camps and tournaments |
| `js/sim.js` | Legacy possession-by-possession simulation, no longer used by the main loop (kept for reference) (steals, passes, threes, jumpers, drives, dunks, post-ups, blocks, fouls and free throws, offensive rebounds and putbacks, stamina, tactics counters, abilities, clutch time, overtime). Runs headless for offline progress and tournaments |
| `js/game.js` | Orchestration: lineups, current target (push/farm/championship), building teams for the sim, match result processing, idle `tick`, offline progress (Monte Carlo win rates), daily/weekly/monthly resets, missions, Franchise Story quests, Training Camps, Boosts, Halftime Spin, Fan Gifts, login ladder, season pass, achievements, simulated social layer, weekly tournament |
| `js/court.js` | Canvas renderer: side-view court with themed arenas and crowds per world. Chibi characters (big heads, readable eyes/brows/mouth, dark outline, hair styles, facial hair and visible gear) drawn in code. Animates stream events: each party member runs their move on the defender, the defender wears the hit (knockback, stumble, ankle-breaker fall), the ball drops through the net, then hit-stop, damage numbers, streak counter, boss crown, aura and wind-up |
| `js/audio.js` | Procedural SFX (bounce, sneaker squeak, swish, rim, dunk, crowd, buzzer, upgrades, recruit reveals by rarity) and a lo-fi music loop |
| `js/services.js` | **Monetization integration point** (see below) and haptics |
| `js/ui-core.js` | Icons, modal sheets, toasts, flying-currency and spark FX, reward popups, HUD, bottom nav, the tutorial coach overlay, the dev-mode ad placeholder |
| `js/sprite-data.js`, `js/sprites.js` | Optional pixel-sprite players (agent-sprite-forge codeart2d parts, recolored per athlete). Loaded but **off** (`BE.sprites.enabled`) until an owner-approved set exists |
| `js/ui-play.js` | The pinned **arena** (stage bar, court, scoreboard, abilities, Franchise Story quest bar with GO/CLAIM) and the Home tab shell (hub, toolbar, commentary), live match runner, results, championship entry, nav badges |
| `js/ui-growth.js` | Home tab: **Team Growth** panel (franchise stats, ×1/×10/×100/MAX) and the squad strip |
| `js/ui-camps.js` | Daily faucets: Training Camps (keyed, tiered), Boosts (20-minute buffs), Halftime Spin, Fan Gifts |
| `js/ui-team.js` | Team: lineup, roster, athlete detail (level up, train attributes, equip), gear inventory/crafting, collection |
| `js/ui-recruit.js` | Banners (Pro, limited Event, Street), disclosed odds, pity counters, single and 10× reveal animations, shard exchange |
| `js/ui-empire.js` | Empire (facilities, coaches, Development League, Legacy/prestige) and the Shop |
| `js/ui-meta.js` | Missions/trophies, daily login, season pass, Camps & Events sheet (camps, contests, tournament, weekly and weekend challenges), leagues and social, world map, tactics, settings, franchise, offline summary, championship ceremony, world intro, feature-unlock intros |
| `js/contests.js` | Interactive minigames: Free Throw Challenge, 3-Point Contest, Slam Dunk Contest (timing meter) |
| `js/main.js` | Boot, splash, game loop, autosave, visibility/offline handling, the global `data-act` click dispatcher, the tutorial state machine |
| `css/style.css` | Visual system (tokens at the top) |
| `tools/build.js` | Bundles everything into `dist/` |

**UI pattern:** screens render HTML strings. Clicks go through one delegated listener: elements carry
`data-act="name"` and their dataset is passed to the matching handler in `actions` (`main.js`) or in
`BE.team.act`, `BE.recruitUI.act` or `BE.empire.act`. Modals handle their own clicks with their own
`data-*` attributes.

---

## Game systems at a glance

- **One screen (the idle-RPG loop, see `design/idle-loop-reference.md`):** the court is pinned at the top on
  every tab with the scoreboard, abilities and the **Franchise Story** bar (one active quest out of 134, GO
  jumps to it, CLAIM pays gems/tickets). The tabs scroll underneath. Home holds the hub, **Team Growth**
  (8 franchise stats, ×1/×10/×100/MAX, always a few wins away, cap 25 + 10 per world, reset on prestige),
  Boosts, the Halftime Spin and the squad strip.
- **Core loop (formation combat, 2026-11-11, modelled on Idle Champions; see
  `design/reference/icfr-combat-and-formation.md`):** the squad holds a formation on the left, defenders pour in
  from the right in groups, ten per stage, then the boss. Each broken defender pays 4% of the stage reward on the
  spot; beating the boss pays the rest. If the front column is gassed at the same time, the squad falls back to
  replay the last stage. Auto-push retries after 3 replay wins, and the wall overlay shows the power you need. Win
  odds follow squad power ÷ opponent power: about 50% at 1.15, 70% at 1.25 and 90% at 1.4
  (`node tests/calibrate.js`); stages last about 25–35 seconds.
- **Party size:** World 1 fills the five-player party: 1 player (Games 1–2), 3 (Games 3–5), all 5 from Game 6.
  All five squad slots are shown from minute one with their unlock game. Free walk-ons fill new slots.
- **Worlds:** 10 worlds × 10 stages. Stage 10 of each world is a 3-round championship the player chooses
  to enter. After World 10, endless Multiverse Rifts begin.
- **Power:** athlete power = rarity × (OVR/50)^2.2 × level curve (+7% per level, ×2 every 25 levels) ×
  stars × gear × global multipliers. The opponent curve steepens each world (`balance.oppGrowth`), which
  creates prestige walls.
- **RPG:** 12 attributes, positions, archetype signature abilities, personalities that change the sim,
  celebrations, star-ups from duplicates, training points to raise attributes up to a potential cap.
- **Recruiting:** odds are listed in the game per **banner level** (1–10, levelled by pulls; Pro goes from
  C 50 / U 28.5 / R 15 / E 5 / L 1.3 / M 0.2 at level 1 to C 30 / U 30 / R 24 / E 11 / L 4 / M 1 at level 10, full
  table in the Odds sheet). Every 10-pull includes Rare or better; Epic+ by 30 pulls, Legendary+ by 80, Mythic
  by 200. One free recruit per banner per day (optional ad, same odds). A 3-slot **wish list** takes 50% of Pro
  Legendary rolls. Duplicates raise stars; at 5★ they give shards and every 5 convert into a recruit of the
  next rarity. The Event banner is a weekly rotating theme with a featured Legendary. Street Scout costs cash.
- **Owned effects:** every athlete adds power to the franchise even on the bench (by rarity and stars, plus
  milestone bonuses at Lv 10/25/50/75/100); world set bonuses at 10/20/30 athletes discovered; every gear piece
  adds power owned or not. The Collection book (Team → Collection) totals them.
- **Gear:** 7 types (5 per athlete plus ball and training gear for the team), 6 rarities, 10 world sets.
  Slots open by stage (sneakers and jersey W1, headband and ball W2, wristband and training W3, sleeve W4).
  Upgrade, merge 3→1, salvage, craft, one-tap Auto-equip. Gear is visible on court and in portraits.
- **Idle:** passive income, Development League (the bench earns money), training points, Youth Academy
  tickets, and offline progress capped by the offline-hours modifier. Offline progress can auto-clear
  stages and has an optional rewarded ad that doubles it.
- **Management:** 9 facilities and 8 coaches unlock gradually.
- **Prestige (Legacy):** available after the World 3 championship. You keep athletes, gear, collection,
  gems and perks. Each Legacy Star ever earned gives +2% power and cash, and stars buy perks: income,
  power, offline, scouting, head start, Auto-Trainer (a new mechanic), 4× speed, ability cost, gem drops,
  Second Unit, and an exclusive cosmetic.
- **Daily faucets:** Training Camps (Cash, Scrap, Shard, Boss Rush; 2 keys each per day, selectable tiers that
  unlock by clearing, one optional ad key), two 20-minute Boosts (+50% cash, +25% power; free once a day each,
  optional ads after), a Halftime Spin (one free a day, published slices), and Fan Gifts that drift over the
  court every few minutes.
- **Engagement:** 7-day login ladder (missing a day restarts it without penalty), 3 daily missions plus a
  "complete all" bonus, 3 weekly missions, 20 tiered achievements, a 30-tier monthly season pass with
  free and premium tracks, 3 skill contests per day, a weekly 16-team tournament with league tiers, a
  weekly limited challenge, and a weekend showdown.
- **Social:** global and rival leaderboards, franchise alliances with weekly chests, and a showcase card.
  These are **simulated locally** and labeled that way in the UI. `BE.game.social` is the seam where an
  online provider would plug in.
- **Onboarding:** coach-guided first 5 minutes covering the first game, the Hype ability, the first
  upgrade, a guaranteed Rare-or-better first recruit, the world map, offline earnings and the next goal.
  After that, features unlock gradually and each gets a one-time intro card.

## Monetization (honest by design)

`js/services.js` is the only integration point. A native wrapper (Capacitor, Cordova or a TWA) should
define `window.BEPlatform = { purchase(sku), showRewardedAd(placement), showInterstitial(), getPrices() }`
before the game loads. **Without it the game runs in DEVELOPMENT MODE:** purchase buttons grant items
through a clearly labeled test confirmation and never charge money, and ads show a labeled placeholder
with a countdown. Interstitials only appear at natural transitions (after a championship and world intro)
and are rate-limited: not in the first 20 minutes of a session, at most once every 15 minutes, never
for VIP. There are no fake countdowns. Every price is shown exactly, the odds are fully disclosed, and
everything can be earned without paying.

Products are defined in `data.js` → `products`: starter bundle, gem packs, recruitment bundle, cosmetic
pack, season pass premium, VIP.

## Balance knobs

`BE.data.balance` in `js/data.js` holds the main constants: opponent base and per-world growth, reward
growth, level cost and power growth, milestones, passive and offline rates, and the Team Growth cost curve
(`growthCostGrowth`, `growthCostStage`, caps). Growth prices follow the real reward per win so a level is
always a few wins away. After changing anything, run `node tests/progression.js 3 2` (the bot buys growth,
claims quests and recruits). The stream's own knobs are `BE.stream.CFG` in `js/stream.js` (Guard `hpK`,
Stamina `staK`, challenger damage `oppK`, per-stage swing `form`, walk-in, boss multiples), and
`oppPerPlayer` applies a rookie discount (×0.6 rising to ×1 by World 3) so the first session never walls.
Measured 2026-11-11 with formation combat: World 2 in about 5–30 minutes (median about 20), World 4 in about
20–60 minutes (median about 40), the first-run wall at World 8 after about 3 hours, and a second run that reaches
World 9 about four times faster. Variance comes mostly from recruit luck.

## Status and next steps

- ✅ Core game complete and tested end to end (`node tests/e2e.js`, no page errors).
- ✅ **Idle-RPG loop pass (2026-11-11)**, following `design/idle-loop-reference.md` (owner brief: the Legend of
  Slime loop: a 5-character squad, constant unlocks, accessories, always a goal). Shipped in order: presentation
  reset (clean UI, HD court, vector art), one-screen layout with the court pinned, squad of five from minute one,
  Team Growth panel, Franchise Story quest line, owned effects + Collection book + Auto-equip + slots by stage,
  banner levels + free daily recruit + wish list + duplicate conversion, Training Camps + Boosts + Halftime Spin +
  Fan Gifts, a juice and balance pass. All within `design/monetization-policy.md`.
- ✅ **Formation combat, step 1 of 7 (2026-11-11):** seats in columns, defender groups (pressers and snipers),
  per-player Stamina with front-column collapse. Next steps are listed at the end of
  `design/reference/icfr-combat-and-formation.md` (court chemistry and formation editor next).
- ✅ **Challenger stream + chibi party (2026-11-11).** Matches replaced by a constant stream of challengers
  (`js/stream.js`); the court is a side view where the party of five runs signature plays on the defender
  (`js/court.js`). Chibi characters are code-drawn HD vector, so faces read at phone size. Owner to confirm the
  look; the pixel-sprite route stays parked behind `BE.sprites.enabled`.
- ⏸ **Art direction (owner's call: pixel sprites, HD-2D style).** The 16-bit whole-screen look was rejected and
  reverted; the court is HD with the original vector figures. `js/sprites.js` and the code-drawn parts remain
  behind `BE.sprites.enabled = false`. Three sprite attempts were rejected for unreadable faces (see
  `tools/sd/` and the memory note `art-quality-bar`). Next: produce **one** finished character at phone size
  with a clearly readable face and get it approved before any batch. A free local pipeline exists on the owner's
  desktop (`D:\AI`: ComfyUI + DreamShaper 8 + OpenPose ControlNet + anime-seg; scripts in `tools/sd/`).
- Next for the loop (not started): a Plays track (abilities as a collectible with slots and levels), Coaches as a
  summonable companion track, a Rookie Journal (7-day newbie event with a guaranteed Legendary), stage-milestone
  Hall of Records, and an economy-designer pass on the camp reward curve and the mid-game once real players
  exist.
- **Resources the owner wants used.** These were investigated from a cloud session; set them up on the desktop.
  1. ✅ *Installed on the owner's desktop (v0.5.0, user scope; enabled for this project in `.claude/settings.json`).
     Python packages and ffmpeg are present and `codeart2d` renders locally. `route_media.py` reports no image
     route, so only the free local tools are available until an API key or a Codex/Grok CLI is added.*
     **[0x0funky/agent-sprite-forge](https://github.com/0x0funky/agent-sprite-forge)** (MIT): a Claude Code plugin for
     sprites, sprite sheets, maps and FX. Install:
     ```bash
     claude plugin marketplace add 0x0funky/agent-sprite-forge --sparse .claude-plugin skills
     ```
     ```bash
     claude plugin install agent-sprite-forge@agent-sprite-forge
     ```
     ```bash
     python -m pip install "numpy>=1.26" "Pillow>=10.1" "scipy>=1.11"
     ```
     Generating *new* images or animation clips needs an image route: an API key it supports (OpenAI, Gemini,
     xAI, BytePlus, fal.ai) or a signed-in Codex or Grok CLI. Animation also needs ffmpeg 5.1+. Without a route,
     two parts still work locally and fit this game:
     - **`codeart2d`** draws pixel sprites from a PixelSpec JSON with no image model, which suits the
       court players (idle, run, dribble, shoot, jump, dunk, block, celebrate frames).
     - The **hibit finish** (`generate2dsprite/scripts/forge_hibit.py`, `finish_frames.py hibit`) turns flat,
       lineless art into real pixel art with a learned palette, majority-vote downscale and auto outline. The
       game's vector portraits (`BE.athletes.portraitSVGRaw`) are exactly that kind of flat art, so render them to
       PNG and run them through hibit instead of (or to replace) the simple rasterizer in `js/pixel.js`.
     The README also recommends [pixelfx](https://github.com/patch-gg/pixelfx) (MIT) for pixel effects such as dunk
     impacts, sparks and confetti. Ship each tool's `CREDITS`/`LICENSE` notices with any assets made by it.
  2. ✅ *Done: adapted in place (option b below): agents, skills and design docs, with `CLAUDE.md`.*
     **[Donchitos/Claude-Code-Game-Studios](https://github.com/Donchitos/Claude-Code-Game-Studios)** (MIT): a Claude
     Code *template project*: 48 specialist agents (art-director, technical-artist, economy-designer,
     game-designer, qa-tester and more), skills such as `/prototype`, hooks and settings. It is meant to be the
     project root, so pick one way to use it:
     - **(a)** clone the template, open Claude Code in it, and run `/prototype --from <path to this repo>`. It
       brings a copy of this game in, and then `/cut`, tuning panels and its "grow" flow (Vite + TypeScript) apply.
     - **(b)** keep this repo as the root and copy in only the agents/skills you want (for example
       `.claude/agents/art-director.md`, `technical-artist.md`, `economy-designer.md`, `qa-tester.md`), without its
       hooks or `project.yaml`.
     The owner chose to let Claude decide, and option (b) was applied. A second pass added the
     `live-ops-designer`, `performance-analyst` and `accessibility-specialist` agents and the `/asset-audit`
     and `/perf-profile` skills. Its hooks, `project.yaml`, sprint/story workflow and engine-specific
     (Godot/Unity/Unreal) agents were left out on purpose: they assume the template is the project root and
     a game engine.
  3. **[Angais/pixel-art-atlas-1.4m](https://huggingface.co/datasets/Angais/pixel-art-atlas-1.4m)** (Hugging Face
     dataset, about 1.4M pixel-art images). It couldn't be opened from the cloud session (huggingface.co blocked
     there), so its license and where its images come from have **not** been checked. Read the dataset card first.
     Unless it clearly allows commercial use of the images, use it only as a style and palette reference (or to
     tune the hibit palette), and don't ship its images in the game.
- Ideas: real online leaderboards and alliances through `BE.game.social`, a store wrapper through
  `BEPlatform`, more arenas and cosmetics, localized prices, push notifications (opt-in only).
