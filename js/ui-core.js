/* Basketball Empire — UI core: icons, modals, toasts, reward FX, HUD, navigation, tutorial coach */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, A = BE.athletes;
  const $ = (sel, el) => (el || document).querySelector(sel);
  const $$ = (sel, el) => Array.from((el || document).querySelectorAll(sel));

  // ---------- Icons (24x24 stroke icons) ----------
  const P = {
    ball: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3v18M5.6 5.6c3 2.6 3 10.2 0 12.8M18.4 5.6c-3 2.6-3 10.2 0 12.8"/>',
    jersey: '<path d="M8 3l-4 3v4h3v11h10V10h3V6l-4-3c-.5 1.7-2 3-4 3S8.5 4.7 8 3z"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="2"/><path d="M9 3h10a2 2 0 012 2v13"/><path d="M8.5 11l1 2 2.2.3-1.6 1.5.4 2.2-2-1-2 1 .4-2.2L5.3 13.3l2.2-.3z"/>',
    empire: '<path d="M3 21h18M5 21V10l7-5 7 5v11M9 21v-6h6v6M9 11h.01M15 11h.01"/>',
    shop: '<path d="M5 8h14l-1 13H6L5 8z"/><path d="M9 8V6a3 3 0 016 0v2"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.7 1.7 0 00.3 1.8l.1.1a2 2 0 11-2.8 2.8l-.1-.1a1.7 1.7 0 00-1.8-.3 1.7 1.7 0 00-1 1.5V21a2 2 0 11-4 0v-.1a1.7 1.7 0 00-1.1-1.5 1.7 1.7 0 00-1.8.3l-.1.1a2 2 0 11-2.8-2.8l.1-.1a1.7 1.7 0 00.3-1.8 1.7 1.7 0 00-1.5-1H3a2 2 0 110-4h.1a1.7 1.7 0 001.5-1.1 1.7 1.7 0 00-.3-1.8l-.1-.1a2 2 0 112.8-2.8l.1.1a1.7 1.7 0 001.8.3H9a1.7 1.7 0 001-1.5V3a2 2 0 114 0v.1a1.7 1.7 0 001 1.5 1.7 1.7 0 001.8-.3l.1-.1a2 2 0 112.8 2.8l-.1.1a1.7 1.7 0 00-.3 1.8V9a1.7 1.7 0 001.5 1H21a2 2 0 110 4h-.1a1.7 1.7 0 00-1.5 1z"/>',
    map: '<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2-6-2z"/><path d="M9 4v14M15 6v14"/>',
    missions: '<rect x="5" y="4" width="14" height="17" rx="2"/><path d="M9 4V3h6v1M9 10l1.5 1.5L14 8M9 16h6"/>',
    daily: '<rect x="3" y="8" width="18" height="13" rx="2"/><path d="M12 8v13M3 12h18M12 8c-2-4-6-4-6-1.5S9 8 12 8zm0 0c2-4 6-4 6-1.5S15 8 12 8z"/>',
    pass: '<path d="M3 8l4 3 5-6 5 6 4-3-2 11H5L3 8z"/><path d="M5 19h14"/>',
    events: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.5"/>',
    social: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c.6-3.6 3.2-5.5 6.5-5.5s5.9 1.9 6.5 5.5"/><circle cx="17" cy="9" r="2.6"/><path d="M16 14.6c2.8-.3 5 1.3 5.5 4.4"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 01-8 0V4z"/><path d="M8 6H4v1.5A3.5 3.5 0 007.5 11M16 6h4v1.5a3.5 3.5 0 01-3.5 3.5M12 13v4M8 21h8M9 17h6v4H9z"/>',
    lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1L3.2 9.5l6.1-.9z"/>',
    fire: '<path d="M12 21c-4 0-7-2.7-7-6.5 0-3 2-5 3-6.5.3 2 1.5 3 2.5 3.5C10 8 11 5 14 3c0 3 5 5.5 5 11 0 4-3 7-7 7z"/><path d="M12 21c-1.7 0-3-1.2-3-3 0-1.5 1.5-2.5 2-4 1 1 4 2 4 4.2 0 1.6-1.3 2.8-3 2.8z"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7l1-8z"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6l8-3z"/><path d="M9 12l2 2 4-4"/>',
    clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
    up: '<path d="M12 19V5M5 12l7-7 7 7"/>',
    shoe: '<path d="M3 16v-4l4-1 2-4h3l1 3c2 1 5 1 7 2l1 4H3z"/><path d="M3 16v3h18v-3"/>',
    headband: '<path d="M4 13c0-5 3.6-8 8-8s8 3 8 8"/><path d="M3.5 12.5c5-2 12-2 17 0l-.3 3c-5-1.8-11.4-1.8-16.4 0z"/>',
    wrist: '<path d="M8 3v5M16 3v5M8 16v5M16 16v5"/><rect x="6" y="8" width="12" height="8" rx="2"/>',
    sleeve: '<path d="M8 3h8l-1 18H9L8 3z"/><path d="M8.4 9h7.2M8.7 15h6.6"/>',
    dumbbell: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
    whistle: '<circle cx="9" cy="14" r="5"/><path d="M12 10l9-4v5h-6"/><circle cx="9" cy="14" r="1.2"/>',
    court: '<rect x="3" y="5" width="18" height="14" rx="1"/><path d="M12 5v14"/><circle cx="12" cy="12" r="3"/><path d="M3 9h3v6H3M21 9h-3v6h3"/>',
    gym: '<path d="M6 8v8M3 10v4M18 8v8M21 10v4M6 12h12"/>',
    train: '<path d="M4 20l5-5M9 15l2-6 6-2-2 6-6 2zM14 5l5 5"/>',
    merch: '<path d="M4 9l2-5h12l2 5"/><path d="M4 9h16v11H4z"/><path d="M9 20v-5h6v5"/>',
    hq: '<rect x="5" y="3" width="14" height="18" rx="1"/><path d="M9 7h2M13 7h2M9 11h2M13 11h2M9 15h2M13 15h2M11 21v-3h2v3"/>',
    scout: '<circle cx="10" cy="10" r="6"/><path d="M14.5 14.5L21 21"/>',
    stadium: '<ellipse cx="12" cy="9" rx="9" ry="4"/><path d="M3 9v6c0 2.2 4 4 9 4s9-1.8 9-4V9"/><path d="M8 18.5v-4M16 18.5v-4"/>',
    academy: '<path d="M2 9l10-5 10 5-10 5L2 9z"/><path d="M6 11v5c3 2 9 2 12 0v-5"/>',
    medical: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M12 7v10M7 12h10"/>',
    play: '<path d="M7 4l13 8-13 8V4z"/>',
    ff: '<path d="M4 5l8 7-8 7V5zM12 5l8 7-8 7V5z"/>',
    tactics: '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8l3 3M11 8l-3 3"/><circle cx="15.5" cy="15.5" r="2"/><path d="M10 16c1.5-3 3-4 4-6"/>',
    legacy: '<path d="M12 4l2.2 4.4 4.8.7-3.5 3.4.8 4.8L12 15l-4.3 2.3.8-4.8L5 9.1l4.8-.7z"/><path d="M4 20c2-1 4-1 8-1s6 0 8 1"/>',
    division: '<path d="M12 3l9 5-9 5-9-5 9-5z"/><path d="M3 13l9 5 9-5M3 17l9 5 9-5"/>',
    tv: '<rect x="3" y="5" width="18" height="13" rx="2"/><path d="M8 21h8M10 10l5 2.5-5 2.5v-5z"/>',
    craft: '<path d="M14 4l6 6-3 3-6-6 3-3z"/><path d="M11 7L3 15l3 3 8-8M3 21l3-3"/>',
    cash: '<rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="3"/><path d="M6 12h.01M18 12h.01"/>',
    gem: '<path d="M6 3h12l4 6-10 12L2 9l4-6z"/><path d="M2 9h20M9 3l3 18M15 3l-3 18"/>',
    ticket: '<path d="M3 8a2 2 0 002-2h14a2 2 0 002 2v2a2 2 0 000 4v2a2 2 0 00-2 2H5a2 2 0 00-2-2v-2a2 2 0 000-4V8z"/><path d="M14 6v12" stroke-dasharray="2 2"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6M12 7.5h.01"/>',
    share: '<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="M8.2 10.8l7.6-3.6M8.2 13.2l7.6 3.6"/>',
    sound: '<path d="M4 9h4l5-4v14l-5-4H4V9z"/><path d="M16.5 8.5a5 5 0 010 7M19 6a8.5 8.5 0 010 12"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    swap: '<path d="M7 4L3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    gift: '<rect x="3" y="8" width="18" height="5" rx="1"/><path d="M5 13v8h14v-8M12 8v13M12 8c-2.5 0-4.5-1.3-4.5-3S9 2.5 10 3c1.5.7 2 3.3 2 5zm0 0c2.5 0 4.5-1.3 4.5-3S15 2.5 14 3c-1.5.7-2 3.3-2 5z"/>',
    coin: '<circle cx="12" cy="12" r="9"/><path d="M12 7v10M9.5 9.5c0-1.4 1.1-2 2.5-2s2.5.7 2.5 2-1.1 1.8-2.5 2.2-2.5.9-2.5 2.3 1.1 2 2.5 2 2.5-.6 2.5-2"/>',
  };
  function icon(k, cls) {
    return '<svg class="i' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[k] || P.ball) + '</svg>';
  }
  const gearIcon = (type) => icon((D.gearTypes.find((t) => t.k === type) || {}).icon || 'gear');
  const ballArt = '<svg viewBox="0 0 100 100" class="ballart"><defs><radialGradient id="bg1" cx="35%" cy="30%"><stop offset="0" stop-color="#ffb066"/><stop offset="1" stop-color="#d9531e"/></radialGradient></defs><circle cx="50" cy="50" r="46" fill="url(#bg1)" stroke="#3a1606" stroke-width="3"/><path d="M4 50h92M50 4v92M17 17c13 11 13 55 0 66M83 17c-13 11-13 55 0 66" stroke="#3a1606" stroke-width="3" fill="none"/></svg>';
  const trophyArt = '<svg viewBox="0 0 120 120"><defs><linearGradient id="tg" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stop-color="#fff3b0"/><stop offset=".45" stop-color="#ffd23f"/><stop offset="1" stop-color="#b37800"/></linearGradient></defs><path d="M36 14h48v30c0 16-11 28-24 28S36 60 36 44z" fill="url(#tg)" stroke="#7a5200" stroke-width="2"/><path d="M36 22H20c0 16 8 24 18 26M84 22h16c0 16-8 24-18 26" fill="none" stroke="url(#tg)" stroke-width="6"/><rect x="54" y="70" width="12" height="16" fill="url(#tg)"/><rect x="38" y="86" width="44" height="14" rx="3" fill="url(#tg)" stroke="#7a5200" stroke-width="2"/><circle cx="60" cy="38" r="10" fill="#ff7a2f" stroke="#7a2a00" stroke-width="2"/><path d="M50 38h20M60 28v20" stroke="#7a2a00" stroke-width="1.5"/></svg>';

  const curIcon = { cash: '$', gems: '◆', tickets: '★', eventTickets: '✦', tp: 'T', scrap: 'S', shards: '✧', passXp: 'XP', gear: 'G' };
  const curName = { cash: 'Cash', gems: 'Gems', tickets: 'Pro Tickets', eventTickets: 'Event Tickets', tp: 'Training Pts', scrap: 'Scrap', shards: 'Star Shards', passXp: 'Pass XP', gear: 'Gear' };
  function rewChip(k, v) {
    return '<span class="rew ' + k + '"><span class="ico">' + curIcon[k] + '</span>' + (k === 'cash' ? '$' : '') + U.fmt(v) + '</span>';
  }
  // Describe a reward definition (before granting)
  function rewardPreview(r) {
    const out = [];
    if (!r) return '';
    const S = BE.game_state;
    if (r.cash) out.push(rewChip('cash', r.cash * E.stageReward(S, E.farmG(S))));
    if (r.cashMinutes) out.push('<span class="rew cash"><span class="ico">$</span>' + r.cashMinutes + ' min</span>');
    for (const k of ['gems', 'tickets', 'eventTickets', 'scrap', 'shards', 'passXp']) if (r[k]) out.push(rewChip(k, r[k]));
    if (r.tp) out.push('<span class="rew tp"><span class="ico">T</span>' + U.fmt(r.tp * Math.max(1, E.tpPerSec(S) * 60)) + '</span>');
    if (r.tpHours) out.push('<span class="rew tp"><span class="ico">T</span>' + r.tpHours + 'h training</span>');
    if (r.gearChest) out.push('<span class="rew gear"><span class="ico">G</span>' + r.gearChest + ' gear chest' + (r.gearChest > 1 ? 's' : '') + '</span>');
    if (r.cosmetic) out.push('<span class="chip gold">Cosmetic</span>');
    return out.join(' ');
  }

  // ---------- Toasts ----------
  function toast(text, kind, ic) {
    const root = $('#toast-root');
    if (!root) return;
    const el = document.createElement('div');
    el.className = 'toast ' + (kind || '');
    el.innerHTML = '<span class="ti">' + icon(ic || 'info') + '</span><span>' + text + '</span>';
    root.appendChild(el);
    while (root.children.length > 3) root.removeChild(root.firstChild);
    setTimeout(() => { el.classList.add('out'); setTimeout(() => el.remove(), 260); }, 2600);
  }
  BE.bus.on('toast', (t) => toast(t.text, t.kind, t.icon));

  // ---------- Modals ----------
  const stack = [];
  function modal(opts) {
    const root = $('#modal-root');
    const el = document.createElement('div');
    el.className = 'modal' + (opts.center ? ' center' : '');
    el.innerHTML = '<div class="scrim"></div><div class="sheet" role="dialog" aria-modal="true">' + (opts.center ? '' : '<div class="grabber"></div>') +
      (opts.title !== undefined ? '<div class="sheet-head"><div class="h2">' + opts.title + '</div>' + (opts.noClose ? '' : '<button class="close-x" data-close aria-label="Close">' + icon('x') + '</button>') + '</div>' : '') +
      '<div class="sheet-body"></div></div>';
    const body = $('.sheet-body', el);
    if (typeof opts.html === 'string') body.innerHTML = opts.html;
    root.appendChild(el);
    const m = {
      el, body, opts,
      close(v) {
        if (m.closed) return;
        m.closed = true;
        el.remove();
        const i = stack.indexOf(m); if (i >= 0) stack.splice(i, 1);
        if (opts.onClose) opts.onClose(v);
        BE.bus.emit('modal:closed', m);
      },
      set(html) { body.innerHTML = html; },
    };
    if (!opts.noClose) {
      $('.scrim', el).addEventListener('click', () => m.close());
      el.addEventListener('click', (e) => { if (e.target.closest('[data-close]')) { BE.audio.play('click'); m.close(); } });
    }
    stack.push(m);
    if (opts.render) opts.render(m);
    return m;
  }
  function topModal() { return stack[stack.length - 1]; }
  function closeAll() { stack.slice().forEach((m) => m.close()); }
  function anyModal() { return stack.length > 0; }

  function confirmBox(title, html, okText, opts) {
    opts = opts || {};
    return new Promise((resolve) => {
      const m = modal({
        title, center: true, onClose: (v) => resolve(!!v),
        html: '<div class="stack">' + html + '<div class="row"><button class="btn ghost grow" data-close>' + (opts.cancel || 'Cancel') + '</button><button class="btn grow ' + (opts.cls || '') + '" data-ok>' + okText + '</button></div></div>',
      });
      $('[data-ok]', m.el).addEventListener('click', () => { BE.audio.play('click'); m.close(true); });
    });
  }

  // ---------- Reward FX ----------
  function hudTarget(k) {
    const map = { cash: '.cur.cash', gems: '.cur.gems', tickets: '.cur.tix', eventTickets: '.cur.tix' };
    return $(map[k] || '.cur.cash');
  }
  function flyCurrency(k, fromEl, n) {
    const to = hudTarget(k);
    if (!to || !BE.game_state || BE.game_state.settings.reduceMotion) return;
    const fx = $('#fx-root');
    const fr = fromEl && fromEl.getBoundingClientRect ? fromEl.getBoundingClientRect() : { left: innerWidth / 2 - 20, top: innerHeight / 2, width: 40, height: 40 };
    const tr = to.getBoundingClientRect();
    const count = Math.min(10, n || 6);
    const cls = k === 'gems' ? 'gems' : k === 'cash' ? 'cash' : 'tix';
    for (let i = 0; i < count; i++) {
      const d = document.createElement('div');
      d.className = 'fly ' + cls;
      d.textContent = curIcon[k] || '$';
      const sx = fr.left + fr.width / 2 + (Math.random() - 0.5) * 60, sy = fr.top + fr.height / 2 + (Math.random() - 0.5) * 40;
      d.style.left = sx + 'px'; d.style.top = sy + 'px';
      fx.appendChild(d);
      const dx = tr.left + 10 - sx, dy = tr.top + 6 - sy;
      const anim = d.animate([
        { transform: 'translate(0,0) scale(.6)', opacity: 0 },
        { transform: 'translate(' + (Math.random() - 0.5) * 40 + 'px,' + (-20 - Math.random() * 30) + 'px) scale(1.1)', opacity: 1, offset: 0.25 },
        { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(.7)', opacity: 0.9 },
      ], { duration: 650 + i * 45, easing: 'cubic-bezier(.5,0,.6,1)' });
      anim.onfinish = () => { d.remove(); to.classList.remove('bump'); void to.offsetWidth; to.classList.add('bump'); };
    }
    setTimeout(() => BE.audio.play('coin'), 600);
  }
  function floatText(text, el, color) {
    const fx = $('#fx-root');
    const r = el.getBoundingClientRect();
    const d = document.createElement('div');
    d.className = 'floatnum';
    d.textContent = text;
    if (color) d.style.color = color;
    d.style.left = r.left + r.width / 2 + 'px'; d.style.top = r.top - 6 + 'px';
    fx.appendChild(d);
    setTimeout(() => d.remove(), 950);
  }
  function sparks(el, color, n) {
    if (!el || (BE.game_state && BE.game_state.settings.reduceMotion)) return;
    const fx = $('#fx-root');
    const r = el.getBoundingClientRect();
    for (let i = 0; i < (n || 12); i++) {
      const s = document.createElement('div');
      s.className = 'spark';
      s.style.background = color || '#ffd23f';
      s.style.left = r.left + r.width / 2 + 'px'; s.style.top = r.top + r.height / 2 + 'px';
      fx.appendChild(s);
      const a = Math.random() * Math.PI * 2, v = 30 + Math.random() * 60;
      s.animate([{ transform: 'translate(0,0) scale(1)', opacity: 1 }, { transform: 'translate(' + Math.cos(a) * v + 'px,' + Math.sin(a) * v + 'px) scale(.2)', opacity: 0 }], { duration: 500 + Math.random() * 300, easing: 'cubic-bezier(.2,.8,.3,1)' }).onfinish = () => s.remove();
    }
  }
  function flash(el) { if (!el) return; el.classList.remove('flash-up'); void el.offsetWidth; el.classList.add('flash-up'); }

  // Generic "you got stuff" popup from a granted list [{k,v}|{k:'gear',item}]
  function rewardsPopup(title, granted, opts) {
    opts = opts || {};
    const items = (granted || []).map((g) => {
      if (g.k === 'gear') return '<div class="row" style="justify-content:center">' + gearBadge(g.item) + '<div class="small">' + gearName(g.item) + '</div></div>';
      if (g.k === 'cosmetic') return '<span class="chip gold">New look: ' + (D.cosmetics.find((c) => c.k === g.v) || {}).name + '</span>';
      return rewChip(g.k, g.v);
    }).join(' ');
    const m = modal({
      title: '', center: true, noClose: false,
      html: '<div class="stack" style="text-align:center;align-items:center"><div class="h1" style="color:var(--gold)">' + title + '</div>' + (opts.sub ? '<div class="muted">' + opts.sub + '</div>' : '') +
        '<div class="row wrap" style="justify-content:center;gap:10px;font-size:16px">' + items + '</div>' +
        '<button class="btn gold wide" data-close>' + (opts.ok || 'Collect') + '</button></div>',
      onClose: () => {
        const seen = {};
        for (const g of granted || []) if (['cash', 'gems', 'tickets', 'eventTickets'].includes(g.k) && !seen[g.k]) { seen[g.k] = 1; flyCurrency(g.k, null, 8); }
        if (opts.onClose) opts.onClose();
      },
    });
    BE.audio.play('claim');
    return m;
  }

  // ---------- Shared render helpers ----------
  function gearName(it) {
    const t = D.gearTypes.find((x) => x.k === it.type);
    return D.worlds[it.set].set + ' ' + t.name;
  }
  function gearBadge(it, extra) {
    if (!it) return '<div class="gicon empty">' + icon('plus') + '</div>';
    return '<div class="gicon rar r' + it.rarity + '"' + (extra || '') + '>' + gearIcon(it.type) + '<span class="glv">' + it.lvl + '</span></div>';
  }
  function stars(n) { return '★'.repeat(n) + '<span style="opacity:.25">' + '★'.repeat(5 - n) + '</span>'; }
  function athleteCard(S, a, opts) {
    opts = opts || {};
    const t = A.tpl(a.cid);
    const cos = BE.game.cosmetic(S);
    const ovr = E.athleteOvr(S, a);
    const inl = S.lineup.includes(a.uid);
    return '<button class="acard rar r' + t.rarity + (inl && opts.markLineup ? ' inlineup' : '') + '" data-act="athlete" data-uid="' + a.uid + '">' +
      '<div class="in"><div class="pt">' + A.portraitSVG(t, { colors: cos.jersey, gear: BE.game.gearVis(S, a) }) +
      '<div class="ovr">' + ovr + '<small>' + t.pos + '</small></div><div class="lv">Lv ' + a.lvl + '</div><div class="stars">' + stars(a.stars) + '</div>' + (a.isNew ? '<span class="newtag">NEW</span>' : '') + '</div>' +
      '<div class="nm"><div class="n">' + U.esc(t.first[0] + '. ' + t.last) + '</div><div class="p">' + (opts.sub || ('⚡ ' + U.fmt(E.athletePower(S, a)))) + '</div></div></div></button>';
  }
  function templateCard(t, owned, opts) {
    opts = opts || {};
    return '<button class="acard rar r' + t.rarity + (owned ? '' : ' silhouette') + '" data-act="' + (opts.act || 'catalog') + '" data-cid="' + t.id + '">' +
      '<div class="in"><div class="pt">' + A.portraitSVG(t, {}) + (owned ? '<div class="ovr">' + A.ovrFromAttrs(t.attrs, t.pos) + '<small>' + t.pos + '</small></div>' : '') + '</div>' +
      '<div class="nm"><div class="n">' + (owned ? U.esc(t.first[0] + '. ' + t.last) : '???') + '</div><div class="p">' + D.rarities[t.rarity].name + '</div></div></div></button>';
  }
  function crestHTML(S) {
    const cos = BE.game.cosmetic(S);
    const init = S.franchise.name.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
    return '<div class="crest" style="background:linear-gradient(160deg,' + cos.jersey[0] + ',' + A.shade(cos.jersey[0], -0.25) + ')">' + U.esc(init) + '</div>';
  }

  // ---------- HUD ----------
  const shown = { cash: 0, gems: 0, tickets: 0 };
  function renderHUD(S) {
    const hud = $('#hud');
    hud.innerHTML =
      '<button class="franchise-chip" data-act="franchise">' + crestHTML(S) + '<div style="min-width:0"><div class="fname">' + U.esc(S.franchise.name) + '</div><div class="fsub">' +
      (S.prestige.count ? '<span style="color:var(--gold)">★' + S.prestige.count + '</span> · ' : '') + 'World ' + (E.worldOf(S.run.cleared) + 1) + '</div></div></button>' +
      '<div class="cur cash" title="Cash"><span class="ico">$</span><span data-hud="cash">0</span></div>' +
      '<button class="cur gems" data-act="goshop" title="Gems"><span class="ico">◆</span><span data-hud="gems">0</span></button>' +
      '<button class="cur tix" data-act="gorecruit" title="Pro Scout tickets"><span class="ico">★</span><span data-hud="tickets">0</span></button>' +
      '<button class="hud-btn" data-act="settings" aria-label="Settings">' + icon('gear') + '</button>';
    shown.cash = S.cash; shown.gems = S.gems; shown.tickets = S.tickets;
    updateHUD(S, 1);
  }
  function updateHUD(S, dt) {
    for (const k of ['cash', 'gems', 'tickets']) {
      const target = S[k];
      const cur = shown[k];
      if (Math.abs(target - cur) < 1e-9 || !isFinite(cur)) shown[k] = target;
      else shown[k] = cur + (target - cur) * Math.min(1, dt * 8);
      if (Math.abs(target - shown[k]) / Math.max(1, Math.abs(target)) < 0.001) shown[k] = target;
      const el = $('[data-hud="' + k + '"]');
      if (el) el.textContent = k === 'cash' ? U.fmt(shown[k]) : U.fmt(Math.round(shown[k]));
    }
  }

  // ---------- Navigation ----------
  const NAV = [
    { k: 'play', label: 'Play', icon: 'ball' },
    { k: 'team', label: 'Team', icon: 'jersey' },
    { k: 'recruit', label: 'Recruit', icon: 'cards', feature: 'recruit' },
    { k: 'empire', label: 'Empire', icon: 'empire', feature: 'facilities' },
    { k: 'shop', label: 'Shop', icon: 'shop', feature: 'shop' },
  ];
  let current = 'play';
  function navUnlocked(S, n) {
    if (n.k === 'team') return S.tutorial.done || S.tutorial.step >= 2;
    if (n.k === 'recruit') return E.unlocked(S, 'recruit') && (S.tutorial.done || S.tutorial.step >= 4);
    return !n.feature || E.unlocked(S, n.feature);
  }
  function renderNav(S) {
    const nav = $('#nav');
    nav.innerHTML = NAV.map((n) => {
      const ok = navUnlocked(S, n);
      return '<button class="nav-btn' + (n.k === current ? ' active' : '') + (ok ? '' : ' locked') + '" data-act="nav" data-k="' + n.k + '" data-nav="' + n.k + '">' + icon(ok ? n.icon : 'lock') + '<span>' + n.label + '</span><span class="badge hidden"></span></button>';
    }).join('');
    updateBadges(S);
  }
  function updateBadges(S) {
    const b = BE.ui.badges ? BE.ui.badges(S) : {};
    for (const n of NAV) {
      const el = $('[data-nav="' + n.k + '"] .badge');
      if (!el) continue;
      const v = b[n.k] || 0;
      el.classList.toggle('hidden', !v || !navUnlocked(S, n));
      el.textContent = v > 9 ? '9+' : v === true ? '!' : String(v);
    }
  }
  function go(k) {
    const S = BE.game_state;
    const n = NAV.find((x) => x.k === k);
    if (n && !navUnlocked(S, n)) {
      const f = n.feature && D.features[n.feature];
      toast(f ? 'Unlocks at ' + stageName(f.g) : 'Keep playing to unlock', '', 'lock');
      BE.audio.play('error');
      return;
    }
    current = k;
    $$('.screen').forEach((s) => s.classList.toggle('active', s.id === 'scr-' + k));
    $$('.nav-btn').forEach((b) => b.classList.toggle('active', b.dataset.k === k));
    BE.audio.play('tab');
    BE.ui.renderScreen(k);
    BE.bus.emit('nav', k);
  }
  function stageName(g) { return 'World ' + (E.worldOf(g) + 1) + ' · Game ' + (E.stageOf(g) + 1); }

  // ---------- Tutorial coach ----------
  const coachFace = () => A.portraitSVG({ look: { skin: 5, hair: 'bald', hairColor: '#d6d6d6', facial: 'beard', build: 'big', brow: 1, mouth: 0, goggles: false, tattoo: false }, number: 'C' }, { colors: ['#1b1f3a', '#ffd23f'], number: '' });
  function coach(text, opts) {
    opts = opts || {};
    clearCoach();
    const root = $('#coach-root');
    if (opts.target) {
      const t = typeof opts.target === 'string' ? $(opts.target) : opts.target;
      if (t) {
        const r = t.getBoundingClientRect();
        const sp = document.createElement('div');
        sp.className = 'spot';
        sp.style.left = r.left - 4 + 'px'; sp.style.top = r.top - 4 + 'px'; sp.style.width = r.width + 8 + 'px'; sp.style.height = r.height + 8 + 'px';
        root.appendChild(sp);
        const f = document.createElement('div');
        f.className = 'finger'; f.textContent = '👆';
        f.style.left = r.left + r.width / 2 - 8 + 'px'; f.style.top = r.bottom + 2 + 'px';
        if (r.bottom > innerHeight - 70) { f.style.top = r.top - 40 + 'px'; f.textContent = '👇'; }
        root.appendChild(f);
      }
    }
    const c = document.createElement('div');
    c.className = 'coach';
    const pos = opts.pos || 'bottom';
    if (pos === 'top') c.style.top = 'calc(64px + env(safe-area-inset-top, 0px))';
    else if (pos === 'mid') c.style.top = '38%';
    else c.style.bottom = 'calc(84px + env(safe-area-inset-bottom, 0px))';
    c.innerHTML = '<div class="face">' + coachFace() + '</div><div class="bubble"><div class="who">Coach Pops</div>' + text +
      (opts.ok ? '<div class="act">' + (opts.skip ? '<button class="btn ghost xs" data-coach="skip" style="color:#555">Skip tutorial</button>' : '') + '<button class="btn sm" data-coach="ok">' + opts.ok + '</button></div>' : '') + '</div>';
    root.appendChild(c);
    root.style.pointerEvents = opts.block ? 'auto' : 'none';
    c.addEventListener('click', (e) => {
      const b = e.target.closest('[data-coach]');
      if (!b) return;
      BE.audio.play('click');
      if (b.dataset.coach === 'skip' && opts.onSkip) opts.onSkip();
      else if (opts.onOk) opts.onOk();
    });
  }
  function clearCoach() { const r = $('#coach-root'); if (r) { r.innerHTML = ''; r.style.pointerEvents = 'none'; } }

  // ---------- Dev-mode ad placeholder ----------
  function devAd(kind, placement) {
    return new Promise((resolve) => {
      let left = kind === 'interstitial' ? 3 : 5;
      const m = modal({
        center: true, noClose: true, title: kind === 'interstitial' ? 'Ad break' : 'Rewarded ad',
        html: '<div class="stack" style="text-align:center"><div class="dev-banner"><b>DEVELOPMENT PLACEHOLDER</b><br>No ad network is connected, so no real ad is shown and nothing is tracked. In a store build this slot plays a ' + (kind === 'interstitial' ? 'skippable interstitial' : 'rewarded video') + '.</div>' +
          '<div style="aspect-ratio:16/9;border-radius:14px;background:repeating-linear-gradient(45deg,#1d2750 0 12px,#161e3b 12px 24px);display:grid;place-items:center"><div class="h1" data-ad-count>' + left + '</div></div>' +
          '<div class="row"><button class="btn ghost grow" data-ad="cancel">' + (kind === 'interstitial' ? 'Skip' : 'Cancel (no reward)') + '</button><button class="btn green grow" data-ad="done" disabled>' + (kind === 'interstitial' ? 'Continue' : 'Claim reward') + '</button></div></div>',
        onClose: (v) => resolve(!!v),
      });
      const iv = setInterval(() => {
        left--;
        const c = $('[data-ad-count]', m.el); if (c) c.textContent = Math.max(0, left);
        if (left <= 0) { clearInterval(iv); const b = $('[data-ad="done"]', m.el); if (b) b.disabled = false; }
      }, 1000);
      m.el.addEventListener('click', (e) => {
        const b = e.target.closest('[data-ad]');
        if (!b || b.disabled) return;
        clearInterval(iv);
        m.close(b.dataset.ad === 'done' || kind === 'interstitial');
      });
    });
  }

  BE.ui = Object.assign(BE.ui || {}, {
    $, $$, icon, gearIcon, ballArt, trophyArt, curIcon, curName, rewChip, rewardPreview, toast, modal, topModal, closeAll, anyModal, confirmBox,
    flyCurrency, floatText, sparks, flash, rewardsPopup, gearName, gearBadge, stars, athleteCard, templateCard, crestHTML, renderHUD, updateHUD,
    renderNav, updateBadges, go, current: () => current, stageName, coach, clearCoach, devAd, navUnlocked, NAV,
  });
})(typeof window !== 'undefined' ? window : globalThis);
