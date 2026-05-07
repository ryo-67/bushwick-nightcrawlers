#!/bin/bash
# Convert all .wav and .flac files in assets/sounds/** to .m4a
# (AAC codec). ~6x size reduction with no perceptible quality
# loss for the project's use case (USVs are heavily processed;
# ambient beds don't need lossless fidelity). Originals deleted
# on success; recoverable from git history if a re-encode is
# needed.
#
# Usage from repo root:
#   bash scripts/compress-audio-to-aac.sh
#
# Re-runnable: skips files that don't exist, converts any
# remaining lossless source (.wav, .flac, .mp3, .ogg, .aiff).
# Safe to run after adding new samples.

set -e

BITRATE="128k"

convert_one() {
  local f="$1"
  local out="${f%.*}.m4a"
  if ffmpeg -i "$f" -c:a aac -b:a "$BITRATE" "$out" -y -loglevel warning 2>/dev/null; then
    rm "$f"
    echo "  ✓ $(basename "$f") → $(basename "$out")"
  else
    echo "  ✗ $(basename "$f") FAILED (kept original)"
  fi
}

convert_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then return; fi
  local count=0
  for ext in wav flac mp3 ogg aiff; do
    for f in "$dir"/*."$ext"; do
      [ -f "$f" ] || continue
      convert_one "$f"
      count=$((count + 1))
    done
  done
  echo "  ($count files in $dir)"
}

echo "Compressing audio to M4A (AAC) at $BITRATE..."
echo ""

convert_dir "assets/sounds/usvs"
convert_dir "assets/sounds/usvs-cocaine"
convert_dir "assets/sounds/effects"
convert_dir "assets/sounds/ambient"

# Top-level files (defensive — main assets are now in subdirs)
for ext in wav flac mp3 ogg aiff; do
  for f in assets/sounds/*."$ext"; do
    [ -f "$f" ] || continue
    convert_one "$f"
  done
done

echo ""
echo "Done. Verify total size reduction:"
echo "  du -sh assets/sounds"
