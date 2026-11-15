export default {
  id: 'reveal',
  async play({ ui, audio, steam, script, kitchen, top }) {
    Object.assign(kitchen.dataset, { pot: 'sealed', flame: 'off', light: 'dim' });
    kitchen.style.setProperty('--seal', 1);
    kitchen.style.setProperty('--crack', 0);
    await ui.view('close');
    let plumeP = Promise.resolve();
    await ui.run(script.reveal, {
      cracking: (p) => kitchen.style.setProperty('--crack', p),
      lift() { // returns promptly so its line shows while the steam is up
        steam.wisp(false);
        kitchen.dataset.pot = 'cracked';
        audio.hit('crack');
        plumeP = new Promise((r) => setTimeout(r, 300)).then(() => {
          kitchen.dataset.pot = 'lifted';
          audio.muffle(0, 1.5);
          audio.hit('steam');
          return steam.plume();
        });
      },
      async look() {
        await plumeP;
        audio.hit('chime');
        top.dataset.show = 'pot';
        await ui.view('top');
      },
    });
  },
};
