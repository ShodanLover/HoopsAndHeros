/* Basketball Empire — interactive skill contests: Free Throw Challenge, 3-Point Contest, Slam Dunk Contest */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, A = BE.athletes;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;

  function bestBy(s, fn) {
    let best = null, bv = -1;
    for (const a of s.roster) { const v = fn(A.effAttrs(s, a)); if (v > bv) { bv = v; best = a; } }
    return { a: best, v: bv };
  }

  const DUNKS = [
    { k: 'tomahawk', name: 'Tomahawk', max: 40, speed: 1.0, width: 0.2 },
    { k: '360', name: '360 Windmill', max: 45, speed: 1.35, width: 0.15 },
    { k: 'btl', name: 'Between the Legs', max: 50, speed: 1.7, width: 0.11 },
  ];

  function play(kind, done) {
    const s = S();
    const cos = G.cosmetic(s);
    const cfg = {
      ft: { title: 'Free Throw Challenge', shots: 10, speed: 1.1, attr: (x) => x.sht },
      three: { title: '3-Point Contest', shots: 15, speed: 1.6, attr: (x) => x.thr },
      dunk: { title: 'Slam Dunk Contest', shots: 3, speed: 1.0, attr: (x) => (x.spd + x.str) / 2 },
    }[kind];
    const shooter = bestBy(s, cfg.attr);
    const t = A.tpl(shooter.a.cid);
    const skill = U.clamp(shooter.v, 20, 120);
    const st = { i: 0, score: 0, makes: 0, phase: 'aim', zone: 0.5, w: 0.2, t0: performance.now(), anim: null, dunk: null, dunkStep: 0, dunkAcc: [], judges: [], over: false, rack: 0, msg: '', msgT: 0 };
    const m = ui.modal({
      title: cfg.title, noClose: true,
      html: '<div class="stack"><div class="row between"><div class="row" style="gap:8px"><div style="width:40px;height:40px;border-radius:10px;overflow:hidden;background:var(--panel3)">' + A.portraitSVG(t, { colors: cos.jersey }) + '</div><div><b>' + U.esc(t.first + ' ' + t.last) + '</b><div class="small muted">Rating ' + Math.round(skill) + ' · wider timing window</div></div></div><div style="text-align:right"><div class="label">Score</div><div class="h1" data-c="score">0</div></div></div>' +
        '<canvas class="contest-canvas" data-c="cv"></canvas><div class="row between small"><span data-c="prog"></span><span data-c="hint" class="muted">Tap SHOOT when the needle is in the green</span></div>' +
        '<div data-c="choice" class="row hidden"></div><div class="meter" data-c="meter"><div class="zone" data-c="zone"></div><div class="zone perfect" data-c="pz"></div><div class="needle" data-c="needle"></div></div>' +
        '<div class="row"><button class="btn ghost" data-c="quit">Quit</button><button class="btn gold grow" data-c="shoot" style="min-height:56px;font-size:20px">' + (kind === 'dunk' ? 'Choose a dunk' : 'SHOOT') + '</button></div></div>',
    });
    const cv = $('[data-c="cv"]', m.el), g = cv.getContext('2d');
    const needle = $('[data-c="needle"]', m.el), zoneEl = $('[data-c="zone"]', m.el), pz = $('[data-c="pz"]', m.el);
    const shootBtn = $('[data-c="shoot"]', m.el), choice = $('[data-c="choice"]', m.el);
    let W = 0, H = 0, raf = 0, last = performance.now();
    function size() {
      const r = cv.getBoundingClientRect();
      const dpr = Math.min(2, root.devicePixelRatio || 1);
      W = r.width; H = r.height;
      cv.width = W * dpr; cv.height = H * dpr;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    size();

    function newZone() {
      const base = kind === 'dunk' ? DUNKS[st.dunk || 0].width : kind === 'three' ? 0.13 : 0.16;
      st.w = base * (0.65 + skill / 110) * (kind === 'three' && (st.i % 5 === 4) ? 0.85 : 1);
      st.zone = U.clamp(0.2 + Math.random() * 0.6, st.w / 2 + 0.02, 1 - st.w / 2 - 0.02);
      zoneEl.style.left = (st.zone - st.w / 2) * 100 + '%'; zoneEl.style.width = st.w * 100 + '%';
      pz.style.left = (st.zone - st.w * 0.15) * 100 + '%'; pz.style.width = st.w * 30 + '%';
      st.t0 = performance.now();
    }
    function needlePos() {
      const sp = kind === 'dunk' && st.dunk !== null ? DUNKS[st.dunk].speed * 1.2 : cfg.speed * (1 + st.i * 0.03);
      const x = ((performance.now() - st.t0) / 1000) * sp;
      const tri = x % 2; return tri < 1 ? tri : 2 - tri;
    }
    function progText() {
      if (kind === 'dunk') return 'Dunk ' + Math.min(3, st.i + 1) + ' of 3' + (st.dunk !== null ? ' · ' + DUNKS[st.dunk].name + ' step ' + (st.dunkStep + 1) + '/3' : '');
      if (kind === 'three') return 'Rack ' + (Math.floor(st.i / 5) + 1) + '/3 · ball ' + (st.i % 5 + 1) + (st.i % 5 === 4 ? ' (MONEY BALL ×2)' : '');
      return 'Shot ' + Math.min(cfg.shots, st.i + 1) + ' of ' + cfg.shots;
    }
    function updateUI() {
      $('[data-c="score"]', m.el).textContent = st.score;
      $('[data-c="prog"]', m.el).textContent = progText();
    }

    function dunkChoice() {
      st.phase = 'choose';
      shootBtn.disabled = true; shootBtn.textContent = 'Choose a dunk';
      choice.classList.remove('hidden');
      choice.innerHTML = DUNKS.map((d, i) => '<button class="btn sm ' + ['green', 'blue', 'purple'][i] + ' grow stack" data-dk="' + i + '">' + d.name + '<span class="sub">max ' + d.max + '</span></button>').join('');
    }
    choice.addEventListener('click', (e) => {
      const b = e.target.closest('[data-dk]');
      if (!b) return;
      st.dunk = +b.dataset.dk; st.dunkStep = 0; st.dunkAcc = [];
      choice.classList.add('hidden');
      shootBtn.disabled = false; shootBtn.textContent = ['APPROACH', 'TAKE OFF', 'SLAM'][0];
      st.phase = 'aim';
      newZone(); updateUI();
      BE.audio.play('click');
    });

    function judge(pos) {
      const d = Math.abs(pos - st.zone);
      if (d <= st.w * 0.15) return 'perfect';
      if (d <= st.w / 2) return 'good';
      return 'miss';
    }
    function say(t) { st.msg = t; st.msgT = 1.2; }

    function shoot() {
      if (st.phase !== 'aim' || st.over) return;
      const pos = needlePos();
      const j = judge(pos);
      BE.services.haptic(10);
      if (kind === 'dunk') {
        st.dunkAcc.push(j === 'perfect' ? 1 : j === 'good' ? 0.75 : 0.25);
        say(j === 'perfect' ? 'PERFECT!' : j === 'good' ? 'Good' : 'Shaky...');
        BE.audio.play(j === 'miss' ? 'error' : 'squeak');
        st.dunkStep++;
        if (st.dunkStep < 3) { shootBtn.textContent = ['APPROACH', 'TAKE OFF', 'SLAM'][st.dunkStep]; newZone(); updateUI(); return; }
        // resolve dunk
        const d = DUNKS[st.dunk];
        const acc = st.dunkAcc.reduce((a, b) => a + b, 0) / 3;
        const failed = st.dunkAcc.filter((x) => x <= 0.25).length >= 2;
        const total = failed ? 15 + Math.round(Math.random() * 8) : Math.round(25 + (d.max - 25) * acc);
        const judges = [];
        let rem = total;
        for (let k = 0; k < 5; k++) { const v = k === 4 ? rem : U.clamp(Math.round(total / 5 + (Math.random() - 0.5) * 2), 1, 10); judges.push(U.clamp(v, 1, 10)); rem -= judges[k]; }
        st.judges = judges;
        st.anim = { type: 'dunk', t: 0, made: !failed, pts: total };
        st.phase = 'anim';
        st.score += total;
        return;
      }
      const made = j !== 'miss' && (j === 'perfect' || Math.random() < 0.92);
      const money = kind === 'three' && st.i % 5 === 4;
      const pts = made ? (money ? 2 : 1) : 0;
      st.anim = { type: 'shot', t: 0, made, swish: j === 'perfect', pts, money };
      st.phase = 'anim';
      if (made) { st.score += pts; st.makes++; }
      say(j === 'perfect' ? 'SWISH!' : made ? 'Good!' : 'Miss');
    }
    function nextShot() {
      st.i++;
      if (st.i >= cfg.shots) { finish(); return; }
      if (kind === 'dunk') { st.dunk = null; dunkChoice(); updateUI(); return; }
      st.phase = 'aim';
      newZone(); updateUI();
    }

    function finish() {
      st.over = true;
      cancelAnimationFrame(raf);
      const sx = S();
      sx.stats.contests++;
      if (kind === 'ft' && st.makes === 10) sx.stats.perfectFT++;
      sx.events.best[kind] = Math.max(sx.events.best[kind] || 0, st.score);
      const wk = U.isWeekend() ? 2 : 1;
      let r;
      if (kind === 'ft') r = { cashMinutes: Math.max(1, st.makes), tp: st.makes * 2, eventTickets: (st.makes >= 8 ? 1 : 0) * wk, gems: st.makes === 10 ? 10 : 0 };
      else if (kind === 'three') r = { cashMinutes: Math.max(1, Math.round(st.score * 0.8)), tp: st.score, eventTickets: ((st.score >= 11 ? 1 : 0) + (st.score >= 15 ? 1 : 0)) * wk, gems: st.score >= 15 ? 10 : 0 };
      else r = { cashMinutes: Math.max(2, Math.round(st.score / 8)), tp: Math.round(st.score / 4), eventTickets: ((st.score >= 90 ? 1 : 0) + (st.score >= 120 ? 1 : 0)) * wk, gems: st.score >= 135 ? 15 : 0 };
      const granted = E.grant(sx, r);
      m.close();
      const max = kind === 'ft' ? 10 : kind === 'three' ? 18 : 150;
      const grade = st.score >= max * 0.85 ? 'ELITE!' : st.score >= max * 0.6 ? 'GREAT SHOW' : 'NICE TRY';
      if (st.score >= max * 0.85) BE.audio.play('champion'); else BE.audio.play('win');
      ui.rewardsPopup(grade, granted, { sub: cfg.title + ': ' + st.score + ' / ' + max + (wk > 1 ? ' · Weekend double tickets' : '') });
      BE.bus.emit('changed');
      done && done();
    }

    // ---------- Render ----------
    const shooterPos = () => kind === 'ft' ? { x: W * 0.5, y: H * 0.78 } : kind === 'three' ? { x: W * (0.15 + 0.7 * (Math.floor(st.i / 5) / 2)), y: H * 0.86 } : { x: W * 0.5, y: H * 0.88 };
    const hoop = () => ({ x: W * 0.5, y: H * 0.26 });
    function drawScene(dt) {
      const th = D.worlds[Math.min(9, E.worldOf(s.best))].theme;
      const grd = g.createLinearGradient(0, 0, 0, H * 0.45);
      grd.addColorStop(0, th.sky[1]); grd.addColorStop(1, th.sky[0]);
      g.fillStyle = grd; g.fillRect(0, 0, W, H * 0.45);
      const rng = U.mulberry32(7);
      for (let i = 0; i < 90; i++) { const x = rng() * W, y = H * 0.12 + rng() * H * 0.3; g.fillStyle = D.skinTones[Math.floor(rng() * 8)]; g.beginPath(); g.arc(x, y - Math.max(0, Math.sin(performance.now() / 200 + i)) * (st.msgT > 0 ? 3 : 0.6), 3, 0, 6.28); g.fill(); }
      g.fillStyle = th.floor; g.fillRect(0, H * 0.45, W, H * 0.55);
      g.strokeStyle = th.line; g.lineWidth = 2;
      g.beginPath(); g.moveTo(W * 0.3, H * 0.45); g.lineTo(W * 0.22, H); g.moveTo(W * 0.7, H * 0.45); g.lineTo(W * 0.78, H); g.stroke();
      g.beginPath(); g.ellipse(W * 0.5, H * 0.78, W * 0.23, H * 0.05, 0, 0, Math.PI * 2); g.stroke();
      g.beginPath(); g.ellipse(W * 0.5, H * 0.5, W * 0.62, H * 0.42, 0, 0.1, Math.PI - 0.1); g.stroke();
      // hoop
      const h = hoop();
      const shake = st.anim && st.anim.type === 'dunk' && st.anim.t > 0.55 && st.anim.t < 0.9 ? Math.sin(performance.now() / 15) * 3 : 0;
      g.fillStyle = 'rgba(235,245,255,.85)'; g.fillRect(h.x - W * 0.12, h.y - H * 0.16, W * 0.24, H * 0.13);
      g.strokeStyle = '#e8263f'; g.strokeRect(h.x - W * 0.04, h.y - H * 0.1, W * 0.08, H * 0.06);
      g.strokeStyle = '#fff'; g.lineWidth = 1;
      for (let k = 0; k <= 6; k++) { const a = Math.PI * k / 6; g.beginPath(); g.moveTo(h.x - Math.cos(a) * W * 0.05, h.y + shake * 0.3); g.lineTo(h.x - Math.cos(a) * W * 0.03, h.y + H * 0.07); g.stroke(); }
      g.strokeStyle = '#ff5a1f'; g.lineWidth = 3; g.beginPath(); g.ellipse(h.x, h.y + shake * 0.3, W * 0.055, H * 0.012, 0, 0, Math.PI * 2); g.stroke();
      // shooter
      const sp = shooterPos();
      let px = sp.x, py = sp.y, jump = 0, ballAt = null;
      if (st.anim) {
        const a = st.anim;
        a.t += dt * (a.type === 'dunk' ? 0.8 : 1.4);
        if (a.type === 'shot') {
          jump = Math.sin(Math.min(1, a.t * 3) * Math.PI) * H * 0.05;
          const k = U.clamp(a.t, 0, 1);
          const tx = a.made ? h.x : h.x + (Math.random() < 0.5 ? -1 : 1) * W * 0.03, ty = h.y;
          if (k < 1) ballAt = { x: U.lerp(px, tx, k), y: U.lerp(py - H * 0.13, ty, k) - Math.sin(k * Math.PI) * H * 0.28 };
          if (a.t >= 1 && !a.fx) { a.fx = true; BE.audio.play(a.made ? (a.swish ? 'swish' : 'rimin') : 'rim'); if (a.made) BE.audio.play('cheer', { v: a.money ? 0.9 : 0.5 }); }
          if (a.t >= 1 && a.t < 1.3) ballAt = { x: tx + (a.made ? 0 : (a.t - 1) * W * 0.4), y: ty + (a.t - 1) * H * 0.5 };
          if (a.t >= 1.45) { st.anim = null; updateUI(); nextShot(); }
        } else {
          const k = U.clamp(a.t, 0, 1);
          px = U.lerp(sp.x, h.x + W * 0.02, U.easeInOut(Math.min(1, k * 1.4)));
          py = U.lerp(sp.y, h.y + H * 0.3, U.easeInOut(Math.min(1, k * 1.4)));
          jump = Math.sin(U.clamp((k - 0.3) / 0.6, 0, 1) * Math.PI) * H * 0.25;
          if (k < 0.62) ballAt = { x: px + 8, y: py - H * 0.13 - jump };
          else if (k < 0.9) ballAt = { x: h.x, y: h.y + (k - 0.62) * H * 0.3 };
          if (k > 0.6 && !a.fx) { a.fx = true; BE.audio.play(a.made ? 'dunk' : 'rim'); say(a.made ? 'BOOM! ' + a.pts : 'Rimmed out... ' + a.pts); }
          if (a.t >= 1.6) { st.anim = null; updateUI(); nextShot(); }
        }
      }
      const y0 = py - jump;
      g.fillStyle = 'rgba(0,0,0,.3)'; g.beginPath(); g.ellipse(px, py + 2, 16, 5, 0, 0, 6.28); g.fill();
      const skin = D.skinTones[t.look.skin];
      g.strokeStyle = skin; g.lineWidth = 6; g.lineCap = 'round';
      g.beginPath(); g.moveTo(px - 5, y0 - 30); g.lineTo(px - 7, y0 - 2); g.moveTo(px + 5, y0 - 30); g.lineTo(px + 7, y0 - 2); g.stroke();
      g.fillStyle = cos.jersey[1]; g.fillRect(px - 11, y0 - 40, 22, 14);
      g.fillStyle = cos.jersey[0]; g.fillRect(px - 11, y0 - 66, 22, 28);
      g.fillStyle = cos.jersey[1]; g.font = '400 14px "Bebas Neue", Impact'; g.textAlign = 'center'; g.fillText(t.number, px, y0 - 46);
      g.strokeStyle = skin; g.lineWidth = 5;
      g.beginPath(); g.moveTo(px - 10, y0 - 62); g.lineTo(px - 6, y0 - 88); g.moveTo(px + 10, y0 - 62); g.lineTo(px + 6, y0 - 88); g.stroke();
      g.fillStyle = skin; g.beginPath(); g.arc(px, y0 - 74, 8, 0, 6.28); g.fill();
      g.fillStyle = t.look.hairColor; g.beginPath(); g.arc(px, y0 - 76, 8.5, Math.PI, 0); g.fill();
      if (!ballAt && st.phase !== 'choose') ballAt = { x: px, y: y0 - 94 };
      if (ballAt) BE.court.drawBallAt(g, ballAt.x, ballAt.y, 8, performance.now() / 120);
      if (kind === 'three') {
        for (let r = 0; r < 3; r++) for (let b = 0; b < 5; b++) {
          const idx = r * 5 + b;
          if (idx <= st.i) continue;
          const rx = W * (0.15 + 0.35 * r) + (b - 2) * 7, ry = H * 0.95;
          g.fillStyle = b === 4 ? '#ffd23f' : '#e0662a'; g.beginPath(); g.arc(rx, ry, 4, 0, 6.28); g.fill();
        }
      }
      if (st.judges.length && kind === 'dunk' && !st.anim) {
        st.judges.forEach((v, k) => { const jx = W * (0.2 + k * 0.15); g.fillStyle = '#fff'; g.fillRect(jx - 14, H * 0.5, 28, 30); g.fillStyle = '#141a33'; g.font = '400 22px "Bebas Neue", Impact'; g.fillText(v, jx, H * 0.5 + 23); });
      }
      if (st.msgT > 0) {
        st.msgT -= dt;
        g.globalAlpha = Math.min(1, st.msgT * 2);
        g.font = '400 34px "Bebas Neue", Impact'; g.textAlign = 'center'; g.lineWidth = 5; g.strokeStyle = 'rgba(0,0,0,.6)';
        g.strokeText(st.msg, W / 2, H * 0.62); g.fillStyle = '#ffd23f'; g.fillText(st.msg, W / 2, H * 0.62);
        g.globalAlpha = 1;
      }
    }
    function loop() {
      if (st.over) return;
      const now = performance.now();
      const dt = Math.min(0.05, (now - last) / 1000); last = now;
      if (st.phase === 'aim') needle.style.left = 'calc(' + needlePos() * 100 + '% - 2px)';
      drawScene(dt);
      raf = requestAnimationFrame(loop);
    }
    shootBtn.addEventListener('click', shoot);
    cv.addEventListener('pointerdown', (e) => { e.preventDefault(); shoot(); });
    $('[data-c="quit"]', m.el).addEventListener('click', () => { st.over = true; cancelAnimationFrame(raf); m.close(); BE.bus.emit('changed'); done && done(); });
    if (kind === 'dunk') dunkChoice(); else newZone();
    updateUI();
    raf = requestAnimationFrame(loop);
  }

  BE.contests = { play };
})(typeof window !== 'undefined' ? window : globalThis);
