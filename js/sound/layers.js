// Sound for the layers chapter: a grainy pour of rice (one burst), a thin saffron trickle whose level follows the drag,
// a short pour for a ready-made streak, a soft drop (ghee), and papery leaf and crisp onion flutters.
import { register, tick, tone, voiceKit, filt, rnd } from '../core/audio.js';

register('rice-pour', {
  hit(ctx, noise, out) {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 34; i++) { // hundreds of grains in a second, drawn as a few dozen clicks
      tick(ctx, noise, out, { t: t0 + rnd(0, 0.55), freq: rnd(2600, 6000), q: 2.2, len: rnd(0.006, 0.016), peak: rnd(0.04, 0.12), p: rnd(-0.5, 0.5) });
    }
    tick(ctx, noise, out, { t: t0, type: 'lowpass', freq: 900, q: 0.6, len: 0.5, peak: 0.07 });
  },
});

register('trickle', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'bandpass', 1900, 4)).connect(new GainNode(ctx, { gain: 0.5 })).connect(out);
    k.poisson(() => 14, () => tick(ctx, noise, out, { freq: rnd(2500, 4500), q: 3, len: 0.008, peak: 0.12, p: rnd(-0.3, 0.3) }));
    return k;
  },
});

register('pour-hit', {
  hit(ctx, noise, out) {
    const t0 = ctx.currentTime;
    for (let i = 0; i < 10; i++) tick(ctx, noise, out, { t: t0 + i * 0.04, freq: rnd(2200, 4200), q: 3, len: 0.012, peak: rnd(0.08, 0.18) });
  },
});

register('drop', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 900, to: 420, dec: 0.09, peak: 0.12 });
    tick(ctx, noise, out, { freq: 2600, q: 2, len: 0.012, peak: 0.12 });
  },
});

register('leaf', {
  hit(ctx, noise, out) { // mint: a papery flutter
    const t0 = ctx.currentTime;
    for (let i = 0; i < 6; i++) tick(ctx, noise, out, { t: t0 + i * 0.03, type: 'highpass', freq: 4200, q: 0.8, len: 0.03, peak: 0.08, p: rnd(-0.6, 0.6) });
  },
});

register('crisp', {
  hit(ctx, noise, out) { // fried onion: small soft crackles
    const t0 = ctx.currentTime;
    for (let i = 0; i < 9; i++) tick(ctx, noise, out, { t: t0 + rnd(0, 0.25), freq: rnd(1800, 5000), q: 1.5, len: rnd(0.004, 0.012), peak: rnd(0.08, 0.2), p: rnd(-0.6, 0.6) });
  },
});
