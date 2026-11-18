import test from 'node:test';
import assert from 'node:assert/strict';
import { along, flameAt, passedBy } from '../js/chapters/wait.js';
import lines from '../js/data/lines/wait.js';

test('the flame follows the knob: full at high, 0.38 at low, out at off, and it only falls', () => {
  assert.equal(flameAt(0), 1);
  assert.ok(Math.abs(flameAt(0.5) - 0.38) < 1e-9);
  assert.equal(flameAt(1), 0);
  assert.ok(flameAt(0.25) > flameAt(0.4) && flameAt(0.4) > flameAt(0.5));
});

test('four clicks from high to low: each detent is passed once, low is the last', () => {
  assert.equal(passedBy(0), 0);
  assert.equal(passedBy(0.125), 1);
  assert.equal(passedBy(0.3), 2);
  assert.equal(passedBy(0.5), 4);
});

test('the tawa moves with the drag projected on its path: side (0) to under (1), never past either end', () => {
  const path = [-362, -70];
  assert.equal(along(0, -362, -70, path), 1);
  assert.ok(Math.abs(along(0, -181, -35, path) - 0.5) < 1e-9);
  assert.ok(along(0.5, 100, 0, path) < 0.5, 'dragging back away from the burner loses progress');
  assert.equal(along(0, 500, 0, path), 0);
  assert.equal(along(0.9, -1000, 0, path), 1);
});

test('wait lines exist under the keys the chapter speaks', () => {
  for (const key of ['high', 'whyTawa', 'whyLow', 'dum', 'rain', 'lid', 'whyLid', 'steam', 'off', 'whyRest']) {
    assert.equal(typeof lines[key], 'string', key);
  }
});
