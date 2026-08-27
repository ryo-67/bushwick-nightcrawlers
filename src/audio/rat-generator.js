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
import { matchKeyword } from './keyword-effects.js';
import { matchProcessor } from './keyword-processors.js';
import { panForVenue } from './spatial.js';
import { USV_FEATURES } from './usv-features.js';
import { syllableCount } from './syllables.js';

// V68 A/B flag: `?voice=syllabic` switches the general register from
// one-sample-per-word to syllabic synthesis (see scheduleSyllabicWord).
// Default stays the word-level engine until the syllabic mode is
// approved by ear. Cocaine-register words are word-level in BOTH
// modes — the drug register smears the language (user call, Aug 2026).
const VOICE_MODE = (() => {
  try {
    return new URLSearchParams(window.location.search).get('voice') || 'word';
  } catch {
    return 'word';
  }
})();

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

// ——— Syllabic voice mode (V68) ———————————————————————————————
//
// Words become sequences of short USVs at syllable rate. The word
// itself seeds the sequence (fnv1a of the normalized word), so the
// same word produces the same squeak run in every review, every
// visit, both playback modes — the translation is real. Rat identity
// lives in the voice (per-rat playback rate, syllable tempo, and the
// existing per-rat chain), not in sample choice.

// tierSkew personality → syllables per second. Manic rats talk fast.
const SYLLABLE_RATES = {
  'short-dominant': 6,
  'short-across-all': 6,
  'short with occasional long': 5.5,
  chaotic: 5,
  mixed: 5,
  'medium-dominant': 4.5,
  'medium/long dominant': 4,
};

// Pools from the general bank, filtered by the analyzed effective
// duration (usv-features.js): syllables need <=250ms of actual
// sound; sentence tails may run longer for word-final lengthening.
let syllablePools = null;
function getSyllablePools() {
  if (syllablePools) return syllablePools;
  const bank = engine.getBank('usvs');
  if (!bank || bank.length === 0) return null;
  const feats = USV_FEATURES.usvs;
  const short = [];
  const tails = [];
  const byContour = {};
  for (const s of bank) {
    const f = feats[s.filename];
    if (!f) continue;
    const entry = { ...s, eff: f.eff, onset: f.onset, contour: f.contour };
    if (f.eff <= 0.25) {
      short.push(entry);
      (byContour[f.contour] ||= []).push(entry);
    }
    if (f.eff > 0.2 && f.eff <= 0.45 && f.contour !== 'rise') {
      tails.push(entry);
    }
  }
  if (short.length === 0) return null;
  syllablePools = { short, tails, byContour };
  return syllablePools;
}

// Contour seasoning: a soft positional bias — openings lean trill,
// closings lean fall, middles lean flat. Deliberately subtle (60/40
// against the whole pool): texture, not a legend.
function pickSyllableSample(pools, wordRng, pos, n) {
  const biasClass = pos === 0 ? 'trill' : pos === n - 1 ? 'fall' : 'flat';
  const biased = pools.byContour[biasClass];
  const useBias = wordRng() < 0.6 && biased && biased.length > 0;
  const pool = useBias ? biased : pools.short;
  return pool[Math.floor(wordRng() * pool.length)];
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
  constructor(profile, reviewText, reviewerId, modal, venueId = null) {
    this.profile = profile;
    this.reviewText = reviewText;
    this.reviewerId = reviewerId;
    this.modal = modal;
    // Where this rat sits in the stereo field (see spatial.js).
    // Null venueId (unknown) pans center.
    this.venueId = venueId;
    const triggerSet = new Set(
      (profile.keywordTriggers || []).map((s) => s.toLowerCase())
    );
    this.words = tokenize(reviewText, triggerSet);
    // Syllabic-mode voice identity: the word decides the samples, the
    // rat decides the voice — a stable per-rat playback-rate offset
    // (pitch/speed) and syllable tempo derived from the reviewer id.
    const idHash = fnv1a(reviewerId || 'rat');
    this.voiceRate = 0.94 + ((idHash % 997) / 997) * 0.12;
    this.voiceTempo = 0.92 + (((idHash >>> 8) % 997) / 997) * 0.16;
    this.activeSources = [];
    this._isPlaying = false;
    this.playbackId = 0;
    this.onComplete = null;
    this.rng = Math.random;
    this.mode = 'moment';
    // Per-rat audio chain. Created lazily at start() since engine
    // nodes don't exist until engine.start() resolves.
    //
    //   source → perRatLPF ─┬─→ perRatGain → ratGain → Destination
    //                       └─→ perRatReverbSend → sharedRatReverb
    //                                              → ratGain → Destination
    //
    // perRatLPF: air-absorption mimic — older rats lose treble
    // perRatGain: recency-ladder volume slot
    // perRatReverbSend: wet-path send — older rats hear-through-reflections
    this.perRatGain = null;
    this.perRatLPF = null;
    this.perRatReverbSend = null;
    // §12.4c processor nodes — created only if profile.processors
    // declares them. Sit upstream of perRatLPF so processor-modulated
    // voice still rides the recency-ladder spatial treatment.
    this.kHolePhaser = null;
    this.kHolePingPong = null;
    this.kHoleLPF = null;
    this.glitchDelay = null;
    this.glitchVibrato = null;
    this._chainHead = null;
    // Lazy Map<effectName, Tone.Player> created on first keyword fire.
    // Players connect to perRatLPF so effects ride the same spatial
    // treatment as the rat at its current rank.
    this.effectPlayers = null;
    this._disposed = false;
  }

  ensurePerRatChain() {
    if (this._disposed) return null;
    if (this._chainHead) return this._chainHead;
    const Tone = window.Tone;
    const ratGain = engine.getRatGain();
    const reverb = engine.getSharedRatReverb();
    if (!ratGain || !reverb) return null;

    // Always-present part of the chain (recency-ladder + reverb send).
    // Initial values match foreground (rank 0). Engine.recomputeLadder
    // ramps to the correct rank within RAT_LADDER_RAMP_SEC of registration.
    this.perRatLPF = new Tone.Filter(20000, 'lowpass');
    // Spatial: the dry voice sits where the venue's pin sits on
    // the map. The reverb send stays unpanned — the shared reverb
    // reads as the room, diffuse around the listener.
    this.perRatPanner = new Tone.Panner(panForVenue(this.venueId)).connect(ratGain);
    this.perRatGain = new Tone.Gain(1).connect(this.perRatPanner);
    this.perRatReverbSend = new Tone.Gain(0).connect(reverb);
    this.perRatLPF.connect(this.perRatGain);
    this.perRatLPF.connect(this.perRatReverbSend);

    // Optional processor chain upstream of perRatLPF. Each processor
    // is per-rat opt-in via profile.processors. Sample-effect Players
    // (keyword-effects.js) bypass the processor by connecting directly
    // to perRatLPF — chimes/coughs aren't k-holed.
    let head = this.perRatLPF;
    const processors = (this.profile && this.profile.processors) || [];

    if (processors.includes('k-hole')) {
      this.kHolePhaser = new Tone.Phaser({
        frequency: 0.4,
        octaves: 4,
        baseFrequency: 350,
        wet: 0,
      });
      this.kHolePingPong = new Tone.PingPongDelay({
        delayTime: 0.18,
        feedback: 0.35,
        wet: 0,
      });
      this.kHoleLPF = new Tone.Filter({
        type: 'lowpass',
        frequency: 20000,
        rolloff: -24,
      });
      this.kHolePhaser.connect(this.kHolePingPong);
      this.kHolePingPong.connect(this.kHoleLPF);
      this.kHoleLPF.connect(head);
      head = this.kHolePhaser;
    }

    if (processors.includes('time-glitch')) {
      this.glitchDelay = new Tone.FeedbackDelay({
        delayTime: 0.04,
        feedback: 0.6,
        wet: 0,
      });
      this.glitchVibrato = new Tone.Vibrato({
        frequency: 11,
        depth: 0,
        type: 'sine',
      });
      this.glitchDelay.connect(this.glitchVibrato);
      this.glitchVibrato.connect(head);
      head = this.glitchDelay;
    }

    this._chainHead = head;
    return head;
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

  pickSample(word, useCocaine) {
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

  // V68: one word as a run of syllable-rate USVs. Sequence is seeded
  // by the word itself — "IMMACULATE" squeaks identically wherever
  // and whenever it's spoken. Sentence-end words take a longer
  // fall/flat tail (word-final lengthening). Returns the word's
  // scheduled duration including its trailing gap.
  scheduleSyllabicWord(word, cursor, chainHead, pools) {
    const Tone = window.Tone;
    const n = Math.max(1, syllableCount(word.lower || word.raw));
    const wordRng = mulberry32(fnv1a(word.lower || word.raw));
    const rate = (SYLLABLE_RATES[this.profile.tierSkew] || 5) * this.voiceTempo;
    const slot = 1 / rate;
    let lastDur = slot;
    for (let k = 0; k < n; k += 1) {
      const isTail = word.isSentenceEnd && k === n - 1;
      let sample;
      if (isTail && pools.tails.length > 0) {
        sample = pools.tails[Math.floor(wordRng() * pools.tails.length)];
      } else {
        sample = pickSyllableSample(pools, wordRng, k, n);
      }
      const src = new Tone.ToneBufferSource(sample.buffer);
      src.fadeOut = 0.015;
      src.playbackRate.value = this.voiceRate * (0.97 + wordRng() * 0.06);
      if (chainHead) src.connect(chainHead);
      else src.toDestination();
      // Skip the sample's analyzed lead-in so syllables land on the
      // grid; cap each to its slot (tails may run past it).
      const dur = isTail
        ? Math.min(sample.eff + 0.05, 0.5)
        : Math.min(sample.eff + 0.03, slot);
      src.start(cursor + k * slot, sample.onset || 0, dur);
      this.activeSources.push(src);
      if (k === n - 1) lastDur = dur;
    }
    const gap = Math.max(0.14, slot * 0.75);
    return (n - 1) * slot + Math.max(lastDur, slot * 0.6) + gap;
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
    const chainHead = this.ensurePerRatChain();
    let cursor = Tone.now() + 0.05;

    // Syllabic voice mode: general-register words run through the
    // syllable scheduler; cocaine-register words stay word-level in
    // both modes (the drug register smears the language).
    const syllabicPools =
      VOICE_MODE === 'syllabic' ? getSyllablePools() : null;

    for (let i = 0; i < this.words.length; i += 1) {
      const word = this.words[i];
      const useCocaine =
        word.isKeywordTrigger || this.rng() < this.profile.cocaineRatio;

      let wordDur;
      if (syllabicPools && !useCocaine) {
        wordDur = this.scheduleSyllabicWord(
          word,
          cursor,
          chainHead,
          syllabicPools
        );
      } else {
        const sample = this.pickSample(word, useCocaine);
        if (sample) {
          const source = new Tone.ToneBufferSource(sample.buffer);
          if (chainHead) source.connect(chainHead);
          else source.toDestination();
          source.start(cursor);
          this.activeSources.push(source);
        }
        wordDur = sample ? sample.duration : 0.2;
      }

      // Keyword-triggered effect: layers on top of the USV at the
      // same time. Routed through perRatLPF so the effect inherits
      // the rat's current rank treatment but bypasses any processor
      // chain (chimes don't get k-holed).
      const effectSpec = matchKeyword(word.raw);
      if (effectSpec) {
        this.scheduleEffect(effectSpec, cursor);
      }

      // Keyword-triggered processor: automates the rat's own audio
      // chain. Per-rat opt-in via profile.processors; the processor
      // function bails silently for rats without the relevant chain,
      // so common-word false positives ("now", "then") cost a check.
      const processor = matchProcessor(word.raw);
      if (processor) {
        processor(this, cursor);
      }

      const wordTime = cursor;
      Tone.Draw.schedule(() => {
        if (myId !== this.playbackId) return;
        this.modal?.highlightWord?.(i, this.reviewerId);
      }, wordTime);

      cursor += wordDur;
      if (word.isSentenceEnd) {
        cursor += 0.2 + this.rng() * 0.2;
      }
    }

    const endTime = cursor;
    Tone.Draw.schedule(() => {
      if (myId !== this.playbackId) return;
      this._isPlaying = false;
      this.modal?.clearHighlights?.(this.reviewerId);
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
    this.modal?.clearHighlights?.(this.reviewerId);
  }

  scheduleEffect(spec, time) {
    if (this._disposed) return;
    const primary = this.getOrCreateEffectPlayer(spec.effect);
    if (primary) {
      try {
        primary.volume.value = spec.volume;
        primary.start(time, spec.offset ?? 0);
      } catch {
        // Player may have been disposed mid-schedule, or the buffer
        // was never loaded. Skip silently.
      }
    }
    if (spec.layered) {
      for (const layerName of spec.layered) {
        const layer = this.getOrCreateEffectPlayer(layerName);
        if (!layer) continue;
        try {
          layer.volume.value = spec.volume;
          layer.start(time);
        } catch {
          // ignore
        }
      }
    }
  }

  getOrCreateEffectPlayer(effectName) {
    if (this._disposed) return null;
    if (!this.effectPlayers) this.effectPlayers = new Map();
    if (!this.effectPlayers.has(effectName)) {
      const buffer = engine.getEffectBuffer(effectName);
      if (!buffer) return null;
      const Tone = window.Tone;
      const player = new Tone.Player(buffer);
      if (this.perRatLPF) player.connect(this.perRatLPF);
      else player.toDestination();
      this.effectPlayers.set(effectName, player);
    }
    return this.effectPlayers.get(effectName);
  }

  dispose() {
    if (this._disposed) return;
    this._disposed = true;
    this.stop();
    if (this.effectPlayers) {
      for (const player of this.effectPlayers.values()) {
        try {
          player.dispose();
        } catch {
          // already disposed
        }
      }
      this.effectPlayers.clear();
      this.effectPlayers = null;
    }
    for (const node of [
      this.perRatLPF,
      this.perRatGain,
      this.perRatPanner,
      this.perRatReverbSend,
      this.kHolePhaser,
      this.kHolePingPong,
      this.kHoleLPF,
      this.glitchDelay,
      this.glitchVibrato,
    ]) {
      if (!node) continue;
      try {
        node.dispose();
      } catch {
        // already disposed
      }
    }
    this.perRatLPF = null;
    this.perRatGain = null;
    this.perRatReverbSend = null;
    this.kHolePhaser = null;
    this.kHolePingPong = null;
    this.kHoleLPF = null;
    this.glitchDelay = null;
    this.glitchVibrato = null;
    this._chainHead = null;
    this.modal = null;
    this.onComplete = null;
  }

  fadeOutAndDispose(seconds) {
    if (this._disposed) return;
    // Ramp both the dry path and the wet send to 0 so the rat fades
    // out cleanly through whichever path was carrying it.
    const Tone = window.Tone;
    const now = Tone.now();
    for (const gainNode of [this.perRatGain, this.perRatReverbSend]) {
      if (!gainNode) continue;
      try {
        gainNode.gain.cancelScheduledValues(now);
        gainNode.gain.setValueAtTime(gainNode.gain.value, now);
        gainNode.gain.linearRampToValueAtTime(0, now + seconds);
      } catch {
        // gain node already torn down
      }
    }
    setTimeout(() => this.dispose(), seconds * 1000 + 50);
  }
}
