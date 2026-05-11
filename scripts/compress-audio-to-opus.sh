#!/bin/bash
# Convert source audio files in assets/sounds/** to .webm
# (Opus codec at 96k). Targets WAV, FLAC, MP3, OGG, AIFF
# sources. Each successful conversion deletes the source AND
# any corresponding .m4a (the old AAC version), so the
# working tree ends up with only .webm.
#
# Firefox refuses to decode our ffmpeg-encoded AAC, so this
# is the cross-browser-safe replacement codec. Single lossy
# pass from WAV originals (recovered from git history) keeps
# the encoding chain clean.
#
# Run from repo root:
#   bash scripts/compress-audio-to-opus.sh

set -e

BITRATE="96k"

convert_one() {
  local f="$1"
  local out="${f%.*}.webm"
  if ffmpeg -i "$f" -c:a libopus -b:a "$BITRATE" "$out" -y -loglevel warning 2>/dev/null; then
    rm "$f"
    # Delete the old .m4a with the same basename, if present
    local m4a="${f%.*}.m4a"
    [ -f "$m4a" ] && rm "$m4a"
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

echo "Compressing audio to WebM (Opus) at $BITRATE..."
echo ""

convert_dir "assets/sounds/usvs"
convert_dir "assets/sounds/usvs-cocaine"
convert_dir "assets/sounds/effects"
convert_dir "assets/sounds/ambient"

# Top-level files (defensive — main assets are in subdirs)
for ext in wav flac mp3 ogg aiff; do
  for f in assets/sounds/*."$ext"; do
    [ -f "$f" ] || continue
    convert_one "$f"
  done
done

echo ""
echo "Done. Checking for any remaining non-.webm audio files..."
remaining=$(find assets/sounds \( -name "*.m4a" -o -name "*.wav" -o -name "*.flac" -o -name "*.mp3" -o -name "*.ogg" -o -name "*.aiff" \) 2>/dev/null)
if [ -n "$remaining" ]; then
  echo ""
  echo "WARNING: non-.webm audio files remain:"
  echo "$remaining"
  echo ""
  echo "Either failed conversion or unrecovered source. Check git history."
  exit 1
fi
echo "All audio is .webm. Total size:"
du -sh assets/sounds
