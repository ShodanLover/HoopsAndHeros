/* Basketball Empire — daily faucets UI: Training Camps (keyed, tiered), Boosts (20-minute buffs),
 * the Halftime Spin and Fan Gifts. All ads here are optional and capped per day (see data.js ads). */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;
  const adLeft = (s, k) => Math.max(0, D.ads[k].daily - (s.ads.counts[k] || 0));

  // ---------- Camps tab (inside the Camps & Events sheet) ----------
  function campsHTML(s) {
    const st = G.campsState(s);
    let html = '<div class="small muted" style="margin-bottom:8px">Each camp gives <b>2 keys a day</b> (reset at midnight) and a higher tier once you clear the current one. Keys left today: ' + Object.values(st.keys).reduce((a, b) => a + b, 0) + ' · ad keys left: ' + adLeft(s, 'camp') + '</div><div class="col">';
    for (const c of G.CAMPS) {
      const keys = st.keys[c.k], tier = st.tier[c.k], max = st.max[c.k];
      const prev = G.campReward(s, c.k, tier, c.rounds || 1);
      html += '<div class="card" data-camp="' + c.k + '"><div class="row" style="align-items:flex-start"><div class="uic" style="width:42px;height:42px;border-radius:12px;display:grid;place-items:center;background:var(--panel3);color:' + c.color + ';flex:none">' + icon(c.icon) + '</div>' +
        '<div class="grow"><div class="row between"><b>' + c.name + '</b><span class="keys">' + '🔑'.repeat(keys) + '<span style="opacity:.3">' + '🔑'.repeat(Math.max(0, 2 - keys)) + '</span></span></div><div class="small muted">' + c.desc + '</div>' +
        '<div class="row" style="margin-top:6px;gap:6px"><button class="chip" data-tier="' + c.k + ':-1"' + (tier <= 1 ? ' disabled' : '') + '>◀</button><span class="chip gold">Tier ' + tier + ' / ' + max + '</span><button class="chip" data-tier="' + c.k + ':1"' + (tier >= max ? ' disabled' : '') + '>▶</button><span class="small muted">Opp ×' + G.campScale(tier).toFixed(2) + '</span></div>' +
        '<div class="row wrap" style="margin-top:6px;gap:6px"><span class="small muted">Reward:</span>' + ui.rewardPreview(prev) + '</div></div></div>' +
        '<div class="row" style="margin-top:8px">' + (keys > 0 ? '<button class="btn sm grow" data-run="' + c.k + '">Enter camp</button>' : '<button class="btn sm ghost grow" disabled>No keys until tomorrow</button>') +
        (adLeft(s, 'camp') && keys === 0 ? '<button class="btn sm green stack" data-adkey="' + c.k + '">+1 key<span class="sub">optional ad</span></button>' : '') + '</div></div>';
    }
    return html + '</div>';
  }
  function bindCamps(m, draw) {
    m.el.addEventListener('click', async (e) => {
      const s = S();
      const t = e.target.closest('[data-tier]');
      if (t) { const [k, d] = t.dataset.tier.split(':'); G.setCampTier(s, k, +d); BE.audio.play('click'); draw(m); return; }
      const r = e.target.closest('[data-run]');
      if (r) { runCamp(r.dataset.run, () => draw(m)); return; }
      const a = e.target.closest('[data-adkey]');
      if (a) {
        if (!adLeft(s, 'camp')) return;
        const ok = await BE.services.rewardedAd('camp');
        if (!ok.ok) { ui.toast('No key — the ad was not completed', '', 'tv'); return; }
        s.ads.counts.camp = (s.ads.counts.camp || 0) + 1;
        G.campsState(s).keys[a.dataset.adkey]++;
        ui.toast('+1 camp key', 'gold', 'check'); draw(m);
      }
    });
  }
  async function runCamp(k, done) {
    const s = S();
    const r = G.runCamp(s, k);
    if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); BE.audio.play('error'); return; }
    const c = G.CAMPS.find((x) => x.k === k);
    const m = ui.modal({ title: c.name + ' · Tier ' + r.tier, center: true, noClose: true, html: '<div class="col" data-cr></div><div data-cr2 style="margin-top:10px"></div>' });
    const list = $('[data-cr]', m.el);
    for (let i = 0; i < r.results.length; i++) {
      await new Promise((res) => setTimeout(res, 550));
      const x = r.results[i];
      list.insertAdjacentHTML('beforeend', '<div class="lb-row" style="animation:popIn .3s"><span class="rk" style="font-size:14px;color:' + (x.won ? 'var(--good)' : 'var(--bad)') + '">' + (x.won ? 'W' : 'L') + '</span><span>' + (r.results.length > 1 ? 'Round ' + (i + 1) + ' · ' : '') + U.esc(x.opp) + '</span><span class="num">' + x.score[0] + '-' + x.score[1] + '</span></div>');
      BE.audio.play(x.won ? 'cheer' : 'groan', { v: 0.6 });
    }
    await new Promise((res) => setTimeout(res, 400));
    BE.audio.play(r.cleared ? 'claim' : 'lose');
    if (r.cleared && r.newTier) BE.court.confetti(60);
    $('[data-cr2]', m.el).innerHTML = '<div style="text-align:center"><div class="h1" style="color:' + (r.cleared ? 'var(--gold)' : 'var(--bad)') + '">' + (r.cleared ? 'CAMP CLEARED' : r.won ? r.won + ' OF ' + r.rounds + ' ROUNDS' : 'NOT THIS TIME') + '</div>' +
      (r.newTier ? '<div class="small" style="color:var(--good)">Tier ' + r.newTier + ' unlocked!</div>' : '') +
      (r.granted.length ? '<div class="row wrap" style="justify-content:center;margin:8px 0">' + r.granted.map((g) => g.k === 'gear' ? ui.gearBadge(g.item) : ui.rewChip(g.k, g.v)).join(' ') + '</div>' : '<div class="small muted" style="margin:8px 0">Lower the tier with ◀ for a surer reward.</div>') +
      '<button class="btn gold wide" data-cdone>Collect</button></div>';
    m.el.addEventListener('click', (e) => { if (e.target.closest('[data-cdone]')) { m.close(); for (const g of r.granted) if (['cash', 'gems', 'tickets'].includes(g.k)) ui.flyCurrency(g.k, null, 6); BE.bus.emit('changed'); ui.updateBadges(S()); BE.play.renderHub(); done && done(); } });
  }

  // ---------- Boosts + Spin strip on the Home tab ----------
  function boostsHTML(s) {
    if (!E.unlocked(s, 'boosts')) return '';
    const now = Date.now();
    let html = '<div class="sec-title"><span class="h3">Boosts</span><span class="label">20 min · free once a day</span></div><div class="boosts">';
    for (const b of D.boosts) {
      const until = (s.buffs[b.k] || 0), left = until - now;
      const free = s.buffs.freeDay[b.k] !== U.dayKey();
      const ads = adLeft(s, 'boost');
      html += '<div class="boost' + (left > 0 ? ' on' : '') + '" style="--bc:' + b.color + '"><div class="row" style="gap:6px"><span class="bic">' + icon(b.icon) + '</span><div class="grow"><b>' + b.name + '</b><div class="small muted">' + b.desc + '</div></div></div>' +
        (left > 0 ? '<div class="row between" style="margin-top:6px"><span class="chip good">Active · ' + U.fmtTime(left / 1000) + '</span>' + (free || ads ? '<button class="btn xs ghost" data-act="boost" data-k="' + b.k + '">+20 min' + (free ? '' : ' (ad)') + '</button>' : '') + '</div>' :
          '<button class="btn sm wide ' + (free ? 'green' : ads ? 'ghost' : 'ghost') + '" style="margin-top:6px" data-act="boost" data-k="' + b.k + '"' + (free || ads ? '' : ' disabled') + '>' + (free ? 'Activate · free' : ads ? icon('tv') + ' Activate · optional ad' : 'Back tomorrow') + '</button>') + '</div>';
    }
    const sp = G.spinState(s);
    html += '<button class="boost spin" data-act="spin"><div class="row" style="gap:6px"><span class="bic" style="color:var(--gold)">' + icon('events') + '</span><div class="grow"><b>Halftime Spin</b><div class="small muted">' + (sp.freeLeft ? 'Free spin ready!' : sp.adLeft ? 'Extra spin · optional ad' : 'Next free spin tomorrow') + '</div></div></div><span class="chip ' + (sp.freeLeft ? 'gold' : '') + '" style="margin-top:6px;align-self:flex-start">' + (sp.freeLeft ? 'SPIN' : sp.adLeft ? 'SPIN (ad)' : 'Done today') + '</span></button>';
    return html + '</div>';
  }
  async function boost(k, el) {
    const s = S();
    const b = D.boosts.find((x) => x.k === k);
    const free = s.buffs.freeDay[k] !== U.dayKey();
    if (!free) {
      if (!adLeft(s, 'boost')) { ui.toast('Boost ads are done for today', '', 'tv'); return; }
      const r = await BE.services.rewardedAd('boost');
      if (!r.ok) { ui.toast('No boost — the ad was not completed', '', 'tv'); return; }
      s.ads.counts.boost = (s.ads.counts.boost || 0) + 1;
    } else s.buffs.freeDay[k] = U.dayKey();
    const res = G.activateBuff(s, k);
    BE.audio.play('milestone');
    if (el) ui.sparks(el, b.color, 16);
    BE.court.showBanner(b.name.toUpperCase() + '!', b.desc, b.color, 1.6);
    ui.toast(b.name + ' active for ' + U.fmtTime(res.left / 1000), 'gold', b.icon);
    BE.bus.emit('changed');
    if (BE.growth) BE.growth.render();
  }
  async function spin(el) {
    const s = S();
    const sp = G.spinState(s);
    if (!sp.freeLeft) {
      if (!sp.adLeft) { ui.toast('No spins left today', '', 'events'); return; }
      const r = await BE.services.rewardedAd('spin');
      if (!r.ok) { ui.toast('No spin — the ad was not completed', '', 'tv'); return; }
      s.ads.counts.spin = (s.ads.counts.spin || 0) + 1;
    }
    const res = G.spin(s);
    if (!res) return;
    const n = D.spinWheel.length, seg = 360 / n;
    const colors = D.spinWheel.map((w, i) => (i % 2 ? '#1d2750' : '#26326a'));
    const grad = 'conic-gradient(' + D.spinWheel.map((w, i) => colors[i] + ' ' + (i * seg) + 'deg ' + ((i + 1) * seg) + 'deg').join(',') + ')';
    const labels = D.spinWheel.map((w, i) => '<span class="wl" style="transform:rotate(' + (i * seg + seg / 2) + 'deg) translateY(-92px) rotate(-' + (i * seg + seg / 2) + 'deg)">' + w.label + '</span>').join('');
    const m = ui.modal({ center: true, noClose: true, html: '<div class="stack" style="align-items:center"><div class="h2">Halftime Spin</div><div class="wheel-wrap"><div class="needle">▼</div><div class="wheel" data-wheel style="background:' + grad + '">' + labels + '</div></div><div data-ws class="small muted" style="min-height:40px;text-align:center">Spinning…</div><button class="btn gold wide hidden" data-wdone>Collect</button></div>' });
    const wheel = $('[data-wheel]', m.el);
    const target = 360 * 5 + (360 - (res.idx * seg + seg / 2));
    BE.audio.play('drumroll', { dur: 2.2 });
    requestAnimationFrame(() => { wheel.style.transition = 'transform 2.4s cubic-bezier(.15,.8,.2,1)'; wheel.style.transform = 'rotate(' + target + 'deg)'; });
    setTimeout(() => {
      BE.audio.play('claim'); ui.sparks(wheel, '#ffd23f', 24);
      $('[data-ws]', m.el).innerHTML = '<div class="h3" style="color:var(--gold)">' + D.spinWheel[res.idx].label + '</div><div class="row wrap" style="justify-content:center;margin-top:4px">' + res.granted.map((g) => g.k === 'gear' ? ui.gearBadge(g.item) : ui.rewChip(g.k, g.v)).join(' ') + '</div>';
      $('[data-wdone]', m.el).classList.remove('hidden');
    }, 2500);
    m.el.addEventListener('click', (e) => { if (e.target.closest('[data-wdone]')) { m.close(); for (const g of res.granted) if (['cash', 'gems', 'tickets'].includes(g.k)) ui.flyCurrency(g.k, null, 6); BE.bus.emit('changed'); if (BE.growth) BE.growth.render(); } });
  }

  // ---------- Fan gifts over the court ----------
  const gift = { t: 90 + Math.random() * 120, el: null, life: 0 };
  function tickGift(dt) {
    const s = S();
    if (!s || !s.tutorial.done) return;
    if (gift.el) {
      gift.life -= dt;
      if (gift.life <= 0) removeGift();
      return;
    }
    gift.t -= dt;
    if (gift.t <= 0) showGift();
  }
  function showGift() {
    const wrap = $('[data-p="courtwrap"]');
    if (!wrap) return;
    const el = document.createElement('button');
    el.className = 'fangift';
    el.setAttribute('aria-label', 'Fan gift');
    el.innerHTML = icon('gift') + '<span>Fan gift!</span>';
    el.style.left = (15 + Math.random() * 55) + '%';
    el.style.top = (30 + Math.random() * 40) + '%';
    el.addEventListener('click', (e) => { e.stopPropagation(); claimGift(el); });
    wrap.appendChild(el);
    gift.el = el; gift.life = 25;
  }
  function removeGift() { if (gift.el) gift.el.remove(); gift.el = null; gift.t = 150 + Math.random() * 150; }
  function claimGift(el) {
    const s = S();
    const g = G.claimGift(s);
    BE.audio.play('coin');
    ui.sparks(el, '#ffd23f', 14);
    for (const x of g) if (['cash', 'gems', 'tickets'].includes(x.k)) ui.flyCurrency(x.k, el, 6);
    ui.toast('Fan gift: ' + g.map((x) => (x.k === 'cash' ? '$' : '') + U.fmt(x.v) + ' ' + ui.curName[x.k]).join(', '), 'gold', 'gift');
    removeGift();
    BE.bus.emit('changed');
  }

  const act = {
    boost: (d, el) => boost(d.k, el),
    spin: (d, el) => spin(el),
  };

  BE.camps = { campsHTML, bindCamps, runCamp, boostsHTML, boost, spin, tickGift, showGift, act };
})(typeof window !== 'undefined' ? window : globalThis);
