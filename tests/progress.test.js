import test from 'node:test';
import assert from 'node:assert/strict';
import { advance, canJump, continueTarget } from '../js/core/progress.js';
import { chapters } from '../js/data/chapters.js';

test('reached only moves forward, and unknown ids are ignored', () => {
  assert.equal(advance(chapters, null, 'marinade'), 'marinade');
  assert.equal(advance(chapters, 'wait', 'fry'), 'wait');
  assert.equal(advance(chapters, 'wait', 'opening'), 'opening');
  assert.equal(advance(chapters, 'wait', 'demo'), 'wait');
  assert.equal(advance(chapters, null, 'demo'), null);
});

test('jumping is allowed only up to the furthest chapter reached', () => {
  assert.equal(canJump(chapters, null, 'marinade'), false);
  assert.equal(canJump(chapters, 'seal', 'fry'), true);
  assert.equal(canJump(chapters, 'seal', 'seal'), true);
  assert.equal(canJump(chapters, 'seal', 'wait'), false);
});

test('continue is offered only for a built chapter with a title', () => {
  assert.equal(continueTarget(chapters, null), null);
  assert.equal(continueTarget(chapters, 'wait', () => true).id, 'wait');
  assert.equal(continueTarget(chapters, 'wait', () => false), null);
  assert.equal(continueTarget(chapters, 'end', () => true), null);
});

test('chapters carry a mood and a built flag', () => {
  assert.deepEqual(chapters.map((c) => c.id), ['spices', 'onions', 'marinade', 'rest', 'fry', 'gravy', 'rice', 'layers', 'seal', 'wait', 'opening', 'plate', 'end']);
  for (const c of chapters) { assert.ok(c.mood); assert.equal(typeof c.built, 'boolean'); }
});

test('every numbered chapter declares its step count for the progress bar', async () => {
  const { chapters } = await import('../js/data/chapters.js');
  for (const c of chapters.filter((x) => x.numeral)) assert.ok(c.steps > 0, `${c.id} needs steps`);
});
