import { labels } from '../data/script.js';

export default {
  id: 'arrival',
  async play({ ui, audio, prefs, kitchen }) {
    document.getElementById('stage').dataset.view = 'wide';
    Object.assign(kitchen.dataset, { pot: 'lidded', flame: 'high', light: 'normal' });
    // The card's button click is the user gesture that unlocks audio.
    const pick = await ui.card({ title: labels.title, text: labels.intro, note: labels.silentHint, choices: [labels.withSound, labels.quietly] });
    if (pick === 0) {
      await audio.unlock();
      prefs.set('sound', true);
      audio.bed('rain', 0.5);
      audio.bed('flame', 0.3);
    } else {
      prefs.set('sound', false);
      prefs.set('captions', true);
    }
  },
};
