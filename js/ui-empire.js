/* Basketball Empire — Empire screen (facilities, coaches, dev league, legacy) and Shop screen (monetization) */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, A = BE.athletes;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;
  let tab = 'facilities';

  // ---------- Empire ----------
  function renderEmpire() {
    const s = S();
    const el = $('#scr-empire');
    const tabs = [['facilities', 'Facilities']];
    if (E.unlocked(s, 'coaches')) tabs.push(['coaches', 'Coaches']);
    if (E.unlocked(s, 'division')) tabs.push(['division', 'Dev League']);
    if (E.unlocked(s, 'prestige')) tabs.push(['legacy', 'Legacy']);
    if (!tabs.some((t) => t[0] === tab)) tab = 'facilities';
    let html = '<div class="tabs">' + tabs.map((t) => '<button class="tab' + (t[0] === tab ? ' active' : '') + '" data-act="emptab" data-k="' + t[0] + '">' + t[1] + (t[0] === 'legacy' && E.canPrestige(s) ? ' <span style="color:var(--gold)">●</span>' : '') + '</button>').join('') + '</div>';
    const m = E.mods(s);
    html += '<div class="card flat" style="margin-bottom:10px"><div class="kv"><span>Team power multiplier</span><span style="color:var(--good)">×' + U.fmt(m.powerMult, 2) + '</span><span>Cash multiplier</span><span style="color:var(--good)">×' + U.fmt(m.cashMult * m.winCashMult, 2) + '</span><span>Idle income</span><span>$' + U.fmt(E.passivePerSec(s)) + '/s</span><span>Offline</span><span>' + Math.round(m.offlineEff * 100) + '% for up to ' + m.offlineCapH + 'h</span></div></div>';
    if (tab === 'facilities') html += upgradeList(s, D.facilities, s.facilities, 'facility');
    else if (tab === 'coaches') html += upgradeList(s, D.coaches, s.coaches, 'coach');
    else if (tab === 'division') html += divisionHTML(s);
    else html += legacyHTML(s);
    const sc = el.scrollTop;
    el.innerHTML = html;
    el.scrollTop = sc;
  }
  const facIcons = { court: 'court', gym: 'gym', training: 'train', merch: 'merch', hq: 'hq', scouting: 'scout', stadium: 'stadium', academy: 'academy', medical: 'medical' };
  function upgradeList(s, list, levels, kind) {
    let html = '<div class="col">';
    for (const f of list) {
      const lvl = levels[f.k] || 0;
      const locked = s.best < f.unlock;
      const cost = E.facilityCost(f, lvl);
      const maxed = lvl >= f.max;
      const name = kind === 'coach' ? f.name : f.name;
      const sub = kind === 'coach' ? '<div class="d">' + (lvl ? U.esc(f.who) + ' · ' : '') + f.desc + ' per level</div>' : '<div class="d">' + f.desc + ' per level</div>';
      const effect = lvl ? '<div class="e">Now: ' + effectText(f, lvl, kind) + '</div>' : '';
      const ic = kind === 'coach' ? 'whistle' : facIcons[f.k];
      html += '<div class="urow' + (locked ? ' locked' : '') + '" data-row="' + f.k + '"><div class="uic">' + icon(locked ? 'lock' : ic) + '</div><div class="ut"><div class="n">' + name + ' <span class="lv">' + (lvl ? 'Lv ' + lvl : kind === 'coach' ? 'Not hired' : 'Lv 0') + '</span></div>' + sub + effect +
        (locked ? '<div class="d" style="color:var(--gold)">Unlocks at ' + ui.stageName(f.unlock) + '</div>' : '') + '</div>' +
        (locked ? '' : '<button class="btn sm stack ' + (s.cash >= cost && !maxed ? 'green' : '') + '" data-act="' + kind + '" data-k="' + f.k + '" data-tut="' + kind + '-' + f.k + '"' + (maxed ? ' disabled' : '') + '>' + (maxed ? 'MAX' : kind === 'coach' && !lvl ? 'Hire' : 'Upgrade') + (maxed ? '' : '<span class="sub">$' + U.fmt(cost) + '</span>') + '</button>') + '</div>';
    }
    return html + '</div>';
  }
  function effectText(f, lvl, kind) {
    switch (f.k) {
      case 'court': return '+' + Math.round(f.per * lvl * 100) + '% win cash';
      case 'gym': return '+' + Math.round(f.per * lvl * 100) + '% power';
      case 'training': return '+' + Math.round(0.2 * lvl * 100) + '% TP, +' + 4 * lvl + '% power';
      case 'merch': return '+' + Math.round(25 * lvl) + '% idle income';
      case 'hq': return '+' + 6 * lvl + '% cash & power';
      case 'scouting': return 'Opponent styles visible · +' + 10 * lvl + '% shards';
      case 'stadium': return '+' + 12 * lvl + '% fans, +' + 10 * lvl + '% idle';
      case 'academy': return Math.min(6, lvl) + ' ticket' + (lvl > 1 ? 's' : '') + ' per 12h · +' + 25 * lvl + '% Dev League';
      case 'medical': return '-' + 6 * lvl + '% stamina drain, +' + 4 * lvl + '% offline';
      case 'head': return '+' + 8 * lvl + '% power';
      case 'shooting': case 'defense': case 'strength': return '+' + 3 * lvl + '% power & sim bonus';
      case 'business': return '+' + 10 * lvl + '% cash';
      case 'development': return '+' + 12 * lvl + '% TP, -' + Math.min(40, 2 * lvl) + '% level costs';
      case 'analytics': return 'Auto-tactics on · +' + 2 * lvl + '% counter bonus';
      case 'recruiting': return '+' + 10 * lvl + '% shards' + (lvl >= 5 ? ' · daily ticket' : '');
      default: return 'Level ' + lvl;
    }
  }

  function divisionHTML(s) {
    const lineup = new Set(s.lineup);
    const bench = s.roster.filter((a) => !lineup.has(a.uid));
    const m = E.mods(s);
    const per = E.divisionPerSec(s);
    const benchPower = bench.reduce((t, a) => t + E.athletePower(s, a, m), 0);
    const teams = ['Your Academy Squad', 'Harbor Juniors', 'Eastside Prospects', 'Metro Reserves', 'Valley Development', 'Pine Hill B-Team', 'Coastal Second Unit', 'Riverside Rookies'];
    const rng = U.mulberry32(U.hashStr(U.weekKey() + 'div'));
    const myW = Math.min(14, Math.floor(Math.log10(1 + benchPower) * 1.6 + 2));
    const rows = teams.map((n, i) => ({ n, w: i === 0 ? myW : Math.floor(rng() * 14), me: i === 0 })).sort((a, b) => b.w - a.w);
    let html = '<div class="card"><div class="row between"><div><div class="label">Second team · bench players</div><div class="power-num">⚡ ' + U.fmt(benchPower) + '</div></div><div style="text-align:right"><div class="label">Earning</div><div class="num" style="color:var(--good);font-size:18px">+$' + U.fmt(per) + '/s</div></div></div>' +
      '<div class="small muted" style="margin-top:6px">Every athlete not in your starting lineup plays in the Development League automatically, online or offline. Stronger benches earn more. Youth Academy and the Second Unit legacy perk boost it.</div>' +
      '<div class="small" style="margin-top:6px">Lifetime league earnings: <b>$' + U.fmt(s.division.earned) + '</b></div></div>';
    html += '<div class="sec-title"><span class="h3">Development League table</span><span class="label">This week</span></div><div class="col">';
    rows.forEach((r, i) => { html += '<div class="lb-row' + (r.me ? ' me' : '') + '"><span class="rk">' + (i + 1) + '</span><span>' + U.esc(r.me ? s.franchise.name + ' Academy' : r.n) + '</span><span class="num">' + r.w + '-' + (14 - r.w) + '</span></div>'; });
    html += '</div>';
    if (!bench.length) html += '<div class="card flat empty" style="margin-top:10px">No bench players yet. Recruit more athletes to field a second team.</div>';
    return html;
  }

  function legacyHTML(s) {
    const gain = E.legacyGain(s);
    const can = E.canPrestige(s);
    let html = '<div class="card" style="background:linear-gradient(135deg,#3a2a07,#1b2349);border-color:rgba(255,210,63,.35)"><div class="row"><span style="font-size:34px;color:var(--gold)">' + icon('legacy') + '</span><div class="grow"><div class="label" style="color:var(--gold)">Legacy Stars</div><div class="power-num">★ ' + U.fmtInt(s.prestige.points) + '</div><div class="small muted">Earned all-time: ' + s.prestige.earned + ' · Each star ever earned gives +2% power & cash (now ×' + E.mods(s).aura.toFixed(2) + ')</div></div></div></div>';
    html += '<div class="card" style="margin-top:10px"><div class="h3">Start a new dynasty</div><div class="small muted" style="margin:6px 0">Retire this run to bank Legacy Stars. You <b>keep</b>: athletes, stars, training, gear, collection, gems, tickets, achievements and legacy perks. You <b>reset</b>: cash, stage progress, athlete levels' + ((s.prestige.upgrades.headstart || 0) ? ' (to Lv 10)' : '') + ', facilities and coaches.</div>' +
      '<div class="row between"><div><div class="label">Stars for retiring now</div><div class="power-num">+' + gain + ' ★</div><div class="small muted">Grows with stages cleared (' + s.run.cleared + ') and cash earned this run</div></div>' +
      '<button class="btn gold stack" data-act="prestige"' + (can ? '' : ' disabled') + '>Retire & Rebuild<span class="sub">' + (can ? 'Run #' + ((s.run.number || 1) + 1) : 'Clear World 3 first') + '</span></button></div></div>';
    html += '<div class="sec-title"><span class="h3">Legacy perks</span><span class="label">Permanent</span></div><div class="col">';
    for (const u of D.prestigeUpgrades) {
      const lvl = s.prestige.upgrades[u.k] || 0;
      const maxed = lvl >= u.max;
      const cost = E.prestigeCost(u, lvl);
      html += '<div class="urow"><div class="uic" style="color:var(--gold)">' + icon(u.cosmetic ? 'jersey' : 'legacy') + '</div><div class="ut"><div class="n">' + u.name + ' <span class="lv">' + (u.max === 1 ? (lvl ? 'Owned' : '') : 'Lv ' + lvl + '/' + u.max) + '</span></div><div class="d">' + u.desc + '</div></div>' +
        '<button class="btn sm gold stack" data-act="legacybuy" data-k="' + u.k + '"' + (maxed || s.prestige.points < cost ? ' disabled' : '') + '>' + (maxed ? 'MAX' : 'Buy') + (maxed ? '' : '<span class="sub">★ ' + cost + '</span>') + '</button></div>';
    }
    return html + '</div>';
  }

  async function doPrestige() {
    const s = S();
    if (!E.canPrestige(s)) return;
    const gain = E.legacyGain(s);
    const ok = await ui.confirmBox('Retire & rebuild?', '<div>You will bank <b style="color:var(--gold)">+' + gain + ' Legacy Stars</b> and restart from World 1 with permanent bonuses.</div><div class="small muted">Your athletes, gear, collection and premium currency stay with you.</div>', 'Retire for +' + gain + ' ★', { cls: 'gold' });
    if (!ok) return;
    const r = E.doPrestige(s);
    if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); return; }
    BE.play.restartMatch();
    BE.audio.play('champion');
    ui.closeAll();
    ui.renderHUD(s); ui.renderNav(s);
    BE.court.confetti(120);
    ui.rewardsPopup('NEW DYNASTY!', [], { sub: '+' + r.gain + ' Legacy Stars banked. Spend them on perks in the Legacy tab, then rebuild faster than ever.', ok: 'Let\'s build' });
    BE.bus.emit('prestige', r);
    BE.bus.emit('changed');
    renderEmpire();
  }

  // ---------- Shop ----------
  function renderShop() {
    const s = S();
    const el = $('#scr-shop');
    const sv = BE.services;
    let html = '';
    if (sv.devMode) html += '<div class="dev-banner" style="margin-bottom:10px"><b>DEVELOPMENT MODE.</b> No store or ad network is connected. Purchase buttons grant items as clearly labeled tests and never charge money; ad buttons show a placeholder. Everything in the game can also be earned by playing.</div>';
    // Free daily gift
    const giftReady = s.timers.freeGiftDay !== U.dayKey();
    html += '<div class="offer"><div class="oico" style="color:var(--good)">' + icon('daily') + '</div><div class="grow"><b>Free daily gift</b><div class="small muted">' + (giftReady ? 'Cash, training points and gems' : 'Come back tomorrow · ' + U.fmtTime(U.msUntilNextDay() / 1000)) + '</div></div><button class="btn sm green" data-act="freegift"' + (giftReady ? '' : ' disabled') + '>Claim</button></div>';
    // Starter
    const starter = D.products.find((p) => p.sku === 'starter');
    if (!s.purchases.starter) html += '<div class="offer feature" style="margin-top:12px"><span class="tag">' + starter.tag + '</span><div class="oico" style="color:var(--gold)">' + icon('star') + '</div><div class="grow"><b>' + starter.name + '</b><div class="small">' + starter.desc + ' + Crimson Crew look</div></div><div><button class="btn gold sm" data-act="buy" data-sku="starter">' + sv.price(starter) + '</button>' + (sv.devMode ? '<div class="price-note">test · no charge</div>' : '') + '</div></div>';
    // Free rewards via ads
    html += '<div class="sec-title"><span class="h3">Free rewards</span><span class="label">Optional ads</span></div><div class="col">';
    html += adRow('tp', 'Training materials', 'Training points worth 2 hours', 'train');
    html += adRow('ticket', 'Recruit ticket', '+1 Pro Scout ticket', 'ticket');
    html += '</div>';
    // Gems
    html += '<div class="sec-title"><span class="h3">Gems</span><span class="label">You have ◆ ' + U.fmtInt(s.gems) + '</span></div><div class="agrid">';
    for (const p of D.products.filter((x) => x.sku.startsWith('gems'))) {
      html += '<div class="card" style="text-align:center;padding:10px 6px"><div style="font-size:26px;color:var(--gem)">' + icon('gem') + '</div><div class="num" style="font-size:18px">' + U.fmtInt(p.grant.gems) + '</div><div class="small muted" style="min-height:30px">' + p.desc.replace(/^[\d,]+ gems ?/, '') + '</div><button class="btn sm purple wide" data-act="buy" data-sku="' + p.sku + '">' + sv.price(p) + '</button>' + (sv.devMode ? '<div class="price-note">test · no charge</div>' : '') + '</div>';
    }
    html += '</div>';
    // Bundles
    html += '<div class="sec-title"><span class="h3">Bundles & membership</span></div><div class="col">';
    for (const sku of ['recruit_bundle', 'cosmetic_bundle', 'pass', 'vip']) {
      const p = D.products.find((x) => x.sku === sku);
      const owned = (sku === 'vip' && s.purchases.vip) || (sku === 'pass' && s.pass.premium) || (sku === 'cosmetic_bundle' && ['neon', 'retro', 'ice'].every((c) => s.franchise.owned.includes(c)));
      const ic = { recruit_bundle: 'cards', cosmetic_bundle: 'jersey', pass: 'pass', vip: 'star' }[sku];
      html += '<div class="offer' + (sku === 'vip' ? ' feature' : '') + '"><div class="oico" style="color:var(--gold)">' + icon(ic) + '</div><div class="grow"><b>' + p.name + '</b><div class="small muted">' + p.desc + '</div></div><div>' +
        (owned ? '<span class="chip good">Owned</span>' : '<button class="btn sm ' + (sku === 'vip' ? 'gold' : '') + '" data-act="buy" data-sku="' + sku + '">' + sv.price(p) + '</button>' + (sv.devMode ? '<div class="price-note">test · no charge</div>' : '')) + '</div></div>';
    }
    html += '</div>';
    // Gem shop
    html += '<div class="sec-title"><span class="h3">Spend gems</span></div><div class="col">';
    for (const it of D.gemShop) {
      const owned = it.once && s.purchases[it.k];
      const ic = { ticket1: 'ticket', ticket10: 'cards', tp: 'train', cashbag: 'cash', gearchest: 'gear', autocoach: 'bolt' }[it.k];
      const desc = it.k === 'autocoach' ? 'Auto-uses abilities and picks counter tactics (also unlockable free via the Analytics coach)' : ui.rewardPreview(it.grant);
      html += '<div class="urow"><div class="uic">' + icon(ic) + '</div><div class="ut"><div class="n">' + it.name + '</div><div class="d">' + desc + '</div></div>' +
        (owned ? '<span class="chip good">Owned</span>' : '<button class="btn sm purple" data-act="gembuy" data-k="' + it.k + '"' + (s.gems < it.cost ? ' disabled' : '') + '>◆ ' + it.cost + '</button>') + '</div>';
    }
    html += '</div>';
    // Cosmetics
    html += '<div class="sec-title"><span class="h3">Team looks</span><span class="label">Cosmetic only</span></div><div class="agrid">';
    for (const c of D.cosmetics) {
      const owned = s.franchise.owned.includes(c.k);
      const sel = s.franchise.cosmetic === c.k;
      const floor = c.court ? c.court.floor : '#d9a35f';
      html += '<div class="col" style="gap:4px"><button class="cos-swatch' + (sel ? ' sel' : '') + '" data-act="cosmetic" data-k="' + c.k + '" style="background:' + floor + '"><span style="position:absolute;inset:auto 0 0 0;height:45%;background:linear-gradient(90deg,' + c.jersey[0] + ' 50%,' + c.jersey[1] + ' 50%)"></span>' + (owned ? '' : '<span style="position:absolute;inset:0;display:grid;place-items:center;background:rgba(0,0,0,.45)">' + icon('lock') + '</span>') + '</button>' +
        '<div class="small" style="text-align:center"><b>' + c.name + '</b><br><span class="muted">' + (owned ? (sel ? 'Equipped' : 'Owned') : c.source) + '</span></div></div>';
    }
    html += '</div>';
    html += '<div class="card flat small muted" style="margin-top:12px">Prices are shown exactly as charged by the store. Purchases are optional; gems, tickets, gear and athletes are all earnable through play. Purchase history: ' + s.purchases.history.length + ' item(s).</div>';
    el.innerHTML = html;
  }
  function adRow(k, name, desc, ic) {
    const s = S();
    const left = Math.max(0, D.ads[k].daily - (s.ads.counts[k] || 0));
    return '<div class="urow"><div class="uic">' + icon('tv') + '</div><div class="ut"><div class="n">' + name + '</div><div class="d">' + desc + ' · ' + left + ' left today</div></div><button class="btn sm green" data-act="adreward" data-k="' + k + '"' + (left ? '' : ' disabled') + '>Watch</button></div>';
  }

  async function buy(sku) {
    const s = S();
    const p = D.products.find((x) => x.sku === sku);
    if (!p) return;
    if (p.once && ((sku === 'starter' && s.purchases.starter) || (sku === 'vip' && s.purchases.vip))) { ui.toast('Already owned', '', 'check'); return; }
    const sv = BE.services;
    const ok = await ui.confirmBox('Confirm purchase', '<div class="card flat"><b>' + p.name + '</b><div class="small muted">' + p.desc + '</div><div class="row between" style="margin-top:8px"><span>Price</span><span class="num" style="font-size:20px">' + sv.price(p) + '</span></div></div>' +
      (sv.devMode ? '<div class="dev-banner"><b>TEST PURCHASE.</b> Development mode: no payment is processed and no money is charged. Items are granted so the flow can be tested.</div>' : '<div class="small muted">Payment is handled by your app store.</div>'),
      sv.devMode ? 'Grant test items' : 'Buy for ' + sv.price(p), { cls: 'gold' });
    if (!ok) return;
    const r = await sv.purchase(p);
    if (!r.ok) { ui.toast('Purchase not completed' + (r.error ? ': ' + r.error : ''), 'bad', 'x'); return; }
    const granted = grantProduct(s, p);
    s.purchases.history.push({ sku, t: Date.now(), dev: !!r.dev });
    ui.rewardsPopup(r.dev ? 'TEST ITEMS GRANTED' : 'THANK YOU!', granted, { sub: r.dev ? 'Development mode — nothing was charged.' : p.name });
    BE.bus.emit('changed');
    renderShop();
  }
  function grantProduct(s, p) {
    const g = p.grant;
    const out = E.grant(s, { gems: g.gems, tickets: g.tickets, gearChest: g.gearChest, cosmetic: g.cosmetic });
    if (p.sku === 'starter') s.purchases.starter = true;
    if (g.pass) { s.pass.premium = true; out.push({ k: 'passXp', v: 0 }); }
    if (g.vip) {
      s.purchases.vip = true;
      if (!s.franchise.owned.includes('vip')) s.franchise.owned.push('vip');
      E.invalidate();
    }
    return out.filter((x) => x.v !== 0 || x.k === 'gear' || x.k === 'cosmetic');
  }

  const act = {
    emptab: (d) => { tab = d.k; BE.audio.play('tab'); renderEmpire(); },
    facility: (d, el) => upgrade('facility', d.k, el),
    coach: (d, el) => upgrade('coach', d.k, el),
    prestige: () => doPrestige(),
    legacybuy: (d, el) => {
      const r = E.buyPrestige(S(), d.k);
      if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); BE.audio.play('error'); return; }
      BE.audio.play('milestone'); ui.sparks(el, '#ffd23f', 20); renderEmpire(); BE.bus.emit('changed');
    },
    buy: (d) => buy(d.sku),
    gembuy: async (d) => {
      const s = S();
      const it = D.gemShop.find((x) => x.k === d.k);
      if (!it || s.gems < it.cost) { ui.toast('Not enough gems', 'bad', 'gem'); return; }
      const ok = await ui.confirmBox('Spend gems?', '<div>Buy <b>' + it.name + '</b> for <b>◆ ' + it.cost + '</b>?</div>', 'Spend ◆ ' + it.cost, { cls: 'purple' });
      if (!ok) return;
      s.gems -= it.cost;
      let granted;
      if (it.grant.autocoach) { s.purchases.autocoach = true; s.settings.autoAbilities = true; granted = []; ui.toast('Auto-Coach unlocked! Toggle it on the Play screen.', 'gold', 'bolt'); }
      else granted = E.grant(s, it.grant);
      if (granted.length) ui.rewardsPopup('PURCHASED', granted);
      BE.audio.play('claim'); BE.bus.emit('changed'); renderShop();
    },
    cosmetic: (d) => {
      const s = S();
      const c = D.cosmetics.find((x) => x.k === d.k);
      if (!s.franchise.owned.includes(c.k)) {
        if (c.price > 0) {
          ui.confirmBox('Unlock ' + c.name + '?', '<div>Cosmetic team look for ◆ ' + c.price + ' gems.</div>', 'Unlock ◆ ' + c.price, { cls: 'purple' }).then((ok) => {
            if (!ok) return;
            if (s.gems < c.price) { ui.toast('Not enough gems', 'bad', 'gem'); return; }
            s.gems -= c.price; s.franchise.owned.push(c.k); s.franchise.cosmetic = c.k; applyLook(); renderShop();
          });
        } else ui.toast('Unlock: ' + c.source, '', 'lock');
        return;
      }
      s.franchise.cosmetic = c.k; applyLook(); renderShop(); BE.audio.play('upgrade', { combo: 3 });
    },
    freegift: (d, el) => {
      const s = S();
      if (s.timers.freeGiftDay === U.dayKey()) return;
      s.timers.freeGiftDay = U.dayKey();
      const g = E.grant(s, { cashMinutes: 10, tp: 15, gems: 5 });
      ui.rewardsPopup('DAILY GIFT', g); renderShop(); ui.updateBadges(s);
    },
    adreward: async (d) => {
      const s = S();
      const k = d.k;
      if ((s.ads.counts[k] || 0) >= D.ads[k].daily) return;
      const r = await BE.services.rewardedAd(k);
      if (!r.ok) { ui.toast('No reward — the ad was not completed', '', 'tv'); return; }
      s.ads.counts[k] = (s.ads.counts[k] || 0) + 1;
      const g = k === 'tp' ? E.grant(s, { tpHours: 2 }) : E.grant(s, { tickets: 1 });
      ui.rewardsPopup('REWARD', g);
      renderShop();
    },
  };
  function applyLook() {
    const s = S();
    BE.court.setTheme(E.worldOf(Math.min(s.run.cleared, 99)), G.cosmetic(s));
    ui.renderHUD(s);
    if (BE.play.R.match) { BE.play.R.match.teams[0].colors = G.cosmetic(s).jersey; BE.court.C.players.filter((p) => p.team === 0).forEach((p) => { p.colors = G.cosmetic(s).jersey; }); }
  }
  function upgrade(kind, k, el) {
    const s = S();
    const r = kind === 'facility' ? E.upgradeFacility(s, k) : E.upgradeCoach(s, k);
    if (!r.ok) { ui.toast(r.reason, 'bad', 'cash'); BE.audio.play('error'); return; }
    BE.audio.play(r.lvl % 10 === 0 || r.hired ? 'milestone' : 'upgrade', { combo: r.lvl % 12 });
    ui.sparks(el, '#38d996', 14);
    const f = (kind === 'facility' ? D.facilities : D.coaches).find((x) => x.k === k);
    ui.floatText(r.hired ? 'HIRED!' : 'Lv ' + r.lvl, el, '#ffd23f');
    if (r.hired) ui.toast(f.who + ' joins as ' + f.name + '!', 'gold', 'whistle');
    BE.bus.emit('facility', { kind, k });
    BE.bus.emit('changed');
    renderEmpire();
    const row = $('[data-row="' + k + '"]'); ui.flash(row);
  }

  BE.empire = { renderEmpire, renderShop, act, buy, applyLook, setTab: (t) => { tab = t; } };
})(typeof window !== 'undefined' ? window : globalThis);
