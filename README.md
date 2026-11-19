# Dum

An interactive cooking guide to Hyderabadi chicken dum biryani. You do every step with your hands (tap, drag, stir, hold), each one is explained as you do it, and at the end you get the recipe to keep. Twelve chapters, about 15 to 20 minutes. Made for the "Thankful for This Food" challenge. Best with sound, but everything works without it.

Zero build: plain ES modules, hand-written SVG, CSS and Web Audio. No framework, no bundler, no runtime dependencies.

## Run

    npm run serve        # python3 tools/serve.py 8000, files are never cached

Open http://127.0.0.1:8000/ (not `file://`: chapters load with dynamic `import()`).

`tools/serve.py` sends `Cache-Control: no-store` and asks the browser to clear its cache when the page loads, because plain `python -m http.server` lets browsers keep stale JS and CSS.

## Test

    npm test               # node --test, unit tests
    bash tools/smoke.sh    # plays the whole piece headless with ?auto=1; last line should be "smoke: ok"
    bash tools/shot.sh out.png '?ch=onions&state=frying' 1280 720   # a screenshot of any chapter state

## The chapters

| | Chapter | What you do |
|---|---|---|
| I | The Spices | Measure the four marinade powders onto a tray, then count out the whole spices for the rice water |
| II | The Onions | Slice, oil the pan, tip the slices in, stir them golden, lift them onto the plate, keep two spoonfuls |
| III | The Marinade | Curd, paste, lemon, oil, the powders, herbs and chilli, fried onions; stir; gash the chicken; fold; cover |
| IV | The Rest | Chicken into the fridge, the desk clock, rinse the rice three times, soak |
| V | The Fry | Tip the marinated chicken into hot oil and sear it |
| VI | The Gravy | Hot water, lid on, covered cook until thick but pourable (about 95% cooked) |
| VII | The Rice | Boil with the whole spices, salt, oil, rice; test a grain; drain |
| VIII | The Layers | Rice over the chicken, saffron milk, mint, onions, ghee |
| IX | The Seal | Lid on, dough pressed round the rim |
| X | The Wait | Tawa, flame down, the dum: wipe the fogged window, try the lid, touch the steam; flame off |
| XI | The Opening | Crack the seal, lift the lid, serve from the side |
| XII | The Plate | Six bites, each its own gesture; a few hide a whole spice |

Then the end card with the printable recipe (it prints in the guide's night-blue theme).

## Playing it

- **The goal line** under the chapter title always says what to do now, before you do it. It shows the newest unfinished item (or a count when several are live).
- **Hover** anything touchable (mouse or pen) to see its name. Items you can drag show a grab cursor; stirring shows a turner or a spoon in place of the mouse.
- **A hint ring** shows the next thing after about a second of stillness: one hint at a time, with a glyph for the gesture.
- **Every drag also works as a tap**, Enter or Space. **"Skip this step"** (bottom right) makes everything currently waiting do its own action.
- **Subtitles** float near the action on a small card with the chapter's step count and progress bar. They keep pace if you rush: a new action drops lines it has outrun.
- **Settings** (top right): sound, voice, subtitles, sound captions, calm mode (no drags, no drift), chapter list, start over.

## URL switches (for screenshots and tests)

| Switch | Does |
|---|---|
| `?ch=<id>` | Start at that chapter (spices, onions, marinade, rest, fry, gravy, rice, layers, seal, wait, opening, plate, end); later chapters follow |
| `?state=<name>` | Jump inside a chapter; each chapter lists its states in the comment at the top of its file |
| `?auto=1` | Every hotspot performs itself and the voice resolves at once; the run ends with `data-done="1"` on `<html>` |
| `?calm=1` | Calm mode |

## Where things are

    index.html            the page shell (title/end card, UI layer, settings)
    css/                  tokens.css (colours, contrast-tested) and app.css
    js/main.js            boot and the chapter loop
    js/core/              stage (camera, parallax), hotspot (touch, goal, hints), voice, audio, ui, progress, runner
    js/chapters/<id>.js   one module per chapter: { id, art, play(ctx) }; gravy.js shares fry.js
    js/art/               the scenes, drawn as SVG strings in JS (food.js and lib.js are the shared brushes)
    js/sound/             the synthesised sound for each chapter
    js/data/              chapters.js, cookbook.js (the one source of the recipe), lines/ (what is said), labels.js
    tests/                node --test unit tests, one file per area
    tools/                serve.py, smoke.sh, shot.sh and preview pages
    docs/                 decisions, design, plan, research and the written specs

## Deploy

It is a static site: any static host works. On Vercel: import the GitHub repo, framework preset **Other**, leave the build command and output directory empty. Production deploys follow the default branch (`main`).

## Docs

Start with [docs/README.md](docs/README.md). The current design work is in [docs/superpowers/specs/2026-11-19-fry-onwards-redesign-design.md](docs/superpowers/specs/2026-11-19-fry-onwards-redesign-design.md).

## Credits

Recipe: adapted from Swasthi's restaurant-style chicken biryani (indianhealthyrecipes.com); the gravy stage was cross-checked with Sinfully Spicy's dum chicken biryani (sinfullyspicy.com) and My Food Story's chicken biryani (myfoodstory.com). The recipe text was drafted by Claude from those sources and has not been reviewed by the owner (decision D18).

Fonts: Fraunces and Literata (SIL Open Font Licence), loaded from jsDelivr. All sound is synthesised in the browser; all art is hand-written SVG.

## Known gaps

- **One kitchen.** Each chapter from Spices to Opening still has its own backdrop; the plan is a single shared kitchen (see the spec). The shared kitchen timer exists only in The Rest.
- **The Wait's fogged window** is the one scene that still drops below 60 fps on a slow machine (a masked group of drops over screen-blend glows).
- **Goal lines** use each item's label everywhere except The Spices, which has written ones.
- **Not tested on real devices:** sound, frame rate on a mid-range phone, iPhone audio behaviour. All checks so far are in headless Chrome.
