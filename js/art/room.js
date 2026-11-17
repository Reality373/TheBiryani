// The kitchen at night, seen from the side, built as depth planes (see docs/design.md section 4).
// room(opts) -> array of plane strings. opts: { mood, seed }.
// State comes from attributes and CSS custom properties on an ancestor (the stage):
//   data-flame high|low|off, --flame 0..1 | data-pot open|lidded|sealed|cracked|lifted, --seal --crack --lift 0..1
//   data-light normal|dim|warm | data-tawa side|under | data-fog on|off | --knob 0..1 (0 high, .5 low, 1 off)
//   --spread 0..1 (motes) | --glow multiplier.
// Hotspot hits: `.hit` shapes inside #r-lid #r-dough #r-steam #r-knob #r-tawa (counter plane), #r-window #r-gecko (wall plane).
// Mood changes light only: sky, haze, rain density, glow, dimness and an optional overlay plane.
import { plane, wobble, blob, halftone, linear, radial, mix, shade, rng, range, C, f } from './lib.js';

const MOODS = {
  dusk: { sky: ['#1A1240', '#4B2B7E', '#9B4A8A', '#D98258'], moon: 0.2, haze: 0.9, rain: 0.3, shade: 0.12, glow: 0.9, lamp: 1.5, over: null },
  stove: { sky: ['#0B1030', '#1E2A63', '#3A3F7A', '#7A4A78'], moon: 0.4, haze: 0.8, rain: 0.8, shade: 0.28, glow: 1.35, lamp: 1, over: ['#E39A3A', 0.2, 'screen'] },
  steam: { sky: ['#17214F', '#34437F', '#5A649B', '#8A7FA8'], moon: 0.3, haze: 1, rain: 0.6, shade: 0.18, glow: 1.05, lamp: 1, over: ['#B9C7E4', 0.32, 'normal'] },
  night: { sky: ['#0B1030', '#1E2A63', '#3A3F7A', '#7A4A78'], moon: 0.55, haze: 0.8, rain: 1, shade: 0.42, glow: 1, lamp: 1, over: null },
  burst: { sky: ['#0E1236', '#222E6B', '#3F4480', '#8A4E78'], moon: 0.45, haze: 0.9, rain: 0.9, shade: 0.12, glow: 1.9, lamp: 1, over: ['#F2A516', 0.5, 'screen'] },
  moon: { sky: ['#101A4A', '#2A3B84', '#4C5CA2', '#8E78B0'], moon: 1, haze: 0.5, rain: 0.25, shade: 0.24, glow: 1.1, lamp: 1.1, over: null },
};

const poly = (pts, amp, r) => 'M' + pts.map(([x, y]) => `${f(x + (r() - 0.5) * 2 * amp)} ${f(y + (r() - 0.5) * 2 * amp)}`).join('L') + 'Z';
const tweak = (html, css) => html.replace(/style="(--d:[^"]*)"/, `style="$1;${css}"`);
const ell = (cx, cy, rx, ry, extra = '') => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" ${extra}/>`;
const hgrad = (id, col, a = -0.45, b = 0.25) => linear(id, [[0, shade(col, a)], [0.55, col], [1, shade(col, b)]], { x2: 1, y2: 0 });

// Cusped arch outline points, left spring to right spring.
function archPts(cx, springY, rx, ry, k = 5, dip = 0.07) {
  const out = [];
  for (let i = 0; i <= 100; i++) {
    const phi = Math.PI * (1 - i / 100);
    const g = 1 - dip * (1 - Math.abs(Math.sin(k * phi))) * Math.sin(phi) ** 0.6;
    out.push([cx + rx * g * Math.cos(phi), springY - ry * g * Math.sin(phi)]);
  }
  return out;
}
const pathOf = (pts) => 'M' + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join('L');
const ARCH = archPts(800, 262, 190, 170);
const OPENING = `${pathOf(ARCH)}L990 470L610 470Z`;
const ARCH_ONLY = `${pathOf(ARCH)}Z`;

/* ------------------------------------------------------------------ CSS */
const CSS = `
<style>
[data-flame='high']{--flame:1}[data-flame='low']{--flame:.38}[data-flame='off']{--flame:0}
[data-pot='sealed'],[data-pot='cracked'],[data-pot='lifted']{--seal:1}
[data-pot='cracked'],[data-pot='lifted']{--crack:1}
[data-pot='lifted']{--lift:1}
.r-hit{fill:transparent;pointer-events:all;cursor:pointer}
#r-wall,#r-counter{pointer-events:none}
/* sky and rain */
#r-sky .cl{animation:r-drift 50s ease-in-out infinite alternate}
#r-sky .cl2{animation-duration:70s;animation-direction:alternate-reverse}
@keyframes r-drift{to{transform:translateX(46px)}}
#r-rainF .st,#r-rainN .st{animation:r-fall .8s linear infinite}
#r-rainN .st{animation-duration:.55s}
@keyframes r-fall{to{transform:translateY(240px)}}
#r-roofs .tv{animation:r-tv 2.3s steps(1) infinite}
@keyframes r-tv{0%{opacity:1}30%{opacity:.55}45%{opacity:.9}70%{opacity:.5}}
/* flame */
#r-flame .fg{transform-origin:800px 712px;transform:scaleY(calc(.08 + var(--flame,1) * .92));opacity:clamp(0, calc(var(--flame,1) * 12), 1);transition:transform .45s ease,opacity .3s}
#r-flame .fl{transform-origin:0 0;animation:r-flick .9s ease-in-out infinite alternate;animation-delay:calc(var(--i) * -.31s)}
@keyframes r-flick{from{transform:scale(.95,.88) skewX(-4deg)}to{transform:scale(1.04,1.1) skewX(5deg)}}
#r-flame .ember{opacity:clamp(0, calc(1 - var(--flame,1) * 10), 1);transition:opacity .4s;animation:r-ember 2.4s ease-in-out infinite alternate}
@keyframes r-ember{from{filter:none;opacity:.7}to{opacity:1}}
#r-glow .w{opacity:calc((.1 + var(--flame,1) * .9) * var(--glow,1) * var(--m-glow,1));transition:opacity .5s}
#r-heat .b{opacity:calc((.08 + var(--flame,1) * .92) * var(--glow,1) * var(--m-glow,1));transition:opacity .5s}
#r-glow .lamp{animation:r-lamp 3.1s ease-in-out infinite alternate}
@keyframes r-lamp{from{opacity:.75}to{opacity:1}}
/* light */
#r-shade{opacity:var(--m-shade,.4);transition:opacity .8s}
[data-light='dim'] #r-shade{opacity:min(1,calc(var(--m-shade,.4) + .4))}
[data-light='warm'] #r-shade{opacity:calc(var(--m-shade,.4) * .3)}
#r-warm{opacity:0;transition:opacity .8s}[data-light='warm'] #r-warm{opacity:.5}
/* pot */
#r-pot .potT{transition:transform .6s ease}
[data-tawa='under'] #r-pot .potT{transform:translateY(-14px)}
#r-lid .lidT{transform-origin:800px 523px;transition:transform .3s ease-out}
[data-pot='open'] #r-lid .lidT{transform:translate(-290px,207px) rotate(2deg);transition-duration:.7s}
[data-pot='cracked'] #r-lid .lidT,[data-pot='lifted'] #r-lid .lidT{transform:translate(calc(var(--lift,0) * 34px),calc(var(--lift,0) * -175px)) rotate(calc(var(--lift,0) * -17deg))}
[data-pot='lidded'] #r-dough,[data-pot='open'] #r-dough{opacity:0}
#r-dough .lm{opacity:clamp(0, calc(var(--seal,0) * 15 - var(--i)), 1)}
#r-dough .gap{opacity:clamp(0, calc(var(--seal,0) * 15 - 10), 1)}
#r-dough .cr{opacity:clamp(0, calc(var(--crack,0) * 9 - var(--ci)), 1)}
[data-pot='lidded'] #r-steam,[data-pot='open'] #r-steam{opacity:0}
#r-steam{transition:opacity .6s}
#r-steam .wp{animation:r-rise 5.5s linear infinite;animation-delay:calc(var(--i) * -1.8s)}
@keyframes r-rise{0%{transform:translate(0,14px) scaleY(.9);opacity:0}20%{opacity:.9}100%{transform:translate(6px,-34px) scaleY(1.06);opacity:0}}
#r-plume{opacity:0;transition:opacity .3s}
[data-pot='cracked'] #r-plume,[data-pot='lifted'] #r-plume{opacity:clamp(0, calc(var(--lift,0) * 1.7 - .2), 1)}
#r-plume .pf{animation:r-puff 4s ease-in-out infinite alternate;animation-delay:calc(var(--i) * -.9s)}
@keyframes r-puff{from{transform:translate(0,6px) scale(.96)}to{transform:translate(8px,-14px) scale(1.06)}}
/* tawa */
#r-tawa{transition:transform .9s cubic-bezier(.5,0,.2,1);transform:translate(362px,70px)}
[data-tawa='under'] #r-tawa{transform:none}
/* knob */
#r-knob .kp{transform-origin:880px 830px;transform:rotate(calc(-110deg + var(--knob,0) * 220deg));transition:transform .3s ease-out}
/* fog */
#r-fog{opacity:0;transition:opacity .8s}[data-fog='on'] #r-fog{opacity:1}
/* motes */
#r-motes .m{opacity:clamp(0, calc((var(--spread,0) + .3 - var(--r)) * 5), 1);transition:opacity .6s}
#r-motes .mi{animation:r-mote 9s linear infinite;animation-delay:calc(var(--i) * -.6s)}
@keyframes r-mote{0%{transform:translate(0,40px);opacity:0}15%{opacity:1}100%{transform:translate(24px,-180px);opacity:0}}
#r-fg{filter:blur(.7px)}
@media (prefers-reduced-motion:reduce){#r-sky .cl,#r-rainF .st,#r-rainN .st,#r-flame .fl,#r-steam .wp,#r-plume .pf,#r-motes .mi{animation:none}}
</style>`;

/* ------------------------------------------------------------------ sky, skyline, roofs, rain */
function skyPlane(m, R) {
  const [a, b, c, d] = m.sky;
  const clouds = (seed, col, y, n) => {
    const r = rng(seed);
    let s = '';
    for (let i = 0; i < n; i++) s += `<path d="${blob(560 + i * 130 + range(r, -30, 30), y + range(r, -20, 20), range(r, 70, 130), range(r, 14, 26), 0.12, r, 12)}" fill="${col}"/>`;
    return s;
  };
  const stars = Array.from({ length: 16 }, () => `<circle cx="${f(range(R, 480, 1120))}" cy="${f(range(R, 40, 230))}" r="${f(range(R, 0.7, 1.6))}" fill="#DDE4FF" opacity="${f(range(R, 0.3, 0.8) * (1 - m.rain * 0.5))}"/>`).join('');
  const inner = `<defs>
    ${linear('r-skyG', [[0, a], [0.4, b], [0.75, c], [1, d]])}
    ${radial('r-moonG', [[0, '#EEF0FF', 0.9], [0.3, '#B9C3F0', 0.32], [1, '#B9C3F0', 0]])}
    ${radial('r-hazeG', [[0, C.copper, 0.55], [0.45, C.madder, 0.3], [1, C.madder, 0]])}
    ${halftone('r-skydots', '#7C88D8', { size: 9, r: 1.5, angle: 30, opacity: 0.3 })}
  </defs>
  <rect x="380" y="-100" width="1240" height="780" fill="url(#r-skyG)"/>
  ${stars}
  <g opacity="${m.moon}"><circle cx="865" cy="190" r="120" fill="url(#r-moonG)"/><circle cx="865" cy="190" r="31" fill="#E9ECFA"/>
    <circle cx="856" cy="182" r="6" fill="#C9CFEA"/><circle cx="876" cy="200" r="4" fill="#C9CFEA"/><circle cx="871" cy="177" r="3" fill="#D3D8F0"/></g>
  <g class="cl">${clouds(5, mix(b, '#6A74C0', 0.35), 190, 9)}<path d="${blob(850, 214, 96, 20, 0.1, R, 12)}" fill="url(#r-skydots)"/></g>
  <g class="cl cl2">${clouds(9, mix(a, b, 0.5), 140, 8)}${clouds(14, mix(b, c, 0.4), 275, 8)}</g>
  <ellipse cx="800" cy="480" rx="540" ry="190" fill="url(#r-hazeG)" opacity="${m.haze}"/>`;
  return plane('r-sky', 0, CSS + inner);
}

function skylinePlane() {
  const r = rng(21);
  const col = '#3A4694';
  const warm = Array.from({ length: 30 }, () => `<rect x="${f(range(r, 560, 1060))}" y="${f(range(r, 370, 440))}" width="2.4" height="3" fill="#F2B04A" opacity="${f(range(r, 0.3, 0.75))}"/>`).join('');
  const minaret = (x, top, w, y0) =>
    `<path d="M${x - w} ${y0}L${x - w * 0.7} ${top + 22}L${x + w * 0.7} ${top + 22}L${x + w} ${y0}Z"/><rect x="${x - w - 3}" y="${top + 40}" width="${2 * w + 6}" height="3"/><rect x="${x - w - 2}" y="${top + 22}" width="${2 * w + 4}" height="3"/>
     <path d="M${x - w * 0.9} ${top + 22}Q${x} ${top - 6} ${x + w * 0.9} ${top + 22}Z"/><rect x="${x - 0.7}" y="${top - 10}" width="1.4" height="12"/>`;
  const charminar = `<g>${minaret(694, 262, 4.5, 412)}${minaret(766, 262, 4.5, 412)}
    <path d="M696 340H764V412H696Z"/>${[708, 722, 736, 750].map((x) => `<path d="M${x - 5} 340Q${x} 322 ${x + 5} 340Z"/>`).join('')}
    <path d="M722 330Q730 300 738 330Z"/><rect x="729.4" y="296" width="1.2" height="10"/></g>
    <path d="M713 412V382Q730 362 747 382V412Z" fill="#F2A83A" opacity=".55"/><path d="M720 412V388Q730 374 740 388V412Z" fill="#0E1233"/>`;
  const mosque = `<g>${minaret(880, 318, 3.6, 420)}${minaret(956, 318, 3.6, 420)}<path d="M884 372H952V420H884Z"/>
    <path d="M894 372Q918 328 942 372Z"/><rect x="917.2" y="326" width="1.6" height="12"/><path d="M886 372Q892 358 898 372Z"/><path d="M938 372Q944 358 950 372Z"/></g>`;
  const tank = (x, y) => `<rect x="${x}" y="${y}" width="16" height="12"/><path d="M${x} ${y}Q${x + 8} ${y - 8} ${x + 16} ${y}Z"/><rect x="${x + 2}" y="${y + 12}" width="1.5" height="14"/><rect x="${x + 12}" y="${y + 12}" width="1.5" height="14"/>`;
  const bldg = [[560, 70, 405], [622, 54, 392], [668, 30, 412], [790, 70, 396], [832, 40, 410], [1000, 70, 398], [1040, 60, 410]]
    .map(([x, w, t]) => `<path d="${poly([[x, 480], [x, t], [x + w, t - 3], [x + w, 480]], 1.1, r)}"/>`).join('');
  const inner = `<defs>${linear('r-farHaze', [[0, C.madder, 0], [0.5, '#B8506A', 0.28], [1, '#E08A5A', 0.55]])}</defs>
  <g transform="translate(0 -45)"><g fill="${col}">${charminar}${mosque}${bldg}${tank(640, 379)}${tank(1012, 372)}${tank(850, 396)}<rect x="420" y="425" width="1200" height="120"/></g>
  <g fill="#3C4A94" opacity=".5"><rect x="693" y="276" width="1.2" height="130"/><rect x="765" y="276" width="1.2" height="130"/></g>
  ${warm}<rect x="420" y="330" width="1200" height="230" fill="url(#r-farHaze)"/></g>`;
  return plane('r-skyline', 0.06, inner);
}

function roofsPlane() {
  const r = rng(33);
  const dark = '#171E48';
  const bl = [[540, 120, 410], [650, 100, 432], [740, 110, 400], [840, 90, 424], [920, 120, 404], [1030, 120, 428]];
  let walls = '', wins = '', rims = '';
  bl.forEach(([x, w, t], k) => {
    walls += `<path d="${poly([[x, 520], [x, t], [x + w, t], [x + w, 520]], 1, r)}"/>`;
    rims += `<path d="M${x} ${t}L${x + w} ${t}" stroke="#4658B0" stroke-width="1.6" fill="none"/>`;
    for (let px = x + 6; px < x + w - 4; px += 10) walls += `<rect x="${px}" y="${t - 5}" width="6" height="5"/>`;
    for (let n = 0; n < 4; n++) {
      const wx = x + 10 + r() * (w - 28), wy = t + 10 + r() * 38;
      wins += `<rect x="${f(wx)}" y="${f(wy)}" width="7" height="9" fill="${r() < 0.7 ? '#F2A83A' : '#E07A3A'}" opacity="${f(range(r, 0.6, 1))}"/>`;
    }
  });
  const neem = [0, 1, 2, 3, 4, 5, 6].map((i) => `<path d="${blob(1020 + range(r, -26, 26), 395 + range(r, -22, 14), range(r, 16, 26), range(r, 12, 18), 0.18, r, 10)}" fill="${i % 2 ? '#14302F' : '#102524'}"/>`).join('');
  const inner = `<g transform="translate(0 -40)"><g fill="${dark}">${walls}
    <rect x="1019" y="395" width="4" height="40"/>${neem}
    <path d="M745 400V378H776V400"/><rect x="741" y="370" width="38" height="10"/><path d="M740 370Q760 356 780 370Z"/><rect x="746" y="380" width="2" height="22"/><rect x="772" y="380" width="2" height="22"/></g>
  ${rims}${wins}
  <rect class="tv" x="858" y="440" width="15" height="10" fill="#3BC9B8"/><rect x="858" y="440" width="15" height="10" fill="none" stroke="#0a0f26" stroke-width="1"/>
  <path d="M580 336Q790 392 1000 330" stroke="#0A0D22" stroke-width="1.2" fill="none"/><rect x="578" y="320" width="2.4" height="90" fill="#0A0D22"/><rect x="998" y="318" width="2.4" height="100" fill="#0A0D22"/></g>`;
  return plane('r-roofs', 0.2, inner);
}

function rainPlane(id, d, seed, count, color, op, width, len, m) {
  const r = rng(seed);
  const n = Math.round(count * m.rain);
  let s = '';
  for (let i = 0; i < n; i++) {
    const x = range(r, 480, 1140), y = range(r, 0, 240), l = range(r, len * 0.7, len * 1.3);
    const line = (dy) => `<line x1="${f(x)}" y1="${f(y + dy)}" x2="${f(x - l * 0.2)}" y2="${f(y + dy + l)}"/>`;
    s += line(-240) + line(0) + line(240) + line(480);
  }
  return plane(id, d, `<g class="st" stroke="${color}" stroke-opacity="${op}" stroke-width="${width}" stroke-linecap="round">${s}</g>`);
}

/* ------------------------------------------------------------------ the wall */
function jar(x, base, w, h, col, r, defs, k) {
  const id = `r-jg${k}`;
  defs.push(hgrad(id, col, -0.5, 0.3));
  return `<g><path d="M${x + 5} ${base + 3}h${w}" stroke="#05060f" stroke-opacity=".5" stroke-width="5"/>
    <path d="M${x} ${base}V${base - h + 9}Q${x} ${base - h + 3} ${x + 5} ${base - h + 3}H${x + w - 5}Q${x + w} ${base - h + 3} ${x + w} ${base - h + 9}V${base}Z" fill="url(#${id})" stroke="#0a0b16" stroke-width="1.4"/>
    <rect x="${x + 2}" y="${base - h - 5}" width="${w - 4}" height="9" rx="2" fill="${shade(col, -0.55)}" stroke="#0a0b16" stroke-width="1"/>
    <rect x="${x + 3}" y="${base - h * 0.62}" width="${w - 6}" height="${h * 0.3}" fill="${C.cream}" opacity=".85"/>
    <path d="M${x + 7} ${base - h * 0.5}h${w - 14}M${x + 7} ${base - h * 0.42}h${(w - 14) * 0.6}" stroke="${C.madder}" stroke-width="1.6" opacity=".8"/>
    <path d="M${x + w - 6} ${base - h + 12}V${base - 6}" stroke="#fff" stroke-opacity=".22" stroke-width="2.4"/></g>`;
}

function ladle(x, len, col, r) {
  return `<g><path d="M${x} 100V${100 + len}" stroke="${shade(col, -0.35)}" stroke-width="3"/><path d="M${x + 1} 100V${100 + len}" stroke="${shade(col, 0.2)}" stroke-width="1"/>
    <path d="M${x - 15} ${100 + len}Q${x} ${100 + len + 28} ${x + 15} ${100 + len}Z" fill="${col}" stroke="#0a0b16" stroke-width="1.3"/>
    <path d="M${x + 4} ${100 + len + 3}Q${x + 10} ${100 + len + 14} ${x + 12} ${100 + len + 3}" fill="none" stroke="#fff" stroke-opacity=".35" stroke-width="1.5"/></g>`;
}

const gecko = () => {
  const ochre = '#D8B06A', dk = '#8C6A32', ln = '#5C4220';
  const leg = (x, y, sgn, ang) => `<g transform="translate(${x} ${y}) scale(1 ${sgn}) rotate(${ang})"><path d="M0 0C4 -12 6 -22 2 -30" stroke="${ochre}" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M0 0C4 -12 6 -22 2 -30" stroke="${ln}" stroke-width="1" fill="none" stroke-opacity=".5"/>
    ${[-26, -13, 0, 13, 26].map((a) => `<g transform="translate(2 -30) rotate(${a - 8})"><path d="M0 0L0 -12" stroke="${ochre}" stroke-width="3" stroke-linecap="round"/><circle cy="-13" r="2.8" fill="${shade(ochre, 0.15)}"/></g>`).join('')}</g>`;
  return `<g class="gk" id="r-gecko-art">
    <path d="M-48 -4C-80 -10 -100 12 -125 4C-142 -1 -152 9 -168 14L-168 18C-150 16 -138 8 -124 12C-100 20 -78 6 -48 8Z" fill="${ochre}" stroke="${ln}" stroke-width="1.2"/>
    ${[-62, -82, -102, -122, -142].map((x) => `<path d="M${x} ${x < -100 ? 8 : 2}V${x < -100 ? 14 : 10}" stroke="${dk}" stroke-width="1.6" opacity=".7"/>`).join('')}
    ${leg(-30, -12, 1, -30)}${leg(-30, 12, -1, -30)}${leg(30, -10, 1, 20)}${leg(30, 10, -1, 20)}
    <path d="M-50 1C-44 -14 -10 -19 18 -13C34 -11 46 -9 62 -5C71 -2 71 5 62 7C46 11 34 13 18 15C-10 19 -44 14 -50 7Z" fill="${ochre}" stroke="${ln}" stroke-width="1.4"/>
    <path d="M-44 8C-10 18 30 14 62 7C40 15 -10 21 -44 11Z" fill="${shade(ochre, 0.35)}" opacity=".7"/>
    ${[-30, -14, 2, 18, 34].map((x, i) => `<circle cx="${x}" cy="${i % 2 ? -3 : 2}" r="${3.4 - i * 0.2}" fill="${dk}" opacity=".75"/>`).join('')}
    <circle cx="48" cy="-5" r="5.6" fill="${shade(ochre, 0.2)}" stroke="${ln}" stroke-width="1.1"/><circle cx="48.6" cy="-5" r="3.4" fill="#2A1A0A"/><rect x="48" y="-8" width="1.2" height="6" fill="${ochre}"/><circle cx="47" cy="-6.4" r="1" fill="#fff" opacity=".9"/>
    <circle cx="68" cy="-1.5" r="1" fill="${ln}"/></g>`;
};

function wallPlane(m) {
  const r = rng(77);
  const defs = [];
  const WALL = `M-220 -100H1820V1100H-220Z ${OPENING}`;
  // Kalamkari border tile
  const kal = `<pattern id="r-kal" patternUnits="userSpaceOnUse" width="96" height="36"><rect width="96" height="36" fill="#5A1F22"/>
    <path d="M0 18Q12 4 24 18T48 18T72 18T96 18" fill="none" stroke="${C.mint}" stroke-width="2"/>
    ${[24, 72].map((x) => `<g transform="translate(${x} 18)">${[0, 72, 144, 216, 288].map((a) => `<ellipse rx="3.4" ry="8" cy="-8" fill="${C.cream}" transform="rotate(${a})"/>`).join('')}<circle r="3.6" fill="${C.saffron}"/></g>`).join('')}
    ${[0, 48, 96].map((x) => `<path d="M${x} 8q6 4 0 9q-6-5 0-9z" fill="${C.mint}" transform="translate(0 14)"/>`).join('')}
    <circle cx="48" cy="6" r="1.8" fill="${C.saffron}"/><circle cx="48" cy="30" r="1.8" fill="${C.saffron}"/><circle cx="0" cy="6" r="1.8" fill="${C.saffron}"/><circle cx="0" cy="30" r="1.8" fill="${C.saffron}"/></pattern>`;
  defs.push(kal, halftone('r-wdots', '#080B20', { size: 8, r: 2, angle: 40, opacity: 0.55 }),
    `<pattern id="r-tile" patternUnits="userSpaceOnUse" width="44" height="44"><rect width="44" height="44" fill="#1C2658"/><rect x="1.5" y="1.5" width="41" height="41" rx="3" fill="#212D63"/><path d="M22 6L38 22L22 38L6 22Z" fill="none" stroke="#2F3F86" stroke-width="1.4"/><circle cx="22" cy="22" r="2.6" fill="#35479A"/></pattern>`,
    `<pattern id="r-jali" patternUnits="userSpaceOnUse" width="30" height="30" patternTransform="rotate(45 800 262)"><path d="M0 0H30M0 0V30" stroke="#4B1D18" stroke-width="5"/><path d="M0 0H30M0 0V30" stroke="#8A3C2C" stroke-width="1.5" transform="translate(-.8 -.8)"/><circle r="3" fill="#C9753A"/></pattern>`,
    linear('r-plaster', [[0, '#0F1433'], [0.5, '#1F2B63'], [1, '#101637']], { x2: 1, y2: 0 }),
    linear('r-fogG', [[0, '#C0CCE0'], [1, '#8C9CBA']]), radial('r-fogR', [[0, '#E6EEFA', 0.55], [1, '#E6EEFA', 0]]),
    hgrad('r-woodG', '#7A3326', -0.5, 0.25),
    `<clipPath id="r-clipOpen"><path d="${OPENING}"/></clipPath><clipPath id="r-clipArch"><path d="${ARCH_ONLY}"/></clipPath>`,
    `<mask id="r-fogmask" maskUnits="userSpaceOnUse" x="590" y="70" width="420" height="420"><rect x="590" y="70" width="420" height="420" fill="#fff"/><path id="r-fog-wipe" d="" fill="none" stroke="#000" stroke-width="64" stroke-linecap="round" stroke-linejoin="round"/></mask>`,
    radial('r-lampW', [[0, '#FFD27A', 0.9], [1, '#F2A516', 0]]));

  const stains = [[300, 250, 150, 90], [1500, 400, 120, 160], [60, 680, 160, 70], [1250, 160, 110, 70]]
    .map(([x, y, rx, ry]) => `<path d="${blob(x, y, rx, ry, 0.2, r, 12)}" fill="url(#r-wdots)"/>`).join('');
  const bright = [[470, 600, 60, 20], [700, 620, 100, 18], [1180, 640, 80, 18]].map(([x, y, rx, ry]) => `<path d="${blob(x, y, rx, ry, 0.2, r, 10)}" fill="#33428C" opacity=".35"/>`).join('');
  const cracks = [[180, 520, 60], [1400, 330, 80], [420, 640, 50]].map(([x, y, l]) => `<path d="${wobble([[x, y], [x + l * 0.3, y + l * 0.5], [x - l * 0.1, y + l]], 4, r, false)}" stroke="#090C20" stroke-opacity=".6" stroke-width="1.6" fill="none"/>`).join('');

  // window dressing
  const beads = Array.from({ length: 26 }, () => {
    const x = range(r, 625, 975), y = range(r, 275, 460), l = range(r, 8, 36);
    return `<path d="M${f(x)} ${f(y)}v${f(l)}" stroke="#C8D4F0" stroke-opacity=".28" stroke-width="1.6" stroke-linecap="round"/><circle cx="${f(x)}" cy="${f(y + l)}" r="2.2" fill="#E1E8FA" opacity=".6"/>`;
  }).join('');
  const drops = Array.from({ length: 70 }, () => `<circle cx="${f(range(r, 615, 985))}" cy="${f(range(r, 100, 465))}" r="${f(range(r, 1.4, 3.2))}" fill="#EEF3FF" opacity="${f(range(r, 0.25, 0.6))}"/>`).join('');
  const trickles = Array.from({ length: 9 }, () => { const x = range(r, 630, 970), y = range(r, 200, 380); return `<path d="M${f(x)} ${f(y)}v${f(range(r, 40, 90))}" stroke="#F2F6FF" stroke-opacity=".35" stroke-width="2.2" stroke-linecap="round"/>`; }).join('');

  const window_ = `<g id="r-window">
    <g id="r-fog"><g clip-path="url(#r-clipOpen)"><g mask="url(#r-fogmask)">
      <rect x="590" y="70" width="420" height="420" fill="url(#r-fogG)" opacity=".86"/><ellipse cx="800" cy="300" rx="190" ry="170" fill="url(#r-fogR)"/>
      <rect x="590" y="70" width="420" height="420" fill="url(#r-wdots)" opacity=".1"/>${drops}${trickles}</g></g></g>
    <g clip-path="url(#r-clipOpen)">${beads}</g>
    <g clip-path="url(#r-clipArch)"><path d="${ARCH_ONLY}" fill="url(#r-jali)"/></g>
    <path d="M800 262V470M610 322H990" stroke="#3E1812" stroke-width="12"/><path d="M798 262V470M610 320H990" stroke="#9A4632" stroke-width="2.4"/>
    <path d="M610 262H990" stroke="#3E1812" stroke-width="13"/><path d="M610 260H990" stroke="#9A4632" stroke-width="2.4"/>
    <path d="${OPENING}" fill="none" stroke="#2A0F0C" stroke-width="34" stroke-linejoin="round"/>
    <path d="${OPENING}" fill="none" stroke="url(#r-woodG)" stroke-width="27" stroke-linejoin="round"/>
    <path d="${OPENING}" fill="none" stroke="#2A0F0C" stroke-opacity=".6" stroke-width="4" stroke-linejoin="round" transform="translate(0 0)"/>
    <path d="${OPENING}" fill="none" stroke="#C9753A" stroke-opacity=".7" stroke-width="2" stroke-dasharray="0 13" stroke-linecap="round" stroke-linejoin="round" transform="scale(1)"/>
    <path d="M800 66Q790 78 800 92Q810 78 800 66Z" fill="#7A3326" stroke="#2A0F0C" stroke-width="1.4"/>
    <path d="M572 470H1028V496Q800 504 572 496Z" fill="#53271E" stroke="#1D0A08" stroke-width="2"/><path d="M574 470H1026" stroke="#D08A52" stroke-width="2.4"/><path d="M574 497Q800 505 1026 497" stroke="#05060f" stroke-opacity=".5" stroke-width="5" fill="none"/>
    <path class="hit r-hit" d="${OPENING}"/></g>`;

  const tulsi = `<g><path d="M638 470L644 446H682L688 470Z" fill="#B0553A" stroke="#1D0A08" stroke-width="1.6"/><path d="M638 470L644 446H656L652 470Z" fill="#7A3326" opacity=".6"/><rect x="640" y="446" width="46" height="6" rx="2" fill="#C9683F" stroke="#1D0A08" stroke-width="1.2"/>
    ${Array.from({ length: 26 }, (_, i) => { const a = range(r, -1.1, 1.1), l = range(r, 14, 40); const x = 663 + Math.sin(a) * l * 0.9, y = 444 - Math.cos(a) * l - 4; return `<path d="M663 446Q${f((663 + x) / 2)} ${f((446 + y) / 2 - 6)} ${f(x)} ${f(y)}" stroke="#2F5A38" stroke-width="1.4" fill="none"/><ellipse cx="${f(x)}" cy="${f(y)}" rx="6" ry="3.8" transform="rotate(${f(a * 60 - 20)} ${f(x)} ${f(y)})" fill="${i % 3 ? C.mint : '#7FB066'}" stroke="#16301C" stroke-width=".9"/>`; }).join('')}</g>`;
  const lota = `<g>${hgrad('r-brass', '#B8892A', -0.55, 0.4)}<path d="M934 470Q926 452 934 440Q930 430 940 424H960Q970 430 966 440Q974 452 966 470Z" fill="url(#r-brass)" stroke="#1D0A08" stroke-width="1.6"/>
    <path d="M936 436H964M934 458H966" stroke="#5E4012" stroke-width="1.6" fill="none"/><path d="M960 430V462" stroke="#FFE7A0" stroke-opacity=".55" stroke-width="3"/><ellipse cx="950" cy="424" rx="11" ry="3" fill="#2B1A0A"/><ellipse cx="950" cy="423" rx="8" ry="1.6" fill="#8FB4E8" opacity=".6"/></g>`;

  // shelves and ladles
  const jdefs = [];
  const j1 = [[96, 40, 70, '#B0553A'], [142, 36, 56, '#2F7F8A'], [184, 44, 76, '#C79A4A'], [236, 34, 52, '#6E7BA3'], [276, 42, 66, '#9B3E2E'], [326, 48, 58, '#6E7BA3'], [384, 38, 74, '#2F7F8A'], [430, 44, 60, '#B0553A']];
  const j2 = [[100, 52, 50, '#6E7BA3'], [160, 40, 64, '#B0553A'], [210, 54, 58, '#6E7BA3'], [276, 38, 72, '#C79A4A'], [322, 42, 54, '#2F7F8A'], [374, 50, 62, '#9B3E2E'], [432, 40, 48, '#6E7BA3']];
  const shelves = `${j1.map(([x, w, h, c], k) => jar(x, 318, w, h, c, r, jdefs, k)).join('')}${j2.map(([x, w, h, c], k) => jar(x, 452, w, h, c, r, jdefs, 20 + k)).join('')}
    ${[318, 452].map((y) => `<path d="M60 ${y}H530V${y + 11}H60Z" fill="#4B2A1E" stroke="#0A0B16" stroke-width="1.6"/><path d="M60 ${y}H530" stroke="#C9753A" stroke-opacity=".6" stroke-width="2"/><path d="M90 ${y + 11}v20l22-20M500 ${y + 11}v20l-22-20" fill="#3A2118" stroke="#0A0B16" stroke-width="1.2"/>`).join('')}
    <path d="M70 98H470" stroke="#6A4A2C" stroke-width="5" stroke-linecap="round"/><path d="M70 96H470" stroke="#D9A862" stroke-opacity=".6" stroke-width="1.4"/>
    ${ladle(120, 94, '#B8693A', r)}${ladle(190, 118, '#7E8AB0', r)}${ladle(262, 80, '#C79A4A', r)}${ladle(330, 104, '#B8693A', r)}${ladle(406, 90, '#7E8AB0', r)}`;

  const niche = `<g><path d="M1126 470V340Q1126 286 1190 280Q1254 286 1254 340V470Z" fill="#14192F" stroke="#3E4C9A" stroke-width="3"/>
    <path d="M1134 470V342Q1134 296 1190 290Q1246 296 1246 342V470Z" fill="#4A2024"/><path d="M1134 470V342Q1134 296 1190 290Q1246 296 1246 342V470Z" fill="url(#r-lampW)" opacity=".5"/>
    <path d="M1134 470V342Q1134 296 1190 290" fill="none" stroke="#05060f" stroke-opacity=".6" stroke-width="7"/>
    <path d="M1166 462Q1190 478 1214 462L1208 450H1172Z" fill="#B0553A" stroke="#1D0A08" stroke-width="1.6"/><path d="M1172 450H1208" stroke="#F2A516" stroke-width="2"/>
    <path d="M1190 450Q1176 436 1190 412Q1204 436 1190 450Z" fill="#F2A516"/><path d="M1190 448Q1184 438 1190 424Q1196 438 1190 448Z" fill="#FFE6A8"/>
    <path d="M1190 408Q1186 392 1192 380" stroke="#05060f" stroke-opacity=".5" stroke-width="3" fill="none"/>
    ${[0, 1, 2, 3].map((i) => `<ellipse cx="${1150 + i * 8}" cy="${466 - (i % 2) * 2}" rx="5" ry="3.4" fill="${i % 2 ? C.saffron : '#D9701E'}"/>`).join('')}</g>`;
  const towel = `<g><circle cx="1072" cy="546" r="4" fill="#C79A4A" stroke="#1D0A08" stroke-width="1.2"/><path d="${wobble([[1046, 552], [1100, 552], [1104, 612], [1102, 680], [1048, 684], [1044, 612]], 1.5, r)}" fill="#E7D8B8" stroke="#1D0A08" stroke-width="1.6"/>
    ${[0, 1, 2, 3, 4].map((i) => `<rect x="1044" y="${562 + i * 24}" width="60" height="9" fill="${C.madder}" opacity=".8"/>`).join('')}${[0, 1, 2].map((i) => `<rect x="${1056 + i * 18}" y="552" width="8" height="132" fill="${C.madder}" opacity=".55"/>`).join('')}
    <path d="M1100 556V680" stroke="#05060f" stroke-opacity=".45" stroke-width="7"/><path d="M1048 682H1102" stroke="${C.cream}" stroke-width="3" stroke-dasharray="2 3"/></g>`;
  const calendar = `<g transform="rotate(3 1370 180) translate(0 150)"><circle cx="1370" cy="116" r="3" fill="#C79A4A"/><rect x="1330" y="120" width="80" height="116" fill="#05060f" opacity=".4" transform="translate(5 5)"/>
    <path d="${wobble([[1330, 120], [1410, 120], [1410, 236], [1330, 236]], 1, r)}" fill="${C.cream}" stroke="#1D0A08" stroke-width="1.6"/><rect x="1330" y="120" width="80" height="16" fill="${C.madder}"/>
    <rect x="1338" y="142" width="64" height="40" fill="#27356B" stroke="#1D0A08" stroke-width="1.2"/><path d="M1338 182L1358 160L1372 174L1384 164L1402 182Z" fill="${C.mint}" opacity=".8"/><circle cx="1384" cy="154" r="6" fill="${C.saffron}"/>
    ${Array.from({ length: 21 }, (_, i) => `<circle cx="${1342 + (i % 7) * 9}" cy="${198 + Math.floor(i / 7) * 10}" r="1.8" fill="#3A2A30"/>`).join('')}</g>`;
  const geckoG = `<g id="r-gecko"><g transform="translate(1078 384) rotate(-38) scale(.5)">${gecko()}</g><circle class="hit r-hit" cx="1078" cy="384" r="62"/></g>`;

  const inner = `<defs>${defs.join('')}${jdefs.join('')}</defs>
  <path d="${WALL}" fill="url(#r-plaster)" fill-rule="evenodd"/>
  ${stains}${bright}${cracks}
  <rect x="-220" y="540" width="2040" height="200" fill="url(#r-tile)" opacity=".5"/><rect x="-220" y="536" width="2040" height="6" fill="#05060f" opacity=".4"/>
  <rect x="-220" y="498" width="2040" height="40" fill="url(#r-kal)"/><path d="M-220 500H1820M-220 536H1820" stroke="${C.saffron}" stroke-width="2.4" opacity=".8"/>
  <path d="M-220 539H1820" stroke="#05060f" stroke-opacity=".5" stroke-width="5"/>
  ${shelves}${niche}${towel}${calendar}${window_}${tulsi}${lota}${geckoG}`;
  return plane('r-wall', 0.62, inner, { label: 'The kitchen wall, with an arched window onto the rainy city' });
}

/* ------------------------------------------------------------------ glow, heat, shade */
function glowPlane(m) {
  const inner = `<defs>
    ${radial('r-gw', [[0, C.saffron, 0.62], [0.28, C.copper, 0.42], [0.62, C.madder, 0.17], [1, C.madder, 0]])}
    ${radial('r-gl', [[0, C.saffron, 0.55], [0.4, C.copper, 0.28], [1, C.madder, 0]])}
    <clipPath id="r-clipWall"><path d="M-220 -100H1820V1100H-220Z ${OPENING}" clip-rule="evenodd"/></clipPath></defs>
  <g clip-path="url(#r-clipWall)"><g class="w"><ellipse cx="800" cy="610" rx="640" ry="500" fill="url(#r-gw)"/></g>
  <g class="lamp" style="opacity:${m.lamp > 1 ? 1 : 0.9}"><circle cx="1190" cy="440" r="${f(150 * m.lamp)}" fill="url(#r-gl)"/></g></g>`;
  return tweak(plane('r-glow', 0.63, inner), `mix-blend-mode:screen;--m-glow:${m.glow}`);
}

function heatPlane(m) {
  const inner = `<defs>${radial('r-hb', [[0, '#FFD27A', 0.8], [0.3, C.saffron, 0.5], [0.65, C.copper, 0.2], [1, C.madder, 0]])}</defs>
  <g class="b"><ellipse cx="800" cy="690" rx="330" ry="110" fill="url(#r-hb)"/><ellipse cx="800" cy="750" rx="480" ry="30" fill="url(#r-hb)" opacity=".6"/><ellipse cx="800" cy="610" rx="170" ry="100" fill="url(#r-hb)" opacity=".4"/></g>`;
  return tweak(plane('r-heat', 0.79, inner), `mix-blend-mode:screen;--m-glow:${m.glow}`);
}

function shadePlane(m) {
  const inner = `<defs>${radial('r-sh', [[0.35, '#070916', 0], [1, '#070916', 0.95]], { cx: 0.5, cy: 0.62, r: 0.62 })}
    ${radial('r-wm', [[0, C.copper, 0.55], [0.6, C.madder, 0.2], [1, C.madder, 0]])}</defs>
  <rect id="r-shade" x="-220" y="-100" width="2040" height="1200" fill="url(#r-sh)" style="--m-shade:${m.shade}"/>
  <ellipse id="r-warm" cx="800" cy="620" rx="800" ry="520" fill="url(#r-wm)" style="mix-blend-mode:screen"/>`;
  return plane('r-shadeP', 0.8, inner);
}

function overlayPlane(m) {
  if (!m.over) return '';
  const [col, op, blend] = m.over;
  const inner = `<defs>${radial('r-ov', blend === 'screen' ? [[0, col, op], [0.3, C.copper, op * 0.6], [0.7, C.madder, op * 0.15], [1, C.madder, 0]] : [[0, col, op], [0.6, col, op * 0.7], [1, col, op * 0.5]], { cx: 0.5, cy: 0.6, r: 0.5 })}</defs><rect x="-220" y="-100" width="2040" height="1200" fill="url(#r-ov)"/>`;
  return tweak(plane('r-overlay', 0.9, inner), `mix-blend-mode:${blend}`);
}

/* ------------------------------------------------------------------ counter, stove, pot */
const flameTongue = `<g id="r-tg"><path d="M-9 0C-12 -12 -4 -22 -2 -32C-1 -39 3 -43 2 -50C9 -40 12 -26 10 -14C9 -7 9 -3 9 0Z" fill="#F2A516"/>
  <path d="M-5 0C-7 -10 -1 -18 0 -27C1 -33 3 -36 2 -42C6 -34 8 -22 6 -12C5 -6 5 -3 5 0Z" fill="#FFE2A6"/>
  <path d="M-9 0C-11 -6 -8 -12 -4 -15C-1 -17 3 -16 6 -14C9 -9 9 -4 9 0Z" fill="#3E5CC8"/><path d="M-5 0C-6 -4 -4 -8 -1 -10C2 -11 4 -9 5 0Z" fill="#8FB0FF"/></g>`;

function counterPlane(m) {
  const r = rng(101);
  const defs = [];
  const body = 'M662 522C672 540 690 552 676 570C650 590 636 620 664 644C682 660 700 666 712 668L888 668C900 666 918 660 936 644C964 620 950 590 924 570C910 552 928 540 938 522Z';
  defs.push(
    linear('r-potG', [[0, '#40190F'], [0.45, '#B8693A'], [0.8, '#E39B56'], [1, '#9A4E2C']], { x2: 1, y2: 0 }),
    linear('r-potV', [[0, '#1A0A08', 0.55], [0.4, '#1A0A08', 0], [0.78, C.saffron, 0.1], [1, '#FFD27A', 0.65]]),
    linear('r-lidG', [[0, '#3A160E'], [0.5, '#A85A30'], [0.82, '#E3A15F'], [1, '#8E4628']], { x2: 1, y2: 0 }),
    linear('r-stoveG', [[0, '#2A3358'], [0.5, '#8A93B0'], [1, '#2A3358']], { x2: 1, y2: 0 }),
    linear('r-stoveV', [[0, '#05060f', 0], [1, '#05060f', 0.55]]),
    linear('r-counterG', [[0, '#5A5878'], [1, '#33345A']]),
    linear('r-cabG', [[0, '#1A1F45'], [1, '#080A1A']]),
    linear('r-ironG', [[0, '#3A3C4C'], [1, '#0E0E14']]),
    linear('r-riceG', [[0, '#FFF6DC'], [1, '#E9C98A']]),
    radial('r-shadowUp', [[0, '#06081A', 0.7], [0.6, '#06081A', 0.4], [1, '#06081A', 0]], { cx: 0.5, cy: 0.78, r: 0.55 }),
    halftone('r-potdots', '#12060A', { size: 6, r: 1.5, angle: 35, opacity: 0.8 }),
    `<pattern id="r-dent" patternUnits="userSpaceOnUse" width="18" height="14"><ellipse cx="5" cy="4" rx="3.6" ry="2.3" fill="#12060A" opacity=".22"/><path d="M2 5.5Q5 8.5 9 5.5" stroke="#FFD9A0" stroke-opacity=".4" stroke-width="1" fill="none"/><ellipse cx="14" cy="11" rx="3.6" ry="2.3" fill="#12060A" opacity=".22"/><path d="M11 12.5Q14 15 18 12.5" stroke="#FFD9A0" stroke-opacity=".4" stroke-width="1" fill="none"/></pattern>`,
    `<pattern id="r-grain" patternUnits="userSpaceOnUse" width="10" height="8"><ellipse cx="2.5" cy="2" rx="2.2" ry="1" fill="#FFF8E6" transform="rotate(-20 2.5 2)"/><ellipse cx="7.5" cy="3.5" rx="2.2" ry="1" fill="#F3DCA4" transform="rotate(25 7.5 3.5)"/><ellipse cx="4" cy="6.5" rx="2.2" ry="1" fill="#FFF8E6" transform="rotate(10 4 6.5)"/><ellipse cx="5" cy="3" rx="3" ry="2.5" fill="#B88C4A" opacity=".25"/></pattern>`,
    `<pattern id="r-brush" patternUnits="userSpaceOnUse" width="7" height="8"><path d="M1 0V8M4 0V8" stroke="#fff" stroke-opacity=".07" stroke-width="1"/></pattern>`,
    flameTongue,
  );

  // flame
  const row = Array.from({ length: 13 }, (_, i) => {
    const x = 668 + i * 22, sy = 0.66 + 0.1 * Math.sin(i * 1.7);
    return `<g transform="translate(${x} 712) scale(${f(0.78 + (i % 3) * 0.04)} ${f(sy)})"><g class="fl" style="--i:${i}"><use href="#r-tg"/></g></g>`;
  }).join('');
  const lick = [[986, 1, 1.9], [1002, 1, 1.5], [1016, 1, 1.1], [614, -1, 1.9], [598, -1, 1.5], [584, -1, 1.1]]
    .map(([x, s, h], i) => `<g transform="translate(${x} 712) scale(${f(s * 0.95)} ${f(h)}) rotate(${s * 14})"><g class="fl" style="--i:${i + 14}"><use href="#r-tg"/></g></g>`).join('');
  const flame = `<g id="r-flame"><g class="fg">${row}${lick}</g>
    <g class="ember">${[690, 740, 790, 842, 900].map((x, i) => `<circle cx="${x}" cy="710" r="${3 + (i % 2)}" fill="#F2A516"/><circle cx="${x}" cy="710" r="8" fill="#E0561A" opacity=".35"/>`).join('')}</g></g>`;

  // stove
  const stove = `<g>
    <path d="M628 728H972L968 940H632Z" fill="url(#r-stoveG)" stroke="#05060f" stroke-width="2.4"/>
    <path d="M628 728H972L968 940H632Z" fill="url(#r-brush)"/><path d="M628 728H972L968 940H632Z" fill="url(#r-stoveV)"/>
    <path d="M622 714H978L972 730H628Z" fill="#B9C0D6" stroke="#05060f" stroke-width="2"/><path d="M626 716H974" stroke="#FFE7B8" stroke-opacity=".7" stroke-width="2"/>
    <path d="M624 730H976" stroke="#05060f" stroke-opacity=".5" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M${660 + i * 14} 760h8" stroke="#05060f" stroke-width="5" stroke-linecap="round" opacity=".6"/>`).join('')}
    <rect x="680" y="905" width="240" height="8" rx="4" fill="#05060f" opacity=".5"/>
    <path d="M668 722H932V712Q800 696 668 712Z" fill="url(#r-ironG)" stroke="#05060f" stroke-width="2"/><path d="M676 710Q800 696 924 710" fill="none" stroke="#8C7468" stroke-width="1.6"/>
    ${Array.from({ length: 18 }, (_, i) => `<rect x="${676 + i * 14}" y="707" width="6" height="3" fill="#05060f"/>`).join('')}
    <path d="M652 722V684M948 722V684" stroke="#17171F" stroke-width="9" stroke-linecap="round"/><path d="M648 684H952" stroke="#17171F" stroke-width="7" stroke-linecap="round"/><path d="M648 681H952" stroke="#8C8FA8" stroke-opacity=".5" stroke-width="1.4"/>
  </g>`;

  // knob with dial
  const KX = 880, KY = 830;
  const ticks = [[-110, 'high'], [0, 'low'], [110, 'off']].map(([a, t]) => {
    const rad = (a * Math.PI) / 180, s = Math.sin(rad), c = -Math.cos(rad);
    return `<path d="M${f(KX + s * 46)} ${f(KY + c * 46)}L${f(KX + s * 58)} ${f(KY + c * 58)}" stroke="#F6EBD3" stroke-width="4" stroke-linecap="round"/>
      <text x="${f(KX + s * 80)}" y="${f(KY + c * 80 + 5)}" font-family="'Literata Variable',Georgia,serif" font-size="17" font-weight="700" font-style="italic" fill="#F6EBD3" text-anchor="middle">${t}</text>`;
  }).join('');
  const dots = Array.from({ length: 9 }, (_, i) => { const a = ((-110 + i * 27.5) * Math.PI) / 180; return `<circle cx="${f(KX + Math.sin(a) * 52)}" cy="${f(KY - Math.cos(a) * 52)}" r="1.8" fill="#F6EBD3" opacity=".7"/>`; }).join('');
  const skirt = Array.from({ length: 36 }, (_, i) => { const a = (i / 36) * Math.PI * 2, rr = i % 2 ? 36 : 40; return [KX + Math.cos(a) * rr, KY + Math.sin(a) * rr]; });
  const knob = `<g id="r-knob"><circle cx="${KX}" cy="${KY}" r="64" fill="#0B0C14" opacity=".55"/><circle cx="${KX}" cy="${KY}" r="62" fill="#262B46" stroke="#05060f" stroke-width="2"/>
    ${dots}${ticks}
    <path d="${poly(skirt, 0, r)}" fill="#05060f" transform="translate(3 4)" opacity=".5"/>
    <path d="${poly(skirt, 0, r)}" fill="#14151F" stroke="#05060f" stroke-width="1.6"/>
    <circle cx="${KX}" cy="${KY}" r="31" fill="#272A3A" stroke="#0A0A10" stroke-width="1.4"/><path d="M${KX + 26} ${KY - 12}A29 29 0 0 1 ${KX + 12} ${KY + 26}" stroke="#E9A860" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".8"/>
    <g class="kp"><path d="M${KX} ${KY + 4}V${KY - 30}" stroke="#05060f" stroke-width="9" stroke-linecap="round"/><path d="M${KX} ${KY + 4}V${KY - 30}" stroke="${C.saffron}" stroke-width="5" stroke-linecap="round"/><circle cx="${KX}" cy="${KY - 26}" r="3" fill="${C.cream}"/></g>
    <circle cx="${KX}" cy="${KY}" r="6" fill="#0A0A10"/><circle cx="${KX - 1.5}" cy="${KY - 1.5}" r="2" fill="#aab"/>
    <circle class="hit r-hit" cx="${KX}" cy="${KY}" r="56"/></g>
    <g><circle cx="718" cy="830" r="26" fill="#0B0C14" opacity=".5"/><circle cx="718" cy="830" r="23" fill="#14151F" stroke="#05060f" stroke-width="1.4"/><circle cx="718" cy="830" r="14" fill="#272A3A"/><path d="M718 832V814" stroke="${C.cream}" stroke-width="3" stroke-linecap="round" transform="rotate(-100 718 830)"/>
    <circle cx="790" cy="830" r="11" fill="#3A1A18" stroke="#05060f" stroke-width="1.4"/><circle cx="790" cy="830" r="6" fill="${C.madder}"/></g>`;

  // tawa
  const tawa = `<g id="r-tawa"><ellipse cx="800" cy="684" rx="196" ry="11" fill="#05060f" opacity=".4"/>
    <path d="M604 674Q606 688 800 692Q994 688 996 674Q994 682 800 684Q606 682 604 674Z" fill="#0A0A10"/><path d="M604 672V680Q700 696 800 696Q900 696 996 680V672Z" fill="url(#r-ironG)" stroke="#05060f" stroke-width="1.6"/>
    <ellipse cx="800" cy="672" rx="196" ry="13" fill="#17181F" stroke="#05060f" stroke-width="1.6"/><ellipse cx="800" cy="672" rx="178" ry="10" fill="#0D0E14"/>
    <path d="M700 668Q800 662 900 668" stroke="#6C7090" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M620 673Q640 678 680 679" stroke="#E9A860" stroke-opacity=".6" stroke-width="2" fill="none"/>
    <path d="M992 676Q1040 676 1080 680Q1110 684 1130 690" stroke="#05060f" stroke-width="10" fill="none" stroke-linecap="round"/><path d="M992 676Q1040 676 1080 680Q1110 684 1130 690" stroke="#2A2C3A" stroke-width="6" fill="none" stroke-linecap="round"/><path d="M1000 674Q1044 673 1080 677" stroke="#8C8FA8" stroke-opacity=".6" stroke-width="1.4" fill="none"/>
    <circle cx="1136" cy="692" r="7" fill="none" stroke="#05060f" stroke-width="5"/><circle cx="1136" cy="692" r="7" fill="none" stroke="#2A2C3A" stroke-width="2.4"/>
    <circle cx="1008" cy="676" r="2.4" fill="#8C8FA8"/><circle cx="1024" cy="676" r="2.4" fill="#8C8FA8"/>
    <ellipse class="hit r-hit" cx="800" cy="676" rx="204" ry="28"/><ellipse class="hit r-hit" cx="1080" cy="684" rx="62" ry="22"/></g>`;

  // dough
  const lumps = [];
  const tones = ['#F0E0B8', '#E2C890', '#D4B278', '#EAC78A', '#F4E8C8'];
  const N = 14;
  for (let i = 0; i < N; i++) {
    const a = Math.PI * (1 - i / (N - 1));
    let x = 800 + 146 * Math.cos(a), y = 527 + 22 * Math.sin(a);
    if (i === 9) x += 7;
    if (i === 8) x -= 5;
    const th = (Math.atan2(-21 * Math.cos(a), 146 * Math.sin(a)) * 180) / Math.PI;
    const rx = range(r, 21, 27), ry = range(r, 13, 16.5), tone = tones[Math.floor(r() * 5)];
    const dk = mix(tone, '#5A3418', 0.6), lit = shade(tone, 0.35);
    lumps.push(`<g class="lm" style="--i:${i}"><g transform="translate(${f(x)} ${f(y)}) rotate(${f(th)})">
      <path d="${blob(3, 5, rx, ry, 0.1, r, 12)}" fill="#12080A" opacity=".8"/>
      <path d="${blob(0, 0, rx, ry, 0.1, r, 12)}" fill="${tone}" stroke="#2A160D" stroke-opacity=".7" stroke-width="1.3"/>
      <path d="${blob(-rx * 0.1, -ry * 0.55, rx * 0.8, ry * 0.4, 0.15, r, 8)}" fill="${dk}" opacity=".3"/>
      <path d="${blob(rx * 0.15, ry * 0.5, rx * 0.7, ry * 0.32, 0.15, r, 8)}" fill="${lit}" opacity=".7"/>
      <ellipse cx="${f(-rx * 0.1)}" cy="${f(-ry * 0.1)}" rx="${f(rx * 0.34)}" ry="${f(ry * 0.34)}" fill="${dk}" opacity=".75" transform="rotate(-20)"/>
      <path d="M${f(-rx * 0.38)} ${f(ry * 0.12)}Q${f(-rx * 0.1)} ${f(ry * 0.4)} ${f(rx * 0.26)} ${f(ry * 0.1)}" fill="none" stroke="${lit}" stroke-width="1.8" stroke-linecap="round"/>
      <path d="M${f(rx * 0.55)} ${f(-ry * 0.2)}q4 4 0 9" stroke="${dk}" stroke-width="1.4" fill="none" opacity=".7"/></g></g>`);
  }
  const crackXs = Array.from({ length: 9 }, (_, i) => 674 + i * 31 + range(r, -6, 6));
  const cracks = crackXs.map((x, i) => {
    const a = Math.acos((x - 800) / 146), yc = 526 + 21 * Math.sin(a);
    const pts = [[x, yc - 16], [x + 4, yc - 8], [x - 3, yc - 1], [x + 4, yc + 7], [x - 1, yc + 15]];
    return `<g class="cr" style="--ci:${i}"><path d="M${pts.map(([px, py]) => `${f(px)} ${f(py)}`).join('L')}" stroke="#14080A" stroke-width="2.4" fill="none" stroke-linejoin="round"/>
      <path d="M${f(pts[2][0])} ${f(pts[2][1])}l${i % 2 ? 9 : -9} 4" stroke="#14080A" stroke-width="1.6" fill="none"/><path d="M${pts.map(([px, py]) => `${f(px + 1.5)} ${f(py)}`).join('L')}" stroke="#FFF1CC" stroke-opacity=".5" stroke-width=".9" fill="none"/>
      <path d="M${f(pts[1][0] - 2)} ${f(pts[1][1])}l5 3l-4 4z" fill="#14080A"/></g>`;
  }).join('');
  const dough = `<g id="r-dough"><ellipse class="gap" cx="835" cy="546" rx="9" ry="7" fill="#0B0406"/>${lumps.join('')}${cracks}<path class="hit r-hit" d="M650 520H950L956 566Q800 596 644 566Z"/></g>`;

  // rice inside rim
  const grains = `<ellipse cx="800" cy="518" rx="122" ry="15" fill="url(#r-riceG)"/><ellipse cx="800" cy="518" rx="122" ry="15" fill="url(#r-grain)"/>
    ${[0, 1, 2, 3, 4, 5].map(() => `<path d="${blob(range(r, 720, 880), range(r, 513, 524), range(r, 8, 18), 2.4, 0.2, r, 8)}" fill="${C.saffron}" opacity=".7"/>`).join('')}
    ${[0, 1, 2, 3].map(() => `<path d="${blob(range(r, 730, 870), range(r, 513, 523), 6, 2.4, 0.2, r, 7)}" fill="#6A3A1A" opacity=".85"/>`).join('')}
    ${[0, 1, 2, 3, 4].map(() => `<ellipse cx="${f(range(r, 730, 870))}" cy="${f(range(r, 512, 523))}" rx="3" ry="1.3" fill="${C.mint}"/>`).join('')}`;

  const lidPath = 'M652 523C660 490 730 474 800 474C870 474 940 490 948 523A148 22 0 0 1 652 523Z';
  const lid = `<g id="r-lid"><g class="lidT">
    <ellipse cx="800" cy="552" rx="138" ry="9" fill="#05060f" opacity="0"/>
    <path d="${lidPath}" fill="url(#r-lidG)" stroke="#1A0C08" stroke-width="2.4"/><path d="${lidPath}" fill="url(#r-dent)" opacity=".5"/>
    <path d="M676 500C700 484 740 479 780 478C740 484 706 494 690 512Z" fill="#05060f" opacity=".35"/>
    <path d="M906 484C928 492 940 504 944 518" stroke="#FFD9A0" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/>
    <path d="M653 523A147 21 0 0 0 947 523" fill="none" stroke="#E0A06A" stroke-width="3"/><path d="M653 521A147 21 0 0 0 947 521" fill="none" stroke="#1A0C08" stroke-opacity=".5" stroke-width="2"/>
    <ellipse cx="800" cy="474" rx="26" ry="5" fill="#1A0C08" opacity=".5"/>
    <path d="M794 474V462Q784 462 786 454Q800 446 814 454Q816 462 806 462V474Z" fill="#8A4A28" stroke="#1A0C08" stroke-width="1.8"/><path d="M806 456Q812 457 810 462" stroke="#FFD9A0" stroke-width="2" fill="none" opacity=".8"/>
    <path class="hit r-hit" d="M644 528C650 480 730 462 800 462C870 462 950 480 956 528Q800 560 644 528Z"/></g></g>`;

  const steam = `<g id="r-steam"><g clip-path="none">${[0, 1, 2].map((i) => {
    const dx = (i - 1) * 8;
    const d = `M${835 + dx} 546C${815 + dx} 500 ${860 + dx} 470 ${832 + dx} 420C${808 + dx} 372 ${852 + dx} 340 ${828 + dx} 290C${814 + dx} 262 ${838 + dx} 244 ${830 + dx} 220`;
    return `<g class="wp" style="--i:${i}"><path d="${d}" stroke="#DDE7FA" stroke-opacity=".2" stroke-width="22" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#E8F0FF" stroke-opacity=".55" stroke-width="8" fill="none" stroke-linecap="round"/><path d="${d}" stroke="#fff" stroke-opacity=".6" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
  }).join('')}</g><rect class="hit r-hit" x="772" y="190" width="140" height="280"/></g>`;

  const plume = `<g id="r-plume">${Array.from({ length: 16 }, (_, i) => { const t = i / 15, x = 800 + Math.sin(t * 5) * 38 + range(r, -26, 26), y = 490 - t * 280, rr = 30 + t * 36; return `<g class="pf" style="--i:${i}"><path d="${blob(x, y, rr * 1.2, rr * 0.8, 0.3, r, 9)}" fill="#E6EEFF" opacity="${f(0.26 - t * 0.1)}"/><path d="${blob(x - 5, y - 4, rr * 0.6, rr * 0.42, 0.3, r, 8)}" fill="#fff" opacity=".22"/></g>`; }).join('')}</g>`;

  const pot = `<g id="r-pot"><g class="potT">
    <ellipse cx="800" cy="670" rx="150" ry="8" fill="#05060f" opacity=".5"/>
    <ellipse cx="648" cy="566" rx="17" ry="23" transform="rotate(-18 648 566)" fill="none" stroke="#1A0C08" stroke-width="9"/><ellipse cx="648" cy="566" rx="17" ry="23" transform="rotate(-18 648 566)" fill="none" stroke="#9A4E2C" stroke-width="5"/>
    <ellipse cx="952" cy="566" rx="17" ry="23" transform="rotate(18 952 566)" fill="none" stroke="#1A0C08" stroke-width="9"/><ellipse cx="952" cy="566" rx="17" ry="23" transform="rotate(18 952 566)" fill="none" stroke="#E0A06A" stroke-width="5"/>
    <path d="${body}" fill="url(#r-potG)" stroke="#12060A" stroke-width="2.6"/><path d="${body}" fill="url(#r-dent)" opacity=".7"/><path d="${body}" fill="url(#r-potV)"/>
    <path d="M668 590C650 610 656 636 690 656C672 640 662 616 676 592Z" fill="url(#r-potdots)"/>
    <path d="M652 600Q800 622 948 600" stroke="#12060A" stroke-opacity=".55" stroke-width="3" fill="none"/><path d="M653 603Q800 625 947 603" stroke="#FFD9A0" stroke-opacity=".45" stroke-width="1.5" fill="none"/>
    <path d="M700 662Q800 676 900 662L896 668H704Z" fill="#05060f" opacity=".55"/>
    <path d="M926 572C950 596 944 628 918 652" stroke="#FFE7B8" stroke-opacity=".55" stroke-width="3.4" fill="none" stroke-linecap="round"/><path d="M926 572C950 596 944 628 918 652" stroke="#FFE7B8" stroke-opacity=".18" stroke-width="10" fill="none" stroke-linecap="round"/>
    <ellipse cx="800" cy="521" rx="142" ry="21" fill="#E3A15F" stroke="#12060A" stroke-width="2"/><ellipse cx="800" cy="520" rx="130" ry="16.5" fill="#1D0E0A"/>
    ${grains}
    <path d="M668 514A136 19 0 0 1 930 512" stroke="#FFD9A0" stroke-opacity=".8" stroke-width="2.2" fill="none"/>
    ${lid}${dough}${steam}${plume}</g></g>`;

  // counter slab and cabinet
  const slab = `<path d="M-220 744H1820V1100H-220Z" fill="url(#r-cabG)"/>
    <path d="M-220 740H1820V760H-220Z" fill="url(#r-counterG)"/><path d="M-220 740H1820" stroke="#B9B5D8" stroke-opacity=".6" stroke-width="2.4"/><path d="M-220 760H1820" stroke="#05060f" stroke-width="3"/>
    ${[[-120, 240], [300, 240], [1040, 240], [1360, 240]].map(([x, w], i) => `<path d="${poly([[x, 790], [x + w, 790], [x + w, 1010], [x, 1010]], 1.6, r)}" fill="#0F1330" stroke="#2C3875" stroke-width="2"/><path d="M${x + 8} 798H${x + w - 8}" stroke="#4658B0" stroke-opacity=".4" stroke-width="2"/><circle cx="${x + (i % 2 ? 40 : w - 40)}" cy="830" r="8" fill="#B8892A" stroke="#05060f" stroke-width="1.6"/><circle cx="${x + (i % 2 ? 38 : w - 42)}" cy="828" r="2.6" fill="#FFE7A0"/>`).join('')}
    <path d="M-220 780H1820" stroke="#05060f" stroke-opacity=".45" stroke-width="6"/>
    <ellipse cx="800" cy="765" rx="190" ry="10" fill="#05060f" opacity=".55"/>`;

  // counter objects
  const dabba = `<g transform="translate(190 0)">${hgrad('r-steelG', '#8A93B0', -0.6, 0.4)}
    <ellipse cx="0" cy="742" rx="86" ry="14" fill="#05060f" opacity=".55"/>
    <path d="M-80 724V741Q0 764 80 741V724Z" fill="url(#r-steelG)" stroke="#05060f" stroke-width="2"/><path d="M60 728V748" stroke="#fff" stroke-opacity=".4" stroke-width="3"/>
    <ellipse cx="0" cy="724" rx="82" ry="20" fill="#C6CBDE" stroke="#05060f" stroke-width="2"/><ellipse cx="0" cy="726" rx="72" ry="16" fill="#1A1C2C"/>
    ${[[0, 0, '#A33B2C'], [-30, -4, '#E8B21A'], [30, -4, '#7A4A22'], [-30, 6, '#5E8C4A'], [30, 6, '#D9701E'], [0, -8, '#4A2A14'], [0, 8, '#EBD9B0']].map(([x, y, col]) => `<g transform="translate(${x} ${726 + y})"><ellipse rx="14" ry="6" fill="#9AA2BE" stroke="#05060f" stroke-width="1"/><ellipse cy="-1" rx="11" ry="4.5" fill="${col}"/><ellipse cx="-3" cy="-2.4" rx="4.5" ry="1.4" fill="#fff" opacity=".4"/></g>`).join('')}
    <path d="M-64 716Q-30 704 -6 710" stroke="#aab" stroke-width="3" fill="none" stroke-linecap="round"/><ellipse cx="-66" cy="716" rx="5" ry="3" fill="#aab"/>
    <path d="M-72 720A80 18 0 0 1 80 718" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="2"/>
    ${[0, 1, 2, 3, 4, 5, 6, 7].map(() => `<circle cx="${f(range(r, 96, 150))}" cy="${f(range(r, 744, 756))}" r="${f(range(r, 1, 2.4))}" fill="#E8B21A" opacity=".85"/>`).join('')}</g>`;
  const milk = `<g><ellipse cx="1290" cy="738" rx="46" ry="9" fill="#05060f" opacity=".5"/><path d="M1252 712Q1254 744 1290 746Q1326 744 1328 712Z" fill="url(#r-steelG)" stroke="#05060f" stroke-width="2"/><ellipse cx="1290" cy="712" rx="38" ry="8" fill="#C6CBDE" stroke="#05060f" stroke-width="1.6"/><ellipse cx="1290" cy="713" rx="32" ry="6" fill="#E6891A"/><ellipse cx="1280" cy="712" rx="12" ry="2" fill="#FFD27A" opacity=".8"/><path d="M1262 722Q1264 738 1278 742" stroke="#fff" stroke-opacity=".45" stroke-width="2.4" fill="none"/></g>`;
  const onions = `<g><ellipse cx="1410" cy="744" rx="70" ry="9" fill="#05060f" opacity=".5"/><path d="M1344 730Q1410 752 1476 730L1470 738Q1410 756 1350 738Z" fill="#9AA2BE" stroke="#05060f" stroke-width="1.6"/><ellipse cx="1410" cy="729" rx="66" ry="10" fill="#C6CBDE" stroke="#05060f" stroke-width="1.6"/>
    ${Array.from({ length: 26 }, () => `<path d="${blob(range(r, 1368, 1452), range(r, 716, 728), range(r, 6, 11), range(r, 2.4, 4.4), 0.25, r, 8)}" fill="${['#5A2F16', '#8A4A1C', '#B8702A', '#3E2010'][Math.floor(r() * 4)]}" stroke="#2A1408" stroke-width=".7"/>`).join('')}
    ${Array.from({ length: 8 }, () => `<ellipse cx="${f(range(r, 1372, 1448))}" cy="${f(range(r, 714, 726))}" rx="4" ry="1.3" fill="#F2B04A" opacity=".8"/>`).join('')}</g>`;
  const chai = `<g><ellipse cx="1520" cy="744" rx="42" ry="7" fill="#05060f" opacity=".5"/><ellipse cx="1520" cy="738" rx="38" ry="8" fill="#EDE4D0" stroke="#05060f" stroke-width="1.6"/><ellipse cx="1520" cy="737" rx="28" ry="5" fill="#C9B890"/>
    <path d="M1500 692Q1498 730 1508 736H1532Q1542 730 1540 692Z" fill="#E8EEF8" fill-opacity=".28" stroke="#05060f" stroke-width="1.6"/><path d="M1500 702H1540Q1540 730 1532 736H1508Q1498 730 1500 702Z" fill="#B8651E"/><ellipse cx="1520" cy="702" rx="20" ry="4" fill="#D9892E"/><path d="M1506 704V730" stroke="#fff" stroke-opacity=".5" stroke-width="2.4"/>
    <path d="M1514 684Q1506 668 1516 654M1526 686Q1534 670 1524 656" stroke="#DDE7FA" stroke-opacity=".4" stroke-width="3" fill="none" stroke-linecap="round"/></g>`;
  const matchbox = `<g transform="rotate(-6 1352 738)"><rect x="1330" y="727" width="44" height="14" fill="#05060f" opacity=".5" transform="translate(3 3)"/><path d="${wobble([[1330, 727], [1374, 727], [1374, 741], [1330, 741]], 0.6, r)}" fill="${C.madder}" stroke="#05060f" stroke-width="1.4"/><rect x="1336" y="730" width="32" height="8" fill="${C.cream}"/><path d="M1352 737Q1346 733 1352 729Q1358 733 1352 737Z" fill="${C.saffron}"/></g>`;
  const upShadow = `<ellipse cx="800" cy="420" rx="230" ry="300" fill="url(#r-shadowUp)"/>`;

  const inner = `<defs>${defs.join('')}</defs>${upShadow}${slab}${dabba}${milk}${onions}${chai}${matchbox}${stove}${knob}${flame}${tawa}${pot}`;
  return plane('r-counter', 0.78, inner, { label: 'The stove, with the copper pot, the tawa and the knob' });
}

/* ------------------------------------------------------------------ motes, foreground */
function motesPlane() {
  const r = rng(404);
  const ms = Array.from({ length: 40 }, (_, i) => {
    const x = range(r, 560, 1040), y = range(r, 300, 700), rr = Math.min(1, Math.abs(x - 800) / 240);
    const col = [C.saffron, C.cream, C.copper, '#FFD27A'][i % 4];
    return `<g class="m" style="--r:${f(rr)}"><g class="mi" style="--i:${i}"><circle cx="${f(x)}" cy="${f(y)}" r="${f(range(r, 1.4, 3.4))}" fill="${col}"/><circle cx="${f(x)}" cy="${f(y)}" r="6" fill="${col}" opacity=".18"/></g></g>`;
  }).join('');
  return plane('r-motesP', 0.86, `<g id="r-motes">${ms}</g>`);
}

function fgPlane() {
  const r = rng(808);
  const chilli = `<g id="r-chilli"><path d="M0 0C9 30 14 74 5 126C3 131 -3 131 -5 126C-12 74 -8 30 0 0Z" fill="currentColor" stroke="#1A0606" stroke-width="2"/>
    <path d="M5 8C11 40 12 80 4 120" stroke="#FFB070" stroke-opacity=".7" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M-5 10C-9 40 -8 80 -3 118" stroke="#000" stroke-opacity=".3" stroke-width="3" fill="none"/>
    <path d="M-6 -2Q0 -10 6 -2L4 6H-4Z" fill="#3E6A34" stroke="#10200E" stroke-width="1.6"/><path d="M0 -8Q3 -16 8 -18" stroke="#3E6A34" stroke-width="2.4" fill="none" stroke-linecap="round"/></g>`;
  const garlic = `<g id="r-garlic"><path d="M0 -16C-4 -10 -22 -4 -22 12C-22 30 -8 36 0 36C8 36 22 30 22 12C22 -4 4 -10 0 -16Z" fill="#E4E0D4" stroke="#1B1E3A" stroke-width="2.2"/>
    <path d="M0 -14C-14 0 -16 24 0 36C-4 18 -4 0 0 -14Z" fill="#9AA3C8" opacity=".7"/><path d="M0 -14C16 2 18 24 0 36" fill="none" stroke="#8C94BC" stroke-width="1.6"/><path d="M-10 -6C-14 10 -10 26 -4 34M10 -6C14 10 10 26 4 34" stroke="#7C84AE" stroke-width="1.4" fill="none"/>
    <path d="M13 0C19 12 15 26 7 33" stroke="#FFF7E8" stroke-opacity=".8" stroke-width="2.4" fill="none" stroke-linecap="round"/><path d="M0 36l-3 6h6z" fill="#6B4A2A"/></g>`;
  const rope = 'M-140 -30Q200 70 640 6';
  const chillies = Array.from({ length: 14 }, (_, i) => {
    const t = (i + 0.5) / 14, x = -120 + t * 740, y = -30 + 2 * t * (1 - t) * 100 + 36 * t * t - 6 * t + (1 - t) * 0;
    const rot = range(r, -12, 12), col = ['#A33B2C', '#B84030', '#8E2E24', '#C24A36'][i % 4], sc = range(r, 0.8, 1.05);
    return `<use href="#r-chilli" color="${col}" transform="translate(${f(x)} ${f(y + 2)}) rotate(${f(rot)}) scale(${f(sc)})"/>`;
  }).join('');
  const braid = `<g><path d="M588 -110V230" stroke="#1B1E3A" stroke-width="12"/><path d="M588 -110V230" stroke="#6B4A2A" stroke-width="7" stroke-dasharray="14 4"/>
    ${Array.from({ length: 8 }, (_, i) => `<use href="#r-garlic" transform="translate(${588 + (i % 2 ? 22 : -22)} ${-30 + i * 34}) rotate(${i % 2 ? 14 : -14}) scale(${f(1.15 - i * 0.03)})"/>`).join('')}</g>`;
  const pan = (cx, cy, rad, ang, k) => `<g transform="rotate(${ang} ${cx} ${cy})">
    <rect x="${cx + rad - 6}" y="${cy - 9}" width="150" height="18" rx="9" fill="#1E0E0A" stroke="#0A0404" stroke-width="2"/><path d="M${cx + rad + 4} ${cy - 5}H${cx + rad + 140}" stroke="#E0A06A" stroke-opacity=".6" stroke-width="2"/><circle cx="${cx + rad + 132}" cy="${cy}" r="4" fill="#05060f"/>
    <circle cx="${cx}" cy="${cy}" r="${rad + 6}" fill="#4A2012" stroke="#0A0404" stroke-width="3"/><circle cx="${cx}" cy="${cy}" r="${rad}" fill="url(#r-pan${k})" stroke="#0A0404" stroke-width="2"/>
    ${[0.8, 0.6, 0.38, 0.18].map((q) => `<circle cx="${cx}" cy="${cy}" r="${f(rad * q)}" fill="none" stroke="#0A0404" stroke-opacity=".4" stroke-width="2"/>`).join('')}
    <path d="M${cx + rad * 0.92} ${cy - rad * 0.4}A${rad} ${rad} 0 0 1 ${cx + rad * 0.5} ${cy + rad * 0.82}" stroke="#F2A516" stroke-opacity=".8" stroke-width="3.4" fill="none" stroke-linecap="round"/><ellipse cx="${cx - rad * 0.3}" cy="${cy - rad * 0.35}" rx="${rad * 0.22}" ry="${rad * 0.1}" fill="#E0A06A" opacity=".25" transform="rotate(-35 ${cx - rad * 0.3} ${cy - rad * 0.35})"/></g>`;
  const pans = `<defs>${[0, 1, 2].map((k) => radial(`r-pan${k}`, [[0, '#7A3A22'], [0.7, '#4A2012'], [1, '#2A1008']], { cx: 0.62, cy: 0.62, r: 0.62 })).join('')}${hgrad('r-vessel', '#8E6A22', -0.66, 0.3)}${hgrad('r-plateG', '#8A93B0', -0.55, 0.3)}</defs>
    ${pan(1360, 100, 96, -30, 0)}${pan(1200, 20, 70, 24, 1)}${pan(1520, -30, 60, -52, 2)}`;
  const vessel = `<g transform="translate(130 0)"><ellipse cx="0" cy="1000" rx="150" ry="14" fill="#000" opacity=".5"/><path d="M-130 1100V1000Q-136 940 -70 920Q-50 880 -70 850Q-60 836 -48 834H48Q60 836 70 850Q50 880 70 920Q136 940 130 1000V1100Z" fill="url(#r-vessel)" stroke="#0A0804" stroke-width="3"/>
    <path d="M-100 960Q0 982 100 960M-112 1000Q0 1024 112 1000" stroke="#4A340E" stroke-width="3" fill="none"/><path d="M-70 850Q0 868 70 850" stroke="#4A340E" stroke-width="3" fill="none"/>
    <ellipse cx="0" cy="834" rx="52" ry="9" fill="#2B1A0A" stroke="#0A0804" stroke-width="2"/><path d="M96 944C114 968 112 1010 100 1040" stroke="#FFE7A0" stroke-opacity=".7" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M48 836H-48" stroke="#FFE7A0" stroke-opacity=".5" stroke-width="2.4"/></g>`;
  const plates = `<g>${[0, 1, 2].map((i) => `<g><ellipse cx="${1440 - i * 6}" cy="${1010 - i * 14}" rx="${210 - i * 6}" ry="${40 - i}" fill="url(#r-plateG)" stroke="#05060f" stroke-width="2.4"/><ellipse cx="${1440 - i * 6}" cy="${1007 - i * 14}" rx="${186 - i * 6}" ry="${32 - i}" fill="#3A4264" opacity=".6"/><path d="M${1240 - i * 6} ${1006 - i * 14}A210 40 0 0 0 ${1640 - i * 6} ${1006 - i * 14}" stroke="#FFE7B8" stroke-opacity=".7" stroke-width="2.4" fill="none"/></g>`).join('')}
    <g transform="translate(1040 1060)"><path d="M-90 0Q-80 -60 0 -62Q80 -60 90 0Z" fill="url(#r-vessel)" stroke="#0A0804" stroke-width="3"/><ellipse cx="0" cy="-62" rx="82" ry="12" fill="#2B1A0A" stroke="#0A0804" stroke-width="2"/><path d="M50 -50C70 -36 74 -16 70 -4" stroke="#FFE7A0" stroke-opacity=".7" stroke-width="4" fill="none" stroke-linecap="round"/></g></g>`;
  const inner = `<defs>${chilli}${garlic}</defs>
    <path d="${rope}" stroke="#05060f" stroke-width="9" fill="none"/><path d="${rope}" stroke="#7A5A34" stroke-width="5" fill="none" stroke-dasharray="9 3"/>
    ${chillies}${braid}${pans}${vessel}${plates}`;
  return plane('r-fg', 1, inner);
}

/* ------------------------------------------------------------------ */
export function room(opts = {}) {
  const m = MOODS[opts.mood] || MOODS.night;
  const R = rng(opts.seed || 3);
  return [
    skyPlane(m, R),
    skylinePlane(),
    rainPlane('r-rainF', 0.13, 11, 70, '#9AA8E0', 0.28, 1.3, 20, m),
    roofsPlane(),
    rainPlane('r-rainN', 0.3, 12, 80, '#C9D4F5', 0.38, 1.6, 30, m),
    wallPlane(m),
    glowPlane(m),
    counterPlane(m),
    heatPlane(m),
    shadePlane(m),
    overlayPlane(m),
    motesPlane(),
    fgPlane(),
  ].filter(Boolean);
}
