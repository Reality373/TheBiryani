# Assets and licences (fonts, textures, references, rights)

Not legal advice. Researched 14-15 Nov 2026. Scope was cut by the coordinator: art is hand-authored SVG only (no photographs, no AI images), the entry is a public web link, and the deadline is within a week, so AI-asset and photography questions are dropped. Licence statements below come from the licensor's own file or page where marked; anything else is tagged "(unverified)".

## 1. Fonts

### Recommendation

- Latin display: **Fraunces** (OFL). Pin the axes and subset it: with SOFT=100, WONK=0, opsz=72, wght 400-900 and Latin only, my WOFF2 came to about 33 KB (measured with fontTools, see method below).
- Text: **Literata** (OFL). Pinned to opsz=12, wght 400-700, Latin only: about 49 KB. Roman only; add its italic file only if the copy needs italics.
- Optional title word: **Gulzar** for Urdu and **Ramabhadra** or **Tiro Telugu** for Telugu, each cut to just the title word (about 10-14 KB each).
- Both recommended faces have no Reserved Font Name in their OFL.txt, so a subset or pinned instance can keep the original name without a rename question. Lora and DM Serif Display do carry an RFN line (see table).

Source of licence for every font below: the `OFL.txt` and `METADATA.pb` in the google/fonts repository, e.g. https://github.com/google/fonts/blob/main/ofl/fraunces/OFL.txt and https://raw.githubusercontent.com/google/fonts/main/ofl/fraunces/METADATA.pb (opened; each font's folder under https://github.com/google/fonts/tree/main/ofl/ has the same two files). OFL.txt headers were read for all fonts in the tables. Upstream repos named in those headers: Fraunces https://github.com/undercasetype/Fraunces, Literata https://github.com/googlefonts/literata, Gulzar https://github.com/simoncozens/Gulzar, Noto Nastaliq https://github.com/notofonts/nastaliq.

Self-hosting and subsetting under the OFL, from the licensor's FAQ https://openfontlicense.org/ofl-faq/ (opened):
- Self-hosting webfonts is "recommended and explicitly allowed" (FAQ 2.1).
- Removing parts of a font for a webfont "is considered modification" but is permitted; it "would not normally allow the use of RFNs" (FAQ 2.6). So: if the OFL.txt names a Reserved Font Name, rename the subset; if it does not, there is nothing to rename.
- A plain WOFF2 conversion counts as modification unless the font data is unchanged apart from compression (FAQ 2.2.1); tools that do not meet that must be treated as producing a Modified Version (FAQ 2.2.2).
- Ship the OFL.txt and copyright line next to the files and keep the fonts under OFL (my reading of the FAQ, not stated as a single quote).

### Latin display candidates

| Font | Licence (RFN) | Weights | Variable | WOFF2 full / Latin subset | Note |
|---|---|---|---|---|---|
| Fraunces | OFL, no RFN | 100-900 plus italic (wght axis range read from the TTF) | Yes: SOFT, WONK, opsz, wght | 195 KB / 114 KB; 33 KB pinned (SOFT=100, WONK=0, opsz=72, wght 400-900) | Soft, wonky "old-style" serif; warm and hand-cut without any Indian-restaurant cliche. Recommended. |
| Young Serif | OFL, no RFN | 400 only | No | 40 KB / 25 KB | Sturdy, slightly rough old-style; cheap and safe fallback. |
| Gloock | OFL, no RFN | 400 only | No | 39 KB / 24 KB | High-contrast display serif; sharper, less hand-printed. |
| DM Serif Display | OFL; header reads "Reserved Font Name 'Source'" (inherited, not DM) | 400 plus italic | No | 32 KB / 23 KB | Familiar, a little generic. |

### Text candidates

| Font | Licence (RFN) | Weights | Variable | WOFF2 full / Latin subset | Note |
|---|---|---|---|---|---|
| Literata | OFL, no RFN | 200-900 plus italic, opsz 7-72 | Yes | 397 KB / 151 KB; 49 KB pinned (opsz=12, wght 400-700) | Warm text serif made for reading. Recommended. |
| Lora | OFL, RFN "Lora" | 400-700 plus italic | Yes | 85 KB / 34 KB | Smallest; a subset must be renamed because of the RFN. |
| Newsreader | OFL, no RFN | 200-800 plus italic, opsz 6-72 | Yes | 215 KB / 129 KB | Editorial feel; more bookish. |
| Source Serif 4 | OFL, no RFN | 200-900 plus italic, opsz 8-60 | Yes | 427 KB / 185 KB | Neutral; heaviest. |

Sizes in both tables were measured by me: I downloaded the TTFs from google/fonts and ran fontTools subset and WOFF2 compress on 15 Nov 2026. "Latin subset" is U+0020-007E, U+00A0-00FF and basic punctuation, keeping all axes. Treat them as approximate. All fonts are available from the google/fonts repo path above (opened and downloaded).

### Optional single title word: Urdu (Nastaliq) and Telugu

| Font | Script | Licence | Weights | Variable | WOFF2 full / title-word subset | Known problems |
|---|---|---|---|---|---|---|
| Gulzar | Nastaliq | OFL, no RFN (header read) | 400 | No | 237 KB / 14 KB (six letters of "biryani") | I did not find a rendering-issue page for it; test on a phone (unverified). |
| Noto Nastaliq Urdu | Nastaliq | OFL, no RFN (header read) | 400-700 | Yes (wght) | 267 KB / 14 KB | Issue 7810 is closed (see below). |
| Ramabhadra | Telugu | OFL (METADATA.pb and OFL.txt); copyright holder is the Andhra Pradesh Society for Knowledge Networks | 400 | No | 147 KB / 10 KB | None checked. |
| Tiro Telugu | Telugu | OFL (google/fonts METADATA.pb and OFL.txt, https://raw.githubusercontent.com/google/fonts/main/ofl/tirotelugu/METADATA.pb) | 400 plus italic | No | 143 KB / 10 KB | None checked. |

- Subset sizes are for a word-sized glyph cut (Urdu U+0628 U+0631 U+06CC U+0627 U+0646; Telugu U+0C2C U+0C3F U+0C30 U+0C4D U+0C2F U+0C3E U+0C28 U+0C40). I did not render-test shaping after subsetting, and the word spellings are my guesses, so have a native reader check them. The glyph cut keeps layout features, but joined Nastaliq forms and Telugu conjuncts must be checked by eye.
- google/fonts issue 7810, "Request to alter line spacing and size in Noto Nastaliq Urdu": **closed 24 Jun 2024**, opened 3 Jun 2024. A collaborator replied that Nastaliq line height is "potentially unbounded" and that clipping comes from the rendering software, so the fix is to set line-height yourself; the issue was closed with nothing actionable (https://github.com/google/fonts/issues/7810, opened). Practical rule: one display-size word, a generous manual `line-height` and `overflow: visible`, no body text in Nastaliq.
- The Google Fonts specimen licence tab for Ramabhadra did not state a licence in the fetched text (https://fonts.google.com/specimen/Ramabhadra/license), so the repo files are the evidence.
- Adobe Fonts says "Tiro Telugu is available via an open source license" and mentions an Open Font License release, designed by Fiona Ross and John Hudson (https://fonts.adobe.com/fonts/tiro-telugu, opened). The Adobe page offers no download; use the google/fonts copy.
- Weights for Noto Serif Telugu (100-900, variable) are in the repo (https://raw.githubusercontent.com/google/fonts/main/ofl/notoseriftelugu/METADATA.pb) if a heavier Telugu title is wanted; not sized in detail (full WOFF2 136 KB).

## 2. Open-access visual references

Short list. Image licence terms are as stated by the institution, with what I could and could not open.

| Collection | Terms | Search link | Status |
|---|---|---|---|
| Cleveland Museum of Art Open Access | CC0 for images and data of public-domain works; no attribution needed; downloads only for CC0 works; more than half the collection (https://www.clevelandart.org/open-access, opened) | https://www.clevelandart.org/art/collection/search?search=bidri and use the Open Access filter (search URL pattern unverified) | Terms verified. |
| Wikimedia Commons, Category:Bidriware | 81 files, one subcategory; each file has its own licence on its description page, so check per file (https://commons.wikimedia.org/wiki/Category:Bidriware, opened). Example files: "Hookah, Bidriware.jpg", "Bowl (AM 565528-1).jpg", "Bidar - Bidri (4279024589).jpg" | https://commons.wikimedia.org/wiki/Category:Bidriware | Verified. Categories for Kalamkari and Deccan painting not opened (unverified). |
| The Met Open Access | The Met's dataset repo says its data is CC0 and that images are governed by a separate Open Access page; CC0 images carry a CC0 icon on the collection site (https://github.com/metmuseum/openaccess, opened). The Met's own policy page returned HTTP 429 and could not be read. | https://www.metmuseum.org/art/collection/search?q=bidri&showOnly=openAccess (pattern unverified) | Image terms not read from the Met policy page. |
| Smithsonian Open Access | Repo lists CC0-1.0; metadata only, repository archived 21 May 2026 (https://github.com/Smithsonian/OpenAccess, opened). si.edu/openaccess returned 403, so the image terms were not read. | https://www.si.edu/search/collection-images?edan_q=deccani%20painting (unverified) | Image terms unverified. |
| V&A | Collections data and images are "made available under the terms of use for the V&A website, in particular section 9.3" (https://developers.vam.ac.uk/guide/v2/welcome.html, opened). I could not open the terms themselves (two guessed URLs returned 404), so I cannot say whether non-commercial reuse is allowed. | https://collections.vam.ac.uk/search/?q=bidri (unverified) | Treat as reference only until section 9.3 is read. |

Specific object pages: I did not open any individual object page (budget, and two sites blocked automated fetching). Use the search links above and open objects by eye. Practical advice for a hand-redrawn SVG: collect shapes from the Cleveland and Commons items you can verify, and redraw rather than trace.

## 3. Rights, in brief

- Redrawing traditional motifs: I did not find an authoritative page for this within budget. The general principle that copyright protects specific works, not a style, is from memory (unverified). The safest practice is to redraw from several objects and not trace a single copyrighted photograph. Under CC0 sources (Cleveland) there is no restriction (https://www.clevelandart.org/open-access, opened).
- Geographical indications in India: the Geographical Indications of Goods (Registration and Protection) Act, 1999 lets registered users stop others using the indication on goods that do not come from the region or meet the standard (summary from search snippets, not the Act text, which returned HTTP 403: unverified). A search snippet reports Bidriware is registered from Karnataka and Kalamkari is registered as regional variants (Srikalahasti, Machilipatnam), with no generic "Kalamkari" registration found (https://www.ipindia.gov.in/ and listing sites, unverified). My inference: a GI governs how goods are labelled and sold, so a non-commercial illustration that is not marketed as a Bidri or Kalamkari product is not what it targets. Do not label the artwork or any downloadable product "Bidriware" or "Kalamkari" in a commercial sense; describing the style is fine.
- Hyderabadi biryani GI: the registry record, application no. 168, "Hyderabadi Biryani", Telangana, filed 28 Apr 2009, status **Abandoned**; examination 30 Oct 2009, order dated 27 Jan 2017 (https://search.ipindia.gov.in/GIRPublicSearch/Application/Details/168, opened). Press reports in March 2017 attribute it to the applicant failing to prove origin or default in prosecution (https://deccanchronicle.com/nation/in-other-news/090317/origin-not-proved-so-no-gi-tag-for-hyderabadi-biryani.html, search snippet, unverified). So no GI claim restricts the dish name today, as far as this record shows; I found nothing on a fresh application (not exhaustive).
- Plan impact: none that should change the plan. Do not use any fonts or images outside the licences above.

## 6. CC0 paper and print textures

- **ambientCG**: "All ambientCG assets are provided under the Creative Commons CC0 1.0 Universal License"; no attribution needed; no stated restrictions (https://docs.ambientcg.com/license/, opened). Search "paper", "cardboard" or "fabric" at https://ambientcg.com/ (not opened). Suggested credit line is optional and given on the licence page.
- **Poly Haven**: "Our assets are all licensed as CC0"; credit not required; textures covered (https://polyhaven.com/license, opened).
- Caveats from the licensor's own pages: Poly Haven's CC0 covers the assets only; the site's logos, user avatars, example renders, user-submitted renders and text are protected, and its Terms of Service prohibit scraping or data mining (https://polyhaven.com/license). Download the files by hand; do not scrape.
- Sites with looser-than-they-look licences (free-to-use licences such as Unsplash/Pexels style, Freepik/Pinterest textures, and community "free texture" sites) were not opened (unverified); the earlier report already flags that stock sites give no release guarantees. Prefer these two CC0 sources, or generate the grain procedurally (SVG `feTurbulence` or a small baked PNG).
- Block-print texture: I did not find a verified CC0 block-print set; draw a rough-edge offset print in SVG, or use a CC0 paper/fabric scan under a multiply layer. Treat as a gap.

## Could not verify

- The Met's own Open Access policy page (HTTP 429), Smithsonian image terms (si.edu/openaccess, HTTP 403), V&A website terms section 9.3 (404 on the guessed URLs).
- Any specific museum object page for Deccani painting, Bidri, Kalamkari or jali; search-URL patterns for Cleveland, Met and Smithsonian are from memory.
- Text of the GI Act (HTTP 403) and the Bidri and Kalamkari registration entries themselves; the GI statements for those crafts come from search snippets.
- Whether traditional motifs can be freely redrawn, from an authoritative page.
- Rendering of Gulzar, Noto Nastaliq, Ramabhadra and Tiro Telugu after my glyph subsetting, and the correct Urdu and Telugu spellings of the title word.
- Verified CC0 block-print textures, and the licences of "loose" texture sites.
- Dropped by instruction: AI-generated assets and photography questions.

Method for font sizes: fontTools 4.x subset, instancer and woff2 compress run locally on the google/fonts TTFs on 15 Nov 2026; numbers will differ slightly with other tools.
