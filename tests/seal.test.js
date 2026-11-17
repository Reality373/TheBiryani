import test from 'node:test';
import assert from 'node:assert/strict';
import { segAt, lidStep, pressSweep } from '../js/chapters/seal.js';
import lines from '../js/data/lines/seal.js';

const fresh = () => Array(8).fill(false);

test('the rim is eight eighths: x maps to the eighth under it, clamped at both ends', () => {
  assert.equal(segAt(600), 0);
  assert.equal(segAt(650), 0);
  assert.equal(segAt(688), 1);
  assert.equal(segAt(800), 4);
  assert.equal(segAt(940), 7);
  assert.equal(segAt(2000), 7);
});

test('a drag presses only what it sweeps: from the middle, or from the right end, nothing bursts', () => {
  const mid = fresh();
  assert.equal(pressSweep(mid, 800, 803), 1, 'the first move from a touch at x 800 presses the eighth under it');
  assert.deepEqual(mid.map(Number), [0, 0, 0, 0, 1, 0, 0, 0]);
  const right = fresh();
  assert.equal(pressSweep(right, 937, 940), 1, 'a touch at x 940 presses one eighth, not all eight');
  assert.equal(right[7], true);
  assert.equal(right.filter(Boolean).length, 1);
});

test('sweeping back and forth presses each eighth once; the whole rim takes eight', () => {
  const p = fresh();
  assert.equal(pressSweep(p, 655, 900), 7, 'sweep from the left end to x 900');
  assert.equal(pressSweep(p, 900, 655), 0, 'going back presses nothing new');
  assert.equal(pressSweep(p, 900, 945), 1, 'the last eighth');
  assert.equal(p.every(Boolean), true);
});

test('lid progress is the projection of the pointer move onto the path, clamped to 0..1', () => {
  assert.equal(lidStep(0, 290, -207), 1);
  assert.ok(Math.abs(lidStep(0, 145, -103.5) - 0.5) < 1e-9);
  assert.ok(Math.abs(lidStep(0.9, 207, 290) - 0.9) < 1e-9, 'a move across the path does nothing');
  assert.equal(lidStep(0.5, -2000, 0), 0);
  assert.equal(lidStep(0.9, 1000, -800), 1);
  assert.equal(lidStep(0, 70, -207, [70, -207]), 1, 'the phone path');
});

test('seal lines exist under the keys the chapter speaks', () => {
  for (const key of ['lid', 'why', 'done']) assert.equal(typeof lines[key], 'string');
});
