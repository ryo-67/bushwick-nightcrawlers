/**
 * src/components/reactions-client.js — the browser side of
 * api/reactions.js (shared visitor reaction counters).
 *
 * Both calls resolve to the target's full count map
 * ({ helpful, thanks, love, ohno, respects }) and reject when the API
 * is absent or refuses (static dev server, outage, rate limit), so
 * callers can fall back to local counts.
 */

const ENDPOINT = '/api/reactions';

// GETs already on their way, by target, so a hover followed quickly
// by a click shares one request.
const inFlight = new Map();
// Told whenever the server sends a target's counts (a GET or the
// reply to a POST), so other views — the peek card's tally — catch
// up with your own reaction instead of staying stale.
const listeners = new Set();

function json(response) {
  return response.ok ? response.json() : Promise.reject(new Error(String(response.status)));
}

function announce(targetId, counts) {
  for (const fn of listeners) fn(targetId, counts);
  return counts;
}

export function onReactionCounts(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function getReactionCounts(targetId) {
  if (!inFlight.has(targetId)) {
    const request = fetch(`${ENDPOINT}?review=${encodeURIComponent(targetId)}`)
      .then(json)
      .then((counts) => announce(targetId, counts))
      .finally(() => inFlight.delete(targetId));
    inFlight.set(targetId, request);
  }
  return inFlight.get(targetId);
}

export function postReaction(targetId, type, delta) {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review: targetId, type, delta }),
  })
    .then(json)
    .then((counts) => announce(targetId, counts));
}
