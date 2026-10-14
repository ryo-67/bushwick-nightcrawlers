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
    photoPath: 'assets/photos/market-hotel.webp',
    mapCoordinates: { x: 34, y: 54 },
    // V7: above the pin (changed from 'right'). Right placement
    // collided with neighboring labels at 250% scale.
    labelPosition: 'top',
  },
  'mr-kiwi': {
    id: 'mr-kiwi',
    kind: 'review',
    displayName: 'Mr. Kiwi',
    photoPath: 'assets/photos/mr-kiwi.webp',
    mapCoordinates: { x: 28, y: 60 },
    // V7: default bottom placement (changed from 'top'). Top
    // collided with Market Hotel's new top label.
    labelPosition: 'bottom',
  },
  'trifecta': {
    id: 'trifecta',
    kind: 'review',
    displayName: 'The Trifecta',
    photoPath: 'assets/photos/trifecta.webp',
    mapCoordinates: { x: 20, y: 62 },
  },
  'jmz-platform': {
    id: 'jmz-platform',
    kind: 'review',
    displayName: 'JMZ platform',
    photoPath: 'assets/photos/jmz-platform.webp',
    trainOnOpen: true,
    mapCoordinates: { x: 10, y: 50 },
  },
  'alley': {
    id: 'alley',
    kind: 'gathering',
    unlockAfterVisits: 5,
    lockedMessage: "the rats don't know you yet. come back when you've met more of us.",
    displayName: 'The Alley',
    photoPath: 'assets/photos/alley.webp',
    mapCoordinates: { x: 40, y: 64 },
  },
  'rash': {
    id: 'rash',
    kind: 'memorial',
    closedNote: '[closed February 2026]',
    displayName: 'Rash',
    photoPath: 'assets/photos/rash.webp',
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
    photoPath: 'assets/photos/ornithology.webp',
    mapCoordinates: { x: 50, y: 78 },
  },
  'mood-ring': {
    id: 'mood-ring',
    kind: 'review',
    displayName: 'Mood Ring',
    photoPath: 'assets/photos/mood-ring.webp',
    mapCoordinates: { x: 88, y: 48 },
  },
  'bossa-nova': {
    id: 'bossa-nova',
    kind: 'review',
    displayName: 'Bossa Nova Civic Club',
    photoPath: 'assets/photos/bossa-nova.webp',
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
    // No photo: none could be licensed (urban75's terms forbid web
    // reuse). The peek shows a redaction frame instead.
    photoRedacted: {
      stamp: '[no signal]',
      note: "photos don't develop this far down",
    },
    mapCoordinates: { x: 80, y: 70 },
  },
};
