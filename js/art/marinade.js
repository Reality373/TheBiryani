// Art for chapter I, The Marinade: a close shot looking down on the counter at dusk (violet window, a warm lamp).
// Planes: c-wall, m-dim (the window's dusk, dimmed when the cloth goes on), c-surface, m-table (everything on the
// counter, with the hotspots), m-glow (the lamp's warmth on the objects), c-front.
// The wide steel bowl starts empty. Stations take turns on the counter above it (the chapter shows one at a time, so a
// phone can frame it): the curd bowl; paste, lemon half and oil; the spice tray, herbs, green chilli and fried onions;
// the board with four pieces of chicken and a knife. Also the steel spoon, a small lamp and a folded cloth. The chapter
// drives the layers (dollops, heaps, swirl, coat, raw pieces, coated pieces, drape) by opacity; see js/chapters/marinade.js.
// Ids: #m-curdHot #m-paste #m-lemon #m-oil #m-tray #m-herbs #m-greenchilli #m-birista #m-bp0..3 #m-stir (hit shape in
// the bowl) #m-spoon #m-cloth #m-drape; station groups #m-st-curd #m-st-wet #m-st-dry #m-st-chk.
import { close } from './close.js';
import * as F from './food.js';
import { plane, blob, rng, range, f, wobble, radial, linear, halftone } from './lib.js';

// World geometry shared with the chapter.
export const BOWL = { cx: 800, cy: 575, w: 340 };
export const IN = { cx: 800, cy: 580, rx: 150, ry: 64 }; // the inside of the mixing bowl where the food sits
export const POS = { curd: [668, 350], paste: [700, 365], lemon: [850, 385], oil: [965, 380], tray: [706, 345], birista: [936, 345], herbs: [770, 438], greenchilli: [905, 440], cloth: [958, 480], spoon: [888, 378] };
export const BP = [[684, 330, -12], [795, 322, 8], [908, 336, -6], [796, 398, 14]]; // the four pieces on the board: x, y, rotation
export const BOARD = { cx: 800, cy: 358, w: 420, h: 170 };
export const HEAPS = ['paste', 'lemon', 'oil', 'chilli', 'turmeric', 'salt', 'masala', 'coriander', 'cumin', 'herbs', 'greenchilli', 'birista'];
export const TRAY = ['chilli', 'turmeric', 'salt', 'masala', 'coriander', 'cumin']; // the measured powders, left to right
// Where each heap lands: a ring round the inside of the bowl, clear of the three dollops.
export const SLOT = Object.fromEntries(HEAPS.map((n, i) => { const a = (i / HEAPS.length) * 6.283 + 0.3; return [n, [Math.round(IN.cx + Math.cos(a) * 104), Math.round(IN.cy + Math.sin(a) * 44)]]; }));
export const DOLLOP = [[766, 561], [840, 576], [803, 546]];
export const SPOON_IN = [BOWL.cx + 8, BOWL.cy + 6]; // the spoon's bowl end when stirring starts (the chapter orbits it)

const K = {
  paste: { c: '#D8C47A', d: '#8E7A3A', h: '#F0E4A8' },
  chilli: { c: '#C82A16', d: '#6A1006', h: '#F2674A' },
  turmeric: { c: '#F2B212', d: '#A8660A', h: '#FFE466' },
  salt: { c: '#F4F0E6', d: '#A4AAC2', h: '#FFFFFF' },
  masala: { c: '#8A4A1E', d: '#4A230C', h: '#C98A4E' },
  coriander: { c: '#A89048', d: '#5E5020', h: '#D8C47A' },
  cumin: { c: '#7A5A30', d: '#3E2A12', h: '#B8926A' },
};
const INK = '#1A0C10';

// A small heap of powder or paste, centred (x, y): shade at the lower right, light from the upper left.
function mound(x, y, rx, ry, k, rand) {
  let s = `<ellipse cx="${f(x + rx * 0.1)}" cy="${f(y + ry * 0.45)}" rx="${f(rx * 1.2)}" ry="${f(ry * 0.6)}" fill="#0a0405" fill-opacity=".4"/>
<path d="${blob(x, y, rx, ry, 0.12, rand, 10)}" fill="${k.d}"/>
<path d="${blob(x - rx * 0.1, y - ry * 0.2, rx * 0.86, ry * 0.8, 0.12, rand, 10)}" fill="${k.c}"/>
<path d="${blob(x - rx * 0.18, y - ry * 0.34, rx * 0.6, ry * 0.5, 0.2, rand, 9)}" fill="${k.h}" fill-opacity=".38"/>
<path d="${blob(x - rx * 0.32, y - ry * 0.5, rx * 0.3, ry * 0.2, 0.2, rand, 8)}" fill="#fff" fill-opacity=".55"/>`;
  for (let i = 0; i < 12; i++) {
    const a = rand() * 6.283, r = Math.sqrt(rand());
    s += `<circle cx="${f(x + Math.cos(a) * r * rx * 1.05)}" cy="${f(y + Math.sin(a) * r * ry * 0.9)}" r="${f(range(rand, 0.7, 1.6))}" fill="${rand() < 0.5 ? k.h : k.d}" fill-opacity=".75"/>`;
  }
  return s;
}

// A raw (or, coated, orange) chicken piece centred (x, y): wet, irregular, a crease or two.
function piece(x, y, rx, ry, rot, rand, coated) {
  const g = coated ? 'mx-coat' : 'mx-raw', edge = coated ? '#4A1608' : '#6E3228';
  let s = `<g transform="rotate(${f(rot)} ${f(x)} ${f(y)})"><path d="${blob(x + 3, y + 5, rx, ry, 0.16, rand, 10)}" fill="#1a0a05" fill-opacity=".38"/>
<path d="${blob(x, y, rx, ry, 0.16, rand, 10)}" fill="url(#${g})" stroke="${edge}" stroke-width="1.6"/>`;
  s += `<path d="${wobble([[x - rx * 0.5, y - ry * 0.1], [x, y + ry * 0.25], [x + rx * 0.5, y - ry * 0.05]], 1.5, rand, false)}" fill="none" stroke="${edge}" stroke-opacity=".5" stroke-width="1.4" stroke-linecap="round"/>`;
  if (!coated) s += `<ellipse cx="${f(x + rx * 0.3)}" cy="${f(y + ry * 0.2)}" rx="${f(rx * 0.22)}" ry="${f(ry * 0.14)}" fill="#F8E6C8" fill-opacity=".8"/>`;
  s += `<ellipse cx="${f(x - rx * 0.3)}" cy="${f(y - ry * 0.4)}" rx="${f(rx * 0.36)}" ry="${f(ry * 0.14)}" fill="#fff" fill-opacity="${coated ? 0.7 : 0.6}"/></g>`;
  return s;
}

// One dollop of thick curd, bottom-centred on (x, y): cold white, blue-grey in the shade, a glossy peak.
function dollop(x, y, rand) {
  return `<ellipse cx="${f(x + 6)}" cy="${f(y + 4)}" rx="40" ry="17" fill="#1a0a05" fill-opacity=".4"/>
<path d="${blob(x, y - 9, 36, 17, 0.1, rand, 12)}" fill="url(#mx-dol)" stroke="#8C94B4" stroke-width="1.4"/>
<path d="${blob(x - 3, y - 20, 20, 10, 0.14, rand, 9)}" fill="url(#mx-dol)" stroke="#9AA2C0" stroke-width="1"/>
<path d="M${f(x - 7)} ${f(y - 28)}Q${f(x - 3)} ${f(y - 36)} ${f(x + 3)} ${f(y - 29)}Q${f(x - 1)} ${f(y - 26)} ${f(x - 7)} ${f(y - 28)}Z" fill="#fff"/>
<ellipse cx="${f(x - 14)}" cy="${f(y - 17)}" rx="11" ry="3.6" fill="#fff" fill-opacity=".95" transform="rotate(-14 ${f(x - 14)} ${f(y - 17)})"/>
<ellipse cx="${f(x + 12)}" cy="${f(y - 8)}" rx="5" ry="1.8" fill="#fff" fill-opacity=".7"/>`;
}

// A small steel dish (F.bowl) with a mound inside.
function dish(cx, cy, w, k, seed) {
  const rand = rng(seed);
  return `${F.bowl({ p: 'm', cx, cy, w, depth: 0.34, seed })}${mound(cx, cy + w * 0.02, w * 0.3, w * 0.17, k, rand)}`;
}

export default function art() {
  const back = close({ surface: 'counter', mood: 'dusk', pool: { x: 800, y: 520, rx: 380, ry: 170 } });
  const rand = rng(11);
  const [wall, surf] = back.planes;

  // ---- the window's dusk veil (dimmed by the chapter at the end) ----
  const dim = plane('m-dim', 0.09, `<rect x="-300" y="-200" width="2200" height="540" fill="#140A30" style="opacity:0;transition:opacity 3.2s ease-in-out" id="m-dimR"/>`);

  // ---- the raw chicken, in depth order ----
  const pcs = Array.from({ length: 9 }, (_, i) => {
    const a = (i / 9) * 6.283 + 0.5, r = i % 2 ? 0.78 : 0.4;
    return [IN.cx + Math.cos(a) * IN.rx * r * 0.72, IN.cy + Math.sin(a) * IN.ry * r * 0.7 - 2, range(rand, 24, 31), range(rand, 15, 19), range(rand, -35, 35)];
  }).sort((a, b) => a[1] - b[1]);
  const pr = rng(31), pc = rng(31); // same shapes raw and coated
  const raw = pcs.map(([x, y, rx, ry, rot]) => piece(x, y, rx, ry, rot, pr, false)).join('');
  const coated = pcs.map(([x, y, rx, ry, rot]) => piece(x, y, rx, ry, rot, pc, true)).join('');

  // ---- the layers inside the bowl ----
  const dr = rng(41);
  const dollops = DOLLOP.map(([x, y], i) => `<g class="m-dolW" data-i="${i}"><ellipse class="m-rip" cx="${x}" cy="${y - 4}" rx="30" ry="12" fill="none" stroke="#fff" stroke-width="3" opacity="0"/><g class="m-dol">${dollop(x, y, dr)}</g></g>`).join('');
  const hr = rng(51);
  const heapArt = (n, x, y) => {
    if (n === 'lemon') return `<ellipse cx="${x}" cy="${y}" rx="22" ry="8" fill="#F2DC6A" fill-opacity=".9" stroke="#B8962A" stroke-width="1.2"/><ellipse cx="${x - 7}" cy="${y - 2}" rx="8" ry="2.4" fill="#fff" fill-opacity=".85"/>`;
    if (n === 'oil') return `<ellipse cx="${x}" cy="${y}" rx="28" ry="10" fill="#E8A828" fill-opacity=".75" stroke="#A8660A" stroke-width="1"/><ellipse cx="${x - 9}" cy="${y - 3}" rx="10" ry="2.6" fill="#fff" fill-opacity=".8"/>`;
    if (n === 'herbs') return [0, 1, 2, 3].map((i) => F.mintLeaf({ p: 'm', x: x - 16 + i * 9, y: y + (i % 2) * 6 - 4, len: 22, rot: -50 + i * 38, seed: 3 + i })).join('');
    if (n === 'greenchilli') return F.spice('chilli', { p: 'm', x, y, rot: -12, s: 0.5 });
    if (n === 'birista') return F.biristaCluster({ p: 'm', x, y, w: 40, h: 14, n: 7, seed: 6 });
    return mound(x, y, n === 'salt' ? 20 : 23, 12, K[n] ?? K.paste, hr);
  };
  const heaps = HEAPS.map((n) => {
    const [x, y] = SLOT[n];
    return `<g class="m-heapW" data-n="${n}"><g class="m-heap">${heapArt(n, x, y)}</g></g>`;
  }).join('');
  // the swirl: arcs in the four colours on a flat disc, squashed by the bowl's view angle; the chapter rotates it
  const sw = rng(61), cols = ['#C82A16', '#F2B212', '#D8C47A', '#F4F0E6', '#E2681E'];
  let swirl = '';
  for (let i = 0; i < 12; i++) {
    const r = 18 + i * 10.5, a0 = range(sw, 0, 360), len = range(sw, 70, 170);
    const x0 = Math.cos((a0 * Math.PI) / 180) * r, y0 = Math.sin((a0 * Math.PI) / 180) * r;
    const x1 = Math.cos(((a0 + len) * Math.PI) / 180) * r, y1 = Math.sin(((a0 + len) * Math.PI) / 180) * r;
    swirl += `<path d="M${f(x0)} ${f(y0)}A${f(r)} ${f(r)} 0 ${len > 180 ? 1 : 0} 1 ${f(x1)} ${f(y1)}" fill="none" stroke="${cols[i % 5]}" stroke-width="${f(range(sw, 6, 11))}" stroke-linecap="round" stroke-opacity=".9"/>`;
  }
  const cr = rng(71);
  const gloss = Array.from({ length: 6 }, () => {
    const a = cr() * 6.283, r = 0.25 + cr() * 0.6;
    return `<ellipse cx="${f(IN.cx + Math.cos(a) * IN.rx * r)}" cy="${f(IN.cy + Math.sin(a) * IN.ry * r - 4)}" rx="${f(range(cr, 8, 15))}" ry="${f(range(cr, 2, 3.4))}" fill="#FFE8B8" fill-opacity=".75" transform="rotate(${f(range(cr, -20, 10))} ${f(IN.cx + Math.cos(a) * IN.rx * r)} ${f(IN.cy + Math.sin(a) * IN.ry * r - 4)})"/>`;
  }).join('');

  // ---- the mixing bowl and its contents ----
  const mixBowl = `<g id="m-mix">${F.bowl({ p: 'm', cx: BOWL.cx, cy: BOWL.cy, w: BOWL.w, depth: 0.45, seed: 3 })}
<clipPath id="m-clip"><ellipse cx="${IN.cx}" cy="${IN.cy - 2}" rx="${IN.rx}" ry="${IN.ry}"/></clipPath>
<g clip-path="url(#m-clip)">
 <g id="m-pool" style="opacity:0;transform-box:fill-box;transform-origin:50% 50%"><ellipse cx="${IN.cx}" cy="${IN.cy}" rx="${IN.rx * 0.92}" ry="${IN.ry * 0.9}" fill="url(#mx-pool)"/></g>
 <g id="m-dols">${dollops}</g>
 <g id="m-heaps">${heaps}</g>
 <g id="m-swirlW" style="opacity:0"><g transform="translate(${IN.cx} ${IN.cy}) scale(1 ${f(IN.ry / IN.rx)})"><g id="m-swirl">${swirl}</g></g></g>
 <g id="m-coat" style="opacity:0"><ellipse cx="${IN.cx}" cy="${IN.cy}" rx="${IN.rx}" ry="${IN.ry}" fill="url(#mx-coatpool)"/><ellipse cx="${IN.cx}" cy="${IN.cy}" rx="${IN.rx}" ry="${IN.ry}" fill="url(#mx-ht)"/></g>
 <g id="m-raw" style="opacity:0">${raw}</g>
 <g id="m-coated" style="opacity:0">${coated}${gloss}</g>
</g>
<path d="M${IN.cx - IN.rx} ${IN.cy}A${IN.rx} ${IN.ry} 0 0 0 ${IN.cx + IN.rx} ${IN.cy}" fill="none" stroke="#FFF8E0" stroke-opacity=".0"/>
</g>`;

  // ---- the curd bowl: a steel bowl, thick glossy curd (its level drops as it is poured) ----
  const [cx, cy] = POS.curd, cw = 134, crx = cw / 2, cry = crx * 0.45;
  const curdBowl = `<g id="m-curdHot"><g id="m-curdT">
<g id="m-curdB">${F.bowl({ p: 'm', cx, cy, w: cw, depth: 0.45, seed: 5 })}</g>
<g id="m-curdTop" style="transform-box:fill-box;transform-origin:50% 60%">
 <ellipse cx="${cx}" cy="${f(cy + cry * 0.14)}" rx="${f(crx * 0.8)}" ry="${f(cry * 0.74)}" fill="url(#m-curd)"/>
 <path d="M${f(cx - crx * 0.55)} ${f(cy + cry * 0.2)}Q${f(cx - crx * 0.2)} ${f(cy - cry * 0.45)} ${f(cx + crx * 0.25)} ${f(cy - cry * 0.1)}T${f(cx + crx * 0.55)} ${f(cy + cry * 0.3)}" fill="none" stroke="#fff" stroke-width="5" stroke-opacity=".75" stroke-linecap="round"/>
 <ellipse cx="${f(cx - crx * 0.3)}" cy="${f(cy - cry * 0.28)}" rx="${f(crx * 0.24)}" ry="${f(cry * 0.13)}" fill="#fff" fill-opacity=".9"/>
</g>
<ellipse class="hit" cx="${cx}" cy="${cy + 18}" rx="${crx + 24}" ry="${cry + 42}"/>
</g></g>`;

  // ---- the stations. Each source is a hotspot group: .m-src moves, .hit takes the touch ----
  const src = (id, inner, hit) => `<g id="m-${id}"><g class="m-src" style="transform-box:fill-box;transform-origin:50% 100%">${inner}</g><ellipse class="hit" cx="${hit[0]}" cy="${hit[1]}" rx="${hit[2]}" ry="${hit[3]}"/></g>`;
  const [px, py] = POS.paste;
  const pasteDish = src('paste', dish(px, py, 96, K.paste, 7), [px, py + 14, 62, 46]);
  const [lx, ly] = POS.lemon;
  const lemon = src('lemon', F.lemonWedge({ p: 'm', x: lx, y: ly, s: 1.3, rot: -8 }), [lx, ly - 10, 56, 44]);
  const [ox, oy] = POS.oil;
  const oil = src('oil', `<ellipse cx="${ox + 6}" cy="${oy + 56}" rx="34" ry="9" fill="#0a0405" fill-opacity=".5"/>
<path d="M${ox - 24} ${oy + 54}Q${ox - 30} ${oy + 10} ${ox - 10} ${oy - 4}L${ox - 10} ${oy - 22}L${ox + 10} ${oy - 22}L${ox + 10} ${oy - 4}Q${ox + 30} ${oy + 10} ${ox + 24} ${oy + 54}Q${ox} ${oy + 62} ${ox - 24} ${oy + 54}Z" fill="#C98A1C" fill-opacity=".92" stroke="${INK}" stroke-width="1.6"/>
<path d="M${ox - 20} ${oy + 30}Q${ox} ${oy + 22} ${ox + 20} ${oy + 30}L${ox + 22} ${oy + 52}Q${ox} ${oy + 58} ${ox - 22} ${oy + 52}Z" fill="#F2B232"/>
<rect x="${ox - 11}" y="${oy - 28}" width="22" height="9" rx="3" fill="#7A3E18" stroke="${INK}" stroke-width="1.2"/>
<path d="M${ox - 17} ${oy + 6}Q${ox - 22} ${oy + 30} ${ox - 17} ${oy + 48}" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"/>`, [ox, oy + 20, 44, 52]);
  // the spice tray: six small mounds in a brass tray, left to right chilli, turmeric, salt, masala, coriander, cumin
  const [tx, ty] = POS.tray, tr = rng(23);
  const tray = src('tray', `<ellipse cx="${tx + 6}" cy="${ty + 22}" rx="118" ry="28" fill="#0a0405" fill-opacity=".5"/>
<path d="${blob(tx, ty + 6, 110, 32, 0.03, tr, 14)}" fill="#8E5A20" stroke="${INK}" stroke-width="1.6"/>
<path d="${blob(tx, ty + 4, 101, 26, 0.03, tr, 14)}" fill="#C8923E"/>
<path d="M${tx - 94} ${ty - 6}Q${tx} ${ty - 22} ${tx + 94} ${ty - 6}" fill="none" stroke="#FFE4A8" stroke-width="2.4" stroke-opacity=".7" stroke-linecap="round"/>
${TRAY.map((n, i) => mound(tx - 75 + i * 30, ty + 6 + (i % 2) * 4, 15, 9, K[n], tr)).join('')}`, [tx, ty + 6, 120, 38]);
  const [bx, by] = POS.birista;
  const birista = src('birista', `${F.bowl({ p: 'm', cx: bx, cy: by, w: 124, depth: 0.4, seed: 9 })}${F.biristaCluster({ p: 'm', x: bx, y: by + 2, w: 70, h: 22, n: 12, seed: 5 })}`, [bx, by + 10, 76, 46]);
  const [hx, hy] = POS.herbs;
  const herbs = src('herbs', `${F.bowl({ p: 'm', cx: hx, cy: hy, w: 112, depth: 0.4, seed: 10 })}${[0, 1, 2, 3, 4].map((i) => F.mintLeaf({ p: 'm', x: hx - 26 + i * 12, y: hy - 6 + (i % 2) * 8, len: 30, rot: -60 + i * 35, seed: 11 + i })).join('')}`, [hx, hy + 8, 70, 40]);
  const [gx, gy] = POS.greenchilli;
  const greenchilli = src('greenchilli', F.spice('chilli', { p: 'm', x: gx, y: gy, rot: -8, s: 1.1 }), [gx, gy, 66, 34]);

  // ---- the board: four pieces of chicken, each with three gashes to show, and a knife ----
  const bd = rng(29), { cx: bcx, cy: bcy, w: bw, h: bh } = BOARD;
  const board = `<ellipse cx="${bcx + 8}" cy="${bcy + bh / 2 + 6}" rx="${bw / 2 + 10}" ry="22" fill="#0a0405" fill-opacity=".5"/>
<path d="${wobble([[bcx - bw / 2, bcy - bh / 2 + 8], [bcx, bcy - bh / 2], [bcx + bw / 2, bcy - bh / 2 + 8], [bcx + bw / 2 + 6, bcy + bh / 2 - 6], [bcx, bcy + bh / 2 + 6], [bcx - bw / 2 - 6, bcy + bh / 2 - 6]], 1.5, bd)}" fill="url(#mx-wood)" stroke="${INK}" stroke-width="2"/>
${Array.from({ length: 6 }, (_, i) => `<path d="M${bcx - bw / 2 + 12} ${bcy - bh / 2 + 22 + i * 30}Q${bcx} ${bcy - bh / 2 + 16 + i * 30 + range(bd, -6, 6)} ${bcx + bw / 2 - 12} ${bcy - bh / 2 + 22 + i * 30}" fill="none" stroke="#5A3418" stroke-opacity=".4" stroke-width="1.6"/>`).join('')}
<path d="M${bcx - bw / 2 + 10} ${bcy - bh / 2 + 10}Q${bcx} ${bcy - bh / 2 + 2} ${bcx + bw / 2 - 10} ${bcy - bh / 2 + 10}" fill="none" stroke="#FFE2B0" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>`;
  const bpr = rng(31);
  const bps = BP.map(([x, y, rot], i) => {
    const gashes = [-1, 0, 1].map((k) => `<path class="m-gash" d="M${x + k * 20 - 14} ${y - 20}L${x + k * 20 + 10} ${y + 22}" fill="none" stroke="#5A1A12" stroke-width="3.4" stroke-linecap="round" opacity="0"/><path class="m-gash" d="M${x + k * 20 - 12} ${y - 19}L${x + k * 20 + 6} ${y + 14}" fill="none" stroke="#F8C8B0" stroke-opacity=".6" stroke-width="1.2" stroke-linecap="round" opacity="0"/>`).join('');
    return `<g class="m-bp" id="m-bp${i}"><g class="m-src">${piece(x, y, 48, 30, rot, bpr, false)}${gashes}</g><ellipse class="hit" cx="${x}" cy="${y}" rx="56" ry="38"/></g>`;
  }).join('');
  const knife = `<g id="m-knife" style="opacity:0"><path d="M0 0L-96 -8L-100 6L0 12Z" fill="url(#m-steelH)" stroke="#232845" stroke-width="1.3"/><path d="M-6 3L-92 -3" stroke="#fff" stroke-opacity=".8" stroke-width="1.6" stroke-linecap="round"/><path d="M0 -1L52 -2Q58 3 52 9L0 12Z" fill="#6A3A1C" stroke="${INK}" stroke-width="1.4"/><circle cx="14" cy="5" r="1.8" fill="#D8B070"/><circle cx="34" cy="5" r="1.8" fill="#D8B070"/></g>`;

  // ---- the spoon: lying on the counter; the chapter moves it into the bowl ----
  const spoon = `<g id="m-spoon" style="transform:translate(${POS.spoon[0]}px,${POS.spoon[1]}px);transition:transform .8s cubic-bezier(.3,.9,.3,1)"><g class="m-spr" style="transform:rotate(8deg);transition:transform .8s cubic-bezier(.3,.9,.3,1)">${F.spoon({ p: 'm', x: 0, y: 0, len: 150, rot: 0, s: 1.25 })}</g></g>`;

  // ---- a small brass oil lamp at the back right: the warm light ----
  const lamp = `<g id="m-lamp" transform="translate(150 -10)"><ellipse cx="1002" cy="350" rx="34" ry="9" fill="#0a0405" fill-opacity=".5"/>
<path d="M972 336Q974 352 1002 354Q1030 352 1032 336Q1002 344 972 336Z" fill="#B8693A" stroke="${INK}" stroke-width="1.5"/>
<path d="M976 336Q1002 344 1028 336" fill="none" stroke="#FFD27A" stroke-width="2.4" stroke-opacity=".8"/>
<path d="M1030 337Q1042 334 1044 328" fill="none" stroke="#B8693A" stroke-width="5" stroke-linecap="round"/>
<path d="M1002 336Q990 318 1002 296Q1014 318 1002 336Z" fill="#FFB52E"/><path d="M1002 333Q996 320 1002 306Q1008 320 1002 333Z" fill="#FFF1B8"/></g>`;

  // ---- the cloth: a folded cotton kitchen towel (a drag target), and the drape over the bowl once it is on.
  // Both carry the madder-and-cream check (mx-check). Three layers are the thirds of the fold; the fringe hangs off the front edge.
  const cl = rng(81), [clx, cly] = POS.cloth;
  const sagPath = (y, w, sag) => wobble([[clx - w / 2, y], [clx, y - 2], [clx + w / 2, y], [clx + w / 2 + 2, y + 14], [clx, y + 14 + sag], [clx - w / 2 - 2, y + 14]], 1.2, cl);
  const fringe = (y, w) => Array.from({ length: 9 }, (_, i) => {
    const x = clx - w / 2 + 4 + (i * (w - 8)) / 8;
    return `<path d="M${f(x)} ${f(y)}l${f(range(cl, -1, 1))} ${f(range(cl, 6, 8))}" stroke="#F6EBD3" stroke-width="1.6" stroke-linecap="round"/>`;
  }).join('');
  const towelLayer = (y, w, lit) => `<path d="${sagPath(y, w, 4)}" fill="url(#mx-check)" stroke="${INK}" stroke-width="1.4"/>`
    + `<path d="M${f(clx - w / 2 + 4)} ${f(y + 1.5)}Q${f(clx)} ${f(y - 1.2)} ${f(clx + w / 2 - 4)} ${f(y + 1.5)}" fill="none" stroke="#fff" stroke-opacity="${lit ? 0.75 : 0.45}" stroke-width="1.8" stroke-linecap="round"/>`
    + `<path d="M${f(clx - w / 2 + 6)} ${f(y + 13)}Q${f(clx)} ${f(y + 17)} ${f(clx + w / 2 - 6)} ${f(y + 13)}" fill="none" stroke="#3A1C10" stroke-opacity=".35" stroke-width="1.4"/>`;
  const cloth = `<g id="m-cloth"><g id="m-clothT"><ellipse cx="${clx + 5}" cy="${cly + 24}" rx="62" ry="12" fill="#0a0405" fill-opacity=".5"/>
${fringe(cly + 22, 104)}${towelLayer(cly + 6, 104, false)}${towelLayer(cly - 4, 98, true)}${towelLayer(cly - 14, 90, false)}</g>
<ellipse class="hit" cx="${clx}" cy="${cly + 4}" rx="54" ry="44"/></g>`;
  const drape = `<g id="m-drape" style="opacity:0;transform-box:fill-box;transform-origin:50% 60%;transform:scale(.92);transition:opacity .7s,transform .8s cubic-bezier(.3,.9,.3,1)">
<path d="${blob(BOWL.cx + 4, BOWL.cy + 12, 192, 98, 0.05, cl, 16)}" fill="#0a0405" fill-opacity=".4"/>
<path d="${wobble([[BOWL.cx - 188, BOWL.cy + 16], [BOWL.cx - 176, BOWL.cy - 40], [BOWL.cx - 80, BOWL.cy - 82], [BOWL.cx + 40, BOWL.cy - 88], [BOWL.cx + 150, BOWL.cy - 56], [BOWL.cx + 196, BOWL.cy + 10], [BOWL.cx + 170, BOWL.cy + 72], [BOWL.cx + 80, BOWL.cy + 98], [BOWL.cx - 40, BOWL.cy + 104], [BOWL.cx - 150, BOWL.cy + 78]], 3, cl)}" fill="url(#mx-check)" stroke="${INK}" stroke-width="2"/>`
    + `<path d="M${BOWL.cx - 152} ${BOWL.cy + 76}Q${BOWL.cx - 30} ${BOWL.cy + 126} ${BOWL.cx + 168} ${BOWL.cy + 70}" fill="none" stroke="#F6EBD3" stroke-width="3" stroke-dasharray="4 3" stroke-opacity=".85"/>`
    + `<path d="${blob(BOWL.cx + 40, BOWL.cy + 40, 150, 60, 0.05, cl, 14)}" fill="#3A1C10" fill-opacity=".22"/>`
    + `<path d="M${BOWL.cx - 130} ${BOWL.cy - 40}Q${BOWL.cx - 20} ${BOWL.cy - 84} ${BOWL.cx + 100} ${BOWL.cy - 60}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="5" stroke-linecap="round"/>
<path d="M${BOWL.cx - 160} ${BOWL.cy + 40}Q${BOWL.cx - 60} ${BOWL.cy + 30} ${BOWL.cx - 20} ${BOWL.cy + 70}M${BOWL.cx + 60} ${BOWL.cy + 20}Q${BOWL.cx + 120} ${BOWL.cy + 30} ${BOWL.cx + 150} ${BOWL.cy + 60}" fill="none" stroke="#8A6E4A" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/></g>`;

  // ---- pour stream and dust clouds (the chapter animates these) ----
  const dr2 = rng(91);
  const dust = Object.keys(SLOT).map((n) => {
    const [x, y] = SLOT[n];
    const bits = Array.from({ length: 8 }, () => `<circle class="m-d" cx="${f(x + range(dr2, -10, 10))}" cy="${f(y + range(dr2, -8, 4))}" r="${f(range(dr2, 5, 11))}" fill="${(K[n] ?? { c: '#E8C860' }).c}" opacity="0" data-dx="${f(range(dr2, -42, 42))}" data-dy="${f(range(dr2, -46, -8))}"/>`).join('');
    return `<g id="m-dust-${n}">${bits}</g>`;
  }).join('');
  const stream = `<g id="m-stream" opacity="0"><path id="m-streamP" d="M0 0L0 0" fill="none" stroke="#DCE0EE" stroke-width="13" stroke-linecap="round"/><path id="m-streamH" d="M0 0L0 0" fill="none" stroke="#fff" stroke-width="4" stroke-linecap="round"/></g>`;

  const defs = `${F.foodDefs('m')}<defs>
${radial('mx-dol', [[0, '#FFFFFF'], [0.55, '#F6F0E2'], [1, '#B8C0DA']], { cx: 0.36, cy: 0.3, r: 0.85 })}
${radial('mx-pool', [[0, '#FFFBF0'], [0.7, '#F3EBDC'], [1, '#C8CEE0']], { cx: 0.42, cy: 0.38, r: 0.75 })}
${linear('mx-wood', [[0, '#C8924E'], [0.5, '#A8703A'], [1, '#7E4E24']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${linear('mx-raw', [[0, '#F7D6C0'], [0.5, '#E0A088'], [1, '#B26A58']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${linear('mx-coat', [[0, '#FFB24C'], [0.45, '#E4681E'], [1, '#8C2A10']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${radial('mx-coatpool', [[0, '#F8A84A'], [0.55, '#E4701E'], [1, '#B0401A']], { cx: 0.4, cy: 0.35, r: 0.8 })}
<pattern id="mx-check" patternUnits="userSpaceOnUse" width="18" height="18"><rect width="18" height="18" fill="#F6EBD3"/><rect width="9" height="18" fill="#A33B2C" fill-opacity=".42"/><rect width="18" height="9" fill="#A33B2C" fill-opacity=".42"/><rect x="4" width="1.2" height="18" fill="#6A1E12" fill-opacity=".5"/><rect y="4" width="18" height="1.2" fill="#6A1E12" fill-opacity=".5"/></pattern>
${halftone('mx-ht', '#5A1A08', { size: 7, r: 1.2, angle: 30, opacity: 0.35 })}</defs>`;

  const css = `<style>
#m-table .hit{fill:transparent}
#m-table .m-st{transition:opacity .5s}
#m-table .m-dolW .m-dol,#m-table .m-heapW .m-heap{opacity:0;transform-box:fill-box;transform-origin:50% 100%}
#m-table .m-dolW .m-dol.on{animation:m-plop .62s cubic-bezier(.3,.8,.4,1) forwards}
#m-table .m-heapW .m-heap.on{animation:m-land .7s cubic-bezier(.2,.9,.3,1) forwards}
@keyframes m-plop{0%{opacity:0;transform:translateY(-70px) scale(.7,1.4)}40%{opacity:1;transform:translateY(0) scale(1.3,.6)}68%{transform:scale(.93,1.12)}100%{opacity:1;transform:none}}
@keyframes m-land{0%{opacity:0;transform:translateY(-36px) scale(.5)}55%{opacity:1;transform:translateY(2px) scale(1.18,.78)}100%{opacity:1;transform:none}}
</style>`;

  const st = (id, inner, shown = false) => `<g class="m-st" id="m-st-${id}" style="${shown ? '' : 'display:none;opacity:0'}">${inner}</g>`;
  const table = plane('m-table', 0.5, `${defs}${css}
${lamp}
${mixBowl}<g id="m-stir"><ellipse class="hit" cx="${IN.cx}" cy="${IN.cy - 2}" rx="${IN.rx + 8}" ry="${IN.ry + 14}"/></g>
${st('curd', curdBowl, true)}${st('wet', pasteDish + lemon + oil)}${st('dry', tray + birista + herbs + greenchilli)}${st('chk', board + bps + knife)}
${spoon}${stream}<g id="m-clothW" style="display:none">${cloth}</g>${drape}<g id="m-dust">${dust}</g>`,
  { label: 'A steel mixing bowl on the counter, with curd, paste, lemon, oil, spices, herbs, fried onions, chicken, a spoon and a cloth' });

  // the lamp's light on the things near it, and a cooler window light from the upper right
  const glow = plane('m-glow', 0.52, `<defs>${radial('mx-lamp', [[0, '#FFD27A', 0.55], [0.4, '#F2A516', 0.22], [1, '#B8693A', 0]])}</defs>
<ellipse cx="1152" cy="330" rx="360" ry="230" fill="url(#mx-lamp)" style="mix-blend-mode:screen"/>`);

  return { planes: [wall, dim, surf, table, glow, back.front] };
}
