import test from 'node:test';
import assert from 'node:assert/strict';
import { heatStep, tipStep, clockStep, dialAngle, boilLevel, TESTS, RUN_MIN, MIN_SEC } from '../js/chapters/rice.js';
import art from '../js/art/rice.js';
import lines from '../js/data/lines/rice.js';

test('holding the flame climbs to a rolling boil in about 1.6 seconds, and a tap is a quarter of the way', () => {
  assert.equal(heatStep(0, 1.6), 1);
  assert.equal(heatStep(0.9, 1), 1, 'never past full');
  assert.ok(Math.abs(heatStep(0, 0.4) - 0.25) < 1e-9, 'a tap');
  assert.equal(boilLevel(0), 0, 'silent at no heat');
  assert.equal(boilLevel(1), 0.9, 'full at a rolling boil');
});

test('dragging the pot tips it in proportion to the drag, and stops at a full tip', () => {
  assert.equal(tipStep(0, 130), 0.5);
  assert.equal(tipStep(0.9, 500), 1);
  assert.equal(tipStep(0.2, -999), 0, 'dragging back does not go below nothing');
});

test('the clock runs at MIN_SEC a minute, stops at five, and the hand makes one turn', () => {
  assert.equal(clockStep(0, MIN_SEC), 1);
  assert.equal(clockStep(4.9, 60), RUN_MIN);
  assert.deepEqual(TESTS, [3, 5], 'the two bite tests: at three minutes, and at five');
  assert.equal(dialAngle(RUN_MIN), 360);
  assert.equal(dialAngle(0), 0);
});

test('the rice lines are the design text, short, with no exclamation', () => {
  assert.equal(lines.whyTest, 'Only most of the way. The steam will finish it. Soft now, it is mush later.');
  assert.equal(lines.firm, 'Firm, with a bite. It breaks instead of squashing. Nine-tenths done.');
  assert.equal(lines.hard, 'Chalky in the middle. Another two minutes.');
  assert.equal(lines.salt, 'Half a tablespoon of salt, into the boiling water.');
  assert.equal(lines.whyTip, 'The spices flavour the water, and the water flavours every grain.');
  for (const text of Object.values(lines)) {
    assert.ok(text.length <= 110, text);
    assert.doesNotMatch(text, /!/);
  }
});

test('the art has the hotspots, the reveal targets and the loupe the chapter uses, and stays under 5000 elements', () => {
  const { planes } = art();
  const html = planes.join('');
  for (const id of ['rc-tray-hit', 'rc-knob', 'rc-salt', 'rc-oil', 'rc-bowl', 'rc-slot', 'rc-grain', 'rc-pot-hit',
    'rc-potg', 'rc-spices', 'rc-rice', 'rc-bubbles', 'rc-hand', 'rc-clock', 'rc-loupe', 'rc-pile', 'rc-pour', 'rc-steam', 'rc-flame']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  const elements = (html.match(/<[a-zA-Z]/g) || []).length;
  assert.ok(elements < 5000, `${elements} elements`);
  for (const p of planes) {
    if (/class="hit"/.test(p)) assert.match(p, /role="img"/, 'a plane with a hotspot is labelled');
  }
});
