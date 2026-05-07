/**
 * Per-rat audio profiles per STRATEGY §10.5.
 *
 *   cocaineRatio:     probability per non-keyword word of pulling from
 *                     the cocaine bank instead of the general bank.
 *                     0.0 (never) to 1.0 (always).
 *   tierSkew:         duration-tier preference within the eligible set.
 *                     One of: 'short-dominant',
 *                     'short with occasional long',
 *                     'medium-dominant', 'medium/long dominant',
 *                     'short-across-all', 'chaotic', 'mixed'.
 *   keywordTriggers:  words that, when matched (case-insensitive,
 *                     punctuation-stripped), force cocaine-bank pull
 *                     regardless of cocaineRatio.
 *
 * DJ Nibblers is at 1.0 cocaine ratio so keyword triggers are
 * functionally redundant — kept on the array for symmetry only.
 */

const SHARED_TRIGGERS = [
  'cocaine',
  'fizzy',
  'diet',
  'snow',
  'white',
  'ket',
  'ketamine',
  'powder',
  'bump',
  'rail',
  'key',
  'molly',
  'edible',
  'kHole',
  'ket-hole',
  'viral',
  'sniff',
  'IMMACULATE',
];

export const ratProfiles = {
  'dj-nibblers': {
    cocaineRatio: 1.0,
    tierSkew: 'short with occasional long',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'pinky-mae': {
    cocaineRatio: 0.65,
    tierSkew: 'short with occasional long',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'razor-whisker': {
    cocaineRatio: 0.3,
    tierSkew: 'chaotic',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'edible-eddie': {
    cocaineRatio: 0.18,
    tierSkew: 'mixed',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'old-cheese': {
    cocaineRatio: 0.0,
    tierSkew: 'medium/long dominant',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'comrade-crumb': {
    cocaineRatio: 0.0,
    tierSkew: 'medium-dominant',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'wyckoff-six': {
    cocaineRatio: 0.0,
    tierSkew: 'short-across-all',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'mira-wong-witherspoon': {
    cocaineRatio: 0.0,
    tierSkew: 'mixed',
    keywordTriggers: SHARED_TRIGGERS,
  },
  'rosemary-rib': {
    cocaineRatio: 0.0,
    tierSkew: 'mixed',
    keywordTriggers: SHARED_TRIGGERS,
  },
};
