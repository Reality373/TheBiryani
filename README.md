# Dum

A small, slow, interactive story about Hyderabadi dum biryani, about four minutes long. Made for the "Thankful for This Food" challenge. Best with sound.

## Run

    python3 -m http.server 8000 --bind 127.0.0.1

Open http://127.0.0.1:8000/ (not `file://`). No build step, no dependencies.

## Test

    node --test            # unit tests
    bash tools/smoke.sh    # plays the whole piece headless; last line should be "smoke: ok"

Developer switches for screenshots: `?from=<scene>`, `?show=plate&eaten=3`, `?view=close&pot=lifted` and similar (see `js/main.js`).

## Docs

`docs/` holds the decisions, design, plan and research. Start with `docs/README.md`.

## Credits

Fonts: Fraunces and Literata (SIL Open Font Licence), loaded from jsDelivr. All sound is synthesised in the browser; all art is hand-written SVG.

## Not yet built

The cooking scenes (marinate, fry, base, layer); the piece starts at sealing the pot. Sound, frame rate on a mid-range phone and iPhone behaviour have not been tested on real devices.
