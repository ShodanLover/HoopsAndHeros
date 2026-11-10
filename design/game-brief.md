# Game Brief: Basketball Empire

*One page. Every feature is checked against it. Change it only with the owner's approval.*

## The pitch
Start with one terrible player on a cracked neighborhood court. Build a basketball dynasty through
streetball, high school, college, the pros, international play and the legends' halls, all the way to the
Basketball Multiverse. An idle RPG where matches play themselves and every upgrade visibly changes the game.

## Pillars
1. **Visible growth.** Every upgrade, recruit and prestige shows on the court and in the numbers right away.
2. **Always a next goal.** Short (the next game), medium (the world championship) and long (the
   collection, prestige and the Multiverse) goals are always on screen.
3. **Collect your dynasty.** 300 original athletes with distinct looks, personalities and playstyles that
   are worth chasing.
4. **Respectful idle.** Generous offline progress, short satisfying sessions, and no pressure tactics.

## Look and feel
16-bit, SNES-era pixel art (see `design/art-bible.md`): arcade energy, crunchy hits, a crowd that roars,
and big celebrations for big moments.

## Player and platform
Casual to mid-core mobile players in portrait, in sessions from 30 seconds to 10 minutes, coming back
daily. The game runs in the browser now and can be wrapped for app stores later through `js/services.js`.

## The first five minutes (must stay this way)
Tip off within 10 seconds. Win the first game. Get the first upgrade. Make the first recruit (guaranteed
Rare or better). See the world map. Learn about offline earnings. Head for the first championship. Systems
unlock one at a time after that.

## Pacing targets (checked by `/balance-check`; optimal bot, active play)
| Milestone | Target |
|---|---|
| World 2 | 10–20 min |
| World 4 (prestige unlocks) | 40–90 min |
| First-run wall | World 6–8, after about 2–4 h |
| Second run | Reaches the first run's best world in under 60% of the time |
| After World 10 | Endless Multiverse Rifts |

## Out of scope for now
Real-time multiplayer, real leagues, teams or players, and paid loot boxes with hidden odds.
