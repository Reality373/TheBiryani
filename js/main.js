import { kitchenSVG } from './art/kitchen.js';
import { topdownSVG } from './art/topdown.js';

const stage = document.getElementById('stage');
stage.insertAdjacentHTML('afterbegin', kitchenSVG + topdownSVG);
const kitchen = document.getElementById('kitchen');

// Query-string state switcher, so any state can be screenshotted, e.g.
// /?view=medium&pot=sealed&flame=low&light=dim&line=Hello&act=Go+on
const q = new URLSearchParams(location.search);
if (q.has('view')) stage.dataset.view = q.get('view');
for (const key of ['pot', 'flame', 'light']) if (q.has(key)) kitchen.dataset[key] = q.get(key);
for (const key of ['seal', 'crack']) if (q.has(key)) kitchen.style.setProperty(`--${key}`, q.get(key));
if (q.has('calm')) document.documentElement.dataset.calm = 'true';
if (q.has('cap')) document.getElementById('cap').textContent = q.get('cap');
if (q.has('line')) document.getElementById('line').textContent = q.get('line');
if (q.has('card')) { // temporary: Task 3 replaces this with ui.card()
  const set = (id, text) => { document.getElementById(id).textContent = text; };
  set('card-title', 'Dum');
  set('card-text', 'A small, slow story about Hyderabadi dum biryani. About four minutes. Better with sound.');
  set('card-note', 'No sound? Check the silent switch.');
  const choices = document.getElementById('card-choices');
  for (const label of ['Start with sound', 'Start quietly']) {
    const b = document.createElement('button');
    b.type = 'button';
    b.textContent = label;
    choices.append(b);
  }
  document.getElementById('card').hidden = false;
}
if (q.has('settings')) document.getElementById('settings').showModal();
if (q.has('act')) {
  const act = document.getElementById('act');
  act.hidden = false;
  document.getElementById('act-label').textContent = q.get('act');
  if (q.has('p')) { act.dataset.hold = ''; act.style.setProperty('--p', q.get('p')); }
}
