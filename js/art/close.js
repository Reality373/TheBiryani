// Backdrop for close shots (three-quarter view onto a counter or table, the room far behind, soft and dim).
//
// close({ surface = 'table', mood = 'lamp', pool = {x, y, rx, ry}, windowX = 1010, seed = 7 })
//   -> { planes: [wall, surface], front }
//   Stack them as: ...planes, <your food planes, d between .3 and .9>, front. Ids: c-wall (d .08), c-surface (d .3),
//   c-front (d .95). Needs no foodDefs.
//   surface: 'table' (dark wood, perspective grain) | 'counter' (dark stone, speckle, tile backsplash).
//   pool: where the warm light pool sits under the hero (world coords); defaults per mood.
//   mood only changes light, never the drawing: 'lamp' (Plate, golden lamp on the table), 'dusk' (Marinade, violet
//   window, rain just starting), 'stove' (Fry, light and frying haze from below), 'steam' (Layers, misted and
//   softer), 'burst' (Opening reveal, big warm bloom from below), 'night' (cool, dim), 'moon' (cold window light).
import { f, rng, range, pick, wobble, halftone, linear, radial, plane } from './lib.js';

// win: window gradient; rain: streak opacity; pool: [core, mid, edge colours, strength, size multiplier];
// side: warm glow at upper left (strength); dim: black overlay; haze: [colour, opacity] overlay; wood: surface tint.
const MOODS = {
  lamp: { win: ['#2F4A8A', '#1B2860'], rain: 0.3, pool: ['#FFC070', '#EE8E1C', '#A33B2C', 1, 1.2], side: 0.55, dim: 0.06, haze: null, wood: '#4A2A1A' },
  dusk: { win: ['#6B4F9E', '#2A2A6A'], rain: 0.14, pool: ['#FFC870', '#E8921A', '#A33B2C', 0.85, 1.15], side: 0.4, dim: 0.14, haze: ['#6B4F9E', 0.08], wood: '#42261C' },
  stove: { win: ['#1E2A55', '#10163A'], rain: 0.22, pool: ['#FFA040', '#E0701A', '#A33B2C', 1, 1.5], side: 0.2, dim: 0.2, haze: ['#E8A050', 0.14], wood: '#3A2018', below: true },
  steam: { win: ['#5A6A9A', '#34437A'], rain: 0.2, pool: ['#FFE0A0', '#F2A516', '#B8693A', 0.45, 1.1], side: 0.4, dim: 0.08, haze: ['#E8DCCC', 0.17], wood: '#46281C' },
  burst: { win: ['#2A3A70', '#141C48'], rain: 0.22, pool: ['#FFD08A', '#F0901C', '#A33B2C', 0.85, 1.6], side: 0.25, dim: 0.14, haze: ['#FFD27A', 0.1], wood: '#40241A', below: true },
  night: { win: ['#243566', '#0E1432'], rain: 0.3, pool: ['#E8A050', '#B8693A', '#8A3028', 0.3, 0.9], side: 0.2, dim: 0.3, haze: null, wood: '#2E1C18' },
  moon: { win: ['#7A98D8', '#2F4A8A'], rain: 0.3, pool: ['#C8D8F8', '#6A88D0', '#27356B', 0.35, 1.1], side: 0.1, dim: 0.18, haze: ['#9DB4F0', 0.06], wood: '#2C2230' },
};

export function close({ surface = 'table', mood = 'lamp', pool, windowX = 1010, seed = 7 } = {}) {
  const m = MOODS[mood] || MOODS.lamp;
  const rand = rng(seed);
  const P = pool || { x: 800, y: m.below ? 700 : 660, rx: 430, ry: 190 };
  const horizon = 330;

  // ---- wall plane ----
  let w = `<defs>${linear('cw-wall', [[0, '#0B1030'], [0.6, '#161F4A'], [1, '#2A2C58']])}
${linear('cw-win', [[0, m.win[0]], [1, m.win[1]]])}
${radial('cw-lamp', [[0, '#FFD27A', 0.7], [0.35, '#F2A516', 0.34], [0.7, '#A33B2C', 0.12], [1, '#A33B2C', 0]])}
${linear('cw-fade', [[0, '#0B0910', 0], [1, '#0B0910', 0.6]])}
${halftone('cw-ht', '#0B1030', { size: 9, r: 1.5, opacity: 0.35 })}
<filter id="cw-blur" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="2.4"/></filter></defs>`;
  w += `<rect x="-300" y="-200" width="2200" height="${horizon + 260}" fill="url(#cw-wall)"/><rect x="-300" y="-200" width="2200" height="${horizon + 260}" fill="url(#cw-ht)"/>`;
  // arched window: cool, soft, rain
  const wx = windowX; const arch = `M${wx - 130} 330L${wx - 130} 150Q${wx - 130} 20 ${wx} 20Q${wx + 130} 20 ${wx + 130} 150L${wx + 130} 330Z`;
  w += `<g filter="url(#cw-blur)"><path d="${arch}" fill="#3A1C1A" transform="translate(0 0) scale(1)" stroke="#5A2A22" stroke-width="22"/><path d="${arch}" fill="url(#cw-win)"/>
<path d="M${wx} 20L${wx} 330M${wx - 130} 190L${wx + 130} 190" stroke="#2A1612" stroke-width="7" opacity=".8"/>`;
  for (let i = 0; i < 34; i++) { const rx = wx - 120 + rand() * 240; const ry = 30 + rand() * 280; w += `<line x1="${f(rx)}" y1="${f(ry)}" x2="${f(rx - 6)}" y2="${f(ry + range(rand, 14, 30))}" stroke="#BFD0FF" stroke-opacity="${m.rain}" stroke-width="1.4"/>`; }
  w += `<circle cx="${wx - 40}" cy="95" r="26" fill="#DDE6FF" fill-opacity="${mood === 'moon' ? 0.7 : 0.22}"/></g>`;
  // shelf of jars and hanging ladles, far left, soft and low contrast
  w += `<g filter="url(#cw-blur)" opacity=".7"><rect x="40" y="200" width="420" height="9" fill="#2A1612"/>`;
  for (let i = 0; i < 8; i++) { const jx = 60 + i * 50 + rand() * 12; const jh = 36 + rand() * 30; w += `<rect x="${f(jx)}" y="${f(200 - jh)}" width="${f(26 + rand() * 12)}" height="${f(jh)}" rx="6" fill="${pick(rand, ['#2A2850', '#3A2430', '#1E2A48', '#4A2A28'])}"/>`; }
  for (let i = 0; i < 4; i++) w += `<path d="M${520 + i * 46} 40L${520 + i * 46} 150" stroke="#3A2A28" stroke-width="3"/><ellipse cx="${520 + i * 46}" cy="164" rx="14" ry="18" fill="#5A3A26"/>`;
  w += `</g>`;
  w += `<ellipse cx="130" cy="150" rx="${f(520 * 1)}" ry="460" fill="url(#cw-lamp)" opacity="${m.side}" style="mix-blend-mode:screen"/>`;
  w += `<rect x="-300" y="${horizon - 90}" width="2200" height="100" fill="url(#cw-fade)"/>`;
  const wall = plane('c-wall', 0.08, w);

  // ---- surface plane ----
  let s = `<defs>${linear('cs-top', [[0, m.wood], [0.5, '#2A1810'], [1, '#100A0E']])}
${radial('cs-pool', [[0, m.pool[0], 0.95], [0.3, m.pool[1], 0.6], [0.65, m.pool[2], 0.22], [1, m.pool[2], 0]])}
${linear('cs-stone', [[0, '#32364F'], [0.5, '#1E2138'], [1, '#0E0F1C']])}
${halftone('cs-ht', '#050308', { size: 10, r: 1.8, angle: 20, opacity: 0.5 })}
${halftone('cs-tile', '#0E1020', { size: 60, r: 0.1, angle: 0, opacity: 0 })}</defs>`;
  const H = 1100; const top = horizon; const vx = 800; const vy = -900;
  const base = surface === 'counter' ? 'url(#cs-stone)' : 'url(#cs-top)';
  s += `<rect x="-300" y="${top}" width="2200" height="${H - top + 200}" fill="${base}"/>`;
  const xAt = (x0, y) => vx + (x0 - vx) * ((y - vy) / (H - vy));
  if (surface === 'table') {
    for (let x0 = -2600; x0 <= 4200; x0 += 260) {
      s += `<path d="${wobble([[xAt(x0, top), top], [xAt(x0, 600), 600], [xAt(x0, H), H]], 2.5, rand, false)}" fill="none" stroke="#080507" stroke-opacity=".55" stroke-width="3"/>`;
      for (let k = 0; k < 7; k++) { const gx = x0 + range(rand, 10, 250); const y1 = range(rand, top, 800); const y2 = y1 + range(rand, 120, 380);
        s += `<path d="${wobble([[xAt(gx, y1), y1], [xAt(gx, (y1 + y2) / 2) + range(rand, -6, 6), (y1 + y2) / 2], [xAt(gx, y2), y2]], 1.5, rand, false)}" fill="none" stroke="${rand() < 0.5 ? '#0C0608' : '#8A5A3A'}" stroke-opacity="${f(range(rand, 0.1, 0.22))}" stroke-width="${f(range(rand, 1, 2.6))}"/>`; }
    }
  } else {
    for (let i = 0; i < 260; i++) s += `<circle cx="${f(range(rand, -250, 1850))}" cy="${f(range(rand, top, 1100))}" r="${f(range(rand, 0.8, 2.4))}" fill="${rand() < 0.5 ? '#8A92C0' : '#05060E'}" fill-opacity=".28"/>`;
    for (let i = 0; i < 5; i++) s += `<path d="${wobble([[range(rand, -200, 1700), top + 20], [range(rand, -200, 1700), 600], [range(rand, -200, 1700), 1100]], 40, rand, false)}" fill="none" stroke="#9AA2D0" stroke-opacity=".08" stroke-width="2"/>`;
    s += `<rect x="-300" y="${top - 70}" width="2200" height="70" fill="#141828"/>`;
    for (let x = -300; x < 1900; x += 70) s += `<path d="M${x} ${top - 70}L${x} ${top}" stroke="#05060E" stroke-opacity=".6" stroke-width="2"/>`;
  }
  s += `<ellipse cx="${P.x}" cy="${P.y}" rx="${f(P.rx * m.pool[4] * 1.3)}" ry="${f(P.ry * m.pool[4] * 1.3)}" fill="url(#cs-pool)" opacity="${m.pool[3]}" style="mix-blend-mode:screen"/>`;
  s += `<rect x="-300" y="800" width="2200" height="400" fill="url(#cs-ht)" opacity=".55"/>`;
  s += `<path d="${wobble([[-300, top], [400, top + 3], [1100, top - 2], [1900, top + 2]], 1.2, rand, false)}" fill="none" stroke="#FFD27A" stroke-opacity=".35" stroke-width="2.5"/>`;
  if (m.haze) s += `<rect x="-300" y="-200" width="2200" height="1400" fill="${m.haze[0]}" opacity="${m.haze[1]}"/>`;
  s += `<rect x="-300" y="-200" width="2200" height="1400" fill="#04030A" opacity="${m.dim}"/>`;
  const surf = plane('c-surface', 0.3, s);

  // ---- near foreground: dark edge, a spoon handle and a bowl rim catching warm light ----
  const front = plane('c-front', 0.95, `<defs>${linear('cf-bot', [[0, '#05030A', 0], [1, '#05030A', 0.92]])}</defs>
<rect x="-300" y="900" width="2200" height="300" fill="url(#cf-bot)"/>
<path d="${wobble([[-300, 1100], [-300, 860], [-60, 930], [180, 1100]], 6, rand)}" fill="#0A0710"/>
<path d="${wobble([[-300, 880], [-80, 940], [180, 1100]], 4, rand, false)}" fill="none" stroke="#F2A516" stroke-opacity=".45" stroke-width="3"/>
<path d="${wobble([[1900, 1100], [1900, 820], [1640, 920], [1380, 1100]], 6, rand)}" fill="#0A0710"/>
<path d="${wobble([[1900, 830], [1660, 930], [1380, 1100]], 4, rand, false)}" fill="none" stroke="#B8693A" stroke-opacity=".4" stroke-width="3"/>`);
  return { planes: [wall, surf], front };
}
