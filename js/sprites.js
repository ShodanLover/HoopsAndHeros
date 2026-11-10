/* Basketball Empire — runtime for code-drawn pixel sprites (agent-sprite-forge codeart2d).
 * Court players are composited from parts in BE.spriteData.player (body per facing and leg pose,
 * arms per pose, hair per style and facing), recolored per athlete through slot letters, given a
 * 1px outline like codeart2d's (4-neighbour ring) and cached as small canvases. Drawing them at one
 * internal pixel per sprite pixel keeps them on the court canvas's pixel grid. */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const OUTLINE = '#0c0a18';
  // 3x5 digits for jersey numbers on the back
  const DIGITS = ['111101101101111', '010110010010111', '111001111100111', '111001111001111', '101101111001001',
    '111100111001111', '111100111101111', '111001010010010', '111101111101111', '111101111001111'];
  const decoded = new Map();
  const cache = new Map();
  const CACHE_MAX = 800;

  function data() { return BE.spriteData && BE.spriteData.player; }
  function available() { return !!data() && typeof document !== 'undefined'; }

  function part(name) {
    if (decoded.has(name)) return decoded.get(name);
    const P = data(), src = P.parts[name];
    let out = null;
    if (src) {
      const [x0, y0, w, h, rle] = src;
      const cells = new Uint8Array(w * h);
      let i = 0, n = '';
      for (const ch of rle) {
        if (ch >= '0' && ch <= '9') { n += ch; continue; }
        const k = n ? parseInt(n, 10) : 1;
        const code = ch === '.' ? 0 : ch.charCodeAt(0);
        cells.fill(code, i, i + k);
        i += k; n = '';
      }
      out = { x0, y0, w, h, cells };
    }
    decoded.set(name, out);
    return out;
  }

  function paint(buf, W, name, mirror) {
    const p = part(name);
    if (!p) return;
    for (let y = 0; y < p.h; y++) for (let x = 0; x < p.w; x++) {
      const c = p.cells[y * p.w + x];
      if (!c) continue;
      const gx = mirror ? W - 1 - (p.x0 + x) : p.x0 + x;
      buf[(p.y0 + y) * W + gx] = c;
    }
  }

  function hexRgb(h) {
    let c = String(h || '#000').replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16) || 0;
    return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
  }
  const shade = (h, a) => (BE.athletes && BE.athletes.shade ? BE.athletes.shade(h, a) : h);

  /* o: { facing: 'back'|'front', legs, arms, mirror, hair, skin, hairColor, jersey, trim, shoe,
   *      headband, wristband, compression (colors or undefined), number } -> canvas or null */
  function player(o) {
    if (!available()) return null;
    const key = [o.facing, o.legs, o.arms, o.mirror ? 1 : 0, o.hair, o.skin, o.hairColor, o.jersey, o.trim, o.shoe,
      o.headband || '', o.wristband || '', o.compression ? 1 : 0, o.number === undefined ? '' : o.number].join('|');
    const hit = cache.get(key);
    if (hit) return hit;
    const P = data(), W = P.w, H = P.h;
    const buf = new Uint8Array(W * H);
    const hairName = 'hair_' + o.facing + '_' + o.hair;
    const hairPart = P.parts[hairName] ? hairName : (o.hair === 'bald' ? null : 'hair_' + o.facing + '_buzz');
    paint(buf, W, 'body_' + o.facing + '_' + o.legs);
    if (o.facing === 'back') {
      // jersey number in trim color
      const num = String(o.number === undefined ? '' : o.number).replace(/\D/g, '').slice(-2);
      if (num) {
        const w = num.length * 4 - 1, x0 = 12 - Math.ceil(w / 2);
        for (let d = 0; d < num.length; d++) {
          const pat = DIGITS[+num[d]];
          for (let r = 0; r < 5; r++) for (let c = 0; c < 3; c++) if (pat[r * 3 + c] === '1') buf[(16 + r) * W + x0 + d * 4 + c] = 78; // 'N'
        }
      }
      paint(buf, W, 'arms_' + o.arms, o.mirror);
      if (hairPart) paint(buf, W, hairPart);
    } else {
      if (hairPart) paint(buf, W, hairPart);
      paint(buf, W, 'arms_' + o.arms, o.mirror);
    }
    if (o.headband) for (let x = 9; x <= 14; x++) buf[9 * W + x] = 110; // 'n'
    // 1px outline on the 4-neighbour ring
    const K = 107; // 'k'
    const out = buf.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (buf[i]) continue;
      if ((x > 0 && buf[i - 1]) || (x < W - 1 && buf[i + 1]) || (y > 0 && buf[i - W]) || (y < H - 1 && buf[i + W])) out[i] = K;
    }
    const skinS = shade(o.skin, -0.16);
    const pal = {
      s: o.skin, S: skinS, e: '#1a1210', j: o.jersey, J: shade(o.jersey, -0.2), t: o.trim, T: shade(o.trim, -0.18),
      w: o.shoe, W: shade(o.shoe, -0.28), o: '#f4f1ea',
      c: o.compression ? '#1a1d26' : o.skin, C: o.compression ? '#0c0e14' : skinS,
      r: o.wristband || o.skin, h: o.hairColor, H: shade(o.hairColor, 0.16), n: o.headband || o.hairColor,
      N: o.trim, k: OUTLINE,
    };
    const rgb = {};
    for (const k in pal) rgb[k.charCodeAt(0)] = hexRgb(pal[k]);
    const cv = document.createElement('canvas');
    cv.width = W; cv.height = H;
    const g = cv.getContext('2d');
    const img = g.createImageData(W, H);
    for (let i = 0; i < out.length; i++) {
      const c = out[i];
      if (!c) continue;
      const col = rgb[c] || [255, 0, 255];
      img.data[i * 4] = col[0]; img.data[i * 4 + 1] = col[1]; img.data[i * 4 + 2] = col[2]; img.data[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    if (cache.size >= CACHE_MAX) cache.clear();
    cache.set(key, cv);
    return cv;
  }

  // Hand positions in sprite pixels relative to the feet (x right, y up), for lining the ball up
  const HANDS = { idle: [7.5, 10], shoot: [0.5, 30], dunk: [4.5, 31], pass: [9.5, 18] };

  BE.sprites = { available, player, HANDS, size: () => (data() ? [data().w, data().h] : [0, 0]) };
})(typeof window !== 'undefined' ? window : globalThis);
