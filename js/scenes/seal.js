export default {
  id: 'seal',
  async play({ ui, audio, script, kitchen }) {
    Object.assign(kitchen.dataset, { pot: 'lidded', flame: 'high', light: 'normal' });
    kitchen.style.setProperty('--seal', 0);
    kitchen.style.setProperty('--crack', 0);
    audio.muffle(0);
    audio.bed('rain', 0.5);
    audio.bed('flame', 0.3);
    audio.stop('drone');
    await ui.view('medium');
    await ui.run(script.seal, {
      pressing: (p) => kitchen.style.setProperty('--seal', p),
      sealed: () => { kitchen.dataset.pot = 'sealed'; audio.hit('thud'); },
    });
  },
};
