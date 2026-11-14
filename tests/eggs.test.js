import test from 'node:test';
import assert from 'node:assert/strict';
import { planEggs } from '../js/data/eggs.js';

const spices = [
  { id: 'a', weight: 1 }, { id: 'b', weight: 1 }, { id: 'c', weight: 1 }, { id: 'rare', weight: 0.15 },
];
const seeded = (seed) => () => { seed = (seed * 1664525 + 1013904223) % 4294967296; return seed / 4294967296; };

test('one or two distinct eggs, never on the first or last bite', () => {
  const rng = seeded(7);
  for (let i = 0; i < 500; i++) {
    const plan = planEggs(spices, 6, rng);
    assert.equal(plan.length, 6);
    assert.equal(plan[0], null);
    assert.equal(plan[5], null);
    const found = plan.filter(Boolean);
    assert.ok(found.length === 1 || found.length === 2);
    assert.equal(new Set(found).size, found.length);
    for (const id of found) assert.ok(spices.some((s) => s.id === id));
  }
});

test('the rare spice turns up less often than a common one', () => {
  const rng = seeded(11);
  const count = { a: 0, rare: 0 };
  for (let i = 0; i < 2000; i++) for (const id of planEggs(spices, 6, rng)) if (id in count) count[id]++;
  assert.ok(count.rare > 0);
  assert.ok(count.rare < count.a / 2);
});
