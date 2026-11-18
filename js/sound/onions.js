// Sound for chapter II, The Onions: a crisp chop per stroke (its visual twin is the slices falling away), a small glug
// for the oil, the tip's sizzle burst, a soft scrape as the onions leave the pan, a spoon's tick into the bowl. The
// sizzle and flame beds are the shared ones; the chapter sets their levels.
import { register, tick, tone, rnd } from '../core/audio.js';

register('onion-chop', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 240, to: 110, dec: 0.06, peak: 0.45 }); // the knife meeting the board
    tick(ctx, noise, out, { freq: 3200, q: 1.5, len: 0.008, peak: 0.55 }); // the crisp edge
    tick(ctx, noise, out, { type: 'lowpass', freq: 1100, q: 0.7, len: 0.03, peak: 0.3 });
  },
});

register('onion-pour', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 300, to: 760, dec: 0.32, peak: 0.07 }); // a glug as the oil leaves the neck
    for (let i = 0; i < 6; i++) tick(ctx, noise, out, { t: ctx.currentTime + rnd(0, 0.5), freq: rnd(1500, 3500), q: 2, len: rnd(0.004, 0.01), peak: rnd(0.05, 0.12) });
  },
});

register('onion-tip', {
  hit(ctx, noise, out) {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 18; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.4), freq: rnd(3000, 8000), q: rnd(1, 3), len: rnd(0.004, 0.012), peak: rnd(0.2, 0.6), p: rnd(-0.5, 0.5) });
    tick(ctx, noise, out, { t: t0, type: 'lowpass', freq: 900, len: 0.06, peak: 0.45 }); // the body of the splash
  },
});

register('onion-scoop', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 1400, q: 2, len: 0.18, peak: 0.2 });
    tone(ctx, out, { f: 220, to: 170, dec: 0.1, peak: 0.08 });
  },
});

register('onion-spoon', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { type: 'lowpass', freq: 700, len: 0.08, peak: 0.3 });
    tone(ctx, out, { f: 900, to: 500, dec: 0.06, peak: 0.08 });
  },
});
