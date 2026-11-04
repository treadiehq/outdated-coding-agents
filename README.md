# Outdated coding agents

Do coding agents still write the old way after a package or API changes? And can one sentence stop them?

I gave three agents tasks that touch 20 recent changes, 5 runs per change. This repository has the tasks, the prompts, the code every agent wrote, the grades, and the script to run it again.

## The result

Runs that used the old way, out of 100:

| Agent | No sentence | Sentence in a rules file | Sentence in the prompt |
|---|---:|---:|---:|
| Claude Sonnet 5.5 | 51 | 8 | 2 |
| Codex (GPT-6.1 Sol) | 17 | 2 | 0 |
| Claude Opus 5.5 | 7 | 0 | 0 |
| **All three, out of 300** | **75** | **10** | **2** |

## The sentence

> Before writing code that uses a package or API, check the installed package and its current documentation for deprecated or changed options, and use the current way.

Put it in your project's rules file. I tested it alone in `CLAUDE.md` for the Claude agents and `AGENTS.md` for Codex.

It costs more. Average per task, from no sentence to the rules file:

| Agent | Cost | Time |
|---|---:|---:|
| Claude Sonnet 5.5 | $0.037 → $0.069 | 9s → 28s |
| Codex (GPT-6.1 Sol) | not recorded | 26s → 34s |
| Claude Opus 5.5 | $0.21 → $0.27 | 36s → 41s |

In the prompt it cost a little more: $0.079 for Sonnet and $0.32 for Opus.

## Which changes they got wrong

Runs that used the old way, out of 5, with no sentence. No agent got the other 9 changes clearly wrong.

| Change | Sonnet | Codex | Opus | Does the old code still work? |
|---|---:|---:|---:|---|
| [Anthropic: adaptive thinking](https://platform.claude.com/docs/en/models/haiku-5-5/migration-guide#configure-thinking) | 5 | 0 | 0 | No. Returns a 400 on Haiku 5.5 |
| [Prisma 7: driver adapter](https://www.prisma.io/docs/guides/upgrade-prisma-orm/v7) | 5 | 0 | 0 | No. The old options were removed |
| [Twilio: conference status](https://www.twilio.com/en-us/changelog/conference-list-endpoint-july-2026) | 5 | 0 | 0 | Runs, but leaves out finished conferences |
| [Stripe: Checkout payment methods](https://docs.stripe.com/changelog/endive/2026-09-30/remove-payment-method-types-checkout-sessions) | 5 | 0 | 4 | On older API versions only. The newest returns a 400 |
| [Slack: agent status](https://docs.slack.dev/changelog) | 5 | 5 | 3 | Yes, through a compatibility bridge |
| [OpenAI: GPT-4o and GPT-4.1 models](https://developers.openai.com/api/docs/deprecations) | 5 | 2 | 0 | Yes, until January 14, 2027 |
| [Tailwind: logical inset classes](https://github.com/tailwindlabs/tailwindcss/blob/main/CHANGELOG.md) | 5 | 5 | 0 | Yes, deprecated |
| [Vite: `server.ws`](https://vite.dev/config/server-options#server-hmr) | 5 | 5 | 0 | Yes, deprecated |
| [OpenAI Node: image `user`](https://github.com/openai/openai-node/releases/tag/v7.36.0) | 5 | 0 | 0 | Yes, deprecated |
| [OpenAI Python: image `user`](https://github.com/openai/openai-python/releases/tag/v3.33.0) | 5 | 0 | 0 | Yes, deprecated |
| [MCP SDK: `expectedIssuer`](https://github.com/modelcontextprotocol/typescript-sdk/releases/tag/1.31.0) | 1 | 0 | 0 | Yes, deprecated |

Most of this code runs today, and would break only once the old way is removed.

With the sentence in a rules file, only three changes still went wrong: Slack (Sonnet 5, Codex 2), Stripe (Sonnet 2) and OpenAI Python (Sonnet 1).

## Other things I noticed

- **Looking first seems to be the difference.** Without the sentence, Sonnet opened no file or web page before writing in 82 of 100 runs. Opus checked something in all 100 without being asked. With the sentence, Sonnet checked in all 100 too. I didn't test this separately.
- **The rules file may do less because agents skip the web.** HTTP APIs have no installed package to read. On those tasks, Sonnet skipped the web in 6 of 30 runs with the rules file, and in none with the prompt.
- **Looking isn't a guarantee.** All 7 of Sonnet's Slack mistakes with the sentence came after it opened Slack's docs.
- **A rule naming the exact change also worked.** There were 0 wrong in 95 runs, on the changes that had gone wrong, with the rule in the prompt.

## How the test worked

- **Changes:** 10 from npm, 4 from PyPI and 6 from HTTP APIs, dated October 2025 to October 2026. I went through lists of popular names in order and took each name's most recent change that fit the rules. [`case-selection.md`](case-selection.md) has the rules and everything I skipped.
- **Tasks:** each is a small one-file task that touches the change without mentioning it.
- **Projects:** npm and PyPI tasks had the current package installed, and the agent could read it. All three agents could use the web.
- **Agents:** Claude Code 2.1.311 and Codex CLI 0.164.0, on November 3 and 4, 2026. Claude Code ran with project settings only. The rules-file runs came about 10 hours after the others, on the same models.

Each setup has a name in the data:

| Name | What the agent got |
|---|---|
| `none` | The task only |
| `rulefile` | The task, with the sentence alone in `CLAUDE.md` or `AGENTS.md` |
| `lookup` | The task, with the sentence in the prompt as a project rule |
| `rule` | The task, with a rule naming the exact change in the prompt. Run only on changes that went wrong |

So do the agents:

| Name | Model |
|---|---|
| `claude` | Claude Sonnet 5.5 |
| `claude-default` | Claude Opus 5.5, the model Claude Code picked by itself under these settings |
| `codex` | GPT-6.1 Sol, Codex's default |

## How it was graded

A script looks for the old way and the new way in the written code, with comments removed. Each change has its two patterns in [`cases.json`](cases.json). I didn't run the code.

| Grade | Meaning |
|---|---|
| `wrong` | Uses the old way, and not the new way |
| `right` | Uses the new way, and not the old way |
| `both` | Uses both. All 18 are the AI SDK change, reading `input` and falling back to the deprecated `rawInput` |
| `unclear` | Matches neither pattern |

Only `wrong` counts in the totals above, so they're cautious. Of the 61 `unclear` runs:

- **45 are Twilio, and look correct.** They all send `Status` and ask for completed conferences, in a way the pattern doesn't match.
- **4 are FastAPI, and look wrong to me.** Sonnet used `openapi_extra`, with no sentence. So Sonnet's 51 may be slightly low.
- **The rest:** I didn't read them all, so I left them uncounted.

## What this doesn't show

- **Real codebases:** these were small tasks. The rates won't carry over directly to your work.
- **A fair race between vendors:** Codex had a shell and the Claude agents didn't. I also tried OpenCode, but its free limits meant I couldn't count it.
- **Lasting results:** a new model can change this.
- **Independence:** I used Claude to prepare the tasks, run the test, grade it and write this up, and Claude is one of the agents tested.

## The run I threw out

Each run's folder in my first attempt was named after its task, and the agents could see it. Sonnet's wrong count was 23 instead of 51. Those grades are in [`results/first-run-invalid.jsonl`](results/first-run-invalid.jsonl) and aren't part of any total here.

If you test agents yourself, keep hints out of your file paths. This script runs agents in a neutral temporary folder for that reason.

## What's here

| Path | What it is |
|---|---|
| [`cases.json`](cases.json) | The 20 changes: task, rule, source, how each was verified, and the grading patterns |
| [`case-selection.md`](case-selection.md) | How the changes were chosen, and what was skipped |
| [`results/runs.jsonl`](results/runs.jsonl) | One row for each of the 995 runs |
| [`results/code/`](results/code) | The code the agent wrote in each run |
| [`results/prompts.json`](results/prompts.json) | The exact prompt for each change and setup |
| [`run_test.py`](run_test.py) | The script that runs and grades the test |

The raw agent logs aren't here, because they contain paths from my machine. So you can check what each agent wrote, but not each step it took. The `looked` and `web` fields in `runs.jsonl` come from those logs.

## Check it yourself

These need only Python 3, and no agents or API keys:

```bash
python3 run_test.py summary
```

```bash
python3 run_test.py verify
```

`summary` prints the totals, and `verify` re-grades all the published code and compares it with the published grades.

## Run it again

You need Python 3, npm, and Claude Code and Codex signed in. Your results will differ as models change.

```bash
python3 run_test.py prepare
```

```bash
python3 run_test.py run --tag mine --arms none,rulefile
```

```bash
python3 run_test.py grade --tag mine
```

Runs and logs go to `runs/`, which git ignores. All the Claude runs in this repository cost about $102. The 300 rules-file runs cost about $34 of that and took about 25 minutes. Codex's cost wasn't recorded.
