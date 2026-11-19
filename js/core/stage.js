// The stage: scene planes inside a camera, parallax from the pointer or a slow drift, and the film grain.
// Layout (index.html): #stage > .camera > .scene > svg.plane*. Overlays (grain, vignette, frame) are siblings and never move.

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const VIEW_W = 1600, VIEW_H = 1000;
const MIN_VIEW_H = 720; // world units of height that stay visible when the camera pushes in on a landscape window

// One 256 px luminance-noise tile, made once, used as the background of both grain overlays.
function makeGrain(root) {
  try {
    const c = document.createElement('canvas');
    c.width = c.height = 256;
    const g = c.getContext('2d');
    const img = g.createImageData(256, 256);
    for (let i = 0; i < img.data.length; i += 4) {
      const v = (Math.random() + Math.random()) * 127.5; // a little bell-shaped, so it is not harsh
      img.data[i] = img.data[i + 1] = img.data[i + 2] = v;
      img.data[i + 3] = 255;
    }
    g.putImageData(img, 0, 0);
    root.style.setProperty('--grain', `url(${c.toDataURL('image/png')})`);
  } catch { /* no canvas: no grain */ }
}

export function createStage({ el, camera, calm, auto, params }) {
  const pinned = params.has('cx') || params.has('cy');
  const pin = { x: Number(params.get('cx')) || 0, y: Number(params.get('cy')) || 0 };
  let scene = null;
  let cam = { s: 1, x: 0, y: 0 };
  let lean = { x: 0, y: 0 };
  let pointer = null;
  let cur = { x: pin.x, y: pin.y };
  let last = { x: NaN, y: NaN };

  makeGrain(document.documentElement);
  // Frame-time fallback: if the median frame in the first 2 s after a show is over 24 ms, thin the effects.
  let lite = false;
  const measure = () => {
    const gaps = []; let t0 = 0; const end = performance.now() + 2000;
    const tick = (t) => {
      if (t0) gaps.push(t - t0);
      t0 = t;
      if (performance.now() < end) return void requestAnimationFrame(tick);
      gaps.sort((a, b) => a - b);
      if (gaps.length >= 10 && gaps[gaps.length >> 1] > 24) { lite = true; document.documentElement.dataset.lite = '1'; }
    };
    requestAnimationFrame(tick);
  };
  const instant = () => auto || calm();
  const setCamera = (s, tx, ty, ms) => {
    camera.style.transition = ms > 0 ? `transform ${ms}ms var(--ease)` : 'none';
    camera.style.transform = `translate(${tx}px, ${ty}px) scale(${s})`;
  };

  // ---- parallax ----
  const write = (x, y) => {
    if (x === last.x && y === last.y) return;
    last = { x, y };
    el.style.setProperty('--cx', x.toFixed(4));
    el.style.setProperty('--cy', y.toFixed(4));
  };
  write(cur.x, cur.y);
  if (!pinned) {
    window.addEventListener('pointermove', (e) => {
      if (e.pointerType === 'touch') return;
      pointer = { x: (e.clientX / innerWidth) * 2 - 1, y: (e.clientY / innerHeight) * 2 - 1 };
    });
    const loop = (t) => {
      if (calm()) { cur = { x: 0, y: 0 }; write(0, 0); } else {
        const base = pointer ?? (lite ? { x: 0, y: 0 } : { x: 0.6 * Math.sin(t / 9000), y: 0.3 * Math.cos(t / 13000) });
        cur.x += (base.x + lean.x - cur.x) * 0.06;
        cur.y += (base.y + lean.y - cur.y) * 0.06;
        write(cur.x, cur.y);
      }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
  }

  return {
    el,
    // Crossfade to art.planes; the old scene is dropped when the fade is done.
    async show(art) {
      const next = document.createElement('div');
      next.className = 'scene';
      next.innerHTML = art.planes.join('');
      next.style.opacity = '0';
      camera.append(next);
      setCamera(1, 0, 0, 0);
      cam = { s: 1, x: 0, y: 0 };
      const old = scene;
      scene = next;
      void next.offsetWidth;
      const ms = auto ? 0 : calm() ? 300 : 900;
      next.style.transition = `opacity ${ms}ms ease`;
      next.style.opacity = '1';
      if (old) { old.style.transition = `opacity ${ms}ms ease`; old.style.opacity = '0'; }
      if (!lite) measure();
      await sleep(ms);
      old?.remove();
    },
    $: (selector) => scene?.querySelector(selector) ?? null,
    camera: {
      // Scale the whole scene about the screen position of world point (x, y) on a d = 0 plane.
      push(scale = 1, x = VIEW_W / 2, y = VIEW_H / 2, ms = 1600) {
        const k = Math.max(innerWidth / VIEW_W, innerHeight / VIEW_H); // "slice" scale
        const px = innerWidth / 2 + (x - VIEW_W / 2) * k;
        const py = innerHeight / 2 + (y - VIEW_H / 2) * k;
        // On a landscape window never zoom in so far that less than MIN_VIEW_H of the 1000-unit scene is visible: the pot rim,
        // the clock or the bowls would be cut off. (Portrait phones need the deep zoom to fit their narrow column.)
        const cap = innerWidth > innerHeight ? Math.max(1, innerHeight / (k * MIN_VIEW_H)) : Infinity;
        const s = Math.min(cap, Math.max(1, scale));
        // The pushed-to point is kept in the top 70% (the bottom is the subtitle zone); the scene must still cover the screen.
        const wantY = Math.min(py, innerHeight * 0.7);
        const tx = Math.min(0, Math.max(innerWidth * (1 - s), px - s * px));
        const ty = Math.min(0, Math.max(innerHeight * (1 - s), wantY - s * py));
        const same = cam.s === s && cam.x === tx && cam.y === ty;
        cam = { s, x: tx, y: ty };
        const dur = instant() ? 0 : ms;
        setCamera(s, tx, ty, dur);
        return same ? Promise.resolve() : sleep(dur);
      },
      lean(x = 0, y = 0) { lean = { x, y }; },
    },
    // Pointer position in a plane's viewBox units (undoes camera, parallax and the slice scaling).
    toWorld(event, planeEl) {
      const svg = planeEl.ownerSVGElement ?? planeEl;
      const p = svg.createSVGPoint();
      p.x = event.clientX; p.y = event.clientY;
      const q = p.matrixTransform(svg.getScreenCTM().inverse());
      return { x: q.x, y: q.y };
    },
  };
}
