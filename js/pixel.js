/* Basketball Empire — 16-bit look: palette quantization with ordered dithering, and pixel-art portraits.
 * Canvases are drawn at a low internal resolution, upscaled with `image-rendering: pixelated`, and every
 * frame is snapped to a 4-bit-per-channel palette with a Bayer 4x4 dither, like SNES-era gradients.
 * Portraits are rasterized from the vector generator into 40x40 sprites with hard alpha, a reduced
 * palette and a 1px dark outline. */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const BAYER = [0, 8, 2, 10, 12, 4, 14, 6, 3, 11, 1, 9, 15, 7, 13, 5].map((v) => (v + 0.5) / 16 - 0.5);
  const LEVELS = 16;
  const STEP = 255 / (LEVELS - 1);
  // precomputed lookup: [ditherIndex][value] -> quantized
  const LUT = BAYER.map((t) => {
    const a = new Uint8ClampedArray(256);
    for (let v = 0; v < 256; v++) a[v] = Math.round(v / STEP + t) * STEP;
    return a;
  });
  const LUT_FLAT = (() => { const a = new Uint8ClampedArray(256); for (let v = 0; v < 256; v++) a[v] = Math.round(v / STEP) * STEP; return a; })();

  function quantize(ctx, w, h, dither) {
    let img;
    try { img = ctx.getImageData(0, 0, w, h); } catch (e) { return; }
    const d = img.data;
    for (let y = 0; y < h; y++) {
      const row = (y & 3) * 4;
      let i = y * w * 4;
      for (let x = 0; x < w; x++, i += 4) {
        const L = dither === false ? LUT_FLAT : LUT[row + (x & 3)];
        d[i] = L[d[i]]; d[i + 1] = L[d[i + 1]]; d[i + 2] = L[d[i + 2]];
      }
    }
    ctx.putImageData(img, 0, 0);
  }

  // Integer upscale factor so a canvas of css width w is ~targetWidth internal pixels wide
  function pixFor(w, target) { return Math.max(2, Math.round(w / (target || 170))); }

  // ---------- Pixel portraits ----------
  const SIZE = 40;
  const cache = new Map();
  const pending = new Map();
  const queue = [];
  let running = 0;
  const BLANK = 'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

  function keyOf(svg) { return 'p' + BE.util.hashStr(svg).toString(36) + svg.length.toString(36); }

  function pixelate(img) {
    const cv = document.createElement('canvas');
    cv.width = SIZE; cv.height = SIZE;
    const g = cv.getContext('2d');
    g.imageSmoothingEnabled = true;
    g.drawImage(img, 0, 0, SIZE, SIZE);
    const id = g.getImageData(0, 0, SIZE, SIZE);
    const d = id.data;
    const solid = new Uint8Array(SIZE * SIZE);
    for (let p = 0, i = 0; p < SIZE * SIZE; p++, i += 4) {
      if (d[i + 3] < 110) { d[i + 3] = 0; continue; }
      solid[p] = 1;
      const a = d[i + 3] / 255;
      // un-premultiply edge pixels toward their own color, then snap to the palette
      d[i] = LUT_FLAT[Math.min(255, d[i] / a)]; d[i + 1] = LUT_FLAT[Math.min(255, d[i + 1] / a)]; d[i + 2] = LUT_FLAT[Math.min(255, d[i + 2] / a)];
      d[i + 3] = 255;
    }
    // 1px outline around the silhouette
    for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
      const p = y * SIZE + x;
      if (solid[p]) continue;
      if ((x > 0 && solid[p - 1]) || (x < SIZE - 1 && solid[p + 1]) || (y > 0 && solid[p - SIZE]) || (y < SIZE - 1 && solid[p + SIZE])) {
        const i = p * 4; d[i] = 12; d[i + 1] = 10; d[i + 2] = 24; d[i + 3] = 255;
      }
    }
    g.putImageData(id, 0, 0);
    return cv.toDataURL('image/png');
  }

  function pump() {
    while (running < 4 && queue.length) {
      const job = queue.shift();
      running++;
      const img = new Image();
      img.onload = () => {
        let url = BLANK;
        try { url = pixelate(img); } catch (e) { url = job.src; }
        finish(job.key, url);
      };
      img.onerror = () => finish(job.key, job.src);
      img.src = job.src;
    }
  }
  function finish(key, url) {
    running--;
    cache.set(key, url);
    pending.delete(key);
    if (typeof document !== 'undefined') document.querySelectorAll('img[data-pk="' + key + '"]').forEach((el) => { el.src = url; });
    pump();
  }

  // Returns an <img> tag that resolves to the pixel sprite (generated asynchronously, then cached)
  function portrait(svg) {
    if (typeof document === 'undefined') return svg;
    const key = keyOf(svg);
    const hit = cache.get(key);
    if (hit) return '<img class="pix portrait" alt="" src="' + hit + '" data-pk="' + key + '">';
    if (!pending.has(key)) {
      pending.set(key, true);
      queue.push({ key, src: 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg) });
      setTimeout(pump, 0);
    }
    return '<img class="pix portrait" alt="" src="' + BLANK + '" data-pk="' + key + '">';
  }

  // Wrap the vector portrait generator so every portrait in the UI becomes a pixel sprite
  if (BE.athletes && !BE.athletes.portraitSVGRaw) {
    const raw = BE.athletes.portraitSVG;
    BE.athletes.portraitSVGRaw = raw;
    BE.athletes.portraitSVG = (t, opts) => portrait(raw(t, opts));
  }

  BE.pixel = { quantize, pixFor, portrait, cache };
})(typeof window !== 'undefined' ? window : globalThis);
