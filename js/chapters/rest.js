// Chapter IV, The Rest. Evening going to night. Close shot of the counter: the covered marinade bowl, a small fridge at
// the left, a wall clock above the counter, and the steel bowl of dry rice by a tap and a sink.
// Beats: (1) drag the covered bowl into the fridge (or tap): the door swings, shuts with a thunk, and the hum starts;
// (2) the clock, from here to the end: drag its hands round (circle) or tap, a quarter turn is 30 minutes (the clock is
// stylised, its hands are not to real scale). Until the rice is soaking it stops at 24 minutes, with the nudge "While it
// waits, the rice."; (3) rinse the rice three times, each rinse: bring the bowl under the tap (drag, or tap), swirl it
// (circle, or tap: two turns), pour the water off over the sink (drag, or tap). The water goes from milky to nearly clear,
// and the paper tag counts the rinses; (4) soak: a tap pours fresh water over the rice and ticks it on the ingredient
// card; (5) the clock: at half an hour the chapter ends. Keep turning past an hour with a drag still held, and the sun
// and the moon pass once over the window: overnight.
//
// ?state= (dev, for screenshots; sets the chapter up at that point and plays on from there, except done and night,
// which hold):
//   start    the covered bowl on the counter, the fridge shut (default)
//   fridge   the covered bowl in the fridge, the hum on, the clock waiting
//   rinsing  the first rinse done, the bowl at the sink's edge, the second rinse waiting
//   soaking  three rinses done, the rice soaking in fresh water, the clock uncapped
//   done     half an hour passed (holds)
//   night    overnight: the sun and the moon have passed (holds)
// Hotspots: #r-cov (drag to the fridge, or tap), #r-clock (circle, or tap), #r-rice (drag under the tap, circle, drag over
// the sink; tap for the soak). The clock is a hotspot from the fridge on; the rice's steps come one at a time.
import '../sound/rest.js';
import { COV, RICE, TAP_AT, POUR_AT, FRIDGE_DOOR, CLOCK } from '../art/rest.js';

export const RINSES = 3;
export const SWIRLS = 2; // turns of the bowl that make one rinse (a tap is one turn)
export const MILK = [0.9, 0.5, 0.1]; // how cloudy the water is at the top of each rinse: milky, less, nearly clear
export const PRE_SOAK_MAX = 24; // minutes: the clock waits here until the rice is soaking
export const HALF_HOUR = 30;
export const KEEP_TURNING = 60; // a drag still held past this minute is the overnight
export const OVERNIGHT = 600; // ten hours: the sun and the moon pass once
export const MIN_PER_DEG = 1 / 3; // a quarter turn (90 degrees) is 30 minutes

const clamp01 = (v) => Math.min(1, Math.max(0, v));
// Progress 0..1 along a path (a drag vector) after a pointer move of (dx, dy): the projection onto the path.
export const along = (p, dx, dy, path) => clamp01(p + (dx * path[0] + dy * path[1]) / (path[0] ** 2 + path[1] ** 2));
// Cloudiness of the water (0 clear, 1 white): a fill comes in cloudy (half the rinse's peak), and the swirl takes it up to the peak.
export const milkAt = (rinse, progress) => MILK[rinse - 1] / 2 + (MILK[rinse - 1] / 2) * clamp01(progress);
// The clock's minutes after turning it by deg degrees. Before the rice is soaking it cannot pass PRE_SOAK_MAX.
export const turnClock = (minutes, deg, soaked) => {
  const next = Math.max(0, minutes + deg * MIN_PER_DEG);
  return soaked ? next : Math.min(next, PRE_SOAK_MAX);
};
// One tap: on to the next half hour (30 is a quarter turn of the hands), with the same pre-soak cap.
export const stepClock = (minutes, soaked) => {
  const next = Math.floor(minutes / HALF_HOUR) * HALF_HOUR + HALF_HOUR;
  return soaked ? next : Math.min(next, PRE_SOAK_MAX);
};
// Degrees of the two hands for a time in minutes: the minute hand turns 3 degrees a minute (a quarter in 30 minutes).
export const handsAt = (minutes) => ({ min: minutes * 3, hour: minutes * 0.25 });
// The window goes darker as the time passes: a little at dusk, most of the way by the night.
export const nightVeil = (minutes) => 0.12 + 0.5 * Math.min(1, minutes / 120);
// The paper tag: how many rinses are done.
export const tagText = (done) => (done < RINSES ? `rinse ${done + 1} of ${RINSES}` : `rinsed ${RINSES} of ${RINSES}`);

const STATE = { start: 0, fridge: 1, rinsing: 2, soaking: 3, done: 4, night: 5 };
const FRIDGE_PATH = [FRIDGE_DOOR.x - COV.cx, FRIDGE_DOOR.y - COV.cy];
const TAP = { x: TAP_AT.x, y: TAP_AT.y };
const POUR = { x: POUR_AT.x, y: POUR_AT.y };
const wrap = (d) => {
  let v = d;
  while (v > Math.PI) v -= 2 * Math.PI;
  while (v < -Math.PI) v += 2 * Math.PI;
  return v;
};

export default {
  id: 'rest',
  art: () => import('../art/rest.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params, ui, wait } = ctx;
    audio.muffle(0); audio.stop('flame'); audio.stop('drone'); audio.stop('simmer', 1); audio.bed('rain', 0.22);
    const at = STATE[params.get('state')] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    signal.addEventListener('abort', () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      for (const bed of ['fridge-hum', 'tap-water', 'rice-swish', 'rest-trickle']) audio.stop(bed, 0.4);
    }, { once: true });

    const $ = (sel) => stage.$(sel);
    const cov = $('#r-cov'), fdoor = $('#r-fdoor'), finside = $('#r-finside'), fled = $('#r-fled');
    const clockEl = $('#r-clock'), clkH = $('#r-clk-h'), clkM = $('#r-clk-m'), veil = $('#r-veil');
    const sun = $('#r-sun'), moon = $('#r-moon');
    const rice = $('#r-rice'), water = $('#r-water'), milk = $('#r-milk'), ring = $('#r-ring'), rip = $('#r-rip');
    const stream = $('#r-stream'), pour = $('#r-pour'), tagT = $('#r-tag-t');
    cov.style.transformOrigin = `${COV.cx}px ${COV.cy}px`;
    rice.style.transformOrigin = `${RICE.cx}px ${RICE.cy}px`;

    // The camera pushes in on what is touchable; a phone is too narrow to push far (as in the other chapters).
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    const frame = (want, span, x, y, ms = 1400) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y, ms);

    // ---- state: the clock's minutes, whether the rice is soaking, the rinses done, the bowl's place ----
    let minutes = 0, soaked = false, rinsesDone = 0;
    let riceAt = { x: RICE.cx, y: RICE.cy, tilt: 0 };
    let outcome = null; // 'half' | 'night', set when the clock beat ends
    let nudged = false;
    let inFridge = at >= STATE.fridge;

    const hands = (ms = 0) => {
      const h = handsAt(minutes);
      for (const [e, deg] of [[clkM, h.min], [clkH, h.hour]]) {
        e.style.transition = ms ? `transform ${ms}ms ease-out` : 'none';
        e.style.transform = `rotate(${deg.toFixed(2)}deg)`;
      }
      veil.style.opacity = nightVeil(minutes).toFixed(3);
    };
    const tag = () => { tagT.textContent = tagText(rinsesDone); };
    const moveRice = (x, y, tilt = 0, ms = 0) => {
      riceAt = { x, y, tilt };
      rice.style.transition = ms ? `transform ${ms}ms cubic-bezier(.3,.8,.3,1)` : 'none';
      rice.style.transform = `translate(${(x - RICE.cx).toFixed(1)}px, ${(y - RICE.cy).toFixed(1)}px) rotate(${tilt.toFixed(1)}deg)`;
    };
    const moveCov = (dx, dy, scale = 1, ms = 0) => {
      cov.style.transition = ms ? `transform ${ms}ms ease-in-out` : 'none';
      cov.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px) scale(${scale.toFixed(3)})`;
    };
    const door = (open, ms = 450) => {
      fdoor.style.transition = `transform ${ms}ms ease-in-out`;
      fdoor.style.transform = open ? 'scaleX(0.18)' : '';
      finside.style.transition = 'opacity .3s';
      finside.style.opacity = open ? '1' : '0';
    };
    const flow = (el, on, ms = 250) => { el.style.transition = `opacity ${ms}ms ease`; el.style.opacity = on ? '1' : '0'; };
    const setMilk = (v, ms = 500) => { milk.style.transition = `opacity ${ms}ms ease`; milk.style.opacity = v.toFixed(3); };
    const flash = (el) => {
      el.style.transformBox = 'fill-box';
      el.style.transformOrigin = '50% 50%';
      el.animate([{ opacity: 0.9, transform: 'scale(0.4)' }, { opacity: 0, transform: 'scale(2.4)' }], { duration: 900, easing: 'ease-out' });
    };

    // ---- the fridge: the covered bowl goes in, the door swings and shuts, the hum starts ----
    const intoFridge = () => {
      if (inFridge) return;
      inFridge = true;
      audio.hit('fridge-open');
      door(true);
      moveCov(FRIDGE_PATH[0], FRIDGE_PATH[1], 0.3, 600);
      later(() => { cov.style.transition = 'opacity .25s'; cov.style.opacity = '0'; }, 800);
      later(() => { door(false, 500); audio.hit('fridge-door'); fled.style.opacity = '1'; }, 1100);
      later(() => audio.bed('fridge-hum', 0.4, 2), 1400);
    };
    const fridgeBeat = () => new Promise((resolve) => {
      frame(1.3, 480, COV.cx, 520); // the covered bowl; a phone shows it whole at this width, the fridge only on a desktop
      voice.say('rest.fridge');
      voice.say('rest.whyFridge');
      let p = 0;
      const spot = hotspot(cov, {
        label: 'put it in the fridge',
        gesture: { drag: FRIDGE_PATH },
        step() { intoFridge(); return true; },
        drag({ dx, dy }) {
          p = along(p, dx, dy, FRIDGE_PATH);
          moveCov(FRIDGE_PATH[0] * p, FRIDGE_PATH[1] * p, 1 - 0.2 * p);
          if (p >= 0.95) { intoFridge(); return true; }
        },
        release() { if (p > 0 && p < 0.95) { p *= 0.85; moveCov(FRIDGE_PATH[0] * p, FRIDGE_PATH[1] * p, 1 - 0.2 * p, 320); } },
      });
      spot.done.then(() => later(resolve, 1500));
    });

    // ---- the clock: the hands, a quarter turn is 30 minutes; it ends at half an hour, or overnight ----
    const clockBeat = () => new Promise((resolve) => {
      let angle = null;
      const nudge = () => { if (!soaked && !nudged) { nudged = true; voice.say('rest.nudge'); } };
      const spot = hotspot(clockEl, {
        label: 'turn the clock',
        gesture: 'circle',
        step() {
          const next = stepClock(minutes, soaked);
          if (next === minutes) nudge();
          minutes = next;
          hands(260);
          audio.hit('clock-tick');
          if (minutes >= HALF_HOUR) { outcome = 'half'; return true; }
          return false;
        },
        drag({ x, y }) {
          const a = Math.atan2(y - CLOCK.cy, x - CLOCK.cx);
          if (angle === null) { angle = a; return; }
          const d = wrap(a - angle);
          angle = a;
          const before = minutes;
          minutes = turnClock(minutes, (d * 180) / Math.PI, soaked);
          if (!soaked && d > 0 && minutes >= PRE_SOAK_MAX) nudge();
          if (Math.floor(before / HALF_HOUR) !== Math.floor(minutes / HALF_HOUR)) audio.hit('clock-tick');
          hands(0);
          if (minutes >= KEEP_TURNING) { outcome = 'night'; return true; }
          return false;
        },
        release() {
          angle = null;
          if (outcome) return;
          if (minutes >= HALF_HOUR) outcome = 'half';
          if (outcome) spot.finish();
        },
      });
      spot.done.then(() => resolve(outcome));
    });

    // ---- the rinse: fill under the tap, swirl, pour off over the sink ----
    const fillNow = (milk) => {
      water.style.opacity = '1';
      setMilk(milk, 200);
      flow(stream, true, 150);
      audio.level('tap-water', 0.5, 0.2);
      later(() => { flow(stream, false, 300); audio.level('tap-water', 0, 0.6); }, 1400);
      later(() => { audio.hit('rest-splash'); flash(rip); }, 650);
    };
    const fillBeat = () => new Promise((resolve) => {
      const from = { x: riceAt.x, y: riceAt.y };
      const path = [TAP.x - from.x, TAP.y - from.y];
      let p = 0;
      const go = () => { moveRice(TAP.x, TAP.y, 0, 650); later(() => fillNow(milkAt(rinsesDone + 1, 0)), 650); };
      const spot = hotspot(rice, {
        label: 'bring the rice under the tap',
        gesture: { drag: path },
        step() { go(); return true; },
        drag({ dx, dy }) {
          p = along(p, dx, dy, path);
          moveRice(from.x + path[0] * p, from.y + path[1] * p);
          if (p >= 0.95) { go(); return true; }
        },
        release() { if (p > 0 && p < 0.95) { p *= 0.85; moveRice(from.x + path[0] * p, from.y + path[1] * p, 0, 300); } },
      });
      spot.done.then(() => later(resolve, 900));
    });
    const swirlBeat = () => new Promise((resolve) => {
      let turns = 0, angle = null, lastTurn = 0;
      const n = rinsesDone + 1;
      const swish = (v, ms) => audio.level('rice-swish', v, ms);
      const pulse = () => flash(ring);
      const spot = hotspot(rice, {
        label: 'swirl the rice',
        gesture: 'circle',
        step() {
          turns = Math.min(SWIRLS, turns + 1);
          setMilk(milkAt(n, turns / SWIRLS), 600);
          pulse();
          swish(0.5, 0.05);
          later(() => swish(0, 0.3), 380);
          return turns >= SWIRLS;
        },
        drag({ x, y, speed }) {
          const a = Math.atan2((y - TAP.y) / 0.45, x - TAP.x); // the bowl is seen from above at a slant, as the water is
          if (angle === null) { angle = a; return; }
          const d = wrap(a - angle);
          angle = a;
          turns = Math.min(SWIRLS, turns + Math.abs(d) / (2 * Math.PI));
          setMilk(milkAt(n, turns / SWIRLS), 150);
          if (Math.floor(turns) > lastTurn) { lastTurn = Math.floor(turns); pulse(); }
          swish(Math.min(0.7, 0.1 + speed / 900), 0.06);
          return turns >= SWIRLS;
        },
        release() { angle = null; swish(0, 0.25); },
      });
      spot.done.then(() => { swish(0, 0.3); later(resolve, 500); });
    });
    const pourBeat = () => new Promise((resolve) => {
      const path = [POUR.x - TAP.x, POUR.y - TAP.y];
      const TILT = -50;
      const at = (v, ms) => {
        moveRice(TAP.x + path[0] * v, TAP.y + path[1] * v, TILT * v, ms);
        water.style.transition = 'opacity .2s';
        water.style.opacity = String(1 - clamp01((v - 0.3) / 0.5));
        flow(pour, v > 0.55, 150);
        audio.level('rest-trickle', v > 0.55 ? 0.35 : 0, 0.2);
      };
      const finish = () => {
        audio.hit('rest-gurgle');
        rinsesDone++;
        tag();
        at(1, 500); // the water is out by now (at 1 the water group is at 0)
        setMilk(0, 400);
        later(() => { flow(pour, false, 300); audio.level('rest-trickle', 0, 0.3); }, 700);
        later(() => moveRice(POUR.x, POUR.y, 0, 600), 1100);
      };
      let p = 0;
      const spot = hotspot(rice, {
        label: 'pour the water off',
        gesture: { drag: path },
        step() { finish(); return true; },
        drag({ dx, dy }) {
          p = along(p, dx, dy, path);
          at(p, 0);
          if (p >= 0.97) { finish(); return true; }
        },
        release() { if (p > 0 && p < 0.97) { p *= 0.85; at(p, 300); } },
      });
      spot.done.then(() => later(resolve, 1300));
    });
    const rinse = async (n) => {
      frame(1.1, 560, 930, 400); // the rice bowl and the sink, inside the phone's column; high enough that the clock stays in view
      voice.say(`rest.rinse${n}`);
      if (n === 1) voice.say('rest.whyRinse');
      await fillBeat();
      if (signal.aborted) return;
      voice.say('rest.swirl');
      await swirlBeat();
      if (signal.aborted) return;
      voice.say('rest.pour');
      await pourBeat();
    };

    // ---- the soak: fresh water over the rice; the rice goes on the ingredient card, and is ticked ----
    const soakBeat = () => new Promise((resolve) => {
      ui.ingredients('rice');
      voice.say('rest.soak');
      const spot = hotspot(rice, {
        label: 'pour fresh water over the rice',
        gesture: 'tap',
        step() {
          moveRice(TAP.x, TAP.y, 0, 650);
          later(() => fillNow(0.03), 650); // fresh water for the soak: clear
          ui.tick?.('rice');
          soaked = true;
          voice.say('rest.whySoak');
          voice.say('rest.clockNow');
          return true;
        },
      });
      spot.done.then(() => later(resolve, 900));
    });

    // ---- the ends: half an hour, or overnight (the sun and the moon pass once over the window) ----
    const halfEnd = async () => {
      voice.say('rest.half');
      await wait(1600);
    };
    const overnight = async () => {
      voice.say('rest.overnight');
      audio.level('rain', 0.12, 3);
      audio.hit('chime');
      minutes = OVERNIGHT;
      hands(3000);
      veil.style.transition = 'opacity 3s ease';
      veil.style.opacity = nightVeil(minutes).toFixed(3);
      sun.animate([{ transform: 'translate(-90px, -30px)', opacity: 1 }, { transform: 'translate(110px, 150px)', opacity: 0 }],
        { duration: 3000, easing: 'ease-in-out', fill: 'forwards' });
      moon.animate([{ transform: 'translate(110px, 170px)', opacity: 0 }, { transform: 'translate(-80px, -40px)', opacity: 1 }],
        { duration: 3000, easing: 'ease-in-out', fill: 'forwards' });
      await wait(3200);
      if (signal.aborted) return;
      voice.say('rest.morning');
      await wait(1800);
    };

    // ---- the start state: what the viewer already sees at this point ----
    if (at >= STATE.fridge) {
      cov.style.transition = 'none';
      cov.style.opacity = '0';
      moveCov(FRIDGE_PATH[0], FRIDGE_PATH[1], 0.3);
      fled.style.opacity = '1';
      audio.bed('fridge-hum', 0.4, 0);
    }
    if (at >= STATE.rinsing) { rinsesDone = 1; moveRice(POUR.x, POUR.y); }
    if (at >= STATE.soaking) {
      rinsesDone = RINSES;
      soaked = true;
      moveRice(TAP.x, TAP.y);
      water.style.transition = 'none';
      water.style.opacity = '1';
      setMilk(0.03, 0);
      ui.ingredients('rice');
      ui.tick?.('rice');
    }
    if (at === STATE.done) minutes = HALF_HOUR;
    if (at === STATE.night) minutes = OVERNIGHT;
    hands(0);
    tag();
    if (at === STATE.night) { moon.style.opacity = '1'; moon.style.transform = 'translate(-80px, -40px)'; }

    // ---- the flow ----
    if (at >= STATE.done) { await gone; return; }
    if (at === STATE.start) {
      frame(1.3, 480, COV.cx, 520, 0);
      await Promise.race([fridgeBeat(), gone]);
      if (signal.aborted) return;
    }
    frame(1.4, 520, CLOCK.cx, 280);
    voice.say('rest.clock');
    const clockP = clockBeat();
    for (let n = rinsesDone + 1; n <= RINSES; n++) {
      await Promise.race([rinse(n), gone]);
      if (signal.aborted) return;
    }
    frame(1.5, 420, TAP.x, 540);
    if (at < STATE.soaking) {
      await Promise.race([soakBeat(), gone]);
      if (signal.aborted) return;
    }
    const end = await Promise.race([clockP, gone]);
    if (signal.aborted) return;
    if (end === 'night') await Promise.race([overnight(), gone]);
    else await Promise.race([halfEnd(), gone]);
  },
};
