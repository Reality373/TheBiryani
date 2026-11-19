// Chapter VIII, The Layers. Steam mood, close shot into the open copper handi with the chicken masala at the bottom.
// Beats: (1) tap the ladle: three layers of rice settle over the masala, each with its falling grains, a puff of steam
// and a grainy pour; (2) drag across the rice to pour the saffron milk: the streaks grow where the finger goes, darker
// where it lingers, and a tap gives a ready-made streak; (3) three at once: tap the mint, tap the fried onions, drag the
// ghee spoon up over the pot (or tap it for one spoonful). Then the pot is full, the steam curls, and the chapter ends.
//
// ?state= (dev, for screenshots; sets the pot up at that point, then plays on from there, except topped, which holds):
//   start    the masala only, the ladle waiting (default)
//   rice     three layers of rice, the saffron pour waiting
//   saffron  three layers and two streaks, the pour in progress
//   topped   everything done: the pot full, the steam curling (held)
// Hotspots: #ly-ladle (tap), #ly-saf-hit (drag across the rice, or tap for a ready-made streak), #ly-mint-hot (tap),
// #ly-onion-hot (tap), #ly-spoon (drag up over the pot, or tap). The rice pot, the cup and the bowls are not hotspots.
import '../sound/layers.js';
import * as F from '../art/food.js';
import { GHEE } from '../art/layers.js';
import { f } from '../art/lib.js';

export const STATE = { start: 0, rice: 1, saffron: 2, topped: 3 };
export const LAYERS = 3;
export const STREAKS = 4; // this many streaks (drawn or tapped) finish the pour
export const POUR_LENGTH = 1400; // world units of drawn pour that finish it, whatever the streak count
export const GHEE_LENGTH = 300; // world units of spoon drag for one spoonful of ghee
const NS = 'http://www.w3.org/2000/svg';

export const pourDone = (streaks, length) => streaks >= STREAKS || length >= POUR_LENGTH;
// The pour darkens where it lingers: a slow finger (world units a second) lays a darker run.
export const lingering = (speed) => speed < 120;
// A ready-made streak for a tap: a loose S across the rice, varied by i so the four differ.
export const readyStreak = (i) => {
  const x0 = 600 + (i % 2) * 40, x1 = 960 - (i % 3) * 30, yc = 250 + i * 46, pts = [];
  for (let k = 0; k <= 16; k++) {
    const t = k / 16;
    pts.push([x0 + (x1 - x0) * t, yc + Math.sin(t * Math.PI * 1.4 + i) * 26 + (i % 2 ? -18 : 14) * t]);
  }
  return pts;
};

const el = (name, attrs, parent) => {
  const e = document.createElementNS(NS, name);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, String(v));
  parent?.append(e);
  return e;
};

// One pour, built as the finger moves: three widths of one stroke (a faint halo that wanders a little, a body, a core),
// and a darker run while the pour lingers. Points are appended, so a streak only ever grows where the finger has been.
function pourStreak(group, x, y) {
  const style = (w, op, col) => ({ fill: 'none', stroke: col, 'stroke-width': w, 'stroke-opacity': op, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' });
  const halo = el('path', style(24, 0.28, '#F5B93A'), group);
  const body = el('path', style(11, 0.75, '#E8921A'), group);
  const core = el('path', style(4, 0.9, '#C9650F'), group);
  const dark = el('path', style(12, 0.55, '#A8501A'), group);
  let hd = `M${f(x)} ${f(y)}`, bd = hd, cd = hd, kd = '', n = 0, len = 0, lx = x, ly = y, slow = false;
  return {
    get length() { return len; },
    add(px, py, speed) {
      n++;
      len += Math.hypot(px - lx, py - ly);
      lx = px; ly = py;
      const j = Math.sin(n * 0.8) * 2.2; // the halo's edge wanders, so the width is never ruled
      hd += ` L${f(px + j)} ${f(py - j * 0.6)}`;
      bd += ` L${f(px)} ${f(py)}`;
      cd += ` L${f(px)} ${f(py)}`;
      if (lingering(speed)) { kd += slow ? ` L${f(px)} ${f(py)}` : ` M${f(px)} ${f(py)}`; slow = true; } else slow = false;
      halo.setAttribute('d', hd); body.setAttribute('d', bd); core.setAttribute('d', cd); dark.setAttribute('d', kd);
    },
  };
}

export default {
  id: 'layers',
  art: () => import('../art/layers.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params } = ctx;
    audio.muffle(0); audio.stop('flame'); audio.stop('drone'); audio.bed('rain', 0.25); // a jump may leave the wait's hush or the end's drone behind
    const $ = (sel) => stage.$(sel);
    const at = STATE[params.get('state')] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    signal.addEventListener('abort', () => {
      for (const t of timers) clearTimeout(t);
      timers.clear();
      audio.level('trickle', 0, 0.2);
      audio.stop('simmer', 2);
    }, { once: true });

    // The camera pushes in on what is touchable; push keeps the target in place and lifts it into the top 70%.
    const frame = (scale, x, y, ms = 1400) => stage.camera.push(scale, x, y, ms);

    let layers = 0, streaks = 0, seeds = 0;

    // ---- rice: one layer per tap ----
    const showLayer = (n, withFalls = true) => {
      $(`#ly-l${n}`)?.classList.add('on');
      if (withFalls) { $(`#ly-f${n}`)?.classList.add('on'); $(`#ly-p${n}`)?.classList.add('on'); }
    };
    const addLayer = () => {
      layers = Math.min(LAYERS, layers + 1);
      audio.hit('rice-pour');
      showLayer(layers);
      return layers >= LAYERS;
    };
    const riceBeat = () => new Promise((resolve) => {
      frame(1.5, 700, 672);
      const spot = hotspot($('#ly-ladle'), { label: 'tap the ladle', gesture: 'tap', step: addLayer });
      spot.done.then(resolve);
    });

    // ---- saffron: streaks where the finger goes ----
    let cupAnim = null;
    const tiltCup = (on) => {
      if (on) cupAnim = $('#ly-cup')?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-34deg)' }], { duration: 600, fill: 'forwards', easing: 'ease-out' }) ?? null;
      else cupAnim?.reverse();
    };
    // A new pour is its own group, so a tap's ready streak can fade in the same way.
    const newPour = (x, y) => pourStreak(el('g', {}, $('#ly-saf')), x, y);
    const tapStreak = (i) => {
      const pts = readyStreak(i), g = el('g', {}, $('#ly-saf'));
      const s = pourStreak(g, pts[0][0], pts[0][1]);
      for (const [x, y] of pts.slice(1)) s.add(x, y, 400);
      g.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 600, easing: 'ease-out' });
    };

    const saffronBeat = () => new Promise((resolve) => {
      frame(1.5, 800, 330);
      voice.say('layers.saffron');
      let cur = null, pour = 0;
      const spot = hotspot($('#ly-saf-hit'), {
        label: 'pour the saffron milk',
        gesture: { drag: [260, 90] },
        step() {
          tapStreak(streaks);
          audio.hit('pour-hit');
          streaks++;
          return pourDone(streaks, pour);
        },
        drag({ x, y, dx, dy, speed, first }) {
          if (first) { cur = newPour(x - dx, y - dy); tiltCup(true); }
          cur.add(x, y, speed);
          pour += Math.hypot(dx, dy);
          audio.level('trickle', Math.min(0.5, speed / 1400), 0.08);
          if (pourDone(streaks, pour)) { audio.level('trickle', 0, 0.3); tiltCup(false); spot.finish(); return true; } // release() will not run once it returns true
        },
        release() {
          audio.level('trickle', 0, 0.3);
          tiltCup(false);
          if (cur && cur.length > 60) streaks++; // a short wobble of the finger is not a streak
          cur = null;
          if (streaks >= STREAKS) spot.finish();
        },
      });
      spot.done.then(() => { voice.say('layers.whySaffron'); resolve(); });
    });

    // ---- the toppings: three hotspots at once; the chapter goes on when all three are done ----
    const drip = (x, y) => {
      $('#ly-ghee')?.insertAdjacentHTML('beforeend', F.glisten({ x, y, w: 92, h: 40, n: 6, seed: ++seeds }));
    };
    // The sheen over the top, once the ghee has gone in: small warm glints only, no tint over the grains (it washed them brown).
    // A thin cream light over the lit upper left of the rice, screen-blended: lifts the grains without tinting them.
    const sheen = () => $('#ly-ghee')?.insertAdjacentHTML('beforeend',
      `<ellipse cx="700" cy="250" rx="200" ry="110" fill="url(#ly-lift)" opacity=".5" style="mix-blend-mode:screen"/>` +
      F.glisten({ x: 760, y: 300, w: 400, h: 180, n: 16, seed: 7 }));
    const mintBeat = () => new Promise((resolve) => {
      const spot = hotspot($('#ly-mint-hot'), {
        label: 'add the mint',
        gesture: 'tap',
        step() { $('#ly-mint')?.classList.add('on'); audio.hit('leaf'); return true; },
      });
      spot.done.then(resolve);
    });
    const onionBeat = () => new Promise((resolve) => {
      const spot = hotspot($('#ly-onion-hot'), {
        label: 'add the fried onion',
        gesture: 'tap',
        step() { $('#ly-curls')?.classList.add('on'); audio.hit('crisp'); return true; },
      });
      spot.done.then(resolve);
    });
    const gheeBeat = () => new Promise((resolve) => {
      const spoon = $('#ly-spoon');
      let ox = 0, oy = 0, run = 0, lastDrip = 0;
      const spot = hotspot(spoon, {
        label: 'spoon the ghee over',
        gesture: { drag: [0, -240] },
        step() {
          drip(GHEE.x + 20, GHEE.y - 120); drip(GHEE.x - 40, GHEE.y - 200); drip(GHEE.x + 30, GHEE.y - 260);
          audio.hit('drop');
          return true;
        },
        drag({ dx, dy }) {
          ox += dx; oy += dy;
          run += Math.hypot(dx, dy);
          if (spoon) { spoon.style.transition = 'none'; spoon.style.transform = `translate(${f(ox)}px, ${f(oy)}px)`; }
          if (GHEE.y + oy < 560 && run - lastDrip > 36) { lastDrip = run; drip(GHEE.x + ox, GHEE.y - 10 + oy); audio.hit('drop'); }
          return run >= GHEE_LENGTH;
        },
        release() {
          if (run >= GHEE_LENGTH) return;
          ox = 0; oy = 0; // it springs back to the bowl; nothing is lost, the next drag starts again
          if (spoon) { spoon.style.transition = 'transform .4s ease-out'; spoon.style.transform = ''; }
        },
      });
      spot.done.then(() => {
        spoon?.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 700, fill: 'forwards' });
        resolve();
      });
    });

    // ---- start state: what the viewer already sees at this point ----
    audio.bed('simmer', 0.12, 2);
    if (at >= STATE.rice) { for (let n = 1; n <= LAYERS; n++) showLayer(n, false); layers = LAYERS; }
    if (at >= STATE.saffron) for (let i = 0; i < 2; i++) { tapStreak(i); streaks++; }
    if (at === STATE.topped) {
      for (let i = streaks; i < STREAKS; i++) { tapStreak(i); streaks++; }
      $('#ly-mint')?.classList.add('on');
      $('#ly-curls')?.classList.add('on');
      for (let i = 0; i < 6; i++) drip(GHEE.x - 230 + i * 92, 300 + (i % 2) * 60);
      sheen();
      $('#ly-spoon')?.setAttribute('opacity', '0');
      $('#ly-steam-top')?.style.setProperty('opacity', '1');
      frame(1.15, 760, 330, 0);
      await gone;
      return;
    }

    // ---- the flow ----
    if (at === STATE.start) {
      voice.say('layers.rice');
      voice.say('layers.whyRice');
      await Promise.race([riceBeat(), gone]);
      if (signal.aborted) return;
    }
    if (at <= STATE.saffron) {
      await Promise.race([saffronBeat(), gone]);
      if (signal.aborted) return;
    }
    frame(1.25, 880, 640);
    await Promise.race([Promise.all([mintBeat(), onionBeat(), gheeBeat()]), gone]);
    if (signal.aborted) return;
    voice.say('layers.ghee');
    sheen();
    $('#ly-steam-top')?.style.setProperty('opacity', '1');
    audio.stop('simmer', 2.5);
    await ctx.wait(2600);
  },
};
