import test from 'node:test';
import assert from 'node:assert/strict';
import { along, bump, POWDERS, WHOLE, COUNT } from '../js/chapters/spices.js';
import { tsp, pileR, AMOUNT } from '../js/art/spices-ch.js';
import lines from '../js/data/lines/spices.js';
import { ingredients } from '../js/data/cookbook.js';

test('amounts from the cookbook read as teaspoons, and bigger amounts make bigger piles', () => {
  assert.equal(tsp('¼ tsp'), 0.25);
  assert.equal(tsp('1¼ tbsp'), 3.75);
  assert.equal(tsp('½ to ¾ tbsp'), 1.875);
  assert.ok(pileR(tsp(AMOUNT.masala)) > pileR(tsp(AMOUNT.chilli)));
  assert.ok(pileR(tsp(AMOUNT.chilli)) > pileR(tsp(AMOUNT.salt)));
  assert.ok(pileR(tsp(AMOUNT.salt)) > pileR(tsp(AMOUNT.turmeric)));
});

test('every powder and whole spice is a cookbook ingredient with a line', () => {
  const ids = (ch) => ingredients[ch].map((i) => i.id);
  for (const id of POWDERS) assert.ok(ids('marinade').includes(id), id);
  for (const id of WHOLE) assert.ok(ids('rice').includes(id), id);
  for (const id of [...POWDERS, ...WHOLE, 'intro', 'powders', 'whole', 'whyWhole', 'done']) assert.equal(typeof lines[id], 'string', id);
  assert.deepEqual(COUNT, { cardamom: 4, clove: 4 });
  assert.equal(AMOUNT.cardamom, '4');
});

test('tapping a counted jar stops at the count; a drag is progress along the path, clamped', () => {
  let n = 0;
  for (let i = 0; i < 9; i++) n = bump(n, 4).n;
  assert.equal(n, 4);
  assert.equal(bump(3, 4).full, true);
  assert.equal(bump(4, 4).added, false);
  assert.equal(along(0, 50, 0, [100, 0]), 0.5);
  assert.equal(along(0.9, 500, 0, [100, 0]), 1);
  assert.equal(along(0.1, -500, 0, [100, 0]), 0);
});
