#!/bin/sh
# The share files from a 4K master (or several, joined in order):
#   <name>-4k.mp4     3840x2160 60 fps, for LinkedIn (and anywhere that takes 4K)
#   <name>.mp4        1920x1080 60 fps, for X
# H.264 High, yuv420p, BT.709, faststart, high bitrate so the platforms' own re-encode has a lot to
# work with.
#
#   sh scripts/video/share.sh <out name> <master.mp4> [master.mp4 ...]
set -e
NAME=$1; shift
LIST=$(mktemp)
for m in "$@"; do echo "file '$(cd "$(dirname "$m")" && pwd)/$(basename "$m")'" >> "$LIST"; done
COMMON="-c:v libx264 -profile:v high -preset slow -tune film -pix_fmt yuv420p -r 60 -g 120 -movflags +faststart -an -x264-params colorprim=bt709:transfer=bt709:colormatrix=bt709"
ffmpeg -loglevel error -y -f concat -safe 0 -i "$LIST" -vf "scale=in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p" $COMMON -crf 15 -maxrate 80M -bufsize 160M "$NAME-4k.mp4"
ffmpeg -loglevel error -y -f concat -safe 0 -i "$LIST" -vf "scale=1920:1080:flags=lanczos+accurate_rnd+full_chroma_int:in_color_matrix=bt709:out_color_matrix=bt709,format=yuv420p" $COMMON -crf 15 -maxrate 30M -bufsize 60M "$NAME.mp4"
rm -f "$LIST"
for f in "$NAME-4k.mp4" "$NAME.mp4"; do
  ffprobe -v error -select_streams v:0 -show_entries stream=width,height -show_entries format=duration,size -of csv=p=0 "$f" | tr '\n' ' '; echo " $f"
done
