# Security Settings & Configuration

## Application Properties

### CORS

```properties
# Comma-separated origin patterns (supports wildcards like http://localhost:*)
security.cors.allowed-origins=http://localhost:*,https://dk-power.github.io
```

Read by `SecurityConfigSpring` via `@Value`. Applied to all endpoints via `CorsConfigurationSource`.

Allowed methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
Allowed headers: `authorization`, `content-type`, `x-auth-token`, `X-Machine-Id`, `X-Machine-Name`, `X-Device-Number`
Credentials: enabled (`withCredentials: true`)

### Session

```properties
# HTTP session timeout (also controls JSESSIONID cookie lifetime)
server.servlet.session.timeout=24h
```

Session creation policy: `IF_REQUIRED` — created on login, not on every request.
Maximum concurrent sessions per user: 5.

### Password Encoding

BCrypt with default strength (10 rounds). Bean defined in `SecurityConfigSpring`:

```java
@Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}
```

### Access Grant Timeouts

Hardcoded in the relevant classes (not externalized to properties):

| Timeout | Value | Location |
|---------|-------|----------|
| Grant max lifetime | 24 hours | `AccessAdminController.approve()`: `now.plusHours(24)` |
| Inactivity timeout | 1 hour | `AccessGrantFilter`: `lastActiveAt.plusHours(1)` |
| Activity update throttle | 5 minutes | `AccessGrantFilter`: `lastActiveAt` comparison |
| Cleanup interval | 5 minutes | `AccessGrantCleanupService`: `@Scheduled(fixedRate = 300000)` |
| Old grant deletion | 30 days | `AccessGrantCleanupService`: `now.minusDays(30)` |

### CSRF

Disabled for all API and sync endpoints:
```
/api/**, /ng/**, /power-automate/**, /h2-console/**,
/browser/**, /print/**, /work-request/**, /work-requests-api/**,
/api-lotos/**, /red-tag-controls/**, /jha-api/**, /images-api/**, /server/**
```

## Spring Security Filter Order

```
Request
  ↓
CorsFilter
  ↓
DesktopAutoAuthFilter  ← before UsernamePasswordAuthenticationFilter
  ↓                       (auto-auth for localhost via OS username)
UsernamePasswordAuthenticationFilter
  ↓
AccessGrantFilter      ← after UsernamePasswordAuthenticationFilter
  ↓                       (validates ACCESS_TOKEN for full-access endpoints)
AuthorizationFilter    ← Spring Security's built-in authorization
  ↓
Controller
```

## Profile Behavior

| Profile | Database | Cleanup on Start | Admin Seeded |
|---------|----------|-----------------|-------------|
| `test` | `./db/testdb` | Yes (DB deleted) | Yes (re-created every start) |
| `dev` | `./db/devdb` | No | Yes (first start only) |
| `prod` | `./db/proddb` | No | Yes (first start only) |
| `hub` | Same as active profile | No | Yes (first start only) |

Hub mode is configured via `sync.role=hub` (not a separate Spring profile). The admin seeder runs regardless of sync role.

## Angular Configuration

### Auth Interceptor

**File:** `frontend/src/app/interceptors/auth.interceptor.ts`

Added to `app.config.ts` via `withInterceptors([authInterceptor])`.

Behavior:
- Adds `withCredentials: true` to all HTTP requests (sends cookies cross-origin)
- On 401 response → redirects to `/login` (with `returnUrl` query param)
- On 403 with `FULL_ACCESS_REQUIRED` error → redirects to `/access-request`

### Route Guards

**File:** `frontend/src/app/guards/auth.guard.ts`
- Checks `authService.isLoggedIn$`
- Redirects to `/login` with return URL if not authenticated

**File:** `frontend/src/app/guards/admin.guard.ts`
- Checks `user.role === 'ROLE_ADMIN'`
- Redirects to `/` if not admin

### Route Configuration

**File:** `frontend/src/app/app.routes.ts`

- `/login` — public (no guard)
- `/profile` — requires `authGuard` (self-service profile page)
- `/access-request` — requires `authGuard`
- `/admin/access-management` — requires `authGuard` + `adminGuard`
- All feature routes — wrapped with `authGuard`

### Header User Profile Icon

**File:** `frontend/src/app/shared/user-profile/user-profile.component.ts`

Circular avatar with user initials displayed in the main layout header (rightmost action). Dropdown menu contains:
- User info (name, email, role)
- My Profile → navigates to `/profile`
- Sign out → calls `authService.logout()`

## Environment Variables

| Variable | Default | Purpose |
|----------|---------|---------|
| `APP_HOST` | `default` | Application host identifier |
| `DEVICE_CONFIG` | `opi` | Device-specific config file to load |

No security-specific environment variables — credentials are externalized to `application-secrets.properties` (see [secrets.md](../secrets.md)).
