# Fry and onwards: a followable cook-through (design)

Date: 2026-11-19. Status: approved in chat by the owner; written spec awaiting the owner's review.

## Problem

From The Fry to The Plate the game is hard to follow. Evidence gathered by walking every chapter in headless Chrome:

1. **The gravy has no step of its own.** Decision D3 (7 Nov) planned "fry the chicken, make the biryani base, then add rice". The Fry was later reworked to the source recipe (commit f1d4b3c), where the marinated chicken, fried onions and hot water cook together and that *is* the gravy. The base was folded into one passive "hold the pot, 10 to 15 min covered" bar. No decision was recorded and nothing shows a gravy forming.
2. **The pot teleports.** Copper handi (Fry) → white pot (Rice) → handi (Layers) already full of finished gravy.
3. **The Fry starts mid-way:** oil already hot, chicken already out of the fridge.
4. **Long cooks are passive holds,** and every chapter invents its own clock (wall clock, desk clock, pot labels, hold bars).
5. **Fried onions are drawn two ways:** crescents (The Onions) and long strands (The Fry, The Layers, The Marinade).
6. **Only an idle hint says what to do next.** It appears after a pause and is gone between hints.
7. Code comments still carry old chapter numbers (Layers "III", Seal "IV").

## Decisions (owner, 19 Nov)

- **D-A. Split The Fry along the recipe.** V The Fry sears the chicken; new VI The Gravy adds onions and hot water, covers and cooks. No new ingredients.
- **D-B. One counter, two burners.** Fry, Gravy, Rice and Layers share one kitchen counter: the copper handi on the left burner, the rice pot on the right. The camera pans between them.
- **D-C. A goal line that is always visible** under the chapter title, one plain sentence per step.
- **D-D. One kitchen timer for the whole recipe:** the digital desk clock from The Rest, reused wherever recipe minutes matter.

## Chapter sequence

I Spices, II Onions, III Marinade, IV Rest (unchanged), then:

| # | Chapter | Beats (goal line) |
|---|---------|-------------------|
| V | The Fry (left burner) | 1 "Pour the onion oil into the handi" (tap bottle) · 2 "Light the burner: turn the knob to medium" (drag knob; oil shimmers) · 3 "Tip the chicken in: drag the bowl over the handi" · 4 "Sear it: stir and turn the pieces" (circle) until edges colour, timer target 4 to 5 min |
| VI | The Gravy (left burner) | 1 "Add the fried onions: drag the plate over the handi" · 2 "Add ¼ cup hot water: tap the tumbler" · 3 "Cover the handi: drag the lid on" · 4 "Cook covered: hold the timer, take it off between 10 and 15 min" (optional "tap the lid to peek": gravy thick but pourable, chicken about 95%) · 5 "Turn the burner off" · 6 "Set the handi aside, covered: drag it to the warm spot" |
| VII | The Rice (camera pans right) | Existing beats on the right burner, same counter; goal lines; boil and rice clocks become the kitchen timer (5 min, 5 min, test at 3) |
| VIII | The Layers (pans back left) | New first beat "Uncover the handi: drag the lid off" (the same pot, gravy visible); then the existing ladle, saffron and toppings beats |
| IX | The Seal | Existing; goal lines |
| X | The Wait | Existing beats; the two timed ranges (low heat 18 to 20 min, rest 10 min) use the kitchen timer; goal lines |
| XI | The Opening | Existing; goal lines |
| XII | The Plate | Existing; goal lines |

Nothing can be failed. Releasing the timer early gives a "a bit longer" line; inside the window completes; past it gives a gentle "a little over, it will do" line and still completes.

## Shared pieces (built first)

1. **Goal line.** Hotspot option `goal` (string, at most 70 characters; falls back to the capitalised label). The line `#goal` under the cartouche shows the goal of the newest untouched live hotspot: the same selection the idle hint uses, extracted into one function in `js/core/hotspot.js` so hint and goal never disagree. It updates when steps finish or are skipped and hides when nothing is live.
2. **Kitchen timer.** `js/core/timer.js` (pure logic: `createTimer({ target: [min, max], rate })` with `hold(dt)`, `tap()`, `minutes`, `status()` returning `early | inside | late`, `text()` such as `0:12`), `js/art/timer.js` (the desk clock artwork extracted from `js/art/rest.js`, with the target window marked on the display), and a chapter helper `ctx.timer({ target, cap, say })` that resolves on release. The Rest chapter is refactored onto it with no behaviour change.
3. **Shared counter scene.** `js/art/counter.js`: backsplash, counter, two burners and knobs, the warm spot, named camera frames LEFT and RIGHT. Each chapter calls it and adds its props. Continuity is by identical layout plus chapter start states (Rice draws the handi covered and warm on the left; Layers draws it uncovered).
4. **One onion drawing.** The Onions chapter's crescent symbol becomes the shared fried-onion art in The Fry, The Gravy, The Marinade and The Layers; the strand drawing is removed.

## Data changes

- `js/data/chapters.js`: add `gravy`, renumber V to XII, re-measure `steps` (`?auto=1`).
- `js/data/cookbook.js`: split method step 8/9 into Fry and Gravy; add `ingredients.gravy` (fried onions 6 tbsp, hot water ¼ cup); shopping headings gain Gravy.
- `js/data/lines/gravy.js` new; `fry.js` trimmed to the sear; `layers.js` gains the uncover line. Every `voice.say` key must exist (existing lines test).
- `docs/decisions.md`: append D-A to D-D.
- Fix stale chapter numbers in code comments.

## Source facts (indianhealthyrecipes.com/chicken-biryani/, "Restaurant Style")

Verified by fetch on 19 Nov; the fetch was cut off inside step 3 of the method, so the layering details are from the recipe card summary.

- Chicken step: sauté the marinated chicken 4 to 5 min on medium; reserve 2 tbsp fried onions, add the rest (6 tbsp) to the chicken; ¼ cup hot water; cover and cook 10 to 15 min on medium; about 95% cooked; gravy thick but pourable; turn off the heat.
- There is no separate gravy or masala preparation.
- **Open decision for the owner's review.** The source puts *no* fried-onion solids in the marinade; the 6 tbsp go into the chicken step. The app's Marinade chapter currently crushes fried onions into the marinade (`birista`, 6 tbsp). Default in this spec: follow the source, so the onion beat is removed from The Marinade and its card, and the onions are added in The Gravy. If the owner prefers the app's current marinade, The Gravy's first beat becomes "add the reserved onions" with the amount taken from what remains.

## Stages (each leaves a playable game; smoke run after each)

1. **Foundations:** goal line, kitchen timer (Rest refactored), shared onion art, chapter data and numbering, decisions log. Accept: Rest plays as before with the shared timer; goal line shows on every chapter; unit tests pass.
2. **Fry and Gravy on the counter** (answers the gravy question). Accept: both chapters playable by mouse with the goal line alone; handi ends covered and warm; chapter steps re-measured.
3. **Rice on the counter.** Accept: camera pans right; the handi is visible covered and warm at the left; timer used.
4. **Layers.** Accept: opens by uncovering the same handi.
5. **Seal, Wait, Opening, Plate:** goal lines, timer in Wait, and any framing fix found in the walk-through.

## Testing

- Unit: timer logic; goal selection; chapter data (every numbered chapter has `steps`; ids unique; `gravy` after `fry`); every hotspot in chapters V to XII has a `goal` within the length limit (static source test); lines keys exist.
- Interaction: scripted real mouse input in headless Chrome for each new step, with screenshots reviewed (the harness used in the 19 Nov session).
- `tools/smoke.sh` full unattended run after every stage; `npm test` after every change.

## Out of scope

New voice recordings, new music, changes to chapters I to IV other than the marinade onion decision above and reusing the timer in The Rest, and changes to the bites in The Plate.
