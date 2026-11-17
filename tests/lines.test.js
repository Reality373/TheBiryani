import test from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync } from 'node:fs';
import { spices } from '../js/data/spices.js';
import { labels } from '../js/data/labels.js';

const dir = new URL('../js/data/lines/', import.meta.url);
const files = readdirSync(dir).filter((f) => f.endsWith('.js'));

test('every lines file: lines at most 110 characters, no "!", no emoji', async () => {
  assert.ok(files.length > 0);
  for (const file of files) {
    const lines = (await import(new URL(file, dir))).default;
    for (const [key, text] of Object.entries(lines)) {
      assert.equal(typeof text, 'string', `${file} ${key}`);
      assert.ok(text.length <= 110, `${file} ${key} is ${text.length} characters`);
      assert.doesNotMatch(text, /!/, `${file} ${key}`);
      assert.doesNotMatch(text, /\p{Extended_Pictographic}/u, `${file} ${key}`);
    }
  }
});

test('seven spices with unique ids, one of them rare, and short lines', () => {
  assert.equal(spices.length, 7);
  assert.equal(new Set(spices.map((s) => s.id)).size, 7);
  assert.deepEqual(spices.filter((s) => s.weight < 1).map((s) => s.id), ['staranise']);
  for (const s of spices) for (const line of s.say) assert.ok(line.length <= 110 && !line.includes('!'));
});

test('labels carry no exclamation marks', () => {
  for (const v of Object.values(labels)) assert.doesNotMatch(v, /!/);
  assert.match(labels.found, /\{n\}/);
});
