# STRATEGY.md updates — paste into existing STRATEGY.md

The following revises §1 and §10.4 and adds §10.5. Drop into the
strategy doc in the appropriate location, replacing existing §1 and
§10.4 if they conflict.

---

## §1 — Concept and playback framing (revised)

The piece sonifies rat speech. Rats don't archive their language —
their vocalizations are oral, ephemeral, never twice the same. The
audio engine reflects this: by default, playback is generative.
Different sample selection, different timing each click. Same review,
new performance.

A user-facing footer toggle lets visitors fix a playback for sharing
or study. Two modes:

- **'in the moment'** (default): standard `Math.random` per click.
  Each play differs.
- **'on record'**: seeded RNG keyed off `reviewerId + review.text`.
  Same review = same audio every time.

Implementation lives in `src/audio/playback-mode.js`. RatGenerator
reads the mode at `start()` time; mid-playback toggles do not affect
the current playback.

The earlier framing of the engine as "procedural / deterministic by
default" is replaced by this dual-mode model. Determinism is opt-in,
not the baseline.

---

## §10.4 — RatGenerator behavior (revised)

The shift in mental model from earlier drafts: sample duration IS the
speech timing, not a fixed inter-word interval. A 300ms sample produces
fast staccato speech; a 1.5s sample produces drawn-out sustained
speech. Different rats sound different partly because their banks have
different length distributions.

**Pre-process at load time.** Each sample is categorized into duration
tiers when the bank loads:

- **Short** (< 400ms): rapid speech, quick reactions
- **Medium** (400-900ms): conversational pace
- **Long** (900-2000ms): drawn out, weary, sustained
- **Extra-long** (> 2000ms): rare, used sparingly for end-of-sentence
  emphasis or pause moments

Each sample carries its tier in the audio bank manifest, computed
from the loaded ToneAudioBuffer's duration property.

**Word-context-driven selection.** When picking a sample for each word
in a review, the tier is filtered based on word position and emphasis:

- Mid-sentence words: short or medium tier
- Words preceding commas or em-dashes: medium tier (small natural pause)
- Sentence-ending words (period, exclamation, question): long or
  extra-long tier eligible (full pause for the sample's tail to ring out)
- Parenthetical asides: short or medium tier (fast aside-pace)
- All-caps words (emphasis): pull from medium/long tier for impact

The keyword scanner can override tier — a screamed "IMMACULATE" gets
long-tier samples regardless of sentence position.

**Scheduling logic.** Instead of "play next word after fixed delay,"
the engine uses "play next word after current sample ends, plus
optional pause." Consequences:

- Pace is organic: emerges from sample selection rather than a forced
  timer. Tempo is data-driven, not metronome-driven.
- Sentence-end pauses: add 200-400ms buffer after sentence-ending samples
- No overlap within a single rat's review. Overlap is reserved for the
  cumulative master-mix layer (§12.5) where multiple rats stack.
- Total review duration: variable but bounded. Short reviews finish
  faster; long reviews take longer; characters with longer samples
  take longer to speak.

**Per-rat character emerges from bank composition.** Each rat profile
specifies a tier-skew filter — eligible bank subset is computed at
load time:

| Rat | Tier skew | Effect |
|-----|-----------|--------|
| Old Cheese | medium/long dominant | Weary longtime resident |
| DJ Nibblers | short dominant + occasional long | Manic, occasional emphasis |
| Comrade Crumb | medium dominant | Lecturing, regular pacing |
| The Wyckoff Six | short across all six voices | Polycule unison stays in sync |
| Razor Whisker | short/medium with chaotic length distribution | Show-kid energy |
| Pinky Mae | short with occasional long | Manic + influencer crash moments |

Other rats default to the full bank without skew.

**Word-emit events.** As each word's sample begins playing, the
generator emits an event keyed to the word's index in the review.
The modal subscribes and applies word-level highlighting via its
highlightWord(N) API (§9.4 modal layout).

---

## §10.5 — Cocaine bank distribution strategy (new)

The cocaine USV bank — sourced from Zenodo's pleasure-response USV
recordings (Tachibana et al., USVSEG, PLoS ONE 2020) — contains ~135
samples after manual curation. Rather than reserving the bank
exclusively for DJ Nibblers, it functions as a sonic register that
some rats inhabit fully, others touch occasionally, and any rat can
hit briefly under specific verbal cues.

Three layers:

**Layer 1: per-rat bank weight.** Each rat profile specifies a
weighted mix between the general bank and the cocaine bank. When
RatGenerator picks a sample for a word, it rolls against the rat's
mix to choose which bank to draw from.

| Rat | Cocaine % | Rationale |
|-----|-----------|-----------|
| DJ Nibblers | 100% | Her character IS this register |
| Pinky Mae Pellet | 65% | Manic influencer/influenza energy fits |
| Razor Whisker | 30% | Chaotic show-kid energy with kHole flickers |
| Edible Eddie | 18% | Wrong-edible casualty, glitches into hyperreal |
| All other rats | 0% | General register only |

**Layer 2: keyword-triggered swap.** Any rat speaking specific trigger
words pulls from the cocaine bank for that word, regardless of their
default mix. Same hook as the keyword-effects architecture (§10.4)
but with bank-swap as the action instead of effect-trigger.

Initial trigger word list (curated from review content; refine based
on actual review.text scan):

cocaine, fizzy, diet, snow, white, ket, ketamine, powder, bump, rail,
key, molly, edible, kHole, ket-hole, viral, sniff, IMMACULATE

A rat with 0% default cocaine mix briefly crosses into the cocaine
register on a single trigger word. Pinky Mae says "viral" — that
specific word gets a cocaine sample even though the rest of her review
uses her normal weighted mix. Subtle. Reads as authentic.

**Layer 3: length tiers within the bank.** Per §10.4 (revised), each
bank's samples are pre-classified into duration tiers. RatGenerator
filters by tier based on word context, and the rat's tier-skew
preference applies to whichever bank is being drawn from. So DJ
Nibblers' 100% cocaine + short-tier-skew gives manic short cocaine
USVs throughout her review; her sentence endings draw from cocaine's
longer tier for emphasis tails.

---

## Implementation note for rat-profiles.js

Each rat profile object should specify:

```
{
  id: 'dj-nibblers',
  cocaineRatio: 1.0,          // Layer 1
  tierSkew: 'short-dominant', // Layer 3 — from §10.4 table
  keywordTriggers: { ... }    // Layer 2 — populated from §10.5 list
                              // and any rat-specific triggers
}
```

The audio engine reads these profiles to construct each RatGenerator
at modal-open time.
