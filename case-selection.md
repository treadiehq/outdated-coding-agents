# Skipped candidates

Built 2026-11-04. Lists were walked in the given order, and each name took its most recent qualifying change.

## Conventions applied to every name

These decisions were made while walking the lists. Each one can be reversed, and the affected cases are named below.

1. **14-day cutoff.** A release counts only if published before 2026-10-21 00:00 UTC. `installSpec` is the newest stable version before that, which is often not npm's or PyPI's `latest`.
2. **HTTP APIs have no releases**, so the same cutoff was applied to the date the change was announced or took effect.
3. **Experimental APIs excluded.** A rename of something marked `unstable_`, `experimental_`, experimental, or beta does not count as a breaking change, because the vendors exempt those from stability promises. Reversing this would change the `next`, `ai`, `@anthropic-ai/sdk` and `pydantic` picks.
4. **Ties on the same date** were broken by the vendor page's own order: the first entry that regex can see and one file can answer.
5. **Replacement must exist.** Removals with no replacement were skipped.

## npm (quota 10, filled by the 12th name)

| Name | Outcome | Why |
|---|---|---|
| next | Case: async `cookies()` (16.0, 2025-10-21) | See skipped candidates below |
| react | **Skipped entirely** | 19.3 and 19.2 list no deprecation or removal in react. The 19.2 `useId` prefix change is behavior only. `eslint-plugin-react-hooks` preset rename is another package. `ViewTransition` and `Activity` moved from canary-only names, never in a stable release. `useFormState` was deprecated in 19.0 (Dec 2024), before the window. |
| vite | Case: `server.ws` (8.1.0, 2026-06-23) | Newer than the 8.0 migration guide. It was found by diffing `@deprecated` notes between versions. See skipped candidates below. |
| tailwindcss | Case: `inset-s-*` / `inset-e-*` (4.2.0, 2026-02-18) | No later Deprecated section through 4.3.3 |
| zod | Case: `z.cuid2()` (4.4.0, 2026-04-29) | 4.5 and 4.6 notes contain only behavior changes. New `@deprecated` text since 4.4.0 rewords older deprecations such as `.merge()`. |
| @prisma/client | Case: driver adapter (7.0.0, 2025-11-19) | 7.1 through 7.10 release notes list no client API deprecation |
| drizzle-orm | **Skipped entirely** | Stable line 0.44.x and 0.45.x notes contain only fixes and additions. The `@deprecated` items in `pg-core` predate the window. The 1.0 line is beta only. |
| express | **Skipped entirely** | 5.2.0 deprecation warning for `res.redirect(undefined)` is a runtime value regex cannot see. 5.3.0 is fixes and behavior. 5.0 removals (2024) predate the window. |
| eslint | Case: flat config (10.0.0, 2026-02-06) | No user-facing deprecation in 10.1 through 10.13 notes |
| openai | Case: images `safety_identifier` (7.36.0, 2026-10-16) | Most recent `@deprecated` added before the cutoff |
| @anthropic-ai/sdk | Case: Text Completions deprecated (0.132.0, 2026-10-07) | See skipped candidates below |
| ai | Case: `rawInput` to `input` (7.0.103, 2026-09-16) | See skipped candidates below |
| @modelcontextprotocol/sdk | Case: `expectedIssuer` (1.31.0, 2026-09-28) | 1.32.0 redirect handling is behavior only |
| stripe, @supabase/supabase-js, mongoose, vitest, @tanstack/react-query, react-router | **Not reached** | Quota filled at @modelcontextprotocol/sdk |

### Skipped candidates more recent than the chosen case

| Name | Candidate | Date | Why skipped |
|---|---|---|---|
| next | `unstable_catchError` to `catchError`, `unstable_retry` to `retry` | 2026-08-03 | Experimental (16.2 listed it under Experimental Features). The old name is gone in 16.4.2. Convention 3. |
| next | `unstable_instant`, `unstable_prefetch` route exports stabilized | 2026-08-03 | Experimental. Convention 3. |
| next | `unstable_eager` removed, `experimental.appNewScrollHandler` removed | 2026-10-06 | Experimental, and no replacement named. Convention 3. |
| next | Pages Router deprecates React 18 support | 2026-10-06 | Dependency version, regex cannot see it in one file |
| next | `experimental.turbopack` to `turbopack` | 2025-10-21 | Same date, earlier on the page, but experimental. Convention 3. |
| next | `unstable_navigation`, `unstable_prefetch` functions | 2026-10-06 | Canary-only names, never in a stable release |
| vite | `skip` to `skipCalls` on the plugin container `resolveId` options | after 8.1.0 | Plugin-container internal, with no entry in the changelog or migration guide |
| vite | `envFile` warning | 2026-06-23 | Same release as the chosen case, and no replacement named |
| prisma | `$use` middleware removal and others | 2025-11-19 | Same date, later in the guide. Convention 4. |
| eslint | `context.getFilename()` and other context members | 2026-02-06 | Same date, later in the guide. Convention 4. |
| eslint | `eslint:recommended` update, config lookup | 2026-02-06 | Same date, earlier in the guide, but behavior only |
| @anthropic-ai/sdk | 1.0.0 removals | 2026-10-21 | Published inside the 14-day window, so not in the chosen release |
| @anthropic-ai/sdk | `ResponseBrowser*ToolUseBlock` renamed to `Browser*ToolUseBlock` | 2026-10-07 (0.132.0) | Type-only aliases. Code runs identically without them, so no natural task can force the name. |
| @anthropic-ai/sdk | RBAC role `name` to `display_name` | 2026-10-07 | Same release, beta organization resource. Convention 3. |
| ai | `experimental_evaluate` to `experimental_decide` | 2026-10-05 | Experimental, and about three weeks old when renamed. Convention 3. |
| ai | `Experimental_GeneratedImage`, `experimental_repairText`, `experimental_repairToolCall` | July to Sept 2026 | Experimental, and older than the chosen case |

## PyPI (quota 4, filled by the 4th name)

| Name | Outcome | Why |
|---|---|---|
| openai | Case: images `safety_identifier` (3.33.0, 2026-10-16) | 3.37.0 breaking change is after the cutoff (chosen release is 3.35.1) |
| pydantic | Case: after validators as instance methods (2.12.0, 2025-10-07) | `PydanticDeprecatedSince214` covers only `pydantic.experimental.missing_sentinel`. Convention 3. No `PydanticDeprecatedSince213` exists. |
| langchain | Case: explicit `LLMToolEmulator` model (1.3.15, 2026-08-11) | 1.4.7 and 1.4.8 are inside the window. Also skipped: 1.3.0 `init_chat_model` Google provider default, which is older. |
| fastapi | Case: `json_schema_extra` (0.155.0, 2026-10-20) | 0.160.0 and 0.162.0 breaking changes are after the chosen release (0.156.4). 0.156.x has no breaking section. |
| sqlalchemy, anthropic, mcp, google-genai | **Not reached** | Quota filled at fastapi |

## HTTP APIs (quota 6, filled by the 6th name)

| Name | Outcome | Why |
|---|---|---|
| Stripe | Case: `allowed_payment_method_types` (2026-09-30.endive) | `2026-10-28.endive` has no breaking rows. `2026-10-28.preview` is not stable. Other 2026-09-30 breaking rows are later in the HTML page order, or are behavior only. |
| OpenAI | Case: GPT-4 series retirement (2026-10-14) | Newest entry on the deprecations page |
| GitHub REST | Case: `resources.core` (2026-03-10) | Newest API version. The `rate` entry is first in its section. |
| Slack | Case: `agents.sessions.setStatus` (2026-08-20) | Later entries are CLI and SDK releases and new features. `assistant.threads.setTitle` is the same announcement, second in order. |
| Anthropic | Case: adaptive thinking on Haiku 5.5 (2026-10-07) | See skipped candidates below |
| Twilio | Case: Conferences `Status` filter (effective 2026-09-30) | See skipped candidates below |
| Google Gemini, Shopify Admin, Cloudflare, Discord | **Not reached** | Quota filled at Twilio |

### Skipped HTTP candidates more recent than the chosen case

| Name | Candidate | Date | Why skipped |
|---|---|---|---|
| Anthropic | Fast mode deprecated on Claude Opus 4.8 | 2026-10-30 | Inside the 14-day window |
| Anthropic | Usage and Cost API made legacy | 2026-10-29 | Inside the window, and the replacement is beta |
| Anthropic | API version 2026-10-21 | 2026-10-21 | Exactly 14 days old, not older than 14 days. **Closest call in the list:** a one-day shift would make this the Anthropic source. |
| Twilio | Real-time transcription failover | 2026-10-22 | Inside the window, and behavior only |
| Twilio | WhatsApp Embedded Signup v4 | 2026-09-30 | Console onboarding flow, and the page names no retired version or server API |
| Twilio | Content API rate limits | 2026-09-30 | New limit only, nothing deprecated and no replacement |
| Twilio | Functions (Classic) deprecation | 2026-08-13 | Older than the chosen case, and a hosting migration with no customer code change |
| Twilio | Voice Insights `conference_participant` removal | 2026-08-01 | Older than the chosen case |

## How "nothing newer" was checked

For every package case, `@deprecated` notes (npm) or deprecation warnings (PyPI) were diffed between the chosen change's release and `installSpec`. The vendor release notes were read as well. The HTTP cases rely on the vendor's changelog or deprecations page alone. For Twilio, the 35 newest changelog entries were read by title, and only those that looked relevant were opened.

## Regex notes for the harness

- All patterns compile and pass the samples in both Python `re` and JavaScript `RegExp`, with no flags.
- `http-twilio-conferences-status-filter.wrongPattern` starts with `^` and looks for the absence of `Status` in the whole file. Do not run it with a multiline flag.
- Run `python3 -I check_cases.py` and `node check_cases.mjs` from this folder to repeat the checks.
