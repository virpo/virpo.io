#!/usr/bin/env zsh
# Paint one image with ChatGPT image generation through `codex exec`.
#   components/room/tools/paint.sh <prompt.txt> <out.png> [ref.png ...]
# In the prompt, <out> stands for the absolute output path. The "use your image generation
# tool" instruction is prepended when the prompt lacks it. One image takes about 50 s; several
# can run in parallel (one call each). Always look at the result and retry when it is off.
set -euo pipefail
if (( $# < 2 )); then
  echo "usage: $0 <prompt.txt> <out.png> [ref.png ...]" >&2
  exit 2
fi
prompt=$1
out=${2:A}
shift 2
mkdir -p "${out:h}"
args=()
for ref in "$@"; do args+=(-i "${ref:A}"); done
body=$(sed "s|<out>|$out|g" "$prompt")
if ! grep -q "image generation tool" <<<"$body"; then
  body="Use your image generation tool to create ONE image (do not draw it with code), then copy the resulting PNG to $out

$body"
fi
log="${TMPDIR:-/tmp}/paint-${out:t:r}.log"
rm -f "$out"
# Every -i must come before the lone "-": the prompt is read from stdin.
print -r -- "$body" | zsh -ic "codex exec --skip-git-repo-check --dangerously-bypass-approvals-and-sandbox ${(j: :)${(q)args}} -" >"$log" 2>&1 || true
if [[ -s "$out" ]]; then
  echo "$out"
else
  echo "no image at $out (codex log: $log)" >&2
  exit 1
fi
