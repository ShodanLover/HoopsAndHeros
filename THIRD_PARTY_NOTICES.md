# Third-party notices

## Claude Code Game Studios
The Claude agents in `.claude/agents/` (art-director, technical-artist, game-designer, economy-designer,
ui-ux-designer, sound-designer, qa-tester, live-ops-designer, performance-analyst, accessibility-specialist),
the skills in `.claude/skills/` (including `/asset-audit` and `/perf-profile`), and the design-doc practice in
`design/` are adapted from **Claude Code Game Studios** (https://github.com/Donchitos/Claude-Code-Game-Studios).
No game code comes from it.

MIT License. Copyright (c) 2026 Donchitos

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and
associated documentation files (the "Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the
following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial
portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT
LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO
EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER
IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
USE OR OTHER DEALINGS IN THE SOFTWARE.

## Tools used to make assets (add entries as assets are created)
- **agent-sprite-forge** (https://github.com/0x0funky/agent-sprite-forge), MIT, Copyright (c) 2026 0x0funky.
  A tool, not bundled. Credit any assets it produces here, and include any notices it ships (for example
  pixelfx `CREDITS.txt`).
  - **Court player sprites** (`art/sprites/player/`, packed into `js/sprite-data.js`): original art authored for this
    game in `tools/sprites/player_spec.py` and rendered with codeart2d `render_pixelspec.py` v0.5.0.
    Code-drawn, no image model (`codeart-meta.json` records `"art_source": "code"`). No third-party images used.
