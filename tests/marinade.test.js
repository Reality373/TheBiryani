import test from 'node:test';
import assert from 'node:assert/strict';
import { look, chickenLook, stirStep, along, overBowl, TURNS, FOLD_TURNS } from '../js/chapters/marinade.js';
import { IN } from '../js/art/marinade.js';
import lines from '../js/data/lines/marinade.js';

test('the mix goes from separate heaps on white curd to an even coat', () => {
  const a = look(0), b = look(0.5), c = look(1);
  assert.equal(a.heap, 1); assert.equal(a.coat, 0);
  assert.ok(b.swirl > 0.5 && b.coat > 0.3 && b.coat < 0.7);
  assert.equal(c.coat, 1); assert.equal(c.heap, 0); assert.equal(c.swirl, 0);
});

test('a full circle round the bowl is one turn, in either direction, and wraps cleanly', () => {
  const pts = Array.from({ length: 33 }, (_, i) => [IN.cx + 80 * Math.cos((i / 32) * 2 * Math.PI), IN.cy + 80 * (IN.ry / IN.rx) * Math.sin((i / 32) * 2 * Math.PI)]);
  const run = (list, s) => list.reduce((q, [x, y]) => stirStep(q.angle, q.turns, x, y), s);
  const fwd = run(pts, { angle: 0, turns: 0 });
  assert.ok(Math.abs(fwd.turns - 1) < 0.02, `turns ${fwd.turns}`);
  const back = run([...pts].reverse(), { angle: 0, turns: 0 });
  assert.ok(Math.abs(back.turns - 1) < 0.02);
  assert.equal(TURNS, 4);
});

test('the middle of the bowl adds nothing; the cloth path and the bowl mouth behave', () => {
  assert.deepEqual(stirStep(1, 2, IN.cx, IN.cy), { angle: 1, turns: 2 });
  assert.equal(along(0, 100, 0, [200, 0]), 0.5);
  assert.equal(overBowl(IN.cx, IN.cy), true);
  assert.equal(overBowl(IN.cx - 400, IN.cy), false);
});

test('the chicken fades from raw pieces in the paste to coated ones as it is folded', () => {
  assert.deepEqual(chickenLook(0, 0), { raw: 0, coated: 0 });
  assert.deepEqual(chickenLook(4, 0), { raw: 1, coated: 0 });
  assert.deepEqual(chickenLook(4, 1), { raw: 0, coated: 1 });
  assert.equal(chickenLook(2, 0).raw, 0.5);
  assert.equal(FOLD_TURNS, 3);
});

test('the lines are the ones the chapter speaks, each short and without exclamation marks', () => {
  assert.deepEqual(Object.keys(lines), ['curd', 'whyCurd', 'wet', 'dry', 'fresh', 'stir', 'taste', 'chicken', 'whyGash', 'coat', 'fridge']);
  for (const [key, text] of Object.entries(lines)) { assert.ok(text.length <= 110, key); assert.ok(!text.includes('!'), key); }
  assert.match(lines.fridge, /Half an hour at least; overnight is better/);
});
