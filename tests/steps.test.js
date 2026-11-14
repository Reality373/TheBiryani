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
