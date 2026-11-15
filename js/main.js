import { kitchenSVG } from './art/kitchen.js';
import { topdownSVG } from './art/topdown.js';
import { createAudio } from './core/audio.js';
import { createPrefs } from './core/prefs.js';
import { createUI } from './core/ui.js';
import { labels } from './data/script.js';

const fail = (msg) => { document.documentElement.dataset.error = String(msg); };
window.addEventListener('error', (e) => fail(e.message));
window.addEventListener('unhandledrejection', (e) => fail(e.reason?.message ?? e.reason));

let storage;
try { storage = window.localStorage; storage.getItem('dum:probe'); } catch {
  const mem = {};
  storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
}
const prefs = createPrefs(storage, { reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
const ui = createUI({ prefs, audio: { hit() {} } }); // real audio arrives in a later task

const stage = document.getElementById('stage');
stage.insertAdjacentHTML('afterbegin', kitchenSVG + topdownSVG);
const kitchen = document.getElementById('kitchen');

// Query-string state switcher, so any state can be screenshotted, e.g.
// /?view=medium&pot=sealed&flame=low&light=dim&line=Hello&act=Go+on
const q = new URLSearchParams(location.search);
if (q.has('view')) stage.dataset.view = q.get('view');
for (const key of ['pot', 'flame', 'light']) if (q.has(key)) kitchen.dataset[key] = q.get(key);
for (const key of ['seal', 'crack']) if (q.has(key)) kitchen.style.setProperty(`--${key}`, q.get(key));
if (q.has('calm')) document.documentElement.dataset.calm = 'true';
if (q.has('cap')) { ui.caption(q.get('cap')); document.getElementById('cap').hidden = false; }
if (q.has('line')) document.getElementById('line').textContent = q.get('line');
if (q.has('settings')) document.getElementById('settings').showModal();
if (q.has('act')) {
  const act = document.getElementById('act');
  act.hidden = false;
  document.getElementById('act-label').textContent = q.get('act');
  if (q.has('p')) { act.dataset.hold = ''; act.style.setProperty('--p', q.get('p')); }
}
if (q.has('card')) {
  ui.card({ title: labels.title, text: labels.intro, note: labels.silentHint, choices: [labels.withSound, labels.quietly] });
}
if (q.get('demo') === 'ui') { // temporary, deleted in Task 6
  (async () => {
    await ui.run([
      { say: 'A line, then a plain button.' },
      { say: 'Now a hold button.', act: 'Hold me', hold: 900, holdCue: 'ring' },
      { say: 'Now a rested button.', act: 'Wait for it', rest: 1200 },
    ], { ring() {} });
    await ui.view('medium');
    await ui.card({ title: 'Done', text: 'Demo card.', choices: ['One', 'Two'] });
    document.documentElement.dataset.done = '1';
  })();
}
if (q.get('demo') === 'audio') { // temporary, deleted in Task 6
  const AC = window.AudioContext; // capture the context so the check script can read its state
  if (AC) window.AudioContext = class extends AC { constructor(...a) { super(...a); window.__ctx = this; } };
  const audio = createAudio();
  window.__audioDemo = { audio, state: () => window.__ctx?.state ?? 'none' };
  const box = document.createElement('div');
  box.style.cssText = 'position: fixed; inset: auto 0 0 0; z-index: 99; background: #fff; color: #000; padding: 6px; font: 14px sans-serif; max-height: 50vh; overflow: auto';
  const btn = (text, fn) => { const b = document.createElement('button'); b.textContent = text; b.onclick = fn; box.append(b, ' '); };
  btn('unlock', () => audio.unlock());
  btn('mute on', () => audio.mute(true));
  btn('mute off', () => audio.mute(false));
  btn('pause', () => audio.pause());
  btn('resume', () => audio.resume());
  for (const n of ['rain', 'flame', 'sizzle', 'simmer', 'drone']) { btn(`${n} start`, () => audio.bed(n, 1)); btn(`${n} stop`, () => audio.stop(n)); }
  for (const n of ['tap', 'thud', 'crack', 'steam', 'chime', 'spoon']) btn(n, () => audio.hit(n));
  const r = document.createElement('input');
  r.type = 'range'; r.min = 0; r.max = 1; r.step = 0.01; r.value = 0;
  r.oninput = () => audio.muffle(Number(r.value));
  box.append('muffle ', r);
  document.body.append(box);
}
