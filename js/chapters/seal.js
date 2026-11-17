// Chapter IV, The Seal. Room, medium shot: the copper pot on the stove, the lid at its side.
// Beats: (1) drag the lid onto the pot; (2) press the dough rope round the rim, eight presses (drag along the rim
// or tap); (3) the room goes quiet and the chapter resolves after about 2 s.
//
// ?state= (dev, for screenshots; sets up the chapter at that point and plays on from there):
//   start    lid at its side, pot open, rim bare
//   lidded   lid on the pot, rim bare (the next touchable is the rim)
//   sealing  lid on, four of eight presses done (the "why" line is said at half)
//   sealed   everything done: pot sealed, room dim and muffled
// Hotspots: #r-lid (drag [290, -207] from its side onto the pot) and #r-dough (drag [300, 0] along the rim).
import '../sound/seal.js';

const LID = [290, -207]; // from the lid's side position (510, 730) to the pot's lid position (800, 523), world units
const RIM = { x0: 650, x1: 950 }; // the dough rim's span, world units
const PRESSES = 8;
const LID_DONE = 0.97; // a drag that gets this far lands the lid

// Presses the pointer has reached along the rim (one per eighth of its length), 0..8.
export const pressesReached = (x) =>
  Math.min(PRESSES, Math.max(0, Math.floor((x - RIM.x0) / ((RIM.x1 - RIM.x0) / PRESSES)) + 1));
// Lid progress 0..1 after a pointer move of (dx, dy): the projection onto the path.
export const lidStep = (p, dx, dy) =>
  Math.min(1, Math.max(0, p + (dx * LID[0] + dy * LID[1]) / (LID[0] ** 2 + LID[1] ** 2)));

export default {
  id: 'seal',
  art: () => import('../art/seal.js'),
  async play(ctx) {
    const { stage, hotspot, voice, audio, signal, params } = ctx;
    const el = stage.el;
    const gone = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
    const state = params.get('state');
    const phase = state === 'sealed' ? 2 : state === 'lidded' || state === 'sealing' ? 1 : 0;

    // Starting state (design.md section 4: room at night).
    el.dataset.pot = phase === 0 ? 'open' : phase === 1 ? 'lidded' : 'sealed';
    el.dataset.flame = 'high';
    el.dataset.light = 'normal';
    el.dataset.tawa = 'side';
    el.style.setProperty('--seal', '0');
    audio.bed('rain', 0.5);
    audio.bed('flame', 0.3);
    audio.muffle(0);
    voice.say('seal.lid'); // not awaited: the line plays over the action

    // The camera pushes in on what is touchable. A phone is too narrow for the full span, so it pushes less.
    const k = () => Math.max(innerWidth / 1600, innerHeight / 1000);
    const frame = (want, span, x, y) => stage.camera.push(Math.max(1, Math.min(want, innerWidth / (k() * span))), x, y);

    const lid = stage.$('#r-lid');
    const lidT = lid.querySelector('.lidT');
    const dough = stage.$('#r-dough');
    const puff = stage.$('#s-puff');
    const rope = stage.$('#s-rope');
    const setSeal = (v) => el.style.setProperty('--seal', String(v));

    // The lid lands: both offsets (the drag's and the open-state CSS) are dropped in one frame, so it does not jump.
    const land = (quiet) => {
      lid.style.transform = '';
      lidT.style.transition = 'none';
      el.dataset.pot = 'lidded';
      void lidT.getBBox(); // apply the new state before the transition comes back
      lidT.style.transition = '';
      puff.classList.add('on');
      if (quiet) return;
      audio.hit('seal-clink');
      lid.animate([{ transform: 'translateY(0px)' }, { transform: 'translateY(-9px) rotate(-1deg)' }, { transform: 'translateY(0px)' }], { duration: 320, easing: 'ease-out' });
    };

    // ---- beat 1: the lid ----
    const lidBeat = () => new Promise((resolve) => {
      let p = 0, landed = false;
      const spot = hotspot(lid, {
        label: 'put the lid on',
        gesture: { drag: LID },
        step() { landed = true; land(false); return true; },
        drag({ dx, dy }) {
          if (landed) return;
          p = lidStep(p, dx, dy);
          lid.style.transition = 'none';
          lid.style.transform = `translate(${p * LID[0]}px, ${p * LID[1]}px)`;
          if (p < LID_DONE) return;
          landed = true; land(false); return true;
        },
        release() {
          if (landed) return;
          p *= 0.8; // let go early: it settles back a little, nothing is lost
          lid.style.transition = 'transform .35s ease-out';
          lid.style.transform = `translate(${p * LID[0]}px, ${p * LID[1]}px)`;
        },
      });
      spot.done.then(resolve);
    });

    // ---- beat 2: the rim, eight presses ----
    const rimBeat = (from) => new Promise((resolve) => {
      let n = from;
      dough.style.transformBox = 'fill-box';
      dough.style.transformOrigin = 'center';
      if (n > 0) rope.classList.add('gone');
      setSeal(n / PRESSES);
      const press = () => {
        n++;
        rope.classList.add('gone');
        setSeal(n / PRESSES);
        audio.hit('seal-press');
        dough.animate([{ transform: 'scale(1)' }, { transform: 'scale(1.02, .965)' }, { transform: 'scale(1)' }], { duration: 180, easing: 'ease-out' });
        if (n === PRESSES / 2) voice.say('seal.why');
        return n >= PRESSES;
      };
      const spot = hotspot(dough, {
        label: 'press the dough round the rim',
        gesture: { drag: [300, 0] },
        step: press,
        drag({ x }) {
          let finished = false;
          while (n < pressesReached(x)) finished = press();
          return finished;
        },
      });
      spot.done.then(resolve);
    });

    // ---- beat 3: the hush ----
    const seal = () => {
      el.dataset.pot = 'sealed';
      el.dataset.light = 'dim';
      setSeal(1);
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
      land(true);
    }
    if (phase < 2) {
      frame(1.8, 380, 800, 540);
      await Promise.race([rimBeat(state === 'sealing' ? PRESSES / 2 : 0), gone]);
      if (signal.aborted) return;
    }
    seal();
    await ctx.wait(2000);
  },
};
