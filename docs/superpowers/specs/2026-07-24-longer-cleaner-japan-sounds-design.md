# Longer, cleaner Japan sounds

## Goal

Make the sound toy feel less hurried and remove the two recordings that sound
cheap or noisy. FamilyMart becomes the first sound. The full sequence remains
automatic and audio-reactive.

## Sequence

1. FamilyMart welcome
2. Closed crossing
3. Yamanote approaching
4. Park crows
5. Departure melody
6. Tennoji station announcement
7. Fare gate
8. Railway crossing
9. Cuckoo crossing
10. Minminzemi

Each title should hold for 7.5 seconds, with a tolerance of half a second when a
natural phrase ends earlier. Use natural source material where it exists. Short
TikTok moments can use a quiet crossfaded repeat, but must not introduce a
different sound under the same title.

## New edits

### FamilyMart welcome

Build a 7.5-second opener from the clean Panasonic chime already in the repo and
the clerk greeting from Peter's selected TikTok excerpt. The greeting should
land naturally after the melody rather than sounding pasted on.

### Tennoji station announcement

Replace the current announcement with the CC0 48 kHz stereo recording:

https://freesound.org/people/timcam/sounds/381934/

Start with the 15.0–22.5-second window. The edit can move either boundary by up
to one second only when that produces a complete Japanese announcement phrase.

### Minminzemi

Replace the current low-resolution cricket recording with Peter's selected
Japanese Minminzemi recording:

https://commons.wikimedia.org/wiki/File:Singing_cicada_audio.ogg

Select a representative 7–8-second section with a stable call and no abrupt
cut.

## Audio treatment

- Export consistent browser-friendly MP3 files.
- Use short fades or crossfades at edit boundaries.
- Loudness-match the sequence so switching clips is comfortable.
- Preserve the dynamics and atmosphere; do not make every clip sound equally
  compressed.
- Record exact source URLs, licenses, and excerpt boundaries in
  `notes/japan-sounds-sources.md`.

## Player behavior

The existing player behavior stays unchanged:

- one play/pause control;
- audio-reactive waveform;
- automatic progression through all ten titles;
- previous and next controls;
- restart at FamilyMart after the final sound;
- no new loading UI or settings.

## Verification

- Unit tests lock the new order, paths, and excerpt timing.
- Media checks verify every configured end point is within its file.
- Browser tests verify play, pause, automatic progression, navigation, and
  fallback behavior.
- A manual listening pass checks transitions and perceived loudness.
