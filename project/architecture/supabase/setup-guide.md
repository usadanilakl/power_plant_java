# Supabase setup — step by step

Zero → working dual-authority auth. Do the steps in order; each is quick. Commands use the wrapper
[`manage.sh`](manage.sh) where handy, or the raw `supabase` CLI. Run from the repo root unless noted.
Background/design: [README.md](README.md) and [dual-auth.md](../../features/users/dual-auth.md).

> Windows note: the repo's CLAUDE.md documents `MSYS_NO_PATHCONV=1` for MSYS path-mangling. It only
> matters for `ng build --base-href=…` — the `supabase` commands below don't need it.

---

## 0. Install the Supabase CLI

The CLI is the schema-management tool (see [schema-management.md](schema-management.md)). Pick one:

```bash
# Windows (scoop)
scoop bucket add supabase https://github.com/supabase/scoop-bucket.git
scoop install supabase
# or npm (any OS)
npm install -g supabase
# verify
supabase --version
```

Docker Desktop is only needed if you want to run the LOCAL stack (`supabase start`) — not required for
pushing to a hosted project.

## 1. Create the hosted project

1. https://supabase.com → **New project** (any region; the free tier is enough for an auth mirror).
2. Set a strong database password (store it in your password manager).
3. Wait for provisioning (~2 min). Note the **Reference ID** (Project Settings → General).

## 2. Grab the keys (Project Settings → API)

| Key | Used by | Secret? |
|-----|---------|---------|
| **Project URL** `https://<ref>.supabase.co` | hub + PWA | public |
| **anon / public key** | PWA + hub (password-grant verify) | public |
| **service_role key** | hub only | **SECRET** — never in the browser |
| **JWT secret** (Settings → API → JWT Settings) | edge function (auto-injected) | secret |

## 3. Configure the hub

Edit `src/main/resources/application-secrets.properties` (gitignored). Use
`application-secrets.example.properties` as the template — the relevant block:

```properties
supabase.url=https://<ref>.supabase.co
supabase.service.role.key=<service_role key>
supabase.anon.key=<anon key>

# How the hub VERIFIES Supabase-issued JWTs — provide ONE:
#  default HS256 project (most common):
supabase.jwt.secret=<JWT secret from Settings → API → JWT Settings>
#  OR, if you switched the project to asymmetric signing keys:
#supabase.jwt.public-key-path=${user.dir}${file.separator}data${file.separator}supabase-jwt-public.pem
```

## 4. Configure the PWA

Edit **both** `browser/ng-ui/src/environments/environment.ts` and `environment.prod.ts`:

```ts
supabase: {
  url: 'https://<ref>.supabase.co',
  anonKey: '<anon key>',
},
```

Leave them blank to run **hub-only** (no Supabase fallback) — handy until you're ready to cut over.

## 5. Generate the hub RS256 keypair

The hub signs JWTs with RS256. In dev it auto-generates a keypair on first boot, but for anything real
generate and back up your own (it refuses to auto-generate under a `prod`/`hub`/`server` profile):

```bash
mkdir -p data
openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 -out data/jwt-private.pem
openssl rsa -pubout -in data/jwt-private.pem -out data/jwt-public.pem
```

`data/` is gitignored. Back up `jwt-private.pem` securely — losing it logs everyone out.

## 6. Link the repo and push the schema

```bash
project/architecture/supabase/manage.sh login
project/architecture/supabase/manage.sh link <ref>
project/architecture/supabase/manage.sh push        # applies supabase/migrations/*.sql
```

This creates `public.user_link`, the auto-seed + timestamp triggers on `auth.users`, RLS, and the
`get_auth_sync_status` RPC. Verify in the dashboard: Table editor → `user_link` exists; Database →
Functions shows `get_auth_sync_status`, `handle_new_auth_user`, `handle_auth_user_updated`.

## 7. Deploy the JWT verifier (for Power Automate)

```bash
project/architecture/supabase/manage.sh deploy            # supabase functions deploy verify-jwt --no-verify-jwt
project/architecture/supabase/manage.sh secret-hub-key    # publishes data/jwt-public.pem as HUB_JWT_PUBLIC_KEY
```

The function URL PA calls: `https://<ref>.supabase.co/functions/v1/verify-jwt` (contract in
`supabase/functions/verify-jwt/README.md`).

## 8. Distribute the public key

The RS256 **public** key only needs to reach verifiers of *hub-signed* tokens:
- **Edge function**: done in step 7 (`HUB_JWT_PUBLIC_KEY`) — the only consumer, and only if you use PA
  JWT verification (step 7 is optional).
- **PWA**: nothing — the hub verifies its own tokens server-side.
- **Desktops**: nothing — the PWA talks only to the hub, so desktops never verify hub-issued PWA
  tokens. Non-hub nodes auto-generate a harmless local signing key at first boot (no key provisioning).
  Only the **hub** holds the real, backed-up keypair from step 5. (Desktop↔hub traffic is gated by LAN
  trust, not JWTs — unchanged.)

## 9. Seed existing users — automatic

**Nothing to do by default.** Once the hub is configured and the schema is pushed, the 60s
reconciliation job **auto-provisions** existing active users into Supabase (batched — watch for
`[Supabase reconcile] auto-provisioned N missing user(s)`; it drains over a few cycles). Each gets a
throwaway password; their real password lands on their next hub login. Tunables:
`supabase.auto-provision-missing` (default `true`), `supabase.auto-provision-batch` (default `50`).

**Optional fast path** — to migrate everyone in one pass instead of waiting for cycles:

```properties
# application-secrets.properties, dev profile only; remove after the one boot:
supabase.provision-existing-on-startup=true
```

Boot once with the `dev` profile, watch for `[Supabase provision] Done. provisioned=N`, then remove the
flag and restart. (Details: [README.md → How Supabase gets users initially](README.md).)

## 10. Cutover + smoke test

Existing HS256 tokens are invalid after the RS256 switch — users log in once more. Then walk the
matrix in [dual-auth.md → Failure-mode matrix](../../features/users/dual-auth.md):

- Hub up + Supabase up: fresh registration → user usable on both; login works; API calls succeed.
- Hub up + Supabase down (stop nothing — just set `supabase.enabled=false` temporarily, or block the
  host): login/registration/password-change still work; mirror queued.
- Hub down + Supabase up: stop the hub → PWA login falls back to Supabase; a secured API call
  auto-provisions the hub row; on hub return, `/reconcile` converges.
- Password changed on hub while Supabase down → next login pushes it. And the reverse.
- Deactivate on hub → token rejected within a cycle.
- PA: POST a hub JWT and a Supabase JWT to `verify-jwt` → both `{valid:true}`; tampered → 401.

## Rollback / disable

- **Turn Supabase off** without removing config: `supabase.enabled=false` (hub) and blank the PWA
  `supabase` block. The hub runs standalone; reconciliation is a no-op.
- **Full revert**: the change set is uncommitted — `git restore`/stash the working tree. The Supabase
  project can be paused/deleted from the dashboard with no hub impact.

## Rotating keys / service role

See [dual-auth.md → Rotating keys and the service role](../../features/users/dual-auth.md). Short
version: regenerate → update the hub secret / `data/*.pem` → re-run `manage.sh secret-hub-key` and
re-distribute the public key → restart.
