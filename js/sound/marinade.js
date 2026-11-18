// Sound for chapter I, The Marinade: a thick wet plop (curd landing), a soft dry puff (spice landing), a cloth
// settling, and the wet fold of the stir as two beds whose levels the chapter sets from the spoon's speed
// ('mar-fold' is the low body, 'mar-fold-hi' the bright slosh that only comes in when you stir fast).
import { register, tick, tone, voiceKit, filt } from '../core/audio.js';

register('mar-plop', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 200, to: 62, dec: 0.2, peak: 0.7 }); // the body of a thick dollop
    tone(ctx, out, { f: 420, to: 150, dec: 0.07, peak: 0.25 });
    tick(ctx, noise, out, { type: 'lowpass', freq: 700, q: 0.8, len: 0.12, peak: 0.5 });
    tick(ctx, noise, out, { freq: 1900, q: 2, len: 0.03, peak: 0.18, t: ctx.currentTime + 0.05 }); // the small wet splat after
  },
});

register('mar-puff', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 2600, q: 0.5, len: 0.16, peak: 0.2 });
    tick(ctx, noise, out, { type: 'lowpass', freq: 900, q: 0.5, len: 0.22, peak: 0.2 });
  },
});

register('mar-cloth', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 520, q: 0.7, len: 0.4, peak: 0.2 });
    tone(ctx, out, { f: 90, to: 60, dec: 0.15, peak: 0.25 });
  },
});

register('mar-fold', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    const lp = filt(ctx, 'lowpass', 420, 0.8);
    k.noise().connect(lp).connect(new GainNode(ctx, { gain: 0.9 })).connect(out);
    k.lfo(lp.frequency, 3.1, 120); // the slow slap of the paste folding over
    return k;
  },
});

register('mar-fold-hi', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    const bp = filt(ctx, 'bandpass', 1500, 1.4);
    k.noise().connect(bp).connect(new GainNode(ctx, { gain: 0.55 })).connect(out);
    k.lfo(bp.frequency, 5.3, 400);
    return k;
  },
});
