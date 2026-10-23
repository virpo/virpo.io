#!/usr/bin/env python3
"""levels probe: what your agent setup looks like, as names and counts.

Read-only. Standard library only. It never prints file contents, prompt text, paths inside your repos, or anything
that looks like a key; just counts, booleans and the names of agents, skills, hooks and MCP servers, so your agent can
judge which of the 100 levels you do. Nothing is sent anywhere. Run it, read the output, keep it if you like.

  python3 -I probe.py            # JSON on stdout, about 5-30 seconds
"""
import json, os, re, shutil, subprocess, sys, time
from collections import Counter, defaultdict
from pathlib import Path

HOME = Path.home()
NOW = time.time()
OUT = {"probe": 2, "os": sys.platform}


def exists(p):
    try:
        return Path(p).expanduser().exists()
    except OSError:
        return False


def read(p, limit=2_000_000):
    try:
        with open(Path(p).expanduser(), "r", encoding="utf-8", errors="replace") as f:
            return f.read(limit)
    except OSError:
        return ""


def lines(p):
    t = read(p)
    return t.count("\n") + (1 if t and not t.endswith("\n") else 0)


def load_json(p):
    try:
        return json.loads(read(p, 20_000_000) or "null")
    except ValueError:
        return None


def names(d):
    try:
        return sorted(x.name for x in Path(d).expanduser().iterdir() if not x.name.startswith("."))
    except OSError:
        return []


def run(cmd, cwd=None, timeout=8):
    try:
        return subprocess.run(cmd, cwd=cwd, capture_output=True, text=True, timeout=timeout).stdout
    except (OSError, subprocess.SubprocessError):
        return ""


# ---------------------------------------------------------------- agents installed
AGENT_DIRS = {"Claude Code": "~/.claude", "Codex": "~/.codex", "Cursor": "~/.cursor", "OpenCode": "~/.config/opencode",
              "Gemini CLI": "~/.gemini", "Factory": "~/.factory", "Amp": "~/.config/amp", "Pi": "~/.pi",
              "OpenClaw": "~/.openclaw", "Hermes": "~/.hermes"}
OUT["agents"] = [k for k, v in AGENT_DIRS.items() if exists(v)]

# ---------------------------------------------------------------- settings
cs = load_json("~/.claude/settings.json") or {}
KNOWN = {"prettier", "eslint", "biome", "ruff", "black", "gofmt", "rustfmt", "swiftformat", "dprint", "oxlint", "terminal-notifier",
         "osascript", "say", "afplay", "notify-send", "ntfy", "jq", "node", "npx", "bun", "python", "python3", "uv", "bash", "sh", "deno"}
KINDS = {"formatter": r"prettier|eslint|biome|ruff|black|gofmt|rustfmt|swiftformat|dprint|oxlint|--fix|format",
         "notifier": r"terminal-notifier|osascript|\bsay\b|afplay|notify-send|ntfy|pushover|notification|\bnotify",
         "guard": r"exit 2|\bdeny\b|\bblock|guard|forbid|not allowed|permissionDecision"}


def hook(event, cmd, matcher=None, agent=""):
    """event, matcher and what the hook does (formatter / notifier / guard / other), read from the command and, when the
    command is a local script, from that script. Your own scripts show as "own script", never by name."""
    words = cmd.replace('"', " ").replace("'", " ").split()
    first = Path(words[0]).name if words else "?"
    text = cmd
    if words and Path(words[0]).expanduser().is_file():
        text += read(words[0], 200_000)
    kinds = [k for k, rx in KINDS.items() if re.search(rx, text, re.I)] or ["other"]
    return f"{agent}{event}{f' [{matcher}]' if matcher else ''}: {first if first in KNOWN else 'own script'} ({', '.join(kinds)})"


hooks = []
for event, groups in (cs.get("hooks") or {}).items():
    for g in groups or []:
        for h in (g or {}).get("hooks", []):
            hooks.append(hook(event, h.get("command") or "", g.get("matcher")))
ch = load_json("~/.codex/hooks.json") or {}
for event, groups in (ch.get("hooks") or ch or {}).items() if isinstance(ch, dict) else []:
    for g in groups if isinstance(groups, list) else []:
        for h in (g or {}).get("hooks", []) if isinstance(g, dict) else []:
            hooks.append(hook(event, h.get("command") or "", g.get("matcher"), "codex "))
perms = cs.get("permissions") or {}
codex_cfg = read("~/.codex/config.toml")
OUT["settings"] = {
    "claude_hooks": hooks,
    "allow_rules": len(perms.get("allow") or []), "deny_rules": len(perms.get("deny") or []),
    "deny_rules_on_secrets": sum(1 for r in perms.get("deny") or [] if re.search(r"\.env|secret|\.ssh|\.aws|credential|\.pem|\.key\b|token", str(r), re.I)),
    "sandbox_network_limited": bool(re.search(r"allowedDomains|allowed_domains|deniedDomains", json.dumps((cs.get("sandbox") or {}).get("network") or {}))),
    "codex_network_off": bool(re.search(r"^\s*network_access\s*=\s*false", codex_cfg, re.M)),
    "voice_on": bool(cs.get("voice")),
    "default_mode": perms.get("defaultMode"), "skip_danger_prompt": bool(cs.get("skipDangerousModePermissionPrompt")),
    "status_line": bool(cs.get("statusLine")), "sandbox": bool((cs.get("sandbox") or {}).get("enabled")),
    "claude_model": cs.get("model"), "claude_effort": cs.get("effortLevel"),
    "codex_effort": (re.search(r'^\s*model_reasoning_effort\s*=\s*"([^"]+)"', codex_cfg, re.M) or [None, None])[1],
    "codex_approval": (re.search(r'^\s*approval_policy\s*=\s*"([^"]+)"', codex_cfg, re.M) or [None, None])[1],
    "codex_sandbox": (re.search(r'^\s*sandbox_mode\s*=\s*"([^"]+)"', codex_cfg, re.M) or [None, None])[1],
    "codex_memories": bool(re.search(r"^\s*memories\s*=\s*true", codex_cfg, re.M)),
    "codex_profiles": len(re.findall(r"^\s*\[profiles\.", codex_cfg, re.M)),
    "codex_rules": len(names("~/.codex/rules")),
}

# ---------------------------------------------------------------- MCP servers, skills, commands, agents
cj = load_json("~/.claude.json") or {}
mcp = set((cj.get("mcpServers") or {}).keys())
for proj in (cj.get("projects") or {}).values():
    mcp |= set(((proj or {}).get("mcpServers") or {}).keys())
mcp |= set(re.findall(r"^\s*\[mcp_servers\.([^\].]+)\]", codex_cfg, re.M))
mcp |= set(((load_json("~/.cursor/mcp.json") or {}).get("mcpServers") or {}).keys())
mcp |= set(((load_json(".mcp.json") or {}).get("mcpServers") or {}).keys())
plugins = sorted(k.split("@")[0] for k, v in (cs.get("enabledPlugins") or {}).items() if v)

skill_dirs = ["~/.claude/skills", "~/.codex/skills", "~/.agents/skills", "~/.config/opencode/skill", ".claude/skills"]
skills = {}
for d in skill_dirs:
    for n in names(d):
        p = Path(d).expanduser() / n
        skills[n] = {"linked": p.is_symlink(), "has_evals": any(x.name.lower().startswith("eval") for x in p.glob("*")) if p.is_dir() else False}
lock = load_json("~/.agents/.skill-lock.json") or load_json("~/.claude/skills/.skill-lock.json") or {}
installed = set((lock.get("skills") or lock or {}).keys()) if isinstance(lock, dict) else set()


def git_remote(p):
    return bool(run(["git", "-C", str(p), "remote"]).strip())


OUT["tools"] = {
    "mcp_servers": sorted(mcp), "plugins": plugins,
    "skills": sorted(skills), "skills_installed_from_elsewhere": sorted(installed & set(skills)),
    "skills_with_evals": sorted(k for k, v in skills.items() if v["has_evals"]),
    "skills_dirs_in_git_with_remote": [d for d in skill_dirs if exists(d) and git_remote(Path(d).expanduser().resolve())],
    "commands": names("~/.claude/commands") + names(".claude/commands") + names("~/.codex/prompts"),
    "agent_definitions": names("~/.claude/agents") + names(".claude/agents"),
    "memory_notes": len(list((HOME / ".claude/projects").glob("*/memory/*.md"))),
    "codex_memories": len(names("~/.codex/memories")),
    "claude_stats": {k: cj.get(k) for k in ("promptQueueUseCount", "btwUseCount", "numStartups", "lastPlanModeUse") if k in cj},
}

# ---------------------------------------------------------------- rules files
def rules_info(p):
    p = Path(p).expanduser()
    if not p.exists():
        return None
    t = read(p)
    return {"lines": lines(p), "symlink": p.is_symlink(), "imports_other": bool(re.search(r"^@\S+\.md", t, re.M)),
            "links_docs": len(re.findall(r"\(([^)]+\.md)\)|`([\w./-]+\.md)`", t)),
            "mentions_notify": bool(re.search(r"\bnotify\b|notification|terminal-notifier", t, re.I)),
            "mentions_stop_ask": bool(re.search(r"stop and (ask|report)|ask (me|the user) (before|when|instead)|if (you are|you're|you get) stuck|after (two|three|2|3) failed", t, re.I)),
            "mentions_risk_paths": bool(re.search(r"\b(auth|migration|payment|security|critical)\b.*\b(review|read|human)\b", t, re.I)),
            "points_to_personal_context": bool(re.search(r"(~|/Users/|/home/)[\w./-]*(me|wiki|notes|brain|vault|context)\b", t, re.I))}


OUT["rules"] = {"claude_global": rules_info("~/.claude/CLAUDE.md"), "codex_global": rules_info("~/.codex/AGENTS.md")}

# ---------------------------------------------------------------- repos (a shallow look at the ones you work in)
roots = [Path.cwd()] + [HOME / d for d in ("Code", "code", "src", "dev", "Developer", "Projects", "projects", "work", "repos", "git", "Sites")]
repos = []
for r in roots:
    if not r.is_dir():
        continue
    for depth in range(0, 3):
        for g in r.glob("/".join(["*"] * depth + [".git"])) if depth else [r / ".git"]:
            if g.is_dir() and g.parent not in repos:
                repos.append(g.parent)
    if len(repos) > 400:
        break
repos = sorted(set(repos), key=lambda p: -(p / ".git").stat().st_mtime if (p / ".git").exists() else 0)
seen_remotes, unique = set(), []
for repo in repos:   # clones of one repo count once (by origin URL); repos without a remote count each
    m = re.search(r'\[remote "origin"\][^\[]*?url\s*=\s*(\S+)', read(repo / ".git" / "config", 50_000))
    if m and m.group(1) in seen_remotes:
        continue
    if m:
        seen_remotes.add(m.group(1))
    unique.append(repo)
repos = unique[:300]
R = Counter()
rules_hist = []
for repo in repos:
    has = lambda *ns: any((repo / n).exists() for n in ns)
    R["repos"] += 1
    if has("AGENTS.md", "CLAUDE.md", "GEMINI.md", ".cursor/rules", ".github/copilot-instructions.md"): R["with_rules_file"] += 1
    c = repo / "CLAUDE.md"
    if c.is_symlink() or re.search(r"^@AGENTS\.md", read(c), re.M) or (repo / "AGENTS.md").is_symlink(): R["one_rules_file"] += 1
    if has("SPEC.md", "spec.md", "PLAN.md", "plan.md", "plans", "docs/plans", "specs"): R["spec_or_plan"] += 1
    if has("PROGRESS.md", "HANDOFF.md", "todo.md", "TODO.md", "notes.md", "NOTES.md"): R["progress_or_handoff"] += 1
    if has(".claude/skills"):
        R["repo_skills"] += 1
        if "[remote " in read(repo / ".git" / "config", 50_000): R["repo_skills_with_remote"] += 1
    if has(".devcontainer", ".devcontainer.json"): R["devcontainer"] += 1
    R["repo_agent_definitions"] += len(list((repo / ".claude" / "agents").glob("*.md")))
    if has("sgconfig.yml", ".semgrep.yml", ".semgrep", "eslint-rules", "eslint-local-rules.js", "lint-rules", "scripts/check"): R["custom_checks"] += 1
    if any(repo.glob("QA*.md")) or any(repo.glob("RELEASE*.md")) or has("docs/release.md", "RELEASING.md"): R["release_qa"] += 1
    if re.search(r"\b(claude|codex|roborev|opencode|gemini)\b", read(repo / ".git" / "hooks" / "post-commit", 100_000)): R["post_commit_agent_hook"] += 1
    wt = repo / ".git" / "worktrees"
    n_wt = len(names(wt)) if wt.is_dir() else 0
    R["max_worktrees"] = max(R["max_worktrees"], n_wt + 1)
    if n_wt: R["repos_with_worktrees"] += 1
    wf = " ".join(read(p, 200_000) for p in (repo / ".github/workflows").glob("*.y*ml")) if (repo / ".github/workflows").is_dir() else ""
    if re.search(r"claude-code-action|anthropics/claude|openai/codex-action|codex exec|cursor-agent", wf): R["agent_in_ci"] += 1
    deps = read(repo / "package.json", 300_000) + read(repo / "pyproject.toml", 300_000) + read(repo / "requirements.txt", 100_000)
    if re.search(r"claude-agent-sdk|claude-code-sdk|@openai/codex-sdk|openai-agents|@openai/agents", deps): R["agent_sdk"] += 1
    if re.search(r"remotion|hyperframes", deps): R["video_deps"] += 1
    if repo in repos[:25]:
        main = next((repo / n for n in ("AGENTS.md", "CLAUDE.md") if (repo / n).exists() and not (repo / n).is_symlink()), None)
        if main:
            log = run(["git", "-C", str(repo), "log", "--numstat", "--format=tformat:@", "--", main.name])
            adds_dels = [tuple(int(x) for x in l.split()[:2]) for l in log.splitlines() if re.match(r"^\d+\s+\d+\s", l)]
            info = rules_info(main)
            rules_hist.append({"commits": len(adds_dels), "ever_shrank": any(d > a for a, d in adds_dels), "lines": lines(main),
                               "links_docs": info["links_docs"], "mentions_stop_ask": info["mentions_stop_ask"]})
# your own agent: code of yours that sends tools to a model API and handles the calls in a loop (git grep is fast)
LOOP_RX = r"tool_use|tool_calls|tool_result|function_call_output"
for repo in repos[:80]:
    hits = run(["git", "-C", str(repo), "grep", "-l", "-E", LOOP_RX, "--", "*.py", "*.ts", "*.js", "*.go", "*.rs", "*.swift", ":!node_modules", ":!vendor"], timeout=10)
    if hits.strip() and re.search(r'"(anthropic|openai|@anthropic-ai/sdk|@ai-sdk/[\w-]+|ai)"\s*:|^\s*(anthropic|openai)\b', read(repo / "package.json", 300_000) + read(repo / "pyproject.toml", 300_000) + read(repo / "requirements.txt", 100_000), re.M):
        R["own_agent_loop"] += 1
# tiny tools of your own: repos with a handful of commits and no remote (the 100 most recent)
for repo in repos[:100]:
    n = run(["git", "-C", str(repo), "rev-list", "--count", "HEAD"]).strip()
    if n.isdigit() and int(n) <= 15 and not git_remote(repo):
        R["small_repos_without_remote"] += 1
# old projects brought back: a commit this year after a year or more with none
for repo in repos[:100]:
    ts = [int(x) for x in run(["git", "-C", str(repo), "log", "-300", "--format=%ct"]).split() if x.isdigit()]
    if ts and NOW - ts[0] < 365 * 86400 and any(a - b > 365 * 86400 for a, b in zip(ts, ts[1:])):
        R["revived_repos"] += 1
hooks_path = run(["git", "config", "--global", "core.hooksPath"]).strip()
if hooks_path and re.search(r"\b(claude|codex|roborev|opencode|gemini)\b", read(Path(hooks_path).expanduser() / "post-commit", 100_000)):
    R["post_commit_agent_hook"] += 1
bots = set()
for repo in repos[:15]:
    for a in run(["git", "-C", str(repo), "log", "-300", "--format=%an"]).splitlines():
        if re.search(r"bot\b|\[bot\]|agent", a, re.I) and not re.search(r"dependabot|renovate|github-actions|copilot|claude|codex|cursor", a, re.I):
            bots.add(a)
R["own_bot_authors"] = len(bots)
OUT["repos"] = dict(R)
OUT["repo_rules_files"] = rules_hist[:15]


# ---------------------------------------------------------------- prompt history (counts only)
P = []   # (timestamp seconds, session/project key, text)
for line in read("~/.claude/history.jsonl", 200_000_000).splitlines():
    try:
        e = json.loads(line)
    except ValueError:
        continue
    t = e.get("display") or ""
    if e.get("pastedContents"): t += " [Pasted text]"
    P.append(((e.get("timestamp") or 0) / 1000, "c:" + str(e.get("sessionId") or e.get("project") or ""), t))
for line in read("~/.codex/history.jsonl", 200_000_000).splitlines():
    try:
        e = json.loads(line)
    except ValueError:
        continue
    P.append((e.get("ts") or 0, "x:" + str(e.get("session_id") or ""), e.get("text") or ""))
P.sort()

PROMPT_PATTERNS = {
    "image": r"\[Image #|\.png\b|\.jpe?g\b|screenshot", "pasted": r"\[Pasted text|Traceback|at .+:\d+:\d+|Error:",
    "url": r"https?://", "file_ref": r"(^|\s)@[\w./-]+|[\w-]+/[\w./-]+\.\w{1,5}\b",
    "question_about_code": r"^(how|why|where|what|which|explain|walk me)\b", "plan": r"\bplan\b|don'?t (write|code|implement) (any )?(code )?yet",
    "variants": r"\b(\d|two|three|four|five|several|few)\s+(variants?|versions?|options?|alternatives?|directions?|takes?)\b|\bvariants?\b",
    "verify": r"\bverify\b|make sure|double.check|test (it|that|this)|check (that|it works)",
    "proof": r"\bproof\b|show me|screenshot of|record (a|the) (video|gif)|demo it",
    "ask_me": r"interview me|grill me|ask me (some |a few |more )?questions|questions (first|before you (start|begin))",
    "add_rule": r"(add|put|write) (this|that|it|a rule)? ?(to|in|into) (the )?(claude|agents)\.md|\bremember (this|that)\b",
    "like_example": r"\b(like|same as|follow|copy) [\w./-]+\.(tsx?|jsx?|py|go|rs|rb|swift|md)\b|same (way|pattern) as",
    "done_when": r"done when|until (it|all|the)|should (show|return|pass)|so that",
    "dont_stop": r"(don'?t|do not) stop until|keep going until|until (all )?(tests|it) pass",
    "diagram": r"\bdiagram|mermaid|flowchart|\bchart\b|visuali[sz]|draw (me )?(a|the)\b", "explain_quiz": r"explain (the|this) (diff|change|pr)|quiz me",
    "review": r"\breview\b", "models_by_role": r"\b(fable|opus|sonnet|haiku|gpt|sol|codex|gemini)\b.{0,40}\b(plan|implement|review|design|orchestrat|decide|code)",
    "relay_other_agent": r"^(codex|claude|gpt|gemini|cursor)( is)? (says?|said|thinks|replied)|\[Pasted text.{0,40}(codex|claude)",
    "speech_tells": r"\b(um+|uh+|erm|you know what i mean)\b", "please": r"\bplease\b",
    "gives_reason": r"\bbecause\b|\bso that\b|the goal is|the reason (is|being)|\bi want .{3,60} so\b",
    "decide_or_critique": r"\bshould i\b|help me (decide|choose|pick)|what am i missing|push back|poke holes|devil'?s advocate|pros and cons|what would you (do|pick|choose)",
    "codebase_wide": r"\bmigrate\b|\bmigration\b|convert (all|every|the whole)|upgrade (all|every)|across the (whole )?(codebase|repo)|(rename|replace) .{1,40} everywhere",
    "about_the_machine": r"disk space|free up (space|storage)|clear (some )?storage|(mac|computer|laptop) is (slow|hot|full)|brew doctor|my \$?path\b|fans? (are|is) loud",
}
SLASH = ["clear", "new", "compact", "rewind", "btw", "effort", "model", "usage", "stats", "cost", "context", "loop", "schedule",
         "goal", "review", "code-review", "plan", "init", "resume", "agents", "hooks", "mcp", "remote-control", "insights"]
pc = Counter()
long_prompts = prompts_40w = 0
for _, _, t in P:
    for k, rx in PROMPT_PATTERNS.items():
        if re.search(rx, t, re.M | re.I):
            pc[k] += 1
    m = re.match(r"\s*/([\w-]+)", t)
    if m and m.group(1) in SLASH:
        pc["/" + m.group(1)] += 1
    if len(t.split()) > 150:
        long_prompts += 1
    if len(t.split()) > 40:
        prompts_40w += 1

def in_git(path):
    p = Path(path)
    for q in [p, *p.parents]:
        if (q / ".git").exists():
            return True
    return False


projects = {}
for line in read("~/.claude/history.jsonl", 200_000_000).splitlines():
    m = re.search(r'"project":\s*"([^"]+)"', line)
    if m: projects[m.group(1)] = None
outside = sum(1 for p in projects if Path(p).is_dir() and not in_git(p))

# time: sessions active together, nights, span
win = defaultdict(set)
for ts, key, _ in P:
    if ts: win[int(ts // 600)].add(key)
both = sum(1 for s in win.values() if len(s) >= 2)
OUT["history"] = {
    "prompts": len(P), "sessions": len({k for _, k, _ in P}), "long_prompts_150w": long_prompts, "prompts_over_40w": prompts_40w, "project_folders_outside_git": outside,
    "first": time.strftime("%Y-%m-%d", time.localtime(P[0][0])) if P and P[0][0] else None,
    "counts": dict(pc), "ten_min_windows_with_2plus_sessions": both, "max_sessions_in_ten_min": max((len(s) for s in win.values()), default=0),
}

# ---------------------------------------------------------------- session logs (counts of tool use, newest files first)
logs = sorted([p for p in (HOME / ".claude/projects").glob("**/*.jsonl")] + [p for p in (HOME / ".codex/sessions").glob("**/*.jsonl")],
              key=lambda p: -p.stat().st_mtime)
TOOL_CALLS = {   # tool-call shapes in the logs (plain substrings: str.count scans hundreds of MB in seconds)
    "file_edits": ['"name":"Edit","input"', '"name":"Write","input"', '"name":"MultiEdit","input"', '"name":"NotebookEdit","input"', '"name":"apply_patch"'],
    "interrupted": ["[Request interrupted by user", '"type":"turn_aborted"'],
    "subagent_runs": ['"name":"Agent","input"', '"name":"Task","input"', '"name":"spawn_agent"'], "agent_messages": ['"name":"SendMessage","input"'],
    "workflow_runs": ['"name":"Workflow","input"'], "scheduled": ['"name":"ScheduleWakeup","input"', '"name":"CronCreate","input"', '"name":"RemoteTrigger","input"'],
    "ask_user_tool": ['"name":"AskUserQuestion","input"'], "web_fetch": ['"name":"WebFetch","input"', '"name":"WebSearch","input"', '"type":"web_search_call"'],
    "computer_use": ['"name":"mcp__computer-use__', '"name":"mcp__remote-devices__computer', '"name":"mcp__claude-in-chrome__', '"name":"mcp__Claude_Browser__', "peekaboo "],
    "made_3d_files": ['.stl"', '.3mf"', '.scad"', '.step"'],
    "bypass_permission_turns": ['"permissionMode":"bypassPermissions"'],
    "review_subagents": ['"subagent_type":"code-reviewer"', '"description":"Review', '"description":"review'],
}
SHELL = {   # counted only inside commands an agent ran
    "git_commit": ["git commit"], "gh_pr_create": ["gh pr create"], "ci_watch": ["gh pr checks", "gh run watch", "gh run view"],
    "deploy_cli": ["vercel deploy", "vercel --prod", "netlify deploy", "fly deploy", "wrangler deploy", "eas build", "eas submit", "firebase deploy"],
    "cross_agent": ["codex exec", "claude -p ", "claude --print", "gemini -p ", "opencode run", "cursor-agent -p"],
    "browser": ["playwright", "agent-browser", "puppeteer", "chrome-devtools"],
    "video": ["remotion", "hyperframes", "ffmpeg "], "hardware": ["esptool", "arduino-cli", "adb ", "simctl", "idevice", "picotool"],
    "skip_permissions": ["--dangerously-skip-permissions", "--yolo", "--full-auto"],
    "cad_tools": ["openscad", "cadquery", "build123d", "blender "], "insights": ["/insights"],
    "machine_care": ["du -sh", "df -h", "brew doctor", "brew cleanup", "diskutil", "ncdu"],
}
CMD_RX = re.compile(r'"(?:command|cmd)":\s*"((?:[^"\\]|\\.){1,6000})"|\\"command\\":\[((?:[^\]]){1,6000})\]')
CLIS = ["gh", "aws", "gcloud", "az", "vercel", "netlify", "stripe", "supabase", "wrangler", "fly", "heroku", "kubectl", "doctl", "railway", "firebase", "eas"]
STAMP_RX = re.compile(r'"timestamp":\s*"(\d{4}-\d\d-\d\dT\d\d)')
lc, clis, active_hours = Counter(), set(), set()
read_bytes = files = 0
for p in logs:
    if files >= 600 or read_bytes > 900_000_000:
        break
    t = read(p, 20_000_000)
    if "levels/check.md" in t or "levels-probe" in t:
        continue   # the session running this check
    files += 1
    read_bytes += len(t)
    if "/subagents/" in str(p):
        lc["subagent_transcripts"] += 1
    for k, subs in TOOL_CALLS.items():
        lc[k] += sum(t.count(x) for x in subs)
    cmds = "\n".join(m.group(1) or m.group(2) for m in CMD_RX.finditer(t))
    for k, subs in SHELL.items():
        lc[k] += sum(cmds.count(x) for x in subs)
    clis |= {c for c in CLIS if re.search(rf"(^|[;&|]\s*|\\n){re.escape(c)} ", cmds, re.M)}
    lc["rewind"] += t.count('"/rewind"') + t.count("<command-name>/rewind")
    for m in STAMP_RX.finditer(t):
        active_hours.add(m.group(1))
OUT["logs"] = {"files_read": files, "mb_read": read_bytes // 1_000_000, **dict(lc), "third_party_clis": sorted(clis)}

# nights: local hours 01-05 with agent activity in the logs but no prompt typed in that hour
typed_hours = {time.strftime("%Y-%m-%d %H", time.localtime(ts)) for ts, _, _ in P if ts}
night = set()
for h in active_hours:
    try:
        lt = time.localtime(time.mktime(time.strptime(h, "%Y-%m-%dT%H")) - time.timezone + (3600 if time.daylight and time.localtime().tm_isdst else 0))
    except (ValueError, OverflowError):
        continue
    key = time.strftime("%Y-%m-%d %H", lt)
    if 1 <= lt.tm_hour <= 5 and key not in typed_hours:
        night.add(key)
OUT["logs"]["night_hours_agent_busy_no_prompt"] = len(night)

# ---------------------------------------------------------------- shell history, apps, schedulers
sh = read("~/.zsh_history", 50_000_000) + read("~/.bash_history", 20_000_000) + read("~/.local/share/fish/fish_history", 20_000_000)
OUT["shell"] = {k: len(re.findall(rx, sh)) for k, rx in {
    "claude_print": r"claude (-p|--print)\b", "codex_exec": r"codex exec", "skip_permissions": r"--dangerously-skip-permissions|--yolo",
    "agent_loops": r"while .*(claude|codex|opencode|amp)", "ccusage": r"ccusage", "mosh": r"\bmosh\b", "tailscale": r"\btailscale\b",
    "ssh": r"^(: \d+:\d+;)?ssh ", "docker_agent": r"docker .*(claude|codex|agent)",
}.items()}
apps = set()
for d in ("/Applications", "~/Applications"):
    apps |= {n[:-4] for n in names(d) if n.endswith(".app")}
WANT = r"lm studio|ollama|jan|openclaw|wispr|superwhisper|macwhisper|voiceink|openwhispr|aqua|spokenly|handy|willow|codexbar|cmux|conductor|ghostty|warp|iterm|termius|blink|stream deck|elgato|claude|chatgpt|codex|cursor|docker|orbstack|tailscale|raycast|cleanshot"
OUT["apps"] = sorted(a for a in apps if re.search(WANT, a, re.I))
OUT["bins"] = sorted(b for b in ("tmux", "zellij", "mosh", "terminal-notifier", "ccusage", "docker", "gh", "ast-grep", "sg", "ffmpeg", "agent-browser",
                                    "ollama", "lms", "llama-server", "mlx_lm.generate", "pi", "openclaw", "hermes", "openscad", "op", "doppler", "infisical", "roborev", "sentry-cli") if shutil.which(b))
la = [n for n in names("~/Library/LaunchAgents") if re.search(r"\b(claude|codex|opencode|gemini|cursor-agent)\b", read(Path("~/Library/LaunchAgents").expanduser() / n, 100_000), re.I)]
cron = [l for l in run(["crontab", "-l"]).splitlines() if re.search(r"\b(claude|codex|opencode|gemini)\b", l)]
OUT["schedulers"] = {"launch_agents_running_an_agent": len(la), "cron_lines_running_an_agent": len(cron),
                     "remote_control_enrolled": bool(cj.get("remoteControlEnrolled") or cj.get("remoteControl"))}

json.dump(OUT, sys.stdout, indent=1, default=str)
print()
