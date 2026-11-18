// Art for chapter VII, The Plate: the close shot built on tools/preview-close.html?scene=plate. Planes, back to front:
//   handi (opened pot, lid), side (salan, dahi, tumbler, onion rings), plate (the mound, in portions the chapter
//   hides in order), serving spoon, spoon (the eating spoon, the flying grains, the chicken chunk), then the frame.
// State is driven from the chapter through attributes on #pl-plate: data-eaten 0..5 (portions e0..e4 gone, the dome
// shrinks), data-c0 (the first chicken piece broken), data-refill (the second helping). Chapter logic: chapters/plate.js.
import { close } from './close.js';
import * as F from './food.js';
import { spiceIcon } from './spices.js';
import { plane, blob, rng, range, pick, f } from './lib.js';

export const LAY = {
  mound: { cx: 800, cy: 624, rx: 150, ry: 66, h: 140 },
  rest: { x: 935, y: 668, rot: 14, s: 1.4 }, // the eating spoon's bowl at rest, on the plate's right
  flank: { x: 882, y: 598 }, // the mound's right edge, where the first bite is gathered
  chicken0: { x: 736, y: 585 },
  dahi: { x: 975, y: 522 },
  ladle: { x: 800, y: 352 }, // the serving spoon's bowl end, in the handi
  center: { x: 800, y: 610 },
};

const IVORY = ['#F6EBD3', '#FBF2DC', '#F1E0BA', '#FFF7E8'];
const GOLD = ['#F2A516', '#E8921A', '#F5B93A'];
const BUCKETS = 5;

// The mound's grains get a portion class e0..e4 (or pk: a few that stay on the plate). Order: right flank first (e0),
// the grains around the broken chicken (e1), then the middle (e2), the left (e3), the rest (e4).
function portions(lines, c0) {
  const re = /<use href="#m-g(\d)" transform="translate\(([-\d.]+) ([-\d.]+)\)/g;
  const { cx, cy, rx, ry } = LAY.mound, r = rng(5);
  const pts = [...lines.matchAll(re)].map((m) => ({ x: +m[2], y: +m[3], k: -((+m[2] - cx) / rx) + (r() - 0.5) * 0.3 }));
  const rank = pts.map((_, i) => i).sort((a, b) => pts[a].k - pts[b].k);
  const cls = Array(pts.length), rest = [];
  rank.forEach((i, n) => {
    const q = n / pts.length, p = pts[i];
    if (q < 0.18) cls[i] = 'e0';
    else if (Math.hypot(p.x - c0.x, (p.y - c0.y) * 1.4) < 62) cls[i] = 'e1';
    else if (p.y > cy + ry * 0.3 && r() < 0.14) cls[i] = 'pk';
    else rest.push(i);
  });
  // the rest shrink toward the middle: outermost first
  const rad = (p) => Math.hypot((p.x - cx) / rx, (p.y - (cy - LAY.mound.h * 0.3)) / (ry + LAY.mound.h * 0.5));
  rest.sort((a, b) => rad(pts[b]) - rad(pts[a])).forEach((i, n) => { const q = n / rest.length; cls[i] = q < 0.35 ? 'e2' : q < 0.6 ? 'e3' : 'e4'; });
  let n = 0;
  return lines.replace(re, (m) => `<use class="${cls[n++]}"${m.slice(4)}`);
}

function mound() {
  const { cx, cy, rx, ry, h } = LAY.mound, c0 = LAY.chicken0;
  const e = (cls, svg) => `<g class="${cls}">${svg}</g>`;
  const chk = (x, y, w, h2, rot, seed, extra = {}) => F.chicken({ p: 'm', x, y, w, h: h2, rot, seed, doneness: 0.4 + seed * 0.08, ...extra });
  const items = [
    { y: c0.y + 20, svg: e('e4', `<g class="c0a">${chk(c0.x, c0.y, 98, 68, -22, 1, { bone: true })}</g><g class="c0b">${chk(c0.x + 14, c0.y + 8, 62, 42, 10, 6)}</g>`) },
    { y: 560, svg: e('e2', chk(800, 540, 80, 56, 4, 3)) },
    { y: 600, svg: e('e4', chk(866, 580, 96, 66, 16, 2, { bone: true })) },
    { y: 650, svg: e('e3', chk(905, 632, 74, 52, 30, 4)) },
    { y: 640, svg: e('e2', F.biristaCluster({ p: 'm', x: 800, y: 505, w: 130, h: 36, n: 16, seed: 5 })) },
    { y: 645, svg: e('e4', F.biristaCluster({ p: 'm', x: 735, y: 655, w: 90, h: 24, n: 9, seed: 8 })) },
    ...[[770, 495, -80, 'e2'], [830, 500, -30, 'e3'], [700, 640, 160, 'e4'], [880, 520, 20, 'e0']].map(([x, y, rot, c], i) => ({
      y: 650, svg: e(c, F.mintLeaf({ p: 'm', x, y, len: 38, rot, seed: i + 7 })),
    })),
  ];
  const raw = F.riceMound({ p: 'm', cx, cy, rx, ry, h, count: 1500, seed: 11, saffron: 0.4, grain: 1.05, masala: [[736, 585], [866, 580], [800, 540], [905, 632]].map(([x, y]) => ({ x, y: y + 20, r: 62 })), items });
  const L = raw.split('\n'); // shadow | dome | grains and items | clipPath | shading start | shading end
  return `<g class="dome">${L[0]}${L[1]}</g>${portions(L[2], c0)}<g class="dome">${L.slice(3).join('\n')}</g>`;
}

function refill() {
  const raw = F.riceMound({ p: 'm', cx: 800, cy: 628, rx: 100, ry: 45, h: 80, count: 380, seed: 21, saffron: 0.5, grain: 1.05,
    items: [{ y: 620, svg: F.biristaCluster({ p: 'm', x: 800, y: 585, w: 80, h: 24, n: 9, seed: 12 }) }] });
  return `<g class="refill">${raw}</g>`;
}

const css = (() => {
  let s = '';
  for (let i = 0; i < BUCKETS; i++) for (let n = i + 1; n <= BUCKETS; n++) s += `#pl-plate[data-eaten="${n}"] .e${i},`;
  const dome = ['1,1', '.94,.95', '.86,.88', '.74,.78', '.58,.62'].map((v, n) => `#pl-plate[data-eaten="${n}"] .dome{transform:scale(${v})}`).join('');
  return `#pl-plate .hit{fill:transparent}
#pl-plate .dome>path{fill:#B5803F}
#pl-plate .e0,#pl-plate .e1,#pl-plate .e2,#pl-plate .e3,#pl-plate .e4{transition:opacity .5s}
${s.replace(/,$/, '')}{opacity:0}
${dome}
#pl-plate .dome{transform-origin:800px 668px;transition:transform .7s ease-out,opacity .7s}
#pl-plate[data-eaten="5"] .dome{opacity:0;transform:scale(.4,.2)}
#pl-plate .c0b{opacity:0;transition:opacity .3s}
#pl-plate[data-c0="1"] .c0a{opacity:0}
#pl-plate[data-c0="1"] .c0b{opacity:1}
#pl-plate .refill{opacity:0;transform:scale(.5,.35);transform-origin:800px 650px;transition:transform .9s cubic-bezier(.2,.8,.2,1),opacity .5s}
#pl-plate[data-refill="1"] .refill{opacity:1;transform:none}
#pl-plate[data-eaten="5"] .refill{opacity:0;transform:scale(.5,.3)}
#pl-plate .resid{opacity:0;transition:opacity 1s .3s}
#pl-plate[data-eaten="5"] .resid{opacity:1}
#pl-plate .steam{transition:opacity 1.5s}
#pl-plate[data-eaten="5"] .steam{opacity:.15}`;
})();

// A few masala and saffron smears on the steel: what a plate looks like when it is nearly clean.
function residue() {
  const r = rng(31);
  let s = '';
  for (let i = 0; i < 9; i++) {
    const x = 800 + range(r, -150, 150), y = 625 + range(r, -30, 40);
    s += `<path d="${blob(x, y, range(r, 14, 40), range(r, 3, 8), 0.3, r, 8)}" fill="${pick(r, ['#C5702C', '#B85F26', '#E8921A', '#8A3A18'])}" fill-opacity="${f(range(r, 0.3, 0.55))}"/>`;
  }
  return `<g class="resid">${s}</g>`;
}

export default function art() {
  const back = close({ surface: 'table', mood: 'lamp', pool: { x: 800, y: 640, rx: 430, ry: 190 } });
  const handi = plane('pl-handi', 0.42, `${F.foodDefs('h')}
${F.lid({ p: 'h', cx: 618, cy: 300, r: 100, lean: -14 })}
${F.handi({ p: 'h', cx: 800, cy: 285, w: 300, tilt: 0.5, seed: 4, count: 600, items: [
    { y: 300, svg: F.biristaCluster({ p: 'h', x: 790, y: 290, w: 140, h: 34, n: 14, seed: 2 }) },
    { y: 305, svg: [0, 1, 2, 3, 4].map((i) => F.mintLeaf({ p: 'h', x: 730 + i * 34, y: 292 + (i % 2) * 12, len: 28, rot: -60 + i * 40, seed: i + 3 })).join('') },
  ] })}
${F.doughBits({ p: 'h', cx: 1010, cy: 410, n: 4, spread: 60, seed: 3 })}
${F.steam({ p: 'h', x: 800, y: 250, h: 230, w: 60, n: 4, seed: 6 })}`);
  const side = plane('pl-side', 0.5, `${F.foodDefs('b')}
${F.tumbler({ p: 'b', cx: 440, cy: 470, w: 84, h: 130 })}
${F.bowl({ p: 'b', cx: 618, cy: 500, w: 130, fill: 'salan', seed: 2 })}
${F.bowl({ p: 'b', cx: LAY.dahi.x, cy: 500, w: 130, fill: 'dahi', seed: 3 })}
<style>#pl-side .hit{fill:transparent}</style><g id="pl-dahi"><ellipse class="hit" cx="${LAY.dahi.x}" cy="${LAY.dahi.y - 8}" rx="66" ry="44"/><ellipse class="pl-ripple" cx="${LAY.dahi.x}" cy="${LAY.dahi.y + 4}" rx="40" ry="14" fill="none" stroke="#fff" stroke-width="3" opacity="0"/></g>
${F.smallPlate({ p: 'b', cx: 1250, cy: 730, w: 230 })}
${F.onionRings({ p: 'b', cx: 1215, cy: 725, n: 5, seed: 2 })}
${F.lemonWedge({ p: 'b', x: 1305, y: 750, s: 0.85, rot: 14 })}`, { label: 'Salan, dahi chutney and water beside the plate' });

  const hit = (id, x, y, rx, ry) => `<g id="${id}"><ellipse class="hit" cx="${x}" cy="${y}" rx="${rx}" ry="${ry}"/></g>`;
  const plate = plane('pl-plate', 0.62, `${F.foodDefs('m')}<style>${css}
#pl-plate .steam .m-wisp{}</style>
${F.plate({ p: 'm', cx: 800, cy: 610, w: 440 })}
<ellipse cx="800" cy="560" rx="300" ry="200" fill="url(#m-glow)" opacity=".7" style="mix-blend-mode:screen"/>
${residue()}
${mound()}
${refill()}
${F.glisten({ x: 780, y: 565, w: 260, h: 110, n: 22, seed: 4 })}
${F.lemonWedge({ p: 'm', x: 676, y: 688, s: 0.8, rot: -10 })}
<g class="steam">${F.steam({ p: 'm', x: 800, y: 470, h: 210, w: 70, n: 4, seed: 9 })}</g>
${hit('pl-h1', LAY.flank.x, LAY.flank.y, 58, 46)}
${hit('pl-h2', LAY.chicken0.x, LAY.chicken0.y, 64, 48)}
${hit('pl-h3', 800, 575, 120, 70)}
${hit('pl-h6', 800, 625, 150, 62)}`, { label: 'The plate of biryani' });

  const { x: lx, y: ly } = LAY.ladle;
  const ladleRice = Array.from({ length: 16 }, (_, i) => `<use href="#s-g${i % 4}" transform="translate(${f(lx + (i % 8) * 5 - 18)} ${f(ly - 8 - Math.floor(i / 8) * 4)}) rotate(${i * 47}) scale(.8)" fill="${i % 4 ? IVORY[i % 4] : GOLD[0]}"/>`).join('');
  const ss = plane('pl-ssP', 0.66, `${F.foodDefs('s')}<style>#pl-ssP .hit{fill:transparent}</style>
<g id="pl-ss"><g class="pl-ssT" style="transform-origin:${lx}px ${ly}px">
<ellipse cx="${lx}" cy="${ly + 3}" rx="26" ry="11" fill="url(#s-steel)" stroke="#2A3050" stroke-width="1.5"/>${ladleRice}
${F.servingSpoon({ p: 's', x: lx, y: ly, len: 200, rot: 8 })}
<rect class="hit" x="${lx - 40}" y="${ly - 215}" width="90" height="240" rx="30"/></g></g>`, { label: 'The serving spoon in the pot' });

  // The eating spoon. Its contents show through data-has tokens (rice chk onion dahi spice) and --g (the rice heap).
  const { x, y, rot, s } = LAY.rest, rr = rng(77);
  let rice = '';
  for (let i = 0; i < 70; i++) {
    const gx = range(rr, -22, 22), gy = 0 - Math.sqrt(Math.max(0, 1 - (gx / 25) ** 2)) * range(rr, 0, 11);
    const col = rr() < 0.3 ? pick(rr, GOLD) : pick(rr, IVORY);
    rice += `<use href="#n-g${Math.floor(rr() * 4)}" transform="translate(${f(gx)} ${f(gy)}) rotate(${f(range(rr, -50, 50) + gx * 2)}) scale(.5)" fill="${col}"/>`;
  }
  const inner = `${F.spoon({ p: 'n', x: 0, y: 0, len: 150 })}
<g class="b-rice">${rice}</g>
<g class="b-chk">${F.chicken({ p: 'n', x: 3, y: -9, w: 25, h: 17, rot: -10, seed: 5, doneness: 0.55 })}</g>
<g class="b-onion"><path d="M-12-3Q-4-12 4-5T14-9" fill="none" stroke="#4A230E" stroke-width="2.6" stroke-linecap="round"/><path d="M-12-4Q-4-13 4-6T14-10" fill="none" stroke="#D79A3C" stroke-width="1" stroke-linecap="round"/></g>
<g class="b-dahi"><path d="${blob(3, -11, 17, 9, 0.18, rng(3), 9)}" fill="url(#n-curd)" stroke="#C8CEDF" stroke-width="1.2"/><ellipse cx="-3" cy="-15" rx="6" ry="2.4" fill="#fff" fill-opacity=".85"/><ellipse cx="9" cy="-9" rx="2.4" ry="1.4" fill="#6FA650"/><rect x="-6" y="-8" width="3" height="2" rx=".6" fill="#D79AB8"/></g>
<g class="b-spice" transform="translate(-8 -20) scale(1)"></g>
<circle class="b-ring" r="16" cx="-2" cy="-12" fill="none" stroke="#FFD27A" stroke-width="2" opacity="0"/>
<g class="b-steam">${F.steam({ p: 'n', x: 0, y: -14, h: 70, w: 24, n: 2, seed: 3 })}</g>`;
  const spoon = plane('pl-spoonP', 0.66, `${F.foodDefs('n')}<style>
#pl-spoonP .hit{fill:transparent}
#pl-spoonP .b-rice{opacity:var(--g,0);transform:scale(calc(.5 + .5 * var(--g,0)))}
#pl-spoonP .b-chk,#pl-spoonP .b-onion,#pl-spoonP .b-dahi,#pl-spoonP .b-spice,#pl-spoonP .b-steam{opacity:0;transform:scale(.6);transform-box:fill-box;transform-origin:50% 100%;transition:opacity .3s,transform .3s}
#pl-spoonP [data-has~="chk"] .b-chk,#pl-spoonP [data-has~="onion"] .b-onion,#pl-spoonP [data-has~="dahi"] .b-dahi,#pl-spoonP [data-has~="spice"] .b-spice,#pl-spoonP [data-has~="hot"] .b-steam{opacity:1;transform:none}
#pl-spoonP .pl-spm{transition:transform .35s cubic-bezier(.3,.1,.2,1)}
#pl-spoonP .pl-spm.live{transition:none}
</style>
<g id="pl-chunk" style="opacity:0">${F.chicken({ p: 'n', x: 0, y: 0, w: 40, h: 28, rot: 20, seed: 9 })}</g>
<g id="pl-sp" data-has=""><g class="pl-spm"><g transform="translate(${x} ${y}) rotate(${rot}) scale(${s})">${inner}</g>
<g id="pl-h4s"><ellipse class="hit" cx="${x + 20}" cy="${y + 8}" rx="70" ry="40" transform="rotate(${rot} ${x} ${y})"/></g></g></g>
<g id="pl-fx"></g>`, { label: 'The spoon' });
  return { planes: [...back.planes, handi, side, plate, ss, spoon, back.front] };
}

// Markup for a whole spice on the spoon (the spice's own icon, as a nested svg).
// Scaled to about half the bowl and seated on the rice at the bowl's middle (the CSS on .b-spice overrides the group's
// own transform, so the placement lives here); the cream halo sits behind it.
export const spiceMarkup = (id) => '<g transform="translate(-2 -9) scale(.55)"><circle r="30" fill="#FFE9B0" fill-opacity=".55"/>' + spiceIcon(id).replace('<svg ', '<svg x="-24" y="-24" width="48" height="48" overflow="visible" ') + '</g>';
