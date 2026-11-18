import test from 'node:test';
import assert from 'node:assert/strict';
import { shortName } from '../js/core/ui.js';
import { ingredients } from '../js/data/cookbook.js';

test('a tick says the name before the first comma, with a capital', () => {
  assert.equal(shortName('thick curd, not sour'), 'Thick curd');
  assert.equal(shortName('ginger-garlic paste'), 'Ginger-garlic paste');
  assert.equal(shortName('onions, thinly sliced'), 'Onions');
});

test('every ingredient has an id, name and amount; ids are unique within a chapter', () => {
  for (const [chapter, list] of Object.entries(ingredients)) {
    const ids = list.map((i) => i.id);
    assert.equal(new Set(ids).size, ids.length, `duplicate id in ${chapter}`);
    for (const { id, name, amount } of list) {
      assert.ok(id && name && amount, JSON.stringify({ chapter, id, name, amount }));
    }
  }
});
