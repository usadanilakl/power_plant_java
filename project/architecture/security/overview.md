# Security System Overview

## Status: DONE

The power plant application uses a **4-tier access model** to protect the hub when it's internet-exposed. All tiers are implemented end-to-end: Spring Security filter chain, custom filters, REST controllers, Angular guards/interceptors, and scheduled cleanup.

## 4-Tier Access Model

| Tier | Who | Authentication | Access Level |
|------|-----|---------------|-------------|
| **Public** | Anyone | None | SharePoint webhooks, health check, login endpoint |
| **Restricted** | Logged-in external user | Email/username + password → `JSESSIONID` cookie | `@RestrictedAllowed` endpoints + `/api/auth/*`, request full access |
| **Full Web** | Approved external user | Login + admin-approved `ACCESS_TOKEN` cookie | Full CRUD via Angular |
| **Full Desktop/LAN** | Local operator / LAN user | Desktop: auto-auth via Windows username. LAN: manual login | Full CRUD |

## Auth Flow

```
                        INTERNET
  ┌──────────────────────────────────────────────────────┐
  │  Browser ──HTTPS──► Hub:8082                         │
  │    1. POST /api/auth/login → JSESSIONID (Restricted) │
  │    2. POST /api/auth/request-access → PENDING        │
  │    3. Admin on localhost approves → ACCESS_TOKEN      │
  └──────────────────────────────────────────────────────┘

                        LAN (plant network)
  ┌──────────────────────────────────────────────────────┐
  │  Desktop (Electron) ──► localhost:8082               │
  │    Auto-auth: OS username → User.windowsUsername     │
  │    Full access without login                         │
  │                                                      │
  │  LAN user ──► 10.x.x.x:8082                         │
  │    Manual login → full access (no grant needed)      │
  │                                                      │
  │  Sync: /api/sync/**, /api/field-sync/**              │
  │    LAN IP whitelist, no auth needed                  │
  │                                                      │
  │  Admin: /api/auth/admin/** (localhost + ROLE_ADMIN)   │
  │    Approve/deny/revoke web access requests           │
  └──────────────────────────────────────────────────────┘
```

## Cookies

| Cookie | Purpose | Lifetime |
|--------|---------|----------|
| `JSESSIONID` | Spring Security session (login state) | 24h (configurable) |
| `ACCESS_TOKEN` | Full web access grant (UUID → DB lookup) | 24h max, 1h inactivity |

Both cookies are HTTP-only (set by Spring Security). Full web access from external requires **both** cookies + a valid `AccessGrant` in the database.

## Roles

| Role | Value | External (no grant) | External (with grant) | Desktop/LAN |
|------|-------|--------------------|-----------------------|-------------|
| Admin | `ROLE_ADMIN` | Restricted + admin grant approval (localhost only) | Full + user management | Full (auto-auth) |
| Employee | `ROLE_EMPLOYEE` | Restricted | Full | Full (auto-auth) |
| Contractor | `ROLE_CONTRACTOR` | Restricted | Full (if approved) | Full (on LAN/localhost) |

All roles are equal at the `AccessGrantFilter` level — no role-based bypass. Access tiers are determined by **network origin** (localhost/LAN/external) and **grant status**, not role. Roles only matter for Spring Security's `hasRole()` rules (admin pages, user management).

## Restricted Access (`@RestrictedAllowed`)

External users without a grant can access endpoints annotated with `@RestrictedAllowed`. This is the mechanism for building out the restricted area incrementally. See [Restricted Access](./restricted-access.md) for details.

Currently annotated controllers:
- `RfValueController` (`/ng/rf-values/**`) — reference data (categories/values for UI dropdowns)
- `NgValueController` (`/ng/values/**`) — legacy value endpoints
- `AuthController` (`/api/auth/profile/sessions`) — user's own grant history (method-level)

## Endpoint Access Map

| Category | Endpoints | Auth Required |
|----------|-----------|--------------|
| Public | `/api/auth/login`, `/api/auth/logout`, `/api/auth/forgot-password`, `/api/auth/reset-password`, `/actuator/health`, `/app/**`, `/api/sharepoint-sync/**`, `/power-automate/**` | None |
| LAN-only | `/api/sync/**`, `/api/field-sync/**`, `/api/resync/**`, `/api/files/**`, `/api/update/**`, `/api/electron-update/**`, `/api/resource-packs/**`, `/api/sync-updates/**`, `/api/data-integrity/**`, `/api/backup/**`, `/api/attachments/**`, `/h2-console/**` | IP whitelist (RFC 1918) |
| Restricted (exempt) | `/api/auth/*` (me, profile, profile/change-password, request-access, access-status) | Session cookie |
| Restricted (annotated) | `@RestrictedAllowed` controllers/methods (currently: `/ng/rf-values/**`, `/ng/values/**`, `/api/auth/profile/sessions`) | Session cookie |
| Full access | All other `/ng/**`, `/api/**`, `/browser/**`, `/print/**` | Session + AccessGrant (or localhost/LAN) |
| Admin | `/api/auth/admin/**` (approve, deny, revoke, prolong, grant-history) | ROLE_ADMIN + **localhost only** |
| Admin pages | `/ng/users/**`, `/admin/**`, `/users/**` | ROLE_ADMIN |

## Key Files

| File | Purpose |
|------|---------|
| `config/SecurityConfigSpring.java` | SecurityFilterChain, BCrypt, CORS |
| `config/security/DesktopAutoAuthFilter.java` | Localhost auto-auth via OS username |
| `config/security/AccessGrantFilter.java` | ACCESS_TOKEN validation + `@RestrictedAllowed` check |
| `config/security/RestrictedAllowed.java` | Annotation for restricted-tier endpoint access |
| `config/NetworkUtils.java` | LAN IP detection |
| `config/AdminUserSeeder.java` | Seed default admin on startup |
| `controller/auth/AuthController.java` | Login (email/username), /me, profile, request-access, forgot-password, reset-password |
| `controller/auth/AccessAdminController.java` | Approve/deny/revoke grants |
| `controller/angular/NgUserController.java` | User CRUD (admin) |
| `entities/users/AccessGrant.java` | Access grant entity |
| `entities/users/PasswordResetToken.java` | Password reset token entity (1h expiry, single-use) |
| `repository/users/PasswordResetTokenRepository.java` | Token lookup by UUID |
| `sevice/users/AccessGrantCleanupService.java` | Scheduled expiration cleanup |
| `frontend/.../guards/full-access.guard.ts` | Route guard for full-access-only routes |

## Detail Documentation

- [Authentication](./authentication.md) — Login flows (email/username), desktop auto-auth, forgot/reset password, token lifecycle
- [Authorization](./authorization.md) — Roles, endpoint rules, filter chain
- [Restricted Access](./restricted-access.md) — `@RestrictedAllowed` annotation, frontend guards, extending the restricted area
- [User Management](./user-management.md) — User CRUD, admin seeding, desktop mapping
- [Settings](./settings.md) — Configuration properties reference
- [Testing](./testing.md) — E2E test suite, running tests
- [External Tunnel](./external-tunnel.md) — LocalXpose tunnel for testing external access tiers
