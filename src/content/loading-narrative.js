// src/content/loading-narrative.js
//
// Loading screen narrative content. Imported by the loading-screen
// component. Structured as field-note cards (label + body lines)
// rather than paragraphs, to match the paste-up zine visual treatment
// in src/components/loading-screen.js.
//
// Engine-narrative connection: card 3's closing line ("Same opinions
// every time. New vocalization on every click.") corresponds to
// STRATEGY.md §1's commitment to generative-by-default playback. The
// 'in the moment' / 'on record' footer toggle (§12.6) is the
// engineering proof of this claim. The loading narrative asserts the
// orality, the engine enacts it, the toggle lets a curious listener
// verify it. Don't soften this line without revisiting §1.
//
// Source material: Béchard, D.E. "New York City's Rats Have a Secret
// Nightlife — And a Language Humans Can't Hear." Scientific American.
// https://www.scientificamerican.com/article/scientists-map-nightlife-and-communication-of-nyc-rats-to-help-urban/
//
// Direct quote used: "perhaps offering a Yelp review for passing
// comrades." Béchard, attributed to study authors' interpretation of
// a recorded soliloquy inside a garbage bag.
//
// The article references a preprint study by Mackevicius, Peterson,
// Batenkov, and El Hady, not yet peer-reviewed at time of publication.

export const LOADING_NARRATIVE = {
  title: 'The Bushwick Nightcrawlers',

  // Three field-note cards, revealed in sequence. Each has a small
  // header label and 3-4 short body lines. One line per visual line;
  // the component will render each as a separate <p> or <span>.
  cards: [
    {
      label: 'field note 01 / scale',
      body: [
        '3 million rats in NYC.',
        'About one for every three humans.',
        '500 generations of being a rat in this specific city.',
      ],
    },
    {
      label: 'field note 02 / discovery',
      body: [
        'A recent preprint study tracked them with thermal cameras and ultrasonic mics.',
        "They're screaming to each other constantly.",
        "We just don't hear it.",
      ],
    },
    {
      label: 'field note 03 / this piece',
      body: [
        'A scientist recorded one rat soliloquizing inside a garbage bag,',
        '"perhaps offering a Yelp review for passing comrades."',
        'Eleven rats. Ten venues. Reviews you can finally hear.',
        'Same opinions every time. New vocalization on every click.',
      ],
      // The article quote on line 2 should render in a different
      // visual treatment (italic + indent, like a real article pull
      // quote). The component handles this; data layer just provides
      // the text in quotation marks as a marker.
    },
  ],

  // Loading status messages. Cycles through these every ~2.5s while
  // audio buffers load. Field-researcher voice, themed to the piece.
  loadingMessages: [
    'tuning the ultrasonic mics...',
    'warming up the thermal cam...',
    'calibrating the spectrogram...',
    'deploying field equipment...',
    'waiting for the colony...',
  ],

  // Once buffers are loaded, this replaces the cycling messages and
  // the Enter button activates.
  readyMessage: 'the rats are ready.',

  cta: 'enter the intersection',

  // Returning visitor variant. Skips the card sequence and shows a
  // compressed greeting + Enter button immediately (still gated on
  // audio load if buffers haven't finished).
  //
  // Alternative greetings flagged for consideration:
  //   - "Welcome back. The alley's been waiting."
  //   - "You've been here before. They remember."
  //   - "The alley's been quiet without you. (lie. always loud.)"
  returningGreeting: 'the rats clocked you coming.',
  returningCta: 'step back in',
};
