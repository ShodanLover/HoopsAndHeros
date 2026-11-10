---
name: playtest
description: "Build Basketball Empire, run the automated playthrough on a phone viewport, look at the screenshots, and report what passed, what broke, and what was not checked. Use before committing gameplay or visual changes, or when asked to 'test the game'."
---

# Playtest

1. `npm run check`: stop and fix any syntax error first.
2. `npm run build`: regenerates `dist/basketball-empire.html` and `dist/artifact.html`.
3. `npm test`: runs `tests/e2e.js`. Record the console summary lines (first win time, tutorial state,
   championship, prestige, save/reload) and the final line, which must be `NO ERRORS`.
4. Open the screenshots in `tests/shots/` that cover what changed (at least the play screen
   `p1-play.png` / `p3-playfull.png`, the team screen `m1-lineup.png`, recruit `r1-recruit.png`, and any
   screen touched by the change). Check readability at phone size, clipping, overlap, things hidden
   behind the nav, and consistency with `design/art-bible.md`.
5. Report as a table: check | result (PASS / FAIL / NOT RUN) | evidence. Say what was **not** run
   (for example, a real device or real audio) and that a person has not yet played it.
6. When something fails, fix it if the fix is clear, then rerun from step 1. Run at most two fix rounds
   before reporting back.

If Playwright is missing: `npm install` then `npx playwright install chromium`.
