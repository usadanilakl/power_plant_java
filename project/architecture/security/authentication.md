# Authentication

## Access Tiers

| # | Scenario | Auth | Access | accessLevel |
|---|----------|------|--------|-------------|
| 1 | **Desktop** (localhost) | Auto-login via `DesktopAutoAuthFilter` | Full | `FULL` |
| 2 | **LAN** (internal IP) | Manual login (session) | Full (role-restricted) | `FULL` |
| 3 | **External** (public IP) | Manual login (session) | Restricted | `RESTRICTED` |
| 4 | **External + grant** | Manual login + ACCESS_TOKEN cookie | Full (role-restricted) | `FULL` |

- Tiers 1-2: no grant needed. `AccessGrantFilter` bypasses localhost/LAN.
- Tier 3: automatic after login. User can access `/api/auth/*`, `@RestrictedAllowed` endpoints, and static resources.
- Tier 4: requires admin approval from localhost (desktop Electron instance).

## Login Flow

1. Client sends `POST /api/auth/login` with `{ credential, password }` — credential can be **email or username**
2. `AuthController` authenticates via Spring's `AuthenticationManager`
3. `UserDetailsServiceImpl.loadUserByUsername()` tries email first, then username:
   - `userRepo.findByEmail(credential)` — if found, use it
   - `userRepo.findByUsername(credential)` — fallback if email lookup returned null
4. `CustomUserDetails` wraps the `User` entity for Spring Security
5. Spring Security 6.x: context explicitly saved to session via `HttpSessionSecurityContextRepository.saveContext()`
6. Post-auth: user looked up by `userDetails.getId()` (not by credential string) to ensure correct user regardless of login method
7. Response includes origin-aware `accessLevel`:
   ```json
   { "id": 123, "name": "John", "email": "john@test.local", "role": "ROLE_EMPLOYEE", "isActive": true, "accessLevel": "FULL" }
   ```
8. On failure: 401 with `{ "error": "INVALID_CREDENTIALS", "message": "Invalid email or password" }`
9. Controller updates `user.lastLoginDate` via `updateLastLoginById()` (by user ID, not email) and logs the login with client IP

**Frontend routing after login:**
- `accessLevel: "FULL"` → navigates to `/home` (or returnUrl)
- `accessLevel: "RESTRICTED"` or `"PENDING"` → navigates to `/access-request`

**Files:**
- `controller/auth/AuthController.java`
- `sevice/users/impl/UserDetailsServiceImpl.java` — email + username lookup

## Desktop Auto-Auth

The `DesktopAutoAuthFilter` automatically authenticates requests from localhost without requiring login.

### How It Works

1. Filter runs **before** `UsernamePasswordAuthenticationFilter` in the chain
2. Only activates for loopback IPs via `NetworkUtils.isLoopbackRequest()`: `127.0.0.1`, `0:0:0:0:0:0:0:1`, `::1`
3. If no existing authentication in SecurityContext:
   - Reads `System.getProperty("user.name")` (OS username)
   - Looks up `User` by `windowsUsername` field via `UserRepo.findByWindowsUsername()`
   - If found and active → creates `UsernamePasswordAuthenticationToken` in SecurityContext
4. Result cached per OS username to avoid DB hit on every request

### Admin Fallback

If no `User` matches the OS username, the filter falls back to the first active admin user (`ROLE_ADMIN`). This means **any desktop user is auto-authenticated** without needing a matching `windowsUsername` entry.

The lookup order in `resolveUser()`:
1. `userRepo.findByWindowsUsername(osUsername)` — exact match
2. `userRepo.findFirstByRoleAndIsActiveTrue("ROLE_ADMIN")` — fallback

| OS Username | User.windowsUsername | Result |
|-------------|---------------------|--------|
| `usada` | `usada` | Auto-authenticated as that user |
| `dklokov` | `dklokov` | Auto-authenticated as that user |
| `anyone` | (no match) | Auto-authenticated as first active admin (fallback) |
| (any) | (remote IP) | Filter skips entirely |

**File:** `config/security/DesktopAutoAuthFilter.java`

## Current User (/me)

`GET /api/auth/me` returns the current user's info plus origin-aware access level:

```json
{
  "id": 123,
  "name": "System Administrator",
  "email": "admin@power-plant.local",
  "role": "ROLE_ADMIN",
  "isActive": true,
  "accessLevel": "FULL"
}
```

Access level is computed by `computeAccessLevel(User, HttpServletRequest)`:
- **Localhost or LAN** → always `"FULL"` (matches `AccessGrantFilter` bypass)
- **External** + valid approved grant → `"FULL"`
- **External** + pending grant → `"PENDING"`
- **External** + no grant → `"RESTRICTED"`

## Restricted Access (External, No Grant)

After login from outside the network, the user gets `accessLevel: "RESTRICTED"` and is routed to `/access-request`. They can access:

- `/api/auth/*` endpoints (login, logout, me, profile, access-status, request-access) — exempt in `AccessGrantFilter`
- Endpoints annotated with `@RestrictedAllowed` (currently: `/ng/rf-values/**`, `/ng/values/**`) — checked by `AccessGrantFilter` via handler resolution
- Static resources (Angular SPA loads normally)
- Everything else:
  - **Browser page navigation** (`Accept: text/html`) → HTTP redirect to `/app/access-request`
  - **API/AJAX requests** → 403 JSON `{ "error": "FULL_ACCESS_REQUIRED" }`

The `authInterceptor` catches 403 `FULL_ACCESS_REQUIRED` API responses and redirects to `/access-request` (unless the user is already on that page, to prevent redirect loops). Browser navigations (e.g., user clicks Back/Forward) are handled server-side by `AccessGrantFilter` redirecting to the Angular access-request page.

See [Restricted Access](./restricted-access.md) for the `@RestrictedAllowed` annotation system and how to extend the restricted area.

## Full Access Grant Flow (External)

### 1. User Requests Access

`POST /api/auth/request-access` (must be logged in)

- Creates `AccessGrant` with `status: PENDING`
- Records client IP and User-Agent
- Prevents duplicates — returns `ALREADY_PENDING` or `ALREADY_APPROVED`

### 2. Admin Approves (localhost only)

`POST /api/auth/admin/approve/{id}` — requires **ADMIN role + localhost IP**

All admin grant endpoints (`/api/auth/admin/**`) are **localhost-only**:
- `SecurityConfigSpring`: `localhostMatcher` + `denyAll` fallback blocks non-localhost
- `AccessAdminController`: every endpoint checks `NetworkUtils.isLoopbackRequest()`
- Not available from LAN or external — only the desktop (Electron) instance

Admin endpoints:
- `GET /api/auth/admin/pending` — list pending requests
- `GET /api/auth/admin/active-grants` — list valid approved grants
- `POST /api/auth/admin/approve/{id}` — approve (generates token, 24h expiry)
- `POST /api/auth/admin/deny/{id}` — deny
- `POST /api/auth/admin/revoke/{id}` — revoke
- `POST /api/auth/admin/prolong/{id}` — extend approved grant expiry (1-72 hours)
- `GET /api/auth/admin/grant-history` — all grants, all statuses

Approve response: `{ "success": true, "accessToken": "uuid...", "expiresAt": "...", "user": "email" }`

**File:** `controller/auth/AccessAdminController.java`

### 3. Cookie Delivery

When the user polls `GET /api/auth/access-status` and has an APPROVED grant, the server sets the `ACCESS_TOKEN` cookie in the HTTP response. The frontend's access-request page polls every 10 seconds, so the cookie is set as soon as approval happens.

Cookie properties: `HttpOnly`, `Path=/`, max-age matches remaining grant lifetime.

### 4. Token Validation

`AccessGrantFilter` runs **after** authentication on every request to protected endpoints:

1. Exempt paths (`/api/auth/`, static resources) → pass through
2. Localhost → pass through (full access)
3. LAN → pass through (full access)
4. External + unauthenticated → pass through (Spring Security handles 401)
5. External + authenticated → check `@RestrictedAllowed` annotation:
   - Handler annotated → pass through (restricted users can access)
6. External + authenticated + not annotated → check `ACCESS_TOKEN` cookie:
   - Valid grant → update `lastActiveAt` (throttled to every 5 min), pass through
   - Missing/invalid/expired → 403 `FULL_ACCESS_REQUIRED`

**File:** `config/security/AccessGrantFilter.java`

### 5. Expiration & Cleanup

Grant expires when **either** condition is met (whichever comes first):
- **24 hours** since approval (hard limit)
- **1 hour** of inactivity (no requests)

`AccessGrantCleanupService` runs every 5 minutes (`@Scheduled(fixedRate = 300000)`):

- Marks `APPROVED` grants as `EXPIRED` when either limit is hit
- Deletes old resolved grants (>30 days) to prevent table growth

**File:** `sevice/users/AccessGrantCleanupService.java`

### 6. Prolong Grant

`POST /api/auth/admin/prolong/{id}` — extends the expiry of an approved grant (localhost-only, admin).

- Accepts `hours` parameter (1-72 hours)
- Adds the specified hours to the grant's current `expiresAt` timestamp
- Only works on grants with `APPROVED` status
- Available from the admin access management page

### E2E Flow Summary

```
External user → login → accessLevel: RESTRICTED → /access-request page
  → clicks "Request Full Access" → POST /api/auth/request-access → PENDING
  → polls GET /api/auth/access-status every 10s

Admin on desktop → /admin/access-management → sees pending request
  → clicks Approve → POST /api/auth/admin/approve/{id} → token generated

External user → next poll → access-status returns APPROVED + sets ACCESS_TOKEN cookie
  → navigates to /home → AccessGrantFilter validates cookie → full access
```

### AccessGrant Entity

```
AccessGrant {
  id: Long
  user: User (FK)
  accessToken: String (UUID, unique)
  deviceInfo: String (User-Agent)
  requestIp: String
  status: PENDING | APPROVED | DENIED | EXPIRED | REVOKED
  requestedAt: LocalDateTime
  approvedAt: LocalDateTime
  expiresAt: LocalDateTime (24h after approval)
  lastActiveAt: LocalDateTime (updated on each valid request, throttled 5 min)
  approvedBy: User (FK, the admin who approved)
}
```

**File:** `entities/users/AccessGrant.java`

## Network Utilities

`NetworkUtils` provides IP classification helpers used across the security layer:

| Method | Checks | Used By |
|--------|--------|---------|
| `isLoopbackRequest()` | `127.*`, `::1` | `DesktopAutoAuthFilter`, `AccessGrantFilter`, `AccessAdminController`, `SecurityConfigSpring.localhostMatcher` |
| `isInternalRequest()` | Loopback + RFC 1918 (`10.*`, `192.168.*`, `172.16-31.*`) + link-local | `AccessGrantFilter`, `SecurityConfigSpring.lanOnlyMatcher`, `computeAccessLevel()` |
| `getClientIp()` | Extracts IP from `X-Forwarded-For` header or `remoteAddr` | All of the above |

**File:** `config/NetworkUtils.java`

## Security Filter Chain

Order in `SecurityConfigSpring`:

1. **Public endpoints** — permitAll (login, logout, forgot-password, reset-password, static resources, sharepoint-sync, actuator)
2. **LAN-only endpoints** — `lanOnlyMatcher` permitAll (sync, files, update, electron-update, resource-packs, sync-updates, data-integrity, backup, attachments, h2-console)
3. **Localhost-only admin** — `localhostMatcher` hasRole ADMIN (`/api/auth/admin/**`)
4. **Non-localhost admin** — denyAll (`/api/auth/admin/**` fallback)
5. **Admin pages** — hasRole ADMIN (`/admin/**`, `/users/**`, `/ng/users/**`)
6. **Auth endpoints** — authenticated (`/api/auth/**`)
7. **Everything else** — authenticated (AccessGrantFilter handles external access check)

Custom filters:
- `DesktopAutoAuthFilter` — **before** `UsernamePasswordAuthenticationFilter`
- `AccessGrantFilter` — **after** `UsernamePasswordAuthenticationFilter`

**File:** `config/SecurityConfigSpring.java`

## Logout

`POST /api/auth/logout`

- Invalidates the HTTP session
- Deletes `JSESSIONID` and `ACCESS_TOKEN` cookies
- Returns `{ "success": true, "message": "Logged out" }`

## Forgot Password / Reset Password

Self-service password reset flow for users who forget their password. No authentication required — these are public endpoints.

### Flow

```
Login page → "Forgot password?" link → /forgot-password page
  → User enters email → POST /api/auth/forgot-password
  → Server sends email with reset link (via EmailFacadeService)
  → User clicks link → /app/reset-password?token={uuid}
  → Angular reset-password page → new password + confirm
  → POST /api/auth/reset-password { token, newPassword }
  → Success → "Go to Login" button
```

### Backend

`POST /api/auth/forgot-password` `{ email }` — **public (no auth required)**
- Finds user by email, generates UUID token with 1h expiry
- Sends reset email via `EmailFacadeService` (API primary, manual fallback)
- Always returns 200 with generic message to avoid revealing whether email exists
- Reset link format: `{baseUrl}/app/reset-password?token={uuid}`

`POST /api/auth/reset-password` `{ token, newPassword }` — **public (no auth required)**
- Validates token: exists, not used, not expired
- New password minimum 8 characters
- BCrypt-encodes and saves new password
- Marks token as used (single-use)

### PasswordResetToken Entity

```
PasswordResetToken {
  id: Long (IDENTITY)
  user: User (FK)
  token: String (UUID, unique)
  expiresAt: LocalDateTime (1h after creation)
  used: boolean (default false)
  createdAt: LocalDateTime
}
```

Standalone entity — does **not** extend `BaseIdEntity` (no sync needed, no entity listeners). Follows the same pattern as `AccessGrant`.

**Files:**
- `entities/users/PasswordResetToken.java`
- `repository/users/PasswordResetTokenRepository.java`
- `controller/auth/AuthController.java` — forgot-password + reset-password endpoints

### Frontend

| Component | Route | Purpose |
|-----------|-------|---------|
| `forgot-password.component.ts` | `/forgot-password` (public) | Email input, "Send Reset Link" button, success/error states |
| `reset-password.component.ts` | `/reset-password` (public) | New password + confirm, strength meter, token from query params |

Both pages match the login page's dark-theme styling.

### Security

- Both endpoints added to `SecurityConfigSpring` permitAll list (alongside login/logout)
- Token is single-use and expires after 1 hour
- Generic response on forgot-password prevents email enumeration
- Email sending failure is logged but doesn't affect the response (silent fail)

## User Profile (Self-Service)

Authenticated users can view and edit their own profile. Available in restricted access (under `/api/auth/*`).

### View Profile

`GET /api/auth/profile` returns the full user record:

```json
{
  "id": 123,
  "username": "admin",
  "firstName": "System",
  "lastName": "Administrator",
  "name": "System Administrator",
  "email": "admin@power-plant.local",
  "role": "ROLE_ADMIN",
  "isActive": true,
  "lastLoginDate": "2026-02-13T10:30:00",
  "windowsUsername": "usada"
}
```

### Update Profile

`PUT /api/auth/profile` — users can update their own name and password (not role, email, or isActive).

```json
{ "firstName": "John", "lastName": "Doe" }
```

Or change password:

```json
{ "password": "newSecurePassword" }
```

Only non-null fields are applied. Password is BCrypt-encoded before storage. The `name` field is auto-computed as `firstName + " " + lastName`.

### Change Password (Verified)

`POST /api/auth/profile/change-password` — verified password change requiring current password confirmation.

```json
{ "currentPassword": "oldPassword", "newPassword": "newSecurePassword" }
```

- Verifies `currentPassword` matches the user's existing BCrypt-encoded password before applying the change
- Returns 400 if current password is incorrect
- New password is BCrypt-encoded before storage

### Session History

`GET /api/auth/profile/sessions` — returns the current user's own grant history (all statuses). Annotated with `@RestrictedAllowed` so restricted external users can view their own session history from the profile Sessions tab.

**File:** `controller/auth/AuthController.java` — `GET/PUT /api/auth/profile`, `POST /api/auth/profile/change-password`, `GET /api/auth/profile/sessions`

## Angular Frontend Integration

| Component | Purpose |
|-----------|---------|
| `auth.service.ts` | Login (by email or username)/logout/profile/forgot-password/reset-password API calls, `currentUser$` and `isLoggedIn$` observables, `accessLevel` tracking |
| `auth.interceptor.ts` | Adds `withCredentials: true`, redirects 401 → `/login`, redirects 403 `FULL_ACCESS_REQUIRED` → `/access-request` (with loop prevention) |
| `auth.guard.ts` | Route guard: waits for auth check, redirects to `/login` if not authenticated |
| `admin.guard.ts` | Route guard: requires `ROLE_ADMIN`, redirects to `/home` |
| `full-access.guard.ts` | Route guard: requires `accessLevel === 'FULL'`, redirects to `/home` |
| `login.component.ts` | Login form UI (email or username), "Forgot password?" link, routes to `/access-request` if restricted |
| `forgot-password.component.ts` | Email input for password reset link request |
| `reset-password.component.ts` | New password + confirm + strength meter, reads token from query params |
| `profile.component.ts` | Tabbed profile page (Profile/Security/Sessions/Preferences tabs), password strength meter, verified password change |
| `user-profile.component.ts` | Header avatar icon with dropdown (profile link, access level badge, sign out). Badge shows `RESTRICTED`/`PENDING` (hidden when `FULL`) |
| `access-request.component.ts` | External user: request full access + 10s status polling, progress steps, countdown timer, "Request Again" on denied/expired |
| `admin-access.component.ts` | Admin (localhost only): approve/deny/revoke/prolong grants, stats bar, grant history, auto-refresh, revoke confirmation dialog |

### Routes

```
/login                    — LoginComponent (public)
/forgot-password          — ForgotPasswordComponent (public)
/reset-password           — ResetPasswordComponent (public)
/access-request           — AccessRequestComponent (authGuard)
/profile                  — ProfileComponent (authGuard)
/home                     — HomeComponent (authGuard)
/admin/access-management  — AdminAccessComponent (authGuard, adminGuard)
/admin/users              — UserManagementComponent (authGuard, adminGuard)
/permits-monitor          — PermitsMonitorComponent (authGuard, fullAccessGuard)
/file/**, /loto/**, etc.  — Feature routes (authGuard, fullAccessGuard)
```

### Navigation

- **"My Account" nav group**: visible to ALL users (no `requiresFullAccess` flag), contains profile and account-related routes
- **"My Account" home card group**: visible to ALL users, provides quick access to profile and account features from the home page
- **Access level badge**: shown in the header dropdown next to the user's name. Displays `RESTRICTED` or `PENDING` badge; hidden when access level is `FULL`

### Deferred Service Preloading

Services that preload reference data (`RfValueService`, `RfLotoStandardStateService`) defer their initial API calls until the user has `accessLevel === 'FULL'`. This prevents a flood of 403 errors for restricted external users, since these services are injected by globally-rendered components (`WizardDialogComponent` in `app.component.html`).

Pattern:
```typescript
authService.currentUser$.pipe(
    filter(user => user != null && user.accessLevel === 'FULL'),
    take(1)
).subscribe(() => this.loadInitialData());
```
