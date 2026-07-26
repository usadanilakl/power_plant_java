# Supabase schema management

**Yes — this is managed exactly like the dk-health project**: schema-as-code with the Supabase CLI.
There is no bespoke ORM or hand-editing of the remote database. The migration files under
`/supabase/migrations/*.sql` are the source of truth, applied with `supabase db push`. The
[`manage.sh`](manage.sh) wrapper is just ergonomics over the same CLI.

## The model (same as dk-health)

- `/supabase/config.toml` — project + auth config (JWT expiry, signup, rate limits).
- `/supabase/migrations/<timestamp>_<name>.sql` — ordered, immutable, forward-only migrations.
- `/supabase/functions/<name>/` — edge functions (Deno/TypeScript).
- `/supabase/seed.sql` — optional seed data (empty here; the hub seeds users, not SQL).
- `supabase link --project-ref <ref>` binds the local project to the remote once.
- `supabase db push` applies any migrations the remote hasn't seen yet (tracked in the remote
  `supabase_migrations.schema_migrations` table). Re-running is a no-op.

dk-health's `supabase/` folder has the same shape (config.toml + a long `migrations/` list + a
`functions/` dir); we mirror that convention deliberately so anyone familiar with one project can
operate the other.

## Adding or changing schema

Migrations are **forward-only** — never edit an already-pushed file; add a new one.

```bash
# 1. Create a new empty migration (timestamped filename)
project/architecture/supabase/manage.sh new add_something

# 2. Edit the generated file under /supabase/migrations/ — write idempotent SQL
#    (use `create table if not exists`, `create or replace function`, guarded `alter`, etc.)

# 3. Apply to the linked remote
project/architecture/supabase/manage.sh push
```

If you changed schema in the dashboard by mistake and want to capture it as a migration:

```bash
project/architecture/supabase/manage.sh diff capture_dashboard_change   # writes a new migration from the drift
```

## Local development (optional, needs Docker)

You do **not** need this to operate the hosted project, but it's the fastest way to test a migration:

```bash
project/architecture/supabase/manage.sh start     # boots the local stack (Postgres, GoTrue, Studio…)
project/architecture/supabase/manage.sh status    # prints local URL + anon/service_role/JWT keys
project/architecture/supabase/manage.sh reset     # DESTRUCTIVE (local only): drops + re-runs all migrations
project/architecture/supabase/manage.sh stop
```

Point a `dev`-profile hub at the local URL/keys (from `status`) to exercise the full flow offline.

## Rules

- **Never hand-edit the remote schema** for anything you want to keep — write a migration so it's
  reproducible and reviewable in git.
- **Migrations are immutable once pushed.** Fix mistakes with a new migration.
- **Keep SQL idempotent** (`if not exists`, `create or replace`) so a re-run or partial apply is safe.
- **RLS + grants are part of the schema** — they live in migrations too (see the initial migration's
  `enable row level security` + the `get_auth_sync_status` grant, restricted to `authenticated`/
  `service_role`, never `anon`).
- **Edge functions deploy separately** from `db push`: `manage.sh deploy` (or
  `supabase functions deploy verify-jwt --no-verify-jwt`).

## Current migrations

| File | What it creates |
|------|-----------------|
| `20260723000000_initial_auth.sql` | `public.user_link` (cross-ref + LWW timestamps), `handle_new_auth_user` (auto-seed link on signup), `handle_auth_user_updated` (bump timestamps on credential/metadata change), RLS on `user_link`, `get_auth_sync_status(text)` RPC (authenticated/service_role only). |
