// Chapter I, The Marinade. Close shot on the counter at dusk. Beats: (1) drag the curd bowl over the steel bowl and
// hold it tipped (or tap): thick dollops fall onto the chicken, three finish it; (2) tap the ginger-garlic paste,
// chilli, turmeric and salt in any order (four hotspots at once): each lands as a heap with a puff of coloured dust;
// (3) stir in circles (or tap, a quarter turn each): about four turns blend the white into sunset orange; (4) drag the
// cloth over the bowl (or tap): the window dims a little and the chapter ends.
//
// ?state= (dev, for screenshots; sets the chapter up at that point and plays on from there. covered holds):
//   start    the curd bowl waiting (also the default)
//   curd     three dollops on the chicken, the paste and spices waiting
//   spices   the four heaps on the curd, the spoon waiting
//   stir     two turns in: streaks of colour, pale orange
//   stirred  fully stirred, the cloth waiting
//   covered  the cloth on, the window dimmed (held)
// Hotspots: #m-curdHot (drag [150, 160], hold while tipped over the bowl, or tap), #m-paste #m-chilli #m-turmeric #m-salt
// (tap), #m-stir (circle, or tap), #m-cloth (drag [-175, 90], or tap).
import '../sound/marinade.js';
import { BOWL, IN, POS, SLOT, DOLLOP } from '../art/marinade.js';

export const TURNS = 4; // full turns of stirring that finish the mix
const POUR_EVERY = 0.6; // seconds of holding (or 500 world units of dragging) over the bowl per dollop
const CLOTH_PATH = [BOWL.cx - 0 - POS.cloth[0], BOWL.cy - 5 - POS.cloth[1]];
const SPICES = ['paste', 'chilli', 'turmeric', 'salt'];
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Layer opacities for a stir progress mix in 0..1: the heaps and curd give way to swirls of colour, then to an even coat.
export function look(mix) {
  const m = clamp01(mix);
  return {
    dol: 1 - clamp01(m * 2),
    heap: 1 - clamp01(m * 1.6),
    swirl: clamp01(m * 4) * (1 - clamp01((m - 0.55) / 0.35)),
    coat: m * m * (3 - 2 * m), // smoothstep: pale at first, then deepening
    coated: clamp01((m - 0.4) / 0.5),
    pool: 1 - clamp01((m - 0.6) * 2.5),
  };
}
// Stir: the pointer at (x, y) moves the angle round the bowl centre; turns accumulate in either direction.
export function stirStep(angle, turns, x, y) {
  if (Math.hypot(x - IN.cx, (y - IN.cy) * (IN.rx / IN.ry)) < 14) return { angle, turns }; // too near the middle to have an angle
  const a = Math.atan2((y - IN.cy) * (IN.rx / IN.ry), x - IN.cx);
  let d = a - angle;
  while (d > Math.PI) d -= 2 * Math.PI;
  while (d < -Math.PI) d += 2 * Math.PI;
  return { angle: a, turns: turns + Math.abs(d) / (2 * Math.PI) };
}
export const along = (p, dx, dy, path) => clamp01(p + (dx * path[0] + dy * path[1]) / (path[0] ** 2 + path[1] ** 2));
// Is a point over the steel bowl's mouth (the curd bowl's pouring lip)?
export const overBowl = (x, y) => ((x - IN.cx) / (IN.rx + 20)) ** 2 + ((y - IN.cy) / (IN.ry + 30)) ** 2 < 1;

const STATES = { start: 0, curd: 1, spices: 2, stir: 3, stirred: 4, covered: 5 };

export default {
  id: 'marinade',
  art: () => import('../art/marinade.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params, wait } = ctx;
    audio.muffle(0); audio.stop('flame'); audio.stop('drone'); // a jump may leave the wait's hush or the end's drone behind
    const el = stage.el;
    const at = STATES[params.get('state')] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    const stopAll = () => { for (const t of timers) clearTimeout(t); timers.clear(); audio.level('mar-fold', 0, 0.2); audio.level('mar-fold-hi', 0, 0.2); };
    signal.addEventListener('abort', stopAll, { once: true });
    const $ = (s) => stage.$(s);
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    const frame = (want, span, x, y) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y);
    audio.bed('rain', 0.22);

    // ---- the picture, from three numbers: dollops landed, heaps landed, stir progress ----
    let poured = 0, mix = 0;
    const landed = new Set();
    const paint = () => {
      const l = look(mix);
      $('#m-dols').style.opacity = l.dol;
      $('#m-heaps').style.opacity = l.heap;
      $('#m-swirlW').style.opacity = l.swirl;
      $('#m-coat').style.opacity = l.coat;
      $('#m-coated').style.opacity = l.coated;
      const pool = $('#m-pool');
      pool.style.transform = `scale(${Math.min(1, 0.3 + 0.14 * poured + 0.5 * mix).toFixed(2)})`;
      pool.style.opacity = ([0, 0.55, 0.85, 1][poured] ?? 1) * l.pool;
      const top = $('#m-curdTop');
      top.style.transform = `scale(${(1 - 0.3 * poured).toFixed(2)})`;
      top.style.opacity = poured >= 3 ? 0.35 : 1;
    };
    const dols = [...stage.el.querySelectorAll('.m-dolW')];
    const heaps = Object.fromEntries(SPICES.map((n) => [n, $(`.m-heapW[data-n="${n}"]`)]));

    const settle = (instantDol, instantHeaps) => { // dev states: put things down without the animation
      for (let i = 0; i < instantDol; i++) dols[i].querySelector('.m-dol').style.opacity = '1';
      for (const n of instantHeaps) { heaps[n].querySelector('.m-heap').style.opacity = '1'; landed.add(n); }
      poured = instantDol;
    };

    // ---- beat 1: the curd ----
    const curdHot = $('#m-curdHot'), curdEl = $('#m-curdT');
    curdEl.style.transformOrigin = `${POS.curd[0]}px ${POS.curd[1]}px`;
    const putCurd = (ox, oy, tilt, ms = 140) => {
      curdEl.style.transition = ms ? `transform ${ms}ms ease-out` : 'none';
      curdEl.style.transform = `translate(${ox}px, ${oy}px) rotate(${tilt}deg)`;
    };
    const dropDollop = (lx, ly) => {
      if (poured >= 3) return true;
      const i = poured++;
      const [tx, ty] = DOLLOP[i];
      const dol = dols[i].querySelector('.m-dol');
      dol.classList.add('on');
      paint();
      audio.hit('mar-plop');
      // visual twin: a ribbon of curd from the lip, a ripple on the pool
      const s = $('#m-stream');
      $('#m-streamP').setAttribute('d', `M${lx} ${ly}Q${lx + 8} ${(ly + ty) / 2} ${tx} ${ty - 26}`);
      $('#m-streamH').setAttribute('d', `M${lx - 2} ${ly}Q${lx + 5} ${(ly + ty) / 2} ${tx - 2} ${ty - 26}`);
      s.animate([{ opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: 520 });
      const rip = dols[i].querySelector('.m-rip');
      rip.animate([{ opacity: 0.9, transform: 'scale(.5)' }, { opacity: 0, transform: 'scale(2.2)' }], { duration: 800, delay: 260, easing: 'ease-out' });
      rip.style.transformBox = 'fill-box'; rip.style.transformOrigin = '50% 50%';
      return poured >= 3;
    };
    const curdBeat = () => new Promise((resolve) => {
      let ox = 0, oy = 0, acc = 0, home = 0, pressed = false, pending = 0;
      const rest = () => putCurd(0, 0, 0, 420);
      const lip = () => [POS.curd[0] + ox + 62, POS.curd[1] + oy - 4];
      const over = () => overBowl(POS.curd[0] + ox + 50, POS.curd[1] + oy + 10);
      const fin = () => { rest(); return true; };
      const spot = hotspot(curdHot, {
        label: 'tip the curd in',
        gesture: { drag: [150, 160] },
        step() {
          clearTimeout(home);
          ox = 118; oy = 150;
          putCurd(ox, oy, 34, 320);
          pending++;
          later(() => { pending--; dropDollop(...lip()); }, 260);
          home = later(() => { if (!pressed) rest(); }, 1500);
          return poured + pending >= 3;
        },
        drag({ dx, dy }) {
          pressed = true;
          ox = Math.min(260, Math.max(-60, ox + dx)); oy = Math.min(260, Math.max(-40, oy + dy));
          const o = over();
          putCurd(ox, oy, o ? 34 : 0);
          if (o) acc += Math.hypot(dx, dy) / 500;
          if (acc >= POUR_EVERY) { acc = 0; if (dropDollop(...lip())) return fin(); }
        },
        hold(dt) {
          if (!over()) return;
          acc += dt;
          if (acc >= POUR_EVERY) { acc = 0; if (dropDollop(...lip())) return fin(); }
        },
        release() { pressed = false; acc = 0; rest(); ox = 0; oy = 0; },
      });
      spot.done.then(resolve);
    });

    // ---- beat 2: paste and spices ----
    const spicesBeat = () => new Promise((resolve) => {
      let n = 0;
      const land = (name) => {
        if (landed.has(name)) return true;
        landed.add(name);
        n++;
        const src = $(`#m-${name} .m-src`) ?? $(`#m-${name}`);
        src.animate([{ transform: 'translate(0px, 0px) rotate(0deg)' }, { transform: 'translate(10px, -16px) rotate(10deg)', offset: 0.35 }, { transform: 'translate(0px, 0px) rotate(0deg)' }], { duration: 560, easing: 'ease-in-out' });
        const heap = heaps[name].querySelector('.m-heap'), bits = [...$(`#m-dust-${name}`).querySelectorAll('.m-d')];
        later(() => {
          heap.classList.add('on');
          audio.hit('mar-puff');
          for (const d of bits) {
            const dx = +d.dataset.dx, dy = +d.dataset.dy;
            d.style.transformBox = 'fill-box'; d.style.transformOrigin = '50% 50%';
            d.animate([{ opacity: 0.85, transform: 'translate(0px, 0px) scale(.4)' }, { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(2.2)` }], { duration: 1100, easing: 'ease-out' });
          }
        }, 160);
        if (n === 1) voice.say('marinade.paste');
        if (n === SPICES.length) { voice.say('marinade.spices'); later(resolve, 1200); }
        return true;
      };
      for (const name of SPICES) {
        if (landed.has(name)) { n++; continue; }
        const label = { paste: 'add the ginger-garlic paste', chilli: 'add the chilli', turmeric: 'add the turmeric', salt: 'add the salt' }[name];
        hotspot($(`#m-${name}`), { label, gesture: 'tap', step: () => land(name) });
      }
      if (n === SPICES.length) resolve();
    });

    // ---- beat 3: the stir ----
    const spoonEl = $('#m-spoon'), spr = spoonEl.querySelector('.m-spr'), swirl = $('#m-swirl');
    let angle = -0.6, turns = 0;
    const spoonAt = (a, ms) => {
      spoonEl.style.transition = ms ? `transform ${ms}ms ease-out` : 'none';
      spoonEl.style.transform = `translate(${(IN.cx + 0.5 * IN.rx * Math.cos(a)).toFixed(1)}px, ${(IN.cy + 0.55 * IN.ry * Math.sin(a) + 8).toFixed(1)}px)`;
      swirl.style.transform = `rotate(${(a * 57.3).toFixed(1)}deg)`;
    };
    const stirBeat = () => new Promise((resolve) => {
      spr.style.transform = 'rotate(-70deg)';
      spoonAt(angle, 800); // the spoon goes into the bowl
      let quiet = 0;
      const sound = (speed) => {
        audio.level('mar-fold', Math.min(0.75, 0.12 + speed / 800), 0.06);
        audio.level('mar-fold-hi', clamp01((speed - 250) / 900) * 0.6, 0.06);
        clearTimeout(quiet);
        quiet = setTimeout(() => { audio.level('mar-fold', 0, 0.25); audio.level('mar-fold-hi', 0, 0.25); }, 170);
      };
      const finish = () => {
        mix = 1; paint();
        audio.level('mar-fold', 0, 0.3); audio.level('mar-fold-hi', 0, 0.3);
        voice.say('marinade.fold');
        return true;
      };
      const apply = () => { mix = clamp01(turns / TURNS); paint(); return turns >= TURNS - 1e-6; };
      const spot = hotspot($('#m-stir'), {
        label: 'stir it in',
        gesture: 'circle',
        step() {
          turns += 0.25; angle += Math.PI / 2;
          spoonAt(angle, 260);
          sound(500); later(() => { audio.level('mar-fold', 0, 0.2); audio.level('mar-fold-hi', 0, 0.2); }, 320);
          return apply() && finish();
        },
        drag({ x, y, speed }) {
          const s = stirStep(angle, turns, x, y);
          if (s.turns === turns) return;
          angle = s.angle; turns = s.turns;
          spoonAt(angle, 0);
          sound(speed);
          return apply() && finish();
        },
        release() { audio.level('mar-fold', 0, 0.25); audio.level('mar-fold-hi', 0, 0.25); },
      });
      spot.done.then(() => { clearTimeout(quiet); resolve(); });
    });

    // ---- beat 4: the cloth ----
    const coverBeat = () => new Promise((resolve) => {
      const cloth = $('#m-clothT');
      let p = 0;
      const put = (v, ms) => { cloth.style.transition = ms ? `transform ${ms}ms ease-out` : 'none'; cloth.style.transform = `translate(${v * CLOTH_PATH[0]}px, ${v * CLOTH_PATH[1]}px)`; };
      const dr = $('#m-drape'), dimR = $('#m-dimR');
      const cover = () => {
        put(1, 260);
        later(() => {
          cloth.style.transition = 'opacity .3s'; cloth.style.opacity = '0';
          spoonEl.style.opacity = '0';
          dr.style.opacity = '1'; dr.style.transform = 'scale(1)';
          audio.hit('mar-cloth');
          dimR.style.opacity = '0.5'; // the light outside dims a little
          audio.level('rain', 0.4, 3);
        }, 240);
        voice.say('marinade.whyRest');
        return true;
      };
      const spot = hotspot($('#m-cloth'), {
        label: 'cover the bowl',
        gesture: { drag: CLOTH_PATH },
        step: cover,
        drag({ dx, dy }) {
          p = along(p, dx, dy, CLOTH_PATH);
          put(p, 0);
          if (p >= 0.85) return cover();
        },
        release() { if (p > 0) { p *= 0.7; put(p, 300); } },
      });
      spot.done.then(resolve);
    });

    // ---- start state ----
    if (at >= 1) settle(3, at >= 2 ? SPICES : []);
    if (at >= 3) { turns = at === 3 ? 2 : TURNS; mix = clamp01(turns / TURNS); angle = 0.4; }
    paint();
    if (at >= 3) { $('#m-spoon .m-spr').style.transform = 'rotate(-70deg)'; spoonAt(angle, 0); }
    if (at >= 5) {
      spoonEl.style.opacity = '0'; $('#m-clothT').style.opacity = '0';
      const dr = $('#m-drape'); dr.style.opacity = '1'; dr.style.transform = 'scale(1)';
      $('#m-dimR').style.opacity = '0.5';
    }
    frame(1.25, 480, 800, 470);
    if (at === 0) voice.say('marinade.curd'); // over the action; the bowl is ready at once

    // ---- the flow ----
    if (at === 0) {
      await Promise.race([curdBeat(), gone]);
      if (signal.aborted) return;
      voice.say('marinade.whyCurd');
    }
    if (at <= 2) {
      await Promise.race([spicesBeat(), gone]);
      if (signal.aborted) return;
    }
    if (at <= 3) {
      await Promise.race([stirBeat(), gone]);
      if (signal.aborted) return;
      await wait(500);
    }
    if (at <= 4) {
      await Promise.race([coverBeat(), gone]);
      if (signal.aborted) return;
      await wait(3200);
      return;
    }
    await gone; // covered: hold
  },
};
