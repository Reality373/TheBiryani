export default {
  id: 'wait',
  async play({ ui, audio, steam, script, kitchen }) {
    kitchen.dataset.pot = 'sealed';
    kitchen.dataset.light = 'dim';
    kitchen.style.setProperty('--seal', 1);
    audio.muffle(1, 3);
    steam.wisp(true); // left running; reveal stops it
    await ui.view('wide');
    await ui.run(script.wait, {
      low: () => { kitchen.dataset.flame = 'low'; },
      off: () => { kitchen.dataset.flame = 'off'; audio.stop('flame', 3); },
    });
  },
};
