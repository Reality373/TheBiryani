// Demo art: four planes at different depths. art(params) -> { planes }.
// Draw out to x -220..1820, y -100..1100; keep the story inside x 560..1040 for phones.
import { C, rng, wobble, blob, halftone, linear, radial, plane } from './lib.js';

export default function art() {
  const r = rng(5);
  // d = 0 far ... 1 near. A plane that holds hotspots is given a label.
  const wall = plane('d-wall', 0.1, `
    <defs>${linear('d-wg', [[0, '#0B1030'], [1, C.indigo]])}${halftone('d-ht', C.night, { size: 10, r: 1.8, opacity: 0.5 })}</defs>
    <rect x="-220" y="-100" width="2040" height="1200" fill="url(#d-wg)"/>
    <rect x="-220" y="-100" width="2040" height="1200" fill="url(#d-ht)"/>
    <rect x="-220" y="470" width="2040" height="34" fill="${C.madder}" opacity=".7"/>`);

  const win = plane('d-window', 0.3, `
    <defs>${radial('d-moon', [[0, C.cream], [0.6, C.cream], [1, C.cream, 0]], { r: 0.5 })}</defs>
    <path d="M640 440 V210 Q640 90 800 70 Q960 90 960 210 V440 Z" fill="#1E2A63" stroke="${C.copper}" stroke-width="14"/>
    <circle cx="840" cy="210" r="46" fill="url(#d-moon)"/>
    <path d="${blob(800, 330, 160, 60, 0.08, r)}" fill="${C.night}" opacity=".7"/>`);

  const table = plane('d-table', 0.6, `
    <path d="${wobble([[-220, 760], [300, 748], [800, 756], [1300, 746], [1820, 758], [1820, 1100], [-220, 1100]], 4, r)}" fill="#4A2A1E"/>
    <path d="${wobble([[-220, 760], [800, 756], [1820, 758], [1820, 772], [800, 770], [-220, 774]], 2, r)}" fill="${C.copper}" opacity=".8"/>
    <g id="d-bowl" transform="translate(870 700)">
      <ellipse cx="0" cy="64" rx="74" ry="12" fill="${C.iron}" opacity=".5"/>
      <path d="M-70 0 Q-62 62 0 64 Q62 62 70 0 Z" fill="${C.copper}"/>
      <path d="M-70 0 Q-62 62 0 64 Q-30 50 -34 0 Z" fill="#D89A66"/>
      <ellipse cx="0" cy="0" rx="70" ry="16" fill="#E8B987"/>
      <ellipse cx="0" cy="2" rx="58" ry="11" fill="${C.cream}"/>
      <ellipse id="d-ripple" cx="0" cy="2" rx="20" ry="4" fill="none" stroke="${C.copper}" stroke-width="3" opacity="0"/>
      <circle class="hit" cx="0" cy="30" r="78"/>
    </g>
    <style>
      #d-table #d-ripple { transform-box: fill-box; transform-origin: center; }
      #d-table #d-ripple.is-on { animation: d-rip 700ms ease-out; }
      @keyframes d-rip { from { opacity: 1; transform: scale(.4); } to { opacity: 0; transform: scale(3); } }
    </style>`, { label: 'A bowl on the table' });

  const disc = plane('d-disc', 0.9, `
    <path d="M650 560 H930" stroke="${C.cream}" stroke-width="5" stroke-linecap="round" stroke-dasharray="1 14" opacity=".8"/>
    <circle cx="930" cy="560" r="10" fill="${C.mint}"/>
    <g id="d-disc-g">
      <circle cx="650" cy="566" r="38" fill="${C.iron}" opacity=".5"/>
      <circle cx="650" cy="560" r="38" fill="${C.saffron}" stroke="${C.madder}" stroke-width="5"/>
      <circle cx="638" cy="548" r="10" fill="#fff" opacity=".35"/>
      <circle class="hit" cx="650" cy="560" r="62"/>
    </g>`, { label: 'A disc on a line' });

  return { planes: [wall, win, table, disc] };
}
