import test from 'node:test';
import assert from 'node:assert/strict';
import { along, arcAngle, stateAfter } from '../js/chapters/plate.js';
import lines from '../js/data/lines/plate.js';
import { spices } from '../js/data/spices.js';

test('a quarter turn round the centre is about pi/2, either way, and wraps across the seam', () => {
  assert.ok(Math.abs(arcAngle(10, 0, 0, 10, 0, 0) - Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(arcAngle(0, 10, 10, 0, 0, 0) + Math.PI / 2) < 1e-9);
  assert.ok(Math.abs(arcAngle(-10, -0.1, -10, 0.1, 0, 0)) < 0.05);
});

test('drag progress is the projection on the path, clamped', () => {
  assert.ok(Math.abs(along(0, 30, 0, [60, 0]) - 0.5) < 1e-9);
  assert.equal(along(0.9, 100, 0, [60, 0]), 1);
  assert.equal(along(0.1, -100, 0, [60, 0]), 0);
});

test('the mound shrinks bite by bite, grows back at the second helping, and is nearly clean at the end', () => {
  const e = [0, 1, 2, 3, 4, 5, 6].map((n) => stateAfter(n).eaten);
  assert.deepEqual(e, [0, 1, 2, 3, 4, 4, 5]);
  assert.equal(stateAfter(5).refill, true);
  assert.equal(stateAfter(6).refill, false);
  assert.equal(stateAfter(1).c0, false);
  assert.equal(stateAfter(2).c0, true);
});

test('plate lines exist for every bite and every spice', () => {
  for (const k of ['b1a', 'b1b', 'b2a', 'b2b', 'b3a', 'b4a', 'b4b', 'b5a', 'b6a', 'b6b']) assert.equal(typeof lines[k], 'string');
  for (const s of spices) s.say.forEach((_, i) => assert.equal(typeof lines[`sp_${s.id}_${i}`], 'string'));
});
