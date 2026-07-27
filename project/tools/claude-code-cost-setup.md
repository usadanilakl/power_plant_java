# Claude Code — Subagent Cost Setup

_Set up 2026-07-24 to reduce Claude Code usage. This documents a **personal, machine-level**
configuration — the files live in the user home dir (`~/.claude/`), **not** in this repo, so they
are not committed and apply to every project on this machine._

## Why

Usage review showed the expensive pattern was **long (8h+), high-context (>150k), Opus-everywhere
sessions that fan out to subagents**, running at max **Effort (Ultracode – xhigh + workflows)**.
The subagent token split was roughly:

- `workflow-subagent` — 12%
- `code-review` — 1%
- `Explore` — 1%
- (the remaining ~86% is the **main Opus loop** in those sessions, not the subagents)

Two levers: (1) cheaper models for subagents, (2) fewer/shorter high-effort sessions.

## What was configured

### Per-agent model overrides — `~/.claude/agents/`

Four frontmatter-only files override just the `model` of the built-in agents (their built-in
prompts/behavior are retained). User scope = applies to all projects on this machine.

| File | Agent | Model | Rationale |
|------|-------|-------|-----------|
| `Explore.md` | `Explore` | `haiku` | Pure search/read fan-out — Opus wasted |
| `general-purpose.md` | `general-purpose` | `sonnet` | Multi-step work; Sonnet capable, far cheaper |
| `code-review.md` | `code-review` | `sonnet` | First-pass review; escalate to `/code-review ultra` only when needed |
| `Plan.md` | `Plan` | `sonnet` | Planning; bump to `opus` in-file for hard architecture |

Valid `model` values: `haiku`, `sonnet`, `opus`, `fable`, `inherit` (default = inherit main model).

- **To tune:** edit the `model:` line in the relevant file.
- **To revert:** delete the file.
- **Requires a window reload / extension restart** to take effect.

### Not covered by the agent files: `workflow-subagent` (12%)

Workflow agents (spawned inside a Workflow script via `agent()`) do **not** read `~/.claude/agents/`
files — they inherit the main session model. Two ways to address that slice:

1. **Turn down the Effort slider** (away from "Ultracode – xhigh + workflows"). Fewer workflows
   auto-spawn, and it also cuts the dominant main-loop cost. **This is the primary fix.**
2. **Blanket env override** (optional) — force _all_ subagents, including workflow ones, to Sonnet.
   Add to `~/.claude/settings.json`:
   ```json
   "env": { "CLAUDE_CODE_SUBAGENT_MODEL": "sonnet" }
   ```
   ⚠️ **Either/or, not both:** this env var **overrides** the per-agent files above (env var wins in
   the model-resolution order). With it set, `Explore` runs Sonnet too, not Haiku. Pick one
   mechanism: the **files** (finer control, misses workflows) _or_ the **env var** (blunt, covers
   everything). Current setup uses the **files** and leaves the env var unset.

## Other habits that reduce cost (not config — workflow discipline)

- **Switching model:** `/model` sets the main session model once (not per-prompt).
- **Context hygiene:** `/clear` (or a new chat) when switching to an unrelated task; `/compact` to
  compress a long session on the same task. Reusing one long chat for everything is the main driver
  of the ">150k context" cost.
- **Effort:** reserve Ultracode/xhigh for genuinely hard one-off problems; use `high` or `medium`
  for routine edits.

## Model-resolution order (for reference)

First match wins:
1. `CLAUDE_CODE_SUBAGENT_MODEL` env var (if set) — blanket override
2. Per-call `model` option in a workflow `agent()` call
3. Agent definition's `model:` frontmatter (the files above)
4. Main session model
