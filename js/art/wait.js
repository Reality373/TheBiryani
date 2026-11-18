// Art for chapter V, The Wait: the shared room in deep night, plus two things the room does not have: the puffs that
// rise from under the pot when the tawa slides in, and three sparks by the stove for the cooling ticks.
// Chapter logic is in js/chapters/wait.js; the puffs and sparks are toggled from there.
import { room } from './room.js';
import { plane, blob, rng, range } from './lib.js';

export default function art() {
  const planes = room({ mood: 'night', seed: 3 });
  const r = rng(53);
  const puffs = Array.from({ length: 8 }, (_, i) => {
    const x = range(r, 650, 950), y = range(r, 690, 716), rr = range(r, 12, 20);
    return `<g class="wp" style="--i:${i}"><path d="${blob(x, y, rr * 1.2, rr * 0.8, 0.3, r, 9)}" fill="#E6EEFA" opacity=".3"/></g>`;
  }).join('');
  const sparks = [[700, 744], [860, 750], [934, 738]]
    .map(([x, y], i) => `<circle id="w-sp${i}" cx="${x}" cy="${y}" r="5" fill="#FFD9A0" opacity="0"/>`).join('');

  const fx = plane('wait-fx', 0.78, `<style>
      #wait-fx #w-under{opacity:0;transition:opacity .6s}
      #wait-fx #w-under.on{opacity:1}
      #wait-fx .wp{opacity:.5;transform-box:fill-box;transform-origin:50% 100%}
      #wait-fx #w-under.on .wp{animation:w-rise 2.6s ease-out infinite;animation-delay:calc(var(--i) * -.33s)}
      @keyframes w-rise{0%{transform:translateY(10px) scale(.6);opacity:0}25%{opacity:.8}100%{transform:translateY(-70px) scale(1.5);opacity:0}}
    </style><g id="w-under">${puffs}</g>${sparks}`);

  // Under the foreground framing, as in the seal chapter.
  const at = planes.findIndex((p) => p.includes('id="r-fg"'));
  planes.splice(at < 0 ? planes.length : at, 0, fx);
  return { planes };
}
