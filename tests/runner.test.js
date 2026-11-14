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
