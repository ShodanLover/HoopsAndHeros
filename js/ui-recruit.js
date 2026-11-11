/* Basketball Empire — Recruit screen: banners, disclosed odds & pity, dramatic reveals, shard exchange */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, A = BE.athletes;
  const ui = BE.ui;
  const { $, $$, icon } = ui;
  const S = () => BE.game_state;
  let busy = false;

  function oddsMini(odds) {
    return odds.map((o, i) => o > 0 ? '<span style="color:' + D.rarities[i].color + '">' + D.rarities[i].name[0] + ' ' + o + '%</span>' : '').join('');
  }
  function levelLine(s, key) {
    const bl = E.bannerLevel(s, key);
    return '<div class="blevel"><span class="chip gold">Banner Lv ' + bl.lvl + '</span><div class="bar" style="flex:1;height:5px"><i style="width:' + Math.round(bl.frac * 100) + '%"></i></div><span class="small">' + (bl.max ? 'MAX odds' : (bl.next - bl.xp) + ' pulls to Lv ' + (bl.lvl + 1)) + '</span></div>';
  }
  function freeRow(s, key) {
    const k = key === 'pro' ? 'freepro' : 'freeevent';
    const left = adRemaining(s, k);
    return '<button class="chip ' + (left ? 'good' : '') + '" data-act="freepull" data-b="' + key + '"' + (left ? '' : ' disabled') + ' style="padding:4px 9px">' + icon('tv') + ' Free recruit · ' + (left ? 'optional ad' : 'tomorrow') + '</button>';
  }
  function bannerArt(t) {
    return '<div class="bart">' + A.portraitSVG(t, { colors: ['#ff7a2f', '#1b1f3a'] }) + '</div>';
  }

  function renderRecruit() {
    const s = S();
    const el = $('#scr-recruit');
    const B = E.banners;
    const sc = E.streetCost(s);
    const ev = E.eventFeatured();
    const msLeft = U.msUntilNextWeek();
    const showcase = A.catalog.filter((t) => t.rarity === 3 && t.world <= E.worldOf(s.best));
    const pick = showcase[Math.floor(Date.now() / 86400000) % Math.max(1, showcase.length)] || A.catalog[0];
    let html = '<div class="row between" style="margin-bottom:10px"><div><div class="h2">Recruit Talent</div><div class="small muted">Pool: athletes from Worlds 1–' + (E.worldOf(s.best) + 1) + ' · reach new worlds to scout more</div></div><button class="btn sm ghost" data-act="odds">' + icon('info') + ' Odds</button></div>';
    // Pro scout
    const p = s.recruit.pro;
    const wishNames = s.recruit.wish.map((id) => A.tpl(id)).filter(Boolean).map((t) => t.last).join(', ');
    html += '<div class="banner-card pro" data-tut="probanner">' + bannerArt(pick) + '<div class="label" style="color:var(--gem)">Featured scouting</div><div class="bt">Pro Scout</div>' +
      '<div class="bd">All rarities, including Mythic. Every 10-pull includes Rare or better. Odds improve as the banner levels up.</div>' + levelLine(s, 'pro') + '<div class="odds-mini">' + oddsMini(E.bannerOdds(s, 'pro')) + '</div>' +
      '<div class="pity">Epic+ guaranteed in <b>' + (B.pro.pity.e - p.e) + '</b> · Legendary+ in <b>' + (B.pro.pity.l - p.l) + '</b> · Mythic in <b>' + (B.pro.pity.m - p.m) + '</b></div>' +
      '<div class="row wrap" style="gap:6px;margin-top:4px"><button class="chip" data-act="wish" style="padding:4px 9px">' + icon('star') + ' Wish list ' + s.recruit.wish.length + '/3' + (wishNames ? ': ' + U.esc(wishNames) : '') + '</button>' + freeRow(s, 'pro') + '</div>' +
      '<div class="pull-row"><button class="btn purple stack" data-act="pull" data-b="pro" data-n="1" data-tut="pull1">Recruit ×1<span class="sub">' + (s.tickets >= 1 ? '★ 1 ticket' : '◆ ' + B.pro.gemCost) + '</span></button>' +
      '<button class="btn gold stack" data-act="pull" data-b="pro" data-n="10">Recruit ×10<span class="sub">' + (s.tickets >= 10 ? '★ 10 tickets' : '◆ ' + B.pro.gemCost * 9 + ' (10% off)') + '</span></button></div></div>';
    // Event
    if (E.unlocked(s, 'events')) {
      const pe = s.recruit.event;
      html += '<div class="banner-card event" style="margin-top:10px">' + bannerArt(ev.featured) + '<div class="label" style="color:var(--r4)">Limited · ends in ' + U.fmtTime(msLeft / 1000) + '</div><div class="bt">' + ev.theme + '</div>' +
        '<div class="bd">Featured Legendary: <b>' + U.esc(A.displayName(ev.featured)) + '</b> (50% of Legendary results). Boosted Epic+ rates.</div>' + levelLine(s, 'event') + '<div class="odds-mini">' + oddsMini(E.bannerOdds(s, 'event')) + '</div>' +
        '<div class="pity">Event tickets: <b>' + s.eventTickets + '</b> · Epic+ in ' + (B.event.pity.e - pe.e) + ' · Legendary+ in ' + (B.event.pity.l - pe.l) + '</div><div class="row" style="margin-top:4px">' + freeRow(s, 'event') + '</div>' +
        '<div class="pull-row"><button class="btn gold stack" data-act="pull" data-b="event" data-n="1">Recruit ×1<span class="sub">' + (s.eventTickets >= 1 ? '✦ 1 event ticket' : '◆ ' + B.event.gemCost) + '</span></button>' +
        '<button class="btn stack" data-act="pull" data-b="event" data-n="10">×10<span class="sub">' + (s.eventTickets >= 10 ? '✦ 10' : '◆ ' + B.event.gemCost * 9) + '</span></button></div></div>';
    }
    // Street
    html += '<div class="banner-card street" style="margin-top:10px"><div class="label" style="color:var(--accent)">Cash scouting</div><div class="bt">Street Scout</div>' +
      '<div class="bd">Find local talent with cash. Common to Rare only. Great for filling your bench and collection.</div><div class="odds-mini">' + oddsMini(B.street.odds) + '</div>' +
      '<div class="pull-row"><button class="btn stack" data-act="pull" data-b="street" data-n="1">Scout ×1<span class="sub">$' + U.fmt(sc) + '</span></button><button class="btn stack" data-act="pull" data-b="street" data-n="10">×10<span class="sub">$' + U.fmt(sc * 10) + '</span></button></div></div>';
    // Free ticket via ad
    const adLeft = adRemaining(s, 'ticket');
    html += '<div class="offer" style="margin-top:12px"><div class="oico">' + icon('tv') + '</div><div class="grow"><b>Free Pro Scout ticket</b><div class="small muted">Optional ad · ' + adLeft + ' left today</div></div><button class="btn sm green" data-act="adticket"' + (adLeft ? '' : ' disabled') + '>Watch</button></div>';
    // Shards
    html += '<div class="sec-title"><span class="h3">Star Shard Exchange</span><span class="label">✧ ' + U.fmtInt(s.shards) + ' shards</span></div>' +
      '<div class="small muted" style="margin-bottom:8px">Duplicates raise an athlete\'s stars (up to 5★). Beyond that they become Star Shards.</div><div class="col">' +
      exRow('ticket', 'Pro Scout ticket', 120, 'ticket') + exRow('tp', 'Training crate (1h of training points)', 40, 'train') + exRow('scrap', '60 gear scrap', 30, 'craft') + '</div>';
    html += '<div class="card flat small muted" style="margin-top:12px">Total recruits: ' + s.recruit.total + '. Odds for the current banner level are shown before every pull (full table under Odds); guarantees count across sessions. Duplicates raise stars, and at 5★ every 5 duplicates convert into a recruit of the next rarity.</div>';
    el.innerHTML = html;
  }
  function exRow(k, label, cost, ic) {
    const s = S();
    return '<div class="urow"><div class="uic">' + icon(ic) + '</div><div class="ut"><div class="n">' + label + '</div><div class="d">✧ ' + cost + ' shards</div></div><button class="btn sm" data-act="exchange" data-k="' + k + '"' + (s.shards < cost ? ' disabled' : '') + '>Trade</button></div>';
  }
  function adRemaining(s, k) { return Math.max(0, D.ads[k].daily - (s.ads.counts[k] || 0)); }

  function oddsModal() {
    const B = E.banners;
    const ev = E.eventFeatured();
    let html = '<div class="small muted" style="margin-bottom:10px">These are the exact per-pull probabilities. Guarantees replace a pull\'s roll when their counter is reached; counters are saved and shown on each banner.</div>';
    const s = S();
    for (const k of ['pro', 'event', 'street']) {
      const b = B[k];
      const bl = E.bannerLevel(s, k);
      const cur = E.bannerOdds(s, k);
      html += '<div class="card" style="margin-bottom:10px"><div class="row between"><div class="h3">' + b.name + '</div>' + (b.oddsMax ? '<span class="chip gold">Lv ' + bl.lvl + ' · ' + bl.xp + ' pulls</span>' : '') + '</div><div class="kv" style="margin-top:6px">' +
        cur.map((o, i) => '<span style="color:' + D.rarities[i].color + '">' + D.rarities[i].name + '</span><span>' + o.toFixed(1) + '%</span>').join('') + '</div>';
      if (b.oddsMax) {
        html += '<div class="small muted" style="margin-top:8px">Banner level rises with pulls (' + E.BANNER_LEVELS.slice(1).join(', ') + ' pulls for levels 2–10). Odds by level:</div><div class="odds-table">' +
          '<div class="ot-row ot-head"><span>Lv</span>' + D.rarities.map((r) => '<span style="color:' + r.color + '">' + r.name[0] + '</span>').join('') + '</div>' +
          [1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((L) => '<div class="ot-row' + (L === bl.lvl ? ' cur' : '') + '"><span>' + L + '</span>' + E.bannerOddsAt(k, L).map((o) => '<span>' + o + '</span>').join('') + '</div>').join('') + '</div>';
      }
      if (b.pity) html += '<div class="small" style="margin-top:8px">• 10-pull: at least one Rare or better.<br>• Epic or better guaranteed by pull ' + b.pity.e + ' without one.<br>• Legendary or better by pull ' + b.pity.l + '.<br>• Mythic by pull ' + b.pity.m + '.<br>• One free recruit per day (optional ad) at the same odds.</div>';
      if (k === 'event') html += '<div class="small" style="margin-top:6px">• When a Legendary is rolled, 50% chance it is the featured athlete (' + U.esc(A.displayName(ev.featured)) + ').</div>';
      if (k === 'pro') html += '<div class="small" style="margin-top:6px">• Wish list: when a Legendary is rolled, 50% chance it is one of your up to 3 wish-listed athletes (if they are in the unlocked pool).</div>';
      html += '<div class="small muted" style="margin-top:6px">Cost: ' + (k === 'street' ? 'cash (scales with progress)' : (k === 'pro' ? '1 Pro ticket or ' : '1 Event ticket or ') + b.gemCost + ' gems; ×10 costs 9× in gems') + '</div></div>';
    }
    html += '<div class="card flat small">Duplicates: +1★ (max 5★, +30% power and +2 all attributes per star). At 5★ duplicates convert to Star Shards (Common 5 … Mythic 400), and every 5 such duplicates also convert into a recruit of the next rarity. Athletes are drawn evenly from the unlocked pool of the rolled rarity.</div>';
    ui.modal({ title: 'Recruitment odds', html });
  }

  // ---------- Pull flow ----------
  async function pull(bannerKey, n, free) {
    if (busy) return;
    const s = S();
    const B = E.banners[bannerKey];
    let payWith = free ? 'free' : 'tickets';
    if (bannerKey !== 'street' && !free) {
      const have = s[B.currency];
      if (have < n) {
        payWith = 'gems';
        const cost = B.gemCost * (n === 10 ? 9 : n);
        if (s.gems < cost) { ui.toast('Not enough tickets or gems', 'bad', 'gem'); BE.audio.play('error'); return; }
        const ok = await ui.confirmBox('Use gems?', '<div>You don\'t have enough ' + (bannerKey === 'pro' ? 'Pro Scout' : 'Event') + ' tickets. Spend <b>◆ ' + cost + ' gems</b> for ' + n + ' recruit' + (n > 1 ? 's' : '') + '?</div><div class="small muted">Gems are earned from missions, achievements and championships, or optionally purchased.</div>', 'Spend ◆ ' + cost, { cls: 'purple' });
        if (!ok) return;
      }
    }
    const tutForce = !s.tutorial.done && s.recruit.total === 0 && bannerKey === 'pro';
    let res;
    if (tutForce) {
      // First-ever recruit in the tutorial is guaranteed Rare (shown in the tutorial text)
      s.tickets -= 1;
      const r = E.pullOne(s, 'pro', Math.random, 2);
      const pool = A.catalog.filter((t) => t.rarity === Math.min(r, 3) && t.world === 0);
      const t = pool[Math.floor(Math.random() * pool.length)];
      const ad = E.addAthlete(s, t);
      s.recruit.total++; s.stats.pulls++;
      res = { ok: true, results: [Object.assign({ t, rarity: t.rarity }, ad)] };
    } else res = E.recruit(s, bannerKey, n, payWith);
    if (!res.ok) { ui.toast(res.reason, 'bad', 'x'); BE.audio.play('error'); return; }
    busy = true;
    const promoted = [];
    for (const r of res.results) if (!r.dupe) { const out = G.autoPromote(s, r.a); if (out) promoted.push(A.tpl(r.a.cid).last); }
    BE.bus.emit('recruit', res);
    BE.bus.emit('changed');
    try { if (n === 1) await revealOne(res.results[0], bannerKey); else await revealMany(res.results); }
    finally { busy = false; }
    renderRecruit();
    if (res.results.levelUp) { ui.toast(E.banners[bannerKey].name + ' banner reached Lv ' + res.results.levelUp + ': better odds on every pull!', 'gold', 'star'); BE.audio.play('milestone'); }
    if (promoted.length) ui.toast(promoted.slice(0, 3).join(', ') + (promoted.length > 3 ? ' and more' : '') + ' moved into the starting lineup', 'good', 'swap');
    BE.bus.emit('recruit:done', res);
  }

  function revealOne(r, bannerKey) {
    return new Promise((resolve) => {
      const t = r.t, rar = r.rarity;
      const cos = G.cosmetic(S());
      const startCol = rar >= 3 ? 2 : rar;
      const m = ui.modal({
        center: true, noClose: true, title: undefined,
        html: '<div class="stack" style="align-items:center"><div class="label">' + (bannerKey === 'street' ? 'Street Scout' : 'Scouting report incoming') + '</div><div class="reveal-stage rar r' + startCol + '" data-rs><div class="beams hidden" data-beams></div>' +
          '<div class="reveal-card shake" data-card><div class="flip"><div class="face-b">' + ui.ballArt + '</div><div class="face-f">' + cardFront(t, cos, r) + '</div></div></div></div>' +
          '<div data-info style="min-height:92px;text-align:center"><div class="muted small">Tap the card to reveal</div></div>' +
          '<div class="row" style="width:100%"><button class="btn ghost grow hidden" data-done>Done</button><button class="btn purple grow hidden" data-again>Recruit again</button></div></div>',
        onClose: () => resolve(),
      });
      const stage = $('[data-rs]', m.el), card = $('[data-card]', m.el);
      BE.audio.play('drumroll', { dur: 1 + rar * 0.25 });
      // Anticipation: color escalates for high rarities
      let step = startCol;
      const esc = setInterval(() => {
        if (step < rar) { step++; stage.className = 'reveal-stage rar r' + step; BE.audio.play('whoosh'); if (step >= 3) $('[data-beams]', m.el).classList.remove('hidden'); }
      }, 450);
      let opened = false;
      const open = () => {
        if (opened) return; opened = true;
        clearInterval(esc);
        stage.className = 'reveal-stage rar r' + rar;
        if (rar >= 3) $('[data-beams]', m.el).classList.remove('hidden');
        card.classList.remove('shake'); card.classList.add('open');
        BE.audio.play('reveal', { rarity: rar });
        BE.services.haptic(rar >= 4 ? [40, 40, 80] : 20);
        ui.sparks(card, D.rarities[rar].color, 10 + rar * 8);
        const info = $('[data-info]', m.el);
        info.innerHTML = '<div class="rar r' + rar + '"><div class="rar-name">' + D.rarities[rar].name.toUpperCase() + '</div></div><div class="h3">' + U.esc(A.displayName(t)) + '</div><div class="small muted">' + D.positions[t.pos].name + ' · ' + D.archetypes.find((x) => x.k === t.arch).name + '</div>' +
          '<div style="margin-top:4px">' + (r.dupe ? (r.starUp ? '<span class="chip gold">Duplicate → ★' + r.a.stars + ' (+30% power)</span>' : '<span class="chip">Max stars → +' + r.shards + ' ✧ shards</span>' + (r.convert ? ' <span class="chip good">5 dupes → ' + D.rarities[r.convert.rarity].name + ' ' + U.esc(r.convert.t.last) + '!</span>' : '')) : '<span class="chip good">NEW ATHLETE!</span>') + '</div>';
        $('[data-done]', m.el).classList.remove('hidden');
        if (S().tutorial.done) $('[data-again]', m.el).classList.remove('hidden');
      };
      card.addEventListener('click', open);
      setTimeout(() => { if (!opened) card.classList.add('pulse'); }, 1600);
      m.el.addEventListener('click', (e) => {
        if (e.target.closest('[data-done]')) { BE.audio.play('click'); m.close(); }
        if (e.target.closest('[data-again]')) { m.close(); setTimeout(() => pull(bannerKey, 1), 50); }
      });
    });
  }
  function cardFront(t, cos, r) {
    const s = S();
    const a = r.a || { stars: 1 };
    return '<div class="acard rar r' + t.rarity + '" style="height:100%"><div class="in"><div class="pt" style="aspect-ratio:auto;flex:1">' + A.portraitSVG(t, { colors: cos.jersey }) +
      '<div class="ovr">' + A.ovrFromAttrs(t.attrs, t.pos) + '<small>' + t.pos + '</small></div><div class="stars">' + ui.stars(a.stars) + '</div></div>' +
      '<div class="nm"><div class="n">' + U.esc(t.first + ' ' + t.last) + '</div><div class="p">' + D.rarities[t.rarity].name + (s ? '' : '') + '</div></div></div></div>';
  }

  function revealMany(results) {
    return new Promise((resolve) => {
      const cos = G.cosmetic(S());
      const best = Math.max.apply(null, results.map((r) => r.rarity));
      const m = ui.modal({
        center: true, noClose: true,
        html: '<div class="stack"><div class="row between"><div class="h2">10× Recruit</div><button class="btn sm ghost" data-all>Reveal all</button></div>' +
          '<div class="multi-grid">' + results.map((r, i) => '<div class="reveal-card rar r' + r.rarity + '" data-i="' + i + '"><div class="flip"><div class="face-b" style="box-shadow:0 0 ' + (6 + r.rarity * 5) + 'px -2px var(--rc)">' + ui.ballArt + '</div><div class="face-f">' + cardFront(r.t, cos, r) + '</div></div></div>').join('') + '</div>' +
          '<div data-sum class="small muted" style="min-height:40px;text-align:center">Tap cards to flip, or reveal all.</div><button class="btn wide hidden" data-done>Collect</button></div>',
        onClose: () => resolve(),
      });
      let opened = 0;
      const flip = (i) => {
        const c = $('[data-i="' + i + '"]', m.el);
        if (!c || c.classList.contains('open')) return;
        c.classList.add('open');
        opened++;
        const r = results[i];
        BE.audio.play(r.rarity >= 3 ? 'reveal' : 'click', { rarity: r.rarity });
        if (r.rarity >= 3) ui.sparks(c, D.rarities[r.rarity].color, 14);
        if (opened >= results.length) done();
      };
      const done = () => {
        const counts = [0, 0, 0, 0, 0, 0];
        let news = 0;
        for (const r of results) { counts[r.rarity]++; if (!r.dupe) news++; }
        $('[data-sum]', m.el).innerHTML = counts.map((c, i) => c ? '<span class="chip" style="color:' + D.rarities[i].color + '">' + c + ' ' + D.rarities[i].name + '</span>' : '').join(' ') + '<div style="margin-top:4px">' + news + ' new athlete' + (news === 1 ? '' : 's') + '</div>';
        $('[data-done]', m.el).classList.remove('hidden');
        if (best >= 4) BE.audio.play('champion');
      };
      BE.audio.play('drumroll', { dur: 1.2 });
      m.el.addEventListener('click', (e) => {
        const c = e.target.closest('[data-i]');
        if (c) flip(+c.dataset.i);
        if (e.target.closest('[data-all]')) { let k = 0; results.forEach((_, i) => setTimeout(() => flip(i), 110 * k++)); }
        if (e.target.closest('[data-done]')) { BE.audio.play('click'); m.close(); }
      });
    });
  }

  function wishModal() {
    const m = ui.modal({ title: 'Legendary wish list', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      const pool = A.catalog.filter((t) => t.rarity === 4 && t.world <= E.worldOf(s.best));
      let html = '<div class="small muted" style="margin-bottom:8px">Pick up to 3 Legendaries. When the Pro Scout banner rolls a Legendary, there is a 50% chance it is one of them. Odds of rolling a Legendary do not change.</div>' +
        '<div class="row wrap" style="gap:4px;margin-bottom:8px">' + (s.recruit.wish.length ? s.recruit.wish.map((id) => '<span class="chip gold">' + U.esc(A.displayName(A.tpl(id), true)) + '</span>').join('') : '<span class="chip">Empty</span>') + '</div>';
      html += '<div class="agrid compact">' + pool.map((t) => '<div style="position:relative">' + ui.templateCard(t, true, { act: 'wishpick' }) + (s.recruit.wish.includes(t.id) ? '<span class="chip gold" style="position:absolute;top:4px;left:4px">★ Wished</span>' : '') + '</div>').join('') + '</div>';
      if (!pool.length) html += '<div class="empty">Legendaries from your unlocked worlds appear here.</div>';
      mm.set(html);
    }
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-act="wishpick"]');
      if (!b) return;
      e.stopPropagation();
      const r = E.toggleWish(S(), b.dataset.cid);
      if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); return; }
      BE.audio.play(r.on ? 'claim' : 'click');
      draw(m); renderRecruit();
    }, true);
  }

  const act = {
    pull: (d) => pull(d.b, +d.n),
    wish: () => wishModal(),
    wishpick: () => {},
    freepull: async (d) => {
      const s = S();
      const k = d.b === 'pro' ? 'freepro' : 'freeevent';
      if (!adRemaining(s, k)) return;
      const r = await BE.services.rewardedAd(k);
      if (!r.ok) { ui.toast('No recruit — the ad was not completed', '', 'tv'); return; }
      s.ads.counts[k] = (s.ads.counts[k] || 0) + 1;
      pull(d.b, 1, true);
    },
    odds: () => oddsModal(),
    exchange: (d, el) => {
      const r = E.shardExchange(S(), d.k);
      if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); return; }
      BE.audio.play('claim'); ui.sparks(el, '#ff8fd0'); renderRecruit(); BE.bus.emit('changed');
    },
    adticket: async () => {
      const s = S();
      if (!adRemaining(s, 'ticket')) return;
      const r = await BE.services.rewardedAd('ticket');
      if (!r.ok) { ui.toast('No reward — the ad was not completed', '', 'tv'); return; }
      s.ads.counts.ticket = (s.ads.counts.ticket || 0) + 1;
      s.tickets++;
      ui.flyCurrency('tickets', null, 4);
      ui.toast('+1 Pro Scout ticket', 'gold', 'ticket');
      renderRecruit();
    },
  };

  BE.recruitUI = { renderRecruit, pull, oddsModal, act };
})(typeof window !== 'undefined' ? window : globalThis);
