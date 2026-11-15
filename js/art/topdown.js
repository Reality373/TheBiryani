// The pot, plate and bowl seen from above, plus seven spice icons. Same paper-cut construction as
// kitchen.js: flat shapes, a baked offset shadow under each, hand-cut edges, token colours (and
// darker or lighter shades of them). State is set with attributes on the root <svg>
// (data-show, data-eaten, data-egg); css/app.css turns those into the picture.

function rng(seed) {
  let s = seed;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}
const f = (n) => n.toFixed(1);

// A wobbly closed blob (hand-cut circle) through n points, smoothed with quadratic midpoints.
function blob(cx, cy, r, seed, k = 0.06, n = 14, sy = 1) {
  const next = rng(seed);
  const pts = [];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const rr = r * (1 + (next() - 0.5) * 2 * k);
    pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * sy]);
  }
  const mid = (a, b) => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
  let d = `M${f(mid(pts[n - 1], pts[0])[0])} ${f(mid(pts[n - 1], pts[0])[1])}`;
  for (let i = 0; i < n; i++) {
    const m = mid(pts[i], pts[(i + 1) % n]);
    d += `Q${f(pts[i][0])} ${f(pts[i][1])} ${f(m[0])} ${f(m[1])}`;
  }
  return d + 'z';
}

// Short grain strokes scattered inside a disc, lit ones lighter.
function grains(cx, cy, r, count, seed, cols = ['#FFF6E3', '#CDB98C', '#EBDDBB']) {
  const next = rng(seed);
  let out = '';
  for (const [ci, col] of cols.entries()) {
    let d = '';
    for (let i = 0; i < count / cols.length; i++) {
      const a = next() * 6.283;
      const rr = Math.sqrt(next()) * r;
      const x = cx + Math.cos(a) * rr;
      const y = cy + Math.sin(a) * rr;
      const t = next() * 3.14;
      const l = 4 + next() * 4;
      d += `M${f(x)} ${f(y)}l${f(Math.cos(t) * l)} ${f(Math.sin(t) * l)}`;
    }
    out += `<path d="${d}" fill="none" stroke="${col}" stroke-width="${ci ? 2.2 : 2.6}" stroke-linecap="round"/>`;
  }
  return out;
}

// Saffron streaks: curved, tapered, a deeper orange core.
function streaks(cx, cy, r, count, seed) {
  const next = rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const a = next() * 6.283;
    const rr = Math.sqrt(next()) * r * 0.9;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    const t = next() * 6.283;
    const l = 14 + next() * 14;
    const dx = Math.cos(t) * l;
    const dy = Math.sin(t) * l;
    const bend = (next() - 0.5) * 14;
    const d = `M${f(x)} ${f(y)}q${f(dx / 2 - dy * 0.2 + bend)} ${f(dy / 2 + dx * 0.2)} ${f(dx)} ${f(dy)}`;
    out += `<path d="${d}" fill="none" stroke="#F2A516" stroke-width="${f(3.5 + next() * 2)}" stroke-linecap="round" opacity=".92"/>`;
    out += `<path d="${d}" fill="none" stroke="#D9791A" stroke-width="1.4" stroke-linecap="round" opacity=".7"/>`;
  }
  return out;
}

// Fried onion curls: dark arcs with a lit edge.
function curls(cx, cy, r, count, seed) {
  const next = rng(seed);
  let out = '';
  for (let i = 0; i < count; i++) {
    const a = next() * 6.283;
    const rr = Math.sqrt(next()) * r;
    const x = cx + Math.cos(a) * rr;
    const y = cy + Math.sin(a) * rr;
    const t = next() * 6.283;
    const l = 8 + next() * 9;
    const d = `M${f(x)} ${f(y)}q${f(Math.cos(t) * l)} ${f(Math.sin(t) * l)} ${f(Math.cos(t + 1.4) * l)} ${f(Math.sin(t + 1.4) * l)}`;
    out += `<path d="${d}" fill="none" stroke="#3A1C0E" stroke-width="4" stroke-linecap="round" transform="translate(1.5 2)" opacity=".6"/>`;
    out += `<path d="${d}" fill="none" stroke="#6B3418" stroke-width="3" stroke-linecap="round"/>`;
    out += `<path d="${d}" fill="none" stroke="#A8642C" stroke-width="1.300" stroke-linecap="round" transform="translate(-.8 -.8)"/>`;
  }
  return out;
}

// A mint leaf: pointed oval with a midrib, rotated to deg.
const mint = (x, y, deg, s = 1) => `
  <g transform="translate(${x} ${y}) rotate(${deg}) scale(${s})">
    <path d="M-9 2Q0 12 11 2Q0-9-9 2z" fill="#2C4A22" opacity=".6" transform="translate(1.5 2)"/>
    <path d="M-9 0Q0 10 11 0Q0-11-9 0z" fill="#5E8C4A"/>
    <path d="M-9 0Q0-11 11 0Q2-4-9 0z" fill="#7BA85F"/>
    <path d="M-8 0L10 0" stroke="#3F6234" stroke-width="1.100" stroke-linecap="round"/>
  </g>`;

// A piece of chicken: browned, irregular, with a charred edge and a lit top.
function chicken(x, y, r, seed) {
  return `
  <path d="${blob(x + 3, y + 4, r, seed, 0.18, 9, 0.8)}" fill="#0A0D18" opacity=".45"/>
  <path d="${blob(x, y, r, seed, 0.18, 9, 0.8)}" fill="#8F4B27"/>
  <path d="${blob(x - 1.500, y - 2, r * 0.8, seed + 1, 0.2, 8, 0.78)}" fill="#B8693A"/>
  <path d="${blob(x - 3, y - 4, r * 0.4, seed + 2, 0.25, 7, 0.7)}" fill="#DC9460"/>
  <path d="M${f(x - r * 0.4)} ${f(y + r * 0.2)}q${f(r * 0.4)} ${f(r * 0.3)} ${f(r * 0.9)} ${f(-r * 0.1)}" fill="none" stroke="#5A2A14" stroke-width="2" stroke-linecap="round"/>
  <ellipse cx="${f(x + r * 0.35)}" cy="${f(y - r * 0.1)}" rx="3" ry="1.600" fill="#F2A516" opacity=".7"/>`;
}

// One biryani portion: a shadowed disc of rice (mound, lit from upper left), grains, saffron, onion,
// and chicken from the second portion on. Smaller portions sit up and left, so the heap has a peak.
function portion(i) {
  const R = [0, 128, 102, 80, 60, 42, 26][i];
  const cx = 200 - (i - 1) * 1.600;
  const cy = 368 - (i - 1) * 2.600;
  let chick = '';
  if (i >= 2) {
    // sit the pieces in the ring the next portion leaves uncovered
    const inner = [0, 0, 80, 60, 42, 26, 0][i];
    const d = i === 6 ? 0 : (R + inner) / 2 - 2;
    const n = i === 6 ? 1 : [0, 0, 5, 4, 3, 2][i];
    for (let c = 0; c < n; c++) {
      const a = (c / n) * 6.283 + i * 1.3;
      chick += chicken(cx + Math.cos(a) * d, cy + Math.sin(a) * d, i === 6 ? 11 : 12, 90 + i * 7 + c);
    }
  }
  return `
  <g id="t-portion-${i}">
    <path d="${blob(cx + 5, cy + 6, R, 70 + i, 0.05, 16)}" fill="#0A0D18" opacity=".4"/>
    <path d="${blob(cx, cy, R, 70 + i, 0.05, 16)}" fill="#E6D6B0"/>
    <path d="${blob(cx - R * 0.07, cy - R * 0.08, R * 0.9, 80 + i, 0.05, 16)}" fill="#F6EBD3"/>
    ${grains(cx, cy, R * 0.9, 34 + i * 8, 100 + i)}
    ${streaks(cx, cy, R * 0.8, i === 1 ? 7 : 3, 120 + i)}
    ${i === 1 ? curls(cx, cy, R * 0.85, 6, 130) + mint(cx - 70, cy + 22, 30) + mint(cx + 62, cy - 40, -40) : ''}
    ${chick}
    ${i === 3 ? curls(cx, cy, R * 0.6, 3, 140) + mint(cx + 22, cy + 14, 70, 0.9) : ''}
    ${i === 5 ? mint(cx + 4, cy + 6, -20, 0.8) : ''}
  </g>`;
}

const plateBowl = (cx, cy, r, seed, fill, extra) => `
  <path d="${blob(cx + 6, cy + 8, r + 8, seed, 0.02, 18)}" fill="#0A0D18" opacity=".5"/>
  <path d="${blob(cx, cy, r + 8, seed, 0.02, 18)}" fill="#8A93B3"/>
  <path d="${blob(cx - 1, cy - 1, r + 4, seed + 1, 0.02, 18)}" fill="#C4CBDE"/>
  <path d="${blob(cx + 2, cy + 2, r - 6, seed + 2, 0.02, 18)}" fill="#6F789A"/>
  <path d="${blob(cx, cy, r - 8, seed + 3, 0.03, 18)}" fill="${fill}"/>
  ${extra}`;

// Spice icons, each drawn on a 48 x 48 grid so they read at 44 px.
const EGGS = {
  elaichi: `
    <path d="M7 31C9 14 33 7 43 17C40 35 17 43 7 31z" fill="#0A0D18" opacity=".4" transform="translate(1.500 2)"/>
    <path d="M6 30C8 13 32 6 42 16C39 34 16 42 6 30z" fill="#5E8C4A"/>
    <path d="M6 30C8 13 32 6 42 16C28 14 14 20 6 30z" fill="#7BA85F"/>
    <path d="M10 33C18 22 30 17 40 18M12 36C22 27 32 22 41 22" fill="none" stroke="#3F6234" stroke-width="1.600" stroke-linecap="round"/>
    <path d="M6 30l-3 3M42 16l3-3" stroke="#3F6234" stroke-width="2.400" stroke-linecap="round"/>`,
  clove: `
    <path d="M22 17Q24 32 25 45Q27 32 28 17z" fill="#0A0D18" opacity=".4" transform="translate(2 2)"/>
    <path d="M20 16Q23 32 24 45Q26 32 28 16z" fill="#6B3418"/>
    <path d="M20 16Q22 30 24 45Q22 30 22.500 16z" fill="#8F4B27"/>
    <path d="M24 3L29 8L24 13L19 8z" fill="#3A1C0E"/>
    <circle cx="24" cy="8" r="6.500" fill="#6B3418"/>
    <circle cx="22" cy="6" r="2.400" fill="#A8642C"/>
    <path d="M17 17Q24 12 31 17L28 20Q24 17 20 20z" fill="#8F4B27"/>
    <path d="M16 16L12 12M32 16L36 12M18 21L13 24M30 21L35 24" stroke="#6B3418" stroke-width="3" stroke-linecap="round"/>`,
  cinnamon: `
    <g transform="rotate(-32 24 24)">
      <rect x="2" y="15" width="44" height="18" rx="7" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
      <rect x="1" y="14" width="44" height="18" rx="7" fill="#8F4B27"/>
      <rect x="1" y="14" width="44" height="9" rx="5" fill="#B8693A"/>
      <path d="M8 19H38M6 27H36" stroke="#6B3418" stroke-width="1.500" stroke-linecap="round"/>
      <ellipse cx="42" cy="23" rx="4" ry="9" fill="#DC9460"/>
      <path d="M42 17Q38 20 42 23Q45 25 42 28" fill="none" stroke="#6B3418" stroke-width="1.600" stroke-linecap="round"/>
    </g>`,
  pepper: `
    <circle cx="16" cy="29" r="12" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
    <circle cx="15" cy="28" r="12" fill="#3B2A22"/>
    <circle cx="11" cy="24" r="4.500" fill="#5E4638"/>
    <path d="M7 31Q15 36 22 30M9 21Q14 18 19 22" fill="none" stroke="#1E1410" stroke-width="1.500" stroke-linecap="round"/>
    <circle cx="33" cy="17" r="9.500" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
    <circle cx="32" cy="16" r="9.500" fill="#4A362C"/>
    <circle cx="29" cy="13" r="3.600" fill="#6E5444"/>
    <path d="M25 19Q32 24 38 17" fill="none" stroke="#1E1410" stroke-width="1.400" stroke-linecap="round"/>`,
  bayleaf: `
    <g transform="rotate(-38 24 24)">
      <path d="M2 25Q22 9 47 24Q22 40 2 25z" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
      <path d="M2 24Q22 8 47 23Q22 39 2 24z" fill="#7C8A3E"/>
      <path d="M2 24Q22 8 47 23Q24 17 2 24z" fill="#9AA84F"/>
      <path d="M2 24L47 23" stroke="#4E5A25" stroke-width="1.800" stroke-linecap="round"/>
      <path d="M8 24Q24 14 44 23M8 24Q24 33 44 23" fill="none" stroke="#5E6B2D" stroke-width="1.300" stroke-linecap="round"/>
      <path d="M2 24L-1 25" stroke="#4E5A25" stroke-width="2.400" stroke-linecap="round"/>
    </g>`,
  chilli: `
    <path d="M9 12C22 10 38 18 40 42C32 30 22 24 9 20z" fill="#0A0D18" opacity=".4" transform="translate(2 3)"/>
    <path d="M8 11C22 9 38 17 40 42C31 29 21 23 8 19z" fill="#5E8C4A"/>
    <path d="M8 11C22 9 36 15 40 32C30 20 20 15 8 14z" fill="#7BA85F"/>
    <path d="M13 14C24 15 32 22 37 34" fill="none" stroke="#F6EBD3" stroke-width="2" stroke-linecap="round"/>
    <path d="M16 15l2 2M22 17l2 2M28 21l2 2" stroke="#3F6234" stroke-width="1.500" stroke-linecap="round"/>
    <path d="M4 8Q9 5 12 10L9 20Q4 15 4 8z" fill="#3F6234"/>
    <path d="M4 8L1 5" stroke="#3F6234" stroke-width="2.500" stroke-linecap="round"/>`,
  staranise: (() => {
    let petals = '';
    for (let i = 0; i < 8; i++) {
      petals += `<path d="M0 -3Q-6.500 -12 0 -21Q6.500 -12 0 -3z" transform="rotate(${i * 45})" fill="#7A3A1C"/>`;
      petals += `<path d="M0 -4Q-3.500 -12 0 -19Q-1 -12 0 -4z" transform="rotate(${i * 45})" fill="#A8642C"/>`;
    }
    return `
    <g transform="translate(26 27)" opacity=".4" fill="#0A0D18">${petals.replace(/#\w{6}/g, '#0A0D18')}</g>
    <g transform="translate(24 24)">${petals}<circle r="5" fill="#5A2A14"/><ellipse cx="-1" cy="-1" rx="2.200" ry="3" fill="#D9A05F"/></g>`;
  })(),
};
const symbols = Object.entries(EGGS)
  .map(([id, art]) => `<symbol id="t-egg-${id}" viewBox="0 0 48 48">${art}</symbol>`)
  .join('');
const eggUses = Object.keys(EGGS)
  .map((id) => `<use href="#t-egg-${id}" x="146" y="379" width="58" height="58"/>`)
  .join('');

export const topdownSVG = `
<svg id="top" class="art" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-show="pot">
  <defs>
    <radialGradient id="t-lamp" cx=".3" cy=".25" r=".85">
      <stop offset="0" stop-color="#FFE2A6" stop-opacity=".5"/>
      <stop offset=".5" stop-color="#F2A516" stop-opacity=".12"/>
      <stop offset="1" stop-color="#F2A516" stop-opacity="0"/>
    </radialGradient>
    <clipPath id="t-pot-clip"><path d="${blob(200, 400, 138, 5, 0.03, 18)}"/></clipPath>
    ${symbols}
  </defs>

  <rect width="400" height="800" fill="#141A2E"/>

  <!-- the open pot from above -->
  <g id="t-pot">
    <path d="${blob(207, 410, 160, 1, 0.012, 20)}" fill="#0A0D18" opacity=".55"/>
    <rect x="22" y="386" width="32" height="26" rx="8" fill="#8F4B27"/>
    <rect x="346" y="386" width="32" height="26" rx="8" fill="#8F4B27"/>
    <path d="${blob(200, 400, 160, 1, 0.012, 20)}" fill="#B8693A"/>
    <path d="M70 330C90 280 150 262 210 258C150 270 100 296 80 350z" fill="#DC9460"/>
    <path d="${blob(200, 400, 148, 2, 0.015, 20)}" fill="#8F4B27"/>
    <path d="${blob(204, 404, 138, 3, 0.02, 18)}" fill="#5A2A14"/>
    <path d="${blob(200, 400, 138, 5, 0.03, 18)}" fill="#E6D6B0"/>
    <g clip-path="url(#t-pot-clip)">
      <path d="${blob(197, 397, 128, 6, 0.04, 18)}" fill="#F6EBD3"/>
      ${grains(200, 400, 132, 190, 11)}
      ${streaks(200, 400, 120, 9, 17)}
      ${curls(200, 400, 114, 26, 23)}
      <path d="${blob(200, 400, 138, 5, 0.03, 18)}" fill="none" stroke="#5A2A14" stroke-width="6" opacity=".35"/>
    </g>
    ${mint(150, 360, 25)}${mint(250, 440, -30)}${mint(210, 345, 80, 0.9)}${mint(160, 450, 160, 0.9)}${mint(262, 372, 120, 0.8)}
    <circle cx="200" cy="400" r="160" fill="url(#t-lamp)"/>
  </g>

  <!-- the plate: table, steel plate, rings and lemon, then the mound -->
  <rect id="t-table" width="400" height="800" fill="#241410"/>
  <g transform="translate(200 300) scale(.84) translate(-200 -360)">
  <g id="t-plate">
    <path d="${blob(207, 370, 172, 31, 0.012, 22)}" fill="#0A0D18" opacity=".55"/>
    <path d="${blob(200, 360, 170, 31, 0.012, 22)}" fill="#8A93B3"/>
    <path d="${blob(200, 360, 164, 32, 0.012, 22)}" fill="#C4CBDE"/>
    <path d="${blob(202, 362, 142, 33, 0.012, 22)}" fill="#6F789A"/>
    <path d="${blob(200, 360, 138, 34, 0.012, 22)}" fill="#A9B0C6"/>
    <path d="M84 274C106 230 146 212 186 208C150 226 120 250 102 292z" fill="#E4E8F2" opacity=".45"/>
    <circle cx="200" cy="360" r="168" fill="url(#t-lamp)"/>
    <!-- two onion rings -->
    <g fill="none">
      <ellipse cx="292" cy="258" rx="19" ry="15" stroke="#0A0D18" stroke-width="8" opacity=".4" transform="translate(3 4) rotate(-20 292 258)"/>
      <ellipse cx="292" cy="258" rx="19" ry="15" stroke="#C9776A" stroke-width="8" transform="rotate(-20 292 258)"/>
      <ellipse cx="292" cy="258" rx="19" ry="15" stroke="#F2D9CF" stroke-width="3" transform="rotate(-20 292 258)"/>
      <ellipse cx="312" cy="294" rx="17" ry="13" stroke="#0A0D18" stroke-width="8" opacity=".4" transform="translate(3 4) rotate(15 312 294)"/>
      <ellipse cx="312" cy="294" rx="17" ry="13" stroke="#C9776A" stroke-width="8" transform="rotate(15 312 294)"/>
      <ellipse cx="312" cy="294" rx="17" ry="13" stroke="#F2D9CF" stroke-width="3" transform="rotate(15 312 294)"/>
    </g>
    <!-- a lemon wedge -->
    <g transform="translate(122 484) rotate(-30)">
      <path d="M-30 4Q0 40 30 4z" fill="#0A0D18" opacity=".4" transform="translate(3 4)"/>
      <path d="M-30 0Q0 38 30 0z" fill="#D9A81E"/>
      <path d="M-26 0Q0 31 26 0z" fill="#F6EBD3"/>
      <path d="M-23 1Q0 27 23 1z" fill="#F7D26B"/>
      <path d="M0 2L-13 14M0 2L0 22M0 2L13 14" stroke="#F6EBD3" stroke-width="1.600" stroke-linecap="round"/>
    </g>
  </g>

  ${[1, 2, 3, 4, 5, 6].map(portion).join('')}

  <!-- salan and dahi -->
  <g id="t-salan">
    ${plateBowl(92, 672, 54, 51, '#7A2A1C', `
      <path d="${blob(92, 672, 40, 55, 0.05, 14)}" fill="#8F3622"/>
      <path d="${blob(88, 668, 22, 56, 0.08, 12)}" fill="#A33B2C"/>
      <path d="M70 660q8-6 16-2M96 680q8 3 14-3M78 684q5 3 11 0M100 658q5-3 9 0" fill="none" stroke="#F2A516" stroke-width="2.600" stroke-linecap="round"/>
      <ellipse cx="100" cy="670" rx="3.500" ry="2" fill="#5E8C4A"/><ellipse cx="80" cy="672" rx="3" ry="1.700" fill="#5E8C4A"/>`)}
  </g>
  <g id="t-dahi">
    ${plateBowl(306, 676, 50, 61, '#F6EBD3', `
      <path d="${blob(304, 674, 38, 65, 0.05, 14)}" fill="#FFF6E3"/>
      <path d="M284 668q10-8 20-2t18-4" fill="none" stroke="#E6D6B0" stroke-width="2.400" stroke-linecap="round"/>
      ${mint(296, 682, 30, 0.55)}${mint(318, 664, -40, 0.5)}${mint(310, 686, 100, 0.45)}
      <circle cx="290" cy="684" r="1.800" fill="#5E8C4A"/><circle cx="322" cy="680" r="1.800" fill="#5E8C4A"/><circle cx="300" cy="660" r="1.600" fill="#5E8C4A"/>`)}
  </g>

  <!-- the spoon, lying handle to the lower right; the icon rides in its bowl -->
  <g id="t-spoon">
    <g transform="translate(176 408) rotate(38)">
      <g transform="translate(5 7)" fill="#0A0D18" opacity=".45">
        <ellipse rx="27" ry="18"/><path d="M20-5L205-3.500Q212 0 205 3.500L20 5z"/>
      </g>
      <path d="M20-5L205-3.500Q212 0 205 3.500L20 5z" fill="#8A93B3"/>
      <path d="M20-5L205-3.500Q209-2 207-1L20-2z" fill="#C4CBDE"/>
      <ellipse rx="27" ry="18" fill="#8A93B3"/>
      <ellipse rx="23" ry="14" fill="#C4CBDE"/>
      <ellipse cx="-2" cy="1" rx="19" ry="10" fill="#A9B0C6"/>
    </g>
    ${eggUses}
  </g>
  </g>

  <!-- the mixing bowl: curd, for the marinade scene -->
  <g id="t-bowl">
    <rect width="400" height="800" fill="#241410"/>
    <path d="${blob(210, 420, 172, 71, 0.012, 22)}" fill="#0A0D18" opacity=".55"/>
    <path d="${blob(200, 410, 170, 71, 0.012, 22)}" fill="#8A93B3"/>
    <path d="${blob(200, 410, 163, 72, 0.012, 22)}" fill="#C4CBDE"/>
    <path d="${blob(202, 412, 146, 73, 0.012, 22)}" fill="#6F789A"/>
    <path d="${blob(200, 410, 140, 74, 0.02, 22)}" fill="#E6D6B0"/>
    <path d="${blob(197, 407, 128, 75, 0.03, 20)}" fill="#F6EBD3"/>
    <path d="${blob(192, 402, 100, 76, 0.04, 18)}" fill="#FFF6E3"/>
    <path d="M110 400q40-34 90-10t90 14M130 450q50 20 100-4M150 360q30-14 66-4" fill="none" stroke="#E6D6B0" stroke-width="4" stroke-linecap="round"/>
    <path d="M120 390q30-24 70-14" fill="none" stroke="#FFFFFF" stroke-width="3" stroke-linecap="round" opacity=".6"/>
    <circle cx="150" cy="430" r="3" fill="#E6D6B0"/><circle cx="250" cy="380" r="2.500" fill="#E6D6B0"/><circle cx="236" cy="440" r="2" fill="#E6D6B0"/>
    <path d="M72 360C84 310 130 276 184 268C140 288 108 320 94 372z" fill="#E4E8F2" opacity=".8"/>
    <circle cx="200" cy="410" r="170" fill="url(#t-lamp)"/>
  </g>
</svg>`;
