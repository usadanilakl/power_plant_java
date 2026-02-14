# Authentication

## Login Flow (Web)

1. Client sends `POST /api/auth/login` with `{ email, password }`
2. `AuthController` authenticates via Spring's `AuthenticationManager`
3. `UserDetailsServiceImpl` loads user by email from `UserRepo`
4. `CustomUserDetails` wraps the `User` entity for Spring Security
5. On success: Spring creates `JSESSIONID` cookie, controller returns user info:
   ```json
   { "id": 123, "name": "John", "email": "john@test.local", "role": "ROLE_EMPLOYEE", "isActive": true }
   ```
6. On failure: 401 with `{ "error": "INVALID_CREDENTIALS", "message": "Invalid email or password" }`
7. Controller updates `user.lastLoginDate` and logs the login with client IP

**File:** `controller/auth/AuthController.java` — `POST /api/auth/login`

## Desktop Auto-Auth

The `DesktopAutoAuthFilter` automatically authenticates requests from localhost without requiring login.

### How It Works

1. Filter runs **before** `UsernamePasswordAuthenticationFilter` in the chain
2. Only activates for loopback IPs: `127.0.0.1`, `0:0:0:0:0:0:0:1`, `::1`
3. If no existing authentication in SecurityContext:
   - Reads `System.getProperty("user.name")` (OS username)
   - Looks up `User` by `windowsUsername` field via `UserRepo.findByWindowsUsername()`
   - If found and active → creates `UsernamePasswordAuthenticationToken` in SecurityContext
4. Result cached per OS username to avoid DB hit on every request

### Admin Fallback (current behavior)

If no `User` matches the OS username, the filter falls back to the first active admin user (`ROLE_ADMIN`). This means **any desktop user is auto-authenticated** without needing a matching `windowsUsername` entry.

The lookup order in `resolveUser()`:
1. `userRepo.findByWindowsUsername(osUsername)` — exact match
2. `userRepo.findFirstByRoleAndIsActiveTrue("ROLE_ADMIN")` — fallback

### Desktop Auth Table

| OS Username | User.windowsUsername | Result |
|-------------|---------------------|--------|
| `usada` | `usada` | Auto-authenticated as that user |
| `dklokov` | `dklokov` | Auto-authenticated as that user |
| `anyone` | (no match) | Auto-authenticated as first active admin (fallback) |
| (any) | (remote IP) | Filter skips entirely |

### To restore strict matching (require windowsUsername)

In `DesktopAutoAuthFilter.resolveUser()`, remove the fallback block:

```java
// DELETE these lines to require exact windowsUsername match:
if (cachedUser == null) {
    cachedUser = userRepo.findFirstByRoleAndIsActiveTrue("ROLE_ADMIN");
    log.info("No user with windowsUsername='{}', falling back to admin: {}",
             windowsUsername, cachedUser != null ? cachedUser.getEmail() : "none");
}
```

With that removed, unrecognized OS usernames will see the login page instead of being auto-authenticated.

**File:** `config/security/DesktopAutoAuthFilter.java`

## Current User (/me)

`GET /api/auth/me` returns the current user's info plus their access level:

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

Access level logic:
- Has approved, non-expired `AccessGrant` → `"FULL"`
- Has pending `AccessGrant` → `"PENDING"`
- Otherwise → `"RESTRICTED"`

Note: Desktop users via auto-auth always get effective full access (bypasses `AccessGrantFilter`), but `accessLevel` in `/me` response still reflects their grant status.

## Access Grant Flow (Full Web Access)

### 1. User Requests Access

`POST /api/auth/request-access` (must be logged in)

- Creates `AccessGrant` with `status: PENDING`
- Records client IP and User-Agent
- Prevents duplicates — returns `ALREADY_PENDING` or `ALREADY_APPROVED`

### 2. Admin Approves

`POST /api/auth/admin/approve/{id}` (requires ADMIN role + LAN IP)

- Sets `status: APPROVED`
- Generates UUID `accessToken`
- Sets `expiresAt = now + 24 hours`
- Sets `lastActiveAt = now`
- Records approving admin

Response: `{ "success": true, "accessToken": "uuid...", "expiresAt": "...", "user": "email" }`

### 3. Token Validation

`AccessGrantFilter` runs **after** authentication on every request to protected endpoints:

1. Reads `ACCESS_TOKEN` cookie
2. Looks up `AccessGrant` by token
3. Validates: `status == APPROVED`, not past `expiresAt`, `lastActiveAt` within 1 hour
4. Updates `lastActiveAt` (throttled to max once per 5 minutes)
5. If invalid → 403 `{ "error": "FULL_ACCESS_REQUIRED", "message": "..." }`

### 4. Expiration & Cleanup

`AccessGrantCleanupService` runs every 5 minutes (`@Scheduled(fixedRate = 300000)`):

- Marks `APPROVED` grants as `EXPIRED` when:
  - `expiresAt` has passed (24-hour max lifetime)
  - `lastActiveAt` older than 1 hour (inactivity timeout)
- Deletes old resolved grants (>30 days) to prevent table growth

**File:** `sevice/users/AccessGrantCleanupService.java`

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
  lastActiveAt: LocalDateTime (updated on each valid request)
  approvedBy: User (FK, the admin who approved)
}
```

**File:** `entities/users/AccessGrant.java`

## Logout

`POST /api/auth/logout`

- Invalidates the HTTP session
- Deletes `JSESSIONID` and `ACCESS_TOKEN` cookies
- Returns `{ "success": true, "message": "Logged out" }`

## User Profile (Self-Service)

Authenticated users can view and edit their own profile.

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

**File:** `controller/auth/AuthController.java` — `GET/PUT /api/auth/profile`

## Angular Frontend Integration

| Component | Purpose |
|-----------|---------|
| `auth.service.ts` | Login/logout/profile API calls, `currentUser$` and `isLoggedIn$` observables |
| `auth.interceptor.ts` | Adds `withCredentials: true`, redirects on 401/403 |
| `auth.guard.ts` | Route guard: redirects to `/login` if not authenticated |
| `admin.guard.ts` | Route guard: requires `ROLE_ADMIN` |
| `login.component.ts` | Login form UI |
| `profile.component.ts` | User profile page (view info, edit name, change password) |
| `user-profile.component.ts` | Header avatar icon with dropdown (profile link + sign out) |
| `access-request.component.ts` | Request full access + status polling |
| `admin-access.component.ts` | Admin: approve/deny/revoke grants |

### User Profile Icon

The `UserProfileComponent` (in `shared/user-profile/`) renders a circular avatar with the user's initials in the main layout header. Clicking it opens a dropdown showing:
- User name, email, and role
- **My Profile** — navigates to `/profile`
- **Sign out** — calls `authService.logout()`

The dropdown closes on outside click via `@HostListener('document:click')`.

### Profile Page

Route: `/profile` (requires `authGuard`)

The `ProfileComponent` (in `features/auth/profile/`) displays:
- Header with large avatar, name, and role badge
- Read-only info: email, username, OS username, active status, last login
- Editable fields: first name, last name (with Save Changes button)
- Change password section with confirmation field

On save, calls `PUT /api/auth/profile` and refreshes the cached user via `authService.checkAuthStatus()`.
