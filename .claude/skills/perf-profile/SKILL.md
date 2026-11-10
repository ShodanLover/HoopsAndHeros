---
name: perf-profile
description: "Measure Basketball Empire's frame time on a throttled phone viewport (court canvas, quantize step, contests, UI re-renders), compare with the 60 fps budget, and recommend fixes. Use after rendering changes or when the game feels slow."
---

# Perf profile

Adapted from Claude Code Game Studios' `/perf-profile` (MIT). Delegate deep work to the
`performance-analyst` agent.

1. `npm run build`.
2. Write or reuse `tests/perf.js`: open `dist/basketball-empire.html` in Playwright Chromium at 390×844,
   apply CPU throttling with CDP `Emulation.setCPUThrottlingRate` (rate 4), get past the tutorial (reuse
   the steps in `tests/e2e.js`), let a match play for 20 seconds, and collect per-frame times. Wrap
   `BE.court.draw` and `BE.pixel.quantize` to time them separately.
3. Report the median and 95th-percentile frame time, the share spent in `quantize`, dropped frames, and JS
   heap size, with the throttling rate used. Compare with the 16.7 ms budget.
4. If over budget, name the hot function and propose the smallest fix (for example, skip quantize when
   nothing moved, or cache static layers). Re-measure after any fix.
5. Say what was not covered: a real phone, Safari/WebKit, battery and thermal throttling.
