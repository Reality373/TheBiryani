# Fry and onwards: a followable cook-through (design)

Date: 2026-11-19. Status: approved in chat by the owner; the gravy details follow the standard recipes (owner: "go for the standard recipe off the internet"); written spec awaiting the owner's review.

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

- **D-A. Split The Fry along the recipe.** V The Fry sears the chicken; new VI The Gravy cooks it down into the gravy: hot water, cover, cook, thicken. No new ingredients. The owner asked for the standard internet recipe for the gravy; three standard sources were read (see Source facts) and all make the gravy from the marinated chicken itself.
- **D-B. One counter, two burners.** Fry, Gravy, Rice and Layers share one kitchen counter: the copper handi on the left burner, the rice pot on the right. The camera pans between them.
- **D-C. A goal line that is always visible** under the chapter title, one plain sentence per step.
- **D-D. One kitchen timer for the whole recipe:** the digital desk clock from The Rest, reused wherever recipe minutes matter.

## Chapter sequence

I Spices, II Onions, III Marinade, IV Rest (unchanged), then:

| # | Chapter | Beats (goal line) |
|---|---------|-------------------|
| V | The Fry (left burner) | 1 "Pour the onion oil into the handi" (tap bottle) · 2 "Light the burner: turn the knob to medium" (drag knob; oil shimmers) · 3 "Tip the chicken in: drag the bowl over the handi" · 4 "Sear it: stir and turn the pieces" (circle) until edges colour, timer target 4 to 5 min |
| VI | The Gravy (left burner) | 1 "Stir until it firms up and the liquid shows" (circle; the marinade clings to the chicken and the juices come out; no cover yet) · 2 "Add ¼ cup hot water: tap the tumbler" · 3 "Cover the handi: drag the lid on" · 4 "Cook covered: hold the timer, take it off between 10 and 15 min" (optional "tap the lid to peek": gravy thick but pourable, oil starting to show at the edge, chicken about 95%) · 5 "Turn the burner off" · 6 "Set the handi aside, covered: drag it to the warm spot" |
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
- `js/data/cookbook.js`: split method step 8/9 into Fry and Gravy (the gravy step reads: stir until it firms up, add ¼ cup hot water, cover and cook 10 to 15 min, off at about 95%, gravy thick but pourable; the "add the fried onions" words are dropped because the onions are already in the marinade); add `ingredients.gravy` (hot water ¼ cup); shopping headings gain Gravy.
- `js/data/lines/gravy.js` new; `fry.js` trimmed to the sear; `layers.js` gains the uncover line. Every `voice.say` key must exist (existing lines test).
- `docs/decisions.md`: append D-A to D-D.
- Fix stale chapter numbers in code comments.

## Source facts (read on 19 Nov; fetched pages are paraphrased, not copied)

Three standard Hyderabadi chicken dum biryani recipes were read in full or in part:

| Source | Gravy | Fried onions | Cook |
|--------|-------|--------------|------|
| Swasthi, indianhealthyrecipes.com/chicken-biryani/ (read to the middle of the method; cut off) | none separate: the marinated chicken is cooked in the pot | no solids in the marinade; 6 tbsp into the chicken, 2 tbsp reserved | sauté 4 to 5 min on medium; ¼ cup hot water; cover 10 to 15 min; about 95% cooked; gravy thick but pourable |
| My Food Story, myfoodstory.com/?p=12369 | none separate | 2 tbsp in the marinade, half over the chicken, the rest on top | chicken 4 min turning once, covered 3 min; the final steam finishes it |
| Sinfully Spicy, sinfullyspicy.com (dum chicken biryani with restaurant flavors) | none separate; masala base is the marinated chicken | two-thirds in the marinade, one-third for layering | medium, stirring, 6 to 8 min until it firms up and liquid shows; cover 12 to 15 min; thick and saucy |

A fourth (Whisk Affair) refused automated reads. No standard Hyderabadi recipe with a separate onion-and-tomato gravy was found; none is invented here.

**Resolved: the marinade onions.** Two of the three sources put fried onions in the marinade, and the app's Marinade chapter already does. Chapter III stays as it is. The Gravy therefore adds no onions; the 2 tbsp kept back stay for the top of the biryani, as now. (The earlier open decision is closed.)

Sections of the standard method used for the gravy beats: the firm-up stage with the liquid showing (Sinfully Spicy), the hot-water-and-cover stage and the 95% / thick-but-pourable cues (Swasthi). Add a credit line for Sinfully Spicy next to Swasthi's on the end card.

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

New voice recordings, new music, changes to chapters I to IV other than reusing the timer in The Rest, and changes to the bites in The Plate.
