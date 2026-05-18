# LOTO + User Onboarding — E2E Test Plan

Acceptance criteria for the e2e test harness at
`/frontend/src/app/pages/e2e-test/e2e-test-page.component.ts`. Each
section becomes a tab in the test UI. Each numbered step becomes a
test-card row.

Companion to:
- [loto-procedure.md](loto-procedure.md) — what each step should do
- [pin-authentication.md](../users/pin-authentication.md) — PIN/step-up mechanics
- [onboarding.md](../users/onboarding.md) — onboarding gates

---

## 0. Conventions

### 0.1 Test data scoping
- Every run gets a `runId` (`E2E-<ts>-<rand>`).
- All created entities have `[${runId}]` appended to a human-readable
  field so re-runs never collide.
- Reset button purges all `runId`-tagged entities created by this tab.

### 0.2 Actor model
We create five test users per run. Each user owns:

| Var          | Roles                                            | Initials | PIN  |
| ------------ | ------------------------------------------------ | -------- | ---- |
| `userDk`     | CONTROL_AUTHORITY, LOTO_QUALIFIED                | DK       | 1111 |
| `userMs`     | CONTROL_AUTHORITY, LOTO_QUALIFIED                | MS       | 2222 |
| `userMg`     | MANAGER, CONTROL_AUTHORITY                       | MG       | 3333 |
| `userJoe`    | REQUESTOR                                        | JR       | 4444 |
| `userCarl`   | (CONTRACTOR — not yet a role; for now no roles)  | CR       | 5555 |

Step-up codes are the initials + PIN concatenated: `DK1111`, etc.

Provisioning sequence (executed by step 1 of every flow that needs it):
1. `POST /ng/users` with name, email, password, roles.
2. `POST /api/auth/admin/users/{id}/initials`.
3. `POST /api/auth/admin/users/{id}/pin/reset` — returns generated PIN.
4. Then `POST /api/auth/pin/change` with the generated PIN, signing in
   as that user, to clear `pinMustChange` so step-up doesn't prompt
   for a change wall in subsequent tests. **OR** — set the desired PIN
   directly via a new admin endpoint (preferred, see §0.5).

### 0.3 "Acts as" mechanics
Two ways a step can be performed as a non-logged-in user:

1. **Step-up token** — `POST /api/auth/step-up` with `{ code: "DK1111" }`,
   take the returned token, send the next action with header
   `X-Sign-As-Token: <token>`. Used for lifecycle actions (the existing
   service overloads already accept `stepUpToken?`).
2. **Direct session swap** — log out, log in as the target user, run
   the request, log back in as admin. Slower; only used for steps that
   no step-up token exists for (e.g., user editing their own profile,
   or APIs that require a real session not a one-shot).

### 0.4 Assertion vocabulary
- **SUCCESS_HTTP_200**: response is HTTP 200 + `responseData != null`.
- **ASSERT(field, value)**: response body's `field` equals `value`.
- **ASSERT_IN(field, collection)**: response body's `field` ∈ `collection`.
- **EXPECT_HTTP_4xx(code)**: request must fail with a 4xx (specifically
  the code listed); pass = failure observed.
- **AUDIT(target, expected)**: helper that asserts a snapshot's audit
  field equals expected (handles `actor via:sessionHolder` parsing).

### 0.5 Admin "set PIN explicitly" helper (NEW endpoint needed)
For tests to be deterministic, we need to pre-load known PINs (not
random ones). Proposal:

- `POST /api/auth/admin/users/{id}/pin/set-test` body `{ pin: "1111" }`
  - Only enabled when `e2e.admin-set-pin.enabled=true` (default in dev,
    off in prod).
  - Sets the PIN hash, clears `pinMustChange`, clears lockout state.
  - Returns 403 in production.

If this endpoint isn't acceptable, fall back to: admin generates a random
PIN, the test captures it from the response and stores it in the actor
record. Tests still work but actor PINs aren't reproducible across runs.

---

## 1. Tab: LOTO Standard Flow

### 1.1 Goal
Walk a brand-new Standard from `DRAFT` to `APPROVED` (and back through
`NEW_PENDING_REAPPROVAL → REAPPROVED`), exercising every role gate and
state guard.

### 1.2 Setup
Provision five test users (§0.2) and verify their PINs work.

### 1.3 Steps

| # | Step                                              | Acts as            | API                                                                | Assertions                                                                                                                                                                              |
| - | ------------------------------------------------- | ------------------ | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Provision test users                              | logged-in admin    | (sequence in §0.2) × 5                                             | All 5 users exist; PINs work (step-up returns 200 for each).                                                                                                                            |
| 2 | Create LOTO Standard with 4 points                | logged-in user     | `POST /ng/loto-standards`                                          | SUCCESS_HTTP_200. ASSERT(`status`, `'DRAFT'`). ASSERT(`lotoPoints.length`, 4).                                                                                                          |
| 3 | Submit for verification (step-up as DK)           | DK                 | `POST /ng/loto-standards/{id}/workflow/submit-for-verification`    | SUCCESS_HTTP_200. ASSERT(`status`, `'PENDING_VERIFICATION'`). AUDIT(`submittedBy`, `dk@…`).                                                                                             |
| 4 | **Try to verify as DK** (second-person rule)      | DK                 | `POST /ng/loto-standards/{id}/workflow/verify`                     | EXPECT_HTTP_4xx — message should mention "second-person" or "different".                                                                                                                |
| 5 | Verify (step-up as MS)                            | MS                 | `POST /ng/loto-standards/{id}/workflow/verify`                     | SUCCESS_HTTP_200. ASSERT(`status`, `'VERIFIED'`). AUDIT(`verifiedBy`, `ms@…`).                                                                                                          |
| 6 | Mark walkdown complete                            | DK                 | `POST /ng/loto-standards/{id}/workflow/walkdown-complete`          | SUCCESS_HTTP_200. ASSERT(`status`, `'WALKDOWN_COMPLETE'`).                                                                                                                              |
| 7 | Mark ready for testing                            | DK                 | `POST /ng/loto-standards/{id}/workflow/ready-for-testing`          | SUCCESS_HTTP_200. ASSERT(`status`, `'READY_FOR_TESTING'`).                                                                                                                              |
| 8 | **Try to approve as DK** (role gate)              | DK                 | `POST /ng/loto-standards/{id}/workflow/approve`                    | EXPECT_HTTP_4xx — message must mention `MANAGER`.                                                                                                                                       |
| 9 | Approve (step-up as MG)                           | MG                 | `POST /ng/loto-standards/{id}/workflow/approve`                    | SUCCESS_HTTP_200. ASSERT(`status`, `'APPROVED'`). History endpoint returns an event with `type = 'APPROVED'` and `performedBy = mg@…`.                                                  |
| 10 | Edit a point's procedure                         | DK                 | `PUT /ng/loto-points` (or per-point procedure update endpoint)     | SUCCESS_HTTP_200. Re-fetch the standard: ASSERT(`status`, `'NEW_PENDING_REAPPROVAL'`). ASSERT(`verifiedBy`, null) — attribution cleared.                                                |
| 11 | Re-approve (step-up as MG)                       | MG                 | `POST /ng/loto-standards/{id}/workflow/approve`                    | SUCCESS_HTTP_200. ASSERT(`status`, `'APPROVED'`). History adds event with `type = 'REAPPROVED'`.                                                                                        |
| 12 | History endpoint sanity                          | logged-in user     | `GET /ng/loto-standards/{id}/workflow/history`                     | Returns ≥ 7 events: SUBMITTED, VERIFIED, WALKDOWN_COMPLETE, READY_FOR_TESTING, APPROVED, INVALIDATED, REAPPROVED. Each with the right `performedBy`.                                    |
| 13 | Cleanup                                           | logged-in admin    | DELETE soft-delete the test standard + users                       | All 200.                                                                                                                                                                                |

---

## 2. Tab: LOTO Permit Flow

### 2.1 Goal
Walk a Permit from `BUILDING` → `ACTIVE` → `TEST` → `ACTIVE` → `CLOSED`
with personnel sign-on/off, step-up'd lifecycle actions, and verify
audit + separation-of-duty enforcement.

### 2.2 Setup
- Test users from Standard Flow are reused if both tabs share a runId.
- Otherwise re-provision.
- Use the Standard from §1 (or create a fresh one and walk it directly
  to `APPROVED` as setup).

### 2.3 Steps

| # | Step                                                              | Acts as | API                                                                 | Assertions                                                                                                                                          |
| - | ----------------------------------------------------------------- | ------- | ------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 | Flip Standard to Permit                                           | DK      | `POST /ng/loto/from-standard/{standardId}`                          | SUCCESS_HTTP_200. ASSERT(`permitStatus.name`, `'Building'`). New permit ID captured.                                                                |
| 2 | Set requestor + box + system                                      | DK      | `PUT /ng/loto`                                                      | SUCCESS_HTTP_200. ASSERT(`lotoRequestor`, `'Joe Requestor'`). ASSERT(`boxNumber` populated).                                                        |
| 3 | Approve for hanging (step-up DK)                                  | DK      | `PUT /ng/loto/{id}/lifecycle/ca-approve-hanging` + X-Sign-As-Token  | SUCCESS_HTTP_200. AUDIT(`caApprovedForHangingBy`, `'dk@… via:<sessionHolder>'`).                                                                    |
| 4 | Hang point #1 (step-up MS)                                        | MS      | `PUT /ng/loto/{id}/lifecycle/point/{pid}/hung`                      | SUCCESS_HTTP_200. ASSERT(`snapshots[last].pointHungBy[pid]`, `'ms@…'`).                                                                             |
| 5 | Hang points #2 - #4 (step-up MS)                                  | MS      | repeat                                                              | All four `pointHungBy` populated.                                                                                                                   |
| 6 | **Try aggregate Sign as Hung as MG (SoD violation)**              | MG      | `PUT /ng/loto/{id}/lifecycle/hung` + X-Sign-As-Token (MG)           | EXPECT_HTTP_4xx — message must mention "who hung".                                                                                                  |
| 7 | Aggregate Sign as Hung (step-up MS)                               | MS      | `PUT /ng/loto/{id}/lifecycle/hung`                                  | SUCCESS_HTTP_200. AUDIT(`hungBy`, `'ms@… via:<sessionHolder>'`).                                                                                    |
| 8 | Verify each point (step-up DK on points 1-4)                      | DK      | `PUT /ng/loto/{id}/lifecycle/point/{pid}/verified`                  | All four `pointVerifiedBy` populated with `dk@…`.                                                                                                   |
| 9 | **Try aggregate Sign as Verified as MS (SoD)** — *currently fails on the step-up flow only because MS isn't a verifier*    | MS      | `PUT /ng/loto/{id}/lifecycle/verified`                              | EXPECT_HTTP_4xx — message must mention "who verified".                                                                                              |
| 10 | Aggregate Sign as Verified (step-up DK)                          | DK      | `PUT /ng/loto/{id}/lifecycle/verified`                              | SUCCESS_HTTP_200. AUDIT(`verifiedBy`, `'dk@…'`).                                                                                                    |
| 11 | Activate (step-up DK)                                            | DK      | `PUT /ng/loto/{id}/lifecycle/ca-activate`                           | SUCCESS_HTTP_200. ASSERT(`permitStatus.name`, `'Active'`). AUDIT(`caActivatedBy`, `'dk@…'`).                                                        |
| 12 | Sign Carl onto permit (step-up CR)                                | Carl    | `POST /ng/loto/{id}/personnel/sign-on`                              | SUCCESS_HTTP_200. ASSERT(`personnel.length`, 1). ASSERT(`personnel[0].personName`, `Carl…`). ASSERT(`personnel[0].signOffTime`, null).              |
| 13 | **Try to transition to Test while Carl is signed on**             | DK      | `PUT /ng/loto/{id}/status` `{ status: "Test" }`                     | EXPECT_HTTP_4xx — message must mention "signed on".                                                                                                 |
| 14 | Sign Carl off                                                     | Carl    | `POST /ng/loto/{id}/personnel/{personnelId}/sign-off`               | SUCCESS_HTTP_200. ASSERT(`personnel[0].signOffTime`, not null).                                                                                     |
| 15 | Transition to Test                                                | DK      | `PUT /ng/loto/{id}/status`                                          | SUCCESS_HTTP_200. ASSERT(`permitStatus.name`, `'Test'`).                                                                                            |
| 16 | Pull point #2 for test                                            | DK      | `POST /ng/loto/{id}/lifecycle/point/{pid2}/pull-for-test`           | SUCCESS_HTTP_200. ASSERT(snapshot `needsRehang[pid2]`, true). ASSERT `pointHungBy[pid2]` cleared.                                                   |
| 17 | **Try Re-Activate with needsRehang outstanding**                  | DK      | `PUT /ng/loto/{id}/status` `{ status: "Active" }`                   | EXPECT_HTTP_4xx — message must mention "re-hang" or "rehang".                                                                                       |
| 18 | Re-hang point #2 (step-up MS)                                     | MS      | `PUT /ng/loto/{id}/lifecycle/point/{pid2}/hung`                     | SUCCESS_HTTP_200. ASSERT `pointHungBy[pid2]` repopulated; `needsRehang[pid2]` cleared.                                                              |
| 19 | Re-verify point #2 (step-up DK)                                   | DK      | `PUT /ng/loto/{id}/lifecycle/point/{pid2}/verified`                 | SUCCESS_HTTP_200.                                                                                                                                   |
| 20 | Re-Activate                                                       | DK      | `PUT /ng/loto/{id}/status`                                          | SUCCESS_HTTP_200. ASSERT(`permitStatus.name`, `'Active'`). AUDIT(`reactivatedBy`, populated).                                                       |
| 21 | Release Requestor (step-up JR)                                    | JR      | `PUT /ng/loto/{id}/lifecycle/release-requestor`                     | SUCCESS_HTTP_200. AUDIT(`requestorReleasedBy`, `'jr@…'`).                                                                                           |
| 22 | Release CA (step-up DK)                                           | DK      | `PUT /ng/loto/{id}/lifecycle/release-ca`                            | SUCCESS_HTTP_200. AUDIT(`controlAuthorityReleasedBy`, `'dk@…'`).                                                                                    |
| 23 | Remove Locks (step-up DK)                                         | DK      | `PUT /ng/loto/{id}/lifecycle/remove-locks`                          | SUCCESS_HTTP_200. AUDIT(`locksRemovedBy`, `'dk@…'`). Box released (ASSERT `loto.lotoBox`, null).                                                    |
| 24 | Close (transition Active → Closed)                                | DK      | `PUT /ng/loto/{id}/status` `{ status: "Closed" }`                   | SUCCESS_HTTP_200. ASSERT(`permitStatus.name`, `'Closed'`). ASSERT(`closeDisposition`, `'NEEDS_REVIEW'`) (because we pulled-for-test).               |
| 25 | **(Gap §11.1)** Source Standard auto-flipped                      | —       | GET source standard                                                 | EXPECT FAIL — currently `status` remains `APPROVED`. This step is **EXPECTED TO FAIL** until the gap is closed. Marked as `warn` not `error`.       |
| 26 | Cleanup                                                           | admin   | soft-delete permit                                                  | All 200.                                                                                                                                            |

### 2.4 Negative cases that should also be tested (separate sub-flow tab or expanded steps)
- Try Activate before all points verified — expect 4xx.
- Try Close from BUILDING — expect 200 (legal) → ASSERT `closeDisposition` is null (never activated).
- Try Transfer to a person not in personnel — expect 4xx.
- Accept Transfer with someone who isn't the named recipient — expect 4xx.
- Try Pull-for-test from BUILDING (not allowed; only Test/Mod) — expect 4xx.

---

## 3. Tab: User Onboarding Flow

### 3.1 Goal
Validate the onboarding pipeline from `INVITED` → `ACTIVE`, including
forgot-PIN reset, lockout, training expiry. Built once the onboarding
implementation lands (phases 1-4 in `onboarding.md`).

### 3.2 Steps

| # | Step                                                  | Acts as          | API                                                                | Assertions                                                                                          |
| - | ----------------------------------------------------- | ---------------- | ------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- |
| 1 | Admin creates user "Test Contractor"                  | admin            | `POST /ng/users`                                                   | SUCCESS_HTTP_200. ASSERT(`stage`, `'INVITED'`). PIN-related fields empty.                           |
| 2 | Assign signing initials                               | admin            | `POST /api/auth/admin/users/{id}/initials`                         | SUCCESS_HTTP_200. ASSERT(`signingInitials`, `'TC'`). ASSERT(`stage`, `'SETUP'`).                    |
| 3 | Generate initial PIN                                  | admin            | `POST /api/auth/admin/users/{id}/pin/reset`                        | SUCCESS_HTTP_200. PIN returned in body. ASSERT(`pinMustChange`, true).                              |
| 4 | **Try LOTO action (sign-on) with new PIN before training** | TC          | `POST /ng/loto/{id}/personnel/sign-on` + step-up TC                | EXPECT_HTTP_4xx — message must mention "training" or "not active".                                  |
| 5 | Admin records training complete                       | admin            | (new endpoint, `POST /api/auth/admin/users/{id}/training/complete`)| SUCCESS_HTTP_200. ASSERT(`trainingCompletedAt` populated). ASSERT(`stage`, `'ACTIVE'`).             |
| 6 | LOTO sign-on now works                                | TC               | `POST /ng/loto/{id}/personnel/sign-on` + step-up TC                | SUCCESS_HTTP_200.                                                                                   |
| 7 | User changes their own PIN                            | TC (real login)  | `POST /api/auth/pin/change` `{ currentPin, newPin }`               | SUCCESS_HTTP_200. ASSERT(`pinMustChange`, false).                                                   |
| 8 | User clicks "Forgot PIN — request reset"              | TC               | `POST /api/auth/pin/request-reset`                                 | SUCCESS_HTTP_200. ASSERT(`pinResetRequestedAt`, populated). User table shows ⚠ badge.               |
| 9 | Admin regenerates PIN                                 | admin            | `POST /api/auth/admin/users/{id}/pin/reset`                        | SUCCESS_HTTP_200. ASSERT(`pinResetRequestedAt`, null). ASSERT(`pinMustChange`, true). New PIN returned. |
| 10 | Simulate 3 wrong-PIN attempts                        | (no login)       | `POST /api/auth/step-up` × 3 with bad PIN                          | All 4xx. After 3rd, ASSERT user's `pinLockedUntil` set ~5min in future.                             |
| 11 | **Try step-up with correct PIN during lockout**       | TC               | `POST /api/auth/step-up`                                           | EXPECT_HTTP_4xx — message must mention "locked".                                                    |
| 12 | Admin unlocks                                         | admin            | (new endpoint, `POST /api/auth/admin/users/{id}/pin/unlock`)       | SUCCESS_HTTP_200. ASSERT(`pinLockedUntil`, null). ASSERT(`failedPinAttempts`, 0).                   |
| 13 | Set validUntilDate to yesterday                       | admin            | `PUT /ng/users/{id}` `{ validUntilDate: yesterday }`               | SUCCESS_HTTP_200.                                                                                   |
| 14 | LOTO sign-on attempt fails (account expired)          | TC               | sign-on                                                            | EXPECT_HTTP_4xx — message must mention "expired" or "not active".                                   |
| 15 | Cleanup                                               | admin            | soft-delete user                                                   | All 200.                                                                                            |

---

## 4. Pass / fail / warn semantics

For each step:
- **PASS** (green ✓): all assertions held, no unexpected errors.
- **FAIL** (red ✗): expected outcome not observed. Test run stops.
- **WARN** (yellow ⚠): step is documenting a known gap (e.g., 2.3 step
  25 — the missing auto-reapproval). Run continues. Warn aggregates
  count toward "ship-blocking gap list" in the run summary.

Run summary at the end of each tab:
```
Standard Flow: 12 / 13 PASS, 0 FAIL, 1 WARN
Permit Flow:   24 / 26 PASS, 0 FAIL, 2 WARN
Onboarding:    not yet implemented
```

---

## 5. New backend support needed

Things the test harness needs that don't exist yet:

1. **`POST /api/auth/admin/users/{id}/pin/set-test`** (§0.5) — deterministic
   PIN setting, dev/test profile only.
2. **`POST /api/auth/admin/users/{id}/training/complete`** — records training
   for a user (currently the training fields exist on User but no endpoint
   sets them).
3. **`POST /api/auth/admin/users/{id}/pin/unlock`** — clear `pinLockedUntil`
   and `failedPinAttempts`. (Today only happens implicitly on PIN reset.)
4. **Computed `stage` field** on `/api/auth/profile` and `/ng/users` (§2 of
   onboarding doc) — derived from the User fields, not a stored column.
5. **`POST /ng/loto/{id}/personnel/sign-on` / `sign-off`** — verify these
   endpoints exist with the signatures the test plan uses; add if missing.

---

## 6. Run ordering

1. **Standard Flow** — fully runnable today (all endpoints exist).
2. **Permit Flow** — runnable today; step 25 documents a known gap and
   stays WARN until §11.1 of the procedure doc is wired.
3. **Onboarding Flow** — blocked on Phase 1-4 of `onboarding.md`. Stub
   the steps in the UI with "BLOCKED — feature not yet implemented"
   placeholders so the structure is visible even before runnable.

---

## 7. Sign-off criteria

Before the LOTO feature is shippable to plant operations:

- Standard Flow: 13/13 PASS on a clean DB.
- Permit Flow: 26/26 PASS (step 25 stops being a WARN once §11.1 lands).
- Onboarding Flow: 15/15 PASS.
- All negative cases (§2.4) PASS.
- Run on hub + desktop both: every PASS reproduces.

Each tab's PASS rate is part of the release-readiness dashboard.
