# 100 levels of working with agents

The 100 tricks worth your time with coding agents, from pasting screenshots to writing your own agent, collected from 94 engineers worth watching. Paste one prompt: your agent checks which you use, on your own machine, and suggests what to try next.

- Page: https://virpo.io/levels/
- Check your own level: paste this into your coding agent: What level am I with coding agents? Follow virpo.io/levels/check.md. It has you run a read-only script that counts things on this machine (no file contents, nothing uploaded), then open my result in the browser. Read the script and tell me what it does before you run it.
- Data: https://virpo.io/levels/levels.json · version 1.2, updated 2026-10-23

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

### 3. Just talk to it

No magic words, no templates. Say what you want and why, the way you'd brief a smart colleague.

- How it's checked: 10+ prompts that give the reason, not just the task ("because", "so that", "the goal is"), or 20+ prompts over 40 words.
- Who does it: Peter Steinberger: “Just talk to it. Play with it. Develop intuition.” (https://steipete.me/posts/just-talk-to-it)

### 4. Ask it how the code works

"How does auth work here?" The fastest way into any codebase, including yours from last year.

- How it's checked: 5+ prompts that are questions about the code (how, why, where, what does).
- Who does it: Anthropic, Claude Code best practices: Ask it the questions you'd ask a senior engineer about the codebase. (https://code.claude.com/docs/en/best-practices)

### 5. Send it a screenshot

A picture of the broken layout beats a paragraph. "Fix this" plus an image is a whole prompt.

- How it's checked: 3+ prompts with an image attached ([Image #…]).
- Try: [⌘⇧⌃4 on a Mac](https://support.apple.com/en-us/102646) (copies it, then paste)
- Who does it: Peter Steinberger: “I’d say at least 50% of my prompts contain a screenshot.” (https://steipete.me/posts/just-talk-to-it)

### 6. Paste the whole error

The full stack trace or log, not your summary of it. It fixes what actually broke.

- How it's checked: 5+ prompts with pasted blocks or raw logs ([Pasted text …], stack traces).

### 7. Talk instead of type

Dictate with OpenWhispr, Wispr Flow or Claude Code's /voice. You'll say three times what you'd ever bother typing.

- How it's checked: A dictation app is installed (Wispr Flow, superwhisper, MacWhisper, VoiceInk, OpenWhispr, Aqua, Spokenly, Handy), /voice is on in Claude Code, or prompts read like speech (um, uh, long run-ons).
- Try: [OpenWhispr](https://openwhispr.com) (free, open source), [Wispr Flow](https://wisprflow.ai), [superwhisper](https://superwhisper.com), [/voice](https://code.claude.com/docs/en/voice-dictation) (built into Claude Code)
- Who does it: Andrej Karpathy: “Also I just talk to Composer with SuperWhisper so I barely even touch the keyboard.” (https://x.com/karpathy/status/1886192184808149383)

### 8. Interrupt it early

Press Esc the moment it heads the wrong way. Redirecting beats waiting for the wrong answer.

- How it's checked: 5+ interrupted turns in session logs ("[Request interrupted by user]").
- Who does it: Peter Steinberger: “Don't be afraid of stopping models mid-way.” (https://steipete.me/posts/just-talk-to-it)

### 9. Start fresh when it's stuck

/clear and ask again. A polluted context doesn't recover by arguing with it.

- How it's checked: /clear, /new or a fresh session after a failed attempt, 3+ times.
- Who does it: Anthropic, Claude Code best practices: After two failed corrections, /clear and write a better first prompt. (https://code.claude.com/docs/en/best-practices)

### 10. Use it for chores, not just code

Rename 400 photos, sort the receipts for taxes, find the odd charges in a bank export. It's a computer that does what you ask.

- How it's checked: 1+ session in a folder that isn't a git repo (Downloads, Documents, home).
- Who does it: Simon Willison: “I’ve been saying for a while now that Claude Code is a “general agent” disguised as a developer tool.” (https://simonwillison.net/2026/Jan/12/claude-cowork/)

## Levels 11–20: Fire · Context

It knows what you know, because you told it.

### 11. Write an AGENTS.md

Or CLAUDE.md: how to build, test and run this repo, read at the start of every session. It stops asking, and stops guessing.

- How it's checked: An AGENTS.md, CLAUDE.md, GEMINI.md or .cursor/rules in any repo you work in.
- Who does it: Lee Robinson: “I started with zero custom rules. I only added a rules file later after the model got a few things wrong” (https://leerob.com/pixo)

### 12. Tell it who you are

One global file, read in every project: what you do, your tools, your taste, your pet peeves.

- How it's checked: ~/.claude/CLAUDE.md or ~/.codex/AGENTS.md exists and isn't empty.

### 13. Point at the right file

@-mention it, or say "do it like UserCard.tsx". It stops guessing where things live and how you like them.

- How it's checked: 10+ prompts with @file mentions or file paths, or prompts that name a file to copy ("like X", "same as Y").

### 14. Hand it the docs

Paste the link to the API reference, the issue, the RFC. It reads instead of guessing from memory.

- How it's checked: 10+ prompts with URLs, or web fetches in session logs.

### 15. Ask for a plan first

Plan mode, or "don't write code yet". Fixing a plan is ten times cheaper than fixing the diff.

- How it's checked: Plan mode used, or 5+ prompts asking for a plan before code.
- Who does it: Lee Robinson: “Plan mode in Cursor is one of the most underrated features.” (https://leerob.com/pixo)
- Who disagrees: Peter Steinberger: “I can just write “let’s discuss” or “give me options” and it will diligently wait until I approve it. No harness charade needed. Just talk to it.” (https://steipete.me/posts/just-talk-to-it)

### 16. Ask for three versions

Of the UI, the name, the approach. Variants cost almost nothing now, so pick the best one.

- How it's checked: 5+ prompts asking for variants, options or versions.

### 17. Let it interview you

"Ask me questions until you understand." It builds what you meant, not what you said.

- How it's checked: Its ask-the-user tool used, a grill-me style skill installed, or prompts like "ask me" / "interview me".
- Who does it: Matt Pocock: grill-me (https://github.com/mattpocock/skills/blob/7a030a8b0dcaa601bb0dda9aaf174affb3d61145/README.md#L103)

### 18. Ask it to help you decide

Lay out the options and what you care about, then ask what it would pick and what you're missing. Ask it to push back, or it will just agree.

- How it's checked: 5+ prompts asking for a decision or a critique ("should I", "help me decide", "what am I missing", "push back", "poke holes", "devil's advocate").
- Who does it: Ethan Mollick: “AI can provide good strategic or entrepreneurial advice if you are capable of executing on it.” (https://www.oneusefulthing.org/p/getting-started-with-ai-good-enough)

### 19. Write the spec first

Two paragraphs in, a SPEC.md out, and a fresh session builds from the spec.

- How it's checked: A SPEC.md, PLAN.md or plans/ folder in a repo you work in.
- Who does it: Indragie Karunaratne: “if you want more than a prototype, you need a real spec.” (https://www.indragie.com/blog/i-shipped-a-macos-app-built-entirely-by-claude-code)

### 20. Update AGENTS.md after every mistake

When it does something dumb, add one line to the rules file. It won't make that mistake twice.

- How it's checked: A rules file changed 3+ times, agent memory notes saved, or prompts like "add this to AGENTS.md".
- Who does it: Boris Cherny: “Anytime we see Claude do something incorrectly we add it to the CLAUDE.md” (https://x.com/bcherny/status/2007179840848597422)

## Levels 21–30: Wheel · Checks

It proves the thing works before it says done, and you stop babysitting it.

### 21. Say what done looks like

What's wrong, where, and how you'll know it's fixed. Then it knows when to stop.

- How it's checked: Prompts that state a finish line ("done when", "until", "should show").
- Who does it: OpenAI, Codex best practices: Goal, Context, Constraints, Done when: their prompt template. (https://learn.chatgpt.com/guides/best-practices)

### 22. Give it a way to check its work

Tests, a build, a screenshot to compare against. It catches its own mistakes before you do.

- How it's checked: 10+ prompts that ask it to verify, test, or make sure it works.
- Who does it: Boris Cherny: “give Claude a way to verify its work… 2-3x the quality” (https://x.com/bcherny/status/2044847858634064115)

### 23. Ask for proof, not "done!"

The command it ran and the real output. A screenshot. A recording of it working.

- How it's checked: 5+ prompts asking for proof, screenshots or recordings of the result.
- Who does it: Thorsten Ball: “give me irrefutable proof that this works. Dazzle me. Give me a video as proof, or something.” (https://registerspill.thorstenball.com/p/joy-and-curiosity-99)

### 24. Let it use a browser

Playwright, agent-browser or Chrome. It clicks through what it built instead of assuming it works.

- How it's checked: A browser MCP or skill installed, or 10+ browser-automation calls.
- Try: [agent-browser](https://github.com/vercel-labs/agent-browser), [Playwright MCP](https://github.com/microsoft/playwright-mcp), [Claude in Chrome](https://claude.com/chrome)

### 25. Write the failing test first

Reproduce the bug in a test, watch it fail, then fix it. Proof that the fix is real.

- How it's checked: Prompts about failing tests, TDD or red/green, or a TDD skill installed.
- Who does it: Steph Ango: “Verify the same fixture fails before the fix and passes afterward; do not change expectations to match buggy behavior.” (https://github.com/kepano/defuddle/blob/49d14ecc4089696565c2479b2f57db72be199adc/AGENTS.md#L17)
- Who disagrees: Birgitta Böckeler: “I personally have stopped telling my coding agents to write tests first, let alone do TDD (which I never did, to be honest), until I see evals or other strong arguments that convince me otherwise.” (https://martinfowler.com/articles/exploring-gen-ai/tdd-in-the-agent-loop.html)

### 26. Commit small and often

A clean git tree is your undo button. Commit before you let it loose.

- How it's checked: It ran git commit 5+ times in your sessions, or you use checkpoints.

### 27. Rewind instead of re-explaining

/rewind or a checkpoint takes you back to before it went wrong. Try risky things freely.

- How it's checked: /rewind or a checkpoint restore used by you at least once (typed, not just mentioned).

### 28. Pre-approve the safe commands

An allowlist for tests, lint and git status. Fewer prompts, so you stop clicking yes to everything.

- How it's checked: Permission allow rules, Codex rules, or auto mode configured.

### 29. Keep secrets out of its reach

Deny it .env and ~/.ssh, keep prod keys out of its shell. It can't leak what it never saw.

- How it's checked: Deny rules that cover .env, keys or credential files, or a secrets manager (1Password CLI, Doppler, Infisical) that agents call instead of reading raw keys.
- Try: [1Password CLI](https://developer.1password.com/docs/cli/) (op run), [Doppler](https://www.doppler.com)
- Who does it: Ryan Dahl: “A compromised agent process can’t leak keys it never held in the first place.” (https://deno.com/blog/clawpatrol)

### 30. Keep typing while it works

Queue the follow-up, ask a side question with /btw. Nobody waits on anybody.

- How it's checked: 20+ queued prompts in your agent's stats or logs, or /btw used.

## Levels 31–40: Bronze Age · Tools

It reaches past the repo: your CLIs, your computer, your inbox.

### 31. Let it use your CLIs

gh, aws, stripe, supabase. "Run foo --help" and it learns the rest on its own.

- How it's checked: It ran 3+ different third-party CLIs (gh, aws, gcloud, vercel, netlify, stripe, supabase, wrangler, fly…).

### 32. Let it fix your computer

Disk full, Python broken, the printer gone again. It finds the cause and explains each fix before it runs it.

- How it's checked: Sessions about the machine itself: disk space, installs, PATH, a slow Mac (du, df, brew doctor, prompts like "why is my mac slow"), 3+.
- Who does it: Lenny Rachitsky: “How can I clear some storage on my computer?” (https://www.lennysnewsletter.com/p/everyone-should-be-using-claude-code)

### 33. Build a tiny tool just for you

A one-page app that converts, counts or tracks the one thing you care about. Software for an audience of one.

- How it's checked: Small single-purpose tools started in agent sessions: a single HTML file, a one-off script, a repo with a handful of commits.
- Try: [Simon's 150+ tools](https://tools.simonwillison.net) (for ideas)
- Who does it: Simon Willison: “I have built over 150 of these in the past two years, almost all of them written by LLMs.” (https://simonwillison.net/2025/Dec/10/html-tools/)

### 34. Install a skill

Someone else's packaged know-how, loaded only when the task needs it.

- How it's checked: 1+ skill folder in ~/.claude/skills, ~/.codex/skills, ~/.agents/skills or a repo's .claude/skills.
- Try: [anthropics/skills](https://github.com/anthropics/skills), [mattpocock/skills](https://github.com/mattpocock/skills)

### 35. Connect a tool server (MCP)

For the things without a good CLI: Figma, Linear, your database.

- How it's checked: 1+ MCP server configured.
- Who disagrees: Peter Steinberger: Prefers CLIs: the GitHub MCP alone ate 23k tokens of context. (https://steipete.me/posts/just-talk-to-it)

### 36. Let it open the pull request

Branch, commit, push, description. You review instead of typing.

- How it's checked: It ran gh pr create (or similar) 3+ times.

### 37. Let it deploy

Vercel, Netlify, Fly, TestFlight. You decide who presses the last button.

- How it's checked: It ran a deploy CLI 3+ times.

### 38. Pick the model and effort per task

Low effort for chores, high for the gnarly bug. Fast and cheap where it doesn't matter.

- How it's checked: /effort or /model switched 3+ times, or reasoning effort set in config.

### 39. Watch the context and the bill

A status line with context, model and cost, plus /usage. No surprise compactions, no surprise invoice.

- How it's checked: A statusLine configured, a usage tracker installed (ccusage, CodexBar), or /context, /usage, /stats or /cost used 3+ times.
- Try: [ccusage](https://github.com/ryoppippi/ccusage), [CodexBar](https://github.com/steipete/CodexBar)

### 40. Let it work through your inbox

Gmail, Slack, calendar. It drafts the replies, you edit and send. Or ask: "What did I promise people this week?"

- How it's checked: A mail, chat or calendar connector or MCP configured (names only).
- Who does it: Harper Reed: “I go to my email client, and check the drafts. Edit and send most of them cuz they are great.” (https://harper.blog/2025/12/03/claude-code-email-productivity-mcp-agents/)

## Levels 41–50: Iron Age · Your setup

Rules, skills, hooks and memory that you wrote yourself.

### 41. Write your own skill

The prompt you type every week, or the thing you keep explaining, written once as a SKILL.md. Call it as /ship, or let it load when it's needed.

- How it's checked: A skill or custom command you wrote yourself (no upstream source or lockfile entry, or it lives in your own repo); .claude/commands counts.

### 42. Use subagents

Helpers search and read in parallel, so your main session stays focused and fast.

- How it's checked: 10+ subagent runs in session logs.
- Who does it: Alexander Embiricos: “Then, when I need anything new, I say "using a subagent in parallel, do X"” (https://x.com/embirico/status/2046033614106931414)

### 43. Add a hook that formats every edit

A formatter or linter after each write. Guaranteed, unlike "please run prettier" in a rules file.

- How it's checked: A post-edit hook that runs a formatter or linter.
- Who does it: Boris Cherny: “We use a PostToolUse hook to format Claude's code.” (https://x.com/bcherny/status/2007179852047335529)

### 44. Add a hook that blocks risky commands

rm -rf, force pushes, pip when you use uv. Rules are advice; hooks are enforced.

- How it's checked: A pre-tool hook that blocks or guards commands.
- Who does it: Armin Ronacher: “Replaces the bash tool with a `uv`-aware version that injects Python command shims and blocks common non-`uv` workflows.” (https://github.com/mitsuhiko/agent-stuff/blob/0865c849befd2021490679f96a8dee58c84ac857/README.md#L63)

### 45. Let it keep notes and hand off

notes.md, memory, a PROGRESS.md written before the context fills. The next session picks up in one read.

- How it's checked: 5+ memory notes, Codex memories on, notes, PROGRESS or HANDOFF files in your repos, or a handoff skill.
- Who does it: Simon Willison: “Create a notes.md file in that folder and append notes to it as you work, tracking what you tried and anything you learned along the way.” (https://github.com/simonw/research/blob/ba0cb97b42da153c13c465fb617f5c45f1f03b04/AGENTS.md#L3)

### 46. Symlink CLAUDE.md to AGENTS.md

One set of rules, whichever agent you open.

- How it's checked: A CLAUDE.md that is a symlink to, or imports, an AGENTS.md (or the other way round).
- Who does it: Peter Steinberger: “~/.codex/AGENTS.md -> ~/Projects/agent-scripts/AGENTS.MD
~/.claude/CLAUDE.md -> ~/Projects/agent-scripts/AGENTS.MD” (https://github.com/steipete/agent-scripts/blob/79150cfac4a6ba4df13cf30176bf2db85170ae6c/README.md#L65-L67)

### 47. Keep AGENTS.md short

A map to your docs, not an encyclopedia. Every line costs context in every session.

- How it's checked: The rules file of the repo you work in most is under 150 lines and points to other docs for the rest.
- Who does it: Kent C. Dodds: “This file is included in full context for every agent conversation. Keep it tiny and stable.” (https://github.com/kentcdodds/kentcdodds.com/blob/b61c7ff4200c4aa0e35326d1a7baeb8a51d86673/AGENTS.md#L3-L4)

### 48. Get pinged when it's done

A hook, a sound, a push to your phone. Then go do something else.

- How it's checked: A hook or script that notifies you when it's done (sound, push, notification), or a rule telling it to.
- Try: [ntfy](https://ntfy.sh) (push to your phone, open source)
- Who does it: Chris McCord: “when it's done work it runs a `notify msg` bash function I have” (https://x.com/chris_mccord/status/2016576023400181773)
- Who disagrees: Mitchell Hashimoto: Turns agent notifications off, so he decides when to switch context. (https://mitchellh.com/writing/my-ai-adoption-journey)

### 49. Run two agents at once

One on the bug, one on the feature. Twice the work while you review.

- How it's checked: Two sessions active in the same 10 minutes, on 5+ occasions (from prompt timestamps).
- Try: [Conductor](https://conductor.build) (parallel agents, each in its own worktree)

### 50. One worktree per agent

Parallel agents in one checkout trip over each other. Worktrees keep them apart.

- How it's checked: git worktree list shows 2+ in any repo.
- Who does it: Boris Cherny: “Worktrees are essential… dozens of Claudes” (https://x.com/bcherny/status/2038454353787519164)
- Who disagrees: Peter Steinberger (2025, he uses them now): “Why not worktrees? I run one dev server, as I evolve my project I click through it and test multiple changes at once.” (https://steipete.me/posts/just-talk-to-it)

## Levels 51–60: Steam · Second opinions

Another agent reads it before you do.

### 51. Have a fresh agent review the diff

/code-review, Codex /review, a new session or a subagent: not the one that wrote it. Before you read it, not instead of you.

- How it's checked: A review command, review skill or review subagent used 3+ times, in a context that didn't write the code.
- Who does it: Filippo Valsorda: “making a human review a change before an LLM is disrespectful.” (https://bsky.app/profile/filippo.abyssdomain.expert/post/3moq6sdq6xk2l)

### 52. Review with a different model

Claude writes, GPT reviews, or the other way round. Different models miss different things.

- How it's checked: One vendor's agent asked to review another's work (codex exec / claude -p review, or prompts that hand a diff across).
- Who does it: DHH: “Review this with claude” (https://x.com/dhh/status/2107882896195199116)

### 53. Make it quiz you on the change

It explains the diff, then asks you five questions. Merge only when you pass.

- How it's checked: An explain-diff or quiz skill, or prompts asking it to explain or quiz you on a change.
- Who does it: Thariq Shihipar: “I only merge after I pass the quiz perfectly.” (https://x.com/trq212/status/2073100352921215386)

### 54. Ask for a diagram

Architecture, data flow, the state machine. Pictures review faster than prose.

- How it's checked: 3+ prompts asking for a diagram, chart or visual explanation.
- Who does it: Dex Horthy: “/show-me prompts the agent to use concise visuals to explain what's happening, instead of walls of prose.” (https://www.humanlayer.dev/blog/show-me-skill)

### 55. Let it babysit the PR

It watches CI and the review bots, fixes, pushes, and repeats until it's green.

- How it's checked: It checked CI or PR status (gh pr checks, gh run) 5+ times.
- Who does it: Kent C. Dodds: “Babysit a PR. Iterate with AI reviewers and CI. Get it ready and maybe merge. Send summary message.” (https://github.com/kentcdodds/kcd-skills/blob/ab6303e3b22fbbeec665f9a62ee654f379c8c600/skills/ship-pr/SKILL.md#L3-L5)

### 56. Run agents from scripts

claude -p, codex exec: from your scripts, your Makefile, or from inside another agent. Logs in, JSON out.

- How it's checked: 3+ headless runs in shell history or session logs (codex exec, claude -p, gemini -p), including one agent launching another.

### 57. Review every commit in the background

A second model reads each commit as it lands, not once per PR when nobody wants to hear it.

- How it's checked: roborev, or a git post-commit hook that runs a reviewing agent (codex exec, claude -p).
- Try: [roborev](https://github.com/kenn-io/roborev)
- Who does it: Wes McKinney: “I do not code with agents without a continuous reviewer running in the background.” (https://wesmckinney.com/transcripts/2026-02-10-rill-data-podcast)

### 58. Make two reviewers compete

Two refuters per change, and points for every real bug. They try much harder than one polite reviewer.

- How it's checked: Reviews run by 2+ competing or adversarial agents, or rounds of review and fix between two agents.
- Who does it: Jesse Vincent: “Assign two subagents to review your work adversarially. Tell them that whoever finds the largest number of legitimate significant issues gets 5 points.” (https://github.com/obra/dotfiles/blob/6ebb5ba848526b2bfd5b5ab3cb30741ff32c4447/.claude/commands/par.md#L1)

### 59. Three bug hunters, one report

Several reviewers in parallel, then one agent rules out the false positives.

- How it's checked: Findings from 2+ review tools merged into one triaged list.
- Try: [Cursor Bugbot](https://cursor.com/bugbot), [CodeRabbit](https://www.coderabbit.ai)
- Who does it: Nolan Lawson: “Run a Claude sub-agent, Codex, and Cursor Bugbot to find bugs in this PR ranked by critical/high/medium/low.” (https://nolanlawson.com/2026/05/25/using-ai-to-write-better-code-more-slowly/)

### 60. Review by risk, not by habit

A copy fix gets a glance. Auth, money and migrations get every line.

- How it's checked: Your rules or review setup name the paths that always get a human read.
- Who does it: Boris Cherny: “I read diffs when it's touching critical code, or code that's important to get right. I don't write the code.” (https://x.com/bcherny/status/2098210496109572123)
- Who disagrees: Mitchell Hashimoto: “First, I reviewed the entire diff (yes, all ~3,000 lines of it). Then I reviewed it again. I re-read the entire diff by hand three or four times.” (https://mitchellh.com/writing/simdutf-no-libcxx)

## Levels 61–70: Electric · Off the desk

It works while you sleep, sit on the couch, or close the laptop.

### 61. Go YOLO, but only in a box

Full autonomy in a container or a fresh VM with no prod keys. All the speed, none of the risk.

- How it's checked: Permission prompts off AND a sandbox (devcontainer, Docker, VM, /sandbox). Prompts off without a box doesn't count.
- Try: [Dev Containers](https://containers.dev), [/sandbox](https://code.claude.com/docs/en/sandboxing) (built into Claude Code)
- Who does it: David Crawshaw: “You have to turn off the sandbox, which means you have to provide your own sandbox. I have tried just about everything and I highly recommend: use a fresh VM.” (https://crawshaw.io/blog/eight-more-months-of-agents)

### 62. Break the lethal trifecta

Private data, untrusted input, a way to send things out: never all three in one run. Cut the network first.

- How it's checked: Agent network access restricted (a sandbox domain allowlist, or network off in Codex) on a machine where it can read private data or mail.
- Try: [/sandbox](https://code.claude.com/docs/en/sandboxing) (limits its network to domains you allow)
- Who does it: Simon Willison: “The only way to stay safe there is to avoid that lethal trifecta combination entirely.” (https://simonwillison.net/2025/Jun/16/the-lethal-trifecta/)

### 63. Schedule a prompt

For later, or every morning: /loop, /schedule, cron. Work starts without you.

- How it's checked: A scheduled or recurring agent run (loop/cron tools, a launchd or cron entry that calls an agent).
- Who does it: Thibault Sottiaux: “One automation I have runs multiple times a day. It picks a random file and finds and fixes a subtle bug.” (https://every.to/podcast/transcript-how-openai-s-codex-team-uses-their-coding-agent)

### 64. Let it work while you sleep

Start a few tasks before bed, review them with coffee.

- How it's checked: Agent activity between 1am and 6am while you typed nothing.
- Who does it: Calvin French-Owen: “This is over-hyped on Twitter, but I do really try and kick off 3-4 tasks in Codex before going to bed, so they'll be ready for review in the morning.” (https://calv.info/agents-feb-2026)

### 65. Drive it from your phone

Remote Control, the Codex app, ssh and tmux. Unblock it from the couch.

- How it's checked: Remote control set up, a mobile session, or mosh/Tailscale used to reach your agent box.
- Try: [Remote Control](https://code.claude.com/docs/en/remote-control) (Claude Code), [Termius](https://termius.com), [Tailscale](https://tailscale.com)
- Who does it: Harper Reed: Claude Code is better on your phone (https://harper.blog/2026/01/05/claude-code-is-better-on-your-phone/)

### 66. Hand chores to a cloud agent

Codex cloud, Claude on the web, Cursor background agents. The boring stuff, no laptop needed.

- How it's checked: Cloud or remote agent tasks in your history.
- Who does it: Adam Wathan: “I feed this thing every little random tedious OSS task that I'd otherwise neglect on my TODO list” (https://x.com/adamwathan/status/2017616165455949851)

### 67. Give it a finish line it can't fake

"Don't stop until the test passes and the screenshot matches." Then let it run.

- How it's checked: 3+ prompts like "don't stop until" / "keep going until", or a goal set with /goal.

### 68. Run it in a Ralph loop

The same prompt, fresh context, again and again until the spec is done.

- How it's checked: A shell loop or script that re-runs an agent, or /loop until a condition.
- Who does it: Geoffrey Huntley: “while :; do cat PROMPT.md | claude-code ; done” (https://ghuntley.com/ralph/)

### 69. Put an agent in CI

@claude on issues, a review on every PR. A teammate with a GitHub login.

- How it's checked: claude-code-action, codex action or similar in a .github/workflows file.

### 70. Keep a machine that never sleeps

A Mac mini, a VPS, a shed. Agents keep running when your laptop closes.

- How it's checked: Agents running on another machine you reach over ssh.
- Who does it: DHH: “all my agent and compile work now happens on an AI shed.” (https://x.com/dhh/status/2107463006552793231)

## Levels 71–80: Silicon · Orchestra

Many agents, one plan, and a setup that gets sharper with every run.

### 71. Run it four times, keep the best

The same task in parallel, thirty seconds each to judge. Throwing work away is cheap now.

- How it's checked: The same task run in 2+ parallel sessions or worktrees.
- Who does it: Alexander Embiricos: “So I might kind of throw throw codex at it but I might just do it four times in parallel instead.” (https://www.youtube.com/watch?v=xeZDHGjG5zM&t=1375)

### 72. Run five at once

Five agents on five problems, and you still know what each one is doing.

- How it's checked: 5+ sessions or background agents running at the same time.
- Who does it: Theo Browne: “I regularly have 40+ threads running concurrently.” (https://x.com/theo/status/2102704338582032575)

### 73. Let your agents talk to each other

One hands out the work and checks on the rest, or two pass findings directly. No more "Codex says: [paste]".

- How it's checked: One agent messaging or steering others (agent teams, SendMessage, an orchestrator session), or agents reading each other's output without you relaying it.
- Who does it: Andreas Kling: “Tell coordinator to parallelize the work over 4 separate computers via SSH” (https://x.com/awesomekling/status/2102089363631059199)

### 74. Strong model plans, fast model builds

Pay for thinking where it matters, and for speed everywhere else.

- How it's checked: Per-agent model settings, or 3+ prompts assigning models to roles.
- Who does it: Steve Yegge: “Every implementation bead goes through this lifecycle: Fable design, Opus implementation, Fable review.” (https://yegge.ai/essays/the-shape-of-things-to-come/)

### 75. Write your own subagents

A reviewer, a tester, a researcher: each one a file with its own instructions, tools and model.

- How it's checked: 2+ custom agent definitions (.claude/agents/*.md or equivalent).

### 76. Turn your routine into a workflow

A rerunnable script of agent steps, instead of one heroic session.

- How it's checked: A workflow tool used, or a script that chains several agent runs.
- Who does it: Will Larson: “An agent skill /linear-project-loop which reads in a Linear project and starts by auditing that project’s goal definition on these dimensions” (https://lethain.com/software-factory-experiment/)

### 77. Make every task teach the next

The last step of every job: it writes what it learned into a skill or rule, without being asked.

- How it's checked: Rules, skills or memory edited by agent sessions 5+ times.
- Who does it: Kieran Klaassen: “Compound is still the most important step, because the whole point is that every feature should make the next feature easier.” (https://every.to/p/compound-engineering-gets-an-upgrade)

### 78. Turn AGENTS.md rules into lint rules

Wrote "never do X" in AGENTS.md twice? Make it a lint rule or a type. It can skim prose; it can't skim a red build.

- How it's checked: Custom lint rules, ast-grep rules or check scripts in a repo.
- Who does it: José Valim: “encode as many rules as possible into deterministic checks (first) and adversarial reviews (second), instead of relying exclusively on a bunch of AGENTS.md files to do the job.” (https://x.com/josevalim/status/2075221914549686774)

### 79. Make the checks take seconds

It checks as often as checking is cheap. A ten-minute suite gets skipped; a five-second one runs after every edit.

- How it's checked: A fast test or check command (seconds, not minutes) that the agent runs on its own, named in the rules file.
- Who does it: Paul Irish: “This allows coding agents to iterate and test logic instantly via CLI/Node unit tests without browser automation overhead (which is ~20x slower).” (https://github.com/paulirish/dotfiles/blob/384da0d2aaca4cb0287f046e1a9791a405f00b17/agents/skills/pauls-project-setup/SKILL.md#L19)

### 80. Build a tool for your agent

A small CLI made for it to call: --json output, good --help, no prompts.

- How it's checked: Your own scripts or CLIs that agents call regularly.
- Who does it: Birgitta Böckeler: “The CLI can offer both situational awareness for the human in supervised sessions, and a token-efficient and guidance-enriched summary to the agent.” (https://martinfowler.com/articles/sensors-for-coding-agents.html)

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

### 84. Have it make a video

A 30-second explainer of what you shipped, for the colleague who won't read the PR.

- How it's checked: Remotion, Hyperframes or ffmpeg renders from a session, or a video skill installed.
- Try: [Remotion](https://www.remotion.dev)

### 85. Give your agents a wiki about you

How you think, what you've decided, what you can't stand. Loaded only when it's relevant.

- How it's checked: A personal context repo or folder that your agents load when relevant, through a rule or a skill.

### 86. Let it click through your apps

Desktop apps, the simulator, your logged-in browser. It works the screen, not just files and a terminal.

- How it's checked: Computer-use or desktop-control tools used: computer use, Peekaboo, Claude in Chrome, simulator control.
- Try: [Claude in Chrome](https://claude.com/chrome), [Peekaboo](https://github.com/steipete/Peekaboo)

### 87. Give it a release checklist

Every release, the same long QA script, run start to finish by the agent.

- How it's checked: A QA or release checklist file, or a release skill.
- Who does it: Salvatore Sanfilippo: QA_BEFORE_RELEASES.md (https://antirez.com/news/168)

### 88. Put it on call

It watches errors and alerts, and has a fix open before you've read the page.

- How it's checked: An error-tracking or alerting connector (Sentry, Datadog, PagerDuty, Grafana) or alerts sent into an agent session.
- Try: [Sentry MCP](https://docs.sentry.io/product/sentry-mcp/)

### 89. Put hardware in the loop

It designs the bracket, flashes the board, reads the serial port, and checks its own work.

- How it's checked: Device or CAD tools driven by an agent (serial, adb, simctl, esptool, arduino-cli, OpenSCAD, CadQuery, build123d), or .stl, .3mf or .scad files it produced.
- Who does it: Linus Torvalds: “I started the day with "I want to connect two pedals together and have them validate each other", and ended the day with three pedals, a signal generator, and a USB MIDI dongle all connected together as a validation bench with automated checks.” (https://github.com/torvalds/GuitarPedal/commit/d1b95dc5e71e0a2d42912001c5fa4469bbc88766)

### 90. Build on an agent SDK

Your own agent product, with the same loop the big ones use under the hood.

- How it's checked: An agent SDK in a project's dependencies (Claude Agent SDK, Codex SDK, OpenAI Agents).
- Try: [Claude Agent SDK](https://code.claude.com/docs/en/agent-sdk/overview), [OpenAI Agents SDK](https://openai.github.io/openai-agents-python/)

## Levels 91–100: Stone, again · Full circle

Fewer, sharper tools, and you understand them all the way down.

### 91. Delete more config than you add

Prune the rules, skills and servers that don't earn their tokens anymore.

- How it's checked: A rules file that got shorter at least once in its git history.
- Who does it: Dax Raad: “when i see people with custom workflows and setups they're all addressing problems that don't exist anymore” (https://x.com/thdxr/status/2107260844400931156)

### 92. Read it before you install it

Skills, plugins, MCP servers and harnesses run with your keys. Read the code first, or try it in a box.

- How it's checked: You read a skill, plugin or harness before installing it, or run new ones in a VM or a separate user.
- Who does it: Sebastian Raschka: “Do an audit of the (open-source) agent code base first.” (https://magazine.sebastianraschka.com/p/using-local-coding-agents)

### 93. Make it stop and ask when stuck

Two failed fixes, then it reports back instead of trying a ninth. You set that up.

- How it's checked: A rule or hook that makes it stop and report when stuck or out of scope.
- Who does it: Jeremy Howard: “after 8 tool-call rounds with no text response of 100+ chars, it injects a reminder to surface and reassess” (https://github.com/AnswerDotAI/aai-coding/blob/bb010bf14189878ed1b2bb8db7158305c61696a3/SETUP.md#L140)

### 94. Give it its own identity

Its own GitHub account and scoped keys, so you can always see, and revoke, what it did.

- How it's checked: Commits or PRs in your repos by a bot account you run, or a separate login the agent uses.
- Who does it: Anthony Fu: “Agents on behave of @antfu” (https://github.com/antfubot)

### 95. Write the skeleton by hand

Types, interfaces, module boundaries: you write them, it fills in the bodies. The design stays in your head.

- How it's checked: You write the structure (types, signatures, module layout) yourself and hand the agent the rest.
- Who does it: Alex Kladov: “I was providing structure, Claude was painting by the numbers.” (https://matklad.github.io/2026/01/20/vibecoding-2.html)

### 96. Generate only what you can review

A daily limit on agent code, sized to how much you can actually read. Anything past it is debt.

- How it's checked: You cap how much agent-written code you accept per day at what you can review.
- Who does it: Mario Zechner: “Set yourself limits on how much code you let the clanker generate per day, in line with your ability to actually review the code.” (https://mariozechner.at/posts/2026-03-25-thoughts-on-slowing-the-fuck-down/)

### 97. Run it on a local model

Open weights on your own machine: private, offline, and nobody can take it away.

- How it's checked: Ollama, LM Studio, llama.cpp or MLX installed, and an agent pointed at a local model.
- Try: [Ollama](https://ollama.com), [LM Studio](https://lmstudio.ai)

### 98. Run your own harness

Pi, OpenClaw, Hermes, or one you built. You choose the tools, the prompts and the loop.

- How it's checked: Pi, OpenClaw, Hermes or a harness you wrote, installed and in use.
- Try: [Pi](https://github.com/badlogic/pi-mono), [OpenClaw](https://openclaw.ai)
- Who does it: Peter Steinberger: “I use OpenClaw (which uses Codex) and web sessions.” (https://x.com/steipete/status/2102641364681048328)

### 99. Let it improve your setup

A scheduled agent reads your recent sessions, finds the friction, and fixes your rules and skills.

- How it's checked: A recurring agent run that reviews past sessions and edits rules or skills, or /insights used to change your setup.
- Who does it: OpenAI, Codex best practices: Schedule a review of recent chats to find friction, then fix prompts and setup. (https://learn.chatgpt.com/guides/best-practices)

### 100. Write your own agent

A model, a loop and a few tools, in a few hundred lines. After that, nothing on this list is magic.

- How it's checked: A project of yours that calls a model API with tools in a loop you wrote, not only an SDK or someone else's harness.
- Try: [How to build an agent](https://ampcode.com/how-to-build-an-agent) (Thorsten Ball's walkthrough)
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
