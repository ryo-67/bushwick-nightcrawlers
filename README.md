# The Bushwick Nightcrawlers

A sound piece scored for the corner of Myrtle and Broadway at night, narrated as Yelp reviews by the rats who live there. Ten pins on a hand-drawn map; click one to read a review and hear it spoken in ultrasonic vocalizations slowed down to human hearing range.

A sound art piece, not a website with audio. The interactive interface is the score. The piece sits over a continuous score of the intersection itself — the JMZ overhead, the ambient drone of the corner, small punctuations of street activity. Reviews layer in as you click, and stay layered.

## Live

→ [bushwick-nightcrawlers.vercel.app](https://bushwick-nightcrawlers.vercel.app)

Headphones recommended. The piece needs a first user gesture to start (Web Audio API requirement); the loading screen's enter bar is the gesture target.

## How the rats speak

Every word of a review is voiced with rat ultrasonic vocalizations (USVs), pitch-shifted into human hearing range. A footer toggle picks the register:

- **in the moment** (default) — generative. One USV per word, chosen fresh on every click by duration tier, punctuation context, and each rat's personality skew. No two playbacks are alike; the rats are speaking, not replaying.
- **in their tongue** — the rats' language. Words render as runs of short USVs at syllable rate, and each syllable's sound is seeded from its *core* (leading consonants + vowel nucleus) — so "rat" and "rats" squeak identically, "cheese" and "cheesy" share their opening, and every rat pronounces a given syllable with the same sample, transposed by its own voice. Fully deterministic: the same review plays identically every time, because the language itself is stable — not because anything was recorded.

In both modes, drug-effect events fire on keyword matches in the review text (never probabilistically): "ketamine" opens a k-hole on the rat's voice chain, "diet" fizzes, "tagged" pings. One rat speaks entirely in the cocaine register — samples recorded from rats on cocaine — and a few others drift into it word by word.

Everything is spatial: each rat's voice and each venue's ambient bed sit in the stereo field where its pin sits on the map.

## The social layer

Visitors can react to reviews (helpful · leave crumb · love this · oh no, plus report to 311), and one closed venue takes pay-respects. Counts are shared globally — the next visitor sees everyone's tallies — via a single Vercel Function backed by Upstash Redis, with per-IP rate limiting and no accounts or tracking beyond your own browser's memory of what you pressed.

## Stack

- Vanilla HTML/CSS/JS, ES modules, no framework, no bundler, no build step
- [Tone.js](https://tonejs.github.io/) v15 via unpkg CDN
- Vercel hosting; one serverless function (`api/reactions.js`) for the shared reaction counters

## Run locally

```sh
git clone https://github.com/ryo-67/bushwick-nightcrawlers.git
cd bushwick-nightcrawlers
python3 -m http.server 8000
# open http://localhost:8000
```

No `npm install`, no transpilation. The site is plain static files; any static server works. Without the reactions API (it needs the Upstash credentials on Vercel), reaction counts silently fall back to per-browser local counts — everything else is fully functional offline.

## Structure

```
index.html              # entry, map page
about.html              # epigraph, credits, citations
styles.css              # design tokens, layout, modal sheets
api/
└── reactions.js        # shared reaction counters (Vercel Function + Upstash)
src/
├── main.js             # bootstrap, pin handlers, footer controls
├── audio/              # engine, rat-generator, profiles, beds, effects,
│                       # syllables + usv-features (the 'in their tongue' voice)
├── components/         # modal, oscilloscope, loading-screen
├── content/            # rats, reviews, venues, alley-oneliners
└── debug/              # ?debug=viewport overlay
assets/
├── map.mp4             # animated map background
├── pins/               # 10 animated pins
├── selfies/            # rat profile images
├── photos/             # venue photos
└── sounds/             # USV banks (general + cocaine), ambient, effects, beds
scripts/                # asset pipeline + generated-manifest tooling
docs/
├── STRATEGY.md         # project concept, sonification system, build plan
└── ASSETS.md           # asset checklist with sources and citations
CLAUDE.md               # repo conventions for AI coding agents
```

## Credits and attribution

Full credits — concept, art, voice register reference, USV recordings, sound design samples, license terms — live on the [About page](https://bushwick-nightcrawlers.vercel.app/about.html).

Notable: USV cocaine bank samples come from the [USVSEG dataset](https://doi.org/10.5281/zenodo.3428024) (Tachibana et al., 2020, *PLOS ONE*) — recorded from rats given cocaine, who vocalize with pleasure. The loading screen's rat is by [Danil Polshin](https://thenounproject.com/icon/rat-8308195/) (the Noun Project, CC BY 3.0). Sound design samples are mostly Freesound CC0 with a few CC BY 3.0 / 4.0 entries (all credited on the About page).

## Debug flags

Query-param-gated; production users see nothing unless the param is set.

- `?debug=viewport` — live readout inside any open modal showing `innerHeight`, `visualViewport` state, bounding rects, computed heights, and safe-area insets. Used to diagnose iOS Safari-specific layout state. Tap to dismiss.
- `?voice=syllabic` — dev override forcing the syllabic voice regardless of the footer mode.

## License

Split license — see [LICENSE](LICENSE):

- **Code** (`src/`, `api/`, `scripts/`, the HTML/CSS) — MIT. Take the engine, learn from it, build with it.
- **Creative content** (reviews, rat characters, map and pin art, photos, copy) — all rights reserved. The piece is the piece; ask before reusing.
- **Third-party assets** (portions of `assets/sounds/`, the loading-screen rat) — their own licenses, credited in full on the [About page](https://bushwick-nightcrawlers.vercel.app/about.html).

## Repository conventions

Repo conventions for AI coding agents live in `CLAUDE.md` (project structure, audio rules that are load-bearing, code style, common pitfalls, what not to touch). Read it before making changes to audio, modals, or the body-lock layout pattern.
