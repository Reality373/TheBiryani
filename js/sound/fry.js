// Sound for chapter II, The Fry: a sizzle burst per piece, a small tick and splash per spice, a soft crackle for the
// onions. The hot-oil bed is the existing sizzle bed, driven by the hold through audio.level().
import { register, tick, tone, rnd } from '../core/audio.js';

register('fry-hiss', {
  hit(ctx, noise, out) { // hot water meets hot oil: a long bright hiss
    tick(ctx, noise, out, { freq: 6500, q: 0.7, len: 1.1, peak: 0.28 });
    tick(ctx, noise, out, { type: 'lowpass', freq: 1200, q: 0.6, len: 0.35, peak: 0.3 });
  },
});

register('fry-lid', {
  hit(ctx, noise, out) { // a copper lid settling on a copper pot
    tone(ctx, out, { f: 420, to: 300, dec: 0.35, peak: 0.3 });
    tone(ctx, out, { f: 1130, to: 900, dec: 0.2, peak: 0.12 });
    tick(ctx, noise, out, { freq: 2400, q: 1.5, len: 0.03, peak: 0.25 });
  },
});

register('fry-sizzle', {
  hit(ctx, noise, out) {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 14; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.35), freq: rnd(3000, 8000), q: rnd(1, 3), len: rnd(0.004, 0.012), peak: rnd(0.2, 0.6), p: rnd(-0.5, 0.5) });
    tick(ctx, noise, out, { t: t0, type: 'lowpass', freq: 900, len: 0.05, peak: 0.4 }); // the body of the splash
  },
});

register('fry-tick', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 4200, q: 3, len: 0.006, peak: 0.25 });
    tick(ctx, noise, out, { freq: 1600, q: 1, len: 0.03, peak: 0.12 }); // the tiny splash
  },
});

register('fry-crackle', {
  hit(ctx, noise, out) {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 10; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.5), freq: rnd(3000, 7000), q: rnd(1, 3), len: rnd(0.004, 0.01), peak: rnd(0.08, 0.2), p: rnd(-0.4, 0.4) });
  },
});
