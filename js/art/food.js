// Code-drawn food and vessels for the close shots. Every export returns an SVG string (no wrapper <svg>),
// to be dropped inside a plane. World units are the 1600 x 1000 stage. Light comes from the upper left (warm lamp),
// with a thin cool rim at the back edge (window). All functions are pure and seeded: same options, same picture.
//
// SETUP  foodDefs(p = 'f')  -> '<defs>..</defs>'. Put it ONCE in every plane that uses anything below, with the
//   same prefix `p` you pass to the other functions (ids are `${p}-...`, so use a different p per plane if two
//   planes of one scene both carry defs). Holds: rice grain shapes (4 variants), gradients, halftone, steam CSS.
//
// RICE   riceMound({p, cx, cy, rx, ry, h, count=900, seed=1, saffron=.35, masala=[], items=[], grain=1, clip})
//   A dome of individual basmati grains. (cx, cy, rx, ry) is the base ellipse (ry about .42 of rx), h the dome
//   height in px. saffron 0..1 = amount of gold streaks; masala = [{x, y, r}] stains (grains near them go
//   orange-brown); grain = size multiplier (1 = 26 px long); clip = {cx, cy, rx, ry} to clip the lot to an
//   ellipse (the inside of a pot). items = [{y, svg}] other things (chicken, onions) drawn in depth order with
//   the grains, so grains in front of an item overlap it and it looks half buried. Returns the string.
//   riceSurface(o) is riceMound with a low default h (14) for a flat pot surface.
// CHICKEN chicken({p, x, y, w=100, h=70, rot=0, seed=1, doneness=.5})  a masala-coated piece, centred (x, y).
// BIRISTA biristaCluster({p, x, y, w=120, h=50, n=22, seed=1})  tangled crisp fried-onion curls.
// LEAF   mintLeaf({p, x, y, len=44, rot=0, seed=1})  one mint leaf with veins; its stem end is at (x, y).
// SPICE  spice(kind, {p, x, y, rot=0, s=1})  kind in SPICES: 'cardamom' 'clove' 'cinnamon' 'pepper' 'bay'
//   'chilli' 'anise'. Sizes are about 30, 20, 56, 10, 80, 90, 30 px at s = 1.
// GLEAM  glisten({x, y, w, h, n=14, seed=1})  small warm specular marks (ghee, oil) on the lit side of an
//   ellipse area; draw it LAST over the food it shines on.
// STEAM  steam({p, x, y, h=160, w=40, n=3, seed=1})  rising pale wisps; each is a `.${p}-wisp` group that
//   animates transform + opacity only (disabled under prefers-reduced-motion). (x, y) is the base.
// VESSEL plate({p, cx, cy, w=460, ratio=.45})  steel thali with raised rim; the food goes after it.
//   spoon({p, x, y, len=170, rot=0, bite})  steel spoon, bowl end at (x, y), handle going right and rotated by
//   rot degrees. bite = {n=30, seed, chicken=true, onion=true} piles a spoonful in the bowl.
//   bowl({p, cx, cy, w=190, fill='empty'|'dahi'|'salan'|'chicken', seed=1, tint=0})  small steel bowl (steel
//   mixing bowl: just use w about 330 with fill 'chicken'; tint 0..1 turns the curd-white marinade orange-red).
//   handi({p, cx, cy, w=340, tilt=.5, fill='rice'|'empty', seed=1, items=[], ...riceMound options})  the
//   hammered copper pot seen from above at an angle, rice (saffron streaks, onion, mint) inside. cy is the rim
//   centre. Pot scene: tilt .6. `handiInside(w, tilt, cx, cy)` -> the interior ellipse, to place items.
//   lid({p, cx, cy, r=130, lean=-16})  copper lid standing on edge, leaning.
//   tumbler({p, cx, cy, w=84, h=130})  steel tumbler of water with a cool highlight.
//   servingSpoon({p, x, y, len=260, rot=-14})  long steel spoon standing in the rice, handle up.
//   smallPlate(o) = plate with w 230.  chicken also takes raw (true = pale raw marinated), bone (short bone end),
//   doneness 0 (raw marinade) .. 1 (fried golden-brown).  onionRings({p, cx, cy, n=6, seed=1})  raw red onion rings.
//   lemonWedge({p, x, y, s=1, rot=0})  doughBits({p, cx, cy, n=7, spread=120, seed=1})  broken seal dough.

import { f, rng, range, pick, mix, wobble, blob, halftone, linear, radial } from './lib.js';

export const SPICES = ['cardamom', 'clove', 'cinnamon', 'pepper', 'bay', 'chilli', 'anise'];

const L = (() => { const v = [-0.55, -0.6, 0.58]; const m = Math.hypot(...v); return v.map((x) => x / m); })();
const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const T = (x, y, r = 0, s = 1) => `translate(${f(x)} ${f(y)})${r ? ` rotate(${f(r)})` : ''}${s !== 1 ? ` scale(${f(s)})` : ''}`;
const ell = (cx, cy, rx, ry, fill, extra = '') => `<ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}" fill="${fill}" ${extra}/>`;
const shadow = (p, x, y, rx, ry, op = 0.5) => ell(x, y, rx, ry, `url(#${p}-shad)`, `opacity="${op}"`);

// ---------- rice grains ----------
function grainPath(len, w, bend) {
  const top = []; const bot = [];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    const hw = w * (0.3 + 0.7 * Math.pow(Math.sin(Math.PI * t), 0.75)) * (1 - 0.18 * t);
    const x = -len / 2 + len * t; const yc = bend * 4 * t * (1 - t);
    top.push(`${f(x)} ${f(yc - hw)}`); bot.push(`${f(x)} ${f(yc + hw)}`);
  }
  return `M${top.join('L')}L${bot.reverse().join('L')}Z`;
}
const GRAINS = [[26, 2.7, 0], [28, 2.5, 2.4], [24, 2.8, -2.2], [27, 2.4, 1.2]];
const grainDefs = (p) => GRAINS.map(([len, w, b], i) => {
  const d = grainPath(len, w, b);
  return `<g id="${p}-g${i}"><path d="${d}" transform="scale(1.22 1.45)" fill="#3a1c06" fill-opacity=".34"/>` +
    `<path d="${d}" stroke="#6b3d14" stroke-opacity=".32" stroke-width=".7" stroke-linejoin="round"/>` +
    `<path d="M${f(-len * 0.34)} ${f(-w * 0.28 + b * 0.5)}Q0 ${f(-w * 0.55 + b)} ${f(len * 0.32)} ${f(-w * 0.2 + b * 0.4)}" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1" stroke-linecap="round"/></g>`;
}).join('');

export function foodDefs(p = 'f') {
  return `<defs>${grainDefs(p)}
${radial(`${p}-shad`, [[0, '#0a0405', 0.62], [0.6, '#0a0405', 0.3], [1, '#0a0405', 0]])}
${radial(`${p}-glow`, [[0, '#FFE2A0', 0.55], [0.5, '#F2A516', 0.18], [1, '#F2A516', 0]])}
${linear(`${p}-dome`, [[0, '#EBC47C'], [0.5, '#C99352'], [1, '#8A5226']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${linear(`${p}-steel`, [[0, '#FFF0C8'], [0.3, '#DCCDA8'], [0.62, '#9A9AA2'], [1, '#454858']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${linear(`${p}-steelH`, [[0, '#FBE6B8'], [0.18, '#E2D0A6'], [0.5, '#9A9A9E'], [0.82, '#4A4C58'], [1, '#2E3040']], { x1: 0, y1: 0, x2: 1, y2: 0 })}
${linear(`${p}-steelIn`, [[0, '#E0C088'], [0.4, '#9A8E86'], [1, '#3A3C4C']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${linear(`${p}-cop`, [[0, '#F4B071'], [0.25, '#D07F45'], [0.6, '#8A4224'], [1, '#3A1A16']], { x1: 0, y1: 0, x2: 1, y2: 0.4 })}
${linear(`${p}-copIn`, [[0, '#8A4524'], [0.5, '#4A2016'], [1, '#2A1210']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${linear(`${p}-chk`, [[0, '#EDAA48'], [0.45, '#B8641E'], [1, '#5C2610']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${linear(`${p}-steam`, [[0, '#FFF1D8', 0], [0.12, '#FFF1D8', 0.8], [0.7, '#F0E2D2', 0.35], [1, '#E8DCD0', 0]], { x1: 0, y1: 1, x2: 0, y2: 0 })}
${radial(`${p}-curd`, [[0, '#FFFBF0'], [0.6, '#F3EBDC'], [1, '#D2D8E6']], { cx: 0.4, cy: 0.35, r: 0.7 })}
${radial(`${p}-salan`, [[0, '#C04520'], [0.55, '#8A2A14'], [1, '#43120C']], { cx: 0.38, cy: 0.35, r: 0.75 })}
${linear(`${p}-water`, [[0, '#BFD8F2', 0.55], [1, '#4E6FB0', 0.7]], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${halftone(`${p}-ht`, '#241005', { size: 6, r: 1.35, angle: 30, opacity: 0.6 })}
<style>.${p}-wisp{transform-box:fill-box;transform-origin:50% 100%;animation:${p}-rise 7s ease-in infinite}
@keyframes ${p}-rise{0%{transform:translateY(0) scaleX(1);opacity:0}18%{opacity:1}100%{transform:translateY(-46px) scaleX(1.3);opacity:0}}
@media (prefers-reduced-motion:reduce){.${p}-wisp{animation:none;opacity:.7}}</style></defs>`;
}

// ---------- rice ----------
const IVORY = ['#F6EBD3', '#FBF2DC', '#F1E0BA', '#F7E8C6', '#FFF7E8', '#EFD9AE'];
const GOLD = ['#F2A516', '#EDA01A', '#E8921A', '#E0861A', '#F5B93A', '#F0AA22'];
const MASALA = ['#D9863A', '#C5702C', '#B85F26', '#CC7A30'];

export function riceMound(o) {
  const { p = 'f', cx, cy, rx, ry, h, count = 900, seed = 1, saffron = 0.35, masala = [], items = [], grain = 1, clip } = o;
  const rand = rng(seed);
  const streaks = Array.from({ length: Math.round(2 + saffron * 8) }, () => ({
    u0: range(rand, -0.85, 0.85), a: range(rand, 0.08, 0.3), k: range(rand, 2, 5), ph: range(rand, 0, 6.3),
    dr: range(rand, -0.3, 0.3), w: range(rand, 0.1, 0.2),
  }));
  const list = items.map((it) => ({ y: it.y, s: it.svg }));
  const hyp = Math.hypot(ry, h);
  for (let placed = 0, tries = 0; placed < count && tries < count * 30; tries++) {
    // sample evenly in SCREEN space (a plain disc sample leaves the front slope bare): pick a column u and a
    // height y, then solve for the point on the dome that projects there.
    const u = rand() * 2 - 1; const a2 = 1 - u * u;
    if (rand() > Math.sqrt(a2)) continue;
    const sa = Math.sqrt(a2); const yTop = cy - sa * hyp; const yBot = cy + ry * sa;
    const y0 = yTop + rand() * (yBot - yTop);
    let lo = (-ry * sa) / hyp; let hi = sa;
    for (let k = 0; k < 14; k++) { const m = (lo + hi) / 2; if (cy + ry * m - h * Math.sqrt(Math.max(0, a2 - m * m)) < y0) lo = m; else hi = m; }
    const v = (lo + hi) / 2; const r = Math.min(0.99, Math.hypot(u, v)); const z = Math.sqrt(Math.max(0, a2 - v * v));
    placed++;
    const x = cx + rx * u; const y = cy + ry * v - h * z;
    const lam = (u * L[0] + v * L[1] + z * L[2]) / Math.max(1e-6, Math.hypot(u, v, z));
    const k = clamp((lam + 0.55) / 1.25);
    let sw = 0;
    for (const s of streaks) {
      const us = s.u0 + s.dr * (v + 0.8) + s.a * Math.sin(s.k * (v + 0.8) + s.ph);
      sw = Math.max(sw, Math.exp(-(((u - us) / s.w) ** 2)));
    }
    let st = 0;
    for (const m of masala) st = Math.max(st, Math.pow(clamp(1 - Math.hypot(x - m.x, (y - m.y) * 1.6) / m.r), 1.1));
    let c;
    if (st && rand() < st * 0.85) c = pick(rand, MASALA);
    else if (rand() < 0.1 + saffron * sw * 1.05) c = pick(rand, GOLD);
    else c = pick(rand, IVORY);
    c = k > 0.6 ? mix(c, '#FFF6DC', (k - 0.6) * 0.6) : mix(c, '#B07034', (0.6 - k) * 0.55);
    if (r > 0.85) c = mix(c, '#7A4018', (r - 0.85) * 1.2);
    if (v < -0.7) c = mix(c, '#9DB4F0', 0.07);
    // grains lie along the surface (tangent) about a third of the time, otherwise any way
    const ang = rand() < 0.35 ? (Math.atan2(u * ry, -v * rx) * 180) / Math.PI + range(rand, -35, 35) : rand() * 360;
    const sc = grain * range(rand, 0.85, 1.15);
    list.push({ y: y + range(rand, -2, 2), s: `<use href="#${p}-g${Math.floor(rand() * 4)}" transform="${T(x, y, ang, sc)}" fill="${c}"/>` });
  }
  list.sort((a, b) => a.y - b.y);
  // silhouette: top edge of the dome, then the front half of the base ellipse
  const pts = [];
  for (let i = 0; i <= 8; i++) {
    const u = -1 + (i / 8) * 2; let top = 1e9;
    for (let j = 0; j <= 20; j++) { const v = -1 + j / 10; const q = 1 - u * u - v * v; if (q >= 0) top = Math.min(top, cy + ry * v - h * Math.sqrt(q)); }
    pts.push([cx + rx * u * 1.02, Math.min(top, cy) - 3]);
  }
  for (let i = 1; i < 8; i++) { const a = Math.PI * (1 - i / 8); pts.push([cx + rx * 1.02 * Math.cos(a), cy + ry * 1.03 * Math.sin(a)]); }
  const sil = wobble(pts, 2.5, rng(seed + 9), true);
  const cid = `${p}-ms${seed}`;
  const body = `${shadow(p, cx + rx * 0.2, cy + ry * 0.35, rx * 1.2, ry * 1.1, 0.7)}
<path d="${sil}" fill="url(#${p}-dome)" stroke="#5A2A10" stroke-opacity=".5" stroke-width="3"/>
${list.map((e) => e.s).join('')}
<clipPath id="${cid}"><path d="${sil}"/></clipPath>
<g clip-path="url(#${cid})"><ellipse cx="${f(cx + rx * 0.45)}" cy="${f(cy + ry * 0.1)}" rx="${f(rx * 0.7)}" ry="${f(h * 0.7 + ry)}" fill="url(#${p}-ht)"/>
<ellipse cx="${f(cx - rx * 0.4)}" cy="${f(cy - h * 0.55)}" rx="${f(rx * 0.8)}" ry="${f(h * 0.75 + ry * 0.3)}" fill="url(#${p}-glow)" style="mix-blend-mode:screen"/></g>`;
  if (!clip) return body;
  const k2 = `${p}-mc${seed}`;
  return `<clipPath id="${k2}"><ellipse cx="${f(clip.cx)}" cy="${f(clip.cy)}" rx="${f(clip.rx)}" ry="${f(clip.ry)}"/></clipPath><g clip-path="url(#${k2})">${body}</g>`;
}
export const riceSurface = (o) => riceMound({ h: 14, ...o });

// ---------- chicken ----------
const RAW_MARINADE = ['#DD5B22', '#C2471A', '#E8743A', '#B8431F'];
const FRIED_MASALA = ['#B8532A', '#8E3A18', '#6E2810', '#D98A3A', '#4A1608', '#C2461F'];
export function chicken({ p = 'f', x, y, w = 100, h = 70, rot = 0, seed = 1, doneness = 0.5, raw = false, bone = false }) {
  const t = raw ? 0 : clamp(doneness); // 0 = raw marinated, 1 = fried golden-brown
  const rand = rng(seed * 31 + 7);
  const a = (rot * Math.PI) / 180; const ca = Math.cos(a); const sa = Math.sin(a);
  const R = (px, py) => [x + px * ca - py * sa, y + px * sa + py * ca];
  const N = 10;
  const pts = Array.from({ length: N }, (_, i) => {
    const th = (2 * Math.PI * i) / N; const k = 1 + range(rand, -0.24, 0.2);
    return R((w / 2) * Math.cos(th) * k, (h / 2) * Math.sin(th) * k);
  });
  const d = wobble(pts, 3.5, rand, true);
  const id = `${p}-ck${seed}`;
  const lit = mix('#EBCDB8', '#EDAA48', t); const mid = mix('#D9A58C', '#B8641E', t); const dk = mix('#A8705C', '#5C2610', t);
  let s = shadow(p, x + 8, y + h * 0.42, w * 0.62, h * 0.4, 0.8);
  if (bone) { // short pale bone end with a darker knuckle, as on a drumstick
    const bl = w * 0.36; const bh = h * 0.2;
    s += `<g transform="${T(x, y, rot)}"><path d="M${f(-w * 0.34)} ${f(-bh)}L${f(-w / 2 - bl)} ${f(-bh * 0.8)}L${f(-w / 2 - bl)} ${f(bh * 0.8)}L${f(-w * 0.34)} ${f(bh)}Z" fill="#EFE2C4" stroke="#8A7550" stroke-width="1.5"/>` +
      `<path d="M${f(-w * 0.34)} ${f(bh * 0.1)}L${f(-w / 2 - bl)} ${f(bh * 0.2)}L${f(-w / 2 - bl)} ${f(bh * 0.8)}L${f(-w * 0.34)} ${f(bh)}Z" fill="#C9B78F" fill-opacity=".7"/>` +
      `<circle cx="${f(-w / 2 - bl)}" cy="${f(-bh * 0.6)}" r="${f(bh * 0.75)}" fill="#E4D5B0" stroke="#8A7550" stroke-width="1.5"/><circle cx="${f(-w / 2 - bl)}" cy="${f(bh * 0.6)}" r="${f(bh * 0.75)}" fill="#D9C79E" stroke="#8A7550" stroke-width="1.5"/>` +
      `<circle cx="${f(-w / 2 - bl - 2)}" cy="${f(-bh * 0.85)}" r="2.2" fill="#FFF8E4" fill-opacity=".9"/></g>`;
  }
  s += `<defs><linearGradient id="${id}g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${lit}"/><stop offset=".5" stop-color="${mid}"/><stop offset="1" stop-color="${dk}"/></linearGradient>` +
    `<clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="url(#${id}g)" stroke="${mix(dk, '#2A0E04', 0.55)}" stroke-width="3.2" stroke-linejoin="round"/><g clip-path="url(#${id})">`;
  const nP = 14 + Math.round((1 - t) * 8);
  for (let i = 0; i < nP; i++) { // clinging marinade / masala patches: thick red-orange raw, darker once fried
    const [mx, my] = R(range(rand, -w * 0.45, w * 0.45), range(rand, -h * 0.4, h * 0.4));
    const big = 1 + (1 - t) * 0.9;
    s += `<path d="${blob(mx, my, range(rand, 5, 14) * big, range(rand, 4, 9) * big, 0.35, rand, 8)}" fill="${mix(pick(rand, RAW_MARINADE), pick(rand, FRIED_MASALA), t)}" fill-opacity="${f(Math.min(1, range(rand, 0.5, 0.85) + (1 - t) * 0.12))}"/>`;
  }
  s += `<ellipse cx="${f(x + w * 0.22)}" cy="${f(y + h * 0.24)}" rx="${f(w * 0.46)}" ry="${f(h * 0.4)}" fill="url(#${p}-ht)" opacity=".62"/>`;
  s += `<ellipse cx="${f(x + w * 0.3)}" cy="${f(y + h * 0.3)}" rx="${f(w * 0.5)}" ry="${f(h * 0.42)}" fill="${dk}" fill-opacity=".34"/>`;
  s += `<path d="${d}" fill="none" stroke="#3A1306" stroke-opacity="${f(0.08 + 0.5 * t)}" stroke-width="12" stroke-linejoin="round"/>`; // caramelised edge
  for (let i = 0; i < 4; i++) { // creases
    const [q1x, q1y] = R(range(rand, -w * 0.3, 0), range(rand, -h * 0.3, h * 0.3)); const [q2x, q2y] = R(range(rand, 0, w * 0.35), range(rand, -h * 0.3, h * 0.3));
    s += `<path d="M${f(q1x)} ${f(q1y)}Q${f((q1x + q2x) / 2)} ${f((q1y + q2y) / 2 + range(rand, -7, 7))} ${f(q2x)} ${f(q2y)}" fill="none" stroke="#3A1306" stroke-opacity="${f(0.3 + 0.2 * t)}" stroke-width="2" stroke-linecap="round"/>`;
  }
  for (let i = 0; i < 22; i++) { // dark speckles and spice flecks
    const [qx, qy] = R(range(rand, -w * 0.45, w * 0.45), range(rand, -h * 0.4, h * 0.4));
    const dark = i < 14;
    s += `<circle cx="${f(qx)}" cy="${f(qy)}" r="${f(range(rand, 0.8, dark ? 1.9 : 1.5))}" fill="${dark ? '#2A0E04' : pick(rand, ['#F0B454', '#E0861A', '#9AA84A'])}" fill-opacity="${f(dark ? 0.35 + 0.35 * t : 0.85)}"/>`;
  }
  if (t > 0.3) for (let i = 0; i < 8; i++) { // meat fibres
    const [fx, fy] = R(range(rand, -w * 0.4, w * 0.3), range(rand, -h * 0.35, h * 0.25));
    s += `<path d="M${f(fx)} ${f(fy)}l${f(range(rand, 8, 16))} ${f(range(rand, -3, 5))}" stroke="#F0B860" stroke-opacity="${f(0.5 * t)}" stroke-width="1.3" stroke-linecap="round"/>`;
  }
  s += '</g>';
  const [hx, hy] = R(-w * 0.18, -h * 0.22);
  s += `<ellipse cx="${f(hx)}" cy="${f(hy)}" rx="${f(w * 0.09)}" ry="${f(h * 0.05)}" fill="${t < 0.3 ? '#FFF0E8' : '#FFE3A0'}" fill-opacity=".75" transform="rotate(${f(rot - 20)} ${f(hx)} ${f(hy)})"/>`;
  s += `<circle cx="${f(hx + w * 0.16)}" cy="${f(hy + h * 0.1)}" r="1.8" fill="#FFF8E4" fill-opacity=".85"/>`;
  return s;
}

// ---------- birista ----------
export function biristaCluster({ p = 'f', x, y, w = 120, h = 50, n = 22, seed = 1 }) {
  const rand = rng(seed * 17 + 3); let s = '';
  for (let i = 0; i < n; i++) {
    let px = x + range(rand, -w / 2, w / 2); let py = y + range(rand, -h / 2, h / 2);
    let dir = rand() * 6.28; const pts = [[px, py]];
    for (let k = 0; k < 5; k++) { dir += range(rand, -1.4, 1.4); px += Math.cos(dir) * range(rand, 8, 15); py += Math.sin(dir) * range(rand, 5, 10); pts.push([px, py]); }
    const d = wobble(pts, 1.2, rand, false);
    const dk = pick(rand, ['#3E1D0B', '#4A230E', '#563013', '#2E1508']);
    s += `<path d="${d}" fill="none" stroke="#120804" stroke-opacity=".5" stroke-width="3.2" stroke-linecap="round" transform="translate(1.5 2.2)"/>` +
      `<path d="${d}" fill="none" stroke="${dk}" stroke-width="2.8" stroke-linecap="round"/>` +
      `<path d="${d}" fill="none" stroke="${pick(rand, ['#D79A3C', '#C98A35', '#E8B055'])}" stroke-opacity=".85" stroke-width="1.1" stroke-linecap="round" transform="translate(-.7 -.9)"/>`;
  }
  return s;
}

// ---------- mint ----------
export function mintLeaf({ p = 'f', x, y, len = 44, rot = 0, seed = 1 }) {
  const rand = rng(seed * 13 + 5); const W = len * 0.36; const top = []; const bot = [];
  for (let i = 0; i <= 7; i++) { const t = i / 7; const hw = W * Math.pow(Math.sin(Math.PI * Math.pow(t, 0.8)), 0.8) + 0.5; top.push([len * t, -hw]); bot.push([len * t, hw]); }
  const outline = wobble([...top, ...bot.reverse()], 1.1, rand, true);
  const half = wobble([...top, [len, 0], [0, 0]], 0.6, rng(seed + 1), true);
  return `<g transform="${T(x, y, rot)}"><g transform="translate(2.5 3.5)" opacity=".5"><path d="${outline}" fill="#06100a"/></g>
<path d="${outline}" fill="#4E7F3A" stroke="#27471F" stroke-width="1.2"/><path d="${half}" fill="#8FC45F" fill-opacity=".85"/>
<path d="M0 0L${f(len * 0.92)} 0" stroke="#C9E39A" stroke-width="1.5" stroke-linecap="round"/>
${[0.3, 0.52, 0.72].map((t) => `<path d="M${f(len * t)} 0L${f(len * (t + 0.14))} ${f(-W * 0.62)}M${f(len * t)} 0L${f(len * (t + 0.14))} ${f(W * 0.62)}" stroke="#2F5A26" stroke-opacity=".7" stroke-width="1"/>`).join('')}
<ellipse cx="${f(len * 0.42)}" cy="${f(-W * 0.45)}" rx="${f(len * 0.12)}" ry="1.6" fill="#EAF7C8" fill-opacity=".8"/></g>`;
}

// ---------- spices ----------
export function spice(kind, { p = 'f', x, y, rot = 0, s = 1 }) {
  const sh = (rx, ry) => `<ellipse cx="${f(x + 4 * s)}" cy="${f(y + 5 * s)}" rx="${f(rx * s)}" ry="${f(ry * s)}" fill="#0a0405" fill-opacity=".5" transform="rotate(${f(rot)} ${f(x)} ${f(y)})"/>`;
  const g = (inner) => `<g transform="${T(x, y, rot, s)}">${inner}</g>`;
  switch (kind) {
    case 'cardamom': return sh(12, 5) + g(`<path d="M-11 0C-9-3.5-3-4.6 1-4.4C6-4 9-2 11 0C9 2 6 4 1 4.4C-3 4.6-9 3.5-11 0Z" fill="#B9CF8A" stroke="#6E8A3C" stroke-width=".8"/><path d="M-11 0C-9-3.5-3-4.6 1-4.4C6-4 9-2 11 0Z" fill="#DCEBB2" fill-opacity=".7"/><path d="M-11 0C-9 3.5-3 4.6 1 4.4C6 4 9 2 11 0Z" fill="#7F9C48" fill-opacity=".4"/><path d="M-9-1.8Q0-3.4 9-1.2M-10 0Q0 .4 10 0M-9 1.8Q0 3.4 9 1.2" fill="none" stroke="#8FAA5A" stroke-opacity=".55" stroke-width=".7"/><path d="M-11 0L-13.6-.6" stroke="#7A6A3A" stroke-width="1.4" stroke-linecap="round"/><circle cx="11" cy="0" r=".9" fill="#8A7A44"/>`);
    case 'clove': return sh(14, 5) + g(`<path d="M-14 0L6-1.8L6 1.8Z" fill="#6B3A1C" stroke="#2E1408" stroke-width=".8"/><path d="M-12-.3L5-1.2" stroke="#B8794A" stroke-width=".8"/><ellipse cx="8" cy="-3.2" rx="2.6" ry="1.6" fill="#4A2410"/><ellipse cx="8" cy="3.2" rx="2.6" ry="1.6" fill="#4A2410"/><ellipse cx="12.5" cy="0" rx="1.6" ry="2.6" fill="#4A2410"/><circle cx="9" cy="0" r="3.6" fill="#5B2E14" stroke="#2A1206" stroke-width=".8"/><circle cx="8" cy="-1.2" r="1.2" fill="#C98A55" fill-opacity=".8"/>`);
    case 'cinnamon': return sh(28, 9) + g(`<path d="${wobble([[-26, -6], [-8, -8.5], [12, -8], [26, -5.5], [26, 6], [12, 8.5], [-8, 9], [-26, 6]], 0.8, rng(5))}" fill="#9E5A28" stroke="#4A220C" stroke-width="1.2"/><path d="M-25-5C-8-8 12-7 25-5L25-1C12-3-8-4-25-1Z" fill="#D49458" fill-opacity=".85"/><path d="M-25 3C-8 5 12 5 25 3L25 6C12 8-8 8-25 6Z" fill="#4E2410" fill-opacity=".55"/><ellipse cx="26" cy="0" rx="4.2" ry="6.3" fill="#7A3E18" stroke="#3A1A08" stroke-width="1"/><path d="M26-3A2.5 2.5 0 1 1 26 2" fill="none" stroke="#C98A55" stroke-width="1.1"/><path d="M-20-1L-6 0M2 2L16 1" stroke="#3A1A08" stroke-opacity=".5" stroke-width="1"/>`);
    case 'pepper': return sh(6, 4) + g(`<circle r="5.2" fill="#35261C" stroke="#120A06" stroke-width=".8"/><path d="M-3-2Q0-4 3-1M-4 1Q-1-1 2 2M0 3Q2 2 4 3" fill="none" stroke="#150C07" stroke-width=".8"/><ellipse cx="-1.8" cy="-2" rx="1.8" ry="1.1" fill="#E9D9BE" fill-opacity=".8"/>`);
    case 'bay': return sh(42, 13) + g(`<path d="M-40 0C-30-14-8-15 16-10C28-7 38-3 42 0C38 3 28 7 16 10C-8 15-30 14-40 0Z" fill="#767A38" stroke="#3A3E16" stroke-width="1.4"/><path d="M-40 0C-30-14-8-15 16-10C28-7 38-3 42 0Z" fill="#A5A854" fill-opacity=".85"/><path d="M-40 0L40 0" stroke="#DADC9A" stroke-width="1.8" stroke-linecap="round"/><path d="M-30 0C-16-6 8-8 30-5M-30 0C-16 6 8 8 30 5" fill="none" stroke="#C9CC86" stroke-width="1.2"/><path d="M-46-1L-38 0" stroke="#5A3A1A" stroke-width="3" stroke-linecap="round"/>`);
    case 'chilli': return sh(48, 12) + g(`<path d="M-45 0C-30-9 0-11 25-5C38-1 46 8 53 20C46 19 38 13 30 7C8 9-28 11-45 0Z" fill="#6A9E38" stroke="#2F5018" stroke-width="1.3"/><path d="M-43-1C-28-9 0-10 24-5C34-2 40 3 46 10C30 0-5-3-43-1Z" fill="#A9D364" fill-opacity=".85"/><path d="M-40 4C-25 7-5 8 22 6" fill="none" stroke="#3E6C22" stroke-opacity=".6" stroke-width="2"/><path d="M-30-6C-18-8-6-8 6-7" fill="none" stroke="#F4FFD8" stroke-opacity=".7" stroke-width="1.6" stroke-linecap="round"/><path d="M-45 0L-52-2L-54 2Z" fill="#3E5A2A" stroke="#1E3012" stroke-width="1"/>`);
    case 'anise': {
      const pts = Array.from({ length: 16 }, (_, i) => { const a = (i * Math.PI) / 8 - Math.PI / 2; const r = i % 2 ? 7 : 15; return `${f(Math.cos(a) * r)} ${f(Math.sin(a) * r)}`; });
      const seeds = Array.from({ length: 8 }, (_, i) => { const a = (i * Math.PI) / 4 - Math.PI / 2; return `<ellipse cx="${f(Math.cos(a) * 9.5)}" cy="${f(Math.sin(a) * 9.5)}" rx="2.2" ry="1.3" transform="rotate(${f((a * 180) / Math.PI)} ${f(Math.cos(a) * 9.5)} ${f(Math.sin(a) * 9.5)})" fill="#2E1306" stroke="#A8683A" stroke-width=".5"/>`; }).join('');
      return sh(15, 15) + g(`<path d="M${pts.join('L')}Z" fill="#7E3B1C" stroke="#33160A" stroke-width="1.2" stroke-linejoin="round"/>${seeds}<circle r="3" fill="#5A2A12"/><path d="M-9-9L0-14L-4-5Z" fill="#D49458" fill-opacity=".5"/>`);
    }
    default: return '';
  }
}

// ---------- ghee glisten ----------
export function glisten({ x, y, w, h, n = 14, seed = 1 }) {
  const rand = rng(seed * 7 + 1); let s = '';
  for (let i = 0; i < n; i++) {
    const t = rand() * 6.28; const r = Math.sqrt(rand()); const gx = x + Math.cos(t) * r * w / 2 - w * 0.12 * r; const gy = y + Math.sin(t) * r * h / 2 - h * 0.1 * r;
    s += `<circle cx="${f(gx)}" cy="${f(gy)}" r="${f(range(rand, 4, 8))}" fill="#FFD27A" fill-opacity=".2"/>` +
      `<ellipse cx="${f(gx)}" cy="${f(gy)}" rx="${f(range(rand, 2, 5.5))}" ry="${f(range(rand, 0.8, 1.6))}" fill="${pick(rand, ['#FFF3CC', '#FFFAE6', '#FFE9A8'])}" fill-opacity=".92" transform="rotate(${f(range(rand, -50, 20))} ${f(gx)} ${f(gy)})"/>`;
  }
  return s;
}

// ---------- steam ----------
export function steam({ p = 'f', x, y, h = 160, w = 40, n = 3, seed = 1 }) {
  const rand = rng(seed * 5 + 2); let s = '';
  for (let i = 0; i < n; i++) {
    const ox = x + range(rand, -w * 0.6, w * 0.6); const pts = [[ox, y]];
    for (let k = 1; k <= 5; k++) pts.push([ox + Math.sin(k * 1.3 + i * 2) * w * range(rand, 0.4, 1) * (k / 5 + 0.3), y - (h * k) / 5]);
    const d = wobble(pts, 3, rand, false);
    s += `<g class="${p}-wisp" style="animation-delay:${f(-rand() * 7)}s;animation-duration:${f(range(rand, 5.5, 8.5))}s" fill="none" stroke="url(#${p}-steam)" stroke-linecap="round">` +
      `<path d="${d}" stroke-width="34" stroke-opacity=".3"/><path d="${d}" stroke-width="16" stroke-opacity=".5"/><path d="${d}" stroke-width="5" stroke-opacity=".78"/></g>`;
  }
  return s;
}

// ---------- plate, spoon, bowls ----------
export function plate({ p = 'f', cx, cy, w = 460, ratio = 0.45 }) {
  const rx = w / 2; const ry = rx * ratio; const th = w * 0.045; const id = `${p}-pl${Math.round(cx)}`;
  return `${shadow(p, cx + rx * 0.12, cy + th + ry * 0.2, rx * 1.12, ry * 1.12, 0.9)}
<path d="M${f(cx - rx)} ${f(cy)}L${f(cx - rx + 4)} ${f(cy + th)}Q${f(cx)} ${f(cy + th + ry * 1.04)} ${f(cx + rx - 4)} ${f(cy + th)}L${f(cx + rx)} ${f(cy)}Z" fill="url(#${p}-steelH)"/>
${ell(cx, cy, rx, ry, `url(#${p}-steel)`, 'stroke="#2A3050" stroke-width="1.5"')}
<clipPath id="${id}"><ellipse cx="${f(cx)}" cy="${f(cy)}" rx="${f(rx)}" ry="${f(ry)}"/></clipPath>
<g clip-path="url(#${id})"><ellipse cx="${f(cx + rx * 0.35)}" cy="${f(cy + ry * 0.45)}" rx="${f(rx * 1.0)}" ry="${f(ry * 0.95)}" fill="url(#${p}-ht)" opacity=".6"/></g>
${ell(cx, cy + ry * 0.02, rx * 0.88, ry * 0.88, 'none', 'stroke="#FFF4D8" stroke-opacity=".7" stroke-width="2.2"')}
${ell(cx, cy + ry * 0.07, rx * 0.84, ry * 0.84, `url(#${p}-steelIn)`)}
${ell(cx - rx * 0.1, cy + ry * 0.05, rx * 0.8, ry * 0.76, `url(#${p}-glow)`, 'style="mix-blend-mode:screen"')}
${ell(cx, cy + ry * 0.09, rx * 0.66, ry * 0.64, 'none', 'stroke="#10142A" stroke-opacity=".5" stroke-width="2"')}
<path d="M${f(cx - rx * 0.97)} ${f(cy - ry * 0.18)}A${f(rx * 0.97)} ${f(ry * 0.97)} 0 0 1 ${f(cx - rx * 0.28)} ${f(cy - ry * 0.93)}" fill="none" stroke="#FFF8E0" stroke-width="3.4" stroke-linecap="round"/>
<path d="M${f(cx + rx * 0.35)} ${f(cy - ry * 0.92)}A${f(rx * 0.97)} ${f(ry * 0.97)} 0 0 1 ${f(cx + rx * 0.9)} ${f(cy - ry * 0.35)}" fill="none" stroke="#9DB4F0" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>
<path d="M${f(cx - rx * 0.62)} ${f(cy + ry * 0.8)}A${f(rx * 0.97)} ${f(ry * 0.97)} 0 0 0 ${f(cx + rx * 0.3)} ${f(cy + ry * 0.95)}" fill="none" stroke="#FFD890" stroke-opacity=".7" stroke-width="2.6" stroke-linecap="round"/>
<path d="M${f(cx - rx * 0.8)} ${f(cy - ry * 0.55)}A${f(rx * 0.97)} ${f(ry * 0.97)} 0 0 1 ${f(cx - rx * 0.5)} ${f(cy - ry * 0.85)}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
}
export const smallPlate = (o) => plate({ w: 230, ...o });

export function spoon({ p = 'f', x, y, len = 170, rot = 0, s = 1, bite }) {
  let b = '';
  if (bite) {
    const rand = rng((bite.seed || 3) * 11); const n = bite.n ?? 30;
    for (let i = 0; i < n; i++) {
      const r = Math.sqrt(rand()) * 0.85; const t = rand() * 6.28; const gx = Math.cos(t) * r * 22; const gy = Math.sin(t) * r * 13 - (1 - r) * 12;
      const col = rand() < 0.3 ? pick(rand, GOLD) : pick(rand, IVORY);
      b += `<use href="#${p}-g${Math.floor(rand() * 4)}" transform="${T(gx, gy, rand() * 360, 0.85)}" fill="${col}"/>`;
    }
    if (bite.chicken !== false) b += `<path d="${blob(-4, -12, 11, 8, 0.2, rand, 8)}" fill="url(#${p}-chk)" stroke="#3E1608" stroke-width="2"/><ellipse cx="-7" cy="-15" rx="4" ry="1.8" fill="#FFE3A0" fill-opacity=".85"/>`;
    if (bite.onion !== false) b += `<path d="M-12-6Q-4-16 4-8T14-12" fill="none" stroke="#4A230E" stroke-width="2.6" stroke-linecap="round"/><path d="M-12-7Q-4-17 4-9T14-13" fill="none" stroke="#D79A3C" stroke-width="1" stroke-linecap="round"/>`;
  }
  return `<g transform="${T(x, y, rot, s)}"><ellipse cx="6" cy="9" rx="30" ry="14" fill="#0a0405" fill-opacity=".5"/>
<path d="M22-3L${len} -5.5L${len + 3} 1.5L22 3Z" fill="url(#${p}-steelH)" stroke="#2A3050" stroke-width="1"/><path d="M26-1.6L${len - 4} -3.6" stroke="#FFF4D8" stroke-width="1.6" stroke-linecap="round"/>
<ellipse cx="0" cy="0" rx="28" ry="17" fill="url(#${p}-steel)" stroke="#2A3050" stroke-width="1.5"/>
<ellipse cx="1" cy="1.5" rx="23" ry="13" fill="url(#${p}-steelIn)"/>${b}
<path d="M-26-4A28 17 0 0 1-10-15" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M-14 14Q0 17 14 12" fill="none" stroke="#FFD890" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/></g>`;
}

export function bowl({ p = 'f', cx, cy, w = 190, fill = 'empty', seed = 1, tint = 0, depth = 0.4 }) {
  const rx = w / 2; const ry = rx * 0.45; const d = w * depth; const rand = rng(seed * 19 + 4);
  const ccy = cy + ry * 0.2; const crx = rx * 0.84; const cry = ry * 0.8; const cid = `${p}-bc${Math.round(cx)}${Math.round(cy)}`;
  let c = '';
  if (fill === 'dahi') {
    c += ell(cx, ccy, crx, cry, `url(#${p}-curd)`);
    c += `<clipPath id="${cid}"><ellipse cx="${f(cx)}" cy="${f(ccy)}" rx="${f(crx)}" ry="${f(cry)}"/></clipPath><g clip-path="url(#${cid})">`;
    c += `<path d="${wobble([[cx - crx * 0.6, ccy], [cx - crx * 0.2, ccy - cry * 0.4], [cx + crx * 0.3, ccy - cry * 0.1], [cx + crx * 0.6, ccy + cry * 0.3]], 3, rand, false)}" fill="none" stroke="#fff" stroke-width="5" stroke-opacity=".7" stroke-linecap="round"/>`;
    for (let i = 0; i < 26; i++) { const r = Math.sqrt(rand()); const t = rand() * 6.28; const fx = cx + Math.cos(t) * r * crx * 0.9; const fy = ccy + Math.sin(t) * r * cry * 0.9;
      c += rand() < 0.65 ? `<ellipse cx="${f(fx)}" cy="${f(fy)}" rx="${f(range(rand, 2, 4.5))}" ry="${f(range(rand, 1, 2))}" transform="rotate(${f(rand() * 180)} ${f(fx)} ${f(fy)})" fill="${pick(rand, ['#4E8A3C', '#6FA650', '#3C6E2E'])}"/>` : `<rect x="${f(fx)}" y="${f(fy)}" width="${f(range(rand, 2, 4))}" height="${f(range(rand, 1.5, 3))}" rx=".8" fill="${pick(rand, ['#D79AB8', '#B8789E', '#EFC6D6'])}"/>`; }
    for (let i = 0; i < 2; i++) { // soft swirl strokes: wide pale ridge, thin shade beside it
      const sw = wobble([[cx - crx * 0.55, ccy + cry * (0.3 - i * 0.5)], [cx - crx * 0.1, ccy - cry * (0.1 + i * 0.3)], [cx + crx * 0.35, ccy + cry * (0.15 - i * 0.4)], [cx + crx * 0.7, ccy - cry * 0.1]], 3, rand, false);
      c += `<path d="${sw}" fill="none" stroke="#D8D0BC" stroke-width="3" stroke-opacity=".7" stroke-linecap="round" transform="translate(1.5 3)"/><path d="${sw}" fill="none" stroke="#fff" stroke-width="6" stroke-opacity=".6" stroke-linecap="round"/>`;
    }
    for (let i = 0; i < 24; i++) c += `<circle cx="${f(cx + range(rand, -crx * 0.85, crx * 0.85))}" cy="${f(ccy + range(rand, -cry * 0.8, cry * 0.8))}" r="${f(range(rand, 0.7, 1.4))}" fill="#8A5A2A" fill-opacity=".8"/>`; // cumin
    for (let i = 0; i < 16; i++) c += `<circle cx="${f(cx + range(rand, -crx * 0.5, crx * 0.7))}" cy="${f(ccy + range(rand, -cry * 0.3, cry * 0.7))}" r="${f(range(rand, 0.9, 1.9))}" fill="#C0391A" fill-opacity=".85"/>`; // chilli powder
    c += `<ellipse cx="${f(cx - crx * 0.3)}" cy="${f(ccy - cry * 0.4)}" rx="${f(crx * 0.3)}" ry="${f(cry * 0.14)}" fill="#fff" fill-opacity=".8"/></g>`;
    c += ell(cx, ccy, crx, cry, 'none', 'stroke="#8A7A66" stroke-opacity=".5" stroke-width="1.2"') + ell(cx, ccy, crx - 2, cry - 1.5, 'none', 'stroke="#FFFDF4" stroke-opacity=".85" stroke-width="2"') + ell(cx + 1, ccy + 1, crx - 5, cry - 3.5, 'none', 'stroke="#CFC5AE" stroke-opacity=".6" stroke-width="2"'); // meniscus
    c += mintLeaf({ p, x: cx + crx * 0.05, y: ccy + cry * 0.1, len: w * 0.14, rot: -25, seed: seed + 2 });
  } else if (fill === 'salan') {
    c += ell(cx, ccy, crx, cry, `url(#${p}-salan)`);
    c += `<clipPath id="${cid}"><ellipse cx="${f(cx)}" cy="${f(ccy)}" rx="${f(crx)}" ry="${f(cry)}"/></clipPath><g clip-path="url(#${cid})">`;
    for (let i = 0; i < 7; i++) c += `<path d="${blob(cx + range(rand, -crx * 0.6, crx * 0.6), ccy + range(rand, -cry * 0.5, cry * 0.5), range(rand, 7, 16), range(rand, 3, 7), 0.2, rand, 8)}" fill="#F08A2C" fill-opacity="${f(range(rand, 0.35, 0.65))}"/>`;
    for (let i = 0; i < 18; i++) c += `<circle cx="${f(cx + range(rand, -crx * 0.8, crx * 0.8))}" cy="${f(ccy + range(rand, -cry * 0.7, cry * 0.7))}" r="${f(range(rand, 1, 2))}" fill="${pick(rand, ['#D9B070', '#F0D090', '#A86A30'])}"/>`;
    c += `<path d="M${f(cx - crx * 0.6)} ${f(ccy - cry * 0.2)}Q${f(cx - crx * 0.3)} ${f(ccy - cry * 0.65)} ${f(cx + crx * 0.1)} ${f(ccy - cry * 0.55)}" fill="none" stroke="#FFE9B0" stroke-opacity=".85" stroke-width="3" stroke-linecap="round"/></g>`;
    c += spice('chilli', { p, x: cx - crx * 0.1, y: ccy - cry * 0.15, rot: -12, s: w / 330 });
    c += spice('chilli', { p, x: cx + crx * 0.05, y: ccy + cry * 0.3, rot: 8, s: w / 360 });
  } else if (fill === 'chicken') {
    const col = mix('#F6EEDD', '#E2742A', tint); const dk = mix('#E4D2C0', '#9C3414', tint);
    c += ell(cx, ccy, crx, cry, mix('#EFE2CE', '#B8431F', tint));
    for (let i = 0; i < 6; i++) { const t = (i / 6) * 6.28 + 0.4; const px = cx + Math.cos(t) * crx * 0.5; const py = ccy + Math.sin(t) * cry * 0.45 - 4; const wd = w * 0.18;
      c += `<path d="${blob(px + 3, py + 4, wd, wd * 0.62, 0.18, rand, 9)}" fill="#1a0a05" fill-opacity=".35"/><path d="${blob(px, py, wd, wd * 0.62, 0.18, rand, 9)}" fill="${col}" stroke="${dk}" stroke-width="2"/><ellipse cx="${f(px - wd * 0.3)}" cy="${f(py - wd * 0.25)}" rx="${f(wd * 0.35)}" ry="${f(wd * 0.14)}" fill="#fff" fill-opacity=".75"/>`; }
  }
  const body = `M${f(cx - rx)} ${f(cy)}C${f(cx - rx)} ${f(cy + d * 0.7)} ${f(cx - rx * 0.55)} ${f(cy + d)} ${f(cx)} ${f(cy + d)}C${f(cx + rx * 0.55)} ${f(cy + d)} ${f(cx + rx)} ${f(cy + d * 0.7)} ${f(cx + rx)} ${f(cy)}Z`;
  return `${shadow(p, cx + rx * 0.3, cy + d - 2, rx * 1.15, ry * 0.8, 0.85)}
<path d="${body}" fill="url(#${p}-steelH)" stroke="#232845" stroke-width="1.5"/>
<path d="M${f(cx - rx * 0.86)} ${f(cy + d * 0.18)}C${f(cx - rx * 0.78)} ${f(cy + d * 0.6)} ${f(cx - rx * 0.45)} ${f(cy + d * 0.88)} ${f(cx - rx * 0.2)} ${f(cy + d * 0.94)}" fill="none" stroke="#FFF3CF" stroke-opacity=".75" stroke-width="${f(w * 0.03)}" stroke-linecap="round"/>
<path d="M${f(cx + rx * 0.5)} ${f(cy + d * 0.4)}C${f(cx + rx * 0.3)} ${f(cy + d * 0.8)} ${f(cx + rx * 0.2)} ${f(cy + d * 0.9)} ${f(cx)} ${f(cy + d * 0.96)}" fill="none" stroke="#9AA8D8" stroke-opacity=".3" stroke-width="2.4" stroke-linecap="round"/>
${ell(cx, cy, rx, ry, `url(#${p}-steel)`, 'stroke="#232845" stroke-width="1.5"')}
${ell(cx, cy + ry * 0.07, rx * 0.92, ry * 0.9, `url(#${p}-steelIn)`)}
${c}
<path d="M${f(cx - rx * 0.97)} ${f(cy - ry * 0.15)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx * 0.3)} ${f(cy - ry * 0.95)}" fill="none" stroke="#FFF8E0" stroke-width="3" stroke-linecap="round"/>
<path d="M${f(cx + rx * 0.4)} ${f(cy - ry * 0.92)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx * 0.95)} ${f(cy - ry * 0.3)}" fill="none" stroke="#9DB4F0" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
<path d="M${f(cx - rx * 0.6)} ${f(cy + ry * 0.82)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx * 0.3)} ${f(cy + ry * 0.97)}" fill="none" stroke="#FFD890" stroke-opacity=".75" stroke-width="2.6" stroke-linecap="round"/>
<path d="M${f(cx - rx * 0.78)} ${f(cy - ry * 0.55)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx * 0.5)} ${f(cy - ry * 0.86)}" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"/>`;
}

// ---------- the copper handi ----------
export const handiInside = (w, tilt, cx, cy) => ({ cx, cy: cy + w * tilt * 0.12, rx: (w / 2) * 0.9, ry: (w / 2) * tilt * 0.82 });

export function handi({ p = 'f', cx, cy, w = 340, tilt = 0.5, fill = 'rice', seed = 1, items = [], ...rice }) {
  const rx = w / 2; const ry = rx * tilt; const rand = rng(seed * 23 + 9); const bid = `${p}-hb${seed}`;
  const bot = cy + w * 0.5;
  const body = `M${f(cx - rx)} ${f(cy)}C${f(cx - rx * 1.22)} ${f(cy + w * 0.18)} ${f(cx - rx * 1.12)} ${f(cy + w * 0.42)} ${f(cx - rx * 0.4)} ${f(bot - 6)}Q${f(cx)} ${f(bot + 10)} ${f(cx + rx * 0.4)} ${f(bot - 6)}C${f(cx + rx * 1.12)} ${f(cy + w * 0.42)} ${f(cx + rx * 1.22)} ${f(cy + w * 0.18)} ${f(cx + rx)} ${f(cy)}Z`;
  let s = `${shadow(p, cx + rx * 0.25, bot - 4, rx * 1.35, ry * 0.7, 0.9)}`;
  s += [-1, 1].map((sd) => `<path d="M${f(cx + sd * rx * 1.12)} ${f(cy + w * 0.1)}c${sd * 22} -4 ${sd * 26} 26 ${sd * 2} 30" fill="none" stroke="#2A1210" stroke-width="9" stroke-linecap="round"/><path d="M${f(cx + sd * rx * 1.12)} ${f(cy + w * 0.1)}c${sd * 22} -4 ${sd * 26} 26 ${sd * 2} 30" fill="none" stroke="${sd < 0 ? '#E8935A' : '#9A5028'}" stroke-width="5" stroke-linecap="round"/>`).join('');
  s += `<path d="${body}" fill="url(#${p}-cop)" stroke="#2A1210" stroke-width="2"/><clipPath id="${bid}"><path d="${body}"/></clipPath><g clip-path="url(#${bid})">`;
  for (let i = 0; i < 80; i++) { const hx = cx + range(rand, -rx * 1.2, rx * 1.2); const hy = cy + range(rand, ry * 0.4, w * 0.5);
    s += `<circle cx="${f(hx)}" cy="${f(hy)}" r="${f(range(rand, 4, 7))}" fill="#2A1008" fill-opacity=".1"/><circle cx="${f(hx - 1.2)}" cy="${f(hy - 1.6)}" r="${f(range(rand, 3, 5))}" fill="#FFC890" fill-opacity=".12"/>`; }
  s += `<ellipse cx="${f(cx + rx * 0.5)}" cy="${f(cy + w * 0.3)}" rx="${f(rx * 0.9)}" ry="${f(w * 0.3)}" fill="url(#${p}-ht)" opacity=".5"/>`;
  s += `<path d="M${f(cx - rx * 1.05)} ${f(cy + w * 0.1)}C${f(cx - rx * 1.1)} ${f(cy + w * 0.3)} ${f(cx - rx * 0.8)} ${f(cy + w * 0.42)} ${f(cx - rx * 0.5)} ${f(cy + w * 0.47)}" fill="none" stroke="#FFD9A8" stroke-opacity=".7" stroke-width="7" stroke-linecap="round"/></g>`;
  s += ell(cx, cy, rx, ry, `url(#${p}-cop)`, 'stroke="#2A1210" stroke-width="2"');
  const ins = handiInside(w, tilt, cx, cy - w * tilt * 0.12 + ry * 0.04);
  s += ell(cx, cy + ry * 0.04, rx * 0.93, ry * 0.9, `url(#${p}-copIn)`);
  if (fill === 'rice') {
    s += riceMound({ p, cx: cx, cy: cy + ry * 0.14, rx: rx * 0.92, ry: ry * 0.86, h: 22, count: Math.round(w * 3.6), grain: Math.max(1, w / 600), seed, saffron: 0.5, items,
      clip: { cx, cy: cy + ry * 0.04, rx: rx * 0.93, ry: ry * 0.9 }, ...rice });
  }
  s += `<path d="M${f(cx - rx * 0.99)} ${f(cy + ry * 0.12)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx * 0.25)} ${f(cy - ry * 0.97)}" fill="none" stroke="#FFD9A8" stroke-width="5" stroke-linecap="round"/>
<path d="M${f(cx + rx * 0.35)} ${f(cy - ry * 0.95)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx + rx * 0.97)} ${f(cy - ry * 0.25)}" fill="none" stroke="#9DB4F0" stroke-opacity=".75" stroke-width="2.6" stroke-linecap="round"/>
<path d="M${f(cx - rx * 0.95)} ${f(cy + ry * 0.35)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx * 0.95)} ${f(cy + ry * 0.35)}" fill="none" stroke="#E8935A" stroke-opacity=".8" stroke-width="6"/>`;
  return s;
}

export function lid({ p = 'f', cx, cy, r = 130, lean = -16 }) {
  const rx = r * 0.2; const ry = r;
  return `<g transform="rotate(${lean} ${f(cx)} ${f(cy + r)})">
${shadow(p, cx + r * 0.3, cy + r, r * 0.4, r * 0.18, 0.8)}
${ell(cx + rx * 0.35, cy, rx, ry, '#4A2018', 'stroke="#2A1210" stroke-width="2"')}
${ell(cx, cy, rx, ry, `url(#${p}-cop)`, 'stroke="#2A1210" stroke-width="2"')}
${ell(cx - 1, cy, rx * 0.72, ry * 0.88, 'none', 'stroke="#FFD9A8" stroke-opacity=".5" stroke-width="2.4"')}
<path d="M${f(cx - rx * 0.1)} ${f(cy - ry * 0.9)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx - rx * 0.95)} ${f(cy + ry * 0.1)}" fill="none" stroke="#FFE2B8" stroke-width="3.4" stroke-linecap="round"/>
<path d="M${f(cx - rx * 0.1)} ${f(cy - 10)}L${f(cx - rx * 2.8)} ${f(cy - 8)}L${f(cx - rx * 2.8)} ${f(cy + 8)}L${f(cx - rx * 0.1)} ${f(cy + 10)}Z" fill="#8A4224"/>${ell(cx - rx * 3.2, cy, rx * 1.1, 14, 'url(#' + p + '-cop)', 'stroke="#2A1210" stroke-width="1.5"')}<ellipse cx="${f(cx - rx * 3.5)}" cy="${f(cy - 5)}" rx="3" ry="6" fill="#FFE9C8" fill-opacity=".8"/></g>`;
}

export function tumbler({ p = 'f', cx, cy, w = 84, h = 130 }) {
  const rx = w / 2; const ry = rx * 0.4; const bx = rx * 0.74;
  return `${shadow(p, cx + rx * 0.5, cy + h, rx * 1.3, ry * 0.9, 0.9)}
<path d="M${f(cx - rx)} ${f(cy)}L${f(cx - bx)} ${f(cy + h)}Q${f(cx)} ${f(cy + h + ry * 0.9)} ${f(cx + bx)} ${f(cy + h)}L${f(cx + rx)} ${f(cy)}Z" fill="url(#${p}-steelH)" stroke="#232845" stroke-width="1.5"/>
<path d="M${f(cx - rx * 0.72)} ${f(cy + 12)}L${f(cx - bx * 0.8)} ${f(cy + h - 10)}" stroke="#FFF3CF" stroke-opacity=".8" stroke-width="${f(w * 0.06)}" stroke-linecap="round"/>
<path d="M${f(cx + rx * 0.7)} ${f(cy + 14)}L${f(cx + bx * 0.78)} ${f(cy + h - 10)}" stroke="#9DB4F0" stroke-opacity=".6" stroke-width="3" stroke-linecap="round"/>
${ell(cx, cy, rx, ry, `url(#${p}-steel)`, 'stroke="#232845" stroke-width="1.5"')}
${ell(cx, cy + 2, rx * 0.88, ry * 0.82, `url(#${p}-steelIn)`)}${ell(cx, cy + 5, rx * 0.8, ry * 0.7, `url(#${p}-water)`)}
${ell(cx - rx * 0.3, cy + 3, rx * 0.3, ry * 0.18, '#E8F4FF', 'fill-opacity=".8"')}
<path d="M${f(cx - rx * 0.9)} ${f(cy + ry * 0.2)}A${f(rx)} ${f(ry)} 0 0 1 ${f(cx - rx * 0.4)} ${f(cy - ry * 0.9)}" fill="none" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/>
<path d="M${f(cx - rx * 0.5)} ${f(cy + ry * 0.85)}A${f(rx)} ${f(ry)} 0 0 0 ${f(cx + rx * 0.3)} ${f(cy + ry * 0.98)}" fill="none" stroke="#FFD890" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>`;
}

export function servingSpoon({ p = 'f', x, y, len = 260, rot = -14 }) {
  return `<g transform="${T(x, y, rot)}"><path d="M-5 0L-3.5 ${-len}Q0 ${-len - 14} 4 ${-len}L6 0Z" fill="url(#${p}-steelH)" stroke="#232845" stroke-width="1.3"/>
<path d="M-2.4 -6L-1.6 ${-len + 8}" stroke="#FFF4D8" stroke-width="2" stroke-linecap="round"/><ellipse cx="0.2" cy="${-len - 5}" rx="2.6" ry="4" fill="#232845"/></g>`;
}

// ---------- side dishes ----------
export function onionRings({ p = 'f', cx, cy, n = 6, seed = 1 }) {
  const rand = rng(seed * 3 + 1); let s = '';
  for (let i = 0; i < n; i++) {
    const rx = range(rand, 20, 36); const ry = rx * 0.5; const x = cx + range(rand, -55, 55); const y = cy + range(rand, -14, 14);
    s += `<ellipse cx="${f(x + 3)}" cy="${f(y + 4)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#0a0405" stroke-opacity=".4" stroke-width="7"/>` +
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#B0508A" stroke-width="7"/>` +
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx)}" ry="${f(ry)}" fill="none" stroke="#F6DCE4" stroke-width="3.6"/>` +
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx * 0.7)}" ry="${f(ry * 0.7)}" fill="none" stroke="#C7699F" stroke-width="2.4"/>` +
      `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(rx * 0.7)}" ry="${f(ry * 0.7)}" fill="none" stroke="#FFF0F4" stroke-width="1" stroke-opacity=".8"/>` +
      `<path d="M${f(x - rx)} ${f(y - 1)}A${f(rx)} ${f(ry)} 0 0 1 ${f(x - rx * 0.3)} ${f(y - ry)}" fill="none" stroke="#fff" stroke-opacity=".85" stroke-width="1.8" stroke-linecap="round"/>`;
  }
  return s;
}

export function lemonWedge({ p = 'f', x, y, s = 1, rot = 0 }) {
  let seg = '';
  for (let i = 0; i < 5; i++) { const a = Math.PI * (0.12 + (i * 0.76) / 4); seg += `<path d="M0 0L${f(Math.cos(a) * 30)} ${f(-Math.sin(a) * 30)}" stroke="#F8EFB0" stroke-width="1.6"/>`; }
  return `<g transform="${T(x, y, rot, s)}"><ellipse cx="6" cy="8" rx="38" ry="12" fill="#0a0405" fill-opacity=".5"/>
<path d="M-38 0A38 38 0 0 1 38 0Z" fill="#E8B012" stroke="#8A5A08" stroke-width="1.5"/><path d="M-33 0A33 33 0 0 1 33 0Z" fill="#F8F0C0"/><path d="M-30 -1A30 30 0 0 1 30 -1Z" fill="#F7D24A"/>${seg}
<path d="M-34-4A34 34 0 0 1-14-31" fill="none" stroke="#FFFBE0" stroke-width="2.4" stroke-linecap="round"/><circle cx="-9" cy="-14" r="2" fill="#fff" fill-opacity=".9"/><circle cx="14" cy="-9" r="1.5" fill="#fff" fill-opacity=".8"/></g>`;
}

export function doughBits({ p = 'f', cx, cy, n = 7, spread = 120, seed = 1 }) {
  const rand = rng(seed * 29 + 6); let s = '';
  for (let i = 0; i < n; i++) {
    const x = cx + range(rand, -spread, spread); const y = cy + range(rand, -spread * 0.2, spread * 0.2);
    const strip = i % 3 === 1; const w = strip ? range(rand, 34, 50) : range(rand, 18, 32); const h = strip ? range(rand, 12, 16) : range(rand, 11, 17);
    const id = `${p}-dg${seed}-${i}`; const pts = [];
    if (strip) { // a curved strip that came off the rim
      const k = range(rand, 0.6, 1.2) * h; const top = []; const bot = [];
      for (let j = 0; j <= 8; j++) { const t = -1 + j / 4; const c = -k * (1 - t * t); const th = (h / 2) * (1 - 0.3 * t * t); top.push([t * w + range(rand, -1.5, 1.5), c - th + range(rand, -1.5, 1.5)]); bot.push([t * w + range(rand, -1.5, 1.5), c + th + range(rand, -1.5, 1.5)]); }
      pts.push(...top, ...bot.reverse());
    } else {
      for (let j = 0; j < 11; j++) { const th = (j / 11) * 6.283; const k = range(rand, 0.72, 1.18); pts.push([Math.cos(th) * w * k, Math.sin(th) * h * k]); }
    }
    const d = `M${pts.map(([px, py]) => `${f(px)} ${f(py)}`).join('L')}Z`; // straight, jagged segments: torn, not smooth
    const rot = range(rand, -30, 30);
    s += `<ellipse cx="${f(x + 4)}" cy="${f(y + 6)}" rx="${f(w)}" ry="${f(h * 0.8)}" fill="#0a0405" fill-opacity=".45"/>`;
    s += `<g transform="${T(x, y, rot)}"><defs><clipPath id="${id}"><path d="${d}"/></clipPath></defs><path d="${d}" fill="#E8D3A8" stroke="#8A6A3A" stroke-width="1.4" stroke-linejoin="round"/><g clip-path="url(#${id})">`;
    s += `<ellipse cx="${f(range(rand, -w * 0.3, w * 0.3))}" cy="${f(h * 0.75)}" rx="${f(w * 0.8)}" ry="${f(h * 0.7)}" fill="#BE7F34" fill-opacity=".95"/>`; // baked on the hot-rim side
    for (let j = 0; j < 3; j++) s += `<ellipse cx="${f(range(rand, -w * 0.7, w * 0.7))}" cy="${f(h * range(rand, 0.1, 0.6))}" rx="${f(range(rand, 3, 7))}" ry="${f(range(rand, 2, 4))}" fill="#9A5F22" fill-opacity=".55"/>`;
    s += `<ellipse cx="${f(-w * 0.2)}" cy="${f(-h * 0.45)}" rx="${f(w * 0.55)}" ry="${f(h * 0.3)}" fill="#F8EACA" fill-opacity=".75"/>`;
    for (let j = 0; j < (strip ? 1 : 2); j++) { const dx = range(rand, -w * 0.4, w * 0.4); const dy = range(rand, -h * 0.2, h * 0.2);
      s += `<ellipse cx="${f(dx)}" cy="${f(dy)}" rx="${f(h * 0.4)}" ry="${f(h * 0.28)}" fill="#A8885A" fill-opacity=".55"/><path d="M${f(dx - h * 0.35)} ${f(dy + h * 0.22)}Q${f(dx)} ${f(dy + h * 0.45)} ${f(dx + h * 0.35)} ${f(dy + h * 0.22)}" fill="none" stroke="#FFF2D0" stroke-opacity=".7" stroke-width="1.1"/>`; }
    s += `</g></g>`;
  }
  return s;
}
