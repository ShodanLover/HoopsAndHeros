/* Basketball Empire — Play screen: live match runner, scoreboard, commentary, abilities, results, championships */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, S_ = BE.sim, CT = BE.court, A = BE.athletes;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;

  const R = { match: null, phase: 'idle', betweenT: 0, quickWait: 0, hold: false, lines: [], lastScore: [0, 0], champBannerShown: false, lastObjective: '' };

  // ---------- Layout ----------
  // The arena (stage header, court, abilities, objective) is pinned above the tabs and never leaves the screen.
  // The Play tab itself holds the hub, toolbar and commentary.
  function renderArena() {
    const s = S();
    const el = $('#arena');
    if (!el) return;
    if (!el.dataset.built) {
      el.innerHTML =
        '<div class="stagebar"><div class="grow"><div class="wname" data-p="wname"></div><div class="wsub" data-p="wsub"></div><div class="pips" data-p="pips"></div></div>' +
        '<button class="icon-btn" data-act="map" aria-label="World map">' + icon('map') + '</button></div>' +
        '<div class="court-wrap" data-p="courtwrap"><canvas id="court"></canvas><div class="scoreboard" data-p="sb"></div><div class="result-pop hidden" data-p="result"></div><div data-p="overlay"></div></div>' +
        '<div class="controls" data-p="controls"></div>' +
        '<div class="quest" data-p="objective"></div>';
      el.dataset.built = '1';
      CT.init($('#court'));
      CT.setTheme(E.worldOf(s.run.cleared), G.cosmetic(s));
    }
    renderStageBar();
    renderObjective();
    renderControls();
    renderOverlay();
    renderScoreboard();
    requestAnimationFrame(() => CT.resize());
  }
  function renderPlay() {
    renderArena();
    const el = $('#scr-play');
    if (!el.dataset.built) {
      el.innerHTML =
        '<div class="hub" data-p="hub"></div>' +
        '<div class="toolbar" data-p="toolbar"></div>' +
        '<div class="ticker" data-p="ticker"><div class="tl">Welcome to the court.</div><div class="tl"></div></div>' +
        '<div data-p="growth"></div>' +
        '<div data-p="boosts"></div>' +
        '<div data-p="squad"></div>';
      el.dataset.built = '1';
    }
    renderHub();
    renderToolbar();
    if (BE.growth) BE.growth.render();
  }

  function renderStageBar() {
    const s = S();
    const tg = G.target(s);
    const g = tg.mode === 'champ' ? tg.g : s.run.cleared;
    const w = E.worldOf(Math.min(g, 99));
    const W = D.worlds[w];
    $('[data-p="wname"]').innerHTML = '<span style="color:' + W.color + '">W' + (w + 1) + '</span> ' + W.name;
    const fmt = E.formatOf(Math.min(g, 99));
    let sub = W.arena + ' · ' + D.formats[fmt].label;
    if (s.run.cleared >= 100) sub = 'Multiverse Rift ' + (s.run.cleared - 99) + ' · Endless';
    $('[data-p="wsub"]').textContent = sub;
    const pips = [];
    const base = w * 10;
    for (let i = 0; i < 10; i++) {
      const gi = base + i;
      const cls = gi < s.run.cleared ? 'done' : gi === Math.min(s.run.cleared, 99) ? 'cur' : '';
      pips.push('<span class="pip ' + cls + (i === 9 ? ' champ' : '') + '"></span>');
    }
    $('[data-p="pips"]').innerHTML = s.run.cleared >= 100 ? '' : pips.join('');
  }

  const HUB = [
    { k: 'camps', label: 'Camps', icon: 'dumbbell', feature: 'camps' },
    { k: 'missions', label: 'Missions', icon: 'missions', feature: 'missions' },
    { k: 'daily', label: 'Daily', icon: 'daily', feature: 'daily' },
    { k: 'pass', label: 'Pass', icon: 'pass', feature: 'pass' },
    { k: 'events', label: 'Events', icon: 'events', feature: 'events' },
    { k: 'social', label: 'Leagues', icon: 'social', feature: 'social' },
    { k: 'trophies', label: 'Trophies', icon: 'trophy', feature: 'missions' },
  ];
  function renderHub() {
    const s = S();
    const el = $('[data-p="hub"]');
    const b = badges(s);
    const items = HUB.filter((h) => E.unlocked(s, h.feature) && s.tutorial.done);
    el.classList.toggle('hidden', items.length === 0);
    el.innerHTML = items.map((h) => '<button class="hub-btn' + (b[h.k] ? ' hot' : '') + '" data-act="hub" data-k="' + h.k + '">' + icon(h.icon) + '<span>' + h.label + '</span>' + (b[h.k] ? '<span class="dot"></span>' : '') + '</button>').join('');
  }

  function objectiveText(s) {
    const tg = G.target(s);
    if (!s.tutorial.done && s.tutorial.step < 9) {
      if (s.run.cleared === 0) return { t: 'Win your first streetball game', s: 'Your player plays automatically. Watch and cheer!', i: 'ball' };
    }
    if (tg.mode === 'champ') return { t: D.worlds[E.worldOf(tg.g)].champ + ': ' + ['Quarterfinal', 'Semifinal', 'Final'][tg.round], s: 'Three straight wins takes the trophy', i: 'trophy' };
    if (tg.champReady) return { t: 'Enter the ' + D.worlds[E.worldOf(s.run.cleared)].champ, s: 'Win 3 games to reach World ' + (E.worldOf(s.run.cleared) + 2), i: 'trophy' };
    if (s.run.farming) {
      const need = E.oppPower(s.run.cleared);
      return { t: 'Wall: ' + U.fmt(need) + ' power needed', s: 'Your lineup: ' + U.fmt(E.teamPower(s, E.sizeOf(Math.min(s.run.cleared, 99)))) + ' · Upgrade, then retry', i: 'up' };
    }
    // Next unlock teaser
    let next = null;
    for (const k in D.features) { const f = D.features[k]; if (s.best < f.g && (!next || f.g < next.g)) next = f; }
    const opp = G.oppTeam(s, s.run.cleared);
    const sub = next ? 'Next unlock: ' + next.name + ' at ' + ui.stageName(next.g) : 'Opponent power ' + U.fmt(opp.power);
    return { t: 'Beat ' + opp.name + ' · ' + E.stageLabel(s.run.cleared), s: sub, i: 'ball' };
  }
  function renderObjective() {
    const s = S();
    const el = $('[data-p="objective"]');
    if (!el) return;
    const st = G.questState(s);
    let key, html;
    if (!st.q) {
      const o = objectiveText(s);
      key = 'done' + o.t + o.s;
      html = '<span class="qi">' + icon('trophy') + '</span><div class="qt"><div class="qlabel">Franchise Story complete</div><div class="qn">' + U.esc(o.t) + '</div></div>';
    } else {
      key = st.q.id + ':' + st.prog + ':' + (st.done ? 1 : 0);
      const ic = { play: 'ball', champ: 'trophy', growth: 'chart', team: 'jersey', recruit: 'cards', empire: 'empire', events: 'events' }[st.q.go] || 'ball';
      html = '<span class="qi">' + icon(ic) + '</span><div class="qt"><div class="qlabel">Franchise Story · ' + (st.i + 1) + '/' + st.total + '</div><div class="qn">' + U.esc(st.q.text) + '</div>' +
        '<div class="qm"><div class="bar ' + (st.done ? 'green' : '') + '"><i style="width:' + Math.min(100, st.prog / st.q.n * 100) + '%"></i></div><span class="num">' + U.fmtInt(st.prog) + '/' + U.fmtInt(st.q.n) + '</span><span class="qr">' + ui.rewardPreview(st.q.reward) + '</span></div></div>' +
        (st.done ? '<button class="btn sm green pulse" data-act="questclaim">Claim</button>' : '<button class="btn sm gold" data-act="questgo">Go</button>');
    }
    if (key === R.lastObjective) return;
    R.lastObjective = key;
    el.innerHTML = html;
  }
  // Where the GO button takes the player
  function questGo() {
    const s = S();
    const st = G.questState(s);
    if (!st.q) return;
    const go = st.q.go;
    BE.audio.play('tab');
    if (go === 'growth') { ui.go('play'); const row = $('.grow-row'); if (row) { row.scrollIntoView({ block: 'center', behavior: 'smooth' }); ui.flash(row); } return; }
    if (go === 'team' || go === 'recruit' || go === 'empire') { ui.go(go); return; }
    if (go === 'events') { if (E.unlocked(s, 'events')) BE.meta.eventsModal(); else ui.toast('Skill Contests unlock at ' + ui.stageName(D.features.events.g), '', 'lock'); return; }
    if (go === 'champ') {
      const tg = G.target(s);
      if (tg.champReady && !s.run.champ) { enterChampionship(); return; }
      if (s.run.champ) { ui.toast('The championship is underway. Win three straight!', '', 'trophy'); return; }
      ui.toast('Reach Game 10 of this world to enter the championship', '', 'trophy'); ui.flash($('[data-p="courtwrap"]')); return;
    }
    // play: the court is already working on it
    if (s.run.farming) { ui.toast('Your team is farming the last win. Upgrade, then tap Retry on the court.', '', 'up'); ui.go('play'); return; }
    ui.toast('Your team is on it. Keep the court running!', '', 'ball'); ui.flash($('[data-p="courtwrap"]'));
  }
  function questClaim(el) {
    const s = S();
    const r = G.claimQuest(s);
    if (!r) return;
    BE.audio.play('claim');
    BE.services.haptic(20);
    if (el) ui.sparks(el, '#ffd23f', 18);
    const seen = {};
    for (const g of r.granted) if (['cash', 'gems', 'tickets', 'eventTickets'].includes(g.k) && !seen[g.k]) { seen[g.k] = 1; ui.flyCurrency(g.k, el, 8); }
    ui.toast('Quest complete: ' + U.esc(r.q.text) + (r.next ? ' · Next: ' + U.esc(r.next.text) : ''), 'gold', 'check');
    R.lastObjective = '';
    renderObjective();
    ui.updateBadges(s);
    BE.bus.emit('quest', r);
    BE.bus.emit('changed');
  }

  function renderControls() {
    const s = S();
    const el = $('[data-p="controls"]');
    const m = R.match;
    const energy = m ? m.energy : 0;
    const costMult = E.mods(s).energyCost;
    let html = '<div class="energy"><span class="label">Energy</span><div class="bar"><i style="width:' + energy + '%"></i></div><span class="num small" data-p="enum">' + Math.floor(energy) + '</span></div>';
    for (const ab of D.abilities) {
      const unlocked = s.best >= ab.unlock || (ab.unlock === 0);
      const cost = Math.round(ab.cost * costMult);
      const ready = unlocked && m && !m.over && energy >= cost && R.phase === 'playing';
      const active = m && ((ab.k === 'hype' && m.fx[0].hype > 0) || (ab.k === 'lockdown' && m.fx[0].lockdown > 0) || (ab.k === 'iso' && m.fx[0].iso));
      const ic = { hype: 'fire', iso: 'bolt', lockdown: 'shield', timeout: 'clock' }[ab.k];
      html += '<button class="abil' + (ready ? ' ready' : '') + (active ? ' active' : '') + '" style="--ab:' + ab.color + '" data-act="ability" data-k="' + ab.k + '" data-ab="' + ab.k + '"' + (unlocked ? '' : ' disabled') + ' title="' + U.esc(ab.desc) + '">' +
        icon(unlocked ? ic : 'lock') + '<span>' + (unlocked ? ab.name : 'Locked') + '</span><span class="cost">' + (unlocked ? cost + ' ⚡' : 'G' + (ab.unlock + 1)) + '</span></button>';
    }
    el.innerHTML = html;
  }
  function updateControls() {
    const s = S(), m = R.match;
    if (!m) return;
    const bar = $('[data-p="controls"] .energy .bar > i');
    if (bar) bar.style.width = m.energy + '%';
    const n = $('[data-p="enum"]'); if (n) n.textContent = Math.floor(m.energy);
    const costMult = E.mods(s).energyCost;
    for (const ab of D.abilities) {
      const b = $('[data-ab="' + ab.k + '"]');
      if (!b || b.disabled) continue;
      const ready = !m.over && m.energy >= Math.round(ab.cost * costMult) && R.phase === 'playing';
      b.classList.toggle('ready', ready);
      const active = (ab.k === 'hype' && m.fx[0].hype > 0) || (ab.k === 'lockdown' && m.fx[0].lockdown > 0) || (ab.k === 'iso' && m.fx[0].iso);
      b.classList.toggle('active', !!active);
    }
  }

  function speeds(s) {
    const list = [1, 2];
    if (s.best >= 10 || s.purchases.vip) list.push(3);
    if ((s.prestige.upgrades.turbo || 0) > 0 || s.purchases.vip) list.push(4);
    return list;
  }
  function renderToolbar() {
    const s = S();
    const el = $('[data-p="toolbar"]');
    const sp = Math.min(s.settings.speed, Math.max.apply(null, speeds(s)));
    let html = '<button class="chip on" data-act="speed">' + icon('ff') + ' ' + sp + 'x</button>';
    if (E.unlocked(s, 'tactics')) html += '<button class="chip" data-act="tactics">' + icon('tactics') + ' Tactics</button>';
    if (E.unlocked(s, 'autocoach')) html += '<button class="chip' + (s.settings.autoAbilities ? ' on' : '') + '" data-act="autoabil">' + icon('bolt') + ' Auto</button>';
    if (s.tutorial.done) html += '<button class="chip' + (s.settings.autoPush ? ' on' : '') + '" data-act="autopush" title="Automatically retry the next stage after 3 farm wins">' + icon('up') + ' Push</button>';
    html += '<div class="income" data-p="income"></div>';
    el.innerHTML = html;
    updateIncome();
  }
  function updateIncome() {
    const s = S();
    const el = $('[data-p="income"]');
    if (!el) return;
    const inc = E.passivePerSec(s) + E.divisionPerSec(s);
    el.innerHTML = '<b>+$' + U.fmt(inc) + '/s</b> idle';
  }

  function renderOverlay() {
    const s = S();
    const el = $('[data-p="overlay"]');
    const tg = G.target(s);
    let html = '';
    if (tg.champReady && !s.run.champ && s.tutorial.done) {
      html = '<div class="court-overlay" style="bottom:12px"><button class="btn gold pulse stack" data-act="enterchamp">' + icon('trophy') + ' Enter ' + U.esc(D.worlds[E.worldOf(s.run.cleared)].champ) + '<span class="sub">3-round tournament · big rewards</span></button></div>';
    } else if (s.run.farming && s.run.cleared > 0 && !s.run.champ) {
      const need = E.oppPower(s.run.cleared), have = E.teamPower(s, E.sizeOf(Math.min(s.run.cleared, 99)));
      html = '<div class="wall-hint"><span style="color:var(--bad)">' + icon('shield') + '</span><span class="grow"><b>Farming last win.</b> Next foe: ⚡' + U.fmt(need) + ' vs your ⚡' + U.fmt(have) + '</span><button class="btn xs" data-act="goteam">Upgrade</button><button class="btn xs ghost" data-act="retry">Retry</button></div>';
    }
    el.innerHTML = html;
  }

  function teamLabel(t) { return U.esc(t.name); }
  function renderScoreboard() {
    const m = R.match;
    const el = $('[data-p="sb"]');
    if (!el) return;
    if (!m) { el.innerHTML = '<div class="sb-mid" style="grid-column:1/-1">Warming up…</div>'; return; }
    const h = m.teams[0], a = m.teams[1];
    el.innerHTML =
      '<div class="sb-team"><span class="sb-sw" style="background:' + h.colors[0] + '"></span><div style="min-width:0"><div class="sb-name">' + teamLabel(h) + '</div><div class="sb-pow">⚡' + U.fmt(h.power) + '</div></div><div class="sb-score" data-sb="0">' + m.score[0] + '</div></div>' +
      '<div class="sb-mid" data-sb="mid"></div>' +
      '<div class="sb-team away"><span class="sb-sw" style="background:' + a.colors[0] + '"></span><div style="min-width:0"><div class="sb-name">' + teamLabel(a) + '</div><div class="sb-pow">⚡' + U.fmt(a.power) + '</div></div><div class="sb-score" data-sb="1">' + m.score[1] + '</div></div>';
    R.lastScore = m.score.slice();
    updateScoreboard();
  }
  function updateScoreboard() {
    const m = R.match;
    if (!m) return;
    for (let i = 0; i < 2; i++) {
      const e = $('[data-sb="' + i + '"]');
      if (!e) continue;
      if (R.lastScore[i] !== m.score[i]) { e.textContent = m.score[i]; e.classList.remove('pop'); void e.offsetWidth; e.classList.add('pop'); }
    }
    R.lastScore = m.score.slice();
    const mid = $('[data-sb="mid"]');
    if (mid) {
      let q;
      if (m.format === '5v5') q = m.over ? 'FINAL' : m.overtime ? 'OT' : 'Q' + m.quarter;
      else q = m.over ? 'FINAL' : 'TO ' + m.rules.target;
      const tg = m.ctx;
      const sub = tg.mode === 'champ' ? ['QF', 'SF', 'FINAL'][tg.round] : tg.mode === 'farm' ? 'Replay' : E.stageLabel(tg.g).replace('Game ', 'G');
      mid.innerHTML = '<div class="q">' + q + '</div><div>' + sub + '</div>';
    }
  }

  // ---------- Commentary ----------
  function nm(m, team, idx) { const p = m.teams[team].players[idx]; return p ? (p.short || p.last || p.name) : '?'; }
  function describe(ev, m) {
    const segs = ev.segs;
    const lines = [];
    const shots = segs.filter((x) => x.t === 'shot');
    const last = shots[shots.length - 1];
    const st = segs.find((x) => x.t === 'steal');
    const ft = segs.find((x) => x.t === 'ft');
    const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];
    if (st) lines.push(pick(['{d} picks the pocket of {o}!', 'Steal by {d}! {o} coughs it up.', '{d} jumps the lane — turnover!']).replace('{d}', nm(m, st.team, st.who)).replace('{o}', nm(m, 1 - st.team, st.from)));
    else if (ft) { const made = ft.shots.filter(Boolean).length; lines.push(nm(m, ft.team, ft.who) + ' gets fouled and hits ' + made + ' of ' + ft.shots.length + ' at the line.'); }
    else if (last) {
      const who = nm(m, last.team, last.who);
      if (last.blockedBy !== undefined) lines.push(pick(['REJECTED by {b}! Get that outta here!', '{b} swats {s} at the rim!', 'Denied! {b} with the block.']).replace('{b}', nm(m, 1 - last.team, last.blockedBy)).replace('{s}', who));
      else if (last.made) {
        const ast = last.assist >= 0 ? ' (dime from ' + nm(m, last.team, last.assist) + ')' : '';
        const t = {
          three: ['{s} buries the three!', 'Bang! {s} from downtown!', '{s} splashes it from deep!'],
          mid: ['{s} pulls up — nothing but net.', 'Smooth jumper from {s}.', '{s} with the fadeaway, good!'],
          layup: ['{s} glides in for the layup.', 'Euro-step and score by {s}.', '{s} finishes off the glass.'],
          dunk: ['{s} THROWS IT DOWN!', 'Oh my! {s} with the monster jam!', '{s} rocks the rim!'],
          post: ['{s} backs down and scores.', 'Drop step, bucket — {s}.', '{s} bullies inside for two.'],
          putback: ['{s} cleans it up with the putback!', 'Second chance — {s} puts it home.'],
        }[last.kind];
        lines.push(pick(t).replace('{s}', who) + ast);
      } else lines.push(pick(['{s} misses the ' + last.kind + '.', '{s} rims it out.', 'No good from {s}.']).replace('{s}', who));
      const rb = segs.filter((x) => x.t === 'rebound').pop();
      if (rb && !last.made) lines[lines.length - 1] += ' ' + nm(m, rb.team, rb.who) + (rb.off ? ' crashes the offensive glass!' : ' grabs the board.');
    }
    if (ev.endQuarter && !m.over) lines.push('End of Q' + ev.endQuarter + ': ' + m.score[0] + '-' + m.score[1]);
    if (ev.clutch && Math.random() < 0.4) lines.push('Clutch time — the crowd is on its feet!');
    return lines;
  }
  function pushLine(text) {
    if (!S().settings.commentary) return;
    R.lines.unshift(text);
    R.lines = R.lines.slice(0, 2);
    const el = $('[data-p="ticker"]');
    if (el) el.innerHTML = R.lines.map((l) => '<div class="tl">' + U.esc(l) + '</div>').join('');
  }

  // ---------- Match runtime ----------
  function startNext() {
    const s = S();
    R.match = G.newMatch(s);
    const m = R.match;
    CT.setTheme(E.worldOf(Math.min(m.ctx.g, 99)), G.cosmetic(s));
    CT.startMatch(m);
    CT.speed = speedOf(s);
    R.phase = 'playing';
    R.quickWait = 0.5;
    $('[data-p="result"]') && $('[data-p="result"]').classList.add('hidden');
    renderScoreboard();
    renderStageBar();
    renderControls();
    renderOverlay();
    R.lastObjective = '';
    renderObjective();
    const tg = m.ctx;
    if (tg.mode === 'champ') {
      CT.showBanner(['QUARTERFINAL', 'SEMIFINAL', 'CHAMPIONSHIP FINAL'][tg.round], D.worlds[E.worldOf(tg.g)].champ, '#ffd23f', 2.2);
      CT.C.shake = Math.max(CT.C.shake, 8 + tg.round * 3);
      CT.excite(0.9, true);
      BE.audio.play('buzzer');
    } else if (tg.mode === 'push' && E.stageOf(tg.g) === 0 && tg.g > 0) {
      CT.showBanner(D.worlds[E.worldOf(tg.g)].arena.toUpperCase(), 'Welcome to ' + D.worlds[E.worldOf(tg.g)].name, D.worlds[E.worldOf(tg.g)].color, 2.2);
    } else CT.showBanner('TIP-OFF', m.teams[0].name + ' vs ' + m.teams[1].name, '#ffffff', 1.2);
    pushLine((tg.mode === 'farm' ? 'Replay vs ' : 'Up next: ') + m.teams[1].name + ' (' + m.rules.label + ').');
    BE.audio.setAmbience(0.4 + E.worldOf(tg.g) * 0.06);
  }
  function speedOf(s) { const list = speeds(s); return list.includes(s.settings.speed) ? s.settings.speed : list[list.length - 1]; }

  function autoAbility(s, m) {
    if (!s.settings.autoAbilities || !E.unlocked(s, 'autocoach')) return;
    const cm = E.mods(s).energyCost;
    const can = (k) => { const ab = D.abilities.find((a) => a.k === k); return s.best >= ab.unlock && m.energy >= Math.round(ab.cost * cm); };
    const trailing = m.score[0] <= m.score[1];
    if (m.fx[0].hype <= 0 && can('hype')) useAbility('hype', true);
    else if (trailing && m.offense === 1 && m.fx[0].lockdown <= 0 && can('lockdown')) useAbility('lockdown', true);
    else if (m.energy > 90 && m.offense === 0 && can('iso')) useAbility('iso', true);
  }

  function useAbility(k, auto) {
    const s = S(), m = R.match;
    if (!m || R.phase !== 'playing') return false;
    const ok = S_.useAbility(m, k, E.mods(s).energyCost);
    if (!ok) { if (!auto) { BE.audio.play('error'); ui.toast('Not enough energy yet', '', 'bolt'); } return false; }
    const ab = D.abilities.find((a) => a.k === k);
    s.stats.abilities++;
    CT.showBanner(ab.name.toUpperCase() + '!', ab.desc, ab.color, 1.1);
    CT.excite(0.6, true);
    BE.audio.play(k === 'timeout' ? 'whistle' : 'milestone');
    BE.services.haptic(20);
    if (!auto) ui.sparks($('[data-ab="' + k + '"]'), ab.color, 14);
    renderControls();
    BE.bus.emit('ability', k);
    return true;
  }

  function finishMatch() {
    const s = S(), m = R.match;
    const res = G.onMatchEnd(s, m);
    R.phase = 'between';
    R.betweenT = 2.2;
    R.lastResult = res;
    const resEl = $('[data-p="result"]');
    const mvpIdx = S_.mvp(m, 0);
    const mvp = m.teams[0].players[mvpIdx];
    const ms = m.stats[0][mvpIdx];
    if (resEl) {
      const chips = [];
      if (res.cash) chips.push(ui.rewChip('cash', res.cash));
      if (res.fans) chips.push('<span class="chip">+' + U.fmt(res.fans) + ' fans</span>');
      if (res.gems) chips.push(ui.rewChip('gems', res.gems));
      if (res.tickets) chips.push(ui.rewChip('tickets', res.tickets));
      if (res.gear) chips.push('<span class="chip gold">' + icon('gear') + ' Gear drop!</span>');
      resEl.innerHTML = '<div class="rp"><div class="big" style="color:' + (res.win ? 'var(--good)' : 'var(--bad)') + '">' + (res.win ? (res.champ ? 'CHAMPIONS!' : 'VICTORY') : 'DEFEAT') + '</div>' +
        '<div class="num" style="font-size:18px">' + m.score[0] + ' – ' + m.score[1] + '</div>' +
        (res.win && mvp ? '<div class="small" style="margin-top:2px">MVP: <b>' + U.esc(mvp.short || mvp.name) + '</b> · ' + ms.pts + ' pts' + (ms.reb ? ', ' + ms.reb + ' reb' : '') + (ms.ast ? ', ' + ms.ast + ' ast' : '') + '</div>' : '') +
        '<div class="rw">' + chips.join('') + '</div></div>';
      resEl.classList.remove('hidden');
    }
    BE.audio.play(res.win ? 'win' : 'lose');
    if (res.win) BE.services.haptic(30);
    if (res.cash) ui.flyCurrency('cash', $('[data-p="courtwrap"]'), res.win ? 8 : 3);
    if (res.gems) setTimeout(() => ui.flyCurrency('gems', $('[data-p="courtwrap"]'), 4), 300);
    if (res.gear) ui.toast('New gear: ' + ui.gearName(res.gear), 'gold', 'gear');
    if (res.gifts && res.gifts.length) {
      const names = res.gifts.map((a) => A.tpl(a.cid).first + ' ' + A.tpl(a.cid).last).join(' & ');
      ui.toast(names + ' joined your squad for ' + E.formatOf(Math.min(s.run.cleared, 99)) + '!', 'good', 'social');
    }
    if (!res.win && res.mode === 'push') pushLine('Tough loss. The team will farm the last win while you upgrade.');
    if (res.champLost !== undefined) pushLine('Eliminated in the ' + ['quarterfinal', 'semifinal', 'final'][res.champLost] + '. Upgrade and try again!');
    if (res.advanced && !res.champ) {
      const g = s.run.cleared;
      if (g === s.best && res.mode === 'push') { CT.showBanner('NEW BEST!', E.stageLabel(g) + ' cleared', '#ffd23f', 1.6); CT.excite(0.8, true); }
      if (E.isChamp(g) && g < 100) setTimeout(() => ui.toast(D.worlds[E.worldOf(g)].champ + ' is ready! Tap the trophy button.', 'gold', 'trophy'), 900);
    }
    BE.bus.emit('match:end', res);
    if (res.champ) {
      R.hold = true;
      setTimeout(() => BE.meta.championCeremony(res, () => { R.hold = false; R.betweenT = 0.3; }), 1200);
    }
    renderStageBar();
    renderOverlay();
    R.lastObjective = '';
    renderObjective();
    renderControls();
    BE.ui.updateBadges(s);
    renderHub();
  }

  function update(dt) {
    const s = S();
    if (!s) return;
    CT.speed = speedOf(s);
    CT.update(dt);
    if (BE.camps) BE.camps.tickGift(dt);
    if (R.phase === 'idle') { startNext(); return; }
    if (R.phase === 'between') {
      if (R.hold || (BE.tutorial && BE.tutorial.blocking())) return;
      R.betweenT -= dt;
      if (R.betweenT <= 0) startNext();
      return;
    }
    if (R.phase !== 'playing' || !R.match) return;
    if (CT.busy()) return;
    if (R.quickWait > 0) { R.quickWait -= dt * CT.speed; return; }
    const m = R.match;
    if (m.over) {
      R.phase = 'celebrate';
      BE.audio.play('buzzer');
      CT.celebrate(m.winner, finishMatch);
      return;
    }
    autoAbility(s, m);
    const ev = S_.nextPossession(m);
    if (!ev) return;
    if (ev.featured) {
      for (const l of describe(ev, m)) pushLine(l);
      CT.playEvent(ev, () => { updateScoreboard(); updateControls(); });
    } else {
      CT.quickEvent(ev);
      updateScoreboard();
      updateControls();
      R.quickWait = 0.16;
    }
    if (ev.overtime) CT.showBanner('OVERTIME!', 'Tied after regulation', '#ff7a2f', 1.6);
    if (ev.endQuarter && !m.over && !ev.overtime) CT.showBanner('END OF Q' + ev.endQuarter, m.score[0] + ' – ' + m.score[1], '#ffffff', 1.2);
  }

  function draw() { CT.draw(); }

  function enterChampionship() {
    const s = S();
    if (!G.startChampionship(s)) return;
    BE.audio.play('milestone');
    CT.clearTasks();
    R.match = null;
    startNext();
  }
  function retryPush() {
    const s = S();
    s.run.farming = false; s.run.farmWins = 0;
    CT.clearTasks();
    R.match = null;
    startNext();
    ui.toast('Retrying ' + E.stageLabel(s.run.cleared) + '!', '', 'up');
  }
  function restartMatch() { CT.clearTasks(); R.match = null; R.phase = 'idle'; }

  function badges(s) {
    const b = {};
    if (!s) return b;
    const claimableMissions = s.missions.daily.concat(s.missions.weekly).filter((mi) => !mi.claimed && G.missionProgress(s, mi) >= mi.goal).length;
    b.missions = claimableMissions;
    b.daily = !G.loginStatus(s).claimedToday;
    const tier = G.passTier(s);
    let passReady = 0;
    for (let t = 1; t <= tier; t++) { if (!s.pass.free.includes(t)) passReady++; if (s.pass.premium && !s.pass.prem.includes(t)) passReady++; }
    b.pass = passReady;
    b.events = E.unlocked(s, 'events') && (s.events.attempts.ft + s.events.attempts.three + s.events.attempts.dunk > 0) ? 1 : 0;
    b.camps = E.unlocked(s, 'camps') && Object.values(G.campsState(s).keys).some((k) => k > 0) ? 1 : 0;
    b.trophies = D.achievements.filter((a) => G.achievementState(s, a).ready).length;
    b.social = E.unlocked(s, 'social') && !s.social.alliance ? 1 : 0;
    b.quest = G.questState(s).done ? 1 : 0;
    b.play = (b.missions || 0) + (b.daily ? 1 : 0) + (b.pass || 0) + (b.trophies || 0) + b.quest;
    b.team = s.roster.some((a) => a.isNew) || s.gear.some((g) => g.isNew) ? 1 : 0;
    b.recruit = s.tickets > 0 && E.unlocked(s, 'recruit') ? s.tickets : 0;
    b.shop = s.timers.freeGiftDay !== U.dayKey() && E.unlocked(s, 'shop') ? 1 : 0;
    b.empire = E.canPrestige(s) && s.prestige.count === 0 ? 1 : 0;
    return b;
  }

  BE.play = { R, renderPlay, renderArena, questGo, questClaim, update, draw, useAbility, enterChampionship, retryPush, restartMatch, renderOverlay, renderToolbar, renderControls, renderObjective, renderHub, renderStageBar, updateIncome, speeds, startNext };
  ui.badges = badges;
})(typeof window !== 'undefined' ? window : globalThis);
