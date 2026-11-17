// Sound for chapter VI, The Opening: two beds that the gestures drive through audio.level(). A thin steam hiss at the
// lid's gap (it follows the lift), and a low scrape on the copper (it follows the spoon's drag speed).
// The crack, the steam rush and the chime are core hits.
import { register, filt, voiceKit } from '../core/audio.js';

register('steam-bed', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    const hiss = new GainNode(ctx, { gain: 0.5 });
    k.noise().connect(filt(ctx, 'highpass', 3200, 0.5)).connect(hiss).connect(out);
    k.noise().connect(filt(ctx, 'bandpass', 1400, 0.6)).connect(new GainNode(ctx, { gain: 0.25 })).connect(out);
    return k;
  },
});

register('scrape', {
  bed(ctx, noise, out) {
    const k = voiceKit(ctx, noise);
    k.noise().connect(filt(ctx, 'bandpass', 1100, 2.2)).connect(new GainNode(ctx, { gain: 0.45 })).connect(out);
    k.noise().connect(filt(ctx, 'lowpass', 260)).connect(new GainNode(ctx, { gain: 0.3 })).connect(out); // copper body
    return k;
  },
});
