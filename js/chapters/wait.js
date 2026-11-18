// Chapter V, The Wait. Room, wide: the sealed pot on a low flame on a rainy night, and nothing to do but wait.
// Beats: (1) slide the tawa under the pot; (2) turn the knob from high to low, four clicks; (3) the dum: wipe the
// window, try the lid, touch the steam (the steam waits for the window or the lid), in any order, each giving its
// line on the first touch and staying playable; (4) flame off, then a few cooling ticks.
//
// ?state= (dev, for screenshots; sets the chapter up at that point, then holds there until the viewer acts):
//   high     the tawa at its side, knob high (the first beat)
//   tawa     the tawa under the pot, knob high (the knob beat)
//   low      knob at low, the dum not started (holds here)
//   dum      the dum: window and lid touchable, steam not yet
//   wiped    the dum with the left half of the window wiped
//   rest     all three done; knob at low, ready to turn off
//   off      flame off, ember, the pot cooling (holds here)
// Hotspots: #r-tawa (drag [-362, -70]), #r-knob (drag [120, 0]; keys ArrowLeft/ArrowRight), #r-window (drag [200, 0]),
// #r-lid (tap), #r-steam (tap; moving through it pushes the thread aside), and #r-knob again for the flame off.
// The gecko (#r-gecko) scurries on a tap, as an extra; it is not a hotspot, so it has no hint.
import '../sound/wait.js';

const STATE = { high: 0, tawa: 1, low: 2, dum: 3, wiped: 3, rest: 4, off: 5 };
const SIDE = [362, 70]; // the tawa's side position, from its place under the pot (room.js: translate(362px,70px))
const SIDE_PHONE = [50, 0]; // on a phone the column is too narrow for the whole tawa: it starts just inside the column (as the lid does in the seal)
const KNOB_SPAN = 240; // world units of drag for a full turn of the knob, 0 to 1
const DETENTS = [0.125, 0.25, 0.375, 0.5]; // the knob's four clicks from high (0) to low (0.5)
const WIPE_DONE = 900; // world units of glass wiped before the first of the three counts (three taps do too)
const SWATHES = [200, 290, 250]; // heights of a tap's broad swathe across the glass

const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clampK = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
// Progress 0..1 along a path (a drag vector) after a pointer move of (dx, dy): the projection onto the path.
export const along = (p, dx, dy, path) => clamp01(p + (dx * path[0] + dy * path[1]) / (path[0] ** 2 + path[1] ** 2));
// Flame strength from the knob: 1 at high, 0.38 at low, 0 at off.
export const flameAt = (v) => (v <= 0.5 ? 1 - (v / 0.5) * 0.62 : 0.38 * (1 - (v - 0.5) / 0.5));
// How many detents the knob has passed (it clicks when this changes).
export const passedBy = (v) => DETENTS.filter((d) => v >= d - 1e-6).length;

export default {
  id: 'wait',
  art: () => import('../art/wait.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params, calm } = ctx;
    const el = stage.el;
    // The stage is shared: a replay or a backward jump finds the room as the later chapters left it.
    for (const v of ['--seal', '--knob', '--flame', '--crack', '--lift', '--glow', '--spread']) el.style.removeProperty(v);
    el.dataset.fog = 'off';
    const state = params.get('state');
    const at = STATE[state] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    signal.addEventListener('abort', () => { for (const t of timers) clearTimeout(t); timers.clear(); }, { once: true });

    const tawa = stage.$('#r-tawa'), knobEl = stage.$('#r-knob'), kp = knobEl.querySelector('.kp');
    const windowEl = stage.$('#r-window'), wipe = stage.$('#r-fog-wipe');
    const lidEl = stage.$('#r-lid'), pot = stage.$('#r-pot'), steamEl = stage.$('#r-steam');
    const gecko = stage.$('#r-gecko'), under = stage.$('#w-under');

    // The camera pushes in on what is touchable (the target stays in the top 70%); a phone is too narrow to push far.
    // ms 0 is an instant cut (the dev states).
    const frame = (want, span, x, y, ms = 1600) => {
      const k = Math.max(innerWidth / 1600, innerHeight / 1000);
      stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k * span))), x, y, ms);
    };

    // ---- the knob: one value 0..1 drives --knob, --flame, data-flame and the flame bed ----
    let knob = 0, passed = 0;
    const setKnob = (v) => {
      knob = v;
      const f = flameAt(v);
      el.style.setProperty('--knob', v.toFixed(3));
      el.style.setProperty('--flame', f.toFixed(3));
      el.dataset.flame = v >= 1 ? 'off' : v >= 0.5 ? 'low' : 'high';
      if (v < 1) audio.level('flame', 0.45 * f, 0.1);
    };
    const click = () => {
      audio.hit('wait-click');
      kp.animate([{ rotate: '-4deg' }, { rotate: '0deg' }], { duration: 200, easing: 'ease-out' }); // the pointer jumps a hair
    };
    const nextDetent = () => DETENTS.find((d) => d > knob + 1e-6) ?? 0.5;
    const prevDetent = () => [...DETENTS].reverse().find((d) => d < knob - 1e-6) ?? 0;
    const turnLow = (v) => {
      setKnob(clampK(v, 0, 0.5));
      const n = passedBy(knob);
      if (n !== passed) { passed = n; click(); }
      return knob >= 0.5;
    };
    const flameOff = () => { setKnob(1); audio.stop('flame', 3); click(); return true; };
    const turnOff = (v) => { if (v >= 0.999) return flameOff(); setKnob(Math.max(0.5, v)); return false; };

    // ---- the tawa: slides from its side to under the pot ----
    const side = innerWidth <= 600 ? SIDE_PHONE : SIDE;
    const offset = (p) => [(1 - p) * side[0], (1 - p) * side[1]];
    if (at === 0) tawa.style.transform = `translate(${side[0]}px, ${side[1]}px)`;
    const landTawa = (slide) => {
      // A tap slides from where the tawa is now, on the CSS transition; a drag lands with none.
      tawa.style.transition = slide ? '' : 'none';
      if (slide) { tawa.style.transform = getComputedStyle(tawa).transform; void tawa.getBBox(); }
      tawa.style.transform = '';
      el.dataset.tawa = 'under';
      if (!slide) { void tawa.getBBox(); tawa.style.transition = ''; }
      later(() => audio.hit('wait-clunk'), slide ? 850 : 0);
      under.classList.add('on');
      later(() => under.classList.remove('on'), 3200);
      voice.say('wait.whyTawa');
    };
    const tawaBeat = () => new Promise((resolve) => {
      let p = 0;
      const path = [-side[0], -side[1]];
      const spot = hotspot(tawa, {
        label: 'slide the tawa under the pot',
        gesture: { drag: path },
        step() { landTawa(true); return true; },
        drag({ dx, dy }) {
          p = along(p, dx, dy, path);
          if (p < 0.97) {
            const [x, y] = offset(p);
            tawa.style.transition = 'none';
            tawa.style.transform = `translate(${x}px, ${y}px)`;
            return;
          }
          landTawa(false);
          return true;
        },
        release() {
          if (p <= 0) return;
          p *= 0.85; // let go early: it drifts back a little, nothing is lost
          const [x, y] = offset(p);
          tawa.style.transition = 'transform .35s ease-out';
          tawa.style.transform = `translate(${x}px, ${y}px)`;
        },
      });
      spot.done.then(resolve);
    });

    // ---- the knob, high to low ----
    const knobBeat = () => new Promise((resolve) => {
      frame(1.8, 300, 924, 800);
      const spot = hotspot(knobEl, {
        label: 'turn the knob down',
        gesture: { drag: [120, 0] },
        step: () => turnLow(nextDetent()),
        drag: ({ dx }) => turnLow(knob + dx / KNOB_SPAN),
        keys: { ArrowRight: () => turnLow(nextDetent()), ArrowLeft: () => turnLow(prevDetent()) },
      });
      spot.done.then(() => { voice.say('wait.whyLow'); resolve(); });
    });

    // ---- the dum: window, lid, steam; each milestone raises --spread by a third ----
    const done = { a: false, b: false, c: false };
    const count = () => Object.values(done).filter(Boolean).length;
    const said = {};
    const say = (key) => { if (!said[key]) { said[key] = true; voice.say(`wait.${key}`); } };
    let allDoneResolve;
    const allDone = new Promise((r) => { allDoneResolve = r; });
    let steamSpot = null, winSpot = null, lidSpot = null, dumOn = false;
    const setSpread = () => el.style.setProperty('--spread', String(count() / 3));
    const milestone = (key) => {
      if (done[key]) return;
      done[key] = true;
      setSpread();
      if (!steamSpot && (done.a || done.b)) steamSpot = makeSteam();
      if (count() === 3) allDoneResolve();
    };

    // The window: the mask path grows in world units, so the clear streaks follow the finger.
    let wd = '', wiped = 0, taps = 0;
    const addWipe = (x0, y0, x1, y1) => {
      wd += `M${x0.toFixed(0)} ${y0.toFixed(0)}L${x1.toFixed(0)} ${y1.toFixed(0)}`;
      wipe.setAttribute('d', wd);
      wiped += Math.hypot(x1 - x0, y1 - y0);
    };
    const rub = (v) => audio.level('wait-rub', v); // 0 stops it
    const rainUp = () => audio.level('rain', 0.85, 0.2);
    const rainSettle = () => audio.level('rain', 0.5, 2.5);
    const winCheck = () => { if (taps >= 3 || wiped >= WIPE_DONE) milestone('a'); };

    // The steam: moving through it pushes the thread aside, and it curls back; a tap gives a puff.
    let steamX = NaN, curlT = 0;
    const puff = () => {
      audio.hit('wait-breath');
      steamEl.animate([{ scale: '1' }, { scale: '1.06' }, { scale: '1' }], { duration: 520, easing: 'ease-out' });
    };
    const pushSteam = (e) => {
      if (!dumOn || calm()) return;
      const x = stage.toWorld(e, steamEl).x;
      const pass = Math.abs(x - steamX) > 12; // a sweep through the thread, not a drift at its edge
      steamX = x;
      steamEl.style.transition = 'transform .25s ease-out';
      steamEl.style.transform = `translate(${clampK(x - 842, -60, 60)}px, 0px)`;
      clearTimeout(curlT);
      curlT = later(() => { steamEl.style.transition = 'transform .9s ease-out'; steamEl.style.transform = ''; }, 700);
      if (pass) { say('steam'); milestone('c'); }
    };
    const makeSteam = () => {
      steamEl.style.transformBox = 'fill-box';
      steamEl.style.transformOrigin = '50% 100%';
      steamEl.addEventListener('pointermove', pushSteam, { signal });
      return hotspot(steamEl, {
        label: 'touch the steam',
        gesture: 'tap',
        step() { puff(); say('steam'); milestone('c'); return false; },
      });
    };

    // The lid: it refuses. The pot shudders, the dough stays whole.
    const shudder = () => [pot, lidEl].forEach((g) => g.animate(
      [{ transform: 'translate(0px, 0px)' }, { transform: 'translate(2.5px, 0px)' }, { transform: 'translate(-2px, 0.5px)' },
        { transform: 'translate(1px, 0px)' }, { transform: 'translate(0px, 0px)' }],
      { duration: 280, easing: 'linear' }));
    let lidTried = false;

    const dumBeat = () => new Promise((resolve) => {
      el.dataset.light = 'dim';
      el.dataset.fog = 'on';
      audio.muffle(1, 3); // everything but the rain, as if from the next room
      stage.camera.push(1, 800, 500);
      voice.say('wait.dum');
      dumOn = true;
      winSpot = hotspot(windowEl, {
        label: 'wipe the window',
        gesture: { drag: [200, 0] },
        step() {
          const y = SWATHES[taps % SWATHES.length];
          taps++;
          addWipe(612, y, 988, y); // a tap is one broad swathe
          rainUp(); later(rainSettle, 900);
          say('rain'); winCheck();
          return false;
        },
        drag({ x, y, dx, dy, speed }) {
          addWipe(x - dx, y - dy, x, y);
          rub(Math.min(0.8, 0.1 + speed / 900));
          rainUp();
          say('rain'); winCheck();
          return false;
        },
        release() { rub(0); later(rainSettle, 400); },
      });
      lidSpot = hotspot(lidEl, {
        label: 'try the lid',
        gesture: 'tap',
        step() {
          shudder();
          audio.hit('thud');
          if (!lidTried) { lidTried = true; voice.say('wait.lid'); voice.say('wait.whyLid'); }
          milestone('b');
          return false;
        },
      });
      allDone.then(() => {
        dumOn = false;
        winSpot.dispose(); lidSpot.dispose(); steamSpot?.dispose();
        rub(0); rainSettle(); // the window's release() is skipped when its last wipe finishes it mid-drag
        resolve();
      });
    });

    // ---- rest: flame off, then cooling ----
    const restBeat = async () => {
      voice.say('wait.off');
      voice.say('wait.whyRest');
      frame(1.8, 300, 924, 830);
      const spot = hotspot(knobEl, {
        label: 'turn the flame off',
        gesture: { drag: [120, 0] },
        step: flameOff,
        drag: ({ dx }) => turnOff(knob + dx / KNOB_SPAN),
        keys: { ArrowRight: flameOff },
      });
      await Promise.race([spot.done, gone]);
      if (signal.aborted) return;
      for (let i = 0; i < 4; i++) {
        await ctx.wait(700 + Math.random() * 800);
        if (signal.aborted) return;
        audio.hit('wait-tick');
        stage.$(`#w-sp${i % 3}`)?.animate([{ opacity: 0 }, { opacity: 1 }, { opacity: 0 }], { duration: 420 });
      }
      await ctx.wait(1500);
    };

    // The scurry: an extra, for a tap on the gecko.
    gecko?.addEventListener('pointerdown', () => {
      gecko.animate([{ transform: 'translate(0px, 0px)' }, { transform: 'translate(-18px, -70px)', offset: 0.35 },
        { transform: 'translate(-18px, -70px)', offset: 0.7 }, { transform: 'translate(0px, 0px)' }],
      { duration: 3000, easing: 'ease-in-out' });
    }, { signal });

    // ---- the start state ----
    setKnob(at >= 2 ? 0.5 : 0);
    passed = at >= 2 ? 4 : 0;
    el.dataset.pot = 'sealed';
    el.style.setProperty('--seal', '1');
    el.dataset.light = 'normal';
    el.dataset.fog = 'off';
    el.dataset.tawa = at >= 1 ? 'under' : 'side';
    el.style.setProperty('--spread', '0');
    audio.bed('rain', 0.5);
    audio.bed('flame', 0.45 * flameAt(knob));
    audio.muffle(0.55); // continues the hush from the seal
    if (at === 0) voice.say('wait.high');

    // ---- the flow ----
    if (at === 0) {
      frame(1.8, 532, 900, 700);
      await Promise.race([tawaBeat(), gone]);
      if (signal.aborted) return;
    }
    if (at === 2) { frame(1.8, 300, 924, 800, 0); await gone; return; }
    if (at <= 1) {
      await Promise.race([knobBeat(), gone]);
      if (signal.aborted) return;
    }
    if (at >= 4) {
      // a, b, c all done (the dev states): the wipe, the lid and the steam are already behind it
      addWipe(612, 200, 988, 200); addWipe(612, 290, 988, 290);
      done.a = done.b = done.c = true;
      setSpread();
    } else {
      if (state === 'wiped') { addWipe(612, 170, 800, 170); addWipe(612, 250, 800, 250); addWipe(612, 330, 800, 330); }
      await Promise.race([dumBeat(), gone]);
      if (signal.aborted) return;
    }
    if (at === 5) { frame(1.8, 300, 924, 830, 0); flameOff(); await gone; return; }
    await Promise.race([restBeat(), gone]);
  },
};
