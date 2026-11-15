import { labels } from '../data/script.js';

export default {
  id: 'glow',
  async play({ ui, audio, prefs, script, kitchen }) {
    Object.assign(kitchen.dataset, { pot: 'lifted', flame: 'off', light: 'warm' });
    audio.stop('flame');
    audio.bed('drone', 0.4, 4);
    audio.bed('rain', 0.2, 6);
    await ui.view('wide');
    await ui.run(script.glow);
    const found = prefs.get('spices') ?? [];
    await ui.card({
      title: labels.title,
      text: labels.method,
      icons: found,
      note: labels.found.replace('{n}', found.length),
      choices: [labels.again],
    });
    audio.stop('drone', 2);
  },
};
