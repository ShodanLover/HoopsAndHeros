---
name: asset-audit
description: "Audit Basketball Empire's art and audio assets: every outside tool or source has a license that allows it and an entry in THIRD_PARTY_NOTICES.md, assets follow the art bible's sizes and palette, and nothing unused or oversized ships in dist/. Use before committing new assets."
---

# Asset audit

Adapted from Claude Code Game Studios' `/asset-audit` (MIT). Report only what you measured. If an input is
missing, write NOT ASSESSED for that part; never fill a table from guesses.

1. **Inventory.** List everything under `assets/` (if it exists), any data URIs in `js/` (for example a
   generated `js/assets.js`), and fonts or other remote resources linked in `index.html` and `tools/build.js`.
2. **Provenance and license.** For each asset, record where it came from: drawn in game code,
   agent-sprite-forge `codeart2d` (code-drawn; keep its `codeart-meta.json`), the hibit finish, an image
   model (which route), or an outside source. Check that:
   - The source's license allows commercial use in a game.
   - `THIRD_PARTY_NOTICES.md` has an entry, including notices the tool ships (sprite-forge's own
     `THIRD_PARTY_NOTICES.md`, pixelfx `CREDITS.txt`).
   - Nothing comes from the pixel-art-atlas dataset unless its license has been confirmed.
   - Nothing depicts a real player, league, team logo or another game's characters.
3. **Art bible conformance** (`design/art-bible.md`): court sprites about 24×32 per frame, portraits 40×40,
   gear icons 16×16, effects 8–32 px with 4–8 frames, 1 px `#0c0a18` outline, limited palette. Measure
   dimensions with Pillow (`python -c "from PIL import Image; print(Image.open(p).size)"`).
4. **Size.** Report the size of `dist/basketball-empire.html` and the largest embedded assets. Flag any
   single asset over 50 KB and any asset nothing references (Grep for its name).
5. **Report** as a table: asset | source | license | notice entry | art-bible check | size | status
   (OK / FIX / NOT ASSESSED), then a short list of fixes. Don't delete assets without asking the owner.
