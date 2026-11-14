# Dum — design

**What it is.** A four-minute interactive web piece about Hyderabadi chicken dum biryani, made for the November "Thankful for This Food" challenge. You cook it, seal it, wait for it, open it and eat it. It is built to make the viewer hungry, mostly through sound, waiting and sensory writing.

**Status.** Statuses follow [decisions.md](decisions.md): *decided* by the user, *proposed* by Claude, or *open*. Everything in this file that is not marked decided is a proposal and is built as the default.

**Reading order for implementers:** this file, then [plan.md](plan.md). Research is in [research/](research/); each section below names the report it relies on.

## 1. Fixed constraints (decided)

- Dish and method: Hyderabadi chicken dum biryani. Chicken marinated in curd and ginger-garlic paste, fried till golden, made into the base, rice added, then dum.
- No person is needed. The arc is "I always know I will be happy after".
- Goal: "I wish I had this biryani right now", even from someone who doesn't like biryani.
- An eating journey bite by bite, with easter eggs for biting a whole spice.
- Cozy, with a good story.
- Illustrated art only. No photographs, no AI-generated images.
- Ships as a public web link, within a week of 14 Nov 2026.

## 2. What the gap research changed

| Finding | Source | Consequence |
|---|---|---|
| The user's method is **pakki** (meat cooked first), not the kachchi method the visual report described. No source names "fried golden first" as its own style. | [03](research/03-hyderabadi-details.md) §1 | Never say "kachchi" or "authentic". End card says "Made the home way: chicken first, then rice, then dum." |
| Real home dum is nearly silent: a few minutes on high, then about 20 on low with a tawa under the pot, then a 10-minute rest. | 03 §3 | The wait is quiet: a faint hiss and one thread of steam at the seal. No rolling boil, no trembling pot. The rest becomes a beat: "Ten more minutes." |
| Mirchi ka salan and dahi ki chutney are the standard pair. | 03 §4 | Both are on the table. The "raita bite" becomes the dahi chutney bite; salan gets a line. |
| Star anise is contested in Hyderabadi biryani. Bay leaf is tej patta (long, three-veined). Whole spices are normally left on the plate. | 03 §2 | Star anise is the rare egg and its line admits the argument. Tej patta is drawn long and veined. |
| Wording works through expected taste, and sensory + setting + pleasure phrases lifted the appeal of a disliked food type. Reading load must stay low. | [04](research/04-craving-evidence.md) §1 | Lines are short, concrete and about the taste experience. One or two senses per line, never a paragraph. |
| A delay lowered enjoyment when the thing waited for was only imagined. | 04 §3 | The pot stays visible and audible through the whole wait. |
| Satiation from imagined eating needs tens of repetitions, but identical beats should not loop. | 04 §5 | Six bites, each a different thing (steam, rice, chicken, onion, dahi, the last spoon). |
| Nothing shows that any of this converts someone who dislikes the dish. The best-supported cue is a visibly happy eater. | 04 §7 | Stays open (O2, O5). Default is hands and no face. Only showing it to people answers it. |
| iOS has no Vibration API. dvh jumps on iOS (WebKit 266835). Gradient masks do not interpolate. Animating `mask-position` repaints heavily. | [05](research/05-platform-and-accessibility.md), [06](research/06-visual-effect-techniques.md) | No haptics. Stage sized with `svh`. Effects move baked layers with `transform` and `opacity` only. |
| No animation library is needed. Raw Web Audio is enough. | 05 §3, [07](research/07-web-audio.md) §4 | Zero dependencies. |
| On iPhone the silent switch mutes Web Audio unless `navigator.audioSession.type = "playback"` (iOS 17+, experimental), which also stops the viewer's own music. | 07 §3 | "Start with sound" is an explicit choice, so it sets `playback` when available, and a hint says "No sound? Check the silent switch." |
| WCAG 2.2: hold and stir need single-tap and keyboard alternatives; moving content over 5 s needs a stop control; targets at least 24 px; text contrast 4.5:1. | 05 §4 | Every action is a real button. Calm mode stops ambient motion. Contrast is tested automatically. |
| Fraunces (display) and Literata (text) are OFL with no reserved name. | [08](research/08-assets-and-licences.md) §1 | Those two faces. |

## 3. The experience

A fixed stage fills the screen. There is no scrolling. One button at the bottom is always the next thing to do, and nothing advances on a timer the viewer can miss. Narration appears one short line at a time.

Two views carry everything:

- **Kitchen:** a home kitchen at night, from the side. Rain on the window, a stove with a low flame, the pot. Used for arrival, seal, wait, the lid-lift and the ending.
- **Top-down:** a round vessel or plate seen from above. Used for the cooking steps, the opened pot and the plate.

### Scenes

| # | Scene | View | What you do | What you hear | Tier |
|---|---|---|---|---|---|
| 0 | Arrival | Kitchen, wide | Choose "Start with sound" or "Start quietly" | Rain | Core |
| 1 | Marinate | Top-down bowl | Add curd, paste, spices; fold | Soft wet stir | Cook |
| 2 | Fry | Top-down pot | Hold to fry till golden (a tap also works) | Sizzle and crackle | Cook |
| 3 | Base | Top-down pot | Add fried onions and whole spices | Thick simmer | Cook |
| 4 | Layer | Top-down pot | Add rice, saffron milk, mint, onions, ghee | Quiet, small pours | Cook |
| 5 | Seal | Kitchen, medium | Hold to press the dough round the rim | A dull press, then hush | Core |
| 6 | Wait | Kitchen, pulled back, dim | Press "Wait" through five paced lines | Everything muffled, rain, a faint hiss | Core |
| 7 | Lid-lift | Kitchen, close, then top-down | Break the seal | Dough cracks, steam rushes, the room opens up, a chime | Core |
| 8 | Eat | Top-down plate | Take six bites | A spoon, then quiet | Core |
| 9 | Glow | Kitchen, wide, warmer | Go again | Rain easing, a warm drone | Core |

**Tiers are the cut line.** Core ships first and is complete without the rest: it opens on "The rice is in. The saffron is in." Cook scenes slot in between Arrival and Seal. Easter eggs and the spice box come after that.

**The wait** is the centre of the piece. The camera pulls back, the light drops, the sound goes dull as if heard from the next room. Each press of "Wait" brings one line and the button rests for about two seconds before it can be pressed again. That pacing is the only timing in the piece, and it cannot be failed.

**The lid-lift** is the one loud moment. The seal cracks, the lid rises, a backlit plume of steam fills the frame, the muffle opens over about a second and a half, and one chime sounds. Then the view drops to the open pot from above: pale rice, saffron streaks, dark fried onion, mint.

**Calm mode** (on by default when the system asks for reduced motion, and a visible toggle) keeps every line, sound and picture. It swaps camera moves for crossfades, stops ambient motion (rain, steam drift, flame flicker), turns holds into single taps, and shows the plume as a still.

### Script (draft, for the user to review)

Lines are final wording candidates, not placeholders. Once `js/data/script.js` exists it is the source of truth and this table is history.

| Scene | Lines |
|---|---|
| Arrival | Title: **Dum**. Under it: "A small, slow story about Hyderabadi dum biryani. About four minutes. Better with sound." |
| Marinate | "It starts an hour before. Curd first, thick and cold." · "Ginger and garlic, ground to a paste. It stays on your fingers until tomorrow." · "Chilli, turmeric, salt. The white turns the colour of a sunset." · "Fold it through. Then leave it alone." |
| Fry | "Hot oil. The chicken goes in." · "The kitchen stops being a kitchen." · "Golden at the edges. Next door, someone has started wondering what you're making." |
| Base | "Fried onions, dark and sweet." · "Whole spices: elaichi, clove, a piece of cinnamon, one long bay leaf." · "The masala thickens and holds on to the chicken." |
| Layer | "Rice, most of the way cooked, every grain on its own." · "Saffron milk. Watch it travel." · "Mint. More fried onion. A spoon of ghee, because nobody is watching." |
| Seal (core opening) | "The rice is in. The saffron is in." · "Now the lid, and dough around the rim, pressed down with your thumb." · after the hold: "Whatever is in there now stays in there." |
| Wait | "A few minutes on high. Then the flame goes low." · "This is the dum. Nothing to stir. Nothing to check." · "You can't open it yet. Everyone knows. Nobody says anything." · "One thread of steam finds a gap in the dough. The whole house smells of it now." · "Flame off. Ten more minutes. This is the hardest part." |
| Lid-lift | "The lid lifts, and for a second the steam is all there is." · "Then saffron. Then mint. Then the fried onions, darker than you remembered." · "Serve from the side, all the way down. Rice from the top, chicken from the bottom." |
| Eat 1 | "The first bite. Steam, then rice that smells of saffron, then the heat, a second late." · "You didn't know you were this hungry." |
| Eat 2 | "The chicken finds you. Soft from the curd, the ginger and garlic still in it." · "Now it makes sense." |
| Eat 3 | "Rice, chicken, a curl of fried onion. Nobody is talking. Nobody needs to." |
| Eat 4 | "A spoon of cold dahi chutney. The heat steps back, just enough to keep going." · "Salan on the side: sour, nutty, a little dangerous." |
| Eat 5 | "A second helping. You said you'd stop." |
| Eat 6 | "The last bite. You slow down on purpose and gather what's left into one spoonful." · "This is the one you save." |
| Glow | "The plate is empty. You lean back. Something warm and heavy settles in." · "You knew you'd be happy." · "You were right." · small: "Made the home way: chicken first, then rice, then dum." |

Easter eggs. One or two turn up per plate, at random, between bites. Found spices are kept in a small spice box on the end card ("3 of 7 found") so there is a reason to go again.

| Spice | Line | Chance |
|---|---|---|
| Elaichi (green cardamom) | "Elaichi. It was hiding in the rice. For a moment your whole mouth is a perfume shop." | Common |
| Clove | "A clove. Sharp, then your tongue goes a little numb. You reach for water." | Common |
| Cinnamon bark | "A piece of cinnamon. Woody, warm, sweet at the edges. You chew longer than you should." | Common |
| Peppercorn | "A whole peppercorn. A small bright bang at the back of your nose." | Common |
| Bay leaf | "The bay leaf. Nobody eats the bay leaf. And yet." | Common |
| Green chilli | "A green chilli, soft from the pot. It was not as mild as it looked." · "Dahi. Quickly." | Common |
| Star anise | "Star anise. Half the city says it doesn't belong in here. It tastes like a sweet you had once." | Rare |

Sound captions follow the Netflix convention found in 07 §8: lowercase, in square brackets, present tense, describing the sound. They show by default when the viewer starts quietly, and can be switched on or off. Examples: `[rain against the window]`, `[onions sizzling]`, `[muffled, from the next room]`, `[dough cracks]`, `[steam rushes out]`, `[a soft chime]`.

## 4. Look

The world is a dark, warm night, not a cream page. The palette is the Kalamkari dye set (indigo, madder, turmeric, iron black) lit by one flame.

| Token | Hex | Use |
|---|---|---|
| `--night` | `#141A2E` | Ground: the room at night |
| `--indigo` | `#27356B` | Window, rain, cool shapes |
| `--iron` | `#0E0D12` | Deepest shadow, text on saffron |
| `--madder` | `#A33B2C` | Borders, the dough's shadow, accents |
| `--saffron` | `#F2A516` | Light, the flame, the primary button |
| `--copper` | `#B8693A` | The pot |
| `--rice` | `#F6EBD3` | Rice, and all text on dark |
| `--mint` | `#5E8C4A` | Herbs, used sparingly |

- **Paper-cut construction.** Flat shapes in a few layers, each with a baked shadow (a darker offset copy of the shape, no live filter). Edges are slightly irregular, as if cut by hand. Gradients are reserved for light: the flame's glow and the light shaft behind the plume.
- **Type.** Fraunces for the title and the big moments (soft, a little wonky). Literata for narration. Captions are Literata italic, smaller. Text never sits on moving art: it has its own layer with a dark scrim behind it.
- **One signature.** The sealed pot and the plume that comes out of it. Everything else stays quiet so that moment is the only loud one.
- **Texture.** One static paper-grain tile over the whole stage, generated once at load.
- **Later polish, not core:** streetlight through a window grille throwing a slow lattice pattern on the wall; small parallax between layers.

How each effect is built is fixed by 06's recommendation table: ambient steam as pre-blurred sprites moved by CSS; the plume as 40 to 60 canvas particles stamped from one sprite with `lighter` compositing over a baked light shaft; saffron as streak shapes grown by `scale` and `opacity`; rain as sliding streak sprites; flame as an opacity flicker on a radial glow; camera as a transform on the stage wrapper with text outside it.

## 5. Sound

All synthesised with the Web Audio API in one module; recipes are in 07 §1 and §2. No audio files.

| Voice | Used in | Recipe |
|---|---|---|
| Rain | Everywhere, quieter indoors | Two decorrelated noise layers plus drop ticks |
| Flame hiss | Kitchen scenes | Low filtered noise |
| Sizzle | Fry | Highpassed noise bed plus Poisson-timed crackle ticks |
| Simmer | Base | Sine bubbles with rising pitch |
| Steam rush | Lid-lift | Noise through a bandpass sweeping 2 to 6 kHz, into the reverb |
| Chime | Lid-lift | Additive partials |
| Drone | Glow | Detuned saws through a slow lowpass |
| Taps | Buttons, spoon | Short filtered clicks |

- **The muffle.** Everything except the rain runs through one lowpass. In the wait it closes to about 600 Hz; at the lid-lift it opens with an exponential ramp.
- **Unlock and interruptions.** Audio starts only from the "Start with sound" tap. When the page is hidden the engine fades and suspends; when it returns it resumes, with a "Tap to bring the sound back" prompt if the browser needs a gesture.
- **Not verifiable here.** How any of it sounds on a phone speaker (07's listening-test list). That needs the user's phone.

## 6. Build

- **Zero-build static site.** `index.html`, CSS, ES modules. No framework, bundler or runtime dependency. Fonts come from a CDN with system fallbacks. `package.json` exists only to mark the folder as ES modules and to name the test and serve commands.
- **Layout.** A stage wrapper holds the art (inline SVG plus two canvases). A separate HTML layer on top holds narration, captions and controls, so text stays sharp when the stage is scaled.
- **Scene contract.** Each scene is a module with an `id`, a `mount` that builds its art once, and an async `play` that resolves when the viewer has finished it. The runner plays them in order. Everything a scene needs (audio, steam, narration, input, preferences, camera) arrives in one context object.
- **Tests.** `node --test` covers the pure logic: the runner, paced input, hold-or-tap, preferences, script integrity, the spice picker, and the contrast of every text and button colour pair in the tokens.
- **Checked by eye.** Layout at phone width (390 × 844) and at 320 px, through browser screenshots.
- **Cannot be checked here.** Sound, frame rate and heat on a real mid-range phone, and whether it makes anyone hungry.

Files, interfaces and task order are in [plan.md](plan.md).

## 7. Out of scope

Scrolling, haptics, accounts, analytics, a shareable image card, Urdu or Telugu script, a person or a face (unless the user decides O2 the other way), and any recorded audio.
