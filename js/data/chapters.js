// Ordered chapter list: { id, steps, numeral, title, mood, built }. steps is how many hotspots finish in the chapter (measured with ?auto=1); it only scales the progress bar, which the chapter's end fills. mood is the colour-script mood passed on as ctx.mood. main.js loads only entries with built: true (or the one named by ?ch=). The lead flips the flags.
export const chapters = [
  { id: 'spices', steps: 12, mood: 'dusk', numeral: 'I', title: 'The Spices', built: true },
  { id: 'onions', steps: 6, mood: 'stove', numeral: 'II', title: 'The Onions', built: true },
  { id: 'marinade', steps: 19, mood: 'dusk', numeral: 'III', title: 'The Marinade', built: true },
  { id: 'rest', steps: 12, mood: 'night', numeral: 'IV', title: 'The Rest', built: true },
  { id: 'fry', steps: 6, mood: 'stove', numeral: 'V', title: 'The Fry', built: true },
  { id: 'rice', steps: 10, mood: 'steam', numeral: 'VI', title: 'The Rice', built: true },
  { id: 'layers', steps: 5, mood: 'steam', numeral: 'VII', title: 'The Layers', built: true },
  { id: 'seal', steps: 2, mood: 'night', numeral: 'VIII', title: 'The Seal', built: true },
  { id: 'wait', steps: 3, mood: 'night', numeral: 'IX', title: 'The Wait', built: true },
  { id: 'opening', steps: 3, mood: 'burst', numeral: 'X', title: 'The Opening', built: true },
  { id: 'plate', steps: 7, mood: 'lamp', numeral: 'XI', title: 'The Plate', built: true },
  { id: 'end', mood: 'moon', numeral: '', title: '', built: true },
];
