#!/bin/bash
# scripts/convert-pin-gifs.sh
# Pipeline: gifsicle (resize) → gif2webp (animated WebP encode)
#
# Drop source GIFs in $INPUT_DIR, run script, output lands in $OUTPUT_DIR.
# Adjust TARGET_SIZE to match your render size × 2 (for retina).
#
# Requires: brew install webp gifsicle

set -euo pipefail

INPUT_DIR="${INPUT_DIR:-assets/source-pins}"
OUTPUT_DIR="${OUTPUT_DIR:-assets/pins}"
TARGET_SIZE="${TARGET_SIZE:-200}"
QUALITY="${QUALITY:-80}"

for cmd in gifsicle gif2webp; do
  if ! command -v "$cmd" &> /dev/null; then
    echo "$cmd not found. Install with: brew install webp gifsicle"
    exit 1
  fi
done

mkdir -p "$OUTPUT_DIR"

shopt -s nullglob
input_files=("$INPUT_DIR"/*.gif)

if [ ${#input_files[@]} -eq 0 ]; then
  echo "No .gif files found in $INPUT_DIR"
  exit 1
fi

echo "Converting ${#input_files[@]} GIFs → WebP at ${TARGET_SIZE}×${TARGET_SIZE}, quality $QUALITY"
echo ""

total_in=0
total_out=0
tmpdir=$(mktemp -d)
trap "rm -rf $tmpdir" EXIT

for f in "${input_files[@]}"; do
  base=$(basename "$f" .gif)
  resized="$tmpdir/${base}-resized.gif"
  output="$OUTPUT_DIR/${base}.webp"

  # Resize the GIF — preserves animation, alpha, all frames
  gifsicle --resize "${TARGET_SIZE}x${TARGET_SIZE}" "$f" -o "$resized"

  # Convert resized GIF → animated WebP (lossy, good compression)
  gif2webp -q "$QUALITY" -m 6 -lossy "$resized" -o "$output" >/dev/null 2>&1

  in_size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
  out_size=$(stat -f%z "$output" 2>/dev/null || stat -c%s "$output")
  total_in=$((total_in + in_size))
  total_out=$((total_out + out_size))

  in_kb=$((in_size / 1024))
  out_kb=$((out_size / 1024))
  pct=$((out_size * 100 / in_size))

  printf "  %-30s %5d KB → %4d KB  (%d%%)\n" "$base" "$in_kb" "$out_kb" "$pct"
done

echo ""
echo "Total: $((total_in / 1024)) KB → $((total_out / 1024)) KB  ($((total_out * 100 / total_in))%)"
echo "Output: $OUTPUT_DIR"
