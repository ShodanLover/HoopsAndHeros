/* Basketball Empire — athlete catalog generation, stats, and portrait art */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const D = BE.data, U = BE.util;
  const ATTR_KEYS = D.attrs.map((a) => a.k);
  const PER_WORLD = 30;
  const WORLD_RARITY_SLOTS = [9, 7, 6, 4, 3, 1]; // = 30

  function ovrFromAttrs(attrs, pos) {
    const w = D.positions[pos].w;
    let sum = 0, tw = 0;
    for (const k of ATTR_KEYS) { sum += (attrs[k] || 0) * w[k]; tw += w[k]; }
    return Math.round(sum / tw);
  }

  function makeAppearance(rng, rarity, pos) {
    const natural = [0, 1, 2, 3, 4, 5, 6];
    const hairColor = rarity >= 3 && rng() < 0.35 ? U.pick(D.hairColors, rng) : D.hairColors[U.pick(natural, rng)];
    return {
      skin: Math.floor(rng() * D.skinTones.length),
      hair: U.pick(D.hairStyles, rng),
      hairColor,
      facial: U.pick(D.facialHair, rng),
      build: pos === 'C' || pos === 'PF' ? 'big' : pos === 'PG' ? 'slim' : 'avg',
      brow: rng() < 0.5 ? 0 : 1,
      mouth: Math.floor(rng() * 3),
      goggles: rarity >= 3 && rng() < 0.15,
      tattoo: rng() < 0.3,
      shoe: U.pick(['#ffffff', '#111111', '#ff3b30', '#ffcc00', '#2f80ff', '#22c55e'], rng),
    };
  }

  function buildAttrs(rng, targetOvr, pos, arch, spread) {
    const w = D.positions[pos].w;
    const attrs = {};
    for (const k of ATTR_KEYS) {
      const shape = (w[k] - 1) * 12;
      const boost = arch.boost[k] || 0;
      attrs[k] = targetOvr - 6 + shape + boost + (rng() * 2 - 1) * spread;
    }
    // normalize to target ovr
    for (let pass = 0; pass < 3; pass++) {
      const cur = ovrFromAttrs(attrs, pos);
      const delta = targetOvr - cur;
      for (const k of ATTR_KEYS) attrs[k] = attrs[k] + delta;
    }
    for (const k of ATTR_KEYS) attrs[k] = Math.round(U.clamp(attrs[k], 15, 99));
    return attrs;
  }

  function makeTemplate(id, rng, rarity, world, usedNames) {
    const arch = U.pick(D.archetypes, rng);
    const pos = U.pick(arch.pos, rng);
    const r = D.rarities[rarity];
    const targetOvr = Math.round(U.clamp(U.lerp(r.ovr[0], r.ovr[1], rng()) + world * 0.7, 20, 98));
    let first, last, tries = 0;
    do {
      first = U.pick(D.firstNames, rng);
      last = U.pick(D.lastNames, rng);
      tries++;
    } while (usedNames && usedNames.has(first + last) && tries < 50);
    if (usedNames) usedNames.add(first + last);
    const nick = rarity >= 2 || rng() < 0.3 ? U.pick(D.nicknames, rng) : null;
    const ph = D.positions[pos].h;
    return {
      id, rarity, world, pos,
      arch: arch.k,
      first, last, nick,
      number: Math.floor(rng() * 99) + 0,
      height: Math.round(U.lerp(ph[0], ph[1], rng())),
      personality: U.pick(D.personalities, rng).k,
      celebration: rarity >= 5 ? 'flip' : U.pick(D.celebrations.slice(0, 5), rng),
      attrs: buildAttrs(rng, targetOvr, pos, arch, 6),
      look: makeAppearance(rng, rarity, pos),
    };
  }

  // Deterministic catalog of 300 collectible athletes (30 per world)
  const catalog = [];
  const byId = {};
  (function generate() {
    const used = new Set();
    for (let w = 0; w < D.worlds.length; w++) {
      let slot = 0;
      for (let r = 0; r < WORLD_RARITY_SLOTS.length; r++) {
        for (let n = 0; n < WORLD_RARITY_SLOTS[r]; n++) {
          const idx = w * PER_WORLD + slot;
          const rng = U.mulberry32(90210 + idx * 7919);
          const t = makeTemplate('A' + String(idx).padStart(3, '0'), rng, r, w, used);
          catalog.push(t);
          byId[t.id] = t;
          slot++;
        }
      }
    }
    // The terrible starter
    const starter = {
      id: 'S0', rarity: 0, world: 0, pos: 'PG', arch: 'showman', first: 'Marcus', last: 'Bell', nick: 'Bricks', number: 0, height: 183,
      personality: 'underdog', celebration: 'fist', starter: true,
      attrs: { sht: 31, thr: 22, hnd: 38, pas: 33, spd: 41, str: 26, def: 28, stl: 30, blk: 15, reb: 24, sta: 45, iq: 29 },
      look: { skin: 4, hair: 'fade', hairColor: '#121014', facial: 'none', build: 'slim', brow: 0, mouth: 0, goggles: false, tattoo: false, shoe: '#ffffff' },
    };
    byId.S0 = starter;
  })();

  function tpl(id) { return byId[id]; }

  function displayName(t, short) {
    if (!t) return '???';
    if (short) return t.last;
    return t.nick ? t.first + ' "' + t.nick + '" ' + t.last : t.first + ' ' + t.last;
  }

  // Effective attributes for an owned athlete: base + stars + training + gear subs
  function effAttrs(state, a) {
    const t = tpl(a.cid);
    const out = {};
    const starBonus = (a.stars - 1) * 2;
    for (const k of ATTR_KEYS) out[k] = t.attrs[k] + starBonus + ((a.train && a.train[k]) || 0);
    if (state && a.gear) {
      for (const slot in a.gear) {
        const it = state.gearById ? state.gearById[a.gear[slot]] : null;
        if (it && it.subs) for (const s of it.subs) out[s.k] = (out[s.k] || 0) + s.v;
      }
    }
    for (const k of ATTR_KEYS) out[k] = Math.min(120, out[k]);
    return out;
  }

  function trainCap(a) {
    const t = tpl(a.cid);
    return D.rarities[t.rarity].cap + (a.stars - 1) * 2;
  }

  // ---------- Opponents ----------
  function opponentTeam(g, size, opts) {
    opts = opts || {};
    const wIdx = Math.min(9, Math.floor(g / 10));
    const st = g % 10;
    const world = D.worlds[wIdx];
    const rng = U.mulberry32(5000 + g * 131 + (opts.round || 0) * 17 + (opts.seed || 0));
    const baseOvr = U.clamp(34 + wIdx * 6.5 + st * 0.6 + (g >= 100 ? (g - 100) * 0.2 : 0), 30, 99);
    const players = [];
    for (let i = 0; i < size; i++) {
      const arch = U.pick(D.archetypes, rng);
      const posOrder = size === 5 ? ['PG', 'SG', 'SF', 'PF', 'C'] : size === 3 ? ['PG', 'SF', 'C'] : [U.pick(arch.pos, rng)];
      const pos = posOrder[i];
      const rarity = Math.min(5, Math.floor(wIdx / 2));
      const p = {
        id: 'opp' + i,
        first: U.pick(D.firstNames, rng), last: U.pick(D.lastNames, rng), nick: null,
        pos, arch: arch.k, rarity,
        number: Math.floor(rng() * 99),
        attrs: buildAttrs(rng, Math.round(baseOvr + (rng() * 6 - 3)), pos, arch, 5),
        look: makeAppearance(rng, rarity, pos),
        personality: U.pick(D.personalities, rng).k,
        celebration: U.pick(D.celebrations.slice(0, 5), rng),
      };
      players.push(p);
    }
    let name = opts.name || (g < 100 ? world.teams[st] : 'Rift Squad #' + (g - 99));
    if (size === 1 && g < 5) {
      const parts = name.split(' ');
      players[0].first = parts[0];
      players[0].last = parts.slice(1).join(' ') || parts[0];
      players[0].nick = null;
    }
    const offStyles = ['inside', 'balanced', 'outside'];
    const defStyles = ['man', 'zone', 'press'];
    const hue = Math.floor(rng() * 360);
    return {
      name,
      players,
      colors: ['hsl(' + hue + ',70%,52%)', 'hsl(' + ((hue + 180) % 360) + ',40%,18%)'],
      style: { off: U.pick(offStyles, rng), def: U.pick(defStyles, rng) },
    };
  }

  // ---------- Portrait (SVG) ----------
  function shade(hex, amt) {
    let c = hex.replace('#', '');
    if (c.length === 3) c = c.split('').map((x) => x + x).join('');
    const n = parseInt(c, 16);
    let r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    r = U.clamp(Math.round(r + amt * 255), 0, 255);
    g = U.clamp(Math.round(g + amt * 255), 0, 255);
    b = U.clamp(Math.round(b + amt * 255), 0, 255);
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
  }

  function hairBack(style, c) {
    switch (style) {
      case 'afro': return '<circle cx="50" cy="34" r="25" fill="' + c + '"/><circle cx="30" cy="40" r="10" fill="' + c + '"/><circle cx="70" cy="40" r="10" fill="' + c + '"/>';
      case 'locs': return '<path d="M30 36 Q28 62 32 74 L38 74 Q35 58 36 40Z M70 36 Q72 62 68 74 L62 74 Q65 58 64 40Z" fill="' + c + '"/>' +
        '<path d="M33 44 L31 72 M67 44 L69 72" stroke="' + shade(c, -0.1) + '" stroke-width="2"/>';
      case 'braids': return '<path d="M33 46 Q30 60 33 70 M67 46 Q70 60 67 70" stroke="' + c + '" stroke-width="5" fill="none" stroke-linecap="round"/>';
      default: return '';
    }
  }
  function hairFront(style, c) {
    const d = shade(c, -0.12);
    switch (style) {
      case 'buzz': return '<path d="M34 40 Q33 23 50 22 Q67 23 66 40 Q61 30 50 30 Q39 30 34 40Z" fill="' + c + '" opacity=".85"/>';
      case 'fade': return '<path d="M34 38 Q33 20 50 19 Q67 20 66 38 Q62 28 50 28 Q38 28 34 38Z" fill="' + c + '"/><path d="M34 38 Q34 44 35 48 M66 38 Q66 44 65 48" stroke="' + c + '" stroke-width="2" opacity=".35"/>';
      case 'afro': return '<path d="M33 40 Q33 26 50 25 Q67 26 67 40 Q60 32 50 32 Q40 32 33 40Z" fill="' + c + '"/>';
      case 'braids': return '<path d="M34 40 Q33 22 50 21 Q67 22 66 40 Q60 31 50 31 Q40 31 34 40Z" fill="' + c + '"/>' +
        '<path d="M40 24 L38 38 M46 22 L45 32 M54 22 L55 32 M60 24 L62 38" stroke="' + d + '" stroke-width="1.6"/>';
      case 'bald': return '<ellipse cx="44" cy="30" rx="6" ry="3" fill="#fff" opacity=".22"/>';
      case 'curls': {
        let s = '';
        const pts = [[38, 26], [44, 22], [50, 21], [56, 22], [62, 26], [35, 32], [65, 32], [47, 25], [53, 25]];
        for (const p of pts) s += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="5" fill="' + c + '"/>';
        return s;
      }
      case 'mohawk': return '<path d="M45 34 Q44 12 50 8 Q56 12 55 34 Q50 30 45 34Z" fill="' + c + '"/><path d="M34 40 Q34 30 44 27 M66 40 Q66 30 56 27" stroke="' + c + '" stroke-width="2" opacity=".3" fill="none"/>';
      case 'flattop': return '<path d="M34 40 L34 17 Q34 15 37 15 L63 15 Q66 15 66 17 L66 40 Q60 30 50 30 Q40 30 34 40Z" fill="' + c + '"/>';
      case 'locs': return '<path d="M33 42 Q32 22 50 21 Q68 22 67 42 Q62 30 50 30 Q38 30 33 42Z" fill="' + c + '"/>' +
        '<path d="M38 28 L36 44 M44 25 L43 34 M56 25 L57 34 M62 28 L64 44" stroke="' + d + '" stroke-width="2.4" stroke-linecap="round"/>';
      case 'bun': return '<circle cx="50" cy="17" r="8" fill="' + c + '"/><path d="M34 40 Q33 22 50 21 Q67 22 66 40 Q60 30 50 30 Q40 30 34 40Z" fill="' + c + '"/>';
      case 'spiky': return '<path d="M33 40 L34 24 L39 28 L41 16 L46 25 L50 13 L54 25 L59 16 L61 28 L66 24 L67 40 Q60 30 50 30 Q40 30 33 40Z" fill="' + c + '"/>';
      case 'waves': return '<path d="M34 39 Q33 22 50 21 Q67 22 66 39 Q60 30 50 30 Q40 30 34 39Z" fill="' + c + '"/>' +
        '<path d="M39 27 Q42 25 45 27 Q48 29 51 27 Q54 25 57 27 Q60 29 62 27" stroke="' + d + '" stroke-width="1.2" fill="none"/>';
      default: return '';
    }
  }

  // Returns an SVG string. opts: { colors:[primary,secondary], gear:{headband:rarityIdx, ...}, number, size }
  function portraitSVG(t, opts) {
    opts = opts || {};
    const L = t.look;
    const skin = D.skinTones[L.skin] || D.skinTones[3];
    const skinD = shade(skin, -0.1);
    const cols = opts.colors || ['#ff6a1f', '#1b1f3a'];
    const jersey = cols[0], trim = cols[1];
    const hc = L.hairColor;
    const gear = opts.gear || {};
    const big = L.build === 'big';
    const shoulderW = big ? 46 : L.build === 'slim' ? 38 : 42;
    const sx0 = 50 - shoulderW, sx1 = 50 + shoulderW;
    let s = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" class="portrait">';
    // jersey + shoulders
    s += hairBack(L.hair, hc);
    s += '<path d="M' + sx0 + ' 100 Q' + (sx0 + 2) + ' 74 34 70 L66 70 Q' + (sx1 - 2) + ' 74 ' + sx1 + ' 100Z" fill="' + skin + '"/>';
    s += '<path d="M' + (sx0 + 9) + ' 100 Q' + (sx0 + 10) + ' 78 38 72 L62 72 Q' + (sx1 - 10) + ' 78 ' + (sx1 - 9) + ' 100Z" fill="' + jersey + '"/>';
    s += '<path d="M40 72 Q50 84 60 72" stroke="' + trim + '" stroke-width="3" fill="' + skin + '"/>';
    s += '<path d="M' + (sx0 + 9) + ' 100 Q' + (sx0 + 10) + ' 78 38 72" stroke="' + trim + '" stroke-width="2.4" fill="none"/>';
    s += '<path d="M' + (sx1 - 9) + ' 100 Q' + (sx1 - 10) + ' 78 62 72" stroke="' + trim + '" stroke-width="2.4" fill="none"/>';
    if (gear.jersey !== undefined) s += '<path d="M44 96 L56 96" stroke="' + D.rarities[gear.jersey].color + '" stroke-width="2"/>';
    s += '<text x="50" y="97" text-anchor="middle" font-family="Bebas Neue, Impact, sans-serif" font-size="15" fill="' + trim + '" stroke="#fff" stroke-width=".6" paint-order="stroke">' + (opts.number !== undefined ? opts.number : t.number) + '</text>';
    if (L.tattoo) s += '<path d="M' + (sx0 + 3) + ' 92 q3 -4 6 0 q3 4 6 0" stroke="' + shade(skin, -0.35) + '" stroke-width="1.4" fill="none"/>';
    // neck
    s += '<path d="M43 58 L43 72 Q50 76 57 72 L57 58Z" fill="' + skinD + '"/>';
    // ears + head
    s += '<ellipse cx="33.5" cy="46" rx="3.6" ry="5" fill="' + skinD + '"/><ellipse cx="66.5" cy="46" rx="3.6" ry="5" fill="' + skinD + '"/>';
    s += '<ellipse cx="50" cy="43" rx="16.5" ry="19.5" fill="' + skin + '"/>';
    s += '<path d="M36 50 Q50 66 64 50 Q60 63 50 63 Q40 63 36 50Z" fill="' + skinD + '" opacity=".5"/>';
    // eyes, brows
    if (L.goggles) {
      s += '<rect x="35" y="39" width="30" height="9" rx="4.5" fill="#cfe9ff" stroke="#222" stroke-width="1.6" opacity=".95"/><line x1="50" y1="39" x2="50" y2="48" stroke="#222" stroke-width="1.4"/>';
      s += '<circle cx="43" cy="43.5" r="1.8" fill="#111"/><circle cx="57" cy="43.5" r="1.8" fill="#111"/>';
    } else {
      s += '<ellipse cx="43" cy="43.5" rx="2.6" ry="2.2" fill="#fff"/><ellipse cx="57" cy="43.5" rx="2.6" ry="2.2" fill="#fff"/>';
      s += '<circle cx="43.4" cy="43.7" r="1.5" fill="#1a1210"/><circle cx="57.4" cy="43.7" r="1.5" fill="#1a1210"/>';
    }
    const by = L.brow ? 37.5 : 38.5;
    s += '<path d="M38.5 ' + by + ' Q43 ' + (by - 2.4) + ' 47 ' + (by + 0.4) + ' M53 ' + (by + 0.4) + ' Q57 ' + (by - 2.4) + ' 61.5 ' + by + '" stroke="' + shade(hc, -0.05) + '" stroke-width="1.9" fill="none" stroke-linecap="round"/>';
    // nose & mouth
    s += '<path d="M50 45 Q48 51 50 52.5 Q52 52.6 53 51.5" stroke="' + shade(skin, -0.25) + '" stroke-width="1.2" fill="none" stroke-linecap="round"/>';
    if (L.mouth === 0) s += '<path d="M44.5 56 Q50 60.5 55.5 56" stroke="#5a2a20" stroke-width="1.6" fill="#fff" stroke-linejoin="round"/>';
    else if (L.mouth === 1) s += '<path d="M45 57 Q51 58.5 55.5 55.5" stroke="#5a2a20" stroke-width="1.6" fill="none" stroke-linecap="round"/>';
    else s += '<path d="M45.5 57 L54.5 57" stroke="#5a2a20" stroke-width="1.7" stroke-linecap="round"/>';
    // facial hair
    const fh = shade(hc, 0.02);
    if (L.facial === 'stubble') s += '<path d="M37 52 Q50 68 63 52 Q60 62 50 63 Q40 62 37 52Z" fill="' + fh + '" opacity=".28"/>';
    if (L.facial === 'goatee') s += '<path d="M46 59.5 Q50 64 54 59.5 L54 61.5 Q50 66 46 61.5Z" fill="' + fh + '"/>';
    if (L.facial === 'beard') s += '<path d="M34.5 46 Q35 64 50 64.5 Q65 64 65.5 46 Q63 58 57 58.5 Q50 55 43 58.5 Q37 58 34.5 46Z" fill="' + fh + '"/>';
    if (L.facial === 'mustache') s += '<path d="M44 54.8 Q50 52 56 54.8 Q50 54.4 44 54.8Z" fill="' + fh + '" stroke="' + fh + '" stroke-width="1.4"/>';
    s += hairFront(L.hair, hc);
    if (gear.headband !== undefined) {
      const hb = D.rarities[gear.headband].color;
      s += '<path d="M33.5 35 Q50 28 66.5 35 L66.5 39.5 Q50 32.5 33.5 39.5Z" fill="' + hb + '" stroke="' + shade(hb, -0.25) + '" stroke-width=".6"/>';
    }
    s += '</svg>';
    return s;
  }

  BE.athletes = { catalog, byId, tpl, displayName, ovrFromAttrs, effAttrs, trainCap, opponentTeam, portraitSVG, shade, ATTR_KEYS, PER_WORLD };
})(typeof window !== 'undefined' ? window : globalThis);
