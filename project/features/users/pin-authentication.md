# PIN Authentication & User Onboarding

Identity, authorization, and onboarding for plant workers using shared tablets.

---

## Why this exists

LOTO actions need to be attributed to a specific qualified person, but plants run
on shared tablets. Forcing each worker to log out and log in for every action is
impractical. This feature provides a fast per-action authorization mechanism
(combined initials + PIN code) and ties user enrollment into the existing
safety-training workflow so 100% of plant personnel land in the system.

The same primitive (per-action authorization) supports several deployment modes:

- **Anonymous tablet**: nobody logged in; every action prompts for a code.
- **Foreman-held tablet**: foreman logs in for the shift; others step in for
  individual actions via PIN dialog.
- **Personal device**: user logs in once, does everything seamlessly.

---

## The credential — `DK1234`

One short string, typed in one input.

- **First 2 characters**: signing initials (alphabetic, default = first letter of
  first name + first letter of last name).
- **Last 4 characters**: 4-digit PIN.

Example: Daniel Kelly's full code might be `DK1234`.

### Why this format

- One field, one keypad pop-up → fast on a touchscreen.
- ~6.7M-combo search space (26² × 10⁴), plenty when combined with per-account
  lockout and IP-level rate limiting.
- Initials are a memory aid; the user types something familiar instead of
  digging up a system-assigned username.

### Lookup logic (server-side)

```
1. Parse: first 2 chars = initials, last 4 = PIN candidate.
2. Find all users where signing_initials = "dk" (case-insensitive).
3. For each candidate, compare hashed PIN.
4. Authorize iff exactly one candidate matches.
```

### Collisions

- Signing-initial collisions are common (Dan Kelly, Dave Kim, Diana King all → `dk`).
- Within a collision group, **PINs must be unique**. The system enforces this at
  PIN-assignment time — admin/auto-gen will retry until a free PIN is chosen.
- True (initials + PIN) collisions across 200 users average ~0.04% — rare but
  handled deterministically.

### Initials are **plant-wide unique** by collision group, not globally

Multiple users may share initials. The (initials, PIN) tuple is what must be
unique. If `dk` gets too crowded (say, 8+ users), admins can override individual
users' initials to a custom 2-char alias (e.g. `m1`, `ms2`, first+middle initial).

---

## Day-in-the-life scenarios

### 1 — Anonymous browsing

> Tablet sits idle, nobody is logged in. Worker walks up, opens any LOTO permit.

- All read views are visible: status, points, history, sign-on roster.
- Every actionable button shows a small lock icon.

### 2 — Single action by an anonymous user

> Worker taps "Hang point 01-VAXS630".

- PIN dialog appears with a 6-character input (`•• ••••`).
- Worker types `dk1234`, hits Confirm.
- ~200 ms later the action fires under Daniel Kelly's identity, the row updates,
  the dialog closes.
- **No session is created.** The next button click prompts again.

### 3 — Foreman drives the tablet, hands off briefly

> At shift start, foreman Alice logs in with username + password. Her session
> lasts the shift. Later, Bob steps in for a second-person verify.

- Alice performs CA actions seamlessly — no prompts; her session role satisfies
  the gate.
- Bob clicks "Mark Verified" on a point Alice hung.
- Server-side rule: verifier must differ from hanger. Alice's session would fail
  this, so the UI **auto-detects** the mismatch and pops the PIN dialog.
- Bob types `br5678`. Verify fires under Bob.
- Alice's session is untouched.

Alice could also proactively click a "Sign as different user" link next to the
button — same dialog either way.

### 4 — Transfer hand-off

> Alice initiates transfer to Bob. Bob walks up to accept.

- Alice (current requestor) clicks "Transfer to Bob" — runs as Alice through
  her session.
- Pending-transfer banner: `Pending transfer: Alice → Bob`.
- Bob taps "Accept". PIN dialog opens, prefilled with Bob's initials (from the
  banner's recipient).
- Bob types his 4-digit PIN. Accept fires under Bob. `lotoRequestor` flips to
  Bob. Banner disappears.

### 5 — Wrong PIN / lockout

> Worker fat-fingers their PIN.

- "Incorrect — try again" (no info about which field was wrong).
- After **3 wrong attempts** the user is **locked for 5 minutes**; a security
  log entry is written.
- The lock is **per-account**, not per-device. Other users on the same tablet
  can still use their codes.
- A second-tier IP-level rate limit (~10 attempts/minute regardless of which
  initials) defends against brute-force across many accounts.

---

## Onboarding pipeline

The existing MS-Forms + SharePoint safety-training workflow is folded into the
app. Completing safety training **is** the enrollment event.

```
Worker arrives at plant (new hire or contractor)
        │
        ▼
Admin / HR creates a "pending user" record
    (name, email if available, contractor company, expected access duration)
        │
        ▼
Worker receives a training link
    (email, QR code on a handout, or kiosk URL)
        │
        ▼
Worker opens link in PWA
    → watches training video → completes quiz
        │
        ▼  On passing quiz:
    - User account is activated
    - Signing initials computed (first + last initial; admin can override)
    - 4-digit PIN auto-generated
        (validated for triviality — no 0000, 1234, 9999, repeated digits)
        (validated for uniqueness within their initials group)
    - Default LOTO role assigned: AFFECTED
    - Confirmation screen displays the full code ONCE
        ("DK1234" — write this down / photograph it now)
    - Confirmation email if email exists, containing the code
        │
        ▼
Worker enters plant, can sign on to LOTOs.
Role elevation (REQUESTOR, LOTO_QUALIFIED, CONTROL_AUTHORITY, MANAGER)
is a separate admin action by a supervisor.
```

### What AFFECTED gives the user

- Can be present on the plant floor.
- Can sign on / sign off LOTO permits as a worker.
- **Cannot** authorize any signing action (hang, verify, approve, transfer,
  release, close, modify, pause, walkdown).

A safety-trained worker is *visible* in the system but not yet *empowered*. Role
upgrades unlock authorization capability.

> If you prefer the role name `TRAINED` (more semantically accurate than the
> legacy LOTO-spec `AFFECTED`), rename in [LotoRole.java](../../../src/main/java/com/dk_power/power_plant_java/entities/users/LotoRole.java)
> and keep `AFFECTED` as a deprecated alias for backward compatibility.

---

## PIN lifecycle

### Distribution

Three channels, used in combination:

1. **Quiz-completion screen** — code displayed once in large text with a copy
   button. After the user dismisses, it cannot be re-displayed.
2. **Email** (when available) — same code in the body.
3. **Paper slip** — admin can print a confirmation slip after quiz completion;
   some plants require physical handoff for compliance.

### Change

From the user profile page: enter current PIN, enter new PIN twice. Disallow
trivial PINs (0000, 1234, repeats). Check uniqueness within the initials group.

On first PIN-based action, optionally prompt: "Would you like to change your PIN
to something memorable?" (opt-in, not forced).

### Forgot

Three recovery tiers:

1. **Email reset** (if email on file): tap "Forgot code" → enter initials +
   email → system emails a fresh random PIN. 30-second cooldown to prevent
   enumeration. Forced change on first use.
2. **Supervisor reset** (middle tier): a supervisor with a special role can
   reset a subordinate's PIN from their own session.
3. **Admin reset** (always available): admin opens user record → "Reset PIN" →
   new PIN displayed once for handoff. Forced change on first use.

### Expiration & cleanup

PIN itself does not expire on its own. But it is **tied to safety training**:

- Safety training is valid for **1 year**.
- When training expires, the PIN is **locked** — the user is in the system but
  cannot authorize anything until they requalify.
- Requalification (a fresh quiz pass) re-arms the existing PIN. Same code, no
  re-distribution needed.
- After **6+ months of inactivity** (no signed actions, no sign-ons) AND
  expired training, the PIN is **removed** and the initials slot frees up. The
  user record is soft-deleted; their action history stays for audit.
- If a removed user later returns, they restart the onboarding flow (new
  training → new PIN). If they return *while training is still valid* but PIN
  was forgotten, they use the standard forgot-PIN flow.

---

## Step-up authentication (the underlying primitive)

The PIN dialog is one face of a more general mechanism: **act-as for one
request**. Same primitive supports password (today), PIN (this spec), and later
badge tap or fingerprint if desired — no architecture changes.

```
1. Frontend opens authorization dialog → user enters dk1234
        │
        ▼
2. POST /api/auth/step-up { code: "DK1234" }
   Backend:
     - Parse initials + PIN
     - Look up users by initials, match PIN hash
     - On success: issue short-lived single-use token
                   (60-90 s, in-memory, bound to authorized user)
     - On failure: increment lockout counter, respond 401
        │
        ▼
3. Frontend retries the action with header X-Sign-As-Token: <token>
        │
        ▼
4. Backend filter:
     - Extract header, validate + consume token (single-use)
     - Swap SecurityContext to that user for the request
     - finally { restore original context (or anonymous) }
        │
        ▼
5. Action handler runs. All existing identity/role gates (CA, LOTO_QUALIFIED,
   REQUESTOR, second-person verify, must-be-current-requestor) work as-is
   against the swapped identity.
```

### When the dialog auto-fires

Frontend checks locally before each protected action click:

```
Does the current SecurityContext satisfy the action's role + identity rules?
    yes → fire action directly through session
    no  → open PIN dialog → on success, fire action with step-up token header
```

Each button knows its own gate, so the decision is local — no global "always
prompt" / "never prompt" mode.

---

## Audit — dual attribution

Every signing action records two fields:

| Field | Meaning |
|---|---|
| `actorUser` | The PIN-verified identity. Whose signature this is. |
| `sessionHolder` | Whoever was in the SecurityContext when the request arrived (null if anonymous, foreman's name if logged in). |

UI shows `actorUser` ("Signed by Bob"). Audit log shows both ("Signed by Bob,
operating on Alice's session at 14:32"). This survives the case where someone
hands a tablet to a co-worker for a single action.

Failed PIN attempts are logged separately in a security-audit table with
initials prefix, IP, timestamp, and lockout state.

---

## Role assignment (separate from identity)

Safety training creates identity (initials + PIN). It does **not** grant
authorization capability. Role assignment is a distinct admin action.

Roles in scope (see [LotoRole.java](../../../src/main/java/com/dk_power/power_plant_java/entities/users/LotoRole.java)):

| Role | Permissions |
|---|---|
| `AFFECTED` (default) | Present in plant; can sign on/off LOTOs as a worker. No authorization capability. |
| `LOTO_QUALIFIED` | Hang / verify / walkdown / remove points. |
| `REQUESTOR` | Be a LOTO permit requestor (initiate transfers, accept transfers, release-as-requestor). |
| `CONTROL_AUTHORITY` | Build/verify/walkdown standards. Issue permits. Approve for hanging. CA-activate. Pause (Test). Modify. CA-release. Close. (Superset of LOTO_QUALIFIED and REQUESTOR for action purposes.) |
| `MANAGER` | Final approval of standards after testing. |

Role changes themselves can require step-up auth — granting `CONTROL_AUTHORITY`
to someone is a high-trust action that the granting admin should re-authenticate
for. Recommend: any role grant ≥ LOTO_QUALIFIED triggers the PIN dialog.

---

## Wrong-user protection — labels, undo, confirmation

The realistic mistake on a shared tablet: user A is logged in, user B walks up
and clicks an action that *would* succeed under A's session (the action's role
gate happens to pass), forgetting A is the active user. The signature lands
under A instead of B. Three layers of defense, layered from cheapest/most
universal to costliest.

### Layer 1 — Ambient "as X" labels everywhere

Every signing button shows the actor inline:

- `Mark Hung as Alice`
- `Sign as Hung — Alice`
- `Confirm transfer (signing as Alice)`

When nobody is logged in, the same buttons read `Mark Hung (sign in)` — the
verb makes it obvious a PIN dialog will fire.

Same treatment in confirmation modals, signed-field rows, and anywhere the
user is about to commit a signature. Catches ~90% of "oh I forgot Alice was
logged in" cases with zero added friction.

### Layer 2 — Confirmation on high-stakes actions only

Per-action policy. **Identity-first wording** in the confirm modal
(`Signing as Alice. Continue?`), not generic `Are you sure?`.

| Action class | Confirm? | Reason |
|---|---|---|
| Per-point hang/verify/walkdown/remove, sign on/off, pull-for-test | No | High-frequency; cheap to undo |
| Aggregate Sign as Hung / Verified | No | Reversible via existing unmark or aggregate clear |
| Accept / cancel transfer | No | Reversible (re-transfer back) |
| CA approve hanging | **Yes** | Hard to roll back; unlocks the next phase |
| CA activate | **Yes** | Status transition, downstream effects |
| Enter Test / Modification | **Yes** | Status transition, blocks global sign-on |
| Requestor / CA release | **Yes** | Blocks future sign-on |
| Close permit | **Yes** | Final state, snapshot frozen |
| Manager approve standard | **Yes** | Highest-trust event |

> Blanket confirmation on every signing action would create banner blindness —
> after a week, operators click "Yes" reflexively. Reserved for the small set
> of high-stakes ones where the extra click is genuinely worth it.

### Layer 3 — Undo window on low-stakes actions

For actions in the "no confirm" group, after the action fires the row shows
`✓ Alice · 14:32 · Undo (60s)`. Clicking **Undo** within the window reverses
the action and clears the signature. After 60 s the undo affordance disappears
silently.

Backed by existing reverse endpoints where they exist (`unmarkPointHung` /
`unmarkPointVerified` / `unmarkPointWalkdown` / `unmarkPointRemoved`), and new
ones for the aggregate sign-offs that don't currently have an unmark
(`Sign as Hung` / `Sign as Verified` clear).

### Shipping order

Ship **Layer 1 + Layer 3** first. They cover the realistic mistakes and have
the best friction-to-protection ratio. Evaluate Layer 2 after a few weeks of
real use — if operators report they want the safety net on a specific action,
add it then. Easy to bolt on; hard to remove once people have learned to ignore
it.

---

## Signature initials display (drawn signatures)

Where the system currently shows a typed username + timestamp on signed fields,
add the user's stored drawn signature (image) inline. Makes the digital permit
visually equivalent to the paper form workers are used to, especially in print.

### Storage and lookup

- **Reuse existing signature capture** if present (audit needed — see "Reuse
  existing infrastructure" below). If signature capture doesn't exist yet, add
  a small PNG/SVG field on the user (~5–15 KB typical) and a capture pad in
  the user profile.
- `GET /ng/users/{id}/signature` — returns the image. Cached aggressively
  client-side; signatures rarely change.
- Profile page lets the user re-capture / re-draw their signature.
- Fallback when a user has no signature yet (bulk-import migration window):
  render typed initials in a styled font as a placeholder, same dimensions, so
  layout doesn't shift later.

### Where it appears

All read-only display; no behavior change.

- Lifecycle table rows (CA Approved, Hung, Verified, CA Activated, …)
- Procedure log per-point rows (Hung / Verified / Walked-down / Removed)
- Walkdown session per-point check rows
- Signed-on personnel list
- Snapshot history rows
- Printable permit view (biggest payoff — output matches the original paper form)

Inline `<img>` at ~24–32 px height next to the name and timestamp.

### Effort

~1 day on the frontend assuming the storage + endpoint exist. If they don't,
add another day for the capture pad and endpoint.

---

## Reuse existing infrastructure (audit first, build second)

Before any code lands, do a half-day audit pass to identify which of the
following exist, and pick the existing one each time. Spec gets updated with
"use `X`" pointers; new code only fills gaps.

### Email infrastructure

- Look for `EmailService` / `JavaMailSender` / SendGrid / Microsoft Graph mail
  wiring anywhere in the codebase
- Existing templates (work-request submission, instrumentation log
  notifications) — mirror the pattern for PIN-distribution and forgot-PIN
  emails
- **Don't** pull in a new SMTP library; use whatever already routes mail

### PWA quiz / form pattern

- Work-request and JHA PWA submission is the closest cousin to the safety-training
  quiz: anonymous-or-authenticated entry, attachments, base64 + SHA-256 dedup,
  server endpoint with SharePoint mirroring
- Quiz UI ⇒ thin wrapper on the existing PWA form pattern, plus
  question/answer state
- Submission endpoint follows the existing [controller/pwa/](../../../src/main/java/com/dk_power/power_plant_java/controller/pwa/) conventions
- Quiz attempt + result entities follow existing PWA entity patterns

### SharePoint mirroring

- Safety training currently lives in Excel on SharePoint. After cutover, keep
  writing training completions to SP so existing consumers (HR, compliance,
  contractors) don't break
- Use [SharepointAccessService](../../../src/main/java/com/dk_power/power_plant_java/sevice/sharepoint/) and the existing
  `*SharePointAdapter` pattern: new `SafetyTrainingCompletion` entity gets its
  own adapter with `cert*()` and `pa*()` method pairs, registered as a
  `SharePointSyncable` bean on the hub

### Sync server compatibility

- New `User` fields must be present on the **sync-server mirror** of the User
  entity too — sync-server is a separate codebase at
  `C:\Users\usada\my_projects\sync-server` with 26 mirror entities. Adding
  fields there is a parallel chore (no service code, just entity + migration)
- `FieldChangeEntityListener` on `BaseIdEntity` already picks up new fields
  for tracking — no service-side changes there
- New entities (`SafetyTrainingCompletion`, quiz attempt records, security
  audit log) also need mirrors on sync-server

### Audit logging

- Hibernate Envers is on (per project memory) — failed PIN attempts and PIN
  resets can be Envers-tracked via a small new entity for free
- Confirm Envers config before adding a parallel "audit log" table

### Existing User entity

- Already has `role` (comma-separated), `email`, `lastNotificationCheck`,
  audit fields (`createdBy`, `modifiedBy`, `dateCreated`, `dateModified`)
- New fields to add (via schema.sql per project convention):
  - `signing_initials VARCHAR(8)` — 2-3 char alphabetic
  - `pin_hash VARCHAR(255)` — bcrypt or same encoder as password
  - `pin_set_at TIMESTAMP` — last time the user set their PIN
  - `pin_locked_until TIMESTAMP` — null when not locked
  - `failed_pin_attempts INTEGER DEFAULT 0`
  - `training_completed_at TIMESTAMP`
  - `training_expires_at TIMESTAMP`
- All nullable / defaulted so existing rows don't break

### Existing forgot-password / password reset

- If there's a working forgot-password flow already, clone the controller +
  service shape for forgot-PIN. Same email mechanics, different credential

### Confirmed existing infrastructure (audit run 2026-05-17)

| # | Item | Status | Where | Reuse plan |
|---|---|---|---|---|
| 1 | Email service | ✓ | [ApiEmailService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/email/ApiEmailService.java), [ManualEmailService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/email/ManualEmailService.java) | Microsoft Graph primary + mailto fallback; attachments + template-via-DTO already supported. Use `ApiEmailService` for PIN delivery + forgot-PIN emails — no new mail library. |
| 2 | Forgot-password flow | ✓ | [AuthController.java](../../../src/main/java/com/dk_power/power_plant_java/controller/auth/AuthController.java) — `/api/auth/forgot-password`, `/api/auth/reset-password` | `PasswordResetToken` entity, 1 h TTL, email dispatch via `ApiEmailService`. Clone the entity + flow as `PinResetToken` and re-use the AuthController patterns. |
| 3 | Stored signature images | ✗ | [User.java](../../../src/main/java/com/dk_power/power_plant_java/entities/users/User.java) has `signaturePath` (String) only — points at a file path but no capture pad in frontend | Need to add a signature-capture component (canvas/signature_pad library) and a `signatureImageBlob` field or a file-storage path. Defer to Layer-3 / Phase-2 polish; not blocking Phase 1. |
| 4 | PWA quiz / form-builder | ⚠ | [QandAController.java](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/QandA/QandAController.java) is empty shell; [FormContainerRestController.java](../../../src/main/java/com/dk_power/power_plant_java/controller/angular/forms/FormContainerRestController.java) + form entities exist | Quiz UI gets built fresh in Phase 2 (training onboarding). For now Phase 1 uses **admin-managed enrollment** — no PWA dependency. |
| 5 | SharePoint adapter pattern | ✓ | [SharepointAccessService.java](../../../src/main/java/com/dk_power/power_plant_java/sevice/sharepoint/SharepointAccessService.java), 13 adapters in `sevice/sharepoint/adapters/` | When Phase 2 adds `SafetyTrainingCompletion`, follow the exact `cert*()` + `pa*()` adapter pattern + register as `SharePointSyncable` bean. |
| 6 | Sync-server User mirror | ✓ | `C:\Users\usada\my_projects\sync-server\src\main\java\com\dk_power\sync_server\entity\domain\User.java` — current fields: `username, firstName, lastName, name, email, role, password, isActive, lastLoginDate, windowsUsername` | Add `signingInitials, pinHash, pinSetAt, pinLockedUntil, failedPinAttempts, trainingCompletedAt, trainingExpiresAt` to the mirror. Parallel chore — no service code needed on sync-server side. |
| 7 | Hibernate Envers | ✗ | No `@Audited` annotations anywhere; not in `application.properties`. Soft-delete + `BaseAuditEntity` (`createdBy` / `modifiedBy` / `dateCreated` / `dateModified`) is the project pattern. | Don't introduce Envers. Failed PIN attempts go to a small new `PinSecurityEvent` entity with the existing audit fields. PIN resets are captured the same way. |
| 8 | CLAUDE.md conventions | ✓ | [CLAUDE.md](../../../CLAUDE.md) | Confirms: `sevice/` typo intentional, `NgApiResponse<T>` wrapper for Ng endpoints, `@Transactional` at service class level, soft-delete pattern, 1-indexed pagination, `@RequiredArgsConstructor` for DI. Spec follows these. |

**Key reuse decision:** clone the `PasswordResetToken` flow as `PinResetToken` (1 h TTL, single-use, email-delivered). Same entity shape, same `AuthController` patterns, same `ApiEmailService` send path. ~20 LOC of new code instead of a parallel implementation.

**Phase 1 doesn't depend on the PWA quiz or SharePoint mirror** — both are Phase 2 concerns. Phase 1 ships with admin-managed enrollment (admin creates user, assigns initials, sets/resets PIN, all delivered via existing email infrastructure).

---

## Open decisions before build

| # | Decision | Default |
|---|---|---|
| 1 | Initials uniqueness scope | Plant-wide ✅ |
| 2 | PIN length | 4 digits ✅ |
| 3 | Lockout: 3 wrong / 5 min / per-account | ✅ |
| 4 | PIN-only auth on shared tablets (no password login allowed) | ✅ |
| 5 | UI shows actor only; audit log shows both | ✅ |
| 6 | Training expiration: 1 year | ✅ |
| 7 | Inactive cleanup: 6 mo + expired training → remove PIN | ✅ |
| 8 | Default role: `AFFECTED` (rename to `TRAINED` later if preferred) | ✅ |
| 9 | Role grants ≥ LOTO_QUALIFIED require step-up auth | open |
| 10 | Email delivery infrastructure (SMTP / template engine) | open — depends on what exists |

---

## Migration for existing users

Current state: safety-training roster lives in MS Forms + Excel on SharePoint.

**Option A — bulk import + forced PIN setup (recommended)**

- Pull current safety-training-completed roster into the `User` table with
  computed initials and no PIN yet.
- For users with email on file: send a one-time "set your PIN" link.
- For users without email: print slips with initials + a one-time setup code;
  foremen distribute.
- Existing LOTO standards/permits don't change; only the user identity model
  shifts.

**Option B — lazy migration**

- New hires from cutover date forward go through the new flow.
- Existing users keep doing what they do today.
- They migrate when their next annual safety-training renewal happens — they
  re-train in the new PWA and get their code at completion.
- Trade-off: ~12 months of hybrid state.

Option A is the right call long-term but requires one organized push. Option B
spreads the work but leaves a year of bookkeeping.

---

## Phasing

### Phase 1 — PIN auth + step-up (~5 days)

Gets shared-tablet workflow working immediately. Admin-managed enrollment.
Safety training still happens in MS Forms; admins manually add users.

- `User.signingInitials` + `User.pinHash` fields + migration
- `POST /api/auth/step-up` endpoint
- Servlet filter: validate token, swap SecurityContext, restore in finally
- Frontend `StepUpDialog` component (one universal dialog)
- Wire dialog into existing action buttons (auto-detect when prompt is needed)
- Per-account lockout + IP rate limit
- Admin UI: reset PIN, assign roles
- Dual-attribution audit fields on signing actions

### Phase 2 — Training-quiz onboarding pipeline (~4–5 days)

Replaces MS Forms + Excel. Forces 100% coverage through the app.

- Pending-user admin flow
- PWA training video + quiz UI
- Quiz completion → user activation → PIN auto-gen → confirmation screen
- Email template + SMTP send (if not already present)
- Training-expiration job (annual lock)
- Inactive-user cleanup job (6 mo + expired training)
- Bulk import for existing roster (one-time)
- Forgot-PIN self-service via email

### Phase 3 — Hardware credentials (optional, future)

The step-up primitive is credential-agnostic. Adding badge tap or fingerprint
later is purely a new credential verifier behind the same endpoint:

- Badge tap (USB / NFC reader) ~2 days
- Fingerprint (Windows Hello integration) ~3 days
- Face recognition ~7–10 days (not recommended — see prior research)

---

## Related files

- [LotoRole.java](../../../src/main/java/com/dk_power/power_plant_java/entities/users/LotoRole.java)
- [User.java](../../../src/main/java/com/dk_power/power_plant_java/entities/users/User.java)
- [auth.service.ts](../../../frontend/src/app/services/auth.service.ts)

---

_Last updated: 2026-05-17_
