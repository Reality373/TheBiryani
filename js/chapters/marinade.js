// Chapter III, The Marinade. Close shot on the counter at dusk. The marinade is built first, in the empty steel bowl,
// then the chicken goes in. Beats, each station fading in as the last is done:
// (1) tip the curd bowl over the steel bowl (drag and hold, or tap): three dollops; (2) paste, lemon half, oil, all at
// once: tap the paste and the oil, drag the lemon down to squeeze it; (3) the dry things: drag the spice tray over the
// bowl (all six powders), drag the fried onions over it (crushed by hand), tap the herbs and the green chilli; (4) stir in
// circles (or tap) to an even orange paste, then taste it; (5) the board: drag across each piece for its gashes (or
// tap), then drag each piece into the bowl (or tap); (6) fold in circles till every piece is coated; (7) drag the cloth
// over the bowl (or tap): the window dims a little and the chapter ends. The ingredient card ticks as each goes in.
//
// ?state= (dev, for screenshots; sets the chapter up at that point and plays on from there. covered holds):
//   start    the curd bowl waiting (also the default)
//   curd     three dollops in, paste, lemon and oil waiting
//   wet      paste, lemon and oil in, the tray, onions, herbs and chilli waiting
//   dry      everything in, the spoon waiting
//   stir     two turns in: streaks of colour
//   stirred  an even orange paste, the board of chicken waiting
//   board    the same: the four uncut pieces on the board
//   inbowl   the four pieces in the paste, uncoated
//   folded   every piece coated, the cloth waiting
//   covered  the cloth on, the window dimmed (held)
// Hotspots: #m-curdHot (drag [150, 160], hold while tipped, or tap), #m-paste #m-oil #m-herbs #m-greenchilli (tap),
// #m-lemon (drag), #m-tray (drag), #m-birista (drag), #m-stir (circle, or tap), #m-bp0..3 (drag across, then drag to the
// bowl; or tap), #m-cloth (drag [-175, 90], or tap).
import '../sound/marinade.js';
import { BOWL, IN, POS, SLOT, DOLLOP, BP, TRAY, HEAPS } from '../art/marinade.js';

export const TURNS = 4; // full turns of stirring that finish the mix
export const FOLD_TURNS = 3; // and of folding that coats the chicken
const POUR_EVERY = 0.6; // seconds of holding (or 500 world units of dragging) over the bowl per dollop
const CLOTH_PATH = [BOWL.cx - 0 - POS.cloth[0], BOWL.cy - 5 - POS.cloth[1]];
const TICK = { paste: 'gg', oil: 'ghee', herbs: 'mint' }; // heap name -> cookbook id, where they differ
const STATES = { start: 0, curd: 1, wet: 2, dry: 3, stir: 4, stirred: 5, board: 6, inbowl: 7, folded: 8, covered: 9 };
const clamp01 = (v) => Math.min(1, Math.max(0, v));

// Layer opacities for a stir progress mix in 0..1: the heaps and curd give way to swirls of colour, then to an even coat.
export function look(mix) {
  const m = clamp01(mix);
  return {
    dol: 1 - clamp01(m * 2),
    heap: 1 - clamp01(m * 1.6),
    swirl: clamp01(m * 4) * (1 - clamp01((m - 0.55) / 0.35)),
    coat: m * m * (3 - 2 * m), // smoothstep: pale at first, then deepening
    pool: 1 - clamp01((m - 0.6) * 2.5),
  };
}
// The chicken in the bowl: n of 4 pieces dropped in, fold 0..1 of the coating. Raw pieces fade out as the coated ones fade in.
export const chickenLook = (n, fold) => ({ raw: clamp01(n / 4) * (1 - clamp01(fold)), coated: clamp01(fold) });
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

export default {
  id: 'marinade',
  art: () => import('../art/marinade.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, ui, signal, params, wait } = ctx;
    audio.muffle(0); audio.stop('flame'); audio.stop('drone'); // a jump may leave the wait's hush or the end's drone behind
    const at = STATES[params.get('state')] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); fn(); }, ms); timers.add(t); return t; };
    const stopAll = () => { for (const t of timers) clearTimeout(t); timers.clear(); audio.level('mar-fold', 0, 0.2); audio.level('mar-fold-hi', 0, 0.2); };
    signal.addEventListener('abort', stopAll, { once: true });
    const $ = (s) => stage.$(s);
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    const frame = (want, span, x, y) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y);
    const run = (beat) => Promise.race([beat(), gone]);
    audio.bed('rain', 0.22);
    ui.ingredients('marinade');

    // ---- the picture, from a few numbers: dollops landed, stir progress, pieces in, fold progress ----
    let poured = 0, mix = 0, inBowl = 0, fold = 0;
    const landed = new Set();
    const paint = () => {
      const l = look(mix), c = chickenLook(inBowl, fold);
      $('#m-dols').style.opacity = l.dol;
      $('#m-heaps').style.opacity = l.heap;
      $('#m-swirlW').style.opacity = l.swirl;
      $('#m-coat').style.opacity = l.coat;
      $('#m-raw').style.opacity = c.raw;
      $('#m-coated').style.opacity = c.coated;
      const pool = $('#m-pool');
      pool.style.transform = `scale(${Math.min(1, 0.3 + 0.14 * poured + 0.5 * mix).toFixed(2)})`;
      pool.style.opacity = ([0, 0.55, 0.85, 1][poured] ?? 1) * l.pool;
      const top = $('#m-curdTop');
      top.style.transform = `scale(${(1 - 0.3 * poured).toFixed(2)})`;
      top.style.opacity = poured >= 3 ? 0.35 : 1;
    };
    const dols = [...stage.el.querySelectorAll('.m-dolW')];
    const heaps = Object.fromEntries(HEAPS.map((n) => [n, $(`.m-heapW[data-n="${n}"]`)]));

    // Stations take turns on the counter: fade the next in, the last out.
    const show = (id, now) => { const g = $(`#m-st-${id}`); g.style.display = ''; if (now) { g.style.transition = 'none'; g.style.opacity = '1'; } else later(() => { g.style.opacity = '1'; }, 30); };
    const hide = (id) => { const g = $(`#m-st-${id}`); g.style.opacity = '0'; later(() => { g.style.display = 'none'; }, 520); };
    const used = (id) => { const g = $(`#m-${id}`); g.style.transition = 'opacity .4s'; g.style.opacity = '0.3'; g.style.pointerEvents = 'none'; };

    const settle = (instantDol, names) => { // dev states: put things down without the animation
      for (let i = 0; i < instantDol; i++) dols[i].querySelector('.m-dol').style.opacity = '1';
      for (const n of names) { heaps[n].querySelector('.m-heap').style.opacity = '1'; landed.add(n); ui.tick(TICK[n] ?? n); }
      if (instantDol) ui.tick('curd');
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
      if (i === 0) ui.tick('curd');
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

    // ---- beats 2 and 3: things landing in the bowl ----
    const dust = (name) => {
      for (const d of [...$(`#m-dust-${name}`).querySelectorAll('.m-d')]) {
        const dx = +d.dataset.dx, dy = +d.dataset.dy;
        d.style.transformBox = 'fill-box'; d.style.transformOrigin = '50% 50%';
        d.animate([{ opacity: 0.85, transform: 'translate(0px, 0px) scale(.4)' }, { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(2.2)` }], { duration: 1100, easing: 'ease-out' });
      }
    };
    // One thing goes in: its heap lands in the bowl with a puff (or a glug), and the card ticks it.
    const land = (name, sound = 'mar-puff', delay = 160) => {
      if (landed.has(name)) return;
      landed.add(name);
      ui.tick(TICK[name] ?? name);
      later(() => {
        heaps[name].querySelector('.m-heap').classList.add('on');
        audio.hit(sound);
        dust(name);
      }, delay);
    };
    const hop = (id, to = [10, -16, 10]) => $(`#m-${id} .m-src`).animate([{ transform: 'translate(0px, 0px) rotate(0deg)' }, { transform: `translate(${to[0]}px, ${to[1]}px) rotate(${to[2]}deg)`, offset: 0.35 }, { transform: 'translate(0px, 0px) rotate(0deg)' }], { duration: 560, easing: 'ease-in-out' });
    // A tap source: it hops, its heap lands. A drag source (carry): follows the pointer along path, tips at the end.
    const tapSource = (id, label, heap, sound, then) => hotspot($(`#m-${id}`), {
      label, gesture: 'tap',
      step() { if (landed.has(heap)) return true; hop(id, id === 'oil' ? [-24, -34, -38] : [10, -16, 10]); land(heap, sound); then?.(); later(() => used(id), 600); return true; },
    }).done;
    const carry = (id, path, tilt, label, onTip) => {
      const host = $(`#m-${id}`), node = host.querySelector('.m-src');
      let p = 0, fired = false;
      const put = (v, ms) => { node.style.transition = ms ? `transform ${ms}ms ease-out` : 'none'; node.style.transform = `translate(${v * path[0]}px, ${v * path[1]}px) rotate(${v * tilt}deg)`; };
      const fin = () => {
        fired = true; put(1, 260);
        later(() => { onTip(); later(() => { put(0, 500); used(id); }, 700); }, 260);
        return true;
      };
      return hotspot(host, {
        label, gesture: { drag: path },
        step: fin,
        drag({ dx, dy }) { p = along(p, dx, dy, path); put(p, 0); if (p >= 0.85) return fin(); },
        release() { if (!fired && p > 0) { p *= 0.6; put(p, 250); } },
      }).done;
    };

    const make = (markup) => { const t = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); t.innerHTML = markup; return t.firstElementChild; };
    const wetBeat = async () => {
      const lemonSqueeze = () => { // a thin ribbon of juice from the half to the bowl
        const [x, y] = POS.lemon, [tx, ty] = SLOT.lemon;
        const s = make(`<path d="M${x} ${y + 24}Q${x + 6} ${(y + ty) / 2} ${tx} ${ty - 6}" fill="none" stroke="#F6E36A" stroke-width="5" stroke-linecap="round"/>`);
        $('#m-st-wet').append(s);
        s.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 0 }], { duration: 700 }).finished.then(() => s.remove(), () => {});
      };
      voice.say('marinade.wet');
      await Promise.all([
        tapSource('paste', 'add the ginger-garlic paste', 'paste', 'mar-puff'),
        carry('lemon', [-10, 105], -50, 'squeeze the lemon in', () => { lemonSqueeze(); land('lemon', 'mar-pour', 250); }),
        tapSource('oil', 'pour the oil in', 'oil', 'mar-pour'),
      ]);
    };

    const dryBeat = async () => {
      voice.say('marinade.dry');
      const tipTray = () => {
        TRAY.forEach((n, i) => land(n, 'mar-puff', 100 + i * 140));
        later(() => voice.say('marinade.fresh'), 1000);
      };
      await Promise.all([
        carry('tray', [90, 150], 28, 'tip the spices in', tipTray),
        carry('birista', [-125, 170], 30, 'crush the fried onions in', () => land('birista', 'mar-puff', 250)),
        tapSource('herbs', 'add the mint and coriander', 'herbs', 'mar-puff'),
        tapSource('greenchilli', 'add the green chilli', 'greenchilli', 'mar-puff'),
      ]);
    };

    // ---- beats 4 and 6: stir the paste, fold in the chicken (the same spoon, the same circles) ----
    const spoonEl = $('#m-spoon'), spr = spoonEl.querySelector('.m-spr'), swirl = $('#m-swirl');
    spoonEl.style.opacity = '0'; spoonEl.style.transition = 'transform .8s cubic-bezier(.3,.9,.3,1), opacity .5s';
    let angle = -0.6, turns = 0;
    const spoonAt = (a, ms) => {
      spoonEl.style.transition = ms ? `transform ${ms}ms ease-out, opacity .5s` : 'opacity .5s';
      spoonEl.style.transform = `translate(${(IN.cx + 0.5 * IN.rx * Math.cos(a)).toFixed(1)}px, ${(IN.cy + 0.55 * IN.ry * Math.sin(a) + 8).toFixed(1)}px)`;
      swirl.style.transform = `rotate(${(a * 57.3).toFixed(1)}deg)`;
    };
    // total: turns that finish it; apply(t) paints progress t in 0..1; the spoon goes in if it is not already there.
    const stirBeat = (total, apply, label) => new Promise((resolve) => {
      turns = 0;
      spoonEl.style.opacity = '1';
      spr.style.transform = 'rotate(-70deg)';
      spoonAt(angle, 800);
      let quiet = 0;
      const sound = (speed) => {
        audio.level('mar-fold', Math.min(0.75, 0.12 + speed / 800), 0.06);
        audio.level('mar-fold-hi', clamp01((speed - 250) / 900) * 0.6, 0.06);
        clearTimeout(quiet);
        quiet = setTimeout(() => { audio.level('mar-fold', 0, 0.25); audio.level('mar-fold-hi', 0, 0.25); }, 170);
      };
      const check = () => { apply(clamp01(turns / total)); if (turns < total - 1e-6) return false; apply(1); audio.level('mar-fold', 0, 0.3); audio.level('mar-fold-hi', 0, 0.3); return true; };
      const spot = hotspot($('#m-stir'), {
        label,
        tool: 'spoon',
        gesture: 'circle',
        step() {
          turns += 0.25; angle += Math.PI / 2;
          spoonAt(angle, 260);
          sound(500); later(() => { audio.level('mar-fold', 0, 0.2); audio.level('mar-fold-hi', 0, 0.2); }, 320);
          return check();
        },
        drag({ x, y, speed }) {
          const s = stirStep(angle, turns, x, y);
          if (s.turns === turns) return;
          angle = s.angle; turns = s.turns;
          spoonAt(angle, 0);
          sound(speed);
          return check();
        },
        release() { audio.level('mar-fold', 0, 0.25); audio.level('mar-fold-hi', 0, 0.25); },
      });
      spot.done.then(() => { clearTimeout(quiet); resolve(); });
    });

    // ---- beat 5: the chicken on the board, gashed, then into the bowl ----
    const cutBeat = () => Promise.all(BP.map(([x, y], i) => new Promise((resolve) => {
      const node = $(`#m-bp${i}`);
      let acc = 0, cut = false;
      const gash = () => {
        if (cut) return true;
        cut = true;
        const knife = $('#m-knife');
        knife.animate([{ transform: `translate(${x + 100}px, ${y - 34}px) rotate(-6deg)`, opacity: 0 }, { transform: `translate(${x + 70}px, ${y - 24}px) rotate(-6deg)`, opacity: 1, offset: 0.2 },
          { transform: `translate(${x + 10}px, ${y + 14}px) rotate(4deg)`, opacity: 1, offset: 0.8 }, { transform: `translate(${x}px, ${y + 20}px) rotate(4deg)`, opacity: 0 }], { duration: 760, easing: 'ease-in-out' });
        const marks = [...node.querySelectorAll('.m-gash')];
        for (let g = 0; g < 3; g++) later(() => { audio.hit('mar-cut'); for (const m of marks.slice(g * 2, g * 2 + 2)) m.style.opacity = '1'; }, 140 + g * 200);
        later(resolve, 800);
        return true;
      };
      hotspot(node, {
        label: 'cut gashes in the chicken',
        gesture: { drag: [90, 14] },
        step: gash,
        drag({ dx, dy }) { acc += Math.hypot(dx, dy); if (acc > 70) return gash(); },
        release() { acc = 0; },
      });
    })));
    const dropBeat = () => Promise.all(BP.map(([x, y], i) => new Promise((resolve) => {
      const node = $(`#m-bp${i}`);
      const to = [IN.cx - x + (i - 1.5) * 26, IN.cy - 14 - y + (i % 2) * 12];
      let ox = 0, oy = 0, dropped = false;
      const move = (a, b, ms) => { node.style.transition = ms ? `transform ${ms}ms ease-out, opacity .3s` : 'none'; node.style.transform = `translate(${a}px, ${b}px)`; };
      const drop = () => {
        if (dropped) return true;
        dropped = true;
        move(to[0], to[1], 320);
        later(() => { node.style.opacity = '0'; inBowl++; paint(); audio.hit('mar-plop'); if (inBowl === 1) ui.tick('chicken'); resolve(); }, 330);
        return true;
      };
      hotspot(node, {
        label: 'put the chicken in the bowl',
        gesture: { drag: to },
        step: drop,
        drag({ dx, dy }) { ox += dx; oy += dy; move(ox, oy, 0); if (Math.hypot(ox - to[0], oy - to[1]) < 60) return drop(); },
        release() { if (!dropped) { ox = oy = 0; move(0, 0, 350); } },
      });
    })));

    // ---- beat 7: the cloth ----
    const coverBeat = () => new Promise((resolve) => {
      $('#m-clothW').style.display = '';
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
        voice.say('marinade.fridge');
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
    if (at >= 1) settle(3, at >= 3 ? HEAPS : at >= 2 ? ['paste', 'lemon', 'oil'] : []);
    if (at >= 4) { turns = at === 4 ? 2 : TURNS; mix = clamp01(turns / TURNS); angle = 0.4; }
    if (at >= 7) { inBowl = 4; ui.tick('chicken'); }
    if (at >= 8) fold = 1;
    paint();
    if (at >= 4) { spr.style.transform = 'rotate(-70deg)'; spoonAt(angle, 0); spoonEl.style.opacity = '1'; }
    if (at >= 1) { const c = $('#m-st-curd'); c.style.display = 'none'; c.style.opacity = '0'; }
    if (at >= 9) {
      spoonEl.style.opacity = '0';
      const dr = $('#m-drape'); dr.style.opacity = '1'; dr.style.transform = 'scale(1)';
      $('#m-dimR').style.opacity = '0.5';
    }
    frame(1.25, 480, 800, 470);
    if (at === 0) voice.say('marinade.curd'); // over the action; the bowl is ready at once

    // ---- the flow ----
    if (at === 0) {
      await run(curdBeat);
      if (signal.aborted) return;
      voice.say('marinade.whyCurd');
      hide('curd'); show('wet');
      await wait(700);
    }
    if (at <= 1) { // at 1 the wet station is not yet shown
      if (at === 1) show('wet', true);
      await run(wetBeat);
      if (signal.aborted) return;
      await wait(900); hide('wet'); show('dry');
      await wait(600);
    }
    if (at <= 2) {
      if (at === 2) show('dry', true);
      await run(dryBeat);
      if (signal.aborted) return;
      await wait(1800); hide('dry');
    }
    if (at <= 4) {
      if (at !== 4) voice.say('marinade.stir');
      await run(() => stirBeat(TURNS, (t) => { mix = t; paint(); }, 'stir it in'));
      if (signal.aborted) return;
      voice.say('marinade.taste');
      await wait(2200);
    }
    if (at <= 6) {
      show('chk', at >= 5); await wait(600); voice.say('marinade.chicken');
      await run(cutBeat);
      if (signal.aborted) return;
      voice.say('marinade.whyGash');
      await wait(900);
      await run(dropBeat);
      if (signal.aborted) return;
      hide('chk');
    }
    if (at <= 7) {
      voice.say('marinade.coat');
      await run(() => stirBeat(FOLD_TURNS, (t) => { fold = t; paint(); }, 'fold the chicken in'));
      if (signal.aborted) return;
      await wait(500);
    }
    if (at <= 8) {
      await run(coverBeat);
      if (signal.aborted) return;
      await wait(3200);
      return;
    }
    await gone; // covered: hold
  },
};
