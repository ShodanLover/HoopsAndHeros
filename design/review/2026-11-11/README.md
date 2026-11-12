# Review images, 2026-11-11

Basketball Empire is a mobile idle RPG about basketball. The fights run on their own, and the player spends
their time recruiting, levelling up and arranging the team. These screenshots show the build in commit `62d42e3`,
captured on a 390 px-wide phone screen.

## How a fight works

This is modelled on Idle Champions of the Forgotten Realms; the notes are in `design/reference/icfr-combat-and-formation.md`.

- Your squad of up to five holds a **formation** on the left. Guards sit in the back column, a wing in the middle,
  and bigs in the front. The dashed rings on the floor mark the seats, with the front column tinted orange.
- **Defenders** come in from the right in groups, ten per stage, then a **boss**. Pressers walk up and hit the
  front column. Snipers, marked ◎, stay deep and can hit anyone.
- Every player attacks on their own. Guards and wings shoot threes and pull-ups from their seats, and front-liners
  drive for layups and dunks. Each basket is a hit on a defender's health bar.
- Each player has a **stamina** bar under their feet. A player who runs out is "GASSED" and sits out for 5
  seconds. If the whole front column is gassed at once, the stage is lost.
- The scoreboard counts defenders broken out of 10, and the crown stands for the boss.

## The images

| File | What it shows |
|---|---|
| `01-phone-screen-formation.png` | The whole phone screen mid-fight: court, ability buttons, quest bar and upgrades |
| `02-formation-fight-frames.png` | 12 frames, a third of a second apart, from a normal fight |
| `03-dunks-frames.png` | Dunks only, forced for the capture: front-liners sprint in and dunk over the defender, who gets knocked back or falls |
| `04-layups-frames.png` | Layups only, forced: crossover in front of the defender ("ANKLES!" on a crit) |
| `05-boss-windup-and-slam-frames.png` | Boss phase, staged for the capture: crown and aura, the red wind-up ring with "BIG PLAY INCOMING", then the slam hitting the whole formation |
| `06`, `07` | A pixel-art filter over the same characters. **The owner rejected this**; it is here for context only |

## Feedback wanted

1. Can you tell what is happening in a fight at a glance?
2. Does the formation (left) against defenders (right) read clearly, or is it too busy?
3. Are the characters appealing, and are the faces readable at this size?
4. Does it look like something you would keep open as an idle game?
