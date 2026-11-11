# Legend of Slime: game loop and UI (public-source reference)

*Compiled 2026-11-10 from public guides, the developer's FAQ and store pages (sources at the bottom).
Paraphrased; no text, art, names or data taken from the game's files. Snapshots span 2023–2026, so
details may have changed. Items marked **unknown** could not be confirmed.*

## The loop in one paragraph

Your slime stands on the left and auto-fights endless waves of humans marching in from the right.
Kills drop gold. Gold buys flat stat levels in a panel directly under the fight. Gems (from quests,
dungeons, mines, dailies, roulette, the shop's free 200/day) buy summons of gear, skills and
companions, whose banners *level up the more you pull*. Stages auto-advance; a boss you can't beat
drops you back to farming the last cleared stage, which sets your offline income rate. Keyed dungeons,
a mining minigame, timed buffs and a quest chain give you something to do every few minutes and
reasons to return each day.

## Minute-to-minute

1. Watch the fight; floating damage numbers; skills auto-cast (Auto button on the skill panel).
2. Tap UPGRADE on a stat row every few seconds (ATK first). Costs rise per level; next level is
   almost always affordable from the gold flowing in.
3. Claim things with red dots: daily quests, the current one-time quest (upper right), flying ad
   chests in the combat area, the AFK chest (upper left), roulette.
4. Pull on the summon banners when gems allow (guide advice: pull as much as possible, because
   banner level rises with pull count and improves the drop table).
5. Run dungeons when keys are up; dig in the mine; start research; re-arm 20-minute buffs.
6. Hit a boss wall → farm → spend → retry.

## Main screen layout (as described by guides)

```
upper-left: blessing scroll (20-min ad buffs), AFK treasure chest, 2x speed
upper-right: collection book (blue book), current one-time quest (the "what next")
top: currencies (gold, gems, later diamonds)
centre: battle view, enemies stream in from the right; flying ad chests cross it
below battle: equipped skill tree / skill panel with Auto button
lower: STATS panel (gold upgrades) and tab bar to gear, skills, companions, dungeons, mine, shop
left edge: roulette; battle-pass banner above it
```
Exact tab order: **unknown** (not consistently described). What is consistent: the battle stays on
screen while you upgrade.

## Stage structure

- Stages are numbered World-Stage (3-10 unlocks the mine, 7-5 unlocks relics). Progress is
  automatic; boss fights have a timer and failing drops you to farming the last cleared stage.
- Offline (AFK) income rate is set by the last cleared stage, stored up to 12 h, doubled by an ad.
- "Promotion" exists for slimes (level 100 → 200 with Tears of Slime) and for relics. Exact stage
  count and per-stage HP curve: **unknown**.

## Goals system (what keeps "one more thing" in front of you)

| Goal type | Mechanics | Reward |
|---|---|---|
| One-time quest chain | Always one active, shown upper right; small concrete steps | Gems |
| Daily quests | Several per day + bonus quests that need an ad | Gems |
| Stage milestones ("Slime Guide") | Rewards at stage thresholds; some tiers need the premium pass | Items, gems |
| 7-day newbie event ("Slime Diary") | One claim per day for 7 days; completion gives a guaranteed legendary box | Gems, summon boxes |
| Growth journal event | Shards, ore, digging tools for doing normal things | Materials |
| Collection book | Set completion bonuses across gear, skills, companions | Permanent passives |
| Battle pass | Free and paid tracks (Premium Pass: 30 tiers) | Gems, boxes, exclusive slime |
| Dungeon difficulty ladder | Next tier unlocks after clearing the previous | More per run |

## Daily rhythm (free faucets and caps)

- Dungeon keys: 2 per dungeon per day (reset 00:00 UTC); +2 ad entries per dungeon per day; a failed
  ad entry converts to a key. Slime Legion: 1 per day. Sweep tickets for cleared dungeons (club perk).
- Summon: 3 free ad pulls per banner per day; ad pull size grows with use (14 items per ad seen).
- Blessings: Plutus (gold), Hercules (ATK), Hermes (cooldown), 20 min each per ad; level with use.
- Roulette: 5 spins/day (first free, rest ad): gems or keys.
- Mine tools: bomb and drill get 2 ad grants per day each; pickaxe regenerates.
- Shop: 200 free gems per day, no ad.
- Research: timed; an ad skips about 30 minutes.
- AFK: 12 h cap, ×2 with ad.

## Sources
- Level Winner beginner's guide (2024 update): https://www.levelwinner.com/legend-of-slime-idle-rpg-beginners-guide-tips-tricks-strategies-to-get-stronger/
- Touch Tap Play strategy guide (2023): https://www.touchtapplay.com/legend-of-slime-strategy-guide-tips-cheats-and-more/
- Touch Tap Play slime levelling guide (2023): https://www.touchtapplay.com/how-to-level-up-slimes-legend-of-slime-idle-rpg-war-beginners-guide/
- LoadComplete FAQ, dungeon keys: https://loadcomplete.oqupie.com/portals/1744/articles/39976
- LoadComplete FAQ, dungeons too hard: https://loadcomplete.oqupie.com/portals/1744/articles/39975
- Community wiki, Dungeons / Mines / Versions: https://los.fandom.com/wiki/Dungeons , https://legend-of-slime-idle-rpg-war.fandom.com/wiki/Mines , https://los.fandom.com/wiki/Versions
- App Store listing: https://apps.apple.com/US/app/id1618701110
