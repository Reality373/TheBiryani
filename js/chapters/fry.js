// Chapter II, The Fry. Close: a heavy pot of hot oil on a gas burner, the stove's light from below. Beats: (1) drag a
// piece of chicken from the bowl into the oil (four pieces; a tap drops the next one); (2) hold on the pot until the
// pieces are golden (release calms it and keeps what was cooked; a tap is one fixed step); (3) drag the plate of fried
// onions over the pot, or tap it, to tip them in; (4) tap the four whole spices in, all active at once. The masala
// thickens, the sizzle settles into a simmer, and the chapter ends on "thick".
//
// ?state= (dev, for screenshots; sets the chapter up at that point and plays on from there; spiced holds):
//   start    the bowl full, the oil hot, nothing in (also the default)
//   in       the first piece in the oil
//   frying   all four pieces in, part cooked, not yet golden
//   golden   golden at the edges, the onions waiting
//   onions   the onions in, the spices waiting
//   spiced   all spices in, the masala thick (holds here)
// Hotspots: .f-pc (drag to the oil, or tap), #f-potHit (hold, or tap for a step), #f-plate (drag over the pot, or tap),
// #f-sp0..3 (tap each spice). The chicken layers are crossfaded with food.chicken's doneness.
import '../sound/fry.js';
import { OIL, PIECES, LAND, PLATE, ONION, ONION_TO, SPICES } from '../art/fry.js';

const HOLD_SEC = 4; // a hold takes this many seconds to take the pieces from raw to golden
const TAP_COOK = 0.25; // one tap is this much cooking
const STATE = { start: 0, in: 1, frying: 2, golden: 3, onions: 4, spiced: 5 };
const PLACED = [0, 1, 4, 4, 4, 4]; // pieces already in the oil at each state
const SVG_NS = 'http://www.w3.org/2000/svg';

// The centre of a piece lies in the oil (inside the rim, a little in from the edge).
export const inOil = (x, y) => ((x - OIL.cx) / OIL.rx) ** 2 + ((y - OIL.cy) / OIL.ry) ** 2 <= 0.8;
// Cooking by a hold: dt seconds of holding, capped at golden.
export const cookStep = (g, dt) => Math.min(1, g + dt / HOLD_SEC);
// Opacity weights of the raw, half-fried and golden layers for a cook amount 0..1 (they always sum to 1).
export const layerWeights = (g) => {
  const t = Math.min(1, Math.max(0, g));
  return [Math.max(0, 1 - 2 * t), 1 - Math.abs(2 * t - 1), Math.max(0, 2 * t - 1)];
};

export default {
  id: 'fry',
  art: () => import('../art/fry.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params } = ctx;
    const el = stage.el;
    const state = params.get('state');
    const at = STATE[state] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const $ = (sel) => stage.$(sel);
    const make = (markup) => { const t = document.createElementNS(SVG_NS, 'svg'); t.innerHTML = markup; return t.firstElementChild; };
    let raf = 0;
    signal.addEventListener('abort', () => { cancelAnimationFrame(raf); audio.level('sizzle', 0, 0.2); audio.stop('simmer', 0.5); }, { once: true });

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

    // ---- the pieces: transforms only; the landed ones carry their cook level ----
    const landed = new Set();
    let cook = 0, lands = 0;
    const move = (node, x, y, ms) => { node.style.transition = ms ? `transform ${ms}ms ease-out` : 'none'; node.style.transform = `translate(${x}px, ${y}px)`; };
    const setCook = (g) => {
      cook = g;
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
      setCook(cook);
    };
    const drop = (i) => {
      placeAt(i, 420);
      splash(LAND[i][0], LAND[i][1], 110, 12);
      audio.hit('fry-sizzle');
      lands++;
      if (lands === 1) voice.say('fry.in');
      if (lands === PIECES.length) voice.say('fry.kitchen');
    };
    const pieceBeat = (i) => new Promise((resolve) => {
      const node = $(`#f-pc${i}`), p = PIECES[i];
      let ox = 0, oy = 0;
      hotspot(node, {
        label: 'put it in the oil',
        gesture: { drag: [LAND[i][0] - p.x, LAND[i][1] - p.y] },
        step() { drop(i); return true; },
        drag({ dx, dy }) {
          ox += dx; oy += dy;
          move(node, ox, oy, 0);
          if (inOil(p.x + ox, p.y + oy)) { drop(i); return true; }
        },
        release() { if (!landed.has(i)) { ox = oy = 0; move(node, 0, 0, 350); } },
      }).done.then(resolve);
    });

    // ---- beat 2: golden. Held: the bed swells, bubbles quicken, smoke rises; released: it calms, nothing is lost ----
    const goldBeat = () => new Promise((resolve) => {
      frame(1.4, 420, 800, 420);
      hotspot($('#f-potHit'), {
        label: 'hold on the pot',
        gesture: 'hold',
        step() { setCook(Math.min(1, cook + TAP_COOK)); return cook >= 1; },
        hold(dt) { heatTo = 1; setCook(cookStep(cook, dt)); return cook >= 1; },
        release() { heatTo = 0.25; },
      }).done.then(() => {
        heatTo = 0.25;
        voice.say('fry.golden');
        voice.say('fry.whyFry');
        resolve();
      });
    });

    // ---- beat 3: the onions, dragged over the pot (or tapped) ----
    const onionBeat = () => new Promise((resolve) => {
      const plate = $('#f-plate'), onions = $('#f-onions');
      let ox = 0, oy = 0, tipped = false;
      frame(1.3, 460, 920, 520);
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
      }).done.then(resolve);
    });

    // ---- beat 4: the four whole spices, all active at once; the last one thickens the masala ----
    const settle = () => {
      simmering = true; heatTo = 0.1;
      audio.stop('sizzle', 2);
      audio.bed('simmer', 0.5, 2);
      $('#f-masala').style.opacity = '1';
    };
    const spiceBeat = () => new Promise((resolve) => {
      frame(1.35, 360, 1040, 700);
      let left = SPICES.length;
      SPICES.forEach((s, i) => {
        hotspot($(`#f-sp${i}`), {
          label: `add the ${s.name}`,
          gesture: 'tap',
          step() {
            move($(`#f-sp${i}`), s.to[0] - s.x, s.to[1] - s.y, 420);
            splash(s.to[0], s.to[1], 34, 6);
            audio.hit('fry-tick');
            if (--left === 0) {
              voice.say('fry.spices');
              voice.say('fry.whySpices');
              settle();
              resolve();
            }
            return true;
          },
        });
      });
    });

    // ---- the start state (design.md section 4: the stove lit, the pot hot, nothing in yet) ----
    el.dataset.light = 'normal';
    const placed = PLACED[at];
    for (let i = 0; i < placed; i++) placeAt(i, 0);
    lands = placed;
    setCook(at === 2 ? 0.3 : at >= 3 ? 1 : 0);
    if (at >= 4) move($('#f-onions'), ONION_TO.x - ONION.x, ONION_TO.y - ONION.y, 0);
    if (at >= 5) {
      SPICES.forEach((s, i) => move($(`#f-sp${i}`), s.to[0] - s.x, s.to[1] - s.y, 0));
      heat = heatTo = 0.1;
      settle();
      $('#f-masala').style.transition = 'none';
    }

    // ---- the flow ----
    if (at < 2) {
      frame(1.2, 400, 740, 500); // the bowl and the drop target both in view, even on a phone
      for (let i = placed; i < PIECES.length; i++) {
        await Promise.race([pieceBeat(i), gone]);
        if (signal.aborted) return;
      }
    }
    if (at < 3) { await Promise.race([goldBeat(), gone]); if (signal.aborted) return; }
    if (at < 4) { await Promise.race([onionBeat(), gone]); if (signal.aborted) return; }
    if (at < 5) {
      await Promise.race([spiceBeat(), gone]);
      if (signal.aborted) return;
      await Promise.race([voice.say('fry.thick'), gone]);
      return;
    }
    frame(1.35, 360, 1040, 700); // spiced (dev): the masala thick, holds here
    await gone;
  },
};
