/**
 * src/audio/rat-generator.js — word-by-word USV scheduling per STRATEGY §10.4.
 *
 * Each word of the review text:
 *   1. picks a bank (usvs vs usvs-cocaine) based on keyword override
 *      then cocaineRatio probability
 *   2. computes which duration tiers are eligible from word context
 *      (sentence-end, comma-end, all-caps, parenthetical, default)
 *   3. applies the rat's tierSkew preference within that eligible set
 *   4. picks one sample uniformly from the resulting pool
 *   5. schedules audio playback at the cumulative cursor time
 *   6. schedules a Tone.Draw highlight at the same time so the DOM
 *      update is sample-accurate (not setTimeout-jittery)
 *   7. advances the cursor by sample.duration plus a small pause
 *      after sentence-ending words
 *
 * Playback mode (read at start() time):
 *   'moment' — Math.random, generative each play
 *   'record' — seeded mulberry32, deterministic per (reviewerId,text)
 *
 * Pause behavior: stop() halts immediately; clicking play again
 * restarts from word 0. No mid-stream resume in this version.
 */

import * as engine from './engine.js';
import { getMode } from './playback-mode.js';

function fnv1a(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i += 1) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function mulberry32(seed) {
  let s = seed >>> 0;
  return function next() {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function normalizeWord(word) {
  return word
    .toLowerCase()
    .replace(/^[^\w]+/, '')
    .replace(/[^\w]+$/, '');
}

function tokenize(text, triggerSet) {
  const tokens = text.split(/(\s+)/);
  const words = [];
  let index = 0;
  for (const t of tokens) {
    if (t === '' || /^\s+$/.test(t)) continue;
    const lower = normalizeWord(t);
    const lettersOnly = t.replace(/[^A-Za-z]/g, '');
    const isAllCaps =
      lettersOnly.length >= 2 && lettersOnly === lettersOnly.toUpperCase();
    words.push({
      index,
      raw: t,
      lower,
      isAllCaps,
      isSentenceEnd: /[.!?]$/.test(t),
      isCommaEnd: /[,;:]$/.test(t),
      isParenthetical: /^\(/.test(t) || /\)$/.test(t),
      isKeywordTrigger: triggerSet.has(lower),
    });
    index += 1;
  }
  return words;
}

function eligibleTiers(word) {
  if (word.isSentenceEnd) return ['long', 'extra-long'];
  if (word.isCommaEnd) return ['medium'];
  if (word.isAllCaps) return ['medium', 'long'];
  if (word.isParenthetical) return ['short', 'medium'];
  return ['short', 'medium'];
}

function applyTierSkew(eligible, skew, rng) {
  if (!skew || skew === 'mixed' || skew === 'chaotic') return eligible;
  if (skew === 'short with occasional long') {
    if (rng() < 0.75 && eligible.includes('short')) return ['short'];
    return eligible;
  }
  const preferenceMap = {
    'short-dominant': ['short'],
    'medium-dominant': ['medium'],
    'medium/long dominant': ['medium', 'long'],
    'short-across-all': ['short'],
  };
  const preferred = preferenceMap[skew];
  if (!preferred) return eligible;
  const intersect = eligible.filter((t) => preferred.includes(t));
  return intersect.length > 0 ? intersect : eligible;
}

export class RatGenerator {
  constructor(profile, reviewText, reviewerId, modal) {
    this.profile = profile;
    this.reviewText = reviewText;
    this.reviewerId = reviewerId;
    this.modal = modal;
    const triggerSet = new Set(
      (profile.keywordTriggers || []).map((s) => s.toLowerCase())
    );
    this.words = tokenize(reviewText, triggerSet);
    this.activeSources = [];
    this._isPlaying = false;
    this.playbackId = 0;
    this.onComplete = null;
    this.rng = Math.random;
    this.mode = 'moment';
    // perRatGain is the recency-ladder volume slot for this rat.
    // Created lazily at start() since engine.getRatGain() may not
    // exist before engine.start() resolves.
    this.perRatGain = null;
    this._disposed = false;
  }

  ensurePerRatGain() {
    if (this.perRatGain || this._disposed) return this.perRatGain;
    const Tone = window.Tone;
    const ratGain = engine.getRatGain();
    if (!ratGain) return null;
    this.perRatGain = new Tone.Gain(1).connect(ratGain);
    return this.perRatGain;
  }

  isPlaying() {
    return this._isPlaying;
  }

  configureRng() {
    this.mode = getMode();
    if (this.mode === 'record') {
      const seed = fnv1a(`${this.reviewerId}\n${this.reviewText}`);
      this.rng = mulberry32(seed);
    } else {
      this.rng = Math.random;
    }
  }

  pickSample(word) {
    const useCocaine =
      word.isKeywordTrigger || this.rng() < this.profile.cocaineRatio;
    const bankName = useCocaine ? 'usvs-cocaine' : 'usvs';
    const bank = engine.getBank(bankName);
    if (bank.length === 0) return null;

    const eligible = eligibleTiers(word);
    const skewed = applyTierSkew(eligible, this.profile.tierSkew, this.rng);
    let pool = bank.filter((s) => skewed.includes(s.tier));
    if (pool.length === 0) pool = bank.filter((s) => eligible.includes(s.tier));
    if (pool.length === 0) pool = bank;
    return pool[Math.floor(this.rng() * pool.length)];
  }

  start() {
    if (this._disposed) return;
    if (this._isPlaying) return;
    this.stop();
    this.configureRng();
    this._isPlaying = true;
    this.playbackId += 1;
    const myId = this.playbackId;

    const Tone = window.Tone;
    const perRatGain = this.ensurePerRatGain();
    let cursor = Tone.now() + 0.05;

    for (let i = 0; i < this.words.length; i += 1) {
      const word = this.words[i];
      const sample = this.pickSample(word);

      if (sample) {
        const source = new Tone.ToneBufferSource(sample.buffer);
        if (perRatGain) source.connect(perRatGain);
        else source.toDestination();
        source.start(cursor);
        this.activeSources.push(source);
      }

      const wordTime = cursor;
      Tone.Draw.schedule(() => {
        if (myId !== this.playbackId) return;
        this.modal?.highlightWord?.(i);
      }, wordTime);

      const dur = sample ? sample.duration : 0.2;
      cursor += dur;
      if (word.isSentenceEnd) {
        cursor += 0.2 + this.rng() * 0.2;
      }
    }

    const endTime = cursor;
    Tone.Draw.schedule(() => {
      if (myId !== this.playbackId) return;
      this._isPlaying = false;
      this.modal?.clearHighlights?.();
      this.onComplete?.();
    }, endTime);
  }

  stop() {
    this.playbackId += 1;
    this._isPlaying = false;
    for (const s of this.activeSources) {
      try {
        s.stop();
        s.dispose();
      } catch {
        // already stopped/disposed — fine
      }
    }
    this.activeSources = [];
    this.modal?.clearHighlights?.();
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.stop();
    if (this.perRatGain) {
      try {
        this.perRatGain.dispose();
      } catch {
        // already disposed
      }
      this.perRatGain = null;
    }
    this.modal = null;
    this.onComplete = null;
  }

  fadeOutAndDispose(seconds) {
    if (this._disposed) return;
    if (this.perRatGain) {
      const Tone = window.Tone;
      const now = Tone.now();
      try {
        this.perRatGain.gain.cancelScheduledValues(now);
        this.perRatGain.gain.setValueAtTime(this.perRatGain.gain.value, now);
        this.perRatGain.gain.linearRampToValueAtTime(0, now + seconds);
      } catch {
        // gain node already torn down
      }
    }
    setTimeout(() => this.dispose(), seconds * 1000 + 50);
  }
}
