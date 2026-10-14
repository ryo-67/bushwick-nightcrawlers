// Every venue on the map. `kind` says what a pin opens:
//   'review'    — a rat's review card (reviews.js holds the text)
//   'gathering' — the alley: mini-cards for every rat, no review
//   'memorial'  — a closed venue's tombstone (Rash)
// Optional behaviour lives in data, not in code that checks ids:
//   unlockAfterVisits / lockedMessage — the pin stays greyed out
//     until that many review venues have been opened
//   closedNote  — the stamp across a memorial's photo
//   trainOnOpen — opening the pin fires a train pass
export const venues = {
  'market-hotel': {
    id: 'market-hotel',
    kind: 'review',
    displayName: 'Market Hotel',
    address: '1140 Myrtle Ave (2F)',
    reviewerId: 'razor-whisker',
    photoPath: 'assets/photos/market-hotel.webp',
    bedComponents: ['solo-cup-hits', 'piano-trio-bleed'],
    mapCoordinates: { x: 34, y: 54 },
    // V7: above the pin (changed from 'right'). Right placement
    // collided with neighboring labels at 250% scale.
    labelPosition: 'top',
  },
  'mr-kiwi': {
    id: 'mr-kiwi',
    kind: 'review',
    displayName: 'Mr. Kiwi',
    address: '1140 Myrtle Ave (1F)',
    reviewerId: 'comrade-crumb',
    photoPath: 'assets/photos/mr-kiwi.webp',
    bedComponents: ['refrigerator-hum', 'fluorescent-buzz', 'spanish-radio', 'door-bell', 'conversation-murmur'],
    mapCoordinates: { x: 28, y: 60 },
    // V7: default bottom placement (changed from 'top'). Top
    // collided with Market Hotel's new top label.
    labelPosition: 'bottom',
  },
  'trifecta': {
    id: 'trifecta',
    kind: 'review',
    displayName: 'The Trifecta',
    address: 'Myrtle Ave + Broadway',
    reviewerId: 'old-cheese',
    photoPath: 'assets/photos/trifecta.webp',
    bedComponents: ['fluorescent-buzz', 'refrigerator-hum', 'fryer-hum', 'npr-podcast', 'distant-siren'],
    mapCoordinates: { x: 20, y: 62 },
  },
  'jmz-platform': {
    id: 'jmz-platform',
    kind: 'review',
    displayName: 'JMZ platform',
    address: 'Above the intersection',
    reviewerId: 'pinky-mae',
    photoPath: 'assets/photos/jmz-platform.webp',
    bedComponents: ['pigeon-coo', 'wind-through-metal', 'distant-siren', 'mta-announcement', 'train'],
    // bedAmbient: the JMZ rumble + intermittent train passes are
    // architectural to the intersection and play from page load
    // (initBeds), not gated on visiting this pin. Field is metadata —
    // runtime ambient logic lives in beds.js.
    bedAmbient: true,
    trainOnOpen: true,
    mapCoordinates: { x: 10, y: 50 },
  },
  'alley': {
    id: 'alley',
    kind: 'gathering',
    unlockAfterVisits: 5,
    lockedMessage: "the rats don't know you yet. come back when you've met more of us.",
    displayName: 'The Alley',
    address: 'Behind Market Hotel',
    reviewerId: null,
    photoPath: 'assets/photos/alley.webp',
    bedComponents: ['plastic-crinkle', 'pipe-drip'],
    mapCoordinates: { x: 40, y: 64 },
  },
  'rash': {
    id: 'rash',
    kind: 'memorial',
    closedNote: '[closed February 2026]',
    displayName: 'Rash',
    address: '941 Willoughby Ave',
    reviewerId: null,
    photoPath: 'assets/photos/rash.webp',
    bedComponents: ['firetruck'],
    // bedPersistent: once the user has visited Rash, the firetruck
    // siren stays as a faint background layer — Rash is permanently
    // closed and the lingering alarm is the only sound from the site.
    // Runtime persistence handled in beds.js via VENUE_BED_MAP entry.
    bedPersistent: true,
    mapCoordinates: { x: 52, y: 42 },
    // Tombstone epitaph. Array of paragraphs (one <p> per item)
    // rendered below the [CLOSED FEBRUARY 2026] label by
    // buildTombstoneCard. Last paragraph is the closer.
    tombstoneEpitaph: [
      'the red bulbs are off.',
      'through the fire of 2022, through the long reopening, through the night the hole contest wrapped the corner and the police stood across the street pretending it didn’t exist.',
      'simmered under the skin for a decade. Bossa Nova survived its fire. Pink Metal couldn’t.',
      'a bartender said: we weren’t making a lot of money. heard that too often this year.',
      'five stars from the dumpster.',
    ],
  },
  'ornithology': {
    id: 'ornithology',
    kind: 'review',
    displayName: 'Ornithology Jazz Club',
    address: '6 Suydam St',
    reviewerId: 'wyckoff-six',
    photoPath: 'assets/photos/ornithology.webp',
    bedComponents: ['piano-trio-bleed', 'conversation-murmur'],
    mapCoordinates: { x: 50, y: 78 },
  },
  'mood-ring': {
    id: 'mood-ring',
    kind: 'review',
    displayName: 'Mood Ring',
    address: '1260 Myrtle Ave',
    reviewerId: 'mira-wong-witherspoon',
    photoPath: 'assets/photos/mood-ring.webp',
    bedComponents: ['smoke-machine-hiss', 'distant-techno', 'brick-wall-thump', 'photobooth-flash'],
    mapCoordinates: { x: 88, y: 48 },
  },
  'bossa-nova': {
    id: 'bossa-nova',
    kind: 'review',
    displayName: 'Bossa Nova Civic Club',
    address: '1271 Myrtle Ave',
    reviewerId: 'dj-nibblers',
    photoPath: 'assets/photos/bossa-nova.webp',
    bedComponents: ['smoke-machine-hiss', 'distant-techno', 'brick-wall-thump'],
    mapCoordinates: { x: 80, y: 38 },
    // Above the pin — Mood Ring (x:88, y:48) sits below-right;
    // labeling below would crowd the gap between them.
    labelPosition: 'top',
  },
  // Fictional placement: the real Caffeine Underground is ~3 blocks
  // east of the map frame. Kept on-piece for cultural completeness.
  'caffeine-underground': {
    id: 'caffeine-underground',
    kind: 'review',
    displayName: 'Caffeine Underground',
    address: 'Beneath Popeyes via steam grate',
    reviewerId: 'rosemary-rib',
    // No photo: none could be licensed (urban75's terms forbid web
    // reuse). The peek shows a redaction frame instead.
    photoRedacted: {
      stamp: '[no signal]',
      note: "photos don't develop this far down",
    },
    bedComponents: ['pipe-drip', 'foil-crinkle'],
    mapCoordinates: { x: 80, y: 70 },
  },
};
