// Art for chapter IV, The Seal: the shared room at night, plus three things the room does not have:
// a rope guide along the rim (so the dough is visible before it is pressed), the steam puffs at the lid's edge,
// and one override: room.js hides #r-dough while the pot is lidded, and the seal needs it there.
// Chapter logic is in js/chapters/seal.js. The puffs and the rope are toggled from there.
import { room } from './room.js';
import { plane, blob, rng, range } from './lib.js';

export default function art() {
  const planes = room({ mood: 'night', seed: 3 });
  const r = rng(41);
  const puffs = Array.from({ length: 9 }, (_, i) => {
    const x = range(r, 690, 910), y = range(r, 512, 530), rr = range(r, 14, 24);
    return `<g class="sp" style="--i:${i}"><path d="${blob(x, y, rr * 1.2, rr * 0.8, 0.3, r, 9)}" fill="#E6EEFF" opacity=".3"/><path d="${blob(x - 4, y - 3, rr * 0.5, rr * 0.4, 0.3, r, 8)}" fill="#fff" opacity=".2"/></g>`;
  }).join('');

  const fx = plane('seal-fx', 0.78, `<style>
      [data-pot='lidded'] #r-dough{opacity:1 !important}
      #r-dough .lm{opacity:var(--on,0) !important} /* the chapter lights each lump by its eighth; no fade, so a press shows at once */
      @media (max-width:600px){[data-pot='open'] #r-lid .lidT{transform:translate(-70px,207px) rotate(2deg)}} /* inside the phone column; LID_PHONE in chapters/seal.js */
      #seal-fx #s-rope{opacity:0;transition:opacity .6s}
      [data-pot='lidded'] #seal-fx #s-rope{opacity:.7}
      #seal-fx #s-rope.gone{opacity:0 !important}
      #seal-fx #s-puff{opacity:0;transition:opacity .8s}
      #seal-fx #s-puff.on{opacity:1}
      #seal-fx .sp{opacity:.55;transform-box:fill-box;transform-origin:50% 100%}
      #seal-fx #s-puff.on .sp{animation:s-rise 2.6s ease-out infinite;animation-delay:calc(var(--i) * -.3s)}
      @keyframes s-rise{0%{transform:translateY(10px) scale(.6);opacity:0}25%{opacity:1}100%{transform:translateY(-80px) scale(1.5);opacity:0}}
    </style>
    <g id="s-rope">
      <path d="M654 527Q800 571 946 527" stroke="#4A2A18" stroke-width="15" stroke-linecap="round" fill="none"/>
      <path d="M654 527Q800 571 946 527" stroke="#F0E0B8" stroke-width="10" stroke-linecap="round" fill="none"/>
    </g>
    <g id="s-puff">${puffs}</g>`);

  // Put the effects under the foreground framing (the last plane), so the framing stays in front.
  const at = planes.findIndex((p) => p.includes('id="r-fg"'));
  planes.splice(at < 0 ? planes.length : at, 0, fx);
  return { planes };
}
