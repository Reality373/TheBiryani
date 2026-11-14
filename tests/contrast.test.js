import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

const css = readFileSync(new URL('../css/tokens.css', import.meta.url), 'utf8');
const token = (name) => {
  const m = css.match(new RegExp(`--${name}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(m, `token --${name} exists`);
  return m[1];
};
const luminance = (hex) => {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const ratio = (a, b) => {
  const [hi, lo] = [luminance(token(a)), luminance(token(b))].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

test('text pairs meet 4.5:1', () => {
  for (const [fg, bg] of [['rice', 'night'], ['rice', 'iron'], ['rice', 'indigo'], ['rice', 'madder'], ['iron', 'saffron']]) {
    assert.ok(ratio(fg, bg) >= 4.5, `${fg} on ${bg} is ${ratio(fg, bg).toFixed(2)}`);
  }
});

test('control pairs meet 3:1', () => {
  for (const [fg, bg] of [['saffron', 'night'], ['saffron', 'indigo']]) {
    assert.ok(ratio(fg, bg) >= 3, `${fg} on ${bg} is ${ratio(fg, bg).toFixed(2)}`);
  }
});
