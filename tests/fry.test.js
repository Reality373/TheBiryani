import test from 'node:test';
import assert from 'node:assert/strict';
import { inOil, cookStep, layerWeights, donenessAt, clockText } from '../js/chapters/fry.js';
import lines from '../js/data/lines/fry.js';

test('a piece counts as in the oil only inside the pot, not on the bowl or the rim', () => {
  assert.equal(inOil(800, 367), true);
  assert.equal(inOil(885, 378), true);
  assert.equal(inOil(640, 690), false, 'the bowl');
  assert.equal(inOil(800, 560), false, 'the front of the rim');
});

test('a hold cooks the pieces to golden and stops there; a tap is a fixed step', () => {
  assert.ok(Math.abs(cookStep(0, 2) - 0.5) < 1e-9);
  assert.equal(cookStep(0.9, 10), 1);
  assert.equal(cookStep(1, 0.1), 1);
});

test('the layer weights crossfade raw to golden and always sum to one', () => {
  assert.deepEqual(layerWeights(0), [1, 0, 0]);
  assert.deepEqual(layerWeights(0.5), [0, 1, 0]);
  assert.deepEqual(layerWeights(1), [0, 0, 1]);
  for (const g of [0, 0.2, 0.37, 0.8, 1]) assert.ok(Math.abs(layerWeights(g).reduce((a, b) => a + b) - 1) < 1e-9);
});

test('the sear takes the chicken to about 0.6 and the covered cook to about 0.95, never past it', () => {
  assert.equal(donenessAt(1, 0), 0);
  assert.equal(donenessAt(1, 1), 0.6);
  assert.equal(donenessAt(2, 0), 0.6);
  assert.ok(Math.abs(donenessAt(2, 1) - 0.95) < 1e-9);
});

test('the clock says the recipe times and counts up', () => {
  assert.equal(clockText(1, 0).a, '4 to 5 min');
  assert.equal(clockText(2, 0).a, '10 to 15 min');
  assert.match(clockText(1, 1).b, /medium heat · 4:30$/);
  assert.match(clockText(2, 1).b, /13:00$/);
});

test('fry lines exist under the keys the chapter speaks, short and without exclamation marks', () => {
  for (const key of ['in', 'kitchen', 'golden', 'whyFry', 'onions', 'water', 'lid', 'thick', 'whyNinety']) {
    assert.equal(typeof lines[key], 'string', key);
    assert.ok(lines[key].length <= 110 && !lines[key].includes('!'), key);
  }
});
