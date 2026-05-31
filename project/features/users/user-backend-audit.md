# Backend User Section — Audit

Snapshot of the existing Spring Boot user infrastructure that informs the upcoming schedule/contacts/contractor work.

## Entity model

`User` extends `BaseAuditEntity` (`src/main/java/com/dk_power/power_plant_java/entities/users/User.java`).

**Identity / profile:**
- `username`, `email` (unique), `password` (BCrypt), `windowsUsername`
- `firstName`, `lastName`, `name`
- `phone`, `company` (free text, no enum)

**Roles & permissions:**
- `role` — **CSV string** holding all roles (e.g. `"ROLE_ADMIN,ROLE_PLANT"`).
- Helper methods on entity: `getRoles()`, `setRoles()`, `hasRole()`, `addRole()`.
- Defined access roles: `ROLE_ADMIN`, `ROLE_EMPLOYEE`, `ROLE_CONTRACTOR`, `ROLE_PLANT`.
- **No `NAES` or `JPower` role exists today** — we'll need to add them.
- LOTO roles (`CONTROL_AUTHORITY`, `LOTO_QUALIFIED`, `REQUESTOR`, `MANAGER`) live in same CSV via `LotoRole` enum.
- `permissionLevel` — string enum `NONE`/`BASIC`/`OPERATOR` (PWA permit signing).

**Auth state:**
- `isActive`, `lastLoginDate`, `pwaUserUuid` (cross-ref to PWA registration).

**PIN / step-up:**
- `signingInitials`, `pinHash`, `pinSetAt`, `pinLockedUntil`, `failedPinAttempts`, `pinResetRequestedAt`, `pinMustChange`.

**Other:**
- `signaturePath`, `trainingCompletedAt`, `trainingExpiresAt`.

**Inherited from `BaseAuditEntity`/`BaseIdEntity`:** `id`, `deleted` (soft-delete + `@Where`), `dateCreated`, `dateModified`, `createdBy`, `modifiedBy`, `FieldChangeEntityListener` (auto sync tracking).

## Persistence

[UserRepo.java](src/main/java/com/dk_power/power_plant_java/repository/users/UserRepo.java) — extends `BaseRepository<User>`. Notable lookups:

- `findFirstByEmailIgnoreCaseOrderByIdAsc(String)`
- `findFirstByUsernameIgnoreCaseOrderByIdAsc(String)`
- `findFirstByWindowsUsernameOrderByIdAsc(String)` — desktop auto-auth
- `findFirstByPwaUserUuidOrderByIdAsc(String)`
- `findFirstByRoleAndIsActiveTrue(String)`
- `findBySigningInitialsIgnoreCase(String)`
- `existsByUsername / existsByEmail / existsByWindowsUsername`
- `updateLastLoginDate(...)` / `updateLastLoginById(...)` — native SQL fast-paths

## Services

- **`UserServiceImpl`** — basic CRUD with password encoding.
- **`NgUserService`** — Angular CRUD via `NgCrudService<User, UserDto, UserRepo, UserMapper>`, includes `complexSearch`, `findByUsername`, `findByEmail`.
- **`PwaUserService`** — handles PWA self-registration (idempotent by `pwaUserUuid`, sets `isActive=false` pending admin approval).
- **`UserDetailsServiceImpl`** — Spring Security integration. `loadUserByUsername` tries email first, then username; converts CSV roles to `GrantedAuthority` set; returns `CustomUserDetails`.
- **`UserMergeService`** — dedupes duplicate User rows during sync. Detection key: `windowsUsername` (case-insensitive). Winner: lowest ID. Uses reflection for synced entities and native SQL for `PasswordResetToken` / `AccessGrant`.

## Controllers

**Server-side (legacy Thymeleaf):**
- `UserController` — `/users/*` form pages.

**Angular REST (`/ng/users/*`, admin-only via `hasRole("ADMIN")`):**
- `GET /ng/users/paginated`, `GET /ng/users/{id}`
- `POST /ng/users` (`CreateUserRequest`), `PUT /ng/users/{id}` (`UpdateUserRequest`)
- `DELETE /ng/users/{id}` — soft delete (`isActive=false`, `deleted=true`)
- `GET /ng/users/all-options` — authenticated, not admin-gated
- `GET /ng/users/roles` — returns available role strings
- `POST /ng/users/seed-plant-users` — admin-only seed of ~27 hardcoded plant users

**PWA (`/api/pwa/*`, JWT-secured):**
- `PwaUserController` — `/api/pwa/user/register`, `/status/{uuid}`, `/signature/{uuid}`
- `PwaAuthController` — `/api/pwa/auth/login`, `/refresh`, `/me`, `/lookup`

**Session-based web auth (`/api/auth/*`):**
- `AuthController` — login/logout/profile/password reset/forgot-password
- Step-up endpoints: `POST /api/auth/step-up`, `POST /api/auth/pin/change`, `POST /api/auth/pin/request-reset`
- Admin PIN management: `POST /api/auth/admin/users/{id}/pin/reset`, `POST /api/auth/admin/users/{id}/initials`

## Security & JWT

**`JwtService`** — HS256, secret from `jwt.secret`, expiration `jwt.expiration-hours` (default 72h).

JWT claims:
- `sub` = email, `userId`, `roles` (List<String>), `permissionLevel`, `pwaUserUuid`, `iat`, `exp`

**Filters (ordered):**
- `DesktopAutoAuthFilter` — localhost only, auto-auths by OS user via `windowsUsername`, grants `ROLE_PLANT`/`ROLE_ADMIN` users.
- `PwaJwtAuthFilter` — bearer or `?token=` query (SSE). Active on `/api/pwa/secured/*`, `/api/pwa/auth/me`, `/api/pwa/auth/refresh`.
- `StepUpAuthFilter` — swaps SecurityContext for one request when `X-Sign-As-Token` header is present.
- `AccessGrantFilter` — gates external (non-LAN) traffic; requires approved `ACCESS_TOKEN` cookie.

**`SecurityConfigSpring`** uses URL-based matchers, **no `@PreAuthorize` annotations** in user code. Key rules:
- `/ng/users/**` → `hasRole("ADMIN")` (except `/ng/users/all-options` → authenticated)
- `/api/auth/admin/**` → localhost + `hasRole("ADMIN")`; non-localhost = deny
- `/api/pwa/**` → public for unprotected endpoints; `/api/pwa/secured/**` → authenticated via JWT
- LAN-only paths: `/api/sync/*`, `/api/field-sync/*`, `/api/files/*`, `/h2-console/*`, etc.

## Frontend (ng-ui PWA)

`browser/ng-ui/src/app/models/auth/user.model.ts`:
```ts
interface IUser extends IBaseModel {
  firstName: string; lastName: string; company: string;
  email: string; role: string; password?: string;
  sharepointId: number | null;
}
```

Services: `UserApiService` (legacy Power Automate), `UserStateService` (state + 1h sync), `UserDbService` (IndexedDB), `UserLocalStorageService` (drafts).

The Spring Boot Angular frontend (`frontend/src/app/`) has its own User admin under `pages/admin/` — not deeply audited; standard CRUD via `/ng/users/*` endpoints.

## Gaps relevant to upcoming work

| Need | Status |
|---|---|
| `phone` on User | ✓ exists |
| `personalEmail` / `workPhone` distinct fields | ✗ missing |
| `emergencyContactJson` text field | ✗ missing — add per plan |
| Schedule/shift concept | ✗ entirely absent — `ShiftAssignment` is new |
| `Contractor` group | partial — `ROLE_CONTRACTOR` string exists, no formal model |
| `NAES`, `JPower`, `Plant` as groups | ✗ no `NAES`/`JPower` strings; `ROLE_PLANT` exists |
| SharePoint user-sync adapter | ✗ none — PWA registration is one-way |
| OnLocation user import | ✗ none on backend side (Electron has the client) |
| Role hierarchy / type-safe enum | ✗ — roles are CSV strings |

## Decisions implied for the plan

1. **Roles stay as CSV strings.** Adding `ROLE_NAES`, `ROLE_JPOWER` (or just `NAES`/`JPower`) as new role strings is consistent. No refactor to a Role/Group table needed for this phase.
2. **Contact fields go on `User` directly** — add `personalPhone`, `personalEmail`, `workPhone`, `emergencyContactJson` columns (Hibernate `ddl-auto=update`).
3. **`ShiftAssignment` is a brand-new entity** — references User by FK (nullable for unresolved), stores raw `sourceName` for matching triage.
4. **OnLocation client must be built on the backend side** for the contractor reconciler — Electron's gate-log client can't be reused directly (different process). Credentials can ride existing secrets pattern (`application-secrets.properties`).
5. **No SharePoint sync adapter for users yet** — need new `UserSharePointAdapter` with `cert*()` + `pa*()` method pairs following the existing per-entity adapter convention.
6. **Group restrictions on PWA endpoints** can be added incrementally — current pattern is URL-based; we can use `hasAnyAuthority("NAES","Plant",...)` matchers in `SecurityConfigSpring`.
