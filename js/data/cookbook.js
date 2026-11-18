// The recipe the guide teaches: Hyderabadi chicken dum biryani, the pakki way (chicken cooked first, then
// part-cooked rice, then dum). Serves 3 to 4.
// Source: Swasthi, "Restaurant Style Chicken Biryani", indianhealthyrecipes.com/chicken-biryani/ (updated 2 Sep 2022),
// which calls this method pakki dum biryani. The dough seal and tawa come from docs/research/03 (SBS, home practice).
// Drafted by Claude from that source; the owner chose not to review it (17 Nov 2026). Star anise is left out of the
// rice water because it is contested in Hyderabadi biryani (research 03); it stays the rare easter egg.

export const serves = '3 to 4';

// Ingredients by the chapter that uses them. `amount` is what the screen and the voice say.
export const ingredients = {
  onions: [
    { id: 'onion', name: 'onions, thinly sliced', amount: '2 medium (200 g)' },
    { id: 'oil', name: 'oil or ghee', amount: '¼ cup' },
  ],
  marinade: [
    { id: 'chicken', name: 'chicken, large pieces, bone-in', amount: '500 g' },
    { id: 'curd', name: 'thick curd, not sour', amount: '½ cup' },
    { id: 'gg', name: 'ginger-garlic paste', amount: '1½ tbsp' },
    { id: 'lemon', name: 'lemon juice', amount: '1 tbsp' },
    { id: 'chilli', name: 'Kashmiri red chilli powder', amount: '½ to ¾ tbsp' },
    { id: 'turmeric', name: 'turmeric', amount: '¼ tsp' },
    { id: 'salt', name: 'salt', amount: '½ tsp' },
    { id: 'masala', name: 'biryani masala or garam masala', amount: '1¼ tbsp' },
    { id: 'coriander', name: 'coriander powder', amount: '½ tbsp' },
    { id: 'cumin', name: 'roasted cumin powder', amount: '¼ tbsp' },
    { id: 'greenchilli', name: 'green chilli, slit', amount: '1' },
    { id: 'mint', name: 'mint and coriander leaves, chopped', amount: '2 tbsp each' },
    { id: 'birista', name: 'fried onions (from the onions)', amount: '6 tbsp' },
    { id: 'ghee', name: 'oil or ghee', amount: '1½ tbsp' },
  ],
  rice: [
    { id: 'rice', name: 'aged basmati rice', amount: '1½ cups (275 g)' },
    { id: 'water', name: 'water', amount: '6 cups' },
    { id: 'ricesalt', name: 'salt', amount: '½ tbsp' },
    { id: 'riceoil', name: 'oil', amount: '½ tbsp' },
    { id: 'cardamom', name: 'green cardamom', amount: '4' },
    { id: 'clove', name: 'cloves', amount: '4' },
    { id: 'bayleaf', name: 'bay leaf', amount: '1' },
    { id: 'cinnamon', name: 'cinnamon', amount: '2-inch piece' },
    { id: 'shahijeera', name: 'shahi jeera', amount: '¼ tsp' },
    { id: 'mace', name: 'mace', amount: '½ blade' },
  ],
  layers: [
    { id: 'saffron', name: 'saffron in 2 tbsp hot milk + 2 tbsp hot water', amount: '10 to 12 strands' },
    { id: 'birista2', name: 'fried onions, kept back', amount: '2 tbsp' },
    { id: 'herbs', name: 'mint and coriander leaves', amount: '1 to 2 tbsp' },
    { id: 'pinch', name: 'biryani masala', amount: '1 to 2 pinches' },
    { id: 'ghee2', name: 'melted ghee', amount: '1½ tbsp' },
  ],
  seal: [
    { id: 'dough', name: 'stiff dough (flour and water)', amount: '½ cup flour' },
  ],
};

// The method, in order, with the time each takes. `why` lines are the reasons the guide speaks.
export const method = [
  { ch: 'spices', step: 'Measure every spice before the heat goes on.', why: 'Once the pan is hot there is no time to look for the turmeric.' },
  { ch: 'onions', step: 'Fry the sliced onions in the oil, stirring, till evenly golden.', time: '7 min medium, 4 min low, 2 to 3 min off the heat', why: 'They keep darkening after the heat is off, and a few seconds too long turns them bitter.' },
  { ch: 'onions', step: 'Spread them out to cool and crisp. Keep 2 tbsp aside for the top.' },
  { ch: 'marinade', step: 'Mix curd, ginger-garlic, lemon, the powders, herbs, chilli, oil and most of the fried onions.', why: 'The curd softens the chicken and holds the spices to it.' },
  { ch: 'marinade', step: 'Cut gashes in the chicken and coat every piece.', why: 'The cuts let the marinade in past the skin.' },
  { ch: 'rest', step: 'Cover and marinate in the fridge.', time: '30 min at least, up to overnight', why: 'An hour in the curd, and it softens all the way through.' },
  { ch: 'rest', step: 'Meanwhile rinse the rice three times and soak it.', time: '15 to 30 min', why: 'Rinsing washes off the loose starch, so the grains stay separate.' },
  { ch: 'fry', step: 'Fry the marinated chicken on medium heat till the edges colour.', time: '4 to 5 min', why: 'Frying it first browns the edges, and the browning is flavour.' },
  { ch: 'fry', step: 'Add the fried onions and ¼ cup hot water, cover and cook till nearly done.', time: '10 to 15 min', why: 'It finishes cooking in the steam later, so take it off at about ninety-five percent.' },
  { ch: 'rice', step: 'Boil the water with the whole spices.', time: '5 min', why: 'The spices flavour the water, and the water flavours every grain.' },
  { ch: 'rice', step: 'Add salt, oil and the drained rice; boil on high till nine-tenths done, then drain.', time: '5 min', why: 'Only most of the way. The steam will finish it.' },
  { ch: 'layers', step: 'Spread the chicken, then the hot rice; add saffron milk, onions, herbs, masala and ghee.', why: 'Poured, not stirred. It stays in streaks, so every spoonful is a little different.' },
  { ch: 'seal', step: 'Put the lid on and seal the rim with dough.', why: 'The steam has nowhere to go, so it cooks the rice. That is the dum.' },
  { ch: 'wait', step: 'Tawa under the pot: high heat, then low.', time: '5 min high, 18 to 20 min low', why: 'The tawa spreads the heat, so the bottom does not burn.' },
  { ch: 'wait', step: 'Flame off, lid on, rest.', time: '10 min', why: 'Off the heat it is still cooking. The rest lets the grains settle, so they do not break.' },
  { ch: 'opening', step: 'Serve from the side, all the way down.', why: 'Rice from the top, chicken from the bottom. Every plate gets both.' },
];
