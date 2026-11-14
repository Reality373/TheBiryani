const KEY = 'dum:prefs';

export function createPrefs(storage, { reducedMotion = false } = {}) {
  const defaults = { sound: false, calm: reducedMotion, captions: false, spices: [] };
  let stored = {};
  try {
    const parsed = JSON.parse(storage.getItem(KEY));
    if (parsed && typeof parsed === 'object') stored = parsed;
  } catch { /* missing, denied or broken: use defaults */ }
  const values = { ...defaults, ...stored };
  const listeners = new Set();

  return {
    get(key) {
      if (!(key in defaults)) throw new Error(`Unknown pref: ${key}`);
      return values[key];
    },
    set(key, value) {
      if (!(key in defaults)) throw new Error(`Unknown pref: ${key}`);
      values[key] = value;
      try { storage.setItem(KEY, JSON.stringify(values)); } catch { /* keep in memory */ }
      for (const fn of listeners) fn(key, value);
    },
    subscribe(fn) {
      listeners.add(fn);
      return () => listeners.delete(fn);
    },
  };
}
