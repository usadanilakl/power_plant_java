# User Onboarding & Account Lifecycle

Companion to [pin-authentication.md](pin-authentication.md). The PIN spec
defines the credentials and the step-up flow; this doc defines *how a
person becomes a user that can use those credentials*, and what they're
allowed to do at each stage.

Status: **PLAN — NOT IMPLEMENTED.** Today the system has admin-only user
creation, password reset, PIN management, role assignment — but no real
onboarding flow that ties them into a sequence with gates. This doc lays
out what to build.

---

## 1. Goals

- Replace the ad-hoc "admin opens user form and fills in 15 fields" with
  a typed, gated onboarding pipeline.
- Track which onboarding steps each user has completed so the UI can
  show **what's blocking them from acting**.
- Cover the contractor case: short-lived accounts with PIN-only auth
  (no password / no email login).
- Make training expiry visible and enforceable.
- Surface inactive / never-logged-in accounts to admins so they can be
  cleaned up.

---

## 2. User states

A user is in exactly one state at a time. The state is derived from
fields on `User`, not stored as a single column (so we can reconstruct
it after migration without breaking sync).

| State                | Derived from                                                                 | Can they…                          |
| -------------------- | ---------------------------------------------------------------------------- | ---------------------------------- |
| `INVITED`            | account created, password never set, never logged in                         | sign in (one-time invite link)     |
| `SETUP`              | logged in but `signingInitials == null` or `pinSetAt == null`                | use the app at restricted level    |
| `TRAINING_REQUIRED`  | `signingInitials` + `pinSetAt` set, role requires training, training missing | use the app, **NOT** LOTO actions  |
| `TRAINING_EXPIRED`   | training was set, `trainingExpiresAt < now()`                                | use the app, **NOT** LOTO actions  |
| `ACTIVE`             | all gates passed                                                             | full role-based access             |
| `DEACTIVATED`        | `isActive = false` OR `windowsUsername` flagged as left                      | nothing                            |

Contractor flavor — same states, but `SETUP → ACTIVE` skips the password
step and goes straight to PIN-only.

---

## 3. Account creation paths

### 3.1 Admin-create (current, keep)
Admin fills user-detail form, sets name/email/role, saves. State: `INVITED`.

### 3.2 Self-signup (NEW, optional, off by default)
Public `/auth/signup` endpoint behind a feature flag.

- Allowed only when `auth.signup.enabled=true` AND request comes from the
  plant network (existing `AccessGrantFilter` handles this).
- Captures: name, email, windowsUsername, requested role(s).
- Creates a `User` with `isActive = false` AND an `AccessGrant` request
  in `PENDING` status (reuses the existing approval infrastructure).
- Admin sees a pending-signup list and approves. Approval flips
  `isActive = true` and assigns roles.

### 3.3 Bulk plant seed (current, keep)
`seedPlantUsers` endpoint — admin-only. Creates accounts in bulk from a
list. Skips existing.

### 3.4 Contractor flow (NEW)
Admin enters at the gatehouse: name, company, expected duration, optional
windowsUsername. Creates a `User` with:
- `password = null` (no email/password login allowed)
- `role = "CONTRACTOR"` (new system role; OSHA-Affected by default)
- `signingInitials` assigned
- PIN generated and printed/handed to contractor
- `validUntilDate` set (NEW field)
- `pinMustChange = true` so first PIN sign-on forces a change

The contractor can sign on/off LOTOs by PIN but cannot log into the web
app with a password.

---

## 4. Onboarding pipeline (after account exists)

```
Account created (INVITED)
    │
    ▼  user clicks invite link or sets password
   SETUP
    │
    ├── admin assigns signing initials  (admin UI, existing)
    │
    ├── admin generates initial PIN     (admin UI, existing; pinMustChange=true)
    │
    ├── user receives PIN out-of-band, signs in, profile prompts PIN change
    │
    ├── user changes PIN                (profile UI, existing)
    │       ↓ pinMustChange = false
    │
    ├── (optional) admin records training completion
    │       ↓ trainingCompletedAt = now, trainingExpiresAt = +1y
    │
    └── admin assigns LOTO role(s)      (admin UI, existing)
            ↓
         ACTIVE
```

Each step writes a row to a new `UserOnboardingEvent` table so we have
an audit trail: who completed which step, when. (Or — simpler — just
log to existing audit infrastructure; revisit if we want a UI for it.)

---

## 5. New fields on `User`

| Field                | Type             | Purpose                                                        |
| -------------------- | ---------------- | -------------------------------------------------------------- |
| `accountType`        | enum             | `FULL_EMPLOYEE` / `CONTRACTOR` (controls login style)          |
| `validUntilDate`     | LocalDate        | Hard expiry for contractor accounts; null for full employees   |
| `invitedAt`          | LocalDateTime    | When the account was created                                   |
| `setupCompletedAt`   | LocalDateTime    | When initials + PIN were both set                              |

(`pinMustChange`, `signingInitials`, `pinSetAt`, `pinLockedUntil`,
`pinResetRequestedAt`, `trainingCompletedAt`, `trainingExpiresAt`,
`failedPinAttempts`, `pinHash` already exist.)

---

## 6. Required state for each LOTO action

The role gate (`requireAnyRole`) checks the user has the right role.
The **onboarding gate** (NEW) checks they're in `ACTIVE` state. Both
must pass.

| Action                                | Role gate             | Onboarding gate                          |
| ------------------------------------- | --------------------- | ---------------------------------------- |
| Sign on to a LOTO                     | none (CONTRACTOR ok)  | `ACTIVE` + PIN set + (training if FE)    |
| Sign off self                         | none                  | (just be the signed-on person)           |
| Hang / Verify per-point               | `LOTO_QUALIFIED`      | `ACTIVE` + training current              |
| Sign as Hung / Verified (aggregate)   | `LOTO_QUALIFIED` + SoD| `ACTIVE` + training current              |
| Activate / Release CA / Remove Locks  | `CONTROL_AUTHORITY`   | `ACTIVE` + training current              |
| Approve a Standard                    | `MANAGER`             | `ACTIVE` (no training requirement)       |

Implementation: a new `requireActive(user, requireTraining)` helper
called alongside `requireAnyRole` in every LOTO action method.

---

## 7. Frontend onboarding UI

### 7.1 Profile page
Already has the Security tab with password + PIN change. Add an
**Onboarding** tab showing:

- Setup checklist (✓ / pending for each step)
- Training status: completed, expires-on, days remaining
- Role assignments

### 7.2 Admin user table
Already shows initials/PIN status. Add columns:

- **Stage**: INVITED / SETUP / TRAINING_REQUIRED / ACTIVE / DEACTIVATED
- **Training**: `valid until DATE` / `expires in N days` / `EXPIRED`
- **Last login**: existing field, more prominent

### 7.3 Stage banner
When a user is not `ACTIVE`, every page shows a top banner: *"Setup
incomplete — assign signing initials and generate PIN to enable LOTO
actions."* (admin) or *"Waiting for training certification."* (user).

### 7.4 Contractor sign-on screen
New route `/sign-on-pin` — for kiosks at the work site. Renders:

- Field: combined initials+PIN (`DK1234`).
- Select: which permit to sign onto (filtered to Active permits user
  has access to).
- Big "Sign On" button.

No password required. The screen is itself unauthenticated; the PIN
authenticates the contractor and creates a sign-on entry. Sign-off
works the same way.

### 7.5 First-PIN-change wall
When `pinMustChange = true`, the first action a user takes that requires
PIN step-up shows a modal: *"You're using an admin-issued PIN. Please
pick a new one before signing actions."* with current-PIN / new-PIN
fields. Cannot dismiss without setting a new PIN.

(Today: the banner is on the profile page, but it doesn't intercept
step-up flows. The wall would make the gate enforceable.)

---

## 8. Email / out-of-band touches

We don't want PINs in email (per the PIN spec). But onboarding has
several places where email IS useful:

- **Invite email**: "Your account has been created. Click here to set
  your password." Token-based, 7-day expiry.
- **PIN-change reminder**: optional weekly email to users with
  `pinMustChange = true` for > 3 days.
- **Training expiry warning**: email at 30 / 7 / 0 days before expiry.

The infrastructure (`EmailFacadeService`) is already in place for
password reset; reuse it.

---

## 9. Reset flows

### 9.1 Password reset
Already implemented (`/auth/forgot-password` + `/auth/reset-password`).
Add rate limit: max 5 requests per email per hour, per IP per hour.

### 9.2 PIN reset (forgot PIN)
Already implemented (`/auth/pin/request-reset`). Today: user flags their
account → admin sees ⚠ in user table → admin clicks Generate PIN →
new PIN is shown to admin → admin hands it to user out of band.

Add: an **admin pending-requests** list view at `/admin/pin-requests`
showing all users with `pinResetRequestedAt != null`, with a one-click
"Generate & reveal" action.

### 9.3 Lockout reset
Today: 3 failed PIN attempts → 5-minute lockout. Add admin "Unlock
now" button to clear `pinLockedUntil` for the rare case where it's a
real user who fat-fingered.

---

## 10. Training records (out of scope for v1, sketch only)

A future `TrainingRecord` entity per user, per training type:
- LOTO-Authorized (1-year expiry)
- LOTO-Qualified (1-year expiry)
- Confined Space (1-year expiry)
- First Aid / CPR (2-year expiry)

Admin records completion (date + cert# + filed-document link). System
computes `trainingExpiresAt` per record.

For v1, we keep it minimal: a single `trainingCompletedAt` +
`trainingExpiresAt` on `User`. Granular records can come later.

---

## 11. Implementation phases

### Phase 1 — Foundation (small)
- Add `accountType`, `validUntilDate`, `invitedAt`, `setupCompletedAt`
  to `User` + schema migration.
- Compute and expose **user stage** in `/api/auth/profile` and
  `/ng/users` (derived, not stored).
- Add stage column to admin user table.

### Phase 2 — Gating (medium)
- `requireActive(user, requireTraining)` server helper.
- Wire into every LOTO action.
- Frontend stage banner on app shell.

### Phase 3 — Contractor flow (medium)
- New role `CONTRACTOR`.
- New form: contractor quick-add (gatehouse use case).
- New unauthenticated route `/sign-on-pin` for kiosk sign-on/off.

### Phase 4 — First-PIN-change wall (small)
- Intercept step-up flow when `pinMustChange = true`.
- Force PIN change in-flow before issuing the step-up token.

### Phase 5 — Optional polish (small)
- Invite email + token-based password-set link.
- Training expiry email reminders.
- Admin pending-requests page for PIN resets.

Each phase ships independently. No phase blocks the next *forever* —
e.g., training gating can ship without training records (use the
already-existing `trainingExpiresAt` field).

---

## 12. Testing plan
See `e2e-test-page` companion (added in same change-set). The page will
run onboarding flows step-by-step so an admin can verify each gate.

---

## 13. Decisions still open
1. **Self-signup**: do we even want it, or admin-only forever? Plant
   environment makes admin-only defensible. Default: **off**, leave the
   plumbing for future.
2. **Training granularity**: one expiry per user, or per-training type?
   Default for v1: one expiry. Per-type later.
3. **Contractor login**: pure PIN-only, or PIN + photo at the kiosk?
   Default for v1: PIN-only on plant-network kiosks.
4. **Account expiry behavior**: at `validUntilDate`, do we auto-
   `isActive=false`, or just flag for admin review? Default: auto-
   deactivate with a 7-day grace banner first.
