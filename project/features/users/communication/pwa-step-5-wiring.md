# PWA Wiring — Groups + Schedule + Contacts (Step 5)

Adds the two new user groups (NAES, JPower) and exposes the schedule + contacts data through PWA-facing endpoints with group-based access control. Filed here in `communication/` because it's the prerequisite for the Plant Chat PWA UI — chat access rules use the same group model — but the changes themselves are broader than chat.

Status: **Design only** as of 2026-07-24. Prerequisites: dual-authority auth work (User has been extended with `supabaseUuid`, JWT switched to RS256, `PwaJwtAuthFilter` accepts both issuers). Should be tackled **first**, before Plant Chat implementation.

## Scope

- Introduce `ROLE_NAES` and `ROLE_JPOWER` as new CSV role strings on `User.role` (matches existing `ROLE_*` pattern, no new columns).
- Two new PWA read-only endpoints for schedule and contacts.
- Backend authorisation matchers (URL-based, matching existing pattern in `SecurityConfigSpring`) restricting to `{ADMIN, PLANT, NAES, JPOWER}`.
- PWA route guards + role-derived UI (hide the Personnel section from users who can't see it).
- IndexedDB caching so schedule + contacts are readable offline / when hub is unreachable.

Out of scope for this doc: contractor role changes, admin UI for role assignment (already exists in User admin), NAES/JPower onboarding flow.

## Access matrix

Same rules apply everywhere (RLS in Supabase, `@PreAuthorize` on hub, PWA route guards). Copy as-is from below when implementing.

| Feature | ADMIN | PLANT | NAES | JPOWER | EMPLOYEE | CONTRACTOR | PWA_USER |
|---|---|---|---|---|---|---|---|
| Schedule (read) | ✓ | ✓ | ✓ | ✓ | | | |
| Contacts (read) | ✓ | ✓ | ✓ | ✓ | | | |
| Plant Chat (read + write) | ✓ | ✓ | ✓ | ✓ | ✓ | | |
| Work Request submit (PWA) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| JHA submit (PWA) | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |

Notes:
- Contractor is deliberately blocked from schedule / contacts / plant chat. Contractor's PWA experience is limited to WR / JHA / instrumentation submission — the existing external-facing flows.
- `PWA_USER` is the default marker set by `PwaUserService.registerPwaUser` on brand-new registrations pending admin approval. They can submit WRs but nothing else until an admin promotes them.

## Backend changes

### 1. Role list

`NgUserController.getAvailableRoles()` — add `ROLE_NAES` and `ROLE_JPOWER` to the `accessRoles` array and the combined list. Frontend picks these up automatically from the existing dropdown.

No enum change — matches existing convention (roles are CSV strings, not enum-typed).

### 2. `PwaScheduleController` (new)

`controller/pwa/PwaScheduleController.java`, mount at `/api/pwa/secured/schedule/*`, JWT-gated by `PwaJwtAuthFilter` (already covers `/api/pwa/secured/**`).

Endpoints:

- `GET /api/pwa/secured/schedule/today` → today's `ShiftDayDto` (one row).
- `GET /api/pwa/secured/schedule/range?from=YYYY-MM-DD&to=YYYY-MM-DD` → range of `ShiftDayDto` (cap `to - from` at 60 days server-side to prevent runaway pulls).
- `GET /api/pwa/secured/schedule/on-shift-now` → convenience wrapper returning just names + shift codes for the current shift window.

Read directly from the existing `ShiftDay` entity + `ShiftDayService` — no separate DTO layer, just reuse.

### 3. `PwaContactsController` (new)

`controller/pwa/PwaContactsController.java`, mount at `/api/pwa/secured/contacts/*`.

Endpoints:

- `GET /api/pwa/secured/contacts` → all active users with contact fields projected. Shape: `id, name, phone, secondaryPhone, title, company, emergencyContact` (parsed from `emergencyContactJson`).
- `GET /api/pwa/secured/contacts/emergency` → same but filtered to non-null emergency contact only.

Read from `User` entity (contact fields already exist per earlier work in this session).

### 4. Security matchers

`config/SecurityConfigSpring.java`, add before the catch-all `authenticated()`:

```java
.requestMatchers("/api/pwa/secured/schedule/**", "/api/pwa/secured/contacts/**")
    .hasAnyRole("ADMIN", "PLANT", "NAES", "JPOWER")
```

Chat endpoints (added later when Plant Chat lands) go in the same block with `hasAnyRole("ADMIN", "PLANT", "NAES", "JPOWER", "EMPLOYEE")`.

Spring's `hasAnyRole` automatically prefixes `ROLE_` — matches the CSV convention on `User.role`.

## PWA changes

### 1. Role-derived state

Extend the auth service to expose:

```ts
class AuthService {
  roles = signal<string[]>([]);
  isPlantGroup = computed(() =>
    this.roles().some(r => ['ROLE_ADMIN','ROLE_PLANT','ROLE_NAES','ROLE_JPOWER'].includes(r))
  );
  isChatEligible = computed(() =>
    this.roles().some(r => ['ROLE_ADMIN','ROLE_PLANT','ROLE_NAES','ROLE_JPOWER','ROLE_EMPLOYEE'].includes(r))
  );
}
```

`roles` populated from the JWT `roles` claim at login. Same claim regardless of which issuer signed the token (dual-auth work ensures Supabase-issued tokens carry roles from `raw_user_meta_data.roles`).

### 2. Route guard

`plantGroupGuard` — reads `authService.isPlantGroup()`. On false, redirects to `/home`. Apply to `/personnel/*` routes.

### 3. Personnel section

New top-level PWA section, hidden from nav bar when `!isPlantGroup()`. Two sub-tabs:

- **Schedule** — table view rendered from `GET /schedule/range`. Month picker. IndexedDB cache with 15-min freshness; falls back to cache on network error.
- **Contacts** — searchable list. Same caching pattern.

Both endpoints are read-only; no write paths from PWA (edits go through Electron desktop admin or hub Ng controllers).

### 4. IndexedDB caching

Simple pattern: on every successful fetch, write to IndexedDB keyed by `(userId, endpoint, params)` with an `expiresAt`. On mount, read from cache first; render immediately; then fetch in the background and update.

If both cache is empty AND fetch fails, show "Data unavailable — connect to hub or reload later." No fake data.

## Data flow — the "PWA reads schedule when hub is down" case

Since schedule / contacts are hub-owned data (not mirrored to Supabase), when the hub is unreachable, the PWA has three fallback options in decreasing order of freshness:

1. **IndexedDB cache** — up to 15 min stale, fine for most cases. Users see "this week's schedule" instantly.
2. **Nothing else.** No Supabase mirror. No PA fallback.

The trade-off was accepted: schedule / contacts change rarely, stale-cache covers 99% of the offline case, and mirroring to Supabase adds sync complexity for little marginal value. Revisit only if plant users complain that offline schedule reads are inaccurate.

Plant Chat is the counter-example — messages MUST work when hub is down, so chat is mirrored to Supabase. Schedule doesn't have that requirement.

## Config additions

None on the backend beyond what dual-auth already added.

PWA `environment.ts` — add `pwaScheduleUrl` and `pwaContactsUrl` (both derivable from `apiUrl`, but explicit is clearer).

## Deferred / non-goals

- Schedule writes from PWA. Schedule editing lives in Electron only.
- Contact writes from PWA. Same.
- Real-time schedule / contact updates. Refresh on load + 15-min cache is enough.
- NAES / JPower-specific views (filtered schedule showing only NAES people, etc.). Not needed for v1.
- Contractor-visible partial schedule (e.g. their own row only). Explicitly out of scope; contractors have no schedule access.

## Open items to resolve during implementation

1. Confirm the PWA `personnel` route name isn't already taken — reuse if a placeholder exists.
2. Decide the exact user-facing labels for NAES / JPower groups in the admin role dropdown. Backend uses `ROLE_NAES` / `ROLE_JPOWER`; admin UI display probably wants "NAES" / "JPower".
3. `PwaJwtAuthFilter` currently loads the user's roles from the hub `User.role` column when validating. Verify that behaviour still works when the JWT was issued by Supabase — the dual-auth `PwaJwtAuthFilter` update should have covered this, but worth spot-checking that a Supabase-signed JWT for a NAES user actually resolves to the correct role set when hitting `/schedule/today`.
