# Security E2E Test Suite

## Overview

The security system is tested end-to-end using Playwright. Tests exercise the actual Spring Boot API endpoints — no mocks. Tests are located in `automation-test/tests/auth/`.

## Prerequisites

1. Spring Boot running on `http://localhost:8082`
2. `AdminUserSeeder` has run (default admin user exists)
3. Playwright installed: `cd automation-test && npm install`

## Running Tests

```bash
cd automation-test

# Run all auth tests
npm run test:auth

# Run with visible browser
npm run test:auth:headed

# Run specific test file
npm run test:auth:login
npm run test:auth:access
npm run test:auth:users
npm run test:auth:desktop
npm run test:auth:protection

# Run single test by name
npm run test:one -- "should login with valid admin credentials"
```

## Test Files

| File | Tests | What It Covers |
|------|-------|---------------|
| `auth-login.spec.ts` | 6 | Login success/failure, /me endpoint, logout |
| `auth-access-grant.spec.ts` | 5 | Request access, approve, deny, revoke, duplicates |
| `auth-user-crud.spec.ts` | 7 | Create, read, update, delete users, roles |
| `auth-desktop-auto.spec.ts` | 4 | Desktop auto-auth via localhost, admin access |
| `auth-endpoint-protection.spec.ts` | 6 | Public/admin/auth endpoint rules, role enforcement |

## Page Object

**File:** `automation-test/pages/auth.page.ts`

`AuthPage` extends `BasePage` and provides typed API wrappers:

### Auth Methods
| Method | Endpoint |
|--------|----------|
| `login(email, password)` | `POST /api/auth/login` |
| `logout()` | `POST /api/auth/logout` |
| `getCurrentUser()` | `GET /api/auth/me` |
| `getProfile()` | `GET /api/auth/profile` |
| `updateProfile(data)` | `PUT /api/auth/profile` |
| `requestAccess()` | `POST /api/auth/request-access` |
| `getAccessStatus()` | `GET /api/auth/access-status` |

### Admin Methods
| Method | Endpoint |
|--------|----------|
| `getPendingRequests()` | `GET /api/auth/admin/pending` |
| `getActiveGrants()` | `GET /api/auth/admin/active-grants` |
| `approveRequest(id)` | `POST /api/auth/admin/approve/{id}` |
| `denyRequest(id)` | `POST /api/auth/admin/deny/{id}` |
| `revokeGrant(id)` | `POST /api/auth/admin/revoke/{id}` |

### User CRUD Methods
| Method | Endpoint |
|--------|----------|
| `createUser(data)` | `POST /ng/users` |
| `getUsers(page, size)` | `GET /ng/users/paginated` |
| `getUser(id)` | `GET /ng/users/{id}` |
| `updateUser(id, data)` | `PUT /ng/users/{id}` |
| `deleteUser(id)` | `DELETE /ng/users/{id}` |
| `getRoles()` | `GET /ng/users/roles` |

### Helpers
| Method | Purpose |
|--------|---------|
| `loginAsAdmin()` | Login with seeded admin credentials |
| `createTestEmployee(suffix)` | Create a test employee user |
| `createTestContractor(suffix)` | Create a test contractor user |

Default admin credentials: `admin@power-plant.local` / `admin`

## Test Patterns

### Multi-User Tests

Tests that involve multiple users (e.g., admin approves employee's request) use separate browser contexts to maintain independent sessions:

```typescript
// Admin context
const adminContext = await browser.newContext();
const adminPage = await adminContext.newPage();
const adminAuth = new AuthPage(adminPage);
await adminAuth.loginAsAdmin();

// Employee context (separate session)
const empContext = await browser.newContext();
const empPage = await empContext.newPage();
const empAuth = new AuthPage(empPage);
await empAuth.login(empEmail, 'password123');

// Clean up
await empContext.close();
await adminContext.close();
```

### Desktop Auto-Auth Behavior

Since Playwright runs on the same machine as Spring Boot, all requests come from `127.0.0.1`. The `DesktopAutoAuthFilter` auto-authenticates these as the admin user (whose `windowsUsername` matches the OS user). This means:

- Tests for "unauthenticated" behavior use separate browser contexts
- True external-IP testing requires a different network setup
- Desktop auto-auth tests verify the happy path directly

### Test Data Isolation

Test data uses `Date.now()` suffixes for unique emails/usernames. Soft-deleted users remain in the DB but are hidden by `@Where(clause = "deleted = false")`.

## Adding New Tests

1. Add test methods to existing spec files, or create new `.spec.ts` in `tests/auth/`
2. Use `AuthPage` for all API calls (don't hardcode URLs)
3. Use `browser.newContext()` for multi-user scenarios
4. Clean up test data in `test.afterEach()` if needed
5. Add npm scripts to `package.json` for new test files

## Configuration

**File:** `automation-test/test.config.ts`

```typescript
export const config = {
  clientBackendUrl: process.env.CLIENT_BACKEND_URL || 'http://localhost:8082',
  syncServerUrl: process.env.SYNC_SERVER_URL || 'http://localhost:8090',
  frontendUrl: process.env.BASE_URL || 'http://localhost:4200',
};
```

Override with environment variables for different environments.
