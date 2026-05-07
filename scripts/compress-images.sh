#!/bin/bash
# Convert .png and .jpg images in selfies + photos directories to .webp.
# ~5-8x size reduction at quality 82. Originals deleted on success.
#
# Usage from repo root:
#   bash scripts/compress-images.sh
#
# Requires: Python 3 with Pillow. macOS python3 ships with PIL pre-
# installed via /usr/bin/python3, or via Homebrew Python. If
# missing, install with:  python3 -m pip install Pillow
#
# (The original spec called for cwebp via `brew install webp`, but
# that's a Tier 2 brew formula that fails to build on current macOS;
# Pillow's WebP encoder produces equivalent output.)

set -e

QUALITY=82
DIRS=("assets/selfies" "assets/photos")

if ! python3 -c "from PIL import Image" 2>/dev/null; then
  echo "Python Pillow not found. Install with: python3 -m pip install Pillow"
  exit 1
fi

TOTALS=$(mktemp)
trap "rm -f $TOTALS" EXIT

convert_one() {
  local f="$1"
  local out="${f%.*}.webp"
  if python3 -c "
from PIL import Image
import sys
img = Image.open(sys.argv[1])
if img.mode in ('RGBA', 'LA', 'P'):
    img = img.convert('RGBA')
else:
    img = img.convert('RGB')
img.save(sys.argv[2], 'WEBP', quality=int(sys.argv[3]), method=6)
" "$f" "$out" "$QUALITY" 2>/dev/null; then
    local in_size=$(stat -f%z "$f" 2>/dev/null || stat -c%s "$f")
    local out_size=$(stat -f%z "$out" 2>/dev/null || stat -c%s "$out")
    local in_kb=$((in_size / 1024))
    local out_kb=$((out_size / 1024))
    local pct=$((out_size * 100 / in_size))
    echo "  ✓ $(basename "$f"): ${in_kb}KB → ${out_kb}KB (${pct}%)"
    rm "$f"
    echo "$in_size $out_size" >> "$TOTALS"
  else
    echo "  ✗ $(basename "$f") FAILED (kept original)"
  fi
}

convert_dir() {
  local dir="$1"
  if [ ! -d "$dir" ]; then
    echo "Skipping $dir (not found)"
    return
  fi
  echo ""
  echo "$dir:"
  for f in "$dir"/*.png "$dir"/*.jpg "$dir"/*.jpeg; do
    [ -f "$f" ] || continue
    convert_one "$f"
  done
}

echo "Compressing images to WebP at quality $QUALITY..."

for dir in "${DIRS[@]}"; do
  convert_dir "$dir"
done

if [ -s "$TOTALS" ]; then
  total_in=$(awk '{sum += $1} END {print sum}' "$TOTALS")
  total_out=$(awk '{sum += $2} END {print sum}' "$TOTALS")
  total_pct=$((total_out * 100 / total_in))
  echo ""
  echo "Total: $((total_in / 1024))KB → $((total_out / 1024))KB (${total_pct}%)"
fi
