# Design review: Dum v2 (17 Nov 2026)

Chair: senior-ui-ux-orchestrator, council mode (large, multi-session project). Lenses: product UX (ui-ux-llm-product-architect), visual critique (design-critic-skill), design intelligence (ui-ux-pro-max, run 15 Nov), implementation feasibility (lead), public-link metadata (seo/llm lens, light).

## Input and evidence

| Input | Evidence type |
|---|---|
| `docs/design.md`, `docs/plan.md` on branch `v2` (commit d20f662) | Source |
| Concept key frame and playable Wait prototype, screenshots at 1440x900 and 390x844 viewed on 15 Nov | Manual (the files were lost in the 17 Nov reboot; findings from them are recalled, not re-checked) |
| v2 build in progress (W1a, W1b, W1-food) | Not yet available; nothing rendered from v2 has been checked |

No browser, axe or Lighthouse check ran for this review. Every finding below is `Manual` unless it cites source.

## Ranked findings

| P | Finding | Evidence | Impact | Fix |
|---|---|---|---|---|
| P1 | **The piece has no length budget.** Seven chapters, about 40 voice lines and 25+ gestures. The voice alone runs about 3 minutes; with gestures and the camera the run is likely 9–12 minutes. v1 promised "about four minutes". | Source: design.md §3 | Fatigue is the enemy of D16 ("enjoy the process"); judges and casual viewers drop off with no sense of how long is left. | Budget each chapter at 45–75 s and 2–4 gestures (the Plate keeps six bites but each is short). Target 7–8 minutes total and say so on the title card. Cut lines before cutting gestures. |
| P1 | **No escape routes.** No way back, no chapter jump, no resume after a reload or a phone call. | Source: design.md §3 and plan.md (only a dev `?ch=` switch) | Breaks back-behavior and state-preservation expectations; a reload at chapter VI restarts the whole piece. | Remember the furthest chapter reached (prefs). Title card offers "Continue: <chapter>" when there is one. Header diamonds of reached chapters become buttons, and Settings gets a Chapters list and "Start over". Inside a chapter nothing skips the interaction, so D13 still holds. |
| P1 | **Subtitles cover the hotspots on phones.** In the concept phone shot the subtitle block sat on the stove, where the knob and the tawa live. | Manual: concept `phone-center` and `wait-wiped-phone` | The text competes with the object you must touch, and may block taps on it. | A subtitle safe zone: the bottom 22% of the viewport (28% on phones) belongs to subtitles. The camera frames the active hotspot inside the top 70%. The hint text sits beside its hotspot, never in the zone. |
| P1 | **The chapter header collides with the art.** On desktop "CHAPTER III / The Wait" sat on top of the window's jali arch, the most detailed part of the scene. | Manual: concept `wide-left` | Competing focal points at the top centre; the art's best area is covered. | After the large centred title moment, the header settles into a small cartouche in the frame's top-left corner, with the diamonds along the top border. Top centre stays clear for the art. |
| P1 | **Ten minutes of the same night blue.** Every chapter is the same dark room in the same light. | Source: design.md §4 (one look for all chapters) | Monotony flattens the arc; the reveal and the meal do not feel like a change of state. | A colour script, one mood per chapter, set through `room()` and `close()` options: Marinade at dusk (violet sky, rain starting, a warm practical light); Fry with the stove dominant and haze in the air; Layers misted with steam; Seal and Wait at deep night (rain heaviest, room dimmest); Opening as a burst of warm light; Plate in golden lamp light; End with the rain easing and the moon out. |
| P1 | **Hints are a ring and words, but the gestures are not taps.** "Stir in circles", "drag along the rim" and "drag the lid up" cannot be shown by a pulsing ring. | Source: design.md §2 rule 7 | First-time viewers on desktop and phone will tap where they must drag, then feel the piece is broken. | Each hotspot declares its gesture (`tap`, `drag` with a direction, `circle`, `hold`). The hint draws a small animated glyph along that path (a dotted arc for a stir, an arrow up for the lid). A static glyph in calm mode. |
| P1 | **Phones are the main target and frame rate is unmeasured.** Six to eight full-screen SVG planes, a blend-mode grain overlay, parallax and camera scaling. | Source: plan.md §Performance; no phone test exists | A janky phone run undoes the "artwork" impression. | Measure frame time for the first 2 s of each chapter. If the median frame is over 24 ms, drop the grain to a plain-opacity overlay, stop the automatic drift and halve the mote count. Owner tests on their phone as soon as W1 lands. |
| P1 | **Muted viewers lose half the feedback.** Many gestures are confirmed only by sound (the knob clicks, the sizzle swelling). | Source: design.md §5 | Viewers who start quietly, and deaf or hard-of-hearing viewers, get a weaker piece. | Rule: every sound has a visual twin (bubbles with the sizzle, a pointer jump with each knob click, a ripple with each plop). Starting quietly turns subtitles and sound captions on. |
| P1 | **Focus order is undefined for a layered SVG scene.** Hotspots live in planes ordered back to front, so Tab order would follow depth, not the story. | Source: plan.md §hotspot | Keyboard and screen-reader users tab through inactive or wrong-order targets. | Only active hotspots are tabbable (`tabindex="0"`); inactive ones are `-1` and `aria-hidden`. On each chapter start, focus moves to the chapter heading, then the first active hotspot. |
| P2 | **The title card and the scenes speak two visual languages.** The card is a bright, flat folk print; the scenes are grainy, dim and painterly. | Manual: concept title card vs scenes | The opening feels like a different product from what follows. | Keep the folk-print border on screen as a slim frame around every scene (madder band, low-contrast vine), and put the same grain on the card. The card "opens" into the scene through that shared frame. |
| P2 | **The why lines vanish once spoken.** D14 asks to explain why, but the reasons are spoken once and never seen again. | Source: design.md §3 | The most useful content in the piece is not kept, and there is nothing to take away. | The end card shows "The recipe, and why": each step with its reason, collected from the whys as you heard them, in a folk-print recipe card. Data already exists in the lines files. |
| P2 | **Faux italic.** Only upright Fraunces is loaded; the italic titles are synthesised. | Concept agent's report, 15 Nov | Slanted letterforms look cheap at display size. | Load the Fraunces italic file (fontsource) or set titles upright. |
| P2 | **The link preview is blank.** The piece is submitted as a public link; there is no `og:image`, `og:description` or twitter card. | Source: `index.html` | Wherever the link is posted it shows as a bare URL, the first impression of an art piece. | Add Open Graph and Twitter meta, plus a 1200x630 `og-image.png` rendered from the title card with headless Chrome (code-drawn, so D9 holds). |
| P2 | **The iOS silent-switch hint was dropped.** v1's title card said "No sound? Check the silent switch." | Source: v1 labels vs design.md §4 | iPhone viewers with the switch on hear nothing and do not know why. | Restore the line under the buttons. |
| P2 | **No visible failure state.** An error sets `data-error` on `<html>` and nothing else. | Source: v1 `main.js` | A viewer sees a frozen scene. | A small cream message with a "Reload" button when `data-error` is set. |

## Council decisions

1. **Escape routes vs "not click to skip" (D13).** Accepted: jump between chapters already reached, continue after a reload, start over. Rejected: a skip button inside a chapter, and jumping ahead to chapters not yet reached. D13 is about the interaction being the experience; navigation between chapters does not violate it, and it fixes a back-behavior and accessibility gap.
2. **Length budget vs "enjoy the process" (D16).** Enjoyment wins over completeness: trim lines first, then merge beats, keep the six bites. Target 7–8 minutes.
3. **Performance fallback vs the look.** Accepted. A smooth, plainer run beats a janky rich one. Grain and drift go first; the planes and the art stay.
4. **Colour script.** Accepted; it is a parameter on two art modules, not new art.
5. **Recipe card.** Accepted as part of the End chapter; costs one layout and no new content.
6. **Deferred:** a camera fly-through from the title card's arch into the kitchen window (beautiful, not worth the deadline risk).

## Fix brief by owner

- **W1a (foundation, running):** subtitle safe zone and camera framing rule; header cartouche; hint gesture glyphs (`gesture` option on `hotspot`); tabbable only when active, focus on chapter start; progress memory, Continue, chapter jump, Start over; quiet start turns subtitles and captions on; silent-switch line; Fraunces italic; slim persistent folk-print frame; failure message; frame-time fallback; Open Graph meta (the og-image render comes in W3).
- **W1b (room art, running) and W1-food (close art, running):** a `mood` option for the colour script.
- **W2 chapter briefs (18 Nov):** the 45–75 s, 2–4 gesture budget; every sound has a visual twin; gesture declared on every hotspot.
- **End chapter (W2):** the recipe card.
- **W3:** og-image render; phone frame-rate check by the owner.

## What not to change

- The layered window with the city moving behind it: the strongest effect in the concept.
- The warm pot in a cool dark room as the value structure of the Seal and Wait.
- One gesture vocabulary per object, no generic "next" button, nothing failable.
- The folk-print title card as the brand moment.

## Verification

| Check | Status |
|---|---|
| Findings from source docs | Manual (source read) |
| Findings from concept screenshots | Manual (recalled; files lost 17 Nov) |
| Screenshot check of the v2 build at 1440x900 and 390x844 | Planned: after W1 lands |
| Keyboard pass (Tab order, focus on chapter start) | Planned: W1a smoke plus a manual pass |
| Frame time on a phone | Planned / Manual: owner's phone |
| Link preview | Planned: W3, via a metadata check after the og-image exists |

## Privacy notes

Local-first. Nothing was sent to an external service for this review.
