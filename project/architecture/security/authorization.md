# Authorization

## Roles & Permissions

| Role | Value | Web (no grant) | Web (with grant) | Desktop (localhost) | Admin functions |
|------|-------|---------------|-----------------|--------------------| --------------- |
| Admin | `ROLE_ADMIN` | Full access | Full access | Full access | Yes |
| Employee | `ROLE_EMPLOYEE` | Restricted | Full access | Full access | No |
| Contractor | `ROLE_CONTRACTOR` | Restricted | Restricted | Restricted | No |

- **Admin** always bypasses `AccessGrantFilter` regardless of token status
- **Employee** needs an approved `AccessGrant` for full web access, but gets full access on desktop via auto-auth
- **Contractor** is always restricted to read-only subset — cannot request or receive full access

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
| `/ng/**` (Angular API) | | | x | | |
| `/api/**` (remaining) | | | x | | |
| `/browser/**`, `/print/**` | | | x | | |
| `/api/auth/admin/**` | | | | x | x |
| `/ng/users/**` | | | | x | |
| `/admin/**`, `/users/**` | | | | x | |
| `/api/sync/**` | | | | | x |
| `/api/field-sync/**` | | | | | x |
| `/api/resync/**` | | | | | x |
| `/api/files/**` | | | | | x |
| `/api/update/**` | | | | | x |
| `/h2-console/**` | | | | | x |

## SecurityFilterChain Configuration

**File:** `config/SecurityConfigSpring.java`

The filter chain is configured in this order:

1. **CORS** — configurable allowed origins via `security.cors.allowed-origins`
2. **Session** — `IF_REQUIRED`, max 5 concurrent sessions per user
3. **CSRF** — disabled for API/sync endpoints
4. **Frame options** — disabled (for H2 console)
5. **Authorization rules** — endpoint matchers in order:
   - Public endpoints → `permitAll()`
   - LAN-only endpoints → custom `lanOnlyMatcher()` → `permitAll()` (only if internal IP)
   - Admin endpoints → `hasRole("ADMIN")`
   - Auth endpoints → `authenticated()`
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

## AccessGrantFilter Bypass Rules

The filter skips validation for:

- **Loopback IPs** — desktop has full access
- **LAN IPs** — internal network has full access
- **ADMIN role** — admins always have full access
- **Exempt paths** — auth endpoints, public endpoints, static resources, sync endpoints
- **Unauthenticated requests** — Spring Security handles 401 before this filter runs

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
