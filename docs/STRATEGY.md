# The Bushwick Nightcrawlers

*A sound piece by Shoro Roy.*

> *"The vermin aren't the customers."* — Aaron Tomey, *Grime Square*, April 2026.

---

## 0. Project documentation, v1.1

This is the working specification. It captures concept, cast, venues, sonification system, tech stack, build plan, and tradeoffs. Updated as decisions are made. The companion artifact is the build itself: a single web page deployed to Vercel.

**v1.1 changes from v1.0:**
- Reviews rewritten from rat POV (the rats are not customers; they're under floorboards, in dumpsters, up through drainpipes, in basements). Tomey's epigraph holds.
- Sonification reframed as procedural rendering: fixed review text + per-rat parameter profile = deterministic audio composition. Effects fire on keyword markers in the text, not stochastically.
- Audio-centrality remedies confirmed: implement 1, 4, 5, 6, 7. Cut 2 (spatial panning) and 3 (audio-led entry) to Phase 2.
- All 11 AI rat-selfie prompts drafted.
- Section 10 expanded with full tech stack research keyed to Claude Code as build environment.
- Section 12 rewritten as a Claude Code-oriented build plan with per-task scoping.

---

## 1. Concept

**One-liner.** *The Bushwick Nightcrawlers* is a sound piece scored for one Bushwick intersection at night, narrated as Yelp reviews by the rats who live there.

The user lands on a hand-drawn top-down map of the Myrtle-Broadway JMZ intersection. Ten pins. Each pin is a venue. Each venue has a rat reviewer. Click a pin and the rat's review opens: text, photo, star rating, in the visual register of a Yelp review card. Click play and the rat speaks. A real rat ultrasonic vocalization, pitch-shifted into the audible range, triggered per word. Behind it: the venue's ambient bed. Above it: the JMZ rumbling overhead every sixty to ninety seconds, sidechain-ducking everything else. As you visit more pins, audio accumulates. By the end of an exploration, you're hearing all ten venues at once, with the train as their pulse.

**The two-layer claim.** The piece lives in two parallel scenes. *Human Bushwick* is the surface layer: the bars, the bodega, the closed clubs, the fast-food trifecta where everyone ends up at 4am. *Rat Bushwick* is the second scene, the rats' own nightlife, hosted in spaces the humans abandoned. When Caffeine Underground announced its closure in March 2026, the rats kept the keys. Their open mic is now Tuesdays. The rats aren't tourists in human Bushwick; they have a scene of their own.

**Literary precedent.** Aaron Tomey's "Ridgewood's Rodent Takeover" published in *Grime Square* on April 14, 2026 articulated the project's argument before the project existed: *"There's no other animal more emblematic of NYC than the rat,"* *"the rodent is under assault from the city that made them so swaggering,"* *"it's healthy to be grimy."* The piece treats Tomey's essay as its epigraph. Andrew Karpan and Aaron Tomey's voice register at *Grime Square* (observational, footnoted, ref-heavy, slightly cruel without being mean) is the writing model the rat reviews channel.

**Why the rats.** A Scientific American piece on NYC rat communication notes that one observed lab rat *"soliloquized alone inside a garbage bag — perhaps offering a Yelp review for passing comrades."* The project takes that throwaway image as a literal premise. The 50 kHz ultrasonic vocalizations rats emit during pleasure responses (documented in cocaine self-administration studies) are inaudible to humans without transduction; pitched down, they become a rat's voice. The piece transduces them.

---

## 2. The Thin Place — geographic anchor

**One intersection.** The piece anchors to Myrtle-Broadway in Bushwick. Within a hundred-meter radius:

- **Market Hotel** at 1140 Myrtle Avenue, second floor, above Mr. Kiwi grocery. DIY all-ages venue, originally a 1960s Latin nightclub called the Bristol Room before the Happyland-era enforcement crackdown closed the second floor for two decades. Reopened by Todd Patrick in 2008, shut down 2010, relicensed 2018. A window over the JMZ tracks. Anti-corporate ethos.
- **Mr. Kiwi grocery**, ground floor of the same building. 24/7 bodega.
- **The Trifecta** — Dunkin Donuts, Checkers, Popeyes side by side under the elevated tracks. The corner that became a meme: "the Bermuda Triangle of Bushwick," "the thin place where the veil is thinnest," the corner everyone ends up at after a bender. The Popeyes site sits on the literal foundation of the old Trommer's Brewery, demolished in 1956 (per Brendan Davey, *Grime Square*, April 2026). Ten percent of all American beer was once produced on Bushwick's Brewer's Row.
- **The JMZ tracks** elevated above the intersection.
- **The alley behind Market Hotel**, where the soliloquy happens.
- **Rash** at 941 Willoughby Ave, closed early 2026 (the Hole Contest era).
- **Ornithology Jazz Club** at 6 Suydam Street, opened 2021, formerly the queer bar Bodeguita.
- **Mood Ring** at 1260 Myrtle Avenue.
- **Bossa Nova Civic Club** at 1271 Myrtle Avenue, literally across the street from Mood Ring.
- **Caffeine Underground (rat)**, beneath the Popeyes via the steam grate by the dumpster. The rats relocated when Ian Ford closed the human venue in March 2026.

**The Bermuda Triangle frame.** The whole map is the Bermuda Triangle. The Trifecta is one specific pin within it. The page header reads: *Reviews from the thin place. Six blocks of Bushwick where the veil is real.*

**Why this specific corner.** Every Bushwick subculture passes through this intersection at 4am. Rave kids leaving Bossa Nova for Popeyes biscuits. DIY-show kids spilling out of Market Hotel onto the J platform. Drug casualties failing to figure out which staircase. Clout-chasers documenting the whole thing for the gram. Old residents who remember when the Popeyes was a beer hall. The intersection is already a stage. The rats are the only ones up there every night.

---

## 3. Sonification system

The audio layer is the piece. The visual layer is its cover. Three audio strata, each doing different work.

### 3.1 The JMZ rumble — structural beat

A 30-45 second pre-recorded train rumble triggers every 60-90 seconds regardless of which pin is active. During the rumble, every other audio element ducks via sidechain compression. The rumble's amplitude is the trigger; all venue beds and USV samples compress against it. The ducking is the pulse of the piece. It's what techno does. It's what the train does to the conversation on the J platform. Each rat's loop briefly quantizes to the rumble's BPM for ten seconds, then drifts back to its own time. The conceptual claim: Bushwick is a place where everyone lives at their own tempo, but the train passes and for ten seconds everyone is on the same beat.

### 3.2 Per-venue ambient bed

Each pin has a 30-60 second loop with three or four generative variations that swap probabilistically: a Solo cup drop, a siren, a shout, a pigeon, an ambulance. Pitch drifts ±2 semitones over five minutes; tempo varies ±5%.

| Pin | Bed character |
|---|---|
| Market Hotel | Muffled live show through floorboards, J overhead through the venue's window, Solo cup hits, faint snare bleed |
| Mr. Kiwi | Refrigerator hum, fluorescent buzz, distant Spanish-language radio, door bell every 30-60s |
| The Trifecta | Three fluorescent pitches layered (~58Hz, 60Hz, 62Hz), fryer hum from Popeyes, refrigerator hum from Dunkin, NPR through Dunkin's tinny speaker, sirens distant |
| JMZ platform | Wind through the steel girders, lo-fi degraded announcement system, pigeon coo |
| The alley | Near-silence with occasional plastic crinkle and a pipe drip |
| Rash (ghost) | Muffled techno from BEHIND a locked door — the absence is the audio |
| Ornithology | Muffled piano trio bleed, brushed snare, low conversation murmur, vegan kitchen sounds, late-night jam intensity that builds toward 2am |
| Mood Ring | Berlin techno through brick (low-pass filter at 400Hz), smoke machine hiss, photobooth flash, faint Cantonese film-snippet bleed at low volume |
| Bossa Nova | Harder four-on-the-floor through brick (low-pass at 800Hz), more sub bass, kick that DOESN'T sync to the JMZ — Bossa's beat fights the train |
| Caffeine Underground (rat) | No human voices. Higher USV density. Faint upstairs ghost of human open mic. Basement reverb. Foil crinkle. Polyrhythmic rat-radio metallic synth at high frequencies |

### 3.3 Per-rat audio fingerprint

When a rat's review plays, their audio character takes over the mix. The rats sound different from each other.

| Rat | Audio character | Implementation |
|---|---|---|
| Razor Whisker | Low-pass filtered, muddy, USVs come through floorboards | `Tone.Filter(800, 'lowpass')`, 110 bpm kick from "the show downstairs" |
| DJ Nibblers | Erratic 140→170 bpm accelerating, high-end emphasis, real cocaine-USVs from Zenodo dataset, carbonation fizz layered | `Tone.Player` for fizz, `Tone.Sampler` with USV bank, tempo automation |
| Pinky Mae Pellet | Tinny phone-speaker, AAC artifacts, notification chimes, faint coughs/sneezes between phrases (the influenza is the joke) | `Tone.BitCrusher(4)`, AirPods compression, small cough sample triggered on "viral" / "sniff" |
| Old Cheese | Warm tape hiss, faint merengue bleed from the Bristol Room era | `Tone.Vibrato`, low-bitrate sample, longer silences |
| Tabitha von Wyckoff | Clean studio quality (the contrast is the joke) | unprocessed, NPR-booth EQ |
| Comrade Crumb | Slight overcompression, faint acoustic guitar drone, podcast register | `Tone.Compressor(-12, 8)`, subtle guitar drone |
| Mira Wong-Witherspoon | Cantonese film-snippet bleed at low volume, slight reverb | low-volume secondary `Tone.Player` |
| The Wyckoff Six | Six pitch-shifted USV voices, polyrhythmic | six `Tone.PitchShift` instances at consonant intervals |
| Vintage Vermin | Vinyl crackle, 33rpm degradation | crackle texture via `Tone.Noise`, slight wow/flutter |
| Edible Eddie | Time-stretched, occasional glitch skips | `Tone.GrainPlayer`, random `Tone.PitchShift` events |
| Rosemary Rib | Single sustained drone, sparse USVs treated as found sound | `Tone.Oscillator` sine drone, USVs at long intervals |

### 3.4 Drug references as sonic events

| Trigger | Audio |
|---|---|
| DJ Nibblers' entire character | Cocaine-pleasure USVs from Zenodo USVSEG dataset, pitch-shifted down to audible. Subtle, never named. |
| Razor Whisker says "ketamine" | Next 2 seconds time-stretch to 200%, low-pass at 800Hz, slight reverb tail. The K-hole as a literal audio figure. |
| Pinky Mae says "for the gram" or "tagged" | Apple notification ping. |
| Pinky Mae says "viral" or "sniff" | Small cough/sneeze sample (the influencer-as-influenza pun). |
| Edible Eddie says any time-word ("morning," "hours," "yesterday") | Audio glitches mid-syllable. |
| Comrade Crumb says "Chase Sapphire" or "my mom" | Coffee-shop ambience kicks up. The coded shame. |

### 3.5 Mix structure

Ambient beds quiet (-20 dB). USVs prominent (-10 dB). JMZ rumble loud (peaks at -3 dB during a passage). The rats whisper, the train roars, the city is soft, the train is the heartbeat. Between reviews, all venue beds murmur faintly (-30 dB). Never full silence.

---

## 4. Audio centrality — the problem and the remedies

The risk: the project reads as a website with audio rather than as a sound piece with a visual interface. Visuals are immediately apparent; audio is supportive. A user who mutes the audio still gets most of the experience. That breaks the claim.

Seven remedies. Apply in combination.

### Remedy 1: Cumulative audio (high impact, ~30 min build)

Pin audio doesn't stop when the review modal closes. Each pin you visit adds a layer to the master mix. By the end of an exploration, the user is hearing all ten venues at once with the JMZ as their shared pulse. Each pin gets a `MUTE/UNMUTE` toggle for selective control. The master mix sidechain-ducks against the JMZ unchanged.

Implementation: persistent `Tone.Player` and `Tone.Sampler` nodes per pin. The modal's close action lowers the pin's volume slightly but doesn't dispose. A small visible indicator on each map pin shows "playing" state.

### Remedy 2: Spatialized audio map (medium impact, ~1 hr build)

Each pin's audio is positioned in stereo according to its position on the visual map. Pins on the right pan right; pins farther from center get more low-pass filtering (further away). Cursor proximity affects each pin's volume. Moving the cursor over a pin temporarily raises its volume.

Implementation: Web Audio API `PannerNode` per pin. Map x-position to pan (-1 to 1). Cursor distance maps to per-pin gain via a simple inverse-square falloff.

Defer to Phase 2 if time-pressed. Strong upside but real implementation cost.

### Remedy 3: Audio-led entry (high impact, ~20 min build)

The first 30 seconds of the page are audio-only. The visual map fades in slowly from black. A JMZ rumble passes; ambient beds murmur; a few USV samples trigger. The user is forced to listen first. The intersection sounds before it shows.

Implementation: page-load JavaScript starts a 30-second master sequence. Body opacity rises from 0 to 1 over those 30 seconds via CSS transition. Cursor doesn't function during the entry. Only the audio plays.

### Remedy 4: USV-spoken review mode (high impact, ~1 hr build)

The review modal has two tabs: READ and LISTEN. READ shows the full text statically. LISTEN is the default. It plays the rat's USVs in time with the review while subtitles fade in word by word. The audio is *procedurally rendered* from the fixed review text by the rat's parameter profile: USV samples trigger at calculated intervals (review length / word count = ms per word), pitched and filtered per profile, with effects fired at keyword markers in the text. Same review always sounds the same. The algorithm is in the rendering, not in the content.

Implementation: each rat profile defines `sampleBank`, `triggerRate`, `pitchVariance`, `bankFilter`, and an `effects` map of `{ keyword: effectType }`. At play time, the engine tokenizes the review, schedules a USV per token at the calculated timestamp, and schedules effect events wherever keyword markers appear. Subtitles fade in at the same per-token timestamps. Oscilloscope renders the live waveform via `AnalyserNode` to canvas.

**This is now the primary mode for tonight, not a Phase 2 deferral.** The piece is sound art unambiguously when LISTEN is the default and READ is the toggle. Subtitles ON by default per Shoro — reading along is part of the comedy.

### Remedy 5: Generative continuous composition (high impact, ~30 min build)

Even with no user interaction, the city sounds. The JMZ keeps passing. Ambient beds of all venues murmur faintly. A master USV bank triggers samples every 5-15 seconds. The page has its own time. User clicks layer on top of an autonomous composition.

Implementation: master `Tone.Loop` runs from page load. All pin beds at -30 dB by default. Pin visits raise specific beds to -20 dB. JMZ on its 60-90s cycle independently.

### Remedy 6: Headphones framing (low effort, 5 min build)

A small text tag at the top of the page on first load: *"Headphones recommended. This is a sound piece."* Fades after 5 seconds. Sets expectation.

### Remedy 7: Audio-first positioning (zero build cost, framing only)

The about page, project description, case study language, and portfolio framing all describe this as a sound piece. The interactive interface is its score. The visual is its cover. Position the audio as primary.

### Recommended combination for tonight

Implement 1, 4, 5, 6, 7. Cut 2 (spatial panning) and 3 (audio-led entry) to Phase 2. Total additional build cost: ~120 minutes on top of the existing audio plan, with the auto-typing engine cut to recover ~30 minutes. Net effect: the piece is sound art with a procedural-sonification engine at its core, not a website with audio.

---

## 5. Cast — eleven rats, write nine, cut two

| # | Rat | Type | Voice | Audio fingerprint |
|---|---|---|---|---|
| 1 | Razor Whisker | Market Hotel show kid | Earnest, bass-response-of-the-floor | Low-pass mud |
| 2 | DJ Nibblers | The cocaine rat | Manic, run-on, "i only do diet" | Cocaine USVs + fizz |
| 3 | Pinky Mae Pellet | Influencer-rat (in both senses — she's spreading influenza) | Lowercase, hashtags, lighting notes, occasional sniffles | Phone speaker + chimes + faint coughs |
| 4 | Old Cheese | Pre-gentrification longtime resident | Sad, accusatory, references the Bristol Room and Trommer's Brewery | Tape hiss + merengue bleed |
| 5 | Tabitha von Wyckoff | Yelp Elite gentrifier from Manhattan | Performative authenticity | Clean studio |
| 6 | Comrade Crumb | Wystan Pemberton-Whitford III, CT nepo socialist | DSA-Twitter cadence with reveals | Compressed podcast |
| 7 | Mira Wong-Witherspoon | Wasian, gets it from both sides | Self-aware, ambivalent | Cantonese film bleed |
| 8 | The Wyckoff Six | Six-rat polycule, co-signed reviews | "We," processed, four-hour debriefs | Six pitch-shifted voices |
| 9 | Vintage Vermin | Thrifter / curator | Aesthetic-era reviews of trash | Vinyl crackle |
| 10 | Edible Eddie | Wrong-edible casualty | Time-distorted, repetitive, glitching | Time-stretched grain |
| 11 | Rosemary Rib | Performance artist who took over Caffeine Underground | Durational, the venue is the piece | Sustained drone |

**Cut order if time-pressed:** Tabitha von Wyckoff first (her territory overlaps Pinky Mae), then Vintage Vermin (territory is solid but less load-bearing). Minimum nine reviews; eight is the floor.

**Drug-reference distribution.** DJ Nibblers owns cocaine. Razor Whisker mentions ketamine casually. Pinky Mae references both as accessories. Comrade Crumb is sober and posts about it. Edible Eddie isn't on edibles but is pretending he was for legal reasons. Direct references throughout.

---

## 6. Venues — ten pins

| # | Pin | Address | Reviewer | Photo source |
|---|---|---|---|---|
| 1 | Market Hotel | 1140 Myrtle Ave (2F) | Razor Whisker | Their Instagram @markethotelnyc; Brooklyn Daily archive; Andrew Karpan Grime Square photos |
| 2 | Mr. Kiwi grocery | 1140 Myrtle Ave (1F) | Comrade Crumb | Google Street View; own phone photo |
| 3 | The Trifecta (D/C/P) | Myrtle Ave + Broadway | Old Cheese (brewery angle) + Edible Eddie (cameo) | The Joan of Arca viral photo (Aug 2023); Google Street View; meme image archive |
| 4 | JMZ platform | Above the intersection | Pinky Mae Pellet | MTA archive; Flowrmeadow tweet; own photo |
| 5 | The alley | Behind Market Hotel | (no review — wordless pin) | Google Street View; own photo |
| 6 | Rash (ghost) | 941 Willoughby Ave | (no review — closed; one-line stub) | Andrew Karpan's Grime Square photos; their archived Instagram |
| 7 | Ornithology Jazz Club | 6 Suydam St | The Wyckoff Six | Their Instagram @ornithologyjazzclub; BKMag April 2022 article photos |
| 8 | Mood Ring | 1260 Myrtle Ave | Mira Wong-Witherspoon | Their Instagram; Wong Kar-wai-aesthetic stills |
| 9 | Bossa Nova Civic Club | 1271 Myrtle Ave | DJ Nibblers | Their Instagram; Resident Advisor; Remezcla 2014 article |
| 10 | Caffeine Underground (rat) | Beneath Popeyes via steam grate | Rosemary Rib | Andrew Karpan's photo from the closing piece + AI-overlaid rat figure |

**Caffeine Underground (rat) renders below street level on the map.** A dotted line drops from the steam grate beside the Popeyes dumpster down to the pin. Clicking it descends the visual frame. The visual claims the lore.

**The alley is wordless.** Just the soliloquy audio (a single sustained rat USV, plastic crinkle, pipe drip, distant JMZ). No review card. The quietest moment in the piece, and probably its strongest.

**Photo sourcing strategy.** For portfolio publication: take own photos where possible (Shoro is in NYC, all venues are walkable). Failing that, Google Street View screenshots are widely accepted. For specific archived moments (Rash interior, Caffeine Underground open mic), credit *Grime Square* and Andrew Karpan via Instagram tag. Each photo gets 4-second exposure; treat them with a slight sepia/desaturation filter so they read as Yelp profile-photo grain rather than as glossy editorial.

---

## 7. Rat-scene worldbuilding

The rats inherited the spaces humans abandoned. After Caffeine Underground announced its closure on March 30, 2026, the rats kept the keys. The article was titled "Caffeine Underground Goes Underground." They took it literally. The rat version operates from the foundation of the old Trommer's Brewery, beneath the Popeyes, accessed via the steam grate by the dumpster. Tuesday open mic still runs. DJ classes are taught by Nibblers. Magic: The Gathering pulled twelve rats last week.

Other rat-only spaces, referenced in reviews but not pinned (Phase 2 expansion):

- **The Wyckoff Six's basement** — a polycule's apartment behind a wall in a triplex on Wyckoff. Six rats, three pairs, one shared Google Calendar.
- **The Rash basement (rat)** — Cyan Rivera's rat counterpart still hosts the Hole Contest. The bar above closed; the practice continues.
- **Smaller Smalls** — rat jazz club beneath Ornithology, no-cover, suggested donation, plays Bird recordings on loop.
- **Bossa Nova Cellar Club** — rat after-hours below the human Bossa, same DJ booking, smaller speakers, more sweat-per-square-foot.
- **The Brewery Archives** — rats live in the Trommer's foundation, drink the residual yeast, still bitter about Rheingold being sold to PepsiCo.
- **InkedIn** — the rat tattoo social network is real for them; Pinky Mae has 1,200 connections.
- **Bushwick Burner Phone (rat)** — a rat zine, photocopied at Mr. Kiwi's printer when no humans are looking.

These don't all need pins. They live in cross-references between reviews. Razor Whisker mentions the Bossa Nova Cellar in his review of human Bossa. Mira Wong-Witherspoon mentions Smaller Smalls when she reviews Mood Ring. The world feels populated because *it talks about itself.*

---

## 8. Sample reviews — voice references

Drafted reviews to anchor the writing voice. Each rat reviews from where rats actually are: under the floorboards, in the dumpster, up through the drainpipe, in the basement. Tomey's epigraph holds. Remaining unwritten: Tabitha von Wyckoff, Vintage Vermin (cuttable).

**Razor Whisker — Market Hotel — ★★★★★**
"Two umlauts and a fish, that's the band's name. The bass came through the floorboards and rattled my whole spine in a good way (one molar loose now, worth it). Spotted a show kid eating ketamine in the bathroom line, normal Tuesday. The 1AM crowd shed three half-eaten Popeyes biscuits and a TUMS bottle into the orchestra pit (no orchestra, just us rats). Best biscuit-to-mosh ratio I've seen all month. Window over the J was cracked open, M train came through right at the breakdown, mixed perfectly with the snare. Pinky Mae was on the lighting rig getting her angles, ignored her. The merch corner is where the fragments accumulate, that's the trade tip. Five stars. Bring earplugs or don't, I'm a rat."

**DJ Nibblers — Bossa Nova Civic Club — ★★★★★**
"Tropical fantasy dance oasis my whiskers. It's a techno club named after Brazilian jazz with palm tree wallpaper in February. I LOVE IT. Came up through the bathroom drainpipe at 3:47am and had the BEST night of my LIFE. Found half a Diet Coke can and drank the WHOLE thing eyes closed, but the real situation was on the toilet rim and it WASN'T from a beverage. I only do diet, except tonight. Whiskers OUT. The smoke machine condensation in the back hallway is potable. Razor Whisker walked by the dumpster and didn't acknowledge me, fine. My whiskers feel like they've been on FaceTime. Five stars. I'll be in the bass bin booth by the subwoofer."

**Old Cheese — The Trifecta — ★★**
"You sit in the dumpster behind the Popeyes at 4am eating chicken bones and you don't know that this used to be a Trommer's beer hall. Our colony lived in the storage cellar. Bowling lanes overhead, beer trickling down through the floorboards, you could get drunk on what dripped. The 1949 strike, eighty-one days, the workers won pensions and the rats won steady garbage. Then PepsiCo bought Rheingold and said beer wasn't profitable enough so they put a Burger King here, then a car wash (BAD for rats), then this. The chicken bones are smaller now. The biscuit dust is fine, the under-fryer crawl space is too hot, my grandfather's tunnels are paved over. Two stars. The grease pit is honest work."

**Pinky Mae Pellet — JMZ platform — ★★★★**
"obsessed with this stretch of the Myrtle-Broadway J platform at 4:47am, the lighting is UNREAL when the train pulls in (sniff), did a whole content series on the third-rail side, tagged @bushwickrats, my reach is up forty percent. caught an art-school human kid crying outside the staircase and got the whole thing on InkedIn, my followers ATE IT UP, IMMACULATE timing for the gram. the trash can by the M side has a crumb situation that's been DEEPLY underrated, posted a review there too, three thousand sniffs and counting, my brand is going viral in BOTH senses i'm so blessed. staircase corners are the best mid-platform hideouts and the wind through the steel girders cleans my fur for free. lemon press from a kitchen-cab discard near jackie ess's stoop is in the photo if you zoom. four stars for the content, two stars for the pigeons (territorial). subscribe for the cure (jk i'm the disease)."

**Comrade Crumb — Mr. Kiwi grocery — ★★**
"Mr. Kiwi is an immigrant-run 24/7 small business and I deeply respect the labor. The bodega cat (Pirelli, an iconic anti-rodent worker, we have a class antagonism but I see her struggle). HOWEVER. The $14.50 cigarettes mean smokers leaving are visibly distressed and they drop more tobacco on the sidewalk, gain for us, but I cannot in good conscience celebrate a price hike that hurts working-class consumers. Wrote about this dialectic on InkedIn, engagement is down. The back stockroom rats consider themselves resident proletariat and gatekeep the spilled-rice corner from us street comrades, internal contradiction. My mom and I are still working out boundaries on cheese remittances, don't @ me. I have a Chase Sapphire (found in the gutter, don't @ me about that either). Two stars. The neighborhood deserves better."

**Mira Wong-Witherspoon — Mood Ring — ★★★**
"Came up through the bathroom drainpipe and immediately a white-furred rat in a Cornell '15 frat collar asked if I was 'half something.' (Yes. Don't.) The smoke machine condensation tastes the same as it always has. Vanessa knows what she's doing. The crowd has shifted. When this place opened in 2017 the rats here looked like us, Cantonese-speaking, queer, complicated. Now sixty percent are Cornell engineering rats who took one Asian Studies elective and the other forty are wondering if they should leave. The drainpipe is still the social heart, but the conversations have changed from us debriefing each other to a lot of asking-where-I'm-actually-from. I keep coming back. We invented this drainpipe. Three stars. (My mom would have loved the Wong Kar-wai snippets bleeding through the wall. My dad still doesn't get it.)"

**The Wyckoff Six — Ornithology Jazz Club — ★★★★★**
"We came as a six-pack and arrayed ourselves under table seven, six rats, three pairs, one shared Google Calendar (synced via a phone someone left charging behind the bar). The vegan kitchen is rich with mujaddara crumbs. Processing our food-sharing boundaries took us four hours afterward, Riv had a productive cry. June cried during a Charlie Parker piece bleeding through the floor from Smaller Smalls below, the human trio above didn't notice. We discussed the queer-bar history of this space (it was Bodeguita before this) and felt that we, the resident rats, are Bodeguita's spiritual descendants. Winnie the teacup poodle did a full circle of the room and stopped at our table for forty-three seconds, we collectively held the eye contact, no movement, all six of us breathed shallow. She moved on. Five stars."

**Edible Eddie — The Trifecta (cameo) — ★★★★★**
"OK so. Listen. The Popeyes biscuit fragment was a religious event and I held it like a small warm planet. The Dunkin glass case is now my mother (she's lovely, very transparent, full of light). The Checkers fries kept asking me questions in French and I think I answered some of them. The fluorescent is its own season. There's a rat crying outside the staircase, I think it's me, I think I am also him, we are sharing this. Five stars. Nine stars. I'm staying in the dumpster. I might live here now. The JMZ rumbled overhead and I felt my whole spine sync to it for ten seconds, then it was gone, and I miss it. Where is everyone going. Is my name Eddie."

**Rosemary Rib — Caffeine Underground (rat) — ★★★★★**
"Caffeine Underground is OPEN. Yes Ian Ford left in March. Yes the human lease is closed. Yes we (the rats) have inherited the practice. Tuesday open mic still happens, last week we had three stand-up rats getting minimal laughs (taking it well), one performance art piece involving a heated argument with a Gemini chatbot we found in a discarded phone, and a talented singer-songwriter rat. DJ classes taught by Nibblers (her sets are erratic, on theme). Magic: The Gathering pulled twelve rats last week, biggest yet. Maker's markets every Sunday: twigs, foil, bottlecaps, the usual. Marijuana-infused coffee is back (it's CBD, it's actually dumpster runoff, the marketing works). We moved the location underground (literally). Currently held in the foundation of the old Trommer's Brewery, accessed via the steam grate beside the Popeyes dumpster. Open 11pm to whenever the train sounds different. Five stars. Show up and say my name."

---

## 9. Visual language

### 9.1 Map

Hand-drawn top-down illustrated intersection. Sketched in ink, scanned, dropped into the page. Wobbly lines, hatched shadows under the JMZ tracks, slight perspective on the elevated platform. The ten pins are little drawn rats in different poses. The Caffeine Underground (rat) pin sits below the street level, connected by a dotted line to the steam grate.

### 9.2 Color palette

Three colors plus one functional accent.

- `#0A0A0A` off-black (background)
- `#C5BFAE` dirty newsprint (primary text and structure)
- `#B8FF00` sick rave green (active states, JMZ rumble flash, headers)
- `#D32323` Yelp brand red (used only on the literal star icons — no other use)

### 9.3 Type

- Body: a slightly off-kilter monospace or zine-flavored font — *Courier Prime* or *Special Elite*. The body reads as photocopied.
- Headers: punk-flyer condensed sans — *Anton* or *Bebas Neue*, used roughly. Not designer-y.
- Star count and review metadata in a clean sans for legibility.

### 9.4 Yelp pastiche elements

Recognizable but askew.

- Star icons drawn by hand, slightly tilted, in Yelp red.
- "Elite Reviewer" badge: hand-lettered, gold rat silhouette with a top hat, used sparingly.
- "Useful / Funny / Cool" buttons retained — Pinky Mae cares about her Cool ratio.
- Profile photos as bad selfies (see 9.6).
- Review count, follower count, "X reviews, Y useful" displayed prominently.

### 9.5 Texture

A static `body::after` pseudo-element with a tileable noise/grain SVG, set to low opacity and `mix-blend-mode: multiply`, pinned to the viewport with `position: fixed; pointer-events: none`. Roughly twenty lines of CSS. This is the single move that takes the piece from vector-kitsch to scanned-zine.

### 9.6 AI-generated rat selfies — all eleven prompts

Use Flux Schnell on fal.ai (free, fast iteration), Midjourney (best lo-fi photographic register), or ChatGPT/DALL-E (best for text/objects, struggles with anatomy). The non-negotiable phrase in every prompt: *"anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy."* Run each prompt 3-4 times, pick the best.

*Razor Whisker:* "Bad iPhone selfie of a small dark grey rat with damp matted fur, taken in the dim red emergency-lighting of a basement venue, ears slightly back from sound exposure, one whisker bent, a sticker fragment from a band's set list stuck to the side of the rat's head, slight motion blur from a moshing crowd in the background, harsh red light source, the photo quality is degraded by sweat moisture on the lens, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like a Bandcamp profile pic from someone in three different unsigned bands."

*DJ Nibblers:* "Bad iPhone selfie of a small grimy brown rat with bloodshot beady eyes in a fluorescent-lit bodega bathroom mirror at 3am, headphones (clearly DJ headphones, oversized for a rat) slung around her neck, a USB stick clipped to a wristband, faded sharpie set-list scribbles visible on the back of one paw, a wristband from tonight's gig still on, lipstick smear on the whiskers, a small empty plastic baggie just visible on the sink edge, the phone held awkwardly in a tiny paw, slight motion blur, harsh flash glare, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like a private finsta a DJ would post at 4am after their set."

*Pinky Mae Pellet:* "Bad iPhone selfie of a small pink-eared brown rat with deliberately tousled fur, taken in golden-hour light against a Bushwick mural background, ring-light reflection visible in the rat's bead-like eyes, the snout slightly distorted by being too close to the wide-angle phone lens, the rat is clearly congested but trying to hide it (one nostril faintly dripping, eyes too watery to read as just glamorous, fur around the snout slightly damp), a used tissue is visible at the bottom corner of the frame the rat clearly tried to crop out, an obvious oversaturating filter applied to mask the sickness, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like an Instagram profile pic of someone who should be in bed but is instead doing content."

*Old Cheese:* "Bad iPhone selfie of a grizzled fat brown rat with one eye half-closed, harsh on-camera flash, leaning against a wood-paneled bar wall, the photo has clearly been the profile picture for fifteen years and shows it, low resolution by 2025 standards, slight digital decay, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like a 2009 Facebook profile pic that the user never updated."

*Tabitha von Wyckoff:* "Bad iPhone selfie of a sleek pale-furred rat in front of an exposed brick wall, soft natural light from a large factory window (clearly a converted artist studio in Bushwick that costs $4500 a month), the rat looks composed and slightly above-it-all, the composition is too studied for a casual selfie, shallow depth of field, mid-tone color grading, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like a profile pic from someone with a Substack about mindful living in Brooklyn."

*Comrade Crumb:* "Bad iPhone selfie of a slightly chubby brown rat wearing a small kuffiyeh tied around its neck, holding a tiny cardboard sign that reads SOLIDARITY in shaky hand-lettering, taken at dusk on a Bushwick stoop, slight overexposure, the rat looks earnest and self-serious, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like a Twitter profile pic from 2021."

*Mira Wong-Witherspoon:* "Bad iPhone selfie of a small mixed-fur (pale brown and white) rat with sharp eyes, taken in a dark booth at a cocktail bar with neon red lighting, holding the phone at chin level, the rat looks tired but composed, slight motion blur from the bar lighting, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like an Instagram story screenshot from 1am."

*The Wyckoff Six:* "Bad iPhone group selfie of exactly SIX rats crammed into the frame, mixed fur colors (dark brown, pale grey, white, reddish, agouti, black), arranged in three stacked rows of two, the closest rat's snout slightly distorted by being too close to the lens, the back-row rats are squinting and out of focus, taken in a cluttered apartment basement with mason-jar string lights in the background, soft yellow lamp light, the photo has clearly been reshot multiple times to get everyone in frame, photocopy grain, anthropomorphic but the rats are ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like the profile pic of a polycule with a shared Google Calendar." *(Expect to generate this 8-10 times. Image models routinely fail at exact counts.)*

*Vintage Vermin:* "Bad iPhone selfie of a small grey rat with a deliberately retro aesthetic, taken with a vintage on-camera flash, the rat is posed in front of a thrift-store rack of old fabric scraps and discarded clothes, slight overexposure from the harsh flash, warm yellow color cast like expired 35mm film, the rat appears to be holding a small antique button or scrap of vintage fabric in one paw, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like the profile pic of a Depop seller specializing in rare archival pieces."

*Edible Eddie:* "Bad iPhone selfie of a brown rat at a strange tilted angle (looks accidentally taken), the rat's whiskers blurry from movement, slight motion blur across the entire frame, harsh on-camera flash creating overexposure on one side of the rat's face and deep shadow on the other, the rat's expression is hard to read (maybe wonder, maybe confusion, maybe both), background is the inside of a fast-food restaurant trash can with crumpled wrappers, the photo timestamp visible in a corner reading 00:00 AM, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like a profile pic taken at the worst possible moment of a rat's life."

*Rosemary Rib:* "Bad iPhone selfie of a slightly larger black rat with one scar across the snout, taken backstage at a basement venue right before going on, dim warm stage lighting from a single bulb above creating dramatic shadows, faint stage fog visible in the air, the rat's expression studied and slightly theatrical (clearly this is for an Instagram story tagged 'pre-show'), holding the phone at a deliberate angle to catch the lighting, the corner of a velvet curtain visible in the frame, photocopy grain, anthropomorphic but the rat is ACTUALLY rat-shaped, not Disney-cute, real rat anatomy, lo-fi photographic style, looks like a profile pic from someone whose Wikipedia page describes them as a durational performance artist."

If a generator gives you cartoon-mouse output (round head, big eyes, smile), strengthen the back half: *"long pointed snout, beady black eyes, scaly tail visible, naturalistic rat anatomy as in a wildlife photograph, not a children's book illustration."* Tail and snout shape are usually what gets cute first.

### 9.7 Real venue photos

Each pin gets a real photo of the location to ground the rat-fiction in the actual neighborhood. Photos read as Yelp profile photos for the venue (top of the review card). Apply slight grain/desaturation to unify with the rest of the visual. Sources per pin in section 6.

---

## 10. Tech stack and implementation patterns

### 10.1 Stack decisions

**Vanilla HTML / CSS / JavaScript with ES modules**, no framework. Reasons:
- Single-page app with no routing, no state complexity that React or Vue solves
- Smaller bundle, faster load, no transpilation step
- Cleaner narrative for portfolio: "built with Tone.js and the Web Audio API"
- Claude Code works well with vanilla code that has clear module boundaries

**Tone.js v15.1.22** for audio synthesis and scheduling. Loaded via CDN (unpkg) for tonight's build; can swap to npm install if Phase 2 needs a bundler. Provides: `Tone.Sampler`, `Tone.Player`, `Tone.Loop`, `Tone.Transport`, `Tone.Filter`, `Tone.Compressor`, `Tone.PitchShift`, `Tone.Channel`, `Tone.Draw` (for syncing DOM updates to the audio clock), `Tone.Gain`. Documented at tonejs.github.io.

**Web Audio API directly** for what Tone.js doesn't expose cleanly:
- `AnalyserNode` for the oscilloscope waveform rendering
- `AudioBufferSourceNode` for one-shot triggered samples (lighter than `Tone.Player` for very short clips, optional optimization)

**No build tooling for v1.** Single index.html, ES modules via `<script type="module">` for clean separation. Vercel serves static files directly. No bundler, no transpilation, no npm install required for deployment. If Phase 2 needs growing, add Vite later.

**No CSS framework.** Vanilla CSS with custom properties for theme tokens. ~150-200 lines total. Easier to inspect and tune than utility classes for this project's character.

### 10.2 Browser audio autoplay policy (critical)

Modern browsers (Chrome, Safari, Firefox, mobile) block `AudioContext` from starting until a user gesture. Tone.js abstracts this behind `Tone.start()`, which must be called inside a click or keydown handler.

```javascript
// On page load: prepare engine but do NOT start AudioContext
const engine = new AudioEngine();
await engine.preloadAssets();  // Loads samples; samples preload but don't play

// On first user interaction (the headphones tag click, or any pin click):
async function handleFirstClick() {
  await Tone.start();  // Unlocks AudioContext; returns when ready
  engine.startGenerativeContinuous();  // Start the always-on city ambience
  document.body.classList.add('audio-unlocked');  // CSS hook for visual cue
}
```

Implication for the design: the headphones tag at the top doubles as the "click anywhere to begin" affordance. No audio plays until the user clicks once. After that, generative continuous composition starts and cumulative pin layers can build.

### 10.3 File structure

```
/
├── index.html                      # Entry point, page structure
├── styles.css                      # Design tokens, modal, oscilloscope, layout
├── about.html                      # Epigraph, attribution, philosophy excerpt
├── PHILOSOPHY.md                   # Algorithmic philosophy manifesto
├── README.md                       # Repo intro, run/deploy instructions
├── CREDITS.md                      # Audio source attributions
├── CLAUDE.md                       # Project context for Claude Code (see 10.7)
├── vercel.json                     # Optional, only if needed for routes
├── src/
│   ├── main.js                     # Bootstrap: load assets, wire UI, start engine
│   ├── audio/
│   │   ├── engine.js               # MasterMix + JMZScheduler + AmbientBed
│   │   ├── rat-generator.js        # RatGenerator class (procedural rendering)
│   │   ├── rat-profiles.js         # 11 rat parameter objects
│   │   ├── venue-beds.js           # 10 venue ambient bed compositions
│   │   ├── effects.js              # kHole, fizz, notificationPing, coffeeShop, glitch
│   │   └── keyword-scanner.js      # Tokenize review, detect keywords, return event list
│   ├── ui/
│   │   ├── map.js                  # SVG map interactions, pin handlers
│   │   ├── modal.js                # Open/close, photo/selfie display, play controls
│   │   ├── oscilloscope.js         # AnalyserNode → canvas render
│   │   ├── subtitles.js            # Word-by-word reveal via Tone.Draw
│   │   └── headphones-tag.js       # Top-of-page intro that fades after 5s
│   └── content/
│       ├── rats.js                 # 11 rat bios, names, handles
│       ├── reviews.js              # 8-9 review text + venue assignments
│       └── venues.js               # 10 venue metadata
├── assets/
│   ├── map.svg                     # Hand-drawn intersection map
│   ├── grain.png                   # Texture overlay
│   ├── selfies/                    # 11 AI-generated rat selfies
│   ├── photos/                     # 10 venue photos from Google Maps
│   └── audio/
│       ├── jmz-rumble.wav
│       ├── usvs/                   # General USV bank, ~40 samples
│       ├── usvs-cocaine/           # Zenodo cocaine USVs, ~10 samples
│       ├── beds/                   # ~20 atomic ambient components
│       └── effects/                # Fizz, notification, coffee-shop, glitch
└── docs/
    ├── STRATEGY.md                 # This file
    ├── ASSETS.md
    └── decisions/                  # Decision records as project evolves
```

### 10.4 Audio engine — core patterns

**RatGenerator class.** The procedural-sonification core. Same input always produces the same output.

```javascript
import * as Tone from "tone";
import { effects } from "./effects.js";
import { scanKeywords } from "./keyword-scanner.js";

export class RatGenerator {
  constructor(profile, reviewText, sampleBank) {
    this.profile = profile;
    this.reviewText = reviewText;
    this.sampleBank = sampleBank;       // Loaded Tone.Sampler instance
    this.tokens = this.tokenize(reviewText);
    this.duration = this.calculateDuration();

    this.filter = new Tone.Filter(
      profile.bankFilter?.lowpass || 20000,
      "lowpass"
    );
    this.pitchShift = new Tone.PitchShift({ pitch: 0 });
    this.gain = new Tone.Gain(Tone.dbToGain(profile.masterVolume));

    this.sampleBank.chain(this.filter, this.pitchShift, this.gain);
  }

  tokenize(text) {
    return text.split(/\s+/).map((word, idx) => ({
      word,
      lower: word.toLowerCase().replace(/[.,!?;:'"]/g, ""),
      index: idx,
      timestamp: this.calculateTimestamp(idx),
    }));
  }

  calculateTimestamp(wordIndex) {
    const wpm = this.profile.triggerRate.wordsPerMinute;
    return (wordIndex / wpm) * 60;  // seconds (Tone uses seconds)
  }

  calculateDuration() {
    return this.calculateTimestamp(this.tokens.length);
  }

  schedule() {
    this.tokens.forEach((token, i) => {
      const sampleNote = this.pickSampleNote(i);
      const pitchOffset = this.calculatePitchOffset(i);

      Tone.getTransport().schedule((time) => {
        this.pitchShift.pitch = pitchOffset;
        this.sampleBank.triggerAttack(sampleNote, time);
      }, token.timestamp);
    });

    const events = scanKeywords(this.tokens, this.profile.effects);
    events.forEach(({ effectType, timestamp }) => {
      Tone.getTransport().schedule((time) => {
        effects[effectType](time, this);
      }, timestamp);
    });
  }

  pickSampleNote(tokenIndex) {
    // Deterministic: index modulo bank size
    const notes = ["C4", "D4", "E4", "F4", "G4", "A4", "B4"];
    return notes[tokenIndex % notes.length];
  }

  calculatePitchOffset(tokenIndex) {
    const variance = this.profile.pitchVariance;
    // Deterministic pseudo-random based on index
    const seed = (tokenIndex * 9301 + 49297) % 233280;
    return ((seed / 233280) * 2 - 1) * variance;
  }

  play() {
    this.schedule();
    Tone.getTransport().start();
  }

  connect(destination) {
    this.gain.connect(destination);
    return this;
  }
}
```

**Keyword scanner.** Pure function. Tokens in, scheduled events out.

```javascript
export function scanKeywords(tokens, effectsMap) {
  const events = [];
  Object.entries(effectsMap).forEach(([keyword, effectType]) => {
    const lower = keyword.toLowerCase();
    const phrase = lower.split(" ");
    if (phrase.length === 1) {
      const match = tokens.find((t) => t.lower === lower);
      if (match) events.push({ effectType, timestamp: match.timestamp });
    } else {
      // Multi-word phrase: scan for sequence
      for (let i = 0; i <= tokens.length - phrase.length; i++) {
        const slice = tokens.slice(i, i + phrase.length);
        if (slice.every((t, j) => t.lower === phrase[j])) {
          events.push({ effectType, timestamp: slice[0].timestamp });
          break;  // Fire once per keyword
        }
      }
    }
  });
  return events;
}
```

**JMZ scheduler.** Recursive setTimeout pattern (not `Tone.Loop` because the interval is randomized).

```javascript
export class JMZScheduler {
  constructor(masterChannel) {
    this.masterChannel = masterChannel;
    this.rumblePlayer = new Tone.Player("/assets/audio/jmz-rumble.wav").toDestination();
    this.compressor = new Tone.Compressor({
      threshold: -24,
      ratio: 8,
      attack: 0.05,
      release: 0.5,
    });
    this.masterChannel.connect(this.compressor);
    this.compressor.toDestination();
    this.rumbleDurationMs = 35000;
  }

  start() {
    this.scheduleNext();
  }

  scheduleNext() {
    const interval = 60000 + Math.random() * 30000;  // 60-90s
    this.timeoutId = setTimeout(() => {
      this.fireRumble();
      this.scheduleNext();
    }, interval);
  }

  fireRumble() {
    this.rumblePlayer.start();
    this.compressor.threshold.rampTo(-40, 0.05);  // duck other audio
    setTimeout(() => {
      this.compressor.threshold.rampTo(-24, 1);   // restore
    }, this.rumbleDurationMs);
  }

  stop() {
    if (this.timeoutId) clearTimeout(this.timeoutId);
  }
}
```

**Cumulative master mix.**

```javascript
export class MasterMix {
  constructor() {
    this.activePins = new Map();
    this.bus = new Tone.Channel().toDestination();
  }

  visitPin(pinId, profile, review, venueProfile, sampleBank) {
    if (this.activePins.has(pinId)) {
      const existing = this.activePins.get(pinId);
      existing.gain.gain.rampTo(0.7, 0.5);  // bring back up
      return;
    }

    const ambientBed = new AmbientBed(venueProfile);
    const generator = new RatGenerator(profile, review, sampleBank);
    const gain = new Tone.Gain(0.7);

    ambientBed.connect(gain);
    generator.connect(gain);
    gain.connect(this.bus);

    this.activePins.set(pinId, { generator, ambientBed, gain });
    generator.play();
  }

  closePinModal(pinId) {
    const pin = this.activePins.get(pinId);
    if (pin) pin.gain.gain.rampTo(0.35, 1);  // duck but don't dispose
  }
}
```

### 10.5 Subtitle synchronization

Use `Tone.Draw.schedule` to tie DOM updates to the audio clock. Standard requestAnimationFrame can drift; `Tone.Draw` is sample-accurate.

```javascript
export class SubtitleEngine {
  constructor(generator, subtitleEl) {
    this.generator = generator;
    this.subtitleEl = subtitleEl;
  }

  play() {
    this.subtitleEl.textContent = "";
    this.generator.tokens.forEach((token) => {
      Tone.getTransport().schedule((time) => {
        Tone.Draw.schedule(() => {
          this.subtitleEl.textContent += token.word + " ";
        }, time);
      }, token.timestamp);
    });
  }
}
```

### 10.6 Oscilloscope (canvas waveform)

```javascript
export class Oscilloscope {
  constructor(canvas, sourceNode) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d");
    this.analyser = Tone.getContext().createAnalyser();
    this.analyser.fftSize = 2048;
    sourceNode.connect(this.analyser);
    this.dataArray = new Uint8Array(this.analyser.fftSize);
    this.running = false;
  }

  start() {
    this.running = true;
    this.draw();
  }

  stop() {
    this.running = false;
  }

  draw() {
    if (!this.running) return;
    requestAnimationFrame(() => this.draw());
    this.analyser.getByteTimeDomainData(this.dataArray);
    const { width, height } = this.canvas;
    this.ctx.clearRect(0, 0, width, height);
    this.ctx.lineWidth = 1.5;
    this.ctx.strokeStyle = "#C5BFAE";  // dirty newsprint
    this.ctx.beginPath();
    const slice = width / this.dataArray.length;
    for (let i = 0; i < this.dataArray.length; i++) {
      const v = this.dataArray[i] / 128.0;
      const y = (v * height) / 2;
      if (i === 0) this.ctx.moveTo(i * slice, y);
      else this.ctx.lineTo(i * slice, y);
    }
    this.ctx.stroke();
  }
}
```

### 10.7 CLAUDE.md scaffold for the build

Per current Claude Code best practices (Anthropic docs, Feb 2026), a well-written `CLAUDE.md` at the repo root improves Claude Code's effectiveness. Keep it under 200 lines. Use the WHY/WHAT/HOW pattern. Don't restate what's in this strategy doc; point at it.

Recommended scaffold to drop in the repo root before starting:

```markdown
# The Bushwick Nightcrawlers

## What
Single-page sound piece. Hand-drawn map of the Myrtle-Broadway JMZ
intersection in Bushwick. Ten pins; click a pin and a rat reviews the
venue in Yelp pastiche, with procedurally rendered USV (rat
ultrasonic-vocalization) audio synced to the review text.

## Why
Sound art piece, not a website with audio. The interactive interface is
the score. Audio rendering is procedural: fixed review text + per-rat
parameter profile = deterministic audio composition. Effects fire on
keyword markers (e.g., "ketamine" → K-hole stretch).

## Stack
- Vanilla HTML/CSS/JS, ES modules
- Tone.js v15 via unpkg CDN
- No build tooling, no framework
- Vercel for hosting (static)

## Project structure
See docs/STRATEGY.md section 10.3 for full file layout.

## Audio rules (load-bearing)
- Tone.start() must be called inside a user-gesture handler before any
  audio plays. The headphones tag is the gesture target.
- Same review text + same rat profile = same audio output. Determinism
  is part of the project's framing (algorithmic art, not random).
- Drug-effect events fire on keyword matches in the review text, not
  stochastically. See src/audio/keyword-scanner.js.
- Pin audio persists after modal close (cumulative mix). Don't dispose
  Tone nodes when modals close; lower their gain instead.

## Code style
- ES module imports, named exports
- No default exports
- Class-based for stateful audio objects (RatGenerator, JMZScheduler,
  MasterMix); pure functions for tokenizers and scanners
- Vanilla CSS with custom properties for theme tokens; no Tailwind

## Don't
- Don't introduce React, Vue, Svelte, or any framework
- Don't add bundler config; ES modules via <script type="module"> only
- Don't use console.log in committed code; use a logger if needed
- Don't generate random audio events; effects are keyword-triggered

## Where to look
- docs/STRATEGY.md — full product spec, sonification system, cast,
  venues, sample reviews
- docs/ASSETS.md — every asset to source/create
- src/content/reviews.js — fixed review corpus (do not regenerate)
- src/audio/rat-profiles.js — 11 parameter objects

## Verification
- Test in Chrome and Safari (mobile and desktop)
- Audio must work after first user click (the headphones tag)
- Reviews must render the same way every play
- Keyword effects must fire (check console.log scaffolding during
  development, remove before commit)
```

### 10.8 Mobile considerations

- Touch events on map pins: register both `click` and `touchstart` (or use a single pointer event). Avoid `touchstart` triggering audio without a deliberate tap.
- Viewport meta tag in index.html: `<meta name="viewport" content="width=device-width, initial-scale=1">`
- iOS Safari requires explicit user gesture for `AudioContext.resume()`. The `Tone.start()` pattern handles this.
- Performance ceiling: cap simultaneous Tone voices at ~12 to avoid choking on older mobile. The cumulative-pin-layers feature stays under this cap (10 pins + JMZ + ambient beds = manageable).
- Hand-drawn map at 3000px is expensive on mobile. Serve at 1500px for narrow viewports via `<picture>` source media queries.

### 10.9 Performance and asset loading

- Preload all USV samples at page-load time via `Tone.Sampler` with a `urls` map and `Tone.loaded()` promise.
- Lazy-load venue ambient bed components only after first user gesture (cuts initial page weight).
- Atlas textures aren't worth it for ~80 audio files; just serve them individually with HTTP/2.
- Image lazy loading: `<img loading="lazy">` for selfies and venue photos in modals (they only load when modals open).

### 10.10 Deployment to Vercel

Pure static deployment. No serverless functions needed for tonight's build.

```bash
# In the repo root after initial commit:
npm install -g vercel
vercel login
vercel --prod
```

Or link the GitHub repo to Vercel via the Vercel web UI; pushes to `main` deploy automatically. Default URL: `bushwick-nightcrawlers.vercel.app`.

`vercel.json` is optional. Add if you need custom routes or headers; otherwise omit.

---

## 11. Audio assets — sourcing

| Asset | Source | License |
|---|---|---|
| General rat squeaks (30-40 samples) | Freesound.org (toefur, egomassive); Pixabay sound-effects/search/rat | CC0 / royalty-free |
| Cocaine-pleasure USVs (5-10 samples for DJ Nibblers) | USVSEG dataset on Zenodo (doi.org/10.5281/zenodo.3428024) | Academic, requires citation |
| JMZ rumble (1 long take) | Freesound subway/train searches; or record yourself at the platform | CC0 or self-recorded |
| Venue ambient beds (~10 loops) | Freesound for components (fluorescent buzz, fryer hum, refrigerator, smoke machine, kitchen, conversation murmur, etc.); compose in Ableton or Audacity | CC0 components |
| Drug-effect samples (carbonation fizz, notification ping, coffee-shop chatter) | Freesound, Pixabay | CC0 |

The Zenodo USV dataset records at 250 kHz sample rate. To bring it into audible range, follow Avisoft's tutorial: change the file header sample rate to 22050 Hz. This time-expands the recording. One second of 50 kHz USV becomes ten seconds of audible content. Use only short fragments (300-1500 ms each) for triggering.

---

## 12. Build plan — one night with Claude Code

Total: 9-10 focused hours, with parallelization between Shoro tasks and Claude Code tasks. The plan is structured around what Claude Code is good at (writing well-scoped code with clear specs) versus what only Shoro can do (sourcing audio, drawing the map, voice judgment, audio quality testing).

### 12.1 Setup phase — 30 minutes

| Task | Who | Time |
|---|---|---|
| Initialize repo, push hello-world index.html | Shoro | 10 min |
| Create CLAUDE.md from section 10.7 scaffold | Shoro | 10 min |
| Drop docs/STRATEGY.md and docs/ASSETS.md into repo | Shoro | 5 min |
| Link repo to Vercel, confirm auto-deploy works | Shoro | 5 min |

### 12.2 Map and visual shell — 90 minutes

| Task | Who | Time |
|---|---|---|
| Hand-draw map of Myrtle-Broadway intersection, scan, save as assets/map.svg | Shoro | 75 min |
| Generate AI rat selfies (run 11 prompts in batches, pick best) | Shoro, parallel | 60 min during other work |
| Source venue photos from Google Maps reviews | Shoro, parallel | 30 min during other work |
| Build HTML shell, design tokens in CSS, load map SVG, position pins by data attributes | Claude Code | 30 min |

Claude Code prompt for the shell: *"Build the index.html shell and styles.css design tokens for the Bushwick Nightcrawlers project. Read CLAUDE.md and docs/STRATEGY.md sections 4 (visual language) and 10.3 (file structure) first. Wire up SVG map at assets/map.svg with ten pin elements positioned by data-pin-id attributes. No audio yet."*

### 12.3 Audio asset sourcing — 2 hours (Shoro alone, in parallel with Claude Code work)

| Task | Time |
|---|---|
| Source ~40 general USV samples from Freesound (search "rat squeak") | 30 min |
| Process Zenodo cocaine USV dataset: change file header sample rate to 22050 Hz in Audacity to time-expand from 50 kHz to audible. Trim to 0.3-1.5 second fragments | 30 min |
| Source JMZ rumble (one good 30-45 sec clip) | 15 min |
| Source ~20 atomic ambient bed components per venue (fluorescent buzz, fryer hum, smoke machine, etc.) | 45 min |
| Source 4 drug-effect samples (carbonation fizz, notification ping, coffee-shop chatter, glitch) | 15 min |

### 12.4 Audio engine — 2.5 hours (Claude Code)

| Phase | Task | Time |
|---|---|---|
| 12.4a | Set up Tone.js loader, create Tone.Sampler instances per bank, wire `Tone.start()` to first user click | 30 min |
| 12.4b | Implement RatGenerator class per section 10.4 spec; test with one rat profile and one review | 60 min |
| 12.4c | Implement keyword-scanner.js per section 10.4 spec; verify K-hole fires on "ketamine" | 30 min |
| 12.4d | Implement effects.js (kHole, fizz, notificationPing, coffeeShop, glitch) | 30 min |

Claude Code prompt for engine: *"Implement src/audio/rat-generator.js, src/audio/keyword-scanner.js, and src/audio/effects.js per docs/STRATEGY.md section 10.4. Use the exact patterns shown there. The 11 rat profiles are in src/audio/rat-profiles.js (already authored). Test that a single review (Razor Whisker at Market Hotel) plays USV samples in time with the words and fires the kHole effect on the word 'ketamine'."*

### 12.5 Master mix and JMZ scheduler — 50 minutes (Claude Code)

| Task | Time |
|---|---|
| Implement JMZScheduler with sidechain compression per section 10.4 | 20 min |
| Implement MasterMix with cumulative pin layers per section 10.4 | 30 min |

### 12.6 Generative continuous composition — 30 minutes (Claude Code)

| Task | Time |
|---|---|
| Implement page-load ambient: all venue beds at -30 dB, USV master triggers every 5-15s, JMZ on its cycle | 30 min |

### 12.7 Modal, oscilloscope, subtitles — 90 minutes (Claude Code)

| Task | Time |
|---|---|
| Modal open/close, photo+selfie display, play/pause | 30 min |
| Oscilloscope per section 10.6 | 30 min |
| Subtitle engine via `Tone.Draw.schedule` per section 10.5 | 30 min |

### 12.8 Reviews and content — 75 minutes (Shoro alone)

| Task | Time |
|---|---|
| Write Tabitha von Wyckoff and Vintage Vermin reviews (if doing 10 cast members) | 30 min |
| Polish remaining reviews (already drafted in section 8) | 30 min |
| Author rat bios + venue metadata in src/content/ | 15 min |

### 12.9 About page and headphones tag — 30 minutes (Claude Code)

| Task | Time |
|---|---|
| About page: Tomey epigraph, Grime Square credit, USV citation, headphones note | 15 min |
| Headphones tag at top of page, fades after 5s, doubles as `Tone.start()` trigger | 15 min |

### 12.10 Polish and deploy — 30 minutes (Shoro)

| Task | Time |
|---|---|
| Run voice-linter on About page copy and any visible UI text | 10 min |
| Test in Chrome desktop, Safari desktop, Chrome iOS | 10 min |
| Push final commit, verify Vercel deploy | 10 min |

### 12.11 If running short

Cut order, fastest to slowest:
1. Drop Tabitha and Vintage Vermin (saves 30 min)
2. Use 5 ambient bed components per venue instead of 8 (saves 30 min)
3. Skip the algorithmic-philosophy manifesto for tonight (saves 30 min)
4. Use Google Maps screenshots only for venue photos, no Instagram-sourced backups (saves 15 min)

Never cut: audio engine (12.4), JMZ scheduler (12.5), generative continuous (12.6), subtitle engine (12.7). These are the project's claim.

### 12.12 How to talk to Claude Code

Keep tasks scoped under 50% of context window per session. If you start hitting confusion or correction loops, /clear and restart with a sharper prompt incorporating what you learned.

Productive prompt patterns for this project:
- *"Read CLAUDE.md and docs/STRATEGY.md section 10.[X]. Implement [specific file]. Test by [specific verification]."*
- *"The audio is firing twice per word instead of once. Look at src/audio/rat-generator.js and the schedule() method. Fix and explain the cause."*
- *"Add a console.log to the keyword-scanner that prints each detected event with timestamp. I'll remove these before commit."*

Avoid: *"Make this better"* / *"Fix the audio"* without specifics. If you don't know what's wrong, run the failing case yourself and paste the symptom into the prompt.

Use plan mode (`/plan` if available in your version of Claude Code) for complex tasks like the RatGenerator implementation. Review the plan before authorizing execution.

### 12.13 Phase 2 extensions (post-tonight)

- **Remedy 2** (spatial panning) and any remaining audio-architecture work
- USV-only listen mode (no subtitles, oscilloscope only)
- Phoneme-to-USV mapping at the phoneme level (currently per-word triggered). The Hamdan-explicit version
- Additional rat-only pins: Smaller Smalls, Bossa Nova Cellar Club, the Wyckoff Six's basement, the Rash basement
- Live 311 sightings data via Socrata API, affecting ambient bed density per location in real time
- Seed-based reproducibility: shareable URLs that lock specific algorithmic playbacks
- User parameter exploration UI: sliders to adjust per-rat profiles in real time
- Transplant Draft format for new rat character introductions
- Multiple corridors (the L train spine, the Knickerbocker stretch)

---

## 13. Attribution and sources

**Epigraph.** Tomey, Aaron. "Ridgewood's Rodent Takeover." *Grime Square*, April 14, 2026. https://grime-square.com/2026/04/14/ridgewood-restaurant-health-violations-salvos-aunt-ginnys/

**Cultural texture.**
- Karpan, Andrew. Multiple pieces in *Grime Square*, 2026 (Book Club Bar, Salaries for Socialism, Bushwick's Rash-era).
- Tomey, Aaron. *Grime Square* (Transplant Draft, Apartment Living interview).
- Lipton, Noah. "Discussing obscene disclosures at Nowon, Danger Danger, et al." *Grime Square*, March 4, 2026.
- Goetz, Jake. "Caffeine Underground Goes Underground." *Grime Square*, March 30, 2026.
- Davey, Brendan. "Community Pillar, No Lager." *Grime Square*, April 26, 2026.
- Davey, Emma. "In the Age of the $40 Chicken." *Grime Square*, April 23, 2026.

**Scientific.** Tachibana, Ryosuke O. et al. "USVSEG: A robust method for segmentation of ultrasonic vocalizations in rodents." *PLoS ONE*, 2020. Dataset: https://doi.org/10.5281/zenodo.3428024

**Cocaine-USV connection.** Avvisati et al., 2024 (UTEP / Moschak); also Vargas-Perez et al., on USV emissions during heroin and cocaine self-administration in different settings.

**Audio sources.** Freesound.org contributors: toefur, egomassive, Shyguy014. Pixabay royalty-free sounds. USVSEG dataset (Tachibana et al., Zenodo, 2020).

**Venue facts.** All addresses, founding details, and historical claims verified against published reporting (Brooklyn Vegan, Bushwick Daily, Brownstoner, NY Times, BKMag, Bushwick Daily, *Grime Square* archive).

---

## 14. Tradeoffs

| Option | Upside | Downside | When to choose it |
|---|---|---|---|
| Procedural sonification (Remedy 4 primary), recommended | Audio is the piece; same input always produces same output; sound-art positioning is unambiguous | Adds ~120 min to build vs. text-only auto-typing; harder to fall back from | Default. |
| Stochastic generation (regenerate audio each play) | Could pitch as "truly generative" | Inconsistent comedic delivery; punchlines land differently each time; bad for portfolio demo | Cut. The reviews are fixed corpus; only the rendering is algorithmic. |
| Cumulative audio + generative continuous (Remedies 1+5), recommended | Rewards exploration; the city sounds even with no clicks; ten venues by the end | Mobile mix can get muddy with 6+ active layers; needs careful gain staging | Default. |
| Spatial panning (Remedy 2), Phase 2 only | Pin-position-as-mix-position is conceptually clean | Adds complexity and mobile-stereo-on-tinny-speakers issues | Defer to Phase 2 unless time goes especially well. |
| Audio-led entry (Remedy 3), cut | Sets audio-first frame strongly | Forces 30-second wait; risks bouncing casual visitors; Remedy 4 already covers the audio-first claim | Cut. |
| Real venue photos + AI rat selfies, recommended | Grounds the rat fiction in actual Bushwick; gives non-locals context | Photo sourcing work | Default. |
| AI-only imagery, no real photos | Faster | Loses the "real intersection" claim that the entire project depends on | Cut only if zero photo time available. |
| Vanilla HTML/JS vs. React | Cleaner narrative, smaller bundle, faster Claude Code iteration | Slight repetition for similar UI elements | Vanilla. The project has ~10 hand-styled components, not enough to justify React. |
| Tone.js v15 via CDN vs. npm install | Zero build tooling; deploy as static files | Slightly larger initial download (~150 KB) | CDN. Phase 2 can switch to bundled if needed. |

**Highest-risk tradeoff:** the procedural sonification and cumulative audio are the project's claim. Skipping either collapses the positioning into "website with audio."

**Lowest-risk tradeoff:** which two characters get cut from the cast (Tabitha and Vintage Vermin first). The piece works with eight rats; ten is preferred but not load-bearing.

**Tradeoff that's actually a real call:** map drawing time (75 min). It's the largest single creative time sink and blocks every visual test. Doing it first means ~75 min where Claude Code has nothing useful to do; doing it last risks running out of time and shipping with a placeholder. Recommended: draw the map first (Shoro), then run audio sourcing and Claude Code shell-build in parallel during the next hour.

---

## 15. What "done" looks like for tonight

- Single-page web build deployed to Vercel
- 8-9 rat reviews readable as text (subtitles ON by default) and audible as procedurally rendered USV audio
- 10 pins on a hand-drawn intersection map, including one rat-only pin (Caffeine Underground, rat) rendered below street level
- JMZ rumble cycling every 60-90 seconds with sidechain ducking
- Cumulative audio: visiting more pins layers more audio
- Generative continuous composition running independently of clicks
- Keyword-triggered effects firing deterministically (K-hole on "ketamine," fizz on "diet," notification ping on "tagged" / "for the gram," coffee-shop kick-up on "Chase Sapphire" / "my mom")
- Three-color palette plus Yelp red on stars only
- Real venue photo + AI rat selfie per pin
- Headphones tag at top, doubling as `Tone.start()` user-gesture trigger
- About page citing Tomey's article as epigraph and crediting *Grime Square*

If five of those eleven ship, the piece is sound art with a working interface. If all eleven ship, it is a portfolio piece.

---

## 16. Open questions and known unknowns

- Whether the Cantonese film snippet for Mira's audio character can be sourced cleanly under CC0 or needs a synth-pad fallback.
- Whether Tone.js's polyphony cap (default 32 voices) holds up with 10 cumulative pins active simultaneously on iOS Safari. Test early.
- Whether the algorithmic-philosophy manifesto (PHILOSOPHY.md) ships tonight or as a Phase 2 portfolio addition.
- Whether to ship 8 or 10 cast members. The cuts are clear; the question is whether the extra two reviews land or feel like padding.
- Whether keyword-triggered effects need normalization for case and punctuation (recommended: yes, lowercase + strip punctuation in the scanner).
