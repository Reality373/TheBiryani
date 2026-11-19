// Art for chapter IV, The Rest: a close shot of the counter going from dusk into night. Back to front: the close
// shot's wall and window; a back plane with a small fridge at the left, a wall clock, the night veil over the wall,
// and the sun and the moon (hidden until the overnight passes); the counter; a table plane with a steel masala tin,
// the covered marinade bowl (a checked towel over a steel bowl), the steel bowl of dry basmati rice, the tap and the
// sink, a brass lamp and the paper tag that counts the rinses; the warm light of the lamp; the close shot's front.
// The things you touch sit in x 560..1040 (a phone's column); the fridge and the tin are on the desktop's left.
// The desk clock: #r-desk (its hit) #r-digits (the readout).
// Ids: #r-cov (covered bowl, its hit), #r-fdoor (fridge door), #r-finside, #r-fled (fridge light), #r-clock (hit),
// #r-clk-h #r-clk-m (hands), #r-veil (night), #r-sun #r-moon, #r-rice (rice bowl, its hit), #r-water #r-milk (the
// water and how cloudy it is), #r-ring #r-rip (ripples), #r-stream #r-pour (water from the tap, and from the bowl),
// #r-tag #r-tag-t (rinse count). Chapter logic is in js/chapters/rest.js, which moves and tints these.
import { close } from './close.js';
import * as F from './food.js';
import { plane, rng, wobble, linear, radial, f } from './lib.js';

// World geometry shared with the chapter (see js/chapters/rest.js).
export const COV = { cx: 680, cy: 600, w: 200 }; // the covered bowl at rest
export const RICE = { cx: 862, cy: 600, w: 170 }; // the rice bowl at rest, dry
export const TAP_AT = { x: 930, y: 548 }; // the rice bowl under the tap, its centre (in the sink)
export const POUR_AT = { x: 870, y: 566 }; // the rice bowl at the sink's edge, while it is poured off
export const FRIDGE_DOOR = { x: 310, y: 230 }; // where the covered bowl goes into the fridge
export const CLOCK = { cx: 760, cy: 150, r: 58 };
export const DESK = { cx: 660, cy: 592 }; // the digital desk clock on the counter, between the tin and the rice bowl
const SINK = { cx: 930, cy: 584, rx: 96, ry: 42 };

// The rice bowl's water surface, from F.bowl's own proportions (rim ry = rx * 0.45; the inside is 0.84 by 0.8 of that).
export const WATER = (() => {
  const rx = RICE.w / 2, ry = rx * 0.45;
  return { cx: RICE.cx, cy: RICE.cy + ry * 0.2, rx: rx * 0.84, ry: ry * 0.8 };
})();

const CHECK = `<pattern id="r-check" patternUnits="userSpaceOnUse" width="18" height="18"><rect width="18" height="18" fill="#F6EBD3"/><rect width="9" height="18" fill="#A33B2C" fill-opacity=".42"/><rect width="18" height="9" fill="#A33B2C" fill-opacity=".42"/><rect x="4" width="1.2" height="18" fill="#6A1E12" fill-opacity=".5"/><rect y="4" width="18" height="1.2" fill="#6A1E12" fill-opacity=".5"/></pattern>`;

// The covered marinade bowl: F.bowl under a towel that drapes over the rim and hangs a little at the front.
function covered() {
  const { cx, cy, w } = COV;
  const s = w / 280; // the towel's size, from the bowl's (drawn at 280 first)
  const P = (dx, dy) => [cx + dx * s, cy + dy * s];
  const cl = rng(81);
  const towel = wobble([P(-132, -40), P(-96, -84), P(-20, -104), P(60, -98), P(118, -64), P(142, -14), P(130, 30), P(60, 56), P(-20, 60), P(-104, 44), P(-140, 12)], 2, cl);
  return `<g id="r-cov"><g id="r-covB">${F.bowl({ p: 'r', cx, cy, w, depth: 0.45, seed: 5 })}</g>
<ellipse cx="${f(cx + 8 * s)}" cy="${f(cy + 66 * s)}" rx="${f(164 * s)}" ry="${f(24 * s)}" fill="#0a0405" fill-opacity=".42"/>
<path d="${towel}" fill="url(#r-check)" stroke="#0E0D12" stroke-width="1.4"/>
<path d="M${f(P(-116, -62)[0])} ${f(P(-116, -62)[1])}Q${f(P(-30, -84)[0])} ${f(P(-30, -84)[1])} ${f(P(60, -66)[0])} ${f(P(60, -66)[1])}T${f(P(124, -40)[0])} ${f(P(124, -40)[1])}" fill="none" stroke="#fff" stroke-opacity=".6" stroke-width="3.4" stroke-linecap="round"/>
<path d="M${f(P(-124, 26)[0])} ${f(P(-124, 26)[1])}Q${f(P(-40, 46)[0])} ${f(P(-40, 46)[1])} ${f(P(4, 36)[0])} ${f(P(4, 36)[1])}M${f(P(40, 46)[0])} ${f(P(40, 46)[1])}Q${f(P(96, 36)[0])} ${f(P(96, 36)[1])} ${f(P(128, 14)[0])} ${f(P(128, 14)[1])}" fill="none" stroke="#3A1C10" stroke-opacity=".38" stroke-width="2.4" stroke-linecap="round"/>
<path d="M${f(P(-30, -96)[0])} ${f(P(-30, -96)[1])}Q${f(cx)} ${f(cy - 118 * s)} ${f(P(22, -96)[0])} ${f(P(22, -96)[1])}" fill="none" stroke="#6A1E12" stroke-opacity=".5" stroke-width="3"/>
<ellipse class="hit" cx="${cx}" cy="${cy}" rx="${f(168 * s)}" ry="${f(112 * s)}"/></g>`;
}

// The steel bowl of dry basmati rice: the grains sit in the bowl's inside; the water (cloudy or clear) lies over them.
function riceBowl() {
  const { cx, cy, w } = RICE;
  const W = WATER;
  return `<g id="r-rice">${F.bowl({ p: 'r', cx, cy, w, depth: 0.4, seed: 9 })}
${F.riceMound({ p: 'r', cx, cy: W.cy + 2, rx: W.rx - 4, ry: W.ry - 4, h: 9, count: 320, grain: 0.5, seed: 4, saffron: 0, clip: { cx, cy: W.cy, rx: W.rx, ry: W.ry } })}
<ellipse cx="${W.cx - 10}" cy="${W.cy - 6}" rx="${f(W.rx * 0.72)}" ry="${f(W.ry * 0.62)}" fill="#FFF8EA" opacity=".34" style="mix-blend-mode:screen"/>
<g id="r-water" style="opacity:0;transition:opacity .6s ease">
 <ellipse cx="${W.cx}" cy="${W.cy}" rx="${W.rx}" ry="${W.ry}" fill="url(#r-wat)"/>
 <ellipse id="r-milk" cx="${W.cx}" cy="${W.cy}" rx="${W.rx}" ry="${W.ry}" fill="#FBFBF4" opacity="0" style="transition:opacity .8s ease"/>
 <ellipse cx="${W.cx}" cy="${W.cy}" rx="${W.rx}" ry="${W.ry}" fill="none" stroke="#2E5A80" stroke-opacity=".55" stroke-width="2"/>
 <path d="M${f(W.cx - W.rx * 0.9)} ${f(W.cy)}A${W.rx} ${W.ry} 0 0 1 ${f(W.cx + W.rx * 0.9)} ${f(W.cy - 4)}" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/>
</g>
<ellipse id="r-ring" cx="${W.cx}" cy="${W.cy}" rx="${f(W.rx * 0.5)}" ry="${f(W.ry * 0.5)}" fill="none" stroke="#fff" stroke-width="2.4" opacity="0"/>
<ellipse id="r-rip" cx="${W.cx}" cy="${W.cy}" rx="${f(W.rx * 0.5)}" ry="${f(W.ry * 0.5)}" fill="none" stroke="#fff" stroke-width="3" opacity="0"/>
<ellipse class="hit" cx="${cx}" cy="${cy}" rx="${w * 0.6}" ry="${w * 0.34}"/></g>`;
}

// The sink and tap, on the counter at the right. The streams are drawn outside the bowl, so they can stay still.
function sinkAndTap() {
  const { cx, cy, rx, ry } = SINK;
  const P = POUR_AT;
  return `<g id="r-sink">
<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="url(#r-rimG)" stroke="#232845" stroke-width="2.2"/>
<ellipse cx="${cx}" cy="${cy + 7}" rx="${rx - 22}" ry="${ry - 16}" fill="url(#r-basinG)"/>
<path d="M${cx - rx + 28} ${cy - 8}A${rx - 22} ${ry - 16} 0 0 1 ${cx - 40} ${cy - 40}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>
<ellipse cx="${cx - 30}" cy="${cy + 14}" rx="9" ry="4.5" fill="#0A0A10" stroke="#9AA2B0" stroke-width="1.5"/>
</g>
<g id="r-tap"><path d="M${cx} 336V404Q${cx} 436 ${cx - 8} 438" fill="none" stroke="url(#r-tapG)" stroke-width="13" stroke-linecap="round"/>
<rect x="${cx - 16}" y="318" width="32" height="30" rx="9" fill="url(#r-tapG)" stroke="#232845" stroke-width="1.4"/>
<path d="M${cx - 26} 300H${cx + 26}" stroke="url(#r-tapG)" stroke-width="10" stroke-linecap="round"/>
<circle cx="${cx}" cy="300" r="7" fill="#E8E2D0" stroke="#232845" stroke-width="1.2"/></g>
<path id="r-stream" d="M${cx} 442V506" fill="none" stroke="#EAF6FF" stroke-width="7" stroke-linecap="round" opacity="0"/>
<path id="r-pour" d="M${P.x - 52} ${P.y + 80}Q${P.x - 56} ${P.y + 92} ${P.x - 62} ${P.y + 104}" fill="none" stroke="#EAF6FF" stroke-width="8" stroke-linecap="round" opacity="0"/>`;
}

export default function art() {
  const back = close({ surface: 'counter', mood: 'dusk', pool: { x: 900, y: 560, rx: 460, ry: 200 }, seed: 9 });
  const [wall, surf] = back.planes;

  // ---- the wall: a small fridge, the wall clock, the night veil (dims the wall as time passes), the sun and moon ----
  const defsBack = `<defs>
${linear('r-fbody', [[0, '#EDE8DA'], [0.5, '#C9C5B8'], [1, '#8E8C92']], { x1: 0, y1: 0, x2: 1, y2: 0.3 })}
${linear('r-fdoorG', [[0, '#F6F1E2'], [0.45, '#DCD6C4'], [1, '#9C9AA0']], { x1: 0, y1: 0, x2: 1, y2: 1 })}
${radial('r-inside', [[0, '#E6F6FF'], [0.6, '#8FB4D0'], [1, '#2A3A5A']], { cx: 0.6, cy: 0.3, r: 0.8 })}
${radial('r-face', [[0, '#FFF8E4'], [1, '#E2D2AA']], { cx: 0.4, cy: 0.35, r: 0.75 })}
<clipPath id="r-winclip"><path d="M880 330L880 150Q880 20 1010 20Q1140 20 1140 150L1140 330Z"/></clipPath></defs>`;
  const ticks = Array.from({ length: 12 }, (_, i) => {
    const a = (i * Math.PI) / 6, c = Math.cos(a), s = Math.sin(a);
    const { cx, cy } = CLOCK;
    return `<path d="M${f(cx + c * 43)} ${f(cy + s * 43)}L${f(cx + c * 50)} ${f(cy + s * 50)}" stroke="#5A2A22" stroke-width="${i % 3 ? 1.6 : 3}" stroke-linecap="round"/>`;
  }).join('');
  const { cx: kx, cy: ky } = CLOCK;
  const fridge = `<g id="r-fridge">
<rect x="196" y="92" width="224" height="640" rx="16" fill="url(#r-fbody)" stroke="#232845" stroke-width="3"/>
<rect id="r-finside" x="204" y="104" width="208" height="520" rx="8" fill="url(#r-inside)" opacity="0"/>
<g id="r-fdoor" style="transform-origin:204px 104px">
 <rect x="204" y="104" width="208" height="520" rx="8" fill="url(#r-fdoorG)" stroke="#2A2E40" stroke-width="2.2"/>
 <rect x="222" y="122" width="172" height="2.5" rx="1" fill="#fff" opacity=".55"/>
 <rect x="392" y="168" width="9" height="82" rx="4.5" fill="#D8D2C2" stroke="#4A4A56" stroke-width="1.2"/>
 <rect x="222" y="232" width="48" height="34" rx="4" fill="#E0593C" opacity=".85" transform="rotate(-4 246 249)"/>
 <path d="M222 286h54" stroke="#5E8C4A" stroke-width="5" stroke-linecap="round" opacity=".8"/>
 <circle id="r-fled" cx="384" cy="132" r="4" fill="#7DE0A0" opacity="0"/>
</g></g>`;
  const clock = `<g id="r-clock">
<circle cx="${kx}" cy="${ky}" r="58" fill="url(#r-face)" stroke="#5A2A22" stroke-width="7"/>
<circle cx="${kx}" cy="${ky}" r="50" fill="none" stroke="#B8693A" stroke-width="1.4" stroke-opacity=".7"/>
${ticks}
<g id="r-clk-h" style="transform-origin:${kx}px ${ky}px"><path d="M${kx} ${ky}V${ky - 30}" stroke="#2A1612" stroke-width="5" stroke-linecap="round"/></g>
<g id="r-clk-m" style="transform-origin:${kx}px ${ky}px"><path d="M${kx} ${ky}V${ky - 44}" stroke="#2A1612" stroke-width="3" stroke-linecap="round"/></g>
<circle cx="${kx}" cy="${ky}" r="4.5" fill="#A33B2C"/>
<circle class="hit" cx="${kx}" cy="${ky}" r="72"/></g>`;
  const veil = `<rect id="r-veil" x="-300" y="-200" width="2200" height="560" fill="#080A22" opacity="0.12" style="transition:opacity 1.4s ease"/>`;
  const sky = `<g clip-path="url(#r-winclip)">
<g id="r-sun" opacity="0"><circle cx="1010" cy="200" r="42" fill="#FFC45A" opacity=".25"/><circle cx="1010" cy="200" r="24" fill="#FFD27A"/></g>
<g id="r-moon" opacity="0"><circle cx="1010" cy="200" r="46" fill="#DDE6FF" opacity=".18"/><circle cx="1010" cy="200" r="22" fill="#EEF2FF"/></g>
</g>`;
  const backPlane = plane('r-back', 0.14, `${defsBack}<style>#r-back .hit{fill:transparent}</style>
${fridge}${clock}${veil}${sky}`, { label: 'A small fridge at the left, a wall clock above the counter, and the window at dusk' });

  // ---- the table: the masala tin, the covered bowl, the rice bowl, the sink and tap, the lamp, the rinse tag ----
  const defsTable = `<defs>${F.foodDefs('r')}
${radial('r-wat', [[0, '#D9EEF8', 0.7], [0.6, '#8FB8D8', 0.62], [1, '#3F6E96', 0.8]], { cx: 0.4, cy: 0.35, r: 0.8 })}
${linear('r-rimG', [[0, '#F4E8C8'], [0.5, '#9A9EAC'], [1, '#4A4E60']], { x1: 0, y1: 0, x2: 0, y2: 1 })}
${radial('r-basinG', [[0, '#8C93A8'], [0.7, '#4A5068'], [1, '#262A40']], { cx: 0.5, cy: 0.4, r: 0.7 })}
${linear('r-tapG', [[0, '#FFF2D0'], [0.4, '#B9BCC8'], [1, '#5A5E70']], { x1: 0, y1: 0, x2: 1, y2: 0 })}
${linear('r-jet', [[0, '#FFFFFF', 0.9], [1, '#B8DCF0', 0.8]], { x1: 0, y1: 0, x2: 0, y2: 1 })}
${CHECK}</defs>`;
  // The lamp is drawn at x 1448 and moved left, so it sits just beyond the sink.
  const lamp = `<g id="r-lamp" transform="translate(-268 0)"><ellipse cx="1448" cy="478" rx="34" ry="9" fill="#0a0405" fill-opacity=".5"/>
<path d="M1418 464Q1420 480 1448 482Q1476 480 1478 464Q1448 472 1418 464Z" fill="#B8693A" stroke="#0E0D12" stroke-width="1.5"/>
<path d="M1472 465Q1484 462 1486 456" fill="none" stroke="#B8693A" stroke-width="5" stroke-linecap="round"/>
<path d="M1448 464Q1436 446 1448 424Q1460 446 1448 464Z" fill="#FFB52E"/><path d="M1448 461Q1442 448 1448 434Q1454 448 1448 461Z" fill="#FFF1B8"/></g>`;
  const tin = `<g id="r-tin"><ellipse cx="392" cy="612" rx="96" ry="26" fill="#0a0405" fill-opacity=".42"/>
<rect x="306" y="520" width="172" height="92" rx="12" fill="url(#r-tapG)" stroke="#232845" stroke-width="2"/>
<ellipse cx="392" cy="520" rx="86" ry="22" fill="url(#r-rimG)" stroke="#232845" stroke-width="2"/>
<ellipse cx="392" cy="522" rx="70" ry="15" fill="#4A4E60"/>
<circle cx="350" cy="520" r="11" fill="#C82A16"/><circle cx="392" cy="520" r="11" fill="#F2B212"/><circle cx="434" cy="520" r="11" fill="#D8C47A"/>
<path d="M322 560H462M322 584H462" stroke="#232845" stroke-opacity=".45" stroke-width="2"/></g>`;
  const tag = `<g id="r-tag"><rect x="${RICE.cx - 120}" y="692" width="240" height="46" rx="8" fill="#F6EBD3" stroke="#5A2A22" stroke-width="2.5"/>
<text id="r-tag-t" x="${RICE.cx}" y="722" text-anchor="middle" font-family="Literata, Georgia, serif" font-size="24" fill="#2A1612">rinse 1 of 3</text></g>`;
  // The desk clock: a small digital timer showing the hours and minutes that have passed. Hold it to pass the time.
  const desk = `<g id="r-desk" style="opacity:0;transition:opacity .8s">
<ellipse cx="${DESK.cx}" cy="${DESK.cy + 36}" rx="82" ry="13" fill="#0a0405" fill-opacity=".42"/>
<rect x="${DESK.cx - 64}" y="${DESK.cy - 34}" width="128" height="68" rx="13" fill="url(#r-tapG)" stroke="#232845" stroke-width="2.4"/>
<rect x="${DESK.cx - 54}" y="${DESK.cy - 25}" width="108" height="44" rx="7" fill="#08150F" stroke="#3A4A42" stroke-width="2"/>
<text id="r-digits" x="${DESK.cx}" y="${DESK.cy + 6}" text-anchor="middle" font-family="'Courier New', Consolas, monospace" font-size="34" font-weight="700" fill="#7DF0B0" style="filter:drop-shadow(0 0 5px #3EE08A)">0:00</text>
<text x="${DESK.cx}" y="${DESK.cy + 15}" text-anchor="middle" font-family="'Courier New', Consolas, monospace" font-size="8" letter-spacing="1.4" fill="#7DF0B0" fill-opacity=".65">HOURS : MINUTES</text>
<circle cx="${DESK.cx - 36}" cy="${DESK.cy + 28}" r="3" fill="#A33B2C"/><circle cx="${DESK.cx - 26}" cy="${DESK.cy + 28}" r="3" fill="#C8B04A"/>
<rect class="hit" x="${DESK.cx - 76}" y="${DESK.cy - 46}" width="152" height="96" rx="14"/></g>`;
  const table = plane('r-table', 0.5, `${defsTable}<style>#r-table .hit{fill:transparent}</style>
${sinkAndTap()}${tin}${covered()}${riceBowl()}${desk}${lamp}${tag}`,
  { label: 'A steel bowl under a checked towel, a steel bowl of dry rice, a tap over a sink, a digital desk clock and a brass lamp on the counter' });

  // The lamp's warmth on the counter, and a little light on the sink.
  const glow = plane('r-glow', 0.52, `<defs>${radial('r-lampG', [[0, '#FFD27A', 0.55], [0.4, '#F2A516', 0.2], [1, '#B8693A', 0]])}</defs>
<ellipse cx="1180" cy="430" rx="300" ry="200" fill="url(#r-lampG)" style="mix-blend-mode:screen"/>`);

  return { planes: [wall, backPlane, surf, table, glow, back.front] };
}
