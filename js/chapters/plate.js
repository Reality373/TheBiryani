// Chapter XII, The Plate. Close: the plate of biryani on the table, the opened handi behind it, salan and dahi beside.
// Six bites, each its own gesture: (1) drag from the mound's right edge into the spoon; (2) tap the chicken to break it
// onto the spoon; (3) sweep rice, chicken and an onion curl together (a circling drag); (4) drag the spoon to the dahi
// and dip; (5) hold the serving spoon over the plate for a second helping; (6) sweep what is left into one spoonful.
// After each gathered bite the spoon lifts toward the viewer, the mound shrinks by a portion, and the voice lines start;
// the next bite is touchable at once. planEggs picks one or two bites (2 to 5) that hide a whole spice on the spoon.
//
// ?state= (dev, for screenshots; sets the plate up at that point and plays on from there):
//   start (default) before bite 1      b2 .. b6  before that bite      empty  after bite 6 (held)
//   loaded  bite 3's spoon full, held before it lifts (add ?egg=<spice id> to show the spice on it)
// ?egg=<spice id>  forces that spice onto the next bite (bite 1 at start; for loaded, the spoon shown)
// Hotspots: #pl-h1 (drag along the path to the spoon), #pl-h2 (tap), #pl-h3 (circle), #pl-h4s the spoon and #pl-dahi
// the bowl (drag [40, -146] / tap), #pl-ss the serving spoon (hold), #pl-h6 (circle).
import '../sound/plate.js';
import { planEggs } from '../data/eggs.js';
import { spices } from '../data/spices.js';

const EATEN = [0, 1, 2, 3, 4, 4, 5]; // portions gone after n bites
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// Progress 0..1 along a path (a drag vector) after a pointer move of (dx, dy): the projection onto the path.
export const along = (p, dx, dy, path) => clamp01(p + (dx * path[0] + dy * path[1]) / (path[0] ** 2 + path[1] ** 2));
// Signed angle (radians) swept round (cx, cy) by a pointer move from a to b.
export function arcAngle(ax, ay, bx, by, cx, cy) {
  const d = Math.atan2(by - cy, bx - cx) - Math.atan2(ay - cy, ax - cx);
  return d > Math.PI ? d - 2 * Math.PI : d < -Math.PI ? d + 2 * Math.PI : d;
}
export const stateAfter = (n) => ({ eaten: EATEN[Math.min(6, Math.max(0, n))], c0: n >= 2, refill: n === 5 });
export const BITS = { start: 0, b2: 1, b3: 2, b4: 3, b5: 4, b6: 5, empty: 6 };

const NS = 'http://www.w3.org/2000/svg';

export default {
  id: 'plate',
  art: () => import('../art/plate.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, prefs, signal, params, auto } = ctx;
    audio.muffle(0); audio.stop('flame'); audio.stop('drone'); audio.bed('rain', 0.25); // a jump may leave the wait's hush or the end's drone behind
    const A = await import('../art/plate.js');
    const { rest, flank, chicken0, dahi, center } = A.LAY;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const wait = (ms) => ctx.wait(ms);
    const P = (s) => stage.$(s);
    const plateEl = P('#pl-plate'), sp = P('#pl-sp'), spm = sp.querySelector('.pl-spm'), fx = P('#pl-fx');
    const state = params.get('state');
    const done0 = BITS[state] ?? (state === 'loaded' ? 2 : 0);
    signal.addEventListener('abort', () => audio.level('plate-pour', 0, 0.2), { once: true });

    const frame = (want, span, x, y, ms = 1600) => {
      const k = Math.max(innerWidth / 1600, innerHeight / 1000);
      return stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k * span))), x, y, ms);
    };

    // The spices: planEggs picks the bites; ?egg forces one on the first bite played.
    const egg = params.get('egg');
    const plan = planEggs(spices, 6);
    if (spices.some((s) => s.id === egg)) { plan.fill(null); plan[done0] = egg; }

    // ---- state ----
    let mv = { x: 0, y: 0 };
    const setEaten = (n) => { plateEl.dataset.eaten = String(n); };
    const apply = (n) => {
      const s = stateAfter(n);
      setEaten(s.eaten);
      plateEl.dataset.c0 = s.c0 ? '1' : '0';
      plateEl.dataset.refill = s.refill ? '1' : '0';
    };
    const has = (tokens, g) => { sp.dataset.has = tokens; if (g !== undefined) sp.style.setProperty('--g', String(g)); };
    const move = (x, y, live) => { // the spoon's offset from its rest, in world units
      mv = { x, y };
      spm.classList.toggle('live', !!live);
      spm.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
    };
    const tween = (a, b, ms, fn) => new Promise((resolve) => {
      if (auto || ms <= 0) { fn(b); resolve(); return; }
      const t0 = performance.now();
      const tick = (t) => {
        const u = clamp01((t - t0) / ms);
        fn(a + (b - a) * u);
        if (u < 1 && !signal.aborted) requestAnimationFrame(tick); else resolve();
      };
      requestAnimationFrame(tick);
    });
    // A few grains arc from a to b: the visual twin of the rustle.
    const fly = (a, b, n = 7) => {
      for (let i = 0; i < n; i++) {
        const u = document.createElementNS(NS, 'use');
        u.setAttribute('href', `#n-g${i % 4}`);
        u.setAttribute('fill', i % 3 ? '#F6EBD3' : '#F2A516');
        fx.append(u);
        const j = (i % 3) * 10 - 10;
        const an = u.animate([
          { transform: `translate(${a.x}px,${a.y}px) rotate(0deg)`, opacity: 1 },
          { transform: `translate(${(a.x + b.x) / 2 + j}px,${(a.y + b.y) / 2 - 34}px) rotate(180deg)`, opacity: 1, offset: 0.5 },
          { transform: `translate(${b.x}px,${b.y}px) rotate(360deg)`, opacity: 0 },
        ], { duration: 450 + i * 30, delay: i * 35, easing: 'ease-in-out', fill: 'both' });
        an.finished.then(() => u.remove(), () => u.remove());
      }
    };
    let lastScoop = 0;
    const rustle = () => { const t = performance.now(); if (t - lastScoop > 160) { lastScoop = t; audio.hit('plate-scoop'); } };

    // ---- the lift: a copy of the loaded spoon rises toward the viewer, and a fresh empty one fades in ----
    const lift = () => {
      const g = sp.cloneNode(true);
      g.removeAttribute('id');
      g.querySelectorAll('[id]').forEach((n) => n.removeAttribute('id'));
      g.querySelectorAll('.hotspot').forEach((n) => { n.classList.remove('hotspot'); n.removeAttribute('role'); n.removeAttribute('tabindex'); });
      g.setAttribute('aria-hidden', 'true');
      g.style.pointerEvents = 'none';
      g.style.transformOrigin = `${rest.x + mv.x}px ${rest.y + mv.y}px`;
      sp.after(g);
      const an = g.animate([
        { transform: 'translate(0px,0px) scale(1)', opacity: 1 },
        { transform: 'translate(-20px,-120px) scale(2.2)', opacity: 1, offset: 0.55 },
        { transform: 'translate(-30px,-240px) scale(3.8)', opacity: 0 },
      ], { duration: 1100, easing: 'cubic-bezier(.3,.1,.2,1)', fill: 'forwards' });
      an.finished.then(() => g.remove(), () => g.remove());
      audio.hit('spoon');
      move(0, 0, true);
      has('', 0);
      sp.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 500, delay: 650, fill: 'backwards' });
    };

    const showSpice = (id) => {
      P('.b-spice').innerHTML = A.spiceMarkup(id);
      has(`${sp.dataset.has} spice`);
      audio.hit('plate-sting');
      P('.b-ring').animate([{ transform: 'scale(.5)', opacity: 0.9 }, { transform: 'scale(2.4)', opacity: 0 }],
        { duration: 750, easing: 'ease-out' });
      const found = prefs.get('spices');
      if (!found.includes(id)) prefs.set('spices', [...found, id]);
    };
    const sayAll = (ids) => { for (const id of ids) voice.say(`plate.${id}`); };

    // A gathered bite is done: the mound loses a portion, a spice may show on the spoon, then the spoon lifts and the lines start.
    async function finishBite(i, lines, eaten) {
      setEaten(eaten);
      const e = plan[i];
      if (e) { showSpice(e); await wait(900); } else await wait(260);
      if (signal.aborted) return;
      lift();
      sayAll(lines);
      if (e) sayAll(spices.find((s) => s.id === e).say.map((_, n) => `sp_${e}_${n}`));
    }

    // ---- bite 1: rice from the mound's edge into the spoon ----
    const bite1 = () => new Promise((resolve) => {
      const path = [rest.x - flank.x, rest.y - flank.y];
      let p = 0, fin = null;
      const show = (v) => { p = v; has(v > 0.2 ? 'hot' : '', v.toFixed(3)); };
      const complete = () => { fly(flank, rest, 9); audio.hit('plate-scoop'); return finishBite(0, ['b1a', 'b1b'], 1); };
      const spot = hotspot(P('#pl-h1'), {
        label: 'gather the rice', gesture: { drag: path },
        step() { fin = tween(p, 1, 350, show).then(complete); return true; },
        drag({ dx, dy }) {
          show(along(p, dx, dy, path));
          rustle();
          if (p < 0.95) return;
          show(1); fin = complete(); return true;
        },
      });
      spot.done.then(() => fin).then(resolve);
    });

    // ---- bite 2: tap the chicken to break it ----
    const bite2 = () => new Promise((resolve) => {
      let fin = null;
      const spot = hotspot(P('#pl-h2'), {
        label: 'break the chicken', gesture: 'tap',
        step() {
          fin = (async () => {
            audio.hit('plate-tear');
            P('.c0a').animate([{ transform: 'translate(0,0)' }, { transform: 'translate(-3px,2px) rotate(-3deg)' }, { transform: 'translate(3px,-2px) rotate(2deg)' }, { transform: 'translate(0,0)' }],
              { duration: 220 });
            await wait(200);
            plateEl.dataset.c0 = '1';
            const chunk = P('#pl-chunk'), to = { x: rest.x - 4, y: rest.y - 14 };
            const an = chunk.animate([
              { transform: `translate(${chicken0.x}px,${chicken0.y}px) scale(1.2)`, opacity: 1 },
              { transform: `translate(${(chicken0.x + to.x) / 2}px,${chicken0.y - 60}px) scale(1) rotate(60deg)`, opacity: 1, offset: 0.5 },
              { transform: `translate(${to.x}px,${to.y}px) scale(.8) rotate(10deg)`, opacity: 1 },
            ], { duration: 480, easing: 'ease-in', fill: 'forwards' });
            await wait(480);
            an.cancel();
            has('chk hot', 0);
            await finishBite(1, ['b2a', 'b2b'], 2);
          })();
          return true;
        },
      });
      spot.done.then(() => fin).then(resolve);
    });

    // ---- bites 3 and 6: sweep it together (a circling drag, or a tap) ----
    const sweepBite = ({ hit, label, need, steps, i, lines, eaten, from }) => new Promise((resolve) => {
      let swept = 0, fin = null;
      const load = (p) => {
        const tk = ['hot']; for (const [at, t] of steps) if (p >= at) tk.push(t);
        has(tk.join(' '), clamp01(p * 3).toFixed(3));
      };
      const complete = () => { load(1); fly(from, rest, 10); audio.hit('plate-scoop'); return finishBite(i, lines, eaten); };
      const spot = hotspot(P(hit), {
        label, gesture: 'circle',
        step() {
          move(from.x - rest.x, from.y - rest.y, false);
          fin = wait(380).then(() => { rustle(); return complete(); });
          return true;
        },
        drag({ x, y, dx, dy }) {
          swept += Math.abs(arcAngle(x - dx, y - dy, x, y, from.x, from.y));
          move(x - rest.x, y - rest.y, true);
          rustle();
          const p = clamp01(swept / need);
          load(p);
          if (p < 1) return;
          fin = complete(); return true;
        },
      });
      spot.done.then(() => fin).then(resolve);
    });

    // ---- bite 4: dip the spoon in the dahi ----
    const bite4 = () => new Promise((resolve) => {
      const path = [dahi.x - rest.x, dahi.y - rest.y];
      has('rice hot', 0.55); // a spoon of rice, ready for the dahi
      let p = 0, fin = null, started = false;
      const dip = async (tap) => {
        if (started) return fin;
        started = true;
        move(path[0], path[1], false);
        if (tap) await wait(380);
        audio.hit('plate-plop');
        P('.pl-ripple').animate([{ transform: 'scale(.4)', opacity: 0.9 }, { transform: 'scale(1.4)', opacity: 0 }],
          { duration: 700, easing: 'ease-out' });
        has('rice dahi', 0.55);
        await wait(450);
        return finishBite(3, ['b4a', 'b4b'], 4);
      };
      const a = hotspot(P('#pl-h4s'), {
        label: 'dip it in the dahi', gesture: { drag: path },
        step() { fin = dip(true); return true; },
        drag({ dx, dy }) {
          p = along(p, dx, dy, path);
          move(path[0] * p, path[1] * p, true);
          if (p < 0.92) return;
          fin = dip(false); return true;
        },
      });
      const b = hotspot(P('#pl-dahi'), { label: 'dip in the dahi', gesture: 'tap', step() { fin = dip(true); return true; } });
      Promise.race([a.done, b.done]).then(() => { a.finish(); b.finish(); return fin; }).then(resolve);
    });

    // ---- bite 5: hold the serving spoon over the plate ----
    const bite5 = () => new Promise((resolve) => {
      const T = P('.pl-ssT');
      let p = 0, fin = null, said = false;
      const place = (v, ms, extra = 0) => {
        T.style.transition = ms ? `transform ${ms}ms cubic-bezier(.4,0,.2,1)` : 'none';
        T.style.transform = `translate(${(8 * v).toFixed(1)}px, ${(172 * v).toFixed(1)}px) rotate(${(-30 * v - extra).toFixed(1)}deg)`;
      };
      const pour = async () => {
        audio.level('plate-pour', 0.5, 0.1);
        place(1, 350, 22);
        fly({ x: 806, y: 520 }, { x: 800, y: 600 }, 12);
        plateEl.dataset.refill = '1';
        await wait(900);
        audio.level('plate-pour', 0, 0.4);
        place(0, 900);
        audio.hit('plate-plop');
      };
      const say = () => { if (!said) { said = true; sayAll(['b5a']); } };
      const spot = hotspot(P('#pl-ss'), {
        label: 'hold for a second helping', gesture: 'hold',
        step() { say(); fin = pour(); return true; },
        hold(dt) {
          say();
          p = clamp01(p + dt / 1.1);
          place(p, 0);
          audio.level('plate-pour', p > 0.7 ? 0.35 : 0, 0.1);
          if (p < 1) return;
          fin = pour(); return true;
        },
        release() { audio.level('plate-pour', 0, 0.2); },
      });
      spot.done.then(() => fin).then(resolve);
    });

    // ---- the flow ----
    apply(done0);
    if (state === 'empty') { frame(1.3, 700, 830, 570, 0); await gone; return; }
    if (state === 'loaded') {
      frame(1.3, 700, 830, 570, 0);
      move(center.x - rest.x, 575 - rest.y, false);
      has('hot chk onion', 1);
      if (spices.some((s) => s.id === egg)) { plan.fill(null); P('.b-spice').innerHTML = A.spiceMarkup(egg); has('hot chk onion spice', 1); }
      sp.style.transformOrigin = `${center.x}px 575px`; // dev view: the spoon mid-lift, close to the viewer
      sp.style.transform = 'translate(0px,-60px) scale(2.4)';
      await gone;
      return;
    }
    const at = done0;
    const bites = [
      () => { frame(1.3, 700, 830, 570); return bite1(); },
      () => { frame(1.3, 700, 800, 570); return bite2(); },
      () => { frame(1.3, 700, 830, 570); return sweepBite({ hit: '#pl-h3', label: 'sweep it together', need: Math.PI * 1.5, steps: [[0.4, 'chk'], [0.7, 'onion']], i: 2, lines: ['b3a'], eaten: 3, from: { x: 800, y: 575 } }); },
      () => { frame(1.25, 600, 940, 560); return bite4(); },
      () => { frame(1.1, 800, 800, 470); return bite5(); },
      () => { frame(1.3, 700, 830, 570); return sweepBite({ hit: '#pl-h6', label: 'gather what is left', need: Math.PI * 1.2, steps: [[0.5, 'chk'], [0.8, 'onion']], i: 5, lines: ['b6a', 'b6b'], eaten: 5, from: { x: 800, y: 625 } }); },
    ];
    for (let n = at; n < bites.length; n++) {
      await Promise.race([bites[n](), gone]);
      if (signal.aborted) return;
    }
    await wait(2800); // the last spoon rises over a nearly clean plate
  },
};
