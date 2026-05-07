# The Bushwick Nightcrawlers

## Project context

Single-page sound piece. Hand-drawn map of the Myrtle-Broadway JMZ intersection in Bushwick. Ten pins; click a pin and a rat reviews the venue in Yelp pastiche, with procedurally rendered USV (rat ultrasonic-vocalization) audio synced to the review text.

Sound art piece, NOT a website with audio. The interactive interface is the score. Audio rendering is procedural: fixed review text + per-rat parameter profile = deterministic audio composition. Same input always produces the same output.

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
│   ├── ui/                 # map.js, modal.js, oscilloscope.js,
│   │                       # subtitles.js, headphones-tag.js
│   └── content/            # rats.js, reviews.js, venues.js
├── assets/
│   ├── map.mp4             # Animated map background (silent, looping)
│   ├── pins/               # 10 GIF pin assets, one per venue
│   ├── grain.png
│   ├── selfies/, photos/
│   └── audio/jmz-rumble.wav, audio/usvs/, audio/usvs-cocaine/,
│       audio/beds/, audio/effects/
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

## Audio rules (load-bearing)

- `Tone.start()` must be called inside a user-gesture handler before any audio plays. The headphones tag at the top of the page is the gesture target. Until clicked, no AudioContext.
- Same review text + same rat profile = same audio output. Determinism is part of the project's framing (algorithmic art, not stochastic).
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

## When in doubt

Read `docs/STRATEGY.md` first. If the answer isn't in §10 (Tech stack and implementation patterns), ask the user before guessing. Do not infer creative or content-related decisions from code patterns.
