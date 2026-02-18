# User Management

## Admin User Seeder

**File:** `config/AdminUserSeeder.java`

On every application startup, the `AdminUserSeeder` idempotently ensures default admin users exist. This solves the chicken-and-egg problem: user creation requires ADMIN role, but no admin exists on a fresh database.

### Behavior

- Listens for `ApplicationReadyEvent` (fires after Hibernate schema update + `SequenceInitializer`)
- Wrapped in `SyncContext` to suppress FieldChange generation — seeded users are local bootstrap data and should NOT sync to other machines
- Wrapped in try-catch so seeder failure is **non-fatal** (logged but doesn't crash the app)
- Checks by `windowsUsername` (not email) to detect both seeded and synced users — if sync has already brought the real user, skips seeding to avoid conflicts
- Uses machine-specific email (`{username}-{machineId}@localhost`) to avoid unique constraint conflicts when synced users arrive from other machines

Seeds two users:

| windowsUsername | username | name | role |
|-----------------|----------|------|------|
| `usada` | `admin` | System Administrator | `ROLE_ADMIN` |
| `dklokov` | `dklokov` | D Klokov | `ROLE_ADMIN` |

Email format: `admin-OPI@localhost` (where `OPI` is from `sync.machine.id`)

- Works across all profiles (test, dev, prod, hub) — no conditional logic needed
- Test profile deletes the DB on startup → seeder re-creates admins every time
- Production: creates once, then skips on all subsequent starts
- Uses `findFirstByWindowsUsernameOrderByIdAsc` (duplicate-tolerant query) to prevent crashes if duplicate users exist from sync

### Changing the Default Password

After first startup, change the password via the profile page at `/profile`, or directly via API:

```
PUT /api/auth/profile
{ "password": "newSecurePassword" }
```

Admins can also update any user's password via `PUT /ng/users/{id}`.

## User Entity

**File:** `entities/users/User.java`

```
User extends BaseAuditEntity {
  username: String
  firstName: String
  lastName: String
  name: String          — computed: firstName + " " + lastName
  email: String         — unique, not null (login identifier — can also login by username)
  role: String          — "ROLE_ADMIN" | "ROLE_EMPLOYEE" | "ROLE_CONTRACTOR"
  password: String      — BCrypt-encoded, never exposed in API responses
  isActive: Boolean     — soft-disable (user can't login)
  lastLoginDate: LocalDateTime
  windowsUsername: String  — maps OS user for desktop auto-auth
}
```

Inherits from `BaseAuditEntity`: `id`, `deleted`, `dateCreated`, `dateModified`, `createdBy`, `modifiedBy`

## User CRUD API

**File:** `controller/angular/NgUserController.java` — all endpoints require `ROLE_ADMIN`

| Method | Path | Purpose |
|--------|------|---------|
| GET | `/ng/users/paginated?page=1&pageSize=50` | Paginated user list (sorted by name) |
| GET | `/ng/users/{id}` | Get user by ID |
| POST | `/ng/users` | Create user (BCrypt password) |
| PUT | `/ng/users/{id}` | Update user (selective fields, optional password) |
| DELETE | `/ng/users/{id}` | Soft delete (sets `deleted=true`, `isActive=false`) |
| GET | `/ng/users/roles` | Available roles list |

### Create User Request

```json
{
  "username": "john.doe",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john@example.com",
  "role": "ROLE_EMPLOYEE",
  "password": "securePassword123",
  "windowsUsername": "JOHN.DOE"
}
```

### Response Format

All responses use `NgApiResponse<T>`:
```json
{
  "data": { ... },
  "message": "User created successfully"
}
```

### Validation

- Email uniqueness enforced — returns 400 `"Email already exists"`
- Password hashed via `BCryptPasswordEncoder` on create and update
- Password field is **never** included in `UserDto` responses

## Desktop Auto-Auth Mapping

To enable desktop auto-auth for a user:

1. Find the OS username: `System.getProperty("user.name")` → e.g., `usada`
2. Set the user's `windowsUsername` field to match
3. On next localhost request, `DesktopAutoAuthFilter` auto-authenticates

Multiple users can have the same `windowsUsername` — `findFirstByWindowsUsernameOrderByIdAsc` returns the lowest-ID match (duplicate-tolerant).

## Self-Service Profile API

Any authenticated user can view and update their own profile via `/api/auth/profile`.

| Method | Path | Fields | Notes |
|--------|------|--------|-------|
| GET | `/api/auth/profile` | All user fields | Returns full profile for current user |
| PUT | `/api/auth/profile` | `firstName`, `lastName`, `password` | Only non-null fields applied; password is BCrypt-encoded |

Users **cannot** change their own `role`, `email`, `isActive`, or `windowsUsername` — those require admin access via `PUT /ng/users/{id}`.

**Angular:** Profile page at `/profile` route. Header avatar dropdown links to it.

**Files:**
- `controller/auth/AuthController.java` — `GET/PUT /api/auth/profile`
- `features/auth/profile/profile.component.ts` — profile page UI
- `shared/user-profile/user-profile.component.ts` — header avatar icon + dropdown

## User DTO

**File:** `dto/users/UserDto.java`

Fields exposed in API responses:
- `username`, `firstName`, `lastName`, `email`, `role`, `isActive`, `lastLoginDate`, `windowsUsername`
- **No `password` field** — removed for security

## Repository

**File:** `repository/users/UserRepo.java`

Key methods (all single-return queries use `findFirstBy*OrderByIdAsc` for duplicate tolerance):
- `findFirstByEmailOrderByIdAsc(String)` — login lookup (primary)
- `findFirstByUsernameOrderByIdAsc(String)` — login lookup (fallback when email not found)
- `findFirstByWindowsUsernameOrderByIdAsc(String)` — desktop auto-auth lookup
- `existsByEmail(String)` — duplicate check on create
- `existsByUsername(String)` — duplicate check on create
- `updateLastLoginDate(LocalDateTime, String)` — lightweight login timestamp update by email
- `updateLastLoginById(LocalDateTime, Long)` — lightweight login timestamp update by user ID (used when login credential may be username)
