#!/usr/bin/env python3
"""Do coding agents use the old way after a package or API changes, and does one sentence fix it?

  run_test.py prepare [--cases a,b]        build one project template per change (no install scripts)
  run_test.py run --tag T --arms none,rulefile [--runs 5] [--agents a,b] [--cases a,b]
  run_test.py grade --tag T                grade a run you made
  run_test.py summary [--file f.jsonl]     print the totals (default: the published results)
  run_test.py verify                       re-grade the published code and compare with the published grades

A finished run is skipped on restart.
"""
import argparse, collections, hashlib, json, os, random, re, shutil, subprocess, sys, tempfile, threading, time, uuid
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path

ROOT = Path(__file__).resolve().parent
CASES = ROOT / "cases.json"
RESULTS = ROOT / "results"
RUNS = ROOT / "runs"
# Agents read their folder paths, and a hint in a path changes the result. Agents work outside this
# repository, in folders whose names say nothing about the change, the arm or the point of the test.
WORK = Path(os.environ.get("WBD_WORK") or Path(tempfile.gettempdir()) / "agent-runs")
TEMPLATES = WORK / "t"
LIVE = WORK / "w"
HOMES = WORK / "homes"
BEFORE = "2026-10-21"  # nothing published in the last 14 days before the test can enter a template

CLAUDE_MODEL = "sonnet"  # "claude" runs this model; "claude-default" runs whatever Claude Code picks by itself
STRIP = {"CLAUDECODE", "CLAUDE_CODE_ENTRYPOINT", "CLAUDE_CODE_SESSION_ID", "CLAUDE_CODE_CHILD_SESSION",
         "CLAUDE_CODE_HOST_SESSION_ID", "CLAUDE_CODE_SIMPLE", "CLAUDE_CODE_MESSAGING_SOCKET",
         "CLAUDE_CODE_MESSAGING_TOKEN", "CLAUDE_PID"}
LIMITS = {"claude": 4, "claude-default": 3, "codex": 4}
SENTENCE = "Before writing code that uses a package or API, check the installed package and its current documentation for deprecated or changed options, and use the current way."
TIMEOUT = 300
RATE = re.compile(r"rate.?limit|usage limit|too many requests|\b429\b|quota|overloaded|hit your limit", re.I)

stop_agents = set()
lock = threading.Lock()


def load_cases(only=None):
    cases = json.loads(CASES.read_text())
    return [c for c in cases if not only or c["id"] in only]


def template_dir(case):
    return TEMPLATES / hashlib.sha1(case["id"].encode()).hexdigest()[:8]


def prepare(a):
    TEMPLATES.mkdir(parents=True, exist_ok=True)
    for c in load_cases(set(a.cases.split(",")) if a.cases else None):
        t = template_dir(c)
        if (t / ".ready").exists():
            continue
        shutil.rmtree(t, ignore_errors=True)
        t.mkdir(parents=True)
        pins = dict(c.get("dependencyPins") or {})
        if c.get("installSpec") and c["kind"] != "http":
            pins[c["name"]] = c["installSpec"]
        if c["kind"] == "pypi" or (c["kind"] == "http" and c["language"] == "py"):
            (t / "requirements.txt").write_text("".join(f"{k}=={v}\n" for k, v in pins.items()))
            if pins:
                subprocess.run([sys.executable, "-I", "-m", "venv", ".venv"], cwd=t, check=True)
                subprocess.run([".venv/bin/pip", "install", "-q", "--only-binary=:all:", "-r", "requirements.txt"],
                               cwd=t, check=True, timeout=600)
        else:
            (t / "package.json").write_text(json.dumps(
                {"name": "app", "private": True, "type": "module", "dependencies": pins}, indent=2) + "\n")
            (t / "tsconfig.json").write_text(json.dumps(
                {"compilerOptions": {"target": "es2022", "module": "esnext", "moduleResolution": "bundler",
                                     "jsx": "preserve", "strict": True, "skipLibCheck": True}}, indent=2) + "\n")
            if pins:
                subprocess.run(["npm", "install", "--ignore-scripts", "--no-audit", "--no-fund", "--legacy-peer-deps",
                                f"--before={BEFORE}", "--save-exact"], cwd=t, check=True, timeout=600,
                               env={**os.environ, "npm_config_cache": str(WORK / ".npm-cache")}, stdout=subprocess.DEVNULL)
        (t / ".ready").touch()
        print("ready", c["id"], flush=True)


def fixture(case, agent=None, arm=None):
    d = LIVE / uuid.uuid4().hex[:12]
    d.mkdir(parents=True)
    for p in template_dir(case).iterdir():
        if p.name == ".ready":
            continue
        if p.name in ("node_modules", ".venv"):
            (d / p.name).symlink_to(p)
        elif p.is_file():
            shutil.copy(p, d / p.name)
    Path(d / case["outputFile"]).parent.mkdir(parents=True, exist_ok=True)
    subprocess.run(["git", "init", "-q", "."], cwd=d)
    if arm == "rulefile":  # the bare sentence, as someone would paste it; the prompt stays the same as "none"
        (d / ("AGENTS.md" if agent == "codex" else "CLAUDE.md")).write_text(SENTENCE + "\n")
    return d


def prompt(case, arm):
    text = f'{case["task"]} Put the code in {case["outputFile"]}. Only write that file, and do not install anything.'
    if arm == "rule":
        text = f'Project rule: {case["rule"]}\n\n{text}'
    if arm == "lookup":
        text = f'Project rule: {SENTENCE}\n\n{text}'
    return text


def command(agent, text, d):
    env = {k: v for k, v in os.environ.items() if k not in STRIP}
    env["PWD"] = str(d)
    if agent in ("claude", "claude-default"):
        model = ["--model", CLAUDE_MODEL] if agent == "claude" else []
        return (["claude", "-p", text, *model, "--setting-sources", "project", "--strict-mcp-config",
                 "--mcp-config", '{"mcpServers":{}}', "--no-session-persistence", "--output-format", "stream-json", "--verbose",
                 "--permission-mode", "acceptEdits", "--allowedTools", "Read", "Write", "Edit", "Glob", "Grep", "WebSearch", "WebFetch",
                 "--disallowedTools", "Bash", "Task", "Agent"], env)
    if agent == "codex":
        home = HOMES / "codex"
        home.mkdir(parents=True, exist_ok=True)
        try:
            (home / "auth.json").symlink_to(Path.home() / ".codex" / "auth.json")
        except FileExistsError:
            pass
        env["CODEX_HOME"] = str(home)
        return (["codex", "exec", "--ephemeral", "--skip-git-repo-check", "-s", "workspace-write", text], env)
    raise ValueError(agent)


def activity(agent, log):
    """What the agent did before writing: (opened a file or page, used the web). Not tracked for Codex's shell."""
    if agent == "codex":
        return None, bool(re.search(r"^web search:", log, re.M))
    names = re.findall(r'"type":"tool_use","id":"[^"]+","name":"(\w+)"', log)
    return (any(n in ("Read", "Grep", "Glob", "WebFetch", "WebSearch") for n in names),
            any(n in ("WebFetch", "WebSearch") for n in names))


def one(case, agent, arm, n, tag):
    run_id = f'{case["id"]}__{agent}__{arm}__{n}'
    if agent in stop_agents:
        return
    d = fixture(case, agent, arm)
    cmd, env = command(agent, prompt(case, arm), d)
    started = time.time()
    try:
        p = subprocess.run(cmd, cwd=d, env=env, capture_output=True, text=True, timeout=TIMEOUT, stdin=subprocess.DEVNULL)
        log, code = p.stdout + "\n" + p.stderr, p.returncode
    except subprocess.TimeoutExpired as e:
        decode = lambda b: b.decode(errors="replace") if isinstance(b, bytes) else (b or "")
        log, code = f"TIMEOUT {decode(e.stdout)}\n{decode(e.stderr)}", -1
    (d / ".agent-log.txt").write_text(log)
    f = d / case["outputFile"]
    wrote = f.exists() and f.stat().st_size > 0
    cost = None
    if agent.startswith("claude"):
        for line in log.splitlines():
            if '"type":"result"' in line:
                try:
                    cost = json.loads(line).get("total_cost_usd")
                except Exception:
                    pass
    if not wrote and code != 0 and RATE.search(log):
        with lock:
            stop_agents.add(agent)
        print(f"RATE LIMIT, stopping {agent}: {log[-300:]}", flush=True)
        return
    final = RUNS / tag / run_id
    final.parent.mkdir(parents=True, exist_ok=True)
    shutil.rmtree(final, ignore_errors=True)
    shutil.move(str(d), final)
    looked, web = activity(agent, log)
    rec = dict(run=run_id, case=case["id"], agent=agent, arm=arm, n=n, wrote=wrote, exit=code,
               seconds=round(time.time() - started, 1), cost=cost, looked=looked, web=web)
    with lock, open(RUNS / f"{tag}.jsonl", "a") as fh:
        fh.write(json.dumps(rec) + "\n")
    print(json.dumps({k: rec[k] for k in ("run", "wrote", "exit", "seconds", "cost")}), flush=True)


def run(a):
    RUNS.mkdir(exist_ok=True)
    out = RUNS / f"{a.tag}.jsonl"
    done = set()
    if out.exists():
        done = {json.loads(l)["run"] for l in out.read_text().splitlines() if l.strip()}
    cases = load_cases(set(a.cases.split(",")) if a.cases else None)
    jobs = {g: [] for g in a.agents.split(",")}
    for c in cases:
        for g in jobs:
            for arm in a.arms.split(","):
                for n in range(a.runs):
                    if f'{c["id"]}__{g}__{arm}__{n}' not in done:
                        jobs[g].append((c, g, arm, n))
    random.seed(7)
    def worker(g):
        random.shuffle(jobs[g])
        with ThreadPoolExecutor(LIMITS[g]) as ex:
            list(ex.map(lambda j: one(*j, a.tag), jobs[g]))
    with ThreadPoolExecutor(len(jobs)) as ex:
        list(ex.map(worker, list(jobs)))
    print("finished; stopped agents:", sorted(stop_agents), flush=True)


def strip_comments(src, lang):
    if lang == "py":
        src = re.sub(r"(?m)#.*$", "", src)
        return re.sub(r'""".*?"""|\'\'\'.*?\'\'\'', "", src, flags=re.S)
    src = re.sub(r"/\*.*?\*/", "", src, flags=re.S)
    return re.sub(r"(?m)(^|\s)//.*$", "", src)


def classify(case, d):
    f = d / case["outputFile"]
    if not f.exists() or f.stat().st_size == 0:
        return "no_output"
    src = strip_comments(f.read_text(errors="replace"), case["language"])
    w, r = re.search(case["wrongPattern"], src), re.search(case["rightPattern"], src)
    return "both" if w and r else "wrong" if w else "right" if r else "unclear"


def grade(a):
    cases = {c["id"]: c for c in load_cases()}
    recs = [json.loads(l) for l in (RUNS / f"{a.tag}.jsonl").read_text().splitlines() if l.strip()]
    for r in recs:
        r["grade"] = classify(cases[r["case"]], RUNS / a.tag / r["run"])
    out = RUNS / f"{a.tag}-graded.jsonl"
    out.write_text("".join(json.dumps(r) + "\n" for r in recs))
    print("wrote", out)
    print_summary(recs)


def print_summary(recs):
    rows = collections.defaultdict(list)
    for r in recs:
        rows[(r["agent"], r["arm"])].append(r)
    print(f'{"agent":15} {"arm":9} {"runs":>4} {"wrong":>5} {"right":>5} {"both":>4} {"unclear":>7} {"cost":>7} {"secs":>5}')
    for (agent, arm), rs in sorted(rows.items()):
        g = collections.Counter(r["grade"] for r in rs)
        costs = [r["cost"] for r in rs if r.get("cost") is not None]
        cost = f"{sum(costs) / len(costs):.3f}" if costs else "-"
        print(f'{agent:15} {arm:9} {len(rs):4} {g["wrong"]:5} {g["right"]:5} {g["both"]:4} {g["unclear"]:7} {cost:>7} {sum(r["seconds"] for r in rs) / len(rs):5.1f}')


def summary(a):
    path = Path(a.file) if a.file else RESULTS / "runs.jsonl"
    print_summary([json.loads(l) for l in path.read_text().splitlines() if l.strip()])


def verify(_):
    cases = {c["id"]: c for c in load_cases()}
    recs = [json.loads(l) for l in (RESULTS / "runs.jsonl").read_text().splitlines() if l.strip()]
    bad = [r["run"] for r in recs if classify(cases[r["case"]], RESULTS / "code" / r["run"]) != r["grade"]]
    print(f"{len(recs) - len(bad)} of {len(recs)} grades match the published code")
    sys.exit(1 if bad else 0)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    sp = ap.add_subparsers(dest="cmd", required=True)
    p = sp.add_parser("prepare")
    p.add_argument("--cases")
    p.set_defaults(fn=prepare)
    r = sp.add_parser("run")
    r.add_argument("--runs", type=int, default=5)
    r.add_argument("--agents", default="claude,claude-default,codex")
    r.add_argument("--arms", default="none,lookup,rulefile")
    r.add_argument("--cases")
    r.add_argument("--tag", required=True)
    r.set_defaults(fn=run)
    g = sp.add_parser("grade")
    g.add_argument("--tag", required=True)
    g.set_defaults(fn=grade)
    s = sp.add_parser("summary")
    s.add_argument("--file")
    s.set_defaults(fn=summary)
    sp.add_parser("verify").set_defaults(fn=verify)
    args = ap.parse_args()
    args.fn(args)
