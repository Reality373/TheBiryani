// "Furthest chapter reached" bookkeeping (pure). Chapters are the entries of js/data/chapters.js.

export const indexOf = (chapters, id) => chapters.findIndex((c) => c.id === id);

// Raise `reached` to `id` if that is further along; unknown ids (the demo chapter) change nothing.
export function advance(chapters, reached, id) {
  const i = indexOf(chapters, id);
  return i > indexOf(chapters, reached) ? id : reached;
}

// A chapter can be jumped to only once it has been reached.
export const canJump = (chapters, reached, id) => reached != null && indexOf(chapters, id) >= 0 && indexOf(chapters, id) <= indexOf(chapters, reached);

// The chapter the title card offers to continue from, or null. Only chapters that exist in the build count.
export function continueTarget(chapters, reached, isBuilt = (c) => c.built) {
  const c = chapters[indexOf(chapters, reached)];
  return c && c.title && isBuilt(c) ? c : null;
}
