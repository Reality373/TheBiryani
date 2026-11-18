import test from 'node:test';
import assert from 'node:assert/strict';
import { toneAt, phaseAt, strokesFromDrag, stirStep, inPan, overPlate, STROKES, TAP_CUT, GOLDEN, LOW, OFF, CUT } from '../js/chapters/onions.js';
import { PAN, PLATE, ONIONS } from '../js/art/onions.js';
import lines from '../js/data/lines/onions.js';

test('the onions go from pale through translucent and golden to light brown, and darken as the cook rises', () => {
  assert.equal(toneAt(0), '#f3ebd0');
  assert.equal(toneAt(0.25), '#eed58e');
  assert.equal(toneAt(0.5), '#de9e3e');
  assert.equal(toneAt(1), '#7e4420');
  assert.equal(toneAt(-1), toneAt(0), 'below zero is pale');
  assert.equal(toneAt(9), toneAt(1), 'above one is light brown');
  const lum = (hex) => [1, 3, 5].reduce((s, i) => s + parseInt(hex.slice(i, i + 2), 16), 0);
  for (let c = 0; c < 1; c += 0.05) assert.ok(lum(toneAt(c + 0.05)) <= lum(toneAt(c)), `darkens at ${c}`);
});

test('the clock runs medium, then low, then off, and golden comes inside the low setting', () => {
  assert.equal(phaseAt(0), 'medium');
  assert.equal(phaseAt(LOW - 0.01), 'medium');
  assert.equal(phaseAt(LOW), 'low');
  assert.equal(phaseAt(OFF), 'off');
  assert.ok(GOLDEN > LOW && GOLDEN < OFF, 'golden is reached on low, before the heat goes off');
});

test('a drag makes one stroke per 90 units of knife travel, and keeps the rest', () => {
  assert.deepEqual(strokesFromDrag(0, 90), { run: 0, n: 1 });
  assert.deepEqual(strokesFromDrag(50, 100), { run: 60, n: 1 });
  assert.deepEqual(strokesFromDrag(0, 3 * CUT + 1), { run: 1, n: 3 });
  assert.deepEqual(strokesFromDrag(0, 10), { run: 10, n: 0 });
});

test('six strokes take an onion apart, and a tap counts for more so four taps do it', () => {
  assert.equal(STROKES, 6);
  assert.equal(Math.ceil(STROKES / TAP_CUT), 4);
  assert.ok(TAP_CUT > 1);
});

test('the spoon goes round the pan once per turn in either direction, and the middle adds nothing', () => {
  const pts = Array.from({ length: 33 }, (_, i) => {
    const a = (i / 32) * 2 * Math.PI;
    return [PAN.cx + 200 * Math.cos(a), PAN.cy + 200 * (PAN.ry / PAN.rx) * Math.sin(a)];
  });
  const run = (list, s) => list.reduce((q, [x, y]) => stirStep(q.angle, q.turns, x, y), s);
  assert.ok(Math.abs(run(pts, { angle: 0, turns: 0 }).turns - 1) < 0.02);
  assert.ok(Math.abs(run([...pts].reverse(), { angle: 0, turns: 0 }).turns - 1) < 0.02);
  assert.deepEqual(stirStep(1, 2, PAN.cx, PAN.cy), { angle: 1, turns: 2 });
});

test('the board counts as over the pan inside the rim, and the plate takes the mass only over the plate', () => {
  assert.equal(inPan(PAN.cx, PAN.cy), true);
  assert.equal(inPan(ONIONS.A.x, ONIONS.A.y + 300), false, 'the board in front of the pan');
  assert.equal(overPlate(PLATE.cx, PLATE.cy), true);
  assert.equal(overPlate(PAN.cx, PAN.cy), false);
});

test('the onions lines exist under the keys the chapter speaks', () => {
  const used = ['start', 'second', 'even', 'oil', 'hot', 'tip', 'medium', 'stir', 'low', 'off', 'golden', 'why', 'dark', 'notYet', 'drain', 'crisp', 'keep', 'done'];
  for (const key of used) assert.equal(typeof lines[key], 'string', key);
  assert.equal(lines.why, 'They keep darkening after the heat is off, and a few seconds too long turns them bitter.');
});
