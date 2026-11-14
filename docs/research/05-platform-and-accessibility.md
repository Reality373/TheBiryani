# Platform support, performance, libraries, accessibility and hosting

Written 15 Nov 2026. Scope was cut after a usage limit: the entry is a public web link, art is illustrated only (inline SVG, CSS, a little canvas), so image formats (AVIF, WebP) and itch.io were de-prioritised. Every claim has a source URL. "(unverified)" means I did not open the page and rely on a search snippet or memory.

How the support data was gathered: I downloaded and queried two machine-readable primary datasets rather than the JS-heavy web tables.
- MDN browser-compat-data 8.1.9, build timestamp 2026-11-12: https://unpkg.com/@mdn/browser-compat-data/data.json (call it BCD).
- caniuse data.json, `updated` field 2026-11-11: https://raw.githubusercontent.com/Fyrd/caniuse/main/data.json (call it CIU).

## Corrections to the earlier report (02-visual-direction.md)

1. Scroll-driven animations: the earlier report is right (Chrome/Edge 115, Safari 26, Firefox 159, Baseline Newly available). Now confirmed on the web.dev page: https://web.dev/blog/web-platform-10-2026 and BCD. Firefox 159 shipped on 27 Oct 2026 (search snippet of https://developer.mozilla.org/en-US/Firefox/Releases/159, unverified). MDN banner: "Baseline 2026, Newly available, since October 2026": https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline
2. dvh jump on iOS: the earlier report said "an unfixed WebKit bug". The bug is WebKit 266835, "dvh causes scroll jank as the address bar resizes when scrolling". I opened it: status NEW, no resolution, last comment 2023-12-29: https://bugs.webkit.org/show_bug.cgi?id=266835. Related bugs seen only in search results (unverified): 261185 (svh vs dvh), 255708 (SFSafariViewController), 279998 (third-party iOS browsers, resolved invalid): https://bugs.webkit.org/show_bug.cgi?id=261185
3. Haptics: "iOS does not support the Vibration API" is correct (BCD `safari_ios: false`, CIU has no iOS entry). The earlier "needs a click since iOS 18.4" for the unofficial workaround could not be confirmed. A search snippet says the hidden `<input type="checkbox" switch>` trick works on iOS 17.4 to 26.4 and was reportedly patched in 26.5, and that a WebKit bug asks to require user activation (unverified, https://unpkg.com/ios-haptics@3.1.1/README.md; the fetch failed). Treat iOS haptics as unavailable.
4. WCAG: the earlier report said "WCAG requires that auto-moving content longer than five seconds be pausable". Incomplete. 2.2.2 applies only to content that starts automatically, lasts more than five seconds, and is presented in parallel with other content, and it has an "essential" exception. Source: https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html and https://www.w3.org/TR/WCAG22/. The earlier "unverified" criteria 2.5.7 and 2.5.8 are now checked (see section 4). Contrast: 4.5:1 text, 3:1 large text and UI components, from the same spec.
5. "GSAP and its ScrollTrigger are free": confirmed, and so are all plugins (SplitText, MorphSVG included), under a custom "Standard no charge" licence, not MIT: https://gsap.com/community/standard-license/ and https://gsap.com/pricing/ . npm lists the licence as that custom licence: https://registry.npmjs.org/gsap
6. "Web Audio must be resumed inside a touch handler": roughly right. MDN says starting a source node outside a user input event is subject to autoplay rules, and Firefox blocks audio contexts until sticky activation: https://developer.mozilla.org/en-US/docs/Web/Media/Guides/Autoplay . The `resume()` snippet itself is general practice, not from MDN.
7. Not contradicted: the claim that animating `filter: blur()` is expensive. web.dev says blur takes longer to paint (see section 2).

## 1. Browser support (features we are likely to use)

Versions from BCD (and CIU where marked). "Chrome Android" version is the engine version; CIU lists Chrome Android 157 as current.

| Feature | Chrome Android | Safari iOS | Firefox (desktop / Android) | Notes and source |
|---|---|---|---|---|
| Scroll-driven animations (`animation-timeline`, `scroll()`, `view()`) | 115 | 26 | 159 / 159 | Baseline Newly available. Declare `animation-timeline` after the `animation` shorthand (the shorthand resets it). Feature-detect with `@supports (animation-timeline: scroll())`. https://developer.mozilla.org/en-US/docs/Web/CSS/animation-timeline , https://web.dev/blog/web-platform-10-2026 |
| View Transitions, same-document (`document.startViewTransition`) | 111 | 18 | 144 / 144 | CIU global usage 93.17%. BCD, CIU. |
| `svh`, `lvh`, `dvh` | 108 | 15.4 | 101 | CIU usage 96.07%. See iOS note below. BCD, CIU. |
| `mask-image` (unprefixed) | 120 (prefixed gradients since 18) | 15.4 (prefixed since 3.2) | 53 | BCD. Use `-webkit-mask-*` as well for older iOS. |
| Animating a mask | n/a | n/a | n/a | MDN lists `mask-image` animation type as discrete, so gradient masks do not interpolate: https://developer.mozilla.org/en-US/docs/Web/CSS/mask-image . The animation types of `mask-position` and `mask-size` were not on the page I read (unverified). Practical route: animate a registered `@property` custom property used inside the gradient, or animate `mask-position` / `transform` of a masked child. Both need real-phone testing. |
| `mix-blend-mode` | 41 | 8 | 32 | BCD. |
| `backdrop-filter` | 76 | 18 (prefixed `-webkit-` from 9) | 103 | BCD. Needs `-webkit-backdrop-filter` below iOS 18. |
| OffscreenCanvas | 69 | 16.4 (2D only until 17.0, then full) | 105 | CIU notes: partial on iOS 16.2-16.7 means 2D only, no WebGL. |
| Screen Wake Lock | 84 | 18.4 (16.4-18.4 broken in Home Screen web apps, WebKit bug 254545) | 126 / 126 | BCD. HTTPS only; default Permissions Policy allowlist is `self`, so third-party iframes need `allow="screen-wake-lock"` plus a header; the lock is released when the page is hidden, re-request on `visibilitychange`: https://developer.mozilla.org/en-US/docs/Web/API/Screen_Wake_Lock_API |
| Web Share (text/URL) | 61 | 12.2 | none on desktop (flag only), 79 on Android | BCD, CIU. |
| Web Share with files (`navigator.canShare({files})`) | 76 | 14 | not on Firefox Android | BCD `data_files_parameter`. Always call `canShare` first. |
| Vibration API | 32 | not supported | desktop removed in 129; Android 79 onward is disabled (returns true, no vibration) | BCD notes cite Firefox bugs 1591113 and 1653318. Chrome needs a user gesture (Chrome 60+) and does not work in cross-origin iframes (Chrome 55+). MDN: sticky user activation required and may be silent in DND mode: https://developer.mozilla.org/en-US/docs/Web/API/Navigator/vibrate . Net effect: haptics are a Chrome-Android-only extra. |
| `prefers-reduced-motion` | 74 | 10.3 | 63 | CIU usage 97.35%. |
| CSS `@property` | 85 | 16.4 | 128 | BCD (`css.at-rules.property`). |
| `<dialog>` (modal via `showModal()`) | 37 | 15.4 | 98 | BCD, CIU. Safest choice for a settings sheet. |
| Popover attribute (`popover`) | 114 | 17 (`popover` JS API 18.3) | 125 | BCD. Fine as an alternative; `<dialog>` has the longer history. |
| Web Animations API (`element.animate`) | 36 | 13.4 | 48 | BCD. |
| AVIF / WebP | 157 / 157 | 16.0 / 14.0 | 93 / 65 | CIU. Irrelevant for an SVG-only build. |

iOS address bar and dvh. `dvh` follows the visible viewport and resizes as the toolbar collapses. WebKit bug 266835 (status NEW, filed Dec 2023) reports that dvh-sized elements only grow after scrolling finishes, and that scroll-snap with 100dvh can snap to the next section: https://bugs.webkit.org/show_bug.cgi?id=266835 . A WebKit commenter said only the dvh-sized element changes when the toolbar hides, svh stays put (search snippet of https://bugs.webkit.org/show_bug.cgi?id=261185, unverified). Design consequence: size the fixed stage with `100svh` (or `position: fixed; inset: 0`), never animate layout from dvh, and avoid scroll-snap tied to dvh.

## 2. Performance guidance (brief)

- Compositor-only: web.dev says "there are only two properties" that can be animated purely on the compositor, `transform` and `opacity`, and warns "every layer you create requires memory and management" and not to promote elements unnecessarily: https://web.dev/articles/stick-to-compositor-only-properties-and-manage-layer-count . It suggests about 4 to 5 ms of compositing time as a target.
- Cost of paint: "anything that involves a blur (like a shadow, for example) takes longer to paint than drawing a red box"; its demo animating `top/left` dropped about 50% of frames versus about 1% with `transform`: https://web.dev/articles/animations-guide . That page does not mention `filter`, so costs of animated CSS `filter` and drop-shadow on mid-range Android are not source-backed here (unverified). Bake blur into the art and animate only transform and opacity.
- `will-change`: MDN gives no numeric limit. It is "a last resort", excess use "will result in excessive memory use", applying it to a large subtree is bad, and a stylesheet declaration keeps the optimisation alive, so set it from script just before an animation and reset to `auto` after: https://developer.mozilla.org/en-US/docs/Web/CSS/will-change
- SVG filters (feTurbulence, feDisplacementMap): no authoritative source found. Anecdotes only: a GSAP forum thread about feTurbulence being sluggish on iOS (search snippet, unverified, https://gsap.com/forums/topic/33075-gsap-and-feturbulence-mobile-performance/ ) and a Mozilla bug comment that more octaves is slower (search snippet, unverified, https://bugzilla.mozilla.org/show_bug.cgi?id=1845890 ). Safe rule: use feTurbulence only as a one-time baked texture on a small region, do not animate its attributes.
- Canvas: MDN's tips are pre-render repeated shapes on an offscreen canvas, integer coordinates, no scaling inside `drawImage`, layer several canvases by update rate, use CSS for static backgrounds, `getContext("2d", {alpha:false})` when opaque, avoid `shadowBlur`, use `requestAnimationFrame`, and scale for DPR by multiplying width/height by `devicePixelRatio`: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas . A DPR cap of 2 and a particle cap of 100 to 200 are not in any source I opened; they are judgement.
- Testing on a real phone. Android: USB debugging, `chrome://inspect#devices`, Inspect the tab: https://developer.chrome.com/docs/devtools/remote-debugging . Performance panel: CPU throttling under Capture settings, "Calibrate" makes presets matched to your device, DevTools "can't truly simulate the CPUs", and "Enable advanced paint instrumentation" gives a Layers tab; Rendering tab has Paint Flashing: https://developer.chrome.com/docs/devtools/performance/reference . I could not confirm the names of the built-in throttling presets from the page (unverified). iPhone: Settings > Safari > Advanced > Web Inspector, Develop menu on a Mac (steps are from a model summary because the Apple page text was not returned; unverified): https://developer.apple.com/documentation/safari-developer-tools/inspecting-ios

## 3. Libraries (late 2026)

Versions, dates and licences from npm registry pages I fetched. Sizes are my own measurement: I downloaded the file from jsDelivr and ran `gzip -9`, so brotli would be a bit smaller.

| Library | Latest, date | Licence | Min / gzip (measured) | Needed here? |
|---|---|---|---|---|
| GSAP | 3.15.1, 2026-11-04 (https://registry.npmjs.org/gsap) | Custom "Standard no charge" licence, all plugins included, commercial use allowed. Prohibited: tools competing with Webflow's visual animation builder, reverse engineering, removing notices. Webflow may update terms. https://gsap.com/community/standard-license/ | core 73.4 KB / 28.4 KB; ScrollTrigger 44.7 KB / 18.0 KB (https://cdn.jsdelivr.net/npm/gsap@3.15.1/dist/gsap.min.js) | No. Useful only for complex sequencing; this site's timeline is hand-authored. |
| Motion (motion.dev) | 14.14.0, 2026-11-13 (https://registry.npmjs.org/motion) | MIT (npm) | docs claim mini `animate` 3.2 KB, hybrid 22 KB (https://motion.dev/docs/animate). The only CDN file I measured, `dist/motion.js` UMD, is 191.6 KB / 64.5 KB and is not tree-shaken. | No. Only mini would be worth it, and WAAPI covers the same ground. How to load mini from a CDN as ESM was not documented on the page (unverified). |
| anime.js | 4.5.0, 2026-06-22 (https://registry.npmjs.org/animejs) | MIT (npm) | `anime.esm.min.js` 118.7 KB / 40.8 KB (https://cdn.jsdelivr.net/npm/animejs@4.5.0/dist/bundles/anime.esm.min.js) | No. |
| Lenis | 1.3.27, 2026-10-15 (https://registry.npmjs.org/lenis) | MIT (https://github.com/darkroomengineering/lenis) | `lenis.min.js` 18.8 KB / 5.4 KB | No. Smooth-scroll is wrong for a tap-and-hold experience; it also disables itself under reduced motion by default and lacks scroll-snap support. |
| PixiJS | 8.23.0, 2026-11-11 (https://registry.npmjs.org/pixi.js) | MIT (npm) | `pixi.min.mjs` 913 KB / 255 KB | No. Far too heavy for a few canvas particles. |
| OGL | 1.0.11, 2025-01-27 (https://registry.npmjs.org/ogl) | Unlicense | README claims 29 KB minzipped total, 8 KB core (https://github.com/oframe/ogl). I saw no prebuilt dist on jsDelivr, only `src/index.js`, so a CDN import would pull many unbundled modules (unverified). | No, unless a shader is added later. |

Recommendation: none. Use CSS keyframes and transitions, the Web Animations API (`element.animate`, supported everywhere in section 1) for scripted tweens, optional CSS scroll-driven animations behind `@supports`, plain canvas 2D for particles, and `AudioContext` directly. That is defensible: the whole site loads zero library bytes. If a single tool is wanted later, GSAP core (28 KB gzip) is the smallest justified add, and its licence is fine for a public free entry.

## 4. WCAG 2.2 (from w3.org)

Source for all rows: https://www.w3.org/TR/WCAG22/ (levels and normative wording), plus https://www.w3.org/WAI/WCAG22/Understanding/pause-stop-hide.html for 2.2.2 definitions. Paraphrases are mine.

| SC | Name | Level | Requirement (paraphrase) | What it means for this experience |
|---|---|---|---|---|
| 1.4.2 | Audio Control | A | If audio plays automatically for more than 3 seconds, give a way to pause or stop it, or to control its volume independently of system volume. | Ambient sound starts only after a tap, so it is not "automatic". Still put a visible mute/sound toggle on every screen. |
| 1.4.3 | Contrast (Minimum) | AA | Text and images of text need at least 4.5:1 contrast, 3:1 for large text. Exceptions: incidental text, logotypes. | Text on warm illustrated scenes needs a scrim or solid panel; check text over steam. |
| 1.4.11 | Non-text Contrast | AA | UI components and graphics needed to understand content need at least 3:1 against adjacent colours. Exceptions: inactive, user-agent-drawn, essential presentation. | Hold rings, stir targets, toggles and focus rings need 3:1 against the scene background. |
| 2.1.1 | Keyboard | A | All functionality works from a keyboard, with no specific keystroke timing; path-dependent input is exempt. | Press-and-hold needs Space/Enter hold or toggle; stirring needs arrow keys or Enter alternative. |
| 2.2.2 | Pause, Stop, Hide | A | Moving, blinking or scrolling content that starts automatically, lasts more than 5 seconds and is shown alongside other content needs a way to pause, stop or hide it (unless essential). Auto-updating content has a similar rule. | Continuously moving steam, rain and flame count. Provide a Pause motion / calm mode control; steam must stop when paused. |
| 2.3.1 | Three Flashes or Below Threshold | A | Nothing flashes more than three times in any one second, unless below the general and red flash thresholds. | Fire flicker, sizzle pops, lid-lift flash and shimmer must stay under three flashes per second. |
| 2.3.3 | Animation from Interactions | AAA | Motion animation triggered by interaction can be disabled, unless essential. | AAA, not required, but cheap to meet: calm mode swaps zooms and parallax for crossfades. |
| 2.5.1 | Pointer Gestures | A | Multipoint or path-based gestures must also be operable with a single pointer without a path-based gesture, unless essential. | Circular stirring is path-based; offer tap or button stir. Press-and-hold is not path-based. |
| 2.5.7 | Dragging Movements | AA | Anything done by dragging must also work with a single pointer without dragging, unless essential or user-agent-determined. | Any drag-to-stir or drag-to-sprinkle needs a tap alternative. |
| 2.5.8 | Target Size (Minimum) | AA | Pointer targets at least 24 by 24 CSS px, unless spacing (24 px circles do not overlap), an equivalent control exists, inline in text, user-agent sized, or essential. | Tappable easter eggs and spice icons must be at least 24 px, ideally 44 px or more. |
| 1.3.4 | Orientation | AA | Content must not be locked to one orientation unless essential. | Do not force portrait; a rotate message that blocks use fails. Design a landscape layout that still works. |
| 1.4.10 | Reflow | AA | Content works without two-dimensional scrolling at 320 CSS px width (vertical content) and 256 CSS px height, except content needing 2D layout. | Test at 320 px wide and zoomed 400%; the fixed stage must scale, not overflow. |

Press-and-hold specifically: 2.5.1 and 2.5.7 are the practical triggers; the tap-to-toggle alternative in calm mode already covers them if also reachable from the keyboard (2.1.1). Press-and-hold is also a timing-based interaction, so offer a longer or untimed option (not a numbered criterion I verified; no claim made).

## 5. Free static hosting (plain static folder)

| Host | Limits that matter | Custom headers | Source |
|---|---|---|---|
| GitHub Pages | Published site at most 1 GB; soft 100 GB/month bandwidth; deploy times out at 10 min; repo recommended under 1 GB; no per-file limit stated | Not stated on the page; widely believed to be unsupported (unverified) | https://docs.github.com/en/pages/getting-started-with-github-pages/github-pages-limits |
| Cloudflare Pages (free) | 20,000 files per site; 25 MiB per asset; 500 builds/month (not relevant for direct upload or no-build) | `_headers` file: 100 rules, 2,000 characters per header | https://developers.cloudflare.com/pages/platform/limits/ |
| Netlify (free) | Credit-based: 300 credits per month, hard limit, no recharge; bandwidth 20 credits/GB (about 15 GB), 15 credits per production deploy (about 20 deploys). Behaviour at the limit (paused site) not confirmed on the page | `_headers` or `netlify.toml`, supported for files served from Netlify | https://docs.netlify.com/manage/accounts-and-billing/billing/billing-for-credit-based-plans/credit-based-pricing-plans/ , https://docs.netlify.com/manage/routing/headers/ |

For a public link, an SVG-and-JS folder of a few MB sits far under every limit. Cloudflare Pages has the most generous bandwidth terms (unlimited bandwidth is a common claim but I did not verify it on the page). Neither headers nor a build step are needed: choose GitHub Pages for simplicity, Cloudflare Pages if you want `_headers` for caching and a `Permissions-Policy`. Vercel Hobby (not requested) lists 100 GB Fast Data Transfer and 100 MB CLI upload: https://vercel.com/docs/plans/hobby , https://vercel.com/docs/limits ; its non-commercial-use terms were not checked (unverified). itch.io (dropped from scope): 1,000 files, 500 MB extracted, always click-to-launch fullscreen on mobile, runs in an iframe, docs say nothing about vibration or wake lock: https://itch.io/docs/creators/html5 . Cross-origin iframes lose Vibration in Chrome (BCD note) and Wake Lock needs an `allow` attribute that itch's list is not known to include (list from a 2021 forum post in search results, unverified).

## Could not verify

- Whether animating CSS `filter`, `drop-shadow` or SVG filter attributes is expensive on mid-range Android: no primary source found.
- Animation type of `mask-position` and `mask-size`, and whether a masked gradient can be animated smoothly on iOS Safari. Test on device.
- DevTools built-in CPU throttling preset names; Safari remote debugging steps (page returned only an outline).
- iOS haptics workaround versions and the iOS 26.5 patch (README fetch failed).
- GitHub Pages custom headers; Cloudflare Pages bandwidth cap; Netlify behaviour when credits run out; Vercel Hobby commercial-use terms.
- Whether itch.io's iframe currently allows vibrate or wake-lock.
- DPR and particle caps are judgement, not sourced.
- OGL CDN usability without a bundle; Motion mini as a CDN ES module.
- Exact "Baseline" banners for View Transitions, `@property`, popover and Wake Lock: support versions are from BCD and CIU only.
