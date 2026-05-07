/**
 * src/content/alley-oneliners.js — eleven one-line cameos for the alley.
 *
 * Each rat says one thing about the alley. Same shape as a full
 * review (reviewerId, venueId, rating, date, text) so the audio
 * engine and the alley modal can treat these like mini-reviews
 * when §12.5c.2 wires them in.
 *
 * Kept separate from reviews.js so REVIEW_VENUE_IDS (engine.js)
 * still derives to the 8 main review venues — the alley is a
 * reveal that gates ON those, not a member of them.
 *
 * Order matches the canonical rat ordering in rats.js. Audio
 * engine + alley modal can iterate or shuffle as needed.
 */

export const alleyOneLiners = [
  {
    reviewerId: 'razor-whisker',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `every show ends here eventually. someone always brings a thermos. five stars.`,
  },
  {
    reviewerId: 'dj-nibblers',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `the corner sets here are RAW. no monitors no lasers just RATS. five stars and the BPM is whatever the JMZ is doing.`,
  },
  {
    reviewerId: 'pinky-mae',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `I have nothing to promote here and it's the best feeling. five stars. (lie. always promoting.)`,
  },
  {
    reviewerId: 'old-cheese',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `they paved everything else. they forgot this. five stars.`,
  },
  {
    reviewerId: 'tabitha-von-wyckoff',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `raw, real, refusing to be aestheticized. five stars. (I'm aestheticizing it.)`,
  },
  {
    reviewerId: 'comrade-crumb',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `actually existing rat solidarity. no class antagonism here. five stars. (also my mom paid for the brick.)`,
  },
  {
    reviewerId: 'mira-wong-witherspoon',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `every rat I've ever been comes here. wasian, queer, thirty, tired. five stars.`,
  },
  {
    reviewerId: 'wyckoff-six',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `we come here when we need to argue without anyone watching. five stars from all six.`,
  },
  {
    reviewerId: 'vintage-vermin',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `found a 1987 Big Gulp lid in the corner once. five stars. (I should not have told you that.)`,
  },
  {
    reviewerId: 'edible-eddie',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `everyone here. all at once. forever. it's been ten minutes? it's been seven years? five stars across all timelines.`,
  },
  {
    reviewerId: 'rosemary-rib',
    venueId: 'alley',
    rating: 5,
    date: 'April 2026',
    text: `the alley is the original site-specific work. I'm just documenting. five stars.`,
  },
];
