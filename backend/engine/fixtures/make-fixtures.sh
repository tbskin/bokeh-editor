#!/usr/bin/env bash
# Generate synthetic fixtures for the spike: test-pattern clips + a REAL spoken VO
# (macOS `say`, so video-use transcription has words to work with).
set -euo pipefail
d="${1:-/tmp/ole-sample}"
mkdir -p "$d/clips"
for i in 0 1 2; do
  ffmpeg -y -f lavfi -i "testsrc=s=720x1280:r=30:d=4" -pix_fmt yuv420p "$d/clips/clip_$i.mp4" >/dev/null 2>&1
done
say -o "$d/vo.aiff" "Chase the light. Every morning is a choice. Lace up, and go."
ffmpeg -y -i "$d/vo.aiff" "$d/vo.wav" >/dev/null 2>&1
rm -f "$d/vo.aiff"
echo "fixtures ready in $d (clips/ + vo.wav)"
