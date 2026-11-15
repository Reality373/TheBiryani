// Web Audio engine: every sound is synthesised, nothing is loaded. Recipes: docs/research/07-web-audio.md.
// Graph: bed gain -> dry bus -> muffle lowpass x2 -> master; rain -> its own lowpass -> master;
// master -> limiter -> destination. Hits go to the dry bus; steam and chime also send to a reverb
// whose return goes through the dry bus (so it is muffled like everything else).

const BEDS = ['rain', 'flame', 'sizzle', 'simmer', 'drone'];
const OPEN = 18000, DRY_CLOSED = 600, RAIN_CLOSED = 2000;
const rnd = (a, b) => a + Math.random() * (b - a);
const clamp01 = (x) => Math.min(1, Math.max(0, Number(x) || 0));
const cutoff = (open, closed, amount) => open * (closed / open) ** amount; // exponential, never 0

// Cancel, pin to the current value, then ramp: quick successive calls neither click nor throw.
function ramp(param, to, sec, now) {
  param.cancelScheduledValues(now);
  param.setValueAtTime(param.value, now);
  param.linearRampToValueAtTime(to, now + Math.max(sec, 0.01));
}

function makeIR(ctx, sec = 1.8, k = 4) {
  const n = Math.floor(ctx.sampleRate * sec), ir = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp((-k * i / n) * 2.3);
  }
  return ir;
}

function makeNoise(ctx, sec = 4) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate), d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}

const filt = (ctx, type, frequency, Q = 0.7) => new BiquadFilterNode(ctx, { type, frequency, Q });
const pan = (ctx, p) => new StereoPannerNode(ctx, { pan: p });

// Short enveloped noise burst through one filter.
function tick(ctx, noise, out, { t = ctx.currentTime, type = 'bandpass', freq, q = 1, len = 0.01, peak = 0.5, p }) {
  const s = new AudioBufferSourceNode(ctx, { buffer: noise });
  const e = new GainNode(ctx, { gain: 0 });
  e.gain.setValueAtTime(0, t);
  e.gain.linearRampToValueAtTime(peak, t + 0.002);
  e.gain.exponentialRampToValueAtTime(0.001, t + 0.002 + len);
  const f = s.connect(filt(ctx, type, freq, q)).connect(e);
  (p === undefined ? e : e.connect(pan(ctx, p))).connect(out);
  s.start(t, rnd(0, noise.duration - 0.2), len + 0.02);
  return f;
}

// Short decaying oscillator with an exponential pitch glide f -> to.
function tone(ctx, out, { t = ctx.currentTime, f, to = f, atk = 0.003, dec, peak, type = 'sine', p, done }) {
  const o = new OscillatorNode(ctx, { type, frequency: f });
  const g = new GainNode(ctx, { gain: 0 });
  o.frequency.setValueAtTime(f, t);
  o.frequency.exponentialRampToValueAtTime(to, t + atk + dec);
  g.gain.setValueAtTime(0, t);
  g.gain.linearRampToValueAtTime(peak, t + atk);
  g.gain.exponentialRampToValueAtTime(0.0001, t + atk + dec);
  o.connect(g);
  (p === undefined ? g : g.connect(pan(ctx, p))).connect(out);
  o.start(t); o.stop(t + atk + dec + 0.05);
  if (done) o.onended = done;
}

// A bed voice keeps its sources and a Poisson scheduler; stop(fade) ends both.
function voiceKit(ctx, noise) {
  const srcs = []; let alive = true;
  return {
    noise() {
      const s = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true });
      s.start(0, rnd(0, noise.duration)); srcs.push(s); return s;
    },
    osc(opts) { const o = new OscillatorNode(ctx, opts); o.start(); srcs.push(o); return o; },
    lfo(param, hz, depth) { // slow drift on a param
      this.osc({ frequency: hz }).connect(new GainNode(ctx, { gain: depth })).connect(param);
    },
    // fn runs at random (exponential) gaps, mean 1/rate() seconds
    poisson(rate, fn) {
      (function next() {
        if (!alive) return;
        fn();
        setTimeout(next, (-Math.log(1 - Math.random()) / rate()) * 1000);
      })();
    },
    stop(fade) { alive = false; for (const s of srcs) s.stop(ctx.currentTime + fade + 0.1); },
  };
}

// ---- beds: (ctx, noise, out) -> { stop(fade) } ----

function rain(ctx, noise, out) {
  const k = voiceKit(ctx, noise);
  [[3500, -0.7], [5000, 0.7]].forEach(([f, p]) => { // two decorrelated layers, wide
    const g = new GainNode(ctx, { gain: 0.1 });
    k.noise().connect(filt(ctx, 'bandpass', f, 0.5)).connect(g).connect(pan(ctx, p)).connect(out);
    k.lfo(g.gain, rnd(0.15, 0.3), 0.03);
  });
  k.noise().connect(filt(ctx, 'lowpass', 200)).connect(new GainNode(ctx, { gain: 0.12 })).connect(out); // room weight
  k.poisson(() => 15, () => tick(ctx, noise, out, { freq: rnd(1000, 4000), q: 2, len: rnd(0.005, 0.015), peak: rnd(0.1, 0.4), p: rnd(-0.8, 0.8) }));
  return k;
}

function flame(ctx, noise, out) {
  const k = voiceKit(ctx, noise);
  k.noise().connect(filt(ctx, 'lowpass', 300)).connect(new GainNode(ctx, { gain: 0.4 })).connect(out); // rumble
  const hiss = new GainNode(ctx, { gain: 0.06 });
  k.noise().connect(filt(ctx, 'bandpass', 2200, 0.5)).connect(hiss).connect(out);
  k.lfo(hiss.gain, 0.2, 0.01);
  return k;
}

function sizzle(ctx, noise, out) {
  const k = voiceKit(ctx, noise);
  const g = new GainNode(ctx, { gain: 0.1 });
  const peaking = new BiquadFilterNode(ctx, { type: 'peaking', frequency: 5000, Q: 0.7, gain: 3 });
  k.noise().connect(filt(ctx, 'highpass', 2000)).connect(peaking).connect(g).connect(out);
  k.lfo(g.gain, 0.5, 0.02); // breathes
  let live = 0; // crackle voices, capped at 8
  k.poisson(() => 45, () => {
    if (live >= 8) return;
    live++;
    const f = tick(ctx, noise, out, { freq: rnd(2000, 9000), q: rnd(1, 4), len: rnd(0.002, 0.008), peak: 0.1 + Math.random() * Math.random() * 0.9, p: rnd(-0.5, 0.5) });
    setTimeout(() => { live--; }, 30);
    return f;
  });
  k.poisson(() => 1, () => { // rarer, louder pops
    const t = ctx.currentTime + 0.02;
    tick(ctx, noise, out, { t, freq: rnd(800, 2500), q: 1, len: rnd(0.01, 0.025), peak: 0.8 });
    tone(ctx, out, { t, f: 600, to: 200, dec: 0.015, peak: 0.15 });
  });
  return k;
}

function simmer(ctx, noise, out) {
  const k = voiceKit(ctx, noise);
  k.noise().connect(filt(ctx, 'lowpass', 500)).connect(new GainNode(ctx, { gain: 0.15 })).connect(out); // liquid body
  let live = 0; // bubble voices, capped at 12
  k.poisson(() => 4, () => {
    if (live >= 12) return;
    live++;
    const f0 = 3 / (0.002 * 4 ** Math.random()), d = rnd(0.03, 0.08); // Minnaert: f0*r = 3 m/s
    tone(ctx, out, { t: ctx.currentTime + 0.03, f: f0, to: f0 * rnd(1.3, 2), atk: 0.002, dec: d, peak: rnd(0.05, 0.2), p: rnd(-0.4, 0.4), done: () => { live--; } });
  });
  return k;
}

function drone(ctx, noise, out) {
  const k = voiceKit(ctx, noise);
  const lp = filt(ctx, 'lowpass', 600, 0.5);
  lp.connect(new GainNode(ctx, { gain: 0.08 })).connect(out);
  k.lfo(lp.frequency, 0.05, 150);
  [[110, 6], [165, -6], [220, 4]].forEach(([frequency, detune]) => k.osc({ type: 'sawtooth', frequency, detune }).connect(lp));
  return k;
}

// ---- hits: (ctx, noise, out, verb) ----

const hits = {
  tap(ctx, noise, out) {
    tone(ctx, out, { f: 1600, to: 900, atk: 0.002, dec: 0.03, peak: 0.35 });
    tick(ctx, noise, out, { freq: 3000, q: 1, len: 0.01, peak: 0.5 });
  },
  thud(ctx, noise, out) {
    tone(ctx, out, { f: 90, to: 45, dec: 0.15, peak: 0.7 });
    tone(ctx, out, { f: 240, to: 160, dec: 0.1, peak: 0.35, type: 'triangle' }); // body, audible on a phone
    tick(ctx, noise, out, { type: 'lowpass', freq: 400, q: 0.7, len: 0.04, peak: 0.6 });
  },
  crack(ctx, noise, out) {
    const t0 = ctx.currentTime;
    tick(ctx, noise, out, { t: t0, type: 'lowpass', freq: 900, len: 0.05, peak: 0.7 });
    for (let i = 0; i < 8; i++) {
      tick(ctx, noise, out, { t: t0 + rnd(0, 0.3), freq: rnd(1500, 5000), q: rnd(1, 3), len: rnd(0.004, 0.02), peak: rnd(0.5, 1), p: rnd(-0.4, 0.4) });
    }
  },
  steam(ctx, noise, out, verb) {
    const t = ctx.currentTime, s = new AudioBufferSourceNode(ctx, { buffer: noise });
    const bp = filt(ctx, 'bandpass', 2000, 0.7);
    bp.frequency.setValueAtTime(2000, t);
    bp.frequency.exponentialRampToValueAtTime(6000, t + 0.4);
    const e = new GainNode(ctx, { gain: 0 });
    e.gain.setValueAtTime(0, t);
    e.gain.linearRampToValueAtTime(1.2, t + 0.03);
    e.gain.exponentialRampToValueAtTime(0.001, t + 1.6);
    const hi = new GainNode(ctx, { gain: 0.3 });
    s.connect(bp).connect(e);
    s.connect(filt(ctx, 'highpass', 4000)).connect(hi).connect(e);
    e.connect(out); e.connect(verb);
    s.start(t, 0, 1.8);
  },
  chime(ctx, noise, out, verb) {
    const t = ctx.currentTime, bus = new GainNode(ctx, { gain: 1 }), base = 392;
    const partials = [[0.5, 0.5], [0.56, 0.6], [0.563, 0.5], [0.92, 0.5], [1, 0.9], [1.19, 0.4], [1.7, 0.25], [2, 0.3], [2.74, 0.15]];
    partials.forEach(([r, a], i) => tone(ctx, bus, { t, f: base * r, atk: 0.005, dec: 3 / (1 + i * 0.25), peak: a * 0.14 }));
    bus.connect(out); bus.connect(verb);
  },
  spoon(ctx, noise, out) {
    [1, 1.59, 2.14, 2.65, 3.2, 4.1].forEach((r, i) => tone(ctx, out, { f: 2100 * r, atk: 0.001, dec: 0.2 - i * 0.034, peak: 0.12 }));
    tick(ctx, noise, out, { type: 'highpass', freq: 4000, len: 0.004, peak: 0.4 });
  },
};

export function createAudio() {
  let ctx = null, master, dry, room, rainLp, verb, noise, paused = false;
  const want = { beds: {}, muffle: 0, seconds: 1.5, muted: false };
  const live = {}; // name -> { gain, voice }

  function build(AC) {
    ctx = new AC({ latencyHint: 'interactive' });
    master = new GainNode(ctx, { gain: want.muted ? 0 : 1 });
    const limiter = new DynamicsCompressorNode(ctx, { threshold: -10, ratio: 8, attack: 0.003, release: 0.15, knee: 6 });
    master.connect(limiter).connect(ctx.destination);
    room = [filt(ctx, 'lowpass', cutoff(OPEN, DRY_CLOSED, want.muffle), 0.5), filt(ctx, 'lowpass', cutoff(OPEN, DRY_CLOSED, want.muffle), 0.5)];
    dry = new GainNode(ctx);
    dry.connect(room[0]).connect(room[1]).connect(master);
    rainLp = filt(ctx, 'lowpass', cutoff(OPEN, RAIN_CLOSED, want.muffle), 0.5);
    rainLp.connect(master);
    verb = new GainNode(ctx, { gain: 0.25 }); // send level; the return goes through the dry bus
    verb.connect(new ConvolverNode(ctx, { buffer: makeIR(ctx) })).connect(dry);
    noise = makeNoise(ctx);
  }

  function applyMuffle(seconds) {
    const now = ctx.currentTime;
    for (const f of room) { f.frequency.cancelScheduledValues(now); f.frequency.setValueAtTime(f.frequency.value, now); f.frequency.exponentialRampToValueAtTime(cutoff(OPEN, DRY_CLOSED, want.muffle), now + Math.max(seconds, 0.01)); }
    rainLp.frequency.cancelScheduledValues(now);
    rainLp.frequency.setValueAtTime(rainLp.frequency.value, now);
    rainLp.frequency.exponentialRampToValueAtTime(cutoff(OPEN, RAIN_CLOSED, want.muffle), now + Math.max(seconds, 0.01));
  }

  // Bring one bed in line with the wanted state.
  function applyBed(name, stopFade = 0.3) {
    if (!ctx || want.muted) return;
    const w = want.beds[name], cur = live[name], now = ctx.currentTime;
    if (w && cur) return ramp(cur.gain.gain, w.level, w.fade, now);
    if (w) {
      const gain = new GainNode(ctx, { gain: 0 });
      gain.connect(name === 'rain' ? rainLp : dry);
      live[name] = { gain, voice: { rain, flame, sizzle, simmer, drone }[name](ctx, noise, gain) };
      return ramp(gain.gain, w.level, w.fade, now);
    }
    if (cur) {
      delete live[name];
      ramp(cur.gain.gain, 0, stopFade, now);
      cur.voice.stop(stopFade);
      setTimeout(() => cur.gain.disconnect(), (stopFade + 0.3) * 1000);
    }
  }

  const applyAll = () => { for (const n of BEDS) applyBed(n); };
  const safe = (fn, fallback) => (...a) => { try { return fn(...a); } catch { return fallback; } };

  return {
    async unlock() {
      try {
        try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch { /* optional API */ }
        if (!ctx) {
          const AC = globalThis.AudioContext || globalThis.webkitAudioContext;
          if (!AC) return false;
          build(AC);
        }
        paused = false;
        await ctx.resume();
        applyAll();
        return ctx.state === 'running';
      } catch { return false; }
    },
    mute: safe((on) => {
      want.muted = !!on;
      if (!ctx) return;
      ramp(master.gain, want.muted ? 0 : 1, 0.3, ctx.currentTime);
      if (!want.muted) applyAll();
    }),
    bed: safe((name, level = 1, fade = 1.5) => {
      if (!BEDS.includes(name)) return;
      want.beds[name] = { level: clamp01(level), fade: Number(fade) || 0 };
      applyBed(name);
    }),
    stop: safe((name, fade = 1.5) => {
      if (!BEDS.includes(name)) return;
      delete want.beds[name];
      applyBed(name, Number(fade) || 0);
    }),
    hit: safe((name) => {
      if (!ctx || want.muted || paused || ctx.state !== 'running' || !hits[name]) return;
      hits[name](ctx, noise, dry, verb);
    }),
    muffle: safe((amount, seconds = 1.5) => {
      want.muffle = clamp01(amount);
      if (ctx) applyMuffle(Number(seconds) || 0);
    }),
    async pause() {
      try {
        if (!ctx) return;
        paused = true;
        ramp(master.gain, 0, 0.2, ctx.currentTime);
        await new Promise((r) => setTimeout(r, 220));
        if (paused) await ctx.suspend();
      } catch { /* never throw */ }
    },
    async resume() {
      try {
        if (!ctx) return false;
        paused = false;
        await ctx.resume();
        ramp(master.gain, want.muted ? 0 : 1, 0.3, ctx.currentTime);
        return ctx.state === 'running';
      } catch { return false; }
    },
  };
}
