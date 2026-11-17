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

const IDLE_MS = 2500, TAP_PX = 10, TAP_MS = 350;

export function createHotspots({ stage, ui, calm, auto }) {
  const active = new Set();
  let idle = 0;
  const arm = () => {
    clearTimeout(idle);
    if (auto) return;
    idle = setTimeout(() => {
      for (const h of active) if (!h.core.touched && !h.hinted) { h.hinted = true; h.el.classList.add('is-hinting'); ui.hint(h.el, h.label, h.gesture); }
    }, IDLE_MS);
  };
  for (const type of ['pointerdown', 'keydown']) window.addEventListener(type, arm, true);

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
    active.add(h);

    el.classList.add('hotspot');
    el.setAttribute('role', 'button');
    el.setAttribute('tabindex', '0');
    el.removeAttribute('aria-hidden');
    if (label) el.setAttribute('aria-label', label);

    let timer = 0;
    const dispose = () => {
      if (!active.delete(h)) return;
      ac.abort();
      clearInterval(timer);
      cancelAnimationFrame(raf);
      quiet();
      el.classList.remove('hotspot');
      el.removeAttribute('role');
      el.setAttribute('tabindex', '-1'); // finished controls drop out of the tab order and the accessibility tree
      el.setAttribute('aria-hidden', 'true');
      if (document.activeElement === el) el.blur();
    };
    core.done.then(dispose);

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
      if (core.finished || (e.pointerType === 'mouse' && e.button !== 0)) return;
      el.setPointerCapture?.(e.pointerId);
      core.touch();
      const w = world(e);
      down = { sx: e.clientX, sy: e.clientY, at: performance.now(), t: performance.now(), x: w.x, y: w.y, first: true, moved: false };
      if (opts.hold && !calmed()) raf = requestAnimationFrame(frame);
    });
    on('pointermove', (e) => {
      if (!down || core.finished) return;
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
      if (!down) return;
      const d = down;
      down = null;
      cancelAnimationFrame(raf);
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
