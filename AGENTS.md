# Notes for agents

## Images and art (Pocket Room, /room/)

Everything visual in the Pocket Room is generated with ChatGPT image generation (through `codex
exec`) and then cut, keyed or shipped by small Python scripts. Before you paint, repaint, add or fix
any image there (the room, its objects, app-screen cards, the project cards under the room, the
favicon), read `.claude/skills/pocket-room-art/SKILL.md`. It has:

- the look-and-feel decisions to keep, and the directions that were tried and rejected
- a table of every generated image with its painting, prompt, references and build script
- the exact image-generation command and its quirks
- step-by-step playbooks for a new room object, a new project card and the favicon

All prompts are in `components/room/tools/prompts/`, all source paintings and real reference photos
in `components/room/tools/art/`. Shipped files in `public/lab/room/` are outputs: change the source
and re-run the script, don't edit them by hand.
