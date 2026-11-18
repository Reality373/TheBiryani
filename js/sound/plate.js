// Sound for chapter VII, The Plate. One-shots (the spoon on steel is the core 'spoon'): a rice rustle, a wet tear,
// a dahi plop, a bright sting for each spice found; and a pouring bed driven by the hold on the serving spoon.
import { register, tick, tone, voiceKit, filt } from '../core/audio.js';

register('plate-scoop', {
  hit(ctx, noise, out) {
    for (let i = 0; i < 4; i++) tick(ctx, noise, out, { t: ctx.currentTime + i * 0.05, freq: 3200 + i * 500, q: 1.2, len: 0.04, peak: 0.16 });
    tick(ctx, noise, out, { type: 'lowpass', freq: 400, len: 0.06, peak: 0.2 });
  },
});
register('plate-tear', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { type: 'lowpass', freq: 900, q: 0.8, len: 0.1, peak: 0.35 });
    tick(ctx, noise, out, { t: ctx.currentTime + 0.05, freq: 2200, q: 1.5, len: 0.03, peak: 0.25 });
  },
});
register('plate-plop', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 260, to: 110, dec: 0.18, peak: 0.3 });
    tick(ctx, noise, out, { type: 'lowpass', freq: 700, len: 0.05, peak: 0.2 });
  },
});
register('plate-sting', {
  hit(ctx, noise, out) {
    [1568, 2093, 2637, 3136].forEach((fr, i) => tone(ctx, out, { t: ctx.currentTime + i * 0.07, f: fr, dec: 0.5 - i * 0.06, peak: 0.1 }));
    tone(ctx, out, { t: ctx.currentTime + 0.28, f: 4186, dec: 0.7, peak: 0.04 });
  },
});
register('plate-pour', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'highpass', 2600, 0.6)).connect(new GainNode(ctx, { gain: 0.35 })).connect(out);
    k.noise().connect(filt(ctx, 'bandpass', 5000, 1.5)).connect(new GainNode(ctx, { gain: 0.15 })).connect(out);
    return k;
  },
});
