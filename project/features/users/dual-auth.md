# Dual-authority authentication — Hub + Supabase

Users experience **one account**. Behind it, two fully independent authoritative auth stores — the
Spring **hub** and a **Supabase** project — reach *eventual consistency* through a sync layer. Every
operation (login, registration, password change, profile change) works against whichever store is
up; when both are up they converge; when one is down, work continues against the other and syncs
when it returns. The user never sees which store answered.

- **Hub** (primary): the Spring app. Source of truth for hub-specific fields (roles, `isActive`,
  `permissionLevel`, PIN, LOTO roles, signature). Signs JWTs with **RS256**, `iss: power-plant-hub`.
- **Supabase** (secondary): an independent credential store (email + password hash). Mirrors
  hub fields into `raw_user_meta_data` but is **not** authoritative for them. Signs its own JWTs.

Scaffold + setup: [`supabase/README.md`](../../../supabase/README.md).

---

## Architecture

```
                         ┌──────────────────────── PWA (ng-ui) ────────────────────────┐
                         │  AuthService (dual-path): hub first, Supabase fallback       │
                         │  SupabaseAuthService (GoTrue REST via HttpClient)            │
                         └───────┬───────────────────────────────────┬─────────────────┘
             hub JWT (RS256) or  │                                   │  anon key + password
             Supabase JWT (Bearer)                                   │
                                 ▼                                   ▼
      ┌────────────────── HUB (Spring) ──────────────────┐   ┌────────── SUPABASE ──────────┐
      │ PwaJwtAuthFilter  → accepts BOTH issuers          │   │ auth.users (email+hash)      │
      │ JwtService        → RS256 sign / dual-issuer verify│  │ public.user_link             │
      │ SyncAtLoginService → reconcile on login           │◀─▶│   password_updated_at (LWW)  │
      │ SupabaseReconciliationService → 60s metadata job  │   │   metadata_updated_at        │
      │ SupabaseAdminClient (service-role) ───────────────┼──▶│ triggers bump timestamps     │
      │ User row (BCrypt, passwordUpdatedAt, supabaseUuid)│   │ Edge Fn verify-jwt (PA)      │
      └───────────────────────────────────────────────────┘   └──────────────────────────────┘
                                 ▲                                          ▲
                                 └───────── Power Automate ─────────────────┘
                                    POST /functions/v1/verify-jwt {token}
```

Key files:

| Concern | File |
|---------|------|
| RS256 sign + dual-issuer verify | `config/security/JwtService.java`, `JwtKeyLoader.java` |
| Accept both issuers + auto-provision | `config/security/PwaJwtAuthFilter.java` |
| Service-role client + ping + metadata mirror | `sevice/auth/SupabaseAdminClient.java` |
| Sync-at-login (both directions) + provisioning | `sevice/auth/SyncAtLoginService.java` |
| 60s metadata reconciliation | `sevice/auth/SupabaseReconciliationService.java` |
| Bulk-provision existing users (dev, one-shot) | `sevice/auth/SupabaseUserProvisioningJob.java` |
| Hub `/reconcile` endpoint + login hook | `controller/pwa/PwaAuthController.java` |
| Password-change mirror | `controller/auth/AuthController.java`, `controller/pwa/PwaSecuredController.java` |
| Supabase schema (user_link, triggers, RLS, RPC) | `supabase/migrations/20260723000000_initial_auth.sql` |
| JWT verifier for PA | `supabase/functions/verify-jwt/index.ts` |
| PWA dual-path | `browser/ng-ui/src/app/auth/auth.service.ts`, `services/supabase-auth.service.ts` |

---

## The just-in-time-sync-at-login pattern

Neither store can export a password hash the other can verify (BCrypt vs Supabase's crypt, no export
API). So we reconcile using the **plaintext from the next successful login** — the one moment both a
valid plaintext and a live connection exist.

Every user row (both stores) carries a `passwordUpdatedAt` timestamp (UTC). On a successful login,
the store that accepted it holds the plaintext in memory; **after the response is returned**, an
async task compares the two timestamps and pushes the plaintext to the other store if needed. The
user never feels the delay. Any user who logs in reconciles the stores; users who never log in stay
divergent, which is harmless (inactive rows).

Because the correct direction depends on **which store accepted the login**, there are two entry
points (`SyncAtLoginService`):

1. **`reconcileAfterHubLoginAsync`** — the hub accepted, so the plaintext is hub-valid.
   - Supabase has no record → create the Supabase user with this plaintext + metadata.
   - Hub's `passwordUpdatedAt` ≥ Supabase's → push the plaintext to Supabase (covers a queued mirror
     and the bulk-provisioning temp password, whose Supabase timestamp is backdated to the epoch).
   - Supabase's is strictly newer → **do nothing**: the hub plaintext may be stale; a
     Supabase-accepted login will converge the hub side (below).

2. **`reconcileAfterSupabaseLogin`** — the PWA logged in via the Supabase fallback and then reached
   the hub (it calls `POST /api/pwa/auth/reconcile` with `{email, password}`; the hub independently
   verifies the password against Supabase via a **password grant** — proving *knowledge* of the
   password, not mere possession of a stealable bearer token — before trusting the plaintext). The
   plaintext is Supabase-valid.
   - No hub row → **auto-provision** one (`isActive=false`, `role=""`, pending admin approval).
   - Supabase's `passwordUpdatedAt` ≥ hub's → overwrite the hub password (BCrypt) with the plaintext.
     This is what converges *"password changed on Supabase while the hub was down."*

> **Why a hub-accepted login can't fix a newer-Supabase password:** if the user typed the *new*
> (Supabase) password, the hub — which still has the old hash — would reject it, so the hub never
> holds the new plaintext. The PWA therefore falls back to Supabase even on a hub **401** (not only
> on 5xx), and on Supabase success calls `/reconcile` so the hub catches up.

### Registration, password change, profile change

- **Registration**: hub write first; on success a fire-and-forget mirror creates the Supabase user
  (`PwaUserService`). If the hub is **down**, the PWA registers directly against Supabase
  (`AuthService.signUpDual`) and shows *"pending admin approval on next connection"*; the hub row is
  auto-provisioned on the user's first hub-reachable request.
- **Password change**: hub write + `passwordUpdatedAt = now`, then fire-and-forget
  `updateUserPassword` to Supabase. If Supabase is down, the next login reconciles it. When the **hub**
  is unreachable, the PWA falls back to Supabase for the change: directly if the session is
  Supabase-issued, otherwise by re-authenticating to Supabase with the supplied *current* password to
  obtain a token first (so a hub-originated session still works during a hub outage). The component
  gates only on real connectivity (`navigator.onLine`), not hub reachability.
- **Profile change (client fallback)**: unlike password change, a profile edit carries no password, so
  a hub-originated session cannot acquire a Supabase token during a hub outage — the change stays local
  and syncs to the hub (then Supabase, via the 60s job) once the hub is reachable. A Supabase-issued
  session pushes profile changes to Supabase directly even while the hub is down.
- **Profile change (name/email)**: via the 60s job. Hub → Supabase pushes
  name/email/roles/isActive/permissionLevel; Supabase → hub pulls **only** the name (never email,
  role, isActive, or permissionLevel). Email is hub-authoritative — pulling it back could revert a
  newer hub email change during a partial push (auth.email and the mirrored metadata email can
  briefly diverge), so email flows hub→Supabase only. Each write is a no-op when values already
  match, which stops the push/pull ping-pong after one bounce.
- **Deactivation / role change**: **hub-only.** `PwaJwtAuthFilter` enforces `isActive` regardless of
  which store signed the token, so a deactivated user's tokens stop working on the hub even if
  Supabase still mirrors `is_active:true` until the next 60s cycle. If the hub is down, the admin
  retries later.

---

## Conflict resolution — last-writer-wins by `passwordUpdatedAt`

All password reconciliation is **LWW by `passwordUpdatedAt` (UTC)**. Ties and null timestamps resolve
to *"hub wins"* (floor = epoch). If two conflicting password changes happen during a network
partition, the one with the later `passwordUpdatedAt` wins at the next reconciliation:

- Changed on hub (t2) while Supabase offline; Supabase still at t1 → next login pushes hub→Supabase.
- Changed on Supabase (t2) while hub offline; hub still at t1 → next hub-reachable login (via
  `/reconcile`) overwrites hub with the Supabase password.
- Genuinely concurrent conflicting changes → the later timestamp wins; the earlier is discarded.
  Clock skew between the hub host and Supabase is the tie-breaker's only weakness — keep the hub on
  NTP. (`dateModified`, used only to walk the hub-side metadata delta, is compared against a
  hub-local checkpoint, so its clock domain never crosses stores.)

Metadata (name/email) is plain strings — no hash problem — and also resolves last-write-wins per the
60s job's guarded, idempotent updates.

---

## Failure-mode matrix

| Hub | Supabase | Login | Register | Password change |
|-----|----------|-------|----------|-----------------|
| up | up | hub answers; Supabase reconciled async | hub writes, Supabase mirrored | hub writes, Supabase updated |
| up | down | hub answers | hub writes; Supabase mirror queued → 60s job / next login | hub writes; Supabase update queued |
| down | up | PWA falls back to Supabase; `/reconcile` catches hub up when reachable | PWA registers on Supabase → *pending approval*; hub row auto-provisions on first hub-reachable request | PWA updates Supabase (if Supabase-session); hub updated at next hub login |
| down | down | clear error: *"Auth services unavailable, try again shortly."* nothing crashes | fails cleanly | fails cleanly |

API calls to `/api/pwa/secured/**`: the hub accepts JWTs from **either** issuer. A Supabase-only
user hitting a secured endpoint for the first time gets their hub row auto-provisioned (inactive) and
a `403 ACCOUNT_INACTIVE` until an admin approves — after which they have full access with the same
Supabase token.

---

## Bulk-provision existing users (one-shot)

`SupabaseUserProvisioningJob` runs at startup **only** under the `dev` profile **and** only when
`supabase.provision-existing-on-startup=true`. For each active hub user without a `supabaseUuid`:

1. generates a random throwaway password (real passwords can't be exported),
2. `createUser(email, tempPassword, metadata)` → stores the returned uuid on the hub row,
3. backdates the Supabase `password_updated_at` to the **epoch** so the throwaway always loses LWW —
   the user's **first hub login** then pushes their real password into Supabase.

Idempotent (users with a `supabaseUuid` are skipped). Logs `provisioned` / `failed` counts. To run:
set the flag, boot once with `dev`, then unset the flag.

---

## Rotating keys and the service role

- **Hub JWT keypair** (`data/jwt-private.pem` / `data/jwt-public.pem`):
  1. Generate a new pair (`openssl genpkey -algorithm RSA -pkeyopt rsa_keygen_bits:2048 …`).
  2. Replace both PEMs on the hub and restart — **all existing hub tokens become invalid** (users log
     in once more). Schedule during a quiet window.
  3. Re-publish the new **public** key to the Edge Function secret
     (`supabase secrets set HUB_JWT_PUBLIC_KEY="$(cat data/jwt-public.pem)"`) — the only external
     consumer, and only if PA JWT verification is in use. The PWA and desktops don't verify hub tokens
     (the PWA talks only to the hub; non-hub nodes use their own local key), so nothing else to push.
     Only the hub itself needs the real keypair; it refuses to boot without one (`sync.role=hub`).
- **Supabase JWT secret / signing keys**: rotate in the Dashboard. `SUPABASE_JWT_SECRET` is
  re-injected into Edge Functions automatically; update `supabase.jwt.secret`/`supabase.jwt.public-key-path`
  on the hub. Existing Supabase sessions invalidate per Supabase's own rotation semantics.
- **Service-role key**: regenerate in the Dashboard, update `supabase.service.role.key` in the hub's
  `application-secrets.properties`, restart. It is hub-only — never in the browser bundle.

---

## Troubleshooting — "I can't log in"

1. **Which store is failing?** The PWA hides this by design; check hub logs.
   - `security.login.*` / `[PWA Auth] Login …` present → the request reached the hub.
   - `[Supabase] ping failed` / `Supabase down` → hub can't reach Supabase (reconciliation paused;
     login still works hub-only).
   - `[Supabase] Admin client DISABLED` → `supabase.url`/service key not set (hub runs standalone).
2. **User says the password changed but the hub rejects it** → they changed it on Supabase during a
   hub outage. Confirm the PWA is falling back on 401 and calling `/reconcile`; check for
   `[Supabase sync] Overwrote hub password from Supabase`. Force convergence by having them log in
   again (the PWA falls back to Supabase, which triggers `/reconcile`).
3. **Supabase-only user has no access after approval** → verify the hub row exists
   (`SELECT * FROM users WHERE email=…`), was auto-provisioned (`role=''`, `is_active=false`), and was
   flipped active by an admin. The `isActive` gate is hub-authoritative.
4. **Both stores unreachable** → the PWA shows *"Auth services unavailable, try again shortly."* This
   is expected; nothing is lost.
5. **RS256 rollout** → users on stale HS256 tokens are logged out once and re-login cleanly. If a hub
   token is rejected with an issuer error, confirm `data/jwt-public.pem` matches the signing private
   key and was distributed.
6. **No password reset via PWA** — by design. A forgotten password is reset by an admin via the hub
   (`/api/auth/reset-password` flow), which requires the hub to be up.

---

## Implementation notes / deviations from the original spec

- **Supabase access-token expiry is capped at 7 days** by GoTrue (the spec asked for 30). We set the
  max (`jwt_expiry = 604800`) and rely on refresh-token rotation + the PWA's silent refresh for
  indefinite sessions. The hub RS256 token keeps its own `jwt.expiration-hours` (720h / 30d default).
- **The PWA uses a thin GoTrue REST wrapper (`SupabaseAuthService`) over `HttpClient`** instead of
  `@supabase/supabase-js`. Same behavior (sign-in/up, refresh, password/profile update), no bundle
  dependency, fully observable/testable. Swap in the SDK later if realtime/storage is needed.
- **Two reconcile entry points + a `/reconcile` endpoint** (and PWA fallback on hub 401) replace the
  spec's single hub-login-only reconcile — this is what actually converges the *"changed on Supabase
  while hub down"* case (see the pattern section).
- **`PasswordEncoder` moved to `PasswordEncoderConfig`** to break a construction cycle introduced by
  the filter now depending (transitively) on the encoder.
- **`user_link` is read only via a `SECURITY DEFINER` RPC** (`get_auth_sync_status`) granted to
  `authenticated`/`service_role` (**not** `anon`) — the hub calls it with the service-role key. This
  avoids a table-wide SELECT grant and prevents unauthenticated account enumeration.
- **The `/reconcile` endpoint gates on password knowledge** (a Supabase password grant performed by
  the hub), not on a client-supplied bearer token, so a stolen Supabase access token can't be turned
  into a permanent hub credential.
