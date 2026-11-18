import test from 'node:test';
import assert from 'node:assert/strict';
import { crackSweep, crackTo, liftStep, depthStep } from '../js/chapters/opening.js';
import lines from '../js/data/lines/opening.js';

const fresh = () => Array(9).fill(false);
const count = (a) => a.filter(Boolean).length;

test('a drag cracks only the lines it sweeps: from the middle, nothing on the left is opened', () => {
  const r = fresh();
  assert.deepEqual(crackSweep(r, 800, 830), [4, 5], 'the lines at x 798 and 829, the ones swept');
  assert.equal(r[0], false, 'the left end stays shut');
  assert.deepEqual(crackSweep(r, 830, 800), [], 'going back opens nothing new');
});

test('sweeping the whole rim opens all nine lines, and the same line is not revealed twice', () => {
  const r = fresh();
  assert.equal(crackSweep(r, 650, 960).length, 9);
  assert.equal(count(r), 9);
  assert.deepEqual(crackSweep(r, 650, 960), []);
});

test('a tap opens the lowest lines until the target count is reached', () => {
  const r = fresh();
  assert.deepEqual(crackTo(r, 3), [0, 1, 2]);
  assert.deepEqual(crackTo(r, 3), [], 'already at 3');
  assert.equal(crackTo(r, 99).length, 6, 'capped at nine');
  assert.equal(count(r), 9);
});

test('lid progress: dragging up lifts, dragging down cannot go below closed, the top is 1', () => {
  assert.ok(Math.abs(liftStep(0, -100) - 0.5) < 1e-9);
  assert.equal(liftStep(0.2, 50), 0);
  assert.equal(liftStep(0.9, -1000), 1);
});

test('spoon depth: dragging down pushes it in, clamped to the pot bottom', () => {
  assert.ok(Math.abs(depthStep(0, 80) - 0.5) < 1e-9);
  assert.equal(depthStep(0.9, 500), 1);
  assert.equal(depthStep(0.1, -500), 0);
});

test('opening lines exist under the keys the chapter speaks', () => {
  for (const key of ['lift', 'look', 'serve', 'whyServe']) assert.equal(typeof lines[key], 'string');
});
