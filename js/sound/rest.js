// Sound for the rest chapter: the fridge's hum (a bed) and the thunk of its door; the running tap and the rice swishing
// in the water (beds, whose levels follow the gesture); the gurgle of pouring off, and a splash; the clock's tick.
import { register, tick, tone, voiceKit, filt, rnd } from '../core/audio.js';

register('fridge-hum', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.osc({ type: 'sine', frequency: 56 }).connect(new GainNode(ctx, { gain: 0.09 })).connect(out);
    k.osc({ type: 'triangle', frequency: 112, detune: -8 }).connect(new GainNode(ctx, { gain: 0.03 })).connect(out);
    k.noise().connect(filt(ctx, 'lowpass', 160, 0.5)).connect(new GainNode(ctx, { gain: 0.05 })).connect(out);
    return k;
  },
});

register('fridge-open', {
  hit(ctx, noise, out) { tick(ctx, noise, out, { type: 'lowpass', freq: 700, q: 0.7, len: 0.25, peak: 0.22 }); },
});

register('fridge-door', {
  hit(ctx, noise, out) { // a soft thunk, then the latch catching
    const t0 = ctx.currentTime;
    tone(ctx, out, { t: t0, f: 110, to: 60, dec: 0.16, peak: 0.45 });
    tick(ctx, noise, out, { t: t0, type: 'lowpass', freq: 500, q: 0.7, len: 0.05, peak: 0.35 });
    tick(ctx, noise, out, { t: t0 + 0.32, freq: 3200, q: 2, len: 0.01, peak: 0.18 });
  },
});

register('tap-water', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'bandpass', 2600, 0.8)).connect(new GainNode(ctx, { gain: 0.35 })).connect(out);
    k.poisson(() => 30, () => tick(ctx, noise, out, { freq: rnd(1800, 4000), q: 3, len: 0.006, peak: 0.08, p: rnd(-0.3, 0.3) }));
    return k;
  },
});

register('rice-swish', {
  bed(ctx, noise, out) { // the grains moving in the water: a soft wash, and small clicks against the steel
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'bandpass', 900, 0.9)).connect(new GainNode(ctx, { gain: 0.5 })).connect(out);
    k.poisson(() => 22, () => tick(ctx, noise, out, { freq: rnd(2500, 5000), q: 2, len: 0.005, peak: 0.05, p: rnd(-0.5, 0.5) }));
    return k;
  },
});

register('rest-trickle', {
  bed(ctx, noise, out) { // the water leaving the bowl over the rim
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'bandpass', 1400, 2)).connect(new GainNode(ctx, { gain: 0.6 })).connect(out);
    k.poisson(() => 12, () => tick(ctx, noise, out, { freq: rnd(900, 1800), q: 4, len: 0.02, peak: 0.12, p: rnd(-0.3, 0.3) }));
    return k;
  },
});

register('rest-gurgle', {
  hit(ctx, noise, out) { // a few bubbles as the water goes out
    const t0 = ctx.currentTime;
    for (let i = 0; i < 6; i++) tone(ctx, out, { t: t0 + i * 0.09 + rnd(0, 0.03), f: rnd(260, 420), to: rnd(480, 760), dec: 0.07, peak: rnd(0.05, 0.1) });
  },
});

register('rest-splash', {
  hit(ctx, noise, out) { // a drop into water, then the small spray
    const t0 = ctx.currentTime;
    tone(ctx, out, { t: t0, f: 700, to: 300, dec: 0.12, peak: 0.1 });
    for (let i = 0; i < 12; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.35), type: 'highpass', freq: rnd(2500, 6000), q: 1, len: rnd(0.01, 0.02), peak: rnd(0.05, 0.12), p: rnd(-0.5, 0.5) });
  },
});

register('clock-tick', {
  hit(ctx, noise, out) { // a wall clock's escapement, one click
    tick(ctx, noise, out, { freq: 3400, q: 3, len: 0.008, peak: 0.3 });
    tone(ctx, out, { f: 1900, to: 1500, dec: 0.02, peak: 0.08 });
  },
});
