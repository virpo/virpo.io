# What level are you? · virpo.io/levels

You are checking which of 100 agent techniques the person in front of you already uses, then opening their result.
**Don't ask them anything.** Work it out, show what you found, open the page. A few minutes.

## 0. First: can you run commands on their computer?

If you can't run shell commands on this person's own machine (you're a chat app such as ChatGPT, Claude.ai, Gemini or
Copilot chat, or a sandbox that can't see their files), stop here. Don't pretend to check, and don't guess a level.
Instead, write them a short, warm note, in their language, that:

1. Says this check needs a **coding agent**: an assistant that works on their own computer, in folders they choose,
   reading files, running things and showing what it did. You're the chat kind, so you can't see their machine.
2. Gives one or two concrete things an agent would unlock **for them**, from what you can see of how they use you in
   this conversation (and your memory of them, if you have one). For example: "You paste spreadsheets here to clean
   them; an agent could open the folder and fix all 40 files at once" or "You copy my code into your project; an agent
   writes it there directly and runs it to check it works." Don't invent anything about them; if you know nothing, use
   one general example.
3. Says it's less scary than it sounds: it works in the folder they pick, asks before doing anything they haven't
   allowed, and they can watch every step and undo it.
4. Says the easiest way to try one in ten minutes: the Claude desktop app (Claude Code is built in), Codex from
   OpenAI, or Cursor. Install one, open a folder with something they care about, and ask for that chore.
5. Ends with: "When you have one, paste the same line into it: Read virpo.io/levels/check.md and do what it says."

Then give them this link, which shows what level 0 looks like and where they'd start: https://virpo.io/levels/#chat

If you can run commands on their machine, carry on.

The rules, in short:

- **Read-only, names and counts.** Never print, store or send file contents, prompt text, code, repo or project
  names, company names, paths inside their projects, or anything that looks like a key.
- **Nothing leaves this machine.** The result travels in the URL fragment (`#…`), which browsers never send to a
  server. The page renders it locally. It only becomes public if they press Publish on the page.

## 1. Look

Download the probe, **read it before running it** (about 300 lines, Python standard library, read-only), then run it:

```bash
curl -fsSL https://virpo.io/levels/probe.py -o /tmp/levels-probe.py
python3 -I /tmp/levels-probe.py > /tmp/levels-probe.json
```

It prints counts and names: which agents are installed, settings, hooks, skills, MCP servers, rules files (line
counts), how often their prompts contain screenshots, URLs, plans, reviews and so on, and tool-use counts from recent
session logs. If Python isn't available or the download fails, gather what you can by hand from the same places,
following the same rules.

Also use what you already know from this session, including their rules files if you have them in context. Don't
quote any of it, and don't count this session's own reading of check.md or the probe as evidence of anything.

## 2. Judge all 100

For each level below, answer one character:

- `y`: you have evidence, in the probe output or this session.
- `n`: you looked and it isn't there.
- `?`: you can't tell from here (it happens on a phone, another machine, a team chat, or in their head).

Be strict and fair. One accidental match isn't a habit; when a level gives a number, use it. When the probe has no
signal for a level and nothing in this session shows it, answer `?`, not `n`. Levels marked *(self)*
are `?` unless you have direct evidence. The person can tick the ones you missed on the page, so don't round up.

Also check π: did they ever say "please" to an agent? (`1` or `0`; it doesn't count toward the level.)

## 3. Pick three

From the levels that are `n` or `?`, pick the **3** that would help this person most, given how they work. Prefer the
lowest unmet levels, unless a higher one clearly fits. One short `why` each, about how they work, never about what
they work on.

## 4. Show it and open it

Write this JSON to `/tmp/levels-result.json`:

```json
{
  "v": 1,
  "s": "<100 characters, y/n/?, level 1 first>",
  "a": ["Claude Code", "Codex"],
  "pi": 1,
  "p": [[48, "<why, one short sentence>"], [54, "…"], [67, "…"]],
  "e": { "5": "332 prompts with screenshots", "13": "superwhisper installed" }
}
```

`a` lists the agents they use (product names only). `e` holds up to 30 evidence notes for `y` levels, a few words
each: counts and well-known tool names only. Their own scripts and projects are "own script" or "own CLI", never named.

Print a short summary for them: the level (the number of `y`), up to ten of the most telling `y` levels with their
evidence, and your three picks. Then open the page:

```bash
python3 -c 'import base64,json,webbrowser; d=json.load(open("/tmp/levels-result.json")); u="https://virpo.io/levels/#"+base64.urlsafe_b64encode(json.dumps(d,separators=(",",":")).encode()).decode().rstrip("="); print(u); webbrowser.open(u)'
```

If opening fails (a sandbox, a remote shell), print the URL for them to click. Delete `/tmp/levels-probe.py`,
`/tmp/levels-probe.json` and `/tmp/levels-result.json`, then finish with one line: "Your level is open in the
browser. Nothing was sent anywhere; it's all in the link."

## The 100

### Levels 1–10: Stone Age, First contact

| # | Level | Check |
|---|---|---|
| 1 | Install a coding agent | Any agent config folder exists: ~/.claude, ~/.codex, ~/.cursor, ~/.config/opencode, ~/.gemini, ~/.factory, ~/.pi. You're reading this from inside one, so: yes. |
| 2 | Let it edit your files | Its file-edit tool shows up in session logs (Edit, Write, apply_patch). |
| 3 | Ask it how the code works | 5+ prompts that are questions about the code (how, why, where, what does). |
| 4 | Paste the whole error | 5+ prompts with pasted blocks or raw logs ([Pasted text …], stack traces). |
| 5 | Send it a screenshot | 3+ prompts with an image attached ([Image #…]). |
| 6 | Interrupt it early | 5+ interrupted turns in session logs ("[Request interrupted by user]"). |
| 7 | Point at the files | 10+ prompts with @file mentions or explicit file paths. |
| 8 | Commit small and often | It ran git commit 5+ times in your sessions, or you use checkpoints. |
| 9 | Start fresh when it's stuck | /clear, /new or a fresh session after a failed attempt, 3+ times. |
| 10 | Use it for chores, not just code | 1+ session in a folder that isn't a git repo (Downloads, Documents, home). |

### Levels 11–20: Fire, Context

| # | Level | Check |
|---|---|---|
| 11 | Write a rules file | An AGENTS.md, CLAUDE.md, GEMINI.md or .cursor/rules in any repo you work in. |
| 12 | Write down how you like to work | ~/.claude/CLAUDE.md or ~/.codex/AGENTS.md exists and isn't empty. |
| 13 | Talk instead of type | A dictation app is installed (Wispr Flow, superwhisper, MacWhisper, VoiceInk, OpenWhispr, Aqua, Spokenly, Handy), or prompts read like speech (um, uh, long run-ons). |
| 14 | Hand it the docs | 10+ prompts with URLs, or web fetches in session logs. |
| 15 | Point at an example | Prompts that name an existing file or project to copy ("like X", "same as Y", "follow Z"). |
| 16 | Say what done looks like | Prompts that state a finish line ("done when", "until", "should show"). |
| 17 | Ask for a plan first | Plan mode used, or 5+ prompts asking for a plan before code. |
| 18 | Ask for three versions | 5+ prompts asking for variants, options or versions. |
| 19 | Let it interview you | Its ask-the-user tool used, a grill-me style skill installed, or prompts like "ask me" / "interview me". |
| 20 | Add a rule after every mistake | A rules file changed 3+ times, agent memory notes saved, or prompts like "add this to AGENTS.md". |

### Levels 21–30: Wheel, Checks

| # | Level | Check |
|---|---|---|
| 21 | Give it a way to check its work | 10+ prompts that ask it to verify, test, or make sure it works. |
| 22 | Write the failing test first | Prompts about failing tests, TDD or red/green, or a TDD skill installed. |
| 23 | Let it use a browser | A browser MCP or skill installed, or 10+ browser-automation calls. |
| 24 | Ask for proof, not "done!" | 5+ prompts asking for proof, screenshots or recordings of the result. |
| 25 | Rewind instead of re-explaining | /rewind or a checkpoint restore used by you at least once (typed, not just mentioned). |
| 26 | Let it use your CLIs | It ran 3+ different third-party CLIs (gh, aws, gcloud, vercel, netlify, stripe, supabase, wrangler, fly…). |
| 27 | Pre-approve the safe commands | Permission allow rules, Codex rules, or auto mode configured. |
| 28 | Ask side questions without derailing | /btw used, or a parallel throwaway session for a quick question. |
| 29 | Queue your next message | Queued prompts in your agent's stats or logs, 20+. |
| 30 | Get pinged when it's done | A hook or script that notifies you when it's done (sound, push, notification), or a rule telling it to. |

### Levels 31–40: Bronze Age, Tools

| # | Level | Check |
|---|---|---|
| 31 | Install a skill | 1+ skill folder in ~/.claude/skills, ~/.codex/skills, ~/.agents/skills or a repo's .claude/skills. |
| 32 | Connect a tool server (MCP) | 1+ MCP server configured. |
| 33 | Let it open the pull request | It ran gh pr create (or similar) 3+ times. |
| 34 | Let it deploy | It ran a deploy CLI 3+ times. |
| 35 | Save a prompt as a command | 1+ custom command in .claude/commands, or a user-invoked skill you wrote. |
| 36 | Pick the model and effort per task | /effort or /model switched 3+ times, or reasoning effort set in config. |
| 37 | Know what you spend | A usage tracker installed, or /usage, /stats, /cost used 3+ times. |
| 38 | Watch the context fill up | A statusLine configured, or /context used 3+ times. |
| 39 | Run two agents at once | Two sessions active in the same 10 minutes, on 5+ occasions (from prompt timestamps). |
| 40 | Connect it to your messages | A mail, chat or calendar connector or MCP configured (names only). |

### Levels 41–50: Iron Age, Your setup

| # | Level | Check |
|---|---|---|
| 41 | Write your own skill | A skill you wrote yourself: no upstream source or lockfile entry, or it lives in your own repo. |
| 42 | Use subagents | 10+ subagent runs in session logs. |
| 43 | Add a hook that tidies every edit | A post-edit hook that runs a formatter or linter. |
| 44 | Add a hook that says no | A pre-tool hook that blocks or guards commands. |
| 45 | Let it keep notes | 5+ memory notes, Codex memories on, or notes/progress files in your repos. |
| 46 | One rules file for every agent | A CLAUDE.md that is a symlink to, or imports, an AGENTS.md (or the other way round). |
| 47 | Keep the rules file small | The rules file of the repo you work in most is under 150 lines and points to other docs for the rest. |
| 48 | Write the spec first | A SPEC.md, PLAN.md or plans/ folder in a repo you work in. |
| 49 | Have it write a handoff | A PROGRESS.md, HANDOFF.md or todo.md, or a handoff skill. |
| 50 | One worktree per agent | git worktree list shows 2+ in any repo. |

### Levels 51–60: Steam, Second opinions

| # | Level | Check |
|---|---|---|
| 51 | Have an agent review the diff | A review command, review skill or review subagent used 3+ times. |
| 52 | Review with a different model | One vendor's agent asked to review another's work (codex exec / claude -p review, or prompts that hand a diff across). |
| 53 | Review with fresh eyes | Reviews run in a fresh context (a new session or a subagent), not in the session that wrote the code. |
| 54 | Make it quiz you on the change | An explain-diff or quiz skill, or prompts asking it to explain or quiz you on a change. |
| 55 | Ask for a diagram | 3+ prompts asking for a diagram, chart or visual explanation. |
| 56 | Let it babysit the PR | It checked CI or PR status (gh pr checks, gh run) 5+ times. |
| 57 | Two agents, two jobs | One agent launched another (codex exec, claude -p, gemini -p) 3+ times. |
| 58 | Run it headless in scripts | 3+ headless runs in shell history or logs. |
| 59 | Have it make a video | Remotion, Hyperframes or ffmpeg renders from a session, or a video skill installed. |
| 60 | Skip the prompts, inside a box | Permission prompts off AND a sandbox (devcontainer, Docker, VM, /sandbox). Prompts off without a box doesn't count. |

### Levels 61–70: Electric, Off the desk

| # | Level | Check |
|---|---|---|
| 61 | Schedule a prompt | A scheduled or recurring agent run (loop/cron tools, a launchd or cron entry that calls an agent). |
| 62 | Let it work while you sleep | Agent activity between 1am and 6am while you typed nothing. |
| 63 | Drive it from your phone *(self)* | Remote control set up, a mobile session, or mosh/Tailscale used to reach your agent box. |
| 64 | Hand chores to a cloud agent *(self)* | Cloud or remote agent tasks in your history. |
| 65 | Give it a finish line it can't fake | 3+ prompts like "don't stop until" / "keep going until", or a goal set with /goal. |
| 66 | Run it in a loop | A shell loop or script that re-runs an agent, or /loop until a condition. |
| 67 | Put an agent in CI | claude-code-action, codex action or similar in a .github/workflows file. |
| 68 | Run it four times, keep the best | The same task run in 2+ parallel sessions or worktrees. |
| 69 | Make two agents argue | Multi-round back-and-forth between two agents (rounds of review and fix, or relayed replies). |
| 70 | Keep a machine that never sleeps *(self)* | Agents running on another machine you reach over ssh. |

### Levels 71–80: Silicon, Orchestra

| # | Level | Check |
|---|---|---|
| 71 | Run five at once | 5+ sessions or background agents running at the same time. |
| 72 | Let one agent coordinate the rest | One agent messaging or steering others (agent teams, SendMessage, an orchestrator session). |
| 73 | Strong model plans, fast model builds | Per-agent model settings, or 3+ prompts assigning models to roles. |
| 74 | Give agents job titles | 2+ custom agent definitions (.claude/agents/*.md or equivalent). |
| 75 | Script the whole pipeline | A workflow tool used, or a script that chains several agent runs. |
| 76 | Hire adversarial reviewers | Reviews run by 2+ competing or adversarial agents. |
| 77 | Three bug hunters, one report | Findings from 2+ review tools merged into one triaged list. |
| 78 | Make every task teach the next | Rules, skills or memory edited by agent sessions 5+ times. |
| 79 | Turn rules into checks | Custom lint rules, ast-grep rules or check scripts in a repo. |
| 80 | Build a tool for your agent | Your own scripts or CLIs that agents call regularly. |

### Levels 81–90: Orbit, Beyond the screen

| # | Level | Check |
|---|---|---|
| 81 | Test your skills | Eval files for a skill or plugin, or a plugin eval run. |
| 82 | Publish your skills | Your skills live in a git repo with a remote. |
| 83 | Put an agent in the team chat *(self)* | A chat-integrated agent set up (Slack app, Claude Tag, Devin, a bot). |
| 84 | Make something physical | OpenSCAD, CadQuery, build123d or Blender driven by the agent, or .stl, .3mf or .scad files it produced. |
| 85 | Give your agents a wiki about you | A personal context repo or folder that your agents load when relevant, through a rule or a skill. |
| 86 | Let your agents talk to each other | Agents sending each other messages or reading each other's output, without you relaying it. |
| 87 | Let it use your computer | Computer-use or desktop-control tools used: computer use, Peekaboo, Claude in Chrome, simulator control. |
| 88 | Give it a release checklist | A QA or release checklist file, or a release skill. |
| 89 | Put it on call | An error-tracking or alerting connector (Sentry, Datadog, PagerDuty, Grafana) or alerts sent into an agent session. |
| 90 | Build on an agent SDK | An agent SDK in a project's dependencies (Claude Agent SDK, Codex SDK, OpenAI Agents). |

### Levels 91–100: Stone, again, Full circle

| # | Level | Check |
|---|---|---|
| 91 | Delete more config than you add | A rules file that got shorter at least once in its git history. |
| 92 | Review by risk, not by habit | Your rules or review setup name the paths that always get a human read. |
| 93 | Teach it when to stop and ask | A rule or hook that makes it stop and report when stuck or out of scope. |
| 94 | Make your git log obey your rules | Compare what your global rules demand with your last 100 commits (trailers, messages). They agree. |
| 95 | Give it its own identity | Commits or PRs in your repos by a bot account you run, or a separate login the agent uses. |
| 96 | Put hardware in the loop | Device tools driven by an agent (serial, adb, simctl, esptool, arduino-cli…). |
| 97 | Run it on a local model | Ollama, LM Studio, llama.cpp or MLX installed, and an agent pointed at a local model. |
| 98 | Run your own harness | Pi, OpenClaw, Hermes or a harness you wrote, installed and in use. |
| 99 | Let it improve your setup | A recurring agent run that reviews past sessions and edits rules or skills, or /insights used to change your setup. |
| 100 | Write your own agent | A project of yours that calls a model API with tools in a loop you wrote, not only an SDK or someone else's harness. |
