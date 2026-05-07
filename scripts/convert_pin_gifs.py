#!/usr/bin/env python3
"""
convert_pin_gifs.py
Converts source GIFs to animated WebP at TARGET_SIZE x TARGET_SIZE.
Single-tool pipeline using Pillow — no brew/system-toolchain dependencies.

Requires: pip install pillow --break-system-packages

Usage:
    python3 scripts/convert_pin_gifs.py
    TARGET_SIZE=400 python3 scripts/convert_pin_gifs.py     # bigger pins
    QUALITY=70 python3 scripts/convert_pin_gifs.py          # smaller files
"""

import os
import sys
from pathlib import Path

try:
    from PIL import Image, ImageSequence
except ImportError:
    sys.stderr.write(
        "Pillow not installed. Run: pip install pillow --break-system-packages\n"
    )
    sys.exit(1)

INPUT_DIR = Path(os.environ.get("INPUT_DIR", "assets/source-pins"))
OUTPUT_DIR = Path(os.environ.get("OUTPUT_DIR", "assets/pins"))
TARGET_SIZE = int(os.environ.get("TARGET_SIZE", "200"))
QUALITY = int(os.environ.get("QUALITY", "80"))


def convert_gif_to_webp(input_path: Path, output_path: Path) -> tuple[int, int]:
    """Convert animated GIF to animated WebP, resizing to TARGET_SIZE square."""
    img = Image.open(input_path)

    frames = []
    durations = []
    for frame in ImageSequence.Iterator(img):
        # RGBA preserves transparency; LANCZOS gives clean downscale
        resized = frame.convert("RGBA").resize(
            (TARGET_SIZE, TARGET_SIZE), Image.Resampling.LANCZOS
        )
        frames.append(resized)
        # Frame duration in ms; fall back to 100ms if not specified
        durations.append(frame.info.get("duration", 100))

    frames[0].save(
        output_path,
        format="WEBP",
        save_all=True,
        append_images=frames[1:],
        duration=durations,
        loop=0,           # infinite loop
        method=6,         # max compression effort (slower, smaller)
        lossless=True,    # REQUIRED for alpha preservation in animated WebP
                          # — Pillow's lossy animated WebP flattens transparency
        quality=QUALITY,  # in lossless mode, controls compression effort
    )

    return input_path.stat().st_size, output_path.stat().st_size


def main() -> None:
    if not INPUT_DIR.is_dir():
        sys.stderr.write(f"Input directory not found: {INPUT_DIR}\n")
        sys.exit(1)

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    input_files = sorted(INPUT_DIR.glob("*.gif"))
    if not input_files:
        sys.stderr.write(f"No .gif files found in {INPUT_DIR}\n")
        sys.exit(1)

    print(
        f"Converting {len(input_files)} GIFs → WebP at "
        f"{TARGET_SIZE}×{TARGET_SIZE}, quality {QUALITY}"
    )
    print()

    total_in = 0
    total_out = 0

    for f in input_files:
        output = OUTPUT_DIR / f"{f.stem}.webp"
        in_size, out_size = convert_gif_to_webp(f, output)
        total_in += in_size
        total_out += out_size

        in_kb = in_size // 1024
        out_kb = out_size // 1024
        pct = out_size * 100 // in_size
        print(f"  {f.stem:<30} {in_kb:>5} KB → {out_kb:>4} KB  ({pct}%)")

    print()
    total_pct = total_out * 100 // total_in
    print(f"Total: {total_in // 1024} KB → {total_out // 1024} KB  ({total_pct}%)")
    print(f"Output: {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
