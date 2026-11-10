/* Basketball Empire — procedural Web Audio sound effects and music (no external assets) */
(function (root) {
  'use strict';
  const BE = (root.BE = root.BE || {});
  const A = {
    ctx: null, master: null, sfxGain: null, musicGain: null, crowdGain: null, noiseBuf: null,
    sfxVol: 0.8, musicVol: 0.35, musicOn: false, musicTimer: null, step: 0, nextTime: 0, crowdSrc: null, last: {},
  };

  function ensure() {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return true; }
    const AC = root.AudioContext || root.webkitAudioContext;
    if (!AC) return false;
    try {
      A.ctx = new AC();
      A.master = A.ctx.createGain(); A.master.gain.value = 0.9; A.master.connect(A.ctx.destination);
      const comp = A.ctx.createDynamicsCompressor(); comp.connect(A.master);
      A.sfxGain = A.ctx.createGain(); A.sfxGain.gain.value = A.sfxVol; A.sfxGain.connect(comp);
      A.musicGain = A.ctx.createGain(); A.musicGain.gain.value = A.musicVol * 0.5; A.musicGain.connect(comp);
      A.crowdGain = A.ctx.createGain(); A.crowdGain.gain.value = 0; A.crowdGain.connect(A.sfxGain);
      const len = A.ctx.sampleRate * 2;
      A.noiseBuf = A.ctx.createBuffer(1, len, A.ctx.sampleRate);
      const d = A.noiseBuf.getChannelData(0);
      for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      startCrowdBed();
      return true;
    } catch (e) { console.warn('Audio unavailable', e); A.ctx = null; return false; }
  }

  function env(g, t, a, d, peak) {
    g.gain.cancelScheduledValues(t);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }
  function osc(type, freq, t, dur, peak, dest, freqEnd) {
    const o = A.ctx.createOscillator(), g = A.ctx.createGain();
    o.type = type; o.frequency.setValueAtTime(freq, t);
    if (freqEnd) o.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    env(g, t, 0.005, dur, peak);
    o.connect(g); g.connect(dest || A.sfxGain);
    o.start(t); o.stop(t + dur + 0.05);
  }
  function noise(t, dur, peak, filterType, freq, q, dest, freqEnd) {
    const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf;
    s.playbackRate.value = 1;
    const f = A.ctx.createBiquadFilter(); f.type = filterType; f.frequency.setValueAtTime(freq, t); f.Q.value = q || 1;
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    const g = A.ctx.createGain(); env(g, t, 0.004, dur, peak);
    s.connect(f); f.connect(g); g.connect(dest || A.sfxGain);
    s.start(t, Math.random()); s.stop(t + dur + 0.05);
  }

  function startCrowdBed() {
    const s = A.ctx.createBufferSource(); s.buffer = A.noiseBuf; s.loop = true;
    const f = A.ctx.createBiquadFilter(); f.type = 'bandpass'; f.frequency.value = 900; f.Q.value = 0.6;
    s.connect(f); f.connect(A.crowdGain); s.start();
    A.crowdSrc = s;
  }
  function setAmbience(level) {
    if (!A.ctx) return;
    A.crowdGain.gain.setTargetAtTime(Math.max(0, level) * 0.05, A.ctx.currentTime, 0.4);
  }

  const notes = (n) => 440 * Math.pow(2, (n - 69) / 12);

  const SFX = {
    click(t) { osc('triangle', 880, t, 0.06, 0.25); osc('sine', 1320, t + 0.01, 0.05, 0.12); },
    tab(t) { osc('sine', 660, t, 0.05, 0.18); },
    bounce(t, o) { osc('sine', 120, t, 0.12, 0.5 * (o.v || 1), null, 55); noise(t, 0.03, 0.15 * (o.v || 1), 'lowpass', 500); },
    squeak(t) { const f = 2200 + Math.random() * 900; osc('square', f, t, 0.07, 0.04, null, f * 1.25); },
    pass(t) { noise(t, 0.08, 0.15, 'bandpass', 1800, 2, null, 900); },
    swish(t) { noise(t, 0.28, 0.45, 'highpass', 3000, 0.7, null, 6000); },
    rimin(t) { osc('triangle', 520, t, 0.15, 0.25); noise(t + 0.05, 0.25, 0.3, 'highpass', 3000); },
    rim(t) { osc('square', 330, t, 0.25, 0.12, null, 300); osc('triangle', 690, t, 0.35, 0.18); noise(t, 0.05, 0.2, 'bandpass', 2500, 3); },
    dunk(t) { osc('sine', 90, t, 0.35, 0.9, null, 40); noise(t, 0.25, 0.6, 'lowpass', 1200); osc('square', 220, t, 0.4, 0.1, null, 180); SFX.cheer(t + 0.05, { v: 1 }); },
    block(t) { noise(t, 0.12, 0.6, 'lowpass', 900); osc('sine', 150, t, 0.2, 0.4, null, 70); },
    steal(t) { noise(t, 0.1, 0.3, 'bandpass', 1400, 2); osc('triangle', 500, t, 0.12, 0.12, null, 900); },
    whistle(t) { osc('sine', 2900, t, 0.35, 0.18); osc('sine', 3050, t, 0.35, 0.12); },
    buzzer(t) { osc('sawtooth', 220, t, 0.9, 0.22); osc('square', 223, t, 0.9, 0.12); },
    cheer(t, o) { const v = o.v === undefined ? 0.6 : o.v; noise(t, 1.2 + v, 0.18 + v * 0.3, 'bandpass', 1100, 0.5); noise(t + 0.05, 0.9 + v, 0.1 + v * 0.15, 'bandpass', 2500, 0.8); },
    groan(t) { noise(t, 0.8, 0.12, 'bandpass', 500, 0.8, null, 300); },
    coin(t) { osc('square', notes(88), t, 0.07, 0.12); osc('square', notes(93), t + 0.07, 0.18, 0.12); },
    upgrade(t, o) {
      const base = 72 + Math.min(12, (o.combo || 0));
      [0, 4, 7, 12].forEach((n, i) => osc('triangle', notes(base + n), t + i * 0.05, 0.16, 0.22));
      osc('sine', notes(base + 24), t + 0.2, 0.25, 0.08);
    },
    milestone(t) { [0, 4, 7, 12, 16, 19, 24].forEach((n, i) => osc('triangle', notes(72 + n), t + i * 0.06, 0.3, 0.2)); SFX.cheer(t + 0.2, { v: 0.6 }); },
    error(t) { osc('square', 180, t, 0.12, 0.12, null, 140); },
    win(t) {
      const seq = [72, 76, 79, 84, 79, 84, 88];
      seq.forEach((n, i) => { osc('square', notes(n), t + i * 0.11, 0.14, 0.1); osc('triangle', notes(n - 12), t + i * 0.11, 0.14, 0.15); });
      SFX.cheer(t, { v: 1 });
    },
    lose(t) { [67, 63, 60].forEach((n, i) => osc('triangle', notes(n), t + i * 0.18, 0.3, 0.15)); },
    champion(t) {
      const seq = [60, 64, 67, 72, 76, 79, 84];
      seq.forEach((n, i) => { osc('sawtooth', notes(n), t + i * 0.09, 0.4, 0.07); osc('triangle', notes(n + 12), t + i * 0.09, 0.4, 0.1); });
      [72, 76, 79, 84].forEach((n) => osc('triangle', notes(n), t + 0.75, 1.4, 0.12));
      SFX.cheer(t, { v: 1 }); SFX.cheer(t + 0.8, { v: 1 });
    },
    drumroll(t, o) { const n = Math.round((o.dur || 1.2) / 0.05); for (let i = 0; i < n; i++) noise(t + i * 0.05, 0.05, 0.08 + 0.2 * i / n, 'bandpass', 220, 1.2); },
    reveal(t, o) {
      const r = o.rarity || 0;
      const chords = [[60, 64, 67], [62, 66, 69], [64, 68, 71], [65, 69, 72, 76], [67, 71, 74, 79], [69, 73, 76, 81, 85]];
      chords[r].forEach((n, i) => { osc('triangle', notes(n + 12), t + i * 0.04, 0.6 + r * 0.25, 0.12 + r * 0.02); if (r >= 3) osc('sawtooth', notes(n), t + i * 0.04, 0.8 + r * 0.2, 0.04); });
      if (r >= 3) { osc('sine', 60, t, 0.8, 0.5, null, 30); SFX.cheer(t, { v: r / 5 }); }
      if (r >= 4) { for (let i = 0; i < 8; i++) osc('sine', notes(96 + (i % 4) * 3), t + 0.3 + i * 0.06, 0.12, 0.05); }
    },
    whoosh(t) { noise(t, 0.35, 0.25, 'bandpass', 400, 1, null, 3000); },
    claim(t) { [79, 84, 88, 91].forEach((n, i) => osc('triangle', notes(n), t + i * 0.06, 0.18, 0.16)); },
  };

  function play(k, o) {
    if (!A.ctx || A.sfxVol <= 0) return;
    const fn = SFX[k];
    if (!fn) return;
    const now = A.ctx.currentTime;
    // throttle repeated identical sounds
    const minGap = k === 'bounce' ? 0.06 : k === 'cheer' ? 0.25 : 0.03;
    if (A.last[k] && now - A.last[k] < minGap) return;
    A.last[k] = now;
    try { fn(now + 0.005, o || {}); } catch (e) { /* ignore audio scheduling errors */ }
  }

  // ---------- Music: laid-back hip-hop loop, 88 BPM ----------
  const BPM = 88, STEP = 60 / BPM / 4;
  const prog = [[50, 57, 62, 65], [46, 53, 58, 62], [48, 55, 60, 64], [45, 52, 57, 61]];
  const bassLine = [38, -1, -1, 38, -1, -1, 45, -1, 38, -1, 41, -1, 43, -1, 45, -1];
  function scheduleMusic() {
    if (!A.ctx || !A.musicOn) return;
    while (A.nextTime < A.ctx.currentTime + 0.25) {
      const t = A.nextTime, s = A.step % 16, bar = Math.floor(A.step / 16) % 4;
      const swing = s % 2 ? STEP * 0.12 : 0;
      const dst = A.musicGain;
      if (s === 0 || s === 7 || s === 10) osc('sine', 110, t, 0.22, 0.7, dst, 45);
      if (s === 4 || s === 12) noise(t, 0.16, 0.28, 'bandpass', 1800, 0.8, dst);
      if (s % 2 === 0) noise(t + swing, 0.04, 0.07, 'highpass', 7000, 1, dst);
      const bn = bassLine[s];
      if (bn > 0) osc('triangle', notes(bn + (bar === 1 ? -4 : bar === 2 ? -2 : bar === 3 ? -5 : 0)), t, STEP * 1.8, 0.22, dst);
      if (s === 0 || s === 8) prog[bar].forEach((n, i) => osc('sine', notes(n + 12), t + i * 0.012, STEP * 7, 0.035, dst));
      if (s === 14 && bar % 2 === 1) osc('triangle', notes(prog[bar][3] + 24), t, STEP * 2, 0.04, dst);
      A.nextTime += STEP;
      A.step++;
    }
  }
  function setMusic(on) {
    A.musicOn = on && A.musicVol > 0;
    if (!A.ctx) return;
    if (A.musicOn && !A.musicTimer) {
      A.nextTime = A.ctx.currentTime + 0.1;
      A.musicTimer = setInterval(scheduleMusic, 90);
    } else if (!A.musicOn && A.musicTimer) { clearInterval(A.musicTimer); A.musicTimer = null; }
  }
  function setVolumes(sfx, music) {
    A.sfxVol = sfx; A.musicVol = music;
    if (A.ctx) {
      A.sfxGain.gain.setTargetAtTime(sfx, A.ctx.currentTime, 0.05);
      A.musicGain.gain.setTargetAtTime(music * 0.5, A.ctx.currentTime, 0.05);
    }
    setMusic(music > 0);
  }
  function suspend(yes) {
    if (!A.ctx) return;
    if (yes) A.ctx.suspend(); else A.ctx.resume();
  }

  BE.audio = { ensure, play, setVolumes, setMusic, setAmbience, suspend, state: A };
})(typeof window !== 'undefined' ? window : globalThis);
