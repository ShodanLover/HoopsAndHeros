/* Basketball Empire — boot, game loop, persistence, offline progress, tutorial, global action dispatch */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, ST = BE.state, A = BE.athletes;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;

  const main = { sessionStart: Date.now(), lastPointer: 0, started: false };
  let lastFrame = performance.now(), tickAcc = 0, secAcc = 0, saveAcc = 0, cloudAcc = 0, introAcc = 0, refreshAcc = 0;

  // ---------- Persistence ----------
  function save() {
    const s = S();
    if (!s) return;
    s.lastSeen = Date.now();
    ST.store.saveLocal(ST.serialize(s));
  }
  function saveCloud() {
    const s = S();
    if (!s) return;
    ST.store.saveCloud(ST.serialize(s));
  }
  function replaceState(ns) {
    BE.game_state = ns;
    E.invalidate();
    G.resets(ns);
    applySettings();
    ui.renderHUD(ns); ui.renderNav(ns);
    BE.play.restartMatch();
    ui.renderScreen(ui.current());
    save(); saveCloud();
  }
  function resetAll() {
    ST.store.clearLocal();
    const fresh = ST.load(null);
    BE.game_state = fresh;
    if (ST.store.cloud.ready) ST.store.saveCloud(ST.serialize(fresh));
    ui.closeAll();
    ui.clearCoach();
    E.invalidate();
    applySettings();
    ui.renderHUD(fresh); ui.renderNav(fresh);
    BE.play.restartMatch();
    ui.go('play');
    tutorial.intro();
  }
  function applySettings() {
    const s = S();
    BE.audio.setVolumes(s.settings.sfx, s.settings.music);
    document.body.classList.toggle('reduce-motion', !!s.settings.reduceMotion);
    BE.court.C.reduceMotion = !!s.settings.reduceMotion;
  }

  // ---------- Screens ----------
  ui.renderScreen = function (k) {
    try {
      if (k === 'play') BE.play.renderPlay();
      else if (k === 'team') BE.team.renderTeam();
      else if (k === 'recruit') BE.recruitUI.renderRecruit();
      else if (k === 'empire') BE.empire.renderEmpire();
      else if (k === 'shop') BE.empire.renderShop();
    } catch (e) { console.error('render ' + k, e); ui.toast('Something went wrong drawing this screen', 'bad', 'info'); }
  };

  // ---------- Global actions ----------
  const actions = {
    nav: (d) => ui.go(d.k),
    settings: () => BE.meta.settingsModal(),
    franchise: () => BE.meta.franchiseModal(),
    goshop: () => (E.unlocked(S(), 'shop') ? ui.go('shop') : ui.toast('Gems: premium currency for recruits & cosmetics. Earned from missions and championships.', '', 'gem')),
    gorecruit: () => ui.go('recruit'),
    goteam: () => ui.go('team'),
    map: () => BE.meta.mapModal(),
    objective: () => { const tg = G.target(S()); if (tg.champReady && S().tutorial.done) BE.play.enterChampionship(); else if (S().run.farming) ui.go('team'); else BE.meta.mapModal(); },
    hub: (d) => {
      const m = BE.meta;
      ({ missions: () => m.missionsModal(), daily: () => m.dailyModal(), pass: () => m.passModal(), events: () => m.eventsModal(), social: () => m.socialModal(), trophies: () => m.missionsModal('trophies') }[d.k] || (() => {}))();
    },
    ability: (d) => BE.play.useAbility(d.k),
    speed: () => {
      const s = S();
      const list = BE.play.speeds(s);
      const i = list.indexOf(s.settings.speed);
      s.settings.speed = list[(i + 1) % list.length];
      BE.play.renderToolbar();
      ui.toast('Game speed ' + s.settings.speed + 'x' + (list.length < 4 ? ' · faster speeds unlock later' : ''), '', 'ff');
    },
    tactics: () => BE.meta.tacticsModal(),
    autoabil: () => { const s = S(); s.settings.autoAbilities = !s.settings.autoAbilities; BE.play.renderToolbar(); ui.toast('Auto abilities ' + (s.settings.autoAbilities ? 'ON' : 'OFF'), '', 'bolt'); },
    autopush: () => { const s = S(); s.settings.autoPush = !s.settings.autoPush; BE.play.renderToolbar(); ui.toast('Auto-push ' + (s.settings.autoPush ? 'ON: retries the next stage after 3 farm wins' : 'OFF: stays on the last win until you tap Retry'), '', 'up'); },
    enterchamp: () => BE.play.enterChampionship(),
    questgo: () => BE.play.questGo(),
    questclaim: (d, el) => BE.play.questClaim(el),
    retry: () => BE.play.retryPush(),
  };
  function dispatch(e) {
    const el = e.target.closest('[data-act]');
    if (!el) return;
    const k = el.dataset.act;
    const fn = actions[k] || (BE.growth && BE.growth.act[k]) || (BE.team.act[k]) || (BE.recruitUI.act[k]) || (BE.empire.act[k]);
    if (!fn) return;
    if (!BE.audio.state.ctx) BE.audio.ensure();
    if (k !== 'nav' && k !== 'ability') BE.audio.play('click');
    try { fn(el.dataset, el, e); } catch (err) { console.error('action ' + k, err); ui.toast('That action failed — please try again', 'bad', 'info'); }
    BE.bus.emit('action', k);
  }

  // ---------- Tutorial ----------
  const tutorial = {
    blocking() { return S() && !S().tutorial.done && S().tutorial.step === 0; },
    intro() {
      const s = S();
      const rng = Math.random;
      const suggested = U.pick(D.franchiseAdjectives, rng) + ' ' + U.pick(D.franchiseNouns, rng);
      const bricks = A.tpl('S0');
      const m = ui.modal({
        center: true, noClose: true,
        html: '<div class="stack" style="align-items:center;text-align:center"><div class="label" style="color:var(--accent)">Chapter 1 · The Cracked Blacktop</div>' +
          '<div class="h1">One hoop. One player. Zero dollars.</div>' +
          '<div class="muted">A rusty chain net, a court full of cracks, and the worst baller on the block. Every dynasty starts somewhere.</div>' +
          '<div class="row" style="gap:12px;align-items:center"><div style="width:110px">' + '<div class="acard rar r0"><div class="in"><div class="pt">' + A.portraitSVG(bricks, { colors: ['#ff6a1f', '#1b1f3a'] }) + '<div class="ovr">' + A.ovrFromAttrs(bricks.attrs, bricks.pos) + '<small>PG</small></div></div><div class="nm"><div class="n">M. Bell</div><div class="p">Common</div></div></div></div></div>' +
          '<div style="text-align:left;max-width:180px"><b>Marcus "Bricks" Bell</b><div class="small muted">Shoots 22 from three. Personality: Underdog. He\'s terrible — but he\'s yours.</div></div></div>' +
          '<div style="width:100%;text-align:left"><label class="label" for="intro-name">Name your franchise</label><input id="intro-name" class="textin" maxlength="24" value="' + U.esc(suggested) + '"></div>' +
          '<button class="btn gold wide" data-start style="min-height:54px;font-size:20px">' + icon('ball') + ' Tip off!</button></div>',
      });
      m.el.addEventListener('click', (e) => {
        if (!e.target.closest('[data-start]')) return;
        const v = $('#intro-name', m.el).value.trim().slice(0, 24);
        s.franchise.name = v.length >= 2 ? v : suggested;
        s.tutorial.step = 1;
        m.close();
        BE.audio.play('buzzer');
        ui.renderHUD(s); ui.renderNav(s);
        BE.play.restartMatch();
        ui.go('play');
        setTimeout(() => tutorial.show(), 600);
        save();
      });
    },
    show() {
      const s = S();
      if (s.tutorial.done) { ui.clearCoach(); return; }
      const st = s.tutorial.step;
      if (st === 1) {
        const m = BE.play.R.match;
        if (m && m.energy >= 40) ui.coach('Your team plays <b>automatically</b>. The energy meter is full — tap <b>HYPE UP</b> to boost your power!', { target: '[data-ab="hype"]', pos: 'top' });
        else ui.coach('Watch Bricks go to work. Games play <b>automatically</b> — your job is to build the team around them.', { pos: 'top' });
      } else if (st === 2) {
        ui.coach('First win! A neighborhood sponsor chipped in some cash. Let\'s spend it — tap <b>TEAM</b>.', { target: '[data-nav="team"]' });
      } else if (st === 3) {
        if (ui.current() !== 'team') { ui.coach('Open the <b>TEAM</b> tab.', { target: '[data-nav="team"]' }); return; }
        ui.coach('Tap <b>+1</b> to level up Bricks. Every level adds power, and every 25 levels <b>doubles</b> it.', { target: '[data-tut="lvl0"]', pos: 'top' });
      } else if (st === 4) {
        ui.coach('Feel that power! Your first win also earned a <b>Pro Scout ticket</b>. Tap <b>RECRUIT</b>.', { target: '[data-nav="recruit"]' });
      } else if (st === 5) {
        if (ui.current() !== 'recruit') { ui.coach('Open the <b>RECRUIT</b> tab.', { target: '[data-nav="recruit"]' }); return; }
        ui.coach('Use your ticket. Your first Pro Scout recruit is <b>guaranteed Rare</b>. Odds are always listed under "Odds".', { target: '[data-tut="pull1"]', pos: 'top' });
      } else if (st === 6) {
        ui.coach('Welcome to the squad! New recruits join your lineup automatically. Back to the court — tap <b>PLAY</b>.', { target: '[data-nav="play"]' });
      } else if (st === 7) {
        ui.clearCoach();
        const mm = BE.meta.mapModal();
        ui.coach('This is your road: <b>10 worlds</b>, from this blacktop to the Basketball Multiverse. Win each world\'s championship to move up.', { pos: 'top' });
        mm.opts.onClose = () => { s.tutorial.step = 8; tutorial.show(); };
      } else if (st === 8) {
        ui.coach('One more thing: your team <b>keeps playing while you\'re away</b>. Come back to collect offline earnings — facilities and coaches make them bigger.', { ok: 'Got it', block: true, onOk: () => { s.tutorial.step = 9; tutorial.show(); } });
      } else if (st === 9) {
        ui.coach('From here, the <b>Franchise Story</b> bar under the court always shows your next goal. Tap <b>GO</b> to jump to it and <b>CLAIM</b> when it\'s done. Fill your five-player squad and win the <b>Block Party Classic</b>. Let\'s ball!', { ok: 'Let\'s go!', block: true, onOk: () => tutorial.finish() });
      }
    },
    finish() {
      const s = S();
      s.tutorial.done = true; s.tutorial.step = 99;
      ui.clearCoach();
      ui.renderNav(s);
      BE.play.renderPlay();
      save();
    },
    skip() { tutorial.finish(); },
    advance(to) { const s = S(); if (s.tutorial.done || s.tutorial.step >= to) return; s.tutorial.step = to; ui.renderNav(s); setTimeout(() => tutorial.show(), 250); },
  };
  BE.tutorial = tutorial;

  BE.bus.on('ability', () => { const s = S(); if (!s.tutorial.done && s.tutorial.step === 1) ui.coach('That\'s the spirit! Abilities refill as your team plays.', { pos: 'top' }); });
  BE.bus.on('match:end', (res) => {
    const s = S();
    if (!s.tutorial.done && s.tutorial.step <= 1 && res.win) {
      E.addCash(s, 25);
      setTimeout(() => ui.toast('Neighborhood sponsor: +$25', 'good', 'cash'), 900);
      tutorial.advance(2);
    }
  });
  BE.bus.on('nav', (k) => {
    const s = S();
    if (s.tutorial.done) return;
    const st = s.tutorial.step;
    if ((st === 2 || st === 3) && k === 'team') { s.tutorial.step = 3; setTimeout(() => tutorial.show(), 300); }
    else if ((st === 4 || st === 5) && k === 'recruit') { s.tutorial.step = 5; setTimeout(() => tutorial.show(), 300); }
    else if (st === 6 && k === 'play') { s.tutorial.step = 7; setTimeout(() => tutorial.show(), 300); }
    else setTimeout(() => tutorial.show(), 300);
  });
  BE.bus.on('levelup', () => { const s = S(); if (!s.tutorial.done && s.tutorial.step === 3) tutorial.advance(4); });
  BE.bus.on('recruit:done', () => { const s = S(); if (!s.tutorial.done && s.tutorial.step === 5) tutorial.advance(6); });
  BE.bus.on('changed', () => { main.dirty = true; });

  // ---------- Loop ----------
  function frame(now) {
    const dt = Math.min(0.25, (now - lastFrame) / 1000);
    lastFrame = now;
    const s = S();
    if (s && main.started) {
      try {
        BE.play.update(dt);
        BE.play.draw();
      } catch (e) { console.error('play loop', e); BE.play.restartMatch(); }
      ui.updateHUD(s, dt);
      tickAcc += dt; secAcc += dt; saveAcc += dt; cloudAcc += dt; introAcc += dt; refreshAcc += dt;
      if (tickAcc >= 0.25) { G.tick(s, tickAcc); tickAcc = 0; }
      if (secAcc >= 1) {
        secAcc = 0;
        BE.play.updateIncome();
        ui.updateBadges(s);
        if (s.tutorial.step === 1 && !s.tutorial.done && !document.querySelector('.spot') && BE.play.R.match && BE.play.R.match.energy >= 40) tutorial.show();
        const msgs = G.resets(s);
        for (const msg of msgs) ui.toast(msg, 'gold', 'gift');
        BE.play.renderObjective();
        if (BE.growth) BE.growth.refresh();
      }
      if (introAcc >= 2) { introAcc = 0; BE.meta.checkFeatureIntros(); }
      if (refreshAcc >= 2 && ui.current() !== 'play' && performance.now() - main.lastPointer > 800 && !ui.anyModal()) { refreshAcc = 0; ui.renderScreen(ui.current()); }
      if (main.dirty && ui.current() !== 'play' && performance.now() - main.lastPointer > 300) { main.dirty = false; }
      if (saveAcc >= 5) { saveAcc = 0; save(); }
      if (cloudAcc >= 45) { cloudAcc = 0; saveCloud(); }
    }
    requestAnimationFrame(frame);
  }

  // ---------- Offline ----------
  function runOffline(seconds) {
    const s = S();
    if (!s || seconds < 60 || !s.tutorial.done) return;
    const res = G.offline(s, seconds);
    if (res.games > 0 || res.cash > 0) BE.meta.offlineModal(res);
    ui.renderHUD(s);
    BE.play.restartMatch();
  }
  let hiddenAt = 0;
  document.addEventListener('visibilitychange', () => {
    if (!main.started) return;
    if (document.hidden) { hiddenAt = Date.now(); save(); saveCloud(); BE.audio.suspend(true); }
    else {
      BE.audio.suspend(false);
      const away = (Date.now() - (hiddenAt || Date.now())) / 1000;
      lastFrame = performance.now();
      if (away >= 60) runOffline(away);
      else if (away > 1) G.tick(S(), away);
    }
  });
  root.addEventListener('pagehide', () => { save(); saveCloud(); });
  root.addEventListener('resize', () => BE.court.resize());
  document.addEventListener('pointerdown', () => { main.lastPointer = performance.now(); }, true);

  // ---------- Boot ----------
  function shell() {
    const app = $('#app');
    app.innerHTML = '<header id="hud"></header><section id="arena"></section><main id="screens"><section class="screen active" id="scr-play"></section><section class="screen" id="scr-team"></section><section class="screen" id="scr-recruit"></section><section class="screen" id="scr-empire"></section><section class="screen" id="scr-shop"></section></main><nav id="nav"></nav>';
    document.addEventListener('click', dispatch);
  }

  function splash(onStart) {
    const sp = document.createElement('div');
    sp.className = 'splash';
    sp.innerHTML = '<div class="logo">' + ui.ballArt + '<div class="t1">BASKETBALL</div><div class="t2">EMPIRE</div><div class="muted" style="margin-top:18px;font-family:var(--cond);letter-spacing:2px" data-sp>LOADING<span class="loading-dots"></span></div></div>';
    document.body.appendChild(sp);
    const ready = () => {
      const t = $('[data-sp]', sp);
      t.innerHTML = '<button class="btn gold" style="min-width:200px;min-height:56px;font-size:22px" data-go>TAP TO PLAY</button>';
      $('[data-go]', sp).addEventListener('click', () => {
        BE.audio.ensure();
        applySettings();
        BE.audio.play('buzzer');
        sp.style.transition = 'opacity .35s'; sp.style.opacity = '0';
        setTimeout(() => sp.remove(), 360);
        onStart();
      });
    };
    return ready;
  }

  async function boot(hotData) {
    shell();
    let raw = (hotData && hotData.save) ? JSON.parse(hotData.save) : ST.store.loadLocal();
    BE.game_state = ST.load(raw);
    const isNew = !raw;
    const s0 = S();
    const awaySec = isNew ? 0 : (Date.now() - s0.lastSeen) / 1000;
    G.resets(s0);
    applySettings();
    ui.renderHUD(s0); ui.renderNav(s0);
    BE.play.renderPlay();
    BE.services.init();
    const ready = splash(() => {
      main.started = true;
      main.sessionStart = Date.now();
      lastFrame = performance.now();
      const s = S();
      if (!s.tutorial.done && s.tutorial.step === 0) tutorial.intro();
      else if (!s.tutorial.done) tutorial.show();
      else if (awaySec >= 60 && !hotData) runOffline(awaySec);
      // daily login nudge
      setTimeout(() => { const st = S(); if (st.tutorial.done && E.unlocked(st, 'daily') && !G.loginStatus(st).claimedToday && !ui.anyModal()) BE.meta.dailyModal(); }, 1500);
    });
    requestAnimationFrame(frame);
    // Optional cloud save (claude.ai per-viewer storage). Never blocks play.
    const cloudP = ST.store.initCloud().then((cloudRaw) => {
      if (cloudRaw && (!raw || (cloudRaw.lastSeen || 0) > (S().lastSeen || 0) + 5000)) {
        const ns = ST.load(cloudRaw);
        BE.game_state = ns;
        E.invalidate(); G.resets(ns); applySettings();
        ui.renderHUD(ns); ui.renderNav(ns);
        BE.play.restartMatch();
        ui.renderScreen(ui.current());
        if (main.started) ui.toast('Cloud save loaded', 'good', 'check');
        return 'cloud';
      }
      if (ST.store.cloud.ready) saveCloud();
      return 'local';
    }).catch(() => 'local');
    await Promise.race([cloudP, new Promise((r) => setTimeout(r, 1200))]);
    ready();
  }

  // Hot-update support for the claude.ai viewer: carry the save across a republish
  try {
    const hot = root.claude && root.claude.hot;
    if (hot && hot.snapshot) hot.snapshot(() => ({ save: S() ? ST.serialize(S()) : null }));
  } catch (e) { /* not in a viewer */ }

  main.save = save;
  main.runOffline = runOffline;
  main.replaceState = replaceState;
  main.resetAll = resetAll;
  main.boot = boot;
  BE.main = main;

  function start() {
    const hot = root.claude && root.claude.hot;
    if (hot && hot.ready) hot.ready((data) => boot(data && data.save ? data : null));
    else boot(hot && hot.data && hot.data.save ? hot.data : null);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})(typeof window !== 'undefined' ? window : globalThis);
