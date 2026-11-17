# Dum — design (v2)

**What it is.** A short interactive web piece about Hyderabadi chicken dum biryani. You marinate, fry, layer, seal, wait for, open and eat it, with your own hands, in a kitchen on a rainy night. It should look like a piece of artwork, sound like a real kitchen, and make you hungry.

**Status.** v1 (one line of text and one yellow button per beat, flat paper-cut art in a phone-width strip) was rejected by the owner on 15 Nov 2026. This file replaces it. Decisions and their status are in [decisions.md](decisions.md). Build order, file layout and interfaces are in [plan.md](plan.md).

## 1. What the owner asked for (decided)

Everything in decisions.md D1–D10 still holds: the dish and method, no person on screen, the craving goal, the eating journey with spice easter eggs, cozy, illustrated art only (no photos, no AI images), a public web link within a week of 14 Nov. New on 15 Nov:

- **D12** It must look like a piece of artwork: 2.5D layered scenes, the way Genshin Impact shows some of its stories. Inspiration from collectui.com.
- **D13** The focus is the visuals, the sound and the interaction. It must not be a click-to-skip flow.
- **D14** Explain why each thing is done.
- **D15** A voice-over tells it, so nobody has to read.
- **D16** The viewer should enjoy the process.

## 2. Rules every chapter follows

1. **You do things to the food and the kitchen, and the words follow from what you did.** There is no generic "next" button anywhere.
2. **Every touch answers at once** in picture and in sound (under 100 ms). Sound follows the gesture: speed, distance, pressure.
3. **Nothing can be failed. Nothing runs on a timer the viewer can miss.** The piece waits for the viewer's hands.
4. **Every drag also works as a tap, Enter or Space** (one press = one step). Calm mode turns every drag into taps and stops camera drift and ambient motion.
5. **Each cooking action gets its why,** spoken at the moment it happens, in one short sentence.
6. **The voice carries the words.** Subtitles mirror the voice (on by default). Sound captions in [brackets] are a separate toggle.
7. **Never lost.** After 2.5 s idle, the next touchable thing pulses with a saffron ring, a short italic hint appears beside it ("stir it in"), and a small glyph shows the gesture along its path: a dotted arc for a stir, an arrow for a drag, a filling ring for a hold, a dot for a tap. It shows once per hotspot and fades on first touch. Calm mode shows the glyph still.
8. **Variety.** No two beats in a row use the same gesture.
9. **The camera frames what you touch.** It pushes in on the active object so every target is big; hit areas are at least 48 CSS px. The active hotspot always sits in the top 70% of the screen: the bottom of the screen belongs to the subtitles (22% on desktop, 28% on phones).
10. **Short enough to love.** Each chapter takes 45–75 s and 2–4 gestures; the Plate keeps its six bites, each short. The whole piece runs 7–8 minutes, and the title card says so. Trim lines before trimming gestures.
11. **Every sound has a visual twin** (bubbles with the sizzle, a pointer jump with each knob click, a ripple with each plop), so the piece still answers every touch for someone watching without sound.
12. **Ways out, but no skipping.** The piece remembers the furthest chapter reached. The title card offers "Continue" when there is one; the diamonds of reached chapters jump there; Settings has the chapter list and "Start over". Nothing skips the interaction inside a chapter, and chapters not yet reached cannot be jumped to.

## 3. Chapters

A title card opens the piece; seven chapters; an end card closes it. Each chapter starts from its own known state, so any chapter can be opened alone with `?ch=<id>`. Lines are voice-over: **say** is the story, **why** is the reason. Whys marked *(cook)* are Claude's wording for the owner to confirm or correct.

| # | Chapter | Shot | What you do | What you hear |
|---|---|---|---|---|
| — | Title card | Ornamental card | "Begin with sound" or "Begin quietly" (this unlocks audio) | Rain fades in |
| I | **The Marinade** | Close: steel bowl of chicken on the counter | Drag the curd bowl over and tip it in; tap the ginger-garlic paste; tap chilli, turmeric and salt in turn; stir in circles until the white turns sunset orange | Thick plops, dry puffs, a wet fold that speeds up with your stir |
| II | **The Fry** | Close: heavy pot of hot oil on the stove | Drag each piece of chicken into the oil; hold on the pot until the edges go golden (release and hold again any time); drop in dark fried onions; tap the whole spices in one by one | Sizzle bursts per piece, a sizzle bed that swells while you hold, crackle, a thick simmer |
| III | **The Layers** | Close: into the pot, masala at the bottom | Tap the ladle to spread rice in layers; drag across the rice to pour saffron milk (the streaks follow your finger); scatter mint and onions; drizzle ghee | Soft pours, a thin trickle, small drops |
| IV | **The Seal** | Room, medium: pot on the stove | Drag the lid on; press the dough rope round the rim, press by press (drag along the rim or tap) | A lid's clink, dull thumb presses, then the room goes quiet |
| V | **The Wait** | Room, wide | Slide the tawa under the pot; turn the knob from high to low; then, in any order: wipe the fogged window, try the lid (it refuses), push the thread of steam; finally turn the flame off | Flame hiss following the knob, everything muffled as if from the next room, rain louder at the window, a squeaky rub, a dull knock, cooling ticks |
| VI | **The Opening** | Room close, then into the pot | Drag along the dough to crack the seal (cracks follow your finger); drag the lid up (steam leaks as it rises, then bursts); serve with the big spoon, down the side and up | Cracking dough, a steam rush, the muffle opening, one chime, the spoon scraping the bottom |
| VII | **The Plate** | Close: the plate on the table | Six bites, each a different gesture (below); whole spices turn up in some bites | Spoon on steel, then quiet; a short sting for each spice found |
| — | End card | Room, warm | Read "The recipe, and why" (every step with its reason, as you heard them); see the spices you found; "Go again" | Rain easing, a warm drone |

**The six bites.** 1: gather rice from the edge of the mound into the spoon. 2: tap a piece of chicken to break it onto the spoon. 3: sweep rice, chicken and an onion curl together. 4: dip the spoon in the dahi chutney. 5: drag the serving spoon from the pot for a second helping (the plate refills). 6: sweep what is left into one last spoonful. Between bites the spoon lifts toward the viewer and the mound shrinks. Easter eggs: one or two of the seven spices turn up per plate, shown on the spoon; found spices are kept for the end card ("3 of 7 found").

### Lines

| Chapter | Say | Why |
|---|---|---|
| Marinade | "It starts an hour before. Curd first, thick and cold." · "Ginger and garlic, ground to a paste." · "Chilli, turmeric, salt. The white turns the colour of a sunset." · "Fold it through. Then leave it alone." | "The curd softens the chicken and holds the spices to it." *(cook)* · "An hour in the curd, and it softens all the way through." *(cook)* |
| Fry | "Hot oil. The chicken goes in." · "The kitchen stops being a kitchen." · "Golden at the edges. Next door, someone has started wondering what you're making." · "Fried onions, dark and sweet." · "Whole spices: elaichi, clove, a piece of cinnamon, one long bay leaf." · "The masala thickens and holds on to the chicken." | "Frying it first browns the edges, and the browning is flavour." *(cook)* · "Whole, not ground. They give up their smell slowly, through the long cook." *(cook)* |
| Layers | "Rice, most of the way cooked, every grain on its own." · "Saffron milk. Watch it travel." · "Mint. More fried onion. A spoon of ghee, because nobody is watching." | "Only most of the way. The steam will finish it." · "Poured, not stirred. It stays in streaks, so every spoonful is a little different." *(cook)* |
| Seal | "Now the lid, and dough around the rim, pressed down with your thumb." · "Whatever is in there now stays in there." | "The dough seals the lid. The steam has nowhere to go, so it cooks the rice. That is the dum." |
| Wait | "A few minutes on high." · "This is the dum. Nothing to stir. Nothing to check." · "Outside, the rain has not stopped. Good. Nobody is going anywhere." · "You can't open it yet. Everyone knows. Nobody says anything." · "One thread of steam finds a gap in the dough. The whole house smells of it now." · "Flame off. Ten more minutes. This is the hardest part." | "The tawa spreads the heat, so the bottom doesn't burn." · "High heat builds the steam. Low heat keeps it." · "Open it now and the steam is gone, and the rice stays hard." · "Off the heat it is still cooking. The rest lets the grains settle, so they don't break." |
| Opening | "The lid lifts, and for a second the steam is all there is." · "Then saffron. Then mint. Then the fried onions, darker than you remembered." · "Serve from the side, all the way down." | "Rice from the top, chicken from the bottom. Every plate gets both." |
| Plate | 1: "The first bite. Steam, then rice that smells of saffron, then the heat, a second late." · "You didn't know you were this hungry." 2: "The chicken finds you. Soft from the curd, the ginger and garlic still in it." · "Now it makes sense." 3: "Rice, chicken, a curl of fried onion. Nobody is talking. Nobody needs to." 4: "A spoon of cold dahi chutney. The heat steps back, just enough to keep going." · "Salan on the side: sour, nutty, a little dangerous." 5: "A second helping. You said you'd stop." 6: "The last bite. You slow down on purpose and gather what's left into one spoonful." · "This is the one you save." | — |
| End | "The plate is empty. You lean back. Something warm and heavy settles in." · "You knew you'd be happy." · "You were right." · small text: "Made the home way: chicken first, then rice, then dum." | — |

Spice lines are unchanged from v1 and live in `js/data/spices.js`.

## 4. Look

**The idea.** Each chapter is one painted scene you look into, built from five to eight depth planes that shift against each other as the camera drifts (pointer on desktop, slow automatic drift on touch). Inside it, the scene reads like a grainy screen-print or gouache poster. Around it, a folk-print ornamental frame. Borrow the device of Genshin's storybook cutscenes (layered planes, slow camera, subtitles over the picture, ornamental framing), not its motifs.

**References** (CollectUI, Illustration category, 15 Nov):
- *Layered hills with small figures*: big simple shapes, each plane hazier and bluer with distance, soft grain. The depth recipe.
- *Forest and lake at dusk*: dense stippled texture, one small warm light in large cool masses. The lighting idea.
- *Rug Studio landing page*: thick border, vine ring, arched panel with a sunburst, triangle trim, four or five inks. The frame and the cards.

**Colour script.** One room, but the light changes with the story, set through a `mood` option on `room()` and `close()`:

| Chapter | Mood |
|---|---|
| Marinade | Dusk: violet sky, the rain just starting, a warm lamp on the counter |
| Fry | The stove's light dominant, a haze of frying in the air |
| Layers | Misted with steam, softer edges |
| Seal, Wait | Deep night: rain heaviest, the room dimmest, the pot the only warmth |
| Opening | A burst of warm light as the lid lifts |
| Plate | Golden lamp light on the table |
| End | Rain easing, the moon out |

**Two kinds of shot.**
- **Room**: the kitchen from the side. Used by Seal, Wait, the start of the Opening and the end card. One shared world.
- **Close**: a three-quarter view looking down about 35 degrees at the counter or table (circles become ellipses about 0.45 as tall as wide), with the room far behind, soft and blurred. Used by Marinade, Fry, Layers, the inside of the pot in the Opening, and the Plate.

**The room** (proven in the 15 Nov concept; world coordinates are a 1600 x 1000 view drawn out to x -220..1820, y -100..1100 so the camera never shows an edge; phones see only about x 570..1030, so that column must tell the whole picture):
- Sky: deep blue gradient (#0B1030 to #1E2A63 to #3A3F7A), warm city haze low down, a soft moon behind cloud.
- Far skyline: low-contrast silhouettes: the Charminar near x 730, a mosque with domes, water tanks, tiny warm windows.
- Near rooftops: darker flat roofs with parapets, a water tank on stilts, wires, a neem crown, 8–10 lit windows and one teal TV window.
- Rain: thin slanted streaks in two layers.
- The wall, with a real hole cut for the window so the city moves behind the frame (the 2.5D effect, and the strongest part of the concept): deep indigo plaster, a cusped Deccani arch window (x 610–990, y 90–470) in madder-brown wood with a jali lattice in the arch, a sill with a tulsi plant and a brass lota; a printed Kalamkari border band across the wall (y 500–536); shelves of spice jars, steel boxes and hanging ladles at left; an arched niche with a small oil lamp at right; a towel, a calendar, a small pale-ochre house gecko.
- Counter, stove and the copper handi: a stone counter (top edge y 740), a steel stove with a tawa and a low blue-and-saffron flame, the wide-bellied hammered copper pot sealed with a pale dough rope with thumb dents, one thread of steam; beside it saffron milk, fried onions, chai, a matchbox, a steel masala dabba.
- Dust motes drifting up through the warm glow.
- Foreground: dark framing shapes with warm rim light, readable at a glance: a string of dried red chillies and a garlic braid top left, the bottoms of hanging copper pans top right, a brass vessel and plates at the bottom. Blur at most 1 px; a shape that cannot be read is removed.

**Craft rules** (what separates artwork from clip-art):
1. Light logic: every object has a lit side, a shadow side, a rim light toward its source, and a baked cast shadow. No object is a single flat fill.
2. Value: the hero (pot, then food) is the brightest, warmest, most saturated thing. Corners are darkest.
3. Atmospheric perspective: far planes lower in contrast, bluer, lighter; near planes darker and more saturated.
4. Hand-cut edges: no bare rectangles or ruler lines on anything organic or handmade (`wobble`, `blob` in `js/art/lib.js`).
5. Density: dozens of small readable things in a wide view; the focal column stays calm enough for the hero to win.
6. Screen-print texture: halftone dot patterns shade big surfaces; a film grain overlay on everything (soft-light around 0.34, overlay around 0.07).
7. Warm glows run saffron to copper to madder to transparent with `mix-blend-mode: screen`. Never let saffron fade over indigo through olive or brown.
8. Palette: night #141A2E, indigo #27356B, iron #0E0D12, madder #A33B2C, saffron #F2A516, copper #B8693A, cream #F6EBD3, mint #5E8C4A, plus their tints and shades. Food may add its own true colours (chicken browns, chilli green, saffron orange #E0861A).
9. Food must pass the appetite test: warm saturated colour, individual rice grains, glossy highlights, pale rice against dark onion, a little bright green, steam. Grey or uniform food fails.

**Frame and cards.** The title and end cards follow Rug Studio in this project's inks (night, madder, saffron, mint, cream): thick madder border, vine-and-flower ring, triangle trim, a cusped arch panel with a saffron sunburst behind a sealed-pot emblem, cream display type, and the same grain as the scenes. Every scene keeps a slim version of that border on screen (a thin madder band with a low-contrast vine and small Kalamkari corner flowers, about 10 px, 6 px on phones), so the card opens into the scene through a frame that stays. The title card also says "About 8 minutes · Better with sound" and, under the buttons, "No sound? Check the silent switch."

**Type.** Fraunces (upright and true italic) for titles, Literata for subtitles and hints (both OFL, loaded from jsdelivr). At each chapter start the title shows large in the centre for about two seconds, then settles into a small cartouche in the frame's top-left corner (numeral in letter-spaced small caps, title in Fraunces italic), with seven small diamonds along the top border (current filled saffron, reached ones outlined saffron, others cream at low opacity). The top centre stays clear for the art. Subtitles at the bottom centre: the line being spoken in full cream, the previous line faded to 0.45, at most two lines, `clamp(1rem, 0.9rem + 0.5vw, 1.25rem)`, on a light scrim. Text never sits inside a moving plane.

## 5. Sound

All synthesised with the Web Audio API (`js/core/audio.js`), plus recorded voice files if the owner records them. Existing voices: rain, flame hiss, sizzle, simmer, drone, tap, thud, crack, steam rush, chime, spoon. Each chapter adds what it needs (plops, powder puffs, wet stir, pours, trickle, clink, press, knob click, rub, knock, cooling tick, scrape, sting) as its own small module. Rules:
- **Sound follows the gesture.** Continuous voices (stir, sizzle, rub, flame) take their level from the gesture every frame through `audio.level()`.
- **The muffle.** Everything but the rain runs through one lowpass. Sealing the pot starts closing it; in the Wait it sits at about 600 Hz; lifting the lid opens it over about 1.5 s.
- **Under the voice.** While a line is spoken, everything else ducks by about 6 dB.
- Audio starts only from the title card's "Begin with sound". It fades and suspends when the tab is hidden.

## 6. Voice

Open question O9: whose voice. Until it is answered the build uses a placeholder that is easy to swap:
- Every line has an id. If `audio/voice/<id>.mp3` is listed for it, that file plays; otherwise the browser's speech synthesis speaks it (an English voice, rate about 0.92); if there is no synthesis voice or the viewer began quietly, the subtitle simply stays up for a time based on its length.
- Lines queue. A new action never cuts a line off; it follows it. No chapter step waits on a line finishing, so a stuck voice can never stall the piece.
- The title card notes "Voice is a placeholder" until real recordings exist.

Known limit: Chrome on Linux often has no speech voices at all, so the placeholder may be silent on the owner's desktop while working on phones.

## 7. Accessibility

Every hotspot is a real focusable control (`role="button"`, an `aria-label` that matches its hint) with a visible focus ring. Only active hotspots are tabbable; inactive ones are `tabindex="-1"` and `aria-hidden`, so Tab follows the story, not the depth of the planes. At each chapter start focus moves to the chapter heading, then to the first active hotspot. Subtitles are an `aria-live` region. Starting quietly turns subtitles and sound captions on. If something breaks, a small message with a "Reload" button appears instead of a frozen scene. Calm mode (default on with `prefers-reduced-motion`) keeps every line, sound and picture, pins the camera, stops ambient motion and turns drags into taps. Text contrast at least 4.5:1, enforced by `tests/contrast.test.js`. Settings: sound, voice, subtitles, sound captions, calm mode.

## 8. The link

The piece is shared as a link, so its preview is its first impression: a title, a one-line description and a 1200x630 `og-image.png` rendered from the title card with headless Chrome (code-drawn, so D9 holds), through Open Graph and Twitter card meta.

## 9. Out of scope

Scrolling, haptics, accounts, analytics, a share card, Urdu or Telugu script, any person or face, photos, AI-generated images or voices (unless the owner decides otherwise), and a framework or bundler.
