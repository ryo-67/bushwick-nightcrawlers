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
 * Pause behavior: stop() halts immediately; clicking play again
 * restarts from word 0. No mid-stream resume in this version.
 */

import * as engine from './engine.js';

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

function applyTierSkew(eligible, skew) {
  if (!skew || skew === 'mixed' || skew === 'chaotic') return eligible;
  if (skew === 'short with occasional long') {
    if (Math.random() < 0.75 && eligible.includes('short')) return ['short'];
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
  constructor(profile, reviewText, modal) {
    this.profile = profile;
    this.modal = modal;
    const triggerSet = new Set(
      (profile.keywordTriggers || []).map((s) => s.toLowerCase())
    );
    this.words = tokenize(reviewText, triggerSet);
    this.activeSources = [];
    this._isPlaying = false;
    this.playbackId = 0;
    this.onComplete = null;
  }

  isPlaying() {
    return this._isPlaying;
  }

  pickSample(word) {
    const useCocaine =
      word.isKeywordTrigger || Math.random() < this.profile.cocaineRatio;
    const bankName = useCocaine ? 'usvs-cocaine' : 'usvs';
    const bank = engine.getBank(bankName);
    if (bank.length === 0) return null;

    const eligible = eligibleTiers(word);
    const skewed = applyTierSkew(eligible, this.profile.tierSkew);
    let pool = bank.filter((s) => skewed.includes(s.tier));
    if (pool.length === 0) pool = bank.filter((s) => eligible.includes(s.tier));
    if (pool.length === 0) pool = bank;
    return pool[Math.floor(Math.random() * pool.length)];
  }

  start() {
    if (this._isPlaying) return;
    this.stop();
    this._isPlaying = true;
    this.playbackId += 1;
    const myId = this.playbackId;

    const Tone = window.Tone;
    let cursor = Tone.now() + 0.05;

    for (let i = 0; i < this.words.length; i += 1) {
      const word = this.words[i];
      const sample = this.pickSample(word);

      if (sample) {
        const source = new Tone.ToneBufferSource(sample.buffer).toDestination();
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
        cursor += 0.2 + Math.random() * 0.2;
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
}
