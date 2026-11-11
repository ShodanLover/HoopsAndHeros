/* Basketball Empire — Team screen: lineup, roster, athlete detail (level/train/equip), gear, collection */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, A = BE.athletes;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;
  let tab = 'lineup', sortBy = 'power', combo = 0, comboT = 0;

  function renderTeam() {
    const s = S();
    const el = $('#scr-team');
    const tabs = [['lineup', 'Lineup'], ['roster', 'Roster (' + s.roster.length + ')']];
    if (E.unlocked(s, 'gear')) tabs.push(['gear', 'Gear']);
    tabs.push(['collection', 'Collection']);
    if (!tabs.some((t) => t[0] === tab)) tab = 'lineup';
    let html = '<div class="tabs">' + tabs.map((t) => '<button class="tab' + (t[0] === tab ? ' active' : '') + '" data-act="teamtab" data-k="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
    if (tab === 'lineup') html += lineupHTML(s);
    else if (tab === 'roster') html += rosterHTML(s);
    else if (tab === 'gear') html += gearHTML(s);
    else html += collectionHTML(s);
    const sc = el.scrollTop;
    el.innerHTML = html;
    el.scrollTop = sc;
  }

  function lineupHTML(s) {
    const g = Math.min(s.run.cleared, 99);
    const size = E.sizeOf(g);
    const tp = E.teamPower(s, size);
    const opp = E.oppPower(s.run.cleared, s.run.champ ? s.run.champ.round : undefined);
    const ratio = tp / Math.max(1, opp);
    const status = ratio >= 1.25 ? ['Favored', 'good'] : ratio >= 0.9 ? ['Even matchup', 'gold'] : ['Underdog', 'bad'];
    let html = '<div class="card"><div class="row between"><div><div class="label">Starting ' + size + ' power</div><div class="power-num">⚡ ' + U.fmt(tp) + '</div></div>' +
      '<div style="text-align:right"><div class="label">Next opponent</div><div class="num" style="font-size:18px">⚡ ' + U.fmt(opp) + '</div><span class="chip ' + status[1] + '">' + status[0] + '</span></div></div>' +
      '<div class="bar ' + (ratio >= 1 ? 'green' : '') + '" style="margin-top:8px"><i style="width:' + Math.min(100, ratio * 50) + '%"></i></div>' +
      '<div class="row" style="margin-top:10px"><button class="btn sm ghost grow" data-act="autolineup">' + icon('swap') + ' Best lineup</button><button class="btn sm grow" data-act="levelall">' + icon('up') + ' Level all starters</button></div></div>';
    html += '<div class="sec-title"><span class="h3">Starters</span><span class="label">' + D.formats[E.formatOf(g)].label + '</span></div><div class="lineup">';
    for (let i = 0; i < 5; i++) {
      const uid = s.lineup[i];
      const a = uid && s.rosterByUid[uid];
      if (i >= size) {
        html += '<div class="slot-empty slot-locked">' + icon('lock') + '<br>Opens<br>' + E.stageLabel(E.slotUnlockG(i)) + '</div>';
        continue;
      }
      if (!a) { html += '<button class="slot-empty" data-act="tab-roster">' + icon('plus') + '<br>Add</button>'; continue; }
      const c = E.levelCost(s, a, 1);
      html += '<div>' + ui.athleteCard(s, a) + '<div class="lu-actions"><button class="btn xs ' + (s.cash >= c ? 'green' : 'ghost') + '" data-act="quicklvl" data-uid="' + a.uid + '" data-tut="lvl' + i + '">+1 $' + U.fmt(c) + '</button></div></div>';
    }
    html += '</div>';
    if (E.unlocked(s, 'gear')) {
      html += '<div class="sec-title"><span class="h3">Team equipment</span><span class="label">Boosts every starter</span></div><div class="row" style="gap:16px">';
      for (const slot of ['ball', 'trainer']) {
        const it = s.teamGear[slot] && s.gearById[s.teamGear[slot]];
        html += '<button class="gslot" data-act="teamslot" data-slot="' + slot + '">' + ui.gearBadge(it) + (slot === 'ball' ? 'Basketball' : 'Training') + '</button>';
      }
      html += '<div class="grow small muted">Team gear adds half its power bonus to every athlete.</div></div>';
    }
    const bench = s.roster.filter((a) => !s.lineup.slice(0, size).includes(a.uid));
    html += '<div class="sec-title"><span class="h3">Bench</span><span class="label">' + bench.length + ' players' + (E.unlocked(s, 'division') ? ' · earning in Dev League' : '') + '</span></div>';
    if (!bench.length) html += '<div class="card flat empty">Recruit more athletes to build your bench.</div>';
    else html += '<div class="agrid compact">' + sortRoster(s, bench).map((a) => ui.athleteCard(s, a)).join('') + '</div>';
    return html;
  }

  function sortRoster(s, list) {
    const m = E.mods(s);
    const f = {
      power: (a, b) => E.athletePower(s, b, m) - E.athletePower(s, a, m),
      rarity: (a, b) => A.tpl(b.cid).rarity - A.tpl(a.cid).rarity || b.lvl - a.lvl,
      level: (a, b) => b.lvl - a.lvl,
      ovr: (a, b) => E.athleteOvr(s, b) - E.athleteOvr(s, a),
    }[sortBy];
    return list.slice().sort(f);
  }
  function rosterHTML(s) {
    let html = '<div class="row wrap" style="margin-bottom:10px"><span class="label">Sort</span>' +
      ['power', 'rarity', 'level', 'ovr'].map((k) => '<button class="chip' + (k === sortBy ? ' gold' : '') + '" data-act="sort" data-k="' + k + '">' + k.toUpperCase() + '</button>').join('') + '</div>';
    html += '<div class="agrid">' + sortRoster(s, s.roster).map((a) => ui.athleteCard(s, a, { markLineup: true })).join('') + '</div>';
    return html;
  }

  // ---------- Athlete detail ----------
  function openAthlete(uid) {
    const s = S();
    const a = s.rosterByUid[uid];
    if (!a) return;
    if (a.isNew) { a.isNew = false; ui.updateBadges(s); }
    const m = ui.modal({ title: '', render: (mm) => renderAthlete(mm, a) });
    m.el.addEventListener('click', (e) => onAthleteClick(e, m, a));
    BE.bus.emit('athlete:open', a);
    return m;
  }
  function renderAthlete(m, a) {
    const s = S();
    const t = A.tpl(a.cid);
    const r = D.rarities[t.rarity];
    const arch = D.archetypes.find((x) => x.k === t.arch);
    const pers = D.personalities.find((x) => x.k === t.personality);
    const cos = G.cosmetic(s);
    const ovr = E.athleteOvr(s, a);
    const pw = E.athletePower(s, a);
    const eff = A.effAttrs(s, a);
    const inLineup = s.lineup.includes(a.uid);
    const maxL = E.maxLevel(s);
    const c1 = E.levelCost(s, a, 1), c10 = E.levelCost(s, a, Math.min(10, maxL - a.lvl));
    const mx = E.maxAffordable(s, a, s.cash);
    const nextMile = (Math.floor(a.lvl / D.balance.milestoneEvery) + 1) * D.balance.milestoneEvery;
    const gainPct = (D.balance.lvlPowerGrowth - 1) * 100;
    let html = '<div class="rar r' + t.rarity + '"><div class="hero"><div class="port">' + A.portraitSVG(t, { colors: cos.jersey, gear: G.gearVis(s, a) }) + '</div>' +
      '<div style="min-width:0"><div class="row" style="gap:6px"><span class="chip" style="background:' + r.color + '33;color:' + r.color + '">' + r.name + '</span><span class="chip">' + t.pos + '</span><span style="color:var(--gold);font-size:13px">' + ui.stars(a.stars) + '</span></div>' +
      '<div class="h2" style="margin-top:4px">' + U.esc(t.first + ' ' + t.last) + '</div>' + (t.nick ? '<div class="muted small">"' + U.esc(t.nick) + '"</div>' : '') +
      '<div class="row" style="margin-top:6px;gap:14px"><div><div class="label">OVR</div><div class="big-ovr">' + ovr + '</div></div><div><div class="label">Power</div><div class="power-num" data-ad="pw">⚡' + U.fmt(pw) + '</div></div></div>' +
      '<div class="small muted">' + D.positions[t.pos].name + ' · ' + Math.floor(t.height / 30.48) + "'" + Math.round((t.height / 2.54) % 12) + '" · ' + D.worlds[t.world].short + ' origin</div></div></div></div>';
    // Level
    html += '<div class="card" style="margin-top:12px" data-ad="lvlcard"><div class="row between"><div><span class="label">Level</span> <span class="num" style="font-size:22px">' + a.lvl + '</span><span class="muted small"> / ' + maxL + '</span></div>' +
      '<div class="small muted">+' + gainPct.toFixed(0) + '% power per level · <b style="color:var(--gold)">×2</b> at Lv ' + nextMile + '</div></div>' +
      '<div class="bar" style="margin:6px 0 10px"><i style="width:' + ((a.lvl % 25) / 25 * 100) + '%"></i></div>' +
      '<div class="lvl-btns">' +
      '<button class="btn stack ' + (s.cash >= c1 ? 'green' : '') + '" data-act="lvl" data-n="1"' + (a.lvl >= maxL ? ' disabled' : '') + ' data-tut="lvlbtn">Level +1<span class="sub">$' + U.fmt(c1) + '</span></button>' +
      '<button class="btn stack ' + (s.cash >= c10 ? 'green' : '') + '" data-act="lvl" data-n="10"' + (a.lvl >= maxL ? ' disabled' : '') + '>+10<span class="sub">$' + U.fmt(c10) + '</span></button>' +
      '<button class="btn stack gold" data-act="lvl" data-n="max"' + (mx.n < 1 ? ' disabled' : '') + '>Max +' + mx.n + '<span class="sub">$' + U.fmt(mx.cost) + '</span></button></div>' +
      '<div class="row" style="margin-top:8px"><button class="btn sm ' + (inLineup ? 'ghost' : 'blue') + ' grow" data-act="togglelineup">' + (inLineup ? 'Move to bench' : 'Add to starters') + '</button></div></div>';
    // Signature
    html += '<div class="card flat" style="margin-top:10px"><div class="row" style="align-items:flex-start"><span style="color:var(--gold);font-size:20px">' + icon('star') + '</span><div class="grow"><b>' + arch.ability.name + '</b> <span class="muted small">· ' + arch.name + '</span><div class="small muted">' + arch.ability.desc + '</div></div></div>' +
      '<div class="row" style="align-items:flex-start;margin-top:8px"><span style="color:var(--info);font-size:20px">' + icon('social') + '</span><div class="grow"><b>' + pers.name + '</b> <span class="muted small">· Personality</span><div class="small muted">' + pers.desc + ' · Celebration: ' + t.celebration + '</div></div></div></div>';
    // Gear slots
    if (E.unlocked(s, 'gear')) {
      html += '<div class="sec-title"><span class="h3">Equipment</span><span class="label">+' + Math.round(E.gearPct(s, a) * 100) + '% power</span></div><div class="row wrap" style="gap:12px;justify-content:space-between">';
      for (const gt of D.gearTypes.filter((x) => x.slot === 'athlete')) {
        const it = a.gear[gt.k] && s.gearById[a.gear[gt.k]];
        html += '<button class="gslot" data-act="slot" data-slot="' + gt.k + '">' + ui.gearBadge(it) + gt.name.split(' ')[0] + '</button>';
      }
      html += '</div>';
    }
    // Attributes
    const cap = A.trainCap(a);
    const canTrain = E.unlocked(s, 'training');
    html += '<div class="sec-title"><span class="h3">Attributes</span><span class="label">' + (canTrain ? '<span style="color:var(--info)">T ' + U.fmt(s.tp) + '</span> training pts' : 'Training unlocks at ' + ui.stageName(D.features.training.g)) + '</span></div><div class="attrs">';
    for (const at of D.attrs) {
      const v = eff[at.k];
      const tr = a.train[at.k] || 0;
      const cost = E.trainCost(s, a, at.k);
      html += '<div class="attr"><span title="' + at.name + '">' + at.short + '</span><div class="bar ' + (v >= 80 ? 'green' : v >= 60 ? 'blue' : '') + '"><i style="width:' + Math.min(100, v) + '%"></i></div><span class="v">' + v + '</span>' +
        (canTrain ? '<button class="tr" data-act="train" data-k="' + at.k + '" title="Train ' + at.name + ' (' + cost + ' TP, ' + tr + '/' + cap + ')"' + (tr >= cap || s.tp < cost ? ' disabled' : '') + '>+</button>' : '<span></span>') + '</div>';
    }
    html += '</div>';
    if (canTrain) html += '<div class="small muted" style="margin-top:6px">Each + costs training points (shown on hover) and raises OVR, which multiplies power. Potential per attribute: ' + cap + ' points.</div>';
    html += '<button class="btn ghost wide" style="margin-top:14px" data-close>Close</button>';
    m.set(html);
  }

  function onAthleteClick(e, m, a) {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    const s = S();
    const act = b.dataset.act;
    if (act === 'lvl') {
      e.stopPropagation();
      const n = b.dataset.n === 'max' ? E.maxAffordable(s, a, s.cash).n : Math.min(+b.dataset.n, E.maxLevel(s) - a.lvl);
      doLevel(a, n, b);
      renderAthlete(m, a);
      flashCard(m);
    } else if (act === 'togglelineup') {
      e.stopPropagation();
      toggleLineup(a);
      renderAthlete(m, a);
    } else if (act === 'train') {
      e.stopPropagation();
      const r = E.train(s, a, b.dataset.k);
      if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); BE.audio.play('error'); return; }
      BE.audio.play('upgrade', { combo: 4 });
      ui.floatText('+1 ' + D.attrs.find((x) => x.k === b.dataset.k).short, b, '#38d996');
      renderAthlete(m, a);
      BE.bus.emit('changed');
    } else if (act === 'slot') {
      e.stopPropagation();
      pickGear(b.dataset.slot, a, () => renderAthlete(m, a));
    }
  }
  function flashCard(m) { const c = $('[data-ad="lvlcard"]', m.el); ui.flash(c); }

  function doLevel(a, n, btn) {
    const s = S();
    if (n <= 0) { ui.toast('Not enough cash', 'bad', 'cash'); BE.audio.play('error'); return false; }
    const r = E.levelUp(s, a, n);
    if (!r.ok) { ui.toast(r.reason, 'bad', 'cash'); BE.audio.play('error'); return false; }
    const now = performance.now();
    combo = now - comboT < 900 ? combo + 1 : 0; comboT = now;
    const pct = (r.after / r.before - 1) * 100;
    if (r.milestone) { BE.audio.play('milestone'); ui.toast('MILESTONE! ' + A.tpl(a.cid).last + ' power doubled at Lv ' + Math.floor(a.lvl / 25) * 25 + '!', 'gold', 'star'); }
    else BE.audio.play('upgrade', { combo });
    if (btn) { ui.floatText('+' + (pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)) + '% POWER', btn, r.milestone ? '#ffd23f' : '#38d996'); ui.sparks(btn, r.milestone ? '#ffd23f' : '#38d996', r.milestone ? 24 : 10); }
    BE.services.haptic(10);
    BE.bus.emit('levelup', { a, n });
    BE.bus.emit('changed');
    return true;
  }
  function toggleLineup(a) {
    const s = S();
    const size = E.sizeOf(Math.min(s.run.cleared, 99));
    const i = s.lineup.indexOf(a.uid);
    if (i >= 0) {
      if (s.lineup.length <= 1) { ui.toast('You need at least one starter', 'bad', 'x'); return; }
      s.lineup.splice(i, 1);
      G.ensureLineup(s, 1);
    } else {
      if (s.lineup.length >= Math.max(size, 1)) {
        // replace weakest starter
        const m = E.mods(s);
        let worst = 0, wv = Infinity;
        s.lineup.slice(0, size).forEach((u, k) => { const p = E.athletePower(s, s.rosterByUid[u], m); if (p < wv) { wv = p; worst = k; } });
        const out = s.rosterByUid[s.lineup[worst]];
        s.lineup[worst] = a.uid;
        ui.toast(A.tpl(a.cid).last + ' replaces ' + A.tpl(out.cid).last + ' in the lineup', 'good', 'swap');
      } else s.lineup.push(a.uid);
    }
    BE.audio.play('click');
    BE.bus.emit('lineup');
    BE.bus.emit('changed');
  }

  // ---------- Gear ----------
  function pickGear(slot, a, done) {
    const s = S();
    const type = slot;
    const items = s.gear.filter((g) => g.type === type).sort((x, y) => E.gearMain(y) - E.gearMain(x));
    const cur = a ? a.gear[slot] : s.teamGear[slot];
    const gt = D.gearTypes.find((x) => x.k === type);
    let html = '<div class="small muted" style="margin-bottom:8px">' + (gt.slot === 'team' ? 'Team gear boosts every starter at half strength.' : 'Each item adds power % and attribute points.') + '</div>';
    if (!items.length) html += '<div class="empty">No ' + gt.name.toLowerCase() + ' yet. Win games, open gear chests, or craft gear.</div>';
    html += '<div class="col">';
    for (const it of items) {
      const own = E.gearOwner(s, it.id);
      const ownName = own ? (own.team ? 'Team' : A.tpl(own.a.cid).last) : '';
      html += '<button class="urow" data-pick="' + it.id + '" style="text-align:left">' + ui.gearBadge(it) + '<div class="ut"><div class="n">' + ui.gearName(it) + ' <span class="lv">Lv ' + it.lvl + '</span></div><div class="e">+' + Math.round(E.gearMain(it) * 100) + '% power · ' + it.subs.map((x) => '+' + x.v + ' ' + x.k.toUpperCase()).join(', ') + '</div>' +
        (own ? '<div class="d">Equipped: ' + U.esc(ownName) + '</div>' : '') + '</div>' + (it.id === cur ? '<span class="chip good">Equipped</span>' : '<span class="btn xs">Equip</span>') + '</button>';
    }
    html += '</div>';
    if (cur) html += '<button class="btn ghost wide" style="margin-top:10px" data-unequip>Unequip</button>';
    const m = ui.modal({ title: 'Choose ' + gt.name, html });
    m.el.addEventListener('click', (e) => {
      const p = e.target.closest('[data-pick]');
      if (p) { E.equipGear(s, p.dataset.pick, a); BE.audio.play('upgrade', { combo: 2 }); m.close(); BE.bus.emit('changed'); done && done(); return; }
      if (e.target.closest('[data-unequip]')) { E.unequipGear(s, cur); m.close(); BE.bus.emit('changed'); done && done(); }
    });
  }

  function gearHTML(s) {
    let html = '<div class="card"><div class="row between"><div><div class="label">Scrap</div><div class="num" style="font-size:20px">' + U.fmtInt(s.scrap) + '</div></div><div class="small muted" style="max-width:60%">Salvage spare gear for scrap. Merge 3 of the same type and rarity into the next rarity.</div></div>';
    if (E.unlocked(s, 'craft')) {
      html += '<div class="divider"></div><div class="row between"><div><b>Craft gear</b><div class="small muted">Rare or better, ' + D.worlds[E.worldOf(s.best)].set + ' set</div></div><button class="btn sm purple" data-act="craft"' + (s.scrap < E.craftCost(s) ? ' disabled' : '') + '>' + icon('craft') + ' ' + E.craftCost(s) + ' scrap</button></div>';
    } else html += '<div class="lock-note" style="margin-top:8px">' + icon('lock') + ' Crafting unlocks at ' + ui.stageName(D.features.craft.g) + '</div>';
    html += '</div>';
    const coll = Object.keys(s.gearSeen).length;
    html += '<div class="sec-title"><span class="h3">Inventory (' + s.gear.length + ')</span><span class="label">Gear collection ' + coll + '/70 · +' + coll + '% power</span></div>';
    if (!s.gear.length) return html + '<div class="card flat empty">No gear yet — wins sometimes drop equipment, and championships always do.</div>';
    const sorted = s.gear.slice().sort((x, y) => y.rarity - x.rarity || y.set - x.set || y.lvl - x.lvl);
    html += '<div class="ggrid">' + sorted.map((it) => '<button class="gslot" data-act="gear" data-id="' + it.id + '" style="position:relative">' + ui.gearBadge(it) + (E.gearOwner(s, it.id) ? '<span style="color:var(--good)">equipped</span>' : it.isNew ? '<span style="color:var(--bad)">new</span>' : '&nbsp;') + '</button>').join('') + '</div>';
    return html;
  }
  function openGear(id) {
    const s = S();
    const it = s.gearById[id];
    if (!it) return;
    it.isNew = false;
    const m = ui.modal({ title: ui.gearName(it), render: (mm) => renderGear(mm, id) });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]');
      if (!b) return;
      const cur = s.gearById[id];
      const k = b.dataset.g;
      if (k === 'up') {
        const r = E.upgradeGear(s, id);
        if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); BE.audio.play('error'); return; }
        BE.audio.play('upgrade', { combo: cur.lvl % 8 }); ui.sparks(b, D.rarities[cur.rarity].color); renderGear(m, id);
      } else if (k === 'merge') {
        const r = E.mergeGear(s, id);
        if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); BE.audio.play('error'); return; }
        BE.audio.play('reveal', { rarity: r.item.rarity }); ui.toast('Merged into ' + D.rarities[r.item.rarity].name + ' ' + ui.gearName(r.item) + '!', 'gold', 'star');
        id = r.item.id; renderGear(m, id);
      } else if (k === 'salvage') {
        ui.confirmBox('Salvage gear?', '<div>Turn <b>' + ui.gearName(cur) + '</b> into <b>' + E.salvageValue(cur) + ' scrap</b>. This removes the item.</div>', 'Salvage').then((ok) => {
          if (!ok) return;
          const r = E.salvageGear(s, id); if (r.ok) { BE.audio.play('coin'); ui.toast('+' + r.scrap + ' scrap', 'good', 'craft'); m.close(); BE.bus.emit('changed'); }
        });
        return;
      } else if (k === 'equip') {
        const gt = D.gearTypes.find((x) => x.k === cur.type);
        if (gt.slot === 'team') { E.equipGear(s, id, null); BE.audio.play('upgrade', { combo: 2 }); renderGear(m, id); }
        else chooseAthlete(s, (a) => { E.equipGear(s, id, a); BE.audio.play('upgrade', { combo: 2 }); renderGear(m, id); BE.bus.emit('changed'); });
      } else if (k === 'unequip') { E.unequipGear(s, id); renderGear(m, id); }
      BE.bus.emit('changed');
    });
  }
  function renderGear(m, id) {
    const s = S();
    const it = s.gearById[id];
    if (!it) { m.close(); return; }
    const r = D.rarities[it.rarity];
    const c = E.gearUpgradeCost(s, it);
    const maxL = E.gearMaxLevel(it);
    const own = E.gearOwner(s, it.id);
    const mc = E.mergeCandidates(s, it).length;
    let html = '<div class="row" style="gap:14px">' + ui.gearBadge(it, ' style="width:76px;height:76px"') + '<div class="grow"><span class="chip" style="background:' + r.color + '33;color:' + r.color + '">' + r.name + '</span><div class="h2" style="margin-top:4px">' + ui.gearName(it) + '</div><div class="small muted">' + D.worlds[it.set].set + ' set · Level ' + it.lvl + '/' + maxL + '</div></div></div>';
    html += '<div class="card flat" style="margin-top:12px"><div class="kv"><span>Power bonus</span><span style="color:var(--good)">+' + (E.gearMain(it) * 100).toFixed(1) + '%</span>' + it.subs.map((x) => '<span>' + D.attrs.find((y) => y.k === x.k).name + '</span><span>+' + x.v + '</span>').join('') + '<span>Equipped by</span><span>' + (own ? (own.team ? 'Team' : U.esc(A.tpl(own.a.cid).last)) : '—') + '</span></div></div>';
    html += '<div class="col" style="margin-top:12px">';
    html += '<button class="btn green stack" data-g="up"' + (it.lvl >= maxL ? ' disabled' : '') + '>' + (it.lvl >= maxL ? 'Max level' : 'Upgrade to Lv ' + (it.lvl + 1)) + '<span class="sub">' + c.scrap + ' scrap · $' + U.fmt(c.cash) + '</span></button>';
    html += '<button class="btn purple stack" data-g="merge"' + (mc < 2 || it.rarity >= 5 ? ' disabled' : '') + '>Merge 3 → ' + (it.rarity < 5 ? D.rarities[it.rarity + 1].name : 'MAX') + '<span class="sub">' + Math.min(mc + 1, 3) + '/3 matching ' + r.name.toLowerCase() + ' ' + D.gearTypes.find((x) => x.k === it.type).name.toLowerCase() + '</span></button>';
    html += '<div class="row"><button class="btn blue grow" data-g="equip">' + (own ? 'Re-equip' : 'Equip') + '</button>' + (own ? '<button class="btn ghost grow" data-g="unequip">Unequip</button>' : '') + '<button class="btn ghost grow" data-g="salvage">Salvage</button></div></div>';
    m.set(html);
  }
  function chooseAthlete(s, cb) {
    const list = s.lineup.map((u) => s.rosterByUid[u]).filter(Boolean).concat(s.roster.filter((a) => !s.lineup.includes(a.uid)));
    const m = ui.modal({ title: 'Equip on…', html: '<div class="agrid compact">' + list.map((a) => ui.athleteCard(s, a, { markLineup: true })).join('') + '</div>' });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-uid]');
      if (!b) return;
      e.stopPropagation();
      m.close();
      cb(s.rosterByUid[b.dataset.uid]);
    }, true);
  }

  // ---------- Collection ----------
  function collectionHTML(s) {
    const n = s.stats.unique;
    const total = A.catalog.length + 1;
    const cb = E.collectionBonus(s);
    let html = '<div class="card"><div class="row between"><div><div class="label">Athletes discovered</div><div class="power-num">' + n + ' / ' + total + '</div></div><div style="text-align:right"><div class="label">Collection bonus</div><div class="num" style="color:var(--good)">+' + Math.round(cb.power * 100) + '% power · +' + Math.round(cb.cash * 100) + '% cash</div></div></div>' +
      '<div class="bar green" style="margin-top:8px"><i style="width:' + (n / total * 100) + '%"></i></div><div class="row wrap" style="margin-top:8px;gap:5px">' +
      E.collectionMilestones.map((m) => '<span class="chip ' + (n >= m.n ? 'good' : '') + '">' + m.n + ': +' + Math.round(m.power * 100) + '%</span>').join('') + '</div></div>';
    const maxW = E.worldOf(s.best);
    for (let w = 0; w < D.worlds.length; w++) {
      const list = A.catalog.filter((t) => t.world === w);
      const got = list.filter((t) => s.collection[t.id]).length;
      html += '<div class="sec-title"><span class="h3" style="color:' + D.worlds[w].color + '">W' + (w + 1) + ' · ' + D.worlds[w].short + '</span><span class="label">' + got + '/' + list.length + (w > maxW ? ' · scouted from World ' + (w + 1) : '') + '</span></div>';
      if (w > maxW + 1) { html += '<div class="card flat lock-note">' + icon('lock') + ' Reach World ' + (w + 1) + ' to scout these athletes.</div>'; continue; }
      html += '<div class="agrid compact">' + list.map((t) => ui.templateCard(t, !!s.collection[t.id])).join('') + '</div>';
    }
    return html;
  }
  function openCatalog(cid) {
    const s = S();
    const t = A.tpl(cid);
    if (!s.collection[cid]) { ui.toast(D.rarities[t.rarity].name + ' athlete from ' + D.worlds[t.world].name + ' — recruit to reveal', '', 'cards'); return; }
    const a = s.roster.find((x) => x.cid === cid);
    if (a) openAthlete(a.uid);
  }

  // ---------- Actions ----------
  const act = {
    teamtab: (d) => { tab = d.k; BE.audio.play('tab'); renderTeam(); },
    'tab-roster': () => { tab = 'roster'; renderTeam(); },
    sort: (d) => { sortBy = d.k; renderTeam(); },
    athlete: (d) => openAthlete(d.uid),
    catalog: (d) => openCatalog(d.cid),
    quicklvl: (d, el) => { const a = S().rosterByUid[d.uid]; if (a && doLevel(a, 1, el)) renderTeam(); },
    autolineup: () => { G.autoLineup(S()); BE.audio.play('upgrade', { combo: 1 }); ui.toast('Lineup set to your strongest players', 'good', 'swap'); BE.bus.emit('lineup'); renderTeam(); },
    levelall: (d, el) => {
      const s = S();
      let n = 0;
      for (let k = 0; k < 500; k++) {
        let best = null, bc = Infinity;
        for (const a of E.lineupAthletes(s).slice(0, E.sizeOf(Math.min(s.run.cleared, 99)))) { if (a.lvl >= E.maxLevel(s)) continue; const c = E.levelCost(s, a, 1); if (c < bc) { bc = c; best = a; } }
        if (!best || s.cash < bc) break;
        E.levelUp(s, best, 1); n++;
      }
      if (!n) { ui.toast('Not enough cash for any level-ups', 'bad', 'cash'); BE.audio.play('error'); return; }
      BE.audio.play('milestone'); ui.sparks(el, '#38d996', 20); ui.toast(n + ' level-ups across your starters!', 'good', 'up');
      BE.bus.emit('levelup', { n }); BE.bus.emit('changed'); renderTeam();
    },
    teamslot: (d) => pickGear(d.slot, null, renderTeam),
    gear: (d) => openGear(d.id),
    craft: (d, el) => {
      const s = S();
      const r = E.craftGear(s);
      if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); return; }
      BE.audio.play('reveal', { rarity: r.item.rarity }); ui.sparks(el, D.rarities[r.item.rarity].color, 20);
      ui.toast('Crafted ' + D.rarities[r.item.rarity].name + ' ' + ui.gearName(r.item) + '!', 'gold', 'craft');
      s.stats.gearUps++; renderTeam();
    },
  };

  BE.team = { renderTeam, openAthlete, openGear, doLevel, act, setTab: (t) => { tab = t; } };
})(typeof window !== 'undefined' ? window : globalThis);
