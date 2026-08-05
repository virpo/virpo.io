# Homepage v2 pixel assets

The generated artwork is deliberately separate from the interactive HTML. Replace any PNG at the same public path and the toy keeps working.

## `radio.png`

Path: `public/assets/v2/radio.png`  
Current size: 1536 × 1024 PNG

Prompt direction: a wide 1990s Japanese pixel-art coral radio on a warm cream shelf, small maneki-neko on the left, bonsai on the right, large speaker, knobs and three physical playback buttons. The upper-right display must be plain black with no text, icons, waveform, reflections, or decoration.

Measured black-display bounds: 43.16–76.50% from the left and 31.74–54.20% from the top. The live title and mirrored audio-reactive waveform share one normalized HTML coordinate frame inside that aperture. Keep the three lower controls unobstructed so the invisible accessible click targets can align with them.

## `study-paper.png`

Path: `public/assets/v2/study-paper.png`  
Current size: 1536 × 1024 PNG

Prompt direction: a wide cozy Japanese pixel-art study desk, mustard-yellow background, large blank cream spiral notebook on the left, green pencil and blue eraser on the right. No writing, letters, progress boxes, UI, display, or console.

Measured paper bounds: 7.23–77.54% from the left and 9.57–82.23% from the top. The current kana, reading, answer, and grading controls use one normalized frame centered on those bounds; progress stays below the paper and clears the pencil tip.

## `bloom-lotus.png`

Path: `public/assets/v2/bloom-lotus.png`  
Current size: 192 × 192 transparent PNG

Prompt direction: one pink lotus in crisp 16-bit Japanese pixel art with a few green leaves, centered and isolated on a flat chroma-green background. The chroma background is removed after generation and the result is cropped to a transparent square.

Safe overlay area: none. Keep the flower centered with transparent corners. Bloom name, place, days, and Tokyo time remain semantic HTML next to it.

`bloom-lotus-large.png` is the full-resolution transparent intermediate. It is kept only to make later cleanup or resizing easier.

## `daruma.png`

Path: `public/assets/v2/daruma.png`
Current size: 96 × 96 transparent PNG

Prompt direction: one tiny friendly red Daruma in crisp 16-bit Japanese pixel art, front-facing, centered, warm cream face, simple black-and-gold details, and a transparent background. It is deliberately small and acts as the quiet label for the Japan-toys row.

`daruma-source.png` preserves the original generation and `daruma-large.png` preserves the cleaned high-resolution intermediate.

## `reset-pixel.svg`

Path: `public/assets/v2/reset-pixel.svg`
Current size: 16 × 16 crisp-edge SVG

The single-color pixel refresh arrow is kept as a separate glyph so the Study reset button stays quiet, legible, and easy to replace without touching the interactive component.

## `blooms/*.png`

Paths: `public/assets/v2/blooms/{camellia,plum,sakura,wisteria,hydrangea,lotus,sunflower,cosmos,chrysanthemum}.png`
Current size: 192 × 192 transparent PNG each

Prompt direction: one unmistakable seasonal Japanese flower, coarse 16-bit pixel art with large square pixels, a limited palette, chunky color clusters, and a warm near-black 3–5 px outline. The subject fills roughly 72% of a square and uses the same cozy 1990s Japanese-game language as the radio and notebook toys. Generate on a flat chroma background with no ground, scenery, lettering, border, or shadow; remove the chroma background and resize to a transparent 192 px square.

Safe overlay area: none. Keep every flower centered with transparent corners. The compact ticker and the expanded seasonal list render the same asset at different sizes.
