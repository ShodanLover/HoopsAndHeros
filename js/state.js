/* Basketball Empire — game state: defaults, validation, migration, persistence (local + cloud) */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, A = BE.athletes;
  const SAVE_VERSION = 3;
  const LOCAL_KEY = 'basketball-empire-save';
  const BACKUP_KEY = 'basketball-empire-save-backup';

  function defaultStats() {
    return {
      wins: 0, losses: 0, gamesPlayed: 0, threes: 0, dunks: 0, blocks: 0, steals: 0, levelups: 0, pulls: 0, facilityUps: 0,
      gearUps: 0, contests: 0, trains: 0, abilities: 0, cashEarned: 0, championships: 0, prestiges: 0, legendaries: 0,
      mythics: 0, unique: 1, bestWorld: 1, loginDays: 0, perfectFT: 0, stagesCleared: 0, champWins: 0, tourneyWins: 0, growthUps: 0,
    };
  }

  function defaultState() {
    const now = Date.now();
    return {
      v: SAVE_VERSION,
      created: now,
      lastSeen: now,
      franchise: { name: 'Blacktop Ballers', cosmetic: 'default', owned: ['default', 'midnight', 'crimson'] },
      cash: 0, gems: 50, tickets: 0, eventTickets: 0, tp: 0, scrap: 0, shards: 0, fans: 0,
      run: { cleared: 0, farming: false, champ: null, cashEarned: 0, startedAt: now, number: 1 },
      best: 0,
      roster: [{ uid: 'u0', cid: 'S0', lvl: 1, stars: 1, train: {}, gear: {}, isNew: false }],
      lineup: ['u0'],
      gear: [],
      teamGear: { ball: null, trainer: null },
      gearSeen: {},
      facilities: {},
      coaches: {},
      growth: {},
      quest: { i: 0, claimed: 0 },
      camps: { day: '', keys: {}, tier: {}, max: {} },
      buffs: { cash: 0, power: 0, freeDay: {} },
      spin: { day: '', used: 0 },
      prestige: { points: 0, earned: 0, count: 0, upgrades: {} },
      recruit: { pro: { e: 0, l: 0, m: 0, xp: 0 }, event: { e: 0, l: 0, m: 0, xp: 0 }, total: 0, wish: [] },
      collection: { S0: true },
      stats: defaultStats(),
      missions: { day: '', daily: [], week: '', weekly: [] },
      achievements: {},
      login: { lastDay: '', streak: 0, claimedDay: '', adDay: '' },
      pass: { month: '', xp: 0, premium: false, free: [], prem: [] },
      ads: { day: '', counts: {}, lastInterstitial: 0 },
      purchases: { starter: false, vip: false, autocoach: false, history: [] },
      settings: { sfx: 0.8, music: 0.35, haptics: true, reduceMotion: false, speed: 2, autoPush: true, autoAbilities: false, autoTactics: true, commentary: true, buyMult: 1 },
      tactics: { off: 'balanced', def: 'man' },
      tutorial: { step: 0, done: false },
      seenFeatures: {},
      events: { day: '', attempts: { ft: 3, three: 3, dunk: 3 }, best: { ft: 0, three: 0, dunk: 0 } },
      tourney: { week: '', entries: 0, points: 0, best: 0, claimed: false, lastResult: null },
      social: { alliance: null, week: '', contributed: 0, claimed: [] },
      division: { earned: 0 },
      timers: { academy: now, freeTicketDay: '', vipGemDay: '', freeGiftDay: '' },
      nextUid: 1,
      nextGearId: 1,
      log: [],
    };
  }

  function isObj(x) { return x && typeof x === 'object' && !Array.isArray(x); }

  // Merge loaded data onto defaults, keeping only well-typed values
  function mergeTyped(def, src) {
    if (!isObj(src)) return def;
    const out = Array.isArray(def) ? [] : {};
    for (const k in def) {
      const dv = def[k], sv = src[k];
      if (sv === undefined) { out[k] = dv; continue; }
      if (typeof dv === 'number') out[k] = typeof sv === 'number' && isFinite(sv) ? sv : dv;
      else if (typeof dv === 'string') out[k] = typeof sv === 'string' ? sv : dv;
      else if (typeof dv === 'boolean') out[k] = typeof sv === 'boolean' ? sv : dv;
      else if (Array.isArray(dv)) out[k] = Array.isArray(sv) ? sv : dv;
      else if (dv === null) out[k] = sv;
      else if (isObj(dv)) {
        // open-ended maps (empty defaults) accept any keys
        if (Object.keys(dv).length === 0) out[k] = isObj(sv) ? sv : dv;
        else out[k] = mergeTyped(dv, sv);
      } else out[k] = sv;
    }
    return out;
  }

  function validate(raw) {
    const s = mergeTyped(defaultState(), raw);
    if (raw && raw.settings && raw.settings.buyMult === 'max') s.settings.buyMult = 'max';
    // currencies non-negative
    for (const k of ['cash', 'gems', 'tickets', 'eventTickets', 'tp', 'scrap', 'shards', 'fans']) s[k] = Math.max(0, U.num(s[k], 0));
    // roster
    const seen = new Set();
    s.roster = s.roster.filter((a) => isObj(a) && typeof a.uid === 'string' && A.tpl(a.cid) && !seen.has(a.uid) && seen.add(a.uid));
    for (const a of s.roster) {
      a.lvl = U.clamp(Math.floor(U.num(a.lvl, 1)), 1, 5000);
      a.stars = U.clamp(Math.floor(U.num(a.stars, 1)), 1, 5);
      a.train = isObj(a.train) ? a.train : {};
      for (const k in a.train) a.train[k] = U.clamp(Math.floor(U.num(a.train[k], 0)), 0, 40);
      a.gear = isObj(a.gear) ? a.gear : {};
      a.isNew = !!a.isNew;
      a.dupes = U.clamp(Math.floor(U.num(a.dupes, 0)), 0, 100000);
    }
    s.recruit.wish = (Array.isArray(s.recruit.wish) ? s.recruit.wish : []).filter((id, i, arr) => A.tpl(id) && A.tpl(id).rarity === 4 && arr.indexOf(id) === i).slice(0, 3);
    if (s.roster.length === 0) s.roster = defaultState().roster;
    // gear
    const gseen = new Set();
    s.gear = s.gear.filter((g) => isObj(g) && typeof g.id === 'string' && D.gearTypes.some((t) => t.k === g.type) && !gseen.has(g.id) && gseen.add(g.id));
    for (const g of s.gear) {
      g.rarity = U.clamp(Math.floor(U.num(g.rarity, 0)), 0, 5);
      g.set = U.clamp(Math.floor(U.num(g.set, 0)), 0, 9);
      g.lvl = U.clamp(Math.floor(U.num(g.lvl, 1)), 1, 60);
      g.subs = Array.isArray(g.subs) ? g.subs.filter((x) => isObj(x) && A.ATTR_KEYS.includes(x.k)).map((x) => ({ k: x.k, v: U.clamp(Math.floor(U.num(x.v, 1)), 0, 30) })) : [];
    }
    // references
    const uids = new Set(s.roster.map((a) => a.uid));
    s.lineup = s.lineup.filter((u, i, arr) => uids.has(u) && arr.indexOf(u) === i).slice(0, 5);
    if (s.lineup.length === 0) s.lineup = [s.roster[0].uid];
    const gids = new Set(s.gear.map((g) => g.id));
    const usedG = new Set();
    for (const a of s.roster) {
      for (const slot in a.gear) {
        const id = a.gear[slot];
        if (!gids.has(id) || usedG.has(id)) delete a.gear[slot];
        else usedG.add(id);
      }
    }
    for (const slot of ['ball', 'trainer']) {
      const id = s.teamGear[slot];
      if (id && (!gids.has(id) || usedG.has(id))) s.teamGear[slot] = null;
      else if (id) usedG.add(id);
    }
    s.run.cleared = U.clamp(Math.floor(U.num(s.run.cleared, 0)), 0, 100000);
    s.best = Math.max(s.best, s.run.cleared);
    if (s.run.champ && !isObj(s.run.champ)) s.run.champ = null;
    s.nextUid = Math.max(s.nextUid, s.roster.length + 1);
    if (!D.cosmetics.some((c) => c.k === s.franchise.cosmetic)) s.franchise.cosmetic = 'default';
    s.franchise.name = String(s.franchise.name || 'Blacktop Ballers').slice(0, 24);
    s.settings.speed = U.clamp(Math.floor(s.settings.speed), 1, 4);
    if (s.settings.buyMult !== 'max') s.settings.buyMult = [1, 10, 100].includes(s.settings.buyMult) ? s.settings.buyMult : 1;
    for (const k in s.growth) s.growth[k] = U.clamp(Math.floor(U.num(s.growth[k], 0)), 0, 1000);
    s.quest.i = U.clamp(Math.floor(U.num(s.quest.i, 0)), 0, D.questLine.length);
    s.log = s.log.slice(-30);
    s.v = SAVE_VERSION;
    return s;
  }

  function migrate(raw) {
    if (!isObj(raw)) return null;
    // v1/v2 → v3: gear subs renamed and tutorial moved (kept defensive even though older saves are rare)
    if ((raw.v || 1) < 3) {
      if (raw.tutorial === undefined && raw.tutorialStep !== undefined) raw.tutorial = { step: raw.tutorialStep, done: raw.tutorialStep > 20 };
    }
    return raw;
  }

  // Derived runtime indexes (never saved)
  function index(s) {
    Object.defineProperty(s, 'gearById', { value: {}, writable: true, enumerable: false, configurable: true });
    Object.defineProperty(s, 'rosterByUid', { value: {}, writable: true, enumerable: false, configurable: true });
    for (const g of s.gear) s.gearById[g.id] = g;
    for (const a of s.roster) s.rosterByUid[a.uid] = a;
    return s;
  }

  function serialize(s) { return JSON.stringify(s); }

  // ---------- Storage ----------
  const store = {
    cloud: { ready: false, ref: null, lastJson: '', status: 'off' },

    loadLocal() {
      try {
        const txt = root.localStorage && root.localStorage.getItem(LOCAL_KEY);
        if (!txt) return null;
        return JSON.parse(txt);
      } catch (e) {
        console.warn('Local save unreadable, trying backup', e);
        try {
          const b = root.localStorage.getItem(BACKUP_KEY);
          return b ? JSON.parse(b) : null;
        } catch (e2) { return null; }
      }
    },

    saveLocal(json) {
      try {
        const prev = root.localStorage.getItem(LOCAL_KEY);
        if (prev) root.localStorage.setItem(BACKUP_KEY, prev);
        root.localStorage.setItem(LOCAL_KEY, json);
        return true;
      } catch (e) { return false; }
    },

    clearLocal() {
      try { root.localStorage.removeItem(LOCAL_KEY); root.localStorage.removeItem(BACKUP_KEY); } catch (e) { /* storage unavailable */ }
    },

    // Optional claude.ai per-viewer cloud save. Resolves to parsed save or null.
    async initCloud() {
      try {
        if (!root.claude || typeof root.claude.use !== 'function') return null;
        const [user, db] = await Promise.all([root.claude.use('user'), root.claude.use('db')]);
        if (!user || !db) return null;
        const id = await user.id();
        if (!id) return null;
        const ref = db.collection('data/users/' + id).doc('save');
        this.cloud.ref = ref;
        this.cloud.status = 'connecting';
        const snap = await Promise.race([ref.get(), new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), 10000))]);
        this.cloud.ready = true;
        this.cloud.status = 'on';
        if (snap && snap.exists) {
          const d = snap.data();
          if (d && typeof d.json === 'string') { this.cloud.lastJson = d.json; return JSON.parse(d.json); }
        }
        return null;
      } catch (e) {
        console.warn('Cloud save unavailable', e);
        this.cloud.status = 'off';
        return null;
      }
    },

    _cloudBusy: false,
    async saveCloud(json) {
      const c = this.cloud;
      if (!c.ready || !c.ref || this._cloudBusy || json === c.lastJson) return;
      this._cloudBusy = true;
      try {
        await c.ref.set({ json, savedAt: Date.now() });
        c.lastJson = json;
        c.status = 'on';
      } catch (e) {
        c.status = e && e.code === 'quota_exceeded' ? 'full' : 'error';
        console.warn('Cloud save failed', e);
      } finally { this._cloudBusy = false; }
    },
  };

  function exportCode(s) {
    try { return btoa(unescape(encodeURIComponent(serialize(s)))); } catch (e) { return ''; }
  }
  function importCode(code) {
    const raw = JSON.parse(decodeURIComponent(escape(atob(String(code).trim()))));
    if (!isObj(raw) || !Array.isArray(raw.roster)) throw new Error('That code is not a Basketball Empire save.');
    return index(validate(migrate(raw)));
  }

  function load(raw) {
    if (!raw) return index(defaultState());
    return index(validate(migrate(raw)));
  }

  BE.state = { defaultState, defaultStats, validate, migrate, index, serialize, load, store, exportCode, importCode, SAVE_VERSION };
})(typeof window !== 'undefined' ? window : globalThis);
