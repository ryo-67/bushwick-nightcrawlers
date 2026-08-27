# Assets & Resources — The Bushwick Nightcrawlers

Working checklist of every resource needed for the build. Organized by type. Status column for tracking. Source notes inline.

---

## 1. Images

### 1.1 Hand-drawn map (1 file)

| Field | Value |
|---|---|
| File | `assets/map.svg` (or `.png` at 2x) |
| Source | Shoro draws and scans |
| Subject | Top-down view of Myrtle-Broadway intersection. JMZ elevated tracks crossing from one edge to the other. Market Hotel + Mr. Kiwi as a stacked building (1140 Myrtle). Trifecta corner with Dunkin, Checkers, Popeyes labeled (or merged into one composite block). The alley behind Market Hotel. Rash at 941 Willoughby (greyed out as ghost). Ornithology at 6 Suydam. Mood Ring at 1260 Myrtle. Bossa Nova at 1271 Myrtle (across from Mood Ring). Steam grate beside Popeyes labeled (entry to rat Caffeine Underground). |
| Format | SVG preferred. Or hi-res PNG (3000px wide minimum) for crisp scaling. |
| Time | 60-90 min |
| Notes | Wobbly lines, hatched shadows under JMZ, rough not polished. The map's character is part of the project's voice. |

### 1.2 Rat profile selfies (11 files)

| File | Rat | Style direction |
|---|---|---|
| `assets/selfies/razor-whisker.png` | Market Hotel show kid | Bad selfie outside a venue, ringing ears posture |
| `assets/selfies/dj-nibblers.png` | The cocaine rat | Bodega bathroom mirror, 3am, lipstick smear, flash glare |
| `assets/selfies/pinky-mae.png` | Clout-chaser influencer | Over-filtered, golden hour, snout distorted by close phone |
| `assets/selfies/old-cheese.png` | Longtime resident | 2009 Facebook profile pic energy, never updated |
| `assets/selfies/tabitha-von-wyckoff.png` | Yelp Elite gentrifier | Polished, posed, against exposed brick |
| `assets/selfies/comrade-crumb.png` | CT nepo socialist | Earnest, kuffiyeh, cardboard SOLIDARITY sign |
| `assets/selfies/mira-wong-witherspoon.png` | Wasian rat | Booth at a bar, neon red lighting, half-tired |
| `assets/selfies/wyckoff-six.png` | Polycule (group selfie) | Six rats in a tight group selfie, awkward arrangement |
| `assets/selfies/vintage-vermin.png` | Thrifter | Posed in front of a flea market clothes rack |
| `assets/selfies/edible-eddie.png` | Wrong-edible casualty | Out of focus on purpose, weird angle, time-distorted vibe |
| `assets/selfies/rosemary-rib.png` | Performance artist running Caffeine Underground | Durational portrait, stage lighting, intentional weirdness |

| Field | Value |
|---|---|
| Source | AI generation (DALL-E via ChatGPT, Midjourney, or Flux Schnell on fal.ai free tier) |
| Prompts | See section 9.6 of strategy doc; non-negotiable phrase: *"anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy"* |
| Time | 45-60 min total (3-4 generations per rat, pick best) |
| Notes | Some failures will be funnier than the polished ones. Keep all good candidates; pick during build. |

### 1.3 Venue photos (10 files)

| File | Venue | Source |
|---|---|---|
| `assets/photos/market-hotel.jpg` | Market Hotel | Google Maps reviews (public); their Instagram @markethotelnyc as fallback |
| `assets/photos/mr-kiwi.jpg` | Mr. Kiwi grocery | Google Maps street view; Google Maps reviews |
| `assets/photos/trifecta.jpg` | The Trifecta (D/C/P) | The Joan of Arca viral Instagram photo (Aug 2023) — credit; Google Maps as alternative |
| `assets/photos/jmz-platform.jpg` | JMZ Myrtle-Broadway platform | Google Maps reviews; MTA archive |
| `assets/photos/alley.jpg` | Alley behind Market Hotel | Google Maps street view; or Shoro shoots own |
| `assets/photos/rash.jpg` | Rash (closed) | Andrew Karpan's Grime Square article photos (with credit); their archived Instagram |
| `assets/photos/ornithology.jpg` | Ornithology Jazz Club | Google Maps reviews; their Instagram @ornithologyjazzclub |
| `assets/photos/mood-ring.jpg` | Mood Ring | Google Maps reviews; their Instagram |
| `assets/photos/bossa-nova.jpg` | Bossa Nova Civic Club | Google Maps reviews; their Instagram |
| `assets/photos/caffeine-underground.jpg` | Caffeine Underground (rat) | Karpan's storefront photo from the closing piece + composited rat figure |

| Field | Value |
|---|---|
| Source | Google Maps reviews are public content. Self-shot acceptable. Editorial photos require credit. |
| Format | JPEG, ~1200px wide, ~70% quality |
| Treatment | Apply slight desaturation + grain in CSS (`filter: saturate(0.7) contrast(1.1);`) so all photos read as Yelp profile-photo grade |
| Time | 30 min |

### 1.4 Texture overlay

| Field | Value |
|---|---|
| File | `assets/grain.png` (tileable) |
| Source | Generate from any noise tool (Photoshop, GIMP, online generator); or download CC0 grain texture |
| Use | CSS `body::after` pseudo-element, `mix-blend-mode: multiply`, fixed position |
| Time | 10 min |
| Notes | The single CSS move that takes the page from vector-kitsch to scanned-zine. |

### 1.5 Yelp UI elements (drawn or generated)

| Item | Source | Time |
|---|---|---|
| Star icon (filled) — Yelp red `#D32323` | Hand-draw or use a font icon, off-tilted slightly | 5 min |
| Star icon (empty) | Same | 5 min |
| "Elite Reviewer" badge | Hand-letter "ELITE" in a shaky caps treatment with a small gold rat silhouette | 10 min |
| Useful / Funny / Cool icons | Hand-draw or simplify | 10 min |

---

## 2. Audio

### 2.1 USV samples — general bank (~40 files)

| Field | Value |
|---|---|
| Files | `assets/audio/usvs/usv-001.wav` through `usv-040.wav` |
| Source | Freesound.org (toefur, egomassive, Shyguy014 — all CC0); Pixabay rat sound effects (royalty-free, no attribution) |
| Search terms | "rat squeak," "mouse squeak," "rat vocalization," "rat chitter" |
| Duration | 0.3-1.5 seconds each, trimmed to non-silence |
| Processing | Normalize to -10 dB. Trim leading/trailing silence. Convert to WAV at 44.1 kHz, mono. |
| Tools | Audacity (free) or Reaper |
| Time | 30-45 min source + process |
| License | CC0 / royalty-free |

### 2.2 USV samples — cocaine pleasure bank (10 files for DJ Nibblers)

| Field | Value |
|---|---|
| Files | `assets/audio/usvs-cocaine/usv-c-001.wav` through `usv-c-010.wav` |
| Source | USVSEG dataset on Zenodo: https://doi.org/10.5281/zenodo.3428024 |
| Citation required | Tachibana, R.O., et al. "USVSEG: A robust method for segmentation of ultrasonic vocalizations in rodents." *PLoS ONE* 15, no. 2 (2020): e0228907 |
| Original | 250 kHz sample rate (ultrasonic, inaudible) |
| Processing | Per Avisoft tutorial: change file header sample rate to 22050 Hz. This time-expands the recording so 50 kHz USVs become audible. Trim to 0.3-1.5 second fragments after expansion. |
| Tools | Audacity → Tracks → Resample → 22050 Hz, OR adjust file header in Avisoft tools |
| Time | 30 min |
| Notes | These power DJ Nibblers' entire vocal character. The conceptual core of the project: real lab-rat-on-cocaine pleasure responses, transduced into audible range. Subtle, unlabeled, present. |

### 2.3 JMZ rumble (1 long file)

| Field | Value |
|---|---|
| File | `assets/audio/jmz-rumble.wav` |
| Source | Freesound (search "elevated train," "subway rumble," "MTA"); or Shoro records at the actual platform |
| Duration | 30-45 seconds |
| Processing | Normalize, fade in/out by 1 second on each end, full-spectrum version + low-pass filtered version (for distant pin perspectives) |
| Time | 15 min |
| Notes | The structural beat of the entire piece. Spend 5 extra minutes finding the right one. |

### 2.4 Ambient bed components (~20 atomic samples)

The per-venue ambient beds are *composed in code* from atomic CC0 components. The assets are the components; the compositions are generative. This is the algorithmic shift in practice.

| Component | Source | Used for |
|---|---|---|
| Fluorescent buzz (60 Hz hum) | Freesound | Trifecta, Mr. Kiwi, Dunkin, Checkers |
| Refrigerator hum | Freesound | Mr. Kiwi, Dunkin |
| Fryer hum / oil sizzle | Freesound | Trifecta (Popeyes) |
| Smoke machine hiss | Freesound | Mood Ring, Bossa Nova |
| Distant techno (low-passed) | Free CC0 techno loop, processed | Rash, Mood Ring, Bossa Nova |
| Piano trio bleed | Freesound CC0 piano + brushed snare | Ornithology |
| Spanish-language radio | Freesound | Mr. Kiwi |
| NPR-style podcast | Freesound (talk radio CC0) | Dunkin |
| Door bell / chime | Freesound | Mr. Kiwi |
| Solo cup hits | Freesound | Market Hotel |
| Pigeon coo | Freesound | JMZ platform |
| Wind through metal | Freesound | JMZ platform |
| Plastic crinkle | Freesound | The alley |
| Pipe drip | Freesound | The alley, Caffeine Underground (rat) |
| Distant siren | Freesound | Trifecta, JMZ platform |
| Foil crinkle | Freesound | Caffeine Underground (rat) |
| MTA announcement system (lo-fi degraded) | Freesound or self-record | JMZ platform |
| Brick wall thump (kick muffled through wall) | Generate from CC0 kick + filtering | Bossa Nova, Mood Ring |
| Conversation murmur | Freesound (cafe ambient) | Ornithology, Mr. Kiwi |
| Photobooth flash | Freesound | Mood Ring |

| Field | Value |
|---|---|
| Total | ~20 atomic samples |
| Time | 60-75 min source + process |
| License | All CC0 from Freesound or Pixabay |

### 2.5 Drug-effect samples

| Component | Trigger | Source |
|---|---|---|
| Carbonation fizz | DJ Nibblers says "diet" or "fizzy" | Freesound "soda fizz" or "diet coke open" |
| Notification ping (custom, not Apple) | Pinky Mae says "for the gram" / "tagged" | Pixabay or Freesound (avoid trademarked Apple chime) |
| Coffee shop chatter | Comrade Crumb says "Chase Sapphire" / "my mom" | Freesound cafe ambient |
| Cantonese film snippet (low-volume) | Mira's review baseline | CC0 source or Wong Kar-wai-aesthetic ambience clip; verify license carefully |

| Field | Value |
|---|---|
| Total | 4 small clips |
| Time | 15 min |
| Notes | Cantonese film snippets are the trickiest licensing — if no clean CC0 source exists, generate ambient Cantonese-style atmosphere via a different route (e.g., synth pad with a slight tonal evocation), or skip and let Mira's audio character live in the bar's ambient bed alone. |

---

## 3. Code modules

### 3.1 Per-rat profile parameters (algorithmic)

| Field | Value |
|---|---|
| File | `src/rat-profiles.js` |
| Time | 30-45 min |

Each rat is a parameter object. The audio engine reads these and *procedurally renders* the fixed review text into audio. Same review + same profile = same output. Example structure:

```javascript
const ratProfiles = {
  'razor-whisker': {
    sampleBank: 'usvs',                    // which sample folder
    bankFilter: { lowpass: 800 },          // Tone.Filter applied to bank
    triggerRate: { wordsPerMinute: 130 },  // determines USV-per-word timing
    pitchVariance: 0.5,                    // semitones ± per token (deterministic by index or seeded)
    effects: {                              // keyword → effect mapping
      'ketamine': 'kHole',                  // 200% time stretch + LP @ 800Hz + reverb tail on next 2s
      'K-hole': 'kHole',
    },
    masterVolume: -10,                      // dB
  },
  'dj-nibblers': {
    sampleBank: 'usvs-cocaine',
    bankFilter: null,
    triggerRate: { wordsPerMinute: 160, accelerate: true },  // accelerates over duration
    pitchVariance: 1.5,
    effects: {
      'diet': 'fizz',                       // carbonation sample fires
      'fizzy': 'fizz',
      'silver straw': 'fizz',
    },
    masterVolume: -8,
  },
  'pinky-mae': {
    sampleBank: 'usvs',
    bankFilter: { bitCrush: 4 },            // tinny phone-speaker character
    triggerRate: { wordsPerMinute: 145 },
    pitchVariance: 0.3,
    effects: {
      'tagged': 'notificationPing',
      'for the gram': 'notificationPing',
      'IMMACULATE': 'notificationPing',
    },
    masterVolume: -10,
  },
  // ...11 total
};
```

The engine: at play, tokenize the fixed review text. For each token, schedule a USV from `sampleBank` (filtered through `bankFilter`) at timestamp `(tokenIndex / wordsPerMinute) * 60 * 1000` ms. For each effects keyword found in the review, schedule the effect at the timestamp of that keyword's first occurrence. Render via `Tone.Transport`. The same review always renders the same way (or with seeded variation if a `seed` parameter is added).

### 3.2 Audio engine

| Field | Value |
|---|---|
| File | `src/audio-engine.js` |
| Time | 90 min |

Modules within:

- `SamplePlayer` — loads USV samples into `Tone.Sampler` instances
- `RatGenerator(profile)` class — given a profile, runs an algorithmic composition: schedules USV triggers via `Tone.Loop`, applies pitch variance via `Tone.PitchShift`, fires effect events probabilistically per `Tone.Transport` ticks, modulates tempo if profile says so
- `JMZScheduler` — the rumble fires every 60-90 seconds (random within range), triggers `Tone.Compressor` sidechain on master bus
- `AmbientBed(venueProfile)` — generates per-venue bed by layering atomic components with probabilistic variation events
- `MasterMix` — manages cumulative pin layers; visited pins stay active

### 3.3 Oscilloscope

| Field | Value |
|---|---|
| File | `src/oscilloscope.js` |
| Time | 30 min |

Web Audio API `AnalyserNode` connected to a `<canvas>` element. Renders real-time waveform during review playback. Color responds to drug-event triggers (rave green flash on K-hole, etc.) but baseline is the dirty newsprint color.

### 3.4 Subtitle engine

| Field | Value |
|---|---|
| File | `src/subtitles.js` |
| Time | 30 min |

Word-by-word reveal synced to audio playback. Algorithm: total review duration / word count = ms per word. Words fade in at calculated timestamps. Subtitle styled small and low-opacity at the modal bottom. ON by default per Shoro's call (reading along is part of the comedy).

### 3.5 UI / modal system

| Field | Value |
|---|---|
| File | `src/ui.js` |
| Time | 45 min |

Pin click handlers, modal open/close, play/pause controls, subtitle toggle.

### 3.6 Generative continuous composition

| Field | Value |
|---|---|
| File | `src/ambient-master.js` |
| Time | 30 min |

Runs from page load. All venue beds at -30 dB. USV bank triggers from a master sampler every 5-15 seconds (randomized). JMZ rumble cycles independently. Pin visits raise specific bed volumes and activate that pin's RatGenerator.

### 3.7 Headphones tag (Remedy 6)

| Field | Value |
|---|---|
| File | inline in `index.html` |
| Time | 5 min |

Small text element at top: *"Headphones recommended. This is a sound piece."* Fades out after 5 seconds via CSS animation.

---

## 4. Content (text)

### 4.1 Rat bios (11)

| Field | Value |
|---|---|
| File | `src/content/rats.js` |
| Status | 6 drafted in strategy doc; 5 to write |
| Time | 30 min |

### 4.2 Reviews (8-9)

| Field | Value |
|---|---|
| File | `src/content/reviews.js` |
| Status | 8 drafted in strategy doc; 0-1 to write |
| Time | 60-90 min if writing remaining; 15 min if just polishing |

Pin-to-rat assignments (locked):

| Pin | Rat |
|---|---|
| Market Hotel | Razor Whisker |
| Mr. Kiwi | Comrade Crumb |
| The Trifecta | Old Cheese (primary) + Edible Eddie (cameo) |
| JMZ platform | Pinky Mae Pellet |
| The alley | wordless (no review) |
| Rash (ghost) | wordless or one-line stub |
| Ornithology | The Wyckoff Six |
| Mood Ring | Mira Wong-Witherspoon |
| Bossa Nova | DJ Nibblers |
| Caffeine Underground (rat) | Rosemary Rib |

### 4.3 Venue metadata (10)

| Field | Value |
|---|---|
| File | `src/content/venues.js` |
| Time | 15 min |

Per venue: display name, real address, status (open / closed / rat-only), audio bed components list, photo path, map coordinates (x,y on the SVG).

### 4.4 About / epigraph page

| Field | Value |
|---|---|
| File | inline section in `index.html` or modal triggered from a small "about" link |
| Time | 15 min |

Content: Tomey epigraph quote with credit, project description, Grime Square credit, USV dataset citation, headphones note, brief algorithmic-philosophy summary (or link to PHILOSOPHY.md if hosted in repo).

### 4.5 Algorithmic philosophy manifesto

| Field | Value |
|---|---|
| File | `PHILOSOPHY.md` (in repo); excerpted on the About page |
| Time | 30 min |

A 4-6 paragraph manifesto articulating the project's generative aesthetic. What the rules are. How emergent beauty is supposed to work. Why this is sound art rather than a website. The "meticulously crafted" framing applies. Parameters should read as inevitable. Borrows from the algorithmic-art skill's framing.

---

## 5. Documentation

| File | Status | Notes |
|---|---|---|
| `bushwick-nightcrawlers-strategy.md` | v1.0 done; needs v1.1 update for algorithmic shift | Existing |
| `ASSETS.md` (this doc) | v1.0 done | Existing |
| `PHILOSOPHY.md` | To draft | 30 min |
| `README.md` (in repo) | To draft | Project description, run instructions, deploy steps, credits. 15 min |

---

## 6. Citation data

### 6.1 Project epigraph

> *"The vermin aren't the customers."* — Aaron Tomey, "Ridgewood's Rodent Takeover," *Grime Square*, April 14, 2026.
> https://grime-square.com/2026/04/14/ridgewood-restaurant-health-violations-salvos-aunt-ginnys/

### 6.2 Grime Square credit (in About page)

> Cultural texture, voice register, and venue research draws on *Grime Square* (https://grime-square.com), particularly pieces by Andrew Karpan, Aaron Tomey, Brendan Davey, Emma Davey, Jake Goetz, and Noah Lipton, 2026. The Karpan-Tomey writing register is the model the rat reviews channel.

### 6.3 USV scientific dataset

> Tachibana, R.O., Kanno, K., Okabe, S., Kobayashi, K.I., and Okanoya, K. "USVSEG: A robust method for segmentation of ultrasonic vocalizations in rodents." *PLoS ONE* 15, no. 2 (2020): e0228907. Dataset: https://doi.org/10.5281/zenodo.3428024

### 6.4 Cocaine-USV connection (cited if asked, not foregrounded)

> 50 kHz ultrasonic vocalizations recorded during rat cocaine self-administration are documented as positive affective signals. See: Avvisati et al., 2024 (UTEP Moschak lab); Vargas-Perez et al. on USV emissions during heroin and cocaine self-administration in different settings.

### 6.5 Audio source attribution (in repo `CREDITS.md`)

> USV samples (general bank): Freesound.org contributors toefur (CC0), egomassive (CC0), Shyguy014 (CC0). Specific URLs in `CREDITS.md`.
>
> Ambient components: Freesound.org contributors and Pixabay royalty-free sound effects (no attribution required, attributed anyway as good practice).
>
> USV samples (cocaine bank): USVSEG dataset, Tachibana et al. (academic license, citation required).
>
> Cantonese film snippet: [verify and credit if used].

---

## 7. Hosting & deployment

| Item | Status |
|---|---|
| GitHub repo | Create (Shoro decides public/private) |
| Vercel project | Create, link to GitHub |
| Domain | Default `bushwick-nightcrawlers.vercel.app` for tonight; custom domain Phase 2 |
| Environment variables | None for the static piece. Aug 2026: `KV_REST_API_URL`/`KV_REST_API_TOKEN` (Upstash Redis via Vercel Marketplace, store `upstash-kv-aero-basket`) power `api/reactions.js` — the shared visitor-reaction counters. First runtime dependency; the front-end degrades to local-only counts if the API is absent. |
| Build command | None (pure static HTML/JS) |

---

## 8. Phase 2 / deferred

Items intentionally cut from tonight's build but documented for later:

- ~~**Spatial panning** — pin position to stereo position~~ **Shipped Aug 2026** via `Tone.Panner` (not `PannerNode`): `src/audio/spatial.js` derives pan from venues.js `mapCoordinates.x`, normalized across the pin spread to ±0.65. Rat voices + venue beds pan; site-wide layers (JMZ rumble, traffic, train) stay centered; reverb send stays diffuse.
- **USV-only listen mode** (no subtitles, oscilloscope only) — "concert mode"
- ~~**Phoneme-to-USV mapping**~~ **Syllabic synthesis shipped behind `?voice=syllabic` (Aug 2026)** — spike showed contour classes aren't perceptually legible, so the design simplified to syllable-count mapping with word-hash determinism (same word → same squeak run, both playback modes) plus subtle contour seasoning (openings lean trill, closings fall). Cocaine register stays word-level by design — the drug register smears the language. Feature data: `src/audio/usv-features.js` via `scripts/analyze_usv_features.py`. Shipped user-facing as the footer mode 'in their tongue' (V71/V72 — it replaced 'on record': syllabic playback is fully deterministic, so it absorbs the seeded mode's role); `?voice=syllabic` remains as a dev override.
- **Live 311 rat sightings data** via Socrata API — affects ambient bed density per location in real time
- **More rat-only pins** — Smaller Smalls, Bossa Nova Cellar Club, Brewery Archives, the Wyckoff Six's basement, the Rash basement
- **User parameter exploration UI** — sliders to adjust per-rat profiles in real time (algorithmic-art skill influence)
- **Seed sharing** — shareable seed URLs for specific algorithmic playbacks
- **Multiple corridors expansion** — beyond Myrtle-Broadway
- **Transplant Draft format** — for new rat character introductions
- **Phase 2 visual variations** — different times of day affect visual lighting and audio bed density

---

## 9. Total time budget for one-night build

| Block | Time |
|---|---|
| Setup + Vercel + GitHub | 20 min |
| Hand-drawn map | 75 min |
| Audio asset sourcing + processing | 2 hr |
| Audio engine + per-rat profiles | 2.5 hr |
| Oscilloscope + subtitle engine | 1 hr |
| UI / modal system | 45 min |
| Reviews polish + remaining writes | 75 min |
| AI rat selfies | 60 min (can run in parallel during other blocks) |
| Venue photos | 30 min (can run in parallel) |
| About page + algorithmic philosophy | 45 min |
| Polish + deploy | 30 min |

**Total focused time: ~9-10 hours.** Some blocks (selfies, photos) can run during other work.

If pressed under 8 hours total: cut the algorithmic philosophy doc to a single paragraph on the About page (saves 25 min); skip writing 1-2 reviews (saves 30 min); use minimal ambient bed components per venue (saves 30 min). Net: ~7.5 hours.
