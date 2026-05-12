# The Bushwick Nightcrawlers

## Project context

Single-page sound piece. Hand-drawn map of the Myrtle-Broadway JMZ intersection in Bushwick. Ten pins; click a pin and a rat reviews the venue in Yelp pastiche, with USV (rat ultrasonic-vocalization) audio synced to the review text.

Sound art piece, NOT a website with audio. The interactive interface is the score. Audio playback is generative by default — different sample selection per click. A footer toggle ('in the moment' vs 'on record') lets visitors switch to a seeded, deterministic playback when they want to return to a specific performance. Conceptually: rats don't archive their language, so 'in the moment' is the baseline; 'on record' is opt-in.

## Authoritative spec

For full project context, read `docs/STRATEGY.md`. Most decisions and rationale live there. Read these sections first:

- §1 Concept (the two-layer claim, Tomey's epigraph "the vermin aren't the customers")
- §3 Sonification system (USV banks, voice fingerprints, drug effects, mix structure)
- §4 Audio centrality remedies (Remedies 1, 4, 5, 6, 7 are in scope; 2 and 3 are deferred)
- §9 Visual language (palette, typography, texture)
- §10 Tech stack and implementation patterns (code patterns, file structure)
- §12 Build plan (per-task scoping)

For the asset checklist and citations: `docs/ASSETS.md`.

## Stack

- Vanilla HTML/CSS/JS, ES modules, no framework
- Tone.js v15 via unpkg CDN (no npm install for v1)
- Vercel for hosting (static deployment)
- No bundler, no transpilation, no build step

## Project structure

```
/
├── index.html              # Entry, page structure
├── styles.css              # Design tokens, modal, oscilloscope, layout
├── about.html              # Epigraph, attribution
├── src/
│   ├── main.js             # Bootstrap
│   ├── audio/              # engine.js, rat-generator.js, rat-profiles.js,
│   │                       # venue-beds.js, effects.js, keyword-scanner.js
│   ├── components/         # map.js, modal.js, oscilloscope.js,
│   │                       # subtitles.js, headphones-tag.js
│   └── content/            # rats.js, reviews.js, venues.js
├── assets/
│   ├── map.mp4             # Animated map background (silent, looping)
│   ├── pins/               # 10 GIF pin assets, one per venue
│   ├── grain.png
│   ├── selfies/, photos/
│   └── sounds/jmz-rumble.wav, sounds/usvs/, sounds/usvs-cocaine/,
│       sounds/beds/, sounds/effects/
└── docs/                   # STRATEGY.md, ASSETS.md
```

## Map and pin layering pattern

The map is a silent looping MP4 background. Pins are separate GIF assets layered on top via absolute positioning.

```html
<div class="map-wrapper">
  <video autoplay loop muted playsinline aria-hidden="true" class="map-bg">
    <source src="assets/map.mp4" type="video/mp4">
  </video>
  <div class="pin-layer">
    <img src="assets/pins/market-hotel.gif" class="pin" data-pin-id="market-hotel" aria-label="Market Hotel">
    <!-- ...10 pins total, positioned absolutely with percentage-based top/left -->
  </div>
</div>
```

The `muted` attribute is required for autoplay; `playsinline` prevents iOS Safari from launching the video to fullscreen. MP4 has no transparency, so pin overlays must use formats that do (GIF here, or WebM with alpha in Phase 2). Don't try to overlay video on video.

## Mobile sheet sizing (V23)

The map page locks body to `100dvh` with `overflow: hidden`, so iOS Safari keeps the URL bar in its expanded floating-pill state for the session (no scroll signal to collapse it). `100dvh` resolves to the smaller viewport (~695 on iPhone 14 Pro); the URL-bar pill occupies the ~40px strip from `innerHeight` to `100lvh`.

Full-extending mobile sheets (review, alley) extend visually into that strip via `100lvh` height and `:has()` scoping on the modal: `.modal:not(:has(.modal-card-tombstone)) { height: 100lvh }` and `.modal-card { height: 100lvh; max-height: 100lvh }`. To prevent end-of-scroll content from rendering under the pill, `.modal-card:not(.modal-card-tombstone) { padding-bottom: calc(100lvh - 100dvh) }` adds an inert scrollable zone at the card bottom — the pill covers only padding, never content. On viewports without a floating URL bar (chromium, desktop, PWA standalone) `lvh === dvh`, the calc resolves to 0, and the rules behave identically to a plain `100dvh` sheet.

The Rash tombstone variant (`.modal-card.modal-card-tombstone`) is content-sized (`height: auto; max-height: 100dvh`) and stays bottom-anchored at `innerHeight`. The `:not(.modal-card-tombstone)` scoping above keeps it out of the lvh extension so its short last line doesn't get pushed into the URL-bar zone.

V24 update: V22/V23's lvh extension didn't visibly help on iOS — Safari clips `position: fixed` element paint to `innerHeight` (= dvh) regardless of declared height (MUI #46953, Apple radar 158055568, Safari 26.1 release notes; persists through 26.4.2). V24 added a `mask-image` gradient that fades the card's visible bottom 32px into body bg, dissolving the hard line at the paint-clip boundary. V24 is camouflage — paint still stops at dvh. The architectural fix ("Option A": switch `.modal` from `position: fixed` to `position: absolute`, pin `.map-wrapper` instead, add `position: sticky` on the card, unwind the body lock) is deferred pending evaluation of whether the ~40px paint gain justifies undoing V20's body lock.

## Audio rules (load-bearing)

- `Tone.start()` must be called inside a user-gesture handler before any audio plays. The headphones tag at the top of the page is the gesture target. Until clicked, no AudioContext.
- Default playback is generative ('in the moment' mode). Seeded determinism is opt-in via the footer toggle ('on record' mode). RatGenerator reads playback mode via `getMode()` at `start()` time and routes all randomness through `this.rng` — `Math.random` for moment, `mulberry32(fnv1a(reviewerId + text))` for record.
- Drug-effect events fire on keyword matches in the review text, not probabilistically. See `src/audio/keyword-scanner.js`. Examples: "ketamine" fires kHole; "diet" fires fizz; "tagged" or "for the gram" fires notification ping; "Chase Sapphire" or "my mom" kicks up coffee-shop ambience; "viral" or "sniff" fires a small cough sample.
- Pin audio persists after modal close (cumulative master mix). Do NOT dispose Tone nodes when modals close; lower their gain instead.
- Subtitle reveal uses `Tone.Draw.schedule`, NOT `setTimeout` or `requestAnimationFrame`, so text and audio stay sample-accurate.
- The JMZ rumble fires on a randomized 60-90s interval (recursive setTimeout, not Tone.Loop) and triggers sidechain compression on the master bus.

## Code style

- ES module imports, named exports only
- No default exports
- Class-based for stateful audio objects (RatGenerator, JMZScheduler, MasterMix); pure functions for tokenizers and scanners
- Vanilla CSS with custom properties for theme tokens
- 2-space indentation, single quotes for strings

## Don't

- Don't introduce React, Vue, Svelte, or any framework
- Don't add a bundler config (Webpack, Vite, esbuild) for v1
- Don't use console.log in committed code; remove debug logs before committing
- Don't generate audio events stochastically; effects are keyword-triggered
- Don't try to "polish" or normalize the voice in reviews. The lowercase Pinky Mae, the run-on DJ Nibblers, the rat-POV throughout — all intentional. Voice is load-bearing.
- Don't draft new review text, rat bios, or About-page copy without an explicit ask. Creative writing belongs to the user. Implementation code is your lane; voice and content are the user's.
- Don't dispose Tone audio nodes on modal close — breaks the cumulative mix.

## Verification

- Test in Chrome desktop, Safari desktop, and Chrome iOS at minimum
- Audio must work after first user click (the headphones tag)
- Reviews must render the same way every play (pick one rat, play twice, compare)
- Keyword effects must fire deterministically on their trigger words

## Common pitfalls

- Forgetting to `await Tone.start()` before scheduling — silent failure, no error
- Using `setTimeout` for subtitle sync — drifts from audio over long reviews
- Disposing Tone nodes on modal close — breaks cumulative mix
- Calling `Tone.getTransport().start()` multiple times without checking state — schedules duplicate events
- Case sensitivity in keyword matching — normalize tokens to lowercase and strip punctuation in the scanner

## Debug flags

Query-param-gated diagnostics. Production users see nothing unless the param is set.

- `?debug=viewport` — attaches a live readout inside any open modal-card showing innerHeight/Width, visualViewport (height/offsetTop/scale), modal + modal-card bounding rects, computed heights, and safe-area inset values. Updates on window/visualViewport resize and scroll. Tap the readout to dismiss for the session. Used to capture iPhone Safari-specific layout state that chromium emulation can't reproduce. Implementation: `src/debug/viewport-readout.js`; wired into `src/main.js` at module top. Zero overhead when the param is absent.

## When in doubt

Read `docs/STRATEGY.md` first. If the answer isn't in §10 (Tech stack and implementation patterns), ask the user before guessing. Do not infer creative or content-related decisions from code patterns.
