# The Bushwick Nightcrawlers

A sound piece scored for the corner of Myrtle and Broadway at night, narrated as Yelp reviews by the rats who live there. Ten pins on a hand-drawn map; click one to read a review and hear it spoken in ultrasonic vocalizations slowed down to human hearing range.

A sound art piece, not a website with audio. The interactive interface is the score. The piece sits over a continuous score of the intersection itself — the JMZ overhead, the ambient drone of the corner, small punctuations of street activity. Reviews layer in as you click, and stay layered.

## Live

→ [bushwick-nightcrawlers.vercel.app](https://bushwick-nightcrawlers.vercel.app)

Headphones recommended. The piece needs a first user gesture to start (Web Audio API requirement); the headphones tag at the top of the page is the gesture target.

## Stack

- Vanilla HTML/CSS/JS, ES modules, no framework, no build step
- [Tone.js](https://tonejs.github.io/) v15 via unpkg CDN
- Vercel for static hosting

## Run locally

```sh
git clone https://github.com/ryo-67/bushwick-nightcrawlers.git
cd bushwick-nightcrawlers
python3 -m http.server 8000
# open http://localhost:8000
```

No `npm install`, no transpilation. The site is plain static files; any static server works.

## Structure

```
index.html              # entry, map page
about.html              # epigraph, credits
styles.css              # design tokens, layout, modal sheets
src/
├── main.js             # bootstrap, pin handlers, header controls
├── audio/              # engine, rat-generator, profiles, beds, effects
├── components/         # modal, oscilloscope, loading-screen, headphones-tag
├── content/            # rats, reviews, venues, alley-oneliners
└── debug/              # ?debug=viewport overlay
assets/
├── map.mp4             # animated map background
├── pins/               # 10 pin GIFs/WebPs
├── selfies/            # 11 rat profile images
├── photos/             # 10 venue photos
└── sounds/             # USV banks (general + cocaine), ambient, effects, beds
docs/
├── STRATEGY.md         # project concept, sonification system, build plan
└── ASSETS.md           # asset checklist with sources and citations
CLAUDE.md               # repo conventions for AI coding agents
```

## Credits and attribution

Full credits — concept, art, voice register reference, USV recordings, sound design samples, license terms — live on the [About page](https://bushwick-nightcrawlers.vercel.app/about.html).

Notable: USV cocaine bank samples come from the [USVSEG dataset](https://doi.org/10.5281/zenodo.3428024) (Tachibana et al., 2020, *PLOS ONE*) — recorded from rats given cocaine, who vocalize with pleasure. Sound design samples are mostly Freesound CC0 with a few CC BY 3.0 / 4.0 entries (all credited on the About page).

## Playback modes

Two modes via the footer toggle:

- **in the moment** (default) — generative. Each playback differs. Sample selection and timing roll fresh on every click.
- **on record** — seeded. Same review = same audio every play. Seed is `fnv1a(reviewerId + reviewText)`; persists in `localStorage`.

The toggle is read at playback start; mid-playback flips don't affect the currently-running generator.

## Debug

Append `?debug=viewport` to any URL to attach a live readout inside any open modal showing `innerHeight`, `visualViewport` state, modal/card bounding rects, computed heights, and safe-area inset values. Used to diagnose iOS Safari-specific layout state. Tap to dismiss. Zero overhead when the param is absent.

See `src/debug/viewport-readout.js`.

## Repository conventions

Repo conventions for AI coding agents live in `CLAUDE.md` (project structure, audio rules that are load-bearing, code style, common pitfalls, what not to touch). Read it before making changes to audio, modals, or the body-lock layout pattern.
