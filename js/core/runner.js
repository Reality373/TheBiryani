export function createRunner(scenes, ctx) {
  const mounted = new Set();
  return {
    async start(fromId) {
      let i = 0;
      if (fromId !== undefined) {
        i = scenes.findIndex((s) => s.id === fromId);
        if (i < 0) throw new Error(`Unknown scene: ${fromId}`);
      }
      for (; i < scenes.length; i++) {
        const scene = scenes[i];
        if (!mounted.has(scene.id)) {
          mounted.add(scene.id);
          await scene.mount?.(ctx);
        }
        await scene.play(ctx);
      }
    },
  };
}
