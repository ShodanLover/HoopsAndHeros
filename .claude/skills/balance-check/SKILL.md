---
name: balance-check
description: "Measure Basketball Empire's pacing and fairness with the calibration and progression-bot tools, compare against the pacing targets in design/game-brief.md, and recommend data.js changes. Use after touching balance numbers or when asked whether the game is too fast or slow."
---

# Balance check

Only report numbers you measured. When a tool can't run, that row is **NOT ASSESSED**, not a guess.

1. `npm run calibrate`: win % at power ratios 0.7–2.0 for 1v1, 3v3 and 5v5. Healthy: about 40–55% at
   1.0, 65–80% at 1.35, and above 90% at 2.0 (attribute differences shift this a little).
2. `npm run balance`: three bot runs of 3 hours each with prestige. The bot is randomized, so run it 2–3
   times and give ranges.
3. Compare with the targets in `design/game-brief.md` → "Pacing targets": time to World 2, to World 4
   (prestige unlock), where the first-run wall falls, and the speedup on the second run.
4. Look for warning signs: a world cleared in under 5 minutes after World 3 (compounding multipliers), a
   wall before World 4 (the first prestige would be impossible), or prestige gains that don't speed up the
   next run.
5. Recommend specific changes as `file: key old → new`, with the expected effect. Apply them only if the
   owner asked for fixes, then rerun steps 1–3 and show before and after.
6. Recruiting odds and pity (`BE.econ.banners`) are a public promise. Don't change them without updating
   the odds modal text and the README, and never make pity worse.
