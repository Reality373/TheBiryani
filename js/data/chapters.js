// Ordered chapter list: { id, numeral, title, mood, built }. mood is the colour-script mood passed on as ctx.mood. main.js loads only entries with built: true (or the one named by ?ch=). The lead flips the flags.
export const chapters = [
  { id: 'spices', mood: 'dusk', numeral: 'I', title: 'The Spices', built: true },
  { id: 'onions', mood: 'stove', numeral: 'II', title: 'The Onions', built: true },
  { id: 'marinade', mood: 'dusk', numeral: 'III', title: 'The Marinade', built: true },
  { id: 'rest', mood: 'night', numeral: 'IV', title: 'The Rest', built: true },
  { id: 'fry', mood: 'stove', numeral: 'V', title: 'The Fry', built: true },
  { id: 'rice', mood: 'steam', numeral: 'VI', title: 'The Rice', built: true },
  { id: 'layers', mood: 'steam', numeral: 'VII', title: 'The Layers', built: true },
  { id: 'seal', mood: 'night', numeral: 'VIII', title: 'The Seal', built: true },
  { id: 'wait', mood: 'night', numeral: 'IX', title: 'The Wait', built: true },
  { id: 'opening', mood: 'burst', numeral: 'X', title: 'The Opening', built: true },
  { id: 'plate', mood: 'lamp', numeral: 'XI', title: 'The Plate', built: true },
  { id: 'end', mood: 'moon', numeral: '', title: '', built: true },
];
