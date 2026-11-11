# The idle-RPG loop for Basketball Empire

*Owner's brief (2026-11-10): "Our game needs the same gameplay loop Legend of Slime has. You have your
5-character squad, you keep unlocking new characters, you unlock accessories for them, and you're
constantly working towards a goal."*

Research behind this plan, all from public sources, with numbers and unknowns marked:
`reference/los-game-loop-and-ui.md`, `reference/los-progression-and-currency.md`,
`reference/los-character-systems.md`, `reference/los-monetization.md`. We copy the shape of the loop,
never art, text, names or data. Every change is checked against `game-brief.md` and
`monetization-policy.md`.

## 1. The five habits that make the loop work

1. **Something cheap to tap every few seconds.** A stat ladder right under the fight: ×1 / ×10 /
   ×100 / MAX, next level nearly always affordable. Numbers go up constantly.
2. **One obvious next thing.** A single active quest pinned on the main screen with a GO button and
   a gem reward; finishing one reveals the next. Plus dailies, stage milestones and a 7-day newbie
   journal.
3. **A wall you can see, and ways through it.** Boss gates; losing drops you to farming the previous
   stage (never punishing); the ways through are always visible: stats, summons, dungeons.
4. **Collection tracks where every pull adds power.** Banners whose odds improve with pulls, duplicates
   that enhance, an **owned effect** on everything (power from the collection even when benched), a
   collection book with set bonuses, auto-equip.
5. **Timed faucets.** Keyed dungeons (2 keys/day each), a mine that fills while away, 20-minute buffs,
   a daily spin, offline income tied to best stage (×2 optional ad), free summons each day.

Supporting habits: the battle never leaves the screen; exponential numbers; coins flying to the HUD;
red dots on anything claimable; monetisation sells time and convenience, never power.

## 2. The one-screen architecture

```
┌──────────────────────────────────┐
│ HUD: cash · gems · tickets · ⚙   │
│ W3 Game 6   ▮▮▮▮▮▯▯▯▯▯ champ     │  stage header with boss progress
│                                  │
│      COURT (always visible)      │  ~42% of height. 5 starters vs 5 opponents, auto-play,
│   big numbers, plays, buffs bar  │  abilities auto-cast. Never replaced by another screen.
│                                  │
│ ▶ Quest: Upgrade Offense ×10 [GO]│  one line, one button, one reward
├──────────────────────────────────┤
│  TAB CONTENT (scrolls under)     │  ~35%: Growth list · Squad · Recruit · Camps · Shop
├──────────────────────────────────┤
│ Growth │ Squad │ Recruit │ Camps │ Shop │   red dots
└──────────────────────────────────┘
```

## 3. The four pillars, mapped

### Pillar A: your 5-character squad
- Five starter slots are **always shown** from the first minute. Locked slots are silhouettes with
  their unlock written on them ("Unlocks at Game 3"). Decision for the owner: fill all five during
  World 1 (format 1v1 → 3v3 → 5v5 inside W1) rather than across W1–W2 as now. Recommended: yes, the
  squad fantasy starts immediately.
- Starters show on court with name, level and a tap target that opens their card.
- **Team Growth panel** (new, Pillar A's tap loop): franchise-wide stats bought with cash, each a flat
  row with ×1/×10/×100/MAX: Offense, Defense, Stamina, Hustle, Clutch, Playmaking, Rebounding, Gate
  Revenue. Cost growth ~1.08–1.12 per level, folded into `mods`. Target: one level affordable every
  5–15 s of income at steady state. Athlete level-ups and attribute training remain the second layer.
- **Milestone unlocks per athlete** at levels 10/25/50/75/100 (small owned effects), so levelling
  anyone always matters.

### Pillar B: constantly unlocking new characters
- Recruit banners get a **banner level 1–10** that rises with pulls and improves the odds table
  (odds for the current level always one tap away; this fits our full-disclosure rule better than a
  hidden boost).
- **Duplicates always do something**: star-ups as now, and at max stars they convert to shards /
  the next tier (no dead pulls).
- **Owned effects**: every athlete in the collection adds a tiny team bonus even on the bench;
  the **Collection book** shows set bonuses (by world, by archetype).
- **1 free recruit per banner per day** (optional ad), the ad never changes odds.
- Pity as now (Rare+ per 10, Epic+ 30, Legendary+ 80, Mythic 200) plus a **wish list** of up to 3
  Legendaries with extra weight when a Legendary hits.
- A guaranteed early cadence: new athletes at W1 G3, G5, G7, G9 (guaranteed recruits), then one
  Legendary from the 7-day journal.

### Pillar C: accessories for them
- Gear becomes **Accessories** with **equip effect + owned effect**. Slots unlock by stage:
  sneakers (start) → jersey (W1 G5) → headband (W2) → wristband (W3) → compression (W4); team
  ball and training gear stay team-wide.
- **Enhance by duplicates** (merge 3→1 stays) and **Auto-equip best** per squad.
- Accessory set bonuses by world set in the Collection book.
- Later tracks on the same template: **Plays** (abilities as a collectible with slots and levels)
  and **Coaches** (summonable, mergeable, passive bonuses).

### Pillar D: always working towards a goal
- **Franchise Story**: ~150 one-time quests in `data.js`, one active at a time, pinned above the
  tabs with GO (navigates and highlights). Rewards in gems/tickets. Replaces the objective chip.
- **Daily quests** (exist) with a complete-all bonus; **stage milestones** (Hall of Records) at every
  championship; **7-day Rookie Journal** with a guaranteed Legendary on day 7; **season pass**
  (exists).
- **Boss gate UI**: the stage header shows the championship as a visible wall with the power you need;
  farming mode is a calm state, not a failure screen.
- **Training Camps** (reframed contests + tournament): Cash Camp, Scrap Camp, Shard Camp, Boss Rush;
  2 keys/day each, tiers unlock sequentially, difficulty arrows, sweep tickets for VIP.
- **Dev League** as the mine: fills while away, claim button with a fill bar; **Hype Week** 20-minute
  buffs; **Halftime spin** 1 free/day; **Fan gifts** drifting over the court.

## 4. Build order (each step ships alone: build, test NO ERRORS, screenshots, balance bot)

| # | Step | Touches | Done when |
|---|---|---|---|
| 1 | One-screen layout: court pinned, tabs under it, compact court on short phones | `index.html`, `css`, `ui-play.js`, `main.js` | Every tab opens with the court still visible |
| 2 | Squad of 5 visible from minute one; W1 format curve pulled forward | `data.js` worlds, `ui-team.js`, `game.js` | Five slots on screen at Game 1; 5v5 by W1 champ |
| 3 | Team Growth panel | `data.js growth[]`, `economy.js`, new `ui-growth.js` | A level every 5–15 s at steady state in the bot |
| 4 | Franchise Story quest line with GO | `data.js quests[]`, `game.js`, `ui-play.js` | Always one visible quest; GO navigates |
| 5 | Owned effects + Collection book + auto-equip + accessory slots by stage | `economy.js`, `ui-team.js`, `ui-core.js` | Bench and gear add power; one-tap best lineup gear |
| 6 | Banner levels, free daily recruit, wish list, dupe conversion | `data.js`, `ui-recruit.js`, `economy.js` | Odds table shown per level; no dead pulls |
| 7 | Training Camps with keys and tiers; Dev League claim UI; Hype Week; spin; fan gifts | `data.js`, `game.js`, `ui-meta.js` | Daily faucets with caps, all optional-ad per policy |
| 8 | Juice pass: flying coins, rolling numbers, upgrade flashes, boss shake, NEW BEST banner | `ui-core.js`, `court.js`, `audio.js` | Every reward is felt |
| 9 | Art: pixel squad sprites (approved one character first) on a smooth, lit court | `sprites`, `court.js` | Owner-approved character before any batch |

Pacing targets stay those in `game-brief.md`; the economy-designer re-runs `npm run balance` after
steps 3, 5 and 6.

## 5. Art note
The loop above is independent of the art decision. Owner's choice (2026-11-10): **pixel sprites** for
athletes, HD-2D style (crisp pixel characters on a smooth, lit court, clean modern UI, no whole-screen
pixelation). One finished character gets approved before any batch is produced.
