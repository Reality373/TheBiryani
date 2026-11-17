// Chapter IV, The Seal. Room, medium shot: the copper pot on the stove, the lid at its side.
// Beats: (1) drag the lid onto the pot; (2) press the dough rope round the rim: sweep along the rim (or tap), and
// each eighth of the rim the pointer passes over is pressed once; (3) the room goes quiet, and the chapter
// resolves after about 2 s.
//
// ?state= (dev, for screenshots; sets up the chapter at that point and plays on from there):
//   start    lid at its side, pot open, rim bare
//   lidded   lid on the pot, rim bare (the next touchable is the rim)
//   sealing  lid on, four of eight presses done (the "why" line is not said again)
//   sealed   everything done: pot sealed, room dim and muffled
// Hotspots: #r-lid (drag from its side onto the pot) and #r-dough (drag [300, 0] along the rim; one press per step).
// The lid's side position is in art/seal.js; on phones it starts nearer the pot (LID_PHONE), inside the phone's column.
import '../sound/seal.js';

const PRESSES = 8;
const RIM = { x0: 650, x1: 950 }; // the dough rim's span, world units
const LID_DESK = [290, -207]; // from the lid's side position (510, 730) to the pot's lid position (800, 523)
const LID_PHONE = [70, -207]; // from (730, 730): the phone's column shows x about 575..995
const LID_DONE = 0.97; // a drag that gets this far lands the lid

export const lidPath = () => (innerWidth <= 600 ? LID_PHONE : LID_DESK);
// Lid progress 0..1 after a pointer move of (dx, dy): the projection onto the path.
export const lidStep = (p, dx, dy, path = LID_DESK) =>
  Math.min(1, Math.max(0, p + (dx * path[0] + dy * path[1]) / (path[0] ** 2 + path[1] ** 2)));
// The eighth of the rim under world x, 0..7.
export const segAt = (x) => Math.min(PRESSES - 1, Math.max(0, Math.floor((x - RIM.x0) / ((RIM.x1 - RIM.x0) / PRESSES))));
// Presses every unpressed eighth between two rim positions (a pointer move from xa to xb). Returns how many were new.
export const pressSweep = (pressed, xa, xb) => {
  let n = 0;
  for (let s = Math.min(segAt(xa), segAt(xb)); s <= Math.max(segAt(xa), segAt(xb)); s++) {
    if (!pressed[s]) { pressed[s] = true; n++; }
  }
  return n;
};

export default {
  id: 'seal',
  art: () => import('../art/seal.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params } = ctx;
    const el = stage.el;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const state = params.get('state');
    const phase = state === 'sealed' ? 2 : state === 'lidded' || state === 'sealing' ? 1 : 0;
    const path = lidPath();

    // Starting state (design.md section 4: room at night).
    el.dataset.pot = phase === 0 ? 'open' : phase === 1 ? 'lidded' : 'sealed';
    el.dataset.flame = 'high';
    el.dataset.light = 'normal';
    el.dataset.tawa = 'side';
    el.style.setProperty('--seal', '0');
    audio.bed('rain', 0.5);
    audio.bed('flame', 0.3);
    audio.muffle(0);
    if (phase === 0) voice.say('seal.lid'); // not awaited: the line plays over the action

    // The camera pushes in on what is touchable. A phone is too narrow for the full span, so it pushes less.
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    const frame = (want, span, x, y) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y);

    const lid = stage.$('#r-lid');
    const lidT = lid.querySelector('.lidT');
    const dough = stage.$('#r-dough');
    const lumps = [...dough.querySelectorAll('.lm')];
    const puff = stage.$('#s-puff');
    const rope = stage.$('#s-rope');
    const pressed = Array(PRESSES).fill(false);
    let whySaid = false;
    const count = () => pressed.filter(Boolean).length;
    const setSeal = (v) => el.style.setProperty('--seal', String(v));
    // Each lump belongs to the eighth it sits over (lump i at x = 800 + 146 cos(...), see room.js), so a press lights its own lumps.
    const lumpSeg = lumps.map((l) => segAt(800 + 146 * Math.cos(Math.PI * (1 - Number(l.style.getPropertyValue('--i')) / (lumps.length - 1)))));
    const showLumps = () => {
      lumps.forEach((l, j) => l.style.setProperty('--on', pressed[lumpSeg[j]] ? '1' : '0'));
      rope.classList.toggle('gone', count() > 0);
      setSeal(count() / PRESSES);
    };

    // The lid lands on the pot. A drag leaves the lid offset, so both offsets (the drag's and the open-state CSS)
    // are dropped in one frame; a tap slides it, with the CSS transition.
    const land = (quiet, slide) => {
      lid.style.transform = '';
      if (!slide) lidT.style.transition = 'none';
      el.dataset.pot = 'lidded';
      if (!slide) { void lidT.getBBox(); lidT.style.transition = ''; } // apply the new state before transitions return
      puff.classList.add('on');
      if (quiet) return;
      audio.hit('seal-clink');
      lid.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-9px) rotate(-1deg)' }, { transform: 'translateY(0px)' }],
        { duration: 320, delay: slide ? 260 : 0, easing: 'ease-out' });
    };

    // ---- beat 1: the lid ----
    const lidBeat = () => new Promise((resolve) => {
      let p = 0, landed = false;
      const spot = hotspot(lid, {
        label: 'put the lid on',
        gesture: { drag: path },
        step() { landed = true; land(false, p === 0); return true; },
        drag({ dx, dy }) {
          if (landed) return;
          p = lidStep(p, dx, dy, path);
          lid.style.transition = 'none';
          lid.style.transform = `translate(${p * path[0]}px, ${p * path[1]}px)`;
          if (p < LID_DONE) return;
          landed = true; land(false, false); return true;
        },
        release() {
          if (landed) return;
          p *= 0.8; // let go early: it settles back a little, nothing is lost
          lid.style.transition = 'transform .35s ease-out';
          lid.style.transform = `translate(${p * path[0]}px, ${p * path[1]}px)`;
        },
      });
      spot.done.then(resolve);
    });

    // ---- beat 2: the rim, eight presses ----
    const rimBeat = () => new Promise((resolve) => {
      dough.style.transformBox = 'fill-box';
      dough.style.transformOrigin = 'center';
      const feedback = () => {
        showLumps();
        audio.hit('seal-press');
        dough.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02, .965)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' });
        if (!whySaid && count() >= PRESSES / 2) { whySaid = true; voice.say('seal.why'); }
      };
      const spot = hotspot(dough, {
        label: 'press the dough round the rim',
        gesture: { drag: [300, 0] },
        step() {
          const s = pressed.indexOf(false);
          if (s >= 0) { pressed[s] = true; feedback(); }
          return count() >= PRESSES;
        },
        drag({ x, dx }) {
          // The first move starts from the touch (x - dx is where the press began), later moves from the last event.
          if (pressSweep(pressed, x - dx, x)) feedback();
          return count() >= PRESSES;
        },
      });
      spot.done.then(resolve);
    });

    // ---- beat 3: the hush ----
    const seal = () => {
      pressed.fill(true);
      showLumps();
      el.dataset.pot = 'sealed';
      el.dataset.light = 'dim';
      puff.classList.remove('on'); // the last puff stops
      audio.muffle(0.55, 3); // the room starts to go quiet
      frame(1.2, 700, 800, 560);
      voice.say('seal.done');
    };

    if (phase === 0) {
      frame(1.5, 420, 620, 730); // aim at the lid itself, so it sits in the top 70% (the push keeps the aim point there)
      await Promise.race([lidBeat(), gone]);
      if (signal.aborted) return;
    } else {
      land(true, false);
    }
    if (phase < 2) {
      if (state === 'sealing') { for (let s = 0; s < PRESSES / 2; s++) pressed[s] = true; whySaid = true; }
      showLumps();
      frame(1.8, 380, 800, 540);
      await Promise.race([rimBeat(), gone]);
      if (signal.aborted) return;
    }
    seal();
    await ctx.wait(2000);
  },
};
