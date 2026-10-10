# tutoring by abdullah

One-page site for Abdullah's math and science peer tutoring at AIS-R, live at
tutoringbyabdullah.xyz. Hand-written HTML, CSS and vanilla JS modules, GSAP for motion.
No build step, no package.json, nothing to install: the files in the repo are the files that ship.

## Preview

`python3 -m http.server 4371` from the repo root (the `tutoring-static` entry in
`.claude/launch.json`). It needs a server because the scripts are ES modules. That server does
not route missing paths to `404.html`, so open `/404.html` directly.

## Code map

- `index.html` the whole site: seven `<section>`s in page order, plus the JSON-LD.
- `404.html` loads no script: CSS keyframes only, and root-absolute paths so it works at any depth.
- `css/styles.css` the only stylesheet: `:root` tokens, then one block per section in page order.
- `js/base.js` menu, anchors, click-to-play YouTube. Imports nothing, so it runs if motion fails.
- `js/motion.js` the only file that reads the GSAP and Lenis globals. Registers plugins, holds the
  timing tokens `D` and `E`, creates Lenis, exports `park()`. Every other module imports from it.
- `js/main.js` motion entry. One `gsap.matchMedia()` picks the mode and calls `reveals.js` (intro,
  one-shots, scrubbed drift, nav state, price rows), `record.js` (the one pinned section),
  `pointer.js` (cursor ring, magnetic buttons, hover), `ambient.js` (idle loops) and `field.js`
  (the background canvas, no GSAP).
- `js/vendor/` GSAP 3.15.0 with ScrollTrigger, SplitText, CustomEase and DrawSVGPlugin, and Lenis
  1.3.26. Classic `defer` scripts that set globals; they must stay above the two module scripts.

## Conventions

- Three designs, chosen in `main.js`: a fine pointer gets everything (Lenis, the pin, the cursor
  ring), touch keeps native scroll, one-shots and loops, reduced motion gets the finished page.
- The markup and CSS are the finished state, so the page is right with no script. Tweens run
  `from` it, counters read `data-count`, drawn rules take `--draw` from 0 to 1 (CSS default 1).
- One owner per transform property per element: where scroll owns `scale` the pointer uses `x`
  and `y`, where the intro owns `yPercent` hover uses `y`, pressed states use CSS `translate`.
  The comment beside each tween names the owner. Read it before animating the same element.
- `record(mode)` runs first so every later trigger is measured with the pin spacer in place.
- Mode functions take `{ wide, fine, live, signal }`. Listeners and DOM changes are undone through
  `signal`; `gsap.matchMedia()` only reverts the tweens. Repeating tweens go through `park()`.
- Colours come only from the `:root` tokens (paper, ink, one green, one tan); `js/field.js` and
  the `theme-color` metas repeat them as literals. Lines are `--hair` or `--pen`. Radii: 0 or 50%.
- Site copy is all lowercase. Capitals appear only in aria-labels and the JSON-LD.

Run the `anti-ai-site` and `gsap-max` skills before shipping visual changes.

## Deploy

Vercel Git integration with no `vercel.json`: merging to `main` deploys production, any other
pushed branch gets a preview. No GitHub Pages, CNAME or workflows.

## Gotchas

- The 960px breakpoint is written in three files: `css/styles.css`, `js/main.js`, `js/base.js`.
- A price lives in three places in `index.html`: its JSON-LD offer, its `.price-list` row (text
  and `data-count`), and "starting at" in `.thesis-aside`.
- The record's `/ 09` and each card's `data-step` are hardcoded. So is `<lastmod>` in `sitemap.xml`.
- The four `.band-track` spans must stay identical: the loop moves the track by half its width.
- The cover draws its mark once per tab (`sessionStorage` key `cover`), then only lifts.
- A `transform` or `backdrop-filter` left on `.nav` shrinks the fixed phone menu to the bar's
  height. That is why the intro clears its props and `.nav.is-open` drops the blur.
