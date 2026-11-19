// One way to make anything touchable. createCore is the DOM-free bookkeeping (tested);
// createHotspots wires it to pointer, keyboard, the idle hint and auto mode.

export function createCore(opts, { calm = () => false, onTouch = () => {} } = {}) {
  let finished = false;
  let touched = false;
  let resolve;
  const done = new Promise((r) => { resolve = r; });
  const finish = () => { if (!finished) { finished = true; resolve(); } };
  const touch = () => { if (!touched) { touched = true; onTouch(); } };
  const run = (fn, ...a) => { if (!finished && fn?.(...a) === true) finish(); return finished; };
  return {
    done, finish,
    get finished() { return finished; },
    get touched() { return touched; },
    touch,
    step() { touch(); return run(opts.step); },
    drag(info) { touch(); if (!calm()) run(opts.drag, info); return finished; },
    hold(dt) { if (!calm()) run(opts.hold, dt); return finished; },
    release() { if (!calm()) opts.release?.(); },
    key(k) { touch(); return run(opts.keys?.[k]); },
  };
}

import { toolSvg } from '../art/tools.js';

// The goal line: the newest live hotspot says what to do now (an explicit `goal`, else its label); more than one live adds a count.
export function goalFor(live) {
  const cur = live[live.length - 1];
  const t = cur?.goal ?? cur?.label ?? '';
  if (!t) return '';
  const text = t[0].toUpperCase() + t.slice(1);
  return live.length > 1 ? `${text} · ${live.length} to do` : text;
}

const IDLE_MS = 1000, TAP_PX = 10, TAP_MS = 350;

// The hover name: one small tooltip, shared; a mouse or pen over a hotspot shows its label.
let tip = null, tipOwner = null;
const showTip = (owner, text, e) => {
  tip ??= Object.assign(document.createElement('div'), { className: 'hover-tip', role: 'presentation' });
  tipOwner = owner;
  tip.textContent = text[0].toUpperCase() + text.slice(1);
  document.body.append(tip);
  moveTip(e);
};
const moveTip = (e) => { if (tip) tip.style.transform = `translate(${Math.min(e.clientX + 16, innerWidth - tip.offsetWidth - 8)}px, ${Math.min(e.clientY + 24, innerHeight - 40)}px)`; };
const hideTip = (owner) => { if (tipOwner === owner) { tip?.remove(); tipOwner = null; } };

export function createHotspots({ stage, ui, calm, auto }) {
  const active = new Set();
  let idle = 0;
  const arm = () => {
    clearTimeout(idle);
    if (auto) return;
    idle = setTimeout(() => {
      // One hint at a time (several pile up on each other), for the newest untouched hotspot: that is the current step,
      // not a standing one like the clock. An older hint is withdrawn when a newer step arrives.
      const cur = [...active].reverse().find((x) => !x.core.touched);
      if (!cur || cur.hinted) return;
      for (const h of active) if (h.hinted && !h.core.touched) { h.el.classList.remove('is-hinting'); ui.unhint(h.el); }
      cur.hinted = true; cur.el.classList.add('is-hinting'); ui.hint(cur.el, cur.label, cur.gesture);
    }, IDLE_MS);
  };
  for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, arm, true);

  // "Skip this step": every live hotspot performs itself, as in auto mode. Shown while any hotspot is live.
  const refreshGoal = () => ui.goal?.(goalFor([...active]));
  const skipBtn = document.getElementById('skip');
  const sync = () => { if (skipBtn) skipBtn.hidden = !!auto || active.size === 0; };
  skipBtn?.addEventListener('click', () => { for (const h of active) h.skip?.(); });

  function hotspot(el, opts) {
    if (typeof opts.step !== 'function') throw new Error('hotspot: step is required');
    if (!opts.gesture) throw new Error("hotspot: gesture is required ('tap' | 'hold' | 'circle' | { drag: [dx, dy] })");
    const label = opts.label ?? '';
    const ac = new AbortController();
    const on = (type, fn) => el.addEventListener(type, fn, { signal: ac.signal });
    const h = { el, label, gesture: opts.gesture, hinted: false, core: null };
    const calmed = () => calm();
    const quiet = () => {
      el.classList.remove('is-hinting');
      ui.unhint(el);
    };
    const core = createCore(opts, { calm: calmed, onTouch: quiet });
    h.core = core;
    h.goal = opts.goal;
    active.add(h);
    sync();
    refreshGoal();

    el.classList.add('hotspot');
    if (label) {
      on('pointerenter', (e) => { if (e.pointerType !== 'touch' && !core.finished) showTip(h, label, e); });
      on('pointermove', (e) => { if (tipOwner === h) moveTip(e); });
      on('pointerleave', () => hideTip(h));
      on('pointerdown', () => hideTip(h)); // a press is an action; the name has done its job
    }
    // opts.tool: a mouse or pen over this hotspot becomes that tool (the native cursor hides); a press tilts it.
    let tool = null;
    const toolAt = (e) => { if (tool) tool.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; };
    if (opts.tool) {
      el.classList.add('has-tool');
      on('pointerenter', (e) => {
        if (e.pointerType === 'touch' || calmed()) return;
        tool ??= Object.assign(document.createElement('div'), { className: 'cursor-tool', innerHTML: toolSvg(opts.tool) });
        document.body.append(tool); document.body.dataset.tool = opts.tool; toolAt(e);
      });
      on('pointermove', toolAt);
      on('pointerleave', () => { tool?.remove(); delete document.body.dataset.tool; });
      on('pointerdown', () => tool?.classList.add('is-down'));
      for (const t of ['pointerup', 'pointercancel']) on(t, () => tool?.classList.remove('is-down'));
    }
    if (opts.drag) el.classList.add('draggable'); // grab cursor: this one is dragged, not just clicked
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.removeAttribute('aria-hidden');
    if (label) el.setAttribute('aria-label', label);

    let timer = 0;
    h.skip = () => { if (!timer && !core.finished) timer = setInterval(() => { if (core.step()) clearInterval(timer); }, 60); };
    const dispose = () => {
      if (!active.delete(h)) return;
      sync();
      refreshGoal();
      ac.abort();
      hideTip(h);
      if (tool?.isConnected) delete document.body.dataset.tool;
      tool?.remove();
      clearInterval(timer);
      cancelAnimationFrame(raf);
      quiet();
      el.classList.remove('hotspot');
      el.removeAttribute('role');
      el.setAttribute('tabindex', '-1'); // finished controls drop out of the tab order and the accessibility tree
      el.setAttribute('aria-hidden', 'true');
      if (document.activeElement === el) el.blur();
    };
    core.done.then(() => { dispose(); ui.stepDone?.(); });

    // ---- pointer: a short press with little movement is a tap (one step); otherwise drag / hold ----
    let down = null;
    let raf = 0;
    const world = (e) => (el.ownerSVGElement ? stage.toWorld(e, el) : { x: e.clientX, y: e.clientY });
    const frame = (t) => {
      if (!down) return;
      if (opts.hold && !calmed()) core.hold(Math.min(0.1, (t - down.t) / 1000));
      if (down) down.t = t;
      raf = core.finished ? 0 : requestAnimationFrame(frame);
    };
    on('pointerdown', (e) => {
      if (core.finished || down || (e.pointerType === 'mouse' && e.button !== 0)) return; // a second finger does not restart the drag
      el.setPointerCapture?.(e.pointerId);
      el.classList.add('is-dragging');
      core.touch();
      const w = world(e);
      down = { id: e.pointerId, sx: e.clientX, sy: e.clientY, at: performance.now(), t: performance.now(), x: w.x, y: w.y, first: true, moved: false };
      if (opts.hold && !calmed()) raf = requestAnimationFrame(frame);
    });
    on('pointermove', (e) => {
      if (!down || down.id !== e.pointerId || core.finished) return;
      if (Math.hypot(e.clientX - down.sx, e.clientY - down.sy) > TAP_PX) down.moved = true;
      if (!down.moved || !opts.drag || calmed()) return;
      const now = performance.now();
      const w = world(e);
      const dx = w.x - down.x, dy = w.y - down.y;
      const dt = Math.max(1, now - down.mt || 16);
      core.drag({ x: w.x, y: w.y, dx, dy, speed: (Math.hypot(dx, dy) / dt) * 1000, first: down.first });
      down.first = false; down.x = w.x; down.y = w.y; down.mt = now;
    });
    const up = (e) => {
      if (!down || down.id !== e.pointerId) return;
      const d = down;
      down = null;
      cancelAnimationFrame(raf);
      el.classList.remove('is-dragging');
      el.releasePointerCapture?.(e.pointerId);
      const plain = (!opts.drag && !opts.hold) || calmed(); // nothing to hold or drag: any still press is a tap
      const tap = e.type === 'pointerup' && !d.moved && (plain || performance.now() - d.at < TAP_MS);
      if (tap) core.step(); else core.release();
    };
    on('pointerup', up);
    on('pointercancel', up);
    on('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); if (!e.repeat) core.step(); }
      else if (opts.keys?.[e.key]) { e.preventDefault(); core.key(e.key); }
    });

    // Auto mode: every hotspot performs itself (one step per 60 ms) until it is finished.
    if (auto) timer = setInterval(() => { if (core.step()) clearInterval(timer); }, 60);
    arm();

    // Hotspots made during a chapter end with it (hotspot.signal is set by main.js for each chapter).
    const signal = hotspot.signal;
    if (signal?.aborted) dispose(); else signal?.addEventListener('abort', dispose, { once: true });
    // Focus follows the story: the first active hotspot takes focus from the chapter heading.
    if (!signal?.aborted && ui.headingFocused()) el.focus?.({ preventScroll: true });

    return { done: core.done, finish: core.finish, dispose };
  }
  return hotspot;
}
