import test from 'node:test';
import assert from 'node:assert/strict';
import { script, SCENES, CORE, spices, labels } from '../js/data/script.js';

const allSteps = () => SCENES.flatMap((id) => (id === 'eat' ? script.eat.flat() : script[id]));

test('scene lists', () => {
  assert.deepEqual(SCENES, ['arrival', 'marinate', 'fry', 'base', 'layer', 'seal', 'wait', 'reveal', 'eat', 'glow']);
  assert.deepEqual(CORE, ['arrival', 'seal', 'wait', 'reveal', 'eat', 'glow']);
  for (const id of SCENES) assert.ok(script[id]?.length > 0, `${id} has steps`);
});

test('six bites', () => {
  assert.equal(script.eat.length, 6);
  for (const bite of script.eat) assert.ok(bite.length > 0);
});

test('lines are short, captions are bracketed lowercase, labels are brief', () => {
  for (const step of allSteps()) {
    if (step.say) assert.ok(step.say.length <= 110, `too long: ${step.say}`);
    if (step.cap) assert.match(step.cap, /^\[[a-z ,']+\]$/);
    if (step.act) assert.ok(step.act.length <= 22, `label too long: ${step.act}`);
  }
});

test('no exclamation marks or emoji anywhere', () => {
  const text = JSON.stringify({ script, spices, labels });
  assert.doesNotMatch(text, /!/);
  assert.doesNotMatch(text, /\p{Extended_Pictographic}/u);
});

test('the wait is paced and nothing else is', () => {
  for (const step of script.wait) if (step.act !== false) assert.ok(step.rest >= 1500, 'wait steps rest');
  for (const id of SCENES.filter((s) => s !== 'wait' && s !== 'eat')) {
    for (const step of script[id]) assert.equal(step.rest, undefined, `${id} has no rest`);
  }
});

test('seven spices with unique ids, one of them rare', () => {
  assert.equal(spices.length, 7);
  assert.equal(new Set(spices.map((s) => s.id)).size, 7);
  assert.deepEqual(spices.filter((s) => s.weight < 1).map((s) => s.id), ['staranise']);
  for (const s of spices) {
    assert.ok(s.name && s.say.length > 0);
    for (const line of s.say) assert.ok(line.length <= 110);
  }
});

test('labels the shell needs', () => {
  for (const key of ['title', 'intro', 'withSound', 'quietly', 'silentHint', 'resumeSound', 'again', 'method', 'found']) {
    assert.equal(typeof labels[key], 'string', key);
  }
});
