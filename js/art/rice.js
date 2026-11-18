// Art for chapter VI, The Rice. One close shot down on the counter: a big steel pot of water on a lit burner, the
// tray of whole spices from chapter I (left front), a bowl of soaked rice (right front), salt and oil (right back), the
// clock (left back), a slotted spoon standing in the pot and a colander on the sink side (far right). The steam hangs
// over the pot. The spices, the rice, the bubbles and the drain are in the picture from the start, hidden until the
// chapter reveals them (classes on #rc-* set in js/chapters/rice.js). A grain for the bite test is drawn large in a
// loupe above the pot. Every touchable sits between x 560 and 1040 world, so it stays on screen on a phone once the
// camera pushes in.
import { close } from './close.js';
import * as F from './food.js';
import { plane, rng, range, f, linear, radial } from './lib.js';

// Every touchable sits inside x 580..1020 world: on a 390 px phone the camera keeps a target at its screen place, so
// anything further out is off the screen. The pot is the hero and sits centre.
export const POT = { cx: 780, cy: 410, rx: 190, ry: 76, bottom: 662 };
export const WATER = { cx: 780, cy: 420, rx: 174, ry: 62 };
// The pot tips about its right rim, so the water runs out of the spout and down to the colander.
export const TIP_PIVOT = { x: 962, y: 432 };
export const TIP_DEG = 62;
export const KNOB = { x: 690, y: 748 };
export const TRAY = { x: 700, y: 860 };
export const BOWL = { x: 900, y: 880 };
export const SALT = { x: 1000, y: 470 };
export const OIL = { x: 1000, y: 580 };
export const SLOT = { x: 870, y: 448 };
export const CLOCK = { x: 600, y: 250 };
export const LOUPE = { x: 800, y: 240, r: 118 };
export const COLANDER = { x: 1040, y: 650 };
export const POT_KINDS = ['cardamom', 'cardamom', 'cardamom', 'cardamom', 'clove', 'clove', 'clove', 'clove', 'cinnamon', 'bay'];
export const TRAY_KINDS = ['cardamom', 'cardamom', 'cardamom', 'cardamom', 'clove', 'clove', 'clove', 'clove', 'cinnamon', 'bay'];

const WATER_CLIP = { cx: WATER.cx, cy: WATER.cy, rx: WATER.rx, ry: WATER.ry };
const JEERA = '#8A6A3A', MACE = '#B8402A';

// Whole spices scattered in a lens (cx, cy, rx, ry), each with a seeded angle. `drop` is how far above they start.
function scatter(kinds, seed, cx, cy, rx, ry, s, drop) {
  const r = rng(seed);
  return kinds.map((k, i) => {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.8;
    const x = cx + Math.cos(a) * rx * d, y = cy + Math.sin(a) * ry * d;
    return `<g class="rc-sp" style="--i:${i};--fx:${f(range(r, -24, 24))}px;--fy:${f(drop)}px"><g class="rc-swirl" style="animation-delay:${f(-r() * 5)}s">${F.spice(k, { p: 'rc', x, y, rot: range(r, -80, 80), s })}</g></g>`;
  }).join('');
}
// Shahi jeera seeds and a blade of mace, scattered in the same lens.
function seedsAndMace(seed, cx, cy, rx, ry, drop) {
  const r = rng(seed);
  let s = '';
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.7;
    s += `<ellipse cx="${f(cx + Math.cos(a) * rx * d)}" cy="${f(cy + Math.sin(a) * ry * d)}" rx="${f(range(r, 2, 3.2))}" ry="${f(range(r, 1, 1.6))}" fill="${JEERA}" fill-opacity=".9" transform="rotate(${f(range(r, 0, 180))})"/>`;
  }
  const mace = `<path d="M0 0Q10-6 22 0Q10 6 0 0Z" fill="${MACE}" stroke="#5A1A0E" stroke-width=".8" transform="translate(${f(cx + rx * 0.3)} ${f(cy - ry * 0.2)}) rotate(20)"/>`;
  return `<g class="rc-sp" style="--i:10;--fx:0px;--fy:${f(drop)}px">${s}${mace}</g>`;
}
// Grains of rice in a small ellipse (the spoon's load, the falls).
function grains(cx, cy, rx, ry, n, seed) {
  const r = rng(seed); let s = '';
  for (let i = 0; i < n; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r());
    s += `<use href="#rc-g${i % 4}" fill="#FBF2DC" transform="translate(${f(cx + Math.cos(a) * rx * d)} ${f(cy + Math.sin(a) * ry * d)}) rotate(${f(range(r, 0, 180))})"/>`;
  }
  return s;
}

function stovePlane() {
  let flames = '';
  for (let i = 0; i < 16; i++) { // tongues rising from the burner ring, most of them hidden behind the pot
    const a = Math.PI * (0.02 + (i / 15) * 0.96);
    const x = 780 - Math.cos(a) * 196, y = 688 + Math.sin(a) * 4, h = 40 + (i % 3) * 14;
    flames += `<path d="M${f(x - 10)} ${f(y)}Q${f(x - 4)} ${f(y - h * 0.5)} ${f(x + 1)} ${f(y - h)}Q${f(x + 6)} ${f(y - h * 0.45)} ${f(x + 10)} ${f(y)}Z" fill="url(#rc-fl)" opacity=".92"/>`;
  }
  const k = KNOB;
  return plane('rc-stove', 0.36, `<defs>${linear('rc-iron', [[0, '#3E3646'], [1, '#141218']])}
${linear('rc-fl', [[0, '#FFD27A'], [0.45, '#F2A516'], [1, '#3A5FC0', 0.85]], { x1: 0, y1: 0, x2: 0, y2: 1 })}</defs>
<ellipse cx="780" cy="700" rx="330" ry="72" fill="url(#rc-iron)" stroke="#0A080C" stroke-width="3"/>
<ellipse cx="780" cy="670" rx="170" ry="36" fill="#1A1420"/>
<g id="rc-flame" class="rc-flame">${flames}</g>
<path d="M452 700L1108 700L1108 806Q1108 818 1096 818L464 818Q452 818 452 806Z" fill="url(#rc-iron)" stroke="#0A080C" stroke-width="3"/>
<path d="M470 732H1090" stroke="#F6EBD3" stroke-opacity=".12" stroke-width="2"/>
<g id="rc-knob-g"><circle cx="${k.x}" cy="${k.y}" r="30" fill="#2A2632" stroke="#C9B48A" stroke-width="3"/>
<circle cx="${k.x}" cy="${k.y}" r="19" fill="#3A3444"/>
<path d="M${k.x} ${k.y - 12}L${k.x} ${k.y - 24}" stroke="#F2A516" stroke-width="5" stroke-linecap="round"/></g>
<ellipse id="rc-knob" class="hit" fill="transparent" cx="${k.x}" cy="${k.y}" rx="66" ry="62"/>
<style>#rc-stove #rc-flame{opacity:0;transition:opacity .6s}</style>`,
  { label: 'The burner under the pot, with its flame knob' });
}

function clockPlane() {
  const { x, y } = CLOCK;
  let ticks = '';
  for (let i = 0; i < 5; i++) {
    const a = (i / 5) * Math.PI * 2;
    ticks += `<path d="M${f(x + Math.sin(a) * 33)} ${f(y - Math.cos(a) * 33)}L${f(x + Math.sin(a) * 39)} ${f(y - Math.cos(a) * 39)}" stroke="#2A1810" stroke-width="2.4" stroke-linecap="round"/>`;
  }
  return plane('rc-clock', 0.5, `<style>#rc-clockg{opacity:0;transition:opacity .8s} #rc-clockg.on{opacity:1} #rc-hand{transition:transform .25s linear}</style>
<g id="rc-clockg">
<circle cx="${x}" cy="${y}" r="50" fill="#1A1D30" stroke="#B8693A" stroke-width="6"/>
<circle cx="${x}" cy="${y}" r="42" fill="#F6EBD3"/>${ticks}
<g id="rc-hand" style="transform-origin:${x}px ${y}px"><path d="M${x} ${y + 4}L${x} ${y - 30}" stroke="#2A1810" stroke-width="3.5" stroke-linecap="round"/></g>
<circle cx="${x}" cy="${y}" r="4" fill="#A33B2C"/>
<text x="${x}" y="${y + 80}" text-anchor="middle" font-family="Literata, Georgia, serif" font-size="24" fill="#F6EBD3">5 min on high</text></g>`);
}

function potPlane() {
  const { cx, cy, rx, ry, bottom } = POT;
  const body = `M${cx - rx} ${cy}C${cx - rx + 2} 520 ${cx - rx + 8} 600 ${cx - rx + 40} 636Q${cx} ${bottom + 14} ${cx + rx - 40} 636C${cx + rx - 8} 600 ${cx + rx - 2} 520 ${cx + rx} ${cy}Z`;
  const r = rng(33);
  let bubbles = '';
  for (let i = 0; i < 34; i++) {
    const x = WATER.cx - WATER.rx * 0.9 + r() * WATER.rx * 1.8, y = WATER.cy - 24 + r() * 56;
    bubbles += `<use href="#rc-bub" class="rc-b" x="${f(x)}" y="${f(y)}" width="12" height="12" style="--i:${i}"/>`;
  }
  let salt = '';
  for (let i = 0; i < 16; i++) {
    const a = r() * Math.PI * 2, d = Math.sqrt(r()) * 0.9;
    salt += `<circle cx="${f(WATER.cx + Math.cos(a) * WATER.rx * d)}" cy="${f(WATER.cy + Math.sin(a) * WATER.ry * d)}" r="${f(range(r, 1.2, 2.2))}" fill="#FFFFFF" fill-opacity=".9"/>`;
  }
  const rice = F.riceSurface({ p: 'rc', cx: WATER.cx, cy: WATER.cy + 4, rx: WATER.rx - 8, ry: WATER.ry - 6, h: 12, count: 360, grain: 1.05, seed: 21, saffron: 0.06, clip: WATER_CLIP });
  return plane('rc-pot', 0.5, `${F.foodDefs('rc')}
<defs><symbol id="rc-bub" viewBox="0 0 12 12"><circle cx="6" cy="6" r="5.5" fill="#FFF8E6" fill-opacity=".45" stroke="#FFFFFF" stroke-opacity=".9" stroke-width="1.3"/><circle cx="4" cy="4" r="1.3" fill="#FFFFFF"/></symbol>
${linear('rc-body', [[0, '#F4F0E6'], [0.3, '#B9BCC6'], [0.7, '#6A6E7E'], [1, '#2A2D3A']], { x1: 0, y1: 0, x2: 1, y2: 0 })}
${linear('rc-water', [[0, '#8FB3C4', 0.95], [0.6, '#6C8E9E', 0.97], [1, '#3E5A6A', 1]])}
${radial('rc-wl', [[0, '#FFF6DC', 0.5], [1, '#FFF6DC', 0]])}
<clipPath id="rc-wclip"><ellipse cx="${WATER.cx}" cy="${WATER.cy}" rx="${WATER.rx}" ry="${WATER.ry}"/></clipPath>
<style>
  #rc-pot .rc-b{animation:rc-pop 1.3s ease-in infinite;animation-delay:calc(var(--i) * -0.05s);transform-box:fill-box;transform-origin:50% 50%}
  @keyframes rc-pop{0%{transform:translateY(16px) scale(.4);opacity:0}30%{opacity:.9}100%{transform:translateY(-26px) scale(1.25);opacity:0}}
  #rc-pot #rc-bubbles{opacity:0;transition:opacity 1.2s}
  #rc-pot #rc-rice{opacity:0;transition:opacity 1.2s}
  #rc-pot #rc-rice.on{opacity:1}
  #rc-pot #rc-rice.out{opacity:0;transition:opacity .9s}
  #rc-pot #rc-tint{opacity:0;transition:opacity 1.5s}
  #rc-pot #rc-tint.on{opacity:.3}
  #rc-pot #rc-spices.out{opacity:0;transition:opacity 1s}
  #rc-pot #rc-saltdots{opacity:0}
  #rc-pot #rc-saltdots.on{animation:rc-dissolve 3.2s ease-out forwards}
  @keyframes rc-dissolve{0%{opacity:1}100%{opacity:.12}}
  #rc-pot #rc-sheen{opacity:0;transition:opacity 1.2s}
  #rc-pot #rc-sheen.on{opacity:.9}
  #rc-pot #rc-spices .rc-sp{opacity:0}
  #rc-pot #rc-spices.on .rc-sp{animation:rc-drop 1.1s ease-in both;animation-delay:calc(var(--i) * 90ms)}
  @keyframes rc-drop{0%{transform:translate(var(--fx),var(--fy));opacity:0}30%{opacity:1}100%{transform:translate(0,0);opacity:1}}
  #rc-pot .rc-swirl{transform-box:fill-box;transform-origin:50% 50%;animation:rc-swirl 5s ease-in-out infinite}
  @keyframes rc-swirl{0%{transform:rotate(-14deg)}50%{transform:rotate(14deg)}100%{transform:rotate(-14deg)}}
  #rc-potg{transition:transform 1.4s ease-in-out}
</style></defs>
<g id="rc-potg" style="transform-origin:${TIP_PIVOT.x}px ${TIP_PIVOT.y}px">
<ellipse cx="${cx + 14}" cy="${bottom + 22}" rx="${rx * 1.2}" ry="${ry * 0.75}" fill="url(#rc-shad)" opacity=".9"/>
<path d="${body}" fill="url(#rc-body)" stroke="#232845" stroke-width="1.5"/>
<path d="M${cx - rx + 14} 470C${cx - rx + 18} 560 ${cx - rx + 60} 620 ${cx - rx + 110} 640" fill="none" stroke="#FFF3CF" stroke-opacity=".6" stroke-width="7" stroke-linecap="round"/>
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#rc-steel)" stroke="#232845" stroke-width="1.5"/>
<ellipse cx="${cx}" cy="${cy + 2}" rx="${rx * 0.9}" ry="${ry * 0.9}" fill="url(#rc-steelIn)"/>
<ellipse cx="${WATER.cx}" cy="${WATER.cy}" rx="${WATER.rx}" ry="${WATER.ry}" fill="url(#rc-water)"/>
<g clip-path="url(#rc-wclip)">
<ellipse cx="${WATER.cx - 60}" cy="${WATER.cy - 30}" rx="150" ry="36" fill="url(#rc-wl)"/>
<ellipse id="rc-tint" cx="${WATER.cx}" cy="${WATER.cy}" rx="${WATER.rx}" ry="${WATER.ry}" fill="#D9962A"/>
<g id="rc-bubbles">${bubbles}</g>
<g id="rc-rice">${rice}</g>
<g id="rc-saltdots">${salt}</g>
<g id="rc-sheen">${F.glisten({ x: WATER.cx, y: WATER.cy - 4, w: 300, h: 120, n: 12, seed: 5 })}</g>
<g id="rc-spices">${scatter(POT_KINDS, 51, WATER.cx, WATER.cy, WATER.rx * 0.8, WATER.ry * 0.8, 0.9, -70)}${seedsAndMace(52, WATER.cx, WATER.cy + 6, WATER.rx * 0.7, WATER.ry * 0.7, -60)}</g>
</g>
<ellipse cx="${cx}" cy="${cy + 2}" rx="${rx * 0.97}" ry="${ry * 0.97}" fill="none" stroke="#FFF8E0" stroke-opacity=".5" stroke-width="2"/>
<path d="M${f(cx - rx * 0.97)} ${f(cy - ry * 0.18)}A${f(rx * 0.97)} ${f(ry * 0.97)} 0 0 1 ${f(cx - rx * 0.28)} ${f(cy - ry * 0.93)}" fill="none" stroke="#FFF8E0" stroke-width="3.4" stroke-linecap="round"/>
<ellipse id="rc-pot-hit" class="hit" fill="transparent" cx="${cx}" cy="${cy + 80}" rx="${rx + 60}" ry="${ry + 110}"/>
</g>`, { label: 'The steel pot of water on the burner, with the spices in it and the rice going in' });
}

function steamPlane() {
  return plane('rc-steam', 0.62, `<style>#rc-steamg{opacity:0;transition:opacity 1.5s}</style><g id="rc-steamg">${F.steam({ p: 'rc', x: 780, y: 350, h: 150, w: 120, n: 5, seed: 8 })}</g>`);
}

function colanderPlane() {
  const { x, y } = COLANDER;
  let holes = '';
  for (let i = 0; i < 16; i++) {
    const a = (i / 16) * Math.PI * 2;
    holes += `<ellipse cx="${f(x + Math.cos(a) * 56)}" cy="${f(y + Math.sin(a) * 15)}" rx="4" ry="2.4" fill="#1E120A" fill-opacity=".8"/>`;
  }
  return plane('rc-colander', 0.5, `<style>
  #rc-colander #rc-pile{opacity:0;transition:opacity 1.2s .4s}
  #rc-colander #rc-pile.on{opacity:1}
  #rc-colander #rc-col-steam{opacity:0;transition:opacity 1.2s}
  #rc-colander #rc-col-steam.on{opacity:1}
  #rc-colander #rc-pour{opacity:0;transition:opacity .4s}
  #rc-colander #rc-pour.on{opacity:.95}
</style>
<ellipse cx="${x + 10}" cy="${y + 96}" rx="92" ry="22" fill="#0a0405" fill-opacity=".45"/>
<path d="M${x - 80} ${y}Q${x - 78} ${y + 84} ${x - 50} ${y + 100}Q${x} ${y + 116} ${x + 50} ${y + 100}Q${x + 78} ${y + 84} ${x + 80} ${y}Z" fill="url(#rc-steelH)" stroke="#232845" stroke-width="1.5"/>
<ellipse cx="${x}" cy="${y}" rx="80" ry="26" fill="url(#rc-steel)" stroke="#232845" stroke-width="1.5"/>
<ellipse cx="${x}" cy="${y + 2}" rx="72" ry="22" fill="url(#rc-steelIn)"/>
${holes}
<path d="M${x - 70} ${y - 6}A80 26 0 0 1 ${x - 20} ${y - 25}" fill="none" stroke="#FFF8E0" stroke-width="2.6" stroke-linecap="round"/>
<g id="rc-pile">${F.riceMound({ p: 'rc', cx: x, cy: y - 6, rx: 66, ry: 20, h: 24, count: 200, grain: 1.0, seed: 31, saffron: 0.08, clip: { cx: x, cy: y, rx: 72, ry: 22 } })}</g>
<path id="rc-pour" d="M962 440Q1004 520 1030 606" fill="none" stroke="#F6EBD3" stroke-width="10" stroke-linecap="round" stroke-opacity=".7"/>
<g id="rc-col-steam">${F.steam({ p: 'rc', x, y: y - 20, h: 130, w: 70, n: 3, seed: 4 })}</g>`);
}

function propsPlane() {
  let falls = '';
  const fr = rng(70);
  for (let i = 0; i < 16; i++) {
    const x = WATER.cx + range(fr, -120, 120), y = WATER.cy - 50 + range(fr, -26, 26);
    falls += `<g class="rc-fg" style="--i:${i}"><use href="#rc-g${i % 4}" fill="#FBF2DC" transform="translate(${f(x)} ${f(y)}) rotate(${f(range(fr, 0, 360))}) scale(1.3)"/></g>`;
  }
  const bowl = F.bowl({ p: 'rc', cx: BOWL.x, cy: BOWL.y, w: 210, fill: 'empty', depth: 0.3, seed: 9 });
  const rice = F.riceSurface({ p: 'rc', cx: BOWL.x, cy: BOWL.y + 4, rx: 86, ry: 34, h: 16, count: 170, grain: 0.85, seed: 15, saffron: 0.04, clip: { cx: BOWL.x, cy: BOWL.y + 4, rx: 86, ry: 34 } });
  const spoon = `<g id="rc-slot-g">
<path d="M${SLOT.x + 22} ${SLOT.y + 16}L${SLOT.x + 110} ${SLOT.y - 130}" stroke="#2A3050" stroke-width="13" stroke-linecap="round"/>
<path d="M${SLOT.x + 22} ${SLOT.y + 16}L${SLOT.x + 110} ${SLOT.y - 130}" stroke="#D8DCE6" stroke-width="8" stroke-linecap="round"/>
<path d="M${SLOT.x + 20} ${SLOT.y + 12}L${SLOT.x + 60} ${SLOT.y - 40}" stroke="#FFFFFF" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>
<ellipse cx="${SLOT.x}" cy="${SLOT.y}" rx="36" ry="25" fill="url(#rc-steel)" stroke="#2A3050" stroke-width="1.5" transform="rotate(-20 ${SLOT.x} ${SLOT.y})"/>
${[[-14, -6], [4, -8], [16, 2], [-6, 4], [8, 8], [-18, 6]].map(([dx, dy]) => `<ellipse cx="${SLOT.x + dx}" cy="${SLOT.y + dy}" rx="3.4" ry="2.2" fill="#2A3050" fill-opacity=".85"/>`).join('')}
<g id="rc-spoon-grains">${grains(SLOT.x, SLOT.y, 26, 14, 9, 88)}</g>
<ellipse id="rc-slot" class="hit" fill="transparent" cx="${SLOT.x}" cy="${SLOT.y}" rx="66" ry="56"/>
</g>`;
  const sx = SALT.x, ox = OIL.x;
  const salt = `<g id="rc-salt-g"><ellipse cx="${sx}" cy="${SALT.y + 36}" rx="26" ry="8" fill="#0a0405" fill-opacity=".4"/>
<path d="M${sx - 22} ${SALT.y - 20}Q${sx - 22} ${SALT.y - 40} ${sx} ${SALT.y - 40}Q${sx + 22} ${SALT.y - 40} ${sx + 22} ${SALT.y - 20}L${sx + 22} ${SALT.y + 24}Q${sx + 22} ${SALT.y + 36} ${sx} ${SALT.y + 36}Q${sx - 22} ${SALT.y + 36} ${sx - 22} ${SALT.y + 24}Z" fill="#EEF2F4" stroke="#4A4C58" stroke-width="1.5"/>
<rect x="${sx - 16}" y="${SALT.y - 52}" width="32" height="16" rx="4" fill="url(#rc-steelH)" stroke="#2A3050" stroke-width="1"/>
${[-8, 0, 8].map((dx) => `<circle cx="${sx + dx}" cy="${SALT.y - 46}" r="1.6" fill="#2A3050"/>`).join('')}
<ellipse cx="${sx - 6}" cy="${SALT.y - 6}" rx="5" ry="16" fill="#FFFFFF" fill-opacity=".5"/></g>
<ellipse id="rc-salt" class="hit" fill="transparent" cx="${sx}" cy="${SALT.y}" rx="60" ry="58"/>`;
  const oil = `<g id="rc-oil-g"><ellipse cx="${ox}" cy="${OIL.y + 46}" rx="30" ry="9" fill="#0a0405" fill-opacity=".4"/>
<path d="M${ox - 26} ${OIL.y - 28}L${ox - 26} ${OIL.y + 34}Q${ox - 26} ${OIL.y + 44} ${ox} ${OIL.y + 44}Q${ox + 26} ${OIL.y + 44} ${ox + 26} ${OIL.y + 34}L${ox + 26} ${OIL.y - 28}Z" fill="url(#rc-oilG)" stroke="#4A2A10" stroke-width="1.5"/>
<path d="M${ox - 9} ${OIL.y - 28}L${ox - 9} ${OIL.y - 48}L${ox + 9} ${OIL.y - 48}L${ox + 9} ${OIL.y - 28}Z" fill="#7A3A10"/>
<path d="M${ox - 16} ${OIL.y - 2}L${ox - 16} ${OIL.y + 26}" stroke="#FFE6A0" stroke-opacity=".8" stroke-width="4" stroke-linecap="round"/>
<rect x="${ox - 14}" y="${OIL.y + 6}" width="28" height="12" rx="2" fill="#F6EBD3" fill-opacity=".9"/></g>
<ellipse id="rc-oil" class="hit" fill="transparent" cx="${ox}" cy="${OIL.y + 8}" rx="60" ry="58"/>`;
  const bowlG = `<g id="rc-bowl-g">${bowl}<g id="rc-bowl-rice">${rice}<ellipse cx="${BOWL.x}" cy="${BOWL.y - 2}" rx="78" ry="28" fill="#FFF8E6" fill-opacity=".3" style="mix-blend-mode:screen"/></g>
<ellipse id="rc-bowl" class="hit" fill="transparent" cx="${BOWL.x}" cy="${BOWL.y}" rx="112" ry="76"/></g>`;
  return plane('rc-props', 0.66, `<defs>${linear('rc-oilG', [[0, '#F2B84A'], [0.5, '#B8621A'], [1, '#6A2E0C']], { x1: 0, y1: 0, x2: 1, y2: 0 })}</defs>
<style>
  #rc-props #rc-slot-g{transition:transform .9s cubic-bezier(.2,.7,.3,1)}
  #rc-props #rc-slot-g.lifted{transform:translate(-30px,-96px) rotate(-6deg)}
  #rc-props #rc-spoon-grains{opacity:0;transition:opacity .4s}
  #rc-props #rc-spoon-grains.on{opacity:1}
  #rc-props #rc-bowl-rice{transition:opacity .8s}
  #rc-props #rc-bowl-rice.out{opacity:0}
  #rc-props #rc-bowl-g{transition:transform .8s ease-in-out}
  #rc-props #rc-salt-g.shake,#rc-props #rc-oil-g.shake{animation:rc-shake .45s ease-in-out}
  @keyframes rc-shake{0%,100%{transform:rotate(0)}25%{transform:rotate(-7deg)}75%{transform:rotate(6deg)}}
  #rc-props #rc-fall .rc-fg{opacity:0}
  #rc-props #rc-fall.on .rc-fg{animation:rc-fall .95s ease-in both;animation-delay:calc(var(--i) * 45ms)}
  @keyframes rc-fall{0%{transform:translateY(-90px);opacity:0}30%{opacity:1}100%{transform:translateY(0);opacity:0}}
</style>
<g id="rc-fall">${falls}</g>
${salt}
${oil}
${bowlG}
${spoon}`, { label: 'Salt, oil, the bowl of soaked rice and the slotted spoon in the pot' });
}

function loupePlane() {
  const { x, y, r } = LOUPE;
  const grain = `<use href="#rc-g0" fill="#FBF2DC" transform="translate(${x} ${y}) rotate(-14) scale(9.6)"/>`;
  return plane('rc-loupe', 0.8, `<defs><clipPath id="rc-lclip"><circle cx="${x}" cy="${y}" r="${r}"/></clipPath>
<clipPath id="rc-cA"><rect x="${x - 200}" y="${y - 200}" width="200" height="400"/></clipPath>
<clipPath id="rc-cB"><rect x="${x}" y="${y - 200}" width="200" height="400"/></clipPath></defs>
<style>
  #rc-loupeg{opacity:0;transition:opacity .4s}
  #rc-loupeg.on{opacity:1}
  #rc-loupeg .rc-half{opacity:0;transition:opacity .3s,transform .5s ease-out}
  #rc-loupeg.snap .rc-whole{opacity:0}
  #rc-loupeg.snap .rc-half{opacity:1}
  #rc-loupeg.snap #rc-lhA{transform:translate(-9px,7px) rotate(-6deg)}
  #rc-loupeg.snap #rc-lhB{transform:translate(9px,-7px) rotate(5deg)}
  #rc-loupeg #rc-lcore,#rc-loupeg #rc-lcore2{opacity:0;transition:opacity .3s}
  #rc-loupeg.hard #rc-lcore{opacity:.95}
  #rc-loupeg.snap #rc-lcore2{opacity:1}
  #rc-loupeg.hard .rc-whole{animation:rc-jolt .35s ease-in-out}
  @keyframes rc-jolt{0%,100%{transform:translate(0,0)}30%{transform:translate(-4px,2px)}60%{transform:translate(4px,-2px)}}
</style>
<g id="rc-loupeg">
<circle cx="${x}" cy="${y}" r="${r + 8}" fill="#14100C" fill-opacity=".92" stroke="#F6EBD3" stroke-width="7"/>
<g clip-path="url(#rc-lclip)">
<circle cx="${x}" cy="${y}" r="${r}" fill="#1E1812"/>
<g class="rc-whole">${grain}</g>
<g clip-path="url(#rc-cA)"><g id="rc-lhA" class="rc-half">${grain}</g></g>
<g clip-path="url(#rc-cB)"><g id="rc-lhB" class="rc-half">${grain}</g></g>
<ellipse id="rc-lcore" cx="${x}" cy="${y}" rx="56" ry="11" fill="#FFFFFF" transform="rotate(-14 ${x} ${y})"/>
<ellipse id="rc-lcore2" cx="${x}" cy="${y}" rx="9" ry="36" fill="#FFFFFF" fill-opacity=".9" transform="rotate(-14 ${x} ${y})"/>
</g>
<ellipse id="rc-grain" class="hit" fill="transparent" cx="${x}" cy="${y}" rx="${r + 8}" ry="${r + 8}"/>
</g>`, { label: 'A grain of rice, close up, to press with a tap' });
}

function trayPlane() {
  let jeera = '';
  const r = rng(61);
  for (let i = 0; i < 12; i++) jeera += `<ellipse cx="${f(TRAY.x + 30 + range(r, -20, 20))}" cy="${f(TRAY.y + 14 + range(r, -8, 8))}" rx="2.4" ry="1.4" fill="${JEERA}" transform="rotate(${f(range(r, 0, 180))})"/>`;
  return plane('rc-tray', 0.7, `<style>#rc-tray-g{transition:transform .8s ease-in-out} #rc-tray-spices{transition:opacity .6s} #rc-tray-spices.gone{opacity:0}</style>
<g id="rc-tray-g" style="transform-origin:${TRAY.x}px ${TRAY.y}px">
${F.smallPlate({ p: 'rc', cx: TRAY.x, cy: TRAY.y, w: 230 })}
<g id="rc-tray-spices">${scatter(TRAY_KINDS, 62, TRAY.x, TRAY.y, 70, 26, 0.85, 0)}${jeera}
<path d="M${TRAY.x - 34} ${TRAY.y + 10}Q${TRAY.x - 24} ${TRAY.y + 4} ${TRAY.x - 14} ${TRAY.y + 10}Q${TRAY.x - 24} ${TRAY.y + 16} ${TRAY.x - 34} ${TRAY.y + 10}Z" fill="${MACE}" stroke="#5A1A0E" stroke-width=".8"/></g>
</g>
<ellipse id="rc-tray-hit" class="hit" fill="transparent" cx="${TRAY.x}" cy="${TRAY.y}" rx="130" ry="80"/>`,
  { label: 'The tray of whole spices: cardamom, clove, cinnamon, bay leaf, shahi jeera and mace' });
}

export default function art() {
  const back = close({ surface: 'counter', mood: 'steam', pool: { x: 780, y: 760, rx: 520, ry: 230 } });
  return {
    planes: [
      ...back.planes,
      stovePlane(),
      clockPlane(),
      potPlane(),
      steamPlane(),
      colanderPlane(),
      propsPlane(),
      loupePlane(),
      trayPlane(),
      back.front,
    ],
  };
}
