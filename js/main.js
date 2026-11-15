import { kitchenSVG } from './art/kitchen.js';
import { topdownSVG } from './art/topdown.js';
import { createAudio } from './core/audio.js';
import { createPrefs } from './core/prefs.js';
import { createRunner } from './core/runner.js';
import { createSteam } from './core/steam.js';
import { createUI } from './core/ui.js';
import { labels, script, spices, SCENES } from './data/script.js';
import arrival from './scenes/arrival.js';
import seal from './scenes/seal.js';
import wait from './scenes/wait.js';
import reveal from './scenes/reveal.js';

const fail = (msg) => { document.documentElement.dataset.error = String(msg); };
window.addEventListener('error', (e) => fail(e.message));
window.addEventListener('unhandledrejection', (e) => fail(e.reason?.message ?? e.reason));

let storage;
try { storage = window.localStorage; storage.getItem('dum:probe'); } catch {
  const mem = {};
  storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
}
const prefs = createPrefs(storage, { reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
const audio = createAudio();
const steam = createSteam(document.getElementById('steam'), prefs);
const ui = createUI({ prefs, audio });

const stage = document.getElementById('stage');
stage.insertAdjacentHTML('afterbegin', kitchenSVG + topdownSVG);
const kitchen = document.getElementById('kitchen');
const top = document.getElementById('top');
const q = new URLSearchParams(location.search);

prefs.subscribe((key, value) => {
  if (key !== 'sound') return;
  if (value) audio.unlock().then(() => audio.mute(false)).catch(() => {});
  else audio.mute(true);
});

let resumeBtn;
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) return void audio.pause();
  if (await audio.resume() || !prefs.get('sound') || q.has('auto') || resumeBtn) return;
  resumeBtn = document.createElement('button');
  resumeBtn.type = 'button';
  resumeBtn.textContent = labels.resumeSound;
  resumeBtn.style.cssText = 'position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 50; min-height: 44px; padding: 0 16px';
  resumeBtn.addEventListener('click', async () => {
    if (await audio.resume()) { resumeBtn.remove(); resumeBtn = null; }
  });
  document.body.append(resumeBtn);
});

// ---- developer switches for screenshots ----
// Only without auto/from, so they cannot interfere with a real run. e.g.
// /?view=medium&pot=sealed&flame=low&light=dim&line=Hello&act=Go+on
// Using one also stops the scenes from starting, so the forced state stays on screen.
const DEV = ['view', 'pot', 'flame', 'light', 'seal', 'crack', 'calm', 'cap', 'line', 'settings', 'act', 'card', 'show', 'eaten', 'egg'];
const dev = !q.has('auto') && !q.has('from') && DEV.some((k) => q.has(k));
if (dev) {
  if (q.has('view')) stage.dataset.view = q.get('view');
  for (const key of ['pot', 'flame', 'light']) if (q.has(key)) kitchen.dataset[key] = q.get(key);
  for (const key of ['seal', 'crack']) if (q.has(key)) kitchen.style.setProperty(`--${key}`, q.get(key));
  for (const key of ['show', 'eaten', 'egg']) if (q.has(key)) top.dataset[key] = q.get(key);
  if (q.has('show')) stage.dataset.view = 'top';
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
}

// ---- the run ----
const ctx = { ui, audio, steam, prefs, script, spices, kitchen, top };
const modules = { arrival, seal, wait, reveal };
const scenes = SCENES.filter((id) => modules[id]).map((id) => modules[id]);
const runner = createRunner(scenes, ctx);
const last = scenes[scenes.length - 1].id;
if (!dev) (async () => {
  await runner.start(q.get('from') ?? undefined);
  document.documentElement.dataset.done = '1';
  // Round loop: Task 8 adds glow, after which the piece goes round again.
  while (last === 'glow' && !q.has('auto')) await runner.start(scenes[1].id);
})();
