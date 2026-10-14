/**
 * src/storage.js — everything the piece keeps in the visitor's
 * browser, in one place.
 *
 * localStorage and sessionStorage can throw (private mode, blocked
 * site data), so every read and write goes through these helpers,
 * which fall back to "nothing stored" instead of throwing.
 *
 * forgetVisitor() is the footer's "forget the rats you've met": it
 * clears what the piece has learned about the visitor (venues met,
 * reactions, first-visit flags) and keeps their preferences (volume,
 * mute, playback mode). A new key belongs in FORGETTABLE below if it
 * records progress rather than a preference.
 */

const VISITED_PREFIX = 'bushwick.visited.';
const REACTED_PREFIX = 'bushwick.reaction.';
const REACTION_COUNT_PREFIX = 'bushwick.reactionCount.';

export const KEYS = {
  hasEntered: 'bushwick.hasEntered',
  alleyHintSeen: 'bushwick.alleyHintSeen',
  volume: 'bushwick.audio.volume',
  muted: 'bushwick.audio.muted',
  playbackMode: 'bushwick.playback.mode',
  visited: (venueId) => `${VISITED_PREFIX}${venueId}`,
  reacted: (targetId, type) => `${REACTED_PREFIX}${targetId}.${type}`,
  reactionCount: (targetId, type) => `${REACTION_COUNT_PREFIX}${targetId}.${type}`,
};

// Session flag: set on Enter, so moving between the map and the
// About page doesn't replay the loading screen.
export const SESSION_ENTERED = 'intersection-entered';

const FORGETTABLE = {
  keys: [KEYS.hasEntered, KEYS.alleyHintSeen],
  prefixes: [VISITED_PREFIX, REACTED_PREFIX, REACTION_COUNT_PREFIX],
};

export function readLocal(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeLocal(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable: the value lives only as long as the page.
  }
}

export function readFlag(key) {
  return readLocal(key) === 'true';
}

export function writeFlag(key, on) {
  writeLocal(key, on ? 'true' : 'false');
}

export function readSession(key) {
  try {
    return sessionStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeSession(key, value) {
  try {
    sessionStorage.setItem(key, String(value));
  } catch {
    // Storage unavailable: the loading screen shows on every navigation.
  }
}

export function forgetVisitor() {
  try {
    for (const key of Object.keys(localStorage)) {
      if (FORGETTABLE.keys.includes(key) || FORGETTABLE.prefixes.some((p) => key.startsWith(p))) {
        localStorage.removeItem(key);
      }
    }
  } catch {
    // Storage unavailable: nothing was stored to forget.
  }
  try {
    sessionStorage.removeItem(SESSION_ENTERED);
  } catch {
    // Same.
  }
}
