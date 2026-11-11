/* Basketball Empire — Home tab: Team Growth panel (franchise stats, x1/x10/x100/MAX) and the squad strip.
 * This is the "always something cheap to tap" loop: every row's next level should be affordable within
 * seconds of income, and every tap visibly raises team power. */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, A = BE.athletes;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;
  const MULTS = [1, 10, 100, 'max'];
  let combo = 0, comboT = 0;

  function multLabel(m) { return m === 'max' ? 'MAX' : '×' + m; }

  function growthHTML(s) {
    const cap = E.growthCap(s);
    const mult = s.settings.buyMult || 1;
    const tp = E.teamPower(s);
    let html = '<div class="sec-title"><span class="h3">Team Growth</span><span class="mults">' +
      MULTS.map((m) => '<button class="chip' + (m === mult ? ' on' : '') + '" data-act="buymult" data-n="' + m + '">' + multLabel(m) + '</button>').join('') + '</span></div>';
    html += '<div class="grow-head"><span class="label">Team power</span><span class="power-num" data-g="tp">⚡ ' + U.fmt(tp) + '</span><span class="label" style="margin-left:auto">Cap Lv ' + cap + ' · rises each world</span></div>';
    html += '<div class="col" style="gap:6px">';
    for (const g of D.growth) {
      const lvl = s.growth[g.k] || 0;
      const maxed = lvl >= cap;
      const q = maxed ? { n: 0, cost: 0 } : E.growthQuote(s, g.k, mult);
      const can = q.n > 0 && s.cash >= q.cost;
      html += '<div class="grow-row" data-row="' + g.k + '"><div class="gic" style="color:' + g.color + '">' + icon(g.icon) + '</div>' +
        '<div class="gt"><div class="n">' + g.name + ' <span class="lv">Lv ' + lvl + '</span></div><div class="e">' + E.growthEffectText(g, lvl) + '</div></div>' +
        (maxed ? '<button class="btn sm ghost stack" disabled>MAX<span class="sub">World ' + (E.worldOf(s.best) + 2) + '</span></button>' :
          '<button class="btn sm stack ' + (can ? 'green' : 'ghost') + '" data-act="grow" data-k="' + g.k + '" data-tut="grow-' + g.k + '"' + (q.n > 0 ? '' : ' disabled') + '>+' + (q.n || 1) + '<span class="sub">$' + U.fmt(q.n ? q.cost : E.growthCost(s, g.k, 1)) + '</span></button>') + '</div>';
    }
    return html + '</div>';
  }

  function squadHTML(s) {
    const g = Math.min(s.run.cleared, 99);
    const size = E.sizeOf(g);
    let html = '<div class="sec-title"><span class="h3">Your squad</span><span class="label">' + D.formats[E.formatOf(g)].label + ' · <button class="chip" data-act="goteam" style="padding:1px 7px">Manage</button></span></div><div class="lineup">';
    for (let i = 0; i < 5; i++) {
      const uid = s.lineup[i];
      const a = uid && s.rosterByUid[uid];
      if (i >= size) { html += '<div class="slot-empty slot-locked">' + icon('lock') + '<br>Opens<br>' + E.stageLabel(E.slotUnlockG(i)) + '</div>'; continue; }
      if (!a) { html += '<button class="slot-empty" data-act="gorecruit">' + icon('plus') + '<br>Recruit</button>'; continue; }
      const c = E.levelCost(s, a, 1);
      const maxed = a.lvl >= E.maxLevel(s);
      html += '<div>' + ui.athleteCard(s, a) + '<div class="lu-actions"><button class="btn xs ' + (s.cash >= c && !maxed ? 'green' : 'ghost') + '" data-act="homelvl" data-uid="' + a.uid + '"' + (maxed ? ' disabled' : '') + '>' + (maxed ? 'MAX' : '+1 $' + U.fmt(c)) + '</button></div></div>';
    }
    return html + '</div>';
  }

  function render() {
    const s = S();
    const ge = $('[data-p="growth"]'), se = $('[data-p="squad"]'), be = $('[data-p="boosts"]');
    if (ge) ge.innerHTML = growthHTML(s);
    if (be && BE.camps) be.innerHTML = BE.camps.boostsHTML(s);
    if (se) se.innerHTML = squadHTML(s);
  }
  // Cheap periodic refresh while idle on the Home tab (costs and affordability change every second)
  function refresh() {
    if (ui.current() !== 'play' || ui.anyModal()) return;
    if (performance.now() - (BE.main ? BE.main.lastPointer : 0) < 900) return;
    render();
  }

  function buy(k, el) {
    const s = S();
    const mult = s.settings.buyMult || 1;
    const q = E.growthQuote(s, k, mult);
    if (q.n <= 0) { ui.toast(s.growth[k] >= E.growthCap(s) ? 'Capped for now: the cap rises with each new world' : 'Not enough cash', 'bad', 'cash'); BE.audio.play('error'); return; }
    const before = E.teamPower(s);
    const r = E.upgradeGrowth(s, k, q.n);
    if (!r.ok) { ui.toast(r.reason, 'bad', 'cash'); BE.audio.play('error'); return; }
    const after = E.teamPower(s);
    const now = performance.now();
    combo = now - comboT < 900 ? combo + 1 : 0; comboT = now;
    BE.audio.play('upgrade', { combo });
    BE.services.haptic(8);
    if (el) {
      const pct = (after / before - 1) * 100;
      ui.floatText(pct > 0.05 ? '+' + (pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)) + '% POWER' : '+' + r.n + ' Lv', el, '#38d996');
      ui.sparks(el, '#38d996', 6 + Math.min(14, r.n));
    }
    render();
    const row = $('[data-row="' + k + '"]'); ui.flash(row);
    BE.bus.emit('growth', { k, n: r.n });
    BE.bus.emit('changed');
  }

  const act = {
    grow: (d, el) => buy(d.k, el),
    buymult: (d) => { const s = S(); s.settings.buyMult = d.n === 'max' ? 'max' : +d.n; BE.audio.play('click'); render(); },
    homelvl: (d, el) => { const a = S().rosterByUid[d.uid]; if (a && BE.team.doLevel(a, 1, el)) render(); },
  };

  BE.growth = { render, refresh, act, growthHTML, squadHTML };
})(typeof window !== 'undefined' ? window : globalThis);
