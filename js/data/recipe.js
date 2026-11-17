// The home recipe on the end card, in cooking order. Each why is copied exactly from docs/design.md section 3
// (tests/recipe.test.js checks that every why there appears here once).
export const recipe = [
  { step: 'Marinate the chicken in curd and spices', why: 'The curd softens the chicken and holds the spices to it.' },
  { step: 'Leave it alone for an hour', why: 'An hour in the curd, and it softens all the way through.' },
  { step: 'Fry the chicken first until golden', why: 'Frying it first browns the edges, and the browning is flavour.' },
  { step: 'Add fried onions and whole spices', why: 'Whole, not ground. They give up their smell slowly, through the long cook.' },
  { step: 'Layer part-cooked rice over the chicken', why: 'Only most of the way. The steam will finish it.' },
  { step: 'Pour saffron milk over the rice', why: 'Poured, not stirred. It stays in streaks, so every spoonful is a little different.' },
  { step: 'Press dough round the lid to seal it', why: 'The dough seals the lid. The steam has nowhere to go, so it cooks the rice. That is the dum.' },
  { step: 'Set the pot on a tawa over high heat', why: "The tawa spreads the heat, so the bottom doesn't burn." },
  { step: 'Turn the flame down to low', why: 'High heat builds the steam. Low heat keeps it.' },
  { step: 'Keep the lid shut', why: 'Open it now and the steam is gone, and the rice stays hard.' },
  { step: 'Turn the flame off and let it rest', why: "Off the heat it is still cooking. The rest lets the grains settle, so they don't break." },
  { step: 'Serve from the side, all the way down', why: 'Rice from the top, chicken from the bottom. Every plate gets both.' },
];
