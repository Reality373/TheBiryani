import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { along, milkAt, turnClock, stepClock, handsAt, nightVeil, tagText, RINSES, MILK, PRE_SOAK_MAX, HALF_HOUR } from '../js/chapters/rest.js';
import art from '../js/art/rest.js';
import lines from '../js/data/lines/rest.js';

test('the water is milkiest after the first rinse and nearly clear after the third; each fill comes in cloudy', () => {
  assert.ok(MILK[0] > MILK[1] && MILK[1] > MILK[2] && MILK[2] < 0.2);
  assert.ok(milkAt(1, 0) > 0.3, 'the first fill is already cloudy');
  assert.ok(milkAt(3, 0) < 0.1, 'the third fill is nearly clear already');
  assert.ok(milkAt(1, 0) > milkAt(2, 0) && milkAt(2, 0) > milkAt(3, 0), 'each fill is clearer than the last');
  assert.ok(milkAt(1, 1) === MILK[0], 'swirled to the top, the water is at the rinse\'s peak');
  assert.ok(milkAt(1, 1) > milkAt(1, 0.5) && milkAt(1, 0.5) > milkAt(1, 0), 'swirling clouds it more');
  assert.ok(milkAt(1, 1) > milkAt(2, 1) && milkAt(2, 1) > milkAt(3, 1), 'each rinse is less cloudy than the one before');
  assert.equal(milkAt(2, 2), milkAt(2, 1), 'progress is clamped');
});

test('the clock: a quarter turn of the hands is 30 minutes, and it cannot pass 24 until the rice is soaking', () => {
  assert.equal(turnClock(0, 90, true), 30);
  assert.equal(turnClock(0, 90, false), PRE_SOAK_MAX);
  assert.equal(turnClock(10, 60, false), PRE_SOAK_MAX);
  assert.equal(turnClock(10, 60, true), 30);
  assert.equal(turnClock(5, -900, true), 0, 'turning back stops at the start');
});

test('a tap moves to the next half hour, the cap applies before the soak', () => {
  assert.equal(stepClock(0, true), 30);
  assert.equal(stepClock(30, true), 60);
  assert.equal(stepClock(0, false), PRE_SOAK_MAX);
  assert.equal(stepClock(PRE_SOAK_MAX, false), PRE_SOAK_MAX, 'a tap at the cap does nothing before the soak');
  assert.equal(stepClock(24, true), 30);
  assert.equal(HALF_HOUR, 30);
});

test('the hands: the minute hand turns a quarter in 30 minutes, the hour hand more slowly', () => {
  assert.equal(handsAt(30).min, 90);
  assert.equal(handsAt(0).min, 0);
  assert.ok(handsAt(120).hour < handsAt(120).min);
});

test('the window darkens as the time passes, and never past its limit', () => {
  assert.ok(nightVeil(0) < nightVeil(30) && nightVeil(30) < nightVeil(120));
  assert.ok(nightVeil(600) <= 0.7 && nightVeil(0) >= 0.1);
  assert.equal(nightVeil(600), nightVeil(9999), 'it stops darkening once it is night');
});

test('the tag counts the rinses', () => {
  assert.equal(tagText(0), 'rinse 1 of 3');
  assert.equal(tagText(1), 'rinse 2 of 3');
  assert.equal(tagText(2), 'rinse 3 of 3');
  assert.equal(tagText(RINSES), 'rinsed 3 of 3');
});

test('a drag projects onto its path, from 0 to 1 and no further', () => {
  const path = [250, -50];
  assert.equal(along(0, 250, -50, path), 1);
  assert.ok(Math.abs(along(0, 125, -25, path) - 0.5) < 1e-9);
  assert.equal(along(0, -500, 0, path), 0);
  assert.equal(along(0.9, 1000, 0, path), 1);
});

test('every line the chapter speaks exists, and the lines fit the rules', () => {
  const src = readFileSync(new URL('../js/chapters/rest.js', import.meta.url), 'utf8');
  const used = [...src.matchAll(/voice\.say\('rest\.(\w+)'\)/g)].map((m) => m[1]);
  assert.ok(used.length >= 10, 'the chapter speaks');
  for (const key of ['rinse1', 'rinse2', 'rinse3']) assert.ok(src.includes('rest.rinse${n}'), key);
  for (const key of [...used, 'rinse1', 'rinse2', 'rinse3']) assert.equal(typeof lines[key], 'string', key);
  for (const [key, text] of Object.entries(lines)) {
    assert.ok(text.length <= 110, `${key} is ${text.length} characters`);
    assert.doesNotMatch(text, /!/, key);
  }
});

test('the art has the ids the chapter drives and stays under 5000 elements', () => {
  const { planes } = art();
  const svg = planes.join('');
  for (const id of ['r-cov', 'r-fdoor', 'r-finside', 'r-fled', 'r-clock', 'r-clk-h', 'r-clk-m', 'r-veil', 'r-sun', 'r-moon',
    'r-rice', 'r-water', 'r-milk', 'r-ring', 'r-rip', 'r-stream', 'r-pour', 'r-tag-t']) {
    assert.ok(svg.includes(`id="${id}"`), id);
  }
  assert.ok((svg.match(/</g) || []).length < 5000);
});
