export const SCENES = ['arrival', 'marinate', 'fry', 'base', 'layer', 'seal', 'wait', 'reveal', 'eat', 'glow'];
export const CORE = ['arrival', 'seal', 'wait', 'reveal', 'eat', 'glow'];

export const labels = {
  title: 'Dum',
  intro: 'A small, slow story about Hyderabadi dum biryani. About four minutes. Better with sound.',
  withSound: 'Start with sound',
  quietly: 'Start quietly',
  silentHint: 'No sound? Check the silent switch.',
  resumeSound: 'Tap to bring the sound back',
  again: 'Go again',
  method: 'Made the home way: chicken first, then rice, then dum.',
  found: '{n} of 7 found',
};

export const spices = [
  { id: 'elaichi', name: 'Elaichi', weight: 1, say: ['Elaichi. It was hiding in the rice. For a moment your whole mouth is a perfume shop.'] },
  { id: 'clove', name: 'Clove', weight: 1, say: ['A clove. Sharp, then your tongue goes a little numb. You reach for water.'] },
  { id: 'cinnamon', name: 'Cinnamon', weight: 1, say: ['A piece of cinnamon. Woody, warm, sweet at the edges. You chew longer than you should.'] },
  { id: 'pepper', name: 'Peppercorn', weight: 1, say: ['A whole peppercorn. A small bright bang at the back of your nose.'] },
  { id: 'bayleaf', name: 'Bay leaf', weight: 1, say: ['The bay leaf. Nobody eats the bay leaf. And yet.'] },
  { id: 'chilli', name: 'Green chilli', weight: 1, say: ['A green chilli, soft from the pot. It was not as mild as it looked.', 'Dahi. Quickly.'] },
  { id: 'staranise', name: 'Star anise', weight: 0.15, say: ["Star anise. Half the city says it doesn't belong in here. It tastes like a sweet you had once."] },
];

const bite = (...lines) => lines.map((say, i) => ({
  say,
  ...(i === 0 && { cue: 'bite' }),
  ...(i === lines.length - 1 && { act: 'Take a bite' }),
}));

const eat = [
  bite(
    'The first bite. Steam, then rice that smells of saffron, then the heat, a second late.',
    "You didn't know you were this hungry.",
  ),
  bite(
    'The chicken finds you. Soft from the curd, the ginger and garlic still in it.',
    'Now it makes sense.',
  ),
  bite('Rice, chicken, a curl of fried onion. Nobody is talking. Nobody needs to.'),
  bite(
    'A spoon of cold dahi chutney. The heat steps back, just enough to keep going.',
    'Salan on the side: sour, nutty, a little dangerous.',
  ),
  bite('A second helping. You said you\'d stop.'),
  bite(
    'The last bite. You slow down on purpose and gather what\'s left into one spoonful.',
    'This is the one you save.',
  ),
];
delete eat[5].at(-1).act; // the last bite ends on the default label

export const script = {
  arrival: [{ act: false }],
  marinate: [
    { say: 'It starts an hour before. Curd first, thick and cold.' },
    { say: 'Ginger and garlic, ground to a paste. It stays on your fingers until tomorrow.' },
    { say: 'Chilli, turmeric, salt. The white turns the colour of a sunset.' },
    { say: 'Fold it through. Then leave it alone.' },
  ],
  fry: [
    { cap: '[oil sizzling]', say: 'Hot oil. The chicken goes in.' },
    { say: 'The kitchen stops being a kitchen.' },
    { say: "Golden at the edges. Next door, someone has started wondering what you're making." },
  ],
  base: [
    { say: 'Fried onions, dark and sweet.' },
    { say: 'Whole spices: elaichi, clove, a piece of cinnamon, one long bay leaf.' },
    { say: 'The masala thickens and holds on to the chicken.' },
  ],
  layer: [
    { say: 'Rice, most of the way cooked, every grain on its own.' },
    { say: 'Saffron milk. Watch it travel.' },
    { say: 'Mint. More fried onion. A spoon of ghee, because nobody is watching.' },
  ],
  seal: [
    { say: 'The rice is in. The saffron is in.' },
    { say: 'Now the lid, and dough around the rim, pressed down with your thumb.', act: 'Press the seal', hold: 1800, holdCue: 'pressing' },
    { cue: 'sealed', say: 'Whatever is in there now stays in there.' },
  ],
  wait: [
    { cue: 'low', cap: '[muffled, from the next room]', say: 'A few minutes on high. Then the flame goes low.', act: 'Wait', rest: 2000 },
    { say: 'This is the dum. Nothing to stir. Nothing to check.', act: 'Wait', rest: 2000 },
    { say: "You can't open it yet. Everyone knows. Nobody says anything.", act: 'Wait', rest: 2000 },
    { say: 'One thread of steam finds a gap in the dough. The whole house smells of it now.', act: 'Wait', rest: 2000 },
    { cue: 'off', say: 'Flame off. Ten more minutes. This is the hardest part.', act: 'Wait', rest: 2000 },
  ],
  reveal: [
    { cap: '[dough cracks]', act: 'Break the seal', hold: 1200, holdCue: 'cracking' },
    { cue: 'lift', cap: '[steam rushes out]', say: 'The lid lifts, and for a second the steam is all there is.' },
    { cue: 'look', cap: '[a soft chime]', say: 'Then saffron. Then mint. Then the fried onions, darker than you remembered.' },
    { cap: null, say: 'Serve from the side, all the way down. Rice from the top, chicken from the bottom.' },
  ],
  eat,
  glow: [
    { say: 'The plate is empty. You lean back. Something warm and heavy settles in.' },
    { say: "You knew you'd be happy." },
    { say: 'You were right.', act: false },
  ],
};
