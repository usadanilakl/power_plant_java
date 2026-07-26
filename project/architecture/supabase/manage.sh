#!/usr/bin/env bash
# ---------------------------------------------------------------------------
# Supabase management wrapper for the Power Plant "secondary auth authority".
#
# Thin convenience layer over the Supabase CLI (the CLI IS the schema-management
# tool — migrations as code, pushed with `supabase db push`, exactly like the
# dk-health project). This script just targets the repo's CLI project at
# /supabase via --workdir so you can run it from anywhere.
#
# Usage:
#   project/architecture/supabase/manage.sh <command> [args]
#
# Commands:
#   login                 supabase login (opens a browser)
#   link <project-ref>    link this repo to the remote project
#   status                show local stack status + local keys (after `start`)
#   new <name>            create a new timestamped migration file
#   push                  apply pending migrations to the linked remote DB
#   diff [name]           diff remote schema vs migrations (into a new migration if <name>)
#   deploy                deploy the verify-jwt edge function (--no-verify-jwt)
#   secret-hub-key        publish data/jwt-public.pem as the HUB_JWT_PUBLIC_KEY function secret
#   secret-sb-jwt         publish supabase.jwt.secret (from application-secrets.properties) as SB_JWT_SECRET
#   start | stop          run/stop the local Supabase stack (Docker)
#   reset                 reset the LOCAL db and re-run migrations (DESTRUCTIVE, local only)
#   raw ...               pass args straight through to `supabase`
#
# Requires: supabase CLI (https://supabase.com/docs/guides/cli). Verify with
#   supabase --version
# ---------------------------------------------------------------------------
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT="$(cd "$SCRIPT_DIR/../../.." && pwd)"
SUPA_DIR="$ROOT/supabase"
PUB_KEY="$ROOT/data/jwt-public.pem"
SECRETS_FILE="$ROOT/src/main/resources/application-secrets.properties"

# Prefer an installed CLI; otherwise fall back to `npx supabase` (auto-downloads on first use).
if command -v supabase >/dev/null 2>&1; then
  SUPA=(supabase)
elif command -v npx >/dev/null 2>&1; then
  echo "note: supabase CLI not on PATH — using 'npx --yes supabase' (downloads on first use)" >&2
  SUPA=(npx --yes supabase)
else
  echo "ERROR: neither the Supabase CLI nor npx is available." >&2
  echo "  Install the CLI (scoop install supabase / brew install supabase/tap/supabase /" >&2
  echo "  download from https://github.com/supabase/cli/releases), or install Node for npx." >&2
  exit 1
fi

# NB: the CLI's --workdir is the directory that CONTAINS the supabase/ folder (the repo ROOT),
# NOT the supabase/ folder itself — otherwise it looks for supabase/supabase/migrations and finds none.
sb() { "${SUPA[@]}" --workdir "$ROOT" "$@"; }

cmd="${1:-}"; shift || true
case "$cmd" in
  login)   "${SUPA[@]}" login ;;
  link)    [ $# -ge 1 ] || { echo "usage: manage.sh link <project-ref>"; exit 2; }
           sb link --project-ref "$1" ;;
  status)  sb status ;;
  new)     [ $# -ge 1 ] || { echo "usage: manage.sh new <migration_name>"; exit 2; }
           sb migration new "$1" ;;
  push)    sb db push ;;
  diff)    if [ $# -ge 1 ]; then sb db diff -f "$1"; else sb db diff; fi ;;
  deploy)  sb functions deploy verify-jwt --no-verify-jwt ;;
  secret-hub-key)
           [ -f "$PUB_KEY" ] || { echo "ERROR: $PUB_KEY not found — generate the hub keypair first."; exit 2; }
           # Flatten the PEM to a SINGLE-LINE base64 body (strip -----BEGIN/END----- + all newlines).
           # Multi-line secret values get mangled/truncated by the CLI; the edge fn's importRsaPublicKey
           # strips headers+whitespace, so a header-less one-line base64 imports cleanly.
           sb secrets set HUB_JWT_PUBLIC_KEY="$(grep -v -- '-----' "$PUB_KEY" | tr -d '\r\n')" ;;
  secret-sb-jwt)
           # The edge fn verifies Supabase HS256 tokens with the project JWT secret. Supabase does NOT
           # auto-inject it and blocks SUPABASE_*-named secrets, so we publish it as SB_JWT_SECRET.
           [ -f "$SECRETS_FILE" ] || { echo "ERROR: $SECRETS_FILE not found."; exit 2; }
           SB_SECRET="$(grep -E '^supabase\.jwt\.secret=' "$SECRETS_FILE" | head -n1 | cut -d= -f2-)"
           [ -n "$SB_SECRET" ] || { echo "ERROR: supabase.jwt.secret not found in $SECRETS_FILE"; exit 2; }
           sb secrets set SB_JWT_SECRET="$SB_SECRET" ;;
  start)   sb start ;;
  stop)    sb stop ;;
  reset)   sb db reset ;;
  raw)     sb "$@" ;;
  ""|help|-h|--help)
           sed -n '2,40p' "${BASH_SOURCE[0]}" | sed 's/^# \{0,1\}//' ;;
  *)       echo "unknown command: $cmd (try: help)"; exit 2 ;;
esac
