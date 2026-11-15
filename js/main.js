import { kitchenSVG } from './art/kitchen.js';
import { topdownSVG } from './art/topdown.js';
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
