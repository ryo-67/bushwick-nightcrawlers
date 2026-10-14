# Backlog

Parked work, written so any session can pick it up without the conversation that produced it. Each entry says what the problem is, what was found, the options, the risks, and how to resume. Line numbers drift, so entries point at selectors and functions instead.

When you pick something up, move it to **Done** at the bottom with the commit hash, or delete it if the decision is "won't do".

Last reviewed: 2026-10-14.

---

## Needs device testing (iPhone Safari)

### Restructure the mobile sheet CSS

**Problem.** "Full-height sheet" is expressed as a chain of exclusions: `.modal:not(:has(.modal-card-tombstone))`, `.modal-card:not(.modal-card-tombstone)` (twice) and `.modal-card:not(.modal-card-tombstone):not(.alley-modal)`, after which the tombstone is overridden back to `height: auto`. The 64px end clearance (`calc(var(--space-md) + 48px)`) is written twice, once for review cards and once for `.alley-cards`.

**Proposed change.**
- `modal.js` sets `data-sheet="full"` or `data-sheet="fit"` on `#modal-root` (it already knows the card kind).
- The mobile default becomes the content-sized sheet; `[data-sheet='full']` adds the `100lvh` height on `.modal` and `.modal-card` and the V24 bottom mask.
- One `--sheet-end-clearance` token, used by whichever element scrolls.

**Must preserve.** Both iOS behaviours described in CLAUDE.md "Mobile sheet sizing": the tombstone anchored at `innerHeight`; review and alley sheets at `lvh` with the 32px fade and 64px clearance.

**Risk.** Medium. Chromium emulation can't reproduce the iOS paint clip, so this needs a real iPhone. Use `?debug=viewport` to capture before/after numbers.

**Resume.** Screenshot a review card, the alley card and the Rash tombstone on an iPhone (top and scrolled to the bottom) before changing anything, make the change on a branch, compare on the same device.

### The architectural fix for the iOS paint clip ("Option A")

**Problem.** V24 only disguises the clip: iOS Safari stops painting `position: fixed` elements at `innerHeight` (dvh), so the bottom ~40px under the URL-bar pill never shows sheet content.

**Option A.** Make `.modal` `position: absolute`, pin `.map-wrapper` instead, put `position: sticky` on the card, and undo the body lock (`body { height: 100dvh; overflow: hidden }`).

**Risk.** High. The body lock is what keeps the URL bar in its pill state, and several layout rules depend on it. Deferred until someone decides the ~40px is worth it. Do the restructure above first; it makes this easier.

### Simplify the alley card's padding

**Problem.** `.modal-card.alley-modal` zeroes horizontal padding so the rat list runs full-bleed, then the headline, header, hint and cards each add it back, with "belt-and-suspenders" longhands and a specificity bump to beat the override.

**Proposed change.** Do on desktop what mobile already does: cards get `padding-inline: 0`, every direct child of the card gets `padding-inline: var(--card-inset)` (`--space-lg` desktop, `1rem` mobile), and `.alley-cards` opts out. About six alley-only rules go away.

**Risk.** Medium. Needs a screenshot comparison of the alley card and the review card's sticky pagination bar, desktop and mobile.

### Consolidate the mobile CSS

**Problem.** `styles.css` has several separate `@media (max-width: 768px)` blocks. Four selectors are declared twice in mobile context: `.modal-venue-headline`, `.reviewer-info`, `.review-rating`, `.alley-modal .modal-venue-photo`. `.modal-venue-photo`'s base rule is a rotated 16:9 "polaroid" that every mobile variant undoes; review cards never show a venue photo, so the polaroid only appears on desktop. The map page is targeted as `body:not(.about-page)`.

**Proposed change.**
- Merge the two large mobile blocks (only the `.pin-tooltip-locked` base rules sit between them, and they touch no selector in either, so cascade order is safe) and dedupe the four selectors.
- Make `.modal-venue-photo`'s base the plain rectangle and move the polaroid declarations into `@media (min-width: 769px)`.
- Add a positive `map-page` class to `<body>` in `index.html` and use it instead of `body:not(.about-page)`.

**Risk.** Low to medium. Pure CSS, but cascade order matters around the mobile-sheet rules; compare screenshots at 375px and 1024px.

---

## Performance and cost (only if traffic grows)

Context: the reactions store (`upstash-kv-aero-basket`) is a Vercel Marketplace install on Upstash's **Free plan: 500,000 commands a month**, no payment method attached. Running out doesn't bill; the API stops answering until the month resets and the chips fall back to local counts. Check usage in the Vercel dashboard (Storage tab) before doing either item below.

Rough budget: reading a review's counts = 1 command; a reaction = 4 (`INCR` + `EXPIRE` for the rate limit, `HINCRBY` + `HGETALL`). A visitor who opens ~8 reviews and reacts twice uses ~20, so the free tier covers roughly 25,000 visitors a month. Reads dominate.

### Timed cache for reaction counts

**State today.** `src/components/reactions-client.js` shares GETs already in flight and announces fresh counts (so the peek tally updates after your own reaction). The modal still fetches fresh counts on every open and review switch; the peek tally is cached for the session.

**Proposed change.** Keep each target's last counts in `reactions-client.js` with a short lifetime (15–30 s); `getReactionCounts` returns the cached value inside that window. Optionally remember "API unavailable" once and stop asking (local dev, outage).

**Trade-off.** Cuts read traffic sharply and makes reopening instant; other visitors' reactions appear up to the cache lifetime late.

**Risk.** Low.

### Combine the reaction POST's two Upstash round trips

**Proposed change.** Replace the two pipelines in `api/reactions.js` with one `EVAL` (Upstash supports Lua over REST):

```lua
local n = redis.call('INCR', KEYS[1])
if n == 1 then redis.call('EXPIRE', KEYS[1], 90) end
if n > tonumber(ARGV[1]) then return false end
redis.call('HINCRBY', KEYS[2], ARGV[2], ARGV[3])
return redis.call('HGETALL', KEYS[2])
```

KEYS = `rl:<ip>:<minute>`, `reactions:<target>`; ARGV = rate limit (30), type, delta. A `false`/nil reply means rate-limited → 429.

**Benefit.** About 40% more headroom on reaction traffic, one round trip, atomic. Visitors won't notice the speed (chips update optimistically).

**Risks.**
- Upstash's docs suggest one script call bills as one command but don't say whether the calls inside it count; if they do, there's no saving. Watch usage after shipping.
- Can't be tested locally (needs a real Redis). Previews use the **live** store, so testing means a real +1 then −1 on a target (e.g. Rash).
- Rate-limit semantics must not change: 30 per minute per IP, and rate-limited requests count against the limit without adding a reaction.

**Decision so far.** Skip unless usage approaches the free quota; the timed cache saves more.

### Smaller performance items

- **Alley pulse under an open modal.** `.pin[data-lock-state='unlocked']` animates `filter: drop-shadow` forever (`alleyPulse`), which re-rasterizes the animated WebP every frame, including behind an open modal. Cheapest fix: `body:has(.modal[data-state='open']) .pin { animation-play-state: paused; }`. Better: move the glow to a `::before` with a static shadow and animate only opacity/transform.
- **Oscilloscope repaints silence.** While a review modal is open, `src/components/oscilloscope.js` redraws at 60 fps even when the signal is flat or the canvas is scrolled out of view. Skip drawing when all levels are below ~1e-3 and the last frame was already flat; pause via IntersectionObserver when off-screen.
- **Mobile pin labels.** `.pin-label` uses `backdrop-filter: blur(2px)` over the playing video: nine backdrop blurs per frame for an effect barely visible behind its 0.85-opacity background.
- **Volume slider.** `setVolume()` writes localStorage on every `input` event while dragging; persisting on `change` is enough.

---

## Code tidy (low risk, no behaviour change)

- **Venue open effects re-run on page switch.** `Modal.switchReview()` re-fires `onOpen` so `main.js` can rebind the play button, which re-runs venue effects (bed, `trainOnOpen`, `markVisited`). Harmless today (one review at the JMZ platform, the others are idempotent), but a second JMZ review would fire a train on every page flip. Split the hooks: `onOpen(venueId)` for venue effects, once; `onReviewShown(review)` for the rat; let the modal own its play button and emit `onPlayToggle`.
- **Loading screen shells.** `renderInitial()` and `renderReturning()` in `loading-screen.js` repeat the same shell (dialog attributes, header, rat crew, footer, status cycle). Extract `mountShell({ state, body, ctaLabel })`.
- **Chrome bar tokens.** Header padding (`calc(var(--chrome-pad-y) + env(safe-area-inset-top)) var(--chrome-pad-x) var(--chrome-pad-y)`) is written for three bars and the footer padding for two; `.page-title` and `.loading-title` share eight declarations kept "in sync" by comment. Add `--chrome-header-pad` / `--chrome-footer-pad` tokens and group the two titles.
- **Colour literals.** `rgba(197, 191, 174, …)` (the text colour at various alphas) and other `rgba(184, 255, 0, …)` accent alphas are still literals; use `color-mix(in srgb, var(--color-text) N%, transparent)` (already used elsewhere in the file). Give the alley glow's off-palette `rgba(180, 255, 100, …)` its own token rather than silently switching it to the accent. `oscilloscope.js` hard-codes the same RGB values.
- **Text-button reset.** `.footer-reset`, `.footer-mode` and `.review-report` repeat the same transparent/no-border/inherit-font reset; group them or add a `.text-button` base class.
- **Elite badge rat.** `modal.js` builds the rat SVG inline for the reviewer badge; `rat-crew.js` could export a `ratSvg({ width })` both use.
- **`convert_pin_gifs.py`.** A Pillow fallback for `convert-pin-gifs.sh` (which needs Homebrew's `gifsicle` and `gif2webp`). Keep or delete; one entry point would be simpler.
- **`docs/ASSETS.md`.** Out of date in places: `pitchVariance` / `Tone.PitchShift` / "200% time stretch" were never built; it points to a `CREDITS.md` that doesn't exist; §2.2's "Audacity → Resample" contradicts the header-rewrite slowdown beside it; the §2.1 Freesound contributor list doesn't match `about.html`; the §1.3 photo-source plan is stale.

---

## Not code

- **Venue photo permissions.** Requests went out 2026-10-12 for the Ornithology, Mood Ring and Rash photos (credited on the About page). On each reply: if yes, adjust the credit as asked (optionally "used with permission"); if no, set that venue's `photoRedacted` in `venues.js` or replace the photo. Rash's tombstone layout is built around its photo, so a "no" there needs a design decision.
- **Untraceable photos.** Market Hotel, Trifecta, the alley and Bossa Nova have no findable photographer; Mr. Kiwi's (an anonymous blog) and the JMZ platform's (a Reddit user) weren't contacted. Replace with Shoro's own photos of the corner, or contact the sources.
- **Search.** Request indexing for `https://bushwick.shoro.space/` and `/about.html` in Google Search Console (the first attempt hit the daily quota). Update the portfolio record page's links to point at `bushwick.shoro.space` instead of the old `vercel.app` address.
- **About copy (Shoro's call).** The "on playback" section's first paragraph says rat speech is "never twice the same", which only describes the default mode; the paragraph after it explains 'in their tongue'.
- **Cross-browser check.** Safari desktop and a real iPhone haven't been tested since the October 2026 cleanup (CLAUDE.md "Verification").

---

## Done

- 2026-10-14 — Cleanup and venue `kind` shipped: `5ffcf5c`, `3d4fe8e`, `250d058`, `16e1f85`, `1bb6b13`.
