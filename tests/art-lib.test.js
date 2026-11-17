import test from 'node:test';
import assert from 'node:assert/strict';
import { rng, mix, shade, wobble, blob, halftone, linear, radial, plane } from '../js/art/lib.js';

test('rng: same seed repeats, different seeds differ, values stay in [0, 1)', () => {
  const a = rng(42);
  const b = rng(42);
  const first = [a, b].map((r) => Array.from({ length: 5 }, () => r()));
  assert.deepEqual(first[0], first[1]);
  const c = rng(43);
  assert.notDeepEqual(Array.from({ length: 5 }, () => c()), first[0]);
  const r = rng(7);
  for (let i = 0; i < 1000; i++) {
    const v = r();
    assert.ok(v >= 0 && v < 1, `value ${v} out of range`);
  }
});

test('mix: midpoint, endpoints and clamping', () => {
  assert.equal(mix('#000000', '#ffffff', 0.5), '#808080');
  assert.equal(mix('#F2A516', '#0E0D12', 0), '#f2a516');
  assert.equal(mix('#F2A516', '#0E0D12', 1), '#0e0d12');
  assert.equal(mix('#000000', '#ffffff', -3), '#000000');
  assert.equal(mix('#000000', '#ffffff', 7), '#ffffff');
});

test('shade: zero, full dark and full light', () => {
  const x = '#F2A516';
  assert.equal(shade(x, 0), '#f2a516');
  assert.equal(shade(x, -1), '#000000');
  assert.equal(shade(x, 1), '#ffffff');
});

test('wobble: closed square', () => {
  const d = wobble([[0, 0], [10, 0], [10, 10], [0, 10]], 0, rng(1), true);
  assert.ok(d.startsWith('M'));
  assert.ok(d.endsWith('Z'));
  assert.equal(d.split(' Q ').length - 1, 4);
  assert.ok(!d.includes('NaN'));
});

test('wobble: open line ends with an L segment', () => {
  const d = wobble([[0, 0], [10, 5], [20, 0], [30, 5]], 0, rng(1), false);
  assert.ok(d.startsWith('M'));
  assert.match(d, / L [\d.-]+ [\d.-]+$/);
  assert.ok(!d.includes('NaN'));
});

test('wobble: same seed gives the same string', () => {
  const pts = [[0, 0], [10, 0], [10, 10], [0, 10]];
  assert.equal(wobble(pts, 2, rng(9)), wobble(pts, 2, rng(9)));
});

test('blob: well-formed closed path', () => {
  const d = blob(100, 100, 50, 30, 0.06, rng(3));
  assert.ok(!d.includes('NaN'));
  assert.ok(d.startsWith('M'));
  assert.ok(d.endsWith('Z'));
});

test('halftone, linear, radial, plane: ids and attributes', () => {
  assert.ok(halftone('ht1', '#000000').includes('id="ht1"'));
  assert.ok(linear('lg1', [[0, '#000000'], [1, '#ffffff', 0.5]]).includes('id="lg1"'));
  assert.ok(radial('rg1', [[0, '#000000']]).includes('id="rg1"'));

  const bare = plane('p1', 0.4, '<rect/>');
  assert.ok(bare.includes('--d:0.4'));
  assert.ok(bare.includes('aria-hidden="true"'));
  assert.ok(!bare.includes('aria-label'));

  const labelled = plane('p2', 0.4, '<rect/>', { label: 'X' });
  assert.ok(labelled.includes('aria-label="X"'));
});
