# Basketball Empire

A mobile-first idle RPG about building a basketball dynasty: you start with one terrible player
(Marcus "Bricks" Bell) on a cracked neighborhood court and grow into a 10-world empire, ending in the
Basketball Multiverse. It runs as plain HTML/CSS/JavaScript with no build step, framework, or assets
to download. All art is drawn in code and all sound is synthesized with Web Audio.

> **Handoff note for Claude (Desktop/Code):** read this whole file first. It explains the architecture,
> where each system lives, how to run and test it, and what is in progress. Keep the module pattern and
> the rule that `data.js` holds content and balance while the other files hold systems.

---

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
| `node tests/calibrate.js` | Win probability against power ratio for 1v1, 3v3 and 5v5 (checks the sim's balance) |
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
| `js/data.js` | **All content and balance**: balance constants, attributes, positions, rarities, archetypes and abilities, personalities, names, the 10 worlds (formats, teams, arena themes, unlocks), feature-unlock gates, facilities, coaches, gear types, active abilities, tactics, prestige perks, cosmetics, login rewards, mission pools, achievements, products/IAP, gem shop, ad placements, alliances |
| `js/athletes.js` | A deterministic catalog of 300 collectible athletes (30 per world: 9 Common, 7 Uncommon, 6 Rare, 4 Epic, 3 Legendary, 1 Mythic) plus the starter. Effective attributes (base, stars, training, gear), opponent generation, and procedural SVG portraits |
| `js/state.js` | Default save, type-safe merge/validation, migration, runtime indexes, localStorage with a backup slot, optional claude.ai cloud save (`claude.use('db')` at `data/users/<id>/save`), export/import save codes |
| `js/economy.js` | Formulas and mutating actions: opponent power curve, rewards, the cached modifiers aggregate (`mods`), athlete/team power, leveling, training, facilities, coaches, gear (make/equip/upgrade/merge/salvage/craft), recruitment with pity, shard exchange, `grant()`, prestige |
| `js/sim.js` | Possession-by-possession basketball simulation (steals, passes, threes, jumpers, drives, dunks, post-ups, blocks, fouls and free throws, offensive rebounds and putbacks, stamina, tactics counters, abilities, clutch time, overtime). Runs headless for offline progress and tournaments |
| `js/game.js` | Orchestration: lineups, current target (push/farm/championship), building teams for the sim, match result processing, idle `tick`, offline progress (Monte Carlo win rates), daily/weekly/monthly resets, missions, login ladder, season pass, achievements, simulated social layer, weekly tournament |
| `js/court.js` | Canvas renderer: perspective half-court, themed arenas and crowds per world, player figures with gear visible, hoop and net physics, ball arcs, and the task-queue "director" that turns sim events into animated plays, celebrations, particles and floaters |
| `js/audio.js` | Procedural SFX (bounce, sneaker squeak, swish, rim, dunk, crowd, buzzer, upgrades, recruit reveals by rarity) and a lo-fi music loop |
| `js/services.js` | **Monetization integration point** (see below) and haptics |
| `js/ui-core.js` | Icons, modal sheets, toasts, flying-currency and spark FX, reward popups, HUD, bottom nav, the tutorial coach overlay, the dev-mode ad placeholder |
| `js/ui-play.js` | Play screen: stage bar, hub, objective chip, live match runner, scoreboard, commentary, abilities, results, championship entry, nav badges |
| `js/ui-team.js` | Team: lineup, roster, athlete detail (level up, train attributes, equip), gear inventory/crafting, collection |
| `js/ui-recruit.js` | Banners (Pro, limited Event, Street), disclosed odds, pity counters, single and 10× reveal animations, shard exchange |
| `js/ui-empire.js` | Empire (facilities, coaches, Development League, Legacy/prestige) and the Shop |
| `js/ui-meta.js` | Missions/trophies, daily login, season pass, events (contests, tournament, weekly and weekend challenges), leagues and social, world map, tactics, settings, franchise, offline summary, championship ceremony, world intro, feature-unlock intros |
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

- **Core loop:** matches auto-play on the Play screen. Wins pay cash, fans and drops and clear stages. A
  loss drops you back to "farm" your last win. Auto-push retries after 3 farm wins, and the wall overlay
  shows the power you need.
- **Formats:** World 1 goes from 1v1 (first to 7) to 3v3 (first to 11). World 2 goes from 3v3 to 5v5 (four
  quarters, with every few possessions animated and the rest fast-forwarded). Free walk-ons fill new slots
  when a format grows.
- **Worlds:** 10 worlds × 10 stages. Stage 10 of each world is a 3-round championship the player chooses
  to enter. After World 10, endless Multiverse Rifts begin.
- **Power:** athlete power = rarity × (OVR/50)^2.2 × level curve (+7% per level, ×2 every 25 levels) ×
  stars × gear × global multipliers. The opponent curve steepens each world (`balance.oppGrowth`), which
  creates prestige walls.
- **RPG:** 12 attributes, positions, archetype signature abilities, personalities that change the sim,
  celebrations, star-ups from duplicates, training points to raise attributes up to a potential cap.
- **Recruiting:** odds are listed in the game. Pro: C 50 / U 28.5 / R 15 / E 5 / L 1.3 / M 0.2. Every
  10-pull includes Rare or better; Epic+ by 30 pulls, Legendary+ by 80, Mythic by 200. The Event banner
  is a weekly rotating theme with a featured Legendary. Street Scout costs cash. Collection milestones
  give permanent bonuses.
- **Gear:** 7 types (5 per athlete plus ball and training gear for the team), 6 rarities, 10 world sets.
  Upgrade, merge 3→1, salvage, craft. Gear is visible on court and in portraits.
- **Idle:** passive income, Development League (the bench earns money), training points, Youth Academy
  tickets, and offline progress capped by the offline-hours modifier. Offline progress can auto-clear
  stages and has an optional rewarded ad that doubles it.
- **Management:** 9 facilities and 8 coaches unlock gradually.
- **Prestige (Legacy):** available after the World 3 championship. You keep athletes, gear, collection,
  gems and perks. Each Legacy Star ever earned gives +2% power and cash, and stars buy perks: income,
  power, offline, scouting, head start, Auto-Trainer (a new mechanic), 4× speed, ability cost, gem drops,
  Second Unit, and an exclusive cosmetic.
- **Engagement:** 7-day login ladder (missing a day restarts it without penalty), 3 daily missions plus a
  "complete all" bonus, 3 weekly missions, 19 tiered achievements, a 30-tier monthly season pass with
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
growth, level cost and power growth, milestones, passive and offline rates. After changing them, run
`node tests/progression.js 6 3`. Current pacing for an optimal bot: World 2 in about 10–20 minutes,
World 4 (prestige unlock) in about 40–75 minutes, the first-run wall around World 7–8 after about
3 hours, and a second run that reaches World 8 about twice as fast.

## Status and next steps

- ✅ Core game complete and tested end to end (`node tests/e2e.js`, no page errors).
- 🚧 **In progress: 16-bit visual overhaul**, requested by the owner. Plan: render the court and contests
  at low internal resolution with pixelated upscaling, quantize to a 15-bit (SNES) palette with ordered
  dithering, rasterize portraits into pixel sprites, use pixel fonts (Press Start 2P / Pixelify Sans),
  and give menus SNES-style windows and beveled buttons.
- Ideas: real online leaderboards and alliances through `BE.game.social`, a store wrapper through
  `BEPlatform`, more arenas and cosmetics, localized prices, push notifications (opt-in only).
