# Power Plant — Supabase secondary auth authority

> This is the **CLI project** (config/migrations/functions). The step-by-step setup guide, schema
> management, and sync architecture live in **[`project/architecture/supabase/`](../project/architecture/supabase/README.md)**.

This Supabase project is the **secondary, independent auth store** in the dual-authority
design. The Spring hub is the primary; Supabase keeps login / registration /
password-change working when the hub is unreachable. The two stores reach
eventual consistency via the hub's reconciliation logic (sync-at-login +
a 60 s metadata job). Full architecture: [`project/features/users/dual-auth.md`](../project/features/users/dual-auth.md).

Supabase owns the **credential** (email + password hash) as an independent
authority. It is **not** the source of truth for hub-specific fields (roles,
`isActive`, `permissionLevel`, PIN, LOTO roles, signature). Those live in
`raw_user_meta_data` only as a mirror the hub pushes.

## Contents

| Path | Purpose |
|------|---------|
| `config.toml` | Local-stack + auth config (JWT expiry, signup, rate limits). |
| `migrations/20260723000000_initial_auth.sql` | `public.user_link` cross-ref table, auto-seed + timestamp triggers on `auth.users`, RLS, `get_auth_sync_status()` RPC. |
| `functions/verify-jwt/` | Edge Function that verifies a JWT from **either** issuer (hub RS256 or Supabase) for Power Automate flows. |
| `seed.sql` | Empty — no seed data for the auth mirror. |

## One-time setup

You need the [Supabase CLI](https://supabase.com/docs/guides/cli) installed and a
Supabase project created in the dashboard (any region; the free tier is fine).

```bash
# 1. Authenticate the CLI with your Supabase account (opens a browser).
supabase login

# 2. Link this local folder to the remote project.
#    <ref> is the "Reference ID" from Dashboard → Project Settings → General.
cd supabase        # or run from repo root with: supabase link --workdir supabase
supabase link --project-ref <ref>

# 3. Push the migration (creates user_link, triggers, RLS, the RPC).
supabase db push

# 4. Deploy the JWT verifier used by Power Automate flows.
#    --no-verify-jwt because PA calls it server-to-server with no user token.
supabase functions deploy verify-jwt --no-verify-jwt
```

## Where to find the keys (Dashboard → Project Settings → API)

| Key | Goes into | Notes |
|-----|-----------|-------|
| **Project URL** (`https://<ref>.supabase.co`) | hub `application-secrets.properties` → `supabase.url`; PWA `environment*.ts` → `supabase.url` | Public. |
| **anon / public key** | PWA `environment*.ts` → `supabase.anonKey` | Public (safe in the browser bundle). Used by the PWA fallback login/signup. |
| **service_role key** | hub `application-secrets.properties` → `supabase.service.role.key` | **SECRET.** Full admin, bypasses RLS. Hub-only — never ship it to the PWA or Electron. |
| **JWT Secret** (Legacy JWT secret, or the current signing key) | Edge Function secret `SUPABASE_JWT_SECRET` (auto-injected — see below) | Used to verify Supabase-issued tokens. |

### Supabase JWT public key / secret

Supabase signs its own tokens. The verifier needs to validate them:

- **Symmetric (HS256, the default)**: the project's JWT secret is auto-injected into
  Edge Functions as `SUPABASE_JWT_SECRET` — nothing to configure. Find/rotate it
  under Dashboard → Project Settings → API → *JWT Settings*.
- **Asymmetric signing keys (if you migrate the project to RS/ES)**: fetch the
  public JWKS from `https://<ref>.supabase.co/auth/v1/.well-known/jwks.json`.

For local development, `supabase status` prints the local `JWT secret`, anon key,
service_role key, and API URL after `supabase start`.

### Hub public key → Edge Function secret

The verifier also validates **hub-issued** RS256 tokens, so it needs the hub's
JWT *public* key (never the private one):

```bash
# After the hub has generated its keypair (data/jwt-public.pem), publish the
# PUBLIC key to the Edge Function as a secret:
supabase secrets set HUB_JWT_PUBLIC_KEY="$(cat ../data/jwt-public.pem)"
```

See `functions/verify-jwt/README.md` for the exact contract and the URL that
Power Automate flows should POST to.

## Secret management rules

- `config.toml`, `migrations/`, and `functions/` **are** committed.
- `.env`, `.branches/`, `.temp/` are git-ignored (see `.gitignore`).
- The **service_role key** and hub **private** key are secrets — they live only in
  the hub's git-ignored `application-secrets.properties` / `data/` and in Supabase
  Edge Function secrets. Never commit them, never send them to the browser.

## Bulk-provisioning existing users

After `db push`, mirror the hub's existing users into Supabase with the one-shot
hub-side job (dev profile): see [`dual-auth.md` → "Bulk-provision existing users"](../project/features/users/dual-auth.md).
It generates a random temp password per user (real passwords can't be exported);
each user's true password is reconciled into Supabase on their first successful
hub login via the sync-at-login pattern.
