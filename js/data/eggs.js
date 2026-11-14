const pickIndex = (n, rng) => Math.min(n - 1, Math.floor(rng() * n));

export function planEggs(spices, biteCount, rng = Math.random) {
  const plan = Array(biteCount).fill(null);
  const pool = [...spices];
  const slots = Array.from({ length: biteCount - 2 }, (_, i) => i + 1);
  const count = Math.min(1 + pickIndex(2, rng), pool.length, slots.length);
  for (let n = 0; n < count; n++) {
    let r = rng() * pool.reduce((sum, s) => sum + s.weight, 0);
    let k = pool.findIndex((s) => (r -= s.weight) < 0);
    if (k < 0) k = pool.length - 1;
    const [spice] = pool.splice(k, 1);
    const [slot] = slots.splice(pickIndex(slots.length, rng), 1);
    plan[slot] = spice.id;
  }
  return plan;
}
