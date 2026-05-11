export const venues = {
  'market-hotel': {
    id: 'market-hotel',
    displayName: 'Market Hotel',
    address: '1140 Myrtle Ave (2F)',
    reviewerId: 'razor-whisker',
    photoPath: 'assets/photos/market-hotel.webp',
    bedComponents: ['solo-cup-hits', 'piano-trio-bleed'],
    mapCoordinates: { x: 34, y: 54 },
    // Right of the pin to avoid colliding with the Mr. Kiwi /
    // Trifecta cluster sitting just below-left at 250% map scale.
    labelPosition: 'right',
  },
  'mr-kiwi': {
    id: 'mr-kiwi',
    displayName: 'Mr. Kiwi',
    address: '1140 Myrtle Ave (1F)',
    reviewerId: 'comrade-crumb',
    photoPath: 'assets/photos/mr-kiwi.webp',
    bedComponents: ['refrigerator-hum', 'fluorescent-buzz', 'spanish-radio', 'door-bell', 'conversation-murmur'],
    mapCoordinates: { x: 28, y: 60 },
    // Above the pin so the label doesn't push down onto Trifecta
    // (x:20, y:62 — directly below-left).
    labelPosition: 'top',
  },
  'trifecta': {
    id: 'trifecta',
    displayName: 'The Trifecta',
    address: 'Myrtle Ave + Broadway',
    reviewerId: 'old-cheese',
    photoPath: 'assets/photos/trifecta.webp',
    bedComponents: ['fluorescent-buzz', 'refrigerator-hum', 'fryer-hum', 'npr-podcast', 'distant-siren'],
    mapCoordinates: { x: 20, y: 62 },
  },
  'jmz-platform': {
    id: 'jmz-platform',
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
    mapCoordinates: { x: 10, y: 50 },
  },
  'alley': {
    id: 'alley',
    displayName: 'The alley',
    address: 'Behind Market Hotel',
    reviewerId: null,
    photoPath: 'assets/photos/alley.webp',
    bedComponents: ['plastic-crinkle', 'pipe-drip'],
    mapCoordinates: { x: 40, y: 64 },
  },
  'rash': {
    id: 'rash',
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
    displayName: 'Ornithology Jazz Club',
    address: '6 Suydam St',
    reviewerId: 'wyckoff-six',
    photoPath: 'assets/photos/ornithology.webp',
    bedComponents: ['piano-trio-bleed', 'conversation-murmur'],
    mapCoordinates: { x: 50, y: 78 },
  },
  'mood-ring': {
    id: 'mood-ring',
    displayName: 'Mood Ring',
    address: '1260 Myrtle Ave',
    reviewerId: 'mira-wong-witherspoon',
    photoPath: 'assets/photos/mood-ring.webp',
    bedComponents: ['smoke-machine-hiss', 'distant-techno', 'brick-wall-thump', 'photobooth-flash'],
    mapCoordinates: { x: 88, y: 48 },
  },
  'bossa-nova': {
    id: 'bossa-nova',
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
    displayName: 'Caffeine Underground',
    address: 'Beneath Popeyes via steam grate',
    reviewerId: 'rosemary-rib',
    photoPath: 'assets/photos/caffeine-underground.webp',
    bedComponents: ['pipe-drip', 'foil-crinkle'],
    mapCoordinates: { x: 80, y: 70 },
  },
};
