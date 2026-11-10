/* Basketball Empire — core utilities (no DOM dependencies, runs in node for tests) */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});

  function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6d2b79f5) >>> 0;
      let t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashStr(s) {
    let h = 2166136261 >>> 0;
    for (let i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  const SUFFIX = ['', 'K', 'M', 'B', 'T', 'Qa', 'Qi', 'Sx', 'Sp', 'Oc', 'No', 'Dc', 'UDc', 'DDc', 'TDc', 'QaDc', 'QiDc', 'SxDc', 'SpDc', 'OcDc', 'NoDc', 'Vg'];

  function fmt(n, digits) {
    if (n === undefined || n === null || !isFinite(n)) return '0';
    const neg = n < 0;
    n = Math.abs(n);
    let out;
    if (n < 1000) {
      out = n < 10 && n % 1 !== 0 ? n.toFixed(1).replace(/\.0$/, '') : Math.floor(n).toString();
    } else {
      const tier = Math.floor(Math.log10(n) / 3);
      if (tier < SUFFIX.length) {
        const scaled = n / Math.pow(1000, tier);
        const d = digits !== undefined ? digits : scaled < 10 ? 2 : scaled < 100 ? 1 : 0;
        out = scaled.toFixed(d).replace(/\.?0+$/, '') + SUFFIX[tier];
      } else {
        out = n.toExponential(2).replace('+', '');
      }
    }
    return (neg ? '-' : '') + out;
  }

  function fmtInt(n) {
    if (!isFinite(n)) return '0';
    return Math.floor(n).toLocaleString('en-US');
  }

  function fmtTime(sec) {
    sec = Math.max(0, Math.floor(sec));
    const d = Math.floor(sec / 86400);
    const h = Math.floor((sec % 86400) / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    if (d > 0) return d + 'd ' + h + 'h';
    if (h > 0) return h + 'h ' + m + 'm';
    if (m > 0) return m + 'm ' + s + 's';
    return s + 's';
  }

  function pad2(n) { return (n < 10 ? '0' : '') + n; }

  function dayKey(t) {
    const d = new Date(t === undefined ? Date.now() : t);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate());
  }
  function monthKey(t) {
    const d = new Date(t === undefined ? Date.now() : t);
    return d.getFullYear() + '-' + pad2(d.getMonth() + 1);
  }
  // ISO week key (weeks start Monday)
  function weekKey(t) {
    const d = new Date(t === undefined ? Date.now() : t);
    const date = new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()));
    const day = date.getUTCDay() || 7;
    date.setUTCDate(date.getUTCDate() + 4 - day);
    const yearStart = new Date(Date.UTC(date.getUTCFullYear(), 0, 1));
    const wk = Math.ceil(((date - yearStart) / 86400000 + 1) / 7);
    return date.getUTCFullYear() + '-W' + pad2(wk);
  }
  function msUntilNextDay(t) {
    const d = new Date(t === undefined ? Date.now() : t);
    const n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return n - d;
  }
  function msUntilNextWeek(t) {
    const d = new Date(t === undefined ? Date.now() : t);
    const day = d.getDay() || 7; // Mon=1..Sun=7
    const n = new Date(d.getFullYear(), d.getMonth(), d.getDate() + (8 - day));
    return n - d;
  }
  function msUntilNextMonth(t) {
    const d = new Date(t === undefined ? Date.now() : t);
    const n = new Date(d.getFullYear(), d.getMonth() + 1, 1);
    return n - d;
  }
  function isWeekend(t) {
    const day = new Date(t === undefined ? Date.now() : t).getDay();
    return day === 0 || day === 6;
  }

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function pick(arr, r) {
    if (typeof r === 'function') r = r();
    return arr[Math.floor((r === undefined ? Math.random() : r) * arr.length) % arr.length];
  }
  function weightedIndex(weights, r) {
    let total = 0;
    for (const w of weights) total += w;
    if (typeof r === 'function') r = r();
    let x = (r === undefined ? Math.random() : r) * total;
    for (let i = 0; i < weights.length; i++) {
      x -= weights[i];
      if (x < 0) return i;
    }
    return weights.length - 1;
  }
  let uidCounter = 0;
  function uid(prefix) {
    uidCounter = (uidCounter + 1) % 1e6;
    return (prefix || '') + Date.now().toString(36) + Math.floor(Math.random() * 1e6).toString(36) + uidCounter.toString(36);
  }
  function num(v, def) { return typeof v === 'number' && isFinite(v) ? v : def; }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOut(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
  function easeOutBack(t) { const c1 = 1.70158, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); }

  // Tiny event bus
  const handlers = {};
  const bus = {
    on(ev, fn) { (handlers[ev] = handlers[ev] || []).push(fn); return () => bus.off(ev, fn); },
    off(ev, fn) { if (handlers[ev]) handlers[ev] = handlers[ev].filter((f) => f !== fn); },
    emit(ev, data) {
      const list = handlers[ev];
      if (!list) return;
      for (const fn of list.slice()) {
        try { fn(data); } catch (e) { console.error('[bus]', ev, e); }
      }
    },
  };

  BE.util = {
    mulberry32, hashStr, fmt, fmtInt, fmtTime, dayKey, weekKey, monthKey, msUntilNextDay, msUntilNextWeek,
    msUntilNextMonth, isWeekend, clamp, lerp, pick, weightedIndex, uid, num, esc, easeOutCubic, easeInOut, easeOutBack,
  };
  BE.bus = bus;
})(typeof window !== 'undefined' ? window : globalThis);
