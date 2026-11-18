import test from 'node:test';
import assert from 'node:assert/strict';
import { pourDone, lingering, readyStreak, STREAKS, POUR_LENGTH } from '../js/chapters/layers.js';
import art from '../js/art/layers.js';
import lines from '../js/data/lines/layers.js';

test('the pour is done after four streaks or enough drawn length, whichever comes first', () => {
  assert.equal(pourDone(STREAKS - 1, 0), false);
  assert.equal(pourDone(STREAKS, 0), true);
  assert.equal(pourDone(0, POUR_LENGTH - 1), false);
  assert.equal(pourDone(0, POUR_LENGTH), true);
});

test('a slow finger lays the darker run; a fast one does not', () => {
  assert.equal(lingering(20), true);
  assert.equal(lingering(600), false);
});

test('ready-made streaks lie across the rice, and the four differ', () => {
  const all = [0, 1, 2, 3].map(readyStreak);
  for (const pts of all) {
    assert.equal(pts.length, 17);
    for (const [x, y] of pts) assert.ok(x > 560 && x < 1040 && y > 120 && y < 520, `${x},${y} is off the rice`);
  }
  assert.notDeepEqual(all[0], all[1]);
});

test('layers lines are the design text, and each is short with no exclamation', () => {
  assert.equal(lines.rice, 'Rice, most of the way cooked, every grain on its own.');
  assert.equal(lines.whyRice, 'Only most of the way. The steam will finish it.');
  assert.equal(lines.saffron, 'Saffron milk. Watch it travel.');
  assert.equal(lines.whySaffron, 'Poured, not stirred. It stays in streaks, so every spoonful is a little different.');
  assert.equal(lines.ghee, 'Mint. More fried onion. A spoon of ghee, because nobody is watching.');
  for (const text of Object.values(lines)) {
    assert.ok(text.length <= 110, text);
    assert.doesNotMatch(text, /!/);
  }
});

test('the art has its planes, the hotspots and reveal targets the chapter uses, and stays under 5000 elements', () => {
  const { planes } = art();
  const html = planes.join('');
  for (const id of ['ly-ladle', 'ly-saf-hit', 'ly-mint-hot', 'ly-onion-hot', 'ly-spoon', 'ly-saf', 'ly-cup', 'ly-ghee',
    'ly-l1', 'ly-l2', 'ly-l3', 'ly-f1', 'ly-p1', 'ly-mint', 'ly-curls', 'ly-steam-top']) {
    assert.ok(html.includes(`id="${id}"`), id);
  }
  const elements = (html.match(/<[a-zA-Z]/g) || []).length;
  assert.ok(elements < 5000, `${elements} elements`);
  // a plane with a hotspot inside must be labelled (it is not hidden from assistive tech)
  for (const p of planes) {
    if (/class="hit"|hotspot/.test(p)) assert.match(p, /role="img"/);
  }
});
