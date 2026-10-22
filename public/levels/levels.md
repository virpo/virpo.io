# 100 levels of working with agents

The 100 tricks worth your time with coding agents, from pasting screenshots to writing your own agent, collected from 94 engineers worth watching. Paste one prompt: your agent checks which you use, on your own machine, and suggests what to try next.

- Page: https://virpo.io/levels/
- Check your own level: paste `Read virpo.io/levels/check.md and do what it says.` into your coding agent
- Data: https://virpo.io/levels/levels.json · version 1.0, updated 2026-10-22

Your level is how many of the 100 you do. The list is always 100: when a new level earns its place, one goes extinct.

Level 0: Copy code out of a chat tab. Everyone starts here. It doesn't count, and nobody's judging.

## Levels 1–10: Stone Age · First contact

It edits, it runs things, it answers. You stop copy-pasting.

### 1. Install a coding agent

An agent reads your files and runs commands. A chat tab only sees what you paste into it.

- How it's checked: Any agent config folder exists: ~/.claude, ~/.codex, ~/.cursor, ~/.config/opencode, ~/.gemini, ~/.factory, ~/.pi. You're reading this from inside one, so: yes.
- Who does it: Mitchell Hashimoto: “To find value, you must use an agent.” (https://mitchellh.com/writing/my-ai-adoption-journey)

### 2. Let it edit your files

No more copy-pasting between chat and editor. It writes the change, you read the diff.

- How it's checked: Its file-edit tool shows up in session logs (Edit, Write, apply_patch).

### 3. Ask it how the code works

"How does auth work here?" The fastest way into any codebase, including yours from last year.

- How it's checked: 5+ prompts that are questions about the code (how, why, where, what does).
- Who does it: Anthropic, Claude Code best practices: Ask it the questions you'd ask a senior engineer about the codebase. (https://code.claude.com/docs/en/best-practices)

### 4. Paste the whole error

The full stack trace or log, not your summary of it. It fixes what actually broke.

- How it's checked: 5+ prompts with pasted blocks or raw logs ([Pasted text …], stack traces).

### 5. Send it a screenshot

A picture of the broken layout beats a paragraph. "Fix this" plus an image is a whole prompt.

- How it's checked: 3+ prompts with an image attached ([Image #…]).
- Who does it: Peter Steinberger: Attaches a screenshot to a large share of his prompts; "fix padding" plus an image is enough. (https://steipete.me/posts/just-talk-to-it)

### 6. Interrupt it early

Press Esc the moment it heads the wrong way. Redirecting beats waiting for the wrong answer.

- How it's checked: 5+ interrupted turns in session logs ("[Request interrupted by user]").
- Who does it: Peter Steinberger: “Don't be afraid of stopping models mid-way.” (https://steipete.me/posts/just-talk-to-it)

### 7. Point at the files

@-mention the file or paste the path. It stops guessing where things live.

- How it's checked: 10+ prompts with @file mentions or explicit file paths.

### 8. Commit small and often

A clean git tree is your undo button. Commit before you let it loose.

- How it's checked: It ran git commit 5+ times in your sessions, or you use checkpoints.

### 9. Start fresh when it's stuck

/clear and ask again. A polluted context doesn't recover by arguing with it.

- How it's checked: /clear, /new or a fresh session after a failed attempt, 3+ times.
- Who does it: Anthropic, Claude Code best practices: After two failed corrections, /clear and write a better first prompt. (https://code.claude.com/docs/en/best-practices)

### 10. Use it for chores, not just code

Rename 400 photos, sort the receipts, untangle a spreadsheet. It's a computer that does what you ask.

- How it's checked: 1+ session in a folder that isn't a git repo (Downloads, Documents, home).

## Levels 11–20: Fire · Context

It knows what you know, because you told it.

### 11. Write a rules file

AGENTS.md or CLAUDE.md: how to build, test and run this repo. It stops asking, and stops guessing.

- How it's checked: An AGENTS.md, CLAUDE.md, GEMINI.md or .cursor/rules in any repo you work in.
- Who does it: Lee Robinson: “I started with zero custom rules. I only added a rules file later after the model got a few things wrong” (https://leerob.com/pixo)

### 12. Write down how you like to work

One global file for every project: your taste, your tools, your pet peeves. Applied everywhere.

- How it's checked: ~/.claude/CLAUDE.md or ~/.codex/AGENTS.md exists and isn't empty.

### 13. Talk instead of type

Dictate your prompts. You'll give it three times the context you'd ever bother typing.

- How it's checked: A dictation app is installed (Wispr Flow, superwhisper, MacWhisper, VoiceInk, OpenWhispr, Aqua, Spokenly, Handy), or prompts read like speech (um, uh, long run-ons).
- Who does it: Dax Raad: “the thing that killed my editor for me was fast local voice models more than OpenCode” (https://x.com/thdxr/status/2078527322563449007)

### 14. Hand it the docs

Paste the link to the API reference, the issue, the RFC. It reads instead of guessing from memory.

- How it's checked: 10+ prompts with URLs, or web fetches in session logs.

### 15. Point at an example

"Do it like UserCard.tsx." One good example beats a paragraph of conventions.

- How it's checked: Prompts that name an existing file or project to copy ("like X", "same as Y", "follow Z").

### 16. Say what done looks like

What's wrong, where, and how you'll know it's fixed. Then it knows when to stop.

- How it's checked: Prompts that state a finish line ("done when", "until", "should show").
- Who does it: OpenAI, Codex best practices: Goal, Context, Constraints, Done when: their prompt template. (https://learn.chatgpt.com/guides/best-practices)

### 17. Ask for a plan first

Plan mode, or "don't write code yet". Fixing a plan is ten times cheaper than fixing the diff.

- How it's checked: Plan mode used, or 5+ prompts asking for a plan before code.
- Who does it: Lee Robinson: “Plan mode in Cursor is one of the most underrated features.” (https://leerob.com/pixo)
- Who disagrees: Peter Steinberger: Skips plan mode; asks for options and talks it through instead. (https://steipete.me/posts/just-talk-to-it)

### 18. Ask for three versions

Of the UI, the name, the approach. Variants cost almost nothing now, so pick the best one.

- How it's checked: 5+ prompts asking for variants, options or versions.

### 19. Let it interview you

"Ask me questions until you understand." It builds what you meant, not what you said.

- How it's checked: Its ask-the-user tool used, a grill-me style skill installed, or prompts like "ask me" / "interview me".
- Who does it: Matt Pocock: grill-me (https://github.com/mattpocock/skills/blob/7a030a8b0dcaa601bb0dda9aaf174affb3d61145/README.md#L103)

### 20. Add a rule after every mistake

When it does something dumb, put the fix in the rules file. It won't make that mistake twice.

- How it's checked: A rules file changed 3+ times, agent memory notes saved, or prompts like "add this to AGENTS.md".
- Who does it: Boris Cherny: “Anytime we see Claude do something incorrectly we add it to the CLAUDE.md” (https://x.com/bcherny/status/2007179840848597422)

## Levels 21–30: Wheel · Checks

It proves the thing works before it says done.

### 21. Give it a way to check its work

Tests, a build, a screenshot to compare against. It catches its own mistakes before you do.

- How it's checked: 10+ prompts that ask it to verify, test, or make sure it works.
- Who does it: Boris Cherny: “give Claude a way to verify its work… 2-3x the quality” (https://x.com/bcherny/status/2044847858634064115)

### 22. Write the failing test first

Reproduce the bug in a test, watch it fail, then fix it. Proof that the fix is real.

- How it's checked: Prompts about failing tests, TDD or red/green, or a TDD skill installed.
- Who does it: Steph Ango: “Verify the same fixture fails before the fix and passes afterward; do not change expectations to match buggy behavior.” (https://github.com/kepano/defuddle/blob/49d14ecc4089696565c2479b2f57db72be199adc/AGENTS.md#L17)

### 23. Let it use a browser

Playwright, agent-browser or Chrome. It clicks through what it built instead of assuming it works.

- How it's checked: A browser MCP or skill installed, or 10+ browser-automation calls.

### 24. Ask for proof, not "done!"

The command it ran and the real output. A screenshot. A recording of it working.

- How it's checked: 5+ prompts asking for proof, screenshots or recordings of the result.
- Who does it: Thorsten Ball: “give me irrefutable proof that this works. Dazzle me. Give me a video as proof, or something.” (https://registerspill.thorstenball.com/p/joy-and-curiosity-99)

### 25. Rewind instead of re-explaining

/rewind or a checkpoint takes you back to before it went wrong. Try risky things freely.

- How it's checked: /rewind or a checkpoint restore used by you at least once (typed, not just mentioned).

### 26. Let it use your CLIs

gh, aws, stripe, supabase. "Run foo --help" and it learns the rest on its own.

- How it's checked: It ran 3+ different third-party CLIs (gh, aws, gcloud, vercel, netlify, stripe, supabase, wrangler, fly…).

### 27. Pre-approve the safe commands

An allowlist for tests, lint and git status. Fewer prompts, so you stop clicking yes to everything.

- How it's checked: Permission allow rules, Codex rules, or auto mode configured.

### 28. Ask side questions without derailing

/btw, or a second session. The answer doesn't pollute the main task.

- How it's checked: /btw used, or a parallel throwaway session for a quick question.

### 29. Queue your next message

Type the follow-up while it works. Nobody waits on anybody.

- How it's checked: Queued prompts in your agent's stats or logs, 20+.

### 30. Get pinged when it's done

A hook, a sound, a push to your phone. Then go do something else.

- How it's checked: A hook or script that notifies you when it's done (sound, push, notification), or a rule telling it to.
- Who does it: Chris McCord: “when it's done work it runs a `notify msg` bash function I have” (https://x.com/chris_mccord/status/2016576023400181773)
- Who disagrees: Mitchell Hashimoto: Turns agent notifications off, so he decides when to switch context. (https://mitchellh.com/writing/my-ai-adoption-journey)

## Levels 31–40: Bronze Age · Tools

It reaches past the repo: CLIs, servers, your browser, your inbox.

### 31. Install a skill

Someone else's packaged know-how, loaded only when the task needs it.

- How it's checked: 1+ skill folder in ~/.claude/skills, ~/.codex/skills, ~/.agents/skills or a repo's .claude/skills.

### 32. Connect a tool server (MCP)

For the things without a good CLI: Figma, Linear, your database.

- How it's checked: 1+ MCP server configured.
- Who disagrees: Peter Steinberger: Prefers CLIs: the GitHub MCP alone ate 23k tokens of context. (https://steipete.me/posts/just-talk-to-it)

### 33. Let it open the pull request

Branch, commit, push, description. You review instead of typing.

- How it's checked: It ran gh pr create (or similar) 3+ times.

### 34. Let it deploy

Vercel, Netlify, Fly, TestFlight. You decide who presses the last button.

- How it's checked: It ran a deploy CLI 3+ times.

### 35. Save a prompt as a command

The prompt you type every week, saved as /ship or /review.

- How it's checked: 1+ custom command in .claude/commands, or a user-invoked skill you wrote.

### 36. Pick the model and effort per task

Low effort for chores, high for the gnarly bug. Fast and cheap where it doesn't matter.

- How it's checked: /effort or /model switched 3+ times, or reasoning effort set in config.

### 37. Know what you spend

ccusage, CodexBar, /usage. Tokens are a budget; spend them on purpose.

- How it's checked: A usage tracker installed, or /usage, /stats, /cost used 3+ times.

### 38. Watch the context fill up

A status line with context, model and cost. No surprise compactions halfway through a task.

- How it's checked: A statusLine configured, or /context used 3+ times.

### 39. Run two agents at once

One on the bug, one on the feature. Twice the work while you review.

- How it's checked: Two sessions active in the same 10 minutes, on 5+ occasions (from prompt timestamps).

### 40. Connect it to your messages

Gmail, Slack, Teams, calendar. "What did I promise people this week?"

- How it's checked: A mail, chat or calendar connector or MCP configured (names only).

## Levels 41–50: Iron Age · Your setup

Rules, skills, hooks and memory that you wrote yourself.

### 41. Write your own skill

The thing you keep explaining, written once as a SKILL.md. Every session starts knowing it.

- How it's checked: A skill you wrote yourself: no upstream source or lockfile entry, or it lives in your own repo.

### 42. Use subagents

Helpers search and read in parallel, so your main session stays focused and fast.

- How it's checked: 10+ subagent runs in session logs.
- Who does it: Alexander Embiricos: “Then, when I need anything new, I say "using a subagent in parallel, do X"” (https://x.com/embirico/status/2046033614106931414)

### 43. Add a hook that tidies every edit

A formatter or linter after each write. Guaranteed, unlike "please run prettier" in a rules file.

- How it's checked: A post-edit hook that runs a formatter or linter.
- Who does it: Boris Cherny: “We use a PostToolUse hook to format Claude's code.” (https://x.com/bcherny/status/2007179852047335529)

### 44. Add a hook that says no

Block rm -rf, force pushes, pip when you use uv. Rules are advice; hooks are enforced.

- How it's checked: A pre-tool hook that blocks or guards commands.
- Who does it: Armin Ronacher: “Replaces the bash tool with a `uv`-aware version that injects Python command shims and blocks common non-`uv` workflows.” (https://github.com/mitsuhiko/agent-stuff/blob/0865c849befd2021490679f96a8dee58c84ac857/README.md#L63)

### 45. Let it keep notes

Memory, notes.md, PROGRESS.md. It doesn't relearn your project every morning.

- How it's checked: 5+ memory notes, Codex memories on, or notes/progress files in your repos.
- Who does it: Simon Willison: “Create a notes.md file in that folder and append notes to it as you work, tracking what you tried and anything you learned along the way.” (https://github.com/simonw/research/blob/ba0cb97b42da153c13c465fb617f5c45f1f03b04/AGENTS.md#L3)

### 46. One rules file for every agent

Symlink CLAUDE.md to AGENTS.md. The same rules, whichever agent you open.

- How it's checked: A CLAUDE.md that is a symlink to, or imports, an AGENTS.md (or the other way round).
- Who does it: Peter Steinberger: “~/.codex/AGENTS.md -> ~/Projects/agent-scripts/AGENTS.MD
~/.claude/CLAUDE.md -> ~/Projects/agent-scripts/AGENTS.MD” (https://github.com/steipete/agent-scripts/blob/79150cfac4a6ba4df13cf30176bf2db85170ae6c/README.md#L65-L67)

### 47. Keep the rules file small

A map to your docs, not an encyclopedia. Every line costs context in every session.

- How it's checked: The rules file of the repo you work in most is under 150 lines and points to other docs for the rest.
- Who does it: Kent C. Dodds: “This file is included in full context for every agent conversation. Keep it tiny and stable.” (https://github.com/kentcdodds/kentcdodds.com/blob/b61c7ff4200c4aa0e35326d1a7baeb8a51d86673/AGENTS.md#L3-L4)

### 48. Write the spec first

Two paragraphs in, a SPEC.md out, and a fresh session builds from the spec.

- How it's checked: A SPEC.md, PLAN.md or plans/ folder in a repo you work in.
- Who does it: Alex Kladov: “I was providing structure, Claude was painting by the numbers.” (https://matklad.github.io/2026/01/20/vibecoding-2.html)

### 49. Have it write a handoff

Before the context fills, it writes down where it is. The next session picks up in one read.

- How it's checked: A PROGRESS.md, HANDOFF.md or todo.md, or a handoff skill.
- Who does it: Thomas Ptacek: “I should be able to tell a future agent "read PLAN.md and PROGRESS.md" and trust it's up to speed with this codebase.” (https://github.com/tqbf/swiftui-app/blob/3ca1cc4b8ffdbd3b628cc847574c9951b036fe12/CLAUDE.md#L5-L6)

### 50. One worktree per agent

Parallel agents in one checkout trip over each other. Worktrees keep them apart.

- How it's checked: git worktree list shows 2+ in any repo.
- Who does it: Boris Cherny: “Worktrees are essential… dozens of Claudes” (https://x.com/bcherny/status/2038454353787519164)
- Who disagrees: Peter Steinberger (2025, he uses them now): “Why not worktrees? I run one dev server, as I evolve my project I click through it and test multiple changes at once.” (https://steipete.me/posts/just-talk-to-it)

## Levels 51–60: Steam · Second opinions

Another agent reads it before you do.

### 51. Have an agent review the diff

/code-review, Codex /review, a fresh session. Before you read it, not instead of you.

- How it's checked: A review command, review skill or review subagent used 3+ times.
- Who does it: Filippo Valsorda: “making a human review a change before an LLM is disrespectful.” (https://bsky.app/profile/filippo.abyssdomain.expert/post/3moq6sdq6xk2l)

### 52. Review with a different model

Claude writes, GPT reviews, or the other way round. Different models miss different things.

- How it's checked: One vendor's agent asked to review another's work (codex exec / claude -p review, or prompts that hand a diff across).
- Who does it: DHH: “Review this with claude” (https://x.com/dhh/status/2107882896195199116)

### 53. Review with fresh eyes

A new session or a subagent: "read this as if you didn't write it." It stops defending its own code.

- How it's checked: Reviews run in a fresh context (a new session or a subagent), not in the session that wrote the code.
- Who does it: Harper Reed: “carefully read over all of the new code you just wrote … with "fresh eyes," looking super carefully for any obvious bugs … Use a subagent.” (https://github.com/harperreed/dotfiles/blob/6db272a76a71b098272c7c8a26ae084d197a43ac/.claude/commands/careful-review.md#L1)

### 54. Make it quiz you on the change

It explains the diff, then asks you five questions. Merge only when you pass.

- How it's checked: An explain-diff or quiz skill, or prompts asking it to explain or quiz you on a change.
- Who does it: Thariq Shihipar: “I only merge after I pass the quiz perfectly.” (https://x.com/trq212/status/2073100352921215386)

### 55. Ask for a diagram

Architecture, data flow, the state machine. Pictures review faster than prose.

- How it's checked: 3+ prompts asking for a diagram, chart or visual explanation.
- Who does it: Dex Horthy: “/show-me prompts the agent to use concise visuals to explain what's happening, instead of walls of prose.” (https://www.humanlayer.dev/blog/show-me-skill)

### 56. Let it babysit the PR

It watches CI and the review bots, fixes, pushes, and repeats until it's green.

- How it's checked: It checked CI or PR status (gh pr checks, gh run) 5+ times.

### 57. Two agents, two jobs

Claude writes the code, Codex draws the images. Or one builds and the other reviews.

- How it's checked: One agent launched another (codex exec, claude -p, gemini -p) 3+ times.

### 58. Run it headless in scripts

claude -p, codex exec. Logs in, JSON out, part of your scripts.

- How it's checked: 3+ headless runs in shell history or logs.

### 59. Have it make a video

A 30-second motion explainer of what you shipped, for the colleague who won't read the PR.

- How it's checked: Remotion, Hyperframes or ffmpeg renders from a session, or a video skill installed.

### 60. Skip the prompts, inside a box

Full autonomy in a container or a fresh VM with no prod keys. All the speed, none of the risk.

- How it's checked: Permission prompts off AND a sandbox (devcontainer, Docker, VM, /sandbox). Prompts off without a box doesn't count.
- Who does it: David Crawshaw: “You have to turn off the sandbox, which means you have to provide your own sandbox. I have tried just about everything and I highly recommend: use a fresh VM.” (https://crawshaw.io/blog/eight-more-months-of-agents)

## Levels 61–70: Electric · Off the desk

It works while you sleep, sit on the couch, or close the laptop.

### 61. Schedule a prompt

For later, or every morning: /loop, /schedule, cron. Work starts without you.

- How it's checked: A scheduled or recurring agent run (loop/cron tools, a launchd or cron entry that calls an agent).

### 62. Let it work while you sleep

Start a few tasks before bed, review them with coffee.

- How it's checked: Agent activity between 1am and 6am while you typed nothing.
- Who does it: Calvin French-Owen: “This is over-hyped on Twitter, but I do really try and kick off 3-4 tasks in Codex before going to bed, so they'll be ready for review in the morning.” (https://calv.info/agents-feb-2026)

### 63. Drive it from your phone

Remote Control, the Codex app, ssh and tmux. Unblock it from the couch.

- How it's checked: Remote control set up, a mobile session, or mosh/Tailscale used to reach your agent box.
- Who does it: Harper Reed: Claude Code is better on your phone (https://harper.blog/2026/01/05/claude-code-is-better-on-your-phone/)

### 64. Hand chores to a cloud agent

Codex cloud, Claude on the web, Cursor background agents. The boring stuff, no laptop needed.

- How it's checked: Cloud or remote agent tasks in your history.
- Who does it: Adam Wathan: “I feed this thing every little random tedious OSS task that I'd otherwise neglect on my TODO list” (https://x.com/adamwathan/status/2017616165455949851)

### 65. Give it a finish line it can't fake

"Don't stop until the test passes and the screenshot matches." Then let it run.

- How it's checked: 3+ prompts like "don't stop until" / "keep going until", or a goal set with /goal.

### 66. Run it in a loop

The same prompt, fresh context, again and again until the spec is done.

- How it's checked: A shell loop or script that re-runs an agent, or /loop until a condition.
- Who does it: Geoffrey Huntley: “while :; do cat PROMPT.md | claude-code ; done” (https://ghuntley.com/ralph/)

### 67. Put an agent in CI

@claude on issues, a review on every PR. A teammate with a GitHub login.

- How it's checked: claude-code-action, codex action or similar in a .github/workflows file.

### 68. Run it four times, keep the best

The same task in parallel, thirty seconds each to judge. Throwing work away is cheap now.

- How it's checked: The same task run in 2+ parallel sessions or worktrees.
- Who does it: Alexander Embiricos: “So I might kind of throw throw codex at it but I might just do it four times in parallel instead.” (https://www.youtube.com/watch?v=xeZDHGjG5zM&t=1375)

### 69. Make two agents argue

One proposes, one attacks, until they agree or you see exactly why they can't. Nice.

- How it's checked: Multi-round back-and-forth between two agents (rounds of review and fix, or relayed replies).
- Who does it: Dex Horthy: “let sol and fable implement / review / argue over night” (https://x.com/dexhorthy/status/2092244659057909765)

### 70. Keep a machine that never sleeps

A Mac mini, a VPS, a shed. Agents keep running when your laptop closes.

- How it's checked: Agents running on another machine you reach over ssh.
- Who does it: DHH: “all my agent and compile work now happens on an AI shed.” (https://x.com/dhh/status/2107463006552793231)

## Levels 71–80: Silicon · Orchestra

Many agents, one plan, and you still know who's doing what.

### 71. Run five at once

Five agents on five problems, and you still know what each one is doing.

- How it's checked: 5+ sessions or background agents running at the same time.

### 72. Let one agent coordinate the rest

It hands out the work, checks on the others, and reports back to you.

- How it's checked: One agent messaging or steering others (agent teams, SendMessage, an orchestrator session).
- Who does it: Andreas Kling: “Tell coordinator to parallelize the work over 4 separate computers via SSH” (https://x.com/awesomekling/status/2102089363631059199)

### 73. Strong model plans, fast model builds

Pay for thinking where it matters, and for speed everywhere else.

- How it's checked: Per-agent model settings, or 3+ prompts assigning models to roles.
- Who does it: Steve Yegge: “Every implementation bead goes through this lifecycle: Fable design, Opus implementation, Fable review.” (https://yegge.ai/essays/the-shape-of-things-to-come/)

### 74. Give agents job titles

A security reviewer, a tester, a docs writer, each with its own tools and model.

- How it's checked: 2+ custom agent definitions (.claude/agents/*.md or equivalent).

### 75. Script the whole pipeline

A rerunnable multi-agent workflow instead of one heroic session.

- How it's checked: A workflow tool used, or a script that chains several agent runs.

### 76. Hire adversarial reviewers

Two refuters per builder, and points for every real bug. They try hard.

- How it's checked: Reviews run by 2+ competing or adversarial agents.
- Who does it: Jesse Vincent: “Assign two subagents to review your work adversarially. Tell them that whoever finds the largest number of legitimate significant issues gets 5 points.” (https://github.com/obra/dotfiles/blob/6ebb5ba848526b2bfd5b5ab3cb30741ff32c4447/.claude/commands/par.md#L1)

### 77. Three bug hunters, one report

Several reviewers in parallel, then one agent rules out the false positives.

- How it's checked: Findings from 2+ review tools merged into one triaged list.
- Who does it: Nolan Lawson: “Run a Claude sub-agent, Codex, and Cursor Bugbot to find bugs in this PR ranked by critical/high/medium/low.” (https://nolanlawson.com/2026/05/25/using-ai-to-write-better-code-more-slowly/)

### 78. Make every task teach the next

After each job it writes the lesson into a skill or rule, so the next one is cheaper.

- How it's checked: Rules, skills or memory edited by agent sessions 5+ times.
- Who does it: Kieran Klaassen: “Compound is still the most important step, because the whole point is that every feature should make the next feature easier.” (https://every.to/p/compound-engineering-gets-an-upgrade)

### 79. Turn rules into checks

Wrote "never do X" twice? Make it a lint rule or a type, so it can't happen.

- How it's checked: Custom lint rules, ast-grep rules or check scripts in a repo.
- Who does it: José Valim: “encode as many rules as possible into deterministic checks (first) and adversarial reviews (second), instead of relying exclusively on a bunch of AGENTS.md files to do the job.” (https://x.com/josevalim/status/2075221914549686774)

### 80. Build a tool for your agent

A small CLI made for it to call: --json output, good --help, no prompts.

- How it's checked: Your own scripts or CLIs that agents call regularly.

## Levels 81–90: Orbit · Beyond the screen

Your agents reach the team, the release, the pager, and the physical world.

### 81. Test your skills

Does it trigger when it should, and does it actually help? An eval tells you.

- How it's checked: Eval files for a skill or plugin, or a plugin eval run.

### 82. Publish your skills

A public repo of your skills, so your team, or strangers, can use them.

- How it's checked: Your skills live in a git repo with a remote.
- Who does it: Peter Steinberger: agent-scripts (https://github.com/steipete/agent-scripts)

### 83. Put an agent in the team chat

Tag it in Slack and it opens the PR. Teammates use it without installing anything.

- How it's checked: A chat-integrated agent set up (Slack app, Claude Tag, Devin, a bot).
- Who does it: Cat Wu and Thariq Shihipar, via Simon Willison: Claude Tag lands 65% of the Claude Code team's product PRs. (https://simonwillison.net/2026/Jul/21/cat-and-thariq/)

### 84. Make something physical

It designs the 3D-printable part, the enclosure, the bracket. Code that ends up on your desk.

- How it's checked: OpenSCAD, CadQuery, build123d or Blender driven by the agent, or .stl, .3mf or .scad files it produced.

### 85. Give your agents a wiki about you

How you think, what you've decided, what you can't stand. Loaded only when it's relevant.

- How it's checked: A personal context repo or folder that your agents load when relevant, through a rule or a skill.

### 86. Let your agents talk to each other

No more "Codex says: [paste]". They pass findings directly while you do something else.

- How it's checked: Agents sending each other messages or reading each other's output, without you relaying it.

### 87. Let it use your computer

It clicks through desktop apps, the simulator, your logged-in browser. Not just files and a terminal.

- How it's checked: Computer-use or desktop-control tools used: computer use, Peekaboo, Claude in Chrome, simulator control.

### 88. Give it a release checklist

Every release, the same long QA script, run start to finish by the agent.

- How it's checked: A QA or release checklist file, or a release skill.
- Who does it: Salvatore Sanfilippo: QA_BEFORE_RELEASES.md (https://antirez.com/news/168)

### 89. Put it on call

It watches errors and alerts, and has a fix open before you've read the page.

- How it's checked: An error-tracking or alerting connector (Sentry, Datadog, PagerDuty, Grafana) or alerts sent into an agent session.

### 90. Build on an agent SDK

Your own agent product, with the same loop the big ones use under the hood.

- How it's checked: An agent SDK in a project's dependencies (Claude Agent SDK, Codex SDK, OpenAI Agents).

## Levels 91–100: Stone, again · Full circle

Fewer, sharper tools, and you understand them all the way down.

### 91. Delete more config than you add

Prune the rules, skills and servers that don't earn their tokens anymore.

- How it's checked: A rules file that got shorter at least once in its git history.
- Who does it: Dax Raad: “when i see people with custom workflows and setups they're all addressing problems that don't exist anymore” (https://x.com/thdxr/status/2107260844400931156)

### 92. Review by risk, not by habit

A copy fix gets a glance. Auth, money and migrations get every line.

- How it's checked: Your rules or review setup name the paths that always get a human read.
- Who does it: Boris Cherny: “I read diffs when it's touching critical code, or code that's important to get right. I don't write the code.” (https://x.com/bcherny/status/2098210496109572123)
- Who disagrees: Mitchell Hashimoto: “First, I reviewed the entire diff (yes, all ~3,000 lines of it). Then I reviewed it again. I re-read the entire diff by hand three or four times.” (https://mitchellh.com/writing/simdutf-no-libcxx)

### 93. Teach it when to stop and ask

A stuck agent asks instead of trying a ninth fix. You set that up.

- How it's checked: A rule or hook that makes it stop and report when stuck or out of scope.

### 94. Make your git log obey your rules

If the rules say "no AI trailers" or "tests pass", the last 100 commits agree.

- How it's checked: Compare what your global rules demand with your last 100 commits (trailers, messages). They agree.
- Who does it: Mike McQuaid: “reject "has AI attribution; remove it and disclose AI use in the PR description."” (https://github.com/MikeMcQuaid/dotfiles/blob/a340d0ef58084694861946d587a0832a80782898/git-hooks/pre-push#L51)

### 95. Give it its own identity

Its own GitHub account and scoped keys, so you can always see, and revoke, what it did.

- How it's checked: Commits or PRs in your repos by a bot account you run, or a separate login the agent uses.
- Who does it: Anthony Fu: “Agents on behave of @antfu” (https://github.com/antfubot)

### 96. Put hardware in the loop

It flashes the board, reads the serial port, watches the LED, and checks its own work.

- How it's checked: Device tools driven by an agent (serial, adb, simctl, esptool, arduino-cli…).
- Who does it: Linus Torvalds: “I started the day with "I want to connect two pedals together and have them validate each other", and ended the day with three pedals, a signal generator, and a USB MIDI dongle all connected together as a validation bench with automated checks.” (https://github.com/torvalds/GuitarPedal/commit/d1b95dc5e71e0a2d42912001c5fa4469bbc88766)

### 97. Run it on a local model

Open weights on your own machine: private, offline, and nobody can take it away.

- How it's checked: Ollama, LM Studio, llama.cpp or MLX installed, and an agent pointed at a local model.

### 98. Run your own harness

Pi, OpenClaw, Hermes, or one you built. You choose the tools, the prompts and the loop.

- How it's checked: Pi, OpenClaw, Hermes or a harness you wrote, installed and in use.
- Who does it: Peter Steinberger: “I use OpenClaw (which uses Codex) and web sessions.” (https://x.com/steipete/status/2102641364681048328)

### 99. Let it improve your setup

A scheduled agent reads your recent sessions, finds the friction, and fixes your rules and skills.

- How it's checked: A recurring agent run that reviews past sessions and edits rules or skills, or /insights used to change your setup.
- Who does it: OpenAI, Codex best practices: Schedule a review of recent chats to find friction, then fix prompts and setup. (https://learn.chatgpt.com/guides/best-practices)

### 100. Write your own agent

A model, a loop and a few tools, in a few hundred lines. After that, nothing on this list is magic.

- How it's checked: A project of yours that calls a model API with tools in a loop you wrote, not only an SDK or someone else's harness.
- Who does it: Thorsten Ball: “It’s an LLM, a loop, and enough tokens.” (https://ampcode.com/notes/how-to-build-an-agent)

## Fossil record

- "You are a senior engineer with 20 years of experience." (extinct, 2023): Role-play preambles. Today's models don't need the pep talk; they need the context.
- "I'll tip you $200 for a perfect answer." (extinct, 2023): It sort of worked once. Nobody ever paid.
- "Take a deep breath and work on this step by step." (extinct, 2023): Reasoning models think before answering anyway.
- "Write the full code. No placeholders." (extinct, 2023–24): From the era of lazy models and "// rest of the code stays the same".
- .cursorrules (extinct, 2024): One file in the repo root. Replaced by rule folders and AGENTS.md, which every agent reads.
- Codex custom prompts (extinct, 2025): Deprecated in favour of skills.
- "ultrathink" (endangered, 2025–): Thinking keywords. Effort is a setting now, and reports disagree on whether the word still does anything.
- "How many r's are in strawberry?" (extinct, 2024): Retired as a benchmark. Still a good party trick.
