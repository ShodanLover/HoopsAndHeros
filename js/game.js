/* Basketball Empire — game orchestration: opponents, match lifecycle, rewards, idle ticks, offline progress, resets */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, A = BE.athletes, E = BE.econ, S = BE.sim, B = D.balance;

  function cosmetic(s) { return D.cosmetics.find((c) => c.k === s.franchise.cosmetic) || D.cosmetics[0]; }

  function gearVis(s, a) {
    const v = {};
    for (const slot in a.gear) { const it = s.gearById[a.gear[slot]]; if (it) v[slot] = it.rarity; }
    return v;
  }

  // ---------- Lineup management ----------
  function ensureLineup(s, size) {
    size = size || E.sizeOf(Math.min(s.run.cleared, 99));
    const m = E.mods(s);
    s.lineup = s.lineup.filter((u) => s.rosterByUid[u]);
    if (s.lineup.length < size) {
      const free = s.roster.filter((a) => !s.lineup.includes(a.uid)).sort((a, b) => E.athletePower(s, b, m) - E.athletePower(s, a, m));
      while (s.lineup.length < size && free.length) s.lineup.push(free.shift().uid);
    }
  }
  function autoLineup(s) {
    const m = E.mods(s);
    const sorted = s.roster.slice().sort((a, b) => E.athletePower(s, b, m) - E.athletePower(s, a, m));
    s.lineup = sorted.slice(0, 5).map((a) => a.uid);
  }
  // A new athlete stronger than the weakest active starter takes their spot
  function autoPromote(s, a) {
    const size = E.sizeOf(Math.min(s.run.cleared, 99));
    if (s.lineup.slice(0, size).includes(a.uid)) return null;
    const m = E.mods(s);
    const pa = E.athletePower(s, a, m);
    let worst = -1, wv = Infinity;
    s.lineup.slice(0, size).forEach((u, i) => { const x = s.rosterByUid[u]; const p = x ? E.athletePower(s, x, m) : -1; if (p < wv) { wv = p; worst = i; } });
    if (worst < 0 || pa <= wv) return null;
    const out = s.rosterByUid[s.lineup[worst]];
    const old = s.lineup.indexOf(a.uid);
    if (old >= 0) s.lineup.splice(old, 1);
    s.lineup[worst] = a.uid;
    if (out && !s.lineup.includes(out.uid) && s.lineup.length < 5) s.lineup.push(out.uid);
    return out || null;
  }
  // When a format grows beyond the roster, local kids join for free
  function giftWalkOns(s, size) {
    const gifts = [];
    while (s.roster.length < size) {
      const pool = A.catalog.filter((t) => t.rarity <= 1 && t.world === 0 && !s.collection[t.id]);
      const t = pool.length ? pool[Math.floor(Math.random() * pool.length)] : A.catalog[0];
      const r = E.addAthlete(s, t);
      r.a.lvl = Math.max(1, Math.max.apply(null, s.roster.map((x) => x.lvl)));
      gifts.push(r.a);
    }
    ensureLineup(s, size);
    return gifts;
  }

  // ---------- Targets ----------
  function target(s) {
    const c = s.run.cleared;
    if (s.run.champ) return { g: s.run.champ.g, round: s.run.champ.round, mode: 'champ' };
    if (c >= 100) return { g: c, mode: s.run.farming ? 'farm' : 'push', farmG: c - 1 }; // endless rifts
    if (E.isChamp(c)) return { g: Math.max(0, c - 1), mode: 'farm', champReady: true };
    if (s.run.farming && c > 0) return { g: c - 1, mode: 'farm' };
    return { g: c, mode: 'push' };
  }

  function playerTeam(s, size) {
    ensureLineup(s, size);
    const m = E.mods(s);
    const ls = E.lineupAthletes(s).slice(0, size);
    const cos = cosmetic(s);
    const players = ls.map((a) => {
      const t = A.tpl(a.cid);
      return {
        uid: a.uid, name: A.displayName(t), short: t.last, number: t.number, pos: t.pos, attrs: A.effAttrs(s, a), look: t.look,
        arch: t.arch, personality: t.personality, celebration: t.celebration, rarity: t.rarity, power: E.athletePower(s, a, m), gear: gearVis(s, a),
      };
    });
    while (players.length < size) {
      const opp = A.opponentTeam(0, 1, { seed: players.length + 99 }).players[0];
      opp.name = 'Walk-on'; opp.short = 'Walk-on'; opp.power = E.oppPerPlayer(0) * 0.6; opp.gear = {};
      players.push(opp);
    }
    const power = E.teamPower(s, size) + players.slice(ls.length).reduce((t, p) => t + p.power, 0);
    return {
      name: s.franchise.name, colors: cos.jersey, players, power, isPlayer: true,
      tactic: { off: s.tactics.off, def: s.tactics.def },
      style: { off: s.tactics.off, def: s.tactics.def },
    };
  }

  function oppTeam(s, g, round) {
    const size = E.sizeOf(Math.min(g, 99));
    const champ = round !== undefined;
    let name;
    if (champ && round < 2) {
      const w = E.worldOf(g);
      const pool = D.worlds[w].teams.slice(0, 9);
      name = pool[(round * 4 + 3) % 9] + (size === 1 ? '' : ' (Playoff)');
    }
    const t = A.opponentTeam(g, size, { round: champ ? round + 1 : 0, name });
    const per = E.oppPerPlayer(g, champ ? round : undefined);
    t.players.forEach((p) => { p.power = per; p.short = p.last; p.name = p.first + ' ' + p.last; p.gear = {}; });
    t.power = per * size;
    t.tactic = { off: t.style.off, def: t.style.def };
    return t;
  }

  function autoTactics(s, opp) {
    if (!(s.coaches.analytics > 0 || s.purchases.autocoach) || !s.settings.autoTactics) return;
    const offFor = { man: 'inside', press: 'balanced', zone: 'outside' };
    const defFor = { outside: 'man', inside: 'zone', balanced: 'press' };
    s.tactics.off = offFor[opp.style.def];
    s.tactics.def = defFor[opp.style.off];
  }

  function newMatch(s, opts) {
    opts = opts || {};
    const tg = opts.target || target(s);
    const fmt = E.formatOf(Math.min(tg.g, 99));
    const size = D.formats[fmt].size;
    if (s.roster.length < size) giftWalkOns(s, size);
    const away = oppTeam(s, tg.g, tg.mode === 'champ' ? tg.round : undefined);
    if (E.unlocked(s, 'tactics')) autoTactics(s, away);
    const home = playerTeam(s, size);
    if (!E.unlocked(s, 'tactics')) { home.tactic = null; away.tactic = null; }
    const m = E.mods(s);
    const match = S.createMatch(home, away, {
      format: fmt,
      bonus: Object.assign({}, m.sim, { staminaDrain: m.staminaDrain }),
      energy: 20,
      awayFirst: Math.random() < 0.5 && s.tutorial.done,
    });
    match.ctx = tg;
    match.tutorialEasy = !s.tutorial.done && s.run.cleared === 0;
    if (match.tutorialEasy) { home.power *= 2.2; }
    return match;
  }

  // ---------- Results ----------
  function onMatchEnd(s, match) {
    const tg = match.ctx;
    const win = match.winner === 0;
    const g = tg.g;
    const r = { win, cash: 0, fans: 0, gems: 0, tickets: 0, gear: null, advanced: false, champ: null, newWorld: false, mode: tg.mode, g };
    const st = s.stats;
    st.gamesPlayed++;
    const ts = match.teamStats[0];
    st.threes += ts.threes; st.dunks += ts.dunks; st.blocks += ts.blocks; st.steals += ts.steals;
    const reward = E.stageReward(s, g);
    if (win) {
      st.wins++;
      s.pass.xp += 2;
      r.fans = E.fansPerWin(s, g) * (match.teams[0].players.some((p) => p.personality === 'joker') ? 1.05 : 1);
      s.fans += r.fans;
      if (tg.mode === 'push') {
        r.cash = reward;
        s.run.cleared = g + 1;
        s.run.farming = false;
        st.stagesCleared++;
        r.advanced = true;
      } else if (tg.mode === 'farm') {
        r.cash = reward * B.farmReward;
        s.run.farmWins = (s.run.farmWins || 0) + 1;
        if (s.run.farming && s.settings.autoPush && s.run.farmWins >= 3) { s.run.farming = false; s.run.farmWins = 0; }
      } else if (tg.mode === 'champ') {
        st.champWins++;
        r.cash = reward * B.champReward * (1 + tg.round * 0.5);
        if (tg.round >= 2) {
          // Championship!
          s.run.champ = null;
          s.run.cleared = g + 1;
          st.championships++;
          st.stagesCleared++;
          s.pass.xp += 50;
          const w = E.worldOf(g);
          r.champ = { world: w, gems: 40 + 20 * w, tickets: 2 + Math.floor(w / 2), eventTickets: 2, gear: null };
          s.gems += r.champ.gems; s.tickets += r.champ.tickets; s.eventTickets += r.champ.eventTickets;
          r.champ.gear = E.randomGear(s, Math.min(4, 2 + Math.floor(w / 3)));
          r.newWorld = g < 99;
          r.advanced = true;
        } else {
          s.run.champ.round++;
        }
      }
      // Drops
      if (E.unlocked(s, 'gear') && (Math.random() < 0.06 || (s.gear.length === 0 && s.run.cleared >= 5))) r.gear = E.randomGear(s, 0);
      const gp = 0.03 + E.mods(s).gemDrop;
      if (Math.random() < gp) { r.gems += 1 + Math.floor(Math.random() * 3); s.gems += r.gems; }
      if (tg.mode === 'push' && g === 0) { r.tickets = 1; s.tickets += 1; } // tutorial: first win gives a ticket
      if (tg.mode === 'push' && (g + 1) % 5 === 0 && g < 100) { r.tickets += 1; s.tickets += 1; }
      st.bestWorld = Math.max(st.bestWorld, E.worldOf(s.run.cleared) + 1);
    } else {
      st.losses++;
      r.cash = reward * B.lossReward;
      if (tg.mode === 'push') { s.run.farming = true; s.run.farmWins = 0; }
      if (tg.mode === 'champ') { r.champLost = tg.round; s.run.champ = null; s.run.farming = s.run.cleared > 0; s.run.farmWins = 0; }
    }
    if (s.run.cleared > s.best) s.best = s.run.cleared;
    r.cash = E.addCash(s, r.cash);
    if (social.allianceActive(s) && win) s.social.contributed++;
    // format growth gifts
    const nextSize = E.sizeOf(Math.min(s.run.cleared, 99));
    if (s.roster.length < nextSize) r.gifts = giftWalkOns(s, nextSize);
    ensureLineup(s, nextSize);
    return r;
  }

  function startChampionship(s) {
    const c = s.run.cleared;
    if (!E.isChamp(c) || s.run.champ) return false;
    s.run.champ = { g: c, round: 0 };
    return true;
  }

  // ---------- Idle ticking ----------
  function tick(s, dt) {
    const m = E.mods(s);
    let inc = E.passivePerSec(s) * dt + E.divisionPerSec(s) * dt;
    if (m.autoTrain > 0 && inc > 0) {
      const div = inc * m.autoTrain;
      inc -= div;
      s.run.autoBudget = (s.run.autoBudget || 0) + div;
      autoTrainSpend(s);
    }
    E.addCash(s, inc);
    s.division.earned += E.divisionPerSec(s) * dt;
    s.tp += E.tpPerSec(s) * dt;
    // academy tickets
    const ac = s.facilities.academy || 0;
    if (ac > 0) {
      const interval = (12 * 3600 * 1000) / Math.min(ac, 6);
      const now = Date.now();
      if (!s.timers.academy || s.timers.academy > now) s.timers.academy = now;
      let n = 0;
      while (now - s.timers.academy >= interval && n < 10) { s.timers.academy += interval; s.tickets++; n++; }
      if (n) BE.bus.emit('toast', { text: 'Youth Academy delivered ' + n + ' recruit ticket' + (n > 1 ? 's' : ''), icon: 'ticket' });
    } else s.timers.academy = Date.now();
  }
  function autoTrainSpend(s) {
    let guard = 0;
    while (guard++ < 20) {
      let cheapest = null, cc = Infinity;
      for (const a of E.lineupAthletes(s)) {
        if (a.lvl >= E.maxLevel(s)) continue;
        const c = E.levelCost(s, a, 1);
        if (c < cc) { cc = c; cheapest = a; }
      }
      if (!cheapest || s.run.autoBudget < cc) break;
      s.run.autoBudget -= cc;
      cheapest.lvl++;
      s.stats.levelups++;
    }
  }

  // ---------- Offline progress ----------
  function estimateWinProb(s, g, round) {
    const fmt = E.formatOf(Math.min(g, 99));
    const size = D.formats[fmt].size;
    const home = playerTeam(s, size);
    const away = oppTeam(s, g, round);
    const m = E.mods(s);
    const bonus = Object.assign({}, m.sim, { staminaDrain: m.staminaDrain });
    const rng = U.mulberry32(777 + g);
    let w = 0;
    const n = fmt === '5v5' ? 16 : 30;
    for (let i = 0; i < n; i++) {
      const mt = S.createMatch(home, away, { format: fmt, rng, bonus });
      S.playAll(mt);
      if (mt.winner === 0) w++;
    }
    return w / n;
  }

  function offline(s, seconds) {
    const m = E.mods(s);
    const capS = m.offlineCapH * 3600;
    const t = Math.min(seconds, capS);
    const eff = m.offlineEff;
    const res = { seconds, counted: t, capped: seconds > capS, games: 0, wins: 0, cash: 0, tp: 0, fans: 0, stages: 0, division: 0, eff };
    if (t < 60) return res;
    const gameLen = 28;
    let games = Math.floor(t / gameLen);
    res.games = games;
    let cash = 0;
    // push while likely to win (never auto-enter championships)
    let guard = 0;
    while (games > 0 && guard++ < 40 && !s.run.champ) {
      const c = s.run.cleared;
      if (E.isChamp(c) || c >= 300) break;
      const p = estimateWinProb(s, c);
      if (p < 0.55) break;
      const cost = Math.ceil(1 / p);
      if (games < cost) break;
      games -= cost;
      cash += E.stageReward(s, c);
      res.wins += 1;
      s.run.cleared = c + 1;
      s.run.farming = false;
      s.stats.stagesCleared++;
      res.stages++;
      res.fans += E.fansPerWin(s, c);
      if (s.run.cleared > s.best) s.best = s.run.cleared;
      const sz = E.sizeOf(Math.min(s.run.cleared, 99));
      if (s.roster.length < sz) giftWalkOns(s, sz);
    }
    if (games > 0) {
      const fg = Math.max(0, s.run.cleared - 1);
      const p = s.run.cleared === 0 ? 0.5 : estimateWinProb(s, fg);
      const w = Math.floor(games * p);
      res.wins += w;
      cash += w * E.stageReward(s, fg) * B.farmReward + (games - w) * E.stageReward(s, fg) * B.lossReward;
      res.fans += w * E.fansPerWin(s, fg);
    }
    cash += E.passivePerSec(s) * t;
    res.division = E.divisionPerSec(s) * t * eff;
    res.cash = cash * eff + res.division;
    res.tp = E.tpPerSec(s) * t;
    res.fans *= eff;
    s.stats.wins += res.wins;
    s.stats.gamesPlayed += res.games;
    s.fans += res.fans;
    s.tp += res.tp;
    s.division.earned += res.division;
    E.addCash(s, res.cash);
    // academy handled by real timestamps in tick()
    return res;
  }

  // ---------- Daily / weekly / monthly resets ----------
  function makeMissions(s, kind, key) {
    const pool = D.missionPool[kind].filter((m) => !m.feature || E.unlocked(s, m.feature));
    const rng = U.mulberry32(U.hashStr(key + kind + s.created));
    const picks = [];
    const avail = pool.slice();
    const count = kind === 'daily' ? 3 : 3;
    for (let i = 0; i < count && avail.length; i++) {
      const j = Math.floor(rng() * avail.length);
      const def = avail.splice(j, 1)[0];
      const tier = Math.min(def.n.length - 1, Math.floor(rng() * def.n.length));
      const goal = def.n[tier];
      picks.push({
        id: kind + i, k: def.k, text: def.text.replace('{n}', goal), goal, stat: def.stat, base: s.stats[def.stat] || 0, claimed: false,
        reward: kind === 'daily' ? { gems: 10 + tier * 5, passXp: 100, cash: 2 + tier * 2 } : { gems: 50 + tier * 25, tickets: 1 + tier, passXp: 400 },
      });
    }
    if (kind === 'daily') picks.push({ id: 'dailyAll', k: 'all', text: 'Complete all daily missions', goal: 3, stat: '_dailyAll', base: 0, claimed: false, reward: { tickets: 1, passXp: 150, tp: 20 } });
    return picks;
  }
  function missionProgress(s, mi) {
    if (mi.stat === '_dailyAll') return s.missions.daily.filter((x) => x.id !== 'dailyAll' && x.claimed).length;
    return Math.max(0, (s.stats[mi.stat] || 0) - mi.base);
  }

  function resets(s, now) {
    now = now || Date.now();
    const day = U.dayKey(now), week = U.weekKey(now), month = U.monthKey(now);
    const msgs = [];
    if (s.missions.day !== day || !s.missions.daily.length) {
      s.missions.day = day;
      s.missions.daily = makeMissions(s, 'daily', day);
    }
    if (s.missions.week !== week || !s.missions.weekly.length) {
      s.missions.week = week;
      s.missions.weekly = makeMissions(s, 'weekly', week);
    }
    if (s.events.day !== day) {
      s.events.day = day;
      s.events.attempts = { ft: 3, three: 3, dunk: 3 };
    }
    if (s.ads.day !== day) { s.ads.day = day; s.ads.counts = {}; }
    if (s.pass.month !== month) {
      s.pass.month = month; s.pass.xp = 0; s.pass.free = []; s.pass.prem = [];
      s.pass.premium = false;
    }
    if (s.tourney.week !== week) {
      s.tourney.week = week; s.tourney.entries = 0; s.tourney.points = 0; s.tourney.claimed = false; s.tourney.lastResult = null; s.tourney.best = 0;
    }
    if (s.social.week !== week) { s.social.week = week; s.social.contributed = 0; s.social.claimed = []; }
    if (s.timers.freeTicketDay !== day) {
      s.timers.freeTicketDay = day;
      const n = (s.prestige.upgrades.scout || 0) + ((s.coaches.recruiting || 0) >= 5 ? 1 : 0);
      if (n > 0) { s.tickets += n; msgs.push('Scout Network delivered ' + n + ' free Pro Scout ticket' + (n > 1 ? 's' : '')); }
    }
    if (s.purchases.vip && s.timers.vipGemDay !== day) {
      s.timers.vipGemDay = day; s.gems += 40; msgs.push('VIP daily bonus: +40 gems');
    }
    return msgs;
  }

  // ---------- Training Camps (keyed, tiered dungeons) ----------
  const CAMPS = [
    { k: 'cash', name: 'Cash Camp', desc: 'One game against a tuned-up squad for a cash bonus.', icon: 'cash', color: '#38d996', rounds: 1, reward: (tier) => ({ cash: 8 * tier }) },
    { k: 'scrap', name: 'Scrap Camp', desc: 'One game. Scrap for upgrading and crafting gear.', icon: 'craft', color: '#8a94a8', rounds: 1, reward: (tier) => ({ scrap: 30 * tier, cash: 2 * tier }) },
    { k: 'shard', name: 'Shard Camp', desc: 'One game. Star Shards for the exchange.', icon: 'star', color: '#ff8fd0', rounds: 1, reward: (tier) => ({ shards: 15 * tier, cash: 2 * tier }) },
    { k: 'boss', name: 'Boss Rush', desc: 'Three opponents, each tougher. Gems per round won.', icon: 'trophy', color: '#ffd23f', rounds: 3, reward: (tier, won) => ({ gems: 6 * tier * won, cash: 3 * tier * won }) },
  ];
  const CAMP_KEYS = 2, CAMP_MAX_TIER = 25;
  function campsState(s) {
    const day = U.dayKey();
    const c = s.camps;
    if (c.day !== day) { c.day = day; for (const x of CAMPS) c.keys[x.k] = CAMP_KEYS; }
    for (const x of CAMPS) { if (c.keys[x.k] === undefined) c.keys[x.k] = CAMP_KEYS; if (!c.tier[x.k]) c.tier[x.k] = 1; if (!c.max[x.k]) c.max[x.k] = 1; }
    return c;
  }
  function campScale(tier) { return 0.75 + 0.3 * tier; }
  function campReward(s, k, tier, won) { const c = CAMPS.find((x) => x.k === k); return c.reward(tier, won === undefined ? c.rounds : won); }
  function setCampTier(s, k, delta) { const st = campsState(s); st.tier[k] = U.clamp(st.tier[k] + delta, 1, st.max[k]); return st.tier[k]; }
  function runCamp(s, k) {
    const c = CAMPS.find((x) => x.k === k);
    const st = campsState(s);
    if (!c) return { ok: false, reason: 'Unknown camp' };
    if (st.keys[k] <= 0) return { ok: false, reason: 'No keys left today' };
    st.keys[k]--;
    const tier = st.tier[k];
    const g = E.farmG(s);
    const fmt = E.formatOf(Math.min(g, 99)), size = D.formats[fmt].size;
    const home = playerTeam(s, size);
    const m = E.mods(s);
    const bonus = Object.assign({}, m.sim, { staminaDrain: m.staminaDrain });
    const results = [];
    let won = 0;
    for (let r = 0; r < c.rounds; r++) {
      const away = oppTeam(s, g);
      const scale = campScale(tier) * (1 + 0.15 * r);
      away.power *= scale; away.players.forEach((p) => { p.power *= scale; });
      away.name = c.rounds > 1 ? ['Camp Starters', 'Camp Veterans', 'Camp Boss'][r] : c.name + ' squad';
      const mt = S.createMatch(home, away, { format: fmt, rng: Math.random, bonus });
      S.playAll(mt);
      const w = mt.winner === 0;
      results.push({ opp: away.name, score: mt.score.slice(), won: w });
      if (!w) break;
      won++;
    }
    const cleared = won === c.rounds;
    let granted = [];
    if (won > 0) granted = E.grant(s, c.reward(tier, won));
    let newTier = 0;
    if (cleared && tier === st.max[k] && st.max[k] < CAMP_MAX_TIER) { st.max[k]++; st.tier[k] = st.max[k]; newTier = st.max[k]; }
    s.stats.camps = (s.stats.camps || 0) + 1;
    return { ok: true, tier, rounds: c.rounds, won, cleared, results, granted, newTier };
  }

  // ---------- Boosts (20-minute buffs) ----------
  function activateBuff(s, k) {
    const b = D.boosts.find((x) => x.k === k);
    const now = Date.now();
    const base = Math.max(now, s.buffs[k] || 0);
    s.buffs[k] = base + b.minutes * 60000;
    E.invalidate();
    return { left: s.buffs[k] - now };
  }

  // ---------- Halftime Spin ----------
  function spinState(s) {
    const day = U.dayKey();
    if (s.spin.day !== day) { s.spin.day = day; s.spin.used = 0; }
    return { freeLeft: s.spin.used < 1 ? 1 : 0, adLeft: Math.max(0, D.ads.spin.daily - (s.ads.counts.spin || 0)), used: s.spin.used };
  }
  function spin(s) {
    spinState(s);
    const idx = U.weightedIndex(D.spinWheel.map((w) => w.w), Math.random());
    s.spin.used++;
    s.stats.spins = (s.stats.spins || 0) + 1;
    return { idx, granted: E.grant(s, D.spinWheel[idx].reward) };
  }

  // ---------- Fan gifts ----------
  function claimGift(s) {
    const r = { cash: 1.5 };
    if (Math.random() < 0.35) r.gems = 2 + Math.floor(Math.random() * 3);
    if (Math.random() < 0.15) r.tp = 10;
    s.stats.gifts = (s.stats.gifts || 0) + 1;
    return E.grant(s, r);
  }

  // ---------- Franchise Story (quest chain) ----------
  function questProgress(s, q) {
    switch (q.stat) {
      case 'best': return s.best;
      case 'roster': return s.roster.length;
      case 'unique': return s.stats.unique;
      default: return s.stats[q.stat] || 0;
    }
  }
  function questState(s) {
    const list = D.questLine, i = s.quest.i;
    if (i >= list.length) return { q: null, done: false, i, prog: 0, total: list.length };
    const q = list[i];
    const prog = questProgress(s, q);
    return { q, prog: Math.min(prog, q.n), done: prog >= q.n, i, total: list.length };
  }
  function claimQuest(s) {
    const st = questState(s);
    if (!st.q || !st.done) return null;
    s.quest.i++;
    s.quest.claimed++;
    s.pass.xp += 40;
    return { granted: E.grant(s, st.q.reward), q: st.q, next: questState(s).q };
  }

  // ---------- Login rewards ----------
  function loginStatus(s) {
    const today = U.dayKey();
    const yesterday = U.dayKey(Date.now() - 86400000);
    const claimedToday = s.login.claimedDay === today;
    let streak = s.login.streak;
    if (!claimedToday && s.login.claimedDay !== yesterday) streak = 0; // missed a day → restart cycle (no penalty beyond reset)
    const dayIdx = claimedToday ? (streak - 1 + 7) % 7 : streak % 7;
    return { claimedToday, dayIdx, streak };
  }
  function claimLogin(s) {
    const st = loginStatus(s);
    if (st.claimedToday) return null;
    const rw = D.loginRewards[st.dayIdx];
    s.login.streak = st.streak + 1;
    s.login.claimedDay = U.dayKey();
    s.stats.loginDays++;
    return E.grant(s, rw);
  }

  // ---------- Season pass ----------
  const PASS_TIERS = 30, PASS_XP = 300;
  function passReward(tier, prem) {
    // tier 1..30
    if (!prem) {
      if (tier % 10 === 0) return { tickets: 2, gems: 30 };
      if (tier % 5 === 0) return { tickets: 1 };
      if (tier % 3 === 0) return { gearChest: 1 };
      if (tier % 2 === 0) return { gems: 15 };
      return { cashMinutes: 15 };
    }
    if (tier === 30) return { cosmetic: 'pass', gems: 300, tickets: 5 };
    if (tier % 10 === 0) return { tickets: 4, gems: 100 };
    if (tier % 5 === 0) return { gearChest: 2, gearMin: 3 };
    if (tier % 2 === 0) return { gems: 40 };
    return { tpHours: 2, cashMinutes: 20 };
  }
  function passTier(s) { return Math.min(PASS_TIERS, Math.floor(s.pass.xp / PASS_XP)); }

  // ---------- Achievements ----------
  function achievementState(s, a) {
    const claimed = s.achievements[a.k] || 0;
    const val = s.stats[a.stat] || 0;
    const next = a.tiers[claimed];
    return { claimed, val, next, ready: next !== undefined && val >= next, done: claimed >= a.tiers.length };
  }
  function claimAchievement(s, a) {
    const st = achievementState(s, a);
    if (!st.ready) return null;
    const gems = D.achievementGems[Math.min(st.claimed, D.achievementGems.length - 1)];
    s.achievements[a.k] = st.claimed + 1;
    s.gems += gems;
    return { gems };
  }

  // ---------- Social (local simulation; architected for an online provider) ----------
  const social = {
    provider: 'local',
    allianceActive(s) { return !!s.social.alliance; },
    empireScore(s) {
      return Math.floor(s.best * 1000 + s.prestige.earned * 250 + s.stats.unique * 40 + s.stats.championships * 600 + Math.log10(1 + s.stats.cashEarned) * 120);
    },
    // Deterministic simulated rivals around the player's progress
    leaderboard(s, kind) {
      const me = social.empireScore(s);
      const wk = U.weekKey();
      const rng = U.mulberry32(U.hashStr(kind + wk + (kind === 'friends' ? s.created : '')));
      const names = D.aiFranchiseNames.slice();
      const rows = [];
      const n = kind === 'friends' ? 9 : 49;
      const spread = kind === 'friends' ? 0.35 : 1.2;
      const anchor = kind === 'global' ? Math.max(me, 9000) : me;
      for (let i = 0; i < n; i++) {
        const nm = names.splice(Math.floor(rng() * names.length), 1)[0];
        const v = Math.max(100, Math.floor(anchor * Math.exp((rng() * 2 - 1) * spread) * (kind === 'global' ? 1 + rng() * 0.8 : 1)));
        rows.push({ name: nm, score: v, prestige: Math.floor(rng() * 6), world: Math.min(10, 1 + Math.floor(v / 10000)) });
      }
      rows.push({ name: s.franchise.name, score: me, me: true, prestige: s.prestige.count, world: E.worldOf(s.best) + 1 });
      rows.sort((a, b) => b.score - a.score);
      rows.forEach((r, i) => { r.rank = i + 1; });
      return rows;
    },
    leagueTier(points) {
      const tiers = [['Bronze', 0], ['Silver', 300], ['Gold', 800], ['Platinum', 1600], ['Diamond', 3000], ['Legend', 5000]];
      let t = tiers[0];
      for (const x of tiers) if (points >= x[1]) t = x;
      const idx = tiers.indexOf(t);
      return { name: t[0], idx, next: tiers[idx + 1] ? tiers[idx + 1][1] : null, floor: t[1] };
    },
    allianceProgress(s) {
      if (!s.social.alliance) return null;
      const al = D.alliances.find((a) => a.k === s.social.alliance);
      const wk = U.weekKey();
      const rng = U.mulberry32(U.hashStr(al.k + wk));
      const elapsed = (Date.now() - weekStart()) / (7 * 86400000);
      const others = Math.floor(al.members * (40 + rng() * 40) * U.clamp(elapsed, 0, 1));
      const total = others + s.social.contributed;
      return { al, total, mine: s.social.contributed, tiers: [500, 1200, 2200, 3500] };
    },
  };
  function weekStart() { return Date.now() - (7 * 86400000 - U.msUntilNextWeek()); }

  // ---------- Weekly tournament (simulated bracket vs AI franchises) ----------
  function runTournament(s) {
    if (s.tourney.entries >= 3) return { ok: false, reason: 'No entries left this week' };
    s.tourney.entries++;
    const g = Math.max(0, s.run.cleared - 1);
    const fmt = E.formatOf(Math.min(g, 99));
    const size = D.formats[fmt].size;
    const home = playerTeam(s, size);
    const m = E.mods(s);
    const bonus = Object.assign({}, m.sim, { staminaDrain: m.staminaDrain });
    const rounds = ['Round of 16', 'Quarterfinal', 'Semifinal', 'Final'];
    const rng = Math.random;
    const results = [];
    let alive = true;
    const names = D.aiFranchiseNames.slice().sort(() => rng() - 0.5);
    for (let i = 0; i < 4 && alive; i++) {
      const away = oppTeam(s, g, undefined);
      away.name = names[i];
      const scale = [0.8, 0.95, 1.08, 1.2][i];
      away.power *= scale;
      away.players.forEach((p) => { p.power *= scale; });
      const mt = S.createMatch(home, away, { format: fmt, rng, bonus });
      S.playAll(mt);
      const won = mt.winner === 0;
      results.push({ round: rounds[i], opp: away.name, score: mt.score.slice(), won });
      if (!won) alive = false;
    }
    const wins = results.filter((r) => r.won).length;
    const pts = [20, 60, 120, 220, 400][wins];
    const placement = wins === 4 ? 'Champion' : ['Round of 16', 'Quarterfinalist', 'Semifinalist', 'Runner-up'][wins];
    s.tourney.points += pts;
    s.tourney.best = Math.max(s.tourney.best, wins);
    if (wins === 4) s.stats.tourneyWins++;
    const reward = { cash: 3 + wins * 4, gems: [5, 10, 20, 35, 60][wins], eventTickets: wins >= 3 ? 1 : 0, passXp: 60 };
    const granted = E.grant(s, reward);
    s.tourney.lastResult = { results, wins, placement, pts };
    return { ok: true, results, wins, placement, pts, granted, reward };
  }

  BE.game = {
    cosmetic, ensureLineup, autoLineup, autoPromote, giftWalkOns, target, playerTeam, oppTeam, newMatch, onMatchEnd, startChampionship, tick, offline,
    estimateWinProb, resets, missionProgress, loginStatus, claimLogin, passReward, passTier, PASS_TIERS, PASS_XP, achievementState,
    claimAchievement, social, runTournament, gearVis, questProgress, questState, claimQuest,
    CAMPS, campsState, campScale, campReward, setCampTier, runCamp, activateBuff, spinState, spin, claimGift,
  };
})(typeof window !== 'undefined' ? window : globalThis);
