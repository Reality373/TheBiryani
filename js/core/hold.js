export function createHold({ ms, tapMs = 250 }) {
  let value = 0;   // progress at time `since`
  let since = 0;
  let filling = false;
  let pressedAt = 0;
  let finished = false;

  const progress = (t) => {
    if (finished) return 1;
    const dt = (t - since) / ms;
    const p = Math.min(1, Math.max(0, filling ? value + dt : value - dt));
    if (p >= 1) finished = true;
    return p;
  };

  return {
    progress,
    done: (t) => progress(t) >= 1,
    press(t) {
      value = progress(t);
      since = t;
      pressedAt = t;
      filling = true;
    },
    release(t) {
      value = progress(t);
      since = t;
      // a tap keeps filling as if still held
      if (t - pressedAt >= tapMs) filling = false;
    },
  };
}
