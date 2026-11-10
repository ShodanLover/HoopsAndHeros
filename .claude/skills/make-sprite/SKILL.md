---
name: make-sprite
description: "Create 16-bit pixel art for Basketball Empire (court player sprite sheets, portraits, gear icons, effects, arena backdrops) with agent-sprite-forge or the in-code fallback, following design/art-bible.md, then wire it into the game."
---

# Make sprite

1. **Read `design/art-bible.md`** for the size, frame count, palette, outline and naming rules of the asset
   type. Confirm the spec with the owner when it's a new asset type.
2. **Pick the route.**
   - **agent-sprite-forge** (installed on the owner's desktop at user scope, v0.5.0; its skills are
     `codeart2d`, `generate2dsprite`, `generate2dmap`, `generate2dmedia`, `video2dsprite`). Check the route
     once per session with `python "<forge>/skills/generate2dmedia/scripts/route_media.py" resolve --kind image`
     (set `PYTHONUTF8=1` on Windows). As of 2026-11-10 it reports **no-route** (no image API key and no
     Codex or Grok CLI), so `codeart2d` and hibit are the routes to use, and the result must be disclosed
     as code-drawn:
     - **`codeart2d`** (no image model, free): write a PixelSpec for court players (idle, run 2–4 frames,
       dribble, shoot, jump, dunk, block, celebrate), gear icons and UI. Best fit for this game's small
       sprites.
     - **hibit finish** (free and local): render vector art to PNG (for example the portraits from
       `BE.athletes.portraitSVGRaw`) and turn it into real pixel art with a learned palette and auto outline.
     - **image or video generation** (`generate2dsprite`, `video2dsprite`): needs an image route (an API key
       or a signed-in Codex or Grok CLI). **Ask the owner before using a paid API.**
     - Effects: the forge recommends pixelfx (MIT); ship its CREDITS.
     - Walk/run cycles: give the near and far legs clearly different shades, or `render_pixelspec.py`
       warns `half_cycle_duplicates`. Use `--strict-qc` and look at `preview-*.png` before wiring anything in.
   - **Forge not available:** draw in code. Extend `js/court.js` `drawPlayer` or add a small pixel-map sprite
     (an array of palette indices) and render it into a cached canvas.
3. **Save** to `assets/<category>/<name>/` as PNG plus a JSON frame map (`frames`, `fps`, `anchor`).
   Keep sheets small: court players about 24×32 px per frame at internal resolution.
4. **Wire in** behind a fallback, so the procedural art still draws while an image loads or if it fails.
   Remember that `tools/build.js` inlines only JS and CSS: either embed small sheets as data URIs in a
   generated `js/assets.js`, or extend the build to inline `assets/`.
5. **Credit**: add an entry in `THIRD_PARTY_NOTICES.md` for any tool or source whose license asks for it.
   Never use art copied from existing games, leagues or real players. Pixel-art-atlas images are a style
   reference only until its license is confirmed.
6. Run `/playtest` and look at the screenshots.
