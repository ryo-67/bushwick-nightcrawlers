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

function json(response) {
  return response.ok ? response.json() : Promise.reject(new Error(String(response.status)));
}

export function getReactionCounts(targetId) {
  return fetch(`${ENDPOINT}?review=${encodeURIComponent(targetId)}`).then(json);
}

export function postReaction(targetId, type, delta) {
  return fetch(ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ review: targetId, type, delta }),
  }).then(json);
}
