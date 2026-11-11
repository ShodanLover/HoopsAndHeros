/* Basketball Empire — canvas court renderer & possession animation director */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, A = BE.athletes;
  const HOOP = { x: 0, y: 5.25, z: 10 };
  const NEAR = 33; // court depth (ft) visible at the bottom edge
  const sfx = (k, o) => BE.audio && BE.audio.play(k, o);

  const FORM = {
    1: [[0, 21]],
    3: [[0, 24], [-14, 13], [14, 12]],
    5: [[0, 26], [-17, 17], [17, 16], [-8, 9], [7, 7]],
  };

  const C = {
    canvas: null, ctx: null, W: 0, H: 0, dpr: 1, P: null,
    bg: null, theme: null, world: 0, cos: null,
    players: [], ball: null, tasks: [], particles: [], floaters: [], crowd: [],
    shake: 0, excite: 0.2, time: 0, speed: 2, visible: true, match: null, flash: 0,
    net: 0, rimShake: 0, idle: true, reduceMotion: false, banner: null,
  };

  // ---------- Projection ----------
  function setupProjection() {
    const W = C.W, H = C.H;
    const Z0 = 52, Zf = Z0 + NEAR;
    const top = H * 0.34, bot = H * 1.0;
    const kh = (bot - top) / (1 / Z0 - 1 / Zf);
    const horizon = bot - kh / Z0;
    const kx = Math.min(1.55 * W, 1.25 * H) * Z0 / 50;
    C.P = { Z0, kh, horizon, kx, kz: kx * 0.92 };
  }
  function proj(x, y, z) {
    const P = C.P;
    const Z = P.Z0 + (NEAR - y);
    return { x: C.W / 2 + x * P.kx / Z, y: P.horizon + P.kh / Z - (z || 0) * P.kz / Z, s: P.kx / Z };
  }

  // ---------- Setup ----------
  function init(canvas) {
    C.canvas = canvas;
    C.ctx = canvas.getContext('2d');
    resize();
  }
  function resize() {
    if (!C.canvas) return;
    const r = C.canvas.getBoundingClientRect();
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const W = Math.max(200, Math.round(r.width)), H = Math.max(180, Math.round(r.height));
    if (W === C.W && H === C.H && dpr === C.dpr && C.bg) return;
    C.W = W; C.H = H; C.dpr = dpr;
    C.canvas.width = W * dpr; C.canvas.height = H * dpr;
    setupProjection();
    buildBackground();
  }
  function setTheme(world, cos) {
    C.world = Math.min(9, world);
    C.cos = cos;
    const base = D.worlds[C.world].theme;
    C.theme = Object.assign({}, base, cos && cos.court ? cos.court : {});
    buildBackground();
  }

  // ---------- Static background ----------
  function buildBackground() {
    if (!C.W || !C.theme) return;
    const cv = C.bg || document.createElement('canvas');
    cv.width = C.W * C.dpr; cv.height = C.H * C.dpr;
    const g = cv.getContext('2d');
    g.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
    drawStands(g);
    drawFloor(g);
    C.bg = cv;
    buildCrowd();
  }

  function drawStands(g) {
    const T = C.theme, W = C.W;
    const base = proj(0, 0, 0).y;
    const grd = g.createLinearGradient(0, 0, 0, base);
    grd.addColorStop(0, T.sky[1]); grd.addColorStop(1, T.sky[0]);
    g.fillStyle = grd; g.fillRect(0, 0, W, base + 2);
    const rng = U.mulberry32(77 + C.world);
    if (T.stands === 'fence') {
      // city skyline
      for (let i = 0; i < 14; i++) {
        const bw = 20 + rng() * 40, bh = 30 + rng() * base * 0.6, bx = (i / 14) * W - 10 + rng() * 10;
        g.fillStyle = 'rgba(30,20,45,' + (0.55 + rng() * 0.3) + ')';
        g.fillRect(bx, base - bh, bw, bh);
        g.fillStyle = 'rgba(255,214,120,.55)';
        for (let wy = base - bh + 6; wy < base - 8; wy += 9) for (let wx = bx + 4; wx < bx + bw - 4; wx += 8) if (rng() < 0.35) g.fillRect(wx, wy, 3, 4);
      }
      // chain-link fence
      const fTop = base * 0.45;
      g.strokeStyle = 'rgba(200,210,220,.35)'; g.lineWidth = 1;
      for (let x = -base; x < W + base; x += 9) {
        g.beginPath(); g.moveTo(x, fTop); g.lineTo(x + (base - fTop), base); g.stroke();
        g.beginPath(); g.moveTo(x, base); g.lineTo(x + (base - fTop), fTop); g.stroke();
      }
      g.fillStyle = 'rgba(160,170,180,.8)'; g.fillRect(0, fTop - 2, W, 3);
      for (let x = 10; x < W; x += 70) g.fillRect(x, fTop - 2, 3, base - fTop);
    } else if (T.stands === 'cosmic') {
      for (let i = 0; i < 160; i++) { g.fillStyle = 'rgba(255,255,255,' + rng() + ')'; g.fillRect(rng() * W, rng() * base, 1.5, 1.5); }
      const neb = g.createRadialGradient(W * 0.3, base * 0.4, 5, W * 0.3, base * 0.4, W * 0.5);
      neb.addColorStop(0, 'rgba(120,60,255,.45)'); neb.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = neb; g.fillRect(0, 0, W, base);
      const neb2 = g.createRadialGradient(W * 0.8, base * 0.2, 5, W * 0.8, base * 0.2, W * 0.4);
      neb2.addColorStop(0, 'rgba(0,220,255,.35)'); neb2.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = neb2; g.fillRect(0, 0, W, base);
    } else {
      // tiered stands
      const tiers = T.stands === 'bleachers' ? 6 : 9;
      for (let i = 0; i < tiers; i++) {
        const y0 = base * (0.18 + 0.82 * i / tiers), y1 = base * (0.18 + 0.82 * (i + 1) / tiers);
        g.fillStyle = T.stands === 'bleachers' ? (i % 2 ? '#8a6038' : '#7a5230') : T.stands === 'marble' ? (i % 2 ? '#3a342b' : '#2f2a22') : (i % 2 ? 'rgba(255,255,255,.05)' : 'rgba(0,0,0,.18)');
        g.fillRect(0, y0, W, y1 - y0);
      }
      if (T.stands === 'bleachers') {
        g.fillStyle = '#2b3550'; g.fillRect(0, 0, W, base * 0.18);
        const ban = ['#1f6fd1', '#ffd23f', '#e8263f'];
        for (let i = 0; i < 5; i++) { g.fillStyle = ban[i % 3]; const bx = 20 + i * (W - 40) / 5; g.beginPath(); g.moveTo(bx, 4); g.lineTo(bx + 28, 4); g.lineTo(bx + 28, base * 0.14); g.lineTo(bx + 14, base * 0.17); g.lineTo(bx, base * 0.14); g.fill(); }
      }
      if (T.stands === 'arena' || T.stands === 'gold' || T.stands === 'flags') {
        // jumbotron
        const jw = Math.min(160, W * 0.42), jh = base * 0.16;
        g.fillStyle = '#0a0a0f'; g.fillRect(W / 2 - jw / 2, 2, jw, jh);
        g.strokeStyle = D.worlds[C.world].color; g.lineWidth = 2; g.strokeRect(W / 2 - jw / 2, 2, jw, jh);
      }
      if (T.stands === 'flags') {
        const fc = ['#e63946', '#2a9d8f', '#f4a261', '#457b9d', '#ffd23f', '#8338ec', '#06d6a0'];
        g.strokeStyle = 'rgba(255,255,255,.5)'; g.beginPath(); g.moveTo(0, base * 0.22); g.quadraticCurveTo(W / 2, base * 0.34, W, base * 0.22); g.stroke();
        for (let i = 0; i < 16; i++) { const t = i / 15, fx = t * W, fy = base * 0.22 + Math.sin(t * Math.PI) * base * 0.11; g.fillStyle = fc[i % fc.length]; g.fillRect(fx - 5, fy, 10, 12); }
      }
      if (T.stands === 'neon') {
        for (let i = 0; i < 3; i++) { g.strokeStyle = ['#ff5cf0', '#5cf2ff', '#c86bff'][i]; g.lineWidth = 2; g.shadowColor = g.strokeStyle; g.shadowBlur = 10; g.beginPath(); g.moveTo(0, base * (0.25 + i * 0.25)); g.lineTo(W, base * (0.25 + i * 0.25)); g.stroke(); }
        g.shadowBlur = 0;
      }
      if (T.stands === 'marble') {
        g.fillStyle = 'rgba(233,226,208,.9)';
        for (let i = 0; i < 6; i++) { const cx = 12 + i * (W - 24) / 5; g.fillRect(cx - 6, 0, 12, base * 0.3); }
        g.fillStyle = '#b08d3c'; g.fillRect(0, base * 0.3, W, 3);
      }
      if (T.stands === 'gold') { g.fillStyle = 'rgba(255,200,80,.12)'; g.fillRect(0, 0, W, base); }
      // spotlights
      if (T.stands !== 'bleachers' && T.stands !== 'marble') {
        for (const sx of [0.15, 0.85]) {
          const lg = g.createLinearGradient(W * sx, 0, W / 2, base);
          lg.addColorStop(0, 'rgba(255,255,255,.18)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = lg; g.beginPath(); g.moveTo(W * sx - 8, 0); g.lineTo(W * sx + 8, 0); g.lineTo(W / 2 + 60, base); g.lineTo(W / 2 - 60, base); g.fill();
        }
      }
    }
    // baseline ad board
    g.fillStyle = 'rgba(0,0,0,.45)'; g.fillRect(0, base - 12, W, 12);
    g.fillStyle = D.worlds[C.world].color; g.font = '700 9px "Barlow Condensed", sans-serif'; g.textAlign = 'center';
    g.globalAlpha = 0.9;
    const adText = ['BASKETBALL EMPIRE', D.worlds[C.world].arena.toUpperCase(), 'HUSTLE · HEART · HOOPS'];
    for (let i = 0; i < 3; i++) g.fillText(adText[i], W * (i + 0.5) / 3, base - 3);
    g.globalAlpha = 1;
  }

  function quad(g, pts, fill) {
    g.beginPath(); g.moveTo(pts[0].x, pts[0].y);
    for (let i = 1; i < pts.length; i++) g.lineTo(pts[i].x, pts[i].y);
    g.closePath(); g.fillStyle = fill; g.fill();
  }
  function line3(g, pts) {
    g.beginPath();
    pts.forEach((p, i) => { const q = proj(p[0], p[1], 0); if (i) g.lineTo(q.x, q.y); else g.moveTo(q.x, q.y); });
    g.stroke();
  }
  function arc3(cx, cy, r, a0, a1, n) {
    const pts = [];
    for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; pts.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]); }
    return pts;
  }

  function drawFloor(g) {
    const T = C.theme;
    const corners = [proj(-30, 0), proj(30, 0), proj(30, 49), proj(-30, 49)];
    quad(g, corners, T.floor);
    // planks / texture
    const rng = U.mulberry32(11 + C.world);
    if (T.stands === 'fence') {
      for (let i = 0; i < 500; i++) { const p = proj(rng() * 60 - 30, rng() * 49); g.fillStyle = rng() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.05)'; g.fillRect(p.x, p.y, 2 * p.s / 10, 1.5 * p.s / 10); }
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2;
      for (let k = 0; k < 4; k++) { let x = rng() * 40 - 20, y = rng() * 40 + 3; g.beginPath(); let p = proj(x, y); g.moveTo(p.x, p.y); for (let j = 0; j < 5; j++) { x += rng() * 4 - 2; y += rng() * 3; p = proj(x, y); g.lineTo(p.x, p.y); } g.stroke(); }
    } else {
      for (let x = -30; x < 30; x += 1.6) {
        if ((Math.round(x / 1.6) & 1) === 0) quad(g, [proj(x, 0), proj(x + 1.6, 0), proj(x + 1.6, 49), proj(x, 49)], T.floor2);
      }
      g.strokeStyle = 'rgba(0,0,0,.08)'; g.lineWidth = 1;
      for (let y = 2; y < 49; y += 3) for (let x = -30; x < 30; x += 1.6) if (rng() < 0.3) line3(g, [[x, y], [x + 1.6, y]]);
      // gloss
      const p0 = proj(0, 20);
      const gl = g.createRadialGradient(p0.x, p0.y, 10, p0.x, p0.y, C.W * 0.7);
      gl.addColorStop(0, 'rgba(255,255,255,.14)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; g.fillRect(0, 0, C.W, C.H);
    }
    // paint
    g.globalAlpha = 0.85;
    quad(g, [proj(-8, 0), proj(8, 0), proj(8, 19), proj(-8, 19)], T.paint);
    g.globalAlpha = 1;
    const cpts = arc3(0, 47, 6, Math.PI, 2 * Math.PI, 24).map((p) => proj(p[0], p[1]));
    g.beginPath(); cpts.forEach((p, i) => (i ? g.lineTo(p.x, p.y) : g.moveTo(p.x, p.y))); g.closePath();
    g.fillStyle = T.paint; g.globalAlpha = 0.6; g.fill(); g.globalAlpha = 1;
    // lines
    g.strokeStyle = T.line; g.lineWidth = 2; g.lineJoin = 'round';
    line3(g, [[-25, 0], [25, 0]]);
    line3(g, [[-25, 0], [-25, 49]]); line3(g, [[25, 0], [25, 49]]);
    line3(g, [[-25, 47], [25, 47]]);
    line3(g, [[-8, 0], [-8, 19], [8, 19], [8, 0]]);
    line3(g, [[-6, 0], [-6, 19]]); line3(g, [[6, 0], [6, 19]]);
    line3(g, arc3(0, 19, 6, 0, Math.PI, 28));
    g.setLineDash([4, 5]); line3(g, arc3(0, 19, 6, Math.PI, 2 * Math.PI, 28)); g.setLineDash([]);
    const a = Math.asin((14.2 - 5.25) / 23.75);
    line3(g, [[-22, 0], [-22, 14.2]].concat(arc3(0, 5.25, 23.75, Math.PI - a, a, 48)).concat([[22, 14.2], [22, 0]]));
    line3(g, arc3(0, 5.25, 4, Math.PI, 0, 16));
    line3(g, arc3(0, 47, 6, Math.PI, 2 * Math.PI, 24));
    // center logo text
    const lp = proj(0, 31.5);
    g.font = '400 ' + Math.round(lp.s * 1.6) + 'px "Bebas Neue", Impact, sans-serif';
    g.textAlign = 'center'; g.fillStyle = T.line; g.globalAlpha = 0.5;
    g.fillText(D.worlds[C.world].short.toUpperCase(), lp.x, lp.y);
    g.globalAlpha = 1;
    // stanchion pad behind baseline
    const pb = proj(0, -1.5);
    g.fillStyle = '#1b1f2a'; g.fillRect(pb.x - pb.s * 1.4, pb.y - pb.s * 0.6, pb.s * 2.8, pb.s * 0.9);
  }

  function buildCrowd() {
    C.crowd = [];
    const T = C.theme;
    if (!T) return;
    const base = proj(0, 0, 0).y;
    const rng = U.mulberry32(500 + C.world);
    const density = T.crowd;
    if (T.stands === 'cosmic') return;
    const rows = T.stands === 'fence' ? 1 : T.stands === 'bleachers' ? 5 : 7;
    const shirts = ['#ff6a1f', '#2f6bff', '#ffd23f', '#e8263f', '#22c55e', '#ffffff', '#111111', '#b46bff', D.worlds[C.world].color];
    for (let r = 0; r < rows; r++) {
      const y = T.stands === 'fence' ? base - 14 : base * (0.3 + 0.62 * (r + 0.5) / rows);
      const size = T.stands === 'fence' ? 7 : 3.2 + r * 0.55;
      const step = size * 2.3;
      for (let x = rng() * step; x < C.W; x += step) {
        if (rng() > density + (T.stands === 'fence' ? -0.15 : 0.05)) continue;
        C.crowd.push({ x: x + rng() * 3, y, r: size, skin: D.skinTones[Math.floor(rng() * 8)], shirt: U.pick(shirts, rng), ph: rng() * 6.28, amp: 0.5 + rng() });
      }
    }
  }

  // ---------- Entities ----------
  function makePlayer(team, idx, info, colors) {
    return {
      team, idx, info, colors,
      x: 0, y: 30, z: 0, tx: 0, ty: 30, vz: 0, spd: 9,
      arms: 'idle', phase: Math.random() * 6, facing: team === 0 ? 'hoop' : 'hoop', jumpT: -1, jumpH: 0, jumpDur: 0.5,
      celebrate: null, slump: 0,
    };
  }
  function startMatch(match) {
    C.match = match;
    C.players = [];
    C.tasks = [];
    C.floaters = [];
    C.banner = null;
    const size = match.teams[0].players.length;
    for (let t = 0; t < 2; t++) {
      const team = match.teams[t];
      team.players.forEach((p, i) => {
        const pl = makePlayer(t, i, p, team.colors);
        const f = FORM[size][i] || [0, 20];
        pl.x = pl.tx = (t ? -1 : 1) * f[0] * 0.6 + (t ? 3 : -3);
        pl.y = pl.ty = 25 + i * 1.5 + (t ? 3 : 0);
        C.players.push(pl);
      });
    }
    C.ball = { x: 0, y: 26, z: 3, holder: null, flight: null, vis: true };
    C.excite = 0.3;
  }
  function P(team, idx) { return C.players.find((p) => p.team === team && p.idx === idx); }
  function teamPlayers(team) { return C.players.filter((p) => p.team === team); }

  // ---------- Task system ----------
  function task(dur, opts) { C.tasks.push(Object.assign({ dur, t: 0, started: false }, opts)); }
  function wait(dur) { task(dur, {}); }
  function call(fn) { task(0, { start: fn }); }

  function hand(p) {
    // ball hold position relative to player
    if (useSprites()) {
      // line the ball up with the pixel sprite's hands (sprite px -> feet at this depth)
      const fpp = SPRITE_PX / proj(p.x, p.y, 0).s, H = BE.sprites.HANDS, dr = p.team === 0 ? 1 : -1;
      const k = p.arms === 'shoot' ? 'shoot' : p.arms === 'dunk' ? 'dunk' : p.arms === 'pass' ? 'pass' : 'idle';
      const hx = H[k][0] * (k === 'idle' || k === 'pass' ? dr : 1);
      return { x: p.x + hx * fpp, y: p.y - (k === 'shoot' || k === 'dunk' ? 0.2 : 0), z: p.z + H[k][1] * fpp };
    }
    const side = p.team === 0 ? 0.7 : -0.7;
    if (p.arms === 'shoot') return { x: p.x + 0.1, y: p.y - 0.2, z: p.z + 7.4 };
    if (p.arms === 'dunk') return { x: p.x, y: p.y - 0.3, z: p.z + 7.8 };
    return { x: p.x + side, y: p.y, z: p.z + 2.6 };
  }
  function giveBall(p) {
    const b = C.ball;
    b.holder = p; b.flight = null;
  }

  function setupFormation(offTeam) {
    const size = C.match.teams[0].players.length;
    const def = 1 - offTeam;
    const rnd = () => (Math.random() * 2 - 1) * 1.8;
    for (const p of teamPlayers(offTeam)) {
      const f = FORM[size][p.idx];
      p.tx = f[0] + rnd(); p.ty = f[1] + rnd(); p.arms = 'idle'; p.facing = 'hoop'; p.celebrate = null; p.slump = 0;
    }
    for (const p of teamPlayers(def)) {
      const man = P(offTeam, Math.min(p.idx, size - 1));
      const zone = C.match.teams[def].tactic && C.match.teams[def].tactic.def === 'zone';
      const k = zone ? 0.45 : 0.3;
      p.tx = man.tx + (HOOP.x - man.tx) * k; p.ty = man.ty + (HOOP.y - man.ty) * k + 0.8;
      p.arms = 'defend'; p.facing = 'cam'; p.celebrate = null; p.slump = 0;
    }
  }

  function moveTo(p, x, y) { p.tx = x; p.ty = y; }
  function jump(p, h, dur) { p.jumpT = 0; p.jumpH = h; p.jumpDur = dur; }
  function ballArc(from, to, dur, peak, onLand) {
    C.ball.holder = null;
    C.ball.flight = { from: Object.assign({}, from), to, dur, t: 0, peak, onLand };
  }
  function floater(text, x, y, z, color, size) {
    const p = proj(x, y, z || 0);
    C.floaters.push({ text, x: p.x, y: p.y, t: 0, life: 1.1, color: color || '#fff', size: size || 1 });
  }
  function burst(x, y, z, colors, n, power) {
    const p = proj(x, y, z || 0);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random()) * (power || 160);
      C.particles.push({ x: p.x, y: p.y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.6 + Math.random() * 0.6, t: 0, c: U.pick(colors), r: 1.5 + Math.random() * 2.5, g: 380 });
    }
  }
  function confetti(n) {
    const colors = ['#ff6a1f', '#ffd23f', '#38d996', '#3aa8ff', '#ff3f7a', '#ffffff', '#b46bff'];
    for (let i = 0; i < n; i++) {
      C.particles.push({ x: Math.random() * C.W, y: -10 - Math.random() * 60, vx: (Math.random() - 0.5) * 60, vy: 40 + Math.random() * 80, life: 2.5 + Math.random(), t: 0, c: U.pick(colors), r: 2 + Math.random() * 2.5, g: 30, conf: true, rot: Math.random() * 6 });
    }
  }

  // ---------- Possession playback ----------
  function playEvent(ev, done) {
    const m = C.match;
    const off = ev.off, def = 1 - off;
    C.tasks = [];
    const firstHandler = ev.segs[0] && ev.segs[0].t === 'dribble' ? P(off, ev.segs[0].who) : P(off, 0);
    call(() => { setupFormation(off); if (!C.ball.holder || C.ball.holder.team !== off) { const from = ballPos(); ballArc(from, () => hand(firstHandler), 0.35, 3, () => giveBall(firstHandler)); } });
    wait(0.5);
    for (const sg of ev.segs) queueSeg(sg, ev, off, def);
    wait(0.35);
    call(() => { if (done) done(); });
  }

  function ballPos() { const b = C.ball; return { x: b.x, y: b.y, z: b.z }; }
  function rimPos() { return { x: HOOP.x + (Math.random() - 0.5) * 0.2, y: HOOP.y, z: HOOP.z + 0.2 }; }

  function queueSeg(sg, ev, off, def) {
    const me = sg.who !== undefined ? P(sg.team, sg.who) : null;
    switch (sg.t) {
      case 'dribble': {
        call(() => { giveBall(me); me.arms = 'dribble'; moveTo(me, me.tx + (Math.random() * 8 - 4), me.ty + (Math.random() * 3 - 2)); sfx('squeak'); });
        wait(0.45);
        break;
      }
      case 'pass': {
        const from = P(sg.team, sg.from), to = P(sg.team, sg.to);
        call(() => {
          from.arms = 'pass';
          if (sg.stolen) {
            const d = P(1 - sg.team, Math.min(sg.to, C.match.teams[1 - sg.team].players.length - 1));
            const mid = { x: (from.x + to.x) / 2, y: (from.y + to.y) / 2 };
            moveTo(d, mid.x, mid.y);
            ballArc(hand(from), () => ({ x: d.x, y: d.y, z: 3 }), 0.3, 1.2, () => giveBall(d));
          } else ballArc(hand(from), () => hand(to), 0.28, 1.2, () => { giveBall(to); to.arms = 'dribble'; });
          sfx('pass');
        });
        wait(0.34);
        break;
      }
      case 'steal': {
        const thief = P(sg.team, sg.who), victim = P(1 - sg.team, sg.from);
        call(() => {
          moveTo(thief, victim.x, victim.y + 0.8);
          if (C.ball.holder !== thief) ballArc(ballPos(), () => hand(thief), 0.2, 0.5, () => giveBall(thief));
          floater('STEAL!', thief.x, thief.y, 8, sg.team === 0 ? '#38d996' : '#ff5a5a', 1.1);
          sfx('steal'); excite(sg.team === 0 ? 0.6 : 0.2, sg.team === 0);
        });
        wait(0.3);
        call(() => { thief.arms = 'dribble'; moveTo(thief, thief.x * 0.5, 29); victim.slump = 1; });
        wait(0.45);
        break;
      }
      case 'drive': {
        call(() => { const side = me.x >= 0 ? 1 : -1; moveTo(me, side * (2 + Math.random() * 2), 8.5); me.arms = 'dribble'; const d = P(1 - sg.team, Math.min(sg.who, C.match.teams[1 - sg.team].players.length - 1)); moveTo(d, side * 1.5, 7.2); sfx('squeak'); });
        wait(0.45);
        break;
      }
      case 'post': {
        call(() => { const side = me.x >= 0 ? 1 : -1; moveTo(me, side * 4.5, 8.5); me.arms = 'dribble'; const d = P(1 - sg.team, Math.min(sg.who, C.match.teams[1 - sg.team].players.length - 1)); moveTo(d, side * 3.8, 7.2); });
        wait(0.5);
        break;
      }
      case 'shot': queueShot(sg, me); break;
      case 'rebound': {
        call(() => {
          const r = P(sg.team, sg.who);
          const land = { x: (Math.random() - 0.5) * 10, y: 7 + Math.random() * 6 };
          moveTo(r, land.x, land.y);
          ballArc(ballPos(), () => ({ x: land.x, y: land.y, z: 8.4 }), 0.45, 4, () => { giveBall(r); r.arms = 'idle'; });
          jump(r, 2.4, 0.5);
          if (sg.off) floater('OFF. BOARD', land.x, land.y, 10, '#ffd23f', 0.8);
        });
        wait(0.6);
        break;
      }
      case 'foul': {
        call(() => { sfx('whistle'); floater('FOUL', me.x, me.y, 8, '#ffd23f', 1); });
        wait(0.45);
        break;
      }
      case 'ft': {
        const sh = P(sg.team, sg.who);
        call(() => {
          moveTo(sh, 0, 19); giveBall(sh); sh.arms = 'idle';
          let k = 0;
          for (const p of C.players) { if (p === sh) continue; const sd = k % 2 ? 1 : -1; const rowY = 8 + Math.floor(k / 2) * 3.2; moveTo(p, sd * 9, rowY); p.arms = 'idle'; p.facing = 'hoop'; k++; }
        });
        wait(0.55);
        sg.shots.forEach((made, i) => {
          call(() => { sh.arms = 'shoot'; ballArc(hand(sh), () => rimPos(), 0.55, 5, () => resolveShot(made, 1, sg.team, sh, 'ft')); });
          wait(0.85);
          call(() => { sh.arms = 'idle'; if (i < sg.shots.length - 1) giveBall(sh); });
          wait(0.1);
        });
        break;
      }
      case 'reset': wait(0.2); break;
      default: break;
    }
  }

  function queueShot(sg, me) {
    const kind = sg.kind;
    const defTeam = 1 - sg.team;
    const blocker = sg.blockedBy !== undefined ? P(defTeam, sg.blockedBy) : null;
    if (kind === 'three' || kind === 'mid') {
      call(() => {
        if (kind === 'three') {
          const dist = Math.hypot(me.tx - HOOP.x, me.ty - HOOP.y);
          if (dist < 24.3) { const a = Math.atan2(me.ty - HOOP.y, me.tx - HOOP.x); moveTo(me, HOOP.x + Math.cos(a) * 24.5, Math.max(HOOP.y + 1, HOOP.y + Math.sin(a) * 24.5)); }
        } else {
          const a = Math.atan2(me.ty - HOOP.y, me.tx - HOOP.x); moveTo(me, HOOP.x + Math.cos(a) * 15, Math.max(HOOP.y + 1, HOOP.y + Math.sin(a) * 15));
        }
      });
      wait(0.3);
      call(() => { me.arms = 'shoot'; jump(me, 1.8, 0.55); if (blocker) { moveTo(blocker, me.x, me.y - 1.2); jump(blocker, 2.6, 0.55); blocker.arms = 'block'; } });
      wait(0.22);
      if (blocker) {
        call(() => blockBall(me, blocker, sg));
        wait(0.55);
      } else {
        call(() => ballArc(hand(me), () => rimPos(), kind === 'three' ? 0.8 : 0.65, kind === 'three' ? 9 : 7, () => resolveShot(sg.made, sg.pts, sg.team, me, kind)));
        wait(kind === 'three' ? 0.95 : 0.8);
        call(() => { me.arms = sg.made ? (sg.team === 0 ? 'point' : 'idle') : 'idle'; });
      }
    } else if (kind === 'dunk') {
      call(() => { moveTo(me, HOOP.x + (me.x > 0 ? 0.8 : -0.8), HOOP.y + 1.6); me.spd = 18; });
      wait(0.25);
      call(() => { me.arms = 'dunk'; jump(me, 3.3, 0.7); if (blocker) { moveTo(blocker, me.x * 0.4, HOOP.y + 0.6); jump(blocker, 3.2, 0.6); blocker.arms = 'block'; } });
      wait(0.3);
      if (blocker) { call(() => blockBall(me, blocker, sg)); wait(0.55); }
      else {
        call(() => ballArc(hand(me), () => ({ x: HOOP.x, y: HOOP.y, z: HOOP.z }), 0.12, 0.2, () => resolveShot(sg.made, sg.pts, sg.team, me, 'dunk')));
        wait(0.5);
      }
      call(() => { me.spd = 9; me.arms = 'idle'; });
    } else {
      // layup / post / putback
      call(() => { if (kind !== 'putback') moveTo(me, HOOP.x + (me.x > 0 ? 2.5 : -2.5), HOOP.y + 3); });
      wait(kind === 'putback' ? 0.1 : 0.25);
      call(() => { me.arms = 'shoot'; jump(me, kind === 'putback' ? 2.4 : 2.2, 0.55); if (blocker) { moveTo(blocker, me.x * 0.6, me.y - 1); jump(blocker, 3, 0.55); blocker.arms = 'block'; } });
      wait(0.2);
      if (blocker) { call(() => blockBall(me, blocker, sg)); wait(0.55); }
      else {
        call(() => ballArc(hand(me), () => rimPos(), 0.42, 2.2, () => resolveShot(sg.made, sg.pts, sg.team, me, kind)));
        wait(0.6);
      }
      call(() => { me.arms = 'idle'; });
    }
  }

  function blockBall(shooter, blocker, sg) {
    const land = { x: blocker.x + (Math.random() < 0.5 ? -8 : 8), y: 10 + Math.random() * 10 };
    ballArc(hand(shooter), () => ({ x: land.x, y: land.y, z: 0.4 }), 0.5, 2, () => {});
    floater('REJECTED!', blocker.x, blocker.y, 10, sg.team === 1 ? '#38d996' : '#ff5a5a', 1.25);
    sfx('block');
    burst(shooter.x, shooter.y, 8, ['#ffffff', '#3aa8ff', '#ffd23f'], 14, 140);
    C.shake = Math.max(C.shake, 5);
    excite(sg.team === 1 ? 0.8 : 0.3, sg.team === 1);
  }

  function resolveShot(made, pts, team, shooter, kind) {
    if (made) {
      ballArc({ x: HOOP.x, y: HOOP.y, z: HOOP.z }, () => ({ x: HOOP.x, y: HOOP.y + 0.6, z: 0.5 }), 0.32, -0.2, () => { C.ball.flight = null; });
      C.net = 1;
      const home = team === 0;
      if (kind === 'dunk') {
        C.rimShake = 1; C.shake = Math.max(C.shake, 10); C.flash = 0.35;
        sfx('dunk');
        burst(HOOP.x, HOOP.y, HOOP.z, ['#ffd23f', '#ff6a1f', '#ffffff'], 30, 220);
        floater(U.pick(['SLAM!', 'POSTERIZED!', 'BOOM!', 'JAM!']), HOOP.x, HOOP.y, 14, '#ffd23f', 1.5);
      } else {
        sfx(Math.random() < 0.65 ? 'swish' : 'rimin');
        if (kind === 'three') { floater(Math.random() < 0.5 ? 'SPLASH!' : 'FROM DOWNTOWN!', HOOP.x, HOOP.y, 14, '#5cf2ff', 1.2); burst(HOOP.x, HOOP.y, HOOP.z, ['#5cf2ff', '#ffffff'], 16, 140); }
      }
      floater('+' + pts, shooter.x, shooter.y, 8.5, home ? '#38d996' : '#ff8a8a', 1);
      excite(home ? (kind === 'dunk' || kind === 'three' ? 1 : 0.7) : 0.25, home);
      if (home) shooter.celebrate = { t: 0, style: 'quick' };
    } else {
      sfx('rim');
      C.rimShake = 0.4;
      ballArc({ x: HOOP.x, y: HOOP.y, z: HOOP.z }, () => ({ x: HOOP.x + (Math.random() - 0.5) * 8, y: HOOP.y + 3 + Math.random() * 5, z: 8 }), 0.3, 1.5, () => {});
      if (team === 0) excite(0.1, false);
    }
  }

  function excite(v, cheer) {
    C.excite = Math.min(1.4, C.excite + v);
    if (cheer) sfx('cheer', { v: Math.min(1, v) });
    else if (v > 0.15) sfx('groan');
  }

  // Instant (non-featured) possession: small toast on the court
  function quickEvent(ev) {
    if (!ev || ev.pts <= 0) return;
    const team = ev.off;
    C.floaters.push({ text: (team === 0 ? '+' : 'Opp +') + ev.pts, x: C.W * (team === 0 ? 0.25 : 0.75), y: C.H * 0.42, t: 0, life: 0.8, color: team === 0 ? '#38d996' : '#ff8a8a', size: 0.7 });
  }

  function celebrate(winner, done) {
    C.tasks = [];
    call(() => {
      C.ball.holder = null;
      ballArc(ballPos(), () => ({ x: 0, y: 20, z: 0.4 }), 0.6, 3, () => {});
      for (const p of C.players) {
        if (p.team === winner) { p.celebrate = { t: 0, style: p.info.celebration || 'fist' }; p.arms = 'up'; moveTo(p, p.tx * 0.6, p.ty * 0.8 + 6); }
        else { p.slump = 1; p.arms = 'idle'; moveTo(p, p.tx, p.ty + 3); }
      }
      if (winner === 0) { confetti(C.reduceMotion ? 30 : 110); C.excite = 1.4; }
    });
    wait(2.4);
    call(() => { if (done) done(); });
  }
  function clearTasks() { C.tasks = []; }

  // ---------- Update ----------
  function update(dtReal) {
    const dt = Math.min(0.1, dtReal) * C.speed;
    C.time += dt;
    // tasks
    let budget = dt;
    let guard = 0;
    while (C.tasks.length && guard++ < 50) {
      const tk = C.tasks[0];
      if (!tk.started) { tk.started = true; if (tk.start) tk.start(); }
      const need = tk.dur - tk.t;
      if (budget >= need) { budget -= need; tk.t = tk.dur; if (tk.end) tk.end(); C.tasks.shift(); }
      else { tk.t += budget; budget = 0; break; }
    }
    // players
    for (const p of C.players) {
      const dx = p.tx - p.x, dy = p.ty - p.y;
      const d = Math.hypot(dx, dy);
      const step = p.spd * dt;
      if (d > 0.02) { const k = Math.min(1, step / d); p.x += dx * k; p.y += dy * k; p.phase += dt * 14; p.moving = true; }
      else p.moving = false;
      if (p.jumpT >= 0) {
        p.jumpT += dt / p.jumpDur;
        p.z = Math.sin(Math.min(1, p.jumpT) * Math.PI) * p.jumpH;
        if (p.jumpT >= 1) { p.jumpT = -1; p.z = 0; }
      }
      if (p.celebrate) {
        p.celebrate.t += dt;
        const st = p.celebrate.style;
        if (st === 'quick') { if (p.celebrate.t > 0.6) p.celebrate = null; }
        else if (p.jumpT < 0 && (st === 'fist' || st === 'sky' || st === 'flip' || st === 'flex')) jump(p, st === 'flip' ? 3 : 1.6, st === 'flip' ? 0.7 : 0.45);
      }
      if (p.slump > 0 && !C.match) p.slump = 0;
    }
    // ball
    const b = C.ball;
    if (b) {
      if (b.flight) {
        const f = b.flight;
        f.t += dt / f.dur;
        const to = typeof f.to === 'function' ? f.to() : f.to;
        const k = Math.min(1, f.t);
        b.x = U.lerp(f.from.x, to.x, k); b.y = U.lerp(f.from.y, to.y, k);
        b.z = U.lerp(f.from.z, to.z, k) + Math.sin(k * Math.PI) * f.peak;
        if (f.t >= 1) { b.flight = null; const cb = f.onLand; if (cb) cb(); }
      } else if (b.holder) {
        const h = hand(b.holder);
        b.x = h.x; b.y = h.y;
        if (b.holder.arms === 'dribble' || (b.holder.moving && b.holder.arms !== 'shoot' && b.holder.arms !== 'dunk')) {
          const ph = (C.time * 3.2) % 1;
          b.z = 0.5 + Math.abs(Math.cos(ph * Math.PI)) * 2.3;
          if (ph < b.lastPh) sfx('bounce', { v: 0.5 });
          b.lastPh = ph;
        } else b.z = h.z;
      } else if (b.z > 0.45) { b.z = Math.max(0.45, b.z - dt * 20); }
    }
    // fx decay
    C.excite = Math.max(0.2, C.excite - dtReal * 0.25);
    C.shake = Math.max(0, C.shake - dtReal * 30);
    C.net = Math.max(0, C.net - dtReal * 2.5);
    C.rimShake = Math.max(0, C.rimShake - dtReal * 2.5);
    C.flash = Math.max(0, C.flash - dtReal * 1.6);
    for (const p of C.particles) {
      p.t += dtReal; p.vy += p.g * dtReal; p.x += p.vx * dtReal; p.y += p.vy * dtReal;
      if (p.conf) { p.rot += dtReal * 6; p.vx += Math.sin(C.time * 3 + p.rot) * 20 * dtReal; }
    }
    C.particles = C.particles.filter((p) => p.t < p.life && p.y < C.H + 20);
    for (const f of C.floaters) f.t += dtReal;
    C.floaters = C.floaters.filter((f) => f.t < f.life);
    if (C.banner) { C.banner.t += dtReal; if (C.banner.t > C.banner.life) C.banner = null; }
  }

  // ---------- Draw ----------
  function draw() {
    const g = C.ctx;
    if (!g || !C.bg) return;
    g.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
    const sh = C.reduceMotion ? 0 : C.shake;
    const ox = (Math.random() - 0.5) * sh, oy = (Math.random() - 0.5) * sh;
    g.save();
    g.translate(ox, oy);
    g.drawImage(C.bg, 0, 0, C.W, C.H);
    drawCrowd(g);
    drawHoopBack(g);
    const ents = C.players.slice().sort((a, b) => a.y - b.y);
    const b = C.ball;
    const ballNearRim = b && b.y < 7 && b.z > 8.5;
    for (const p of ents) drawPlayer(g, p);
    if (b && b.vis && !ballNearRim) drawBall(g, b);
    if (ballNearRim) drawBall(g, b);
    drawHoopFront(g);
    // particles
    for (const p of C.particles) {
      const a = 1 - p.t / p.life;
      g.globalAlpha = Math.max(0, a);
      g.fillStyle = p.c;
      if (p.conf) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); g.restore(); }
      else { g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill(); }
    }
    g.globalAlpha = 1;
    for (const f of C.floaters) {
      const k = f.t / f.life;
      const sc = (0.6 + U.easeOutBack(Math.min(1, f.t * 4)) * 0.6) * f.size;
      g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      g.font = '400 ' + Math.round(22 * sc) + 'px "Bebas Neue", Impact, sans-serif';
      g.textAlign = 'center';
      g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.65)';
      g.strokeText(f.text, f.x, f.y - k * 26);
      g.fillStyle = f.color;
      g.fillText(f.text, f.x, f.y - k * 26);
    }
    g.globalAlpha = 1;
    if (C.banner) {
      const bn = C.banner, k = bn.t / bn.life;
      const a = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
      g.globalAlpha = a;
      g.fillStyle = 'rgba(8,10,20,.72)';
      g.fillRect(0, C.H * 0.42 - 26, C.W, 52);
      g.font = '400 30px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center';
      g.fillStyle = bn.color || '#ffd23f';
      g.fillText(bn.text, C.W / 2, C.H * 0.42 + 4);
      if (bn.sub) { g.font = '600 12px "Barlow Condensed", sans-serif'; g.fillStyle = '#fff'; g.fillText(bn.sub, C.W / 2, C.H * 0.42 + 20); }
      g.globalAlpha = 1;
    }
    g.restore();
    if (C.flash > 0) { g.fillStyle = 'rgba(255,240,200,' + C.flash * 0.5 + ')'; g.fillRect(0, 0, C.W, C.H); }
  }
  function showBanner(text, sub, color, life) { C.banner = { text, sub, color, t: 0, life: life || 1.8 }; }

  function drawCrowd(g) {
    const ex = C.excite;
    for (const c of C.crowd) {
      const bob = C.reduceMotion ? 0 : Math.max(0, Math.sin(C.time * (2 + ex * 6) + c.ph)) * c.amp * ex * c.r * 0.9;
      const y = c.y - bob;
      g.fillStyle = c.shirt; g.fillRect(c.x - c.r * 1.1, y + c.r * 0.6, c.r * 2.2, c.r * 1.8);
      g.fillStyle = c.skin; g.beginPath(); g.arc(c.x, y, c.r, 0, 6.283); g.fill();
      if (ex > 0.9 && c.ph > 4.5) { g.strokeStyle = c.skin; g.lineWidth = c.r * 0.5; g.beginPath(); g.moveTo(c.x - c.r, y + c.r); g.lineTo(c.x - c.r * 1.6, y - c.r * 1.2); g.moveTo(c.x + c.r, y + c.r); g.lineTo(c.x + c.r * 1.6, y - c.r * 1.2); g.stroke(); }
    }
  }

  function drawHoopBack(g) {
    const pole0 = proj(0, -1.2, 0), pole1 = proj(0, -1.2, 11.5), arm = proj(0, 3.6, 11.5);
    g.strokeStyle = '#2a2f3a'; g.lineWidth = Math.max(3, pole0.s * 0.5);
    g.beginPath(); g.moveTo(pole0.x, pole0.y); g.lineTo(pole1.x, pole1.y); g.lineTo(arm.x, arm.y); g.stroke();
    // backboard
    const rs = C.rimShake * Math.sin(C.time * 60) * 0.15;
    const tl = proj(-3 + rs, 4, 13.5), br = proj(3 + rs, 4, 9.6);
    g.fillStyle = C.theme.stands === 'fence' ? 'rgba(235,235,235,.95)' : 'rgba(220,240,255,.55)';
    g.fillRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    g.strokeStyle = '#fff'; g.lineWidth = 2; g.strokeRect(tl.x, tl.y, br.x - tl.x, br.y - tl.y);
    const s1 = proj(-1, 4, 11.5), s2 = proj(1, 4, 10);
    g.strokeStyle = '#e8263f'; g.lineWidth = 2; g.strokeRect(s1.x, s1.y, s2.x - s1.x, s2.y - s1.y);
    // back rim
    const r = proj(HOOP.x, HOOP.y, HOOP.z + rs * 3);
    g.strokeStyle = '#ff5a1f'; g.lineWidth = Math.max(2, r.s * 0.18);
    g.beginPath(); g.ellipse(r.x, r.y, r.s * 0.78, r.s * 0.26, 0, Math.PI, 2 * Math.PI); g.stroke();
  }
  function drawHoopFront(g) {
    const rs = C.rimShake * Math.sin(C.time * 60) * 0.15;
    const r = proj(HOOP.x, HOOP.y, HOOP.z + rs * 3);
    const w = r.s * 0.78, h = r.s * 0.26;
    // net
    const sway = C.net * Math.sin(C.time * 30) * r.s * 0.12;
    const depth = r.s * (1.5 + C.net * 0.4);
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1;
    const n = 8;
    for (let i = 0; i <= n; i++) {
      const a = Math.PI * i / n;
      const x0 = r.x - Math.cos(a) * w, y0 = r.y + Math.sin(a) * h;
      const x1 = r.x - Math.cos(a) * w * 0.55 + sway, y1 = r.y + depth + Math.sin(a) * h * 0.5;
      g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke();
    }
    for (let k = 1; k <= 3; k++) {
      const t = k / 3.5;
      g.beginPath(); g.ellipse(r.x + sway * t, r.y + depth * t, w * (1 - 0.45 * t), h * (1 - 0.4 * t), 0, 0, Math.PI); g.stroke();
    }
    g.strokeStyle = '#ff5a1f'; g.lineWidth = Math.max(2, r.s * 0.18);
    g.beginPath(); g.ellipse(r.x, r.y, w, h, 0, 0, Math.PI); g.stroke();
  }

  function drawBall(g, b) {
    const sp = proj(b.x, b.y, 0);
    const p = proj(b.x, b.y, b.z);
    const r = Math.max(3, p.s * 0.48);
    g.fillStyle = 'rgba(0,0,0,' + (0.35 - Math.min(0.25, b.z * 0.02)) + ')';
    g.beginPath(); g.ellipse(sp.x, sp.y, r * (1 - Math.min(0.5, b.z * 0.04)), r * 0.35, 0, 0, 6.283); g.fill();
    drawBallAt(g, p.x, p.y, r, C.time * 6);
  }
  function drawBallAt(g, x, y, r, rot) {
    const grd = g.createRadialGradient(x - r * 0.35, y - r * 0.35, r * 0.1, x, y, r);
    grd.addColorStop(0, '#ffb066'); grd.addColorStop(1, '#d9531e');
    g.fillStyle = grd; g.beginPath(); g.arc(x, y, r, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(40,15,5,.85)'; g.lineWidth = Math.max(0.8, r * 0.12);
    g.beginPath(); g.arc(x, y, r, 0, 6.283); g.stroke();
    g.save(); g.translate(x, y); g.rotate(rot || 0);
    g.beginPath(); g.moveTo(-r, 0); g.lineTo(r, 0); g.moveTo(0, -r); g.lineTo(0, r); g.stroke();
    g.beginPath(); g.arc(-r * 1.25, 0, r * 0.85, -0.85, 0.85); g.stroke();
    g.beginPath(); g.arc(r * 1.25, 0, r * 0.85, Math.PI - 0.85, Math.PI + 0.85); g.stroke();
    g.restore();
  }

  function drawPlayer(g, p) {
    const info = p.info;
    const look = info.look || {};
    const sp = proj(p.x, p.y, 0);
    const s = sp.s * (info.pos === 'C' ? 1.08 : info.pos === 'PF' ? 1.04 : info.pos === 'PG' ? 0.95 : 1);
    const base = proj(p.x, p.y, p.z);
    const x = base.x;
    let y = base.y;
    const skin = D.skinTones[look.skin] || '#c68a5a';
    const jersey = p.colors[0], trim = p.colors[1];
    const gear = info.gear || {};
    const shoe = gear.shoes !== undefined ? D.rarities[gear.shoes].color : look.shoe || '#fff';
    const flip = p.celebrate && p.celebrate.style === 'flip' && p.z > 0.3;
    // shadow
    g.fillStyle = 'rgba(0,0,0,' + (0.32 - Math.min(0.2, p.z * 0.05)) + ')';
    g.beginPath(); g.ellipse(sp.x, sp.y, s * 1.05, s * 0.34, 0, 0, 6.283); g.fill();
    if (info.rarity >= 4 && p.team === 0) {
      g.strokeStyle = D.rarities[info.rarity].color; g.globalAlpha = 0.55 + 0.25 * Math.sin(C.time * 4); g.lineWidth = 2;
      g.beginPath(); g.ellipse(sp.x, sp.y, s * 1.3, s * 0.44, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1;
    }
    if (useSprites()) { drawSpritePlayer(g, p, x, y, flip, look, gear, shoe); return; }
    g.save();
    g.translate(x, y);
    if (flip) g.rotate(((p.jumpT) % 1) * Math.PI * 2);
    if (p.slump) g.rotate(0.06);
    const sway = p.celebrate && p.celebrate.style === 'shimmy' ? Math.sin(C.time * 18) * s * 0.25 : p.celebrate && p.celebrate.style === 'spin' ? Math.sin(C.time * 10) * s * 0.4 : 0;
    g.translate(sway, 0);
    const legSw = p.moving ? Math.sin(p.phase) * s * 0.35 : 0;
    const hip = -s * 3.0, shoulder = -s * 5.25, headY = -s * 5.95;
    // legs
    g.strokeStyle = skin; g.lineCap = 'round'; g.lineWidth = s * 0.42;
    g.beginPath(); g.moveTo(-s * 0.35, hip); g.lineTo(-s * 0.4 + legSw, -s * 0.35); g.moveTo(s * 0.35, hip); g.lineTo(s * 0.4 - legSw, -s * 0.35); g.stroke();
    if (gear.compression !== undefined) { g.strokeStyle = '#1a1d26'; g.lineWidth = s * 0.44; g.beginPath(); g.moveTo(s * 0.35, hip + s * 0.6); g.lineTo(s * 0.38 - legSw * 0.5, -s * 1.4); g.stroke(); }
    // shoes
    g.fillStyle = shoe;
    roundRect(g, -s * 0.75 + legSw, -s * 0.45, s * 0.7, s * 0.38, s * 0.15); g.fill();
    roundRect(g, s * 0.05 - legSw, -s * 0.45, s * 0.7, s * 0.38, s * 0.15); g.fill();
    // shorts
    g.fillStyle = trim;
    g.beginPath(); g.moveTo(-s * 0.85, hip - s * 0.5); g.lineTo(s * 0.85, hip - s * 0.5); g.lineTo(s * 0.95, hip + s * 0.9); g.lineTo(s * 0.08, hip + s * 0.9); g.lineTo(0, hip + s * 0.4); g.lineTo(-s * 0.08, hip + s * 0.9); g.lineTo(-s * 0.95, hip + s * 0.9); g.closePath(); g.fill();
    g.fillStyle = jersey; g.fillRect(-s * 0.9, hip + s * 0.6, s * 0.18, s * 0.3); g.fillRect(s * 0.72, hip + s * 0.6, s * 0.18, s * 0.3);
    // arms (behind torso when idle)
    const arm = (side, hx, hy) => {
      g.strokeStyle = skin; g.lineWidth = s * 0.32;
      g.beginPath(); g.moveTo(side * s * 0.85, shoulder + s * 0.25); g.lineTo(hx, hy); g.stroke();
      if (gear.wristband !== undefined && side > 0) { g.strokeStyle = D.rarities[gear.wristband].color; g.lineWidth = s * 0.36; g.beginPath(); const mx = U.lerp(side * s * 0.85, hx, 0.8), my = U.lerp(shoulder, hy, 0.8); g.moveTo(mx, my); g.lineTo(U.lerp(side * s * 0.85, hx, 0.9), U.lerp(shoulder, hy, 0.9)); g.stroke(); }
    };
    const pose = p.arms;
    let L, R;
    if (pose === 'shoot' || pose === 'dunk') { L = [-s * 0.4, shoulder - s * 2.0]; R = [s * 0.3, shoulder - s * 2.2]; }
    else if (pose === 'up' || (p.celebrate && p.celebrate.style !== 'quick')) {
      const st = p.celebrate ? p.celebrate.style : 'fist';
      if (st === 'flex') { L = [-s * 1.6, shoulder - s * 0.9]; R = [s * 1.6, shoulder - s * 0.9]; }
      else if (st === 'sky') { L = [-s * 0.3, shoulder - s * 2.2]; R = [s * 0.3, shoulder - s * 2.2]; }
      else { L = [-s * 1.1, shoulder - s * 1.8]; R = [s * 1.1, shoulder - s * 1.8 + Math.sin(C.time * 12) * s * 0.3]; }
    }
    else if (pose === 'block') { L = [-s * 0.6, shoulder - s * 2.3]; R = [s * 0.6, shoulder - s * 2.3]; }
    else if (pose === 'defend') { L = [-s * 1.6, shoulder + s * 0.6]; R = [s * 1.6, shoulder + s * 0.6]; }
    else if (pose === 'point') { L = [-s * 0.9, shoulder + s * 1.6]; R = [s * 0.6, shoulder - s * 1.9]; }
    else if (pose === 'pass') { L = [-s * 0.5, shoulder + s * 0.4]; R = [s * 1.3, shoulder + s * 0.2]; }
    else { const dr = (p.team === 0 ? 1 : -1); L = [-s * 0.95 * dr, -s * 2.6]; R = [s * 1.05 * dr, -s * 2.4]; }
    arm(-1, L[0], L[1]);
    // torso
    g.fillStyle = jersey;
    g.beginPath(); g.moveTo(-s * 0.95, shoulder); g.quadraticCurveTo(0, shoulder - s * 0.3, s * 0.95, shoulder); g.lineTo(s * 0.8, hip - s * 0.35); g.lineTo(-s * 0.8, hip - s * 0.35); g.closePath(); g.fill();
    g.strokeStyle = trim; g.lineWidth = s * 0.12; g.stroke();
    if (p.facing !== 'cam') {
      g.fillStyle = trim; g.font = '400 ' + Math.max(7, Math.round(s * 1.25)) + 'px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center';
      g.fillText(String(info.number), 0, shoulder + s * 1.45);
    } else {
      g.fillStyle = trim; g.globalAlpha = 0.6; g.fillRect(-s * 0.2, shoulder + s * 0.35, s * 0.4, s * 0.12); g.globalAlpha = 1;
    }
    arm(1, R[0], R[1]);
    // neck + head
    g.fillStyle = skin;
    g.fillRect(-s * 0.18, shoulder - s * 0.45, s * 0.36, s * 0.5);
    g.beginPath(); g.arc(0, headY, s * 0.5, 0, 6.283); g.fill();
    // hair
    const hc = look.hairColor || '#111';
    g.fillStyle = hc;
    switch (look.hair) {
      case 'afro': g.beginPath(); g.arc(0, headY - s * 0.2, s * 0.75, 0, 6.283); g.fill(); break;
      case 'bald': break;
      case 'mohawk': g.fillRect(-s * 0.12, headY - s * 0.85, s * 0.24, s * 0.6); break;
      case 'flattop': g.fillRect(-s * 0.48, headY - s * 0.95, s * 0.96, s * 0.6); break;
      case 'bun': g.beginPath(); g.arc(0, headY - s * 0.6, s * 0.25, 0, 6.283); g.fill(); g.beginPath(); g.arc(0, headY, s * 0.52, Math.PI, 2 * Math.PI); g.fill(); break;
      case 'locs': case 'braids':
        g.beginPath(); g.arc(0, headY, s * 0.54, Math.PI * 0.95, Math.PI * 2.05); g.fill();
        g.strokeStyle = hc; g.lineWidth = s * 0.14;
        if (p.facing !== 'cam') { for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(i * s * 0.18, headY); g.lineTo(i * s * 0.22, headY + s * 0.9); g.stroke(); } }
        else { g.beginPath(); g.moveTo(-s * 0.5, headY); g.lineTo(-s * 0.55, headY + s * 0.8); g.moveTo(s * 0.5, headY); g.lineTo(s * 0.55, headY + s * 0.8); g.stroke(); }
        break;
      default:
        if (p.facing !== 'cam') { g.beginPath(); g.arc(0, headY - s * 0.04, s * 0.53, Math.PI * 0.85, Math.PI * 2.15); g.fill(); }
        else { g.beginPath(); g.arc(0, headY, s * 0.53, Math.PI, 2 * Math.PI); g.fill(); }
    }
    if (p.facing === 'cam') {
      g.fillStyle = '#1a1210';
      g.fillRect(-s * 0.22, headY + s * 0.02, s * 0.1, s * 0.12); g.fillRect(s * 0.12, headY + s * 0.02, s * 0.1, s * 0.12);
    }
    if (gear.headband !== undefined) { g.fillStyle = D.rarities[gear.headband].color; g.fillRect(-s * 0.52, headY - s * 0.28, s * 1.04, s * 0.18); }
    g.restore();
  }
  // ---------- Optional pixel-sprite players ----------
  // Off by default (BE.sprites.enabled). Draws composited pixel sprites from js/sprites.js at SPRITE_PX css px
  // per sprite pixel instead of the vector figure above. Enabled once an owner-approved sprite set exists.
  const SPRITE_PX = 2;
  function useSprites() { return !!(BE.sprites && BE.sprites.enabled && BE.sprites.available()); }
  const RUN = ['run_a', 'stand', 'run_c', 'stand'];
  function drawSpritePlayer(g, p, x, y, flip, look, gear, shoe) {
    const info = p.info, px = SPRITE_PX;
    const rc = (r) => (r !== undefined ? D.rarities[r].color : undefined);
    const cel = p.celebrate && p.celebrate.style !== 'quick' ? p.celebrate.style : null;
    const inAir = p.z > 0.25;
    const runIdx = Math.floor((((p.phase % 6.2832) + 6.2832) % 6.2832) / 1.5708) & 3;
    const holder = C.ball && C.ball.holder === p;
    let arms = p.arms;
    if (arms === 'up' || (cel && !['shoot', 'dunk', 'block'].includes(arms))) arms = cel === 'flex' ? 'flex' : cel === 'sky' ? 'sky' : 'up';
    else if (!['shoot', 'dunk', 'block', 'defend', 'point', 'pass'].includes(arms)) arms = p.moving && !holder ? (RUN[runIdx] === 'stand' ? 'idle' : RUN[runIdx]) : 'idle';
    const legs = inAir ? 'jump' : p.arms === 'defend' ? 'stance' : p.moving ? RUN[runIdx] : 'stand';
    const mirror = p.team !== 0 && ['idle', 'pass', 'point', 'run_a', 'run_c'].includes(arms);
    const img = BE.sprites.player({
      facing: p.facing === 'cam' ? 'front' : 'back', legs, arms, mirror,
      hair: look.hair || 'buzz', skin: D.skinTones[look.skin] || '#c68a5a', hairColor: look.hairColor || '#111',
      jersey: p.colors[0], trim: p.colors[1], shoe,
      headband: rc(gear.headband), wristband: rc(gear.wristband), compression: gear.compression !== undefined,
      number: info.number,
    });
    if (!img) return;
    const sway = p.celebrate && p.celebrate.style === 'shimmy' ? Math.sin(C.time * 18) * 2 : p.celebrate && p.celebrate.style === 'spin' ? Math.sin(C.time * 10) * 3 : 0;
    const X = Math.round(x / px + sway) * px, Y = Math.round(y / px) * px;
    const [w, h] = BE.sprites.size();
    g.save();
    g.translate(X, Y);
    if (flip) { g.translate(0, -16 * px); g.rotate(Math.round(((p.jumpT % 1) * 8)) * Math.PI / 4); g.translate(0, 16 * px); }
    else if (p.slump) g.rotate(0.08);
    g.imageSmoothingEnabled = false;
    g.drawImage(img, -12 * px, -33 * px, w * px, h * px);
    g.restore();
  }
  function roundRect(g, x, y, w, h, r) {
    g.beginPath(); g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  function busy() { return C.tasks.length > 0; }

  BE.court = {
    C, init, resize, setTheme, startMatch, playEvent, quickEvent, celebrate, clearTasks, update, draw, busy, showBanner, confetti,
    proj, drawPlayer, drawBallAt, roundRect, excite,
  };
})(typeof window !== 'undefined' ? window : globalThis);
