/* Basketball Empire — canvas court: side-view challenger stream with chibi players.
 * Your party of up to five stands on the left. Each player runs their own signature play on the challenger guarding the
 * rim: step-back threes, pull-ups, crossovers into layups and dunks over the top. The defender takes every hit (stumbles,
 * knockback, ankle-breakers) and the bucket finishes it. Broken challengers make way for the next, ending in a boss.
 * The renderer only animates events from js/stream.js; it never decides outcomes. */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data;
  const sfx = (k, o) => BE.audio && BE.audio.play(k, o);
  const INK = '#15121c';

  const C = {
    canvas: null, ctx: null, W: 0, H: 0, dpr: 1, u: 1,
    bg: null, theme: null, world: 0, cos: null,
    players: [], foes: [], leaving: [], balls: [], particles: [], floaters: [], crowd: [], tasks: [],
    shake: 0, excite: 0.2, time: 0, speed: 2, match: null, flash: 0, net: 0, rimShake: 0, reduceMotion: false, banner: null,
    floorTop: 0, rim: { x: 0, y: 0 }, hitstop: 0, streak: 0, streakT: 0,
  };

  const FOE_SPOT = [0.64, 0.86];

  // ---------- Setup ----------
  function init(canvas) { C.canvas = canvas; C.ctx = canvas.getContext('2d'); resize(); }
  function resize() {
    if (!C.canvas) return;
    const r = C.canvas.getBoundingClientRect();
    const dpr = Math.min(2, root.devicePixelRatio || 1);
    const W = Math.max(200, Math.round(r.width)), H = Math.max(160, Math.round(r.height));
    if (W === C.W && H === C.H && dpr === C.dpr && C.bg) return;
    C.W = W; C.H = H; C.dpr = dpr;
    C.canvas.width = W * dpr; C.canvas.height = H * dpr;
    layout();
    buildBackground();
    placeAll();
  }
  function layout() {
    C.u = Math.min(C.H / 230, C.W / 300);
    C.floorTop = Math.round(C.H * 0.5);
    C.rim = { x: C.W * 0.85, y: C.H * 0.36 };
  }
  function setTheme(world, cos) {
    C.world = Math.min(9, world);
    C.cos = cos;
    C.theme = Object.assign({}, D.worlds[C.world].theme, cos && cos.court ? cos.court : {});
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
    drawHoopStand(g);
    C.bg = cv;
    buildCrowd();
  }

  function drawStands(g) {
    const T = C.theme, W = C.W, base = C.floorTop;
    const grd = g.createLinearGradient(0, 0, 0, base);
    grd.addColorStop(0, T.sky[1]); grd.addColorStop(1, T.sky[0]);
    g.fillStyle = grd; g.fillRect(0, 0, W, base + 2);
    const rng = U.mulberry32(77 + C.world);
    if (T.stands === 'fence') {
      for (let i = 0; i < 14; i++) {
        const bw = 20 + rng() * 40, bh = 30 + rng() * base * 0.6, bx = (i / 14) * W - 10 + rng() * 10;
        g.fillStyle = 'rgba(30,20,45,' + (0.55 + rng() * 0.3) + ')';
        g.fillRect(bx, base - bh, bw, bh);
        g.fillStyle = 'rgba(255,214,120,.55)';
        for (let wy = base - bh + 6; wy < base - 8; wy += 9) for (let wx = bx + 4; wx < bx + bw - 4; wx += 8) if (rng() < 0.35) g.fillRect(wx, wy, 3, 4);
      }
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
      if (T.stands !== 'bleachers' && T.stands !== 'marble') {
        for (const sx of [0.15, 0.6]) {
          const lg = g.createLinearGradient(W * sx, 0, W * sx, base);
          lg.addColorStop(0, 'rgba(255,255,255,.16)'); lg.addColorStop(1, 'rgba(255,255,255,0)');
          g.fillStyle = lg; g.beginPath(); g.moveTo(W * sx - 8, 0); g.lineTo(W * sx + 8, 0); g.lineTo(W * sx + 70, base); g.lineTo(W * sx - 70, base); g.fill();
        }
      }
    }
    // ad board along the floor edge
    g.fillStyle = 'rgba(0,0,0,.5)'; g.fillRect(0, base - 12, W, 12);
    g.fillStyle = D.worlds[C.world].color; g.font = '700 9px "Barlow Condensed", sans-serif'; g.textAlign = 'center';
    g.globalAlpha = 0.9;
    const adText = ['BASKETBALL EMPIRE', D.worlds[C.world].arena.toUpperCase(), 'HUSTLE · HEART · HOOPS'];
    for (let i = 0; i < 3; i++) g.fillText(adText[i], W * (i + 0.5) / 3, base - 3);
    g.globalAlpha = 1;
  }

  function drawFloor(g) {
    const T = C.theme, W = C.W, H = C.H, top = C.floorTop;
    g.fillStyle = T.floor; g.fillRect(0, top, W, H - top);
    const rng = U.mulberry32(11 + C.world);
    if (T.stands === 'fence') {
      for (let i = 0; i < 400; i++) { g.fillStyle = rng() < 0.5 ? 'rgba(0,0,0,.12)' : 'rgba(255,255,255,.05)'; g.fillRect(rng() * W, top + rng() * (H - top), 2, 1.5); }
      g.strokeStyle = 'rgba(0,0,0,.35)'; g.lineWidth = 1.2;
      for (let k = 0; k < 4; k++) { let x = rng() * W, y = top + rng() * (H - top); g.beginPath(); g.moveTo(x, y); for (let j = 0; j < 5; j++) { x += rng() * 16 - 8; y += rng() * 6; g.lineTo(x, y); } g.stroke(); }
    } else {
      // planks running toward the viewer, slightly fanned for depth
      const vx = W * 0.5, n = 26;
      for (let i = -4; i < n + 4; i++) {
        if (i & 1) continue;
        const x0 = (i / n) * W, x1 = ((i + 1) / n) * W;
        const k = 0.35;
        g.fillStyle = T.floor2;
        g.beginPath(); g.moveTo(vx + (x0 - vx) * k + (x0 - vx) * (1 - k) * 0.55, top); g.lineTo(vx + (x1 - vx) * k + (x1 - vx) * (1 - k) * 0.55, top); g.lineTo(x1 + (x1 - vx) * 0.25, H); g.lineTo(x0 + (x0 - vx) * 0.25, H); g.closePath(); g.fill();
      }
      const gl = g.createRadialGradient(W * 0.45, top + (H - top) * 0.3, 10, W * 0.45, top + (H - top) * 0.3, W * 0.7);
      gl.addColorStop(0, 'rgba(255,255,255,.14)'); gl.addColorStop(1, 'rgba(255,255,255,0)');
      g.fillStyle = gl; g.fillRect(0, top, W, H - top);
    }
    // paint and arcs around the rim side
    const fy = top + (H - top) * 0.42;
    g.globalAlpha = 0.8; g.fillStyle = T.paint;
    g.beginPath(); g.moveTo(W * 0.74, top + 2); g.lineTo(W * 1.02, top + 2); g.lineTo(W * 1.02, H); g.lineTo(W * 0.66, H); g.closePath(); g.fill();
    g.globalAlpha = 1;
    g.strokeStyle = T.line; g.lineWidth = 2;
    g.beginPath(); g.moveTo(W * 0.74, top + 2); g.lineTo(W * 0.66, H); g.stroke();
    g.beginPath(); g.ellipse(W * 0.7, fy, W * 0.06, (H - top) * 0.3, 0, Math.PI * 0.5, Math.PI * 1.5); g.stroke();
    g.beginPath(); g.ellipse(W * 0.98, fy, W * 0.5, (H - top) * 0.62, 0, Math.PI * 0.62, Math.PI * 1.38); g.stroke();
    g.beginPath(); g.moveTo(0, top + 2); g.lineTo(W, top + 2); g.stroke();
    // centre court logo on the squad's side
    g.font = '400 ' + Math.round(24 * C.u) + 'px "Bebas Neue", Impact, sans-serif';
    g.textAlign = 'center'; g.fillStyle = T.line; g.globalAlpha = 0.28;
    g.fillText(D.worlds[C.world].short.toUpperCase(), W * 0.22, top + (H - top) * 0.36);
    g.globalAlpha = 1;
  }

  function drawHoopStand(g) {
    const u = C.u, r = C.rim, W = C.W;
    const poleX = W * 0.965, base = C.H * 0.9;
    // pad + pole + arm
    g.fillStyle = '#1b1f2a'; g.fillRect(poleX - 9 * u, base - 14 * u, 22 * u, 16 * u);
    g.strokeStyle = '#2a2f3a'; g.lineWidth = 6 * u; g.lineCap = 'round';
    g.beginPath(); g.moveTo(poleX, base - 10 * u); g.lineTo(poleX, r.y - 30 * u); g.lineTo(r.x + 26 * u, r.y - 24 * u); g.stroke();
    // backboard seen edge-on at a slight angle
    const bx = r.x + 22 * u;
    g.fillStyle = C.theme.stands === 'fence' ? 'rgba(235,235,235,.95)' : 'rgba(220,240,255,.6)';
    g.beginPath(); g.moveTo(bx, r.y - 42 * u); g.lineTo(bx + 7 * u, r.y - 46 * u); g.lineTo(bx + 7 * u, r.y + 6 * u); g.lineTo(bx, r.y + 9 * u); g.closePath(); g.fill();
    g.strokeStyle = '#fff'; g.lineWidth = 1.5; g.stroke();
    g.strokeStyle = '#e8263f'; g.lineWidth = 2; g.beginPath(); g.moveTo(bx + 1, r.y - 14 * u); g.lineTo(bx + 1, r.y + 2 * u); g.stroke();
  }

  function buildCrowd() {
    C.crowd = [];
    const T = C.theme;
    if (!T || T.stands === 'cosmic') return;
    const base = C.floorTop;
    const rng = U.mulberry32(500 + C.world);
    const rows = T.stands === 'fence' ? 1 : T.stands === 'bleachers' ? 5 : 7;
    const shirts = ['#ff6a1f', '#2f6bff', '#ffd23f', '#e8263f', '#22c55e', '#ffffff', '#111111', '#b46bff', D.worlds[C.world].color];
    for (let r = 0; r < rows; r++) {
      const y = T.stands === 'fence' ? base - 14 : base * (0.3 + 0.62 * (r + 0.5) / rows);
      const size = T.stands === 'fence' ? 7 : 3.2 + r * 0.55;
      const step = size * 2.3;
      for (let x = rng() * step; x < C.W; x += step) {
        if (rng() > T.crowd + (T.stands === 'fence' ? -0.15 : 0.05)) continue;
        C.crowd.push({ x: x + rng() * 3, y, r: size, skin: D.skinTones[Math.floor(rng() * 8)], shirt: U.pick(shirts, rng), ph: rng() * 6.28, amp: 0.5 + rng() });
      }
    }
  }

  // ---------- Entities ----------
  // Formation: seats in columns (back → front) on the left of the court; from js/stream.js formation()
  function seatPos(seat) {
    const cols = seat.cols, x = cols === 1 ? 0.27 : 0.07 + 0.27 * (seat.col / (cols - 1));
    const ys = seat.rows === 1 ? [0.84] : seat.rows === 2 ? [0.74, 0.95] : [0.7, 0.82, 0.95];
    return [x, ys[Math.min(seat.row, ys.length - 1)]];
  }
  function depthScale(fy) { return 0.86 + (fy - 0.68) * 0.6; }
  function makeActor(info, colors, team) {
    return { info, colors, team, x: 0, y: 0, hx: 0, hy: 0, h: 60, dir: team === 0 ? 1 : -1, z: 0, vz: 0, pose: 'idle', poseT: 0, flash: 0,
      lunge: 0, walk: 0, moving: false, alpha: 1, tilt: 0, celebrate: false, slump: false, ph: Math.random() * 6.28, blink: 2 + Math.random() * 3,
      act: null, kx: 0, fall: 0, turn: 0, charge: 0, hasBall: true, gassed: false };
  }
  const PRESS_LANES = [0.74, 0.86, 0.96], SNIPE_LANES = [0.72, 0.9];
  function foeHome(f) {
    if (f.boss) return [0.6, 0.85];
    if (f.kind === 'sniper') { const k = f.id % SNIPE_LANES.length; return [0.76 + (k ? 0.03 : 0), SNIPE_LANES[k]]; }
    const k = f.id % PRESS_LANES.length; return [0.47 + (k === 1 ? 0.05 : 0), PRESS_LANES[k]];
  }
  function placeAll() {
    const m = C.match;
    C.players.forEach((p, i) => {
      const seat = m && m.seats ? m.seats[i] : { col: 0, cols: 1, row: 0, rows: 1 };
      const sp = seatPos(seat);
      p.seat = seat;
      p.hx = C.W * sp[0] - (p.gassed ? 14 * C.u : 0); p.hy = C.H * sp[1];
      if (!p.placed) { p.x = p.hx; p.y = p.hy; p.placed = true; }
      p.h = 62 * C.u * depthScale(sp[1]);
    });
    for (const f of C.foes) { const sp = foeHome(f); f.hx = C.W * sp[0]; f.hy = C.H * sp[1]; f.h = (f.boss ? 80 : 62) * C.u * (f.boss ? 1 : depthScale(sp[1])); }
  }

  function start(match) {
    C.match = match;
    C.tasks = []; C.floaters = []; C.balls = []; C.banner = null; C.leaving = []; C.foes = []; C.streak = 0; C.hitstop = 0;
    const home = match.teams[0];
    const keep = {};
    for (const p of C.players) if (p.info && p.info.uid) keep[p.info.uid] = p;
    C.players = home.players.map((info) => {
      const old = info.uid && keep[info.uid];
      const a = makeActor(info, home.colors, 0);
      if (old) { a.x = old.x; a.y = old.y; a.placed = true; }
      return a;
    });
    placeAll();
    for (const p of C.players) if (!p.placed) { p.x = p.hx - C.W * 0.4; p.y = p.hy; p.placed = true; }
    C.excite = 0.3;
  }
  function spawnFoe(e) {
    const m = C.match;
    const f = makeActor(e.p, m.teams[1].colors, 1);
    f.id = e.id; f.boss = e.boss; f.kind = e.kind; f.hp = 1;
    C.foes.push(f);
    placeAll();
    f.x = C.W + 30 + Math.random() * 20; f.y = f.hy;
    f.spd = Math.max(60 * C.u, (f.x - f.hx) / Math.max(0.3, e.walk || 1));
    if (f.boss) { showBanner('BOSS', (e.p.first ? e.p.first + ' ' + e.p.last : e.p.name) + ' · ' + m.teams[1].name, '#ff5a5a', 1.6); sfx('buzzer'); C.shake = Math.max(C.shake, 6); }
  }
  function foeById(id) { return C.foes.find((f) => f.id === id) || null; }

  // ---------- Events from the stream ----------
  function foeSpot(id) { const f = foeById(id) || C.foes[0]; return f ? { x: f.hx, y: f.hy, h: f.h, f } : { x: C.W * FOE_SPOT[0], y: C.H * FOE_SPOT[1], h: 64 * C.u, f: null }; }
  function pose(p, k, dur) { p.pose = k; p.poseT = dur; }
  function hitStop(t) { if (!C.reduceMotion) C.hitstop = Math.max(C.hitstop, t); }
  function cheerMates(except, n) {
    const idle = C.players.filter((q) => q !== except && !q.act && !q.gassed);
    for (let i = 0; i < n && idle.length; i++) { const q = idle.splice(Math.floor(Math.random() * idle.length), 1)[0]; pose(q, 'cheer', 0.45); q.vz = 1.4 * q.h; }
  }
  // Each squad player's move is scripted over the stream's flight window, so the hit lands exactly when the ball drops in.
  const MOVES = {
    three: { release: 0.32 },
    mid: { release: 0.27 },
    layup: { release: 0.74 },
    dunk: { release: 0.86 },
  };
  function startMove(p, e) {
    const F = foeSpot(e.target);
    p.act = { kind: e.kind, crit: e.crit, iso: e.iso, t: 0, dur: e.dur, sx: p.x, sy: p.y, fx: F.x, fy: F.y + (Math.random() - 0.5) * 12 * C.u, released: false, juked: false, foe: F.f };
    p.hasBall = true;
    if (e.iso) showBanner('ISO PLAY!', (e.name || 'Your star') + ' takes over', '#ffd23f', 1);
    if (e.kind === 'layup' || e.kind === 'dunk') sfx('squeak', { v: 0.5 });
  }
  function ease(t) { return t < 0 ? 0 : t > 1 ? 1 : t * t * (3 - 2 * t); }
  function seg(t, a, b) { return ease((t - a) / (b - a)); }
  // Position, jump height and pose of a squad player at time t of their move
  function movePose(p, a) {
    const u = C.u, k = a.t / a.dur, dir = p.dir, R = C.rim;
    const feetToHand = p.h * 1.06;
    let x = a.sx, y = a.sy, z = 0, ps = 'idle';
    if (a.kind === 'three') {
      const back = seg(k, 0, 0.25);
      x = a.sx - dir * 12 * u * back;
      if (k > 0.2 && k < 0.6) { z = Math.sin((k - 0.2) / 0.4 * Math.PI) * p.h * 0.28; ps = 'shoot'; }
      else if (k <= 0.2) ps = 'crouch';
    } else if (a.kind === 'mid') {
      const j = seg(k, 0, 0.22);
      x = U.lerp(a.sx, a.fx, 0.28 * j); y = U.lerp(a.sy, a.fy, 0.2 * j);
      if (k > 0.2 && k < 0.6) { z = Math.sin((k - 0.2) / 0.4 * Math.PI) * p.h * 0.3; ps = 'shoot'; }
    } else if (a.kind === 'layup') {
      // dash at the defender, cross over in front of them, then glide in for the layup
      const ax = a.fx - 34 * u, ay = a.fy - 4 * u;
      const bx = a.fx + 12 * u, by = a.fy + 12 * u;
      const cx = R.x - 18 * u, cy = a.fy - 2 * u;
      if (k < 0.35) { const t = seg(k, 0, 0.35); x = U.lerp(a.sx, ax, t); y = U.lerp(a.sy, ay, t); ps = 'run'; }
      else if (k < 0.52) { const t = seg(k, 0.35, 0.52); x = U.lerp(ax, bx, t); y = U.lerp(ay, by, t) + Math.sin(t * Math.PI * 2) * 7 * u; ps = 'run'; }
      else { const t = seg(k, 0.52, 0.8); x = U.lerp(bx, cx, t); y = U.lerp(by, cy, t); const top = Math.max(0, (a.sy - feetToHand) - R.y) * 0.75; z = Math.sin(Math.min(1, (k - 0.52) / 0.45) * Math.PI) * top; ps = k > 0.6 ? 'shoot' : 'run'; }
    } else if (a.kind === 'dunk') {
      // dash, then leap over the defender to the rim and hang
      const ax = a.fx - 42 * u, ay = a.fy;
      const top = Math.max(p.h * 0.5, (a.fy - feetToHand) - (R.y - 10 * u));
      if (k < 0.33) { const t = seg(k, 0, 0.33); x = U.lerp(a.sx, ax, t); y = U.lerp(a.sy, ay, t); ps = k > 0.25 ? 'crouch' : 'run'; }
      else if (k < 0.86) { const t = (k - 0.33) / 0.53; x = U.lerp(ax, R.x - 10 * u, ease(t)); y = U.lerp(ay, a.fy - 6 * u, t); z = Math.sin(Math.min(1, t * 1.05) * Math.PI * 0.5) * top; ps = 'dunk'; }
      else { x = R.x - 10 * u; y = a.fy - 6 * u; const t = (k - 0.86) / 0.14; z = top * (1 - t * t * 0.9); ps = 'dunk'; }
    }
    return { x, y, z, ps };
  }
  function releaseBall(p, a) {
    a.released = true; p.hasBall = false;
    const left = a.dur - a.t;
    const hand = { x: p.x + p.dir * p.h * 0.12, y: p.y - p.z - p.h * 1.08 };
    const peak = a.kind === 'three' ? 0.6 : a.kind === 'mid' ? 0.42 : a.kind === 'layup' ? 0.12 : 0.02;
    C.balls.push({ x0: hand.x, y0: hand.y, t: 0, dur: left, peak: peak * C.H, kind: a.kind, crit: a.crit, iso: a.iso });
  }

  function onEvents(evs) {
    for (const e of evs) {
      if (e.t === 'spawn') spawnFoe(e);
      else if (e.t === 'shot') {
        const p = C.players[e.who];
        if (p) startMove(p, e);
      } else if (e.t === 'hit') {
        if (e.wasted) continue;
        C.net = 1;
        const f = foeById(e.target);
        const shooter = C.players[e.who];
        C.streak = e.streak || 0; C.streakT = 0;
        if (C.streak > 0 && C.streak % 10 === 0) { excite(0.4, true); }
        if (e.kind === 'dunk') {
          C.rimShake = 1; C.shake = Math.max(C.shake, e.crit ? 9 : 5); sfx('dunk');
          burst(C.rim.x, C.rim.y, ['#ffd23f', '#ff6a1f', '#fff'], e.crit ? 22 : 12, 170);
          hitStop(e.crit ? 0.11 : 0.07);
        } else sfx(Math.random() < 0.6 ? 'swish' : 'rimin', { v: 0.5 });
        if (f) {
          f.flash = 0.16;
          // the defender wears every hit
          if (e.kind === 'dunk') { f.kx += 20 * C.u; f.tilt = 0.25; if (e.crit) f.fall = 0.75; }
          else if (e.kind === 'layup') { if (e.crit) { f.fall = 0.75; hitStop(0.08); } else { f.kx += 8 * C.u; f.tilt = 0.15; } }
          else if (e.kind === 'three') { f.turn = 0.35; f.kx += 5 * C.u; }
          else { f.kx += 7 * C.u; f.tilt = 0.12; }
          if (e.crit && e.kind !== 'dunk' && e.kind !== 'layup') hitStop(0.05);
          C.dmgSide = -(C.dmgSide || 1);
          const nx = f.x + C.dmgSide * f.h * 0.42, ny = f.y - f.h * (0.62 + Math.random() * 0.2);
          floater(U.fmt(e.dmg), nx, ny, e.crit ? '#ffb020' : e.kind === 'three' ? '#5cf2ff' : '#ffffff', e.crit ? 1.2 : 0.85);
          if (e.crit) floater({ dunk: 'POSTERIZED!', layup: 'ANKLES!', three: 'SPLASH!', mid: 'COOKED!' }[e.kind], f.x, f.y - f.h * 1.6, '#ffd23f', 0.95);
          f.hp = e.hpMax ? e.hp / e.hpMax : f.hp;
        }
        if (e.crit) cheerMates(shooter, 2);
        excite(e.crit || e.kind === 'dunk' ? 0.14 : 0.04, false);
      } else if (e.t === 'opp') {
        const f = foeById(e.from);
        if (e.big) {
          // boss slam: lands on the whole formation
          if (f) { f.charge = 0; f.act = { kind: 'slam', t: 0, dur: 0.6, tx: C.W * 0.3, ty: f.hy }; }
          for (const i of e.hit || []) { const p = C.players[i]; if (!p) continue; p.flash = 0.2; p.tilt = -0.25; pose(p, 'hurt', 0.5); }
          floater('-' + U.fmt(e.dmg), C.W * 0.2, C.H * 0.55, '#ff4d4d', 1.4);
          floater('BOSS SLAM!', C.W * 0.4, C.H * 0.42, '#ff5a5a', 1.2);
          C.shake = Math.max(C.shake, 12); C.flash = 0.25; hitStop(0.12);
          sfx('dunk');
        } else {
          const p = C.players[e.who];
          if (f && p) {
            if (e.ranged) {
              // sniper: fires a ball from range at any seat
              pose(f, 'shoot', 0.35); f.vz = 0;
              C.balls.push({ opp: true, x0: f.x - f.h * 0.12, y0: f.y - f.h * 1.05, x1: p.x, y1: p.y - p.h * 0.6, t: 0, dur: 0.35 });
            } else { f.act = { kind: e.kind, t: 0, dur: 0.5, tx: p.x + 26 * C.u, ty: p.y }; pose(f, e.kind === 'block' ? 'block' : 'guard', 0.4); }
          }
          if (p) {
            p.flash = 0.18; p.tilt = -0.14; if (!p.act) pose(p, 'hurt', 0.35);
            if (!p.act && !e.ranged) { p.hasBall = false; C.balls.push({ loose: true, x0: p.x + p.dir * p.h * 0.3, y0: p.y - p.h * 0.4, t: 0, dur: 0.5, vx: (Math.random() - 0.2) * 120 * C.u }); setTimeout(() => { p.hasBall = true; }, 700); }
            floater('-' + U.fmt(e.dmg), p.x, p.y - p.h * 1.2, '#ff6b6b', 0.8);
            if (Math.random() < 0.5) floater({ score: 'BLOWN BY!', three: 'FROM DEEP!', steal: 'STRIPPED!', block: 'REJECTED!' }[e.kind], p.x + 30 * C.u, p.y - p.h * 1.55, '#ff8a8a', 0.72);
          }
          C.shake = Math.max(C.shake, e.boss ? 4 : 1.5);
          sfx(e.kind === 'block' ? 'block' : e.kind === 'steal' ? 'steal' : 'rim', { v: 0.5 });
        }
        C.streak = 0;
      } else if (e.t === 'charge') {
        const f = foeById(e.from);
        if (f) { f.charge = e.dur; pose(f, 'crouch', e.dur); }
        showBanner('BIG PLAY INCOMING', 'Lockdown shuts it down', '#ff5a5a', Math.min(1.4, e.dur));
        sfx('whistle');
      } else if (e.t === 'stop') {
        const p = C.players[e.who];
        const f = foeById(e.from);
        if (e.kind === 'lockdown') {
          if (f) { f.charge = 0; f.fall = 0.6; f.flash = 0.3; }
          floater('LOCKED DOWN!', C.W * 0.5, C.H * 0.45, '#3aa8ff', 1.3);
          for (const q of C.players) if (!q.gassed) { pose(q, 'cheer', 0.5); q.vz = 1.5 * q.h; }
          hitStop(0.1); excite(0.8, true);
          continue;
        }
        if (p) { pose(p, 'block', 0.4); p.vz = 2.4 * p.h; floater(e.kind === 'block' ? 'BLOCK!' : 'STEAL!', p.x, p.y - p.h * 1.3, '#38d996', 0.95); }
        if (f && f.kind !== 'sniper') f.act = { kind: 'stuffed', t: 0, dur: 0.45, tx: (p ? p.x : C.W * 0.3) + 34 * C.u, ty: p ? p.y : f.hy };
        sfx(e.kind === 'block' ? 'block' : 'steal');
        excite(0.3, true);
      } else if (e.t === 'gassed') {
        const p = C.players[e.who];
        if (p) { p.gassed = true; p.act = null; p.z = 0; p.hasBall = false; placeAll(); floater('GASSED!', p.x, p.y - p.h * 1.35, '#ff9a5a', 0.9); }
        sfx('groan', { v: 0.6 });
      } else if (e.t === 'back') {
        const p = C.players[e.who];
        if (p) { p.gassed = false; p.hasBall = true; placeAll(); floater('BACK IN!', p.x, p.y - p.h * 1.35, '#38d996', 0.9); pose(p, 'cheer', 0.4); }
      } else if (e.t === 'break') {
        const f = foeById(e.id);
        if (f) {
          f.broken = true; f.hp = 0; f.flash = 0.3; f.act = null; f.charge = 0;
          C.foes.splice(C.foes.indexOf(f), 1);
          C.leaving.push(f);
          floater(e.boss ? 'BOSS DOWN!' : U.pick(['BROKEN!', 'SHOOK!', 'COOKED!', 'NEXT!']), f.x, f.y - f.h * 1.5, '#ffd23f', e.boss ? 1.5 : 1.05);
          burst(f.x, f.y - f.h * 0.6, ['#ffd23f', '#38d996', '#fff'], e.boss ? 40 : 16, e.boss ? 240 : 160);
          C.shake = Math.max(C.shake, e.boss ? 10 : 4);
          hitStop(e.boss ? 0.16 : 0.06);
        }
        cheerMates(null, e.boss ? 5 : 2);
        sfx(e.boss ? 'milestone' : 'cheer', { v: 0.7 });
        excite(e.boss ? 1 : 0.4, true);
      }
    }
  }

  function floater(text, x, y, color, size) { x = U.clamp(x, 44, C.W - 44); C.floaters.push({ text, x, y, t: 0, life: 0.95, color: color || '#fff', size: size || 1, dx: (Math.random() - 0.5) * 14 }); if (C.floaters.length > 40) C.floaters.shift(); }
  function burst(x, y, colors, n, power) {
    if (C.reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2, v = (0.3 + Math.random()) * (power || 160);
      C.particles.push({ x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, life: 0.5 + Math.random() * 0.5, t: 0, c: U.pick(colors), r: 1.5 + Math.random() * 2.2, g: 380 });
    }
  }
  function confetti(n) {
    const colors = ['#ff6a1f', '#ffd23f', '#38d996', '#3aa8ff', '#ff3f7a', '#ffffff', '#b46bff'];
    if (C.reduceMotion) n = Math.ceil(n / 3);
    for (let i = 0; i < n; i++) C.particles.push({ x: Math.random() * C.W, y: -10 - Math.random() * 60, vx: (Math.random() - 0.5) * 60, vy: 40 + Math.random() * 80, life: 2.5 + Math.random(), t: 0, c: U.pick(colors), r: 2 + Math.random() * 2.5, g: 30, conf: true, rot: Math.random() * 6 });
  }
  function excite(v, cheer) {
    C.excite = Math.min(1.4, C.excite + v);
    if (cheer) sfx('cheer', { v: Math.min(1, v) });
  }

  // End of stage: winners celebrate, then `done` runs (game time, so it respects the speed setting)
  function celebrate(winner, done) {
    for (const p of C.players) { if (winner === 0) { p.celebrate = true; } else p.slump = true; }
    if (winner === 0) { confetti(C.reduceMotion ? 20 : 70); C.excite = 1.3; }
    else for (const f of C.foes) pose(f, 'cheer', 1.4);
    C.tasks.push({ t: winner === 0 ? 1.4 : 1.6, fn: () => { for (const p of C.players) { p.celebrate = false; p.slump = false; } if (done) done(); } });
  }
  function clearTasks() { C.tasks = []; }
  function busy() { return C.tasks.length > 0; }

  // ---------- Update ----------
  function update(dtReal) {
    C.time += dtReal;
    for (const f of C.floaters) f.t += dtReal;
    C.floaters = C.floaters.filter((f) => f.t < f.life);
    if (C.banner) { C.banner.t += dtReal; if (C.banner.t > C.banner.life) C.banner = null; }
    if (C.hitstop > 0) { C.hitstop -= dtReal; return; }
    const dt = Math.min(0.1, dtReal) * C.speed;
    C.streakT += dtReal;
    for (let i = C.tasks.length - 1; i >= 0; i--) { const tk = C.tasks[i]; tk.t -= dt; if (tk.t <= 0) { C.tasks.splice(i, 1); tk.fn(); } }
    for (const p of C.players) stepActor(p, dt, dtReal);
    for (const f of C.foes) stepFoe(f, dt, dtReal);
    for (const f of C.leaving) { f.x += dt * 140 * C.u; f.alpha -= dt * 1.3; f.tilt = Math.min(1.2, f.tilt + dt * 3); }
    C.leaving = C.leaving.filter((f) => f.alpha > 0);
    for (const b of C.balls) b.t += dt;
    C.balls = C.balls.filter((b) => b.t < b.dur + 0.25);
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
  }
  function stepActor(p, dt, dtReal) {
    if (p.act) {
      const a = p.act;
      a.t += dt;
      const mp = movePose(p, a);
      p.x = mp.x; p.y = mp.y; p.z = mp.z; p.pose = mp.ps; p.poseT = 0.05;
      p.moving = mp.ps === 'run'; if (p.moving) p.walk += dt * 18;
      if (!a.released && a.t >= a.dur * MOVES[a.kind].release) releaseBall(p, a);
      if (a.kind === 'layup' && !a.juked && a.t >= a.dur * 0.42 && a.foe && C.foes.includes(a.foe)) { a.juked = true; a.foe.kx -= 14 * C.u; a.foe.tilt = -0.3; }
      if (a.t >= a.dur) { p.act = null; p.z = 0; p.vz = 0; p.hasBall = true; p.pose = 'idle'; }
    } else {
      const dx = p.hx - p.x, dy = p.hy - p.y, d = Math.hypot(dx, dy);
      if (d > 1) { const k = Math.min(1, 300 * C.u * dt / d); p.x += dx * k; p.y += dy * k; p.moving = true; p.walk += dt * 14; }
      else p.moving = false;
      if (p.vz > 0 || p.z > 0) { p.z += p.vz * dt; p.vz -= 9 * p.h * dt; if (p.z <= 0) { p.z = 0; p.vz = 0; } }
      if (p.celebrate && p.z === 0 && !C.reduceMotion && !p.gassed) p.vz = 1.6 * p.h;
      if (p.poseT > 0) { p.poseT -= dt; if (p.poseT <= 0) p.pose = 'idle'; }
    }
    p.flash = Math.max(0, p.flash - dtReal);
    p.tilt *= Math.pow(0.02, dt);
    p.blink -= dtReal; if (p.blink < -0.12) p.blink = 2 + Math.random() * 3;
  }
  function stepFoe(f, dt, dtReal) {
    const homeX = f.hx;
    if (f.act) {
      const a = f.act;
      a.t += dt;
      const k = Math.min(1, a.t / a.dur), out = Math.sin(k * Math.PI);
      const reach = a.kind === 'stuffed' ? 0.35 : 1;
      f.x = U.lerp(homeX, a.tx, out * reach); f.y = U.lerp(f.hy, a.ty, out * reach * 0.7);
      f.z = a.kind === 'slam' ? out * f.h * 0.9 : a.kind === 'three' || a.kind === 'block' ? out * f.h * 0.25 : 0;
      f.moving = true; f.walk += dt * 18;
      if (a.t >= a.dur) { f.act = null; f.z = 0; }
    } else {
      const dx = f.hx - f.x, dy = f.hy - f.y, d = Math.hypot(dx, dy);
      if (d > 1) { const k = Math.min(1, (f.spd || 210 * C.u) * dt / d); f.x += dx * k; f.y += dy * k; f.moving = true; f.walk += dt * 12; }
      else f.moving = false;
    }
    f.kx *= Math.pow(0.004, dt);
    if (f.fall > 0) f.fall = Math.max(0, f.fall - dt);
    if (f.turn > 0) f.turn = Math.max(0, f.turn - dt);
    if (f.charge > 0) f.charge = Math.max(0, f.charge - dt);
    if (f.poseT > 0) { f.poseT -= dt; if (f.poseT <= 0) f.pose = 'idle'; }
    f.flash = Math.max(0, f.flash - dtReal);
    f.tilt *= Math.pow(0.02, dt);
    f.blink -= dtReal; if (f.blink < -0.12) f.blink = 2 + Math.random() * 3;
  }

  // ---------- Draw ----------
  function draw() {
    const g = C.ctx;
    if (!g || !C.bg) return;
    g.setTransform(C.dpr, 0, 0, C.dpr, 0, 0);
    const sh = C.reduceMotion ? 0 : C.shake;
    g.save();
    g.translate((Math.random() - 0.5) * sh, (Math.random() - 0.5) * sh);
    g.drawImage(C.bg, 0, 0, C.W, C.H);
    drawCrowd(g);
    drawRimBack(g);
    drawSeats(g);
    const actors = C.players.concat(C.foes, C.leaving).sort((a, b) => a.y - b.y);
    for (const p of actors) drawActor(g, p);
    drawStaminaBars(g);
    for (const b of C.balls) drawFlight(g, b);
    drawRimFront(g);
    for (const f of C.foes) drawFoeBar(g, f);
    drawStreak(g);
    for (const p of C.particles) {
      g.globalAlpha = Math.max(0, 1 - p.t / p.life);
      g.fillStyle = p.c;
      if (p.conf) { g.save(); g.translate(p.x, p.y); g.rotate(p.rot); g.fillRect(-p.r, -p.r * 0.5, p.r * 2, p.r); g.restore(); }
      else { g.beginPath(); g.arc(p.x, p.y, p.r, 0, 6.283); g.fill(); }
    }
    g.globalAlpha = 1;
    for (const f of C.floaters) {
      const k = f.t / f.life;
      const sc = (0.6 + U.easeOutBack(Math.min(1, f.t * 5)) * 0.55) * f.size;
      g.globalAlpha = k > 0.7 ? (1 - k) / 0.3 : 1;
      g.font = '400 ' + Math.round(20 * sc * Math.max(0.85, C.u)) + 'px "Bebas Neue", Impact, sans-serif';
      g.textAlign = 'center';
      g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineJoin = 'round';
      const x = f.x + f.dx * k, y = f.y - k * 24;
      g.strokeText(f.text, x, y);
      g.fillStyle = f.color; g.fillText(f.text, x, y);
    }
    g.globalAlpha = 1;
    if (C.banner) {
      const bn = C.banner, k = bn.t / bn.life;
      g.globalAlpha = k < 0.15 ? k / 0.15 : k > 0.8 ? (1 - k) / 0.2 : 1;
      const by = C.H * 0.46;
      g.fillStyle = 'rgba(8,10,20,.72)'; g.fillRect(0, by - 26, C.W, 52);
      g.font = '400 30px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center';
      g.fillStyle = bn.color || '#ffd23f'; g.fillText(bn.text, C.W / 2, by + 4);
      if (bn.sub) { g.font = '600 12px "Barlow Condensed", sans-serif'; g.fillStyle = '#fff'; g.fillText(bn.sub, C.W / 2, by + 20); }
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
    }
  }

  function rimShakeY() { return C.rimShake * Math.sin(C.time * 60) * 2 * C.u; }
  function drawRimBack(g) {
    const r = C.rim, u = C.u, w = 15 * u, ry = r.y + rimShakeY();
    g.strokeStyle = '#ff5a1f'; g.lineWidth = Math.max(2, 2.6 * u);
    g.beginPath(); g.ellipse(r.x, ry, w, w * 0.3, 0, Math.PI, 2 * Math.PI); g.stroke();
  }
  function drawRimFront(g) {
    const r = C.rim, u = C.u, w = 15 * u, h = w * 0.3, ry = r.y + rimShakeY();
    const sway = C.net * Math.sin(C.time * 30) * 3 * u, depth = (20 + C.net * 5) * u;
    g.strokeStyle = 'rgba(255,255,255,.9)'; g.lineWidth = 1;
    for (let i = 0; i <= 8; i++) {
      const a = Math.PI * i / 8;
      g.beginPath(); g.moveTo(r.x - Math.cos(a) * w, ry + Math.sin(a) * h); g.lineTo(r.x - Math.cos(a) * w * 0.55 + sway, ry + depth + Math.sin(a) * h * 0.5); g.stroke();
    }
    for (let k = 1; k <= 3; k++) { const t = k / 3.5; g.beginPath(); g.ellipse(r.x + sway * t, ry + depth * t, w * (1 - 0.45 * t), h * (1 - 0.4 * t), 0, 0, Math.PI); g.stroke(); }
    g.strokeStyle = '#ff5a1f'; g.lineWidth = Math.max(2, 2.6 * u);
    g.beginPath(); g.ellipse(r.x, ry, w, h, 0, 0, Math.PI); g.stroke();
  }

  // Formation seats on the floor (front column tinted)
  function drawSeats(g) {
    for (const p of C.players) {
      if (!p.seat) continue;
      const front = p.seat.role === 'front';
      g.strokeStyle = front ? 'rgba(255,138,61,.55)' : 'rgba(255,255,255,.28)'; g.lineWidth = 1.5;
      g.setLineDash([3, 3]);
      g.beginPath(); g.ellipse(p.hx + (p.gassed ? 14 * C.u : 0), p.hy, p.h * 0.36, p.h * 0.1, 0, 0, 6.283); g.stroke();
      g.setLineDash([]);
    }
  }
  // Each player's own Stamina under their feet
  function drawStaminaBars(g) {
    const m = C.match;
    if (!m || !m.pl) return;
    C.players.forEach((p, i) => {
      const pl = m.pl[i]; if (!pl) return;
      const w = Math.max(26, p.h * 0.55), h = Math.max(3, 3.5 * C.u), x = p.x - w / 2, y = p.y + 4 * C.u;
      g.fillStyle = 'rgba(0,0,0,.6)'; g.fillRect(x - 1, y - 1, w + 2, h + 2);
      if (pl.gassed) {
        const k = 1 - Math.max(0, pl.rest) / (BE.stream ? BE.stream.CFG.rest : 5);
        g.fillStyle = '#6b7280'; g.fillRect(x, y, w * k, h);
        g.font = '700 ' + Math.round(9 * Math.max(0.9, C.u)) + 'px "Barlow Condensed", sans-serif'; g.textAlign = 'center';
        g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)'; g.strokeText('GASSED', p.x, y - p.h * 1.12); g.fillStyle = '#ff9a5a'; g.fillText('GASSED', p.x, y - p.h * 1.12);
      } else {
        const k = Math.max(0, pl.sta / pl.max);
        g.fillStyle = k < 0.3 ? '#ff4d4d' : k < 0.6 ? '#ffb020' : '#38d996'; g.fillRect(x, y, w * k, h);
      }
    });
  }
  function drawStreak(g) {
    if (C.streak < 3) return;
    const pulse = 1 + Math.max(0, 0.35 - C.streakT * 1.6);
    const hot = C.streak >= 25 ? '#ff5a5a' : C.streak >= 10 ? '#ffb020' : '#ffd23f';
    g.save();
    g.translate(C.W * 0.47, C.H * 0.3);
    g.scale(pulse, pulse);
    g.font = '400 ' + Math.round(22 * Math.max(0.9, C.u)) + 'px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center';
    g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.7)'; g.lineJoin = 'round';
    const t = '×' + C.streak + ' STREAK';
    g.strokeText(t, 0, 0); g.fillStyle = hot; g.fillText(t, 0, 0);
    g.restore();
  }
  function drawFlight(g, b) {
    if (b.opp) {
      const k = Math.min(1, b.t / b.dur);
      const x = U.lerp(b.x0, b.x1, k), y = U.lerp(b.y0, b.y1, k) - Math.sin(k * Math.PI) * 30 * C.u;
      if (k < 1) { g.fillStyle = 'rgba(255,80,80,.35)'; g.beginPath(); g.arc(x, y, 9 * C.u, 0, 6.283); g.fill(); drawBallAt(g, x, y, 5 * C.u, C.time * 14); }
      return;
    }
    if (b.loose) {
      const k = b.t / b.dur;
      const x = b.x0 + b.vx * b.t, y = b.y0 + 60 * C.u * k - Math.sin(k * Math.PI) * 26 * C.u;
      g.globalAlpha = Math.max(0, 1 - Math.max(0, b.t - b.dur) * 4);
      drawBallAt(g, x, y, 5 * C.u, C.time * 12);
      g.globalAlpha = 1;
      return;
    }
    const k = Math.min(1, b.t / b.dur);
    let x, y;
    if (k < 1) {
      x = U.lerp(b.x0, C.rim.x, k);
      y = U.lerp(b.y0, C.rim.y - 4 * C.u, k) - Math.sin(k * Math.PI) * b.peak;
    } else {
      const d = (b.t - b.dur) / 0.25;
      x = C.rim.x; y = C.rim.y + d * 26 * C.u;
    }
    const r = (b.iso ? 6.5 : 5) * C.u;
    if (b.crit && k < 1) { g.fillStyle = 'rgba(255,200,60,.35)'; g.beginPath(); g.arc(x, y, r * 2, 0, 6.283); g.fill(); }
    drawBallAt(g, x, y, r, C.time * 9);
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

  function drawFoeBar(g, f) {
    const u = C.u, w = f.boss ? Math.max(70, 84 * u) : Math.max(34, 42 * u), h = (f.boss ? 6 : 4) * u + 1;
    const x = f.x - w / 2, y = f.y - f.z - f.h * 1.18 - 14 * u;
    const name = f.info.first ? f.info.last || f.info.first : f.info.short || f.info.name;
    g.font = '700 ' + Math.round(10.5 * Math.max(0.9, u)) + 'px "Barlow Condensed", sans-serif'; g.textAlign = 'center';
    g.lineWidth = 3; g.strokeStyle = 'rgba(0,0,0,.75)';
    const label = (f.boss ? '👑 ' : '') + String(name).toUpperCase();
    if (f.boss) { g.strokeText(label, f.x, y - 3); g.fillStyle = '#ffd23f'; g.fillText(label, f.x, y - 3); }
    else if (f.kind === 'sniper') { g.strokeText('◎', f.x - w / 2 - 6, y + h); g.fillStyle = '#ff8a8a'; g.fillText('◎', f.x - w / 2 - 6, y + h); }
    g.fillStyle = 'rgba(0,0,0,.65)'; g.beginPath(); roundRect(g, x - 1, y - 1, w + 2, h + 2, 3); g.fill();
    g.fillStyle = f.boss ? '#ff5a5a' : '#ff8a3d'; g.beginPath(); roundRect(g, x, y, Math.max(0, w * f.hp), h, 2.5); g.fill();
  }

  function drawActor(g, p) {
    const lift = p.z;
    const lungeX = p.kx || 0;
    if (p.charge > 0) {
      const k = 0.5 + 0.5 * Math.sin(C.time * 18);
      g.strokeStyle = 'rgba(255,70,70,' + (0.5 + 0.4 * k) + ')'; g.lineWidth = 3;
      g.beginPath(); g.ellipse(p.x, p.y, p.h * (0.45 + 0.1 * k), p.h * 0.13, 0, 0, 6.283); g.stroke();
      g.font = '400 ' + Math.round(26 * C.u) + 'px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center';
      g.lineWidth = 4; g.strokeStyle = 'rgba(0,0,0,.7)'; g.strokeText('!', p.x, p.y - p.h * 1.45); g.fillStyle = '#ff4d4d'; g.fillText('!', p.x, p.y - p.h * 1.45);
    }
    // shadow
    g.fillStyle = 'rgba(0,0,0,' + (0.3 * p.alpha * (1 - Math.min(0.6, lift / (p.h * 1.5)))) + ')';
    g.beginPath(); g.ellipse(p.x + lungeX, p.y, p.h * 0.3, p.h * 0.08, 0, 0, 6.283); g.fill();
    if (p.team === 0 && p.info.rarity >= 3) {
      g.strokeStyle = D.rarities[p.info.rarity].color; g.globalAlpha = (0.5 + 0.25 * Math.sin(C.time * 4)) * p.alpha; g.lineWidth = 2;
      g.beginPath(); g.ellipse(p.x, p.y, p.h * 0.38, p.h * 0.11, 0, 0, 6.283); g.stroke(); g.globalAlpha = 1;
    }
    if (p.boss) {
      g.globalAlpha = 0.35 + 0.15 * Math.sin(C.time * 5);
      const aura = g.createRadialGradient(p.x, p.y - p.h * 0.5, 4, p.x, p.y - p.h * 0.5, p.h * 0.9);
      aura.addColorStop(0, 'rgba(255,80,80,.9)'); aura.addColorStop(1, 'rgba(255,80,80,0)');
      g.fillStyle = aura; g.beginPath(); g.arc(p.x, p.y - p.h * 0.5, p.h * 0.9, 0, 6.283); g.fill(); g.globalAlpha = 1;
    }
    let ps = p.pose;
    if (p.fall > 0) ps = 'hurt';
    if (p.celebrate) ps = 'cheer';
    else if ((p.slump || p.gassed) && ps === 'idle') ps = 'slump';
    else if (p.team === 1 && ps === 'idle') ps = 'guard';
    // ankle-breaker: the defender drops to the floor and scrambles back up
    const fallK = p.fall > 0 ? Math.sin(Math.min(1, p.fall / 0.75) * Math.PI) : 0;
    const tilt = (p.tilt || 0) + fallK * 1.15 * (p.team === 1 ? 1 : -1);
    const shakeX = p.charge > 0 && !C.reduceMotion ? (Math.random() - 0.5) * 3 : 0;
    const cx = p.x + lungeX + shakeX, cy = p.y - lift + fallK * p.h * 0.12;
    const opts = {
      look: p.info.look || {}, colors: p.colors, number: p.info.number, gear: p.info.gear || {}, dir: p.turn > 0 ? -p.dir : p.dir, pose: ps,
      t: C.time + p.ph, moving: p.moving, walk: p.walk, flash: p.flash > 0, alpha: p.gassed ? 0.6 : p.alpha, tilt, blink: p.blink < 0 || p.gassed, boss: p.boss, broken: p.broken,
      ball: p.team === 0 && p.hasBall && ps !== 'cheer' && ps !== 'hurt', dribble: ps === 'idle' || ps === 'run',
    };
    if (!opts.flash || C.pixel) { opts.flashPx = opts.flash; drawCharacter(g, cx, cy, p.h, opts); return; }
    // hit flash: tint only the character's own pixels
    const L = C.fxLayer || (C.fxLayer = document.createElement('canvas'));
    const bw = Math.ceil(p.h * 2.4), bh = Math.ceil(p.h * 2), d = C.dpr;
    if (L.width < bw * d || L.height < bh * d) { L.width = bw * d; L.height = bh * d; }
    const lg = L.getContext('2d');
    lg.setTransform(1, 0, 0, 1, 0, 0); lg.clearRect(0, 0, L.width, L.height);
    lg.setTransform(d, 0, 0, d, 0, 0);
    opts.flash = false;
    drawChibi(lg, bw / 2, bh * 0.85, p.h, opts);
    lg.globalCompositeOperation = 'source-atop';
    lg.fillStyle = 'rgba(255,255,255,.6)'; lg.fillRect(0, 0, bw, bh);
    lg.globalCompositeOperation = 'source-over';
    g.drawImage(L, 0, 0, bw * d, bh * d, cx - bw / 2, cy - bh * 0.85, bw, bh);
  }

  // ---------- Chibi character ----------
  // Big head (about half the height), readable eyes, brows and mouth, dark outline. Draws at feet (x, y), height h.
  function drawChibi(g, x, y, h, o) {
    const L = o.look, dir = o.dir || 1;
    const skin = D.skinTones[L.skin] || '#c68a5a';
    const skinD = shade(skin, -0.14);
    const hc = L.hairColor || '#16121a';
    const jersey = (o.colors && o.colors[0]) || '#ff6a1f', trim = (o.colors && o.colors[1]) || '#1b1f3a';
    const gear = o.gear || {};
    const rc = (r) => (r !== undefined && D.rarities[r] ? D.rarities[r].color : null);
    const shoe = rc(gear.shoes) || L.shoe || '#ffffff';
    const lw = Math.max(1.2, h * 0.028);
    const R = h * 0.245;
    const bob = o.pose === 'idle' || o.pose === 'guard' ? Math.sin(o.t * 3) * h * 0.012 : 0;
    const crouch = o.pose === 'crouch' ? h * 0.06 : 0;
    const hx = x + dir * h * 0.02, hy = y - h + R + bob + crouch;
    const bodyW = h * (L.build === 'big' ? 0.33 : L.build === 'slim' ? 0.26 : 0.29);
    const shY = hy + R * 0.9, hipY = y - h * 0.27 + crouch * 0.6, footY = y;
    g.save();
    g.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.tilt) { g.translate(x, y); g.rotate(o.tilt * -dir); g.translate(-x, -y); }
    g.lineJoin = 'round'; g.lineCap = 'round';
    const outl = () => { g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); };
    // legs + shoes
    const sw = o.moving ? Math.sin(o.walk) * h * 0.06 : 0;
    const stance = o.pose === 'guard' || o.pose === 'block' ? h * 0.05 : 0;
    for (const side of [-1, 1]) {
      const lx = x + side * (bodyW * 0.28 + stance) + side * sw * (side === 1 ? 1 : -1) * 0;
      const off = side === 1 ? sw : -sw;
      g.fillStyle = side === 1 && gear.compression !== undefined ? '#1a1d26' : skin;
      g.beginPath(); roundRect(g, lx - h * 0.045 + off, hipY, h * 0.09, footY - hipY - h * 0.04, h * 0.03); g.fill(); outl();
      g.fillStyle = shoe;
      g.beginPath(); g.ellipse(lx + off + dir * h * 0.025, footY - h * 0.03, h * 0.075, h * 0.042, 0, 0, 6.283); g.fill(); outl();
    }
    // shorts
    g.fillStyle = trim;
    g.beginPath(); roundRect(g, x - bodyW * 0.55, hipY - h * 0.06, bodyW * 1.1, h * 0.14, h * 0.035); g.fill(); outl();
    // arms
    const arm = (side, front) => {
      const sx = x + side * bodyW * 0.48, sy = shY + h * 0.04;
      let ex, ey;
      switch (o.pose) {
        case 'shoot': case 'dunk': ex = sx + dir * h * 0.04 + side * h * 0.03; ey = hy - R * 1.05; break;
        case 'cheer': ex = sx + side * h * 0.14; ey = hy - R * 0.95 + (side === 1 ? Math.sin(o.t * 14) * h * 0.04 : 0); break;
        case 'block': ex = sx + side * h * 0.08; ey = hy - R * 1.1; break;
        case 'guard': ex = sx + side * h * 0.2; ey = sy + h * 0.06; break;
        case 'hurt': ex = sx - dir * h * 0.12; ey = sy - h * 0.02; break;
        case 'slump': ex = sx + side * h * 0.02; ey = sy + h * 0.2; break;
        case 'crouch': ex = sx + dir * h * 0.12; ey = sy + h * 0.1; break;
        case 'run': ex = sx + side * dir * Math.sin(o.walk) * h * 0.1 + dir * h * 0.05; ey = sy + h * 0.13; break;
        default: ex = sx + dir * h * (front ? 0.13 : 0.06); ey = sy + h * 0.15;
      }
      g.strokeStyle = INK; g.lineWidth = h * 0.085 + lw * 2;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
      g.strokeStyle = skin; g.lineWidth = h * 0.085;
      g.beginPath(); g.moveTo(sx, sy); g.lineTo(ex, ey); g.stroke();
      const wb = rc(gear.wristband);
      if (wb && front) { g.strokeStyle = wb; g.lineWidth = h * 0.095; g.beginPath(); g.moveTo(U.lerp(sx, ex, 0.72), U.lerp(sy, ey, 0.72)); g.lineTo(U.lerp(sx, ex, 0.86), U.lerp(sy, ey, 0.86)); g.stroke(); }
      g.fillStyle = skin; g.beginPath(); g.arc(ex, ey, h * 0.05, 0, 6.283); g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke();
      return { x: ex, y: ey };
    };
    arm(-dir, false);
    // torso (jersey)
    g.fillStyle = jersey;
    g.beginPath();
    g.moveTo(x - bodyW * 0.5, shY); g.quadraticCurveTo(x, shY - h * 0.03, x + bodyW * 0.5, shY);
    g.lineTo(x + bodyW * 0.46, hipY); g.lineTo(x - bodyW * 0.46, hipY); g.closePath(); g.fill(); outl();
    g.strokeStyle = trim; g.lineWidth = Math.max(1, h * 0.022);
    g.beginPath(); g.moveTo(x - bodyW * 0.22, shY); g.quadraticCurveTo(x, shY + h * 0.07, x + bodyW * 0.22, shY); g.stroke();
    const jg = rc(gear.jersey);
    if (jg) { g.fillStyle = jg; g.fillRect(x - bodyW * 0.46, hipY - h * 0.04, bodyW * 0.92, h * 0.025); }
    if (o.number !== undefined && o.number !== '') {
      g.font = '400 ' + Math.round(h * 0.16) + 'px "Bebas Neue", Impact, sans-serif'; g.textAlign = 'center';
      g.lineWidth = Math.max(1, h * 0.02); g.strokeStyle = 'rgba(255,255,255,.8)';
      g.strokeText(String(o.number), x + dir * bodyW * 0.08, hipY - h * 0.06); g.fillStyle = trim; g.fillText(String(o.number), x + dir * bodyW * 0.08, hipY - h * 0.06);
    }
    const hand = arm(dir, true);
    if (o.ball) {
      const up = o.pose === 'shoot' || o.pose === 'dunk';
      const bounce = o.dribble ? Math.abs(Math.sin(o.t * (o.pose === 'run' ? 9 : 5))) * h * (o.pose === 'run' ? 0.2 : 0.1) : 0;
      drawBallAt(g, hand.x + dir * h * 0.04, up ? hand.y - h * 0.05 : hand.y + h * 0.06 + bounce, h * 0.065, o.t * 4);
    }
    // head
    C._geo = { hx, hy, R, dir, chestX: x + dir * bodyW * 0.08, chestY: hipY - h * 0.1, crownY: hy - R * 1.15 };
    drawHead(g, hx, hy, R, { L, dir, skin, skinD, hc, lw, pose: o.pose, blink: o.blink, gear, rc, broken: o.broken, noFace: o.noFace });
    if (o.boss && !o.noFace) drawCrown(g, hx, hy - R * 1.15, R * 0.7);
    g.restore();
  }

  function drawHead(g, hx, hy, R, o) {
    const { L, dir, skin, skinD, hc, lw } = o;
    const hair = L.hair || 'buzz';
    // hair behind the head
    g.fillStyle = hc;
    if (hair === 'afro') { g.beginPath(); g.arc(hx - dir * R * 0.08, hy - R * 0.22, R * 1.28, 0, 6.283); g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); }
    if (hair === 'curls') { for (let i = 0; i < 9; i++) { const a = Math.PI * (0.95 + i * 0.137); g.beginPath(); g.arc(hx + Math.cos(a) * R * 0.98, hy + Math.sin(a) * R * 0.98, R * 0.32, 0, 6.283); g.fill(); } }
    if (hair === 'locs' || hair === 'braids') {
      g.strokeStyle = hc; g.lineWidth = R * (hair === 'locs' ? 0.2 : 0.14);
      for (let i = 0; i < 6; i++) { const sx = hx - dir * R * 0.2 + (i - 2.5) * R * 0.3; g.beginPath(); g.moveTo(sx, hy - R * 0.4); g.lineTo(sx - dir * R * 0.15, hy + R * 1.15); g.stroke(); }
    }
    if (hair === 'bun') { g.beginPath(); g.arc(hx - dir * R * 0.35, hy - R * 1.05, R * 0.36, 0, 6.283); g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke(); }
    // ear on the far side
    g.fillStyle = skinD; g.beginPath(); g.ellipse(hx - dir * R * 0.86, hy + R * 0.12, R * 0.2, R * 0.27, 0, 0, 6.283); g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke();
    // face
    g.fillStyle = skin;
    g.beginPath(); g.ellipse(hx, hy, R * 0.98, R, 0, 0, 6.283); g.fill();
    g.strokeStyle = INK; g.lineWidth = lw; g.stroke();
    // hair cap (clipped to the head)
    g.save(); g.beginPath(); g.ellipse(hx, hy, R * 0.98, R, 0, 0, 6.283); g.clip();
    g.fillStyle = hc;
    const capY = { bald: null, buzz: -0.42, fade: -0.38, mohawk: -0.62, flattop: -0.36, afro: -0.3, curls: -0.32, locs: -0.34, braids: -0.4, bun: -0.4, spiky: -0.36, waves: -0.36 }[hair];
    if (capY !== null && capY !== undefined) {
      g.globalAlpha = hair === 'buzz' ? 0.85 : hair === 'mohawk' ? 0.45 : 1;
      g.beginPath(); g.moveTo(hx - R * 1.1, hy + R * capY + R * 0.18 * dir);
      g.quadraticCurveTo(hx + dir * R * 0.2, hy + R * (capY + 0.12), hx + R * 1.1, hy + R * capY - R * 0.18 * dir);
      g.lineTo(hx + R * 1.1, hy - R * 1.2); g.lineTo(hx - R * 1.1, hy - R * 1.2); g.closePath(); g.fill();
      if (hair === 'fade') { g.globalAlpha = 0.35; g.fillRect(hx - dir * R * 1.1, hy - R * 0.4, dir * R * 0.5, R * 0.6); }
      // sideburn on the far side
      g.globalAlpha = hair === 'buzz' ? 0.85 : 1;
      if (hair !== 'mohawk') { g.beginPath(); g.ellipse(hx - dir * R * 0.78, hy - R * 0.15, R * 0.22, R * 0.38, 0, 0, 6.283); g.fill(); }
      g.globalAlpha = 1;
    }
    if (hair === 'bald') { g.fillStyle = 'rgba(255,255,255,.22)'; g.beginPath(); g.ellipse(hx - dir * R * 0.25, hy - R * 0.62, R * 0.32, R * 0.14, -0.3 * dir, 0, 6.283); g.fill(); }
    if (hair === 'waves') { g.strokeStyle = shade(hc, 0.25); g.lineWidth = R * 0.06; for (let i = 0; i < 3; i++) { g.beginPath(); g.arc(hx, hy + R * 0.3, R * (0.95 + i * 0.12), Math.PI * 1.2, Math.PI * 1.8); g.stroke(); } }
    // cheeks
    g.fillStyle = 'rgba(255,110,110,.18)'; g.beginPath(); g.ellipse(hx + dir * R * 0.55, hy + R * 0.42, R * 0.17, R * 0.1, 0, 0, 6.283); g.fill();
    g.restore();
    // hair above the head line
    g.fillStyle = hc; g.strokeStyle = INK; g.lineWidth = lw;
    if (hair === 'flattop') { g.beginPath(); roundRect(g, hx - R * 0.82, hy - R * 1.42, R * 1.64, R * 0.62, R * 0.12); g.fill(); g.stroke(); }
    if (hair === 'mohawk') { g.beginPath(); g.moveTo(hx - dir * R * 0.5, hy - R * 0.8); for (let i = 0; i < 4; i++) { const t = i / 3; g.lineTo(hx - dir * R * 0.5 + dir * R * t * 1.0, hy - R * (1.45 + (i % 2) * 0.12)); } g.lineTo(hx + dir * R * 0.55, hy - R * 0.8); g.closePath(); g.fill(); g.stroke(); }
    if (hair === 'spiky') { g.beginPath(); g.moveTo(hx - R * 0.95, hy - R * 0.35); for (let i = 0; i <= 6; i++) { const a = Math.PI * (1.05 + i * 0.15); g.lineTo(hx + Math.cos(a) * R * 1.0, hy + Math.sin(a) * R * 1.0); g.lineTo(hx + Math.cos(a + 0.07) * R * 1.4, hy + Math.sin(a + 0.07) * R * 1.4); } g.lineTo(hx + R * 0.95, hy - R * 0.35); g.closePath(); g.fill(); g.stroke(); }
    if (hair === 'braids') { g.strokeStyle = shade(hc, 0.25); g.lineWidth = R * 0.05; for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(hx + i * R * 0.3, hy - R * 0.98); g.lineTo(hx + i * R * 0.34, hy - R * 0.45); g.stroke(); } }
    if (!o.noFace) {
    // face features (3/4 view toward dir)
    const fx = hx + dir * R * 0.2, ey = hy + R * 0.12;
    const hurt = o.pose === 'hurt' || o.broken, happy = o.pose === 'cheer';
    if (L.goggles) {
      g.fillStyle = 'rgba(207,233,255,.95)'; g.beginPath(); roundRect(g, fx - R * 0.68, ey - R * 0.3, R * 1.36, R * 0.55, R * 0.25); g.fill(); g.strokeStyle = INK; g.lineWidth = lw; g.stroke();
    }
    for (const side of [-1, 1]) {
      const near = side === dir;
      const ex = fx + side * R * 0.33, rx = R * (near ? 0.16 : 0.13), ry = R * 0.21;
      if (o.blink || o.broken) {
        g.strokeStyle = INK; g.lineWidth = Math.max(1.2, R * 0.08);
        g.beginPath(); if (o.broken) { g.moveTo(ex - rx, ey - ry * 0.6); g.lineTo(ex + rx, ey + ry * 0.6); g.moveTo(ex + rx, ey - ry * 0.6); g.lineTo(ex - rx, ey + ry * 0.6); } else { g.moveTo(ex - rx, ey); g.lineTo(ex + rx, ey); } g.stroke();
      } else if (happy) {
        g.strokeStyle = INK; g.lineWidth = Math.max(1.3, R * 0.09);
        g.beginPath(); g.arc(ex, ey + ry * 0.35, rx * 0.95, Math.PI * 1.1, Math.PI * 1.9); g.stroke();
      } else {
        g.fillStyle = '#fff'; g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, 0, 6.283); g.fill();
        g.fillStyle = '#1a1210'; g.beginPath(); g.ellipse(ex + dir * rx * 0.25, ey + ry * 0.1, rx * 0.68, ry * 0.72, 0, 0, 6.283); g.fill();
        g.fillStyle = '#fff'; g.beginPath(); g.arc(ex + dir * rx * 0.05, ey - ry * 0.3, Math.max(0.8, rx * 0.28), 0, 6.283); g.fill();
        g.strokeStyle = INK; g.lineWidth = Math.max(1, lw * 0.8); g.beginPath(); g.ellipse(ex, ey, rx, ry, 0, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
      }
      // brows: fierce when brow=1, worried when hurt
      g.strokeStyle = shade(hc === '#d6d6d6' ? '#777' : hc, -0.1); g.lineWidth = Math.max(1.4, R * 0.1);
      const by = ey - ry - R * 0.13;
      const tiltIn = hurt ? -0.1 : L.brow ? 0.12 : 0.02;
      g.beginPath(); g.moveTo(ex - rx * 1.1, by + (side === 1 ? -1 : 1) * tiltIn * R * -1); g.lineTo(ex + rx * 1.1, by + (side === 1 ? 1 : -1) * tiltIn * R * -1); g.stroke();
    }
    if (L.goggles) { g.strokeStyle = INK; g.lineWidth = lw; g.beginPath(); g.moveTo(hx - dir * R * 0.9, ey - R * 0.05); g.lineTo(fx - dir * R * 0.68, ey - R * 0.05); g.stroke(); }
    // nose
    g.strokeStyle = shade(skin, -0.32); g.lineWidth = Math.max(1, R * 0.06);
    g.beginPath(); g.moveTo(fx + dir * R * 0.12, ey + R * 0.2); g.lineTo(fx + dir * R * 0.18, ey + R * 0.32); g.lineTo(fx + dir * R * 0.06, ey + R * 0.34); g.stroke();
    // facial hair
    const fh = hc;
    if (L.facial === 'beard') { g.fillStyle = fh; g.beginPath(); g.moveTo(hx - dir * R * 0.75, hy + R * 0.05); g.quadraticCurveTo(hx - dir * R * 0.6, hy + R * 1.12, fx + dir * R * 0.1, hy + R * 1.02); g.quadraticCurveTo(fx + dir * R * 0.62, hy + R * 0.85, fx + dir * R * 0.72, hy + R * 0.4); g.quadraticCurveTo(fx, hy + R * 0.82, hx - dir * R * 0.75, hy + R * 0.05); g.fill(); }
    if (L.facial === 'goatee') { g.fillStyle = fh; g.beginPath(); g.ellipse(fx + dir * R * 0.08, hy + R * 0.86, R * 0.16, R * 0.12, 0, 0, 6.283); g.fill(); }
    if (L.facial === 'mustache') { g.strokeStyle = fh; g.lineWidth = R * 0.1; g.beginPath(); g.moveTo(fx - R * 0.16, ey + R * 0.47); g.quadraticCurveTo(fx + dir * R * 0.05, ey + R * 0.38, fx + R * 0.26, ey + R * 0.47); g.stroke(); }
    if (L.facial === 'stubble') { g.fillStyle = 'rgba(0,0,0,.12)'; g.beginPath(); g.ellipse(fx, hy + R * 0.7, R * 0.6, R * 0.3, 0, 0, 6.283); g.fill(); }
    // mouth
    const mx = fx + dir * R * 0.05, my = ey + R * 0.55;
    g.strokeStyle = '#4a1f18'; g.lineWidth = Math.max(1.1, R * 0.08);
    if (hurt) { g.fillStyle = '#4a1f18'; g.beginPath(); g.ellipse(mx, my + R * 0.04, R * 0.09, R * 0.11, 0, 0, 6.283); g.fill(); }
    else if (happy || L.mouth === 0) { g.fillStyle = '#fff'; g.beginPath(); g.moveTo(mx - R * 0.22, my - R * 0.02); g.quadraticCurveTo(mx, my + R * (happy ? 0.32 : 0.22), mx + R * 0.22, my - R * 0.02); g.closePath(); g.fill(); g.stroke(); }
    else if (L.mouth === 1) { g.beginPath(); g.moveTo(mx - R * 0.18, my + R * 0.04); g.quadraticCurveTo(mx + R * 0.02, my + R * 0.1, mx + R * 0.2, my - R * 0.05); g.stroke(); }
    else { g.beginPath(); g.moveTo(mx - R * 0.16, my + R * 0.04); g.lineTo(mx + R * 0.16, my + R * 0.04); g.stroke(); }
    }
    // headband
    const hb = o.rc(o.gear.headband);
    if (hb) { g.fillStyle = hb; g.beginPath(); g.moveTo(hx - R * 0.98, hy - R * 0.42); g.quadraticCurveTo(hx, hy - R * 0.62, hx + R * 0.98, hy - R * 0.42); g.lineTo(hx + R * 0.96, hy - R * 0.24); g.quadraticCurveTo(hx, hy - R * 0.44, hx - R * 0.96, hy - R * 0.24); g.closePath(); g.fill(); g.strokeStyle = INK; g.lineWidth = lw * 0.8; g.stroke(); }
  }
  function drawCrown(g, x, y, s) {
    g.fillStyle = '#ffd23f'; g.strokeStyle = INK; g.lineWidth = Math.max(1.2, s * 0.08);
    g.beginPath(); g.moveTo(x - s * 0.6, y + s * 0.3); g.lineTo(x - s * 0.6, y - s * 0.2); g.lineTo(x - s * 0.3, y + s * 0.05); g.lineTo(x, y - s * 0.4); g.lineTo(x + s * 0.3, y + s * 0.05); g.lineTo(x + s * 0.6, y - s * 0.2); g.lineTo(x + s * 0.6, y + s * 0.3); g.closePath(); g.fill(); g.stroke();
  }

  // ---------- HD pixel characters ----------
  // Each character is baked into a small pixel sprite (48 × 56 grid, body about 44 px): the chibi shapes are
  // rasterised at sprite size, snapped to a limited per-character palette, outlined with coloured sel-out (a dark
  // shade of the neighbouring colour instead of black), rim-lit from the arena lights, and given a hand-placed pixel
  // face so eyes, brows and mouth stay readable. Sprites are cached per pose frame and drawn at an integer scale.
  const SPR = { w: 48, h: 56, body: 44, feetY: 53 };
  const sprCache = new Map();
  let normCtx = null;
  function rgb(c) {
    if (!normCtx) normCtx = document.createElement('canvas').getContext('2d');
    normCtx.fillStyle = '#000'; normCtx.fillStyle = c;
    const v = normCtx.fillStyle;
    if (v[0] === '#') return [parseInt(v.slice(1, 3), 16), parseInt(v.slice(3, 5), 16), parseInt(v.slice(5, 7), 16)];
    const m = v.match(/[\d.]+/g); return [+m[0], +m[1], +m[2]];
  }
  function mix(c, t, k) { return [c[0] + (t[0] - c[0]) * k, c[1] + (t[1] - c[1]) * k, c[2] + (t[2] - c[2]) * k].map((v) => Math.round(Math.max(0, Math.min(255, v)))); }
  const darken = (c, k) => mix(c, [20, 14, 34], k);   // shadows lean purple, not grey
  const lighten = (c, k) => mix(c, [255, 246, 220], k);
  const DIGITS = { 0: ['111', '101', '101', '101', '111'], 1: ['010', '110', '010', '010', '111'], 2: ['111', '001', '111', '100', '111'], 3: ['111', '001', '011', '001', '111'], 4: ['101', '101', '111', '001', '001'], 5: ['111', '100', '111', '001', '111'], 6: ['111', '100', '111', '101', '111'], 7: ['111', '001', '010', '010', '010'], 8: ['111', '101', '111', '101', '111'], 9: ['111', '101', '111', '001', '111'] };

  function bakeSprite(o) {
    const L = o.look || {}, gear = o.gear || {};
    const rcol = (k) => (gear[k] !== undefined && D.rarities[gear[k]] ? D.rarities[gear[k]].color : null);
    const skin = rgb(D.skinTones[L.skin] || '#c68a5a');
    const hair = rgb(L.hairColor || '#16121a');
    const jersey = rgb((o.colors && o.colors[0]) || '#ff6a1f'), trim = rgb((o.colors && o.colors[1]) || '#1b1f3a');
    const shoe = rgb(rcol('shoes') || L.shoe || '#ffffff');
    const ink = rgb(INK);
    // limited palette: base + one shade per material (+ gear, ball, eye white)
    const pal = [skin, darken(skin, 0.22), hair, darken(hair, 0.3), jersey, darken(jersey, 0.28), trim, lighten(trim, 0.15), shoe, darken(shoe, 0.3),
      [255, 255, 255], [224, 102, 42], [150, 58, 22], [26, 29, 38], ink];
    for (const k of ['headband', 'wristband', 'jersey']) { const c = rcol(k); if (c) pal.push(rgb(c)); }
    if (o.boss) pal.push([255, 210, 63], [196, 140, 20]);
    const cv = document.createElement('canvas'); cv.width = SPR.w; cv.height = SPR.h;
    const g = cv.getContext('2d');
    drawChibi(g, SPR.w / 2, SPR.feetY, SPR.body, Object.assign({}, o, { noFace: true, number: '', flash: false, tilt: 0, alpha: 1, boss: false }));
    const geo = C._geo;
    const img = g.getImageData(0, 0, SPR.w, SPR.h), d = img.data, N = SPR.w * SPR.h;
    const col = new Array(N).fill(null);
    const isInk = new Uint8Array(N);
    for (let i = 0; i < N; i++) {
      if (d[i * 4 + 3] < 110) continue;
      const c = [d[i * 4], d[i * 4 + 1], d[i * 4 + 2]];
      let best = 0, bd = 1e9;
      for (let k = 0; k < pal.length; k++) { const q = pal[k]; const dd = (q[0] - c[0]) ** 2 * 0.3 + (q[1] - c[1]) ** 2 * 0.59 + (q[2] - c[2]) ** 2 * 0.11; if (dd < bd) { bd = dd; best = k; } }
      col[i] = pal[best];
      if (best === pal.length - 1 - (rcol('headband') ? 1 : 0) - (rcol('wristband') ? 1 : 0) - (rcol('jersey') ? 1 : 0) - (o.boss ? 2 : 0)) isInk[i] = 1;
    }
    const W = SPR.w, H = SPR.h;
    const at = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? null : col[y * W + x]);
    // sel-out: ink pixels take a dark shade of the colour they border (outer edge darker than inner seams)
    const out = col.slice();
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
      const i = y * W + x;
      if (!isInk[i]) continue;
      let edge = false; const nb = [];
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [-1, -1], [1, -1], [-1, 1]]) {
        const j = (y + dy) * W + (x + dx), c = at(x + dx, y + dy);
        if (!c) { if (Math.abs(dx) + Math.abs(dy) === 1) edge = true; continue; }
        if (!isInk[j]) nb.push(c);
      }
      const base = nb.length ? nb[0] : [60, 40, 70];
      out[i] = edge ? darken(base, 0.62) : darken(base, 0.4);
    }
    // rim light: pixels just inside the outline on the side facing the arena lights (top and toward the rim)
    const lit = out.slice();
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) {
      const i = y * W + x;
      if (!out[i] || isInk[i]) continue;
      const up = isInk[i - W] || !col[i - W], side = isInk[i + 1] || !col[i + 1];
      if (up || side) lit[i] = lighten(out[i], up ? 0.28 : 0.18);
    }
    const put = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H && lit[y * W + x]) lit[y * W + x] = c; };
    const putAny = (x, y, c) => { x = Math.round(x); y = Math.round(y); if (x >= 0 && y >= 0 && x < W && y < H) lit[y * W + x] = c; };
    // hand-placed pixel face (3/4 view toward dir)
    const dir = geo.dir, R = geo.R;
    const fx = Math.round(geo.hx + dir * R * 0.2), ey = Math.round(geo.hy + R * 0.14);
    const dark = [26, 18, 16], brow = darken(hair[0] + hair[1] + hair[2] > 600 ? [120, 120, 120] : hair, 0.25), lip = [122, 40, 34];
    const hurt = o.pose === 'hurt' || o.broken, happy = o.pose === 'cheer';
    for (const side of [-1, 1]) {
      const ex = fx + side * 3 + (side === dir ? 0 : 0);
      const x0 = side === -1 ? ex - 1 : ex;
      if (o.broken) { put(x0, ey - 1, dark); put(x0 + 1, ey, dark); put(x0, ey + 1, dark); put(x0 + 1, ey - 1, dark); put(x0, ey + 1, dark); put(x0 + 1, ey + 1, dark); }
      else if (o.blink) { put(x0, ey + 1, dark); put(x0 + 1, ey + 1, dark); }
      else if (happy) { put(x0 - 1, ey + 1, dark); put(x0, ey, dark); put(x0 + 1, ey, dark); put(x0 + 2, ey + 1, dark); }
      else {
        for (let yy = -1; yy <= 1; yy++) { put(x0, ey + yy, dark); put(x0 + 1, ey + yy, dark); }
        put(dir === 1 ? x0 + 1 : x0, ey - 1, [255, 255, 255]);
        put(dir === 1 ? x0 - 1 : x0 + 2, ey, [250, 246, 238]);
      }
      // brows: angled in when fierce, up when hurt
      const by = ey - 3;
      const tilt = hurt ? 1 : L.brow ? -1 : 0;
      const inner = side === -1 ? x0 + 1 : x0, outer = side === -1 ? x0 - 1 : x0 + 2;
      put(outer, by + (tilt === 1 ? 1 : 0), brow); put((inner + outer) / 2 | 0, by, brow); put(inner, by + (tilt === -1 ? 1 : 0), brow);
    }
    // nose and blush
    put(fx + dir * 1, ey + 3, darken(skin, 0.3));
    put(fx + dir * 4, ey + 3, mix(skin, [255, 120, 120], 0.35));
    // mouth
    const mx = fx + dir * 1, my = ey + 6;
    if (hurt) { put(mx, my, lip); put(mx + 1, my, lip); put(mx, my + 1, lip); put(mx + 1, my + 1, lip); }
    else if (happy) { for (let xx = -2; xx <= 2; xx++) put(mx + xx, my, lip); for (let xx = -1; xx <= 1; xx++) put(mx + xx, my + 1, [230, 90, 90]); }
    else if (L.mouth === 0) { put(mx - 2, my - 1, lip); for (let xx = -1; xx <= 1; xx++) put(mx + xx, my, lip); put(mx + 2, my - 1, lip); put(mx, my - 1, [255, 255, 255]); }
    else if (L.mouth === 1) { put(mx - 1, my, lip); put(mx, my, lip); put(mx + 1, my - 1, lip); }
    else { for (let xx = -1; xx <= 1; xx++) put(mx + xx, my, lip); }
    // jersey number in a 3×5 pixel font
    if (o.number !== undefined && o.number !== '' && !(o.pose === 'hurt' && o.broken)) {
      const str = String(o.number).slice(0, 2), cw = 4;
      const sx = Math.round(geo.chestX - (str.length * cw - 1) / 2), sy = Math.round(geo.chestY - 4);
      const numC = trim, edgeC = lighten(jersey, 0.45);
      [...str].forEach((ch, n) => { const gph = DIGITS[ch]; if (!gph) return; for (let yy = 0; yy < 5; yy++) for (let xx = 0; xx < 3; xx++) if (gph[yy][xx] === '1') put(sx + n * cw + xx, sy + yy, numC); else if (lit[(sy + yy) * W + sx + n * cw + xx]) { /* keep jersey */ } });
      void edgeC;
    }
    // boss crown in pixels
    if (o.boss) {
      const cx = Math.round(geo.hx), cy = Math.round(geo.crownY);
      const gold = [255, 210, 63], goldD = [170, 110, 20];
      for (let xx = -4; xx <= 4; xx++) { putAny(cx + xx, cy + 1, gold); putAny(cx + xx, cy + 2, goldD); }
      for (const xx of [-4, 0, 4]) { putAny(cx + xx, cy, gold); putAny(cx + xx, cy - 1, gold); }
      for (const xx of [-2, 2]) putAny(cx + xx, cy, gold);
      putAny(cx, cy + 1, [255, 90, 90]);
    }
    for (let i = 0; i < N; i++) {
      const c = lit[i];
      if (!c) { d[i * 4 + 3] = 0; continue; }
      d[i * 4] = c[0]; d[i * 4 + 1] = c[1]; d[i * 4 + 2] = c[2]; d[i * 4 + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    return cv;
  }
  function spriteFor(o) {
    // quantise animated inputs to frames so sprites cache well
    const fr = { t: Math.floor(o.t * 6) / 6, walk: Math.floor(o.walk / (Math.PI / 2)) * (Math.PI / 2) };
    const key = [JSON.stringify(o.look), o.colors && o.colors.join(), o.number, JSON.stringify(o.gear), o.dir, o.pose, o.moving ? fr.walk : 0,
      o.pose === 'idle' || o.pose === 'guard' || o.dribble ? fr.t % 2.1 : 0, o.blink ? 1 : 0, o.boss ? 1 : 0, o.broken ? 1 : 0, o.ball ? 1 : 0, o.dribble ? 1 : 0].join('|');
    let cv = sprCache.get(key);
    if (!cv) {
      cv = bakeSprite(Object.assign({}, o, fr));
      sprCache.set(key, cv);
      if (sprCache.size > 900) sprCache.delete(sprCache.keys().next().value);
    }
    return cv;
  }
  function drawCharacter(g, x, y, h, o) {
    if (!C.pixel) { drawChibi(g, x, y, h, o); return; }
    const cv = spriteFor(o);
    const d = C.dpr, k = Math.max(1, Math.round(h * d / SPR.body)), s = k / d;
    const left = Math.round((x - (SPR.w / 2) * s) * d) / d, top = Math.round((y - SPR.feetY * s) * d) / d;
    g.save();
    g.imageSmoothingEnabled = false;
    g.globalAlpha = o.alpha === undefined ? 1 : o.alpha;
    if (o.tilt) { g.translate(x, y); g.rotate(Math.round(o.tilt * -o.dir / 0.2) * 0.2); g.translate(-x, -y); }
    g.drawImage(cv, left, top, SPR.w * s, SPR.h * s);
    if (o.flashPx) { g.globalCompositeOperation = 'lighter'; g.globalAlpha = 0.55; g.drawImage(cv, left, top, SPR.w * s, SPR.h * s); }
    g.restore();
  }
  function shade(hex, amt) { return BE.athletes && BE.athletes.shade ? BE.athletes.shade(hex, amt) : hex; }
  function roundRect(g, x, y, w, h, r) {
    r = Math.max(0, Math.min(r, w / 2, h / 2));
    g.moveTo(x + r, y); g.arcTo(x + w, y, x + w, y + h, r); g.arcTo(x + w, y + h, x, y + h, r); g.arcTo(x, y + h, x, y, r); g.arcTo(x, y, x + w, y, r); g.closePath();
  }

  BE.court = {
    C, init, resize, setTheme, start, onEvents, celebrate, clearTasks, update, draw, busy, showBanner, confetti, excite,
    drawBallAt, drawChibi, drawCharacter, bakeSprite, roundRect,
  };
})(typeof window !== 'undefined' ? window : globalThis);
