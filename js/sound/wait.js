// Sound for the wait chapter: the tawa's iron clunk, the knob's click, a breath of steam, a cooling tick,
// and a squeaky rub on the glass (a continuous voice whose level follows the drag).
import { register, tick, tone, voiceKit, filt } from '../core/audio.js';

register('wait-clunk', {
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 70, to: 38, dec: 0.4, peak: 0.8 });
    tone(ctx, out, { f: 190, to: 120, dec: 0.18, peak: 0.3, type: 'triangle' });
    tick(ctx, noise, out, { type: 'lowpass', freq: 350, q: 0.7, len: 0.06, peak: 0.6 });
  },
});

register('wait-click', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 3400, q: 4, len: 0.008, peak: 0.35 });
    tone(ctx, out, { f: 2200, dec: 0.02, peak: 0.08 });
  },
});

register('wait-breath', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 1100, q: 0.8, len: 0.4, peak: 0.22 });
  },
});

register('wait-tick', {
  hit(ctx, noise, out) {
    tick(ctx, noise, out, { freq: 4200, q: 3, len: 0.006, peak: 0.2 });
    tone(ctx, out, { f: 3100, dec: 0.05, peak: 0.04 });
  },
});

register('wait-rub', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    const bp = filt(ctx, 'bandpass', 2400, 8);
    k.noise().connect(bp).connect(new GainNode(ctx, { gain: 0.35 })).connect(out);
    k.lfo(bp.frequency, 9, 350); // the squeak wobbles
    return k;
  },
});
