// The kitchen at night, seen from the side. Paper-cut construction: flat shapes, each with a
// baked offset shadow, no live filters. State is set with attributes on the root <svg>
// (data-pot, data-flame, data-light, --seal, --crack); css/app.css turns those into the picture.

// Rain streaks, drawn twice one tile apart so the CSS loop is seamless.
const TILE = 188;
function rain(count, seed) {
  let s = seed;
  const next = () => (s = (s * 16807) % 2147483647) / 2147483647;
  let out = '';
  for (let i = 0; i < count; i++) {
    const x = 94 + next() * 214;
    const y = 50 + next() * TILE;
    const len = 12 + next() * 16;
    for (const dy of [0, -TILE]) {
      out += `<line x1="${x.toFixed(1)}" y1="${(y + dy).toFixed(1)}" x2="${(x - len * 0.12).toFixed(1)}" y2="${(y + dy + len).toFixed(1)}"/>`;
    }
  }
  return out;
}

const flame = (x, h) => `
  <path d="M${x} 502c-10-7-8-${h * 0.6}-1-${h}c8 ${h * 0.4} 11 ${h * 0.75} 1 ${h}z" fill="#F2A516"/>
  <path d="M${x} 502c-5-4-4-${h * 0.35}-.5-${h * 0.6}c4 ${h * 0.25} 5.5 ${h * 0.45} .5 ${h * 0.6}z" fill="#FFE2A6"/>
  <ellipse cx="${x}" cy="500" rx="5" ry="3" fill="#5B79D6"/>`;

export const kitchenSVG = `
<svg id="kitchen" class="art" viewBox="0 0 400 800" preserveAspectRatio="xMidYMid slice" role="img"
     aria-label="A kitchen at night. Rain on the window. A copper pot on the stove."
     data-pot="lidded" data-flame="high" data-light="normal">
  <defs>
    <clipPath id="k-glass"><rect x="90" y="50" width="220" height="188"/></clipPath>
    <radialGradient id="k-glow-g">
      <stop offset="0" stop-color="#F2A516" stop-opacity=".6"/>
      <stop offset=".45" stop-color="#F2A516" stop-opacity=".2"/>
      <stop offset="1" stop-color="#F2A516" stop-opacity="0"/>
    </radialGradient>
    <pattern id="k-vine" width="56" height="32" patternUnits="userSpaceOnUse">
      <path d="M0 16Q14 2 28 16T56 16" fill="none" stroke="#A33B2C" stroke-width="2.5"/>
      <path d="M9 9q8-8 13 1q-8 5-13-1z" fill="#5E8C4A"/>
      <path d="M37 23q8 8 13-1q-8-5-13 1z" fill="#5E8C4A"/>
      <circle cx="28" cy="16" r="3.4" fill="#F2A516"/>
      <circle cx="0" cy="16" r="2.2" fill="#F6EBD3"/>
      <circle cx="56" cy="16" r="2.2" fill="#F6EBD3"/>
    </pattern>
  </defs>

  <!-- wall -->
  <rect width="400" height="800" fill="#1B2340"/>

  <!-- window: shadow, frame, night, rooftops, rain, bars, sill -->
  <rect x="84" y="46" width="248" height="216" rx="5" fill="#0C1020"/>
  <rect x="76" y="36" width="248" height="216" rx="5" fill="#5A2219"/>
  <rect x="90" y="50" width="220" height="188" fill="#1A2552"/>
  <g clip-path="url(#k-glass)">
    <path d="M90 238V196h18v-12h22v20h14v-30h10v-10h8v10h10v30h16v-16h26v-8h12v8h10v22h20v-14h24v28h30V238z" fill="#0F1630"/>
    <rect x="116" y="194" width="5" height="6" fill="#F2A516" opacity=".85"/>
    <rect x="232" y="198" width="5" height="6" fill="#F2A516" opacity=".6"/>
    <rect x="290" y="206" width="4" height="5" fill="#F6EBD3" opacity=".5"/>
    <g class="rain-b" stroke="#6F86C9" stroke-width="1" stroke-linecap="round" opacity=".45">${rain(16, 7)}</g>
    <g class="rain-a" stroke="#9FB1E6" stroke-width="1.6" stroke-linecap="round" opacity=".6">${rain(11, 23)}</g>
  </g>
  <rect x="197" y="50" width="6" height="188" fill="#5A2219"/>
  <rect x="90" y="140" width="220" height="6" fill="#5A2219"/>
  <rect x="70" y="258" width="272" height="12" rx="3" fill="#0C1020"/>
  <rect x="64" y="250" width="272" height="12" rx="3" fill="#7A3023"/>

  <!-- printed border along the wall -->
  <rect y="284" width="400" height="38" fill="#0E0D12"/>
  <rect y="287" width="400" height="32" fill="url(#k-vine)"/>
  <rect y="284" width="400" height="2.5" fill="#A33B2C"/>
  <rect y="319.5" width="400" height="2.500" fill="#A33B2C"/>

  <!-- counter -->
  <rect y="512" width="400" height="288" fill="#241410"/>
  <rect y="512" width="400" height="9" fill="#4B271C"/>

  <!-- the flame's light on the wall -->
  <g id="k-glow"><ellipse class="flick" cx="200" cy="468" rx="215" ry="175" fill="url(#k-glow-g)"/></g>

  <!-- stove -->
  <rect x="124" y="504" width="164" height="14" rx="4" fill="#07080F"/>
  <rect x="118" y="498" width="164" height="14" rx="4" fill="#17151D"/>
  <rect x="140" y="484" width="9" height="16" rx="2" fill="#2B2733"/>
  <rect x="195.500" y="484" width="9" height="16" rx="2" fill="#2B2733"/>
  <rect x="251" y="484" width="9" height="16" rx="2" fill="#2B2733"/>

  <!-- flame -->
  <g id="k-flame"><g class="flick">
    ${flame(108, 40)}${flame(166, 22)}${flame(200, 24)}${flame(234, 22)}${flame(292, 40)}
  </g></g>

  <!-- saffron milk, waiting -->
  <path d="M46 498h52q-4 20-26 20t-26-20z" fill="#0A0D18" opacity=".5"/>
  <path d="M40 492h52q-4 20-26 20t-26-20z" fill="#C98A2B"/>
  <ellipse cx="66" cy="492" rx="26" ry="5" fill="#F6C55B"/>
  <path d="M54 491l8-1M65 493l9-2M72 490l6 2" stroke="#A33B2C" stroke-width="1.600" stroke-linecap="round"/>

  <!-- a cup of chai -->
  <ellipse cx="339" cy="515" rx="34" ry="6" fill="#0A0D18" opacity=".5"/>
  <ellipse cx="334" cy="510" rx="34" ry="6" fill="#D9CDB2"/>
  <path d="M352 487q15 2 7 15q-4 4-10 3" fill="none" stroke="#F6EBD3" stroke-width="4" stroke-linecap="round"/>
  <path d="M316 482h36l-4 26q-14 5-28 0z" fill="#F6EBD3"/>
  <ellipse cx="334" cy="483" rx="18" ry="4" fill="#9C5A2E"/>

  <!-- the pot -->
  <g id="k-pot">
    <path d="M127 389C89 427 95 479 155 495H263C323 479 329 427 291 389z" fill="#0A0D18" opacity=".55"/>
    <path d="M118 378C80 416 86 468 146 484H254C314 468 320 416 282 378z" fill="#B8693A"/>
    <path d="M240 378H282C320 416 314 468 254 484H230C268 456 268 410 240 378z" fill="#8F4B27"/>
    <path d="M131 398C113 426 115 452 135 470C125 448 125 424 139 400z" fill="#DC9460"/>
    <path d="M100 424C150 440 250 440 300 424" fill="none" stroke="#8F4B27" stroke-width="2.500" opacity=".7"/>
    <ellipse cx="200" cy="378" rx="84" ry="12" fill="#8F4B27"/>
    <g id="k-rice">
      <ellipse cx="200" cy="376" rx="76" ry="9" fill="#F6EBD3"/>
      <path d="M146 375q14-5 30 0M204 379q16 4 36-2M178 372q10-3 22 0" fill="none" stroke="#F2A516" stroke-width="3" stroke-linecap="round"/>
      <path d="M160 379q6-4 12 0M226 373q6-4 12 0M190 381q5-3 10 0M248 378q5-3 9 1" fill="none" stroke="#5A2A14" stroke-width="2.400" stroke-linecap="round"/>
      <ellipse cx="214" cy="373" rx="5" ry="2.200" fill="#5E8C4A"/><ellipse cx="170" cy="374" rx="4" ry="2" fill="#5E8C4A"/>
    </g>
  </g>

  <!-- the lid -->
  <g id="k-lid">
    <path d="M116 374C126 336 274 336 284 374z" fill="#C97B48"/>
    <path d="M236 346C262 352 278 362 284 374H244C250 364 246 354 236 346z" fill="#8F4B27"/>
    <path d="M140 362C152 348 176 342 196 341" fill="none" stroke="#E7A474" stroke-width="4" stroke-linecap="round"/>
    <ellipse cx="200" cy="374" rx="84" ry="10" fill="#A65A2E"/>
    <rect x="190" y="322" width="20" height="18" rx="6" fill="#8F4B27"/>
    <ellipse cx="200" cy="322" rx="13" ry="5" fill="#C97B48"/>
  </g>

  <!-- the dough seal: drawn in by --seal, dented once pressed, cracked before the lid lifts -->
  <g id="k-seal">
    <path class="dough" pathLength="1" d="M114 385A86 13 0 0 0 286 385" fill="none" stroke="#B59A6C" stroke-width="14" stroke-linecap="round"/>
    <path class="dough" pathLength="1" d="M114 381A86 13 0 0 0 286 381" fill="none" stroke="#EBDDBB" stroke-width="13" stroke-linecap="round"/>
    <g id="k-dents" fill="#C9B487">
      <ellipse cx="130" cy="388.500" rx="5" ry="3"/><ellipse cx="152" cy="392" rx="5" ry="3"/>
      <ellipse cx="176" cy="393.500" rx="5" ry="3"/><ellipse cx="200" cy="394" rx="5" ry="3"/>
      <ellipse cx="224" cy="393.500" rx="5" ry="3"/><ellipse cx="248" cy="392" rx="5" ry="3"/>
      <ellipse cx="270" cy="388.500" rx="5" ry="3"/>
    </g>
    <g id="k-cracks" fill="none" stroke="#3A2A1A" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <path d="M163 385l4 5l-3 4l4 4"/><path d="M212 387l-3 5l5 3l-2 5"/><path d="M250 384l4 4l-4 5"/>
    </g>
  </g>

  <!-- light: the room dims for the wait and warms at the end -->
  <rect id="k-dim" width="400" height="800" fill="#080A14"/>
  <rect id="k-warm" width="400" height="800" fill="#F2A516"/>
</svg>`;
