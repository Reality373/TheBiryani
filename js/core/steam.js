// Canvas steam: one soft sprite stamped with drawImage, one rAF loop that stops when idle.
const TAU = Math.PI * 2;
const rnd = (a, b) => a + Math.random() * (b - a);

function makeSprite() {
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  grad.addColorStop(0, 'rgba(246,235,211,1)');
  grad.addColorStop(0.18, 'rgba(250,225,170,0.85)'); // faint saffron warmth near the core
  grad.addColorStop(0.5, 'rgba(246,235,211,0.32)');
  grad.addColorStop(1, 'rgba(246,235,211,0)');
  g.fillStyle = grad;
  g.fillRect(0, 0, 128, 128);
  return c;
}

function makeShaft() {
  const c = document.createElement('canvas');
  c.width = 128; c.height = 256;
  const g = c.getContext('2d');
  // tall cone, brightest just above the point (bottom), fading up and sideways
  const v = g.createLinearGradient(0, 256, 0, 0);
  v.addColorStop(0, 'rgba(242,165,22,0.5)');
  v.addColorStop(0.15, 'rgba(246,235,211,1)');
  v.addColorStop(1, 'rgba(246,235,211,0)');
  g.fillStyle = v;
  g.beginPath();
  g.moveTo(52, 256); g.lineTo(76, 256); g.lineTo(128, 0); g.lineTo(0, 0);
  g.closePath();
  g.fill();
  // feather the sides: multiply by a horizontal soft mask
  g.globalCompositeOperation = 'destination-in';
  const h = g.createLinearGradient(0, 0, 128, 0);
  h.addColorStop(0, 'rgba(0,0,0,0)');
  h.addColorStop(0.5, 'rgba(0,0,0,1)');
  h.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = h;
  g.fillRect(0, 0, 128, 256);
  return c;
}

export function createSteam(canvas, prefs) {
  const ctx = canvas.getContext('2d');
  const sprite = makeSprite();
  const shaft = makeShaft();
  let parts = []; // { x0, y0, born, life, kind, ... }
  let W = 1, H = 1;
  let raf = 0, last = 0, now = 0;
  let wisping = false, nextWisp = 0;
  let plumeStart = -1, plumeEnd = 0, plumeEmitted = 0, plumeN = 0, plumeZ = 1;
  const EMIT_MS = 1100; // the plume keeps billowing out for this long
  let pending = null; // { resolve, deadline }
  let resizeRaf = 0;
  let calmGen = 0, calmCancel = null, calmUp = false; // calm plume sequence: token, wake-up for its wait, still on screen

  const auto = new URLSearchParams(location.search).has('auto');

  function resize() {
    const k = Math.min(window.devicePixelRatio || 1, 2) * 0.6;
    const w = Math.max(1, Math.round(canvas.clientWidth * k));
    const h = Math.max(1, Math.round(canvas.clientHeight * k));
    if (w === canvas.width && h === canvas.height) return;
    canvas.width = w; canvas.height = h; // resets the context transform
    W = w; H = h;
  }
  resize();
  W = canvas.width; H = canvas.height;
  window.addEventListener('resize', () => {
    cancelAnimationFrame(resizeRaf);
    resizeRaf = requestAnimationFrame(resize);
  });

  const origin = () => [(parseFloat(canvas.dataset.x) || 0.5) * W, (parseFloat(canvas.dataset.y) || 0.47) * H];
  const calm = () => !!prefs.get('calm');

  function spawnWisp(t) {
    const [x, y] = origin();
    parts.push({ kind: 'w', x, y, born: t, life: rnd(2500, 3500), rise: rnd(0.09, 0.13) * H / 1000,
      sway: rnd(0.012, 0.022) * W, phase: rnd(0, TAU), freq: rnd(1.2, 2), s0: rnd(0.05, 0.08) * W, grow: rnd(1.8, 2.6), peak: 0.22 });
  }
  // Camera zoom of the stage right now (a snapshot: start a plume when the camera is settled). Sizes and rises are authored in screen terms and divided by
  // it, so the steam looks the same size whether the camera is wide or close. Where it starts is not.
  function zoomOf() {
    try { return new DOMMatrixReadOnly(getComputedStyle(canvas.parentElement).transform).a || 1; } catch { return 1; }
  }
  // Rises from across the pot's mouth (about 0.38 of the stage width), not from one point.
  function spawnPlume(t) {
    const [x, y] = origin();
    const z = plumeZ;
    parts.push({ kind: 'p', x: x + rnd(-0.17, 0.17) * W, y: y + rnd(-0.012, 0.012) * H, born: t, life: rnd(2400, 3600),
      rise: rnd(0.2, 0.42) * H / z, drift: rnd(-0.14, 0.14) * W / z, curl: rnd(-1, 1) * 0.04 * W / z, phase: rnd(0, TAU),
      s0: rnd(0.08, 0.12) * W / z, grow: rnd(2.8, 4.4), peak: rnd(0.1, 0.16) });
  }

  // position and alpha of a particle at age a (ms)
  function pose(p, a) {
    const u = Math.min(1, a / p.life);
    if (p.kind === 'w') {
      const s = a / 1000;
      return [p.x + Math.sin(p.phase + s * p.freq) * p.sway * Math.min(1, s), p.y - p.rise * a,
        p.s0 * (1 + (p.grow - 1) * u), p.peak * Math.sin(Math.PI * u) ** 1.2];
    }
    const e = 1 - (1 - u) ** 1.9; // rises fast, then slows
    const al = Math.min(1, u / 0.15) * (1 - u) ** 1.1;
    return [p.x + p.drift * e + Math.sin(p.phase + u * 3) * p.curl * u, p.y - p.rise * e,
      p.s0 * (1 + (p.grow - 1) * Math.sqrt(u)), p.peak * al];
  }

  function stamp(x, y, size, alpha) {
    if (alpha <= 0.002) return;
    ctx.globalAlpha = alpha;
    ctx.drawImage(sprite, x - size, y - size, size * 2, size * 2);
  }

  function drawShaft(intensity) {
    if (intensity <= 0.01) return;
    const [x, y] = origin();
    const w = 0.46 * W, h = 0.45 * H / plumeZ;
    ctx.globalAlpha = 0.08 * intensity;
    ctx.drawImage(shaft, x - w / 2, y - h, w, h);
  }

  function frame(ts) {
    raf = 0;
    if (document.hidden) { last = 0; raf = requestAnimationFrame(frame); return; }
    const dt = last ? Math.min(50, ts - last) : 16;
    last = ts;
    now += dt;

    if (wisping && now >= nextWisp) { spawnWisp(now); nextWisp = now + rnd(140, 220); }
    if (plumeStart >= 0) {
      const target = Math.min(plumeN, Math.ceil(((now - plumeStart) / EMIT_MS) * plumeN));
      while (plumeEmitted < target) { spawnPlume(now); plumeEmitted++; }
      if (plumeEmitted >= plumeN && now >= plumeEnd) plumeStart = -1;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => now - p.born < p.life);

    let plumeLevel = 0, plumeAlive = 0;
    for (const p of parts) if (p.kind === 'p') { plumeAlive++; plumeLevel += pose(p, now - p.born)[3]; }
    ctx.globalCompositeOperation = 'lighter';
    drawShaft(Math.min(1, plumeLevel / 1.2) ** 1.8); // fades faster than the particles, so no hard-edged beam is left behind
    for (const p of parts) {
      const [x, y, s, a] = pose(p, now - p.born);
      stamp(x, y, s, a);
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';

    if (pending && (now >= pending.deadline || (plumeStart < 0 && plumeAlive === 0))) {
      const r = pending.resolve; pending = null; r();
    }
    if (parts.length || wisping || plumeStart >= 0) raf = requestAnimationFrame(frame);
    else ctx.clearRect(0, 0, W, H);
  }

  const kick = () => { if (!raf) { last = 0; raf = requestAnimationFrame(frame); } };

  // Fixed particle layout for calm mode, at the plume's fullest.
  function stillPlume() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    plumeZ = zoomOf();
    drawShaft(1.2);
    const [x, y] = origin();
    for (let i = 0; i < 40; i++) {
      const f = i / 39, ang = i * 2.4;
      stamp(x + Math.sin(ang) * (0.06 + 0.1 * f) * W, y - (0.02 + 0.3 * f) * H / plumeZ + Math.cos(ang * 1.7) * 0.015 * H,
        (0.09 + 0.14 * f) * W / plumeZ, 0.15 * (1 - f * 0.5));
    }
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  function stillPuff() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'lighter';
    const [x, y] = origin();
    stamp(x, y - 0.06 * H, 0.1 * W, 0.18);
    stamp(x + 0.015 * W, y - 0.11 * H, 0.08 * W, 0.12);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
  }

  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const calmWait = (ms) => new Promise((r) => {
    const t = setTimeout(r, ms);
    calmCancel = () => { clearTimeout(t); r(); };
  });
  // Interrupt any calm plume: its waits end now, its promise resolves, the canvas is left visible.
  function endCalm() {
    calmGen++; calmUp = false;
    if (calmCancel) { const c = calmCancel; calmCancel = null; c(); }
    canvas.style.transition = ''; canvas.style.opacity = '';
  }

  function clear() {
    endCalm();
    wisping = false; plumeStart = -1; parts = [];
    cancelAnimationFrame(raf); raf = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (pending) { const r = pending.resolve; pending = null; r(); }
  }

  return {
    wisp(on) {
      if (auto) return;
      if (on) resize();
      wisping = !!on;
      if (calm()) {
        wisping = false; // no loop in calm mode, even if one was running when calm turned on
        if (on) stillPuff(); else if (!calmUp) ctx.clearRect(0, 0, W, H);
        return;
      }
      if (on) { nextWisp = now; kick(); }
      else if (!parts.length && plumeStart < 0 && !calmUp) ctx.clearRect(0, 0, W, H);
    },
    async plume() {
      if (auto) return wait(50);
      if (calm()) {
        endCalm();
        const g = calmGen;
        resize();
        stillPlume(); calmUp = true;
        await calmWait(1200);
        if (g !== calmGen) return;
        canvas.style.transition = 'opacity 600ms ease';
        canvas.style.opacity = '0';
        await calmWait(600);
        if (g !== calmGen) return;
        ctx.clearRect(0, 0, W, H);
        calmUp = false;
        canvas.style.transition = ''; canvas.style.opacity = '';
        return;
      }
      endCalm();
      resize();
      if (pending) pending.resolve();
      return new Promise((resolve) => {
        plumeN = Math.round(rnd(52, 60)); plumeEmitted = 0; plumeZ = zoomOf();
        plumeStart = now; plumeEnd = now + EMIT_MS;
        pending = { resolve, deadline: now + 2800 };
        kick();
      });
    },
    clear,
  };
}
