export const venues = {
  'market-hotel': {
    id: 'market-hotel',
    displayName: 'Market Hotel',
    address: '1140 Myrtle Ave (2F)',
    reviewerId: 'razor-whisker',
    photoPath: 'assets/photos/market-hotel.jpg',
    bedComponents: ['solo-cup-hits', 'piano-trio-bleed'],
    mapCoordinates: { x: 34, y: 54 },
  },
  'mr-kiwi': {
    id: 'mr-kiwi',
    displayName: 'Mr. Kiwi',
    address: '1140 Myrtle Ave (1F)',
    reviewerId: 'comrade-crumb',
    photoPath: 'assets/photos/mr-kiwi.jpg',
    bedComponents: ['refrigerator-hum', 'fluorescent-buzz', 'spanish-radio', 'door-bell', 'conversation-murmur'],
    mapCoordinates: { x: 28, y: 60 },
  },
  'trifecta': {
    id: 'trifecta',
    displayName: 'The Trifecta',
    address: 'Myrtle Ave + Broadway',
    reviewerId: 'old-cheese',
    photoPath: 'assets/photos/trifecta.png',
    bedComponents: ['fluorescent-buzz', 'refrigerator-hum', 'fryer-hum', 'npr-podcast', 'distant-siren'],
    mapCoordinates: { x: 20, y: 62 },
  },
  'jmz-platform': {
    id: 'jmz-platform',
    displayName: 'JMZ platform',
    address: 'Above the intersection',
    reviewerId: 'pinky-mae',
    photoPath: 'assets/photos/jmz-platform.jpg',
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
    photoPath: 'assets/photos/alley.jpg',
    bedComponents: ['plastic-crinkle', 'pipe-drip'],
    mapCoordinates: { x: 40, y: 64 },
  },
  'rash': {
    id: 'rash',
    displayName: 'Rash',
    address: '941 Willoughby Ave',
    reviewerId: null,
    photoPath: 'assets/photos/rash.jpg',
    bedComponents: ['firetruck'],
    // bedPersistent: once the user has visited Rash, the firetruck
    // siren stays as a faint background layer — Rash is permanently
    // closed and the lingering alarm is the only sound from the site.
    // Runtime persistence handled in beds.js via VENUE_BED_MAP entry.
    bedPersistent: true,
    mapCoordinates: { x: 52, y: 42 },
  },
  'ornithology': {
    id: 'ornithology',
    displayName: 'Ornithology Jazz Club',
    address: '6 Suydam St',
    reviewerId: 'wyckoff-six',
    photoPath: 'assets/photos/ornithology.jpg',
    bedComponents: ['piano-trio-bleed', 'conversation-murmur'],
    mapCoordinates: { x: 50, y: 78 },
  },
  'mood-ring': {
    id: 'mood-ring',
    displayName: 'Mood Ring',
    address: '1260 Myrtle Ave',
    reviewerId: 'mira-wong-witherspoon',
    photoPath: 'assets/photos/mood-ring.jpg',
    bedComponents: ['smoke-machine-hiss', 'distant-techno', 'brick-wall-thump', 'photobooth-flash'],
    mapCoordinates: { x: 88, y: 48 },
  },
  'bossa-nova': {
    id: 'bossa-nova',
    displayName: 'Bossa Nova Civic Club',
    address: '1271 Myrtle Ave',
    reviewerId: 'dj-nibblers',
    photoPath: 'assets/photos/bossa-nova.jpg',
    bedComponents: ['smoke-machine-hiss', 'distant-techno', 'brick-wall-thump'],
    mapCoordinates: { x: 80, y: 38 },
  },
  // Fictional placement: the real Caffeine Underground is ~3 blocks
  // east of the map frame. Kept on-piece for cultural completeness.
  'caffeine-underground': {
    id: 'caffeine-underground',
    displayName: 'Caffeine Underground',
    address: 'Beneath Popeyes via steam grate',
    reviewerId: 'rosemary-rib',
    photoPath: 'assets/photos/caffeine-underground.jpg',
    bedComponents: ['pipe-drip', 'foil-crinkle'],
    mapCoordinates: { x: 80, y: 70 },
  },
};
