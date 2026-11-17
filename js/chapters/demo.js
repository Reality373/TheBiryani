// The demo chapter: reachable with ?ch=demo only. It is the reference pattern for chapter agents.
//
// A chapter module is { id, art, play }. art() imports the art module (default export: art(params) -> { planes }).
// play(ctx) runs the chapter and resolves when it is complete. ctx: stage, hotspot, voice, audio, ui, prefs, params,
// auto, calm(), wait(ms), signal, mood. Rules that matter (docs/design.md section 2):
//  - Make things touchable with ctx.hotspot(el, { label, gesture, step, drag?, hold?, release? }). step ALWAYS progresses
//    (it is the tap, Enter/Space and auto-mode action). drag/hold are extras that are ignored in calm mode.
//  - Start voice lines over the action; never make a hotspot wait for a line (ctx.voice.say returns a promise; do not await it
//    before enabling touch).
//  - Sound follows the gesture (audio.level), and every sound has a visual twin (the ripple).
//  - Respect ctx.signal: when it aborts (the viewer jumped to another chapter) stop; hotspots made here dispose themselves.
import '../sound/demo.js';

export default {
  id: 'demo',
  art: () => import('../art/demo.js'),
  async play({ stage, hotspot, voice, audio, signal }) {
    voice.say('demo.intro'); // not awaited: the line plays over the action
    let looking = '';
    // The camera frames what you touch (and the target stays above the subtitle zone).
    const look = (key, scale, x, y) => { if (looking !== key) { looking = key; stage.camera.push(scale, x, y, 1200); } };
    const clamp01 = (v) => Math.min(1, Math.max(0, v));

    // ---- the disc: drag along the line; a tap moves it a quarter of the way ----
    const disc = stage.$('#d-disc-g');
    let p = 0;
    const move = (to) => {
      p = clamp01(to);
      disc.setAttribute('transform', `translate(${p * 280} 0)`);
      return p >= 1;
    };
    const discSpot = hotspot(disc, {
      label: 'slide the disc along',
      gesture: { drag: [280, 0] },
      step() { look('disc', 1.2, 800, 560); audio.level('demo-hum', 0.6); setTimeout(() => audio.level('demo-hum', 0), 250); return move(p + 0.25); },
      drag({ x, speed }) { look('disc', 1.2, 800, 560); audio.level('demo-hum', Math.min(1, 0.2 + speed / 900)); return move((x - 650) / 280); },
      release() { audio.level('demo-hum', 0); },
    });
    discSpot.done.then(() => { audio.level('demo-hum', 0); if (!signal.aborted) { audio.hit('demo-ding'); voice.say('demo.disc'); } });

    // ---- the bowl: three taps, one registered one-shot and one ripple each ----
    const bowl = stage.$('#d-bowl');
    let taps = 0;
    const bowlSpot = hotspot(bowl, {
      label: 'tap the bowl',
      gesture: 'tap',
      step() {
        look('bowl', 1.2, 870, 700);
        audio.hit('demo-plop');
        const ripple = stage.$('#d-ripple');
        ripple.classList.remove('is-on'); void ripple.getBBox(); ripple.classList.add('is-on');
        taps++;
        if (taps === 3) voice.say('demo.bowl');
        return taps >= 3;
      },
    });

    // Wait for both, or for the viewer to leave.
    const left = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    await Promise.race([Promise.all([discSpot.done, bowlSpot.done]), left]);
    if (signal.aborted) return;
    voice.say('demo.done');
    await stage.camera.push(1, 800, 500);
  },
};
