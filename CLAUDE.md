# Basketball Empire: instructions for Claude

A mobile-first idle basketball RPG in plain HTML/CSS/JavaScript (no framework, no bundler dependency, no
asset downloads). `README.md` is the full reference for architecture, systems and status. Read it once at
the start of a session. This file holds the working rules.

## The owner's current goals

1. **Finish the 16-bit visual overhaul.** The step-by-step plan is in README → "Status and next steps", and
   the target look is in `design/art-bible.md`.
2. **Use the owner's chosen resources.** These are agent-sprite-forge for sprites, effects and maps, and
   the pixel-art-atlas dataset as a *style reference only* until its license is checked. Details are in the
   README.
3. Keep the game honest and fun. `design/game-brief.md` and `design/monetization-policy.md` are the
   rules every change is checked against.

## Commands

```bash
npm install
```

```bash
npx playwright install chromium
```

Run the first two once per machine. Then use these:

| Command | When |
|---|---|
| `npm run build` | After **any** change under `js/`, `css/` or `index.html`. It regenerates `dist/`, which is committed so the owner can open one file |
| `npm run check` | Syntax-check every module (fast) |
| `npm test` | Full Playwright playthrough on a phone viewport (`tests/e2e.js`). It must end with `NO ERRORS` |
| `npm run smoke` | First minute only, with screenshots |
| `npm run balance` | Progression bot (`tests/progression.js 6 3`). Compare against the targets in `design/game-brief.md` |
| `npm run calibrate` | Win probability against power ratio for each format |

Screenshots go to `tests/shots/` (gitignored). **Look at them** after visual changes: a passing test
doesn't prove the screen looks right.

## How the code is organised (rules that keep it maintainable)

- Every file is an IIFE that attaches to `window.BE`. Load order is set in `index.html`, and `tools/build.js`
  reads the same order. A new file needs a `<script>` tag in the right place.
- **Content and balance live in `js/data.js`**, and systems live everywhere else. Adding a world, athlete
  archetype, facility, coach, achievement, product or mission should normally touch only `data.js`.
- `js/economy.js` holds formulas and state changes, `js/sim.js` the match simulation (headless), and
  `js/game.js` the orchestration. None of them may touch the DOM, so they can run under Node in
  `tests/load.js`.
- UI clicks go through `data-act` attributes and one dispatcher (`main.js`). Modals handle their own
  `data-*` clicks.
- Saves are validated in `js/state.js`. When you add a saved field, add it to `defaultState()`. Bump
  `SAVE_VERSION` and handle it in `migrate()` only when an old save would otherwise break.
- Never use `String.prototype.replace` with a replacement *string* that might contain `$`. Use a function
  instead. (That bug once corrupted the bundle.)

## Non-negotiables

- **Monetization is honest** (`design/monetization-policy.md`): real prices shown exactly, full odds
  disclosed, no fake timers or pressure, everything earnable for free, interstitials rare and only at
  natural breaks. Purchases and ads go only through `js/services.js` and stay clearly labeled
  **development mode** until a real `window.BEPlatform` exists. Never simulate a real charge.
- **Original content only.** Fictional teams, players and nicknames; no real leagues, logos or player
  likenesses; no copying another game's art. Assets made with outside tools or datasets need a license
  that allows it and an entry in `THIRD_PARTY_NOTICES.md`.
- Mobile first: portrait at 360–430px wide, touch targets of at least 40px, no horizontal scroll, and
  `prefers-reduced-motion` respected.
- Before committing: `npm run build`, `npm test` with no errors, and a look at the screenshots. Commit
  `dist/` together with the source.

## The specialist team (`.claude/agents/`)

These are adapted from Claude Code Game Studios (MIT; see `THIRD_PARTY_NOTICES.md`). Delegate to them
when their area is the main question. They advise, and the owner makes creative calls.

| Agent | Use for |
|---|---|
| `art-director` | 16-bit look, palette, art bible, reviewing screenshots for consistency |
| `technical-artist` | Pixel rendering pipeline (`js/pixel.js`, `court.js`, `contests.js`), sprite-forge integration, performance of canvas effects |
| `game-designer` | Systems, progression, worlds, features, onboarding flow |
| `economy-designer` | Balance numbers in `data.js`, the progression bot, monetization fairness |
| `ui-ux-designer` | Mobile UI, menus, accessibility, readability of pixel fonts |
| `sound-designer` | Procedural audio in `js/audio.js` |
| `qa-tester` | Running tests, reading screenshots, writing precise bug reports |
| `live-ops-designer` | Events, season pass, tournaments, missions, login ladder (within the monetization policy) |
| `performance-analyst` | Frame time on phones, the per-frame quantize step, measured optimizations |
| `accessibility-specialist` | Contrast, color-blind safety, touch targets, reduced motion, screen-reader labels |

## Project skills (`.claude/skills/`)

- `/playtest`: build, run the e2e test, review screenshots, report what passed and what broke.
- `/balance-check`: run the balance tools and compare with the brief's pacing targets.
- `/add-content`: add worlds, athletes, gear, facilities, coaches, achievements or products the data-driven way.
- `/make-sprite`: make pixel art for the game (agent-sprite-forge, or the in-code fallback), following the art bible.
- `/asset-audit`: check every asset's license, notice entry, art-bible size and bundle cost.
- `/perf-profile`: measure frame time on a throttled phone viewport against the 60 fps budget.

agent-sprite-forge is installed as a user-scope plugin, and `.claude/settings.json` enables it for this
project. No image-generation route is configured, so use its free local tools (`codeart2d`, the hibit
finish), and ask the owner before adding a paid API key.
