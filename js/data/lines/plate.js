// Lines for the plate chapter (docs/design.md section 3). Spice lines come from js/data/spices.js as sp_<id>_<n>.
import { spices } from '../spices.js';

export default {
  b1a: 'The first bite. Steam, then rice that smells of saffron, then the heat, a second late.',
  b1b: "You didn't know you were this hungry.",
  b2a: 'The chicken finds you. Soft from the curd, the ginger and garlic still in it.',
  b2b: 'Now it makes sense.',
  b3a: 'Rice, chicken, a curl of fried onion. Nobody is talking. Nobody needs to.',
  b4a: 'A spoon of cold dahi chutney. The heat steps back, just enough to keep going.',
  b4b: 'Salan on the side: sour, nutty, a little dangerous.',
  b5a: "A second helping. You said you'd stop.",
  b6a: "The last bite. You slow down on purpose and gather what's left into one spoonful.",
  b6b: 'This is the one you save.',
  ...Object.fromEntries(spices.flatMap((s) => s.say.map((t, i) => [`sp_${s.id}_${i}`, t]))),
};
