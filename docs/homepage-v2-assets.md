# Homepage v2 pixel assets

The generated artwork is deliberately separate from the interactive HTML. Replace any PNG at the same public path and the toy keeps working.

## `radio.png`

Path: `public/assets/v2/radio.png`  
Current size: 1536 × 1024 PNG

Prompt direction: a wide 1990s Japanese pixel-art coral radio on a warm cream shelf, small maneki-neko on the left, bonsai on the right, large speaker, knobs and three physical playback buttons. The upper-right display must be plain black with no text, icons, waveform, reflections, or decoration.

Safe overlay area: approximately 42–76% from the left and 27–55% from the top. The live title and waveform are HTML inside that black display. Keep the three lower controls unobstructed so the invisible accessible click targets can align with them.

## `study-paper.png`

Path: `public/assets/v2/study-paper.png`  
Current size: 1536 × 1024 PNG

Prompt direction: a wide cozy Japanese pixel-art study desk, mustard-yellow background, large blank cream spiral notebook on the left, green pencil and blue eraser on the right. No writing, letters, progress boxes, UI, display, or console.

Safe overlay area: approximately 10–65% from the left and 14–78% from the top. The current kana, reading, answer, and grading controls are HTML placed on the blank notebook.

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
