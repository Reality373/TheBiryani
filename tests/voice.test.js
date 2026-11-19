import test from 'node:test';
import assert from 'node:assert/strict';
import { createVoice, timeoutFor } from '../js/core/voice.js';

const lines = { a: 'one', b: 'two', c: 'three' };
const make = (over = {}) => {
  const shown = [], ducks = [];
  const voice = createVoice({
    prefs: { get: (k) => (k === 'sound' || k === 'voice' ? over.voiced ?? false : null) },
    ui: { subtitle: (t) => shown.push(t) }, audio: { duck: (on) => ducks.push(on) },
    loadLines: async () => lines, files: [], synth: over.synth ?? null, sleep: over.sleep ?? (() => Promise.resolve()),
  });
  return { voice, shown, ducks };
};

test('timeout is max(1800, 65 ms per character + 900)', () => {
  assert.equal(timeoutFor('x'), 1800);
  assert.equal(timeoutFor('x'.repeat(100)), 65 * 100 + 900);
});

test('lines queue in order and always resolve, even with no voice', async () => {
  const { voice, shown } = make();
  await Promise.all([voice.say('t.a'), voice.say('t.b'), voice.say('t.c')]);
  assert.deepEqual(shown, ['one', 'two', 'three']);
});

test('a speech that never ends cannot stall: the timeout resolves it, and ducking is undone', async () => {
  const synth = { getVoices: () => [{ lang: 'en-GB' }], speak() {}, cancel() {} };
  globalThis.SpeechSynthesisUtterance = class { };
  const { voice, ducks } = make({ voiced: true, synth });
  await voice.say('t.a');
  assert.deepEqual(ducks, [true, false]);
});

test('clear releases everything waiting', async () => {
  let release;
  const { voice, shown } = make({ sleep: () => new Promise((r) => { release = r; }) });
  const first = voice.say('t.a');
  const second = voice.say('t.b');
  await new Promise((r) => setTimeout(r, 5));
  voice.clear();
  await Promise.all([first, second]);
  assert.deepEqual(shown, ['one']);
  assert.equal(typeof release, 'function');
});

test('a line still being looked up when the viewer jumps is dropped', async () => {
  let open;
  const gate = new Promise((r) => { open = r; });
  const shown = [];
  const voice = createVoice({
    prefs: { get: () => null }, ui: { subtitle: (t) => shown.push(t) }, audio: { duck() {} },
    loadLines: () => gate.then(() => lines), files: [], synth: null, sleep: () => Promise.resolve(),
  });
  const said = voice.say('t.a');
  voice.clear();
  open();
  await said;
  assert.deepEqual(shown, []);
});

test('a later burst drops lines still waiting from an earlier one; one burst keeps its order', async () => {
  let t = 0;
  const shown = [];
  const voice = createVoice({
    prefs: { get: () => false }, ui: { subtitle: (x) => shown.push(x) }, audio: { duck() {} },
    loadLines: async () => lines, files: [], synth: null, now: () => t,
    sleep: () => new Promise((r) => setTimeout(r, 30)),
  });
  const first = [voice.say('t.a'), voice.say('t.b')]; // one burst: both stay
  await new Promise((r) => setTimeout(r, 5));
  t = 5000; // the viewer acts again: a new burst
  const later = voice.say('t.c');
  await Promise.all([...first, later]);
  assert.deepEqual(shown, ['one', 'three'], 'b waited behind a and was stale by the time the viewer acted again');
});
