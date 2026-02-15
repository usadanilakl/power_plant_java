# Authorization

## Roles & Permissions

| Role | Value | External (no grant) | External (with grant) | Desktop/LAN | Admin functions |
|------|-------|--------------------|-----------------------|-------------|-----------------|
| Admin | `ROLE_ADMIN` | Restricted | Full access | Full access | Yes |
| Employee | `ROLE_EMPLOYEE` | Restricted | Full access | Full access | No |
| Contractor | `ROLE_CONTRACTOR` | Restricted | Full access (if approved) | Full access | No |

- **No role-based bypass** in `AccessGrantFilter` — all roles are treated equally. Access tiers are determined by network origin (localhost/LAN/external) and grant status, not role.
- **Admin** gets extra Spring Security `hasRole()` rules: user management (`/ng/users/**`), admin pages (`/admin/**`), and grant approval endpoints (`/api/auth/admin/**`, localhost-only).
- **Employee** and **Contractor** have identical access at the filter level. Role-specific restrictions are enforced at the Spring Security authorization layer or business logic, not the access grant filter.
- **Desktop/LAN** users of all roles get full access — `AccessGrantFilter` bypasses localhost and LAN IPs entirely.

## Endpoint Access Matrix

| Endpoint Pattern | Public | Restricted | Full | Admin | LAN-only |
|-----------------|--------|-----------|------|-------|---------|
| `POST /api/auth/login` | x | | | | |
| `POST /api/auth/logout` | x | | | | |
| `GET /actuator/health` | x | | | | |
| `/app/**`, `/angular/**`, static assets | x | | | | |
| `/api/sharepoint-sync/**` | x | | | | |
| `/power-automate/**` | x | | | | |
| `GET /api/auth/me` | | x | | | |
| `POST /api/auth/request-access` | | x | | | |
| `GET /api/auth/access-status` | | x | | | |
| `GET/PUT /api/auth/profile` | | x | | | |
| `POST /api/auth/profile/change-password` | | x | | | |
| `GET /api/auth/profile/sessions` | | x | | | |
| `@RestrictedAllowed` endpoints | | x | x | | |
| `/ng/**` (remaining Angular API) | | | x | | |
| `/api/**` (remaining) | | | x | | |
| `/browser/**`, `/print/**` | | | x | | |
| `/api/auth/admin/**` | | | | x | localhost only |
| `POST /api/auth/admin/prolong/{id}` | | | | x | localhost only |
| `GET /api/auth/admin/grant-history` | | | | x | localhost only |
| `/ng/users/**` | | | | x | |
| `/admin/**`, `/users/**` | | | | x | |
| `/api/sync/**` | | | | | x |
| `/api/field-sync/**` | | | | | x |
| `/api/resync/**` | | | | | x |
| `/api/files/**` | | | | | x |
| `/api/update/**`, `/api/electron-update/**` | | | | | x |
| `/api/resource-packs/**`, `/api/sync-updates/**` | | | | | x |
| `/api/data-integrity/**`, `/api/backup/**` | | | | | x |
| `/api/attachments/**` | | | | | x |
| `/h2-console/**` | | | | | x |

## `@RestrictedAllowed` Annotation

Endpoints annotated with `@RestrictedAllowed` are accessible to restricted external users (authenticated but no grant). This is the mechanism for incrementally opening endpoints to restricted users.

- **Class-level**: all methods in the controller are accessible
- **Method-level**: only that specific method is accessible
- **Absent** (default): requires full access (secure by default)

Currently annotated:
- `RfValueController` (`/ng/rf-values/**`) — reference data for UI dropdowns
- `NgValueController` (`/ng/values/**`) — legacy value endpoints
- `AuthController` (`/api/auth/profile/sessions`) — user's own grant history (method-level)

See [Restricted Access](./restricted-access.md) for full details.

**File:** `config/security/RestrictedAllowed.java`

## SecurityFilterChain Configuration

**File:** `config/SecurityConfigSpring.java`

The filter chain is configured in this order:

1. **CORS** — configurable allowed origins via `security.cors.allowed-origins`
2. **Session** — `IF_REQUIRED`, unlimited concurrent sessions (`maximumSessions(-1)`)
3. **CSRF** — disabled for API/sync endpoints
4. **Frame options** — disabled (for H2 console)
5. **Authorization rules** — endpoint matchers in order:
   - Public endpoints → `permitAll()`
   - LAN-only endpoints → custom `lanOnlyMatcher()` → `permitAll()` (only if internal IP)
   - Localhost admin → `localhostMatcher("/api/auth/admin/")` → `hasRole("ADMIN")`
   - Non-localhost admin fallback → `"/api/auth/admin/**"` → `denyAll()`
   - Admin pages → `hasRole("ADMIN")` (`/admin/**`, `/users/**`, `/ng/users/**`)
   - Auth endpoints → `authenticated()` (`/api/auth/**`)
   - Everything else → `authenticated()`
6. **Exception handling** — REST JSON responses (not redirects):
   - 401: `{ "error": "UNAUTHORIZED", "message": "Authentication required" }`
   - 403: `{ "error": "ACCESS_DENIED", "message": "Insufficient permissions" }`
7. **Logout** — deletes `JSESSIONID` + `ACCESS_TOKEN` cookies
8. **Custom filters**:
   - `DesktopAutoAuthFilter` → before `UsernamePasswordAuthenticationFilter`
   - `AccessGrantFilter` → after `UsernamePasswordAuthenticationFilter`

## LAN IP Detection

**File:** `config/NetworkUtils.java`

`NetworkUtils.isInternalRequest(request)` checks if a request originates from an internal network:

| Range | Type |
|-------|------|
| `127.0.0.0/8` | IPv4 loopback |
| `::1`, `0:0:0:0:0:0:0:1` | IPv6 loopback |
| `10.0.0.0/8` | RFC 1918 Class A |
| `172.16.0.0/12` | RFC 1918 Class B |
| `192.168.0.0/16` | RFC 1918 Class C |
| `169.254.0.0/16` | Link-local |

IP resolution order:
1. `X-Forwarded-For` header (first IP if comma-separated)
2. `request.getRemoteAddr()` fallback

## AccessGrantFilter Decision Flow

The filter processes requests in this exact order:

```
Request
  │
  ├─ Exempt path? (/api/auth/*, static, sync, etc.) ──► PASS
  │
  ├─ Localhost? ──► PASS (full access)
  │
  ├─ LAN (internal IP)? ──► PASS (full access)
  │
  ├─ Not authenticated? ──► PASS (Spring Security handles 401)
  │
  ├─ @RestrictedAllowed annotation? ──► PASS (restricted users allowed)
  │
  ├─ ACCESS_TOKEN cookie present?
  │     ├─ Valid grant (APPROVED, not expired) ──► PASS + update lastActiveAt
  │     └─ Invalid/expired ──► 403 FULL_ACCESS_REQUIRED
  │
  └─ No cookie ──► 403 FULL_ACCESS_REQUIRED
```

When validation fails, the filter returns:
```json
{ "error": "FULL_ACCESS_REQUIRED", "message": "Full access required. Request access from an administrator." }
```

**File:** `config/security/AccessGrantFilter.java`

## LAN-Only Matcher

The `lanOnlyMatcher()` in `SecurityConfigSpring` creates a `RequestMatcher` that:
1. Checks if request path matches any LAN-only prefix
2. Checks if request IP is internal via `NetworkUtils.isInternalRequest()`
3. Only matches (permits) if **both** path and IP match

External IPs hitting LAN-only paths fall through to the `anyRequest().authenticated()` rule, which returns 401/403.

## Localhost Matcher

The `localhostMatcher()` in `SecurityConfigSpring` creates a `RequestMatcher` that:
1. Checks if request path matches the prefix (`/api/auth/admin/`)
2. Checks if request IP is loopback via `NetworkUtils.isLoopbackRequest()`
3. Only matches if **both** path and IP match

Non-localhost requests to `/api/auth/admin/**` fall through to the `denyAll()` rule, blocking LAN and external access to admin grant endpoints.
