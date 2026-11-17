// Reference pattern for a chapter's sound module: register voices when the module is imported.
// A bed is continuous and driven from the gesture with audio.level(name, 0..1); a hit is a one-shot played with audio.hit(name).
import { register, tick, tone, voiceKit, filt } from '../core/audio.js';

register('demo-hum', {
  // (ctx, noise, out) -> voice with stop(fade). voiceKit tracks sources so stop() ends them all.
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    const g = new GainNode(ctx, { gain: 0.5 });
    k.noise().connect(filt(ctx, 'bandpass', 500, 2)).connect(g).connect(out);
    k.osc({ type: 'triangle', frequency: 110 }).connect(new GainNode(ctx, { gain: 0.15 })).connect(out);
    k.lfo(g.gain, 6, 0.15);
    return k;
  },
});

register('demo-plop', {
  // (ctx, noise, out, verb) -> void. Short, so it needs no stop.
  hit(ctx, noise, out) {
    tone(ctx, out, { f: 420, to: 180, atk: 0.003, dec: 0.12, peak: 0.45 });
    tick(ctx, noise, out, { freq: 1200, q: 1, len: 0.02, peak: 0.25 });
  },
});

register('demo-ding', {
  hit(ctx, noise, out, verb) {
    tone(ctx, out, { f: 880, dec: 0.8, peak: 0.2 });
    tone(ctx, verb, { f: 1320, dec: 0.6, peak: 0.1 });
  },
});
