import test from 'node:test';
import assert from 'node:assert/strict';
import { createCore } from '../js/core/hotspot.js';

test('step finishes the hotspot when it returns true, and marks it touched once', async () => {
  let touches = 0, n = 0;
  const core = createCore({ step: () => ++n >= 3 }, { onTouch: () => touches++ });
  assert.equal(core.touched, false);
  core.step(); core.step();
  assert.equal(core.finished, false);
  core.step();
  await core.done;
  assert.equal(core.finished, true);
  assert.equal(touches, 1);
  core.step();
  assert.equal(n, 3, 'a finished hotspot ignores further steps');
});

test('drag can finish it; calm mode ignores drag and hold but not step', async () => {
  let calm = true, dragged = 0;
  const core = createCore({ step: () => false, drag: () => { dragged++; return true; }, hold: () => true }, { calm: () => calm });
  core.drag({}); core.hold(0.016);
  assert.equal(dragged, 0);
  assert.equal(core.finished, false);
  calm = false;
  core.drag({});
  await core.done;
  assert.equal(dragged, 1);
});

test('finish() resolves done, and keys call their handler', async () => {
  const seen = [];
  const core = createCore({ step: () => false, keys: { ArrowLeft: () => { seen.push('l'); } } });
  core.key('ArrowLeft');
  assert.deepEqual(seen, ['l']);
  core.finish();
  await core.done;
});
