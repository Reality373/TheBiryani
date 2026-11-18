// Boot and the chapter loop. Dev switches are listed in docs/plan.md ("Dev switches").
import { createAudio } from './core/audio.js';
import { createPrefs } from './core/prefs.js';
import { createStage } from './core/stage.js';
import { createHotspots } from './core/hotspot.js';
import { createVoice } from './core/voice.js';
import { createUI } from './core/ui.js';
import { advance, continueTarget, indexOf } from './core/progress.js';
import { chapters } from './data/chapters.js';
import { labels } from './data/labels.js';

const fail = (msg) => { document.documentElement.dataset.error = String(msg); };
window.addEventListener('error', (e) => fail(e.message));
window.addEventListener('unhandledrejection', (e) => fail(e.reason?.message ?? e.reason));

let storage;
try { storage = window.localStorage; storage.getItem('dum:probe'); } catch {
  const mem = {};
  storage = { getItem: (k) => mem[k] ?? null, setItem: (k, v) => { mem[k] = v; } };
}
const q = new URLSearchParams(location.search);
const auto = q.has('auto');
const prefs = createPrefs(storage, { reducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches });
const calm = () => q.get('calm') === '1' || prefs.get('calm');
const audio = createAudio();
if (q.has('reached')) prefs.set('reached', q.get('reached')); // dev: pretend a chapter was reached (screenshots of the Continue choice)

prefs.subscribe((key, value) => {
  if (key !== 'sound') return;
  if (value) audio.unlock().then(() => audio.mute(false)).catch(() => {});
  else audio.mute(true);
});

let resumeBtn;
document.addEventListener('visibilitychange', async () => {
  if (document.hidden) return void audio.pause();
  if (await audio.resume() || !prefs.get('sound') || auto || resumeBtn) return;
  resumeBtn = document.createElement('button');
  resumeBtn.type = 'button';
  resumeBtn.textContent = labels.resumeSound;
  resumeBtn.style.cssText = 'position: fixed; left: 50%; bottom: 16px; transform: translateX(-50%); z-index: 50; min-height: 44px; padding: 0 16px';
  resumeBtn.addEventListener('click', async () => {
    if (await audio.resume()) { resumeBtn.remove(); resumeBtn = null; }
  });
  document.body.append(resumeBtn);
});

// ---- the parts ----
let ctl = null; // AbortController of the running chapter
let jumpTo = null;
// Chapter beds are not listed here (they register in audio.js), so only the shared ones are stopped; each chapter sets its own sound on play.
const jump = (id) => {
  jumpTo = id;
  voice.clear();
  for (const bed of ['rain', 'flame', 'sizzle', 'simmer', 'drone']) audio.stop(bed, 0.5);
  audio.muffle(0, 0.5);
  ctl?.abort();
};
const ui = createUI({ prefs, calm, auto, chapters, onJump: jump });
const stage = createStage({ el: document.getElementById('stage'), camera: document.getElementById('camera'), calm, auto, params: q });
const hotspot = createHotspots({ stage, ui, calm, auto });
const voice = createVoice({ prefs, ui, audio, auto });
if (q.has('settings')) document.getElementById('settings').showModal();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const load = {};
const loadChapter = (c) => (load[c.id] ??= import(`./chapters/${c.id}.js`).then(async (m) => ({ mod: m.default, art: (await m.default.art()).default })));
const prefetch = (c) => c && loadChapter(c).catch(() => {}); // a failure still surfaces when that chapter is awaited

async function runChapter(c, index, signal) {
  const { mod, art } = await loadChapter(c);
  await stage.show(art(q));
  if (signal.aborted) return;
  hotspot.signal = signal;
  const aborted = new Promise((r) => signal.addEventListener('abort', r, { once: true }));
  const ctx = {
    stage, hotspot, voice, audio, ui, prefs, params: q, auto, calm, signal, mood: c.mood,
    wait: (ms) => (auto ? Promise.resolve() : Promise.race([sleep(ms), aborted])),
  };
  await ui.chapter(index, c.numeral, c.title);
  if (signal.aborted) return;
  await Promise.race([mod.play(ctx), aborted]);
}

async function run() {
  const want = q.get('ch');
  let list, start = 0;
  if (want) {
    const i = indexOf(chapters, want);
    list = i < 0 ? [{ id: want, numeral: '', title: want[0].toUpperCase() + want.slice(1), mood: 'night' }]
      : chapters.filter((c, k) => k >= i && (k === i || c.built));
  } else {
    list = chapters.filter((c) => c.built);
    const resume = continueTarget(chapters, prefs.get('reached'), (c) => c.built || q.has('reached'));
    const choice = await ui.card({
      kind: 'title', title: labels.title, text: labels.tagline, meta: labels.length, foot: labels.silentHint, note: labels.placeholder,
      choices: [
        ...(resume ? [{ label: labels.continue.replace('{title}', resume.title), sound: 'keep' }] : []),
        { label: labels.withSound, sound: true },
        { label: labels.quietly, sound: false },
      ],
    });
    if (resume && choice === 0) start = list.findIndex((c) => c.id === resume.id);
  }

  for (let again = true; again; start = 0) {
    for (let i = Math.max(0, start); i < list.length; i++) {
      if (!auto) prefetch(list[i + 1]);
      ctl = new AbortController();
      const c = list[i];
      const index = indexOf(chapters, c.id);
      if (index >= 0) prefs.set('reached', advance(chapters, prefs.get('reached'), c.id));
      await runChapter(c, index, ctl.signal);
      if (jumpTo) {
        const j = list.findIndex((x) => x.id === jumpTo);
        jumpTo = null;
        if (j >= 0) { i = j - 1; continue; }
      }
      if (c.id === 'end') prefs.set('reached', null);
    }
    again = !auto && !want && list.at(-1)?.id === 'end'; // after the end, the piece can go round again
  }
  document.documentElement.dataset.done = '1';
}

run().catch(fail);
