import test from 'node:test';
import assert from 'node:assert/strict';
import { pressesReached, lidStep } from '../js/chapters/seal.js';
import lines from '../js/data/lines/seal.js';

test('pointer x along the rim maps to presses: left edge 0, right edge 8, never past either end', () => {
  assert.equal(pressesReached(600), 0);
  assert.equal(pressesReached(650), 1);
  assert.equal(pressesReached(700), 2);
  assert.equal(pressesReached(800), 5);
  assert.equal(pressesReached(949), 8);
  assert.equal(pressesReached(2000), 8);
});

test('lid progress is the projection of the pointer move onto the path, clamped to 0..1', () => {
  assert.equal(lidStep(0, 290, -207), 1);
  assert.ok(Math.abs(lidStep(0, 145, -103.5) - 0.5) < 1e-9);
  assert.ok(Math.abs(lidStep(0.9, 207, 290) - 0.9) < 1e-9, 'a move across the path does nothing');
  assert.equal(lidStep(0.5, -2000, 0), 0);
  assert.equal(lidStep(0.9, 1000, -800), 1);
});

test('seal lines exist under the keys the chapter speaks', () => {
  for (const key of ['lid', 'why', 'done']) assert.equal(typeof lines[key], 'string');
});
