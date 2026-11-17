// Sound for the seal chapter: a metal lid settling on a pot, and a thumb pressing dough.
import { register, tick, tone } from '../core/audio.js';

register('seal-clink', {
  // A bright ringing metal note with a tick on the rim.
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 2600, to: 2500, dec: 0.6, peak: 0.16 });
    tone(ctx, out, { f: 3900, dec: 0.3, peak: 0.07 });
    tick(ctx, noise, out, { freq: 5200, q: 2, len: 0.01, peak: 0.3 });
  },
});

register('seal-press', {
  // A dull knock, softer than the thud: dough under a thumb.
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 130, to: 70, dec: 0.12, peak: 0.35 });
    tick(ctx, noise, out, { type: 'lowpass', freq: 500, q: 0.7, len: 0.03, peak: 0.25 });
  },
});
