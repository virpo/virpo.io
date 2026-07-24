# Toy and Writing Polish

Date: 24 July 2026

## Goal

Make the homepage toys feel deliberate and playful in the same structural family as Tom's Toys, while keeping virpo's red, black, white, yellow, and kaki identity. Fix the concrete interaction problems in Sounds, Window Seat, Study, and the homepage writing list.

## Familiar Japanese Sounds

The toy becomes one crafted nostalgia sequence rather than a collection visitors must advance manually.

- Sequence: departure melody, station announcement, fare gate, railway crossing, cuckoo crossing, FamilyMart entrance, Shinkansen passing, summer cicadas, fūrin.
- Each item defines a start and end time around its most recognizable continuous excerpt.
- Individual excerpts last roughly 3–5 seconds. The complete sequence targets 35–40 seconds and must stay within 30–45 seconds.
- Pressing play starts the sequence. Each excerpt advances automatically to the next one while the title, counter, accessible status, and audio-reactive waveform update.
- Pressing pause stops the current excerpt. Pressing play resumes from that point.
- Previous and next controls jump between excerpts without disabling continuous playback.
- After the fūrin excerpt, playback stops. The next play starts again from the departure melody.
- Replace “7 field recordings” with the functional counter `01 / 09`.
- Preserve reduced-motion and audio-fallback behavior.

The source files remain local assets. No copyrighted city-pop tracks are added.

## Window Seat

- Remove the top, bottom, left, right, and subtitle gradient masks.
- Keep the YouTube embed unzoomed, muted, looping, non-interactive, and without visible controls.
- Keep the illustrated train-window frame and its subtle glass layer.
- Retain the startup cover only while the embed initializes so YouTube startup chrome does not flash.
- The landscape must remain visibly unobstructed once playback starts.

## Japanese Study

Keep the existing randomised spaced-repetition behavior, local-storage progress, and Hiragana → Katakana → Kanji progression unchanged.

Restyle the toy as a compact bento game:

- Keep yellow as the outer identity color.
- Place progress, flashcard, and controls in separate white or cream inset modules with 2–3px black borders and rounded corners.
- Use black gutters between modules, echoing Tom's Toys without copying its page.
- Reduce the flashcard glyph, vertical whitespace, and button sizes.
- Use a playful Japanese-capable display face for the study interface and glyphs; keep numerals and utility text crisp and legible.
- Present stable and due counts as compact game statistics rather than one long sentence.
- Make reveal, answer, and reset states visually unmistakable.
- Keep touch targets at least 44px even when the visible buttons appear compact.
- Add small, purposeful icon accents only where they communicate state. Do not decorate every label.

The result should feel like a small game board inside the existing bento tile, not a flat yellow form.

## Homepage Writing

- Make every writing preview one semantic Next.js link covering the entire card.
- Preserve the title, excerpt, tag, date, and reading time.
- Convert the flat editorial rows into white bento sub-cards separated by black gutters and defined black borders.
- Use the homepage's playful display typography for titles and utility labels. Keep excerpts highly readable.
- Add clear hover, keyboard-focus, and pressed states to the whole card.
- Remove the redundant inline “Read” link; the card affordance and a small directional mark communicate navigation.
- Keep the separate “Projects” and “All writing” header links.

## Typography

- Use the playful homepage display face consistently across homepage headings, labels, metadata, controls, and writing excerpts.
- Japanese study glyphs may use a Japanese-capable rounded system face so kana and kanji remain correct and legible.
- Do not carry the playful homepage type into article reading. Individual blog articles keep their narrow Source Serif body and Fraunces headings.

## Blog List

- Keep `/blog/` visually minimal and editorial.
- Make each entire blog list item one semantic Next.js link, including its date, reading time, title, description, and tags.
- Remove the title-only nested link.
- Give the whole item visible hover, keyboard-focus, and pressed states without turning the list into a second homepage bento.

## Responsive Behavior

- Desktop preserves the current homepage composition.
- On mobile, sub-cards stack without losing their black gutters or rounded corners.
- Text must not collide with counters or controls at 320px width.
- Study remains compact enough that its primary card and answer controls are visible without excessive scrolling.

## Accessibility and Failure States

- Whole-card writing links have meaningful accessible names from their content.
- Sound title and playback state changes are announced without announcing every waveform frame.
- The Study card remains operable by keyboard and touch.
- Reduced-motion disables nonessential motion but not playback controls.
- Audio errors remain visible and recoverable by choosing another excerpt.
- Window Seat has a static fallback when reduced motion is enabled or the embed is unavailable.

## Verification

- Unit tests cover automatic sound advancement, counter/title changes, pause/resume, manual navigation, and end-of-sequence restart.
- Existing Study progression and persistence tests continue to pass; add DOM/style-contract tests for the new module structure where useful.
- Homepage tests verify the entire writing card is a link and no nested links are introduced.
- Blog index tests verify each entire list item is a link and article pages retain their readable serif typography.
- Window Seat tests verify all gradient masks are absent and the embed remains non-interactive.
- Run the full unit suite, static-export build validation, and Playwright end-to-end suite.
- Inspect desktop and mobile screenshots in the real browser, including playing Sounds, loaded Window Seat, Study before and after reveal, and keyboard focus on writing cards.
