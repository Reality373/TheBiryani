// Art for chapter I, The Spices: a close shot of the counter at dusk. On the left a steel masala dabba (seven little
// bowls) over the tray "for the marinade"; in the middle the measuring spoons and a small lamp; on the right six
// spice jars over the tray "for the rice water". The chapter drives the piles, pods and counters; see
// js/chapters/spices.js. (js/art/spices.js is the icon set and is a different file.)
// Ids: #sp-b-<powder> (dabba bowls, hit shapes), #sp-j-<whole> (jars), #sp-spoon-<powder>, .sp-pile[data-id],
// #sp-dust-<powder>, .sp-it[data-id][data-i] (whole spices on tray 2), #sp-cnt-cardamom / #sp-cnt-clove.
import { close } from './close.js';
import * as F from './food.js';
import { plane, blob, rng, range, f, wobble, radial, linear } from './lib.js';
import { ingredients } from '../data/cookbook.js';

export const POWDERS = ['chilli', 'turmeric', 'salt', 'masala', 'coriander', 'cumin'];
export const WHOLE = ['cardamom', 'clove', 'bayleaf', 'cinnamon', 'shahijeera', 'mace'];
export const COUNT = { cardamom: 4, clove: 4 }; // tap this many times

// Amount strings from cookbook.js -> teaspoons (a pile and its spoon are sized by this).
const FR = { '½': 0.5, '¼': 0.25, '¾': 0.75 };
export function tsp(amount) {
  const vals = amount.split(' to ').map((t) => { const m = t.trim().match(/(\d+)?\s*([½¼¾])?/); return (m[1] ? +m[1] : 0) + (FR[m[2]] || 0); });
  return (vals.reduce((a, b) => a + b, 0) / vals.length) * (/tbsp/.test(amount) ? 3 : 1);
}
export const AMOUNT = Object.fromEntries(ingredients.marinade.concat(ingredients.rice).map((i) => [i.id, i.amount]));
export const pileR = (t) => 10 + 10 * Math.sqrt(t);

// Phones show only x 570..1030 and the camera cannot pan sideways at scale 1, so both groups are centred on x 800:
// the powders group (#sp-gA) and the whole-spices group (#sp-gB) take turns, sliding across (the chapter moves them).
export const SLIDE = 1000;
export const DAB = [800, 382];
const bo = (x, y) => [DAB[0] + x, DAB[1] + y];
export const BOWL = { masala: bo(0, 2), chilli: bo(-120, 2), turmeric: bo(-60, -41), coriander: bo(60, -41), cumin: bo(120, 2), salt: bo(60, 43), pepper: bo(-60, 43) };
export const TRAY1 = { c: [775, 592], w: 330, h: 142 };
export const PILE = Object.fromEntries(Object.entries({ chilli: [-100, -34], turmeric: [0, -36], salt: [100, -34], masala: [-92, 24], coriander: [0, 26], cumin: [96, 24] }).map(([k, [x, y]]) => [k, [TRAY1.c[0] + x, TRAY1.c[1] + y]]));
export const TRAY2 = { c: [800, 585], w: 370, h: 140 };
const t2 = (x, y) => [TRAY2.c[0] + x, TRAY2.c[1] + y];
export const JAR = { cardamom: [695, 372], clove: [800, 372], bayleaf: [905, 372], cinnamon: [695, 482], shahijeera: [800, 482], mace: [905, 482] };
// where each whole spice lands on tray 2: a list of slots [x, y, rot] (several for the counted ones)
export const SLOT = {
  cardamom: [-140, -108, -76, -44].map((x, i) => [...t2(x, -36), [-20, 25, -8, 40][i]]),
  clove: [14, 46, 78, 110].map((x, i) => [...t2(x, -36), [-12, 12, -4, 18][i]]),
  bayleaf: [[...t2(-105, 34), -8]], cinnamon: [[...t2(-8, 42), 4]], shahijeera: [[...t2(70, 32), 0]], mace: [[...t2(124, 42), 14]],
};
export const SPOON_S = Object.fromEntries(POWDERS.map((id) => [id, +(0.65 + 0.2 * Math.sqrt(tsp(AMOUNT[id]))).toFixed(2)]));
const RX0 = 19, RY0 = 12; // the carrying spoon's bowl
const SLIDE_CSS = 'transition:transform 1.1s cubic-bezier(.5,0,.2,1);';

const K = {
  chilli: { c: '#C82A16', d: '#6A1006', h: '#F2674A' },
  turmeric: { c: '#F2B212', d: '#A8660A', h: '#FFE466' },
  salt: { c: '#F4F0E6', d: '#A4AAC2', h: '#FFFFFF' },
  masala: { c: '#9A4E22', d: '#4A2210', h: '#D9965A' },
  coriander: { c: '#B9A25A', d: '#6E5A28', h: '#E6D794' },
  cumin: { c: '#8E6A3A', d: '#4A3218', h: '#CFA46C' },
  pepper: { c: '#5A4A40', d: '#2A2018', h: '#9A8878' },
};
const INK = '#1A0C10';
const SERIF = 'font-family="Fraunces, Literata, Georgia, serif" font-style="italic"';
const LBL = `fill="#F6EBD3" stroke="#14162A" stroke-width="3" paint-order="stroke" ${SERIF} font-size="13"`;

function mound(x, y, rx, ry, k, rand) {
  let s = `<ellipse cx="${f(x + rx * 0.1)}" cy="${f(y + ry * 0.45)}" rx="${f(rx * 1.2)}" ry="${f(ry * 0.6)}" fill="#0a0405" fill-opacity=".4"/>
<path d="${blob(x, y, rx, ry, 0.12, rand, 10)}" fill="${k.d}"/>
<path d="${blob(x - rx * 0.1, y - ry * 0.2, rx * 0.86, ry * 0.8, 0.12, rand, 10)}" fill="${k.c}"/>
<path d="${blob(x - rx * 0.18, y - ry * 0.34, rx * 0.6, ry * 0.5, 0.2, rand, 9)}" fill="${k.h}" fill-opacity=".38"/>
<path d="${blob(x - rx * 0.32, y - ry * 0.5, rx * 0.3, ry * 0.2, 0.2, rand, 8)}" fill="#fff" fill-opacity=".5"/>`;
  for (let i = 0; i < 10; i++) {
    const a = rand() * 6.283, r = Math.sqrt(rand());
    s += `<circle cx="${f(x + Math.cos(a) * r * rx * 1.05)}" cy="${f(y + Math.sin(a) * r * ry * 0.9)}" r="${f(range(rand, 0.7, 1.5))}" fill="${rand() < 0.5 ? k.h : k.d}" fill-opacity=".75"/>`;
  }
  return s;
}

// A steel tray seen from above at an angle: a squarish rounded outline, a rim, a floor, a shadow.
function tray({ c: [cx, cy], w, h }, seed) {
  const r = rng(seed);
  const sq = (ox, oy, ww, hh) => wobble(Array.from({ length: 28 }, (_, i) => {
    const a = (2 * Math.PI * i) / 28, co = Math.cos(a), si = Math.sin(a);
    return [ox + (ww / 2) * Math.sign(co) * Math.abs(co) ** 0.35, oy + (hh / 2) * Math.sign(si) * Math.abs(si) ** 0.35];
  }), 0.8, r);
  return `<ellipse cx="${cx + 10}" cy="${cy + 26}" rx="${w / 2 + 24}" ry="${h / 2 + 10}" fill="#0a0405" fill-opacity=".5"/>
<path d="${sq(cx, cy + 14, w, h)}" fill="#2A2C40" stroke="#151828" stroke-width="1.5"/>
<path d="${sq(cx, cy, w, h)}" fill="url(#sp-steel)" stroke="#232845" stroke-width="1.5"/>
<path d="${sq(cx, cy + 3, w - 30, h - 26)}" fill="url(#sp-steelIn)" stroke="#232845" stroke-opacity=".6" stroke-width="1.2"/>
<path d="${sq(cx, cy + 6, w - 60, h - 54)}" fill="#1B1D2E" fill-opacity=".25"/>
<path d="M${cx - w / 2 + 22} ${cy - h / 2 + 14}Q${cx - w / 4} ${cy - h / 2 + 2} ${cx + w / 6} ${cy - h / 2 + 3}" fill="none" stroke="#FFF8E0" stroke-width="3" stroke-linecap="round"/>
<path d="M${cx - w / 2 + 6} ${cy + h / 6}Q${cx - w / 2 + 6} ${cy - h / 6} ${cx - w / 2 + 14} ${cy - h / 3}" fill="none" stroke="#FFF8E0" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>
<path d="M${cx - w / 3} ${cy + h / 2 - 3}Q${cx} ${cy + h / 2 + 2} ${cx + w / 3} ${cy + h / 2 - 4}" fill="none" stroke="#FFD890" stroke-opacity=".7" stroke-width="2.4" stroke-linecap="round"/>`;
}

// A hand-lettered paper tag lying in front of a tray, tied with a string.
function tag(x, y, text, rot, seed) {
  const r = rng(seed);
  return `<g transform="rotate(${rot} ${x} ${y})"><path d="M${x - 40} ${y - 14}Q${x - 70} ${y - 6} ${x - 90} ${y - 12}" fill="none" stroke="#B8693A" stroke-width="1.6" stroke-linecap="round"/>
<path d="M${x - 62} ${y + 15}L${x + 66} ${y + 15}L${x + 66} ${y - 12}L${x - 62} ${y - 12}Z" fill="#0a0405" fill-opacity=".4" transform="translate(3 4)"/>
<path d="${wobble([[x - 66, y - 14], [x + 50, y - 15], [x + 68, y], [x + 50, y + 15], [x - 66, y + 14]], 1.1, r)}" fill="#F2E3BC" stroke="#6A4A20" stroke-width="1.3"/>
<path d="M${x - 60} ${y - 10}L${x + 46} ${y - 11}" stroke="#fff" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>
<circle cx="${x + 54}" cy="${y}" r="3" fill="#2A1A10"/><circle cx="${x + 53}" cy="${y - 1}" r="1.2" fill="#8A6A3A"/>
<text x="${x - 8}" y="${y + 5}" text-anchor="middle" font-size="15" ${SERIF} fill="#3A1C10">${text}</text></g>`;
}

// A measuring spoon, bowl centred at the origin, handle to the right. label engraved on the handle.
function mspoon({ rx, ry, len, label, heap }) {
  return `<ellipse cx="${rx * 0.2}" cy="${ry * 0.9}" rx="${rx * 1.25}" ry="${ry * 0.8}" fill="#0a0405" fill-opacity=".45"/>
<path d="M${rx * 0.9} -2.2L${len} -3.2Q${len + 8} 0 ${len} 3.2L${rx * 0.9} 2.6Z" fill="url(#sp-steelH)" stroke="#2A3050" stroke-width="1"/>
<path d="M${rx + 4} -1.2L${len - 6} -2" stroke="#FFF4D8" stroke-width="1.2" stroke-linecap="round"/>
<circle cx="${len - 2}" cy="0" r="1.6" fill="#232845"/>
<ellipse rx="${rx}" ry="${ry}" fill="url(#sp-steel)" stroke="#2A3050" stroke-width="1.4"/>
<ellipse cx="1" cy="1" rx="${rx * 0.82}" ry="${ry * 0.78}" fill="url(#sp-steelIn)"/>${heap ?? ''}
<path d="M${-rx * 0.9} ${-ry * 0.3}A${rx} ${ry} 0 0 1 ${-rx * 0.4} ${-ry * 0.95}" fill="none" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/>
${label ? `<text x="${rx + (len - rx) / 2 + 2}" y="-5" text-anchor="middle" font-size="9" font-family="Literata, Georgia, serif" fill="#2A3050" fill-opacity=".8">${label}</text>` : ''}`;
}

// ---- the whole spices, drawn at the origin ----
function bark(s = 1, shadow = true) { // cassia: thick, dark, rough, one scroll
  const r = rng(5);
  let g = `${shadow ? '<ellipse cx="3" cy="6" rx="48" ry="12" fill="#0a0405" fill-opacity=".45"/>' : ''}
<path d="${wobble([[-45, -10], [-20, -13], [20, -12], [44, -9], [45, 10], [20, 13], [-20, 12], [-44, 10]], 1.6, r)}" fill="#7E421C" stroke="#341606" stroke-width="1.3"/>
<path d="${wobble([[-44, -9], [-18, -12], [20, -11], [43, -8], [43, -2], [18, -4], [-20, -4], [-44, -3]], 1.2, r)}" fill="#B8743A" fill-opacity=".85"/>
<path d="${wobble([[-44, 3], [-18, 4], [20, 5], [43, 3], [44, 10], [20, 12], [-20, 11], [-44, 9]], 1.2, r)}" fill="#3E1A08" fill-opacity=".55"/>`;
  for (let i = 0; i < 6; i++) g += `<path d="${wobble([[-40 + range(r, 0, 10), -8 + i * 3.2], [0, -8.5 + i * 3.3], [38 - range(r, 0, 10), -8 + i * 3.2]], 1.2, r, false)}" fill="none" stroke="#3A1A08" stroke-opacity=".55" stroke-width="${f(range(r, 0.6, 1.3))}" stroke-linecap="round"/>`;
  for (let i = 0; i < 9; i++) g += `<circle cx="${f(range(r, -40, 40))}" cy="${f(range(r, -9, 9))}" r="${f(range(r, 0.6, 1.4))}" fill="${r() < 0.5 ? '#D49458' : '#2A1206'}" fill-opacity=".6"/>`;
  g += `<ellipse cx="45" cy="0" rx="6.5" ry="11.5" fill="#6A3414" stroke="#2A1206" stroke-width="1.2"/><path d="M45-7A4.5 5 0 1 1 44 3.5Q43 0 47 -2" fill="none" stroke="#C98A55" stroke-width="1.3" stroke-linecap="round"/><ellipse cx="-45" cy="0" rx="3" ry="10" fill="#5A2A10" fill-opacity=".7"/>`;
  return `<g transform="scale(${s})">${g}</g>`;
}
function mace(s = 1, shadow = true) { // a lacy orange-red blade fanning out from a narrow base
  const fingers = [[44, -26], [52, -14], [56, 0], [52, 14], [44, 26]];
  let g = shadow ? '<ellipse cx="24" cy="6" rx="34" ry="22" fill="#0a0405" fill-opacity=".4"/>' : '';
  for (const [x, y] of fingers) g += `<path d="M2 0Q${x * 0.5} ${y * 0.2} ${x} ${y}" fill="none" stroke="#9A2E10" stroke-width="7" stroke-linecap="round"/>`;
  for (const [x, y] of fingers) g += `<path d="M2 0Q${x * 0.5} ${y * 0.2} ${x} ${y}" fill="none" stroke="#D9531E" stroke-width="5" stroke-linecap="round"/>`;
  for (const [x, y] of fingers) g += `<path d="M4 -1Q${x * 0.5} ${y * 0.2 - 1} ${x - 2} ${y - 1}" fill="none" stroke="#F4A050" stroke-width="1.6" stroke-linecap="round" stroke-opacity=".85"/>`;
  g += `<path d="M24 -12Q30 -4 26 8M36 -8Q42 0 38 10" fill="none" stroke="#C8441A" stroke-width="3" stroke-linecap="round"/><path d="${blob(2, 0, 9, 7, 0.1, rng(3), 8)}" fill="#B0380F" stroke="#5A1A06" stroke-width="1"/>`;
  return `<g transform="translate(${-26 * s} 0) scale(${s})">${g}</g>`;
}
function seeds(n, spread, seed) { // shahi jeera: thin dark crescents in a heap
  const r = rng(seed);
  let g = `<ellipse cx="3" cy="6" rx="${spread + 8}" ry="${spread * 0.6}" fill="#0a0405" fill-opacity=".4"/><path d="${blob(0, 0, spread, spread * 0.55, 0.1, r, 9)}" fill="#2A1A0E"/>`;
  for (let i = 0; i < n; i++) {
    const a = r() * 6.283, d = Math.sqrt(r()) * spread * 0.85, x = Math.cos(a) * d, y = Math.sin(a) * d * 0.5, rot = range(r, 0, 180);
    g += `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(rot)})"><path d="M-4 0Q0 -3.4 4 0" fill="none" stroke="#1A0E06" stroke-width="2.4" stroke-linecap="round"/><path d="M-3 -.6Q0 -3 3 -.6" fill="none" stroke="#A8845A" stroke-width=".8" stroke-linecap="round"/></g>`;
  }
  return g;
}
const wholeArt = (id) => ({
  cardamom: () => F.spice('cardamom', { p: 'sp', x: 0, y: 0, rot: 0, s: 1.25 }),
  clove: () => F.spice('clove', { p: 'sp', x: 0, y: 0, rot: 0, s: 1.1 }),
  bayleaf: () => F.spice('bay', { p: 'sp', x: 0, y: 0, rot: 0, s: 0.85 }),
  cinnamon: () => bark(1),
  shahijeera: () => seeds(18, 20, 9),
  mace: () => mace(1),
}[id])();

// A glass jar with a steel lid and a paper label; its contents show through. (x, y) is the base centre.
function jar(id, x, y, name, seed) {
  const r = rng(seed), W = 84, H = 76;
  const body = `M${x - W / 2} ${y - H + 8}Q${x - W / 2 - 2} ${y - H + 2} ${x - W / 2 + 8} ${y - H + 2}L${x + W / 2 - 8} ${y - H + 2}Q${x + W / 2 + 2} ${y - H + 2} ${x + W / 2} ${y - H + 8}L${x + W / 2} ${y - 10}Q${x + W / 2} ${y + 2} ${x + W / 2 - 12} ${y + 2}L${x - W / 2 + 12} ${y + 2}Q${x - W / 2} ${y + 2} ${x - W / 2} ${y - 10}Z`;
  const top = y - H + 20, fill = H - 30;
  let inside = '';
  const at = (n, fn) => { for (let i = 0; i < n; i++) inside += fn(i); };
  if (id === 'cardamom') { inside += `<rect x="${x - W / 2}" y="${top + 10}" width="${W}" height="${fill}" fill="#6E8A3C" fill-opacity=".5"/>`; at(11, (i) => F.spice('cardamom', { p: 'sp', x: x - 30 + (i % 4) * 20 + range(r, -4, 4), y: top + 8 + Math.floor(i / 4) * 14 + range(r, -2, 2), rot: range(r, -60, 60), s: 0.8 })); }
  if (id === 'clove') { inside += `<rect x="${x - W / 2}" y="${top + 8}" width="${W}" height="${fill + 2}" fill="#4A2410" fill-opacity=".6"/>`; at(14, (i) => F.spice('clove', { p: 'sp', x: x - 28 + (i % 4) * 19 + range(r, -4, 4), y: top + 6 + Math.floor(i / 4) * 12 + range(r, -2, 2), rot: range(r, -70, 70), s: 0.75 })); }
  if (id === 'bayleaf') { inside += `<rect x="${x - W / 2}" y="${top - 8}" width="${W}" height="${fill + 10}" fill="#6A6E2E" fill-opacity=".35"/>`; at(4, (i) => F.spice('bay', { p: 'sp', x: x - 6 + range(r, -8, 8), y: top + 4 + i * 11, rot: [-14, 8, -4, 12][i], s: 0.5 })); }
  if (id === 'cinnamon') { inside += `<rect x="${x - W / 2}" y="${top + 14}" width="${W}" height="${fill - 4}" fill="#5A2A10" fill-opacity=".45"/>`; at(5, (i) => `<g transform="translate(${f(x - 4)} ${f(top + 10 + i * 10)}) rotate(${[-8, 6, -3, 9, -5][i]})">${bark(0.5, false)}</g>`); }
  if (id === 'shahijeera') { inside += `<rect x="${x - W / 2}" y="${top + 6}" width="${W}" height="${fill + 4}" fill="#241608" fill-opacity=".85"/>`; at(30, () => `<path d="M${f(x + range(r, -34, 30))} ${f(top + range(r, 8, fill + 8))}q2 -2.6 4.6 0" fill="none" stroke="${r() < 0.3 ? '#8A6A44' : '#4A3420'}" stroke-width="1.8" stroke-linecap="round"/>`); }
  if (id === 'mace') { inside += `<rect x="${x - W / 2}" y="${top + 12}" width="${W}" height="${fill - 2}" fill="#9A2E10" fill-opacity=".35"/>`; at(4, (i) => `<g transform="translate(${f(x - 20 + (i % 2) * 14 + range(r, -4, 4))} ${f(top + 14 + i * 8)}) rotate(${[-14, 8, -5, 16][i]})">${mace(0.6, false)}</g>`); }
  const cid = `sp-jc-${id}`;
  return `<g id="sp-j-${id}"><g class="sp-jb" style="transform-box:fill-box;transform-origin:50% 100%">
<ellipse cx="${x + 8}" cy="${y + 4}" rx="${W / 2 + 14}" ry="12" fill="#0a0405" fill-opacity=".5"/>
<clipPath id="${cid}"><path d="${body}"/></clipPath>
<path d="${body}" fill="#141828"/>
<g clip-path="url(#${cid})">${inside}</g>
<path d="${body}" fill="url(#sp-glass)" stroke="#8A98C8" stroke-opacity=".7" stroke-width="1.6"/>
<path d="M${x - W / 2 + 7} ${y - H + 14}L${x - W / 2 + 7} ${y - 16}" stroke="#fff" stroke-opacity=".7" stroke-width="3.4" stroke-linecap="round"/>
<path d="M${x + W / 2 - 8} ${y - H + 24}L${x + W / 2 - 8} ${y - 26}" stroke="#9DB4F0" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>
<path d="${wobble([[x - 31, y - 44], [x + 30, y - 45], [x + 31, y - 18], [x - 30, y - 17]], 0.9, r)}" fill="#F2E3BC" stroke="#6A4A20" stroke-width="1.1"/>
<text x="${x}" y="${y - 27}" text-anchor="middle" font-size="${name.length > 7 ? 11 : 13}" ${SERIF} fill="#3A1C10">${name}</text>
<path d="M${x - W / 2 - 1} ${y - H + 4}L${x - W / 2 - 1} ${y - H - 10}Q${x} ${y - H - 14} ${x + W / 2 + 1} ${y - H - 10}L${x + W / 2 + 1} ${y - H + 4}Z" fill="url(#sp-steelH)" stroke="#232845" stroke-width="1.3"/>
<ellipse cx="${x}" cy="${y - H - 10}" rx="${W / 2 + 1}" ry="4" fill="url(#sp-steel)" stroke="#232845" stroke-width="1.2"/>
<path d="M${x - W / 2 + 4} ${y - H - 6}L${x - W / 2 + 4} ${y - H + 2}" stroke="#fff" stroke-width="2.4" stroke-linecap="round"/></g>
<rect class="hit" x="${x - W / 2 - 6}" y="${y - H - 16}" width="${W + 12}" height="${H + 22}" rx="10"/></g>`;
}

export default function art() {
  const back = close({ surface: 'counter', mood: 'dusk', pool: { x: 700, y: 560, rx: 560, ry: 190 } });
  const [wall, surf] = back.planes;

  // ---- the dabba: round steel tin, seven bowls ----
  const [dx, dy] = DAB, DRX = 200, DRY = 88;
  const bowlAt = (id, [bx, by], seed) => {
    const live = POWDERS.includes(id), w = 70, r = rng(seed * 7);
    return `<g id="${live ? `sp-b-${id}` : `sp-x-${id}`}">${F.bowl({ p: 'sp', cx: bx, cy: by, w, depth: 0.3, seed })}<g class="sp-bm" style="transform-box:fill-box;transform-origin:50% 100%;transition:transform .5s">${mound(bx, by + w * 0.02, w * 0.4, w * 0.2, K[id], r)}</g>${live ? `<ellipse class="hit" cx="${bx}" cy="${by + 8}" rx="${w / 2 + 2}" ry="${w * 0.42}"/>` : ''}</g>`;
  };
  const order = Object.keys(BOWL).sort((a, b) => BOWL[a][1] - BOWL[b][1]);
  const dabba = `<ellipse cx="${dx + 12}" cy="${dy + 52}" rx="${DRX + 24}" ry="${DRY - 4}" fill="#0a0405" fill-opacity=".5"/>
<path d="M${dx - DRX} ${dy}L${dx - DRX} ${dy + 36}A${DRX} ${DRY} 0 0 0 ${dx + DRX} ${dy + 36}L${dx + DRX} ${dy}Z" fill="url(#sp-steelH)" stroke="#232845" stroke-width="1.6"/>
<path d="M${dx - DRX + 3} ${dy + 26}A${DRX} ${DRY} 0 0 0 ${dx + DRX - 3} ${dy + 26}" fill="none" stroke="#232845" stroke-opacity=".45" stroke-width="2"/>
<path d="M${dx - DRX + 12} ${dy + 8}L${dx - DRX + 14} ${dy + 28}" stroke="#FFF3CF" stroke-opacity=".8" stroke-width="4" stroke-linecap="round"/>
<ellipse cx="${dx}" cy="${dy}" rx="${DRX}" ry="${DRY}" fill="url(#sp-steel)" stroke="#232845" stroke-width="1.6"/>
<ellipse cx="${dx}" cy="${dy + 4}" rx="${DRX - 12}" ry="${DRY - 9}" fill="url(#sp-steelIn)" stroke="#232845" stroke-opacity=".6" stroke-width="1.4"/>
<ellipse cx="${dx}" cy="${dy + 8}" rx="${DRX - 22}" ry="${DRY - 18}" fill="#14162A" fill-opacity=".45"/>
<path d="M${dx - DRX * 0.96} ${dy - 12}A${DRX} ${DRY} 0 0 1 ${dx - DRX * 0.3} ${dy - DRY * 0.96}" fill="none" stroke="#FFF8E0" stroke-width="3.4" stroke-linecap="round"/>
<path d="M${dx + DRX * 0.4} ${dy - DRY * 0.92}A${DRX} ${DRY} 0 0 1 ${dx + DRX * 0.95} ${dy - DRY * 0.3}" fill="none" stroke="#9DB4F0" stroke-opacity=".55" stroke-width="2" stroke-linecap="round"/>
${order.map((id, i) => bowlAt(id, BOWL[id], i + 2)).join('')}`;

  // ---- tray 1: six piles waiting (hidden until each lands) ----
  const pr = rng(51);
  const piles = POWDERS.map((id) => {
    const [x, y] = PILE[id], rr = pileR(tsp(AMOUNT[id]));
    return `<g class="sp-pileW" data-id="${id}"><g class="sp-pile" data-id="${id}">${mound(x, y, rr, rr * 0.55, K[id], pr)}<text x="${x}" y="${f(y + rr * 0.55 + 15)}" text-anchor="middle" ${LBL}>${AMOUNT[id]}</text></g></g>`;
  }).join('');
  const dr = rng(91);
  const dust = POWDERS.map((id) => {
    const [x, y] = PILE[id];
    return `<g id="sp-dust-${id}">${Array.from({ length: 7 }, () => `<circle class="sp-d" cx="${f(x + range(dr, -9, 9))}" cy="${f(y + range(dr, -8, 4))}" r="${f(range(dr, 4, 9))}" fill="${K[id].c}" opacity="0" data-dx="${f(range(dr, -38, 38))}" data-dy="${f(range(dr, -42, -8))}"/>`).join('')}</g>`;
  }).join('');
  // each powder gets its own spoon, sized by amount, a heap of the powder's colour on it
  const spoonG = POWDERS.map((id) => {
    const k = K[id], s = SPOON_S[id];
    const heap = `<g class="sp-heap"><ellipse cx="0" cy="-3" rx="${f(RX0 * 0.8)}" ry="${f(RY0 * 0.9)}" fill="${k.d}"/><ellipse cx="-1" cy="-5" rx="${f(RX0 * 0.62)}" ry="${f(RY0 * 0.7)}" fill="${k.c}"/><ellipse cx="-3" cy="-7" rx="${f(RX0 * 0.3)}" ry="${f(RY0 * 0.3)}" fill="${k.h}" fill-opacity=".7"/></g>`;
    return `<g id="sp-spoon-${id}" style="opacity:0;transform:translate(${BOWL[id][0]}px,${BOWL[id][1]}px) scale(${s})">${mspoon({ rx: RX0, ry: RY0, len: 74, heap })}</g>`;
  }).join('');

  // ---- tray 2: slots for the whole spices (hidden until they land) ----
  const items = WHOLE.map((id) => SLOT[id].map(([x, y, rot], i) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${rot})"><g class="sp-it" data-id="${id}" data-i="${i}">${wholeArt(id)}</g></g>`).join('')).join('');
  const counters = `<text id="sp-cnt-cardamom" x="${TRAY2.c[0] - 92}" y="${TRAY2.c[1] - 8}" text-anchor="middle" ${LBL} opacity=".7">cardamom 0 of 4</text>
<text id="sp-cnt-clove" x="${TRAY2.c[0] + 62}" y="${TRAY2.c[1] - 8}" text-anchor="middle" ${LBL} opacity=".7">cloves 0 of 4</text>`;
  const names = { cardamom: 'cardamom', clove: 'cloves', bayleaf: 'bay leaf', cinnamon: 'cinnamon', shahijeera: 'shahi jeera', mace: 'mace' };
  const jars = WHOLE.map((id, i) => jar(id, ...JAR[id], names[id], i + 3)).join('');

  // ---- measuring spoons lying in the middle, and a small lamp ----
  const ms = [[-34, 'tbsp', 24, 15, 96, -14], [8, 'tsp', 18, 11, 78, -6], [44, '&#188; tsp', 13, 8, 62, 4]]
    .map(([ox, label, rx, ry, len, rot]) => `<g transform="translate(${990 + ox * 1.0} ${580 + ox * 1.4}) rotate(${rot + 72})">${mspoon({ rx, ry, len, label })}</g>`).join('');
  const lamp = `<g id="sp-lamp" transform="translate(410 30)"><ellipse cx="720" cy="372" rx="34" ry="9" fill="#0a0405" fill-opacity=".5"/>
<path d="M690 358Q692 374 720 376Q748 374 750 358Q720 366 690 358Z" fill="#B8693A" stroke="${INK}" stroke-width="1.5"/>
<path d="M694 358Q720 366 746 358" fill="none" stroke="#FFD27A" stroke-width="2.4" stroke-opacity=".8"/>
<path d="M748 359Q760 356 762 350" fill="none" stroke="#B8693A" stroke-width="5" stroke-linecap="round"/>
<path d="M720 358Q708 340 720 318Q732 340 720 358Z" fill="#FFB52E"/><path d="M720 355Q714 342 720 328Q726 342 720 355Z" fill="#FFF1B8"/></g>`;

  const defs = `${F.foodDefs('sp')}<defs>${linear('sp-glass', [[0, '#C8D8FF', 0.28], [0.45, '#8AA0E0', 0.12], [1, '#27356B', 0.35]], { x1: 0, y1: 0, x2: 1, y2: 0.4 })}</defs>`;
  const css = `<style>
#sp-table .hit{fill:transparent}
#sp-table text{pointer-events:none}
#sp-table .sp-pile{opacity:0;transform-box:fill-box;transform-origin:50% 100%}
#sp-table .sp-pile.on{animation:sp-land .7s cubic-bezier(.2,.9,.3,1) forwards}
#sp-table .sp-it{opacity:0}
@keyframes sp-land{0%{opacity:0;transform:translateY(-34px) scale(.5)}55%{opacity:1;transform:translateY(2px) scale(1.18,.78)}100%{opacity:1;transform:none}}
</style>`;

  const table = plane('sp-table', 0.5, `${defs}${css}
${lamp}<g id="sp-gA" style="${SLIDE_CSS}">${dabba}${tray(TRAY1, 41)}${piles}${tag(TRAY1.c[0] - 20, TRAY1.c[1] + 104, 'for the marinade', -3, 61)}${ms}${spoonG}<g id="sp-dust">${dust}</g></g>
<g id="sp-gB" style="${SLIDE_CSS}transform:translate(${SLIDE}px,0)">${jars}${tray(TRAY2, 43)}${items}${counters}${tag(TRAY2.c[0] - 20, TRAY2.c[1] + 103, 'for the rice water', 2, 63)}</g>`,
  { label: 'A counter with a steel masala dabba, six jars of whole spices, measuring spoons, and two trays: one for the marinade and one for the rice water' });

  const glow = plane('sp-glow', 0.52, `<defs>${radial('sp-lamp', [[0, '#FFD27A', 0.5], [0.4, '#F2A516', 0.2], [1, '#B8693A', 0]])}</defs>
<ellipse cx="1130" cy="380" rx="420" ry="250" fill="url(#sp-lamp)" style="mix-blend-mode:screen"/>`);

  return { planes: [wall, surf, table, glow, back.front] };
}
