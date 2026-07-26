# Supabase — global setup & architecture (dual-authority auth)

This folder is the **home for all Supabase global setup** for the Power Plant app. Supabase is the
**secondary auth authority** in the dual-authority design (the Spring hub is primary). See the runtime
design in [`project/features/users/dual-auth.md`](../../features/users/dual-auth.md); this folder is
the *operational* side: how to stand it up, how the schema is managed, and how users flow into it.

## Layout — where things live

| What | Where | Why |
|------|-------|-----|
| **CLI project** (config.toml, migrations/, functions/) | repo root **`/supabase`** | The Supabase CLI expects a `supabase/` project directory (same convention as the dk-health project). This is the source of truth for schema + edge functions. |
| **Global setup docs** (this folder) | `project/architecture/supabase/` | Setup guide, schema-management model, sync architecture. |
| **Management wrapper** | `project/architecture/supabase/manage.sh` | Thin convenience layer over the CLI, targets `/supabase` via `--workdir`. |
| **Hub secrets** | `src/main/resources/application-secrets.properties` (gitignored) | `supabase.url`, `supabase.service.role.key`, `supabase.anon.key`, `supabase.jwt.*`. |
| **PWA config** | `browser/ng-ui/src/environments/*.ts` | `supabase.url`, `supabase.anonKey` (public). |
| **JWT keys** | `data/jwt-private.pem` / `data/jwt-public.pem` (gitignored) | Hub RS256 signing key + the public key distributed to PWA / edge function / desktops. |

Read next:
- **[setup-guide.md](setup-guide.md)** — step-by-step from zero to a working dual-auth setup.
- **[schema-management.md](schema-management.md)** — how the schema is managed (migrations-as-code, like dk-health) + `manage.sh`.

---

## How users sync between Supabase and the hub

Two things sync, by two different mechanisms, because the two stores can't share password hashes.

### 1. Passwords — reconciled from the plaintext at login (never the hash)

Neither store can export a hash the other can verify, so passwords converge using the **plaintext from
a successful login** (the one moment a valid plaintext + a live connection both exist). Every user row
in both stores carries a `passwordUpdatedAt` timestamp (UTC); conflicts resolve **last-writer-wins**.

- **On every password change** (hub side — user self-service, admin edit, reset): the hub writes its
  BCrypt hash, sets `passwordUpdatedAt=now`, and **fire-and-forget** pushes the plaintext to Supabase
  (`SupabaseAdminClient.updateUserPassword`). If Supabase is down, it's caught up later (below).
- **On a hub-accepted login** (`SyncAtLoginService.reconcileAfterHubLogin`): async, after the response
  is returned — if the hub's `passwordUpdatedAt` ≥ Supabase's, push the just-verified plaintext to
  Supabase; if Supabase's is strictly newer, leave it (a Supabase-accepted login converges the hub).
- **On a Supabase-accepted login** (hub was down / rejected a stale password → the PWA fell back to
  Supabase, then calls `POST /api/pwa/auth/reconcile`): the hub **re-verifies the password against
  Supabase** (a password grant) and, if Supabase's timestamp is newer, overwrites the hub hash. This
  is what converges *"password changed on Supabase while the hub was down."*

### 2. Profile metadata — a 60s background job (`SupabaseReconciliationService`)

- **Hub → Supabase**: pushes name, email, roles, `isActive`, `permissionLevel` for hub users changed
  since the last checkpoint. The hub is the **source of truth** for roles / isActive / permissionLevel.
- **Supabase → hub**: pulls **only the name** back (email is hub-authoritative; role/isActive/
  permissionLevel are never pulled). Writes are no-ops when values already match, so the push/pull
  can't ping-pong.
- Checkpoints are per-direction and per-node; a transient outage retries the whole (idempotent) batch.

### Deactivation / role changes

**Hub-only.** Flip `isActive`/roles on the hub; the 60s job mirrors them into Supabase metadata. The
hub's `PwaJwtAuthFilter` enforces `isActive` on every request **regardless of which store signed the
token**, so a deactivated user is locked out immediately even if Supabase's mirror lags by a cycle.

---

## How Supabase gets users initially

There is no manual user creation in Supabase — the hub populates it, and it is **self-healing by
default**: any active hub user missing from Supabase is picked up automatically, exactly like a user
created while one store was down. Six mechanisms, in order of who normally does the work:

1. **Auto-heal (default)** — `SupabaseReconciliationService.provisionMissingUsers()` runs every 60s
   (`supabase.auto-provision-missing=true`, batched by `supabase.auto-provision-batch`, hub/dev only).
   It creates Supabase rows for active hub users without a `supabaseUuid` — using a **random throwaway
   password** + metadata, storing the uuid back, and backdating the Supabase password timestamp to the
   epoch so the user's first real hub login pushes their true password (LWW). This covers both existing
   users at first rollout and anyone created while Supabase was down. **No manual step needed.**
2. **New registration (hub up)** — `PwaUserService.registerPwaUser` writes the hub row, then mirrors
   to Supabase with the real password.
3. **New registration (hub down)** — the PWA registers directly against Supabase; a DB trigger
   (`handle_new_auth_user`) auto-creates the `user_link` row. The hub row is auto-provisioned on the
   user's first hub-reachable request (inactive, pending admin approval).
4. **First hub login of an unmirrored user** — `reconcileAfterHubLogin` creates the Supabase record
   with the just-verified plaintext (a backstop for anyone auto-heal hasn't reached yet).
5. **Admin create** (`NgUserController.createUser`) — mirrors the new user to Supabase.
6. **One-shot bulk job (optional, fast)** — `SupabaseUserProvisioningJob` (dev profile, gated by
   `supabase.provision-existing-on-startup=true`) does the whole active-user set in one pass with no
   per-cycle cap. Only useful if you'd rather not wait for auto-heal to drain a large initial set.

So the normal rollout is just: **`db push` the schema → done.** Auto-heal seeds existing users over the
next few cycles; everything created afterwards flows in automatically. (Use #6 only if you want the
initial migration to complete instantly.)

> Why hub/dev only? The 60s job that writes to Supabase is scoped to the hub (and dev) — if every prod
> desktop ran it they'd race and hammer Supabase. Desktops sync users to the hub via CRDT; the hub is
> the single writer to Supabase.
