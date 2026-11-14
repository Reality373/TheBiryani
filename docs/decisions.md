# Decision log

Three statuses, kept apart on purpose:

- **Decided** — the user said so. Changes only if the user says otherwise.
- **Proposed** — Claude's recommendation that the user has not confirmed. Built as the default, cheap to change.
- **Open** — nobody has decided, or only a prototype or a real viewer can answer.

Sources: the brainstorm chat of 7 Nov 2026 ([research/00-brainstorm-chat.md](research/00-brainstorm-chat.md)) and the user's answers on 14 Nov 2026.

## Decided

| # | Decision | When | Notes |
|---|---|---|---|
| D1 | The dish is **Hyderabadi chicken dum biryani**. | 7 Nov | |
| D2 | **No person is needed.** Biryani is the user's comfort food; the arc is "I always know I will be happy after I'm done eating". | 7 Nov | Overrides the first report's "one dish, one person" conclusion. |
| D3 | **The recipe:** chicken marinated in curd and ginger-garlic paste, fried till golden, made into the biryani base, then rice added for dum. | 7 Nov | Overrides the kachchi method the visual report cites. |
| D4 | **The goal:** the viewer's mouth should water and they should think "I wish I had this biryani right now", even if they don't like biryani. Carried by senses in description (aroma, warmth, noise, anticipation) and human emotion. | 7 Nov | |
| D5 | **An eating journey after the cooking:** what the first, second and last bites feel like, plus **easter eggs** for biting a whole spice (the user named pepper, cinnamon and elaichi). | 7 Nov | |
| D6 | A **good story and a cozy vibe** overall. | 7 Nov | From the first message. |
| D7 | **Deadline: within a week** of 14 Nov. | 14 Nov | No exact date given, so the core ships first. |
| D8 | **Submitted as a public web link.** | 14 Nov | |
| D9 | **Art is illustrated only.** No photograph and no AI-generated image for the hero plate. | 14 Nov | Changes the visual report's hybrid recommendation; see P3. |
| D10 | **Local commits are fine.** Nothing is pushed or published without asking. | 14 Nov | |
| D11 | **Working method:** the lead model plans, architects and reviews; smaller models (Sonnet at medium or low effort) do the well-scoped tasks as subagents. | 14 Nov | |

## Proposed

| # | Proposal | Why | Cost to change |
|---|---|---|---|
| P1 | Working title **"Dum"**. | Short, and it names the wait, which is the heart of the piece. | Trivial. |
| P2 | Flow: **cook → wait → reveal → eat → glow**. | Offered in the chat; the user built on it (D5) without objecting. | High once scenes exist. |
| P3 | Visual direction: a **paper-cut illustrated world** (Kalamkari borders, jali light, a rainy window), with the lid-lift and the bites given a richer, more dramatically lit illustrated treatment in place of a photo. | The visual report's option A with B's setting. Its option D needed a photographic hero, which D9 rules out, so the report's own fallback applies: sell the reveal through steam, sound and motion. | Medium. |
| P4 | Palette: saffron, cream, terracotta, warm brown, with indigo and charcoal accents. | From the chat and the visual report. The hex values there are untested starting points and get contrast-checked before use. | Low (tokens). |
| P5 | **All sound synthesised with Web Audio**, no audio files, unless one sound clearly needs a sample. | Tiny, no licences, and the chat proposed it. | Medium. |
| P6 | Onboarding asks **"start with sound" or "start quietly"**; a **calm mode** defaults from the system's reduced-motion setting and keeps the same story with gentler delivery. | The tap unlocks audio; calm mode is the accessibility answer. | Low. |
| P7 | **Zero-build static site:** ES modules, inline SVG, CSS animation, a little canvas, Web Audio. No framework, no bundler. | Works for any host behind a public link, nothing to break at build time, and files split cleanly between subagents. | High later. |
| P8 | **Tap and hold on a fixed stage, no scrolling.** | Avoids the mobile address-bar and scroll-jacking problems the visual report lists, and suits "do" scenes. Departs from the report's scroll-first suggestion. | Medium. |
| P9 | **Lead with rice, saffron, fried onion and steam; show the chicken late.** | The visual report's reading of the appetite research. | Low. |
| P10 | The **bite lines and easter-egg texts** from the chat are the first draft of the script. | They are Claude's wording, built on D5. The user reviews the full script. | Low (data file). |
| P11 | **Cut line for the deadline:** the core is seal → wait → lid-lift → bites → glow. Cooking scenes (marinate, fry, base, layer), easter eggs and the spice collection are added on top, in that order. | D7 gives no exact date, so the part that carries the craving ships first. | — |
| P12 | **Latin text only** in the interface. | Urdu or Telugu script needs native proofreading we don't have. | Low. |

## Open

| # | Question | Who or what answers it |
|---|---|---|
| O1 | The exact deadline, who runs the challenge, how it is judged, and whether it has rules on AI-made work. | The user, from the announcement. Not findable by web search. |
| O2 | **A face or not.** Both reports lean on a reacting face to win over sceptics; D2 says no person is needed. Default: nobody on screen, neither face nor hands. | The user. |
| O3 | **The closing line.** The visual report ends on "whoever taught the dish", which conflicts with D2. Default: "You knew you'd be happy. You were right." | The user, at script review. |
| O4 | Where it is hosted, and approval to publish. | The user. Needed before any deploy. |
| O5 | Whether it makes anyone hungry, and whether it moves someone who dislikes biryani. | Only showing it to real people. No research answers this. |
| O6 | Whether the steam, the saffron bleed and the sizzle look and sound right on a mid-range phone. | Only a prototype on a real phone. The user's device. |
| O7 | Whether the Hyderabadi details (spices shown, accompaniments, vessel, terms) ring true. | The user, as the cook; ideally one more Hyderabadi reader. |
| O8 | A shareable "your biryani" ending card. | Out of scope unless the core finishes early. |

## Conflicts recorded, not smoothed over

- **Recipe.** The visual report describes kachchi biryani (raw marinated meat under the rice). The user's method fries the marinated chicken first. D3 wins; the gap research is framed as "what fits this method".
- **Person.** The first report concludes "one named dish, one named person". The visual report's beat map has a grandparent figure, a reacting face and a closing line about whoever taught the dish. D2 wins; O2 and O3 carry what is left to decide.
- **Hero plate.** The visual report recommends a near-photographic hero plate. D9 rules it out; P3 is the replacement.
- **Schedule.** Both reports assume a solo month with a freeze on day 14. D7 makes it a week; P11 is the answer.
