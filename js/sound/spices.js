// Sound for chapter I, The Spices: the spoon tapping a bowl, a soft powder puff when a heap lands, and the small dry
// click of a pod or clove dropping on the steel tray (with a tiny second bounce).
import { register, tick, tone } from '../core/audio.js';

register('sp-tap', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 1900, to: 1100, dec: 0.09, peak: 0.18 });
    tick(ctx, noise, out, { freq: 3200, q: 2, len: 0.02, peak: 0.2 });
  },
});

register('sp-puff', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 2400, q: 0.5, len: 0.18, peak: 0.2 });
    tick(ctx, noise, out, { type: 'lowpass', freq: 800, q: 0.5, len: 0.24, peak: 0.22 });
  },
});

register('sp-click', {
  hit(ctx, noise, out) {
    const f = 1700 + Math.random() * 900;
    tone(ctx, out, { f, to: f * 0.7, dec: 0.05, peak: 0.22 });
    tick(ctx, noise, out, { freq: 4200, q: 1.5, len: 0.012, peak: 0.3 });
    const t = ctx.currentTime + 0.075; // the bounce
    tone(ctx, out, { t, f: f * 0.85, to: f * 0.6, dec: 0.035, peak: 0.1 });
    tick(ctx, noise, out, { t, freq: 3600, q: 1.5, len: 0.008, peak: 0.12 });
  },
});
