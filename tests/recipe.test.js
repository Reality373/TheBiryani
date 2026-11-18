import test from 'node:test';
import assert from 'node:assert/strict';
import { recipe, shopping } from '../js/data/recipe.js';
import { method, ingredients } from '../js/data/cookbook.js';

test('one recipe entry per method step, in order, with the time in brackets', () => {
  assert.equal(recipe.length, method.length);
  method.forEach((m, i) => {
    assert.ok(recipe[i].step.includes(m.step.replace(/\.$/, '')), recipe[i].step);
    if (m.time) assert.ok(recipe[i].step.includes(`(${m.time})`), recipe[i].step);
  });
});

test('whys end with a full stop, no "!", no emoji, and the length limits hold', () => {
  for (const { step, why } of recipe) {
    assert.ok(step, 'every step has text');
    if (why) assert.ok(why.endsWith('.'), why);
    assert.doesNotMatch(why + step, /!/);
    assert.doesNotMatch(why + step, /\p{Extended_Pictographic}/u);
    assert.ok(step.length <= 160, `step too long (${step.length}): ${step}`);
    assert.ok(why.length <= 110, `why too long (${why.length}): ${why}`);
  }
});

test('shopping: every ingredient once, grouped in chapter order under the five headings', () => {
  assert.deepEqual(shopping.map((g) => g.heading), ['Onions', 'Marinade', 'Rice', 'Layers', 'Seal']);
  const all = shopping.flatMap((g) => g.items);
  assert.equal(all.length, Object.values(ingredients).flat().length);
  for (const { name, amount } of all) {
    assert.ok(name && amount, JSON.stringify({ name, amount }));
    assert.doesNotMatch(name + amount, /!|\p{Extended_Pictographic}/u);
  }
});
