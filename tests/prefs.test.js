import test from 'node:test';
import assert from 'node:assert/strict';
import { createPrefs } from '../js/core/prefs.js';

const memory = (initial = {}) => {
  const data = { ...initial };
  return { getItem: (k) => (k in data ? data[k] : null), setItem: (k, v) => { data[k] = String(v); }, data };
};

test('defaults', () => {
  const p = createPrefs(memory());
  assert.equal(p.get('sound'), false);
  assert.equal(p.get('calm'), false);
  assert.equal(p.get('captions'), false);
  assert.equal(p.get('voice'), true);
  assert.equal(p.get('subtitles'), true);
  assert.deepEqual(p.get('spices'), []);
});

test('calm defaults to the reduced-motion setting', () => {
  assert.equal(createPrefs(memory(), { reducedMotion: true }).get('calm'), true);
});

test('a stored value beats the default', () => {
  const store = memory({ 'dum:prefs': JSON.stringify({ calm: false }) });
  assert.equal(createPrefs(store, { reducedMotion: true }).get('calm'), false);
});

test('set stores and notifies', () => {
  const store = memory();
  const p = createPrefs(store);
  const seen = [];
  const off = p.subscribe((key, value) => seen.push([key, value]));
  p.set('captions', true);
  off();
  p.set('captions', false);
  assert.deepEqual(seen, [['captions', true]]);
  assert.equal(JSON.parse(store.data['dum:prefs']).captions, false);
});

test('broken storage and broken JSON are survived', () => {
  const throwing = { getItem() { throw new Error('denied'); }, setItem() { throw new Error('denied'); } };
  const p = createPrefs(throwing);
  p.set('calm', true);
  assert.equal(p.get('calm'), true);
  assert.equal(createPrefs(memory({ 'dum:prefs': '{not json' })).get('calm'), false);
});

test('unknown keys are rejected', () => {
  assert.throws(() => createPrefs(memory()).set('nope', 1), /unknown pref/i);
});
