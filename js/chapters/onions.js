// Chapter II, The Onions (birista). Close shot: a board with two whole onions and a knife, a wide iron pan on a burner,
// a steel plate lined with paper, the oil bottle, a small bowl, a clock on the wall. Beats: (1) slice: drag the knife
// across each onion (a stroke per pass of about 90 units; a tap is a stroke too, and a tap counts for more, so taps are
// fewer); (2) oil: tap the bottle, the oil pours, a shimmer when hot; (3) fry: drag the board over the pan (or tap) to tip
// the slices in; stir in circles (or tap, or hold to keep frying) while the clock runs the heat from medium to low to off;
// once golden, lift them out onto the plate (drag or tap; not before golden); (4) keep two spoonfuls in the bowl (tap).
//
// ?state= (dev, for screenshots; sets the chapter up at that point and plays on from there; done holds):
//   start    two whole onions on the board, the pan empty (also the default)
//   sliced   both onions cut, the slices in a pile on the board
//   frying   the oil in, the slices in the pan at medium, stirring
//   golden   golden, the heat low, the scoop ready
//   done     drained onto the plate, two spoonfuls in the bowl (holds here)
// Hotspots: #o-onA #o-onB (drag the knife, or tap), #o-bottleG (tap), #o-boardG hit (drag to the pan, or tap), #o-stir
// (circle, tap, or hold), #o-scoop (drag to the plate, or tap; appears at golden), #o-bowlG (tap).
import '../sound/onions.js';
import { PAN, PILE, PLATE, BOWL, KNOB, CLOCK, KNIFE_REST, ONIONS, BOTTLE, pose } from '../art/onions.js';
import { f, mix } from '../art/lib.js';

export const STROKES = 6; // cut weight that takes an onion apart (a drag stroke is 1, a tap is 1.5)
export const CUT = 90; // world units of knife travel that make one drag stroke
export const TAP_CUT = 1.5;
export const LOW = 0.45, OFF = 0.75, GOLDEN = 0.6, DARK = 0.92; // cook levels: the heat drops, goes off, golden, dark
export const STIR = 0.1; // cook from one turn of the spoon, or one tap
export const HOLD = 0.09; // cook per second of holding
const STOPS = [[0, '#F3EBD0'], [0.25, '#EED58E'], [0.5, '#DE9E3E'], [0.8, '#A8632A'], [1, '#7E4420']];
const STATE = { start: 0, sliced: 1, frying: 2, golden: 3, done: 4 };
const PHASE_TEXT = { medium: '7 min, medium', low: '4 min, low', off: '2 to 3 min, off' };
const PHASE_LINE = { low: 'onions.low', off: 'onions.off' };
const PHASE_KNOB = { medium: 35, low: -4, off: -58 }; // degrees of the burner knob
const FLAME = { medium: 1, low: 0.45, off: 0 }; // the flames under the pan
const BED = { medium: 0.3, low: 0.14, off: 0 }; // the sizzle bed before the stirring adds to it
const SVG_NS = 'http://www.w3.org/2000/svg';

const clamp01 = (v) => Math.min(1, Math.max(0, v));
// The colour of the onions at cook level c (0 raw and pale, 1 light brown): pale, translucent, golden, light brown.
export function toneAt(c) {
  const v = clamp01(c);
  for (let i = 1; i < STOPS.length; i++) {
    const [t1, c1] = STOPS[i];
    if (v <= t1) { const [t0, c0] = STOPS[i - 1]; return mix(c0, c1, (v - t0) / (t1 - t0)); }
  }
  return STOPS[STOPS.length - 1][1];
}
// Which heat setting the clock is in at cook level c.
export const phaseAt = (c) => (c < LOW ? 'medium' : c < OFF ? 'low' : 'off');
// Knife travel: how many whole strokes (run + dist) makes, and what travel is left over.
export function strokesFromDrag(run, dist) {
  let r = run + dist, n = 0;
  while (r >= CUT) { r -= CUT; n++; }
  return { run: r, n };
}
// One step of the stir around the pan: the angle of the pointer about the pan's centre (the pan is an ellipse, so the
// y axis is scaled), and the turns it has made. Going round once is one turn, in either direction.
export function stirStep(angle, turns, x, y) {
  const dx = x - PAN.cx, dy = (y - PAN.cy) * (PAN.rx / PAN.ry);
  if (Math.hypot(dx, dy) < 40) return { angle, turns }; // too near the middle to have an angle
  const a = Math.atan2(dy, dx);
  let d = a - angle;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return { angle: a, turns: turns + Math.abs(d) / (2 * Math.PI) };
}
export const inPan = (x, y) => ((x - PAN.cx) / PAN.rx) ** 2 + ((y - PAN.cy) / PAN.ry) ** 2 <= 0.7;
export const overPlate = (x, y) => ((x - PLATE.cx) / 85) ** 2 + ((y - PLATE.cy) / 48) ** 2 <= 1;

const rnd = (a, b) => a + Math.random() * (b - a);

export default {
  id: 'onions',
  art: () => import('../art/onions.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params, wait, ui } = ctx;
    const el = stage.el;
    const at = STATE[params.get('state')] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const $ = (sel) => stage.$(sel);
    const mk = (markup) => { const t = document.createElementNS(SVG_NS, 'svg'); t.innerHTML = markup; return t.firstElementChild; };
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    let raf = 0;
    signal.addEventListener('abort', () => {
      cancelAnimationFrame(raf);
      for (const t of timers) clearTimeout(t);
      audio.level('sizzle', 0, 0.2); audio.stop('flame', 0.5);
    }, { once: true });
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    const frame = (want, span, x, y) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y);
    audio.stop('rain', 2); audio.stop('drone', 2); audio.muffle(0, 1);
    el.dataset.light = 'normal';
    ui.ingredients?.('onions');

    const knife = $('#o-knife'), board = $('#o-boardG'), pile = $('#o-pile'), bottle = $('#o-bottleG'), stream = $('#o-stream');
    const oil = $('#o-oil'), shim = $('#o-shim'), mass = $('#o-panOn'), knob = $('#o-knob'), fire = $('#o-fire');
    const hand = $('#o-hand'), clockT = $('#o-clockT'), bowlOn = $('#o-bowlOn'), sparks = $('#o-sparks'), flying = $('#o-flying');
    const ON = { A: { cut: 0, run: 0, done: false, el: $('#o-onA') }, B: { cut: 0, run: 0, done: false, el: $('#o-onB') } };

    // ---- drawing helpers: every slice is a <use> of #o-cr, placed with a CSS transform in user units ----
    const crescent = (parent, x, y, rot) => {
      const u = mk(`<use href="#o-cr" style="fill:var(--oc);transform:translate(${f(x)}px, ${f(y)}px) rotate(${f(rot)}deg)"/>`);
      parent.append(u);
      return u;
    };
    // Slices fall from one point to a spot in the parent (the pile, or the bowl). temp ones fade out where they land.
    const dropTo = (parent, from, to, n, temp = false) => {
      for (let i = 0; i < n; i++) {
        const sx = from.x + rnd(-30, 30), sy = from.y + rnd(-14, 14), r0 = rnd(0, 360);
        const ex = to.x + rnd(-44, 44), ey = to.y + rnd(-14, 14), r1 = rnd(0, 360);
        const u = crescent(parent, ex, ey, r1);
        const anim = u.animate([
          { transform: `translate(${f(sx)}px, ${f(sy)}px) rotate(${f(r0)}deg)` },
          { transform: `translate(${f(ex)}px, ${f(ey)}px) rotate(${f(r1)}deg)` },
        ], { duration: rnd(560, 700), easing: 'cubic-bezier(.5,0,.9,.5)' });
        if (temp) anim.finished.then(() => u.remove(), () => {});
      }
    };
    const pop = (x, y, n, rx = 110, ry = 40) => { // sparks: a splash, squashed for the three-quarter view
      for (let i = 0; i < n; i++) {
        const a = (i / n) * 2 * Math.PI + rnd(0, 0.4), d = rnd(0.6, 1);
        const dx = Math.cos(a) * rx * d, dy = Math.sin(a) * ry * d;
        const c = mk(`<circle r="${f(rnd(2.5, 5))}" fill="#FFF0C0" fill-opacity=".9" stroke="#B8641E" stroke-width="1"/>`);
        sparks.append(c);
        const anim = c.animate([
          { transform: `translate(${f(x)}px, ${f(y)}px) scale(.3)`, opacity: 1 },
          { transform: `translate(${f(x + dx)}px, ${f(y + dy)}px) scale(1)`, opacity: 0 },
        ], { duration: rnd(600, 900), easing: 'ease-out' });
        anim.finished.then(() => c.remove(), () => {});
      }
    };
    const knifeTo = (x, y, rot = -18, ms = 150) => { knife.style.transition = `transform ${ms}ms ease-out`; knife.style.transform = pose(x, y, rot, KNIFE_REST.s); };
    const knifeRest = () => knifeTo(KNIFE_REST.x, KNIFE_REST.y, KNIFE_REST.rot, 350);

    // ---- slicing: one cut (a stroke, or a tap) adds its weight, drops slices, and flashes a line across the onion ----
    const cut = (key, x, y, weight, tap) => {
      const o = ON[key];
      o.cut += weight;
      audio.hit('onion-chop');
      const flash = mk(`<line x1="-72" y1="${f(rnd(-16, 16))}" x2="72" y2="${f(rnd(-16, 16))}" stroke="#FFF6E0" stroke-width="3" stroke-linecap="round"/>`);
      o.el.append(flash);
      flash.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 380, delay: 60, fill: 'forwards' }).finished.then(() => flash.remove(), () => {});
      dropTo(pile, { x, y }, PILE, tap ? 4 : 3);
      if (tap) { knifeTo(x, y, -18, 140); later(knifeRest, 300); }
      if (o.cut >= STROKES) { o.done = true; o.el.style.transition = 'opacity .6s'; o.el.style.opacity = '0'; }
      return o.done;
    };
    const sliceBeat = (key) => new Promise((resolve) => {
      const o = ON[key], c = ONIONS[key];
      const h = hotspot(o.el.querySelector('.hit'), {
        label: 'slice the onion',
        gesture: { drag: [130, 36] },
        step() { return cut(key, c.x, c.y, TAP_CUT, true); },
        drag({ x, y, dx, dy }) {
          knifeTo(x, y, -18, 0);
          const s = strokesFromDrag(o.run, Math.hypot(dx, dy));
          o.run = s.run;
          for (let i = 0; i < s.n; i++) cut(key, x, y, 1, false);
          return o.done;
        },
        release() { if (!o.done) knifeRest(); },
      });
      h.done.then(resolve);
    });

    // ---- oil: the bottle tips, a thin stream, the oil lies in the pan, and after a moment the shimmer ----
    const pour = () => {
      ui.tick?.('oil');
      audio.hit('onion-pour');
      bottle.style.transition = 'transform .5s ease-out';
      bottle.style.transform = pose(BOTTLE.x, BOTTLE.y, -42, BOTTLE.s);
      stream.style.transition = 'opacity .25s'; stream.style.opacity = '1';
      later(() => { stream.style.transition = 'opacity .6s'; stream.style.opacity = '0'; }, 1000);
      later(() => { bottle.style.transition = 'transform .6s ease-in'; bottle.style.transform = pose(BOTTLE.x, BOTTLE.y, 0, BOTTLE.s); }, 1100);
      later(() => { oil.style.opacity = '1'; startCooking(); }, 500);
      later(() => { shim.style.opacity = '1'; voice.say('onions.hot'); }, 1700);
      voice.say('onions.oil');
    };
    const oilBeat = () => new Promise((resolve) => {
      const h = hotspot(bottle.querySelector('.hit'), { label: 'pour in the oil', gesture: 'tap', step() { pour(); return true; } });
      h.done.then(resolve);
    });

    // ---- the mass in the pan: placed with pose(); its crescents take --oc, its colour from the cook level ----
    let massX = PAN.cx, massY = PAN.cy, massRot = 0, massS = 1;
    const spin = $('#o-spin');
    const placeMass = (ms = 0) => {
      const tr = ms ? `transform ${ms}ms ease-out` : 'none';
      mass.style.transition = tr; mass.style.transform = pose(massX, massY, 0, massS);
      spin.style.transition = tr; spin.style.transform = `rotate(${f(massRot)}deg)`;
    };
    let cooking = false, cook = 0, holding = false, boost = 0, lastPhase = '', darkSaid = false;
    const startCooking = () => { cooking = true; audio.bed('flame', 0.25); };
    const setPhase = (ph) => { // the knob, the flames, the clock label and the heat follow the cook level
      if (ph === lastPhase) return;
      const first = lastPhase === '';
      lastPhase = ph;
      knob.style.transition = 'transform .8s ease-in-out';
      knob.style.transform = pose(KNOB.x, KNOB.y, PHASE_KNOB[ph]);
      fire.style.opacity = String(FLAME[ph]);
      clockT.textContent = PHASE_TEXT[ph];
      if (ph === 'off') audio.stop('flame', 2);
      if (!first && PHASE_LINE[ph]) voice.say(PHASE_LINE[ph]);
    };
    const paint = () => {
      mass.style.setProperty('--oc', toneAt(cook));
      hand.setAttribute('transform', `rotate(${f(cook * 360)} ${CLOCK.x} ${CLOCK.y})`);
      setPhase(phaseAt(cook));
      if (cook >= DARK && !darkSaid) { darkSaid = true; voice.say('onions.dark'); }
    };
    // Sizzle follows the heat, the stir and the hold: the level eases every frame.
    let sizzleNow = -1, lastT = performance.now();
    const heatLoop = (t) => {
      raf = requestAnimationFrame(heatLoop);
      const dt = Math.min(0.1, (t - lastT) / 1000); lastT = t;
      boost *= Math.exp(-dt * 2.5);
      if (!cooking) return;
      const want = Math.min(1, BED[lastPhase] + boost + (holding ? 0.18 : 0));
      if (Math.abs(want - sizzleNow) > 0.01) { sizzleNow = want; audio.level('sizzle', want, 0.12); }
    };
    raf = requestAnimationFrame(heatLoop);

    // ---- the tip: the board goes over the pan, the slices slide in, a big sizzle ----
    const tipBeat = () => new Promise((resolve) => {
      let ox = 0, oy = 0, tipped = false;
      const tip = () => {
        tipped = true;
        pile.style.transition = 'opacity .5s'; pile.style.opacity = '0';
        mass.style.transition = 'opacity .9s'; mass.style.opacity = '1';
        later(() => { board.style.transition = 'transform .6s ease-out'; board.style.transform = 'translate(0px, 0px)'; }, 500);
        audio.hit('onion-tip');
        pop(PAN.cx, PAN.cy, 26);
        boost = Math.min(0.5, boost + 0.3);
        startCooking();
        voice.say('onions.tip');
        return true;
      };
      const h = hotspot(board.querySelector('.hit'), {
        label: 'tip the onions in',
        gesture: { drag: [PAN.cx - PILE.x, PAN.cy - PILE.y] },
        step: tip,
        drag({ dx, dy }) {
          ox += dx; oy += dy;
          board.style.transition = 'none';
          board.style.transform = `translate(${f(ox)}px, ${f(oy)}px)`;
          if (inPan(PILE.x + ox, PILE.y + oy)) return tip();
        },
        release() {
          if (!tipped) { ox = oy = 0; board.style.transition = 'transform .35s ease-out'; board.style.transform = 'translate(0px, 0px)'; }
        },
      });
      h.done.then(resolve);
    });

    // ---- the fry: stir (circle, tap or hold) until golden; the scoop appears at golden; lift them out onto the plate ----
    const cookBeat = () => new Promise((resolve) => {
      let turns = 0, angle = 0, drained = false, scoop = null, stirH = null, lastSpark = 0;
      const addCook = (d) => { cook = clamp01(cook + d); paint(); if (!scoop && cook >= GOLDEN) makeScoop(); };
      const drain = () => {
        if (cook < GOLDEN) { voice.say('onions.notYet'); return false; }
        drained = true;
        cooking = false; audio.level('sizzle', 0, 0.4); audio.stop('flame', 1);
        massX = PLATE.cx; massY = PLATE.cy; massRot = 0; massS = 0.5;
        placeMass(800);
        mass.style.setProperty('--oc', toneAt(Math.min(1, cook + 0.1))); // it darkens one shade on the steel
        audio.hit('onion-scoop');
        voice.say('onions.drain');
        voice.say('onions.crisp');
        return true;
      };
      const makeScoop = () => {
        if (scoop) return;
        voice.say('onions.golden');
        voice.say('onions.why');
        frame(1.3, 330, 880, 520); // the pan's right side and the plate, so the drag lands in view
        scoop = hotspot($('#o-scoop'), {
          label: 'lift them out onto the plate',
          tool: 'turner',
          gesture: { drag: [PLATE.cx - PAN.cx, PLATE.cy - PAN.cy] },
          step: drain,
          drag({ dx, dy }) {
            massX += dx; massY += dy; placeMass(0);
            if (overPlate(massX, massY)) return drain();
          },
          release() { if (!drained) { massX = PAN.cx; massY = PAN.cy; placeMass(350); } },
        });
        scoop.done.then(() => { stirH.dispose(); resolve(); });
      };
      stirH = hotspot($('#o-stir'), {
        label: 'stir the onions',
        tool: 'turner',
        gesture: 'circle',
        step() {
          addCook(STIR); massRot += 45; placeMass(260);
          boost = Math.min(0.5, boost + 0.2);
          pop(PAN.cx + rnd(-200, 200), PAN.cy + rnd(-60, 60), 2, 30, 14);
          return false;
        },
        drag({ x, y, speed }) {
          const s = stirStep(angle, turns, x, y);
          if (s.turns === turns) return;
          addCook((s.turns - turns) * STIR);
          turns = s.turns; angle = s.angle;
          massRot = angle * 180 / Math.PI; placeMass(0);
          boost = Math.min(0.5, boost + speed / 1500);
          const now = performance.now();
          if (now - lastSpark > 160) { lastSpark = now; pop(x, y, 1, 26, 12); }
          return false;
        },
        hold(dt) { holding = true; addCook(dt * HOLD); return false; },
        release() { holding = false; },
      });
      if (cook >= GOLDEN) makeScoop();
    });

    // ---- drained: two spoonfuls go into the bowl (a tap). ----
    const keep = () => {
      audio.hit('onion-spoon');
      ui.tick?.('onion');
      flying.style.setProperty('--oc', toneAt(Math.min(1, cook + 0.1)));
      dropTo(flying, { x: PLATE.cx, y: PLATE.cy - 6 }, BOWL, 8, true);
      later(() => { bowlOn.style.opacity = '1'; }, 700);
      voice.say('onions.keep');
    };
    const bowlBeat = () => new Promise((resolve) => {
      const h = hotspot($('#o-bowlG .hit'), { label: 'set two spoonfuls aside', gesture: 'tap', step() { keep(); return true; } });
      h.done.then(resolve);
    });

    // ---- the start state (dev: ?state=) ----
    if (at === 0) voice.say('onions.start');
    if (at >= 1) {
      for (const key of ['A', 'B']) { ON[key].cut = STROKES; ON[key].done = true; ON[key].el.style.opacity = '0'; }
      const r = (() => { let s = 5; return () => { s = (s * 16807) % 2147483647; return s / 2147483647; }; })();
      for (let i = 0; i < 36; i++) crescent(pile, PILE.x + (r() * 2 - 1) * 70, PILE.y + (r() * 2 - 1) * 26, r() * 360);
    }
    if (at >= 2) {
      oil.style.transition = 'none'; oil.style.opacity = '1';
      shim.style.transition = 'none'; shim.style.opacity = '1';
      pile.style.opacity = '0';
      mass.style.transition = 'none'; mass.style.opacity = '1';
      cook = at === 2 ? 0.3 : at === 3 ? 0.65 : 0.82;
      cooking = at < 4;
      if (cooking) audio.bed('flame', 0.25);
    }
    placeMass(0);
    paint(); // sets the knob, the flames and the clock to the cook level before anything else reads them
    if (at >= 4) {
      massX = PLATE.cx; massY = PLATE.cy; massS = 0.5; placeMass(0);
      mass.style.setProperty('--oc', toneAt(0.9));
      bowlOn.style.transition = 'none'; bowlOn.style.opacity = '1';
      frame(1.2, 480, 900, 430); // the bowl, the plate and the clock; a phone shows the whole picture (no zoom)
      await gone; // dev: the finished picture holds
      return;
    }

    // ---- the flow ----
    if (at < 1) {
      frame(1.1, 480, 700, 640); // the board, the pan and the clock label stay in view
      for (const key of ['A', 'B']) {
        if (key === 'B') voice.say('onions.second');
        await Promise.race([sliceBeat(key), gone]);
        if (signal.aborted) return;
      }
      voice.say('onions.even');
    }
    if (at < 2) {
      frame(1.4, 300, 900, 470); // the bottle and the pan's right side
      await Promise.race([oilBeat(), gone]);
      if (signal.aborted) return;
      await Promise.race([wait(1800), gone]);
      if (signal.aborted) return;
      frame(1.3, 340, 750, 520); // the board and the pan, the drag between them
      await Promise.race([tipBeat(), gone]);
      if (signal.aborted) return;
    }
    frame(1.3, 420, 800, 400);
    if (at < 2) voice.say('onions.medium');
    voice.say('onions.stir');
    await Promise.race([cookBeat(), gone]);
    if (signal.aborted) return;
    frame(1.2, 480, 900, 430); // the bowl, the plate and the clock; a phone shows the whole picture (no zoom)
    await Promise.race([bowlBeat(), gone]);
    if (signal.aborted) return;
    await Promise.race([voice.say('onions.done'), gone]);
  },
};
