# Notes for agents

## Images, art and video (everything generated or captured)

Everything painted on the site is generated with ChatGPT image generation (through `codex exec`)
and then cut, keyed or shipped by small Python scripts; the loops and videos are captured from the
built site by scripts. Before you paint, repaint, capture, add or fix any image or video (the room,
its objects, app-screen cards, the project cards, the list icons, logos, blog pictures, loops, og
images, launch videos, the favicon), read `.claude/skills/pocket-room-art/SKILL.md`. It has:

- the look-and-feel decisions to keep, and the directions that were tried and rejected
- tables of every generated or captured picture with its source, prompt, references and script
- the exact image-generation command and its quirks
- step-by-step playbooks for a new room object, a new project card, a list icon and the favicon

All prompts are in `components/room/tools/prompts/`, all source paintings and real reference photos
in `components/room/tools/art/`. Shipped files in `public/` (`lab/room/`, `ai/`, `og/`,
`assets/blog/`) are outputs: change the source and re-run the script, don't edit them by hand.

When you generate or capture anything new, save its prompt (or, if the workflow is special, the
steps) in the repo and add a row for it to the skill's tables, so a later agent can redo or update
it.

## Words on the page

Think twice before adding a caption, label or heading that only says what the picture or element
already shows ("Props on pink" under props on pink). Either say something the reader can't see, or
leave it out.
