# Security System Overview

## Status: DONE

The power plant application uses a **4-tier access model** to protect the hub when it's internet-exposed. All tiers are implemented end-to-end: Spring Security filter chain, custom filters, REST controllers, Angular guards/interceptors, and scheduled cleanup.

## 4-Tier Access Model

| Tier | Who | Authentication | Access Level |
|------|-----|---------------|-------------|
| **Public** | Anyone | None | SharePoint webhooks, health check, login endpoint |
| **Restricted** | Logged-in user | Email + password → `JSESSIONID` cookie | Own permits/logs (read-only), request full access |
| **Full Web** | Approved user | Login + admin-approved `ACCESS_TOKEN` cookie | Full CRUD via Angular |
| **Full Desktop** | Local operator | Auto-auth via Windows username | Full CRUD locally |

## Auth Flow

```
                        INTERNET
  ┌──────────────────────────────────────────────────────┐
  │  Browser ──HTTPS──► Hub:8082                         │
  │    1. POST /api/auth/login → JSESSIONID (Restricted) │
  │    2. POST /api/auth/request-access → PENDING        │
  │    3. Admin on LAN approves → ACCESS_TOKEN (Full)    │
  └──────────────────────────────────────────────────────┘

                        LAN (plant network)
  ┌──────────────────────────────────────────────────────┐
  │  Desktop (Electron) ──► localhost:8082               │
  │    Auto-auth: OS username → User.windowsUsername     │
  │    Full access without login                         │
  │                                                      │
  │  Sync: /api/sync/**, /api/field-sync/**              │
  │    LAN IP whitelist, no auth needed                  │
  │                                                      │
  │  Admin: /api/auth/admin/** (LAN + ROLE_ADMIN)        │
  │    Approve/deny/revoke web access requests           │
  └──────────────────────────────────────────────────────┘
```

## Cookies

| Cookie | Purpose | Lifetime |
|--------|---------|----------|
| `JSESSIONID` | Spring Security session (login state) | 24h (configurable) |
| `ACCESS_TOKEN` | Full web access grant (UUID → DB lookup) | 24h max, 1h inactivity |

Both cookies are HTTP-only (set by Spring Security). Full web access requires **both** cookies + a valid `AccessGrant` in the database.

## Roles

| Role | Value | Web Access | Desktop Access |
|------|-------|-----------|----------------|
| Admin | `ROLE_ADMIN` | Full + user management + access approval | Full (auto-auth) |
| Employee | `ROLE_EMPLOYEE` | Full (requires admin approval) | Full (auto-auth) |
| Contractor | `ROLE_CONTRACTOR` | Restricted only (read-only) | Restricted |

## Endpoint Access Map

| Category | Endpoints | Auth Required |
|----------|-----------|--------------|
| Public | `/api/auth/login`, `/api/auth/logout`, `/actuator/health`, `/app/**`, `/api/sharepoint-sync/**`, `/power-automate/**` | None |
| LAN-only | `/api/sync/**`, `/api/field-sync/**`, `/api/resync/**`, `/api/files/**`, `/api/update/**`, `/h2-console/**` | IP whitelist (RFC 1918) |
| Restricted | `/api/auth/me`, `/api/auth/profile`, `/api/auth/request-access`, `/api/auth/access-status` | Session cookie |
| Full access | `/ng/**`, `/api/**`, `/browser/**`, `/print/**` | Session + AccessGrant (or localhost) |
| Admin | `/api/auth/admin/**`, `/ng/users/**`, `/admin/**` | ROLE_ADMIN + LAN |

## Key Files

| File | Purpose |
|------|---------|
| `config/SecurityConfigSpring.java` | SecurityFilterChain, BCrypt, CORS |
| `config/security/DesktopAutoAuthFilter.java` | Localhost auto-auth via OS username |
| `config/security/AccessGrantFilter.java` | ACCESS_TOKEN cookie validation |
| `config/NetworkUtils.java` | LAN IP detection |
| `config/AdminUserSeeder.java` | Seed default admin on startup |
| `controller/auth/AuthController.java` | Login, /me, profile, request-access |
| `controller/auth/AccessAdminController.java` | Approve/deny/revoke grants |
| `controller/angular/NgUserController.java` | User CRUD (admin) |
| `entities/users/AccessGrant.java` | Access grant entity |
| `sevice/users/AccessGrantCleanupService.java` | Scheduled expiration cleanup |

## Detail Documentation

- [Authentication](./authentication.md) — Login flows, desktop auto-auth, token lifecycle
- [Authorization](./authorization.md) — Roles, endpoint rules, filter chain
- [User Management](./user-management.md) — User CRUD, admin seeding, desktop mapping
- [Settings](./settings.md) — Configuration properties reference
- [Testing](./testing.md) — E2E test suite, running tests
