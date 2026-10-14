# The Bushwick Nightcrawlers

## Project context

Single-page sound piece. Hand-drawn map of the Myrtle-Broadway JMZ intersection in Bushwick. Ten pins; click a pin and a rat reviews the venue in Yelp pastiche, voiced with rat vocalizations (USVs) synced word by word to the review text.

Sound art piece, NOT a website with audio. The interactive interface is the score. Playback is generative by default: different sample selection on every play. A footer toggle switches between two modes:

- **'in the moment'** (default) — generative, never the same twice. Rats don't archive their language, so this is the baseline.
- **'in their tongue'** — the syllabic voice: words render as syllable-core USV runs, the same word squeaks identically everywhere, and the remaining randomness is seeded, so a review replays exactly. (It replaced the old 'on record' mode in V72; a saved 'record' preference migrates to 'tongue'.)

Live at **https://bushwick.shoro.space**. Its portfolio record is https://shoro.space/records/bushwick-nightcrawlers.

## Authoritative spec

For full project context, read `docs/STRATEGY.md`. Most decisions and rationale live there. Read these sections first:

- §1 Concept (the two-layer claim, Tomey's epigraph "the vermin aren't the customers")
- §3 Sonification system (USV banks, voice fingerprints, drug effects, mix structure)
- §4 Audio centrality remedies (Remedies 1, 4, 5, 6, 7 are in scope; 2 and 3 are deferred)
- §9 Visual language (palette, typography, texture)
- §10 Tech stack and implementation patterns (code patterns, file structure)
- §12 Build plan (per-task scoping)

Parked work (deferred refactors, performance items, photo-permission follow-ups) is logged in `docs/BACKLOG.md`, written so it can be resumed without prior context. Add to it rather than leaving decisions in a conversation.

For the asset checklist and citations: `docs/ASSETS.md`. Some of its planning notes are out of date (pitch-variance and time-stretch features that were never built, a `CREDITS.md` that doesn't exist); where it disagrees with the code or this file, the code and this file win.

## Stack

- Vanilla HTML/CSS/JS, ES modules, no framework
- Tone.js 15.1.22 from unpkg, loaded `defer` before `src/main.js` (no npm install)
- Vercel: static site plus one serverless function (`api/reactions.js`)
- No bundler, no transpilation, no build step

## Project structure

```
/
├── index.html              # The map page: header, map + pins, footer controls, modal mount
├── about.html              # Project copy, credits and citations
├── 404.html                # Not-found page (served by Vercel; root-absolute asset paths)
├── styles.css              # Design tokens and every page's styles
├── vercel.json             # Asset cache headers, /about → /about.html redirect
├── robots.txt, sitemap.xml
├── api/
│   └── reactions.js        # Shared reaction counters (Upstash Redis over REST)
├── src/
│   ├── main.js             # Bootstrap: pins, peek tooltips, modal wiring, footer, audio boot
│   ├── storage.js          # Every localStorage/sessionStorage key + safe read/write + forgetVisitor()
│   ├── framed.js           # Behaviour when the portfolio embeds the piece in an iframe
│   ├── audio/
│   │   ├── engine.js           # Singleton: preload, start, cumulative-voicing registry, visit tracking
│   │   ├── rat-generator.js    # One rat speaking one review (tokenize, schedule, keyword effects)
│   │   ├── rat-profiles.js     # Per-rat voice fingerprints (cocaine ratio, tiers, processors)
│   │   ├── beds.js             # JMZ rumble, traffic floor, train passes, per-venue beds
│   │   ├── keyword-effects.js  # keyword → sample played alongside the voice
│   │   ├── keyword-processors.js # keyword → processing on the voice (kHole, timeGlitch)
│   │   ├── syllables.js        # Syllable estimator for the 'in their tongue' voice
│   │   ├── spatial.js          # Stereo pan from each venue's map position
│   │   ├── master-controls.js  # Volume and mute
│   │   ├── playback-mode.js    # 'moment' / 'tongue'
│   │   ├── load-buffer.js      # Tolerant single-file loading (one retry, then null)
│   │   ├── ramp.js             # Click-free parameter ramps
│   │   ├── normalize.js        # Shared keyword normalisation
│   │   ├── manifest.js         # GENERATED — scripts/generate-audio-manifest.js
│   │   └── usv-features.js     # GENERATED — scripts/analyze_usv_features.py
│   ├── components/
│   │   ├── modal.js            # Review, alley and tombstone cards; word highlighting; reactions
│   │   ├── reactions-client.js # Browser side of api/reactions.js
│   │   ├── oscilloscope.js     # The waveform player surface
│   │   ├── loading-screen.js   # Field-note cards, readiness, the Enter gesture
│   │   ├── rat-crew.js         # The scuttling rat crew (loading screen + About page)
│   │   ├── about-rats.js       # Mounts the crew on the About page
│   │   ├── rat-silhouette.js   # The rat path (CC BY 3.0, credited on About)
│   │   └── redacted-photo.js   # Placeholder frame for a venue with no usable photo
│   ├── content/            # CREATIVE CONTENT — Shoro's lane (see "Don't")
│   │   ├── venues.js           # Every pin: kind, name, photo, map position, optional behaviour
│   │   ├── reviews.js, rats.js, alley-oneliners.js, loading-narrative.js
│   └── debug/
│       └── viewport-readout.js # ?debug=viewport overlay
├── scripts/                # Asset pipeline (ffmpeg/Pillow/sox) + dev-server.py
├── assets/
│   ├── map.mp4             # Animated map background (silent, looping)
│   ├── pins/               # Animated WebP pins (alpha); alley has a grey variant
│   ├── photos/, selfies/   # WebP
│   ├── sounds/             # ambient/, effects/, usvs/, usvs-cocaine/ — all WebM/Opus
│   └── og.jpg, favicon.svg, apple-touch-icon.png
├── docs/                   # STRATEGY.md, ASSETS.md, BACKLOG.md (parked work)
└── .vercelignore           # Keeps docs/, scripts/, CLAUDE.md, .claude/ off the live site
```

`assets/source-pins/` (the GIF originals for the pins) is local-only and gitignored.

## Venues: kinds and data

`src/content/venues.js` drives behaviour. Code reads venue fields; it does not test venue ids.

- `kind: 'review'` — opens a rat's review card (text in `reviews.js`, keyed by venue).
- `kind: 'gathering'` — the alley: a card of every rat's one-liner. No pin label.
- `kind: 'memorial'` — a closed venue's tombstone (Rash). Takes a pay-respects reaction keyed by the venue id; the API derives its valid targets from this.
- `unlockAfterVisits` + `lockedMessage` — the pin is greyed out (`data-lock-state`) until that many review venues have been opened. Mouse users see the message in the hover tooltip; touch screens get it as a toast on tap, at any width.
- `closedNote` — the stamp across a memorial's photo.
- `trainOnOpen` — opening the pin fires a train pass (the JMZ platform).
- `photoPath`, or `photoRedacted: { stamp, note }` for a venue with no usable photo.
- `mapCoordinates` (percent of the map) and optional `labelPosition`.

Per-venue ambient beds (files, gains, and whether a bed persists after close) live in `VENUE_BED_MAP` in `src/audio/beds.js`, next to the code that plays them; they're mix settings, not content. A review venue's rat comes from `reviews.js` (each review names its `venueId` and `reviewerId`).

## Map and pin layering

The map is a silent looping MP4. Pins are separate animated WebP images layered on top and positioned from `mapCoordinates` at startup. MP4 has no transparency, so pin overlays must use a format that does (animated WebP). Don't overlay video on video.

`<video autoplay loop muted playsinline>`: `muted` is required for autoplay; `playsinline` stops iOS Safari from going fullscreen. While the loading screen is up the video is paused; Enter starts it.

## Audio rules (load-bearing)

- **Audio starts only inside a user gesture.** `Tone.start()` is called synchronously in the gesture handler. The gesture is the loading screen's Enter when it shows; when it's skipped (moving between the map and About in one session), `armGestureBoot()` in `main.js` boots audio on the next click, key or touch anywhere, except on elements marked `data-no-audio-boot` (the header's portfolio link).
- **Preload before the gesture.** `engine.preload()` builds the node graph and decodes every buffer while the loading screen is up; it's idempotent and retries once on failure. Photos and selfies preload after the audio, so they never hold up "the rats are ready".
- **Tolerant loading (V74).** Every file goes through `loadBufferWithRetry`: one retry, then the sample is skipped. One bad file costs one sound, never the whole piece.
- **Cumulative mix.** Pin audio persists after its modal closes. Up to five rats speak at once (`RAT_CAP`); older rats step back on a recency ladder (quieter, duller, more reverb). Do NOT dispose a rat's Tone nodes when its modal closes; it fades and is disposed only when it finishes or is evicted.
- **Keyword effects are triggered by words, not chance.** RatGenerator's tokenizer matches each word against `keyword-effects.js` (a sample alongside the voice) and `keyword-processors.js` (processing on the voice). Keys are lowercase letters only (`normalize.js`).
- **Determinism in 'in their tongue'.** RatGenerator reads the mode at `start()` and routes all randomness through `this.rng`: `Math.random` for 'moment', a seed from reviewer id + review text for 'tongue'. In 'tongue', each syllable's sample is seeded by its syllable core, so the same word squeaks the same everywhere. Don't add `Math.random` calls to the voice path.
- **Word highlighting uses `Tone.Draw.schedule`**, never `setTimeout` or `requestAnimationFrame`, so text stays sample-accurate with the audio. The modal splits the review into words exactly as `tokenize()` does; keep the two splitters in step.
- **Beds.** The JMZ rumble and the Myrtle-Broadway traffic floor loop from the moment audio starts. Train passes fire every 90–180 s (recursive `setTimeout`). Per-venue beds fade in on open and out on close; Rash's bed is persistent and stays as a faint layer.

## Saved state

All browser storage goes through `src/storage.js` (`KEYS`, `readFlag`/`writeFlag`, `readLocal`/`writeLocal`, `readSession`/`writeSession`). The footer's "forget the rats you've met" calls `forgetVisitor()`, which clears progress (venues visited, reactions, first-visit flags, the session flag) and keeps preferences (volume, mute, playback mode). A new key belongs in its `FORGETTABLE` list if it records progress rather than a preference.

## Reactions

`api/reactions.js` keeps shared counters per review (reviewer id) or memorial (venue id) in Upstash Redis via its REST API (env `UPSTASH_REDIS_REST_*` or the Marketplace's `KV_REST_API_*`). Types: helpful, thanks, love, ohno, respects, plus report (counted, never shown). Per-IP limit: 30 POSTs a minute. The browser side is `src/components/reactions-client.js`; localStorage remembers whether *you* reacted and stands in for the counts when the API is absent (the local static server, an outage).

## Mobile sheet sizing (V23/V24)

The map page locks `body` to `100dvh` with `overflow: hidden`, so iOS Safari keeps its URL bar as a floating pill for the whole session.

Full-height mobile sheets (review and alley cards) are declared `100lvh` tall via `:has()` scoping on the modal: `.modal:not(:has(.modal-card-tombstone)) { height: 100lvh }` and `.modal-card { height: 100lvh; max-height: 100lvh }`. iOS Safari still clips `position: fixed` paint at `innerHeight` (= dvh) whatever the declared height (MUI #46953, Apple radar 158055568; unfixed through Safari 26.4.2). So V24:

- fades the card's visible bottom 32px into the page background with a `mask-image` gradient stopped at `100dvh`, so the clip reads as content receding rather than a hard edge;
- pads review cards' bottom by a fixed `calc(var(--space-md) + 48px)` (64px), so the last content sits clear of the fade. The alley list carries its own matching padding.

The Rash tombstone (`.modal-card.modal-card-tombstone`) is content-sized (`height: auto; max-height: 100dvh`), anchored at `innerHeight`, and excluded from all of the above.

V24 is camouflage, not a fix: paint still stops at dvh. The architectural fix (make `.modal` `position: absolute`, pin `.map-wrapper`, `position: sticky` on the card, undo the body lock) is deferred.

## Code quality (applies to every change)

Write maintainable, human-readable, clean code, and leave the code you touch cleaner than you found it.

- **Reuse before writing.** Use the shared helpers instead of re-implementing them: `src/storage.js` (browser storage), `src/components/reactions-client.js` (the reactions API), `src/audio/ramp.js` (gain/parameter fades), `src/audio/normalize.js` (keyword keys), `src/audio/load-buffer.js` (audio loading), `src/components/rat-crew.js` (the rat crew), `buildStarRow`/`formatCount`/`findReviewsForVenue` in `modal.js`. If you need something twice, extract it once.
- **Data, not special cases.** Behaviour that belongs to a venue goes in `venues.js` as a field and the code reads it; never branch on a specific venue, rat or review id.
- **Fix the cause, at the right depth.** Don't layer overrides, `!important`, or another `:not()` on top of a rule to patch a symptom; change the rule or the mechanism underneath.
- **Small, named pieces.** Prefer short functions with names that say what they do over long handlers; keep nesting shallow; name constants instead of using magic numbers and colour literals (use the CSS tokens).
- **No dead code.** Delete unused functions, exports, selectors, state and files rather than leaving them "just in case"; git history keeps them. Don't leave commented-out code.
- **Comments say why, for the code as it is now.** No history notes about code that's gone; update or delete a comment when the code under it changes.
- **Verify before shipping.** `node --check` every changed JS file, exercise the change in a local preview (`scripts/dev-server.py`), and for refactors confirm behaviour is unchanged.

## Code style

- ES module imports, named exports only; no default exports
- Classes for stateful audio objects (RatGenerator, Oscilloscope, Modal); pure functions for tokenizers and scanners
- Vanilla CSS with custom properties for theme tokens (`--color-*`, `--font-*`, `--space-*`, `--chrome-*`)
- 2-space indentation, single quotes for strings
- "V-numbers" in comments refer to past iterations (e.g. V24, V74); keep the ones that explain current behaviour, don't add new history.

## Don't

- Don't introduce React, Vue, Svelte, or any framework
- Don't add a bundler config (Webpack, Vite, esbuild) for v1
- Don't use `console.log` in committed code; remove debug logs before committing (`console.error` for real failures is fine)
- Don't generate audio events stochastically; effects are keyword-triggered
- Don't try to "polish" or normalize the voice in reviews. The lowercase Pinky Mae, the run-on DJ Nibblers, the rat-POV throughout — all intentional. Voice is load-bearing.
- Don't draft new review text, rat bios, About-page copy or other visitor-facing wording without an explicit ask. Creative writing belongs to Shoro. Implementation code is your lane; voice and content are Shoro's. When copy is needed, propose it for approval.
- Don't dispose Tone audio nodes on modal close — it breaks the cumulative mix.
- Don't print a portfolio record number anywhere (link text, labels, aria-labels, titles). shoro.space numbers records by date and renumbers them; link to the record's URL (its slug) only.
- Don't edit `manifest.js` or `usv-features.js` by hand; regenerate them with their scripts.

## Deploying

- The Vercel project (`bushwick-nightcrawlers`, team `ryo-67s-projects`) is linked to GitHub. **A push to `main` deploys to production** (bushwick.shoro.space). A push to any other branch builds a preview.
- Work on a branch; ship to `main` only when Shoro says so. Changes to visitor-facing copy go to a preview first for Shoro's approval.
- `bushwick-nightcrawlers.vercel.app` 308-redirects to bushwick.shoro.space with paths kept.
- `.vercelignore` keeps `docs/`, `scripts/`, `CLAUDE.md` and `.claude/` out of the deployed site (they stay on GitHub). Anything else in the repo root is publicly served, so don't commit private notes outside those paths.
- Previews sit behind Vercel's login; plain `curl` gets a redirect. Use the Vercel connector's authenticated fetch to read them.
- Run `vercel api …` from outside the repo: inside it the CLI mistakes the `api/` folder for a subdirectory deploy.
- Deleting deployments needs confirmation, which this environment can't give; Shoro removes old previews with `vercel rm <url> --scope ryo-67s-projects`.

## Local preview

Run `python3 scripts/dev-server.py <port>` (`.claude/launch.json` uses it). It sends `Cache-Control: no-store`; plain `python3 -m http.server` lets the browser cache JS modules, so reloads silently keep running old code. `/api/reactions` and Vercel Analytics 404 locally; that's expected.

## Verification

- Test in Chrome desktop, Safari desktop, and Chrome or Safari on iOS at minimum
- Audio must start after the first gesture (Enter, or the first click when the loading screen is skipped)
- Reviews must render the same way every play (pick one rat, play twice, compare)
- In 'in their tongue', a review must sound the same on every play
- Keyword effects must fire on their trigger words
- A hidden or background browser tab pauses `requestAnimationFrame`, which freezes the loading-screen cards and `Tone.Draw` highlighting; test those in a visible tab

## Common pitfalls

- Calling `Tone.start()` outside a gesture handler, or after an `await` — silent failure, no error
- Using `setTimeout` for subtitle sync — drifts from the audio over long reviews
- Disposing Tone nodes on modal close — breaks the cumulative mix
- Adding a `Math.random` call to the voice path — breaks 'in their tongue' determinism
- Case and punctuation in keyword matching — use `lettersOnly()` from `normalize.js`
- Writing to localStorage directly — use `src/storage.js` so the reset and private-mode fallbacks stay correct

## Debug flags

Query-param diagnostics; visitors see nothing unless the param is set.

- `?voice=syllabic` — forces the syllabic voice regardless of the footer mode. Cocaine-register words stay word-level in every mode. Implementation: `scheduleSyllabicWord` in `src/audio/rat-generator.js`; feature data in `src/audio/usv-features.js` (regenerate with `scripts/analyze_usv_features.py`).
- `?debug=viewport` — a live readout inside any open modal card: innerHeight/Width, visualViewport (height, offsetTop, scale), modal and card rects, computed heights, safe-area insets. Updates on resize and scroll; tap it to dismiss for the session. For capturing iPhone Safari layout that Chromium emulation can't reproduce. Implementation: `src/debug/viewport-readout.js`, installed at the top of `src/main.js`.

## When in doubt

Read `docs/STRATEGY.md` first. If the answer isn't in §10 (Tech stack and implementation patterns), ask Shoro before guessing. Don't infer creative or content decisions from code patterns.
