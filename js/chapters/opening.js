// Chapter XI, The Opening. Room, then into the pot. Beats: (1) drag along the dough to crack the seal: the cracks open
// where the finger has been and crumbs fall with each one; (2) drag the lid up: steam leaks at the gap, then the burst
// (the room opens up, one chime); (3) the close shot into the pot; (4) serve: drag the big spoon down the side and let
// go, and it comes up full (rice from the top, chicken from the bottom). The chapter then resolves after a short beat.
//
// ?state= (dev, for screenshots; sets the chapter up at that point and plays on from there. burst and served hold):
//   sealed   the start (also the default): pot sealed, the rim waiting
//   cracked  seal broken, the lid waiting
//   lifting  lid at 0.4, steam leaking at the gap
//   burst    lid up, the plume at its fullest (held)
//   inside   the close shot, the spoon waiting at the side
//   served   the spoon up, full (held)
// Hotspots: #r-dough (drag [300, 0] along the rim, or tap for a quarter), #r-lid (drag [0, -200] up, or tap), and
// #o-spoon (drag [0, 160] down the side, or tap for the whole scoop).
import '../sound/opening.js';

export const CRACKS = 9;
const CRACK_X = (i) => 674 + i * 31; // the nine crack lines in art/room.js, left to right
const LIFT_SPAN = 200, LIFT_GO = 0.6; // drag the lid up this far; past LIFT_GO it goes
const DEPTH_SPAN = 160, DEPTH_GO = 0.25; // drag the spoon down this far; let go past DEPTH_GO and it scoops

const count = (a) => a.filter(Boolean).length;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// Cracks swept by a pointer move from xa to xb (world x), with a little slack. Returns the indices newly revealed.
export function crackSweep(revealed, xa, xb) {
  const lo = Math.min(xa, xb) - 14, hi = Math.max(xa, xb) + 14, fresh = [];
  for (let i = 0; i < CRACKS; i++) if (!revealed[i] && CRACK_X(i) >= lo && CRACK_X(i) <= hi) { revealed[i] = true; fresh.push(i); }
  return fresh;
}
// A tap reveals the lowest unrevealed cracks until n are revealed. Returns the indices newly revealed.
export function crackTo(revealed, n) {
  const fresh = [];
  for (let i = 0; i < CRACKS && count(revealed) < n; i++) if (!revealed[i]) { revealed[i] = true; fresh.push(i); }
  return fresh;
}
export const liftStep = (p, dy) => clamp(p - dy / LIFT_SPAN, 0, 1); // dragging up (dy < 0) lifts
export const depthStep = (d, dy) => clamp(d + dy / DEPTH_SPAN, 0, 1);

export default {
  id: 'opening',
  art: () => import('../art/opening.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params } = ctx;
    const el = stage.el;
    el.dataset.fog = 'off'; // the window is clear after the wait
    const state = params.get('state');
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const wait = (ms) => ctx.wait(ms);
    const art = await import('../art/opening.js');
    signal.addEventListener('abort', () => { audio.level('scrape', 0, 0.2); audio.level('steam-bed', 0, 0.2); }, { once: true });

    // Starting state (design.md section 4: the room, the seal on, the flame off, the knob at off).
    el.dataset.pot = state === 'burst' ? 'lifted' : state === 'cracked' || state === 'lifting' ? 'cracked' : 'sealed';
    el.dataset.flame = 'off';
    el.dataset.tawa = 'under';
    el.dataset.light = 'dim'; // the burst light blooms only at the lift
    el.style.setProperty('--seal', '1');
    el.style.setProperty('--knob', '1');
    el.style.setProperty('--crack', state === 'cracked' || state === 'lifting' || state === 'burst' ? '1' : '0');
    el.style.setProperty('--lift', state === 'lifting' ? '0.4' : state === 'burst' ? '1' : '0');
    stage.$('#r-plume').style.transformOrigin = '800px 490px'; // the plume grows up from the pot's mouth
    audio.stop('flame', 1);
    audio.muffle(1); // still muffled from the wait
    audio.bed('rain', 0.3);
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    // The camera pushes in on what is touchable; a phone is too narrow for the full span, so it pushes less.
    const frame = (want, span, x, y) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y);

    // The lid goes up: the plume fills the frame and the room opens up. held: a dev state, just the end picture.
    const burst = (held) => {
      const plume = stage.$('#r-plume'), lidT = stage.$('#r-lid .lidT');
      el.dataset.pot = 'lifted';
      el.dataset.light = 'warm';
      el.style.setProperty('--lift', '1');
      el.style.setProperty('--glow', '1.8'); // the burst light blooms from the pot
      lidT.style.transition = held ? 'none' : '';
      plume.style.transition = held ? 'none' : 'transform 2s ease-out, opacity .3s';
      plume.style.transform = 'scale(3.2)';
      audio.level('steam-bed', 0, 0.4);
      if (held) { audio.muffle(0, 0); return; }
      audio.hit('steam');
      audio.muffle(0, 1.5); // the room opens up
      voice.say('opening.lift');
      wait(1000).then(() => { if (!signal.aborted) audio.hit('chime'); });
    };

    // ---- beat 1: the seal ----
    const crackBeat = () => new Promise((resolve) => {
      const dough = stage.$('#r-dough');
      const cracks = [...dough.querySelectorAll('.cr')];
      const crumbs = [...stage.$('#o-fx').querySelectorAll('.o-crumb')];
      const revealed = Array(CRACKS).fill(false);
      let last = 0;
      const reveal = (fresh) => {
        if (!fresh.length) return;
        for (const i of fresh) { cracks[i].style.opacity = '1'; crumbs[i]?.classList.add('on'); }
        el.style.setProperty('--crack', (count(revealed) / CRACKS).toFixed(3));
        const now = performance.now();
        if (now - last > 280) { last = now; audio.hit('crack'); } // a few dry cracks a second, not a machine gun
      };
      const broken = () => {
        if (count(revealed) < CRACKS) return false;
        el.dataset.pot = 'cracked';
        el.style.setProperty('--crack', '1');
        for (const c of cracks) c.style.opacity = ''; // hand the lines back to room.js
        return true;
      };
      const spot = hotspot(dough, {
        label: 'crack the seal',
        gesture: { drag: [300, 0] },
        step() { reveal(crackTo(revealed, Math.ceil(count(revealed) + CRACKS / 4))); return broken(); },
        drag({ x, dx }) { reveal(crackSweep(revealed, x - dx, x)); return broken(); },
      });
      spot.done.then(resolve);
    });

    // ---- beat 2: the lid ----
    const lidBeat = (p0) => new Promise((resolve) => {
      const lid = stage.$('#r-lid'), lidT = lid.querySelector('.lidT'), plume = stage.$('#r-plume');
      let p = p0;
      const show = (live) => {
        lidT.style.transition = live ? 'none' : ''; // live: the lid follows the finger; otherwise the CSS eases it
        el.style.setProperty('--lift', p.toFixed(3));
        plume.style.transform = `scale(${(0.6 + 0.4 * p).toFixed(3)})`; // the plume grows with the gap
        audio.level('steam-bed', 0.32 * p, live ? 0.05 : 0.3);
      };
      show(false);
      const spot = hotspot(lid, {
        label: 'lift the lid',
        gesture: { drag: [0, -LIFT_SPAN] },
        step() { burst(false); return true; },
        drag({ dy }) {
          p = liftStep(p, dy);
          show(true);
          if (p < LIFT_GO) return;
          burst(false);
          return true;
        },
        release() {
          if (p >= LIFT_GO) return;
          p = Math.max(0.12, p * 0.8); // let go early: it sinks a little, but stays open a crack
          show(false);
        },
      });
      spot.done.then(resolve);
    });

    // ---- scene 2: into the pot ----
    const showInside = async (served) => {
      await stage.show(art.inside());
      if (signal.aborted) return;
      const spoon = stage.$('#o-spoon');
      if (served) {
        spoon.dataset.scoop = '1';
        spoon.querySelector('.o-spoonT').style.transform = 'translate(0px, 0px)';
        await gone;
        return;
      }
      voice.say('opening.look'); // not awaited: the spoon is ready at once
      await serve(spoon);
      if (signal.aborted) return;
      await wait(2200);
    };

    // ---- beat 3: serve from the side, all the way down ----
    const serve = (spoon) => new Promise((resolve) => {
      const t = spoon.querySelector('.o-spoonT');
      let depth = 0, finishing = null, off = 0;
      const place = (d, ms) => {
        t.style.transition = ms ? `transform ${ms}ms ease-out` : 'none';
        t.style.transform = `translate(0px, ${(d * DEPTH_SPAN).toFixed(1)}px)`;
      };
      const scrape = (v) => { // a low scrape on the copper while it moves
        audio.level('scrape', v, 0.06);
        clearTimeout(off);
        off = setTimeout(() => audio.level('scrape', 0, 0.3), 160);
      };
      const up = () => { // it comes up full: rice from the top, chicken from the bottom
        spoon.dataset.scoop = '1';
        place(0, 900);
        voice.say('opening.whyServe');
        return wait(900);
      };
      const spot = hotspot(spoon, {
        label: 'serve from the pot',
        gesture: { drag: [0, DEPTH_SPAN] },
        step() { place(1, 500); finishing = wait(500).then(up); return true; },
        drag({ dy, speed }) {
          depth = depthStep(depth, dy);
          place(depth, 0);
          scrape(Math.min(0.6, speed / 900));
        },
        release() {
          audio.level('scrape', 0, 0.2);
          clearTimeout(off);
          if (depth < DEPTH_GO) { depth = 0; place(0, 350); return; } // a short push springs back
          finishing = up();
          spot.finish();
        },
      });
      spot.done.then(() => finishing).then(resolve);
    });

    // ---- the flow ----
    if (state === 'inside' || state === 'served') return showInside(state === 'served');
    if (state === 'burst') { frame(1.4, 520, 800, 380); burst(true); await gone; return; }
    if (!state || state === 'sealed') {
      frame(1.8, 340, 800, 540); // on the rim, in the top 70% of the screen
      await Promise.race([crackBeat(), gone]);
      if (signal.aborted) return;
    }
    frame(1.4, 520, 800, 380); // the lid and the plume above the pot
    await Promise.race([lidBeat(state === 'lifting' ? 0.4 : 0), gone]);
    if (signal.aborted) return;
    await wait(1900); // the plume's fullest
    if (signal.aborted) return;
    await showInside(false);
  },
};
