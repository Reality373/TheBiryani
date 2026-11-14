# Visual effect techniques: documented options and a pick per effect

Written 14 Nov 2026. Replaces the "untested background knowledge" recipes in `02-visual-direction.md`.

## How to read this

- **(opened)** means I fetched the page and read it. **(unverified)** means I only saw a search snippet, got a 403/404, or am using memory.
- Almost nothing here is measured on a mid-range phone. Where a source gives numbers I quote them and say on what hardware. Everything else about phone cost is inference from the general rule in web.dev (below) and is labelled as such.
- Several big sites (tympanus.net/Codrops, codepen.io, al-ro.github.io, some DEV pages) returned 403/404 to my fetcher, so their pages are (unverified) even when a search snippet described them.
- "Sketch" code is mine, not copied.

**Root rule, sourced.** web.dev: "Where possible, restrict animations to `opacity` and `transform` to keep animations on the compositing stage"; avoid properties that trigger layout or paint; use `will-change` sparingly ([web.dev animations guide](https://web.dev/articles/animations-guide), opened). That page gives no mobile advice and no memory-cost numbers.

**One measured counter-example that matters here.** A DEV author animated `mask-position` on a large element. Chrome's paint counter passed 1,000 in a few seconds (7,941 in one screenshot); after switching to `transform: translate()` of an oversized layer it was 2. No device was named, and the "120fps to 40fps" in the title is not backed by a measured figure ([DEV, andrico1234](https://dev.to/andrico1234/the-two-lines-of-css-that-tanked-performance-120fps-to-40fps-3lnj), opened). I use this as the basis for "never animate mask-position, background-position or gradient variables on big areas; translate an oversized layer instead."

## Decided constraints (15 Nov 2026)

Deadline is within a week and the art is illustrated only, with no photographic hero plate. The lid-lift is therefore carried by SVG art plus steam, light and motion. Effects 1, 2, 6 and 7 matter most, and each has one pick below that fits in a day or less. No new pages were opened in this revision, so the sourcing is the same as before.

**Day-sized builds for the four that matter**
- **1b plume (about 1 day):** canvas 2D, 40 to 60 particles stamped from one offscreen sprite, `lighter` composite, canvas at 0.5 to 0.75 scale. Put a baked warm light-shaft SVG layer behind it so the plume reads as backlit. Steps: sprite, particle loop, shaft layer, tune counts. If it looks like sprites, add more overlap and slower scale growth before touching WebGL.
- **2 saffron (about 1 day):** 6 to 10 baked streak shapes in the SVG, each grown from a seed with `scale` and `opacity` as the milk is poured. Because the art is illustrated and flat, soft-edged streaks are on-style and need no mask. Drop the canvas-mask fallback unless the prototype shows stickers.
- **6 paper layering (about 1 day):** baked offset shadow shapes in each layer's SVG group, 4 to 6 layer groups moved by `translate3d` from one rAF loop, one static grain PNG tile at low opacity, no live filters.
- **7 jali (about half a day):** one pre-blurred, warm, alpha lattice PNG on an oversized layer drifting by `translate`, looped by exactly one tile period, no blend mode.

## Recommendation table

| # | Effect | Recommended technique | Source strength | Build effort |
|---|---|---|---|---|
| 1a | Ambient steam (seal leaks, kettle) | 4 to 8 pre-blurred WebP/PNG puff sprites, CSS `translate`/`scale`/`opacity` keyframes, staggered | Rule sourced (web.dev); the "don't animate blur" warning is a commenter's | Hours |
| 1b | Backlit hero plume | Canvas 2D, 30 to 80 particles stamped with `drawImage` from one offscreen soft sprite, additive/`lighter` or `screen` look, canvas at reduced resolution, plus a baked light-shaft SVG behind it | Sprite and offscreen advice sourced (MDN, Chrome, Pond); particle counts for mobile unmeasured | About 1 day |
| 2 | Saffron bleed | Baked saffron streak sprites with organic edges, each grown from a seed point by `scale` + `opacity`; flat illustrated style makes a mask unnecessary | Mostly my design; supported only by the compositor rule and by what is ruled out below | About 1 day |
| 3 | Glisten / specular sweep | A baked soft highlight strip translated across a static-clipped food layer; never animate `mask-position` | Measured paint-count failure of the alternative (DEV) | Hours |
| 4 | Sizzle, simmer | Canvas 2D: ring and bubble sprites pre-rendered once, scaled in `drawImage`; a few dozen live at once | Offscreen/`fill` lessons sourced (MDN, Mozilla Pond); no boiling-surface tutorial found | 1 day |
| 5a | Rain on window | Default: baked streak and drop sprites sliding with `translateY` over a pre-blurred backdrop. Upgrade to test: raindrop-fx (WebGL2) as the one allowed WebGL layer | raindrop-fx README gives ms figures incl. one Android phone (opened, self-reported) | Sprites: 1 day. raindrop-fx: 1 day to integrate, unknown to tune |
| 5b | Flame flicker | Warm glow = one radial-gradient layer, irregular `opacity` (and tiny `scale`) keyframes; flame body is a baked SVG shape with `scaleY`/`rotate` | Anti-example sourced (Montoro says border-radius/width flame is "not a performant type of animation") | Hours |
| 6a | Paper shadows | Bake shadows into the art (offset duplicate shape in the layer's own SVG, or a pre-rendered blurred PNG). Use `filter: drop-shadow` only on a static inner element while a wrapper does the moving | Sources conflict and none measured on phones | Hours per layer set |
| 6b | Parallax between layers | A few layers moved with `translate3d` from one rAF loop (pointer, device tilt or time), no per-layer scale | Chrome article covers the scroll-container variant only | Hours |
| 6c | Paper grain | One tiled noise image (rasterise the feTurbulence SVG once to PNG), static, `opacity` ~0.05 to 0.15 with `multiply`/`soft-light`; never animate it | Recipe sourced (CSS-Tricks); cost of full-screen blend unmeasured | Hours |
| 7 | Jali light | One baked, pre-blurred lattice PNG/SVG with warm tint and alpha (no blend mode), on an oversized layer drifting with `translate` | Drift-by-translate pattern from the DEV measurement; the rest is my design | Hours |
| 8 | Slow camera | `transform: translate() scale()` on one stage wrapper, driven by WAAPI/CSS animation; no `will-change: transform` on content that must sharpen when scaled up; all readable text in an unscaled HTML layer above | Sourced (Chrome re-raster post, MDN) | Hours, plus phone testing |
| 9 | Press-and-hold ring and stir | Pointer Events + an SVG circle with `stroke-dasharray/offset`, driven by one WAAPI animation; a quick tap (under ~250 ms) triggers the same step as a completed hold; stir = accumulated angle around a centre, with each tap adding one step | Ring markup sourced (Motion, opened); pointer/a11y logic is mine | 1 day |

The one-liner for the whole project: bake the look into sprites and textures, move them with `transform`/`opacity`, and keep canvas for the two or three places that need many independent moving things (hero plume, bubbles, optionally rain).

---

## 1. Steam and smoke, including the backlit plume

### 1.1 CSS sprite puffs
- **Link:** the one open CSS demo I read animates `transform` (rotate, translateY 200px), `opacity` and **`filter: blur(1px to 20px)`** per element. A commenter warns "only transform and opacity" should be in keyframes because "Blur in particular takes too much in performance", and the author did not change the code ([DEV, stackfindover](https://dev.to/stackfindover/smoke-animation-effect-on-text-by-using-html-css-4jfk), opened). Other CodePen coffee-steam pens turned up in search but returned 403 (unverified).
- **How:** a few absolutely positioned elements (or `<img>`) with a soft blurred puff already baked into the image; keyframes translate upward, scale up slightly and fade, with staggered delays and different durations so the loop does not read as a pattern.
- **Mobile cost:** compositor-only if you keep to transform/opacity (web.dev, opened). Each promoted layer costs GPU memory; no source gave numbers. Alpha-blended overdraw of large soft sprites is the likely real cost (my inference).
- **Difficulty:** very low.

### 1.2 Canvas 2D particles from a pre-rendered sprite
- **Link:** MDN's canvas guide says pre-render repeated drawing on an offscreen canvas and `drawImage` it, use layered canvases, avoid `shadowBlur`, and scale a smaller canvas up with CSS rather than a big one down ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), opened). Chrome's team says GPU-accelerated `drawImage` makes 2D sprites "really fast"; their demo drew 180 transformed 256x256 sprites at roughly 30 to 60 fps on a low-powered laptop, with "rough edges" noted, undated, desktop ([Chrome blog](https://developer.chrome.com/blog/taking-advantage-of-gpu-acceleration-in-the-2d-canvas), opened).
- **How:** one soft radial-gradient puff drawn once to an offscreen canvas; each frame, clear and stamp N particles with per-particle position, scale, alpha and slow rotation; set `globalCompositeOperation = 'lighter'` or `'screen'` for the backlit glow; drift with a cheap sine/curl-like wobble, no per-pixel noise.
- **Mobile cost:** 30 to 80 particles is 30 to 80 `drawImage` calls per frame; that count is my judgement. Construct's manual (a game engine, not canvas) advises "a couple of hundred" particles at most on phones (snippet only, unverified). WebKit has an open bug about many small `drawImage` calls being slow ([WebKit 181244](https://bugs.webkit.org/show_bug.cgi?id=181244), snippet only, unverified). The Pond (Mozilla, 2013) found `fill` and `stroke` dominated its profile and shrank the canvas under load, then stretched it ([Mozilla Hacks](https://hacks.mozilla.org/2013/11/the-pond-building-a-multi-platform-html5-game/), opened); the sprite-stamp approach avoids per-frame path drawing.
- **Difficulty:** low to medium.

```js
// build the puff once, stamp it many times
const puff = new OffscreenCanvas(128,128), g = puff.getContext('2d');
const grd = g.createRadialGradient(64,64,0,64,64,64);
grd.addColorStop(0,'rgba(255,240,220,.5)'); grd.addColorStop(1,'rgba(255,240,220,0)');
g.fillStyle = grd; g.fillRect(0,0,128,128);
ctx.globalCompositeOperation = 'lighter';
for (const p of parts) {            // p: x,y,s,a,vy
  p.y -= p.vy*dt; p.x += Math.sin(t+p.seed)*.2; p.s += .004*dt; p.a -= .0006*dt;
  ctx.globalAlpha = Math.max(p.a,0);
  const d = 128*p.s; ctx.drawImage(puff, p.x-d/2, p.y-d/2, d, d);
}
```

### 1.3 SVG feTurbulence + feDisplacementMap
- **Link:** a GSAP forum user ran feTurbulence + feDisplacementMap on an image; fine on desktop, sluggish on iOS, once refreshed/removed the element and once crashed the tab; replies: "SVG filters are pretty horrific for performance", use WebGL or pre-rendered frames; pre-rendered crossfades still lagged on mobile ([GSAP forum](https://gsap.com/forums/topic/33075-gsap-and-feturbulence-mobile-performance/), opened). A Firefox bug thread says "The more octaves the worse the performance" and a reporter's page with 15+ animated instances locked up ([Mozilla bug 1787793](https://bugzilla.mozilla.org/show_bug.cgi?id=1787793), opened; closed WORKSFORME).
- **How:** noise generates a displacement map that wobbles a blurred shape; animate `baseFrequency` or the filter's seed to make it boil.
- **Cost:** per-frame software/GPU filter evaluation over the filtered area. Both opened sources report trouble on mobile or with many instances. Not measured on Android.
- **Difficulty:** low to write, high to make safe. Rejected.

### 1.4 WebGL fragment-shader noise (fbm, domain warping)
- **Link:** Three.js Journey's smoke lesson (free part only) says computing Perlin noise in a shader "is costly and can cause frame-rate drops, especially on weaker GPUs" and recommends sampling a tiling noise texture instead; the rising/twisting part is paywalled ([Three.js Journey](https://www.threejs-journey.com/lessons/coffee-smoke-shader), opened). Codrops' procedural-cloud sprites article and Wayline's fbm/domain-warp lessons showed up in search but I could not open them (403 or not tried) (unverified): [Codrops](https://tympanus.net/codrops/2020/01/28/how-to-create-procedural-clouds-using-three-js-sprites/), [Wayline](https://www.wayline.io/learn/shaders/14).
- **How:** a fullscreen or plane quad; fragment shader scrolls a noise texture upward, warps its coordinates with a second sample, shapes alpha by a vertical falloff and a column mask. Texture-based noise keeps it to two or three texture reads per pixel (my inference from the lesson's advice).
- **Cost:** fill-rate bound; scales with pixel count, so render at 0.5 to 0.75 resolution and upscale. No phone measurement found for steam specifically.
- **Difficulty:** medium to high (context loss handling, DPR cap, fallback). Best-looking option for a volumetric plume, so keep it as the escalation if 1.2 looks like sprites.

**Pick.** 1a for ambient wisps, 1b for the hero plume. Both are sprites, so the plume and ambient share art. Escalate to 1.4 only if a phone test shows the canvas plume looks "puffy", and then only as the project's single WebGL layer.

---

## 2. Saffron milk bleeding into rice

No source I opened shows a documented, phone-tested saffron or ink-bleed reveal. What follows are the nearest documented building blocks.

### 2.1 Animated gradient masks via `@property`
- **Link:** Chrome's guidance registers gradient size variables with `@property`, uses them in a `mask-image: radial-gradient(...)`, transitions only the sizes, and warns that without `@property` support the mask jumps between states instead of animating ([Chrome, interactive content reveal](https://developer.chrome.com/docs/modern-web-guidance/guides/ui-behaviors/interactive-content-reveal), opened). A dev.to wipe example does the same with `--radius` (snippet only, unverified).
- **How:** the saffron layer is masked by one or a few radial gradients whose radius grows.
- **Cost:** animating a registered custom property that feeds a gradient mask is main-thread and repaints the masked area each frame. I have no source that measures this exact case; the closest measurement is the `mask-position` paint-count result above (DEV, opened). Treat as paint-bound, and the circles will look like circles, not bleed.
- **Difficulty:** low.

### 2.2 SVG gooey filter (blur + alpha threshold)
- **Link:** the classic recipe: `feGaussianBlur` (stdDeviation 10), `feColorMatrix` alpha `18 -7`, then blend the source. The article says apply it to the container, give it bleed space, that it "can be resource intensive on large areas", and Safari support is uneven; readers' comments include "made a phone very slow" and Firefox/Android jank ([CSS-Tricks, Gooey effect](https://css-tricks.com/gooey-effect/), opened).
- **How:** grow overlapping blobs; the blur-then-threshold merges them into one liquid shape with organic edges.
- **Cost:** filter over the whole container every frame. The source warns about large areas; comments report phone slowness.
- **Difficulty:** low. Rejected for a large area.

### 2.3 Noise-threshold shader (WebGL quad)
- **Link:** the closest opened source describes a per-frame feedback shader for ink with a force map and noise-driven grain, but gives no benchmarks ([ink effects write-up](https://ileivoivm.github.io/inkField/tech/en/ink-effects.html), opened). Codrops fluid and reveal tutorials appeared in search; fetches returned 403 (unverified): [Codrops X-ray reveal](https://tympanus.net/codrops/2026/03/23/building-a-dual-scene-fluid-x-ray-reveal-effect-in-three-js/), [Codrops R3F reveal](https://tympanus.net/codrops/?p=83030).
- **How (my sketch of the usual idea):** sample a noise texture, add a distance-from-seed term, and show saffron where `noise + dist < uProgress` with a `smoothstep` edge; `uProgress` rises over time.
- **Cost:** one quad, cheap per pixel if noise is a texture lookup. It would be a second WebGL layer if steam also uses WebGL.
- **Difficulty:** medium.

```glsl
// fragment sketch: seeds[] in uv, uProgress 0..1.2
float d = 1e9; for (int i=0;i<4;i++) d = min(d, distance(uv, uSeed[i]));
float n = texture2D(uNoise, uv*2.0).r;
float reveal = smoothstep(0.0, 0.06, uProgress - (d + n*0.35));
gl_FragColor = mix(white, saffronTex, reveal);
```

### 2.4 Pre-baked streak sprites (compositor-only; my design)
- **How:** paint 6 to 10 saffron streak shapes with soft, irregular edges once (in the art tool or an offscreen canvas); each sits on the rice layer and grows from a seed by `scale` (anisotropic, longer along the streak) and `opacity` with `mix-blend-mode: multiply` or just alpha. Layers are static after baking.
- **Cost:** transform/opacity only (web.dev rule, opened); blend mode cost unmeasured.
- **Difficulty:** low; art-heavy.

**Pick.** 2.4. If it reads as stickers instead of a bleed, use a low-resolution canvas mask (about 256 px, scaled up by CSS per the MDN advice, opened) where soft blobs grow at seed points, composited over the saffron image with `destination-in`; that is a hybrid I have not seen documented, so prototype it. Avoid 2.1 and 2.2 on large areas. Take 2.3 only if you already have a WebGL layer.

---

## 3. Glisten or specular sweep

### 3.1 `mask-position` sweep
- **Link:** a typical "shine" tutorial animates `mask-position` of a 45-degree gradient mask with `mask-size: 800%` ([Amit Merchant](https://amitmerchant.com/shine-animation-on-hover-using-css), opened). Per the DEV measurement above, animating `mask-position` repaints every frame (opened).
- **Cost:** paint every frame. On a small icon it is fine; on a plate-sized area it is not.

### 3.2 Translated highlight strip with static clip
- **Link:** search results describe the same sweep done by translating a gradient pseudo-element with `transform` (snippet only, unverified). The oversized-layer-and-translate fix is the opened DEV measurement.
- **How:** a wide soft white strip (baked, ~20 degrees skew, pre-blurred) child of the food layer; the parent has a static `clip-path`/`mask` for the food outline; animate the child with `translateX` over 1.5 to 2.5 s with long pauses.
- **Cost:** transform-only animation; the static mask should be rasterised once, though I have not found a source confirming Chrome/Safari keep the masked parent cached while the child moves. Prototype.
- **Difficulty:** low.

### 3.3 Baked highlight sprites per food shape
- **How:** draw highlights as shaped, soft blobs placed on specific glossy spots (the meat, the oil sheen), and animate `opacity`/`translate` a few pixels; no mask at all.
- **Cost:** lowest; the sprites are shaped so no mask is needed. Needs per-food art.
- **Difficulty:** low; art-heavy.

**Pick.** 3.3 for hero shots (the highlight "slides" by fading between two slightly offset sprites), 3.2 as the generic fallback. Whether sliding light reads as wetness is background knowledge from the earlier report, not tested.

---

## 4. Sizzling bubbles and a simmering surface

No tutorial for this exact effect was found. The Pond is the closest documented sample.

### 4.1 Canvas 2D ring and bubble sprites
- **Link:** MDN's offscreen/`drawImage` guidance (opened, above); The Pond's profile findings: `stroke`/`fill` dominated, and removing fill both sped it up and improved the look ([Mozilla Hacks](https://hacks.mozilla.org/2013/11/the-pond-building-a-multi-platform-html5-game/), opened).
- **How:** pre-render 3 or 4 ring sprites and 2 glossy bubble sprites; spawn at random points on the pot-surface ellipse; each lives 0.4 to 1.2 s, scaling up and fading, then a tiny burst of 3 to 5 dots; a slow sine for surface shimmer is better as a baked gradient layer with `translate` than per-column canvas heights.
- **Cost:** a few dozen `drawImage` calls per frame; no measurement from a phone.
- **Difficulty:** low.

### 4.2 CSS ring elements
- **How:** 10 to 20 absolutely positioned elements with `border`, scale from 0.2 to 1 and fade, using animation-delay randomisation.
- **Cost:** compositor-only but many layers; DOM growth with every extra bubble; limited randomness.
- **Difficulty:** very low. Fine for a handful in a calm scene.

### 4.3 Canvas bubble layer on top of WebGL
- **Link:** a Codrops snippet describes a WebGL bubble image with a separate transparent 2D canvas for burst particles (snippet only, unverified, [Codrops](https://tympanus.net/codrops/?p=123381)). The pattern of splitting canvases by update rate matches MDN's layering advice (opened).

**Pick.** 4.1, with one shared low-resolution canvas for bubbles and plume particles if they never overlap in time; otherwise separate canvases, per MDN's layering tip.

---

## 5. Rain on a window at night; warm flame flicker

### 5.1 Rain: baked streak and drop sprites
- **How (my design):** blurred bokeh backdrop of the street as a static image; 10 to 20 drop sprites (one pre-drawn lens-like drop with a highlight and darker rim) sliding with `translateY` at varying speeds with pauses, plus faint static trails; refraction faked by a small inverted mini-copy inside the drop if you want to bother.
- **Cost:** compositor-only if you use DOM sprites; or draw to canvas.
- **Difficulty:** low to medium.

### 5.2 Codrops RainEffect (2D canvas drops + WebGL refraction)
- **Link:** repo README by Lucas Bebber with live demo at `tympanus.net/Development/RainEffect/`; the repo page does not explain the implementation or performance ([GitHub](https://github.com/codrops/RainEffect), opened). The Codrops article says drops are drawn on a separate canvas and used like a normal map for refraction of the blurred background, and warns it is experimental ([Codrops](https://tympanus.net/codrops/2015/11/04/rain-water-effect-experiments/), snippet only, unverified; 403 on fetch).
- **Cost:** full-screen WebGL fragment pass with texture lookups.
- **Difficulty:** medium.

### 5.3 raindrop-fx (WebGL2 library inspired by RainEffect)
- **Link:** the README states about 6 ms per frame with 2,000 drops on Windows/Chrome 88 and about 6.5 ms per frame on an Android Mi 10 / Chrome 87, 600 drops at 1920x1080 in about 2 to 3 ms per frame by default; options include `spawnLimit`, spawn interval and size, droplets per second, background blur steps, and diffuse/specular lighting. These are the author's own measurements ([GitHub, SardineFish/raindrop-fx](https://github.com/SardineFish/raindrop-fx), opened). A Mi 10 is a 2020 flagship, not mid-range, and the data is from 2020 Chrome.
- **How:** drop simulation (spawn, slide, trail, evaporate) feeding a shader that refracts a pre-blurred background.
- **Cost:** README figures above; scales with resolution.
- **Difficulty:** low to integrate (npm package, would need vendoring a built file for zero-build), unknown to style.

### 5.4 Flame flicker and warm light
- **Link:** Alvaro Montoro's CSS flame animates `border-radius` and `width` and says "this is not a performant type of animation" ([Montoro](https://alvaromontoro.com/blog/68003/drawing-a-flame-with-css), opened). Other CodePen/tutorial flames use a glow as a blurred radial gradient with an opacity flicker (snippet only, unverified).
- **How:** flame body is an SVG or PNG shape; flicker by irregular `scaleY` (0.92 to 1.06), tiny `rotate` and `opacity` keyframes across 3 offset layers; warm room light is a single large radial-gradient layer (not a `blur` filter) with an irregular `opacity` keyframe sequence (about 0.85 to 1.0) and, optionally, `mix-blend-mode: soft-light` or `screen`. Keep flicker slow and irregular; WCAG flash limits are covered by another report.
- **Cost:** transform/opacity only; blend mode on a full-screen layer is unmeasured.
- **Difficulty:** very low.

**Pick.** 5.1 as default; try 5.3 as the one WebGL layer only if the sprite rain looks flat in the prototype. Flame: 5.4.

---

## 6. The paper-cut look

### 6a. Shadows: `drop-shadow` or baked
- **Link (conflicting, none measured on phones):** Josh Comeau says layered `box-shadow`s cost roughly one render pass per layer ("five layers" is about five times the work), may hurt "older, inexpensive mobile devices" though not in his testing, animating them is "probably a bad idea", and `filter: drop-shadow` "can often perform better than box-shadow because the GPU can hardware-accelerate it", with a Safari input-lag exception; `drop-shadow` follows the alpha shape ([Comeau](https://www.joshwcomeau.com/css/designing-shadows), opened). A Shopware ADR reportedly replaced `drop-shadow` with `box-shadow` for Safari performance, and an Ionic thread reports Android jank with shadows (both snippet only, 404 on the ADR, unverified). No vendor benchmark found.
- **How the baked option works:** each paper piece gets a second copy of its silhouette, filled dark with partial opacity, offset by a fixed vector (one global light direction, per Comeau), placed under it in the same transform group so it travels with the piece. For soft shadows, pre-render a blurred PNG of the silhouette.
- **Cost:** baked shapes are plain shapes or images moved by transform; no filter evaluation at runtime. The disadvantage is art size and the fact that shadows do not change with the layer's height unless you swap or scale them.
- **Likely safe use of `drop-shadow`:** apply it to a static inner element and animate only a wrapper's `transform`. Chrome should rasterise the inner content once into a layer (my inference from web.dev's compositor description, opened); no source tests it. Do not animate the filter or its radius.
- **Difficulty:** low per layer; tedious across 30+ pieces. Build a small script or SVG `<use>` pattern to generate the shadow copy.

### 6b. Parallax between layers
- **Link:** Chrome's "Performant Parallaxing" uses CSS 3D (`perspective` on a scroller, children pushed back with `translateZ`, scale compensation `(perspective − distance) / perspective`) so scrolling does the work; it lists Mobile Safari caveats (flattening, `-webkit-overflow-scrolling: touch`, `position: sticky` workaround, Firefox sticky bugs, odd scrollbars) ([Chrome](https://developer.chrome.com/blog/performant-parallaxing), opened). Old article; current browser behaviour not re-checked.
- **For this project:** the stage is tap/hold-driven rather than scrolled, so the scroll-perspective method mostly does not apply. Use 4 to 6 layer groups, each moved by `translate3d(x*depth, y*depth, 0)` from a single rAF loop reading pointer position, `deviceorientation`, or a slow time-based sway. No per-layer scale, which avoids blurry re-raster issues (see 8).
- **Cost:** a handful of layers with transform-only updates; unmeasured on phones.
- **Difficulty:** low.

### 6c. Paper grain / print texture
- **Link:** CSS-Tricks builds grain from an SVG filter (`feTurbulence`, `type='fractalNoise'`, `baseFrequency='0.65'`, `numOctaves='3'`, `stitchTiles='stitch'`) saved as an SVG used as a CSS background layered under a gradient, boosted with `filter: contrast(170%) brightness(1000%)` and tamed with `mix-blend-mode: multiply` and `isolation: isolate`; Chrome and Safari blend slightly differently; no benchmark; one reader says it "had to suck performance-wise" ([CSS-Tricks](https://css-tricks.com/grainy-gradients/), opened). The same recipe also appeared on Frontend Masters/master.dev (not opened, unverified).
- **Cheap variant (my recommendation):** run the SVG filter once, export a 256 to 512 px tile as PNG/WebP (about 20 to 60 KB, my estimate), tile it with `background-repeat`, show it at low `opacity` over the stage with `mix-blend-mode: multiply` or `soft-light`. Do not use a live `feTurbulence` as a full-screen overlay: the GSAP and Mozilla threads above are about live filters.
- **Cost:** a full-screen static composited layer; blending against a moving stage may force re-blend every frame. Prototype both with and without the blend mode (a plain semi-transparent grain PNG with no blend mode is the safest).
- **Difficulty:** hours.

---

## 7. Lattice (jali) light patterns

No source documents this specifically. What exists:
- **Blend overlays.** A search result described window light simulated in Photoshop as a white-shape layer set to Overlay and blurred (snippet only, unverified). One of the opened pieces says blend modes alone cannot do true darkness: a blend-mode "flashlight" "doesn't look exactly like a light source", and the working version used a canvas that covers the page in black and punches a hole ([voussoir.net](https://voussoir.net/writing/browser_in_the_dark), opened; no performance data).
- **CSS masks.** Repeating `mask-image` is documented, but animating `mask-position` is the measured repaint problem (DEV, opened).

### 7.1 Baked alpha lattice on an oversized layer
- **How:** one pre-blurred PNG/SVG of the lattice, warm light colour with alpha already in the pixels; no blend mode; the layer is one tile larger than the viewport and drifts with `translate` over 40 to 90 s, snapping back by exactly one tile period so the loop is invisible. This is the same fix as the DEV article's (oversize by the mask size and translate).
- **Cost:** one composited layer with transform animation. Overdraw of a full-screen translucent layer is the unknown.
- **Difficulty:** low.

### 7.2 Blend-mode overlay (`screen`/`soft-light`/`overlay`) of the same layer
- **How:** same as 7.1 but with a blend mode so the light picks up the colour underneath.
- **Cost:** unmeasured; the earlier Chrome vs WebKit blend difference (CSS-Tricks, opened) means two looks to tune.

### 7.3 Canvas "dark with holes"
- **How:** as in the voussoir description: fill a canvas dark, punch the lattice in with `destination-out`, draw at low resolution. Gives true shadow, so unlit areas are darker.
- **Cost:** per-frame redraw if drifting; cheap if you pre-render the lattice mask and move the canvas with CSS.

**Pick.** 7.1. Add a separate dark-pattern layer (a second PNG at normal blend) if you want the lattice to also darken.

---

## 8. Slow camera moves and crisp text

### 8.1 Stage `transform` with CSS/WAAPI animation
- **Link:** MDN recommends scaling with CSS transforms (GPU) and shows a stage wrapper with `transform: scale(...)`; also: prefer a smaller canvas scaled up over a big one scaled down ([MDN](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas), opened).
- **Crispness:** Chrome says that since Chrome 53, content is re-rastered when its scale changes via script unless it has `will-change: transform`; with that property it is rastered into a fixed bitmap, so scaling up looks blurry. Fix: remove `will-change: transform` (re-raster happens next animation frame), or toggle it across two `requestAnimationFrame`s; and this applies to script-driven scale changes, not to CSS animations or Web Animations ([Chrome re-raster post](https://developer.chrome.com/blog/re-rastering-composite), opened; older, Chrome-only). A Mozilla bug report describes blurry text under `will-change: transform` in WebRender (snippet only, unverified).
- **For this project:** keep text, buttons and the press ring in an unscaled HTML overlay above the stage, so they never rasterise at a scale other than 1. For the art, either rasterise it large enough for the maximum zoom (SVG layers re-rasterise by browser rules; baked PNGs need the max-zoom size) or accept slight softness during the move and let it resolve at rest. Re-rastering a large SVG every frame during a zoom is a cost that needs a phone test.
- **Difficulty:** low to write; the cost is in testing across Chrome, Safari and Firefox.

```js
// one camera, WAAPI, compositor-friendly
const cam = stage.animate(
  [{ transform: 'translate3d(0,0,0) scale(1)' },
   { transform: 'translate3d(-6%,-4%,0) scale(1.35)' }],
  { duration: 6000, easing: 'cubic-bezier(.3,0,.2,1)', fill: 'forwards' });
// don't set will-change:transform on the layers inside; text lives outside #stage
```

### 8.2 Switch layers instead of scaling
- **How:** for the lid-lift push-in, swap in a second, pre-composed close-up layer set and crossfade; no scaling of large vector scenes. A cut, not a zoom.
- **Cost:** two layer sets in memory. Not documented anywhere I opened; my suggestion for a weak-device tier.

**Pick.** 8.1, with text outside the stage; keep 8.2 as the Lite-tier fallback.

---

## 9. Press-and-hold ring and fold/stir that also works as a tap

### 9.1 SVG ring driven by one animation
- **Link:** Motion's hold-to-confirm tutorial: the ring is an SVG `<circle>` (`r="120"`, `stroke-dasharray`), rotated -90 degrees to start at the top, with `pointer-events: none` so presses reach the button; one progress value also drives button scale and a glow; the hold/cancel logic and accessibility are behind a paywall, so I could not read them ([Motion](https://motion.dev/tutorials/js-hold-to-confirm), opened). The Svelte "HoldToConfirm" template described CSS-only visual progress with JS only timing the confirm (snippet only, unverified: [template](https://tfe-svelte-templates.vercel.app/holdtoconfirm)).
- **How:** `pointerdown` starts a WAAPI animation of `stroke-dashoffset` (about 1.2 s); `pointerup`/`pointercancel`/`pointerleave` reverses it; when `finished` fires, the action runs. `touch-action: none` and `setPointerCapture` keep the page from scrolling or stealing the press (standard Pointer Events behaviour; not tested in a source I opened).
- **Cost:** `stroke-dashoffset` is a paint property (my inference from the web.dev rule), but a ~100 px ring is small; if it ever shows up in a profile, use a conic mask on a transformed element or scale a bar instead.
- **Difficulty:** low.

### 9.2 Plain tap alternative (accessibility and calm mode)
- **How:** treat a press shorter than about 250 ms as a tap that triggers the same step as a completed hold, or in calm mode, toggles the action on and off. Add a keyboard path: Space/Enter on the focused button. Dragging alternatives (WCAG 2.5.7) and target size are handled in another report.
- **Difficulty:** low.

### 9.3 Fold or stir
- **How:** on `pointermove` after `pointerdown`, compute the angle of the pointer around a centre with `Math.atan2`, accumulate the signed difference between frames, and drive the spoon rotation and a progress meter from the total; a tap anywhere on the pot adds one fixed step so the interaction never requires a circular drag.

```js
let last, total = 0;
pot.addEventListener('pointerdown', e => { last = ang(e); pot.setPointerCapture(e.pointerId); });
pot.addEventListener('pointermove', e => {
  if (last == null) return;
  const a = ang(e); let d = a - last;
  if (d > Math.PI) d -= 2*Math.PI; if (d < -Math.PI) d += 2*Math.PI;   // unwrap
  total += Math.abs(d); last = a; progress(total / (4*Math.PI));
});
pot.addEventListener('pointerup', e => { if (e.timeStamp - t0 < 250) progress(step()); last = null; });
```

**Pick.** 9.1 with the 9.2 fallback, and 9.3 with tap steps.

---

## Reference experiences

| Reference | URL | What to borrow | Verified? |
|---|---|---|---|
| NYT "Snow Fall" | write-up: <https://source.opennews.org/articles/how-we-made-snow-fall/> | Per-animation tempo tied to scroll, toning down flashy transitions that fatigued readers, and a tiered build where capable devices get richer behaviour and a separate touch version exists | Write-up opened (the piece itself not re-opened) |
| Codrops RainEffect (Lucas Bebber) | <https://github.com/codrops/RainEffect>, demo <https://tympanus.net/Development/RainEffect/> | A working window-rain reference; study the drop canvas and refraction pass and how the background is blurred | Repo page opened (README only); demo not opened |
| raindrop-fx | <https://github.com/SardineFish/raindrop-fx> | Drop lifecycle (spawn, slide, trail, evaporate) and option names; the one source with a phone frame time | Opened |
| Miranda paper portfolio (Awwwards SOTM Nov 2021) | <https://www.awwwards.com/niccolo-miranda-paperfolio-wins-sotm-november-2021.html> | Illustration-led paper mood with subtle parallax; its torn-paper menu used WebGL plus GSAP, so that part is expensive | Awwwards write-up opened; the live site not opened |
| The Pond (Mozilla, 2013) | <https://hacks.mozilla.org/2013/11/the-pond-building-a-multi-platform-html5-game/> | A calm, non-scoring canvas toy and its profiling lessons: offscreen canvases, dropping `fill`, shrinking the canvas under load | Opened (old, but about canvas basics) |
| Ink effects write-up (inkField) | <https://ileivoivm.github.io/inkField/tech/en/ink-effects.html> | How ink-like spreading is simulated with a force map, `min()` feedback and edge deposition, for a saffron shader | Opened (no performance data) |
| UNEP "Journey of Food", Rainforest superfoods site | <https://contra.com/p/o76P6PQm-unep-journey-of-food>, <https://immersive-g.com/projects/rain-forest-food> | Food-themed scroll stories built with GSAP/Lottie; study pacing, not effects | Search snippets only, unverified |

I found **no credible write-up or openable page for a cozy layered-2D browser game with mobile performance detail**; the closest was a Sleepy Leaf itch.io devlog that returned 404 (unverified). That is a gap: the nearest "cozy" evidence here is The Pond. Telekom's "Der magische Adventskalender" (layered illustrations rebuilt as 3D for parallax) is listed on the Cannes Lions site per a search snippet and I did not open it (unverified).

---

## Needs a prototype to settle (real mid-range Android, plus an iPhone)

1. Hero plume: frame time and look of 40, 80 and 150 canvas particles at DPR 1, 1.5 and 2, with and without `lighter`. Decide whether canvas is enough or WebGL is needed.
2. Full-screen blend modes (grain, jali, flame glow): cost of `multiply`/`soft-light`/`screen` layers over a moving stage, and Chrome vs Safari differences. Test each with the blend mode replaced by plain alpha.
3. Number of promoted layers and total GPU memory for the layered stage (6 to 12 groups plus shadows). Where Chrome starts dropping frames or discarding layers.
4. `drop-shadow` on a static inner element under a transforming wrapper versus baked shadows: paint cost and memory.
5. Camera zoom: does an SVG-heavy stage re-rasterise during a scale animation and stutter? Does text outside the stage fix crispness on iOS Safari? Is `will-change` needed at all?
6. Saffron: do baked streak sprites read as a bleed? If not, frame time of the low-res canvas mask and of a single noise-threshold WebGL quad.
7. Static-masked parent with a translating child (glisten) and animated `@property` masks: do they repaint per frame on Android Chrome? Check with the paint-flashing/paint-count tools the DEV author used.
8. Rain: sprite rain versus raindrop-fx at half resolution on the target phone; the README's Mi 10 figure is not mid-range.
9. Thermal behaviour: 3 to 5 minutes of continuous animation (the wait scene) and battery drain; whether frame rate decays after 60 seconds.
10. Pausing off-screen and on hidden tabs; context-loss recovery if any WebGL is used; whether the 250 ms tap/hold threshold feels right on a touch screen with a thumb.
