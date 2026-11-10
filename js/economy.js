/* Basketball Empire — economy, progression formulas, bonuses, and all state-mutating game actions */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, A = BE.athletes, B = D.balance;

  // ---------- Stage helpers ----------
  const worldOf = (g) => Math.min(9, Math.floor(g / 10));
  const stageOf = (g) => (g >= 100 ? 9 : g % 10);
  const isChamp = (g) => g < 100 && g % 10 === 9;
  function formatOf(g) { return g >= 100 ? '5v5' : D.worlds[worldOf(g)].formats[g % 10]; }
  function sizeOf(g) { return D.formats[formatOf(g)].size; }
  function stageLabel(g) {
    if (g >= 100) return 'Rift ' + (g - 99);
    return isChamp(g) ? D.worlds[worldOf(g)].champ : 'Game ' + (stageOf(g) + 1);
  }
  // log-space cumulative opponent growth so each world gets steeper
  const oppLog = [0];
  for (let g = 1; g <= 400; g++) {
    const w = Math.floor((g - 1) / 10);
    oppLog[g] = oppLog[g - 1] + Math.log(w < 10 ? B.oppGrowth[w] : B.oppGrowthRift);
  }
  function oppPerPlayer(g, round) {
    g = Math.max(0, g);
    const lg = g <= 400 ? oppLog[g] : oppLog[400] + (g - 400) * Math.log(B.oppGrowthRift);
    return B.oppBase * Math.exp(lg) * (round !== undefined ? B.champMult[round] : 1);
  }
  function oppPower(g, round) { return oppPerPlayer(g, round) * sizeOf(g); }

  // ---------- Feature gating ----------
  function unlocked(s, key) {
    const f = D.features[key];
    if (!f) return true;
    if (key === 'autocoach' && (s.purchases.autocoach || (s.coaches.analytics || 0) > 0)) return true;
    return s.best >= f.g || (key === 'prestige' && s.prestige.count > 0);
  }

  // ---------- Modifiers (cached) ----------
  let modsCache = null, modsKey = '';
  function modsSignature(s) {
    return JSON.stringify([s.facilities, s.coaches, s.prestige.upgrades, s.prestige.earned, s.stats.unique, Object.keys(s.gearSeen).length, s.purchases.vip, s.fans > 0 ? Math.floor(Math.log10(1 + s.fans) * 10) : 0]);
  }
  function mods(s) {
    const sig = modsSignature(s);
    if (modsCache && sig === modsKey) return modsCache;
    const f = (k) => s.facilities[k] || 0;
    const c = (k) => s.coaches[k] || 0;
    const p = (k) => s.prestige.upgrades[k] || 0;
    const aura = 1 + 0.02 * s.prestige.earned;
    const coll = collectionBonus(s);
    const gearColl = 1 + 0.01 * Object.keys(s.gearSeen).length;
    const fansMult = 1 + Math.log10(1 + s.fans) * 0.06;
    const m = {
      aura,
      powerMult: aura * (1 + 0.2 * p('power')) * (1 + 0.07 * f('gym')) * (1 + 0.04 * f('training')) * (1 + 0.06 * f('hq')) *
        (1 + 0.08 * c('head')) * (1 + 0.03 * (c('shooting') + c('defense') + c('strength'))) * (1 + coll.power) * gearColl,
      cashMult: aura * (1 + 0.3 * p('income')) * (1 + 0.06 * f('hq')) * (1 + 0.1 * c('business')) * (1 + coll.cash),
      winCashMult: 1 + 0.15 * f('court'),
      passiveMult: (1 + 0.25 * f('merch')) * (1 + 0.1 * f('stadium')) * fansMult,
      fanMult: 1 + 0.12 * f('stadium'),
      offlineEff: Math.min(1, B.offlineBaseEff + 0.04 * f('medical') + 0.03 * c('business') + 0.08 * p('offline')) * (s.purchases.vip ? 1.25 : 1),
      offlineCapH: B.offlineBaseCapH + p('offline') + (s.best >= 40 ? 2 : 0) + (s.purchases.vip ? 2 : 0),
      tpMult: (1 + 0.2 * f('training')) * (1 + 0.12 * c('development')),
      costMult: Math.max(0.6, 1 - 0.02 * c('development')),
      shardMult: (1 + 0.1 * f('scouting')) * (1 + 0.1 * c('recruiting')) * (1 + 0.2 * p('scout')),
      staminaDrain: Math.max(0.3, 1 - 0.06 * f('medical') - 0.03 * c('strength')),
      sim: { shoot: 0.03 * c('shooting'), def: 0.03 * c('defense'), reb: 0.03 * c('strength'), tactic: 0.12 + 0.02 * c('analytics') },
      energyCost: Math.max(0.5, 1 - 0.1 * p('clutch')),
      gemDrop: 0.02 * p('goldrush'),
      divisionMult: (1 + p('secondunit')) * (1 + 0.25 * f('academy')),
      autoTrain: 0.1 * p('autotrain'),
      collection: coll,
    };
    modsCache = m; modsKey = sig;
    return m;
  }
  function invalidate() { modsKey = ''; }

  const collectionMilestones = [
    { n: 3, power: 0.05, cash: 0.05 }, { n: 10, power: 0.1, cash: 0.1 }, { n: 25, power: 0.2, cash: 0.15 }, { n: 50, power: 0.35, cash: 0.25 },
    { n: 100, power: 0.6, cash: 0.4 }, { n: 150, power: 0.9, cash: 0.6 }, { n: 200, power: 1.25, cash: 0.8 }, { n: 250, power: 1.6, cash: 1 }, { n: 300, power: 2.2, cash: 1.5 },
  ];
  function collectionBonus(s) {
    const n = s.stats.unique;
    let best = { power: 0, cash: 0, n: 0 };
    for (const m of collectionMilestones) if (n >= m.n) best = m;
    return best;
  }

  // ---------- Athletes ----------
  function athleteOvr(s, a) {
    const t = A.tpl(a.cid);
    return A.ovrFromAttrs(A.effAttrs(s, a), t.pos);
  }
  function gearPct(s, a) {
    let pct = 0;
    for (const slot in a.gear) {
      const it = s.gearById[a.gear[slot]];
      if (it) pct += gearMain(it);
    }
    return pct;
  }
  function teamGearPct(s) {
    let pct = 0;
    for (const slot of ['ball', 'trainer']) {
      const it = s.teamGear[slot] && s.gearById[s.teamGear[slot]];
      if (it) pct += gearMain(it) * 0.5;
    }
    return pct;
  }
  function levelMult(lvl) {
    return Math.pow(B.lvlPowerGrowth, lvl - 1) * Math.pow(B.milestoneMult, Math.floor(lvl / B.milestoneEvery));
  }
  function athleteBase(s, a) {
    const t = A.tpl(a.cid);
    const ovr = athleteOvr(s, a);
    return 10 * D.rarities[t.rarity].mult * Math.pow(ovr / 50, 2.2);
  }
  function athletePower(s, a, m) {
    m = m || mods(s);
    return athleteBase(s, a) * levelMult(a.lvl) * (1 + B.starPower * (a.stars - 1)) * (1 + gearPct(s, a) + teamGearPct(s)) * m.powerMult;
  }
  function lineupAthletes(s) { return s.lineup.map((u) => s.rosterByUid[u]).filter(Boolean); }
  function teamPower(s, size) {
    const m = mods(s);
    const ls = lineupAthletes(s).slice(0, size || 5);
    let sum = 0, leader = false;
    for (const a of ls) {
      sum += athletePower(s, a, m);
      if (A.tpl(a.cid).personality === 'leader') leader = true;
    }
    return sum * (leader ? 1.03 : 1);
  }
  function maxLevel(s) { return B.maxLevelBase + 50 * s.prestige.count; }
  function levelCost(s, a, n) {
    const t = A.tpl(a.cid);
    const m = mods(s);
    const base = B.lvlCostBase * D.rarities[t.rarity].costMult * m.costMult;
    let total = 0;
    for (let i = 0; i < n; i++) total += base * Math.pow(B.lvlCostGrowth, a.lvl - 1 + i);
    return total;
  }
  function maxAffordable(s, a, budget) {
    let n = 0, total = 0;
    const t = A.tpl(a.cid);
    const base = B.lvlCostBase * D.rarities[t.rarity].costMult * mods(s).costMult;
    const cap = maxLevel(s) - a.lvl;
    while (n < cap && n < 1000) {
      const c = base * Math.pow(B.lvlCostGrowth, a.lvl - 1 + n);
      if (total + c > budget) break;
      total += c; n++;
    }
    return { n, cost: total };
  }
  function levelUp(s, a, n) {
    n = Math.min(n, maxLevel(s) - a.lvl);
    if (n <= 0) return { ok: false, reason: 'Max level reached' };
    const cost = levelCost(s, a, n);
    if (s.cash < cost) return { ok: false, reason: 'Not enough cash' };
    const before = athletePower(s, a);
    s.cash -= cost;
    const crossed = Math.floor((a.lvl + n) / B.milestoneEvery) > Math.floor(a.lvl / B.milestoneEvery);
    a.lvl += n;
    s.stats.levelups += n;
    return { ok: true, n, before, after: athletePower(s, a), milestone: crossed };
  }

  function trainCost(s, a, k) {
    const t = A.tpl(a.cid);
    const n = (a.train && a.train[k]) || 0;
    return Math.round(10 * (n + 1) * (1 + 0.2 * t.rarity));
  }
  function train(s, a, k) {
    const cap = A.trainCap(a);
    const cur = a.train[k] || 0;
    if (cur >= cap) return { ok: false, reason: 'Potential maxed for this attribute' };
    const cost = trainCost(s, a, k);
    if (s.tp < cost) return { ok: false, reason: 'Not enough training points' };
    s.tp -= cost;
    a.train[k] = cur + 1;
    s.stats.trains++;
    return { ok: true };
  }

  // ---------- Rewards ----------
  function stageReward(s, g) {
    const m = mods(s);
    return B.rewardBase * Math.pow(B.rewardGrowth, g) * m.cashMult * m.winCashMult;
  }
  function fansPerWin(s, g) {
    return B.fansPerWinBase * Math.pow(B.fansGrowth, g) * mods(s).fanMult;
  }
  function farmG(s) { return Math.max(0, s.run.cleared - 1); }
  function passivePerSec(s) {
    const m = mods(s);
    const g = Math.max(0, s.run.cleared - 1);
    return B.rewardBase * Math.pow(B.rewardGrowth, g) * B.passiveBase * m.passiveMult * m.cashMult;
  }
  function divisionPerSec(s) {
    if (!unlocked(s, 'division')) return 0;
    const m = mods(s);
    const lineup = new Set(s.lineup);
    const g = Math.max(0, s.run.cleared - 1);
    let bench = 0;
    for (const a of s.roster) if (!lineup.has(a.uid)) bench += athletePower(s, a, m);
    const ratio = Math.min(3, bench / Math.max(1, oppPerPlayer(g) * 5));
    return B.rewardBase * Math.pow(B.rewardGrowth, g) * 0.012 * ratio * m.divisionMult * m.cashMult;
  }
  function tpPerSec(s) {
    let mentor = 1;
    for (const a of lineupAthletes(s)) if (A.tpl(a.cid).personality === 'mentor') mentor = 1.05;
    return unlocked(s, 'training') ? B.tpPerSecBase * mods(s).tpMult * mentor * (1 + 0.15 * worldOf(s.best)) : 0;
  }
  function addCash(s, amt) {
    if (!isFinite(amt) || amt <= 0) return 0;
    s.cash += amt;
    s.run.cashEarned += amt;
    s.stats.cashEarned += amt;
    return amt;
  }

  // ---------- Facilities & coaches ----------
  function facilityCost(f, lvl) { return f.base * Math.pow(f.growth, lvl); }
  function upgradeFacility(s, k) {
    const f = D.facilities.find((x) => x.k === k);
    const lvl = s.facilities[k] || 0;
    if (!f || lvl >= f.max) return { ok: false, reason: 'Max level' };
    if (s.best < f.unlock) return { ok: false, reason: 'Locked' };
    const cost = facilityCost(f, lvl);
    if (s.cash < cost) return { ok: false, reason: 'Not enough cash' };
    s.cash -= cost;
    s.facilities[k] = lvl + 1;
    s.stats.facilityUps++;
    invalidate();
    return { ok: true, lvl: lvl + 1 };
  }
  function upgradeCoach(s, k) {
    const c = D.coaches.find((x) => x.k === k);
    const lvl = s.coaches[k] || 0;
    if (!c || lvl >= c.max) return { ok: false, reason: 'Max level' };
    if (s.best < c.unlock) return { ok: false, reason: 'Locked' };
    const cost = facilityCost(c, lvl);
    if (s.cash < cost) return { ok: false, reason: 'Not enough cash' };
    s.cash -= cost;
    s.coaches[k] = lvl + 1;
    s.stats.facilityUps++;
    invalidate();
    return { ok: true, lvl: lvl + 1, hired: lvl === 0 };
  }

  // ---------- Gear ----------
  function gearMain(it) {
    return D.gearRarityPct[it.rarity] * (1 + 0.15 * it.set) * (1 + 0.12 * (it.lvl - 1));
  }
  function gearMaxLevel(it) { return 10 + it.rarity * 5; }
  function gearUpgradeCost(s, it) {
    return {
      scrap: Math.round(4 * it.lvl * (it.rarity + 1) * (1 + it.set * 0.3)),
      cash: B.rewardBase * Math.pow(B.rewardGrowth, Math.max(0, it.set * 10 + 2)) * 0.6 * Math.pow(1.18, it.lvl),
    };
  }
  function makeGear(s, type, rarity, set, rng) {
    rng = rng || Math.random;
    const t = D.gearTypes.find((x) => x.k === type);
    const subs = [{ k: t.attr, v: D.gearRarityAttr[rarity] + Math.floor(set / 2) }];
    const extra = Math.floor(rarity / 2);
    for (let i = 0; i < extra; i++) subs.push({ k: U.pick(A.ATTR_KEYS, rng), v: Math.max(1, Math.round(D.gearRarityAttr[rarity] * 0.6)) });
    const it = { id: 'g' + s.nextGearId++, type, rarity, set: U.clamp(set, 0, 9), lvl: 1, subs, isNew: true };
    s.gear.push(it);
    s.gearById[it.id] = it;
    const key = it.set + ':' + type;
    if (!s.gearSeen[key]) { s.gearSeen[key] = true; invalidate(); }
    return it;
  }
  function rollGearRarity(rng, luck) {
    const w = [55, 28, 12, 4, 0.9 * (luck || 1), 0.1 * (luck || 1)];
    return U.weightedIndex(w, rng());
  }
  function randomGear(s, minRarity, rng) {
    rng = rng || Math.random;
    const type = U.pick(D.gearTypes, rng).k;
    let r = rollGearRarity(rng, 1);
    r = Math.max(r, minRarity || 0);
    return makeGear(s, type, r, worldOf(s.best), rng);
  }
  function gearOwner(s, id) {
    for (const a of s.roster) for (const slot in a.gear) if (a.gear[slot] === id) return { a, slot };
    for (const slot of ['ball', 'trainer']) if (s.teamGear[slot] === id) return { team: true, slot };
    return null;
  }
  function equipGear(s, id, a) {
    const it = s.gearById[id];
    if (!it) return { ok: false };
    const type = D.gearTypes.find((x) => x.k === it.type);
    const own = gearOwner(s, id);
    if (own) { if (own.team) s.teamGear[own.slot] = null; else delete own.a.gear[own.slot]; }
    if (type.slot === 'team') s.teamGear[type.k] = id;
    else a.gear[type.k] = id;
    it.isNew = false;
    return { ok: true };
  }
  function unequipGear(s, id) {
    const own = gearOwner(s, id);
    if (!own) return;
    if (own.team) s.teamGear[own.slot] = null; else delete own.a.gear[own.slot];
  }
  function upgradeGear(s, id) {
    const it = s.gearById[id];
    if (!it) return { ok: false, reason: 'Missing item' };
    if (it.lvl >= gearMaxLevel(it)) return { ok: false, reason: 'Max level' };
    const c = gearUpgradeCost(s, it);
    if (s.scrap < c.scrap) return { ok: false, reason: 'Not enough scrap' };
    if (s.cash < c.cash) return { ok: false, reason: 'Not enough cash' };
    s.scrap -= c.scrap; s.cash -= c.cash;
    it.lvl++;
    if (it.lvl % 5 === 0) for (const sub of it.subs) sub.v += 1;
    s.stats.gearUps++;
    return { ok: true };
  }
  function salvageValue(it) { return Math.round(5 * Math.pow(2.2, it.rarity) * (1 + it.set * 0.25) + (it.lvl - 1) * 3 * (it.rarity + 1)); }
  function salvageGear(s, id) {
    const it = s.gearById[id];
    if (!it) return { ok: false };
    unequipGear(s, id);
    const v = salvageValue(it);
    s.scrap += v;
    s.gear = s.gear.filter((g) => g.id !== id);
    delete s.gearById[id];
    return { ok: true, scrap: v };
  }
  function mergeCandidates(s, it) {
    return s.gear.filter((g) => g.id !== it.id && g.type === it.type && g.rarity === it.rarity);
  }
  function mergeGear(s, id) {
    const it = s.gearById[id];
    if (!it || it.rarity >= 5) return { ok: false, reason: 'Cannot merge further' };
    const others = mergeCandidates(s, it).sort((a, b) => (gearOwner(s, a.id) ? 1 : 0) - (gearOwner(s, b.id) ? 1 : 0) || a.lvl - b.lvl).slice(0, 2);
    if (others.length < 2) return { ok: false, reason: 'Need 3 of the same type & rarity' };
    const set = Math.max(it.set, others[0].set, others[1].set);
    const refund = others.reduce((t, g) => t + (g.lvl - 1) * 2 * (g.rarity + 1), 0);
    const owner = gearOwner(s, id);
    for (const g of others) { unequipGear(s, g.id); s.gear = s.gear.filter((x) => x.id !== g.id); delete s.gearById[g.id]; }
    unequipGear(s, id);
    s.gear = s.gear.filter((x) => x.id !== id); delete s.gearById[id];
    const nu = makeGear(s, it.type, it.rarity + 1, set);
    nu.lvl = Math.min(gearMaxLevel(nu), Math.max(1, it.lvl));
    if (owner) { if (owner.team) s.teamGear[owner.slot] = nu.id; else owner.a.gear[owner.slot] = nu.id; nu.isNew = false; }
    s.scrap += refund;
    s.stats.gearUps++;
    return { ok: true, item: nu };
  }
  function craftCost(s) { return Math.round(60 * (1 + worldOf(s.best) * 0.6)); }
  function craftGear(s, type) {
    const cost = craftCost(s);
    if (s.scrap < cost) return { ok: false, reason: 'Not enough scrap' };
    s.scrap -= cost;
    const rng = Math.random;
    const r = Math.max(1, rollGearRarity(rng, 1.5));
    return { ok: true, item: makeGear(s, type || U.pick(D.gearTypes, rng).k, Math.min(5, r), worldOf(s.best), rng) };
  }

  // ---------- Recruitment ----------
  const banners = {
    street: { name: 'Street Scout', odds: [70, 25, 5, 0, 0, 0], currency: 'cash' },
    pro: { name: 'Pro Scout', odds: [50, 28.5, 15, 5, 1.3, 0.2], currency: 'tickets', gemCost: 100, pity: { e: 30, l: 80, m: 200 }, tenGuarantee: 2 },
    event: { name: 'Event Scout', odds: [40, 30, 20, 7, 2.5, 0.5], currency: 'eventTickets', gemCost: 150, pity: { e: 25, l: 60, m: 150 }, tenGuarantee: 2 },
  };
  function streetCost(s) {
    const f = s.facilities.scouting || 0;
    return Math.max(25, B.rewardBase * Math.pow(B.rewardGrowth, Math.max(0, s.run.cleared)) * 4 * Math.max(0.5, 1 - 0.03 * f));
  }
  function eventFeatured(t) {
    // Weekly rotating featured legendary from unlocked worlds — deterministic by ISO week
    const wk = U.weekKey(t);
    const pool = A.catalog.filter((x) => x.rarity === 4);
    const theme = ['Sky Kings', 'Splash Zone', 'Lockdown Legion', 'Paint Beasts', 'Showtime Week', 'Floor Generals'];
    const h = U.hashStr(wk);
    return { featured: pool[h % pool.length], theme: theme[h % theme.length], week: wk };
  }
  function rollRarity(odds, rng) { return U.weightedIndex(odds, rng()); }
  function pullOne(s, bannerKey, rng, forceMin) {
    const b = banners[bannerKey];
    let r;
    if (b.pity) {
      const p = s.recruit[bannerKey];
      if (p.m + 1 >= b.pity.m) r = 5;
      else if (p.l + 1 >= b.pity.l) r = rng() < b.odds[5] / (b.odds[4] + b.odds[5]) ? 5 : 4;
      else if (p.e + 1 >= b.pity.e) { const w = b.odds.slice(3); r = 3 + U.weightedIndex(w, rng()); }
      else r = rollRarity(b.odds, rng);
      if (forceMin !== undefined && r < forceMin) {
        const w = b.odds.slice(forceMin);
        r = forceMin + U.weightedIndex(w, rng());
      }
      p.e = r >= 3 ? 0 : p.e + 1;
      p.l = r >= 4 ? 0 : p.l + 1;
      p.m = r >= 5 ? 0 : p.m + 1;
    } else {
      r = rollRarity(b.odds, rng);
      if (forceMin !== undefined && r < forceMin) r = forceMin;
    }
    return r;
  }
  function pickAthlete(s, rarity, bannerKey, rng) {
    const maxW = worldOf(s.best);
    if (bannerKey === 'event' && rarity === 4) {
      const ev = eventFeatured();
      if (rng() < 0.5) return ev.featured;
    }
    const pool = A.catalog.filter((t) => t.rarity === rarity && t.world <= maxW);
    return pool.length ? U.pick(pool, rng()) : U.pick(A.catalog.filter((t) => t.rarity === rarity), rng());
  }
  function addAthlete(s, t) {
    const existing = s.roster.find((a) => a.cid === t.id);
    if (existing) {
      if (existing.stars < 5) { existing.stars++; invalidate(); return { dupe: true, starUp: true, a: existing }; }
      const sh = Math.round(D.rarities[t.rarity].shards * mods(s).shardMult);
      s.shards += sh;
      return { dupe: true, shards: sh, a: existing };
    }
    const a = { uid: 'u' + s.nextUid++, cid: t.id, lvl: 1, stars: 1, train: {}, gear: {}, isNew: true };
    s.roster.push(a);
    s.rosterByUid[a.uid] = a;
    if (!s.collection[t.id]) { s.collection[t.id] = true; }
    s.stats.unique = Object.keys(s.collection).length;
    if (t.rarity === 4) s.stats.legendaries++;
    if (t.rarity === 5) s.stats.mythics++;
    invalidate();
    // auto-fill empty lineup slots
    const size = sizeOf(s.run.cleared);
    if (s.lineup.length < Math.max(size, 1) && s.lineup.length < 5) s.lineup.push(a.uid);
    return { dupe: false, a };
  }
  // Performs recruitment, charging the right currency. Returns list of results.
  function recruit(s, bannerKey, count, payWith, rng) {
    rng = rng || Math.random;
    const b = banners[bannerKey];
    if (!b) return { ok: false, reason: 'Unknown banner' };
    if (bannerKey === 'street') {
      const cost = streetCost(s) * count;
      if (s.cash < cost) return { ok: false, reason: 'Not enough cash' };
      s.cash -= cost;
    } else if (payWith === 'gems') {
      const cost = b.gemCost * (count === 10 ? 9 : count);
      if (s.gems < cost) return { ok: false, reason: 'Not enough gems' };
      s.gems -= cost;
    } else {
      const cur = b.currency;
      if (s[cur] < count) return { ok: false, reason: 'Not enough tickets' };
      s[cur] -= count;
    }
    const results = [];
    let hasRarePlus = false;
    for (let i = 0; i < count; i++) {
      const force = count === 10 && i === 9 && !hasRarePlus && b.tenGuarantee !== undefined ? b.tenGuarantee : undefined;
      const r = pullOne(s, bannerKey, rng, force);
      if (r >= 2) hasRarePlus = true;
      const t = pickAthlete(s, r, bannerKey, rng);
      const res = addAthlete(s, t);
      results.push(Object.assign({ t, rarity: r }, res));
    }
    s.recruit.total += count;
    s.stats.pulls += count;
    return { ok: true, results };
  }
  function shardExchange(s, what) {
    const table = { ticket: 120, tp: 40, scrap: 30 };
    const cost = table[what];
    if (!cost || s.shards < cost) return { ok: false, reason: 'Not enough shards' };
    s.shards -= cost;
    if (what === 'ticket') s.tickets += 1;
    if (what === 'tp') s.tp += Math.round(Math.max(60, tpPerSec(s) * 3600));
    if (what === 'scrap') s.scrap += 60;
    return { ok: true };
  }

  // ---------- Generic grants ----------
  // Rewards object: {cash, cashMinutes, gems, tickets, eventTickets, tp, tpHours, scrap, shards, gearChest, cosmetic, passXp}
  function grant(s, r) {
    const out = [];
    if (!r) return out;
    const unit = stageReward(s, farmG(s));
    if (r.cash) { const v = addCash(s, r.cash * unit); out.push({ k: 'cash', v }); }
    if (r.cashMinutes) {
      const perMin = (unit * 2 + passivePerSec(s) * 60);
      const v = addCash(s, perMin * r.cashMinutes); out.push({ k: 'cash', v });
    }
    if (r.gems) { s.gems += r.gems; out.push({ k: 'gems', v: r.gems }); }
    if (r.tickets) { s.tickets += r.tickets; out.push({ k: 'tickets', v: r.tickets }); }
    if (r.eventTickets) { s.eventTickets += r.eventTickets; out.push({ k: 'eventTickets', v: r.eventTickets }); }
    if (r.tp) { const v = Math.round(r.tp * Math.max(1, tpPerSec(s) * 60)); s.tp += v; out.push({ k: 'tp', v }); }
    if (r.tpHours) { const v = Math.round(Math.max(50, tpPerSec(s) * 3600 * r.tpHours)); s.tp += v; out.push({ k: 'tp', v }); }
    if (r.scrap) { s.scrap += r.scrap; out.push({ k: 'scrap', v: r.scrap }); }
    if (r.shards) { s.shards += r.shards; out.push({ k: 'shards', v: r.shards }); }
    if (r.gearChest) {
      for (let i = 0; i < r.gearChest; i++) { const it = randomGear(s, r.gearMin || 1); out.push({ k: 'gear', item: it }); }
    }
    if (r.cosmetic) {
      const list = Array.isArray(r.cosmetic) ? r.cosmetic : [r.cosmetic];
      for (const c of list) if (!s.franchise.owned.includes(c)) { s.franchise.owned.push(c); out.push({ k: 'cosmetic', v: c }); }
    }
    if (r.passXp) { s.pass.xp += r.passXp; out.push({ k: 'passXp', v: r.passXp }); }
    return out;
  }

  // ---------- Prestige ----------
  function legacyGain(s) {
    const c = s.run.cleared;
    if (c < 30) return 0;
    return Math.floor(Math.pow((c - 20) / 2.5, 1.5)) + Math.floor(s.run.cashEarned > 0 ? Math.log10(s.run.cashEarned) / 3 : 0);
  }
  function canPrestige(s) { return s.run.cleared >= 30; }
  function prestigeCost(u, lvl) { return Math.ceil(u.cost * Math.pow(u.growth, lvl)); }
  function buyPrestige(s, k) {
    const u = D.prestigeUpgrades.find((x) => x.k === k);
    const lvl = s.prestige.upgrades[k] || 0;
    if (!u || lvl >= u.max) return { ok: false, reason: 'Maxed' };
    const cost = prestigeCost(u, lvl);
    if (s.prestige.points < cost) return { ok: false, reason: 'Not enough Legacy Stars' };
    s.prestige.points -= cost;
    s.prestige.upgrades[k] = lvl + 1;
    if (u.cosmetic && !s.franchise.owned.includes(u.cosmetic)) s.franchise.owned.push(u.cosmetic);
    invalidate();
    return { ok: true };
  }
  function doPrestige(s) {
    if (!canPrestige(s)) return { ok: false, reason: 'Clear the World 3 championship first' };
    const gain = legacyGain(s);
    s.prestige.points += gain;
    s.prestige.earned += gain;
    s.prestige.count++;
    s.stats.prestiges++;
    // Reset run progress
    s.cash = 0;
    s.facilities = {};
    s.coaches = {};
    s.fans = Math.floor(s.fans * 0.1);
    const keepLvl = (s.prestige.upgrades.headstart || 0) > 0 ? 10 : 1;
    for (const a of s.roster) a.lvl = keepLvl;
    s.run = { cleared: 0, farming: false, champ: null, cashEarned: 0, startedAt: Date.now(), number: (s.run.number || 1) + 1 };
    invalidate();
    const hs = s.prestige.upgrades.headstart || 0;
    if (hs > 0) addCash(s, stageReward(s, 8) * 10 * hs);
    return { ok: true, gain };
  }

  BE.econ = {
    worldOf, stageOf, isChamp, formatOf, sizeOf, stageLabel, oppPerPlayer, oppPower, unlocked, mods, invalidate, collectionMilestones,
    collectionBonus, athleteOvr, athletePower, athleteBase, levelMult, lineupAthletes, teamPower, maxLevel, levelCost, maxAffordable,
    levelUp, trainCost, train, stageReward, fansPerWin, farmG, passivePerSec, divisionPerSec, tpPerSec, addCash, facilityCost,
    upgradeFacility, upgradeCoach, gearMain, gearMaxLevel, gearUpgradeCost, makeGear, randomGear, gearOwner, equipGear,
    unequipGear, upgradeGear, salvageValue, salvageGear, mergeCandidates, mergeGear, craftCost, craftGear, banners, streetCost,
    eventFeatured, pullOne, recruit, addAthlete, shardExchange, grant, legacyGain, canPrestige, prestigeCost, buyPrestige,
    doPrestige, gearPct, teamGearPct,
  };
})(typeof window !== 'undefined' ? window : globalThis);
