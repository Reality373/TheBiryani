# 07 - Web Audio research for the biryani experience

Written 14-15 Nov 2026. **Status: partly verified.** Sections 3, 4, 7 and 8 are mostly verified by opened pages. Sections 1 and 6 are partly verified (bubbles and bell tables verified; sizzle, rain, steam, drone, thud are my own recipes). Sections 2 and 5 have only MDN support for the Web Audio calls; the mix numbers are my suggestions or memory. Every claim is tagged:

- A URL next to a claim means I opened that page (or the PDF it points to) and read the claim there.
- "(unverified)" means the claim comes from a search snippet or from memory.
- "(my suggestion, untested)" means it is my own recipe. I ran nothing in a browser.

Where a page failed to load, I say so.

---

## 1. Synthesis recipes

### Reality check on sources
I found no published, working Web Audio recipe for frying sizzle, steam hiss, lid scrape or dough thud. I looked for one in a search and the results only returned generic "filtered noise" tutorials (unverified, search results only). The recipes below for those sounds are my own. The verified sources cover bubbles, bells and a few general facts.

### 1.1 Frying sizzle with crackle and pops
Source status: nothing verified for the recipe. Foley practice only confirms that sizzle is routinely faked: one article says falling rain is often mimicked with sizzling bacon (search snippet, unverified; the Mental Floss page I opened, https://www.mentalfloss.com/food/how-foley-artists-use-food-make-sound-effects, does not mention sizzle).

Recipe (my suggestion, untested):
- **Bed:** looping white-noise `AudioBuffer` (2 to 4 s, mono, `loop = true`) -> highpass ~2 kHz -> peaking +3 dB at 5 kHz, Q 0.7 -> gain ~0.15. Sizzle is mostly broadband energy above 2 kHz.
- **Slow modulation:** an LFO (0.3 to 0.8 Hz) on the bed gain, depth ~20 percent, so it breathes.
- **Crackle:** a scheduler fires very short noise bursts (2 to 8 ms, exponential decay) through a bandpass at a random 2 to 9 kHz, Q 1 to 4, random gain 0.1 to 1. Use Poisson-style timing (gaps of `-ln(u) / rate`) with rate 20 to 80 per second for "frying" and 3 to 8 per second for "settling".
- **Pops:** rarer (0.3 to 2 per second) and louder, a 10 to 25 ms burst through a bandpass at 800 to 2500 Hz plus a short sine drop (600 -> 200 Hz in 15 ms).
- **Level link to the interaction:** drive `rate` and the bed gain from the same "heat" value, so adding onions makes a burst of crackle that decays.

```js
// Sizzle: noise bed + Poisson crackle. (my suggestion, untested)
function makeNoise(ctx, sec = 3) {
  const b = ctx.createBuffer(1, ctx.sampleRate * sec, ctx.sampleRate);
  const d = b.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return b;
}
function sizzle(ctx, out, noise) {
  const src = new AudioBufferSourceNode(ctx, { buffer: noise, loop: true });
  const hp = new BiquadFilterNode(ctx, { type: 'highpass', frequency: 2000 });
  const g = new GainNode(ctx, { gain: 0.12 });
  src.connect(hp).connect(g).connect(out); src.start();
  let heat = 1, alive = true;                       // heat: 0..1, set from the UI
  (function crackle() {
    if (!alive) return;
    const t = ctx.currentTime + 0.02;
    const s = new AudioBufferSourceNode(ctx, { buffer: noise });
    const bp = new BiquadFilterNode(ctx, { type: 'bandpass', frequency: 2000 + Math.random() * 7000, Q: 1 + Math.random() * 3 });
    const e = new GainNode(ctx, { gain: 0 });
    const peak = 0.1 + Math.random() * Math.random() * 0.9, len = 0.002 + Math.random() * 0.006;
    e.gain.setValueAtTime(peak, t); e.gain.exponentialRampToValueAtTime(0.001, t + len);
    s.connect(bp).connect(e).connect(out); s.start(t, Math.random() * 2, len + 0.01);
    setTimeout(crackle, -Math.log(1 - Math.random()) / (20 + 60 * heat) * 1000);
  })();
  return { setHeat: h => { heat = h; g.gain.setTargetAtTime(0.04 + 0.12 * h, ctx.currentTime, 0.3); },
           stop: () => { alive = false; src.stop(); } };
}
```
Note: `setTimeout` jitters when the tab is busy. For crackle that is fine (it sounds natural). Do not use it for anything rhythmic.

### 1.2 Simmering and bubbling
**Verified model.** Single-bubble sound from the UNC "Sounding Liquids" paper, PDF text read locally (https://gamma.cs.unc.edu/SoundingLiquids/soundingliquids.pdf):
- Resonance frequency follows Minnaert: for air bubbles in water, `f0 * r0 ≈ 3 m/s` (so r = 3 mm gives ~1 kHz, r = 1 mm gives ~3 kHz).
- Each bubble is a decaying sine: `p(t) = A0 * sin(2*pi*f(t)*t) * exp(-beta0 * t)`.
- The pitch rises: `f(t) = f0 * (1 + xi * beta0 * t)`, with `xi ≈ 0.1` described as the value that gave a realistic rise in a user study by van den Doel (2005).
- Initial amplitude scales with radius: `A0 = r0 * eps`, with eps between 0.01 and 0.1.
- `beta0 = pi * f0 * delta_tot` where delta_tot is thermal plus radiative damping. The equations were garbled in the extracted text, so I did not copy them. For a game, pick the decay time by ear.
- Viscous damping is negligible above r = 0.1 mm (same PDF).

**Farnell.** The Designing Sound companion page for Practical 12 "Bubbles" exists (https://mitp-content-server.mit.edu/books/content/sectbyfn/books_pres_0/8375/designing_sound.zip/practical12.html). It is Pure Data code listings plus `bubbles.wav`, with no prose description of the maths. I could read only one design hint from it: a stream of constant-size bubbles with a random voice allocator that "cuts off some bubbles early". Farnell's book text itself was not opened. I found no JavaScript port.

**Implementation for dum (my suggestion, untested)**, built on the verified model:
- A bubble is one `OscillatorNode` (sine) with `frequency.setValueAtTime(f0)` then `exponentialRampToValueAtTime(f0 * 1.3 to 2, t + d)`, through a gain with `setValueAtTime(a)` then `exponentialRampToValueAtTime(0.0001, t + d)`, with `d` of 15 to 80 ms.
- Radii: choose r0 log-uniformly between 2 and 8 mm, so f0 is about 375 Hz to 1.5 kHz. Heavier, thicker liquid (gravy, dum) wants the lower end and fewer bubbles.
- Rate: 2 to 6 per second for a gentle simmer, 10 to 20 for a rolling boil. Vary with Poisson gaps.
- Add a low-level lowpassed noise bed (300 to 800 Hz) for the "body" of the liquid.
- Limit voices to ~12 and let new ones steal the oldest, in the spirit of Farnell's early cut-off.

```js
// One bubble, Minnaert + rising pitch. (my suggestion, untested)
function bubble(ctx, out, t = ctx.currentTime) {
  const r = 0.002 * Math.pow(4, Math.random());        // 2..8 mm
  const f0 = 3 / r;                                     // f0*r0 ~ 3 m/s  (UNC paper)
  const d = 0.02 + Math.random() * 0.05;
  const o = new OscillatorNode(ctx, { frequency: f0 });
  o.frequency.exponentialRampToValueAtTime(f0 * (1.3 + Math.random() * 0.7), t + d);
  const g = new GainNode(ctx, { gain: 0 });
  const a = 0.05 + 0.15 * Math.random();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.linearRampToValueAtTime(a, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
  o.connect(g).connect(out); o.start(t); o.stop(t + d + 0.02);
}
```
Schedule these a short way ahead (50 to 100 ms lookahead) rather than from `setTimeout` at the moment of sound.

### 1.3 Rain on a window
Source status: the Audiokinetic page "Generating Rain With Pure Synthesis" returned HTTP 403 and I could not open it. From the search snippet only (unverified): it layers high-frequency and mid-frequency noise "boiling", stereo noise and individual drops, and says rain is millions of bubbles merging per second (https://www.audiokinetic.com/en/blog/generating-rain-with-pure-synthesis/). A physics-forum snippet says real rain is closer to shot noise than white noise (unverified).

Recipe (my suggestion, untested): two decorrelated noise buffers panned L and R, each bandpassed at 3 to 6 kHz with a slow gain wobble; add "window drops" as short (5 to 15 ms) bandpassed noise ticks at 1 to 4 kHz at 5 to 30 per second; add one very quiet lowpassed (200 Hz) layer for room weight. Rain and sizzle are spectrally close, so keep rain lower and wider, and do not run both at full level together.

### 1.4 Gas flame or low hiss
Not sourced. Recipe (my suggestion, untested): brown-ish noise (white noise through a one-pole lowpass, ~300 Hz) for rumble at gain ~0.05, plus white noise through a bandpass at 1.5 to 3 kHz, Q 0.5, with a very slow random gain drift (0.1 to 0.3 Hz, depth 15 percent). A gas "whump" on ignition: lowpassed noise burst 80 to 200 ms with a 60 -> 40 Hz sine thump.

### 1.5 Steam release when a lid lifts
Not sourced. Recipe (my suggestion, untested): white noise -> bandpass sweeping 2 -> 6 kHz over 0.4 s, Q 0.7 -> gain envelope with 30 ms attack, ~1.5 s exponential decay. Add a quiet second layer, highpass 4 kHz. Put this through the reverb in section 2.3 and open the lowpass (section 2.1) at the same moment, so the reveal and the steam are the same event.

### 1.6 Metal lid scrape and spoon on plate (modal / inharmonic)
Verified building blocks:
- Bell/metal partials are inharmonic. A Risset-style table from the Planet CCRMA additive guide (https://ccrma.stanford.edu/guides/planetccrma/Additive_Synthesis_on.html, ratios and amplitudes as printed in that page's Lisp listing): ratios 0.56, 0.563, 0.92, 0.923, 1.19, 1.7, 2, 2.74, 3, 3.74, 4.07, amplitude weights 1, 2/3, 1, 1.8, 8/3, 1.46, 4/3, 4/3, 1, 4/3, 1. The page's code shortens each partial's duration as `dur * (len - k) / len` and then overwrites the amplitudes with 1/(k+1), so treat the amp list as a starting point only. Pairs like 0.56 / 0.563 are deliberate beating pairs.
- Sound on Sound's bell article (https://www.soundonsound.com/techniques/synthesizing-bells) says: a strike transient of briefly sounding enharmonic partials, a two-stage decay (fast then slow), near-identical partial pairs that beat, and a sub-harmonic an octave below. Its numeric figures were not in the text I could read.

Spoon on plate (my suggestion, untested): 4 to 6 sine partials at ~2.1 kHz base with ratios like 1, 1.59, 2.14, 2.65, 3.2, 4.1 (my guess, ratios loosely like a plate), each with its own decay (200 ms for the lowest down to 30 ms for the highest), plus a 3 ms noise click through a 4 kHz highpass. Keep total partial amplitude low and highpass the whole sound at 500 Hz, which also helps phone speakers.

Lid scrape (my suggestion, untested): noise -> 3 parallel high-Q bandpasses (Q 20 to 40) at ~900, 2300 and 4100 Hz, whose centre frequencies are slowly modulated by +/- 5 percent, gain following a 0.4 to 0.8 s swell. A high Q gives a metallic ring.

### 1.7 Soft dull thud for dough
Not sourced. Recipe (my suggestion, untested): sine 90 -> 45 Hz over 120 ms, gain `exp` decay 150 ms, plus lowpassed (400 Hz) noise burst 40 ms for texture. On a phone speaker the 45 to 90 Hz fundamental is barely reproduced (section 5), so add a 200 to 300 Hz "body" tone with a slightly quicker decay.

### 1.8 Warm chime or bell (FM or additive)
- Additive: use the partial table in 1.6 with ratios scaled to the note. This is the verified option.
- FM: the Chowning-style bell uses an inharmonic carrier:modulator ratio of about 1:1.4 (search snippet, unverified; the MMMAudio example page I tried returned 404, and the Chowning PDF at https://web.eecs.umich.edu/~fessler/course/100/misc/chowning-73-tso.pdf was a scanned image I could not read). The snippet quoted carrier 200 Hz, modulator 280 Hz and an index envelope falling from about 25 to 0 (unverified).
- Web Audio graph (my suggestion, untested): modulator `OscillatorNode` -> `GainNode` (modulation depth = index x modulator frequency) -> carrier `.frequency` AudioParam. Ramp the depth gain exponentially to ~0 over 0.3 to 1.2 s, and give the carrier's own output gain a 5 ms attack and 1.5 to 3 s exponential decay. For a "warm" chime keep the index start low (2 to 5, not 25) and lowpass at ~4 kHz.

### 1.9 Quiet warm drone or pad under everything
Not sourced. Recipe (my suggestion, untested): 3 sawtooth oscillators at root, root x 1.5 (fifth) and root x 2, each detuned +/- 4 to 8 cents, summed -> lowpass 600 Hz, Q 0.5 with an LFO (0.05 Hz) moving cutoff +/- 150 Hz -> gain 0.03. Pick a root of 110 to 147 Hz so it stays audible on a phone through its harmonics. Fade in over 6 to 10 s. A drone with fifth interval is a calm, ambiguous bed; it does not fight the sizzle because it lives below 800 Hz and sizzle lives above 2 kHz.

---

## 2. Muffled "heard from another room" and its release

Sources: none opened for this section. The BiquadFilter details and ConvolverNode text were in a part of the Web Audio spec that the fetch tool could not read (https://webaudio.github.io/web-audio-api/ was ~400k characters and only the first 100k were read). Everything below is my suggestion, untested, except the `AudioParam` scheduling advice, which MDN supports (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices says to stick to `AudioParam` methods for timing-sensitive changes).

### 2.1 Muffle and release
- MDN: the lowpass `BiquadFilterNode` is a "standard second-order resonant lowpass filter with 12dB/octave rolloff"; a greater `Q` gives a greater peak at cutoff (https://developer.mozilla.org/en-US/docs/Web/API/BiquadFilterNode). 12 dB/octave is gentle, so for a convincing muffle chain two lowpass nodes (24 dB/octave) (my suggestion, untested).
- One lowpass on the master (or a "scene" bus), `Q` ~0.5 (no resonant peak, which would sound like a wah).
- Muffled state: cutoff 500 to 700 Hz, bus gain 0.5 to 0.6. Occluded sounds lose highs first, so the lowpass does most of the work.
- Release at reveal: cutoff to 18 kHz over 1.2 to 2 s using an exponential ramp (frequency perception is logarithmic), and bus gain to 1.0 over 0.8 s, starting ~0.2 s before the lid opens. Fire the steam hiss and the chime inside that window.
- Keep the sizzle's crackle highpass layers inside the muffled bus too. Cutting the highs removes crackle clicks, so also lower crackle rate (rate x 0.5) while muffled.

```js
// Muffle, then release. (my suggestion, untested)
const room = new BiquadFilterNode(ctx, { type: 'lowpass', frequency: 600, Q: 0.5 });
const bus = new GainNode(ctx, { gain: 0.55 });
bus.connect(room).connect(ctx.destination);
function reveal(sec = 1.6) {
  const t = ctx.currentTime;
  room.frequency.cancelScheduledValues(t);
  room.frequency.setValueAtTime(room.frequency.value, t);
  room.frequency.exponentialRampToValueAtTime(18000, t + sec);
  bus.gain.cancelScheduledValues(t);
  bus.gain.setValueAtTime(bus.gain.value, t);
  bus.gain.linearRampToValueAtTime(1, t + sec * 0.6);
}
```
Pitfall: call `cancelScheduledValues` then `setValueAtTime(current)` before ramping, or the ramp starts from the wrong point.

### 2.2 Add a "through the wall" cue
Optionally add a very short (15 to 30 ms) feedback-free delay mix at 15 percent and a gentle -3 dB cut at 2.5 kHz; dropping the 2 to 4 kHz region reads as "behind a door". Untested.

### 2.3 Cheap reverb
- MDN confirms a `ConvolverNode` convolves an `AudioBuffer` and is "often used to achieve a reverb effect"; the impulse response can be mono, stereo or 4-channel; `normalize` applies equal-power scaling when the buffer is set (https://developer.mozilla.org/en-US/docs/Web/API/ConvolverNode). MDN's example loads a file, but a generated buffer works the same way (my suggestion, untested).
- Convolution with a generated impulse response: make a stereo buffer of 1.2 to 2.5 s of noise multiplied by `exp(-t * k)` with k about 3 to 5 (so it falls 60 dB in about the buffer length), optionally lowpass the later part so the tail is darker. Load it into a `ConvolverNode`. Send ~15 to 25 percent wet for a kitchen, 35 percent for the reveal moment.
- Feedback delay network is the alternative, but it takes more code. The Julius O. Smith book covers FDN reverb (table of contents opened: https://www.dsprelated.com/freebooks/pasp/); I did not read the chapter. For this project the generated impulse response is smaller and sounds fine.

```js
// Noise-decay impulse response. (my suggestion, untested)
function makeIR(ctx, sec = 1.8, k = 4) {
  const n = ctx.sampleRate * sec, ir = ctx.createBuffer(2, n, ctx.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = ir.getChannelData(c);
    for (let i = 0; i < n; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-k * i / n * 2.3);
  }
  return ir;
}
const verb = new ConvolverNode(ctx, { buffer: makeIR(ctx) });
```
Generate it once at start (about 160k samples, cheap).

---

## 3. Web Audio platform facts

**Unlocking on a user gesture.**
- Browsers do not let a context play automatically. Create or resume the context inside a user gesture, normally a click. A context created inside a click is `running`; outside it is `suspended` and needs `resume()` after interaction (https://developer.mozilla.org/en-US/docs/Web/API/Web_Audio_API/Best_practices).
- Chrome says the same, and calling `start()` on an attached node also resumes the context after a gesture. On mobile Chrome, autoplay does not rely on the Media Engagement Index; the article says the user can qualify by adding the site to the home screen (https://developer.chrome.com/blog/autoplay).
- Plan: a "Sound on" button that calls `ctx.resume()` inside its handler. This also matches the "sound on" prompt in the brainstorm.

**iPhone ring/silent switch.**
- The Web Audio default session type is "ambient", which is muted by the silent switch. The W3C Audio Session draft lists defaults of `playback` for media elements, `ambient` for `AudioContext` and `play-and-record` for microphone tracks (https://www.w3.org/TR/audio-session/). That page does not mention the silent switch itself.
- WebKit bug 237322 "webaudio api is muted when the iOS ringer is muted" is resolved with "CONFIGURATION CHANGED". A WebKit engineer's comment of 2024-09-25 says: since iOS 17 you can set `navigator.audioSession.type = "playback"`, and the default is ambient, which mutes when the phone is muted (https://bugs.webkit.org/show_bug.cgi?id=237322). That is a comment, not release notes. Safari's own release notes for 17.0 did not mention the Audio Session API on the page I read (https://webkit.org/blog/14445/webkit-features-in-safari-17-0/).
- MDN lists `navigator.audioSession` as experimental and "Limited availability" (https://developer.mozilla.org/en-US/docs/Web/API/Navigator/audioSession). The `type` values are `auto` (default), `playback`, `transient`, `transient-solo`, `ambient`, `play-and-record`. `playback` is exclusive and "will pause other playback audio on the device" (https://developer.mozilla.org/en-US/docs/Web/API/AudioSession/type).
- So `navigator.audioSession.type = "playback"` is likely to help on iOS 17+ so the silent switch does not mute the sound, but I could not test it, and WebKit reports from 2023-2024 (search snippets only, unverified: https://bugs.webkit.org/show_bug.cgi?id=252746) say some types behave inconsistently on iOS 17 and 18. Side effect to expect: `playback` will interrupt a user's podcast or music. This is a real trade-off for a "cozy ambience" page, because the user may have music playing. Decide on purpose.
- Feature-detect and wrap: `if ('audioSession' in navigator) navigator.audioSession.type = 'playback';` (my suggestion, untested; set it before creating the context).
- Fallback for older iOS: the library `unmute-ios-audio` (MIT, last npm release 3.3.0 on 2020-10-21 per the npm registry; https://github.com/feross/unmute-ios-audio) plays a silent `<audio>` tag plus a context on user interaction. A search result (unverified) says a lock-screen media control can appear for the silent track.
- No JavaScript API detects the state of the silent switch (search snippet, unverified). So show a small hint such as "No sound? Check the silent switch" near the sound button.

**The "interrupted" state.**
- `interrupted` means the context was paused by something outside the app. MDN shows a recipe for iOS Safari: Safari sets `interrupted` when the user switches tabs, minimises the browser or turns the screen off, so call `resume()` and handle `onstatechange` (https://developer.mozilla.org/en-US/docs/Web/API/BaseAudioContext/state). `resume()` generally needs a gesture on iOS (unverified; plan to show a "tap to resume" overlay).
- The Web Audio spec defines the state and an interruption-handling procedure at section 2.7, but I did not read its text (https://webaudio.github.io/web-audio-api/).

**Backgrounded tab or locked screen.** On iOS, audio stops (MDN above). For Chrome on Android, whether Web Audio keeps playing in a background tab or locked screen was not verified. Plan: on `visibilitychange` hidden, fade to silence in 200 ms and suspend, and on visible resume with a fade-in, so behaviour is the same on every platform.

**AudioWorklet.** MDN lists it as Baseline Widely available since April 2021, in secure contexts (HTTPS) only (https://developer.mozilla.org/en-US/docs/Web/API/AudioWorklet). It needs `addModule()` of a separate JS file, which is fine for a zero-build site but needs a real HTTP server (not `file://`; unverified). You do not need it here: the nodes above cover everything. Use a worklet only if you want sample-accurate random crackle without the main thread.

**Latency.**
- Spec: `latencyHint` is `interactive` (default), `balanced` or `playback`; `baseLatency` and `outputLatency` are readable properties; a render quantum is 128 frames; the spec's example baseLatency is about 5.8 ms at 44.1 kHz (https://webaudio.github.io/web-audio-api/).
- Android: the platform flag `android.hardware.audio.low_latency` means continuous output latency of 45 ms or less; there is no API to read latency at runtime; typical HAL buffers are 96 to 512 frames (https://developer.android.com/ndk/guides/audio/audio-latency). That page is about native apps, so Chrome's web path may be higher. Bluetooth earbuds usually add 100+ ms (unverified). For this project, latency matters only for tap feedback (spoon, lid). Ambient loops do not care. Use `latencyHint: 'interactive'` for taps.

**Limits worth knowing.**
- Many simultaneous nodes cost CPU on low-end Android. Cap live voices (bubbles ~12, crackle voices ~8) and reuse a single noise buffer (my suggestion).
- Generate buffers once. Do not create `AudioContext`s repeatedly; keep one and `suspend()`/`resume()` it (my suggestion).
- Browser compatibility: Web Audio is in Safari iOS since version 6 and Samsung Internet since 4 (https://caniuse.com/audio-api; the page's Chrome Android and Firefox Android versions looked odd in the extraction, so I do not quote them).

---

## 4. Libraries

All data below is from the npm registry (queried with curl on 2026-11-14) and the GitHub README pages I opened.

| Library | Licence | Size | Status | Verdict |
|---|---|---|---|---|
| Tone.js (https://github.com/Tonejs/Tone.js) | MIT | npm tarball ~5.4 MB unpacked; Bundlephobia API returned about 350 kB minified, 82.5 kB gzipped (version string it reported was 15.5.62, which does not match npm `latest`, so treat as approximate) | npm latest 15.1.22, published 2025-04-27; repo shows 5,589 commits, 37 open issues | Overkill. It pulls in `standardized-audio-context`. Good for sequencing and synth classes but you need none of that. |
| ZzFX (https://github.com/KilledByAPixel/ZzFX) | MIT | README says under 1 kB compressed | npm 1.4.0 published 2026-10-01 | Fun for retro blips, pre-renders a sound from 20 parameters into a buffer. Not right for continuous, evolving textures. Its sample code, though, shows that raw `createBuffer` is all you need. |
| Howler.js (https://github.com/goldfire/howler.js) | MIT | README says about 7 kB gzipped | npm 2.2.4 published 2023-09-19; 364 open issues, 55 open PRs | Only useful for playing recorded files. Its README says it tries to unlock mobile audio by playing an empty buffer on the first `touchend`. If you ship no files, skip it. |
| standardized-audio-context (npm) | MIT | ~3 MB unpacked | 25.3.77, 2024-08-31 | Only needed for old-browser quirks. Skip. |
| unmute-ios-audio (https://github.com/feross/unmute-ios-audio) | MIT | 7.7 kB unpacked | 3.3.0, 2020-10-21, stale | Optional iOS fallback if `navigator.audioSession` is not enough. About 40 lines. |

**Is raw Web Audio enough?** Yes. Every recipe above uses oscillators, noise buffers, biquad filters, gain envelopes, a convolver and a stereo panner. A hand-written ~200-line module is smaller than any of these libraries and gives control over the iOS unlock. Recommendation: raw Web Audio, one `audio.js` file, no libraries (my judgement).

---

## 5. Mixing for phone speakers and headphones

Source status: I did not open any source for this section. Everything below is my suggestion or memory.

- **Small speakers.** Phone speakers reproduce little below ~300 to 500 Hz (unverified, general knowledge). So: do not rely on sub-200 Hz content for the dough thud or the drone; add upper harmonics (e.g. a triangle or saw, or an added tone at 2 to 4 x fundamental).
- **Why sizzle and crackle carry.** They are broadband and mostly 2 to 10 kHz, which is where phone speakers are efficient and where ears are most sensitive (unverified). Related and verified: a 2004 study found boosting the 2 to 20 kHz band made crisp food seem crisper and fresher (see section 6).
- **Avoid harshness.** The same region is fatiguing. Keep the sizzle bed below roughly 10 kHz, avoid a resonant (Q > 2) boost, add a gentle highshelf of -2 to -4 dB at 8 kHz on the master, and never let loops sit at full level for minutes. (my suggestion, untested)
- **Level targets.** Unsourced. Suggested: master peak at or below -3 dBFS (gain ~0.7), put a `DynamicsCompressorNode` as a limiter (threshold -10 dB, ratio 8, attack 3 ms, release 150 ms) on the master, keep the ambient bed 12 to 18 dB below the "event" sounds (lid, chime). Check on a phone at 50 percent volume.
- **Fades.** Suggested (my suggestion, untested): scene crossfades 1.5 to 3 s, equal-power for matching sources (use `cos`/`sin` curves via `setValueCurveAtTime`); ducking the bed for an event sound 150 ms in, 600 ms out; tap feedback no more than 5 to 10 ms attack to avoid clicks.
- **Randomise so loops are not noticed.** Do not loop a short sample of noise: use a 3 to 5 s noise buffer started at random offsets (`start(when, offset)`). Randomise crackle times, filter frequency (+/- 30 percent), gain (log-uniform) and bubble radius; add 0.05 to 0.3 Hz drift on cutoff and gain. Two loops of slightly different lengths (e.g. 3.1 s and 4.3 s) layered make a repeat every ~13 s rather than every 3 s. (all my suggestion, untested)
- **Headphones.** Stereo width helps: decorrelated noise L/R for rain and the bed, bubbles panned randomly between -0.4 and 0.4 with `StereoPannerNode`. On a phone speaker stereo collapses to mono, so check mono phase cancellation by summing channels (decorrelated noise is fine, phase-flipped copies are not).

---

## 6. What makes food sound appetising

- **Verified (opened):** Foley artists use food as a source of "organic sounds that can be easily manipulated". Examples: lettuce crushing, celery twisting, celery wrapped in a damp cloth for wetter bone/blood sounds, apples and chamois for biting, potato chips stand in for footsteps in the woods (https://www.mentalfloss.com/food/how-foley-artists-use-food-make-sound-effects). Take-away for the project: wet versus dry texture matters, and a sound's "meaning" can come from layering something unlike it.
- **Search snippet only (unverified):** In *The Taste of Things* the food sounds were all created in post-production, and Foley artist Olivier Thys says food often cracks well because of its fibre (https://www.kcrw.com/culture/shows/good-food/taste-of-things-milla-chocolates-asian-costco/taste-of-things-movie-foley-artist-olivier-thys; the KCRW page returned HTTP 429 when I tried to open it).
- **Search snippet only (unverified):** Zampini and Spence (2004), *Journal of Sensory Studies* 19, 347-363. Raising overall level, or boosting only the 2 to 20 kHz band of the biting sound, made potato chips seem crisper and fresher (https://www.neuroscience.ox.ac.uk/publications/4405 returned 403; the claim is from the search result text, also at https://iris.unitn.it/handle/11572/31101). Practical use: crisp sounds (fried onion crackle, spoon on crust) benefit from a bright 2 to 10 kHz layer, and brightness cues freshness.
- **The moment of quiet before a bite.** I found no source. It is a common cinema and music technique (silence or a dip makes the next sound feel bigger), but treat it as my suggestion, untested: duck the bed by 6 to 10 dB for 300 to 600 ms before the reveal chime or first spoonful, and make the following sound sharper (short attack).
- **Not found:** guidance on mic technique, mix level or processing to make eating sound pleasant instead of gross. A further search is needed (try ASMR sound design and sensory-science sources).

---

## 7. Recorded alternatives

Licences verified at the source unless noted.

- **Freesound** (https://freesound.org/help/faq/): CC0 means "you can do pretty much what you want with the sound" and you may sell work using it; you may not claim to be the author. CC BY needs attribution to the original creator (title, author, page link, licence). CC BY-NC bars earning money. "Sampling+" is a legacy licence. Downloading needs a logged-in account. **Filter the search to CC0 and check each sound's licence on its own page**, since the licence is per sound. Good for: spoon on plate, lid clank, a real sizzle layer, a real steam release.
- **Kenney** (https://kenney.nl/support): all assets on the asset pages are CC0, commercial use allowed, credit not required (appreciated). Do not reuse the Kenney logo. The page does not say if there are cooking sounds, and Kenney's catalogue is mostly game UI/impact/interface sounds, so expect clicks and UI, not kitchen sounds (unverified).
- **Pixabay** (https://pixabay.com/service/license-summary/): free use and modification, credit not required, but you cannot sell or distribute content on a "standalone" basis. The summary page does not treat audio separately, but its definition of Content includes audio, so the same terms appear to apply. For a site that ships the files inside a page, this is probably fine, but the files would be downloadable from the page, which sits close to the standalone-redistribution clause. Check the full Content License and, to be safe, prefer CC0.
- **BBC Sound Effects:** I could not open the BBC page, and the RemArc GitHub repo page (https://github.com/bbcarchdev/Remarc) does not show the media licence text (it lists Apache-2.0 for the software only). Secondary coverage (not primary, so unverified) says the free archive is for personal, educational or research use, commercial use needs a separate licence, and the BBC should be credited (https://techradar.com/news/the-bbc-is-letting-you-download-more-than-16000-free-sound-effect-samples, https://electronicgroove.com/bbc-expands-sound-effect-library-to-33000-free-samples/). Treat BBC sounds as not usable on a public site unless you read the current terms yourself.
- **Not checked:** other libraries (Sonniss GDC bundles, Zapsplat, OpenGameArt, Mixkit). I did not open their terms, so I make no claim.

**Which sounds I would consider recording**, because synthesis usually disappoints: a real spoon-on-plate or lid-on-pot clink, and a real sizzle or steam layer (a recorded sizzle in a short, looping, compressed file is likely to sound more convincing than noise). Any chewing/crunch sound. Keep files tiny (mono, 8 to 20 s loops, 64 kbps Opus/AAC). If you use zero files, synthesised noise is acceptable for bed sounds (rain, flame, hiss) and the bubbles.

---

## 8. Captions for non-speech sound

- **Requirement.** WCAG 2.2 Understanding "Captions (Prerecorded)": captions must "identify who is speaking and include non-speech information conveyed through sound, including meaningful sound effects" (https://www.w3.org/WAI/WCAG22/Understanding/captions-prerecorded.html). Note the word "meaningful". Decorative ambience is not required, but for this project the sound carries the story, so caption it.
- **Style (Netflix English USA Timed Text Style Guide, opened: https://partnerhelp.netflixstudios.com/hc/en-us/articles/217350977-English-USA-Timed-Text-Style-Guide).** Enclose sound effects in square brackets; all lowercase except proper nouns; never italicise labels; examples use present tense (`[horse neighs]`, `[engine starts]`); be detailed and descriptive and use adverbs where appropriate; describe the sound, not the visuals or actions; include plot-pertinent effects unless the visuals already show them; only label sounds that cannot be visually identified; use a generic ID for ambient music (`[rock music playing over stereo]`) and genre or mood descriptions for atmospheric music; subtitle silence if plot-pertinent. The guide does not address onomatopoeia directly and advises natural wording. The general Netflix page I tried first had none of this (https://partnerhelp.netflixstudios.com/hc/en-us/articles/215758617-Timed-Text-Style-Guide-General-Requirements).
- **BBC subtitle guidelines:** not opened.

Suggested usage (my suggestion, untested): one small caption line that follows the scene, lowercase in brackets, for example `[onions sizzling softly]`, `[gravy bubbling gently]`, `[muffled simmering from another room]`, `[lid lifts, steam hisses]`, `[a warm chime]`, `[quiet]` before the reveal. Update it in a polite `aria-live` region, offer a toggle, and caption only changes in scene, not every crackle.

---

## Needs listening tests on a real phone

1. iPhone, silent switch on, with and without `navigator.audioSession.type = "playback"`: does the sound play? Test iOS 17, 18 and the current release.
2. iPhone: does `playback` stop the user's own music, and is that acceptable?
3. iPhone: lock the screen, background the tab, switch apps, then return. Is the state `interrupted`, and does `resume()` work without a gesture?
4. Android Chrome: background and lock-screen behaviour, plus CPU/battery with ~20 live voices.
5. Phone speaker versus wired earbuds versus Bluetooth: balance of sizzle against drone, harshness at 4 to 8 kHz, whether the dough thud is audible at all.
6. Sizzle realism: does synthesised crackle sound like onions in oil or like static? If static, try a recorded loop.
7. Bubble density and pitch range: does it sound like thick gravy or like a fish tank?
8. Muffle and release: does a 600 Hz lowpass still sound "like another room" on a phone speaker, and is a 1.6 s release satisfying?
9. Loop audibility: listen for repeats at 2 minutes.
10. Tap latency for spoon and lid on a mid-range Android phone.
11. Overall loudness: compare to a typical video at the same system volume.
