#!/usr/bin/env python3
"""
Batch-extract individual sound events from longer audio files using
silence detection, with a full processing chain (bandpass, normalize,
noise gate, fades) so output matches the Zenodo USV bank for level
and tone consistency.

Setup:
    pip install pydub numpy scipy
    (also needs ffmpeg on PATH — `brew install ffmpeg` on macOS)

Usage:
    python extract_squeaks.py <input_dir> <output_dir>

Each input file produces multiple output WAVs, one per detected event.
Segments shorter than MIN_CHUNK_MS or longer than MAX_CHUNK_MS are
discarded as noise / not-a-squeak.

Output: 44.1 kHz mono WAV, peak normalized to -6 dB, gate-cleaned,
bandpass 1500-10000 Hz, with 10ms/20ms fades on each end.
"""

import os
import sys
import numpy as np
from pydub import AudioSegment
from pydub.effects import normalize
from pydub.scipy_effects import band_pass_filter
from pydub.silence import split_on_silence

# Silence detection (controls how the file gets sliced into chunks)
MIN_SILENCE_MS    = 200    # min silence length that counts as a separator
SILENCE_DB_BELOW  = 24     # silence threshold, dB below file's average loudness
KEEP_SILENCE_MS   = 30     # padding kept at start/end of each chunk
MIN_CHUNK_MS      = 50     # discard chunks shorter than this
MAX_CHUNK_MS      = 2000   # discard chunks longer than this

# Processing chain (matches Zenodo cocaine bank for consistency)
BANDPASS_LOW_HZ   = 1500   # cuts low-frequency ambient (fridge hum, room tone)
BANDPASS_HIGH_HZ  = 10000  # cuts high-frequency hiss
NORMALIZE_HEADROOM_DB = 6  # peak target relative to 0 dBFS (-6 dB peak)
GATE_THRESHOLD_DB = -30    # gate kills audio below this (relative to normalized peak)
GATE_ATTACK_MS    = 2      # how fast gate opens
GATE_RELEASE_MS   = 30     # how fast gate closes
FADE_IN_MS        = 10
FADE_OUT_MS       = 20

def noise_gate(seg, threshold_db, frame_ms=10, attack_ms=2, release_ms=30):
    """Frame-based noise gate. Threshold assumes signal is normalized."""
    samples = np.array(seg.get_array_of_samples(), dtype=np.float32)
    sr = seg.frame_rate

    frame_size = max(1, int(frame_ms * sr / 1000))
    threshold = (10 ** (threshold_db / 20)) * 32768

    n_frames = len(samples) // frame_size
    gate = np.zeros(len(samples), dtype=np.float32)
    for i in range(n_frames):
        frame = samples[i*frame_size:(i+1)*frame_size]
        rms = np.sqrt(np.mean(frame ** 2))
        if rms > threshold:
            gate[i*frame_size:(i+1)*frame_size] = 1.0

    attack_c = 1.0 - np.exp(-1.0 / (attack_ms * sr / 1000))
    release_c = 1.0 - np.exp(-1.0 / (release_ms * sr / 1000))
    smoothed = np.zeros_like(gate)
    for i in range(1, len(gate)):
        coeff = attack_c if gate[i] > smoothed[i-1] else release_c
        smoothed[i] = smoothed[i-1] + (gate[i] - smoothed[i-1]) * coeff

    output = (samples * smoothed).astype(np.int16)
    return seg._spawn(output.tobytes())

def process_file(input_path, output_dir):
    audio = AudioSegment.from_file(input_path)

    # Force mono
    if audio.channels > 1:
        audio = audio.set_channels(1)

    # Force 44.1 kHz
    if audio.frame_rate != 44100:
        audio = audio.set_frame_rate(44100)

    # Bandpass WHOLE FILE before silence detection.
    # Removes constant ambient (room tone, hum) which improves contrast
    # for split_on_silence and gives more accurate chunk boundaries.
    audio = band_pass_filter(audio, BANDPASS_LOW_HZ, BANDPASS_HIGH_HZ)
    audio = band_pass_filter(audio, BANDPASS_LOW_HZ, BANDPASS_HIGH_HZ)

    base = os.path.splitext(os.path.basename(input_path))[0]
    base = base.replace(' ', '-').lower()  # slugify

    chunks = split_on_silence(
        audio,
        min_silence_len=MIN_SILENCE_MS,
        silence_thresh=audio.dBFS - SILENCE_DB_BELOW,
        keep_silence=KEEP_SILENCE_MS,
    )

    saved = 0
    for i, chunk in enumerate(chunks):
        if not (MIN_CHUNK_MS <= len(chunk) <= MAX_CHUNK_MS):
            continue

        # Per-chunk processing chain (mirrors Zenodo bank)
        chunk = normalize(chunk, headroom=NORMALIZE_HEADROOM_DB)
        chunk = noise_gate(chunk, GATE_THRESHOLD_DB,
                          attack_ms=GATE_ATTACK_MS, release_ms=GATE_RELEASE_MS)
        chunk = chunk.fade_in(FADE_IN_MS).fade_out(FADE_OUT_MS)

        out = os.path.join(output_dir, f"{base}_seg{i:03d}.wav")
        chunk.export(out, format="wav")
        saved += 1

    return saved, len(chunks)

if __name__ == "__main__":
    if len(sys.argv) != 3:
        print("Usage: python extract_squeaks.py <input_dir> <output_dir>")
        sys.exit(1)

    input_dir, output_dir = sys.argv[1], sys.argv[2]
    os.makedirs(output_dir, exist_ok=True)

    total_files = 0
    total_segments = 0
    for f in sorted(os.listdir(input_dir)):
        if f.lower().endswith(('.wav', '.mp3', '.flac', '.ogg', '.m4a', '.aac', '.opus', '.aiff')):
            path = os.path.join(input_dir, f)
            try:
                saved, total = process_file(path, output_dir)
                print(f"{f}: kept {saved}/{total} segments")
                total_files += 1
                total_segments += saved
            except Exception as e:
                print(f"{f}: SKIPPED ({e})")

    print(f"\nProcessed {total_files} files. Total segments saved: {total_segments}")

# Tuning notes:
#
# SILENCE DETECTION — controls how the file gets sliced
#
# Too few segments per file (script merging multiple squeaks into one chunk):
#   - LOWER MIN_SILENCE_MS to 100 or 50
#   - LOWER SILENCE_DB_BELOW to 16
#
# Too many segments per file (one squeak split into pieces):
#   - RAISE MIN_SILENCE_MS to 400 or 500
#   - RAISE SILENCE_DB_BELOW to 30
#
# Edges clipped (squeak cut off mid-call):
#   - RAISE KEEP_SILENCE_MS to 50 or 100
#
# Lots of tiny noise segments getting through:
#   - RAISE MIN_CHUNK_MS to 100
#
# PROCESSING CHAIN — controls tone and level
#
# Output sounds thin, lost body:
#   - LOWER BANDPASS_LOW_HZ to 1000 or 800
#
# Output still has rumble/hum:
#   - RAISE BANDPASS_LOW_HZ to 2000 or 2500
#
# Gate too aggressive (squeak tails getting cut):
#   - RAISE GATE_THRESHOLD_DB to -35 or -40 (less gating)
#   - RAISE GATE_RELEASE_MS to 50 or 80 (gate stays open longer)
#
# Audible click on gate open:
#   - RAISE GATE_ATTACK_MS to 5 (gentler open)
#
# Output too quiet vs cocaine bank:
#   - LOWER NORMALIZE_HEADROOM_DB to 3 (peak closer to 0 dBFS)
