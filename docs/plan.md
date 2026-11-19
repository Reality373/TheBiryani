# Dum — build plan (v2)

Read [design.md](design.md) first: it says what the piece is and the rules every chapter follows. This file says how it is built, who owns which file, and the interfaces between the parts. If the two disagree, ask; do not guess.

## Ground rules

- **Branch `main`** (the work was done on `v2`, which was fast-forwarded into `main` on 19 Nov; the GitHub default branch is `main`). Commit after every step that works. Never keep work only in `/tmp`: a reboot on 17 Nov wiped two days of concept work that lived there.
- **Zero-build static site.** ES modules, SVG built as strings in JS, CSS, canvas only where SVG cannot do it (grain, steam plume), Web Audio. No framework, bundler, runtime dependency or Python build step.
- **Serve it** with `npm run serve` (`tools/serve.py`, port 8000: never cached, so a reload always loads the latest files). Chapters load with dynamic `import()`, so `file://` is not supported.
- **Tests** with `npm test` (`node --test`). `tests/contrast.test.js` reads `css/tokens.css` and must keep passing.
- **Only touch the files you own** (table below). If you need a change in someone else's file, say so in your report instead.

## File layout and ownership

| Path | Owner | What |
|---|---|---|
| `index.html` | W1 | Stage, UI layer, card, settings dialog |
| `css/tokens.css` | W1 (keep) | Palette, fonts, sizes, timings |
| `css/app.css` | W1 | Rewritten: stage, planes, camera, grain, frame, UI, cards, hotspot rings, calm mode |
| `js/main.js` | W1 | Boot, chapter loop, dev params, auto mode |
| `js/core/audio.js` | W1 | Existing engine, extended (see below) |
| `js/core/stage.js` | W1 | New: scene planes, camera, parallax |
| `js/core/hotspot.js` | W1 | New: one way to make anything touchable |
| `js/core/voice.js` | W1 | New: voice-over queue |
| `js/core/ui.js` | W1 | Rewritten: chapter header, subtitles, captions, hints, cards |
| `js/core/prefs.js`, `hold.js`, `runner.js`, `steam.js` | keep | `steam.js` is the canvas plume the Opening uses |
| `js/art/lib.js` | done | Shared drawing helpers (tested) |
| `js/art/room.js` | W1 | The shared kitchen world, side view |
| `js/art/close.js`, `js/art/food.js` | W1-food | Close-shot backdrop; rice, chicken, onions, spices, plate, spoon, bowls |
| `js/data/chapters.js` | W1 | Ordered chapter list |
| `js/data/spices.js`, `js/data/labels.js` | W1 | Moved out of v1's `script.js` |
| `js/data/voice-files.js` | W1 | Ids of recorded voice files present (empty until the owner records) |
| `js/chapters/<id>.js` | that chapter | The chapter's logic |
| `js/art/<id>.js` | that chapter | The chapter's own planes |
| `js/sound/<id>.js` | that chapter | The chapter's synth voices |
| `js/data/lines/<id>.js` | that chapter | The chapter's lines (from design.md §3) |
| `tests/<id>.test.js` | that chapter | Optional tests for the chapter's pure logic |

W1 deletes v1's `js/scenes/`, `js/art/kitchen.js`, `js/art/topdown.js`, `js/core/steps.js`, `js/data/script.js` and the tests that only covered them, and replaces `tests/script.test.js` with `tests/lines.test.js` (every lines file: each line at most 110 characters, no "!", no emoji).

## Interfaces

W1 implements these exactly. Chapter agents code against them and nothing else.

### Chapter module

```js
// js/chapters/wait.js
export default {
  id: 'wait',
  art: () => import('../art/wait.js'),   // its default export is art(params) -> { planes: string[] }
  async play(ctx) { /* resolves when the chapter is complete */ },
};
```

`js/data/chapters.js` lists every chapter in order: `{ id, numeral, title }` for `marinade` I, `fry` II, `layers` III, `seal` IV, `wait` V, `opening` VI, `plate` VII, then `end` (no numeral). `main.js` shows the title card, then for each chapter: imports its module (a chapter whose file does not exist yet is skipped), imports its art, `stage.show()`s it, calls `ui.chapter()`, then `await play(ctx)`. While a chapter plays, the next chapter's modules are imported in the background. After `end` the piece can start again from the first chapter.

`ctx` holds: `stage`, `hotspot`, `voice`, `audio`, `ui`, `prefs`, `params` (the page's URLSearchParams), `auto` (boolean), `calm()` (current calm setting), `wait(ms)` (resolves at once in auto mode), `signal` (an `AbortSignal` that aborts when the viewer jumps to another chapter), `mood` (the chapter's colour-script mood, from `chapters.js`, to pass to `room()` or `close()`).

`chapters.js` entries are `{ id, numeral, title, mood, built }`, moods per design.md §4: marinade `dusk`, fry `stove`, layers `steam`, seal `night`, wait `night`, opening `burst`, plate `lamp`, end `moon`.

### Art

Every plane comes from `plane(id, d, inner, { label })` in `js/art/lib.js`: a full-stage `<svg>` with viewBox `0 0 1600 1000`, `preserveAspectRatio="xMidYMid slice"`, depth factor `--d` from 0 (far) to 1 (near). Draw out to x -220..1820 and y -100..1100. Keep the whole story inside x 560..1040 for portrait phones. A plane that contains hotspots must be given a `label` (an `aria-hidden` plane must not contain focusable things). A plane may carry its own `<style>`; scope every selector under the plane's id. A canvas layer is allowed as `<canvas class="plane" style="--d:…">`.

`js/art/room.js` exports `room(opts)`, returning the room's planes (see design.md §4). Stable ids chapters can rely on: `r-pot`, `r-lid`, `r-dough`, `r-steam`, `r-flame`, `r-glow`, `r-knob`, `r-tawa`, `r-window`, `r-fog`, `r-gecko`, `r-motes`. Its state is driven from the stage element: attributes `data-flame` (`high` `low` `off`), `data-pot` (`open` `lidded` `sealed` `cracked` `lifted`), `data-light` (`normal` `dim` `warm`), and CSS custom properties from 0 to 1: `--flame`, `--seal`, `--crack`, `--lift`, `--glow`.

`js/art/food.js` exports drawing functions documented in its header comment (W1-food writes them; chapters reuse them). `js/art/close.js` exports `close(opts)`, the backdrop planes for close shots.

### stage (`js/core/stage.js`)

```js
stage.el                                // the #stage element; chapters set data-* and --vars on it
stage.show(art) -> Promise              // crossfade to art.planes over about 900 ms (300 ms in calm, 0 in auto), drop the old scene
stage.$(selector) -> Element            // query inside the current scene
stage.camera.push(scale, x, y, ms = 1600) -> Promise  // scale the scene about world point (x, y); scale 1 = establishing shot
stage.camera.lean(x, y)                 // add a bias in [-1, 1] to the parallax, eased
stage.toWorld(event, planeEl) -> {x, y} // pointer position in that plane's viewBox units
```

Framing: `push` keeps the pushed-to point inside the top 70% of the viewport, because the bottom 22% (28% under 600 px wide) is the subtitle zone. Chapters push in on whatever is currently touchable.

Frame-time fallback: the stage measures frame time for the first 2 s after each `show`. If the median is over 24 ms it sets `data-lite` on `<html>`: the grain becomes a plain-opacity overlay, the automatic drift stops, and chapters may read `document.documentElement.dataset.lite` to thin their own ambient effects (motes, rain density).

Parallax: `--cx`, `--cy` in [-1, 1] on the stage, from the pointer (eased, lerp about 0.06) or a slow automatic drift (`0.6 * sin(t / 9 s)`) when there is no pointer. Each plane moves only by `translate3d(calc(var(--cx) * var(--d) * var(--shift)), calc(var(--cy) * var(--d) * var(--shift) * 0.4), 0)`, `--shift` 64 px on wide screens and 26 px under 600 px. `?cx=&cy=` pin the camera and stop the loop. Calm mode pins it at 0, 0 and makes `push` jump. Do not leave `will-change: transform` on anything that gets scaled up (it blurs).

### hotspot (`js/core/hotspot.js`)

```js
const h = ctx.hotspot(el, {
  label,     // lowercase imperative, shown as the hint and used as aria-label: 'stir it in'
  gesture,   // REQUIRED. How the hint glyph shows it: 'tap' | 'hold' | 'circle' | { drag: [dx, dy] } (world units)
  step,      // REQUIRED. One tap, Enter or Space. Return true when this hotspot is finished.
  drag,      // optional ({ x, y, dx, dy, speed, first }) => true|void. Pointer moves while pressed, world units. true = finished.
  hold,      // optional (dt) => true|void. Called every frame while pressed and held.
  release,   // optional () => void. Pointer up or cancel.
  keys,      // optional { ArrowLeft: fn, ArrowRight: fn }
  goal,      // optional sentence for the goal line (at most about 70 characters); falls back to the label
  tool,      // optional 'turner' | 'spoon': a mouse or pen over this hotspot becomes that tool (art/tools.js)
});
h.done      // Promise, resolves once finished (a callback returned true, or h.finish())
h.finish(); h.dispose();
```

- Makes `el` a focusable control: `role="button"`, `tabindex="0"` while active (`-1` plus `aria-hidden` once disposed or finished), `aria-label`, `.hotspot` class, visible focus ring. The art gives `el` a transparent `.hit` shape at least 48 CSS px across at the camera scale it is used at.
- Several hotspots can be active at once.
- After about 1 s with no input anywhere, the newest active hotspot that has never been touched (one at a time; an older hint is withdrawn when a newer step arrives) gets a saffron ring that pulses once, its hint text beside it (through `ui.hint`, never inside the subtitle zone) and the gesture glyph animated along its path (still in calm mode). All fade on its first touch and never return for it.
- The goal line: `goalFor(live)` (exported, tested) picks the newest live hotspot's `goal` or label, capitalised, with "· N to do" when several are live; the layer calls `ui.goal(text)` whenever a hotspot is added, finished or disposed.
- Hover name: a mouse or pen over a hotspot shows its label in a small tag (hidden on press). Hotspots with `drag` get the `draggable` class (grab cursor, grabbing while pressed).
- `#skip` ("Skip this step") is shown while any hotspot is live: it starts each live hotspot's auto timer, so every one performs itself as in auto mode.
- Calm mode: `drag` and `hold` are ignored; only `step`.
- Auto mode (`?auto=1`): calls `step` every 60 ms until it returns true. So `step` must always make progress.

### voice (`js/core/voice.js`)

```js
ctx.voice.say('wait.knob') -> Promise   // queue the line; resolves when it has finished; never rejects
ctx.voice.clear()
```

A line id is `<chapter>.<key>`; its text comes from `js/data/lines/<chapter>.js` (`export default { key: 'text', … }`). Playback: a recorded file `audio/voice/<id>.mp3` if the id is in `js/data/voice-files.js`; otherwise `speechSynthesis` (an English voice, rate about 0.92); otherwise nothing. The subtitle shows the line in every case. Each line has a safety timeout of `max(1800, 65 ms × characters + 900)`, so a missing `end` event cannot stall anything. Audio ducks about 6 dB while a line plays. In auto mode `say` resolves at once. **Chapters must not make a hotspot wait for a line to finish**: start the line, enable the hotspot, and let the line play over the action.

### audio (`js/core/audio.js`)

Keeps `unlock`, `mute`, `bed`, `stop`, `hit`, `muffle`, `pause`, `resume`. W1 adds:

```js
audio.register(name, { bed: (ctx, noise, out) => voice } )   // a continuous voice; voice has stop(fade)
audio.register(name, { hit: (ctx, noise, out, verb) => void })  // a one-shot
audio.level(name, value, sec = 0.08)   // set a bed's level with a short ramp, starting it if needed; for gesture-driven sound
audio.duck(on)                         // about -6 dB on everything, for voice lines
```

and exports the existing building blocks (`tick`, `tone`, `voiceKit`, `makeNoise`, `filt`, `rnd`) so `js/sound/<id>.js` can build voices the same way. A chapter's sound module registers its voices when imported.

### ui (`js/core/ui.js`)

```js
ui.chapter(index, numeral, title) -> Promise  // big centred title for about 2 s, then it settles into the top-left cartouche; immediate in auto; then focus goes to the heading
ui.subtitle(text)                             // used by voice: the floating card shows the current line only, placed clear of every hotspot, the ingredient card and the buttons, re-checked every 0.45 s; short lines leave sooner
ui.caption(text | null)                       // [sound caption], shown only when captions are on
ui.card({ kind: 'title' | 'end', title, text, note, icons, choices }) -> Promise<choice index>
ui.hint(el, text, gesture); ui.unhint(el)      // used by hotspot
ui.goal(text)                                 // the goal line under the title ('' hides it); used by hotspot
ui.stepDone(); ui.chapterDone()               // the step bar: each finished hotspot is a step; chapterDone fills it. Totals are `steps` in data/chapters.js (measured with ?auto=1; the bar stops at 97% until the chapter ends)
```

### Progress and ways out (`main.js`, `ui.js`)

- `prefs` keeps `reached`: the id of the furthest chapter started. Finishing `end` clears it.
- The title card shows "Continue: <title>" as its first choice when `reached` is set, above "Begin with sound" and "Begin quietly" (both start from the first chapter).
- Header diamonds of chapters up to `reached` are buttons that jump to that chapter (its start). The Settings dialog lists the same chapters and has "Start over".
- A jump ends the current chapter cleanly: `main.js` passes `ctx.signal` (an `AbortSignal`) to `play`; chapters stop their loops and timers when it aborts, and `hotspot`s created with it dispose themselves. `stage.show` of the new chapter follows.

### Page shell (`index.html`)

- Open Graph and Twitter card meta: title "Dum", description "A small, slow story about Hyderabadi dum biryani. You cook it, wait for it, and eat it.", image `og-image.png` (1200x630, rendered from the title card in W3).
- A failure message (cream text, "Something went wrong.", a "Reload" button) shown when `data-error` is set.

## Dev switches

- `?ch=<id>` start at that chapter (skips the title card; sound stays off).
- `?state=<name>` passed to the chapter in `ctx.params`, for jumping inside a chapter to take screenshots. Each chapter documents its states in a comment at the top of its file.
- `?auto=1` every hotspot performs itself; voice resolves at once. The run must end with `data-done="1"` on `<html>` and no `data-error`.
- `?calm=1`, `?cx=…&cy=…`.
- `?ch=gravy` runs The Gravy from the seared pot; it shares `fry.js` (the chapter's `ctx.id` selects the part: `fry` tips in and sears, `gravy` adds the water, the lid and the covered cook).

## Performance

Rules learnt from a measured regression on 19 Nov (the Layers scene ran at 108 ms a frame):

- **Never change an inherited CSS custom property on a scene root every frame.** It forces style recalculation of every descendant (17,000 elements in The Layers: 85% of the frame). The parallax variables `--cx` and `--cy` are registered with `@property` as non-inherited and set on the planes themselves (`js/core/stage.js`, `css/app.css`).
- **No endless animation over a large or dense area.** SVG repaints on the CPU, so an infinite pulse on a ring that covers 2,000 rice grains repaints them every frame. The hint ring pulses once, then holds.
- **How to measure:** drive headless Chrome over DevTools, record `requestAnimationFrame` intervals and `Performance.getMetrics` (ScriptDuration, LayoutDuration, RecalcStyleDuration) for 4 s, then A/B one suspect at a time with injected CSS. Target: 16.6 ms steady at 1916 by 990. Compare against an older commit in a `git worktree` to bisect.
- **Known hot spot:** The Wait's fogged window (mask, about 100 drops and gradients, screen-blend glows) is about 55 ms a frame; see the README's known gaps.

- Animate only `transform` and `opacity`. No animated filters, `feTurbulence` or masks on large areas. A static blur of at most 1 px on a foreground plane is fine.
- Under about 5000 SVG elements per chapter. Draw repeated small things (rice grains, rain, dots) as a few `<symbol>`s placed with `<use>`, or as `<pattern>`s.
- Grain is one 256 px noise canvas, made once and used as a CSS background on an overlay.

## Verification each agent does before reporting

1. `npm test` passes.
2. `tools/smoke.sh '?ch=<id>'` passes for your chapter, and the full `tools/smoke.sh` still passes.
3. Screenshots with `tools/shot.sh OUT.png '?ch=<id>&state=…&cx=0' W H` at 1440×900 and 390×844 for every state of your chapter. Look at each with the Read tool, judge it against design.md §2 and §4, fix, and shoot again. At least two passes.
4. Commit your files with a clear message. Do not push.
5. Report: paths, smoke output, what you verified, and plainly what you could not (sound by ear, speech, real touch, frame rate on a phone).

Headless Chrome notes: `--virtual-time-budget` runs few animation frames, so eased motion may not settle in screenshots (pin with `?cx=`); it has no speech voices.

## Waves

| Wave | Who | What | When |
|---|---|---|---|
| W0 | lead + Haiku | `lib.js`, design.md, this plan | 17 Nov, done |
| W1 | Sonnet, main tree | Foundation (everything marked W1) plus the **Wait** chapter end to end, as the reference chapter | 17 Nov |
| W1-food | Sonnet, own worktree, alongside W1 | `close.js`, `food.js`, a preview page, and the appetite test | 17 Nov |
| W2 | Sonnet, one per chapter, own worktrees | `marinade`, `fry`, `layers`, `seal`, `opening`, `plate`, `end` | 18 Nov |
| W3 | lead + review agent + owner | Merge, full run, consistency pass, code review, the owner plays it on a phone, publish when the owner approves where | 19–20 Nov |

**Cut line** if time runs short: Seal, Wait, Opening, Plate and End are the core. Marinade, Fry and Layers go in as they land; a chapter whose file does not exist is skipped automatically.
