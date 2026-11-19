// Voice-over queue. A line plays from a recorded file if one exists, else speech synthesis, else the subtitle just stays up.
// Lines queue (a new one follows, never cuts off); every line has a safety timeout, so nothing can stall.
import voiceFiles from '../data/voice-files.js';

export const timeoutFor = (text) => Math.max(1800, 65 * text.length + 900);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

export function createVoice({
  prefs, ui, audio, auto = false,
  loadLines = (chapter) => import(`../data/lines/${chapter}.js`).then((m) => m.default),
  files = voiceFiles, synth = globalThis.speechSynthesis, sleep = wait, now = () => performance.now(),
}) {
  const cache = {};
  let queue = [];
  let running = false;
  let interrupt = () => {};
  // Narration follows the viewer's actions. Lines said together (within BURST_MS) are one burst and play in order; a later burst
  // means the viewer did something new, so lines of earlier bursts still waiting are dropped, and the one on screen gives way
  // once it has been up for MIN_SHOW.
  const BURST_MS = 400, MIN_SHOW = 700; // a line is cut short 0.7 s after the viewer does something new
  let burst = 0, lastSayAt = -Infinity, current = null;
  let generation = 0; // clear() bumps it, so a line still being looked up when the viewer jumps is dropped

  async function lookup(id) {
    const [chapter, key] = id.split('.');
    try {
      const lines = await (cache[chapter] ??= loadLines(chapter));
      if (typeof lines?.[key] === 'string') return lines[key];
    } catch { /* fall through */ }
    queueMicrotask(() => { throw new Error(`voice: no line "${id}"`); }); // visible as data-error, never stalls
    return null;
  }

  // Resolves when the spoken line ends. May never resolve: the caller races it with a timeout.
  function speak(id, text, stopped) {
    if (files.includes(id)) {
      const a = new Audio(`audio/voice/${id}.mp3`);
      stopped.then(() => a.pause());
      return new Promise((r) => { a.onended = a.onerror = r; a.play().catch(r); });
    }
    if (!synth || !synth.getVoices().length) return new Promise(() => {});
    const u = new SpeechSynthesisUtterance(text);
    const voices = synth.getVoices();
    u.voice = voices.find((v) => /^en[-_]IN/i.test(v.lang)) ?? voices.find((v) => /^en/i.test(v.lang)) ?? null;
    u.lang = u.voice?.lang ?? 'en';
    u.rate = 0.92;
    stopped.then(() => synth.cancel());
    return new Promise((r) => { u.onend = u.onerror = r; synth.speak(u); });
  }

  async function play(id) {
    const gen = generation;
    const text = await lookup(id);
    if (text === null || gen !== generation) return;
    ui.subtitle(text);
    const voiced = prefs.get('sound') && prefs.get('voice');
    const stopped = new Promise((r) => { interrupt = r; });
    const limit = sleep(timeoutFor(text));
    if (!voiced) return void await Promise.race([limit, stopped]);
    audio.duck(true);
    try { await Promise.race([speak(id, text, stopped), limit, stopped]); } finally { audio.duck(false); interrupt(); }
  }

  async function pump() {
    if (running) return;
    running = true;
    while (queue.length) {
      const item = queue.shift();
      const mine = current = { burst: item.burst, since: now() };
      try { await play(item.id); } catch { /* never rejects */ }
      if (current === mine) current = null;
      item.resolve();
    }
    running = false;
  }

  return {
    say(id) {
      if (auto) { lookup(id).then((t) => t && ui.subtitle(t)); return Promise.resolve(); }
      const t = now();
      if (t - lastSayAt > BURST_MS) {
        burst++;
        queue = queue.filter((i) => (i.burst < burst ? (i.resolve(), false) : true));
        const cur = current;
        if (cur) setTimeout(() => { if (current === cur) interrupt(); }, Math.max(0, MIN_SHOW - (t - cur.since)));
      }
      lastSayAt = t;
      return new Promise((resolve) => { queue.push({ id, resolve, burst }); pump(); });
    },
    clear() {
      generation++;
      const q = queue;
      queue = [];
      q.forEach((i) => i.resolve());
      interrupt();
    },
  };
}
