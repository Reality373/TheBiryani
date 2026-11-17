// Ordered chapter list: { id, numeral, title, mood, built }. mood is the colour-script mood passed on as ctx.mood. main.js loads only entries with built: true (or the one named by ?ch=). The lead flips the flags.
export const chapters = [
  { id: 'marinade', mood: 'dusk', numeral: 'I', title: 'The Marinade', built: false },
  { id: 'fry', mood: 'stove', numeral: 'II', title: 'The Fry', built: false },
  { id: 'layers', mood: 'steam', numeral: 'III', title: 'The Layers', built: false },
  { id: 'seal', mood: 'night', numeral: 'IV', title: 'The Seal', built: false },
  { id: 'wait', mood: 'night', numeral: 'V', title: 'The Wait', built: false },
  { id: 'opening', mood: 'burst', numeral: 'VI', title: 'The Opening', built: false },
  { id: 'plate', mood: 'lamp', numeral: 'VII', title: 'The Plate', built: false },
  { id: 'end', mood: 'moon', numeral: '', title: '', built: false },
];
