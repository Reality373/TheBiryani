// Chapter VI, The Rice. Close shot down on the pot of water on the burner. Beats: (1) tap the tray to tip the whole spices
// into the water; (2) hold the flame knob until the water rolls (the boil bed rises with the hold); (3) tap the salt and the
// oil (two hotspots at once); (4) drag the bowl over the pot to pour the rice in, or tap it. The boil drops, the clock
// starts (5 min on high). The clock stops at 3 minutes: (5) lift a few grains with the slotted spoon and tap one grain
// in the loupe. It is chalky in the middle: the clock runs on to 5 minutes. (6) lift again and press: it breaks clean with
// a firm core, nine-tenths done. (7) drag the pot over to the colander (or tap): it drains, and the steam rushes up.
// Nothing here can be failed: every step waits for the viewer's hands, and the clock only moves while it is running.
//
// ?state= (dev, for screenshots; sets the pot up at that point and plays on from there, except drained, which holds):
//   start    the spices on the tray, the water cold, the flame off (default)
//   boiling  the spices in, the water rolling, the salt, oil and rice waiting
//   rice     the salt and oil in, the rice in, the clock at 1 minute
//   test     the clock stopped at 3 minutes, the slotted spoon waiting for the first test
//   drained  the pot tipped into the colander, the steam up (held)
// Hotspots: #rc-tray-hit (tap), #rc-knob (hold, or tap for a step of heat), #rc-salt, #rc-oil (tap), #rc-bowl (drag
// [-130, -300] toward the pot, or tap), #rc-slot (tap: lift the grains), #rc-grain (tap: press it), #rc-pot-hit (drag
// [260, 40] to the right, or tap).
import '../sound/rice.js';
import { f } from '../art/lib.js';
import { TIP_DEG } from '../art/rice.js';

export const STATES = { start: 0, boiling: 1, rice: 2, test: 3, drained: 4 };
export const MIN_SEC = 3.2;       // seconds of the clock per cooking minute (5 minutes is 16 seconds)
export const RUN_MIN = 5;         // the rice is nine-tenths done at five minutes
export const TESTS = [3, 5];      // the clock stops at these minutes, for a bite test
export const HEAT_SEC = 1.6;      // seconds of holding the flame knob for a rolling boil
export const BOWL_RUN = 300;      // world units of bowl drag that empty it
export const TIP_RUN = 260;       // world units of pot drag that tip it
export const SPICE_IDS = ['cardamom', 'clove', 'cinnamon', 'bayleaf', 'shahijeera', 'mace'];

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
// The flame: held, it climbs to a rolling boil in HEAT_SEC.
export const heatStep = (h, dt) => clamp(h + dt / HEAT_SEC, 0, 1);
// The pot: dragging right tips it; the distance is the whole tip.
export const tipStep = (t, dx) => clamp(t + dx / TIP_RUN, 0, 1);
// The clock runs at MIN_SEC a minute and never passes RUN_MIN.
export const clockStep = (min, sec) => Math.min(RUN_MIN, min + sec / MIN_SEC);
// The hand: one turn is five minutes.
export const dialAngle = (min) => (min / RUN_MIN) * 360;
// The boil bed follows the flame: silent at no heat, full at a rolling boil.
export const boilLevel = (heat) => 0.9 * clamp(heat, 0, 1);

export default {
  id: 'rice',
  art: () => import('../art/rice.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, ui, signal, params, auto } = ctx;
    audio.muffle(0); audio.stop('flame'); audio.stop('drone'); audio.bed('rain', 0.22); // a jump may leave the wait's hush or the end's drone behind
    const $ = (sel) => stage.$(sel);
    const at = STATES[params.get('state')] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const until = (p) => Promise.race([p, gone]);
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };

    // The clock: it runs only while a cook-to goal is set, and stops at each goal (the bite tests).
    let clock = 0, goal = null, last = performance.now(), heat = 0, tilt = 0, ox = 0, oy = 0, run = 0;
    const hand = () => $('#rc-hand');
    const setHand = () => { const h = hand(); if (h) h.style.transform = `rotate(${dialAngle(clock).toFixed(1)}deg)`; };
    const clockTimer = setInterval(() => {
      const now = performance.now(), dt = (now - last) / 1000;
      last = now;
      if (!goal) return;
      clock = clockStep(clock, dt);
      setHand();
      if (clock >= goal.min) { clock = goal.min; setHand(); const g = goal; goal = null; g.resolve(); }
    }, 100);
    const cookTo = (min) => new Promise((resolve) => {
      if (clock >= min) return resolve();
      if (auto) { clock = min; setHand(); return resolve(); } // auto mode does not wait on the clock
      last = performance.now();
      goal = { min, resolve };
    });

    signal.addEventListener('abort', () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      clearInterval(clockTimer);
      goal = null;
      audio.level('boil', 0, 0.2);
      audio.level('pour-water', 0, 0.2);
      audio.level('bowl-slide', 0, 0.2);
    }, { once: true });

    ui.ingredients?.('rice');
    ui.tick?.('water'); // the water is in the pot from the start

    // The camera pushes in on what is touchable; push keeps the target in place and lifts it into the top 70%.
    const frame = (scale, x, y, ms = 1400) => stage.camera.push(scale, x, y, ms);
    const potg = () => $('#rc-potg');

    // ---- the state the viewer already sees (for screenshots), without voices or sounds ----
    const setHeat = (h, sec = 0.6) => {
      heat = h;
      const b = $('#rc-bubbles'); if (b) { b.style.transition = `opacity ${sec}s`; b.style.opacity = String(h); }
      const s = $('#rc-steamg'); if (s) s.style.opacity = String(h);
      const fl = $('#rc-flame'); if (fl) fl.style.opacity = String(h > 0 ? 0.35 + 0.65 * h : 0);
      audio.level('boil', boilLevel(h), sec);
    };
    const tipSpices = (quiet) => {
      $('#rc-tray-g')?.style.setProperty('transform', 'rotate(-24deg)');
      $('#rc-tray-spices')?.classList.add('gone');
      $('#rc-spices')?.classList.add('on');
      $('#rc-tint')?.classList.add('on');
      if (quiet) return;
      for (const id of SPICE_IDS) ui.tick?.(id);
      audio.hit('spice-tip');
    };
    const saltOil = () => { $('#rc-saltdots')?.classList.add('on'); $('#rc-sheen')?.classList.add('on'); };
    const riceIn = (quiet) => {
      $('#rc-rice')?.classList.add('on');
      $('#rc-bowl-rice')?.classList.add('out');
      $('#rc-clockg')?.classList.add('on');
      if (!quiet) ui.tick?.('rice');
    };
    const drained = (quiet) => {
      tilt = 1;
      potg()?.style.setProperty('transform', `rotate(${TIP_DEG}deg)`);
      $('#rc-rice')?.classList.add('out');
      $('#rc-spices')?.classList.add('out');
      $('#rc-pile')?.classList.add('on');
      $('#rc-pour')?.classList.add('on');
      $('#rc-clockg')?.classList.remove('on'); // the clock is done; the tipped pot would cover it
      $('#rc-col-steam')?.classList.add('on');
      setHeat(0, quiet ? 0 : 1.5);
      if (!quiet) audio.hit('steam');
    };

    if (at >= STATES.boiling) { tipSpices(true); setHeat(1, 0); }
    if (at >= STATES.rice) { saltOil(); riceIn(true); clock = 1; setHand(); }
    if (at >= STATES.test) { clock = TESTS[0]; setHand(); }
    if (at === STATES.drained) { clock = RUN_MIN; setHand(); drained(true); await gone; return; }
    // ---- beat 1: the tray ----
    const tipBeat = () => new Promise((resolve) => {
      frame(1.3, 700, 800);
      const spot = hotspot($('#rc-tray-hit'), {
        label: 'tip the whole spices into the pot',
        gesture: 'tap',
        step() { tipSpices(false); voice.say('rice.tip'); voice.say('rice.whyTip'); return true; },
      });
      spot.done.then(resolve);
    });

    // ---- beat 2: the flame, held until the water rolls ----
    const boilBeat = () => new Promise((resolve) => {
      frame(1.3, 660, 700);
      const spot = hotspot($('#rc-knob'), {
        label: 'hold to turn up the flame',
        gesture: 'hold',
        step() { setHeat(heatStep(heat, 0.4)); return heat >= 1; }, // a tap is a quarter of the way
        hold(dt) { setHeat(heatStep(heat, dt), 0.2); return heat >= 1; },
      });
      spot.done.then(() => { voice.say('rice.boil'); resolve(); });
    });

    // ---- beat 3: salt and oil, two taps at once ----
    const saltBeat = () => new Promise((resolve) => {
      frame(1.3, 960, 520);
      const spot = hotspot($('#rc-salt'), {
        label: 'add the salt',
        gesture: 'tap',
        step() {
          $('#rc-salt-g')?.classList.add('shake');
          $('#rc-saltdots')?.classList.add('on');
          audio.hit('salt-pinch');
          ui.tick?.('ricesalt');
          return true;
        },
      });
      spot.done.then(() => { voice.say('rice.salt'); resolve(); });
    });
    const oilBeat = () => new Promise((resolve) => {
      const spot = hotspot($('#rc-oil'), {
        label: 'add the oil',
        gesture: 'tap',
        step() {
          $('#rc-oil-g')?.classList.add('shake');
          $('#rc-sheen')?.classList.add('on');
          audio.hit('oil-drop');
          ui.tick?.('riceoil');
          return true;
        },
      });
      spot.done.then(() => { voice.say('rice.oil'); voice.say('rice.whyOil'); resolve(); });
    });

    // ---- beat 4: the rice, poured from the bowl (drag over the pot, or tap) ----
    const pourRice = () => {
      const bowl = $('#rc-bowl-g');
      if (bowl) { bowl.style.transition = 'transform .9s ease-in-out'; bowl.style.transform = ''; }
      audio.level('bowl-slide', 0, 0.2);
      audio.hit('rice-in');
      $('#rc-fall')?.classList.add('on');
      later(() => { $('#rc-rice')?.classList.add('on'); }, 400);
      $('#rc-bowl-rice')?.classList.add('out');
      $('#rc-clockg')?.classList.add('on');
      ui.tick?.('rice');
      clock = 0; setHand();
      // the boil drops as the cold rice goes in, then comes back up
      setHeat(0.4, 0.4);
      later(() => setHeat(1, 1.8), 2200);
      voice.say('rice.pour');
      voice.say('rice.clock');
    };
    const riceBeat = () => new Promise((resolve) => {
      frame(1.3, 860, 660);
      const bowl = $('#rc-bowl-g');
      const spot = hotspot($('#rc-bowl'), {
        label: 'pour the rice into the pot',
        gesture: { drag: [-130, -300] },
        step() { pourRice(); return true; },
        drag({ dx, dy, speed }) {
          ox += dx; oy += dy; run += Math.hypot(dx, dy);
          if (bowl) { bowl.style.transition = 'none'; bowl.style.transform = `translate(${f(ox)}px, ${f(oy)}px)`; }
          audio.level('bowl-slide', Math.min(0.35, speed / 1800), 0.08);
          if (run >= BOWL_RUN) { pourRice(); return true; }
        },
        release() {
          if (run >= BOWL_RUN) return; // poured already
          ox = 0; oy = 0; audio.level('bowl-slide', 0, 0.2);
          if (bowl) { bowl.style.transition = 'transform .6s ease-out'; bowl.style.transform = ''; }
        },
      });
      spot.done.then(resolve);
    });

    // ---- beats 5 and 6: the bite test. The spoon lifts a few grains; one grain is pressed in the loupe. ----
    const press = (n) => {
      const lo = $('#rc-loupeg');
      if (n === 0) {
        lo?.classList.add('hard');
        audio.hit('grain-hard');
        voice.say('rice.hard');
      } else {
        lo?.classList.add('snap');
        audio.hit('grain-snap');
        voice.say('rice.firm');
        voice.say('rice.whyTest');
      }
    };
    const testBeat = (n) => new Promise((resolve) => {
      frame(1.6, 840, 330);
      if (n === 0) voice.say('rice.test');
      const slot = hotspot($('#rc-slot'), {
        label: 'lift a few grains with the spoon',
        gesture: 'tap',
        step() {
          $('#rc-slot-g')?.classList.add('lifted');
          $('#rc-spoon-grains')?.classList.add('on');
          $('#rc-loupeg')?.classList.add('on');
          audio.hit('lift');
          return true;
        },
      });
      slot.done.then(() => {
        const grain = hotspot($('#rc-grain'), {
          label: 'press the grain',
          gesture: 'tap',
          step() { press(n); return true; },
        });
        grain.done.then(() => {
          // the spoon goes back to the pot; the loupe fades after the result has been seen
          later(() => {
            $('#rc-slot-g')?.classList.remove('lifted');
            $('#rc-spoon-grains')?.classList.remove('on');
            $('#rc-loupeg')?.classList.remove('on', 'hard', 'snap');
          }, n === 0 ? 2200 : 3600);
          resolve();
        });
      });
    });

    // ---- beat 7: the pot tipped into the colander (drag right, or tap) ----
    const tip = (t, animate) => {
      const p = potg();
      if (!p) return;
      p.style.transition = animate ? 'transform 1.4s ease-in-out' : 'none';
      p.style.transform = `rotate(${f(t * TIP_DEG)}deg)`;
    };
    const drainBeat = () => new Promise((resolve) => {
      frame(1.2, 880, 470);
      const spot = hotspot($('#rc-pot-hit'), {
        label: 'tip the pot into the colander',
        gesture: { drag: [TIP_RUN, 40] },
        step() {
          tilt = 1; tip(1, true); audio.level('pour-water', 0.4, 0.3);
          later(() => audio.level('pour-water', 0, 1.5), 1600);
          drained(false);
          return true;
        },
        drag({ dx }) {
          tilt = tipStep(tilt, dx);
          tip(tilt, false);
          audio.level('pour-water', tilt * 0.4, 0.08);
          if (tilt >= 1) { audio.level('pour-water', 0, 1.2); drained(false); return true; }
        },
        release() {
          if (tilt >= 1) return; // tipped already
          tilt = 0; tip(0, true); audio.level('pour-water', 0, 0.3); // it springs back: nothing is lost
        },
      });
      spot.done.then(resolve);
    });

    // ---- the flow ----
    if (at === STATES.start) {
      await until(tipBeat());
      if (signal.aborted) return;
      await until(boilBeat());
      if (signal.aborted) return;
    }
    if (at <= STATES.boiling) {
      await until(Promise.all([saltBeat(), oilBeat()]));
      if (signal.aborted) return;
      await until(riceBeat());
      if (signal.aborted) return;
    }
    await until(cookTo(TESTS[0]));
    if (signal.aborted) return;
    await until(testBeat(0));
    if (signal.aborted) return;
    await until(cookTo(TESTS[1]));
    if (signal.aborted) return;
    await until(testBeat(1));
    if (signal.aborted) return;
    await until(drainBeat());
    if (signal.aborted) return;
    voice.say('rice.drain');
    clearInterval(clockTimer); // the clock is done: nothing else to run
    goal = null;
    await ctx.wait(2400);
  },
};
