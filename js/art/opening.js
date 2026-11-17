// Art for chapter VI, The Opening. Two shots:
//   default export art(): the room in the burst mood, plus the crumbs of baked dough that fall off the rim as the
//     seal cracks (one per crack line room.js draws; the chapter switches them on as the crack spreads).
//   inside(): the close shot into the handi, the composition approved in tools/preview-close.html?scene=pot, with
//     the big serving spoon standing at the side. The spoon is the chapter's hotspot (#o-spoon).
// Chapter logic is in js/chapters/opening.js.
import { room } from './room.js';
import { close } from './close.js';
import * as F from './food.js';
import { plane, blob, rng, range, f, radial } from './lib.js';

const CRACK_X = (i) => 674 + i * 31; // the nine crack lines in room.js, left to right
const CRACKS = 9;

export default function art() {
  const planes = room({ mood: 'burst', seed: 3 });
  const r = rng(61);
  const crumbs = Array.from({ length: CRACKS }, (_, i) =>
    `<g class="o-crumb" style="--dx:${f(range(r, -22, 22))}px"><path d="${blob(CRACK_X(i) + range(r, -4, 4), range(r, 530, 540), 4.5, 3.4, 0.3, r, 7)}" fill="#EAC78A" stroke="#2A160D" stroke-width="1.2"/></g>`).join('');
  const fx = plane('o-fx', 0.8, `<style>
      #o-fx .o-crumb{opacity:0}
      #o-fx .o-crumb.on{opacity:1;animation:o-fall 1.1s ease-in forwards}
      @keyframes o-fall{0%{transform:translate(0,0);opacity:1}100%{transform:translate(var(--dx),130px) rotate(160deg);opacity:0}}
    </style>${crumbs}`);
  // Under the foreground framing, like the seal's effects.
  const at = planes.findIndex((p) => p.includes('id="r-fg"'));
  planes.splice(at < 0 ? planes.length : at, 0, fx);
  return { planes };
}

// The spoon: a steel spoon standing in the rice at the pot's right side, handle up and out of frame.
// Two copies: the empty one at rest, and the one with a scoop of rice and chicken (shown once data-scoop is set).
const SPOON = { x: 950, y: 500, rot: -58, s: 2.6, len: 130 }; // inside the phone's column (x 570..1030)
const IVORY = ['#F6EBD3', '#FBF2DC', '#F1E0BA', '#FFF7E8'];
const GOLD = ['#F2A516', '#E8921A', '#F5B93A'];
// The scoop, in the spoon's own coordinates: rice heaped above the bowl's rim, a piece of chicken, a curl of onion.
function scoop() {
  const r = rng(71);
  let s = '';
  for (let i = 0; i < 34; i++) {
    const x = range(r, -20, 20), y = -4 - Math.sqrt(Math.max(0, 1 - (x / 22) ** 2)) * range(r, 4, 16);
    const col = r() < 0.3 ? GOLD[Math.floor(r() * 3)] : IVORY[Math.floor(r() * 4)];
    s += `<ellipse cx="${f(x)}" cy="${f(y)}" rx="${f(range(r, 4.5, 7))}" ry="${f(range(r, 2, 3))}" fill="${col}" stroke="#7A4A22" stroke-width=".6" transform="rotate(${f(range(r, -40, 40))} ${f(x)} ${f(y)})"/>`;
  }
  s += `<path d="${blob(-4, -12, 10, 6.5, 0.2, r, 8)}" fill="url(#o-chk)" stroke="#3E1608" stroke-width="1"/>`;
  s += '<path d="M-12 -4Q-4 -14 4 -7T14 -10" fill="none" stroke="#4A230E" stroke-width="2.2" stroke-linecap="round"/>';
  return s;
}
function spoonSvg() {
  const { x, y, rot, s, len } = SPOON;
  const tf = `translate(${x} ${y}) rotate(${rot}) scale(${s})`;
  return `<g id="o-spoon" class="o-spoon">
    <g class="o-spoonT">
      <g transform="${tf}"><rect class="hit o-hit" x="-34" y="-24" width="${len + 56}" height="48" rx="24"/></g>
      <g class="o-empty">${F.spoon({ p: 'o', x, y, len, rot, s })}</g>
      <g class="o-full">${F.spoon({ p: 'o', x, y, len, rot, s })}<g transform="${tf}">${scoop()}</g></g>
      <g class="o-steam">${F.steam({ p: 'o', x: x - 29, y: y - 24, h: 150, w: 30, n: 2, seed: 4 })}</g>
    </g>
  </g>`;
}

export function inside() {
  const back = close({ surface: 'counter', mood: 'burst', pool: { x: 800, y: 560, rx: 520, ry: 280 } });
  const items = [
    { y: 900, svg: F.biristaCluster({ p: 'p', x: 690, y: 260, w: 260, h: 70, n: 34, seed: 2 }) },
    { y: 900, svg: F.biristaCluster({ p: 'p', x: 950, y: 330, w: 220, h: 70, n: 26, seed: 3 }) },
    { y: 901, svg: F.biristaCluster({ p: 'p', x: 780, y: 410, w: 180, h: 40, n: 16, seed: 4 }) },
    { y: 902, svg: Array.from({ length: 14 }, (_, i) => F.mintLeaf({ p: 'p', x: 520 + ((i * 131) % 560), y: 250 + ((i * 71) % 230), len: 38, rot: i * 67, seed: i + 1 })).join('') },
  ];
  const potP = plane('p-pot', 0.55, `${F.foodDefs('p')}
${F.handi({ p: 'p', cx: 800, cy: 330, w: 800, tilt: 0.6, seed: 6, saffron: 0.35, items })}
${F.glisten({ x: 760, y: 440, w: 380, h: 150, n: 18, seed: 2 })}
${F.steam({ p: 'p', x: 800, y: 300, h: 300, w: 160, n: 6, seed: 3 })}`);
  const serve = plane('o-serve', 0.62, `${F.foodDefs('o')}
<style>
  #o-serve .o-hit{fill:transparent;pointer-events:all}
  #o-serve .o-full{opacity:0;transition:opacity .4s}
  #o-serve .o-steam{opacity:0;transition:opacity .8s}
  #o-serve #o-spoon[data-scoop] .o-full{opacity:1}
  #o-serve #o-spoon[data-scoop] .o-empty{opacity:0;transition:opacity .4s}
  #o-serve #o-spoon[data-scoop] .o-steam{opacity:1}
</style>${spoonSvg()}`, { label: 'The serving spoon, standing at the side of the pot' });
  // The stone counter is cold; a saffron bloom from the pot warms it (the burst light, carried into this shot).
  const bloom = plane('o-bloom', 0.5, `<defs>${radial('o-bloomG', [[0, '#FFD27A', 0.85], [0.35, '#F2A516', 0.45], [0.7, '#B8693A', 0.14], [1, '#B8693A', 0]])}</defs>
<ellipse cx="800" cy="600" rx="660" ry="390" fill="url(#o-bloomG)" style="mix-blend-mode:screen"/>`);
  return { planes: [...back.planes, bloom, potP, serve, back.front] };
}
