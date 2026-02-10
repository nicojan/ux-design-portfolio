#!/bin/bash
# ──────────────────────────────────────────────────────
# convert-video.sh
# Converts a source video into web-ready formats and
# places them in assets/landing/.
#
# Alpha sources  → VP9 (.webm) + HEVC (.mov), both with transparency
# Opaque sources → VP9 (.webm) + H.264 (.mp4)
#
# Usage:
#   ./convert-video.sh path/to/source-video.mov [output-name]
#
# Examples:
#   ./convert-video.sh ~/Desktop/pocket-dystopia.mov
#   ./convert-video.sh ~/Desktop/recording.mov pocket-dystopia
#
# If output-name is omitted, uses the source filename.
# ──────────────────────────────────────────────────────

set -euo pipefail

# ─── Check dependencies ───
if ! command -v ffmpeg &>/dev/null || ! command -v ffprobe &>/dev/null; then
  echo "Error: ffmpeg and ffprobe are required."
  echo "Install with: brew install ffmpeg"
  exit 1
fi

# ─── Parse arguments ───
if [ $# -lt 1 ]; then
  echo "Usage: ./convert-video.sh <source-video> [output-name]"
  exit 1
fi

SOURCE="$1"
if [ ! -f "$SOURCE" ]; then
  echo "Error: File not found: $SOURCE"
  exit 1
fi

# Output name: use second arg, or derive from source filename
if [ $# -ge 2 ]; then
  NAME="$2"
else
  NAME="$(basename "${SOURCE%.*}")"
fi

# Output directory: assets/landing/ relative to this script
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
OUT_DIR="${SCRIPT_DIR}/assets/landing"
mkdir -p "$OUT_DIR"

# ─── Detect source properties ───
PIX_FMT=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=pix_fmt -of csv=p=0 "$SOURCE")

RESOLUTION=$(ffprobe -v quiet -select_streams v:0 \
  -show_entries stream=width,height -of csv=p=0 "$SOURCE")
WIDTH=$(echo "$RESOLUTION" | cut -d',' -f1)
HEIGHT=$(echo "$RESOLUTION" | cut -d',' -f2)

HAS_ALPHA=false
if [[ "$PIX_FMT" == *"a"* ]]; then
  HAS_ALPHA=true
fi

# ─── Pick bitrate based on resolution ───
# Pixel count drives the target. These are tuned for looping
# portfolio thumbnails — visually clean, not archival.
PIXELS=$(( WIDTH * HEIGHT ))

if [ "$PIXELS" -le 150000 ]; then
  # ~SD / small phone (e.g. 388x340)
  WEBM_CRF=36
  HEVC_CRF=30
  H264_CRF=28
elif [ "$PIXELS" -le 500000 ]; then
  # Phone-sized vertical (e.g. 388x788, 414x896)
  WEBM_CRF=34
  HEVC_CRF=28
  H264_CRF=26
elif [ "$PIXELS" -le 1000000 ]; then
  # ~720p range
  WEBM_CRF=33
  HEVC_CRF=26
  H264_CRF=25
else
  # 1080p+
  WEBM_CRF=32
  HEVC_CRF=25
  H264_CRF=24
fi

echo "Source:       $SOURCE"
echo "Resolution:   ${WIDTH}x${HEIGHT} (${PIXELS} px)"
echo "Pixel format: $PIX_FMT"
echo "Alpha:        $HAS_ALPHA"
echo "Output name:  $NAME"
echo "Output dir:   $OUT_DIR"
echo ""

# ─── 1. WebM — VP9 (all browsers except older Safari) ───
echo "Converting to .webm (VP9)..."
if $HAS_ALPHA; then
  ffmpeg -y -i "$SOURCE" \
    -c:v libvpx-vp9 -crf "$WEBM_CRF" -b:v 0 \
    -pix_fmt yuva420p \
    -auto-alt-ref 0 \
    -an \
    "${OUT_DIR}/${NAME}.webm" 2>/dev/null
else
  ffmpeg -y -i "$SOURCE" \
    -c:v libvpx-vp9 -crf "$WEBM_CRF" -b:v 0 \
    -an \
    "${OUT_DIR}/${NAME}.webm" 2>/dev/null
fi
WEBM_SIZE=$(du -h "${OUT_DIR}/${NAME}.webm" | cut -f1 | xargs)
echo "  Done: ${NAME}.webm (${WEBM_SIZE})"

# ─── 2. Safari fallback ───
if $HAS_ALPHA; then
  # HEVC with alpha — Safari 13+ on macOS/iOS
  # Requires macOS VideoToolbox hardware encoder
  echo "Converting to .mov (HEVC with alpha, VideoToolbox)..."

  if ffmpeg -hide_banner -encoders 2>/dev/null | grep -q hevc_videotoolbox; then
    ffmpeg -y -i "$SOURCE" \
      -c:v hevc_videotoolbox \
      -allow_sw 1 \
      -alpha_quality 0.75 \
      -tag:v hvc1 \
      -q:v 55 \
      -an \
      "${OUT_DIR}/${NAME}.mov" 2>/dev/null
    MOV_SIZE=$(du -h "${OUT_DIR}/${NAME}.mov" | cut -f1 | xargs)
    echo "  Done: ${NAME}.mov (${MOV_SIZE})"
  else
    echo "  Warning: hevc_videotoolbox not available."
    echo "  Copying source .mov as fallback instead."
    cp "$SOURCE" "${OUT_DIR}/${NAME}.mov"
    MOV_SIZE=$(du -h "${OUT_DIR}/${NAME}.mov" | cut -f1 | xargs)
    echo "  Done: ${NAME}.mov (${MOV_SIZE}, source copy)"
  fi

  echo ""
  echo "Suggested HTML:"
  echo "  <video autoplay loop muted playsinline>"
  echo "    <source src=\"assets/landing/${NAME}.webm\" type=\"video/webm\" />"
  echo "    <source src=\"assets/landing/${NAME}.mov\" type=\"video/quicktime; codecs=hvc1\" />"
  echo "  </video>"
else
  # No alpha — H.264 MP4 as universal fallback
  echo "Converting to .mp4 (H.264)..."
  ffmpeg -y -i "$SOURCE" \
    -c:v libx264 -crf "$H264_CRF" -preset slow \
    -pix_fmt yuv420p \
    -an -movflags +faststart \
    "${OUT_DIR}/${NAME}.mp4" 2>/dev/null
  MP4_SIZE=$(du -h "${OUT_DIR}/${NAME}.mp4" | cut -f1 | xargs)
  echo "  Done: ${NAME}.mp4 (${MP4_SIZE})"

  echo ""
  echo "Suggested HTML:"
  echo "  <video autoplay loop muted playsinline>"
  echo "    <source src=\"assets/landing/${NAME}.webm\" type=\"video/webm\" />"
  echo "    <source src=\"assets/landing/${NAME}.mp4\" type=\"video/mp4\" />"
  echo "  </video>"
fi

echo ""
echo "Done."
