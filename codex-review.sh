#!/usr/bin/env bash
#
# codex-review.sh — Codex CLI wrapper with three usage modes ordered cheapest
# first. Pick the cheapest mode that answers your question.
#
# Uses the codex.exe bundled inside the VS Code "openai.chatgpt" extension
# (no separate CLI install needed; reuses the extension's ~/.codex auth).
#
# ============================================================================
# MODES (token cost ascending)
# ============================================================================
#
#   ./codex-review.sh --ask "<prompt>"
#       Targeted single question — NO repo scan. Codex reads only what your
#       prompt points it at. Use when you know the file/function/concern.
#       Roughly 10-20x cheaper than --review for the same question.
#       Example:
#         ./codex-review.sh --ask "Open NgFileCloneService.java lines 100-145. \
#            Does saveAndFlush correctly persist the bidirectional counterpartId, \
#            and can any later step roll it back? Reply OK or specific issue."
#
#   ./codex-review.sh --resume "<follow-up prompt>"
#       Resume the MOST RECENT codex session in this repo and send a follow-up.
#       Codex keeps everything it already learned (file reads, grep results,
#       prior findings), so you pay only for the delta. Roughly 5-10x cheaper
#       than running another full review.
#       Use AFTER an initial review for "I fixed X — re-check just that".
#       Example:
#         ./codex-review.sh --resume "Fixed the tx rollback issue at line 214. \
#            Re-check just that hunk; ignore everything you already flagged."
#
#   ./codex-review.sh [args]   (DEFAULT — full review)
#       Initial broad review. Use ONLY for the first scan when you don't yet
#       know what to look for. Full repo exploration cost.
#       Args: defaults to '--base master' (branch vs master).
#       Pass '--uncommitted' to review working-tree changes instead, or
#       '--base <branch>' to compare against a different branch.
#
# ============================================================================
# WORKFLOW
# ============================================================================
#
#   First review:    ./codex-review.sh                            # or --uncommitted
#   Follow-ups:      ./codex-review.sh --resume "fixed X; recheck"
#   Targeted check:  ./codex-review.sh --ask "audit lines 100-145 for Y"
#
# Do NOT loop with the default mode — each call re-explores from scratch.
# Use --resume for round 2+.
#
# ============================================================================

set -euo pipefail

# --- locate the newest bundled codex.exe ---------------------------------
EXT_GLOB="$HOME/.vscode/extensions/openai.chatgpt-"*"-win32-x64/bin/windows-x86_64/codex.exe"
# shellcheck disable=SC2086
CODEX="$(ls -1 $EXT_GLOB 2>/dev/null | sort -V | tail -n 1)"

if [[ -z "${CODEX:-}" || ! -x "$CODEX" ]]; then
  echo "ERROR: bundled codex.exe not found under ~/.vscode/extensions/openai.chatgpt-*" >&2
  echo "       Is the OpenAI/Codex VS Code extension installed?" >&2
  exit 1
fi

# --- mode: --ask (cheapest, no repo scan) --------------------------------
if [[ "${1:-}" == "--ask" ]]; then
  shift
  if [[ $# -eq 0 ]]; then
    echo "Usage: codex-review.sh --ask \"<targeted prompt>\"" >&2
    echo "       Example: codex-review.sh --ask \"Check File.java:100-145 for X\"" >&2
    exit 1
  fi
  PROMPT="$*"
  echo "Using codex: $CODEX" >&2
  echo "Mode: --ask (no repo scan, single targeted prompt)" >&2
  echo "---------------------------------------------------------------" >&2
  exec "$CODEX" exec "$PROMPT"
fi

# --- mode: --resume (pays only for the delta) ----------------------------
if [[ "${1:-}" == "--resume" ]]; then
  shift
  if [[ $# -eq 0 ]]; then
    echo "Usage: codex-review.sh --resume \"<follow-up prompt>\"" >&2
    echo "       (requires an earlier codex session in this repo to resume from)" >&2
    exit 1
  fi
  PROMPT="$*"
  echo "Using codex: $CODEX" >&2
  echo "Mode: --resume --last (resumes most recent session, pays only for the delta)" >&2
  echo "---------------------------------------------------------------" >&2
  exec "$CODEX" exec resume --last "$PROMPT"
fi

# --- mode: default — full initial review ---------------------------------
ARGS=("--base" "master")
if [[ $# -gt 0 ]]; then
  ARGS=("$@")
fi

# Tuned reviewer prompt — focus on real defects, silence false positives caused
# by intentional project conventions.
read -r -d '' REVIEW_PROMPT <<'EOF' || true
Review this change for REAL defects only: correctness bugs, broken logic,
security issues, data-loss/sync-correctness problems, and clear performance
traps. For each finding give file:line, a one-line explanation of why it is
wrong, and a concrete fix.

This is a Spring Boot + Angular power-plant app with field-level CRDT sync.
Do NOT report the following — they are intentional project conventions:
  - The service package spelled "sevice/" (deliberate typo, do not "fix").
  - Soft deletes via a `deleted` boolean + @Where(clause = "deleted = false").
  - Constructor injection via Lombok @RequiredArgsConstructor.
  - Angular endpoints returning ResponseEntity<NgApiResponse<T>>.
  - 1-indexed pagination in controllers.
  - The tracked Angular bundle under src/main/resources/static/angular is
    gitignored now; "tracked files deleted without replacement" is a stale
    workflow concern, not a code defect.
Skip pure style/formatting nits. If there are no real issues, say exactly:
REVIEW CLEAN — no blocking issues.
EOF

echo "Using codex: $CODEX" >&2
echo "Mode: full initial review (expensive — pays for full repo exploration)" >&2
echo "Review args: ${ARGS[*]}" >&2
echo "TIP: for follow-up rounds use './codex-review.sh --resume \"prompt\"'" >&2
echo "     for targeted checks use './codex-review.sh --ask \"prompt\"'" >&2
echo "     both are 5-20x cheaper than re-running this default mode." >&2
echo "---------------------------------------------------------------" >&2

# Codex CLI quirk: `codex exec review --uncommitted` rejects a positional
# [PROMPT] arg ("--uncommitted cannot be used with [PROMPT]"). Drop our tuned
# prompt in that mode so the review actually runs; Codex falls back to its
# built-in review prompt, which is workable for the uncommitted case.
for arg in "${ARGS[@]}"; do
  if [[ "$arg" == "--uncommitted" ]]; then
    exec "$CODEX" exec review "${ARGS[@]}"
  fi
done

exec "$CODEX" exec review "${ARGS[@]}" "$REVIEW_PROMPT"
