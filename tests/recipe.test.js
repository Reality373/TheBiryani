import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { recipe } from '../js/data/recipe.js';

const design = readFileSync(new URL('../docs/design.md', import.meta.url), 'utf8');

test('at least 8 steps, each with a step and a why', () => {
  assert.ok(recipe.length >= 8);
  for (const { step, why } of recipe) {
    assert.ok(step && why, JSON.stringify({ step, why }));
  }
});

test('whys end with a full stop, no "!", no emoji, and the length limits hold', () => {
  for (const { step, why } of recipe) {
    assert.ok(why.endsWith('.'), why);
    assert.doesNotMatch(why, /!/);
    assert.doesNotMatch(why, /\p{Extended_Pictographic}/u);
    assert.doesNotMatch(step, /\p{Extended_Pictographic}/u);
    assert.ok(step.length <= 40, `step too long (${step.length}): ${step}`);
    assert.ok(why.length <= 110, `why too long (${why.length}): ${why}`);
  }
});

test('every why in the design Lines table appears exactly once in the recipe', () => {
  // The Why column of the Lines table (after "### Lines"), with its quoted sentences.
  const table = design.slice(design.indexOf('### Lines'), design.indexOf('Spice lines are unchanged'));
  const fromDesign = [];
  for (const row of table.split('\n')) {
    if (!row.startsWith('|') || /^\|\s*(Chapter|-)/.test(row)) continue;
    const why = row.split('|')[3] ?? '';
    for (const m of why.matchAll(/"([^"]+)"/g)) fromDesign.push(m[1]);
  }
  assert.equal(fromDesign.length, 12, 'the design lists 12 whys');
  assert.deepEqual(recipe.map((r) => r.why).sort(), fromDesign.sort());
});
