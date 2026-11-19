// Chapter V, The Fry. Close: a heavy pot of hot oil on a gas burner, the stove's light from below. Beats: (1) drag the
// bowl of marinated chicken over the pot (or tap): the whole bowl, marinade and all, goes into the oil with a big sizzle;
// (2) hold on the pot: "4 to 5 min, medium", the edges colour (release calms it and keeps what was cooked; a tap is one
// fixed step); (3) drag the plate of fried onions over the pot, or tap it; (4) tap the tumbler: a quarter cup of hot
// water, a hiss and steam; (5) drag the lid over the pot (or tap); (6) hold on the pot: "10 to 15 min, covered", the
// gravy thickens and darkens, the chicken reaches about ninety-five percent and comes off the heat.
//
// ?state= (dev, for screenshots; sets the chapter up at that point and plays on from there; done holds):
//   start    the bowl full, the oil hot, nothing in (also the default)
//   in       the chicken tipped in, raw
//   seared   edges coloured, the onions waiting
//   onions   the onions in, the tumbler waiting
//   water    the water in, the lid waiting
//   lid      the lid on the pot, the long cook waiting
//   done     the long cook finished, the gravy thick (holds here)
// Hotspots: #f-bowl (drag [80, -170], or tap), #f-potHit (hold, or tap for a step), #f-plate (drag over the pot, or tap),
// #f-water (tap), #f-lidRest (drag over the pot, or tap). The chicken layers are crossfaded with food.chicken's doneness.
import '../sound/fry.js';
import { OIL, PIECES, LAND, PLATE, ONION, ONION_TO, WATER, LID, POT } from '../art/fry.js';

const HOLD_SEC = 4; // a hold takes this many seconds to take the pieces through one phase
const TAP_COOK = 0.25; // one tap is this much cooking
const STATE = { start: 0, in: 1, seared: 2, onions: 3, water: 4, lid: 5, done: 6 };
const SVG_NS = 'http://www.w3.org/2000/svg';
const BOWL_PATH = [80, -170];
const LID_PATH = [POT.cx - LID.cx, POT.cy + 20 - LID.cy];

// The centre of a piece lies in the oil (inside the rim, a little in from the edge).
export const inOil = (x, y) => ((x - OIL.cx) / OIL.rx) ** 2 + ((y - OIL.cy) / OIL.ry) ** 2 <= 0.8;
// Cooking by a hold: dt seconds of holding, capped at the end of the phase.
export const cookStep = (g, dt) => Math.min(1, g + dt / HOLD_SEC);
// Opacity weights of the raw, half-fried and golden layers for a doneness 0..1 (they always sum to 1).
export const layerWeights = (g) => {
  const t = Math.min(1, Math.max(0, g));
  return [Math.max(0, 1 - 2 * t), 1 - Math.abs(2 * t - 1), Math.max(0, 2 * t - 1)];
};
// Doneness of the chicken for progress g (0..1) through a phase: the sear takes it from raw to about 0.6, the covered
// cook on to about 0.95 (the rest happens in the steam of the dum).
export const donenessAt = (phase, g) => (phase === 1 ? 0.6 * g : 0.6 + 0.35 * g);
// The clock on the scene: elapsed minutes as m:ss, and the phase's label.
export const clockText = (phase, g) => {
  const sec = Math.round(g * (phase === 1 ? 4.5 : 13) * 60);
  return { a: phase === 1 ? '4 to 5 min' : '10 to 15 min', b: `${phase === 1 ? 'medium heat' : 'covered, gentle flame'} · ${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}` };
};

export default {
  id: 'fry',
  art: () => import('../art/fry.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, ui, signal, params } = ctx;
    const el = stage.el;
    // The Fry is the tip-in and the sear; The Gravy (chapter VI, same pot, same art) is the hot water, the lid and the covered cook.
    const part = ctx.id === 'gravy' ? 'gravy' : 'fry';
    const dev = STATE[params.get('state')] ?? 0;
    const at = part === 'gravy' ? Math.max(STATE.onions, dev) : dev;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const $ = (sel) => stage.$(sel);
    const make = (markup) => { const t = document.createElementNS(SVG_NS, 'svg'); t.innerHTML = markup; return t.firstElementChild; };
    const run = (beat) => Promise.race([beat(), gone]);
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    let raf = 0;
    signal.addEventListener('abort', () => { cancelAnimationFrame(raf); for (const t of timers) clearTimeout(t); audio.level('sizzle', 0, 0.2); audio.stop('simmer', 0.5); }, { once: true });
    ui.ingredients(null); // nothing new goes in but what the earlier chapters made

    // The camera pushes in on what is touchable (the target stays in the top 70%); a phone is too narrow to push far.
    const frame = (want, span, x, y) => {
      const k = Math.max(innerWidth / 1600, innerHeight / 1000);
      stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k * span))), x, y);
    };

    // ---- sound and the hot oil: the sizzle bed follows the heat, the bubbles follow it too ----
    audio.stop('rain', 2);
    audio.muffle(0, 1);
    audio.bed('flame', 0.3);
    const bub = $('#f-bub'), bubAnims = [];
    for (let k = 0; k < 16; k++) {
      const x = OIL.cx + (Math.random() * 2 - 1) * OIL.rx * 0.85, y = OIL.cy + (Math.random() * 2 - 1) * OIL.ry * 0.8;
      const c = make(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${(2 + Math.random() * 2.5).toFixed(1)}" fill="#FFF0C0" fill-opacity=".8"/>`);
      bub.append(c);
      bubAnims.push(c.animate([{ transform: 'translate(0px, 0px) scale(.4)', opacity: 0 }, { transform: 'translate(0px, -6px) scale(1)', opacity: 0.9, offset: 0.4 },
        { transform: 'translate(0px, -16px) scale(1.2)', opacity: 0 }], { duration: 1100 + Math.random() * 700, iterations: Infinity, delay: -Math.random() * 1500 }));
    }
    const smoke = $('#f-smoke');
    let heat = 0.25, heatTo = 0.25, simmering = false, lastSz = -1, last = performance.now();
    const cool = () => { // called every frame: heat eases toward its target; the bed, bubbles and smoke follow it
      const now = performance.now();
      const dt = Math.min(0.1, (now - last) / 1000); last = now;
      heat += (heatTo - heat) * Math.min(1, dt * 3);
      if (!simmering) { const v = 0.05 + 0.45 * heat; if (Math.abs(v - lastSz) > 0.01) { lastSz = v; audio.level('sizzle', v, 0.1); } }
      for (const a of bubAnims) a.playbackRate = 0.5 + 3 * heat;
      smoke.style.opacity = Math.min(1, Math.max(0, (heat - 0.3) * 1.2)).toFixed(2);
      raf = requestAnimationFrame(cool);
    };
    raf = requestAnimationFrame(cool);

    // ---- the pieces: transforms only; the landed ones carry their doneness ----
    const landed = new Set();
    let done = 0, lands = 0; // done: doneness 0..1 of the chicken
    const move = (node, x, y, ms) => { node.style.transition = ms ? `transform ${ms}ms ease-out` : 'none'; node.style.transform = `translate(${x}px, ${y}px)`; };
    const setCook = (g) => {
      done = g;
      const w = layerWeights(g);
      for (const i of landed) [...$(`#f-pc${i}`).querySelectorAll('.f-l')].forEach((l, k) => { l.style.opacity = w[k].toFixed(3); });
    };
    // A splash: a ring of bright oil bubbles spreading from (x, y), squashed for the three-quarter view.
    const splash = (x, y, rad, n) => {
      const host = $('#f-pot');
      if (!host) return;
      const g = make(`<g transform="translate(${x} ${y})"></g>`);
      const anims = [];
      for (let k = 0; k < n; k++) {
        const a = (k / n) * 6.283 + Math.random() * 0.4, d = rad * (0.7 + Math.random() * 0.5);
        const c = make(`<circle r="${(3 + Math.random() * 4).toFixed(1)}" fill="#FFF0C0" fill-opacity=".9" stroke="#B8641E" stroke-width="1"/>`);
        g.append(c);
        anims.push(c.animate([{ transform: 'translate(0px, 0px) scale(.3)', opacity: 1 },
          { transform: `translate(${(Math.cos(a) * d).toFixed(1)}px, ${(Math.sin(a) * d * 0.45).toFixed(1)}px) scale(1)`, opacity: 0 }],
        { duration: 650 + Math.random() * 300, easing: 'ease-out' }));
      }
      host.append(g);
      Promise.all(anims.map((a) => a.finished)).then(() => g.remove(), () => {});
    };
    const placeAt = (i, ms) => {
      const p = PIECES[i], [x, y] = LAND[i];
      move($(`#f-pc${i}`), x - p.x, y - p.y, ms);
      landed.add(i);
      setCook(done);
    };
    const clock = (phase, g) => { const t = clockText(phase, g); $('#f-clockA').textContent = t.a; $('#f-clockB').textContent = t.b; $('#f-clock').style.opacity = '1'; };
    const fade = (sel, v) => { $(sel).style.opacity = String(v); };

    // ---- beat 1: tip the whole bowl, marinade and all, into the hot pot ----
    const tipIn = () => {
      const bowl = $('#f-bowl');
      bowl.style.transition = 'transform .55s ease-in-out';
      bowl.style.transform = `translate(${BOWL_PATH[0]}px, ${BOWL_PATH[1]}px) rotate(34deg)`;
      PIECES.forEach((_, i) => later(() => {
        placeAt(i, 420);
        splash(LAND[i][0], LAND[i][1], 110, 12);
        audio.hit('fry-sizzle');
        if (++lands === 1) { voice.say('fry.in'); fade('#f-marpool', 1); fade('#f-bowlMar', 0); }
        if (lands === PIECES.length) later(() => { voice.say('fry.kitchen'); bowl.style.transform = ''; }, 700);
      }, 450 + i * 160));
    };
    const tipBeat = () => new Promise((resolve) => {
      let p = 0, fired = false;
      const bowl = $('#f-bowl');
      const put = (v, ms) => { bowl.style.transition = ms ? `transform ${ms}ms ease-out` : 'none'; bowl.style.transform = `translate(${v * BOWL_PATH[0]}px, ${v * BOWL_PATH[1]}px) rotate(${v * 34}deg)`; };
      const fin = () => { fired = true; tipIn(); return true; };
      hotspot(bowl, {
        label: 'tip the chicken into the pot',
        gesture: { drag: BOWL_PATH },
        step: fin,
        drag({ dx, dy }) { p = Math.min(1, Math.max(0, p + (dx * BOWL_PATH[0] + dy * BOWL_PATH[1]) / (BOWL_PATH[0] ** 2 + BOWL_PATH[1] ** 2))); put(p, 0); if (p >= 0.85) return fin(); },
        release() { if (!fired && p > 0) { p *= 0.6; put(p, 250); } },
      }).done.then(() => later(resolve, 450 + PIECES.length * 160 + 900));
    });

    // ---- beats 2 and 6: held on the pot. The bed swells, bubbles quicken, smoke rises; released, it calms, nothing is lost ----
    const holdBeat = (phase, onProgress, label) => new Promise((resolve) => {
      let g = 0;
      clock(phase, g);
      const set = (v) => { g = v; setCook(donenessAt(phase, g)); onProgress?.(g); clock(phase, g); };
      hotspot($('#f-potHit'), {
        label,
        gesture: 'hold',
        step() { set(Math.min(1, g + TAP_COOK)); return g >= 1; },
        hold(dt) { if (phase === 1) heatTo = 1; set(cookStep(g, dt)); return g >= 1; },
        release() { if (phase === 1) heatTo = 0.25; },
      }).done.then(() => { heatTo = phase === 1 ? 0.25 : 0.1; resolve(); });
    });

    // ---- beat 3: the onions, dragged over the pot (or tapped) ----
    const onionBeat = () => new Promise((resolve) => {
      const plate = $('#f-plate'), onions = $('#f-onions');
      let ox = 0, oy = 0, tipped = false;
      frame(1.2, 480, 920, 520); // the plate and the pot both in view
      const tip = () => {
        tipped = true;
        move(plate, 0, 0, 600);
        move(onions, ONION_TO.x - ONION.x, ONION_TO.y - ONION.y, 900);
        splash(ONION_TO.x, ONION_TO.y, 90, 8);
        audio.hit('fry-crackle');
        voice.say('fry.onions');
      };
      hotspot(plate, {
        label: 'tip in the fried onions',
        gesture: { drag: [ONION_TO.x - PLATE.cx, ONION_TO.y - PLATE.cy] },
        step() { tip(); return true; },
        drag({ dx, dy }) {
          ox += dx; oy += dy;
          move(plate, ox, oy, 0); move(onions, ox, oy, 0);
          if (inOil(PLATE.cx + ox, PLATE.cy + oy)) { tip(); return true; }
        },
        release() { if (!tipped) { ox = oy = 0; move(plate, 0, 0, 350); move(onions, 0, 0, 350); } },
      }).done.then(() => later(() => { fade('#f-plate', 0); resolve(); }, 1400));
    });

    // ---- beat 4: the quarter cup of hot water ----
    const waterBeat = () => new Promise((resolve) => {
      const w = $('#f-water'), src = w.querySelector('.f-src');
      w.style.opacity = '1';
      frame(1.2, 480, 960, 520);
      hotspot(w, {
        label: 'pour in the hot water',
        gesture: 'tap',
        step() {
          src.style.transition = 'transform .5s ease-in-out';
          src.style.transform = 'translate(-210px, -150px) rotate(-62deg)';
          later(() => { splash(840, 410, 110, 14); audio.hit('fry-hiss'); heatTo = 1; voice.say('fry.water'); }, 450);
          later(() => { heatTo = 0.25; src.style.transform = ''; }, 1600);
          later(() => { w.style.opacity = '0'; resolve(); }, 2300);
          return true;
        },
      });
    });

    // ---- beat 5: the lid ----
    const settle = () => { // the covered cook: the sizzle gives way to a simmer
      simmering = true; heatTo = 0.1;
      audio.stop('sizzle', 2);
      audio.bed('simmer', 0.5, 2);
    };
    const lidOn = (now) => {
      const on = $('#f-lidOn');
      if (now) on.style.transition = 'none';
      on.style.opacity = '1'; on.style.transform = 'none';
      for (const i of landed) $(`#f-pc${i}`).style.opacity = '0';
      fade('#f-onions', 0);
      $('#f-lidRest').style.opacity = '0';
      if (!now) audio.hit('fry-lid');
      settle();
    };
    const liftLid = (now) => { // off the heat, lid up: the thick dark gravy and the chicken show
      const on = $('#f-lidOn');
      if (now) on.style.transition = 'none';
      on.style.opacity = '0'; on.style.transform = 'translateY(-70px)';
      for (const i of landed) $(`#f-pc${i}`).style.opacity = '1';
      fade('#f-onions', 1);
    };
    const lidBeat = () => new Promise((resolve) => {
      const host = $('#f-lidRest'), node = host.querySelector('.f-src');
      host.style.opacity = '1';
      frame(1.2, 480, 960, 520);
      let p = 0, fired = false;
      const put = (v, ms) => { node.style.transition = ms ? `transform ${ms}ms ease-out` : 'none'; node.style.transform = `translate(${v * LID_PATH[0]}px, ${v * LID_PATH[1]}px)`; };
      const fin = () => { fired = true; put(1, 250); later(() => { lidOn(false); voice.say('fry.lid'); }, 250); return true; };
      hotspot(host, {
        label: 'put the lid on',
        gesture: { drag: LID_PATH },
        step: fin,
        drag({ dx, dy }) { p = Math.min(1, Math.max(0, p + (dx * LID_PATH[0] + dy * LID_PATH[1]) / (LID_PATH[0] ** 2 + LID_PATH[1] ** 2))); put(p, 0); if (p >= 0.85) return fin(); },
        release() { if (!fired && p > 0) { p *= 0.6; put(p, 250); } },
      }).done.then(() => later(resolve, 900));
    });

    // ---- the start state (design.md section 4: the stove lit, the pot hot, nothing in yet) ----
    el.dataset.light = 'normal';
    const gravy = (g) => { $('#f-masala').style.opacity = String(g.toFixed(2)); fade('#f-marpool', 1 - g); };
    if (at >= 1) { PIECES.forEach((_, i) => placeAt(i, 0)); lands = PIECES.length; fade('#f-marpool', 1); fade('#f-bowlMar', 0); }
    if (at >= 2) { setCook(donenessAt(1, 1)); clock(1, 1); }
    // The fried onions are in the marinade (the standard recipes), so no plate of them is set out here.
    $('#f-plate').style.opacity = '0'; $('#f-onions').style.opacity = '0';
    if (at >= 5) { $('#f-water').style.opacity = '0'; $('#f-masala').style.transition = 'none'; lidOn(true); }
    if (at >= 6) { heat = heatTo = 0.1; setCook(donenessAt(2, 1)); clock(2, 1); gravy(1); liftLid(true); }

    if (part === 'gravy' && at < 5) $('#f-clock').style.opacity = '0'; // the sear clock is over; the covered cook brings its own

    // ---- the flow ----
    if (at < 1) {
      frame(1.2, 480, 740, 500); // the bowl and the pot both in view, even on a phone
      await run(tipBeat);
      if (signal.aborted) return;
    }
    if (at < 2) {
      frame(1.4, 480, 800, 420);
      await run(() => holdBeat(1, null, 'hold on the pot'));
      if (signal.aborted) return;
      voice.say('fry.golden');
      voice.say('fry.whyFry');
    }
    if (part === 'fry') return; // seared: on to The Gravy
    if (at < 4) { frame(1.3, 480, 800, 430); await run(waterBeat); if (signal.aborted) return; }
    if (at < 5) { await run(lidBeat); if (signal.aborted) return; }
    if (at < 6) {
      frame(1.3, 480, 800, 430);
      await run(() => holdBeat(2, gravy, 'hold while it cooks'));
      if (signal.aborted) return;
      audio.stop('flame', 2); // off the heat
      liftLid(false);
      voice.say('fry.thick');
      await Promise.race([voice.say('fry.whyNinety'), gone]);
      return;
    }
    frame(1.3, 480, 800, 430); // done (dev): the gravy thick, holds here
    await gone;
  },
};
