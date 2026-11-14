export async function runSteps(steps, hooks, ui) {
  for (const step of steps) {
    if (step.cue) await hooks[step.cue]?.();
    if ('cap' in step) await ui.caption(step.cap);
    if (step.say) await ui.say(step.say);
    if (step.act === false) continue;
    const onProgress = step.holdCue ? hooks[step.holdCue] : undefined;
    await ui.action(step.act ?? 'Go on', { hold: step.hold, rest: step.rest, onProgress });
  }
}
