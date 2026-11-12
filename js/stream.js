/* Basketball Empire — stage model (headless; drives the court and every offline/simulated stage).
 * Formation combat in the style of classic formation idle RPGs: your squad stands in a formation of seats on the
 * left (columns from back to front; bigs in the front column), defenders pour in from the right in groups.
 *  - Pressers walk up and attack the front column; snipers stay back and hit anyone.
 *  - Every squad member attacks on their own rhythm (step-back three, pull-up, layup, dunk); each landed basket is a
 *    hit on the nearest defender's Guard bar. Break all the defenders, then the boss, to clear the stage.
 *  - Every player has their own Stamina. A gassed player sits out a few seconds and comes back. If the whole front
 *    column is gassed at once, the formation collapses and the stage is lost.
 * Win odds depend on squad power ÷ opponent power (about 50% at 1.1; see tests/calibrate.js). */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data;

  const CFG = {
    regulars: 10,      // defenders per stage before the boss
    maxOn: 3,          // most defenders on court at once
    group: [2, 3],     // defenders per group that enters together
    sniper: 0.3,       // share of defenders that are snipers (hit any seat from range)
    regHp: 0.4,        // regular defender Guard (× opponent power × hpK)
    bossHp: 3,         // boss Guard multiple
    regDps: 0.4,       // regular defender damage rate (× opponent power × oppK)
    bossDmg: 1.5,      // boss damage rate
    hpK: 6.0,
    oppK: 0.1,
    staK: 2.45,         // total squad Stamina = squad power × staK, split across seats by column
    colWeight: { front: 1.4, mid: 1.0, back: 0.8 },
    rest: 5,           // seconds a gassed player sits out
    backAt: 0.35,      // Stamina they return with
    oppIv: 1.4,        // seconds between a defender's plays
    walkPress: [1.2, 1.8], walkSnipe: [0.9, 1.3], walkBoss: 1.4,
    crit: 0.12, critMult: 2,
    stop: 0.12,        // chance the targeted player blocks or steals the play
    form: 0.15,        // per-stage random swing (log sd) of defender strength
    bossEvery: 3, bossWind: 1.6, bossBig: 2.6,
    energy0: 20, energyPerSec: 2.5, energyStop: 4, energyBreak: 3,
    maxT: 300,
  };
  const KIND = {
    // flight = seconds from the start of the move until the hit lands (the court animates the move in that window)
    layup: { mult: 0.9, pts: 2, flight: 0.9 }, mid: { mult: 0.95, pts: 2, flight: 0.65 }, three: { mult: 1.25, pts: 3, flight: 0.75 }, dunk: { mult: 1.25, pts: 2, flight: 1.0 },
  };
  // Formation shapes: seats per column, back → front
  const FORMS = { 1: [1], 2: [1, 1], 3: [1, 2], 4: [2, 2], 5: [2, 1, 2] };
  const FRONTNESS = { C: 5, PF: 4, SF: 3, SG: 2, PG: 1 };

  function blank() { return { pts: 0, dmg: 0, hits: 0, threes: 0, dunks: 0, stl: 0, blk: 0, gassed: 0 }; }
  function blankTeam() { return { threes: 0, dunks: 0, blocks: 0, steals: 0 }; }
  function gauss(rng) { let u = 0, v = 0; while (u === 0) u = rng(); v = rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v); }
  function attr(p, k) { return (p.attrs && p.attrs[k]) || 40; }
  function rnd(m, a, b) { return a + m.rng() * (b - a); }

  function tactic(home, away, bonus) {
    let off = 1, inc = 1;
    if (home.tactic && away.tactic) {
      if (D.offCounters[home.tactic.off] === away.tactic.def) off += bonus;
      if (D.defCounters[home.tactic.def] === away.tactic.off) inc -= bonus * 0.5;
      if (D.offCounters[away.tactic.off] === home.tactic.def) inc += bonus * 0.5;
    }
    return { off, inc };
  }

  // Seat the squad: the most "front" players (bigs, strength, defense) take the front column.
  function formation(players) {
    const n = players.length, shape = FORMS[n] || FORMS[5];
    const score = players.map((p, i) => ({ i, v: (FRONTNESS[p.pos] || 3) * 10 + attr(p, 'str') * 0.1 + attr(p, 'def') * 0.05 }));
    score.sort((a, b) => b.v - a.v);
    const seats = new Array(n);
    let k = 0;
    for (let c = shape.length - 1; c >= 0; c--) {
      for (let r = 0; r < shape[c]; r++) {
        const role = c === shape.length - 1 ? 'front' : c === 0 ? 'back' : 'mid';
        seats[score[k].i] = { col: c, row: r, rows: shape[c], cols: shape.length, role: shape.length === 1 ? 'front' : role };
        k++;
      }
    }
    return seats;
  }

  // home: player team (players = the squad on court). away: opponent with >= 5 players (defenders are drawn from them).
  function create(home, away, opts) {
    opts = opts || {};
    const rng = opts.rng || Math.random;
    const bonus = opts.bonus || { shoot: 0, def: 0, reb: 0, tactic: 0.12, staminaDrain: 1 };
    const size = home.players.length;
    const form = Math.exp(gauss(rng) * CFG.form);
    const sumP = home.players.reduce((t, p) => t + (p.power || 1), 0) || 1;
    const iv = Math.max(1.15, 0.8 + 0.18 * size);
    const seats = formation(home.players);
    const wsum = seats.reduce((t, s) => t + CFG.colWeight[s.role], 0);
    const total = home.power * CFG.staK;
    const m = {
      format: opts.format || '5v5', teams: [home, away], size, form, seats,
      share: home.players.map((p) => (p.power || 1) / sumP), iv,
      cd: home.players.map((p, i) => 0.6 + i * (iv / size)),
      pl: seats.map((s) => { const max = total * CFG.colWeight[s.role] / wsum; return { sta: max, max, gassed: false, rest: 0 }; }),
      sta: total, staMax: total,
      foes: [], nextId: 1, queue: CFG.regulars, nReg: CFG.regulars, broken: 0, bossUp: false, bossDone: false, spawnCd: 0,
      energy: opts.energy !== undefined ? opts.energy : CFG.energy0,
      fx: [{ hype: 0, lockdown: 0, iso: false }, { hype: 0, lockdown: 0, iso: false }],
      bonus, tac: tactic(home, away, bonus.tactic || 0.12), rng,
      t: 0, over: false, winner: -1, score: [0, 0], pending: [], breaks: 0, paid: 0, charge: null, bossN: 0, streak: 0,
      stats: [home.players.map(blank), away.players.map(blank)], teamStats: [blankTeam(), blankTeam()],
    };
    // Seats shape the moves: only the front column drives and dunks; guards and wings shoot from their seats
    m.kinds = home.players.map((p, i) => {
      const role = seats[i].role, front = role === 'front';
      return { three: attr(p, 'thr') * (front ? 0.5 : 0.9), mid: attr(p, 'sht') * 0.7, layup: front ? attr(p, 'spd') * 0.5 + attr(p, 'hnd') * 0.3 : 0, dunk: front ? attr(p, 'str') * 0.6 + attr(p, 'spd') * 0.15 : 0 };
    });
    return m;
  }

  function spawn(m, ev, boss) {
    const away = m.teams[1], ps = away.players;
    const id = m.nextId++;
    const p = boss ? ps[0] : ps[1 + ((id - 1) % Math.max(1, ps.length - 1))] || ps[0];
    const sniper = !boss && m.rng() < CFG.sniper;
    const hpMax = away.power * CFG.hpK * (boss ? CFG.bossHp : CFG.regHp) * m.form;
    const walk = boss ? CFG.walkBoss : sniper ? rnd(m, CFG.walkSnipe[0], CFG.walkSnipe[1]) : rnd(m, CFG.walkPress[0], CFG.walkPress[1]);
    const f = { id, p, boss, kind: boss ? 'boss' : sniper ? 'sniper' : 'presser', hp: hpMax, hpMax, walk, cd: walk + rnd(m, 0.2, 0.9) };
    m.foes.push(f);
    ev.push({ t: 'spawn', id, kind: f.kind, boss, walk, p });
  }
  function spawner(m, ev, dt) {
    if (m.queue > 0) {
      m.spawnCd -= dt;
      if (m.spawnCd <= 0 && m.foes.length < 2) {
        const room = CFG.maxOn - m.foes.length;
        const n = Math.min(room, m.queue, CFG.group[0] + Math.floor(m.rng() * (CFG.group[1] - CFG.group[0] + 1)));
        for (let i = 0; i < n; i++) { spawn(m, ev, false); m.queue--; }
        m.spawnCd = 0.6;
      }
    } else if (!m.bossUp && m.foes.length === 0) {
      m.bossUp = true; m.charge = null;
      spawn(m, ev, true);
    }
  }
  // Defenders on court nearest the formation first (engaged before those still walking in, pressers before snipers)
  function nearest(m) {
    let best = null, bv = Infinity;
    for (const f of m.foes) { const v = f.walk * 2 + (f.kind === 'sniper' ? 1 : 0) + f.id * 0.001; if (v < bv) { bv = v; best = f; } }
    return best;
  }

  function pickKind(m, i) {
    const w = m.kinds[i];
    const tot = w.three + w.mid + w.layup + w.dunk;
    let r = m.rng() * tot;
    for (const k of ['three', 'mid', 'layup', 'dunk']) { r -= w[k]; if (r <= 0) return k; }
    return 'mid';
  }
  function outMult(m) { return (1 + (m.bonus.shoot || 0)) * m.tac.off * (m.fx[0].hype > 0 ? 1.3 : 1); }
  function inMult(m) {
    const drain = m.bonus.staminaDrain === undefined ? 1 : m.bonus.staminaDrain;
    return (0.85 + 0.15 * drain) / (1 + (m.bonus.def || 0)) * m.tac.inc * (m.fx[0].lockdown > 0 ? 0.6 : 1);
  }

  function shoot(m, i, ev, iso) {
    const target = nearest(m);
    if (!target) return false;
    const p = m.teams[0].players[i];
    const kind = iso ? 'dunk' : pickKind(m, i);
    const crit = iso || m.rng() < CFG.crit + (m.bonus.reb || 0) * 0.5;
    const dmg = m.teams[0].power * m.share[i] * m.iv * KIND[kind].mult * outMult(m) * (crit ? CFG.critMult : 1) * (iso ? 2.5 : 1);
    const flight = KIND[kind].flight;
    m.pending.push({ t: flight, who: i, kind, crit, dmg, target: target.id });
    ev.push({ t: 'shot', who: i, kind, crit, iso: !!iso, dur: flight, target: target.id, name: p.short || p.name });
    return true;
  }

  function land(m, h, ev) {
    let f = m.foes.find((x) => x.id === h.target);
    if (!f) f = nearest(m);
    if (m.over || !f) { ev.push({ t: 'hit', who: h.who, kind: h.kind, crit: h.crit, dmg: 0, wasted: true }); return; }
    const st = m.stats[0][h.who];
    const pts = KIND[h.kind].pts;
    f.hp -= h.dmg;
    m.score[0] += pts;
    st.pts += pts; st.dmg += h.dmg; st.hits++;
    if (h.kind === 'three') { st.threes++; m.teamStats[0].threes++; }
    if (h.kind === 'dunk') { st.dunks++; m.teamStats[0].dunks++; }
    m.streak++;
    ev.push({ t: 'hit', who: h.who, target: f.id, kind: h.kind, crit: h.crit, dmg: h.dmg, pts, hp: Math.max(0, f.hp), hpMax: f.hpMax, streak: m.streak });
    if (f.hp <= 0) {
      m.foes.splice(m.foes.indexOf(f), 1);
      m.breaks++;
      if (!f.boss) m.broken++;
      m.energy = Math.min(100, m.energy + CFG.energyBreak * (f.boss ? 3 : 1));
      ev.push({ t: 'break', id: f.id, boss: f.boss, by: h.who, broken: m.broken, nReg: m.nReg });
      if (f.boss) { m.bossDone = true; m.over = true; m.winner = 0; ev.push({ t: 'end', win: true }); }
    }
  }

  function sync(m) { let s = 0; for (const x of m.pl) s += Math.max(0, x.sta); m.sta = s; }
  function alive(m, frontOnly) {
    const out = [];
    for (let i = 0; i < m.size; i++) if (!m.pl[i].gassed && (!frontOnly || m.seats[i].role === 'front')) out.push(i);
    return out;
  }
  function hurt(m, i, dmg, ev) {
    const pl = m.pl[i];
    pl.sta -= dmg;
    if (pl.sta <= 0 && !pl.gassed) {
      pl.sta = 0; pl.gassed = true; pl.rest = CFG.rest;
      m.stats[0][i].gassed++;
      ev.push({ t: 'gassed', who: i });
    }
  }
  function checkCollapse(m, ev) {
    if (m.over) return;
    if (alive(m, true).length === 0) { m.over = true; m.winner = 1; m.collapsed = true; ev.push({ t: 'end', win: false, collapse: true }); }
  }

  function foePlay(m, f, ev) {
    if (f.boss && ++m.bossN % CFG.bossEvery === 0) { m.charge = { t: CFG.bossWind, from: f.id }; ev.push({ t: 'charge', from: f.id, dur: CFG.bossWind }); return; }
    const pool = f.kind === 'sniper' ? alive(m, false) : alive(m, true);
    if (!pool.length) return;
    const target = pool[Math.floor(m.rng() * pool.length)];
    if (m.rng() < CFG.stop + (m.bonus.def || 0) * 0.5) {
      const kind = m.rng() < 0.5 ? 'block' : 'steal';
      const st = m.stats[0][target];
      if (kind === 'block') { st.blk++; m.teamStats[0].blocks++; } else { st.stl++; m.teamStats[0].steals++; }
      m.energy = Math.min(100, m.energy + CFG.energyStop);
      ev.push({ t: 'stop', who: target, from: f.id, kind });
      return;
    }
    const kind = f.kind === 'sniper' ? U.pick(['three', 'three', 'score'], m.rng) : U.pick(['score', 'score', 'steal', 'block'], m.rng);
    const rate = f.boss ? CFG.bossDmg : CFG.regDps;
    const dmg = m.teams[1].power * CFG.oppK * CFG.oppIv * rate * m.form * inMult(m) * (kind === 'three' ? 1.2 : 1);
    hurt(m, target, dmg, ev);
    if (kind === 'score' || kind === 'three') m.score[1] += kind === 'three' ? 3 : 2;
    m.streak = 0;
    sync(m);
    ev.push({ t: 'opp', from: f.id, who: target, kind, dmg, sta: Math.max(0, m.pl[target].sta), staMax: m.pl[target].max, boss: f.boss, ranged: f.kind === 'sniper' });
    checkCollapse(m, ev);
  }
  // The boss's telegraphed big play lands on the whole formation, unless Lockdown is up when it lands
  function bigPlay(m, ev) {
    const from = m.charge && m.charge.from;
    m.charge = null;
    if (m.fx[0].lockdown > 0) {
      m.energy = Math.min(100, m.energy + CFG.energyStop * 2);
      ev.push({ t: 'stop', who: Math.floor(m.rng() * m.size), from, kind: 'lockdown', big: true });
      return;
    }
    const total = m.teams[1].power * CFG.oppK * CFG.oppIv * CFG.bossDmg * CFG.bossBig * m.form * inMult(m);
    const hit = alive(m, false);
    const wsum = hit.reduce((t, i) => t + m.pl[i].max, 0) || 1;
    for (const i of hit) hurt(m, i, total * m.pl[i].max / wsum, ev);
    m.score[1] += 3;
    m.streak = 0;
    sync(m);
    ev.push({ t: 'opp', from, who: -1, hit, kind: 'slam', big: true, dmg: total, sta: m.sta, staMax: m.staMax, boss: true });
    checkCollapse(m, ev);
  }

  // Advance the stage by dt seconds of game time. Returns the events that happened (for the court and commentary).
  function step(m, dt) {
    const ev = [];
    if (m.over) return ev;
    m.t += dt;
    m.energy = Math.min(100, m.energy + CFG.energyPerSec * dt);
    const fx = m.fx[0];
    if (fx.hype > 0) fx.hype = Math.max(0, fx.hype - dt);
    if (fx.lockdown > 0) fx.lockdown = Math.max(0, fx.lockdown - dt);
    // gassed players recover
    for (let i = 0; i < m.size; i++) {
      const pl = m.pl[i];
      if (pl.gassed) { pl.rest -= dt; if (pl.rest <= 0) { pl.gassed = false; pl.sta = pl.max * CFG.backAt; ev.push({ t: 'back', who: i }); } }
    }
    spawner(m, ev, dt);
    for (const f of m.foes) if (f.walk > 0) f.walk = Math.max(0, f.walk - dt);
    // ball flights land
    for (let k = m.pending.length - 1; k >= 0; k--) {
      const h = m.pending[k];
      h.t -= dt;
      if (h.t <= 0) { m.pending.splice(k, 1); land(m, h, ev); if (m.over) { sync(m); return ev; } }
    }
    if (fx.iso && m.foes.length) {
      const ok = alive(m, false);
      if (ok.length) {
        fx.iso = false;
        let best = ok[0];
        for (const i of ok) if (m.share[i] > m.share[best]) best = i;
        shoot(m, best, ev, true);
      }
    }
    for (let i = 0; i < m.size; i++) {
      if (m.pl[i].gassed) continue;
      m.cd[i] -= dt;
      if (m.cd[i] <= 0) {
        if (shoot(m, i, ev)) m.cd[i] += m.iv * (0.85 + m.rng() * 0.3);
        else m.cd[i] = 0.15;
      }
    }
    if (m.charge) { m.charge.t -= dt; if (m.charge.t <= 0) bigPlay(m, ev); }
    else {
      for (const f of m.foes.slice()) {
        if (f.walk > 0) continue;
        f.cd -= dt;
        if (f.cd <= 0) { f.cd += CFG.oppIv * (0.8 + m.rng() * 0.4); foePlay(m, f, ev); if (m.over || m.charge) break; }
      }
    }
    sync(m);
    if (!m.over && m.t >= CFG.maxT) { m.over = true; m.winner = 1; ev.push({ t: 'end', win: false, timeout: true }); }
    return ev;
  }

  function simulate(m) {
    let n = 0;
    while (!m.over && n++ < 6000) step(m, 0.1);
    return m;
  }

  function useAbility(m, k, costMult, ev) {
    const ab = D.abilities.find((a) => a.k === k);
    if (!ab || m.over) return false;
    const cost = Math.round(ab.cost * (costMult || 1));
    if (m.energy < cost) return false;
    m.energy -= cost;
    const fx = m.fx[0];
    if (k === 'hype') fx.hype = 6;
    else if (k === 'iso') fx.iso = true;
    else if (k === 'lockdown') fx.lockdown = 5;
    else if (k === 'timeout') {
      m.pl.forEach((pl, i) => {
        if (pl.gassed) { pl.gassed = false; pl.rest = 0; pl.sta = 0; if (ev) ev.push({ t: 'back', who: i }); }
        pl.sta = Math.min(pl.max, pl.sta + pl.max * 0.4);
      });
      sync(m);
      m.energy = Math.min(100, m.energy + 15);
    }
    return true;
  }

  // Stage progress 0..1 (regular defenders broken, then the boss)
  function progress(m) {
    if (m.over && m.winner === 0) return 1;
    const boss = m.foes.find((f) => f.boss);
    const bossPart = m.bossDone ? 1 : boss ? 1 - Math.max(0, boss.hp / boss.hpMax) : 0;
    return (m.broken + bossPart * 3) / (m.nReg + 3);
  }

  function mvp(m) {
    let best = 0, bv = -1;
    m.stats[0].forEach((s, i) => { if (s.dmg > bv) { bv = s.dmg; best = i; } });
    return best;
  }

  BE.stream = { CFG, KIND, FORMS, formation, create, step, simulate, useAbility, progress, mvp };
})(typeof window !== 'undefined' ? window : globalThis);
