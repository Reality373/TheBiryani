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
  let plumeStart = -1, plumeEnd = 0, plumeEmitted = 0, plumeN = 0;
  let pending = null; // { resolve, deadline }
  let resizeRaf = 0;

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
  function spawnPlume(t, i) {
    const [x, y] = origin();
    parts.push({ kind: 'p', x: x + rnd(-0.05, 0.05) * W, y: y + rnd(-0.01, 0.01) * H, born: t, life: rnd(1600, 2400), rise: rnd(0.24, 0.38) * H, drift: rnd(-0.1, 0.1) * W,
      curl: rnd(-1, 1) * 0.03 * W, phase: rnd(0, TAU), s0: rnd(0.06, 0.1) * W, grow: rnd(3, 5), peak: rnd(0.045, 0.08) });
  }

  // position and alpha of a particle at age a (ms)
  function pose(p, a) {
    const u = Math.min(1, a / p.life);
    if (p.kind === 'w') {
      const s = a / 1000;
      return [p.x + Math.sin(p.phase + s * p.freq) * p.sway * Math.min(1, s), p.y - p.rise * a,
        p.s0 * (1 + (p.grow - 1) * u), p.peak * Math.sin(Math.PI * u) ** 1.2];
    }
    const e = 1 - (1 - u) ** 2.2; // rises fast, then slows
    const al = Math.min(1, u / 0.12) * (1 - u) ** 1.5;
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
    const w = 0.6 * W, h = 0.5 * H;
    ctx.globalAlpha = 0.05 * intensity;
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
      const target = Math.min(plumeN, Math.ceil(((now - plumeStart) / 700) * plumeN));
      while (plumeEmitted < target) spawnPlume(now, plumeEmitted++);
      if (plumeEmitted >= plumeN && now >= plumeEnd) plumeStart = -1;
    }

    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    parts = parts.filter((p) => now - p.born < p.life);

    let plumeLevel = 0, plumeAlive = 0;
    for (const p of parts) if (p.kind === 'p') { plumeAlive++; plumeLevel += pose(p, now - p.born)[3]; }
    ctx.globalCompositeOperation = 'lighter';
    drawShaft(Math.min(1, plumeLevel / 1.2));
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
    drawShaft(1.4);
    const [x, y] = origin();
    for (let i = 0; i < 40; i++) {
      const f = i / 39, ang = i * 2.4;
      stamp(x + Math.sin(ang) * (0.02 + 0.09 * f) * W, y - (0.02 + 0.38 * f) * H + Math.cos(ang * 1.7) * 0.02 * H,
        (0.07 + 0.12 * f) * W, 0.13 * (1 - f * 0.5));
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

  function clear() {
    wisping = false; plumeStart = -1; parts = [];
    cancelAnimationFrame(raf); raf = 0;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, H);
    if (pending) { const r = pending.resolve; pending = null; r(); }
  }

  return {
    wisp(on) {
      if (auto) return;
      if (calm()) { if (on) stillPuff(); else ctx.clearRect(0, 0, W, H); return; }
      wisping = !!on;
      if (on) { nextWisp = now; kick(); }
    },
    async plume() {
      if (auto) return wait(50);
      if (calm()) {
        stillPlume();
        await wait(1200);
        canvas.style.transition = 'opacity 600ms ease';
        canvas.style.opacity = '0';
        await wait(600);
        ctx.clearRect(0, 0, W, H);
        canvas.style.transition = 'none';
        canvas.style.opacity = '';
        return;
      }
      if (pending) pending.resolve();
      return new Promise((resolve) => {
        plumeN = Math.round(rnd(45, 60)); plumeEmitted = 0;
        plumeStart = now; plumeEnd = now + 700;
        pending = { resolve, deadline: now + 2800 };
        kick();
      });
    },
    clear,
  };
}
