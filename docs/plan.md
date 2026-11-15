# Dum Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build "Dum", a four-minute interactive web piece about Hyderabadi dum biryani, as a static site behind a public link.

**Architecture:** One fixed stage with two illustrated views (a kitchen from the side, a vessel from above) under an HTML text layer. Scenes are small modules played in order by a runner; each scene plays a list of script steps and supplies hooks that move the art and the sound. All text lives in one data file.

**Tech Stack:** HTML, CSS, ES modules, inline SVG, canvas 2D, Web Audio. No framework, bundler or runtime dependency. Tests run on `node --test` (Node 22).

**Spec:** [design.md](design.md). Research it argues from: [research/](research/).

**Deviation from the plan template, on purpose:** tests for pure logic are given in full because they pin the interfaces. Implementation code and art are not pre-written here; each task gives exact files, exact interfaces and acceptance checks instead. The user asked for the lead model to architect and for smaller models to implement.

## Who does what

| Task | Model, effort | Why |
|---|---|---|
| 1 Visual foundation | Lead (Fable) | Sets the look every later task copies |
| 2 Logic core | Sonnet, medium | Pure functions with tests given |
| 3 UI layer | Sonnet, medium | DOM code against a fixed contract |
| 4 Audio engine | Sonnet, medium | Recipes exist in research/07 |
| 5 Steam | Sonnet, medium | One canvas module, recipe in research/06 |
| 6 Core scenes: arrival to lid-lift | Sonnet, medium | Choreography against existing art |
| 7 Top-down art | Sonnet, medium; lead reviews by screenshot | Follows the style Task 1 set |
| 8 Eat, glow, easter eggs | Sonnet, medium | Completes the core |
| 9 Cook scenes | Sonnet, medium | Added on top of a shippable core |
| 10 Polish and README | Sonnet, low | Small, mechanical |

Each task gets one reviewer pass (Sonnet, medium) on its diff. What a reviewer cannot see (how it looks) the lead checks with phone-width screenshots. What nobody here can check (sound on a phone, frame rate on a mid-range Android, whether it makes anyone hungry) is listed for the user at the end, not claimed.

**Shippable points:** after Task 8 the core is complete. Tasks 9 and 10 only add.

## Global Constraints

- Zero runtime dependencies. No bundler, no transpiler, no framework. `package.json` has no `dependencies` and no `devDependencies`.
- ES modules only, loaded with `<script type="module">`. Relative imports include the `.js` extension.
- Tests: `node --test` from the repo root. Test files live in `tests/` and end in `.test.js`. Only pure modules are unit-tested; nothing imports a DOM library.
- Serve locally with `python3 -m http.server 8000 --bind 127.0.0.1` from the repo root (bound to this machine only; binding wider is a deliberate choice for testing on a phone). Never open `index.html` from `file://`.
- **To look at the page:** `bash tools/shot.sh OUT.png '?query' [W] [H]`. It serves the repo, loads the page in a frame of exactly W × H CSS px (default 390 × 844) in headless Chrome and writes a PNG; open the PNG to check it. Headless Chrome will not make a window narrower than 500 px, which is why the frame exists. Write PNGs outside the repo.
- **To run the whole piece:** `bash tools/smoke.sh ['?query']`. It loads the page with `auto=1`, which makes every button press itself, and passes when the page reaches the end with no uncaught error. Expected last line: `smoke: ok`. From Task 6 on, every task ends with this passing.
- `auto=1` contract: `ui.action` and `ui.card` resolve by themselves after 50 ms (`card` with its last choice); `main.js` sets `data-done="1"` on `<html>` when the last scene's `play` resolves and does not loop; any `error` or `unhandledrejection` event sets `data-error` on `<html>` to its message.
- Work on the `build` branch. `git add` only the files your task names; never `git add -A` or `git add .`.
- Animate only `transform` and `opacity`. No animated `filter`, `mask-position`, `background-position`, `width`, `height`, `top` or `left`. No live SVG filters on moving elements.
- Every colour comes from a custom property in `css/tokens.css`. No hex values anywhere else, except inside SVG art, which may use only the eight token hex values plus darker or lighter shades of them for baked shadows and light.
- Every line of story, caption, card text and button label comes from `js/data/script.js`. No user-facing strings in scene or UI code. The only exception is the settings dialog's fixed labels, which live in `index.html`.
- Each scene sets every art state it depends on when it starts, so any scene can be played first with `?from=<id>`.
- Everything the viewer can activate is a real `<button>`, reachable by keyboard, at least 44 × 44 CSS px, with a visible focus ring.
- Nothing advances on a timer the viewer can miss. Lines stay until the viewer acts.
- Calm mode (`prefs.get('calm')`) must keep every line, picture and sound, and remove camera moves, ambient motion and required holds.
- Scenes never check whether sound is on. `audio` remembers the beds and muffle asked for while it is locked or muted and applies them when sound comes on, so switching sound on mid-scene gives the right mix.
- Stage height uses `100svh`, never `dvh` or `vh`.
- Copy is British English, sentence case, no exclamation marks, no emoji.
- Do not edit anything under `docs/`. Do not push, publish or deploy.
- Commit after each task with a message of the form `feat: <what>` or `test: <what>`.

## File structure

```
index.html              shell: stage, text layer, settings dialog
package.json            {"type":"module"}, test and serve scripts
css/tokens.css          colours, type, spacing, timing
css/app.css             shell layout, text layer, buttons, views, calm mode
js/main.js              boot: prefs, audio, steam, ui, scene list, runner
js/core/runner.js       plays scenes in order
js/core/hold.js         hold-or-tap state machine (pure)
js/core/prefs.js        preferences with safe storage (pure, storage injected)
js/core/steps.js        plays a list of script steps against a ui (pure, ui injected)
js/core/ui.js           DOM: say, caption, action, view
js/core/audio.js        Web Audio engine
js/core/steam.js        canvas wisps and plume
js/data/script.js       every line, caption, button label, and the spice list
js/data/eggs.js         which spices turn up on this plate (pure)
js/art/kitchen.js       kitchen SVG markup
js/art/topdown.js       open pot, plate, bowl SVG markup
js/scenes/<id>.js       one module per scene
tests/*.test.js
```

## Shared contracts

**Script step** (an object in `js/data/script.js`):

```js
{ say: 'One line of narration.',   // optional
  cap: '[rain against the window]', // optional; null clears the caption
  cue: 'sealed',                    // optional; hook called before the line shows
  act: 'Press the seal',            // optional; button label. Default 'Go on'. false = no button, move on
  hold: 1800,                       // optional; ms of hold the button asks for
  holdCue: 'pressing',              // optional; hook called with progress 0..1 during the hold
  rest: 2000 }                      // optional; ms the button stays disabled before it can be used
```

**Scene module** (default export of `js/scenes/<id>.js`):

```js
export default {
  id: 'seal',
  mount(ctx) {},        // optional, called once before the first play
  async play(ctx) {},   // resolves when the viewer has finished the scene
};
// ctx = { ui, audio, steam, prefs, script, spices, kitchen, top }
// kitchen and top are the two root <svg> elements.
```

**Art state** is set with attributes, never by editing SVG from scenes:

- On `#stage`: `data-view="wide" | "medium" | "close" | "top"`.
- On `#kitchen`: `data-pot="lidded" | "sealed" | "cracked" | "lifted"`, `data-flame="high" | "low" | "off"`, `data-light="normal" | "dim" | "warm"`, and the custom property `--seal` (0 to 1) for how much dough is pressed.
- On `#top`: `data-show="pot" | "plate" | "bowl"`, plus the attributes Task 7 defines.

---

### Task 1: Visual foundation

**Files:**
- Create: `index.html`, `package.json`, `css/tokens.css`, `css/app.css`, `js/art/kitchen.js`, `js/main.js`, `tools/frame.html`, `tools/shot.sh`, `tools/smoke.sh`

**Interfaces:**
- Produces: the DOM ids `#stage`, `#kitchen`, `#top`, `#steam`, `#line`, `#cap`, `#act`, `#act-label`, `#act-ring`, `#card` (hidden until used, with children `#card-title`, `#card-text`, `#card-icons`, `#card-note`, `#card-choices`), `#settings`, `#open-settings`, `#set-sound`, `#set-calm`, `#set-caps`; the art-state attributes above; the eight colour tokens named in design.md §4; `kitchenSVG` exported from `js/art/kitchen.js`.
- `js/main.js` at this stage mounts the kitchen art and applies `view`, `pot`, `flame`, `light` and `seal` from the URL query string so states can be screenshotted, for example `/?view=medium&pot=sealed&flame=low&light=dim`.

- [ ] **Step 1:** Write `package.json` (`"type": "module"`, scripts `test` = `node --test`, `serve` = `python3 -m http.server 8000`), `css/tokens.css` and `index.html`.
- [ ] **Step 2:** Write `js/art/kitchen.js`: window with rain streaks, wall with a border strip, counter, stove, flame with glow, pot, lid, dough seal. Paper-cut construction per design.md §4.
- [ ] **Step 3:** Write `css/app.css`: stage and views, art states, text layer with scrim, primary button with ring, settings dialog, calm-mode rules, focus rings.
- [ ] **Step 4:** Serve, and screenshot at 390 × 844 each of: wide/lidded/high, medium/sealed/low, medium/sealed/low/dim, close/lifted/off, wide/lifted/off/warm. Also 320 × 568 and 844 × 390. Fix what looks wrong.
- [ ] **Step 5:** Commit: `feat: shell, tokens and kitchen art`.

### Task 2: Logic core

**Files:**
- Create: `js/core/runner.js`, `js/core/hold.js`, `js/core/prefs.js`, `js/core/steps.js`, `js/data/script.js`, `js/data/eggs.js`
- Test: `tests/runner.test.js`, `tests/hold.test.js`, `tests/prefs.test.js`, `tests/steps.test.js`, `tests/script.test.js`, `tests/eggs.test.js`, `tests/contrast.test.js`

**Interfaces:**
- Consumes: `css/tokens.css` from Task 1 (read as text by the contrast test).
- Produces:
  - `createRunner(scenes, ctx)` → `{ start(fromId?) → Promise<void> }`
  - `createHold({ ms, tapMs = 250 })` → `{ press(t), release(t), progress(t) → number, done(t) → boolean }`
  - `createPrefs(storage, { reducedMotion = false } = {})` → `{ get(key), set(key, value), subscribe(fn) → unsubscribe }`. Keys and defaults: `sound: false`, `calm: reducedMotion`, `captions: false`, `spices: []`. Stored as JSON under `dum:prefs`.
  - `runSteps(steps, hooks, ui)` → `Promise<void>`, where `ui` has `say(text)`, `caption(text)`, `action(label, opts)`, all returning promises.
  - `script` (object keyed by scene id; `script.eat` is an array of six arrays of steps), `SCENES`, `CORE`, `spices`, `labels` from `js/data/script.js`.
  - `planEggs(spices, biteCount, rng = Math.random)` → array of length `biteCount` holding `null` or a spice id.

- [ ] **Step 1: Write the tests.** Create the seven test files with exactly this content.

`tests/runner.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRunner } from '../js/core/runner.js';

const scene = (id, log) => ({
  id,
  mount: () => log.push(`mount:${id}`),
  play: async () => { log.push(`play:${id}`); },
});

test('plays scenes in order and mounts each one once', async () => {
  const log = [];
  const runner = createRunner([scene('a', log), scene('b', log)], {});
  await runner.start();
  await runner.start('b');
  assert.deepEqual(log, ['mount:a', 'play:a', 'mount:b', 'play:b', 'play:b']);
});

test('passes the context to mount and play', async () => {
  const ctx = { marker: 1 };
  const seen = [];
  const runner = createRunner([{ id: 'a', mount: (c) => seen.push(c), play: async (c) => seen.push(c) }], ctx);
  await runner.start();
  assert.deepEqual(seen, [ctx, ctx]);
});

test('a scene without mount still plays', async () => {
  let played = false;
  await createRunner([{ id: 'a', play: async () => { played = true; } }], {}).start();
  assert.equal(played, true);
});

test('starting from an unknown id rejects', async () => {
  await assert.rejects(createRunner([scene('a', [])], {}).start('zzz'), /unknown scene/i);
});
```

`tests/hold.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createHold } from '../js/core/hold.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);

test('holding to the end completes', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  near(h.progress(500), 0.5);
  assert.equal(h.done(999), false);
  assert.equal(h.done(1000), true);
});

test('a quick tap keeps filling on its own', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  h.release(100);
  near(h.progress(600), 0.6);
  assert.equal(h.done(1000), true);
});

test('a long press released early drains back at the same rate', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  h.release(400);
  near(h.progress(400), 0.4);
  near(h.progress(600), 0.2);
  near(h.progress(900), 0);
  assert.equal(h.done(5000), false);
});

test('pressing again resumes from where it drained to', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  h.release(400);
  h.press(600);
  near(h.progress(800), 0.4);
  assert.equal(h.done(1450), true);
});

test('once done it stays done', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  assert.equal(h.done(1000), true);
  h.release(1001);
  h.press(2000);
  near(h.progress(9000), 1);
  assert.equal(h.done(9000), true);
});

test('progress before any press is zero', () => {
  near(createHold({ ms: 1000 }).progress(123), 0);
});
```

`tests/prefs.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrefs } from '../js/core/prefs.js';

const memory = (initial = {}) => {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
};

test('defaults', () => {
  const p = createPrefs(memory());
  assert.equal(p.get('sound'), false);
  assert.equal(p.get('calm'), false);
  assert.equal(p.get('captions'), false);
  assert.deepEqual(p.get('spices'), []);
});

test('calm defaults to the reduced-motion setting', () => {
  assert.equal(createPrefs(memory(), { reducedMotion: true }).get('calm'), true);
});

test('a stored value beats the default', () => {
  const store = memory({ 'dum:prefs': JSON.stringify({ calm: false }) });
  assert.equal(createPrefs(store, { reducedMotion: true }).get('calm'), false);
});

test('set stores and notifies', () => {
  const store = memory();
  const p = createPrefs(store);
  const seen = [];
  const off = p.subscribe((key, value) => seen.push([key, value]));
  p.set('captions', true);
  off();
  p.set('captions', false);
  assert.deepEqual(seen, [['captions', true]]);
  assert.equal(JSON.parse(store.data['dum:prefs']).captions, false);
});

test('broken storage and broken JSON are survived', () => {
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const p = createPrefs(throwing);
  p.set('calm', true);
  assert.equal(p.get('calm'), true);
  assert.equal(createPrefs(memory({ 'dum:prefs': '{not json' })).get('calm'), false);
});

test('unknown keys are rejected', () => {
  assert.throws(() => createPrefs(memory()).set('nope', 1), /unknown pref/i);
});
```

`tests/steps.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { runSteps } from '../js/core/steps.js';

const fakeUi = (log) => ({
  say: async (text) => { log.push(['say', text]); },
  caption: async (text) => { log.push(['cap', text]); },
  action: async (label, opts) => {
    log.push(['act', label, opts.hold ?? null, opts.rest ?? null]);
    if (opts.onProgress) opts.onProgress(1);
  },
});

test('order within a step is cue, caption, line, button', async () => {
  const log = [];
  const hooks = { boom: async () => { log.push(['cue', 'boom']); } };
  await runSteps([{ cue: 'boom', cap: '[bang]', say: 'Hello.', act: 'Do it', hold: 900, rest: 300 }], hooks, fakeUi(log));
  assert.deepEqual(log, [['cue', 'boom'], ['cap', '[bang]'], ['say', 'Hello.'], ['act', 'Do it', 900, 300]]);
});

test('the button label defaults to Go on', async () => {
  const log = [];
  await runSteps([{ say: 'One.' }], {}, fakeUi(log));
  assert.deepEqual(log.at(-1), ['act', 'Go on', null, null]);
});

test('act false shows no button', async () => {
  const log = [];
  await runSteps([{ say: 'The end.', act: false }], {}, fakeUi(log));
  assert.deepEqual(log, [['say', 'The end.']]);
});

test('cap null clears the caption and a missing cap leaves it alone', async () => {
  const log = [];
  await runSteps([{ cap: null, act: false }, { say: 'x', act: false }], {}, fakeUi(log));
  assert.deepEqual(log, [['cap', null], ['say', 'x']]);
});

test('holdCue receives progress and a missing hook is ignored', async () => {
  const seen = [];
  await runSteps([{ act: 'Hold', hold: 500, holdCue: 'press' }, { cue: 'absent', act: false }], { press: (p) => seen.push(p) }, fakeUi([]));
  assert.deepEqual(seen, [1]);
});
```

`tests/script.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { script, SCENES, CORE, spices, labels } from '../js/data/script.js';

const allSteps = () => SCENES.flatMap((id) => (id === 'eat' ? script.eat.flat() : script[id]));

test('scene lists', () => {
  assert.deepEqual(SCENES, ['arrival', 'marinate', 'fry', 'base', 'layer', 'seal', 'wait', 'reveal', 'eat', 'glow']);
  assert.deepEqual(CORE, ['arrival', 'seal', 'wait', 'reveal', 'eat', 'glow']);
  for (const id of SCENES) assert.ok(script[id]?.length > 0, `${id} has steps`);
});

test('six bites', () => {
  assert.equal(script.eat.length, 6);
  for (const bite of script.eat) assert.ok(bite.length > 0);
});

test('lines are short, captions are bracketed lowercase, labels are brief', () => {
  for (const step of allSteps()) {
    if (step.say) assert.ok(step.say.length <= 110, `too long: ${step.say}`);
    if (step.cap) assert.match(step.cap, /^\[[a-z ,']+\]$/);
    if (step.act) assert.ok(step.act.length <= 22, `label too long: ${step.act}`);
  }
});

test('no exclamation marks or emoji anywhere', () => {
  const text = JSON.stringify({ script, spices, labels });
  assert.doesNotMatch(text, /!/);
  assert.doesNotMatch(text, /\p{Extended_Pictographic}/u);
});

test('the wait is paced and nothing else is', () => {
  for (const step of script.wait) if (step.act !== false) assert.ok(step.rest >= 1500, 'wait steps rest');
  for (const id of SCENES.filter((s) => s !== 'wait' && s !== 'eat')) {
    for (const step of script[id]) assert.equal(step.rest, undefined, `${id} has no rest`);
  }
});

test('seven spices with unique ids, one of them rare', () => {
  assert.equal(spices.length, 7);
  assert.equal(new Set(spices.map((s) => s.id)).size, 7);
  assert.deepEqual(spices.filter((s) => s.weight < 1).map((s) => s.id), ['staranise']);
  for (const s of spices) {
    assert.ok(s.name && s.say.length > 0);
    for (const line of s.say) assert.ok(line.length <= 110);
  }
});

test('labels the shell needs', () => {
  for (const key of ['title', 'intro', 'withSound', 'quietly', 'silentHint', 'resumeSound', 'again', 'method', 'found']) {
    assert.equal(typeof labels[key], 'string', key);
  }
});
```

`tests/eggs.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { planEggs } from '../js/data/eggs.js';

const spices = [
  { id: 'a', weight: 1 }, { id: 'b', weight: 1 }, { id: 'c', weight: 1 }, { id: 'rare', weight: 0.15 },
];
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

test('one or two distinct eggs, never on the first or last bite', () => {
  const rng = seeded(7);
  for (let i = 0; i < 500; i++) {
    const plan = planEggs(spices, 6, rng);
    assert.equal(plan.length, 6);
    assert.equal(plan[0], null);
    assert.equal(plan[5], null);
    const found = plan.filter(Boolean);
    assert.ok(found.length === 1 || found.length === 2);
    assert.equal(new Set(found).size, found.length);
    for (const id of found) assert.ok(spices.some((s) => s.id === id));
  }
});

test('the rare spice turns up less often than a common one', () => {
  const rng = seeded(11);
  const count = { a: 0, rare: 0 };
  for (let i = 0; i < 2000; i++) for (const id of planEggs(spices, 6, rng)) if (id in count) count[id]++;
  assert.ok(count.rare > 0);
  assert.ok(count.rare < count.a / 2);
});
```

`tests/contrast.test.js`
```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8');
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `token --${name} exists`);
  return m[1];
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('text pairs meet 4.5:1', () => {
  for (const [fg, bg] of [['rice', 'night'], ['rice', 'iron'], ['rice', 'indigo'], ['rice', 'madder'], ['iron', 'saffron']]) {
    assert.ok(ratio(fg, bg) >= 4.5, `${fg} on ${bg} is ${ratio(fg, bg).toFixed(2)}`);
  }
});

test('control pairs meet 3:1', () => {
  for (const [fg, bg] of [['saffron', 'night'], ['saffron', 'indigo']]) {
    assert.ok(ratio(fg, bg) >= 3, `${fg} on ${bg} is ${ratio(fg, bg).toFixed(2)}`);
  }
});
```

- [ ] **Step 2: Run the tests and see them fail.** Run: `node --test`. Expected: the contrast test passes (tokens exist); the other six files fail with module-not-found errors.
- [ ] **Step 3: Write `js/data/script.js`.** Transcribe every line from design.md §3 "Script" and the easter-egg table, word for word, into the step format. Structure the steps so that: the Arrival scene has one step with `act: false` (its two start buttons use `labels.withSound` and `labels.quietly`); the Seal scene's second step has `act: 'Press the seal', hold: 1800, holdCue: 'pressing'` and its third has `cue: 'sealed'`; every Wait step has `act: 'Wait'` and `rest: 2000`, with cues `low` on the first and `off` on the last; the Lid-lift's first step is `{ act: 'Break the seal', hold: 1200, holdCue: 'cracking' }` with no line, its second ("The lid lifts…") has `cue: 'lift'`, and its third ("Then saffron…") has `cue: 'look'`; each bite's first step has `cue: 'bite'` and each bite ends on a step whose `act` is `'Take a bite'` except the sixth, which ends with the default label; the Glow's last step has `act: false`. Captions: use the examples in design.md §3 and add one per scene where the sound changes. `spices` ids are `elaichi`, `clove`, `cinnamon`, `pepper`, `bayleaf`, `chilli`, `staranise`; weight `1` except `staranise` at `0.15`. `labels`: `title` 'Dum', `intro` (the line under the title), `withSound` 'Start with sound', `quietly` 'Start quietly', `silentHint` 'No sound? Check the silent switch.', `resumeSound` 'Tap to bring the sound back', `again` 'Go again', `method` (the "Made the home way" line), `found` '{n} of 7 found'.
- [ ] **Step 4: Write the five modules**, each the smallest thing that passes its tests. `runSteps` order within a step is cue, caption, line, button, as the test fixes.
- [ ] **Step 5: Run the tests.** Run: `node --test`. Expected: all pass, 0 failures.
- [ ] **Step 6: Commit:** `feat: runner, hold, prefs, steps, script and egg planner with tests`.

### Task 3: UI layer

**Files:**
- Create: `js/core/ui.js`
- Modify: `js/main.js`, `css/app.css` (only if a class the UI needs is missing)

**Interfaces:**
- Consumes: the DOM ids from Task 1; `createHold`, `createPrefs`, `runSteps`, `labels` from Task 2.
- Produces: `createUI({ prefs, audio })` → `{ say(text) → Promise, caption(text) → Promise, action(label, { hold, rest, onProgress } = {}) → Promise, view(name) → Promise, run(steps, hooks) → Promise, card({ title, text, note, icons, choices }) → Promise<index> }`. `run` is `runSteps` bound to this ui. `audio` may be any object with `hit(name)`.

Behaviour:
- `say` replaces the text in `#line` (an `aria-live="polite"` region) and resolves when its fade-in ends: about 500 ms, or at once in calm mode.
- `caption` sets `#cap`; it is visible only while `prefs.get('captions')` is true. `null` empties it.
- `run(steps, hooks)` empties `#line` before its first step, so a line from the previous scene never sits above a new button.
- `action` shows `#act` with the label and resolves when it is activated. With `rest`, the button carries `aria-disabled="true"` for that long and ignores presses, and so does the stage-tap shortcut; never use the `disabled` attribute, which would drop keyboard focus. With `hold`, pressing fills `#act-ring` using `createHold`; `onProgress` is called every frame with 0 to 1; a tap under 250 ms, Enter or Space completes it on its own; in calm mode any activation completes at once. Without `hold`, a click on `#stage` also activates it. Each activation calls `audio.hit('tap')`.
- `card` fills and shows `#card` and hides the narration line and `#act` while it is up: `title` and `text` as headings, `note` as small text, `icons` (an array of spice ids, optional) as a row of `<svg><use href="#t-egg-<id>">` icons, and one button per entry in `choices`. It resolves with the index of the button chosen and hides the card. Used by Arrival and by the end card.
- `view` sets `data-view` on `#stage` and resolves when the transition ends, with a timeout fallback of the CSS duration plus 100 ms; at once in calm mode.
- The settings dialog: `#open-settings` opens `#settings` with `showModal()`. The three toggles are bound both ways to `prefs` keys `sound`, `calm` and `captions`. `document.documentElement.dataset.calm` mirrors the calm pref.
- Pointer Events only (`pointerdown`, `pointerup`, `pointercancel`), plus `keydown`/`keyup` for Enter and Space. No `touchstart` or `mousedown`.

- [ ] **Step 1:** Write `js/core/ui.js`.
- [ ] **Step 2:** In `js/main.js`, keep the query-string state switcher, and add a temporary demo behind `?demo=ui` that runs: a line, a plain button, a line, a hold button (ring visible), a rested button, then `view('medium')`.
- [ ] **Step 3:** Serve and check `?demo=ui` by hand or by browser automation: the ring fills on hold, a quick tap completes it, Enter completes it, the rested button is disabled first, focus is visible, the settings toggles work and survive a reload.
- [ ] **Step 4:** Run `node --test`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat: ui layer with hold-or-tap button, captions, views and settings`.

### Task 4: Audio engine

**Files:**
- Create: `js/core/audio.js`
- Modify: `js/main.js` (a temporary `?demo=audio` page with one button per voice)

**Interfaces:**
- Produces: `createAudio()` → `{ unlock() → Promise<boolean>, mute(on), bed(name, level = 1, fade = 1.5), stop(name, fade = 1.5), hit(name), muffle(amount, seconds = 1.5), pause(), resume() → Promise<boolean> }`.
  - Beds: `rain`, `flame`, `sizzle`, `simmer`, `drone`. Hits: `tap`, `thud`, `crack`, `steam`, `chime`, `spoon`.
  - No method ever throws, locked or not. `bed`, `stop` and `muffle` are recorded as the wanted state even while locked or muted, and that state is applied when `unlock()` succeeds or `mute(false)` is called. `hit` is dropped while locked or muted. `mute(true)` fades the master to silence in 300 ms and keeps the context.
  - `unlock()` must be called inside a user gesture; it sets `navigator.audioSession.type = 'playback'` when that API exists (in a try/catch), creates one `AudioContext` (or resumes the existing one), and resolves `false` if there is no Web Audio. Calling it twice is safe.
  - `muffle(1)` closes a lowpass on everything except `rain` to about 600 Hz; `muffle(0)` opens it to 18 kHz with an exponential ramp. `rain` gets a gentler version (down to about 2 kHz).
  - `pause()` fades the master to silence in 200 ms and suspends; `resume()` resumes and fades in, resolving `false` if the context is still not running (the caller then shows `labels.resumeSound`).

Read first: `docs/research/07-web-audio.md` §1 (recipes and code sketches), §2 (muffle and reverb), §3 (platform facts) and §5 (mixing). Use those recipes. One noise buffer of 4 seconds is generated once and shared. A `DynamicsCompressorNode` sits on the master as a limiter. Cap live bubble voices at 12 and crackle voices at 8. Randomise crackle timing, filter frequency and gain so loops are not heard.

- [ ] **Step 1:** Write `js/core/audio.js`. No libraries, no audio files.
- [ ] **Step 2:** Add the `?demo=audio` page: an unlock button, a start and stop button per bed, a button per hit, and a slider for `muffle`.
- [ ] **Step 3:** Serve, open `?demo=audio` and confirm in the browser console that no errors are thrown when every control is used before and after unlock, and that `pause()` then `resume()` works.
- [ ] **Step 4:** Run `node --test`. Expected: all pass.
- [ ] **Step 5:** Commit: `feat: web audio engine with beds, hits and muffle`.

Report honestly: nobody in this task can hear the result. Say which voices were only checked for "runs without error".

### Task 5: Steam

**Files:**
- Create: `js/core/steam.js`
- Modify: `js/main.js` (a temporary `?demo=steam`)

**Interfaces:**
- Consumes: `#steam` (a canvas covering the stage) from Task 1; `prefs` from Task 2.
- Produces: `createSteam(canvas, prefs)` → `{ wisp(on), plume() → Promise<void>, clear() }`.
  - `wisp(true)` starts a thin thread of steam rising from the point given by the canvas's `data-x` and `data-y` attributes (fractions of width and height, set by scenes); `wisp(false)` lets it die out.
  - `plume()` releases a large backlit plume from the same point and resolves when it has thinned enough to see through (about 2.5 s).
  - In calm mode `wisp` draws one still puff and `plume` draws one still frame, holds it 1200 ms, fades it and resolves.

Read first: `docs/research/06-visual-effect-techniques.md` §1.2 and the "Day-sized builds" note on 1b. Build it that way: one soft round sprite drawn once to an offscreen canvas, 40 to 60 particles for the plume stamped with `drawImage` under `globalCompositeOperation = 'lighter'`, the canvas backing store at 0.6 of CSS size and never above device pixel ratio 2, one `requestAnimationFrame` loop that stops itself when no particles are alive, and nothing running while the page is hidden.

- [ ] **Step 1:** Write `js/core/steam.js`.
- [ ] **Step 2:** Add `?demo=steam` with buttons for wisp on, wisp off and plume, over the kitchen art in `close` view.
- [ ] **Step 3:** Serve and check: the loop stops when idle (log once when it stops and once when it starts, then remove the logs), calm mode shows stills, the plume reads as steam and not as dots.
- [ ] **Step 4:** Commit: `feat: canvas steam wisp and plume`.

### Task 6: Core scenes, arrival to lid-lift

**Files:**
- Create: `js/scenes/arrival.js`, `js/scenes/seal.js`, `js/scenes/wait.js`, `js/scenes/reveal.js`
- Modify: `js/main.js` (real boot: build `ctx`, list the scenes that exist in `CORE` order, start the runner; keep `?from=<id>` to start at a scene; remove the three demos)

**Interfaces:**
- Consumes: everything from Tasks 1 to 5.
- Produces: four scene modules following the scene contract; `main.js` exporting nothing.

Choreography (each line of script comes from `ctx.script[id]` through `ctx.ui.run`):
- **arrival:** view `wide`, pot `lidded`, flame `high`, light `normal`. `ui.card({ title: labels.title, text: labels.intro, note: labels.silentHint, choices: [labels.withSound, labels.quietly] })`. On "with sound": `await audio.unlock()`, `prefs.set('sound', true)`, `audio.bed('rain', 0.5)`, `audio.bed('flame', 0.3)`. On "quietly": `prefs.set('captions', true)`.
- **seal:** view `medium`, pot `lidded`, flame `high`, light `normal`, `--seal` 0, `audio.muffle(0)`, `audio.bed('rain', 0.5)`, `audio.bed('flame', 0.3)`, `audio.stop('drone')` (this scene is also where a replay starts). The `pressing` hook sets `--seal` on `#kitchen` from progress. The `sealed` hook sets pot `sealed` and calls `audio.hit('thud')`.
- **wait:** view `wide`, pot `sealed`, light `dim`, `audio.muffle(1, 3)`, `steam.wisp(true)` from the seal. Hook `low` sets flame `low`; hook `off` sets flame `off` and `audio.stop('flame', 3)`. The pot is never hidden.
- **reveal:** view `close`, pot `sealed`, flame `off`. Hook `cracking` drives the opacity of crack marks on the seal from progress. Hook `lift` must return quickly so its line shows while the steam is up: `steam.wisp(false)`, pot `cracked`, `audio.hit('crack')`, then after 300 ms pot `lifted`, `audio.muffle(0, 1.5)`, `audio.hit('steam')`, and it starts `steam.plume()` without awaiting it, keeping the promise. Hook `look` awaits that promise, then `audio.hit('chime')`, then view `top` with `#top` showing `pot`.
- `main.js` wiring:
  - Sound pref: `prefs.subscribe` on `sound` calls `audio.unlock()` then `audio.mute(false)` when it turns on (the toggle click is the gesture) and `audio.mute(true)` when it turns off.
  - `visibilitychange`: hidden calls `audio.pause()`; visible calls `audio.resume()` and, if it resolves `false` while the sound pref is on, shows `labels.resumeSound` as a button that resumes on tap.
  - Replay: the last scene's `play` resolves when the viewer chooses to go again. `main.js` then loops `runner.start(<the scene after arrival>)` for ever, except under `auto=1`.
  - Errors: `error` and `unhandledrejection` listeners set `data-error` on `<html>`.

- [ ] **Step 1:** Write the four scenes and the real `main.js`.
- [ ] **Step 2:** Serve. Play from the start to the lid-lift in both "with sound" and "quietly", and again with calm mode on. Check: no console errors, nothing advances by itself, the Wait button rests between lines, the settings toggles work mid-scene.
- [ ] **Step 3:** Run `node --test`. Expected: all pass.
- [ ] **Step 4:** Commit: `feat: arrival, seal, wait and lid-lift scenes`.

### Task 7: Top-down art

**Files:**
- Create: `js/art/topdown.js`
- Modify: `css/app.css` (art states for `#top`), `js/main.js` (mount it; query-string switches `show`, `eaten`, `egg`)

**Interfaces:**
- Produces: `topdownSVG` exported from `js/art/topdown.js`, mounted into `#top`. State attributes on `#top`: `data-show="pot" | "plate" | "bowl"`; `data-eaten="0".."6"` (how many of the six portions are gone); `data-egg="<spice id>"` or absent (which spice icon shows on the spoon). Groups with ids `t-pot`, `t-plate`, `t-bowl`, `t-portion-1` to `t-portion-6`, `t-spoon`, `t-salan`, `t-dahi`, and one `t-egg-<id>` per spice id.

Art direction: read design.md §4 and look at `js/art/kitchen.js` first; match its construction exactly (flat shapes, baked offset shadows, slightly irregular hand-cut edges, token colours only).
- **Pot from above:** copper rim, pale rice with visible long grains suggested by short strokes, six to ten saffron streaks, dark fried onion curls, mint leaves, a soft warm light from the upper left. No chicken visible.
- **Plate:** a steel plate, a mound of biryani made of six portion groups that can vanish one by one from the outside in, chicken visible only from the second portion on, a spoon lying with its handle toward the lower right, a small bowl of salan (brown-red) and one of dahi chutney (white with green flecks), two onion rings and a lemon wedge.
- **Spice icons:** seven small icons, each recognisable in 44 px: cardamom pod, clove, cassia bark stick, peppercorn, a long three-veined tej patta leaf, a slit green chilli, a star anise.
- **Bowl:** a plain mixing bowl from above with pale curd in it, for Task 9.

- [ ] **Step 1:** Write the SVG and the CSS states.
- [ ] **Step 2:** Serve and screenshot at 390 × 844: the pot; the plate at eaten 0, 3 and 6; each spice icon. Fix what looks wrong.
- [ ] **Step 3:** Commit: `feat: top-down pot, plate and spice art`.

### Task 8: Eat, glow and easter eggs

**Files:**
- Create: `js/scenes/eat.js`, `js/scenes/glow.js`
- Modify: `js/main.js` (add both to the scene list), `css/app.css` (end card)

**Interfaces:**
- Consumes: `planEggs`, `spices`, `script.eat`, `labels`, the `#top` states from Task 7.
- Produces: two scene modules.

Choreography:
- **eat:** view `top`, `#top` showing `plate`. At the start, `plan = planEggs(spices, 6)`. For bite `i`: run `script.eat[i]`; its `bite` hook sets `data-eaten` to `i + 1` and calls `audio.hit('spoon')`. After bite `i`, if `plan[i]` names a spice: set `data-egg`, run that spice's `say` lines as steps, add the id to `prefs` `spices` if new, then clear `data-egg`.
- **glow:** view `wide`, pot `lifted`, light `warm`, `audio.bed('drone', 0.4, 4)`, `audio.bed('rain', 0.2, 6)`. Run `script.glow`, then `ui.card({ title: labels.title, text: labels.method, icons: prefs.get('spices'), note: labels.found with {n} filled in, choices: [labels.again] })`; when it resolves, `play` resolves, and `main.js` starts the next round (Task 6 wiring).

- [ ] **Step 1:** Write both scenes and the end card.
- [ ] **Step 2:** Serve and play the whole core from Arrival to the end card and round again. Check: six bites, one or two eggs, found spices persist across a reload, "Go again" works twice running, no console errors, calm mode works throughout.
- [ ] **Step 3:** Run `node --test`. Expected: all pass.
- [ ] **Step 4:** Commit: `feat: eating journey, easter eggs and ending`.

### Task 9: Cook scenes

**Files:**
- Create: `js/scenes/marinate.js`, `js/scenes/fry.js`, `js/scenes/base.js`, `js/scenes/layer.js`
- Modify: `js/art/topdown.js` and `css/app.css` (cooking states), `js/main.js` (use `SCENES` order)

**Interfaces:**
- Produces: four scene modules; new `#top` attribute `data-cook` with values `curd`, `paste`, `spiced`, `folded`, `raw`, `golden`, `masala`, `rice`, `saffron`, `garnished`, each showing the vessel's contents at that stage.

Choreography: each scene runs its script steps; cues switch `data-cook`. **fry** uses a hold with `audio.bed('sizzle')` rising with progress and falling when done. **base** uses `audio.bed('simmer', 0.4)`. **layer** grows the saffron streaks with `scale` and `opacity` from their seed points (research/06 §2.4). Chicken is shown only in fry and base, never raw in close detail.

- [ ] **Step 1:** Add the cooking states to the art, then write the four scenes.
- [ ] **Step 2:** Serve and play from Arrival to the end. Check the same list as Task 8, plus: the piece still works with `?from=seal`.
- [ ] **Step 3:** Commit: `feat: marinate, fry, base and layer scenes`.

### Task 10: Polish and README

**Files:**
- Create: `README.md`
- Modify: `css/app.css`, `js/main.js`

- [ ] **Step 1:** One static paper-grain tile over the stage: draw noise once into a 128 px canvas at load, use it as a repeating background on a `pointer-events: none` layer at low opacity. Never animate it.
- [ ] **Step 2:** Check at 320 × 568, 390 × 844 and 844 × 390 that nothing overflows and every button is at least 44 px. Tab through the whole piece with the keyboard.
- [ ] **Step 3:** Write `README.md`: what it is in two sentences, how to run it, how to test it, the map of `docs/`, credits for Fraunces and Literata (SIL Open Font Licence), and the list from "Left for the user" below.
- [ ] **Step 4:** Run `node --test`. Commit: `feat: paper grain, small-screen fixes and README`.

## Left for the user

These cannot be verified from this machine and are not claimed:

1. How it sounds on a phone speaker and on headphones (research/07, "Needs listening tests").
2. Frame rate and heat on a mid-range Android phone (research/06, "Needs a prototype to settle").
3. iPhone: the silent switch, and returning from a locked screen.
4. Whether it makes anyone hungry, above all someone who doesn't like biryani.
5. Whether the script and the Hyderabadi details ring true.
6. Where to host it, and the go-ahead to publish.
