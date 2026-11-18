// Art for chapter II, The Fry. Close shot: a heavy copper pot of hot oil on a gas burner, the stove's light from
// below, a steel bowl of raw marinated chicken, the plate of fried onions and a tumbler of hot water and a lid on the counter.
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
export const WATER = { cx: 1060, cy: 610 }; // the tumbler of hot water, where the plate stood
export const LID = { cx: 1060, cy: 700, rx: 96, ry: 40 }; // the lid waiting on the counter; it goes over the pot

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
  // A gas flame: a narrow tongue, wide at the burner, tapering to a point that leans and curls a little.
  // Blue at the base, saffron at the tip (the gradient in the fx defs). Heights vary; the pot hides the middle.
  const tongues = Array.from({ length: 16 }, (_, k) => {
    const r = rng(40 + k), t = k / 15;
    const x = 480 + t * 640, y = 712 + Math.sin(Math.PI * t) * 14;
    const h = 70 + 56 * Math.sin(Math.PI * t) + r() * 34, w = 11 + r() * 5;
    const lean = (r() - 0.5) * 22; // the tip off to one side
    const tip = [x + lean, y - h];
    return `<path class="f-tg" style="animation-delay:${f(-r() * 0.8)}s" d="M${f(x - w / 2)} ${f(y)}C${f(x - w * 0.62)} ${f(y - h * 0.42)} ${f(x - w * 0.22 + lean * 0.4)} ${f(y - h * 0.72)} ${f(tip[0])} ${f(tip[1])}C${f(x + w * 0.22 + lean * 0.4)} ${f(y - h * 0.72)} ${f(x + w * 0.62)} ${f(y - h * 0.42)} ${f(x + w / 2)} ${f(y)}Z" fill="url(#fx-flame)"/>`;
  }).join('');
  // The front row: short tongues in front of the pot's foot (between the pot and the food), so the flames wrap it.
  const frontTongues = Array.from({ length: 11 }, (_, k) => {
    const r = rng(90 + k), t = k / 10;
    const x = 500 + t * 600, y = 718 - Math.sin(Math.PI * t) * 6;
    const h = 46 + 30 * Math.sin(Math.PI * t) + r() * 22, w = 10 + r() * 5;
    const lean = (r() - 0.5) * 18;
    const tip = [x + lean, y - h];
    return `<path class="f-tg" style="animation-delay:${f(-r() * 0.8)}s" d="M${f(x - w / 2)} ${f(y)}C${f(x - w * 0.62)} ${f(y - h * 0.42)} ${f(x - w * 0.22 + lean * 0.4)} ${f(y - h * 0.72)} ${f(tip[0])} ${f(tip[1])}C${f(x + w * 0.22 + lean * 0.4)} ${f(y - h * 0.72)} ${f(x + w * 0.62)} ${f(y - h * 0.42)} ${f(x + w / 2)} ${f(y)}Z" fill="url(#fx-flame)"/>`;
  }).join('');
  const fire = plane('f-fire', 0.58, `<style>
  #f-fire .f-tg{transform-box:fill-box;transform-origin:50% 100%;animation:f-flick .55s ease-in-out infinite alternate}
  @media (prefers-reduced-motion:reduce){#f-fire .f-tg{animation:none}}
</style>${frontTongues}`);
  const fx = plane('f-fx', 0.42, `${F.foodDefs('fx')}
${linear('fx-flame', [[0, '#3D7FE0'], [0.34, '#8CC2FF'], [0.62, '#F7C85A'], [1, '#F2A516']], { x1: 0, y1: 1, x2: 0, y2: 0 })}
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
<ellipse cx="800" cy="700" rx="430" ry="70" fill="url(#fx-glow)" opacity=".7" style="mix-blend-mode:screen"/>
<ellipse class="f-flick" cx="800" cy="690" rx="560" ry="170" fill="url(#fx-glow)" style="mix-blend-mode:screen"/>`);

  // The pot: copper body and rim, then the oil, the masala (faded in later), the shimmer and the bubbles.
  const pot = plane('f-pot', 0.5, `${F.foodDefs('fp')}
${linear('fp-oil-x', [[0, '#FFF3C8', 0], [0.5, '#FFF8E0', 0.75], [1, '#FFF3C8', 0]], { x1: 0, y2: 0, x2: 1 })}
${radial('fp-oil', [[0, '#FFD27A'], [0.5, '#E8921A'], [1, '#8A3A12']], { cx: 0.45, cy: 0.4, r: 0.65 })}
${radial('fp-marp', [[0, '#F0A060'], [0.6, '#D9622A'], [1, '#A8441C']], { cx: 0.45, cy: 0.4, r: 0.65 })}
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
  <ellipse id="f-marpool" cx="${OIL.cx}" cy="${OIL.cy}" rx="${OIL.rx}" ry="${OIL.ry}" fill="url(#fp-marp)" style="opacity:0;transition:opacity .8s"/>
  <ellipse id="f-masala" cx="${OIL.cx}" cy="${OIL.cy}" rx="${OIL.rx}" ry="${OIL.ry}" fill="url(#fp-masala)" style="opacity:0;transition:opacity 2.5s"/>
  <g transform="skewX(-18)"><rect class="f-band" x="520" y="120" width="110" height="480" fill="url(#fp-oil-x)"/></g>
  <g id="f-bub"></g>
</g>
<ellipse class="f-flick" cx="800" cy="668" rx="300" ry="34" fill="#FFB347" opacity=".4" style="mix-blend-mode:screen"/>
<g id="f-smoke" style="opacity:0;transition:opacity .6s">${F.steam({ p: 'fp', x: 800, y: 300, h: 260, w: 130, n: 5, seed: 9 })}</g>
<g id="f-lidOn" style="opacity:0;transform:translateY(-70px);transition:opacity .4s,transform .5s cubic-bezier(.3,.9,.3,1)"><ellipse cx="${POT.cx}" cy="${POT.cy + 8}" rx="${OIL.rx + 22}" ry="${OIL.ry + 16}" fill="url(#fp-cop)" stroke="#2A1210" stroke-width="2.5"/><ellipse cx="${POT.cx - 10}" cy="${POT.cy - 2}" rx="${OIL.rx - 40}" ry="${OIL.ry - 40}" fill="none" stroke="#FFD9A8" stroke-opacity=".45" stroke-width="3"/><ellipse cx="${POT.cx}" cy="${POT.cy - 12}" rx="26" ry="14" fill="#3A1A16" stroke="#2A1210" stroke-width="2"/><ellipse cx="${POT.cx - 7}" cy="${POT.cy - 17}" rx="10" ry="4" fill="#FFE2B8" fill-opacity=".8"/></g>
<ellipse id="f-potHit" class="hit" cx="800" cy="400" rx="330" ry="210"/>`, { label: 'The pot of hot oil' });

  // The touchable things on the counter, in front of the pot.
  const top = plane('f-top', 0.66, `${F.foodDefs('ft')}
${radial('ft-mar', [[0, '#F08A4A'], [0.6, '#D0501E'], [1, '#9A3A18']], { cx: 0.45, cy: 0.4, r: 0.7 })}
<style>
  #f-top .hit{fill:transparent;stroke:none}
  #f-top .f-pc:not(.hotspot) .hit,#f-top #f-water:not(.hotspot) .hit,#f-top #f-lidRest:not(.hotspot) .hit,#f-top #f-bowl:not(.hotspot) .hit,#f-top #f-plate:not(.hotspot) .hit{pointer-events:none}
  #f-top #f-onions{pointer-events:none}
  #f-top .f-l{transition:opacity .3s}
</style>
<g id="f-bowl" style="transform-box:fill-box;transform-origin:50% 60%">${F.bowl({ p: 'ft', cx: BOWL.cx, cy: BOWL.cy, w: BOWL.w, fill: 'empty', seed: 3 })}
<g id="f-bowlMar" style="transition:opacity .6s"><ellipse cx="${BOWL.cx + 4}" cy="${BOWL.cy + 6}" rx="98" ry="38" fill="url(#ft-mar)"/>
<ellipse cx="${BOWL.cx - 30}" cy="${BOWL.cy - 4}" rx="34" ry="7" fill="#FFD2A8" fill-opacity=".55"/></g>
<ellipse class="hit" cx="${BOWL.cx}" cy="${BOWL.cy}" rx="140" ry="90"/></g>
${PIECES.map((_, i) => piece(i)).join('')}
<g id="f-plate">${F.plate({ p: 'ft', cx: PLATE.cx, cy: PLATE.cy, w: PLATE.w })}<ellipse class="hit" cx="${PLATE.cx}" cy="${PLATE.cy}" rx="110" ry="62"/></g>
<g id="f-onions">${F.biristaCluster({ p: 'ft', x: ONION.x, y: ONION.y, w: 120, h: 40, n: 18, seed: 4 })}</g>
<g id="f-water" style="opacity:0;transition:opacity .5s"><g class="f-src">${F.tumbler({ p: 'ft', cx: WATER.cx, cy: WATER.cy, w: 96, h: 120 })}</g><ellipse class="hit" cx="${WATER.cx}" cy="${WATER.cy + 50}" rx="70" ry="80"/></g>
<g id="f-lidRest" style="opacity:0;transition:opacity .5s"><g class="f-src"><ellipse cx="${LID.cx + 6}" cy="${LID.cy + 14}" rx="${LID.rx}" ry="${LID.ry}" fill="#0a0405" fill-opacity=".5"/><ellipse cx="${LID.cx}" cy="${LID.cy}" rx="${LID.rx}" ry="${LID.ry}" fill="url(#ft-cop)" stroke="#2A1210" stroke-width="2"/><ellipse cx="${LID.cx}" cy="${LID.cy - 3}" rx="${LID.rx * 0.7}" ry="${LID.ry * 0.62}" fill="none" stroke="#FFD9A8" stroke-opacity=".5" stroke-width="2.4"/><ellipse cx="${LID.cx}" cy="${LID.cy - 12}" rx="14" ry="8" fill="#3A1A16" stroke="#2A1210" stroke-width="1.4"/><ellipse cx="${LID.cx - 4}" cy="${LID.cy - 15}" rx="6" ry="2.6" fill="#FFE2B8" fill-opacity=".8"/></g><ellipse class="hit" cx="${LID.cx}" cy="${LID.cy}" rx="${LID.rx + 8}" ry="${LID.ry + 14}"/></g>
<g id="f-clock" style="opacity:0;transition:opacity .5s"><rect x="660" y="560" width="320" height="64" rx="14" fill="#140A10" fill-opacity=".82" stroke="#F2A516" stroke-opacity=".7" stroke-width="2"/><text id="f-clockA" x="820" y="587" text-anchor="middle" font-size="26" fill="#F6EBD3" style="font-family:var(--font-display,serif)"></text><text id="f-clockB" x="820" y="611" text-anchor="middle" font-size="18" fill="#F2A516" style="font-family:var(--font-text,serif)"></text></g>`,
  { label: 'Marinated chicken in a bowl, a tumbler of hot water and a lid' });

  return { planes: [...back.planes, fx, pot, fire, top, back.front] };
}
