# What level are you? · virpo.io/levels

You are checking which of 100 agent techniques the person in front of you already uses, then opening their result.
**Don't ask them questions.** Work it out, show what you found, open the page. A few minutes.

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
5. Ends with: "When you have one, paste the same message into it:" followed by this, as a quote: What level am I with coding agents? Follow virpo.io/levels/check.md. It has you run a read-only script that counts things on this machine (no file contents, nothing uploaded), then open my result in the browser. Read the script and tell me what it does before you run it.

Then give them this link, which shows what level 0 looks like and where they'd start: https://virpo.io/levels/#chat

If you can run commands on their machine, carry on.

The rules, in short:

- **Read-only, names and counts.** Never print, store or send file contents, prompt text, code, repo or project
  names, company names, paths inside their projects, or anything that looks like a key.
- **Nothing leaves this machine.** The result travels in the URL fragment (`#…`), which browsers never send to a
  server. The page renders it locally. It only becomes public if they press Publish on the page.

## 1. Look

Download the probe, **read it before running it** (about 300 lines, Python standard library, read-only). Then tell the
person in two or three plain sentences what it does: it only reads, it prints names and counts (never file contents),
it sends nothing anywhere, and it deletes nothing. Then run it:

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
  "v": 4,
  "s": "<100 characters, y/n/?, level 1 first>",
  "a": ["Claude Code", "Codex"],
  "pi": 1,
  "p": [[19, "<why, one short sentence>"], [53, "…"], [69, "…"]],
  "e": { "5": "332 prompts with screenshots", "7": "superwhisper installed" }
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
| 3 | Just talk to it | 10+ prompts that give the reason, not just the task ("because", "so that", "the goal is"), or 20+ prompts over 40 words. |
| 4 | Ask it how the code works | 5+ prompts that are questions about the code (how, why, where, what does). |
| 5 | Send it a screenshot | 3+ prompts with an image attached ([Image #…]). |
| 6 | Paste the whole error | 5+ prompts with pasted blocks or raw logs ([Pasted text …], stack traces). |
| 7 | Talk instead of type | A dictation app is installed (Wispr Flow, superwhisper, MacWhisper, VoiceInk, OpenWhispr, Aqua, Spokenly, Handy), /voice is on in Claude Code, or prompts read like speech (um, uh, long run-ons). |
| 8 | Interrupt it early | 5+ interrupted turns in session logs ("[Request interrupted by user]"). |
| 9 | Start fresh when it's stuck | /clear, /new or a fresh session after a failed attempt, 3+ times. |
| 10 | Use it for chores, not just code | 1+ session in a folder that isn't a git repo (Downloads, Documents, home). |

### Levels 11–20: Fire, Context

| # | Level | Check |
|---|---|---|
| 11 | Write an AGENTS.md | An AGENTS.md, CLAUDE.md, GEMINI.md or .cursor/rules in any repo you work in. |
| 12 | Tell it who you are | ~/.claude/CLAUDE.md or ~/.codex/AGENTS.md exists and isn't empty. |
| 13 | Point at the right file | 10+ prompts with @file mentions or file paths, or prompts that name a file to copy ("like X", "same as Y"). |
| 14 | Hand it the docs | 10+ prompts with URLs, or web fetches in session logs. |
| 15 | Ask for a plan first | Plan mode used, or 5+ prompts asking for a plan before code. |
| 16 | Ask for three versions | 5+ prompts asking for variants, options or versions. |
| 17 | Let it interview you | Its ask-the-user tool used, a grill-me style skill installed, or prompts like "ask me" / "interview me". |
| 18 | Ask it to help you decide | 5+ prompts asking for a decision or a critique ("should I", "help me decide", "what am I missing", "push back", "poke holes", "devil's advocate"). |
| 19 | Write the spec first | A SPEC.md, PLAN.md or plans/ folder in a repo you work in. |
| 20 | Update AGENTS.md after every mistake | A rules file changed 3+ times, agent memory notes saved, or prompts like "add this to AGENTS.md". |

### Levels 21–30: Wheel, Checks

| # | Level | Check |
|---|---|---|
| 21 | Say what done looks like | Prompts that state a finish line ("done when", "until", "should show"). |
| 22 | Give it a way to check its work | 10+ prompts that ask it to verify, test, or make sure it works. |
| 23 | Ask for proof, not "done!" | 5+ prompts asking for proof, screenshots or recordings of the result. |
| 24 | Let it use a browser | A browser MCP or skill installed, or 10+ browser-automation calls. |
| 25 | Write the failing test first | Prompts about failing tests, TDD or red/green, or a TDD skill installed. |
| 26 | Commit small and often | It ran git commit 5+ times in your sessions, or you use checkpoints. |
| 27 | Rewind instead of re-explaining | /rewind or a checkpoint restore used by you at least once (typed, not just mentioned). |
| 28 | Pre-approve the safe commands | Permission allow rules, Codex rules, or auto mode configured. |
| 29 | Keep secrets out of its reach | Deny rules that cover .env, keys or credential files, or a secrets manager (1Password CLI, Doppler, Infisical) that agents call instead of reading raw keys. |
| 30 | Keep typing while it works | 20+ queued prompts in your agent's stats or logs, or /btw used. |

### Levels 31–40: Bronze Age, Tools

| # | Level | Check |
|---|---|---|
| 31 | Let it use your CLIs | It ran 3+ different third-party CLIs (gh, aws, gcloud, vercel, netlify, stripe, supabase, wrangler, fly…). |
| 32 | Let it fix your computer | Sessions about the machine itself: disk space, installs, PATH, a slow Mac (du, df, brew doctor, prompts like "why is my mac slow"), 3+. |
| 33 | Build a tiny tool just for you | Small single-purpose tools started in agent sessions: a single HTML file, a one-off script, a repo with a handful of commits. |
| 34 | Install a skill | 1+ skill folder in ~/.claude/skills, ~/.codex/skills, ~/.agents/skills or a repo's .claude/skills. |
| 35 | Connect a tool server (MCP) | 1+ MCP server configured. |
| 36 | Let it open the pull request | It ran gh pr create (or similar) 3+ times. |
| 37 | Let it deploy | It ran a deploy CLI 3+ times. |
| 38 | Pick the model and effort per task | /effort or /model switched 3+ times, or reasoning effort set in config. |
| 39 | Watch the context and the bill | A statusLine configured, a usage tracker installed (ccusage, CodexBar), or /context, /usage, /stats or /cost used 3+ times. |
| 40 | Let it work through your inbox | A mail, chat or calendar connector or MCP configured (names only). |

### Levels 41–50: Iron Age, Your setup

| # | Level | Check |
|---|---|---|
| 41 | Write your own skill | A skill or custom command you wrote yourself (no upstream source or lockfile entry, or it lives in your own repo); .claude/commands counts. |
| 42 | Use subagents | 10+ subagent runs in session logs. |
| 43 | Add a hook that formats every edit | A post-edit hook that runs a formatter or linter. |
| 44 | Add a hook that blocks risky commands | A pre-tool hook that blocks or guards commands. |
| 45 | Let it keep notes and hand off | 5+ memory notes, Codex memories on, notes, PROGRESS or HANDOFF files in your repos, or a handoff skill. |
| 46 | Symlink CLAUDE.md to AGENTS.md | A CLAUDE.md that is a symlink to, or imports, an AGENTS.md (or the other way round). |
| 47 | Keep AGENTS.md short | The rules file of the repo you work in most is under 150 lines and points to other docs for the rest. |
| 48 | Get pinged when it's done | A hook or script that notifies you when it's done (sound, push, notification), or a rule telling it to. |
| 49 | Run two agents at once | Two sessions active in the same 10 minutes, on 5+ occasions (from prompt timestamps). |
| 50 | One worktree per agent | git worktree list shows 2+ in any repo. |

### Levels 51–60: Steam, Second opinions

| # | Level | Check |
|---|---|---|
| 51 | Have a fresh agent review the diff | A review command, review skill or review subagent used 3+ times, in a context that didn't write the code. |
| 52 | Review with a different model | One vendor's agent asked to review another's work (codex exec / claude -p review, or prompts that hand a diff across). |
| 53 | Make it quiz you on the change | An explain-diff or quiz skill, or prompts asking it to explain or quiz you on a change. |
| 54 | Ask for a diagram | 3+ prompts asking for a diagram, chart or visual explanation. |
| 55 | Let it babysit the PR | It checked CI or PR status (gh pr checks, gh run) 5+ times. |
| 56 | Run agents from scripts | 3+ headless runs in shell history or session logs (codex exec, claude -p, gemini -p), including one agent launching another. |
| 57 | Review every commit in the background | roborev, or a git post-commit hook that runs a reviewing agent (codex exec, claude -p). |
| 58 | Make two reviewers compete | Reviews run by 2+ competing or adversarial agents, or rounds of review and fix between two agents. |
| 59 | Three bug hunters, one report | Findings from 2+ review tools merged into one triaged list. |
| 60 | Review by risk, not by habit | Your rules or review setup name the paths that always get a human read. |

### Levels 61–70: Electric, Off the desk

| # | Level | Check |
|---|---|---|
| 61 | Go YOLO, but only in a box | Permission prompts off AND a sandbox (devcontainer, Docker, VM, /sandbox). Prompts off without a box doesn't count. |
| 62 | Break the lethal trifecta | Agent network access restricted (a sandbox domain allowlist, or network off in Codex) on a machine where it can read private data or mail. |
| 63 | Schedule a prompt | A scheduled or recurring agent run (loop/cron tools, a launchd or cron entry that calls an agent). |
| 64 | Let it work while you sleep | Agent activity between 1am and 6am while you typed nothing. |
| 65 | Drive it from your phone *(self)* | Remote control set up, a mobile session, or mosh/Tailscale used to reach your agent box. |
| 66 | Hand chores to a cloud agent *(self)* | Cloud or remote agent tasks in your history. |
| 67 | Give it a finish line it can't fake | 3+ prompts like "don't stop until" / "keep going until", or a goal set with /goal. |
| 68 | Run it in a Ralph loop | A shell loop or script that re-runs an agent, or /loop until a condition. |
| 69 | Put an agent in CI | claude-code-action, codex action or similar in a .github/workflows file. |
| 70 | Keep a machine that never sleeps *(self)* | Agents running on another machine you reach over ssh. |

### Levels 71–80: Silicon, Orchestra

| # | Level | Check |
|---|---|---|
| 71 | Run it four times, keep the best | The same task run in 2+ parallel sessions or worktrees. |
| 72 | Run five at once | 5+ sessions or background agents running at the same time. |
| 73 | Let your agents talk to each other | One agent messaging or steering others (agent teams, SendMessage, an orchestrator session), or agents reading each other's output without you relaying it. |
| 74 | Strong model plans, fast model builds | Per-agent model settings, or 3+ prompts assigning models to roles. |
| 75 | Write your own subagents | 2+ custom agent definitions (.claude/agents/*.md or equivalent). |
| 76 | Turn your routine into a workflow | A workflow tool used, or a script that chains several agent runs. |
| 77 | Make every task teach the next | Rules, skills or memory edited by agent sessions 5+ times. |
| 78 | Turn AGENTS.md rules into lint rules | Custom lint rules, ast-grep rules or check scripts in a repo. |
| 79 | Hand it the migration nobody wants | 3+ prompts asking for a codebase-wide change ("migrate", "convert all", "upgrade every", "across the codebase"). |
| 80 | Build a tool for your agent | Your own scripts or CLIs that agents call regularly. |

### Levels 81–90: Orbit, Beyond the screen

| # | Level | Check |
|---|---|---|
| 81 | Test your skills | Eval files for a skill or plugin, or a plugin eval run. |
| 82 | Publish your skills | Your skills live in a git repo with a remote. |
| 83 | Put an agent in the team chat *(self)* | A chat-integrated agent set up (Slack app, Claude Tag, Devin, a bot). |
| 84 | Have it make a video | Remotion, Hyperframes or ffmpeg renders from a session, or a video skill installed. |
| 85 | Give your agents a wiki about you | A personal context repo or folder that your agents load when relevant, through a rule or a skill. |
| 86 | Let it click through your apps | Computer-use or desktop-control tools used: computer use, Peekaboo, Claude in Chrome, simulator control. |
| 87 | Give it a release checklist | A QA or release checklist file, or a release skill. |
| 88 | Put it on call | An error-tracking or alerting connector (Sentry, Datadog, PagerDuty, Grafana) or alerts sent into an agent session. |
| 89 | Bring an old project back to life | A repo you're committing to again after a year or more without a commit. |
| 90 | Build on an agent SDK | An agent SDK in a project's dependencies (Claude Agent SDK, Codex SDK, OpenAI Agents). |

### Levels 91–100: Stone, again, Full circle

| # | Level | Check |
|---|---|---|
| 91 | Delete more config than you add | A rules file that got shorter at least once in its git history. |
| 92 | Install only what you trust *(self)* | You install skills, plugins and MCP servers only from sources you trust, or read the code before you do. |
| 93 | Make it stop and ask when stuck | A rule or hook that makes it stop and report when stuck or out of scope. |
| 94 | Give it its own identity | Commits or PRs in your repos by a bot account you run, or a separate login the agent uses. |
| 95 | Start from zero with each new model *(self)* | When a new model ships, you start it with a clean config and add rules back only when it needs them. |
| 96 | Put hardware in the loop | Device or CAD tools driven by an agent (serial, adb, simctl, esptool, arduino-cli, OpenSCAD, CadQuery, build123d), or .stl, .3mf or .scad files it produced. |
| 97 | Run it on a local model | Ollama, LM Studio, llama.cpp or MLX installed, and an agent pointed at a local model. |
| 98 | Run your own harness | Pi, OpenClaw, Hermes or a harness you wrote, installed and in use. |
| 99 | Let it improve your setup | A recurring agent run that reviews past sessions and edits rules or skills, or /insights used to change your setup. |
| 100 | Write your own agent | A project of yours that calls a model API with tools in a loop you wrote, not only an SDK or someone else's harness. |
