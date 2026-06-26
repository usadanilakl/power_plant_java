#!/usr/bin/env bash
#
# codex-review.sh — run OpenAI Codex as a code reviewer over the current branch.
#
# Uses the codex.exe bundled inside the VS Code "openai.chatgpt" extension
# (no separate CLI install needed; reuses the extension's ~/.codex auth).
# The newest installed extension version is resolved dynamically so this keeps
# working after the extension auto-updates.
#
# Usage:
#   ./codex-review.sh                 # review branch vs master (committed changes)
#   ./codex-review.sh --uncommitted   # review working-tree changes (staged+unstaged+untracked)
#   ./codex-review.sh --base <branch> # review vs a different base branch
#
# Exit: prints Codex's findings to stdout. Claude reads these, judges each one,
# fixes the valid ones, and re-runs until the review is clean.

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

# --- default review target -----------------------------------------------
# Default: review the branch against master. Pass-through any args the caller
# gives (e.g. --uncommitted, or --base <branch>).
ARGS=("--base" "master")
if [[ $# -gt 0 ]]; then
  ARGS=("$@")
fi

# --- tuned reviewer prompt ------------------------------------------------
# Focus Codex on real defects and silence false positives caused by this
# repo's intentional conventions.
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
Skip pure style/formatting nits. If there are no real issues, say exactly:
REVIEW CLEAN — no blocking issues.
EOF

echo "Using codex: $CODEX" >&2
echo "Review args: ${ARGS[*]}" >&2
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
