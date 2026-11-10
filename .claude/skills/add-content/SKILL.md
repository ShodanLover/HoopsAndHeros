---
name: add-content
description: "Add content to Basketball Empire the data-driven way: worlds, teams, athlete archetypes, gear types, facilities, coaches, achievements, missions, prestige perks, cosmetics or store products, by editing js/data.js and wiring only what is genuinely new."
---

# Add content

Content lives in `js/data.js`. Most additions need no system code.

| Adding | Where | Also check |
|---|---|---|
| World / teams / arena look | `worlds[]` (formats, teams, theme, unlocks, set, champ) | Gear set name; recruit pool is 30 athletes per world (`athletes.js` `PER_WORLD`); the opponent curve `balance.oppGrowth[w]` |
| Archetype / signature ability | `archetypes[]` | The ability effect is coded in `sim.js` → `shoot()` / `rebound()` / steal checks by `arch` key |
| Personality | `personalities[]` | Its effect in `sim.js`, `economy.js` (`teamPower`, `tpPerSec`) or `game.js` (fans) |
| Facility / coach | `facilities[]` / `coaches[]` | The effect in `economy.js` → `mods()` and the label in `ui-empire.js` → `effectText()` |
| Gear type | `gearTypes[]` (slot `athlete` or `team`) | The icon key exists in `ui-core.js` icons; drawn on court in `court.js` → `drawPlayer` if visible |
| Achievement | `achievements[]` (a stat key from `state.js` `defaultStats`) | The stat is incremented somewhere |
| Mission | `missionPool.daily/weekly` | Same as above; `feature` gate if needed |
| Prestige perk | `prestigeUpgrades[]` | The effect in `mods()` or wherever it applies |
| Cosmetic | `cosmetics[]` | Its source (shop price, pass tier, perk) |
| Store product | `products[]` / `gemShop[]` | `ui-empire.js` → `grantProduct()`; follow `design/monetization-policy.md` |
| Feature gate | `features{}` (unlock by stage) | Intro card in `ui-meta.js` → `INTROS` |

Then: `npm run build`, `npm test`, and `/balance-check` if numbers changed. Names must be fictional
(no real leagues, teams or players).
