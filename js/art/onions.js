// Art for chapter II, The Onions (birista). Close shot on the counter: a wooden board with two whole onions and a knife,
// a wide heavy iron pan on a gas burner (flames under its foot, the knob at its side), a steel plate lined with paper,
// the oil bottle, a small bowl for the two spoonfuls kept back, and a stylised clock on the wall. Everything touchable
// sits inside x 570..1040, the column a phone shows (design.md section 4), so a phone can reach all of it.
// Planes: clock (wall, d .12), pan (iron, oil, shimmer, the stir target; d .5), fire (flames in front of the pan's foot;
// d .58), top (board, onions, knife, bottle, plate, bowl, the onion mass in the pan; d .66).
// Everything that moves is placed with `pose` (a CSS transform in user units, origin 0 0); chapter logic is in
// js/chapters/onions.js.
import * as F from './food.js';
import { close } from './close.js';
import { plane, linear, radial, rng, f, wobble } from './lib.js';

export const PAN = { cx: 800, cy: 380, rx: 210, ry: 80 };
export const OIL = { cx: 800, cy: 384, rx: 178, ry: 66 };
export const BURNER = { cx: 800, cy: 500 };
export const BOARD = { cx: 700, cy: 640, rx: 126, ry: 84 };
export const ONION_S = 0.56; // the onions are drawn at this scale on the board
export const ONIONS = { A: { x: 640, y: 622 }, B: { x: 752, y: 646 } };
export const PILE = { x: 700, y: 668 }; // where the cut slices gather on the board
export const BOTTLE = { x: 975, y: 520, s: 0.7 }; // the bottle's base and its scale
export const STREAM = 'M871 405Q842 387 806 394'; // the oil, from the spout (at the tilt) into the pan
export const PLATE = { cx: 890, cy: 690, w: 150 };
export const BOWL = { cx: 965, cy: 606, w: 84 };
export const KNOB = { x: 604, y: 532 };
export const CLOCK = { x: 955, y: 116, r: 46 };
export const KNIFE_REST = { x: 770, y: 620, rot: -12, s: 0.6 };
export const CRESCENT = 'M-13 0A13 12 0 0 0 13 0Q0 7 -13 0Z'; // one half-moon slice, drawn at the origin
export const pose = (x, y, rot = 0, s = 1) => `translate(${f(x)}px, ${f(y)}px) rotate(${f(rot)}deg) scale(${f(s)})`;

const arc = (cx, cy, r, a0, a1) => { // angles in turns, clockwise from the top
  const p = (a) => [cx + r * Math.sin(a * 2 * Math.PI), cy - r * Math.cos(a * 2 * Math.PI)];
  const [x0, y0] = p(a0), [x1, y1] = p(a1);
  return `M${f(x0)} ${f(y0)}A${r} ${r} 0 ${a1 - a0 > 0.5 ? 1 : 0} 1 ${f(x1)} ${f(y1)}`;
};

// A whole onion at the origin: brown skin, the rings showing through, the neck and the root tuft.
const WHOLE = `<ellipse cx="6" cy="10" rx="70" ry="56" fill="#0A0604" fill-opacity=".45"/>
<ellipse rx="66" ry="54" fill="url(#o-skin)"/>
<ellipse rx="48" ry="37" fill="none" stroke="#F6E2B8" stroke-opacity=".6" stroke-width="2.4"/>
<ellipse rx="30" ry="22" fill="none" stroke="#E4B870" stroke-opacity=".7" stroke-width="2"/>
<path d="M-8-52Q0-72 8-52Q4-47 0-49Q-4-47-8-52Z" fill="#9C7442"/>
<path d="M-6 54L0 64L6 54Z" fill="#7A5A30"/>
<ellipse cx="-24" cy="-22" rx="14" ry="7" fill="#FFF8E4" fill-opacity=".55" transform="rotate(-28 -24 -22)"/>`;
const onion = (k) => `<g class="o-on" id="o-on${k}" transform="translate(${ONIONS[k].x} ${ONIONS[k].y}) scale(${ONION_S})"><ellipse class="hit" rx="120" ry="100"/>${WHOLE}</g>`;

// The cooked mass in the pan is drawn around the origin and placed with pose(); its crescents take --oc (the colour).
const massCres = (() => {
  const r = rng(31);
  return Array.from({ length: 120 }, () => {
    const a = r() * 2 * Math.PI, d = Math.sqrt(r());
    return `<use href="#o-cr" style="fill:var(--oc);transform:translate(${f(Math.cos(a) * d * 160)}px, ${f(Math.sin(a) * d * 58)}px) rotate(${f(r() * 360)}deg) scale(1.1)"/>`;
  }).join('');
})();

const clockPlane = plane('o-clock', 0.12, `<defs>${radial('o-face', [[0, '#FFF6E2'], [1, '#E8D6AE']], { cx: 0.4, cy: 0.35, r: 0.7 })}</defs>
<circle cx="${CLOCK.x}" cy="${CLOCK.y}" r="${CLOCK.r + 9}" fill="#0A0810" fill-opacity=".45"/>
<circle cx="${CLOCK.x}" cy="${CLOCK.y}" r="${CLOCK.r}" fill="url(#o-face)" stroke="#A33B2C" stroke-width="6"/>
<path d="${arc(CLOCK.x, CLOCK.y, CLOCK.r - 10, 0, 0.45)}" fill="none" stroke="#A33B2C" stroke-width="7" stroke-opacity=".8"/>
<path d="${arc(CLOCK.x, CLOCK.y, CLOCK.r - 10, 0.45, 0.75)}" fill="none" stroke="#F2A516" stroke-width="7" stroke-opacity=".9"/>
<path d="${arc(CLOCK.x, CLOCK.y, CLOCK.r - 10, 0.75, 1)}" fill="none" stroke="#6B7AA8" stroke-width="7" stroke-opacity=".7"/>
${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 2 * Math.PI; return `<line x1="${f(CLOCK.x + Math.sin(a) * (CLOCK.r - 19))}" y1="${f(CLOCK.y - Math.cos(a) * (CLOCK.r - 19))}" x2="${f(CLOCK.x + Math.sin(a) * (CLOCK.r - 26))}" y2="${f(CLOCK.y - Math.cos(a) * (CLOCK.r - 26))}" stroke="#141A2E" stroke-width="2"/>`; }).join('')}
<line id="o-hand" x1="${CLOCK.x}" y1="${CLOCK.y}" x2="${CLOCK.x}" y2="${CLOCK.y - CLOCK.r + 10}" stroke="#141A2E" stroke-width="4" stroke-linecap="round" transform="rotate(0 ${CLOCK.x} ${CLOCK.y})"/>
<circle cx="${CLOCK.x}" cy="${CLOCK.y}" r="5" fill="#141A2E"/>
<text id="o-clockT" x="${CLOCK.x}" y="${CLOCK.y + CLOCK.r + 28}" text-anchor="middle" font-size="24" fill="#F6EBD3" font-family="Literata, Georgia, serif">7 min, medium</text>`);

const panPlane = plane('o-pan', 0.5, `<defs>
${linear('o-iron', [[0, '#5A5268'], [0.45, '#2C2834'], [1, '#100E15']])}
${radial('o-oilg', [[0, '#FFE39C'], [0.5, '#E9A23C'], [1, '#8E4416']], { cx: 0.42, cy: 0.42, r: 0.66 })}
<clipPath id="o-oilclip"><ellipse cx="${OIL.cx}" cy="${OIL.cy}" rx="${OIL.rx}" ry="${OIL.ry}"/></clipPath>
</defs>
<style>
  #o-pan *{pointer-events:none}
  #o-pan .hit{fill:transparent}
  #o-pan .hotspot,#o-pan .hotspot.hit{pointer-events:all}
  #o-pan .o-band{animation:o-band 6s linear infinite}
  @keyframes o-band{from{transform:translateX(-460px)}to{transform:translateX(560px)}}
  @media (prefers-reduced-motion:reduce){#o-pan .o-band{animation:none}}
</style>
<ellipse cx="${BURNER.cx}" cy="${BURNER.cy + 6}" rx="250" ry="38" fill="#0A090E"/>
${[-170, -85, 0, 85, 170].map((dx) => `<line x1="${BURNER.cx + dx}" y1="${BURNER.cy - 22}" x2="${BURNER.cx + dx * 1.04}" y2="${BURNER.cy + 18}" stroke="#2A2630" stroke-width="6" stroke-linecap="round"/>`).join('')}
<path d="M${PAN.cx - PAN.rx} ${PAN.cy}L${PAN.cx - PAN.rx + 8} ${PAN.cy + 62}Q${PAN.cx} ${PAN.cy + PAN.ry + 78} ${PAN.cx + PAN.rx - 8} ${PAN.cy + 62}L${PAN.cx + PAN.rx} ${PAN.cy}Z" fill="url(#o-iron)"/>
<path d="M${PAN.cx + PAN.rx - 30} ${PAN.cy - 6}L${PAN.cx + PAN.rx + 70} ${PAN.cy - 16}" stroke="#1C1822" stroke-width="24" stroke-linecap="round"/>
<path d="M${PAN.cx + PAN.rx - 10} ${PAN.cy - 12}L${PAN.cx + PAN.rx + 62} ${PAN.cy - 22}" stroke="#6A6078" stroke-width="4" stroke-linecap="round" stroke-opacity=".8"/>
<ellipse cx="${PAN.cx}" cy="${PAN.cy}" rx="${PAN.rx}" ry="${PAN.ry}" fill="url(#o-iron)" stroke="#8A8298" stroke-width="3"/>
<ellipse cx="${PAN.cx}" cy="${PAN.cy + 5}" rx="${PAN.rx - 26}" ry="${PAN.ry - 20}" fill="#4A4258"/>
<ellipse id="o-oil" cx="${OIL.cx}" cy="${OIL.cy}" rx="${OIL.rx}" ry="${OIL.ry}" fill="url(#o-oilg)" style="opacity:0;transition:opacity 1.4s ease-in"/>
<g id="o-shim" style="opacity:0;transition:opacity 1.2s"><g clip-path="url(#o-oilclip)"><g transform="skewX(-18)"><rect class="o-band" x="520" y="120" width="90" height="420" fill="#FFF8E0" fill-opacity=".5"/></g></g></g>
<ellipse id="o-stir" class="hit" cx="${PAN.cx}" cy="${PAN.cy + 5}" rx="${PAN.rx - 30}" ry="${PAN.ry - 18}"/>`, { label: 'The pan on the burner' });

// Flames under the pan's foot, in front of it (the knob turns them down; see the chapter).
const tongues = Array.from({ length: 14 }, (_, k) => {
  const r = rng(120 + k), t = k / 13;
  const x = 610 + t * 380, y = 506 - Math.sin(Math.PI * t) * 6;
  const h = 40 + 26 * Math.sin(Math.PI * t) + r() * 18, w = 9 + r() * 5;
  const lean = (r() - 0.5) * 14, tip = [x + lean, y - h];
  return `<path class="o-tg" style="animation-delay:${f(-r() * 0.8)}s" d="M${f(x - w / 2)} ${f(y)}C${f(x - w * 0.62)} ${f(y - h * 0.42)} ${f(x - w * 0.22 + lean * 0.4)} ${f(y - h * 0.72)} ${f(tip[0])} ${f(tip[1])}C${f(x + w * 0.22 + lean * 0.4)} ${f(y - h * 0.72)} ${f(x + w * 0.62)} ${f(y - h * 0.42)} ${f(x + w / 2)} ${f(y)}Z" fill="url(#o-flame)"/>`;
}).join('');
const firePlane = plane('o-fire', 0.58, `<defs>
${linear('o-flame', [[0, '#3D7FE0'], [0.34, '#8CC2FF'], [0.62, '#F7C85A'], [1, '#F2A516']], { x1: 0, y1: 1, x2: 0, y2: 0 })}
${radial('o-glow', [[0, '#FFD27A', 0.8], [0.5, '#F2A516', 0.3], [1, '#E0701A', 0]])}
</defs>
<style>
  #o-fire .o-tg{transform-box:fill-box;transform-origin:50% 100%;animation:o-flick .55s ease-in-out infinite alternate}
  @keyframes o-flick{from{transform:scaleY(.9);opacity:.75}to{transform:scaleY(1.08);opacity:1}}
  @media (prefers-reduced-motion:reduce){#o-fire .o-tg{animation:none}}
</style>
<ellipse cx="${BURNER.cx}" cy="${BURNER.cy}" rx="300" ry="60" fill="url(#o-glow)" opacity=".7" style="mix-blend-mode:screen"/>
<g id="o-fire" style="opacity:1;transition:opacity .9s">${tongues}</g>`);

const topPlane = plane('o-top', 0.66, `<defs>
${F.foodDefs('ot')}
${radial('o-skin', [[0, '#F0C682'], [0.6, '#B9783A'], [1, '#5E3A18']], { cx: 0.38, cy: 0.35, r: 0.72 })}
${linear('o-blade', [[0, '#F4F6FA'], [0.5, '#9AA3B4'], [1, '#5A6172']])}
${radial('o-wood', [[0, '#D89A60'], [0.7, '#A86A3A'], [1, '#5E3618']], { cx: 0.4, cy: 0.35, r: 0.7 })}
<path id="o-cr" d="${CRESCENT}" stroke="#6B4A22" stroke-width="1.2" stroke-opacity=".55"/>
</defs>
<style>
  #o-top *{pointer-events:none}
  #o-top .hit{fill:transparent}
  #o-top .hotspot,#o-top .hotspot .hit,#o-top .hotspot.hit{pointer-events:all}
</style>
<g id="o-boardG" style="transform:translate(0px, 0px)">
  <ellipse cx="${BOARD.cx}" cy="${BOARD.cy + 14}" rx="${BOARD.rx - 4}" ry="${BOARD.ry}" fill="#2A1608" fill-opacity=".7"/>
  <ellipse cx="${BOARD.cx}" cy="${BOARD.cy}" rx="${BOARD.rx}" ry="${BOARD.ry}" fill="url(#o-wood)"/>
  ${[0, 1, 2].map((i) => `<path d="${wobble([[BOARD.cx - 110, BOARD.cy - 52 + i * 36], [BOARD.cx, BOARD.cy - 46 + i * 36], [BOARD.cx + 110, BOARD.cy - 56 + i * 36]], 3, rng(3 + i), false)}" fill="none" stroke="#6A3E1C" stroke-opacity=".35" stroke-width="2"/>`).join('')}
  <ellipse class="hit" cx="${BOARD.cx}" cy="${BOARD.cy}" rx="${BOARD.rx}" ry="${BOARD.ry}"/>
  <g id="o-pile" style="--oc:#F4ECD8"></g>
</g>
${onion('A')}
${onion('B')}
<g id="o-knife" style="transform:${pose(KNIFE_REST.x, KNIFE_REST.y, KNIFE_REST.rot, KNIFE_REST.s)}">
  <path d="M0 0C-34-12-96-16-150-10L-150 4C-96 8-34 6 0 0Z" fill="url(#o-blade)" stroke="#2A2E3A" stroke-width="1.2"/>
  <path d="M-150-12L-236-12Q-244-4-236 6L-150 6Z" fill="#4A2A16" stroke="#1E1008" stroke-width="1.2"/>
  <path d="M-160-5L-18-5" stroke="#FFFFFF" stroke-opacity=".5" stroke-width="1.5" stroke-linecap="round"/>
</g>
<g id="o-plate">
  ${F.plate({ p: 'ot', cx: PLATE.cx, cy: PLATE.cy, w: PLATE.w })}
  <path d="${wobble(Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * 2 * Math.PI; return [PLATE.cx + Math.cos(a) * PLATE.w * 0.4, PLATE.cy + Math.sin(a) * PLATE.w * 0.17]; }), 2, rng(11))}" fill="#F3E6C8" fill-opacity=".95" stroke="#CDB68A" stroke-width="1"/>
</g>
<g id="o-bowlG">
  <ellipse class="hit" cx="${BOWL.cx}" cy="${BOWL.cy + 6}" rx="60" ry="44"/>
  ${F.bowl({ p: 'ot', cx: BOWL.cx, cy: BOWL.cy, w: BOWL.w, fill: 'empty', seed: 5 })}
  <g id="o-bowlOn" style="opacity:0;transition:opacity .8s">${F.biristaCluster({ p: 'ot', x: BOWL.cx, y: BOWL.cy - 2, w: 60, h: 18, n: 12, seed: 8 })}</g>
</g>
<g id="o-bottleG" style="transform:${pose(BOTTLE.x, BOTTLE.y, 0, BOTTLE.s)}">
  <ellipse class="hit" cx="0" cy="-110" rx="50" ry="120"/>
  <rect x="-34" y="-170" width="68" height="170" rx="18" fill="#C97A22" stroke="#6A3A10" stroke-width="1.5"/>
  <rect x="-12" y="-204" width="24" height="36" fill="#C97A22" stroke="#6A3A10" stroke-width="1.5"/>
  <rect x="-15" y="-222" width="30" height="20" rx="4" fill="#2A2630"/>
  <rect x="-26" y="-124" width="52" height="58" rx="6" fill="#F6EBD3" fill-opacity=".9"/>
  <rect x="-25" y="-160" width="8" height="120" rx="4" fill="#FFF0C0" fill-opacity=".45"/>
</g>
<path id="o-stream" d="${STREAM}" fill="none" stroke="#E8A83A" stroke-width="6" stroke-linecap="round" style="opacity:0"/>
<g id="o-knob" style="transform:${pose(KNOB.x, KNOB.y, 35)}">
  <circle r="20" fill="#1E1B24" stroke="#6A6278" stroke-width="3"/>
  <circle r="12" fill="#2E2A36"/>
  <line x1="0" y1="0" x2="0" y2="-14" stroke="#F2A516" stroke-width="4" stroke-linecap="round"/>
</g>
<g id="o-panOn" style="opacity:0;transition:opacity .9s;transform:${pose(PAN.cx, PAN.cy)};--oc:#F3EBD0">
  <ellipse id="o-scoop" class="hit" cx="0" cy="0" rx="170" ry="62"/>
  ${massCres}
</g>
<g id="o-sparks"></g>
<g id="o-flying"></g>`, { label: 'The board with two onions and a knife, the oil bottle, the plate and the small bowl' });

export default function art() {
  const back = close({ surface: 'counter', mood: 'stove', pool: { x: 800, y: 700, rx: 520, ry: 230 } });
  return { planes: [back.planes[0], clockPlane, back.planes[1], panPlane, firePlane, topPlane, back.front] };
}
