// Greedy bot plays the real game loop to measure pacing. Usage: node tests/progression.js [hours] [prestiges]
const BE = require('./load')();
const { econ: E, game: G, sim: S, state: ST, data: D, athletes: A } = BE;
const HOURS = +process.argv[2] || 12, RUNS = +process.argv[3] || 1;
let s = ST.load(null); s.tutorial.done = true; s.tutorial.step = 99;
let t = 0; const log = []; let lastW = -1;
function botLineup(){ const top=Math.max(...E.lineupAthletes(s).map(a=>a.lvl)); s.lineup = s.roster.slice().sort((a,b)=>E.athleteBase(s,b)*(1+0.3*(b.stars-1))-E.athleteBase(s,a)*(1+0.3*(a.stars-1))).slice(0,5).map(a=>a.uid); }
function spend() {
  for (let k = 0; k < 200; k++) {
    const opts = [];
    for (const a of E.lineupAthletes(s)) opts.push({ c: E.levelCost(s, a, 1), f: () => E.levelUp(s, a, 1), w: 1 });
    for (const f of D.facilities) if (s.best >= f.unlock && ['gym','court','hq','merch','training'].includes(f.k)) opts.push({ c: E.facilityCost(f, s.facilities[f.k]||0), f: () => E.upgradeFacility(s, f.k), w: f.k==='gym'||f.k==='hq'?0.5:1.5 });
    for (const c of D.coaches) if (s.best >= c.unlock && ['head','shooting','defense','business','strength'].includes(c.k)) opts.push({ c: E.facilityCost(c, s.coaches[c.k]||0), f: () => E.upgradeCoach(s, c.k), w: c.k==='head'?0.4:1.2 });
    opts.sort((a, b) => a.c * a.w - b.c * b.w);
    const o = opts[0]; if (!o || o.c > s.cash) break; o.f();
  }
  // training points
  for (const a of E.lineupAthletes(s)) for (const k of ['sht','thr','def','spd']) while (E.train(s, a, k).ok);
}
for (let run = 0; run < RUNS; run++) {
  const runStart = t;
  while (t - runStart < HOURS * 3600) {
    G.resets(s, Date.now());
    while (s.tickets > 0) { E.recruit(s, 'pro', 1, 'tickets'); botLineup(); }
    if (s.gems >= 900) { E.recruit(s, 'pro', 10, 'gems'); botLineup(); }
    const tg = G.target(s);
    if (tg.champReady && (s.run.farmWins||0) >= 2) { G.startChampionship(s); s.run.farmWins = 0; }
    const m = G.newMatch(s);
    S.playAll(m);
    G.onMatchEnd(s, m);
    const dur = m.format === '5v5' ? 30 : m.format === '3v3' ? 22 : 14;
    t += dur; G.tick(s, dur);
    // equip gear greedily
    for (const it of s.gear) if (!E.gearOwner(s, it.id)) { const ls = E.lineupAthletes(s); const a = ls.find(x => !x.gear[it.type]); if (a || ['ball','trainer'].includes(it.type)) E.equipGear(s, it.id, a || ls[0]); }
    spend();
    const w = E.worldOf(s.run.cleared);
    if (w !== lastW) { lastW = w; log.push(`run${run+1} ${(t/60).toFixed(1)}min → world ${w+1} (cleared ${s.run.cleared}) power ${BE.util.fmt(E.teamPower(s))} roster ${s.roster.length}`); }
    if (run < RUNS - 1 && s.run.cleared >= 30 && t - runStart > 3600 * 2 && (G.estimateWinProb(s, s.run.cleared) < 0.3)) break;
  }
  log.push(`run${run+1} END at ${(t/60).toFixed(0)}min cleared ${s.run.cleared} cash ${BE.util.fmt(s.cash)} LP gain ${E.legacyGain(s)} wins ${s.stats.wins} losses ${s.stats.losses}`);
  if (run < RUNS - 1) { const r = E.doPrestige(s); for (const u of ['power','income','power','income','offline','headstart']) E.buyPrestige(s, u); lastW = -1; log.push('PRESTIGE +' + r.gain); }
}
console.log(log.join("\n")); if (process.env.DBG) { const m=E.mods(s); console.log("powerMult",m.powerMult.toFixed(1),"cashMult",m.cashMult.toFixed(1), "fac",JSON.stringify(s.facilities),"coach",JSON.stringify(s.coaches)); for (const a of E.lineupAthletes(s)) { const t=A.tpl(a.cid); console.log(t.rarity, "lvl",a.lvl,"stars",a.stars,"ovr",E.athleteOvr(s,a),"base",E.athleteBase(s,a).toFixed(0),"lvlMult",E.levelMult(a.lvl).toExponential(2),"gear",E.gearPct(s,a).toFixed(2), "P", BE.util.fmt(E.athletePower(s,a))); } console.log("opp/player", BE.util.fmt(E.oppPerPlayer(s.run.cleared))); }
