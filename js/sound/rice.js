// Sound for chapter VI, The Rice: a rolling boil (a bed whose level follows the flame knob and dips when the rice goes in),
// a spice splash, a few salt pinches, one oil drip, a grainy rice pour, a slotted spoon lift, the two grain presses (a
// dull give for the chalky grain, a clean snap for the firm one), and the pot's water running out as it tips.
import { register, tick, tone, voiceKit, filt, rnd } from '../core/audio.js';

register('boil', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'lowpass', 700)).connect(new GainNode(ctx, { gain: 0.22 })).connect(out); // the rolling body
    k.noise().connect(filt(ctx, 'bandpass', 300, 0.6)).connect(new GainNode(ctx, { gain: 0.12 })).connect(out);
    k.poisson(() => 7, () => tone(ctx, out, { f: rnd(200, 320), to: rnd(420, 600), atk: 0.002, dec: rnd(0.04, 0.09), peak: rnd(0.08, 0.2), p: rnd(-0.4, 0.4) }));
    return k;
  },
});

register('pour-water', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'bandpass', 1700, 0.8)).connect(new GainNode(ctx, { gain: 0.35 })).connect(out);
    k.poisson(() => 18, () => tick(ctx, noise, out, { freq: rnd(2000, 4000), q: 2, len: 0.008, peak: 0.06, p: rnd(-0.3, 0.3) }));
    return k;
  },
});

register('bowl-slide', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'bandpass', 1000, 1.2)).connect(new GainNode(ctx, { gain: 0.3 })).connect(out);
    return k;
  },
});

register('spice-tip', {
  hit(ctx, noise, out) {
    const t0 = ctx.currentTime;
    tick(ctx, noise, out, { t: t0, type: 'bandpass', freq: 1200, q: 0.6, len: 0.35, peak: 0.25 }); // the splash
    for (let i = 0; i < 8; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.3), freq: rnd(1500, 4000), q: 2, len: rnd(0.004, 0.012), peak: rnd(0.06, 0.14), p: rnd(-0.5, 0.5) });
  },
});

register('salt-pinch', {
  hit(ctx, noise, out) { // salt grains on steel
    const t0 = ctx.currentTime;
    for (let i = 0; i < 14; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.4), freq: rnd(5000, 8000), q: 3, len: 0.008, peak: rnd(0.03, 0.07), p: rnd(-0.6, 0.6) });
  },
});

register('oil-drop', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 1300, to: 600, dec: 0.08, peak: 0.1 });
    tick(ctx, noise, out, { freq: 2400, q: 2, len: 0.012, peak: 0.1 });
  },
});

register('rice-in', {
  hit(ctx, noise, out) { // grains in a grainy pour, a few dozen clicks
    const t0 = ctx.currentTime;
    for (let i = 0; i < 30; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.5), freq: rnd(2600, 6000), q: 2.2, len: rnd(0.006, 0.016), peak: rnd(0.04, 0.12), p: rnd(-0.5, 0.5) });
    tick(ctx, noise, out, { t: t0, type: 'lowpass', freq: 900, q: 0.6, len: 0.5, peak: 0.07 });
  },
});

register('lift', {
  hit(ctx, noise, out) { // the slotted spoon coming out of the rice
    tick(ctx, noise, out, { type: 'highpass', freq: 3000, len: 0.05, peak: 0.1 });
    tone(ctx, out, { f: 900, to: 700, dec: 0.1, peak: 0.06 });
  },
});

register('grain-hard', {
  hit(ctx, noise, out) { // a dull give: the grain does not break
    tick(ctx, noise, out, { freq: 1400, q: 2, len: 0.03, peak: 0.5 });
    tone(ctx, out, { f: 300, to: 200, dec: 0.08, peak: 0.2 });
  },
});

register('grain-snap', {
  hit(ctx, noise, out) { // a clean crack: the grain breaks in two
    tick(ctx, noise, out, { freq: 2800, len: 0.02, peak: 0.9 });
    tick(ctx, noise, out, { freq: 1200, len: 0.04, peak: 0.6 });
    tick(ctx, noise, out, { freq: 4000, len: 0.008, peak: 0.4 });
  },
});
