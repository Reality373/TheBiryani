// Shared drawing helpers for every chapter's art. Pure functions that return numbers or SVG strings.

export const C = {
  night: '#141A2E', indigo: '#27356B', iron: '#0E0D12', madder: '#A33B2C',
  saffron: '#F2A516', copper: '#B8693A', cream: '#F6EBD3', mint: '#5E8C4A',
};

// Round to 2 decimals for compact SVG output.
export const f = (n) => Math.round(n * 100) / 100;

// Seeded PRNG (mulberry32). rng(seed) returns a function giving floats in [0, 1). Same seed, same sequence.
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export const range = (rand, a, b) => a + rand() * (b - a);
export const pick = (rand, arr) => arr[Math.floor(rand() * arr.length)];

const channels = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const toHex = (rgb) => '#' + rgb.map((v) => v.toString(16).padStart(2, '0')).join('');

// Mix two '#rrggbb' colours. t is clamped to [0, 1]. Returns lowercase '#rrggbb'. Round each channel with Math.round.
export function mix(a, b, t) {
  const k = Math.min(1, Math.max(0, t));
  const from = channels(a);
  const to = channels(b);
  return toHex(from.map((v, i) => Math.round(v + (to[i] - v) * k)));
}

// amt in [-1, 1]: negative mixes toward '#000000' by |amt|, positive toward '#ffffff' by amt, 0 returns the colour lowercased.
export function shade(hex, amt) {
  return amt < 0 ? mix(hex, '#000000', -amt) : mix(hex, '#ffffff', amt);
}

const jitter = (points, amp, rand) =>
  points.map(([x, y]) => [x + range(rand, -amp, amp), y + range(rand, -amp, amp)]);
const mid = (p, q) => [(p[0] + q[0]) / 2, (p[1] + q[1]) / 2];
const xy = ([x, y]) => `${f(x)} ${f(y)}`;

// A hand-cut looking path through `points` ([[x, y], ...], at least 3 points).
// Each point is jittered by up to `amp` in x and in y using `rand`. The path then runs smoothly through the
// MIDPOINTS of consecutive jittered points, using each jittered point as the control point of a Q segment:
//   closed: 'M mid(last,first)' then for each point i: 'Q p[i] mid(p[i], p[i+1])' (wrapping), then 'Z'.
//   open:   'M p[0]' then 'Q p[i] mid(p[i], p[i+1])' for i = 1 .. n-2, then 'L p[n-1]'.
// Numbers go through f(). Format: 'M x y Q cx cy x y ... Z' with single spaces.
export function wobble(points, amp, rand, closed = true) {
  const p = jitter(points, amp, rand);
  const n = p.length;
  if (closed) {
    const segs = [`M ${xy(mid(p[n - 1], p[0]))}`];
    for (let i = 0; i < n; i++) segs.push(`Q ${xy(p[i])} ${xy(mid(p[i], p[(i + 1) % n]))}`);
    return segs.concat('Z').join(' ');
  }
  const segs = [`M ${xy(p[0])}`];
  for (let i = 1; i <= n - 2; i++) segs.push(`Q ${xy(p[i])} ${xy(mid(p[i], p[i + 1]))}`);
  return segs.concat(`L ${xy(p[n - 1])}`).join(' ');
}

// An irregular ellipse: n points evenly spaced in angle on the ellipse (cx, cy, rx, ry), each radius scaled by
// (1 + range(rand, -amp, amp)) where amp is a fraction like 0.06, then passed to wobble(points, 0, rand, true).
export function blob(cx, cy, rx, ry, amp, rand, n = 14) {
  const points = Array.from({ length: n }, (_, i) => {
    const a = (2 * Math.PI * i) / n;
    const s = 1 + range(rand, -amp, amp);
    return [cx + rx * Math.cos(a) * s, cy + ry * Math.sin(a) * s];
  });
  return wobble(points, 0, rand, true);
}

// A halftone dot <pattern> for screen-print shading.
export function halftone(id, color, { size = 8, r = 1.6, angle = 45, opacity = 1 } = {}) {
  return `<pattern id="${id}" patternUnits="userSpaceOnUse" width="${size}" height="${size}" patternTransform="rotate(${angle})"><circle cx="${size / 2}" cy="${size / 2}" r="${r}" fill="${color}" fill-opacity="${opacity}"/></pattern>`;
}

// stops: [[offset, color, opacity = 1], ...]
const stopsXml = (stops) =>
  stops.map(([o, c, op = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${op}"/>`).join('');

// Gradients (objectBoundingBox units by default).
export function linear(id, stops, { x1 = 0, y1 = 0, x2 = 0, y2 = 1 } = {}) {
  return `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">${stopsXml(stops)}</linearGradient>`;
}

export function radial(id, stops, { cx = 0.5, cy = 0.5, r = 0.5 } = {}) {
  return `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stopsXml(stops)}</radialGradient>`;
}

// One depth plane of a 2.5D scene. d is the depth factor used by the camera CSS.
// Labelled planes are exposed as images; unlabelled ones are hidden from assistive tech.
export function plane(id, d, inner, { label } = {}) {
  const a = label ? `role="img" aria-label="${label}"` : 'aria-hidden="true"';
  return `<svg class="plane" id="${id}" style="--d:${d}" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" overflow="visible" ${a}>${inner}</svg>`;
}
