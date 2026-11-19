// Chapter VI, The Gravy. The same pot on the same burner as The Fry (it shares that chapter's art and code): the hot water goes
// in, the lid goes on, and the covered cook turns the marinade into a thick gravy; take it off at about ninety-five percent.
// The beats live in fry.js (part 'gravy'); ?state= works as there (water, lid, done). Hotspots: the tumbler (tap), the lid
// (drag or tap), the pot (hold while it cooks).
import fry from './fry.js';

export default { id: 'gravy', art: fry.art, play: (ctx) => fry.play(ctx) };
