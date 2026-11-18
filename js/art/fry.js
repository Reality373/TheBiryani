// Art for chapter II, The Fry. Close shot: a heavy copper pot of hot oil on a gas burner, the stove's light from
// below, a steel bowl of raw marinated chicken, the plate of fried onions and a row of whole spices on the counter.
// Planes: fx (burner, flame, glow, behind the pot), pot (copper, oil, masala, shimmer, bubbles, the hold target),
// top (the touchable things: pieces, plate, onions, spices). Chicken pieces carry three layers (raw, half, golden)
// whose opacity the chapter crossfades with chicken(doneness). Chapter logic is in js/chapters/fry.js.
import * as F from './food.js';
import { close } from './close.js';
import { plane, linear, radial, rng, f } from './lib.js';

// Layout (world units). OIL is the oil surface inside the pot's rim.
export const POT = { cx: 800, cy: 360, w: 640, tilt: 0.55 };
export const OIL = { cx: 800, cy: 367, rx: 298, ry: 158 };
export const BOWL = { cx: 640, cy: 690, w: 240 };
export const PIECES = [{ x: 628, y: 664, rot: -18 }, { x: 672, y: 676, rot: 22 }, { x: 604, y: 684, rot: 8 }, { x: 656, y: 648, rot: -6 }];
export const LAND = [[700, 385], [885, 378], [772, 428], [905, 432]]; // where each piece settles in the oil
export const PLATE = { cx: 1040, cy: 626, w: 200 };
export const ONION = { x: PLATE.cx, y: PLATE.cy - 8 }; // the onion curls' rest point on the plate
export const ONION_TO = { x: 800, y: 402 }; // where they land in the pot
export const SPICES = [
  { kind: 'cardamom', name: 'cardamom', x: 915, y: 750, rot: 30, s: 1.5, to: [742, 410] },
  { kind: 'clove', name: 'cloves', x: 1005, y: 758, rot: -20, s: 1.5, to: [835, 442] },
  { kind: 'cinnamon', name: 'cinnamon', x: 1095, y: 744, rot: -8, s: 1.5, to: [700, 440] },
  { kind: 'bay', name: 'bay leaf', x: 1180, y: 752, rot: 14, s: 1.5, to: [880, 398] },
];

const LAYER_SEED = (i, k) => 20 + i * 3 + k; // one seed per drawn layer, so no two clip ids clash

// Each piece's size and bone, so the heap in the bowl is uneven (piece 2, at the left rim, is the drumstick with its bone out).
const CUTS = [{ w: 118, h: 80 }, { w: 104, h: 74 }, { w: 116, h: 84, bone: true }, { w: 96, h: 70 }];

// One piece: three chicken layers (raw, half-fried, golden), the top one fading in as the pot cooks it.
function piece(i) {
  const p = PIECES[i], c = CUTS[i];
  const layers = [{ raw: true }, { doneness: 0.5 }, { doneness: 1 }].map((o, k) =>
    `<g class="f-l" style="opacity:${k === 0 ? 1 : 0}">${F.chicken({ p: 'ft', x: p.x, y: p.y, w: c.w, h: c.h, rot: p.rot, bone: !!c.bone, seed: LAYER_SEED(i, k), ...o })}</g>`).join('');
  return `<g class="f-pc" id="f-pc${i}"><ellipse class="hit" cx="${p.x}" cy="${p.y}" rx="66" ry="54"/>${layers}</g>`;
}

export default function art() {
  const back = close({ surface: 'counter', mood: 'stove', pool: { x: 800, y: 700, rx: 520, ry: 230 } });
  // Behind the pot: burner, flame tongues round the base, the warm glow on the stove.
  const tongues = Array.from({ length: 16 }, (_, k) => {
    const r = rng(40 + k), t = k / 15;
    const x = 470 + t * 660, y = 712 + Math.sin(Math.PI * t) * 18, h = 46 + 40 * Math.sin(Math.PI * t) + r() * 14, w = 22 + r() * 8;
    const lean = (r() - 0.5) * 12; // each tongue leans a little, the tip off to one side
    return `<path class="f-tg" style="animation-delay:${f(-r() * 0.8)}s" d="M${f(x - w / 2)} ${f(y)}C${f(x - w / 2)} ${f(y - h * 0.45)} ${f(x - w * 0.15 + lean)} ${f(y - h * 0.75)} ${f(x + lean)} ${f(y - h)}C${f(x + w * 0.15 + lean)} ${f(y - h * 0.75)} ${f(x + w / 2)} ${f(y - h * 0.45)} ${f(x + w / 2)} ${f(y)}Z" fill="url(#fx-flame)"/>`;
  }).join('');
  const fx = plane('f-fx', 0.42, `${F.foodDefs('fx')}
${linear('fx-flame', [[0, '#8EC0FF'], [0.3, '#4A86E0'], [0.7, '#F2A516'], [1, '#FFE08A']], { x1: 0, y1: 1, x2: 0, y2: 0 })}
${radial('fx-glow', [[0, '#FFD27A', 0.9], [0.45, '#F2A516', 0.35], [1, '#E0701A', 0]])}
<style>
  #f-fx .f-tg{transform-box:fill-box;transform-origin:50% 100%;animation:f-flick .55s ease-in-out infinite alternate}
  #f-fx .f-flick{animation:f-flick .9s ease-in-out infinite alternate}
  @keyframes f-flick{from{transform:scaleY(.9);opacity:.75}to{transform:scaleY(1.08);opacity:1}}
  @media (prefers-reduced-motion:reduce){#f-fx .f-tg,#f-fx .f-flick{animation:none}}
</style>
<ellipse cx="800" cy="706" rx="380" ry="58" fill="#17151E" stroke="#3A3446" stroke-width="3"/>
${[-220, -110, 0, 110, 220].map((dx) => `<path d="M${800 + dx} 670L${800 + dx * 1.04} 720" stroke="#3A3446" stroke-width="4" stroke-linecap="round"/>`).join('')}
${tongues}
<ellipse class="f-flick" cx="800" cy="690" rx="560" ry="170" fill="url(#fx-glow)" style="mix-blend-mode:screen"/>`);

  // The pot: copper body and rim, then the oil, the masala (faded in later), the shimmer and the bubbles.
  const pot = plane('f-pot', 0.5, `${F.foodDefs('fp')}
${linear('fp-oil-x', [[0, '#FFF3C8', 0], [0.5, '#FFF8E0', 0.75], [1, '#FFF3C8', 0]], { x1: 0, y2: 0, x2: 1 })}
${radial('fp-oil', [[0, '#FFD27A'], [0.5, '#E8921A'], [1, '#8A3A12']], { cx: 0.45, cy: 0.4, r: 0.65 })}
${radial('fp-masala', [[0, '#C2531F'], [0.6, '#8A2E14'], [1, '#3E1208']], { cx: 0.45, cy: 0.4, r: 0.65 })}
<style>
  #f-pot .f-band{animation:f-band 7s linear infinite}
  #f-pot .f-flick{animation:f-flick .9s ease-in-out infinite alternate}
  @keyframes f-band{from{transform:translateX(-460px)}to{transform:translateX(560px)}}
  @keyframes f-flick{from{opacity:.7}to{opacity:1}}
  #f-pot .hit{fill:transparent;pointer-events:none}
  #f-pot .hotspot.hit{pointer-events:all}
  @media (prefers-reduced-motion:reduce){#f-pot .f-band,#f-pot .f-flick{animation:none}}
</style>
${F.handi({ p: 'fp', cx: POT.cx, cy: POT.cy, w: POT.w, tilt: POT.tilt, fill: 'empty', seed: 6 })}
<clipPath id="f-oilclip"><ellipse cx="${OIL.cx}" cy="${OIL.cy}" rx="${OIL.rx}" ry="${OIL.ry}"/></clipPath>
<g clip-path="url(#f-oilclip)">
  <ellipse cx="${OIL.cx}" cy="${OIL.cy}" rx="${OIL.rx}" ry="${OIL.ry}" fill="url(#fp-oil)"/>
  <ellipse id="f-masala" cx="${OIL.cx}" cy="${OIL.cy}" rx="${OIL.rx}" ry="${OIL.ry}" fill="url(#fp-masala)" style="opacity:0;transition:opacity 2.5s"/>
  <g transform="skewX(-18)"><rect class="f-band" x="520" y="120" width="110" height="480" fill="url(#fp-oil-x)"/></g>
  <g id="f-bub"></g>
</g>
<ellipse class="f-flick" cx="800" cy="668" rx="300" ry="34" fill="#FFB347" opacity=".4" style="mix-blend-mode:screen"/>
<g id="f-smoke" style="opacity:0;transition:opacity .6s">${F.steam({ p: 'fp', x: 800, y: 300, h: 260, w: 130, n: 5, seed: 9 })}</g>
<ellipse id="f-potHit" class="hit" cx="800" cy="400" rx="330" ry="210"/>`, { label: 'The pot of hot oil' });

  // The touchable things on the counter, in front of the pot.
  const top = plane('f-top', 0.66, `${F.foodDefs('ft')}
${radial('ft-mar', [[0, '#F08A4A'], [0.6, '#D0501E'], [1, '#9A3A18']], { cx: 0.45, cy: 0.4, r: 0.7 })}
<style>
  #f-top .hit{fill:transparent;stroke:none}
  #f-top .f-pc:not(.hotspot) .hit,#f-top .f-sp:not(.hotspot) .hit,#f-top #f-plate:not(.hotspot) .hit{pointer-events:none}
  #f-top #f-onions{pointer-events:none}
  #f-top .f-l{transition:opacity .3s}
</style>
${F.bowl({ p: 'ft', cx: BOWL.cx, cy: BOWL.cy, w: BOWL.w, fill: 'empty', seed: 3 })}
<ellipse cx="${BOWL.cx + 4}" cy="${BOWL.cy + 6}" rx="98" ry="38" fill="url(#ft-mar)"/>
<ellipse cx="${BOWL.cx - 30}" cy="${BOWL.cy - 4}" rx="34" ry="7" fill="#FFD2A8" fill-opacity=".55"/>
${PIECES.map((_, i) => piece(i)).join('')}
<g id="f-plate">${F.plate({ p: 'ft', cx: PLATE.cx, cy: PLATE.cy, w: PLATE.w })}<ellipse class="hit" cx="${PLATE.cx}" cy="${PLATE.cy}" rx="110" ry="62"/></g>
<g id="f-onions">${F.biristaCluster({ p: 'ft', x: ONION.x, y: ONION.y, w: 120, h: 40, n: 18, seed: 4 })}</g>
${SPICES.map((s, i) => `<g class="f-sp" id="f-sp${i}"><rect class="hit" x="${s.x - 50}" y="${s.y - 44}" width="100" height="88" rx="28"/>${F.spice(s.kind, { p: 'ft', x: s.x, y: s.y, rot: s.rot, s: s.s })}</g>`).join('')}`,
  { label: 'Chicken, fried onions and whole spices' });

  return { planes: [...back.planes, fx, pot, top, back.front] };
}
