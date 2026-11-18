// Art for chapter III, The Layers: one close shot into the open copper handi, with the chicken masala from the last
// chapter at the bottom. Round it: a steel pot of part-cooked rice with its ladle (front left), a steel cup of saffron
// milk (right), mint and fried onion on plates, and a bowl of ghee with its spoon (front).
// Everything the chapter reveals is in the picture from the start, hidden: the three rice layers (#ly-l1..3) with their
// falling grains (#ly-f1..3) and steam puffs (#ly-p1..3), the mint leaves (#ly-mint), the onion curls (#ly-curls) and the
// ghee sheen (#ly-ghee). Chapter logic is in js/chapters/layers.js, which adds the classes and the saffron streaks.
// Every touchable sits between x 640 and 1000 world, so it stays on screen on a phone once the camera pushes in.
import { close } from './close.js';
import * as F from './food.js';
import { plane, rng, range, pick, f, blob, radial } from './lib.js';

export const POT = { cx: 760, cy: 250, w: 620, tilt: 0.6 };
export const IN = F.handiInside(POT.w, POT.tilt, POT.cx, POT.cy); // the pot's interior ellipse { cx, cy, rx, ry }
export const LADLE = { x: 700, y: 672 };
export const RICE_POT = { cx: 700, cy: 690, w: 300 };
export const CUP = { x: 1030, y: 470 };
export const MINT = { x: 975, y: 700, w: 220 };
export const ONION = { x: 975, y: 840, w: 200 };
export const GHEE = { x: 740, y: 822 };
export const LAYER_COUNT = [500, 680, 860]; // grains per rice layer: they stack to a full top (kept low: the chapter stays under 5000 elements)

const IVORY = ['#F6EBD3', '#FBF2DC', '#F1E0BA', '#FFF7E8'];
const ELL = `cx="${f(IN.cx)}" cy="${f(IN.cy)}" rx="${f(IN.rx)}" ry="${f(IN.ry)}"`;

function ricePot() {
  const r = RICE_POT;
  const rx = r.w / 2, ry = rx * 0.45, d = r.w * 0.32;
  const ccx = r.cx, ccy = r.cy + ry * 0.2, crx = rx * 0.84, cry = ry * 0.8; // the bowl's interior
  return F.bowl({ p: 'lh', cx: r.cx, cy: r.cy, w: r.w, fill: 'empty', depth: 0.32, seed: 9 }) +
    F.riceMound({ p: 'lh', cx: ccx, cy: ccy, rx: crx, ry: cry, h: 30, count: 400, grain: 1.05, seed: 12, saffron: 0.15,
      clip: { cx: ccx, cy: ccy, rx: crx, ry: cry } }) +
    ladle();
}

// A flat perforated ladle lying in the rice: a long handle to the left, a head with holes.
function ladle() {
  const { x, y } = LADLE;
  let holes = '';
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3, k = i % 2 ? 0.42 : 0.75;
    holes += `<ellipse cx="${f(x + Math.cos(a) * 60 * k)}" cy="${f(y + Math.sin(a) * 26 * k)}" rx="3.6" ry="2.4" fill="#1E120A" fill-opacity=".85"/>`;
  }
  return `<g id="ly-ladle"><ellipse cx="${x + 8}" cy="${y + 8}" rx="60" ry="26" fill="#0a0405" fill-opacity=".45"/>
<path d="M${x - 50} ${y - 4}L${x - 190} ${y - 40}" stroke="#2A3050" stroke-width="10" stroke-linecap="round"/>
<path d="M${x - 52} ${y - 7}L${x - 186} ${y - 42}" stroke="#E6D6A8" stroke-width="2.6" stroke-linecap="round" opacity=".8"/>
<ellipse class="hit" fill="transparent" cx="${x}" cy="${y}" rx="78" ry="44"/>
<ellipse cx="${x}" cy="${y}" rx="60" ry="26" fill="url(#lh-steelH)" stroke="#2A3050" stroke-width="1.5"/>
${holes}<path d="M${x - 40} ${y - 8}Q${x} ${y - 19} ${x + 36} ${y - 9}" fill="none" stroke="#FFF4D8" stroke-width="2" stroke-linecap="round" opacity=".8"/></g>`;
}

// The masala at the bottom of the pot: rich red-brown, with chicken pieces, fried onion and whole spices showing.
function masala() {
  const r = rng(41);
  let s = `<ellipse ${ELL} fill="url(#ly-mas)"/><ellipse ${ELL} fill="url(#lh-ht)" opacity=".35"/>`;
  for (let i = 0; i < 26; i++) {
    const a = r() * 6.28, k = Math.sqrt(r()) * 0.9;
    s += `<path d="${blob(IN.cx + Math.cos(a) * IN.rx * k, IN.cy + Math.sin(a) * IN.ry * k, range(r, 18, 36), range(r, 8, 15), 0.3, r, 8)}" fill="${pick(r, ['#5A1A0B', '#8E3216', '#B4521E', '#3E1006', '#7A2810'])}" fill-opacity="${f(range(r, 0.5, 0.85))}"/>`;
  }
  [[640, 300, -18, 118, 74], [770, 250, 12, 112, 70], [890, 322, -8, 118, 72], [704, 386, 24, 104, 64], [842, 404, -22, 110, 66]]
    .forEach(([x, y, rot, w, h], i) => { s += F.chicken({ p: 'lh', x, y, w, h, rot, seed: 101 + i, doneness: 0.45 + i * 0.08 }); });
  s += F.biristaCluster({ p: 'lh', x: 700, y: 250, w: 130, h: 36, n: 16, seed: 4 });
  s += F.biristaCluster({ p: 'lh', x: 862, y: 378, w: 140, h: 36, n: 16, seed: 5 });
  s += F.biristaCluster({ p: 'lh', x: 800, y: 330, w: 110, h: 28, n: 10, seed: 6 });
  s += F.spice('cinnamon', { p: 'lh', x: 690, y: 296, rot: -20, s: 0.7 }) + F.spice('cardamom', { p: 'lh', x: 862, y: 282, rot: 10, s: 0.8 })
    + F.spice('clove', { p: 'lh', x: 790, y: 392, rot: 30, s: 0.8 }) + F.spice('bay', { p: 'lh', x: 640, y: 362, rot: 10, s: 0.6 })
    + F.spice('pepper', { p: 'lh', x: 812, y: 268, s: 1.3 }) + F.spice('clove', { p: 'lh', x: 926, y: 380, rot: -40, s: 0.7 });
  s += F.glisten({ x: 760, y: 330, w: 330, h: 120, n: 9, seed: 3 }); // fat on the masala
  return s;
}

// One rice layer: a surface of grains clipped to the pot's interior. The layers stack, so the masala shows less each time.
const layer = (n) => F.riceSurface({ p: 'lh', cx: IN.cx, cy: IN.cy + 2, rx: IN.rx * 0.99, ry: IN.ry * 0.99, h: 10 + n * 5,
  count: LAYER_COUNT[n - 1], grain: 1.35, seed: 40 + n, saffron: 0.45, clip: IN });

// The grains of one layer falling in from above and settling (the chapter adds .on as the layer lands).
function falls(n) {
  const r = rng(70 + n);
  let s = '';
  for (let i = 0; i < 18; i++) {
    const x = IN.cx + range(r, -IN.rx * 0.85, IN.rx * 0.85), y = IN.cy + range(r, -IN.ry * 0.8, IN.ry * 0.8);
    s += `<g class="ly-g" style="--i:${i}"><use href="#lh-g${i % 4}" transform="translate(${f(x)} ${f(y)}) rotate(${f(range(r, 0, 360))}) scale(1.35)" fill="${pick(r, IVORY)}"/></g>`;
  }
  return s;
}

function mintLeaves() {
  const r = rng(91);
  let s = '';
  for (let i = 0; i < 14; i++) {
    const a = r() * 6.28, k = Math.sqrt(r());
    const x = IN.cx + Math.cos(a) * k * IN.rx * 0.8, y = IN.cy + Math.sin(a) * k * IN.ry * 0.72;
    s += `<g class="ly-leaf" style="--i:${i}">${F.mintLeaf({ p: 'lh', x, y, len: 34, rot: range(r, -80, 80), seed: 100 + i })}</g>`;
  }
  return s;
}

function onionCurls() {
  const at = [[712, 330, 120], [860, 230, 110], [820, 420, 130], [640, 420, 90]];
  return at.map(([x, y, w], i) => `<g class="ly-curl" style="--i:${i}">${F.biristaCluster({ p: 'lh', x, y, w, h: 30, n: 14, seed: 60 + i })}</g>`).join('');
}

function insidePlane() {
  return plane('ly-in', 0.52, `<defs>${radial('ly-mas', [[0, '#A4461E'], [0.55, '#7A2A12'], [1, '#3A1208']])}
<filter id="ly-soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="1.4"/></filter>
<clipPath id="ly-in-clip"><ellipse ${ELL}/></clipPath></defs>
<style>
  #ly-in .ly-layer{opacity:0;transform:translateY(-14px);transition:opacity 1s ease,transform 1.1s ease-out}
  #ly-in .ly-layer.on{opacity:1;transform:none}
  #ly-in .ly-g{opacity:0}
  #ly-in .ly-fall.on .ly-g{animation:ly-fall .95s ease-in both;animation-delay:calc(var(--i) * 45ms)}
  @keyframes ly-fall{0%{transform:translateY(-90px);opacity:0}30%{opacity:1}100%{transform:translateY(0);opacity:0}}
  #ly-in .ly-leaf{opacity:0;transform:translateY(-120px) rotate(60deg);transition:transform 1s cubic-bezier(.2,.7,.3,1) calc(var(--i) * 70ms),opacity .5s calc(var(--i) * 70ms)}
  #ly-in .ly-mint.on .ly-leaf{opacity:1;transform:none}
  #ly-in .ly-curl{opacity:0;transform:translateY(-100px);transition:transform .9s cubic-bezier(.2,.7,.3,1) calc(var(--i) * 120ms),opacity .5s calc(var(--i) * 120ms)}
  #ly-in .ly-curls.on .ly-curl{opacity:1;transform:none}
</style>
<g clip-path="url(#ly-in-clip)">${masala()}
${[1, 2, 3].map((n) => `<g class="ly-layer" id="ly-l${n}">${layer(n)}</g><g class="ly-fall" id="ly-f${n}">${falls(n)}</g>`).join('')}
<g id="ly-saf" filter="url(#ly-soft)"></g>
<g id="ly-mint" class="ly-mint">${mintLeaves()}</g>
<g id="ly-curls" class="ly-curls">${onionCurls()}</g>
<g id="ly-ghee"></g>
</g>
<ellipse id="ly-saf-hit" class="hit" fill="transparent" cx="${f(IN.cx)}" cy="${f(IN.cy)}" rx="${f(IN.rx * 1.02)}" ry="${f(IN.ry * 1.04)}"/>`,
  { label: 'The copper pot: the masala at the bottom, the rice going in, the saffron, the mint, the onion and the ghee' });
}

function cupPlane() {
  const { x, y } = CUP; const rx = 48, ry = 18, h = 112;
  return `<g id="ly-cup" style="transform-origin:${x + rx}px ${y}px">
<ellipse cx="${x + 10}" cy="${y + h}" rx="${rx * 1.1}" ry="${ry * 0.7}" fill="#0a0405" fill-opacity=".5"/>
<path d="M${x - rx} ${y}L${f(x - rx * 0.8)} ${y + h}Q${x} ${f(y + h + ry * 0.9)} ${f(x + rx * 0.8)} ${y + h}L${x + rx} ${y}Z" fill="url(#lh-steelH)" stroke="#232845" stroke-width="1.5"/>
<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="url(#lh-steel)" stroke="#232845" stroke-width="1.5"/>
<ellipse cx="${x}" cy="${y + 2}" rx="${f(rx * 0.84)}" ry="${f(ry * 0.8)}" fill="#E0861A"/>
<ellipse cx="${f(x - rx * 0.2)}" cy="${y}" rx="${f(rx * 0.5)}" ry="${f(ry * 0.45)}" fill="#FFD27A" fill-opacity=".6"/>
${[-30, -12, 8, 26].map((dx, i) => `<path d="M${x + dx} ${y + 3}Q${x + dx + 8} ${y - 6 + i} ${x + dx + 2} ${y + 5 + i * 0.4}" fill="none" stroke="#A8480E" stroke-width="1.3" stroke-linecap="round" stroke-opacity=".85"/>`).join('')}
<path d="M${x - rx * 0.7} ${y + 16}L${f(x - rx * 0.6)} ${y + h - 14}" stroke="#FFF3CF" stroke-opacity=".7" stroke-width="4" stroke-linecap="round"/></g>`;
}

function propsPlane() {
  const mint = F.mintLeaf({ p: 'lh', x: MINT.x - 56, y: MINT.y + 8, len: 40, rot: -30, seed: 3 }) + F.mintLeaf({ p: 'lh', x: MINT.x + 10, y: MINT.y - 6, len: 40, rot: 40, seed: 4 })
    + F.mintLeaf({ p: 'lh', x: MINT.x + 30, y: MINT.y + 16, len: 36, rot: 150, seed: 5 });
  return `<defs>${`<linearGradient id="ly-gheeG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FFF0B0"/><stop offset=".5" stop-color="#F5C24E"/><stop offset="1" stop-color="#C98A24"/></linearGradient>`}</defs>
${cupPlane()}
<g id="ly-mint-hot"><ellipse class="hit" fill="transparent" cx="${MINT.x}" cy="${MINT.y}" rx="122" ry="72"/>
${F.smallPlate({ p: 'lh', cx: MINT.x, cy: MINT.y, w: MINT.w })}${mint}</g>
<g id="ly-onion-hot"><ellipse class="hit" fill="transparent" cx="${ONION.x}" cy="${ONION.y}" rx="122" ry="72"/>
${F.smallPlate({ p: 'lh', cx: ONION.x, cy: ONION.y, w: ONION.w })}${F.biristaCluster({ p: 'lh', x: ONION.x, y: ONION.y, w: 130, h: 40, n: 20, seed: 9 })}</g>
<g id="ly-ghee-bowl">${F.bowl({ p: 'lh', cx: GHEE.x, cy: GHEE.y - 10, w: 170, fill: 'empty', depth: 0.3, seed: 11 })}
<ellipse cx="${GHEE.x}" cy="${GHEE.y - 1}" rx="71" ry="30" fill="url(#ly-gheeG)"/>${F.glisten({ x: GHEE.x, y: GHEE.y - 1, w: 120, h: 40, n: 6, seed: 8 })}</g>
<g id="ly-spoon">${F.spoon({ p: 'lh', x: GHEE.x, y: GHEE.y, len: 150, rot: -18, s: 1.05 })}
<ellipse class="hit" fill="transparent" cx="${GHEE.x + 40}" cy="${GHEE.y - 10}" rx="94" ry="48"/></g>`;
}

export default function art() {
  const back = close({ surface: 'counter', mood: 'steam', pool: { x: 760, y: 560, rx: 520, ry: 280 } });
  const ricePlane = plane('ly-rice-pot', 0.42, `${F.foodDefs('lh')}${ricePot()}`, { label: 'The pot of part-cooked rice, with its ladle' });
  const pot = plane('ly-pot', 0.5, F.handi({ p: 'lh', cx: POT.cx, cy: POT.cy, w: POT.w, tilt: POT.tilt, fill: 'empty', seed: 6 }));
  // The puffs of steam rise out of the pot's mouth, above the rim, so they sit in this plane and not in the clipped interior.
  const puffs = [1, 2, 3].map((n) => `<g class="ly-puff" id="ly-p${n}">${F.steam({ p: 'lh', x: 640 + n * 60, y: 300, h: 150, w: 80, n: 2, seed: 20 + n })}</g>`).join('');
  const steam = plane('ly-steam', 0.66, `<style>
  #ly-steam .ly-puff{opacity:0}
  #ly-steam .ly-puff.on{animation:ly-puff 2.4s ease-out both}
  @keyframes ly-puff{0%{opacity:0}25%{opacity:.85}100%{opacity:0}}
</style><g id="ly-steam-top">${F.steam({ p: 'lh', x: POT.cx + 20, y: 200, h: 230, w: 120, n: 5, seed: 8 })}</g>${puffs}`
    + F.steam({ p: 'lh', x: LADLE.x, y: 640, h: 90, w: 50, n: 2, seed: 3 }));
  const props = plane('ly-props', 0.6, propsPlane(), { label: 'Saffron milk, mint, fried onions, ghee and its spoon' });
  return { planes: [...back.planes, ricePlane, pot, insidePlane(), steam, props, back.front] };
}
