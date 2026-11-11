// End-to-end playthrough on a phone viewport. Usage: node tests/e2e.js
const { chromium } = require('playwright');
const path = require('path');
const shot = (p, n) => p.screenshot({ path: 'tests/shots/' + n + '.png' });
(async () => {
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, hasTouch: false });
  const page = await ctx.newPage();
  const errors = [];
  page.on('pageerror', (e) => errors.push('pageerror: ' + e.message + ' @ ' + (e.stack || '').split('\n')[1]));
  page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
  const url = 'file://' + path.join(__dirname, '../dist/basketball-empire.html');
  await page.goto(url);
  await page.waitForSelector('[data-go]');
  await page.click('[data-go]');
  await page.click('[data-start]');
  const ev = (f, a) => page.evaluate(f, a);
  await ev(() => { BE.game_state.settings.speed = 4; BE.game_state.purchases.vip = true; });
  // ---- Tutorial ----
  let t0 = Date.now();
  while (Date.now() - t0 < 90000) {
    const st = await ev(() => ({ step: BE.game_state.tutorial.step, cleared: BE.game_state.run.cleared, e: BE.play.R.match && BE.play.R.match.energy }));
    if (st.e >= 40 && st.step === 1) { await page.click('[data-ab="hype"]').catch(() => {}); }
    if (st.step >= 2) break;
    await page.waitForTimeout(500);
  }
  console.log('first win in', ((Date.now() - t0) / 1000).toFixed(1) + 's');
  await page.waitForTimeout(800); await shot(page, 't1-firstwin');
  await page.click('[data-nav="team"]'); await page.waitForTimeout(500); await shot(page, 't2-team');
  await page.click('[data-tut="lvl0"]'); await page.waitForTimeout(500); await shot(page, 't3-leveled');
  await page.click('[data-nav="recruit"]'); await page.waitForTimeout(500); await shot(page, 't4-recruit');
  await page.click('[data-tut="pull1"]'); await page.waitForTimeout(1500); await shot(page, 't5-reveal-pre');
  await page.click('[data-card]'); await page.waitForTimeout(1200); await shot(page, 't6-reveal');
  await page.click('[data-done]'); await page.waitForTimeout(400);
  await page.click('[data-nav="play"]'); await page.waitForTimeout(800); await shot(page, 't7-map');
  await page.click('.modal [data-close]'); await page.waitForTimeout(500);
  await page.click('[data-coach="ok"]'); await page.waitForTimeout(400); await shot(page, 't8-coach');
  await page.click('[data-coach="ok"]'); await page.waitForTimeout(600);
  console.log('tutorial', await ev(() => JSON.stringify(BE.game_state.tutorial)), 'roster', await ev(() => BE.game_state.roster.length));
  // ---- Let it play a while at 4x ----
  await page.waitForTimeout(20000);
  await shot(page, 'p1-play');
  // feature intro modals may appear; close all
  const closeAll = () => ev(() => BE.ui.closeAll());
  await closeAll();
  // Team Growth panel on the Home tab
  await page.click('[data-act="buymult"][data-n="10"]'); await page.click('[data-act="grow"][data-k="offense"]').catch(() => {});
  await page.click('[data-act="buymult"][data-n="max"]'); await page.click('[data-act="grow"][data-k="revenue"]').catch(() => {});
  await page.click('[data-act="buymult"][data-n="1"]'); await page.click('[data-act="homelvl"]').catch(() => {});
  await page.waitForTimeout(300); await shot(page, 'g1-growth');
  for (let i = 0; i < 6; i++) { const c = await page.$('[data-act="questclaim"]'); if (!c) break; await c.click(); await page.waitForTimeout(250); }
  await page.click('[data-act="questgo"]').catch(() => {}); await page.waitForTimeout(300); await closeAll();
  console.log('quest', await ev(() => JSON.stringify({ i: BE.game_state.quest.i, next: BE.game.questState(BE.game_state).q && BE.game.questState(BE.game_state).q.text })));
  console.log('after 20s cleared', await ev(() => BE.game_state.run.cleared), 'cash', await ev(() => BE.util.fmt(BE.game_state.cash)));
  // ---- Unlock everything mid-game ----
  await ev(() => { const s = BE.game_state; s.cash = 1e9; s.gems = 5000; s.tickets = 30; s.eventTickets = 12; s.tp = 5000; s.scrap = 3000; s.shards = 500; s.best = 29; s.run.cleared = 29; s.run.farming = false; for (const k in BE.data.features) s.seenFeatures[k] = true; BE.econ.invalidate(); BE.ui.renderNav(s); BE.ui.renderHUD(s); BE.play.restartMatch(); });
  await page.waitForTimeout(1500);
  await shot(page, 'p2-champready');
  // recruit 10x (gems & tickets), event banner
  await page.click('[data-nav="recruit"]'); await page.waitForTimeout(400); await shot(page, 'r1-recruit');
  await page.click('[data-act="pull"][data-b="pro"][data-n="10"]'); await page.waitForTimeout(600); await shot(page, 'r2-10x');
  await page.click('[data-all]'); await page.waitForTimeout(2200); await shot(page, 'r3-10x-open');
  await page.click('[data-done]'); await page.waitForTimeout(300);
  await page.click('[data-act="pull"][data-b="street"][data-n="10"]'); await page.waitForTimeout(500); await page.click('[data-all]'); await page.waitForTimeout(1800); await page.click('[data-done]');
  await page.click('[data-act="pull"][data-b="event"][data-n="1"]'); await page.waitForTimeout(500); await page.click('[data-card]'); await page.waitForTimeout(900); await page.click('[data-done]');
  await page.click('[data-act="odds"]'); await page.waitForTimeout(300); await shot(page, 'r4-odds'); await closeAll();
  await page.click('[data-act="exchange"][data-k="ticket"]');
  await page.click('[data-act="adticket"]'); await page.waitForTimeout(5600); await page.click('[data-ad="done"]'); await page.waitForTimeout(300);
  // Team
  await page.click('[data-nav="team"]'); await page.waitForTimeout(300);
  await page.click('[data-act="autolineup"]'); await page.click('[data-act="levelall"]'); await page.click('[data-act="autoequip"]').catch(() => {}); await page.waitForTimeout(300); await shot(page, 'm1-lineup');
  await page.click('#scr-team [data-act="athlete"]'); await page.waitForTimeout(300);
  await page.click('.modal [data-act="lvl"][data-n="10"]'); await page.click('.modal [data-act="lvl"][data-n="max"]');
  await page.click('.modal [data-act="train"]'); await page.waitForTimeout(300); await shot(page, 'm2-athlete');
  await page.click('.modal [data-act="togglelineup"]'); await page.click('.modal [data-act="togglelineup"]');
  await page.click('.modal [data-act="slot"]'); await page.waitForTimeout(300); await shot(page, 'm3-gearpick'); await closeAll();
  for (const tab of ['roster', 'gear', 'collection']) { await page.click('[data-act="teamtab"][data-k="' + tab + '"]'); await page.waitForTimeout(300); await shot(page, 'm4-' + tab); }
  await page.click('[data-act="teamtab"][data-k="gear"]');
  await page.click('[data-act="craft"]'); await page.click('[data-act="craft"]'); await page.click('[data-act="craft"]');
  await page.click('#scr-team [data-act="gear"]'); await page.waitForTimeout(300);
  await page.click('.modal [data-g="up"]'); await page.click('.modal [data-g="merge"]').catch(() => {}); await page.click('.modal [data-g="equip"]'); await page.waitForTimeout(300);
  await shot(page, 'm5-gearequip');
  if (await page.$('.modal [data-uid]')) await page.click('.modal [data-uid]');
  await closeAll();
  await page.click('[data-act="teamtab"][data-k="roster"]'); await page.click('[data-act="sort"][data-k="rarity"]');
  // Empire
  await page.click('[data-nav="empire"]'); await page.waitForTimeout(300);
  for (const k of ['court', 'gym', 'training', 'merch', 'hq', 'scouting', 'stadium', 'academy']) await page.click('[data-act="facility"][data-k="' + k + '"]').catch((e) => errors.push('facility ' + k + ' ' + e.message.split('\n')[0]));
  await shot(page, 'e1-facilities');
  for (const tab of ['coaches', 'division', 'legacy']) {
    await page.click('[data-act="emptab"][data-k="' + tab + '"]'); await page.waitForTimeout(300);
    if (tab === 'coaches') for (const k of ['head', 'shooting', 'defense', 'business', 'development', 'strength', 'analytics', 'recruiting']) await page.click('[data-act="coach"][data-k="' + k + '"]').catch((e) => errors.push('coach ' + k + ' ' + e.message.split('\n')[0]));
    await shot(page, 'e2-' + tab);
  }
  // Shop
  await page.click('[data-nav="shop"]'); await page.waitForTimeout(300); await shot(page, 's1-shop');
  await page.click('[data-act="freegift"]'); await page.waitForTimeout(300); await closeAll();
  await page.click('[data-act="buy"][data-sku="starter"]'); await page.waitForTimeout(300); await shot(page, 's2-confirm');
  await page.click('.modal [data-ok]'); await page.waitForTimeout(900); await shot(page, 's3-granted'); await closeAll();
  await page.click('[data-act="gembuy"][data-k="ticket1"]'); await page.click('.modal [data-ok]'); await page.waitForTimeout(300); await closeAll();
  await page.click('[data-act="cosmetic"][data-k="midnight"]'); await page.waitForTimeout(200);
  await page.click('[data-act="cosmetic"][data-k="neon"]'); await page.click('.modal [data-ok]'); await page.waitForTimeout(200);
  await page.click('[data-act="adreward"][data-k="tp"]'); await page.waitForTimeout(5600); await page.click('[data-ad="done"]'); await page.waitForTimeout(400); await closeAll();
  // Play hub modals
  await page.click('[data-nav="play"]'); await page.waitForTimeout(400);
  await shot(page, 'p3-playfull');
  for (const k of ['missions', 'daily', 'pass', 'events', 'social', 'trophies']) {
    await page.click('[data-act="hub"][data-k="' + k + '"]'); await page.waitForTimeout(400); await shot(page, 'h-' + k);
    if (k === 'daily') { await page.click('[data-dl="claim"]').catch(() => {}); await page.waitForTimeout(300); await closeAll(); continue; }
    if (k === 'pass') { const b = await page.$('[data-pc]'); if (b) await b.click(); }
    if (k === 'social') { for (const t of ['friends', 'alliance', 'showcase']) { await page.click('[data-st="' + t + '"]'); await page.waitForTimeout(200); if (t === 'alliance') await page.click('[data-join]'); } await shot(page, 'h-social-showcase'); }
    if (k === 'events') { await page.click('[data-et="tourney"]'); await page.waitForTimeout(200); await page.click('[data-tour]'); await page.waitForTimeout(4200); await shot(page, 'h-tourney'); await page.click('[data-tdone]'); await page.click('[data-et="limited"]'); await page.waitForTimeout(200); await shot(page, 'h-limited'); }
    await closeAll();
  }
  await page.click('[data-act="tactics"]'); await page.waitForTimeout(300); await page.click('[data-tac="off:outside"]'); await shot(page, 'p4-tactics'); await closeAll();
  await page.click('[data-act="speed"]'); await page.click('[data-act="autoabil"]'); await page.click('[data-act="autopush"]');
  await page.click('[data-act="settings"]'); await page.waitForTimeout(300); await shot(page, 'p5-settings');
  await page.click('[data-tog="reduceMotion"]'); await page.click('[data-tog="reduceMotion"]');
  await page.click('[data-set="export"]'); await page.waitForTimeout(300); await closeAll();
  await page.click('[data-act="franchise"]'); await page.waitForTimeout(200); await shot(page, 'p6-franchise'); await closeAll();
  // ---- Contest: free throws ----
  await page.click('[data-act="hub"][data-k="events"]'); await page.waitForTimeout(300);
  await page.click('[data-contest="ft"]'); await page.waitForTimeout(400); await shot(page, 'c1-ft');
  for (let i = 0; i < 40 && await page.$('[data-c="shoot"]'); i++) { await page.click('[data-c="shoot"]').catch(() => {}); await page.waitForTimeout(450); }
  await page.waitForTimeout(500); await shot(page, 'c2-ft-done'); await closeAll();
  await page.click('[data-act="hub"][data-k="events"]'); await page.waitForTimeout(300);
  await page.click('[data-contest="dunk"]'); await page.waitForTimeout(400);
  for (let r = 0; r < 3; r++) { await page.click('[data-dk="1"]').catch(() => {}); for (let k = 0; k < 3; k++) { await page.waitForTimeout(350); await page.click('[data-c="shoot"]').catch(() => {}); } await page.waitForTimeout(r === 0 ? 1200 : 2400); if (r === 0) await shot(page, 'c3-dunk'); }
  await page.waitForTimeout(800); await shot(page, 'c4-dunk-done'); await closeAll();
  // ---- Championship ----
  await page.click('[data-act="enterchamp"]').catch((e) => errors.push('enterchamp ' + e.message.split('\n')[0]));
  await page.waitForTimeout(1500); await shot(page, 'ch1-champ');
  for (let r = 0; r < 3; r++) {
    await ev(() => { const m = BE.play.R.match; m.score = [99, 10]; m.over = true; m.winner = 0; BE.court.clearTasks(); });
    await page.waitForTimeout(3500);
    if (r < 2) { await page.waitForTimeout(500); }
  }
  await page.waitForTimeout(1500); await shot(page, 'ch2-ceremony');
  await page.click('[data-cc]').catch((e) => errors.push('ceremony ' + e.message.split('\n')[0])); await page.waitForTimeout(500); await shot(page, 'ch3-worldintro');
  await page.click('[data-wi]').catch((e) => errors.push('worldintro ' + e.message.split('\n')[0])); await page.waitForTimeout(800);
  console.log('after champ cleared', await ev(() => BE.game_state.run.cleared), 'champs', await ev(() => BE.game_state.stats.championships));
  await closeAll();
  // ---- Offline ----
  await ev(() => BE.main.runOffline(3 * 3600)); await page.waitForTimeout(500); await shot(page, 'o1-offline');
  await page.click('[data-off="collect"]'); await closeAll();
  // ---- Prestige ----
  await page.click('[data-nav="empire"]'); await page.click('[data-act="emptab"][data-k="legacy"]'); await page.waitForTimeout(300);
  await page.click('[data-act="prestige"]'); await page.waitForTimeout(300); await page.click('.modal [data-ok]'); await page.waitForTimeout(800); await shot(page, 'x1-prestige'); await closeAll();
  await page.click('[data-act="legacybuy"][data-k="income"]').catch(() => {}); await page.click('[data-act="legacybuy"][data-k="power"]').catch(() => {});
  await page.waitForTimeout(300); await shot(page, 'x2-legacy');
  const pre = await ev(() => ({ c: BE.game_state.run.cleared, lp: BE.game_state.prestige.earned, n: BE.game_state.prestige.count, cash: BE.game_state.cash }));
  console.log('prestige state', JSON.stringify(pre));
  // ---- Save & reload ----
  const before = await ev(() => { BE.main.save(); return { gems: BE.game_state.gems, roster: BE.game_state.roster.length, name: BE.game_state.franchise.name }; });
  await page.reload(); await page.waitForSelector('[data-go]'); await page.click('[data-go]'); await page.waitForTimeout(1200);
  const after = await ev(() => ({ gems: BE.game_state.gems, roster: BE.game_state.roster.length, name: BE.game_state.franchise.name }));
  console.log('save/reload', JSON.stringify(before), '→', JSON.stringify(after));
  await closeAll(); await page.waitForTimeout(3000); await shot(page, 'z-final');
  console.log(errors.length ? 'ERRORS:\n' + errors.join('\n') : 'NO ERRORS');
  await browser.close();
})().catch((e) => { console.error('TEST CRASH', e.message); process.exit(1); });
