/* Basketball Empire — meta screens: missions, trophies, daily, pass, events & contests, tournament, social, map,
   settings, offline summary, championship ceremony, world intro, tactics, franchise, feature intros */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const U = BE.util, D = BE.data, E = BE.econ, G = BE.game, A = BE.athletes;
  const ui = BE.ui;
  const { $, icon } = ui;
  const S = () => BE.game_state;
  const changed = () => { BE.bus.emit('changed'); ui.updateBadges(S()); BE.play.renderHub(); };

  // ---------- Missions & trophies ----------
  function missionsModal(startTab) {
    let tab = startTab || 'daily';
    const m = ui.modal({ title: 'Missions & Trophies', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      const b = ui.badges(s);
      let html = '<div class="tabs">' + [['daily', 'Daily'], ['weekly', 'Weekly'], ['trophies', 'Trophies' + (b.trophies ? ' (' + b.trophies + ')' : '')]].map((t) => '<button class="tab' + (t[0] === tab ? ' active' : '') + '" data-mt="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
      if (tab !== 'trophies') {
        const list = tab === 'daily' ? s.missions.daily : s.missions.weekly;
        const reset = tab === 'daily' ? U.msUntilNextDay() : U.msUntilNextWeek();
        html += '<div class="small muted" style="margin-bottom:8px">New ' + tab + ' missions in ' + U.fmtTime(reset / 1000) + '. Missions also give Season Pass XP.</div><div class="col">';
        for (const mi of list) {
          const p = G.missionProgress(s, mi);
          const done = p >= mi.goal;
          html += '<div class="mission' + (mi.claimed ? ' done' : '') + '"><div class="mt"><div class="n">' + U.esc(mi.text) + '</div><div class="row small" style="gap:6px;margin-top:3px">' + ui.rewardPreview(mi.reward) + '</div><div class="bar green"><i style="width:' + Math.min(100, p / mi.goal * 100) + '%"></i></div></div>' +
            '<div style="text-align:center"><div class="num small">' + Math.min(p, mi.goal) + '/' + mi.goal + '</div>' + (mi.claimed ? '<span class="chip good">' + icon('check') + '</span>' : '<button class="btn xs ' + (done ? 'gold' : 'ghost') + '" data-claim="' + mi.id + '" data-list="' + tab + '"' + (done ? '' : ' disabled') + '>Claim</button>') + '</div></div>';
        }
        html += '</div>';
      } else {
        html += '<div class="col">';
        const sorted = D.achievements.slice().sort((x, y) => (G.achievementState(s, y).ready ? 1 : 0) - (G.achievementState(s, x).ready ? 1 : 0));
        for (const a of sorted) {
          const st = G.achievementState(s, a);
          const gems = D.achievementGems[Math.min(st.claimed, D.achievementGems.length - 1)];
          html += '<div class="mission' + (st.done ? ' done' : '') + '"><div class="uic" style="width:38px;height:38px;border-radius:10px;display:grid;place-items:center;background:var(--panel3);color:var(--gold)">' + icon(a.icon) + '</div><div class="mt"><div class="n">' + a.name + ' <span class="muted small">' + ui.stars(Math.min(5, st.claimed)).replace(/★/g, '•') + '</span></div>' +
            '<div class="small muted">' + (st.done ? 'All tiers complete!' : statLabel(a.stat) + ': ' + U.fmt(st.val) + ' / ' + U.fmt(st.next)) + '</div>' + (st.done ? '' : '<div class="bar"><i style="width:' + Math.min(100, st.val / st.next * 100) + '%"></i></div>') + '</div>' +
            (st.done ? '' : '<button class="btn xs ' + (st.ready ? 'gold' : 'ghost') + '" data-ach="' + a.k + '"' + (st.ready ? '' : ' disabled') + '>◆ ' + gems + '</button>') + '</div>';
        }
        html += '</div>';
      }
      mm.set(html);
    }
    m.el.addEventListener('click', (e) => {
      const s = S();
      const t = e.target.closest('[data-mt]');
      if (t) { tab = t.dataset.mt; BE.audio.play('tab'); draw(m); return; }
      const c = e.target.closest('[data-claim]');
      if (c) {
        const list = c.dataset.list === 'daily' ? s.missions.daily : s.missions.weekly;
        const mi = list.find((x) => x.id === c.dataset.claim);
        if (!mi || mi.claimed || G.missionProgress(s, mi) < mi.goal) return;
        mi.claimed = true;
        const g = E.grant(s, mi.reward);
        ui.sparks(c, '#ffd23f', 16);
        ui.rewardsPopup('MISSION COMPLETE', g);
        changed(); draw(m);
        return;
      }
      const a = e.target.closest('[data-ach]');
      if (a) {
        const def = D.achievements.find((x) => x.k === a.dataset.ach);
        const r = G.claimAchievement(s, def);
        if (r) { ui.sparks(a, '#c07bff', 16); ui.flyCurrency('gems', a, 6); BE.audio.play('claim'); ui.toast(def.name + ' tier complete! +' + r.gems + ' gems', 'gold', 'trophy'); changed(); draw(m); }
      }
    });
  }
  function statLabel(k) {
    return { wins: 'Wins', threes: 'Threes made', dunks: 'Dunks', blocks: 'Blocks', steals: 'Steals', unique: 'Unique athletes', pulls: 'Recruits', legendaries: 'Legendaries', mythics: 'Mythics', bestWorld: 'Best world', championships: 'Championships', prestiges: 'Prestiges', levelups: 'Level-ups', cashEarned: 'Cash earned', facilityUps: 'Upgrades', gearUps: 'Gear upgrades', contests: 'Contests', loginDays: 'Login days', perfectFT: 'Perfect FT rounds' }[k] || k;
  }

  // ---------- Daily login ----------
  function dailyModal() {
    const m = ui.modal({ title: 'Daily Rewards', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      const st = G.loginStatus(s);
      let html = '<div class="small muted" style="margin-bottom:10px">Log in each day to climb the 7-day ladder. Missing a day simply restarts the ladder — nothing is lost.</div><div class="login-grid">';
      D.loginRewards.forEach((rw, i) => {
        const claimed = i < st.dayIdx || (i === st.dayIdx && st.claimedToday);
        const today = i === st.dayIdx && !st.claimedToday;
        html += '<div class="lday' + (today ? ' today' : '') + (claimed ? ' claimed' : '') + (i === 6 ? ' big' : '') + '"><div class="label">Day ' + (i + 1) + '</div><div class="row wrap" style="justify-content:center;gap:4px">' + ui.rewardPreview(rw) + '</div>' + (claimed ? '<span class="chip good">' + icon('check') + '</span>' : '') + '</div>';
      });
      html += '</div>';
      if (!st.claimedToday) html += '<button class="btn gold wide" style="margin-top:12px" data-dl="claim">Claim day ' + (st.dayIdx + 1) + '</button>';
      else {
        const adDone = s.login.adDay === U.dayKey();
        html += '<div class="card flat" style="margin-top:12px;text-align:center"><div>Next reward in <b>' + U.fmtTime(U.msUntilNextDay() / 1000) + '</b></div>' +
          (adDone ? '<div class="small muted">Bonus reward claimed today</div>' : '<button class="btn green sm" style="margin-top:8px" data-dl="ad">' + icon('tv') + ' Extra daily reward (optional ad)</button>') + '</div>';
      }
      mm.set(html);
    }
    m.el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-dl]');
      if (!b) return;
      const s = S();
      if (b.dataset.dl === 'claim') {
        const g = G.claimLogin(s);
        if (g) { ui.rewardsPopup('DAY ' + s.login.streak + ' REWARD', g); changed(); draw(m); }
      } else {
        const r = await BE.services.rewardedAd('daily');
        if (!r.ok) { ui.toast('No reward — the ad was not completed', '', 'tv'); return; }
        s.login.adDay = U.dayKey();
        const g = E.grant(s, { gems: 15, cashMinutes: 10 });
        ui.rewardsPopup('BONUS REWARD', g); draw(m);
      }
    });
  }

  // ---------- Season pass ----------
  function passModal() {
    const m = ui.modal({ title: 'Season Pass', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      const tier = G.passTier(s);
      const into = s.pass.xp % G.PASS_XP;
      const monthName = new Date().toLocaleString('en-US', { month: 'long' });
      let html = '<div class="card" style="background:linear-gradient(135deg,#3a2a07,#2a1640);border-color:rgba(255,210,63,.35)"><div class="row between"><div><div class="label" style="color:var(--gold)">' + monthName + ' season · ends in ' + U.fmtTime(U.msUntilNextMonth() / 1000) + '</div><div class="h2">Tier ' + tier + ' / ' + G.PASS_TIERS + '</div></div>' +
        (s.pass.premium ? '<span class="chip gold">Premium active</span>' : '<button class="btn gold sm" data-pp="buy">Premium ' + BE.services.price(D.products.find((p) => p.sku === 'pass')) + '</button>') + '</div>' +
        '<div class="bar" style="margin-top:8px"><i style="width:' + (tier >= G.PASS_TIERS ? 100 : into / G.PASS_XP * 100) + '%"></i></div><div class="small muted" style="margin-top:4px">' + (tier >= G.PASS_TIERS ? 'Season complete!' : into + ' / ' + G.PASS_XP + ' XP to next tier') + ' · Earn XP from missions, wins and championships.</div></div>';
      html += '<div class="row" style="margin:12px 0 6px;gap:6px"><span style="width:36px"></span><span class="label grow">Free track</span><span class="label grow" style="color:var(--gold)">Premium track</span></div><div class="col" style="gap:6px">';
      for (let t = 1; t <= G.PASS_TIERS; t++) {
        const reached = t <= tier;
        const fr = G.passReward(t, false), pr = G.passReward(t, true);
        const fc = s.pass.free.includes(t), pc = s.pass.prem.includes(t);
        html += '<div class="pass-row"><div class="pass-tier' + (reached ? ' reached' : '') + '">' + t + '</div>' +
          '<div class="pass-cell' + (reached ? '' : ' locked') + '"><span class="small">' + ui.rewardPreview(fr) + '</span>' + (fc ? '<span style="color:var(--good)">' + icon('check') + '</span>' : reached ? '<button class="btn xs gold" data-pc="f' + t + '">Claim</button>' : '') + '</div>' +
          '<div class="pass-cell prem' + (reached && s.pass.premium ? '' : ' locked') + '"><span class="small">' + ui.rewardPreview(pr) + '</span>' + (pc ? '<span style="color:var(--good)">' + icon('check') + '</span>' : reached && s.pass.premium ? '<button class="btn xs gold" data-pc="p' + t + '">Claim</button>' : s.pass.premium ? '' : icon('lock')) + '</div></div>';
      }
      html += '</div>';
      mm.set(html);
    }
    m.el.addEventListener('click', (e) => {
      const s = S();
      if (e.target.closest('[data-pp]')) { BE.empire.buy('pass').then(() => draw(m)); return; }
      const c = e.target.closest('[data-pc]');
      if (!c) return;
      const prem = c.dataset.pc[0] === 'p';
      const t = +c.dataset.pc.slice(1);
      if (t > G.passTier(s)) return;
      const list = prem ? s.pass.prem : s.pass.free;
      if (list.includes(t) || (prem && !s.pass.premium)) return;
      list.push(t);
      const g = E.grant(s, G.passReward(t, prem));
      ui.rewardsPopup('TIER ' + t + ' REWARD', g);
      changed(); draw(m);
    });
  }

  // ---------- Events: contests, tournament, limited challenge ----------
  const CHALLENGES = [
    { k: 'threes', text: 'Splash Week: make 150 three-pointers', stat: 'threes', goal: 150 },
    { k: 'dunks', text: 'Above the Rim: throw down 100 dunks', stat: 'dunks', goal: 100 },
    { k: 'blocks', text: 'Paint Patrol: record 60 blocks', stat: 'blocks', goal: 60 },
    { k: 'wins', text: 'Win Streak Week: win 120 games', stat: 'wins', goal: 120 },
    { k: 'steals', text: 'Pickpocket Week: record 60 steals', stat: 'steals', goal: 60 },
  ];
  function weeklyChallenge(s) {
    const wk = U.weekKey();
    const c = CHALLENGES[U.hashStr(wk) % CHALLENGES.length];
    if (!s.events.challenge || s.events.challenge.week !== wk) s.events.challenge = { week: wk, base: s.stats[c.stat] || 0, claimed: false };
    return { c, prog: (s.stats[c.stat] || 0) - s.events.challenge.base, st: s.events.challenge };
  }
  function weekendEvent(s) {
    const wk = U.weekKey();
    if (!s.events.weekend || s.events.weekend.week !== wk) s.events.weekend = { week: wk, base: null, claimed: false };
    const w = s.events.weekend;
    if (U.isWeekend() && w.base === null) w.base = s.stats.wins;
    return w;
  }
  function eventsModal(startTab) {
    const s0 = S();
    let tab = startTab || (E.unlocked(s0, 'camps') ? 'camps' : 'contests');
    const m = ui.modal({ title: 'Camps & Events', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      const tabs = [];
      if (E.unlocked(s, 'camps')) tabs.push(['camps', 'Camps']);
      if (E.unlocked(s, 'events')) tabs.push(['contests', 'Contests']);
      if (E.unlocked(s, 'tourney')) tabs.push(['tourney', 'Tournament']);
      tabs.push(['limited', 'Limited']);
      if (!tabs.some((t) => t[0] === tab)) tab = tabs[0][0];
      let html = '<div class="tabs">' + tabs.map((t) => '<button class="tab' + (t[0] === tab ? ' active' : '') + '" data-et="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
      if (tab === 'camps') html += BE.camps.campsHTML(s);
      else if (tab === 'contests') {
        const wk = U.isWeekend();
        html += wk ? '<div class="card" style="border-color:rgba(255,210,63,.4);margin-bottom:10px"><b style="color:var(--gold)">Weekend Showdown is live!</b><div class="small muted">Contest rewards give double Event tickets until Monday.</div></div>' : '';
        const C = [
          ['ft', 'Free Throw Challenge', '10 shots. Tap when the needle hits the green. Perfect timing = swish.', 'ball'],
          ['three', '3-Point Contest', '3 racks of 5. Money balls count double. Fast needle!', 'events'],
          ['dunk', 'Slam Dunk Contest', 'Pick 3 dunks and nail the timing. Judges score 1–50.', 'fire'],
        ];
        html += '<div class="col">';
        for (const c of C) {
          const left = s.events.attempts[c[0]];
          html += '<div class="urow"><div class="uic" style="color:var(--accent)">' + icon(c[3]) + '</div><div class="ut"><div class="n">' + c[1] + '</div><div class="d">' + c[2] + '</div><div class="e">Best today: ' + (s.events.best[c[0]] || 0) + ' · ' + left + ' attempt' + (left === 1 ? '' : 's') + ' left</div></div>' +
            (left > 0 ? '<button class="btn sm" data-contest="' + c[0] + '">Play</button>' : '<button class="btn sm green stack" data-contestad="' + c[0] + '"' + ((s.ads.counts.contest || 0) >= D.ads.contest.daily ? ' disabled' : '') + '>+1 Try<span class="sub">ad</span></button>') + '</div>';
        }
        html += '</div><div class="small muted" style="margin-top:8px">Attempts refresh daily. Your best shooter, dunker and attributes make the timing windows wider.</div>';
      } else if (tab === 'tourney') {
        const lt = G.social.leagueTier(s.tourney.points);
        html += '<div class="card"><div class="row between"><div><div class="label">Weekly Invitational</div><div class="h2">16-team bracket</div><div class="small muted">Entries left: ' + (3 - s.tourney.entries) + '/3 · resets in ' + U.fmtTime(U.msUntilNextWeek() / 1000) + '</div></div><div style="text-align:right"><div class="label">League</div><div class="h3" style="color:var(--gold)">' + lt.name + '</div><div class="small">' + s.tourney.points + ' pts</div></div></div>' +
          (lt.next ? '<div class="bar" style="margin-top:8px"><i style="width:' + ((s.tourney.points - lt.floor) / (lt.next - lt.floor) * 100) + '%"></i></div><div class="small muted" style="margin-top:3px">' + (lt.next - s.tourney.points) + ' pts to next league</div>' : '') +
          '<button class="btn gold wide" style="margin-top:10px" data-tour="enter"' + (s.tourney.entries >= 3 ? ' disabled' : '') + '>Enter tournament</button></div>';
        if (s.tourney.lastResult) {
          const lr = s.tourney.lastResult;
          html += '<div class="sec-title"><span class="h3">Last run: ' + lr.placement + '</span><span class="label">+' + lr.pts + ' pts</span></div><div class="col">' +
            lr.results.map((r) => '<div class="lb-row"><span class="rk" style="font-size:14px;color:' + (r.won ? 'var(--good)' : 'var(--bad)') + '">' + (r.won ? 'W' : 'L') + '</span><span>' + r.round + ' vs ' + U.esc(r.opp) + '</span><span class="num">' + r.score[0] + '-' + r.score[1] + '</span></div>').join('') + '</div>';
        }
        html += '<div class="small muted" style="margin-top:8px">Opponents are simulated franchises scaled to your current stage. Tournament points set your league tier for the week.</div>';
      } else {
        const wc = weeklyChallenge(s);
        const we = weekendEvent(s);
        html += '<div class="card"><div class="label" style="color:var(--accent)">Weekly challenge · ends in ' + U.fmtTime(U.msUntilNextWeek() / 1000) + '</div><div class="h3" style="margin:4px 0">' + wc.c.text + '</div><div class="bar green"><i style="width:' + Math.min(100, wc.prog / wc.c.goal * 100) + '%"></i></div><div class="row between" style="margin-top:6px"><span class="small">' + Math.min(wc.prog, wc.c.goal) + '/' + wc.c.goal + '</span><span class="small">' + ui.rewardPreview({ gems: 60, eventTickets: 2, tickets: 1 }) + '</span></div>' +
          (wc.st.claimed ? '<span class="chip good">Claimed</span>' : '<button class="btn gold sm wide" style="margin-top:8px" data-ch="week"' + (wc.prog >= wc.c.goal ? '' : ' disabled') + '>Claim</button>') + '</div>';
        const wprog = we.base === null ? 0 : s.stats.wins - we.base;
        html += '<div class="card" style="margin-top:10px"><div class="label" style="color:var(--gold)">Weekend Showdown · Sat–Sun</div><div class="h3" style="margin:4px 0">Win 40 games over the weekend</div>' +
          (U.isWeekend() ? '<div class="bar"><i style="width:' + Math.min(100, wprog / 40 * 100) + '%"></i></div><div class="row between" style="margin-top:6px"><span class="small">' + Math.min(40, wprog) + '/40</span><span class="small">' + ui.rewardPreview({ gems: 80, eventTickets: 3 }) + '</span></div>' +
            (we.claimed ? '<span class="chip good">Claimed</span>' : '<button class="btn gold sm wide" style="margin-top:8px" data-ch="weekend"' + (wprog >= 40 ? '' : ' disabled') + '>Claim</button>')
            : '<div class="small muted">Starts Saturday. Also doubles Event tickets from skill contests.</div>') + '</div>';
      }
      mm.set(html);
    }
    BE.camps.bindCamps(m, draw);
    m.el.addEventListener('click', async (e) => {
      const s = S();
      const t = e.target.closest('[data-et]');
      if (t) { tab = t.dataset.et; draw(m); return; }
      const c = e.target.closest('[data-contest]');
      if (c) { if (s.events.attempts[c.dataset.contest] <= 0) return; s.events.attempts[c.dataset.contest]--; BE.contests.play(c.dataset.contest, () => draw(m)); return; }
      const ca = e.target.closest('[data-contestad]');
      if (ca) {
        if ((s.ads.counts.contest || 0) >= D.ads.contest.daily) return;
        const r = await BE.services.rewardedAd('contest');
        if (!r.ok) return;
        s.ads.counts.contest = (s.ads.counts.contest || 0) + 1;
        s.events.attempts[ca.dataset.contestad]++;
        draw(m); return;
      }
      if (e.target.closest('[data-tour]')) { runTourney(() => draw(m)); return; }
      const ch = e.target.closest('[data-ch]');
      if (ch) {
        if (ch.dataset.ch === 'week') { const wc = weeklyChallenge(s); if (wc.st.claimed || wc.prog < wc.c.goal) return; wc.st.claimed = true; ui.rewardsPopup('CHALLENGE COMPLETE', E.grant(s, { gems: 60, eventTickets: 2, tickets: 1 })); }
        else { const we = weekendEvent(s); if (we.claimed) return; we.claimed = true; ui.rewardsPopup('WEEKEND CHAMPION', E.grant(s, { gems: 80, eventTickets: 3 })); }
        changed(); draw(m);
      }
    });
  }

  async function runTourney(done) {
    const s = S();
    const r = G.runTournament(s);
    if (!r.ok) { ui.toast(r.reason, 'bad', 'x'); return; }
    const m = ui.modal({ title: 'Weekly Invitational', center: true, noClose: true, html: '<div class="col" data-tr></div><div data-tr2 style="margin-top:10px"></div>' });
    const list = $('[data-tr]', m.el);
    for (let i = 0; i < r.results.length; i++) {
      await new Promise((res) => setTimeout(res, 650));
      const x = r.results[i];
      list.insertAdjacentHTML('beforeend', '<div class="lb-row" style="animation:popIn .3s"><span class="rk" style="font-size:14px;color:' + (x.won ? 'var(--good)' : 'var(--bad)') + '">' + (x.won ? 'W' : 'L') + '</span><span>' + x.round + ' vs ' + U.esc(x.opp) + '</span><span class="num">' + x.score[0] + '-' + x.score[1] + '</span></div>');
      BE.audio.play(x.won ? 'cheer' : 'groan', { v: 0.6 });
    }
    await new Promise((res) => setTimeout(res, 500));
    if (r.wins === 4) { BE.audio.play('champion'); BE.court.confetti(80); } else BE.audio.play('claim');
    const adLeft = (s.ads.counts.tourney || 0) < D.ads.tourney.daily;
    $('[data-tr2]', m.el).innerHTML = '<div style="text-align:center"><div class="h1" style="color:var(--gold)">' + r.placement.toUpperCase() + '</div><div class="small muted">+' + r.pts + ' league points</div><div class="row wrap" style="justify-content:center;margin:8px 0">' + r.granted.map((g) => ui.rewChip(g.k, g.v)).join(' ') + '</div>' +
      '<div class="row">' + (adLeft ? '<button class="btn green grow" data-tad>' + icon('tv') + ' Double rewards</button>' : '') + '<button class="btn gold grow" data-tdone>Collect</button></div></div>';
    m.el.addEventListener('click', async (e) => {
      if (e.target.closest('[data-tdone]')) { m.close(); ui.flyCurrency('cash', null, 6); done && done(); changed(); }
      if (e.target.closest('[data-tad]')) {
        const rr = await BE.services.rewardedAd('tourney');
        if (!rr.ok) return;
        s.ads.counts.tourney = (s.ads.counts.tourney || 0) + 1;
        E.grant(s, { cash: r.reward.cash, gems: r.reward.gems, eventTickets: r.reward.eventTickets });
        ui.toast('Tournament rewards doubled!', 'gold', 'trophy');
        e.target.closest('[data-tad]').remove();
      }
    });
    s.stats.contests += 0;
  }

  // ---------- Social ----------
  function socialModal(startTab) {
    let tab = startTab || 'global';
    const m = ui.modal({ title: 'Leagues & Social', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      let html = '<div class="tabs">' + [['global', 'Global'], ['friends', 'Rivals'], ['alliance', 'Franchise'], ['showcase', 'Showcase']].map((t) => '<button class="tab' + (t[0] === tab ? ' active' : '') + '" data-st="' + t[0] + '">' + t[1] + '</button>').join('') + '</div>';
      html += '<div class="dev-banner" style="margin-bottom:10px;font-size:11.5px"><b>OFFLINE SIMULATION.</b> Online play isn\'t connected yet, so other franchises are simulated on your device. Your own score is real.</div>';
      if (tab === 'global' || tab === 'friends') {
        const rows = G.social.leaderboard(s, tab);
        const me = rows.find((r) => r.me);
        html += '<div class="card" style="margin-bottom:10px"><div class="row between"><div><div class="label">Your empire score</div><div class="power-num">' + U.fmtInt(me.score) + '</div></div><div style="text-align:right"><div class="label">Rank</div><div class="h1">#' + me.rank + '</div></div></div><div class="small muted">Score = stages cleared, Legacy Stars, collection, championships and lifetime cash.</div></div><div class="col" style="gap:4px">';
        for (const r of rows) {
          if (!r.me && r.rank > 15 && Math.abs(r.rank - me.rank) > 2) continue;
          html += '<div class="lb-row' + (r.me ? ' me' : '') + '"><span class="rk' + (r.rank <= 3 ? ' top' : '') + '">' + r.rank + '</span><span style="min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">' + U.esc(r.name) + ' <span class="muted small">W' + r.world + (r.prestige ? ' · ★' + r.prestige : '') + '</span></span><span class="num">' + U.fmtInt(r.score) + '</span></div>';
        }
        html += '</div>';
      } else if (tab === 'alliance') {
        const pr = G.social.allianceProgress(s);
        if (!pr) {
          html += '<div class="small muted" style="margin-bottom:8px">Join a franchise alliance. Every win you earn counts toward the alliance\'s weekly goal, unlocking reward chests for all members.</div><div class="col">';
          for (const al of D.alliances) html += '<div class="urow"><div class="uic">' + icon('social') + '</div><div class="ut"><div class="n">' + al.name + '</div><div class="d">"' + al.motto + '" · ' + al.members + '/30 members</div></div><button class="btn sm" data-join="' + al.k + '">Join</button></div>';
          html += '</div>';
        } else {
          html += '<div class="card"><div class="h2">' + pr.al.name + '</div><div class="small muted">"' + pr.al.motto + '" · ' + pr.al.members + ' members</div><div class="kv" style="margin-top:8px"><span>Alliance wins this week</span><span>' + U.fmtInt(pr.total) + '</span><span>Your contribution</span><span>' + U.fmtInt(pr.mine) + '</span></div></div><div class="col" style="margin-top:10px">';
          pr.tiers.forEach((goal, i) => {
            const claimed = s.social.claimed.includes(i);
            const rw = { gems: 20 + i * 20, tickets: i >= 2 ? 1 : 0, eventTickets: i >= 1 ? 1 : 0 };
            html += '<div class="mission"><div class="mt"><div class="n">Chest ' + (i + 1) + ' · ' + U.fmtInt(goal) + ' alliance wins</div><div class="small">' + ui.rewardPreview(rw) + '</div><div class="bar"><i style="width:' + Math.min(100, pr.total / goal * 100) + '%"></i></div></div>' +
              (claimed ? '<span class="chip good">' + icon('check') + '</span>' : '<button class="btn xs gold" data-chest="' + i + '"' + (pr.total >= goal && pr.mine >= 5 ? '' : ' disabled') + '>Open</button>') + '</div>';
          });
          html += '</div><div class="small muted" style="margin-top:6px">Contribute at least 5 wins to open chests. Chests reset weekly.</div><button class="btn ghost sm" style="margin-top:10px" data-leave>Leave alliance</button>';
        }
      } else {
        const ls = E.lineupAthletes(s).slice(0, 5);
        const cos = G.cosmetic(s);
        html += '<div class="card" data-showcase style="background:linear-gradient(160deg,' + cos.jersey[1] + ',#0a0e1d)"><div class="row">' + ui.crestHTML(s) + '<div class="grow"><div class="h2">' + U.esc(s.franchise.name) + '</div><div class="small muted">World ' + (E.worldOf(s.best) + 1) + ' · ' + s.stats.championships + ' titles · ★' + s.prestige.count + ' dynasties</div></div></div>' +
          '<div class="lineup" style="margin-top:10px">' + ls.map((a) => ui.athleteCard(s, a)).join('') + '</div>' +
          '<div class="kv" style="margin-top:10px"><span>Team power</span><span>⚡ ' + U.fmt(E.teamPower(s)) + '</span><span>Record</span><span>' + U.fmtInt(s.stats.wins) + '-' + U.fmtInt(s.stats.losses) + '</span><span>Collection</span><span>' + s.stats.unique + '/301</span></div></div>' +
          '<button class="btn blue wide" style="margin-top:10px" data-share>' + icon('share') + ' Copy showcase text</button>';
      }
      mm.set(html);
    }
    m.el.addEventListener('click', async (e) => {
      const s = S();
      const t = e.target.closest('[data-st]');
      if (t) { tab = t.dataset.st; draw(m); return; }
      const j = e.target.closest('[data-join]');
      if (j) { s.social.alliance = j.dataset.join; s.social.contributed = 0; BE.audio.play('claim'); ui.toast('Welcome to the alliance!', 'good', 'social'); changed(); draw(m); return; }
      if (e.target.closest('[data-leave]')) { const ok = await ui.confirmBox('Leave alliance?', '<div>Your weekly contribution resets.</div>', 'Leave'); if (ok) { s.social.alliance = null; s.social.contributed = 0; s.social.claimed = []; draw(m); } return; }
      const ch = e.target.closest('[data-chest]');
      if (ch) {
        const i = +ch.dataset.chest;
        if (s.social.claimed.includes(i)) return;
        s.social.claimed.push(i);
        ui.rewardsPopup('ALLIANCE CHEST', E.grant(s, { gems: 20 + i * 20, tickets: i >= 2 ? 1 : 0, eventTickets: i >= 1 ? 1 : 0 }));
        draw(m); return;
      }
      if (e.target.closest('[data-share]')) {
        const ls = E.lineupAthletes(s).slice(0, 5).map((a) => A.tpl(a.cid)).map((t) => t.first + ' ' + t.last + ' (' + D.rarities[t.rarity].name + ')').join(', ');
        const text = s.franchise.name + ' — Basketball Empire\nWorld ' + (E.worldOf(s.best) + 1) + ' · ' + s.stats.championships + ' championships · Team power ' + U.fmt(E.teamPower(s)) + '\nStarters: ' + ls;
        try { await navigator.clipboard.writeText(text); ui.toast('Showcase copied to clipboard', 'good', 'share'); }
        catch (err) { ui.modal({ title: 'Copy showcase', center: true, html: '<textarea class="textin" readonly>' + U.esc(text) + '</textarea>' }); }
      }
    });
  }

  // ---------- World map ----------
  function mapModal() {
    const s = S();
    let html = '<div class="small muted" style="margin-bottom:10px">Your road from the blacktop to the Multiverse. Win each world\'s championship to advance.</div><div class="wmap">';
    D.worlds.forEach((w, i) => {
      const unlocked = s.best >= i * 10;
      const cur = E.worldOf(Math.min(s.run.cleared, 99)) === i;
      const won = s.best >= i * 10 + 10;
      html += '<div class="wnode' + (unlocked ? '' : ' locked') + (cur ? ' current' : '') + '" style="--wc:' + w.color + '"><div class="wn">' + (i + 1) + '</div><div class="grow"><div class="h3">' + w.name + (won ? ' <span style="color:var(--gold)">' + icon('trophy') + '</span>' : '') + '</div><div class="small muted">' + (unlocked ? w.arena + ' · ' + w.tagline : 'Locked · win the ' + D.worlds[Math.max(0, i - 1)].champ) + '</div>' +
        '<div class="row wrap" style="gap:4px;margin-top:4px">' + w.unlocks.map((u) => '<span class="chip">' + u + '</span>').join('') + '</div></div>' + (cur ? '<span class="chip gold">YOU</span>' : '') + '</div>';
    });
    html += '</div>';
    if (s.best >= 100) html = '<div class="card" style="margin-bottom:10px;border-color:var(--info)"><b>Multiverse Rifts unlocked</b><div class="small muted">Endless stages beyond World 10. Best rift: ' + Math.max(0, s.best - 99) + '</div></div>' + html;
    return ui.modal({ title: 'Road to the Empire', html });
  }

  // ---------- Tactics ----------
  function tacticsModal() {
    const m = ui.modal({ title: 'Tactics', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      const opp = G.oppTeam(s, G.target(s).g, G.target(s).mode === 'champ' ? G.target(s).round : undefined);
      const scouted = (s.facilities.scouting || 0) > 0 || (s.coaches.analytics || 0) > 0;
      let html = '<div class="card flat" style="margin-bottom:10px"><div class="label">Scouting report · ' + U.esc(opp.name) + '</div>' +
        (scouted ? '<div style="margin-top:4px">Offense: <b>' + D.tactics.off.find((x) => x.k === opp.style.off).name + '</b> · Defense: <b>' + D.tactics.def.find((x) => x.k === opp.style.def).name + '</b></div>' : '<div class="small muted" style="margin-top:4px">' + icon('lock') + ' Build the Scouting Department to reveal opponent styles.</div>') + '</div>';
      html += '<div class="small muted" style="margin-bottom:8px">A counter gives +' + Math.round(E.mods(s).sim.tactic * 100) + '% effectiveness on that side of the ball.</div>';
      for (const side of ['off', 'def']) {
        html += '<div class="h3" style="margin:8px 0 6px">' + (side === 'off' ? 'Offense' : 'Defense') + '</div><div class="col" style="gap:6px">';
        for (const t of D.tactics[side]) {
          const sel = s.tactics[side] === t.k;
          const good = scouted && (side === 'off' ? D.offCounters[t.k] === opp.style.def : D.defCounters[t.k] === opp.style.off);
          html += '<button class="urow" data-tac="' + side + ':' + t.k + '" style="text-align:left;' + (sel ? 'border-color:var(--accent);box-shadow:0 0 0 1px var(--accent)' : '') + '"><div class="ut"><div class="n">' + t.name + (good ? ' <span class="chip good">Counter</span>' : '') + '</div><div class="d">' + t.desc + '</div></div>' + (sel ? '<span class="chip gold">Active</span>' : '') + '</button>';
        }
        html += '</div>';
      }
      if ((s.coaches.analytics || 0) > 0 || s.purchases.autocoach) html += '<div class="row between card flat" style="margin-top:10px"><span>Auto-pick counters each game</span><button class="toggle' + (s.settings.autoTactics ? ' on' : '') + '" data-autotac aria-label="Auto tactics"></button></div>';
      mm.set(html);
    }
    m.el.addEventListener('click', (e) => {
      const s = S();
      const t = e.target.closest('[data-tac]');
      if (t) { const [side, k] = t.dataset.tac.split(':'); s.tactics[side] = k; s.settings.autoTactics = false; if (BE.play.R.match) BE.play.R.match.teams[0].tactic = { off: s.tactics.off, def: s.tactics.def }; BE.audio.play('click'); draw(m); return; }
      if (e.target.closest('[data-autotac]')) { s.settings.autoTactics = !s.settings.autoTactics; draw(m); }
    });
  }

  // ---------- Settings ----------
  function settingsModal() {
    const m = ui.modal({ title: 'Settings', render: (mm) => draw(mm) });
    function draw(mm) {
      const s = S();
      const st = s.settings;
      const cloud = BE.state.store.cloud.status;
      const tog = (k, label, sub) => '<div class="row between" style="padding:6px 0"><div><div>' + label + '</div>' + (sub ? '<div class="small muted">' + sub + '</div>' : '') + '</div><button class="toggle' + (st[k] ? ' on' : '') + '" data-tog="' + k + '" aria-label="' + label + '"></button></div>';
      let html = '<div class="card"><div class="h3">Sound</div><label class="row between" style="margin-top:8px" for="set-sfx"><span>' + icon('sound') + ' Effects</span><span class="num">' + Math.round(st.sfx * 100) + '%</span></label><input id="set-sfx" type="range" min="0" max="1" step="0.05" value="' + st.sfx + '" data-range="sfx">' +
        '<label class="row between" style="margin-top:8px" for="set-music"><span>' + icon('sound') + ' Music</span><span class="num">' + Math.round(st.music * 100) + '%</span></label><input id="set-music" type="range" min="0" max="1" step="0.05" value="' + st.music + '" data-range="music"></div>';
      html += '<div class="card" style="margin-top:10px"><div class="h3">Gameplay</div>' + tog('haptics', 'Vibration', 'Haptic feedback on supported phones') + tog('reduceMotion', 'Reduce motion', 'Fewer shakes, confetti and flying coins') + tog('commentary', 'Commentary', 'Play-by-play ticker') + tog('autoPush', 'Auto-push', 'Retry the next stage after 3 farm wins') + '</div>';
      html += '<div class="card" style="margin-top:10px"><div class="h3">Save data</div><div class="small muted" style="margin:4px 0 8px">Autosaves every few seconds on this device' + (cloud === 'on' ? ' and to your account (cloud save on).' : '.') + ' Use a save code to move progress between devices.</div>' +
        '<div class="row wrap"><button class="btn sm ghost grow" data-set="export">Export code</button><button class="btn sm ghost grow" data-set="import">Import code</button></div>' +
        '<div class="row wrap" style="margin-top:8px"><button class="btn sm ghost grow" data-set="tutorial">Replay tips</button><button class="btn sm ghost grow" data-set="reset" style="color:var(--bad)">Reset progress</button></div></div>';
      html += '<div class="card flat" style="margin-top:10px"><div class="h3">About</div><div class="small muted" style="margin-top:4px">Basketball Empire v1.0 · save v' + BE.state.SAVE_VERSION + '. ' + (BE.services.devMode ? 'Running in development mode: purchases and ads are test placeholders and never charge money.' : 'Store services connected.') + ' Recruitment odds are listed on the Recruit screen. All teams, athletes and leagues are fictional.</div>' +
        '<button class="btn xs ghost" style="margin-top:8px" data-set="odds">View recruitment odds</button></div>';
      mm.set(html);
    }
    m.el.addEventListener('input', (e) => {
      const r = e.target.closest('[data-range]');
      if (!r) return;
      const s = S();
      s.settings[r.dataset.range] = +r.value;
      BE.audio.setVolumes(s.settings.sfx, s.settings.music);
      const lab = r.previousElementSibling && r.previousElementSibling.querySelector('.num');
      if (lab) lab.textContent = Math.round(+r.value * 100) + '%';
    });
    m.el.addEventListener('click', async (e) => {
      const s = S();
      const t = e.target.closest('[data-tog]');
      if (t) {
        s.settings[t.dataset.tog] = !s.settings[t.dataset.tog];
        BE.audio.play('click');
        document.body.classList.toggle('reduce-motion', s.settings.reduceMotion);
        BE.court.C.reduceMotion = s.settings.reduceMotion;
        BE.play.renderToolbar();
        draw(m); return;
      }
      const b = e.target.closest('[data-set]');
      if (!b) return;
      const k = b.dataset.set;
      if (k === 'export') {
        BE.main.save();
        const code = BE.state.exportCode(s);
        const mm = ui.modal({ title: 'Your save code', center: true, html: '<div class="small muted" style="margin-bottom:6px">Copy this code somewhere safe. Import it on another device to continue.</div><textarea class="textin" id="save-export" readonly>' + code + '</textarea><button class="btn wide" style="margin-top:8px" data-copy>Copy</button>' });
        mm.el.addEventListener('click', async (ev) => {
          if (!ev.target.closest('[data-copy]')) return;
          try { await navigator.clipboard.writeText(code); ui.toast('Save code copied', 'good', 'check'); }
          catch (err) { const ta = $('#save-export', mm.el); ta.focus(); ta.select(); ui.toast('Select the text and copy it manually', '', 'info'); }
        });
      } else if (k === 'import') {
        const mm = ui.modal({ title: 'Import save', center: true, html: '<div class="small muted" style="margin-bottom:6px">Paste a save code. This replaces your current progress.</div><textarea class="textin" id="save-import"></textarea><div class="small" data-err style="color:var(--bad);min-height:18px"></div><button class="btn wide" data-go>Import</button>' });
        mm.el.addEventListener('click', (ev) => {
          if (!ev.target.closest('[data-go]')) return;
          try {
            const ns = BE.state.importCode($('#save-import', mm.el).value);
            BE.main.replaceState(ns);
            ui.closeAll();
            ui.toast('Save imported!', 'good', 'check');
          } catch (err) { $('[data-err]', mm.el).textContent = err.message || 'That code could not be read.'; }
        });
      } else if (k === 'reset') {
        const ok = await ui.confirmBox('Reset all progress?', '<div>This permanently erases your franchise on this device' + (BE.state.store.cloud.status === 'on' ? ' and your cloud save' : '') + '. Export a save code first if you might want it back.</div>', 'Erase everything', { cls: 'blue' });
        if (!ok) return;
        const ok2 = await ui.confirmBox('Are you sure?', '<div>There is no undo.</div>', 'Yes, reset');
        if (!ok2) return;
        BE.main.resetAll();
      } else if (k === 'tutorial') {
        s.seenFeatures = {};
        ui.toast('Feature tips will show again as you play', '', 'info');
      } else if (k === 'odds') BE.recruitUI.oddsModal();
    });
  }

  // ---------- Franchise ----------
  function franchiseModal() {
    const s = S();
    const m = ui.modal({
      title: 'Your Franchise',
      html: '<div class="row" style="gap:12px">' + ui.crestHTML(s).replace('class="crest"', 'class="crest" style="width:56px;height:56px;font-size:28px"') + '<div class="grow"><label class="label" for="fr-name">Franchise name</label><input id="fr-name" class="textin" maxlength="24" value="' + U.esc(s.franchise.name) + '"></div></div>' +
        '<div class="kv card flat" style="margin-top:12px"><span>Record</span><span>' + U.fmtInt(s.stats.wins) + '-' + U.fmtInt(s.stats.losses) + '</span><span>Championships</span><span>' + s.stats.championships + '</span><span>Dynasties (prestiges)</span><span>' + s.prestige.count + '</span><span>Fans</span><span>' + U.fmt(s.fans) + '</span><span>Lifetime cash</span><span>$' + U.fmt(s.stats.cashEarned) + '</span><span>Best stage</span><span>' + ui.stageName(Math.min(s.best, 99)) + '</span></div>' +
        '<div class="row" style="margin-top:12px"><button class="btn ghost grow" data-fr="looks">Team looks</button><button class="btn grow" data-fr="save">Save name</button></div>',
    });
    m.el.addEventListener('click', (e) => {
      const b = e.target.closest('[data-fr]');
      if (!b) return;
      if (b.dataset.fr === 'save') {
        const v = $('#fr-name', m.el).value.trim().slice(0, 24);
        if (v.length < 2) { ui.toast('Name must be at least 2 characters', 'bad', 'x'); return; }
        s.franchise.name = v; ui.renderHUD(s); m.close(); ui.toast('Franchise renamed', 'good', 'check');
        if (BE.play.R.match) BE.play.R.match.teams[0].name = v;
      } else { m.close(); if (E.unlocked(s, 'shop')) ui.go('shop'); else ui.toast('Team looks unlock with the Shop', '', 'lock'); }
    });
  }

  // ---------- Offline summary ----------
  function offlineModal(res) {
    const s = S();
    const capNote = res.capped ? '<div class="small" style="color:var(--gold)">Offline cap reached (' + E.mods(s).offlineCapH + 'h). Upgrade Medical Center, Business Manager and Night Shift to earn longer.</div>' : '';
    const adLeft = (s.ads.counts.offline || 0) < D.ads.offline.daily;
    const m = ui.modal({
      title: 'Welcome back, Coach!', center: true,
      html: '<div class="stack"><div class="muted">You were away <b>' + U.fmtTime(res.seconds) + '</b>. Your team kept grinding:</div>' +
        '<div class="kv card flat"><span>Games played</span><span>' + U.fmtInt(res.games) + '</span><span>Wins</span><span>' + U.fmtInt(res.wins) + '</span>' + (res.stages ? '<span>New stages cleared</span><span style="color:var(--gold)">+' + res.stages + '</span>' : '') +
        '<span>Fans gained</span><span>+' + U.fmt(res.fans) + '</span><span>Training points</span><span>+' + U.fmt(res.tp) + '</span>' + (res.division ? '<span>Dev League</span><span>$' + U.fmt(res.division) + '</span>' : '') + '<span>Offline efficiency</span><span>' + Math.round(res.eff * 100) + '%</span></div>' + capNote +
        '<div style="text-align:center"><div class="label">Cash earned</div><div class="h1" style="color:var(--good)">$' + U.fmt(res.cash) + '</div></div>' +
        '<div class="row"><button class="btn gold grow" data-off="collect">Collect</button>' + (adLeft ? '<button class="btn green grow stack" data-off="double">Double it<span class="sub">optional ad</span></button>' : '') + '</div></div>',
    });
    BE.audio.play('claim');
    m.el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-off]');
      if (!b) return;
      if (b.dataset.off === 'collect') { m.close(); ui.flyCurrency('cash', null, 10); return; }
      const r = await BE.services.rewardedAd('offline');
      if (!r.ok) { ui.toast('No bonus — the ad was not completed', '', 'tv'); return; }
      s.ads.counts.offline = (s.ads.counts.offline || 0) + 1;
      E.addCash(s, res.cash);
      m.close();
      ui.rewardsPopup('DOUBLED!', [{ k: 'cash', v: res.cash * 2 }], { sub: 'Total offline earnings' });
    });
    return m;
  }

  // ---------- Championship ceremony & world intro ----------
  function championCeremony(res, done) {
    const s = S();
    const w = res.champ.world;
    BE.audio.play('champion');
    BE.court.confetti(160);
    const chips = [ui.rewChip('gems', res.champ.gems), ui.rewChip('tickets', res.champ.tickets), ui.rewChip('eventTickets', res.champ.eventTickets), ui.rewChip('cash', res.cash)].join(' ');
    const next = w + 1;
    const m = ui.modal({
      center: true, noClose: true,
      html: '<div class="stack" style="text-align:center;align-items:center"><div class="label" style="color:var(--gold)">' + D.worlds[w].champ + '</div><div class="trophy-hero">' + ui.trophyArt + '</div>' +
        '<div class="h1">' + U.esc(s.franchise.name) + '</div><div class="h2" style="color:var(--gold)">WORLD ' + (w + 1) + ' CHAMPIONS</div>' +
        '<div class="row wrap" style="justify-content:center;gap:8px">' + chips + '</div>' +
        (res.champ.gear ? '<div class="row" style="justify-content:center">' + ui.gearBadge(res.champ.gear) + '<span class="small">' + ui.gearName(res.champ.gear) + '</span></div>' : '') +
        '<button class="btn gold wide" data-cc>' + (next < 10 ? 'On to ' + D.worlds[next].name : 'Enter the Multiverse Rifts') + '</button></div>',
    });
    m.el.addEventListener('click', (e) => {
      if (!e.target.closest('[data-cc]')) return;
      m.close();
      ui.flyCurrency('gems', null, 8);
      if (next < 10) worldIntro(next, () => maybeInterstitial(done));
      else maybeInterstitial(done);
    });
  }
  function worldIntro(w, done) {
    const W = D.worlds[w];
    BE.audio.play('milestone');
    const m = ui.modal({
      center: true, noClose: true,
      html: '<div class="stack" style="text-align:center;align-items:center"><div class="wn" style="width:68px;height:68px;border-radius:50%;display:grid;place-items:center;font-family:var(--display);font-size:36px;background:' + W.color + ';color:#0b0f1f;box-shadow:0 0 30px ' + W.color + '">' + (w + 1) + '</div>' +
        '<div class="label">New world unlocked</div><div class="h1" style="color:' + W.color + '">' + W.name + '</div><div class="muted">' + W.tagline + '</div>' +
        '<div class="card flat" style="width:100%;text-align:left"><div class="label">Home arena</div><b>' + W.arena + '</b><div class="label" style="margin-top:8px">What\'s new</div><div class="row wrap" style="gap:4px;margin-top:4px">' + W.unlocks.map((u) => '<span class="chip info">' + u + '</span>').join('') + '</div>' +
        '<div class="small muted" style="margin-top:8px">New recruits from this world join the scouting pool, and gear drops now come from the ' + W.set + ' set.</div></div>' +
        '<button class="btn wide" data-wi>Let\'s go</button></div>',
    });
    m.el.addEventListener('click', (e) => { if (e.target.closest('[data-wi]')) { m.close(); done && done(); } });
  }
  function maybeInterstitial(done) {
    const s = S();
    const now = Date.now();
    const sessionMin = (now - BE.main.sessionStart) / 60000;
    if (s.purchases.vip || sessionMin < 20 || now - s.ads.lastInterstitial < 15 * 60000 || s.best < 20) { done && done(); return; }
    s.ads.lastInterstitial = now;
    BE.services.interstitial().then(() => done && done());
  }

  // ---------- Feature intros ----------
  const INTROS = {
    growth: ['Team Growth', 'Franchise-wide stats live under the court on the Home tab: Offense, Defense, Conditioning and more. They are cheap, always available, and multiply every athlete you own.', 'play'],
    boosts: ['Boosts & Halftime Spin', 'Two 20-minute boosts (free once a day each) and a daily spin for gems, tickets and gear, right on the Home tab.', 'play'],
    camps: ['Training Camps', 'Cash, Scrap and Shard Camps plus Boss Rush: 2 keys each per day, pick your tier, clear it to unlock the next. Find them under Camps on the Home tab.', 'play'],
    facilities: ['Facilities unlocked!', 'Upgrade your Home Court and Weight Room in the Empire tab. Facilities give permanent multipliers.', 'empire'],
    missions: ['Missions & Daily Rewards', 'Daily and weekly missions plus login rewards are on the Play screen hub. They pay gems, tickets and Pass XP.', 'play'],
    shop: ['The Shop is open', 'Claim a free daily gift, earn optional ad rewards, and customize your team\'s look.', 'shop'],
    coaches: ['Hire your Head Coach', 'Coaches give big passive bonuses. Find them in Empire → Coaches.', 'empire'],
    gear: ['Equipment drops!', 'Wins can drop sneakers, jerseys and more. Equip them from the Team tab to boost power and attributes.', 'team'],
    training: ['Attribute training', 'Your team now earns training points over time. Spend them on attributes in an athlete\'s profile to raise OVR.', 'team'],
    pass: ['Season Pass', 'Missions and wins earn Pass XP. 30 free reward tiers every month, with an optional premium track.', 'play'],
    events: ['Skill Contests', 'Free Throw, 3-Point and Slam Dunk contests are live in Events. You control the timing!', 'play'],
    tactics: ['Tactics', 'Choose offense and defense schemes. Counter the opponent\'s style for a bonus.', 'play'],
    social: ['Leagues & Social', 'Climb the leaderboards, join a franchise alliance and show off your squad.', 'play'],
    tourney: ['Weekly Tournament', 'Enter the 16-team Weekly Invitational up to 3 times a week to climb leagues.', 'play'],
    division: ['Development League', 'Your bench now plays in a second division and earns cash while your starters play.', 'empire'],
    craft: ['Gear crafting', 'Turn scrap into Rare-or-better gear in Team → Gear.', 'team'],
    prestige: ['Legacy (prestige)', 'After winning World 3, retire your run for Legacy Stars and permanent bonuses. Check Empire → Legacy.', 'empire'],
    autocoach: ['Auto-Coaching', 'Abilities can now fire automatically while you idle. Toggle "Auto" on the Play screen.', 'play'],
  };
  function checkFeatureIntros() {
    const s = S();
    if (!s.tutorial.done || ui.anyModal()) return false;
    for (const k in INTROS) {
      if (E.unlocked(s, k) && !s.seenFeatures[k]) {
        s.seenFeatures[k] = true;
        const it = INTROS[k];
        ui.renderNav(s);
        BE.play.renderHub(); BE.play.renderToolbar(); BE.play.renderControls();
        const m = ui.modal({ center: true, html: '<div class="stack" style="text-align:center;align-items:center"><span class="chip gold">NEW</span><div class="h2">' + it[0] + '</div><div class="muted">' + it[1] + '</div><div class="row" style="width:100%"><button class="btn ghost grow" data-close>Later</button><button class="btn grow" data-fi>Show me</button></div></div>' });
        BE.audio.play('milestone');
        m.el.addEventListener('click', (e) => {
          if (!e.target.closest('[data-fi]')) return;
          m.close();
          if (it[2] !== 'play') ui.go(it[2]);
          if (k === 'coaches') BE.empire.setTab('coaches');
          if (k === 'division') BE.empire.setTab('division');
          if (k === 'prestige') BE.empire.setTab('legacy');
          if (k === 'gear' || k === 'craft') BE.team.setTab('gear');
          if (it[2] !== 'play') BE.ui.renderScreen(it[2]);
          if (k === 'missions') missionsModal();
          if (k === 'events') eventsModal('contests');
          if (k === 'camps') eventsModal('camps');
          if (k === 'tourney') eventsModal('tourney');
          if (k === 'social') socialModal();
          if (k === 'pass') passModal();
          if (k === 'tactics') tacticsModal();
        });
        return true;
      }
    }
    return false;
  }

  BE.meta = { missionsModal, dailyModal, passModal, eventsModal, socialModal, mapModal, tacticsModal, settingsModal, franchiseModal, offlineModal, championCeremony, worldIntro, checkFeatureIntros, INTROS };
})(typeof window !== 'undefined' ? window : globalThis);
