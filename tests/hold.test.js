import test from 'node:test';
import assert from 'node:assert/strict';
import { createHold } from '../js/core/hold.js';

const near = (a, b) => assert.ok(Math.abs(a - b) < 1e-9, `${a} is not ${b}`);

test('holding to the end completes', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  near(h.progress(500), 0.5);
  assert.equal(h.done(999), false);
  assert.equal(h.done(1000), true);
});

test('a quick tap keeps filling on its own', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  h.release(100);
  near(h.progress(600), 0.6);
  assert.equal(h.done(1000), true);
});

test('a long press released early drains back at the same rate', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  h.release(400);
  near(h.progress(400), 0.4);
  near(h.progress(600), 0.2);
  near(h.progress(900), 0);
  assert.equal(h.done(5000), false);
});

test('pressing again resumes from where it drained to', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  h.release(400);
  h.press(600);
  near(h.progress(800), 0.4);
  assert.equal(h.done(1450), true);
});

test('once done it stays done', () => {
  const h = createHold({ ms: 1000 });
  h.press(0);
  assert.equal(h.done(1000), true);
  h.release(1001);
  h.press(2000);
  near(h.progress(9000), 1);
  assert.equal(h.done(9000), true);
});

test('progress before any press is zero', () => {
  near(createHold({ ms: 1000 }).progress(123), 0);
});
