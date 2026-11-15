import { planEggs } from '../data/eggs.js';

export default {
  id: 'eat',
  async play({ ui, audio, prefs, script, spices, top }) {
    top.dataset.show = 'plate';
    top.dataset.eaten = '0';
    audio.muffle(0);
    audio.bed('rain', 0.3);
    await ui.view('top');
    const plan = planEggs(spices, 6);
    for (let i = 0; i < 6; i++) {
      await ui.run(script.eat[i], {
        bite: () => { top.dataset.eaten = String(i + 1); audio.hit('spoon'); },
      });
      const id = plan[i];
      if (!id) continue;
      top.dataset.egg = id;
      await ui.run(spices.find((s) => s.id === id).say.map((say) => ({ say })));
      const old = prefs.get('spices') ?? [];
      if (!old.includes(id)) prefs.set('spices', [...old, id]);
      delete top.dataset.egg;
    }
  },
};
