#!/bin/bash
# Convert all non-WAV files in assets/sounds/effects/ to 44.1 kHz WAV.
# Channel count is preserved (stereo stays stereo, mono stays mono) so
# ambient bed recordings keep their spatial information.
# Originals are deleted on successful conversion.
#
# Usage from repo root:
#   bash scripts/convert-effects.sh

set -e

SRC="assets/sounds/effects"

if [ ! -d "$SRC" ]; then
    echo "Source folder not found: $SRC"
    echo "Run from repo root."
    exit 1
fi

cd "$SRC"
echo "Converting non-WAV files in $SRC"
echo "---"

count=0
for f in *.mp3 *.m4a *.ogg *.aac *.opus *.flac; do
    # Skip if no match (bash leaves the literal glob)
    [ -f "$f" ] || continue
    echo "Converting: $f"
    if ffmpeg -i "$f" -ar 44100 "${f%.*}.wav" -y -loglevel warning; then
        rm "$f"
        count=$((count + 1))
    else
        echo "  FAILED: $f (kept original)"
    fi
done

echo "---"
if [ "$count" -eq 0 ]; then
    echo "No non-WAV files found. Nothing to convert."
else
    echo "Converted $count file(s)."
fi
echo ""
echo "Final state of $SRC:"
ls -lh *.wav 2>/dev/null || echo "  (no .wav files)"
