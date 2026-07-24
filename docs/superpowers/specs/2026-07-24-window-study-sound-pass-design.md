# Window, Study, and Japan Sounds Pass

## Goal

Fix the three homepage toys without changing the overall bento layout:

- make Window Seat feel like scenery behind the illustrated train window;
- make Japanese Study read as one compact game instead of stacked panels;
- make the sound sequence match the specific nostalgia moments Peter named.

## Window Seat

- Remove the `Ambient loop` / `Still journey` label entirely.
- Keep the current illustrated train frame and aperture.
- Size the 16:9 YouTube iframe by aperture height, center it, and crop only the
  left and right edges. It must fill the full aperture with no top or bottom
  bands.
- Keep the player inert, muted, looping, and hidden during YouTube startup
  chrome.
- Keep the reduced-motion still state.

## Japanese Study

Keep the learning engine, randomization, local-storage progress, staged
Hiragana → Katakana → Kanji unlocking, and reveal/rating interactions.

Recompose only the presentation:

- one continuous yellow console surface;
- title, current deck, and a smaller reset control in one header;
- one slim progress row directly on the yellow surface, without three cream
  boxes or black gutters;
- one cream flashcard “screen” with a clear black outline;
- rating controls visually attached to the same console when revealed;
- compact typography and spacing that still preserves 44px touch targets where
  the control is primary.

The visible progress remains `stable`, progress, and `due`, but it should read
as one status line rather than three modules.

## Japan Sounds

The sequence remains one play/pause experience with the reactive waveform,
automatic advancement, previous/next controls, and roughly a 30–45 second
total run.

Use this order:

1. Closed crossing — train passing while the tracks are closed, from the
   supplied TikTok.
2. Yamanote approaching — from the supplied TikTok.
3. Park crows — the exact crow moment from the supplied TikTok.
4. FamilyMart welcome — chime plus the clerk greeting from the supplied
   TikTok.
5. Departure melody — existing local recording.
6. Station announcement — existing local recording.
7. Fare gate — existing local recording.
8. Railway crossing — existing local recording.
9. Cuckoo crossing — existing local recording.
10. Summer cicadas — existing local recording.

Source the first four as short local audio excerpts from:

`https://www.tiktok.com/@japan_vision_/video/7574165962543467796`

The page must not depend on TikTok at runtime. Add the source and excerpt notes
to `notes/japan-sounds-sources.md`.

Exclude Don Quijote, Shinkansen passing, and Fūrin.

## Verification

- Unit tests lock the playlist order, sources, segment boundaries, and total
  duration.
- Component/CSS tests lock the Window Seat cover treatment and the unified
  Study composition.
- Existing study persistence and sound-player interaction tests stay green.
- Production build and the full browser suite pass.
- Capture desktop and mobile screenshots of the exact final build, including a
  revealed Study card.
