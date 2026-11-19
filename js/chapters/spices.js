// Chapter I, The Spices. Close shot on the counter at dusk. Beats: (1) four powders for the marinade: drag the spoon from
// a dabba bowl to tray 1 (or tap): a heaped spoon of that colour tips into its own pile, sized by the amount;
// (2) the whole spices for the rice water: tap a jar and one piece drops on tray 2 (cardamom and cloves four times,
// with a count; the others once). Any order inside a beat. Nothing can be failed. Amounts come from data/cookbook.js.
//
// ?state= (dev, for screenshots; the chapter plays on from there. done holds):
//   start    nothing measured (also the default)
//   powders  the four powders on tray 1, the jars waiting
//   whole    plus 4 cardamom, 4 cloves and the bay leaf; cinnamon, shahi jeera and mace waiting
//   done     everything measured
// Hotspots: #sp-b-<powder> (drag to the tray, or tap), #sp-j-<whole> (tap).
import '../sound/spices.js';
import { POWDERS, WHOLE, COUNT, BOWL, PILE, SLOT, JAR, SPOON_S, SLIDE } from '../art/spices-ch.js';

export { POWDERS, WHOLE, COUNT };
const clamp01 = (v) => Math.min(1, Math.max(0, v));
// Progress along a drag path, from a pointer move (dx, dy) in world units.
export const along = (p, dx, dy, [px, py]) => clamp01(p + (dx * px + dy * py) / (px ** 2 + py ** 2));
// One tap on a counted jar: the count goes up to the need and no further.
export const bump = (n, need) => ({ n: Math.min(need, n + 1), full: n + 1 >= need, added: n < need });
const STATES = { start: 0, powders: 1, whole: 2, done: 3 };
const HALF = ['cardamom', 'clove', 'bayleaf'];
const NAME = { cardamom: 'cardamom', clove: 'cloves' };

export default {
  id: 'spices',
  art: () => import('../art/spices-ch.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params, wait, ui } = ctx;
    audio.muffle(0); audio.stop('flame'); audio.stop('drone');
    const at = STATES[params.get('state')] ?? 0;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const timers = new Set();
    const later = (fn, ms) => { const t = setTimeout(() => { timers.delete(t); if (!signal.aborted) fn(); }, ms); timers.add(t); return t; };
    signal.addEventListener('abort', () => { for (const t of timers) clearTimeout(t); timers.clear(); }, { once: true });
    const $ = (s) => stage.$(s);
    const $$ = (s) => [...stage.el.querySelectorAll(s)];
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    const frame = (want, span, x, y) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y);
    audio.bed('rain', 0.22);
    const tick = (id) => ui?.tick?.(id);

    // ---- beat 1: the powders ----
    const landed = new Set();
    const T = (x, y, r, s) => `translate(${x}px, ${y}px) rotate(${r}deg) scale(${s})`;
    const land = (id, instant) => {
      if (landed.has(id)) return;
      landed.add(id);
      const pile = $(`.sp-pile[data-id="${id}"]`);
      $(`#sp-b-${id} .sp-bm`).style.transform = 'scale(.82)';
      tick(id);
      if (instant) { pile.style.opacity = '1'; return; }
      pile.classList.add('on');
      audio.hit('sp-puff');
      for (const d of $$(`#sp-dust-${id} .sp-d`)) { // the visual twin of the puff
        const dx = +d.dataset.dx, dy = +d.dataset.dy;
        d.style.transformBox = 'fill-box'; d.style.transformOrigin = '50% 50%';
        d.animate([{ opacity: 0.85, transform: 'translate(0px, 0px) scale(.4)' }, { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(2.2)` }], { duration: 1100, easing: 'ease-out' });
      }
      voice.say(`spices.${id}`);
    };
    // the spoon carries a heap from (fx, fy) to the pile, tips, and goes
    const deliver = (id, fx, fy, ms) => {
      const sp = $(`#sp-spoon-${id}`), [tx, ty] = PILE[id], s = SPOON_S[id];
      const my = Math.min(fy, ty) - 46;
      sp.animate([
        { transform: T(fx, fy, -8, s), opacity: 1 },
        { transform: T((fx + tx) / 2, my, -14, s), opacity: 1, offset: 0.45 },
        { transform: T(tx, ty - 14, -10, s), opacity: 1, offset: 0.72 },
        { transform: T(tx, ty - 14, -40, s), opacity: 1, offset: 0.86 },
        { transform: T(tx, ty - 14, -40, s), opacity: 0 },
      ], { duration: ms, easing: 'ease-in-out' });
      sp.querySelector('.sp-heap').animate([{ opacity: 1 }, { opacity: 1, offset: 0.72 }, { opacity: 0, offset: 0.8 }, { opacity: 0 }], { duration: ms });
      later(() => land(id), ms * 0.74);
    };
    const powdersBeat = () => new Promise((resolve) => {
      const check = () => { if (landed.size === POWDERS.length) { voice.say('spices.powders'); later(resolve, 1400); } };
      for (const id of POWDERS) {
        if (landed.has(id)) continue;
        const [bx, by] = BOWL[id], [tx, ty] = PILE[id], path = [tx - bx, ty - by - 8];
        const sp = $(`#sp-spoon-${id}`), s = SPOON_S[id];
        let p = 0, sent = false;
        const sendNow = (fx, fy, ms) => { sent = true; deliver(id, fx, fy, ms); later(check, ms * 0.74 + 20); return true; };
        hotspot($(`#sp-b-${id}`), {
          label: `scoop ${id}`,
          goal: 'scoop each powder onto the tray',
          gesture: { drag: path },
          step() {
            if (sent) return true;
            audio.hit('sp-tap');
            return sendNow(bx, by, 1300);
          },
          drag({ dx, dy, first }) {
            if (sent) return true;
            if (first) audio.hit('sp-tap');
            p = along(p, dx, dy, path);
            const x = bx + path[0] * p, y = by + path[1] * p - 46 * Math.sin(Math.PI * p);
            sp.style.transition = 'none'; sp.style.opacity = '1'; sp.style.transform = T(x, y, -8, s);
            if (p >= 0.85) { sp.style.opacity = '0'; return sendNow(x, y, 600); }
          },
          release() {
            if (sent) return;
            sp.style.transition = 'opacity .25s'; sp.style.opacity = '0'; p = 0;
          },
        });
      }
    });

    // ---- beat 2: the whole spices ----
    const counts = {};
    const place = (id, i, instant) => {
      const it = $(`.sp-it[data-id="${id}"][data-i="${i}"]`);
      it.style.opacity = '1';
      if (instant) return;
      const [sx, sy] = SLOT[id][i], [jx, jy] = JAR[id];
      const dx = jx - sx, dy = jy - 70 - sy;
      it.animate([
        { opacity: 0, transform: `translate(${dx}px, ${dy}px) scale(1.3)` },
        { opacity: 1, transform: `translate(${dx * 0.7}px, ${dy * 0.7 - 40}px) scale(1.2)`, offset: 0.15 },
        { transform: `translate(${dx * 0.2}px, ${dy * 0.2 - 30}px) scale(1.05)`, offset: 0.55 },
        { transform: 'translate(0px, 6px) scale(.96, 1.08)', offset: 0.8 },
        { transform: 'translate(0px, -5px)', offset: 0.9 },
        { opacity: 1, transform: 'none' },
      ], { duration: 640, easing: 'ease-in' });
      later(() => audio.hit('sp-click'), 640 * 0.78);
    };
    const count = (id) => {
      const el = $(`#sp-cnt-${id}`), n = counts[id] ?? 0;
      el.textContent = `${NAME[id]} ${n} of ${COUNT[id]}`;
      el.style.opacity = n >= COUNT[id] ? '1' : '0.85';
    };
    const nudge = (id) => $(`#sp-j-${id} .sp-jb`).animate([{ transform: 'translateY(0)' }, { transform: 'translateY(-9px)', offset: 0.35 }, { transform: 'translateY(0)' }], { duration: 380, easing: 'ease-out' });
    let first = true;
    const wholeBeat = () => new Promise((resolve) => {
      const finished = new Set();
      const complete = (id, instant) => {
        finished.add(id);
        tick(id);
        if (!instant) voice.say(`spices.${id}`);
        if (!instant && finished.size === WHOLE.length) later(resolve, 800);
        return true;
      };
      for (const id of WHOLE) {
        const need = COUNT[id] ?? 1;
        if ((counts[id] ?? 0) >= need) { finished.add(id); continue; }
        hotspot($(`#sp-j-${id}`), {
          label: need > 1 ? `drop a ${id === 'clove' ? 'clove' : 'cardamom pod'}` : `add the ${{ bayleaf: 'bay leaf', shahijeera: 'shahi jeera' }[id] ?? id}`,
          goal: 'add each whole spice to the tray',
          gesture: 'tap',
          step() {
            const c = bump(counts[id] ?? 0, need);
            if (!c.added) return true;
            nudge(id);
            place(id, counts[id] ?? 0);
            counts[id] = c.n;
            if (need > 1) count(id);
            if (first) { first = false; voice.say('spices.whyWhole'); }
            return c.full && complete(id);
          },
        });
      }
      if (finished.size === WHOLE.length) resolve();
    });

    // The two groups take turns in the centre column (phones cannot pan): A slides out left, B in from the right.
    const gA = $('#sp-gA'), gB = $('#sp-gB');
    const slide = (toB, instant) => {
      const tr = instant || ctx.calm() ? 'none' : 'transform 1.1s cubic-bezier(.5,0,.2,1)';
      gA.style.transition = gB.style.transition = tr;
      gA.style.transform = toB ? `translate(${-SLIDE}px, 0)` : 'none';
      gB.style.transform = toB ? 'none' : `translate(${SLIDE}px, 0)`;
    };

    // ---- start state ----
    if (at >= 1) { ui?.ingredients?.('marinade', POWDERS); for (const id of POWDERS) land(id, true); }
    if (at >= 2) {
      ui?.ingredients?.('rice');
      const ids = at >= 3 ? WHOLE : HALF;
      for (const id of ids) {
        const need = COUNT[id] ?? 1;
        for (let i = 0; i < need; i++) place(id, i, true);
        counts[id] = need;
        if (COUNT[id]) count(id);
        tick(id);
      }
    }
    if (at >= 2) slide(true, true); // 'powders' stays on tray 1 for a moment, then the flow slides across
    frame(1.5, 400, 800, 560);
    if (at >= 3) { await gone; return; }

    // ---- the flow ----
    if (at === 0) {
      ui?.ingredients?.('marinade', POWDERS);
      voice.say('spices.intro');
      await Promise.race([powdersBeat(), gone]);
      if (signal.aborted) return;
      await wait(600);
    }
    if (at <= 1) {
      if (at === 1) await Promise.race([wait(2500), gone]);
      if (signal.aborted) return;
      ui?.ingredients?.('rice');
      slide(true);
      voice.say('spices.whole');
    }
    await Promise.race([wholeBeat(), gone]);
    if (signal.aborted) return;
    voice.say('spices.done');
    await wait(3500);
  },
};
