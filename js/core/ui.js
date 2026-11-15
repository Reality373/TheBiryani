import { createHold } from './hold.js';
import { runSteps } from './steps.js';

const $ = (id) => document.getElementById(id);
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const SVG = 'http://www.w3.org/2000/svg';

export function createUI({ prefs, audio }) {
  const root = document.documentElement;
  const auto = new URLSearchParams(location.search).has('auto');
  const [stage, cap, line, act, label, card] = ['stage', 'cap', 'line', 'act', 'act-label', 'card'].map($);
  const calm = () => prefs.get('calm');

  // ---- settings ----
  const toggles = { sound: $('set-sound'), calm: $('set-calm'), captions: $('set-caps') };
  const syncPrefs = () => {
    for (const [key, box] of Object.entries(toggles)) box.checked = !!prefs.get(key);
    root.dataset.calm = String(!!calm());
    cap.hidden = !prefs.get('captions') || !cap.textContent;
  };
  for (const [key, box] of Object.entries(toggles)) box.addEventListener('change', () => prefs.set(key, box.checked));
  prefs.subscribe(syncPrefs);
  $('open-settings').addEventListener('click', () => $('settings').showModal());

  // ---- words ----
  function caption(text) {
    cap.textContent = text ?? '';
    cap.hidden = !prefs.get('captions') || !text;
    return Promise.resolve();
  }
  syncPrefs();

  function say(text) {
    line.classList.remove('is-in');
    line.textContent = text;
    void line.offsetWidth; // reflow so the fade-in replays
    line.classList.add('is-in');
    return auto || calm() ? Promise.resolve() : wait(500);
  }

  function view(name) {
    if (stage.dataset.view === name) return Promise.resolve();
    stage.dataset.view = name;
    if (auto || calm()) return Promise.resolve();
    return new Promise((resolve) => {
      const done = () => { stage.removeEventListener('transitionend', onEnd); clearTimeout(timer); resolve(); };
      const onEnd = (e) => { if (e.target === stage && e.propertyName === 'transform') done(); };
      const timer = setTimeout(done, 1700); // --t-view (1600ms) + 100ms
      stage.addEventListener('transitionend', onEnd);
    });
  }

  // ---- the one button ----
  // A finished hold's release still fires a click; swallow it so it cannot skip the next action.
  let swallowClick = false;
  act.addEventListener('click', (e) => {
    if (!swallowClick) return;
    swallowClick = false;
    e.stopImmediatePropagation();
    e.preventDefault();
  }, true);
  for (const type of ['pointerdown', 'keydown']) act.addEventListener(type, () => { swallowClick = false; }, true);

  function action(text, { hold, rest, onProgress } = {}) {
    return new Promise((resolve) => {
      const ac = new AbortController();
      const { signal } = ac;
      const on = (target, type, fn) => target.addEventListener(type, fn, { signal });
      let resting = false;
      let raf = 0;
      let h = null;

      const finish = (pressed = false) => {
        ac.abort();
        cancelAnimationFrame(raf);
        clearTimeout(restTimer);
        act.removeAttribute('aria-disabled');
        act.removeAttribute('data-hold');
        act.style.removeProperty('--p');
        act.hidden = true;
        if (hold && pressed) swallowClick = true;
        audio.hit('tap');
        resolve();
      };

      label.textContent = text;
      act.hidden = false;
      act.removeAttribute('data-hold');
      act.style.removeProperty('--p');
      let restTimer = 0;
      if (rest && !auto) {
        resting = true;
        act.setAttribute('aria-disabled', 'true');
        restTimer = setTimeout(() => { resting = false; act.removeAttribute('aria-disabled'); }, rest);
      }
      if (auto) { restTimer = setTimeout(finish, 50); return; }

      if (!hold) {
        const click = () => { if (!resting) finish(); };
        on(act, 'keydown', (e) => { if (e.repeat) e.preventDefault(); });
        on(act, 'click', click);
        on(stage, 'click', click);
        return;
      }

      if (!calm()) act.dataset.hold = '';
      const frame = () => {
        const now = performance.now();
        const p = h.progress(now);
        act.style.setProperty('--p', p);
        onProgress?.(p);
        if (h.done(now)) return finish(down);
        raf = p > 0 || down ? requestAnimationFrame(frame) : 0;
      };
      let down = false;
      const press = () => {
        if (resting || down) return;
        if (calm()) return finish(true);
        down = true;
        h = h ?? createHold({ ms: hold });
        h.press(performance.now());
        if (!raf) raf = requestAnimationFrame(frame);
      };
      const release = () => {
        if (!down) return;
        down = false;
        h.release(performance.now());
      };
      const isKey = (e) => e.key === 'Enter' || e.key === ' ';
      h = createHold({ ms: hold });
      on(act, 'pointerdown', (e) => { act.setPointerCapture?.(e.pointerId); press(); });
      on(act, 'pointerup', release);
      on(act, 'pointercancel', release);
      on(act, 'keydown', (e) => { if (!isKey(e)) return; e.preventDefault(); if (!e.repeat) press(); });
      on(act, 'keyup', (e) => { if (!isKey(e)) return; e.preventDefault(); release(); });
      on(act, 'click', (e) => e.preventDefault()); // a hold button ignores click
    });
  }

  // ---- card ----
  function cardUI({ title, text, note, icons = [], choices = [] }) {
    const set = (id, v) => { $(id).textContent = v ?? ''; };
    set('card-title', title); set('card-text', text); set('card-note', note);
    const iconBox = $('card-icons');
    const choiceBox = $('card-choices');
    iconBox.replaceChildren();
    choiceBox.replaceChildren();
    for (const id of icons) {
      const svg = document.createElementNS(SVG, 'svg');
      svg.setAttribute('viewBox', '0 0 48 48');
      svg.setAttribute('aria-label', id);
      const use = document.createElementNS(SVG, 'use');
      use.setAttribute('href', `#t-egg-${id}`);
      svg.append(use);
      iconBox.append(svg);
    }
    line.hidden = true;
    act.hidden = true;
    card.hidden = false;
    return new Promise((resolve) => {
      const pick = (i) => {
        card.hidden = true;
        line.hidden = false;
        audio.hit('tap');
        resolve(i);
      };
      choices.forEach((c, i) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.textContent = c;
        b.addEventListener('click', () => pick(i));
        choiceBox.append(b);
      });
      if (auto) setTimeout(() => pick(choices.length - 1), 50);
    });
  }

  const ui = { say, caption, action, view, card: cardUI };
  ui.run = (steps, hooks) => {
    line.textContent = '';
    return runSteps(steps, hooks, ui);
  };
  return ui;
}
