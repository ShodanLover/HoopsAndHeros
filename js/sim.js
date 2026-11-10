/* Basketball Empire — possession-by-possession match simulation (headless; drives visuals & offline sims) */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data;

  const RULES = {
    '1v1': { target: 7, two: 1, three: 2, k: 0.8, featuredEvery: 1, label: 'First to 7' },
    '3v3': { target: 11, two: 1, three: 2, k: 0.68, featuredEvery: 1, label: 'First to 11' },
    '5v5': { quarters: 4, perQuarter: 12, two: 2, three: 3, k: 0.46, featuredEvery: 4, label: '4 quarters' },
  };

  // team: {name, colors, players:[{name,short,number,pos,attrs,look,arch,personality,celebration,power}], power, style:{off,def}, tactic:{off,def}, isPlayer}
  function createMatch(home, away, opts) {
    opts = opts || {};
    const fmt = opts.format || '5v5';
    const rules = RULES[fmt];
    const m = {
      format: fmt, rules, teams: [home, away],
      score: [0, 0], poss: 0, offense: opts.awayFirst ? 1 : 0, quarter: 1, qPoss: 0,
      over: false, winner: -1, overtime: false,
      stamina: [home.players.map(() => 100), away.players.map(() => 100)],
      fx: [{ hype: 0, lockdown: 0, iso: false }, { hype: 0, lockdown: 0, iso: false }],
      energy: opts.energy || 0,
      bonus: opts.bonus || { shoot: 0, def: 0, reb: 0, tactic: 0.12, staminaDrain: 1 },
      stats: [home.players.map(blankStats), away.players.map(blankStats)],
      teamStats: [blankTeamStats(), blankTeamStats()],
      rng: opts.rng || Math.random,
      lastEvent: null,
      maxPoss: fmt === '5v5' ? 200 : 90,
    };
    return m;
  }
  function blankStats() { return { pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, threes: 0, dunks: 0 }; }
  function blankTeamStats() { return { threes: 0, dunks: 0, blocks: 0, steals: 0 }; }

  function attr(p, k) { return (p.attrs[k] || 40); }

  function tacticMult(m, ti) {
    // offense of team ti vs defense of other
    const me = m.teams[ti], them = m.teams[1 - ti];
    let off = 1, def = 1;
    const bonus = ti === 0 ? m.bonus.tactic : 0.12;
    if (me.tactic && them.tactic) {
      if (D.offCounters[me.tactic.off] === them.tactic.def) off += bonus;
      if (D.offCounters[them.tactic.off] === me.tactic.def) off -= bonus * 0.5; // their offense counters our D
      if (D.defCounters[me.tactic.def] === them.tactic.off) def += bonus;
    }
    return { off, def };
  }

  function teamEff(m, ti, offense) {
    const t = m.teams[ti];
    const sta = m.stamina[ti];
    let avg = 0;
    for (const v of sta) avg += v;
    avg /= sta.length;
    let eff = t.power * (0.88 + 0.12 * avg / 100);
    const fx = m.fx[ti];
    if (fx.hype > 0) eff *= 1.3;
    if (!offense && fx.lockdown > 0) eff *= 1.35;
    const tm = tacticMult(m, ti);
    eff *= offense ? tm.off : tm.def;
    if (m.score[ti] < m.score[1 - ti] && t.players.some((p) => p.personality === 'underdog')) eff *= 1.08;
    if (ti === 0) eff *= offense ? 1 + m.bonus.shoot : 1 + m.bonus.def;
    return eff;
  }

  function wpick(arr, wfn, rng) {
    const w = arr.map(wfn);
    return arr[U.weightedIndex(w, rng())];
  }

  function isClutch(m) {
    if (m.format === '5v5') return m.quarter >= 4 && m.qPoss >= m.rules.perQuarter * 2 - 6 && Math.abs(m.score[0] - m.score[1]) <= 6;
    const t = m.rules.target;
    return Math.max(m.score[0], m.score[1]) >= t - 3 && Math.abs(m.score[0] - m.score[1]) <= 2;
  }

  // Resolve one possession; returns event {off, segs:[...], pts, featured, clutch}
  function nextPossession(m) {
    if (m.over) return null;
    const rng = m.rng;
    const o = m.offense, d = 1 - o;
    const O = m.teams[o], Dt = m.teams[d];
    const rules = m.rules;
    const ratio = teamEff(m, o, true) / Math.max(1e-9, teamEff(m, d, false));
    const f = U.clamp(Math.pow(ratio, rules.k), 0.25, 4);
    const segs = [];
    const ev = { off: o, segs, pts: 0, clutch: isClutch(m) };
    const oPl = O.players, dPl = Dt.players;
    const guard = (i) => Math.min(i, dPl.length - 1);
    const tac = O.tactic ? O.tactic.off : 'balanced';
    const dtac = Dt.tactic ? Dt.tactic.def : 'man';

    // handler & passes
    let hIdx = oPl.indexOf(wpick(oPl, (p) => attr(p, 'hnd') + attr(p, 'pas') + attr(p, 'iq') * 0.5, rng));
    segs.push({ t: 'dribble', team: o, who: hIdx });
    const iso = m.fx[o].iso;
    let assister = -1;
    let shooter = hIdx;
    if (oPl.length > 1) {
      const nPass = iso ? 1 : U.weightedIndex(tac === 'balanced' ? [1, 3, 3] : [2, 3, 1], rng());
      let cur = hIdx;
      for (let i = 0; i < nPass; i++) {
        let to;
        if (iso && i === nPass - 1) to = bestScorer(oPl);
        else {
          const others = oPl.map((_, k) => k).filter((k) => k !== cur);
          to = wpick(others, (k) => attr(oPl[k], 'sht') + attr(oPl[k], 'thr') * 0.6 + attr(oPl[k], 'str') * 0.4, rng);
        }
        if (to === cur) continue;
        // steal on pass
        const def = dPl[guard(to)];
        const stealP = 0.035 * Math.pow(attr(def, 'stl') / Math.max(20, attr(oPl[cur], 'pas')), 0.7) / Math.sqrt(f) * (dtac === 'press' ? 1.5 : 1) * (def.arch === 'clamps' || def.arch === 'lockdown' ? 1.15 : 1);
        if (rng() < stealP) {
          segs.push({ t: 'pass', team: o, from: cur, to, stolen: true });
          segs.push({ t: 'steal', team: d, who: guard(to), from: cur });
          m.stats[d][guard(to)].stl++; m.teamStats[d].steals++;
          return finish(m, ev);
        }
        segs.push({ t: 'pass', team: o, from: cur, to });
        assister = cur;
        cur = to;
      }
      shooter = cur;
    }
    if (iso) m.fx[o].iso = false;
    const sp = oPl[shooter];
    const dIdx = guard(shooter);
    const dp = dPl[dIdx];

    // on-ball steal
    const tovP = 0.06 * Math.pow(attr(dp, 'stl') / Math.max(20, attr(sp, 'hnd')), 0.7) / Math.sqrt(f) * (dtac === 'press' ? 1.4 : 1) * (dp.arch === 'lockdown' ? 1.15 : 1);
    if (rng() < tovP) {
      segs.push({ t: 'steal', team: d, who: dIdx, from: shooter });
      m.stats[d][dIdx].stl++; m.teamStats[d].steals++;
      return finish(m, ev);
    }

    // choose action
    const tw = { inside: [0.6, 0.8, 1.5, 1.4], balanced: [1, 1, 1, 1], outside: [1.7, 1.1, 0.7, 0.5] }[tac];
    const big = sp.pos === 'C' || sp.pos === 'PF';
    const wts = [
      Math.pow(attr(sp, 'thr'), 2) * tw[0] * (big ? 0.35 : 1),
      Math.pow(attr(sp, 'sht'), 2) * 0.7 * tw[1],
      Math.pow((attr(sp, 'spd') + attr(sp, 'hnd')) / 2, 2) * tw[2],
      Math.pow(attr(sp, 'str'), 2) * tw[3] * (big ? 1 : 0.25),
    ];
    const act = ['three', 'mid', 'drive', 'post'][U.weightedIndex(wts, rng())];
    let kind = act;
    if (act === 'drive') {
      const dunkP = U.clamp((attr(sp, 'spd') + attr(sp, 'str') - 90) / 120, 0.08, 0.75) * (sp.arch === 'slasher' ? 1.5 : 1) * Math.min(1.4, Math.sqrt(f));
      kind = rng() < dunkP ? 'dunk' : 'layup';
      segs.push({ t: 'drive', team: o, who: shooter });
    } else if (act === 'post') segs.push({ t: 'post', team: o, who: shooter });

    const res = shoot(m, o, shooter, dIdx, kind, f, assister, ev);
    if (res === 'miss') rebound(m, o, f, ev, 0);
    return finish(m, ev);
  }

  function bestScorer(pl) {
    let best = 0, bv = -1;
    pl.forEach((p, i) => { const v = attr(p, 'sht') + attr(p, 'thr') + attr(p, 'spd') * 0.5; if (v > bv) { bv = v; best = i; } });
    return best;
  }

  function shoot(m, o, si, di, kind, f, assister, ev) {
    const rng = m.rng, d = 1 - o;
    const sp = m.teams[o].players[si], dp = m.teams[d].players[di];
    const rules = m.rules;
    const segs = ev.segs;
    const base = { three: 0.35, mid: 0.43, layup: 0.53, dunk: 0.72, post: 0.47, putback: 0.52 }[kind];
    const keyA = { three: 'thr', mid: 'sht', layup: 'spd', dunk: 'str', post: 'str', putback: 'reb' }[kind];
    const keyD = kind === 'three' || kind === 'mid' ? 'def' : kind === 'post' || kind === 'putback' ? 'str' : 'def';
    let p = base * Math.pow(attr(sp, keyA) / Math.max(20, attr(dp, keyD)), 0.35) * Math.pow(f, 0.6);
    if (kind === 'three' && sp.arch === 'sharpshooter') p *= 1.12;
    if ((kind === 'layup' || kind === 'dunk') && sp.arch === 'slasher') p *= 1.1;
    if (kind === 'post' && sp.arch === 'post') p *= 1.12;
    if (assister >= 0 && m.teams[o].players[assister].arch === 'general') p *= 1.08;
    if (sp.arch === 'twoway') p *= 1.05;
    if (ev.clutch && sp.personality === 'assassin') p *= 1.1;
    if (m.fx[o].isoBoost) { p *= 1.4; m.fx[o].isoBoost = false; }
    p = U.clamp(p, 0.06, 0.95);
    // stamina drain
    drain(m, o, si);
    // block
    if (kind !== 'three' && kind !== 'mid') {
      let bp = 0.075 * Math.pow(attr(dp, 'blk') / Math.max(20, attr(sp, kind === 'dunk' || kind === 'post' ? 'str' : 'hnd')), 0.8) / Math.pow(f, 0.4);
      if (dp.arch === 'rim') bp *= 1.4;
      if (rng() < U.clamp(bp, 0.01, 0.35)) {
        segs.push({ t: 'shot', team: o, who: si, kind, made: false, blockedBy: di, pts: 0 });
        m.stats[d][di].blk++; m.teamStats[d].blocks++;
        return 'miss';
      }
    } else if (kind === 'three' && rng() < 0.02 / Math.pow(f, 0.4)) {
      segs.push({ t: 'shot', team: o, who: si, kind, made: false, blockedBy: di, pts: 0 });
      m.stats[d][di].blk++; m.teamStats[d].blocks++;
      return 'miss';
    }
    // foul on drives
    if ((kind === 'layup' || kind === 'dunk' || kind === 'post') && rng() < 0.09) {
      segs.push({ t: 'foul', team: d, who: di, on: si });
      const ftP = U.clamp(0.48 + attr(sp, 'sht') / 260, 0.4, 0.93);
      const n = rules.two === 1 ? 1 : 2;
      let made = 0;
      const shots = [];
      for (let i = 0; i < n; i++) { const mk = rng() < ftP; shots.push(mk); if (mk) made++; }
      segs.push({ t: 'ft', team: o, who: si, shots });
      m.score[o] += made; ev.pts += made; m.stats[o][si].pts += made;
      return 'done';
    }
    const made = rng() < p;
    const pts = made ? (kind === 'three' ? rules.three : rules.two) : 0;
    segs.push({ t: 'shot', team: o, who: si, kind, made, pts, assist: made ? assister : -1 });
    if (made) {
      m.score[o] += pts; ev.pts += pts;
      m.stats[o][si].pts += pts;
      if (assister >= 0) m.stats[o][assister].ast++;
      if (kind === 'three') { m.stats[o][si].threes++; m.teamStats[o].threes++; }
      if (kind === 'dunk') { m.stats[o][si].dunks++; m.teamStats[o].dunks++; }
      return 'made';
    }
    return 'miss';
  }

  function rebound(m, o, f, ev, depth) {
    const rng = m.rng, d = 1 - o;
    const O = m.teams[o].players, Dp = m.teams[d].players;
    const bestO = wpick(O.map((_, i) => i), (i) => Math.pow(attr(O[i], 'reb'), 2) * (O[i].arch === 'glass' ? 1.3 : 1), rng);
    const bestD = wpick(Dp.map((_, i) => i), (i) => Math.pow(attr(Dp[i], 'reb'), 2) * (Dp[i].arch === 'glass' ? 1.3 : 1), rng);
    let orp = 0.26 * Math.pow(attr(O[bestO], 'reb') / Math.max(20, attr(Dp[bestD], 'reb')), 0.6) * Math.pow(f, 0.25);
    if (o === 0) orp *= 1 + m.bonus.reb; else orp /= 1 + m.bonus.reb;
    if (rng() < U.clamp(orp, 0.08, 0.6)) {
      ev.segs.push({ t: 'rebound', team: o, who: bestO, off: true });
      m.stats[o][bestO].reb++;
      if (depth < 1) {
        const res = shoot(m, o, bestO, Math.min(bestO, Dp.length - 1), 'putback', f, -1, ev);
        if (res === 'miss') rebound(m, o, f, ev, depth + 1);
      } else {
        ev.segs.push({ t: 'reset', team: o });
      }
    } else {
      ev.segs.push({ t: 'rebound', team: d, who: bestD, off: false });
      m.stats[d][bestD].reb++;
    }
  }

  function drain(m, ti, pi) {
    const p = m.teams[ti].players[pi];
    let k = (130 - attr(p, 'sta')) / 70 * (p.personality === 'workhorse' ? 0.7 : 1);
    if (ti === 0) k *= m.bonus.staminaDrain;
    const st = m.stamina[ti];
    for (let i = 0; i < st.length; i++) st[i] = Math.max(35, st[i] - k * (i === pi ? 1.4 : 0.5) * (m.format === '5v5' ? 0.55 : 1));
  }

  function finish(m, ev) {
    const o = ev.off;
    m.poss++;
    m.qPoss++;
    // effects tick (per possession for each team's own buffs)
    for (const fx of m.fx) {
      if (fx.hype > 0) fx.hype--;
    }
    if (m.fx[1 - o].lockdown > 0) m.fx[1 - o].lockdown--;
    // energy (player team = 0)
    let gain = 3;
    const last = ev.segs[ev.segs.length - 1];
    for (const s of ev.segs) {
      if (s.team === 0 && ((s.t === 'shot' && s.made && (s.kind === 'dunk' || s.kind === 'three')) || s.t === 'steal')) gain += 4;
      if (s.team === 1 && s.t === 'shot' && s.blockedBy !== undefined) gain += 4;
    }
    if (m.teams[0].players.some((p) => p.arch === 'showman')) gain += 1;
    m.energy = Math.min(100, m.energy + gain);
    ev.featured = m.format !== '5v5' || ev.clutch || m.qPoss % m.rules.featuredEvery === 0 || m.score[0] + m.score[1] < 3;
    // rotate possession (streetball: make-it-take-it disabled for fairness; alternate)
    m.offense = 1 - o;
    // end conditions
    const r = m.rules;
    if (m.format === '5v5') {
      const perQ = r.perQuarter * 2;
      const qLimit = m.overtime ? 6 : perQ;
      if (m.qPoss >= qLimit) {
        ev.endQuarter = m.quarter;
        if (m.quarter >= 4 && m.score[0] !== m.score[1]) end(m);
        else if (m.quarter >= 4) { m.overtime = true; m.quarter++; m.qPoss = 0; ev.overtime = true; }
        else { m.quarter++; m.qPoss = 0; }
        for (const st of m.stamina) for (let i = 0; i < st.length; i++) st[i] = Math.min(100, st[i] + 18);
      }
    } else {
      if (m.score[0] >= r.target || m.score[1] >= r.target) end(m);
    }
    if (!m.over && m.poss >= m.maxPoss) { if (m.score[0] === m.score[1]) m.score[m.rng() < 0.5 ? 0 : 1]++; end(m); }
    ev.score = m.score.slice();
    ev.last = last;
    m.lastEvent = ev;
    return ev;
  }
  function end(m) {
    m.over = true;
    m.winner = m.score[0] > m.score[1] ? 0 : 1;
  }

  // Abilities (player team = 0)
  function useAbility(m, k, costMult) {
    const ab = D.abilities.find((a) => a.k === k);
    if (!ab || m.over) return false;
    const cost = Math.round(ab.cost * (costMult || 1));
    if (m.energy < cost) return false;
    m.energy -= cost;
    const fx = m.fx[0];
    if (k === 'hype') fx.hype = 6;
    else if (k === 'iso') { fx.iso = true; fx.isoBoost = true; }
    else if (k === 'lockdown') fx.lockdown = 3;
    else if (k === 'timeout') { m.stamina[0] = m.stamina[0].map(() => 100); m.energy = Math.min(100, m.energy + 15); }
    return true;
  }

  function playAll(m) {
    let n = 0;
    while (!m.over && n < 500) { nextPossession(m); n++; }
    return m;
  }

  function mvp(m, ti) {
    let best = 0, bv = -1;
    m.stats[ti].forEach((s, i) => { const v = s.pts + s.reb * 0.8 + s.ast * 1 + s.stl * 1.5 + s.blk * 1.5; if (v > bv) { bv = v; best = i; } });
    return best;
  }

  // Monte-Carlo win probability (headless) — used for offline simulation & UI hints
  function winProb(homeFactory, awayFactory, fmt, n, seed) {
    const rng = U.mulberry32(seed || 1234);
    let w = 0;
    for (let i = 0; i < n; i++) {
      const m = createMatch(homeFactory(), awayFactory(), { format: fmt, rng });
      playAll(m);
      if (m.winner === 0) w++;
    }
    return w / n;
  }

  BE.sim = { RULES, createMatch, nextPossession, useAbility, playAll, mvp, winProb };
})(typeof window !== 'undefined' ? window : globalThis);
