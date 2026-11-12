# Idle Champions of the Forgotten Realms: combat and formation (public-source notes)

Researched 2026-11-11 for the owner's request to model Basketball Empire's combat on Idle Champions instead of
Legend of Slime. Sources are community wikis, Steam discussions and guides (listed at the end). Nothing was taken
from the game's client, art or data. We copy the shape of the loop, never its content.

Confidence: **[src]** = stated in a source below. **[recall]** = widely known about the game but not confirmed in
the sources read this session; verify before relying on exact numbers.

## The screen

- The party stands in a **formation on the left**; enemies always come from the **right** and walk toward it. [src: Steam "Question About Placement"]
- The formation is a **grid of numbered seats arranged in columns**. A column is a top-to-bottom line of seats; the
  rightmost column is the **front**. Each campaign has its own formation shape. [src: Reddit "Formations 101", earlyguides]
- Many enemies are on screen at once, in groups. [src: wiki adventure pages; recall]

## Who gets hit

- Most enemies are melee: they walk up and attack the **front column**, so the front holds the tanks. [src: Steam]
- Ranged and magic enemies can hit **anywhere** in the formation, so the back is not completely safe. [src: Steam]
- A standard setup is a tank in front, one main damage dealer somewhere in the formation, and supports elsewhere; healers keep the tank alive. [src: TV Tropes]
- Long fights escalate: enemies gain damage multipliers until the tank falls. [src: Steam]
- If the formation is overwhelmed, the party is pushed back and progress stalls until it is stronger. [recall]

## Positional buffs (the puzzle layer)

- Most champion buffs are **positional**: adjacent seats, seats within two, the same column, the column in front, or
  "the column with the most champions". Moving a champion changes how much the whole party deals. [src: earlyguides, Emmotes spoilers, Reddit]
- So the formation is a real decision: who stands next to whom matters as much as raw levels.

## Progression structure

- An adventure is a run of numbered **areas**. Each area has a **quest**: kill N enemies, kill a boss, or collect
  items that drop from kills. Finishing the quest unlocks the next area. [src: wiki "Adventure"]
- A **boss every fifth area**. [src: wiki "Adventure"]
- Adventures have **variants** with restrictions, for example click damage set to 0 after area 5. [src: wiki "Split the Party"]
- Resetting an adventure converts gold into **favor**, a permanent multiplier (the prestige loop). [src: guides]

## Player input on top of idle

- **Click damage**: the player taps enemies. **Familiars** automate this: they click the enemy nearest the formation, collect gold and quest items, open boss chests, and can fire a random **ultimate** every 30 seconds. [src: Steam "Familiars"]
- Each champion has an **ultimate attack** on its own cooldown, fired from a button bar. [recall; partly supported by the familiar note above]
- Gold drops from enemies and must be collected (by click or familiar). [src: Steam "Familiars"]

## Champion progression

- Champions are levelled with gold. Level milestones unlock upgrades and a **specialization** choice (for example,
  more crit for one group). [src: Laurana guide]
- Gear slots per champion scale their abilities, and only fielded champions benefit. [src: guides]
- Each champion occupies a **seat**: only one champion per seat in the formation at a time. [src: guides; recall]

## Sources

- [Formation strategy (Fandom wiki)](https://idlechampions.fandom.com/wiki/Formation_strategy)
- [Formations 101 (Reddit, 2019)](https://axebps-redlib.hf.space/r/idlechampions/comments/dqe878/formations_101_an_introduction)
- [Adventure (Fandom wiki)](https://idlechampions.fandom.com/wiki/Adventure)
- [Split The Party (Fandom wiki)](https://idlechampions.fandom.com/wiki/Split_The_Party)
- [Question About Placement (Steam)](https://steamcommunity.com/app/627690/discussions/0/3437955554625995001/)
- [Front-line support that redirects attackers (Steam)](https://steamcommunity.com/app/627690/discussions/0/2975149180222653968/)
- [Familiars (Steam)](https://steamcommunity.com/app/627690/discussions/0/2975149180208560565/)
- [Idle Champions (TV Tropes)](https://tvtropes.org/pmwiki/pmwiki.php/VideoGame/IdleChampionsOfTheForgottenRealms)
- [earlyguides: Idle Champions](https://earlyguides.com/idle-champions-of-the-forgotten-realms)
- [Emmotes ability spoilers](https://emmotes.github.io/ic_spoilers/mehen.html)
- [Laurana beginner guide](https://roonby.com/2026/05/08/laurana-idle-champions-beginner-guide-skills-and-how-to-use-her/amp/)

---

# How this maps onto Basketball Empire (proposal, not built)

What we already match: squad on the left, opponents on the right, side-view court, auto-attacks, a boss, stepping
back when you lose. What changes:

| Idle Champions | Basketball Empire version |
|---|---|
| Formation grid, columns, front = tanks | **Lineup formation on the half court.** Front column = bigs (Paint), middle = wings, back = guards. Shape changes by world (1-2-2 streetball, 2-3 zone, box-and-1…). The player places athletes in seats. |
| Positional buffs | **Court chemistry.** Each archetype buffs by position: a point guard boosts adjacent teammates, a shooter boosts their column, a rim protector shields the front column, a sixth-man type boosts the column behind. Shown as glowing links between seats. |
| Many enemies walk in from the right | **Defenders pour in from the right in groups.** "Pressers" (melee) walk up and attack the front column; "snipers" (ranged) hit anyone. Each defender has its own small Guard bar, so the squad's shots spread across a crowd. |
| Area quest: kill N / collect items | **Stage quest:** "Break 20 defenders" or "Grab 8 loose balls". Clearing it opens the next stage. Boss every 5th stage (the 10th stays the championship). |
| Front column takes the hits; overwhelmed = pushed back | **Per-player Stamina.** Front-liners take most hits; a gassed player sits for a few seconds. If the whole front column is gassed, the squad falls back a stage. |
| Click damage + gold to collect | **Tap the court** to swat a defender (tap damage scales with Team Growth) and to scoop dropped cash. |
| Familiars auto-click | **Mascots and cheerleaders** (a new collectible): placed on the bench, they tap defenders, collect cash and occasionally trigger an ultimate. |
| Per-champion ultimates on cooldown | **Each athlete's signature move** (posterizer dunk, logo three, chase-down block) as a button on its own cooldown, replacing the shared energy bar. |
| Specializations at level milestones | Athlete level milestones (25/50/100…) offer a choice of two traits, e.g. "Paint Beast" vs "Stretch Big". |

Suggested build order, each step playable on its own (step 1 shipped 2026-11-11): (1) formation seats + multiple defenders + per-player stamina
with front-column targeting; (2) court chemistry buffs and the formation editor; (3) stage quests + boss every 5th;
(4) tap damage and loose-ball cash; (5) per-athlete ultimates; (6) mascots; (7) specializations. Balance via
`tests/progression.js` after steps 1, 3 and 5.
