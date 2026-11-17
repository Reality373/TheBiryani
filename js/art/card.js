// Art for the title and end cards, in the manner of a folk-print poster. Five inks only: night, madder, saffron, mint, cream.
import { C, f, mix, shade, rng, range, wobble } from './lib.js';

// Points along a closed arch-shaped loop (clockwise on screen, starting bottom-left): up the left side, over a
// semicircle, down the right side, back along the bottom. Returns { pt(s), len }.
function archLoop(cx, spring, r, bottom) {
  const side = bottom - spring, arc = Math.PI * r, base = 2 * r;
  const len = 2 * side + arc + base;
  const raw = (s) => {
    s = ((s % len) + len) % len;
    if (s < side) return [cx - r, bottom - s];
    s -= side;
    if (s < arc) { const a = Math.PI - s / r; return [cx + r * Math.cos(a), spring - r * Math.sin(a)]; }
    s -= arc;
    if (s < side) return [cx + r, spring + s];
    s -= side;
    return [cx + r - s, bottom];
  };
  const pt = (s) => {
    const p = raw(s), a = raw(s - 1.5), b = raw(s + 1.5);
    const tx = b[0] - a[0], ty = b[1] - a[1], m = Math.hypot(tx, ty) || 1;
    return { x: p[0], y: p[1], tx: tx / m, ty: ty / m, nx: ty / m, ny: -tx / m }; // n = outward normal
  };
  return { pt, len };
}

const flower = (x, y, rot, size = 1) => {
  let petals = '';
  for (let i = 0; i < 5; i++) {
    const a = (i * 72 + rot) * Math.PI / 180;
    petals += `<circle cx="${f(Math.cos(a) * 5 * size)}" cy="${f(Math.sin(a) * 5 * size)}" r="${f(4.3 * size)}" fill="${C.madder}" stroke="${shade(C.madder, 0.3)}" stroke-width=".7"/>`;
  }
  return `<g transform="translate(${f(x)} ${f(y)})">${petals}<circle r="${f(3.1 * size)}" fill="${C.cream}"/><circle r="${f(1.5 * size)}" fill="${C.saffron}"/></g>`;
};

// The vine ring: mint stem weaving along the loop, hand-cut leaves, small red flowers, saffron dots.
function vineRing(cx, spring, r, bottom) {
  const { pt, len } = archLoop(cx, spring, r, bottom);
  const rand = rng(21);
  let d = '';
  for (let s = 0; s <= len; s += 5) {
    const p = pt(s), o = 4.5 * Math.sin(s / 17);
    d += `${s ? 'L' : 'M'} ${f(p.x + p.nx * o)} ${f(p.y + p.ny * o)} `;
  }
  let out = `<path d="${d}Z" fill="none" stroke="${C.mint}" stroke-width="2.4" stroke-linejoin="round"/>`;
  const step = 27, n = Math.round(len / step);
  for (let k = 0; k < n; k++) {
    const s = (k * len) / n, p = pt(s), side = k % 2 ? 1 : -1;
    if (k % 5 === 0) { out += flower(p.x, p.y, range(rand, 0, 72), 1.15); continue; }
    const ang = Math.atan2(p.ty, p.tx) + side * 0.95; // leaf leans along the tangent, to one side
    const l = range(rand, 15, 20), w = l * 0.3;
    const leaf = wobble([[0, 0], [l * 0.3, -w], [l * 0.75, -w * 0.6], [l, 0], [l * 0.7, w * 0.7], [l * 0.3, w]], 0.7, rand);
    out += `<path d="${leaf}" transform="translate(${f(p.x)} ${f(p.y)}) rotate(${f((ang * 180) / Math.PI)})" fill="${k % 3 ? C.mint : mix(C.mint, C.cream, 0.25)}"/>`;
    const m = pt(s + step / 2);
    out += `<circle cx="${f(m.x + m.nx * 9 * -side)}" cy="${f(m.y + m.ny * 9 * -side)}" r="2.1" fill="${C.saffron}"/>`;
  }
  return out;
}

// The cusped Deccani arch (six scallops, a cusp at the apex).
function archPath(cx, spring, r, bottom) {
  const pts = [180, 150, 120, 90, 60, 30, 0].map((a) => [cx + r * Math.cos((a * Math.PI) / 180), spring - r * Math.sin((a * Math.PI) / 180)]);
  return `M ${f(pts[0][0])} ${bottom} L ${f(pts[0][0])} ${spring} ${pts.slice(1).map(([x, y]) => `A 30 30 0 0 1 ${f(x)} ${f(y)}`).join(' ')} L ${f(pts[6][0])} ${bottom} Z`;
}

// A sealed copper pot with a pale dough rope and a wisp of steam, centred on (0, 0), about 90 wide.
function pot() {
  const cu = C.copper, dough = mix(C.cream, C.saffron, 0.12);
  let dents = '';
  for (let i = 0; i < 8; i++) dents += `<ellipse cx="${-35 + i * 10}" cy="${f(-4 + Math.sin(i * 0.9) * 1.2)}" rx="2.2" ry="1.4" fill="${shade(dough, -0.25)}"/>`;
  return `
    <ellipse cx="0" cy="47" rx="40" ry="5" fill="${C.night}" opacity=".6"/>
    <path d="M-40 6 Q-42 42 0 45 Q42 42 40 6 Q40 -3 0 -4 Q-40 -3 -40 6z" fill="${shade(cu, -0.15)}"/>
    <path d="M-40 6 Q-42 42 0 45 Q-14 36 -16 -4 Q-40 -3 -40 6z" fill="${shade(cu, 0.12)}"/>
    <path d="M-33 10 Q-33 33 -19 40 Q-26 26 -26 8z" fill="${shade(cu, 0.4)}" opacity=".8"/>
    <path d="M-36 -6 Q-34 -24 0 -26 Q34 -24 36 -6z" fill="${shade(cu, 0.05)}"/>
    <path d="M-36 -6 Q-34 -24 0 -26 Q-12 -18 -14 -6z" fill="${shade(cu, 0.35)}"/>
    <circle cx="0" cy="-29" r="4" fill="${shade(cu, 0.2)}"/>
    <path d="M-42 -3 Q0 3 42 -3" fill="none" stroke="${dough}" stroke-width="9" stroke-linecap="round"/>
    <path d="M-42 -5.500 Q0 0 42 -5.500" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>
    ${dents}
    <path d="M1 -35 C-8 -42 9 -47 0 -55" fill="none" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" opacity=".9"/>
    <path d="M13 -33 C8 -38 17 -41 12 -47" fill="none" stroke="${C.cream}" stroke-width="2" stroke-linecap="round" opacity=".6"/>`;
}

// viewBox 0 0 400 450
export function medal() {
  const cx = 200, spring = 210, bottom = 400, arch = archPath(cx, spring, 100, bottom);
  let rays = '';
  const n = 28;
  for (let i = 0; i < n; i++) {
    const a0 = (i / n) * 2 * Math.PI, a1 = ((i + 1) / n) * 2 * Math.PI;
    rays += `<path d="M200 300 L${f(200 + 420 * Math.cos(a0))} ${f(300 + 420 * Math.sin(a0))} L${f(200 + 420 * Math.cos(a1))} ${f(300 + 420 * Math.sin(a1))}z" fill="${i % 2 ? C.cream : C.saffron}" opacity="${i % 2 ? 0.92 : 1}"/>`;
  }
  return `<svg viewBox="0 0 400 450" aria-hidden="true" focusable="false">
    <defs><clipPath id="m-arch"><path d="${arch}"/></clipPath></defs>
    ${vineRing(cx, spring, 138, 420)}
    <path d="${arch}" fill="${C.night}"/>
    <g clip-path="url(#m-arch)">${rays}</g>
    <path d="${arch}" fill="none" stroke="${C.madder}" stroke-width="10" stroke-linejoin="round"/>
    <path d="${arch}" fill="none" stroke="${C.cream}" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M200 110 L193 96 L200 82 L207 96z" fill="${C.saffron}" stroke="${C.madder}" stroke-width="2"/>
    <circle cx="200" cy="300" r="74" fill="none" stroke="${C.madder}" stroke-width="3" stroke-dasharray="1 7" stroke-linecap="round"/>
    <circle cx="200" cy="300" r="66" fill="${C.night}" stroke="${C.cream}" stroke-width="3"/>
    <circle cx="200" cy="300" r="60" fill="none" stroke="${C.saffron}" stroke-width="1.4"/>
    <g transform="translate(200 307)">${pot()}</g>
  </svg>`;
}

// A short dotted row with a diamond in the middle. viewBox 0 0 220 14
export function dotRow() {
  let s = '';
  for (let i = 0; i < 9; i++) {
    if (i === 4) continue;
    const x = 10 + i * 25;
    s += `<circle cx="${x}" cy="7" r="${i % 2 ? 2.2 : 3}" fill="${i % 2 ? C.cream : C.saffron}"/>`;
  }
  return `<svg viewBox="0 0 220 14" aria-hidden="true" focusable="false">${s}<path d="M110 0 L120 7 L110 14 L100 7z" fill="${C.madder}" stroke="${C.saffron}" stroke-width="1.5"/></svg>`;
}

// CSS url() of a 28 x 14 tile of small saffron and cream triangles (apex up).
export function trimTile() {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="28" height="14" viewBox="0 0 28 14"><path d="M1 14L8 1L15 14z" fill="${C.saffron}"/><path d="M15 14L21 3L27 14z" fill="${C.cream}"/></svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}
