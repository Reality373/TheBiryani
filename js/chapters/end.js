// The end chapter: three lines over the room, then the end card (the recipe with its whys, the spices found, "Go again").
// Dev switches: ?state=card opens the card at once (no lines); ?spices=elaichi,clove sets the spices found for a shot.
import { recipe } from '../data/recipe.js';
import { spices } from '../data/spices.js';
import { labels } from '../data/labels.js';

export default {
  id: 'end',
  art: () => import('../art/end.js'),
  async play({ stage, voice, audio, ui, prefs, params, signal, calm, auto }) {
    const el = stage.el;
    Object.assign(el.dataset, { pot: 'lifted', flame: 'off', light: 'warm' });
    el.style.setProperty('--lift', '1');
    audio.muffle(0);
    audio.stop('flame');
    audio.bed('drone', 0.4, 4);
    audio.bed('rain', 0.2, 6);

    if (params.get('state') !== 'card') {
      // The camera eases in from 1.15 to 1.0 while the lines play. Calm and auto modes hold still.
      if (!calm() && !auto) {
        stage.camera.push(1.15, 800, 500, 0);
        void el.offsetWidth; // flush the first position, or the second push starts from it without moving
        stage.camera.push(1, 800, 500, 12000);
      } else stage.camera.push(1, 800, 500, 0);
      for (const id of ['end.empty', 'end.knew', 'end.right']) {
        await voice.say(id);
        if (signal.aborted) return;
      }
    }

    const ids = params.has('spices') ? params.get('spices').split(',') : prefs.get('spices');
    const found = spices.filter((s) => ids.includes(s.id)); // validated: spiceIcon throws on an unknown id
    if (signal.aborted) return;
    await ui.card({
      kind: 'end', title: labels.title, text: labels.method, list: recipe, icons: found,
      note: labels.found.replace('{n}', String(found.length)), choices: [labels.again],
    });
    audio.stop('drone', 2);
  },
};
