/**
 * api/reactions.js — shared reaction counters (Vercel Function).
 *
 * The piece's first social layer: visitor reactions persist
 * globally, so the next visitor sees everyone's useful/funny/cool
 * tallies. The rats speak in the moment; the visitors accumulate
 * on record.
 *
 * GET  /api/reactions?review=<reviewerId>
 *        → { helpful: n, funny: n, cool: n }
 * POST /api/reactions  { review, type, delta }  (delta ∈ {1, -1})
 *        → { helpful: n, funny: n, cool: n }   (post-update)
 *
 * Storage: Upstash Redis via its REST API — plain fetch, zero npm
 * dependencies, no build step (keeps the project's no-bundler
 * rule). Provisioned through the Vercel Marketplace; either env
 * naming (UPSTASH_* or the marketplace's KV_*) works.
 *
 * Rate limit: per-IP, fixed one-minute buckets in the same Redis
 * (rl:<ip>:<minute> with a 90s TTL). Client identity beyond IP is
 * deliberately not tracked — no PII, just counters.
 *
 * Dedup is the honest-visitor model: the client's localStorage
 * remembers whether *you* reacted; the server only counts.
 */
import { reviews } from '../src/content/reviews.js';

const VALID_TYPES = new Set([
  'helpful',
  'thanks',
  'love',
  'ohno',
  'report',
  'respects',
]);
// Reaction targets are reviewer ids, plus memorial venue ids —
// closed venues with no reviewer whose tombstone takes reactions
// (currently Rash's pay-respects counter).
const VALID_REVIEWS = new Set(
  Object.values(reviews).map((r) => r.reviewerId)
);
VALID_REVIEWS.add('rash');
const RATE_LIMIT_PER_MIN = 30;

function redisEnv() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;
  if (!url || !token) return null;
  return { url, token };
}

async function redisPipeline(commands) {
  const env = redisEnv();
  if (!env) return null;
  const resp = await fetch(`${env.url}/pipeline`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${env.token}` },
    body: JSON.stringify(commands),
  });
  if (!resp.ok) throw new Error(`redis pipeline ${resp.status}`);
  return resp.json();
}

function countsFromHgetall(flat) {
  // Upstash returns HGETALL as a flat [field, value, ...] array.
  const counts = { helpful: 0, thanks: 0, love: 0, ohno: 0, respects: 0 };
  if (Array.isArray(flat)) {
    for (let i = 0; i + 1 < flat.length; i += 2) {
      const key = flat[i];
      if (key in counts) counts[key] = Math.max(0, parseInt(flat[i + 1], 10) || 0);
    }
  }
  return counts;
}

function clientIp(req) {
  const fwd = req.headers['x-forwarded-for'];
  if (typeof fwd === 'string' && fwd.length > 0) return fwd.split(',')[0].trim();
  return req.socket?.remoteAddress || 'unknown';
}

export default async function handler(req, res) {
  res.setHeader('Cache-Control', 'no-store');

  if (!redisEnv()) {
    // Store not provisioned — clients fall back to local counts.
    res.status(503).json({ error: 'reaction store not configured' });
    return;
  }

  try {
    if (req.method === 'GET') {
      const review = String(req.query.review || '');
      if (!VALID_REVIEWS.has(review)) {
        res.status(400).json({ error: 'unknown review' });
        return;
      }
      const [result] = await redisPipeline([
        ['HGETALL', `reactions:${review}`],
      ]);
      res.status(200).json(countsFromHgetall(result?.result));
      return;
    }

    if (req.method === 'POST') {
      const { review, type, delta } = req.body ?? {};
      if (!VALID_REVIEWS.has(review) || !VALID_TYPES.has(type)) {
        res.status(400).json({ error: 'bad request' });
        return;
      }
      const step = delta === -1 ? -1 : 1;

      // Per-IP fixed-window rate limit.
      const ip = clientIp(req);
      const bucket = Math.floor(Date.now() / 60000);
      const rlKey = `rl:${ip}:${bucket}`;
      const [rl] = await redisPipeline([
        ['INCR', rlKey],
        ['EXPIRE', rlKey, '90'],
      ]);
      if ((rl?.result ?? 0) > RATE_LIMIT_PER_MIN) {
        res.status(429).json({ error: 'rate limited' });
        return;
      }

      const key = `reactions:${review}`;
      const [, result] = await redisPipeline([
        ['HINCRBY', key, type, String(step)],
        ['HGETALL', key],
      ]);
      const counts = countsFromHgetall(result?.result);
      // Un-reactions can't push a public tally below zero.
      if (counts[type] < 0) counts[type] = 0;
      res.status(200).json(counts);
      return;
    }

    res.setHeader('Allow', 'GET, POST');
    res.status(405).json({ error: 'method not allowed' });
  } catch (err) {
    res.status(502).json({ error: 'reaction store unavailable' });
  }
}
