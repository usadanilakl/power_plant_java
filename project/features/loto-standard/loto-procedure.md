# LOTO Procedure — Standards, Permits, Roles & Flows

End-to-end specification of how LOTOs are developed, approved, executed,
and closed in the plant. Read top-to-bottom on first pass; later sections
are cross-references that build on the earlier ones.

---

## 1. People

### 1.1 OSHA-style worker classifications
These describe the *worker's training relative to a LOTO*, not their app role.

- **Affected Employee** — works under an applied LOTO. Cannot install, verify,
  or remove tags. Must be qualified to perform the job they're signing on for.
- **Authorized Employee** — Hanger / Verifier. Trained to install LOTO devices
  on the equipment, verify isolation, and (after CA release) remove them.
- **Qualified Employee** — Authorized Employee who is *additionally* trained
  on electrical equipment. Required for any electrical isolation point.

### 1.2 System roles (LotoRole enum)
Stored on `User.role` (comma-separated), checked by `requireAnyRole(...)`.

| Role                | Can…                                                                                       |
| ------------------- | ------------------------------------------------------------------------------------------ |
| `CONTROL_AUTHORITY` | All LOTO actions except final standard approval. Submits/verifies standards, runs permits. |
| `LOTO_QUALIFIED`    | Hang & verify points. Sign permit lifecycle aggregate Hung/Verified.                       |
| `REQUESTOR`         | Be the initial requestor on a new LOTO, transfer to another worker, release.               |
| `MANAGER`           | Final-approve a standard (terminal `APPROVED` state).                                      |
| `ADMIN`             | User management: create users, set initials, generate/reset PINs.                          |

A user can hold any combination. Legacy aliases (`QUALIFIED` ⇄
`CONTROL_AUTHORITY`, `AUTHORIZED` ⇄ `LOTO_QUALIFIED`) are accepted so old
data still works.

### 1.3 Identity & step-up
Two-tier auth:

- **Primary** — email/username + password → session cookie. Identity used by
  every API call.
- **Step-up** — signing initials + 4-digit PIN (`DK1234`) exchanged for a
  one-shot token (`X-Sign-As-Token`, 90 s TTL). The token swaps the
  SecurityContext for that single request only.

Used so a Verifier can sign as themselves on a Hanger's tablet without the
Hanger logging out. The audit field records `actor via:sessionHolder`.

---

## 2. Concepts

- **LOTO Standard** — A reusable procedure template. Defines points,
  predecessors, install/removal order, prerequisites, safety conditions,
  zero-energy verification methods. Owned by a Control Authority.
- **LOTO Permit** — A *use* of a Standard for a specific outage / work
  scope. Created from a Standard or from scratch. Carries personnel
  sign-on/off, lifecycle state, snapshots, the active tag set.
- **LOTO Point** — One isolation device (valve, breaker, switch). Belongs
  to a Standard and to each Permit instantiated from it. Has a Tag Number,
  Position (Iso/Normal), Equipment association, Zero-energy method.
- **Snapshot** — Immutable record of permit state at a transition. Stores
  per-point hung/verified/walkdown/removed maps + aggregate audit fields
  + the lifecycle event that produced it.
- **Walkdown** — Requestor (and workers signing on) physically walks the
  applied LOTO to verify zero energy and correct installation. Multiple
  walkdown sessions per permit are allowed (each new sign-on triggers one).
- **Step-up (PIN)** — A different qualified user authorizes a single
  action under the logged-in session. Audit field captures both actors.
- **Separation of Duty (SoD)** — The user who signs the aggregate
  "Hanging Complete" must have hung at least one point. Same rule for
  Verified.
- **Re-hang** — During Test / Modification, points can be pulled. A pulled
  point gets a `needsRehang` flag and must be re-hung + re-verified
  before the LOTO can be Re-Activated.

---

## 3. LOTO Standard Lifecycle

```
       create / edit
            │
            ▼
        ┌────────┐ submit  ┌──────────────────────┐ verify  ┌───────────┐
        │ DRAFT  │────────►│ PENDING_VERIFICATION │────────►│ VERIFIED  │
        └────────┘         └──────────────────────┘         └───────────┘
            ▲                                                      │
            │ sendBackToDraft (CA)                                 │ markWalkdownComplete (CA)
            │                                                      ▼
            │                                              ┌────────────────────┐
            │                                              │ WALKDOWN_COMPLETE  │
            │                                              └────────────────────┘
            │                                                      │ markReadyForTesting (CA)
            │                                                      ▼
            │                                              ┌────────────────────┐
            │                                              │ READY_FOR_TESTING  │
            │                                              └────────────────────┘
            │                                                      │ approve (MANAGER)
            │                                                      ▼
            │                                              ┌────────────────────┐
            │  any content edit                            │     APPROVED       │ ◄── terminal
            └─────────────────────────────────────────────►└────────────────────┘
                                                                   │
                                                       (invalidate on edit)
                                                                   ▼
                                              ┌──────────────────────────┐
                                              │ NEW_PENDING_REAPPROVAL   │
                                              └──────────────────────────┘
                                                          │ approve (MANAGER)
                                                          ▼ (logged as REAPPROVED)
                                                       APPROVED
```

### 3.1 State rules

| State                      | Editable? | Who can transition forward                                                                                          | Notes                                                                                                                       |
| -------------------------- | --------- | ------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| `DRAFT`                    | Yes       | Creator or any CA                                                                                                   | Brand-new standard or sent back from PENDING_VERIFICATION.                                                                  |
| `PENDING_VERIFICATION`     | No        | CA *other than the submitter* (second-person rule)                                                                  | Verifier reads through the standard end-to-end.                                                                             |
| `VERIFIED`                 | No        | CA marks walkdown complete after the standard has been walked                                                       | Walkdown sessions tracked separately.                                                                                       |
| `WALKDOWN_COMPLETE`        | No        | CA marks ready-for-testing                                                                                          | The standard is now eligible to be flipped to a permit for first-test.                                                      |
| `READY_FOR_TESTING`        | No        | **MANAGER** approves after a successful test cycle                                                                  | Must have at least one closed permit derived from this standard with `closeDisposition = READY_FOR_APPROVAL`. (See §6.)     |
| `APPROVED`                 | No*       | None forward; any content edit moves it to `NEW_PENDING_REAPPROVAL` automatically                                   | *Metadata-only edits (name, description) don't invalidate; point/procedure/predecessor changes do.                          |
| `NEW_PENDING_REAPPROVAL`   | Yes       | MANAGER approves (event logged as `REAPPROVED`)                                                                     | Treated like fresh DRAFT but already-approved permit traces are preserved.                                                  |

### 3.2 Second-person rule (verify)
The verifier must satisfy: `verifier ≠ creator AND verifier ≠ submitter`.
Enforced server-side in `NgLotoStandardService.verify()`.

### 3.3 Edits to an APPROVED standard — Propose-then-Apply Review

Auto-flipping every edit to `NEW_PENDING_REAPPROVAL` is too blunt: typo
fixes and procedure clarifications shouldn't force a full re-walk through
verify → walkdown → ready → approve. The system instead uses a
**propose-then-apply** model: edits on an `APPROVED` standard are
captured as proposals and **the standard is not mutated** until a
reviewer accepts them. A CA or Manager decides per proposal whether to
keep or dismiss it, then chooses overall whether the standard remains
`APPROVED` or moves to `NEW_PENDING_REAPPROVAL`. Accepted proposals are
applied atomically at close-time.

#### Lifecycle of an edit
1. CA edits a field on an `APPROVED` standard (procedural prose,
   prerequisites, name/description, point list, etc.).
2. **The standard is NOT mutated.** The system writes a
   `LotoStandardPendingChange` row instead:
   `{standardId, sourcePermitId?, lotoPointId?, fieldName, oldValue, newValue, editedBy, editedAt, resolution=PENDING}`.
   `sourcePermitId` is nullable — populated when the proposal originated
   from a derived permit's "send to standard" affordance (future), null
   for direct edits on the standard form.
3. `LotoStandard.pendingReviewSince` is set to the timestamp of the first
   such proposal in the cycle. Subsequent edits accumulate.
4. The standard's `developmentStatus` stays `APPROVED`. A banner on the
   form shows "Pending Review — N proposals since last approval". The
   editor sees a toast: "Saved as a pending proposal — waiting for
   review." Until the reviewer accepts, other users still see the
   standard's last-approved content.
5. Repeated edits on the same `(field, lotoPointId, editedBy)` coalesce
   into one row whose `newValue` tracks the latest typed state. The
   original `oldValue` (the pre-cycle baseline) is preserved.

#### Reviewing
A CA or Manager opens the review panel and sees every PENDING proposal
with `oldValue` vs `newValue` side-by-side. Per row:

- **Keep** — proposal is accepted. Row marked `KEPT`. The new value will
  be applied to the standard when the review is closed.
- **Dismiss** — proposal is discarded. Row marked `DISMISSED`. The
  standard is unaffected (the proposal never mutated it in the first
  place).

A reviewer can re-open a previously-resolved row before the review is
closed (`KEPT → PENDING`, `DISMISSED → PENDING`). Switching resolutions
before close has no side effects on the standard.

#### Closing the review — KEPT proposals are applied here
After every PENDING row is resolved, the reviewer closes the review.
**This is the only point at which the standard is mutated.** For each
distinct `(fieldName, lotoPointId)` group with at least one KEPT
proposal, the most recent KEPT proposal's `newValue` is applied to the
standard atomically before the transition is committed. Structural
`lotoPoints*` variants (add/remove/reorder/replace) collapse to a single
group; the latest KEPT proposal's snapshot wins.

Then the reviewer picks the closeout disposition:

- **Close as minor** — `pendingReviewSince` is cleared. The standard
  stays `APPROVED`. `EDIT_ACCEPTED_AS_MINOR` event is appended with the
  kept/dismissed count summary.
- **Require re-approval** — `pendingReviewSince` is cleared, workflow
  attribution is reset, `developmentStatus` flips to
  `NEW_PENDING_REAPPROVAL`, and `currentVersion` increments. The cycle
  restarts at submit-for-verification. `EDIT_REQUIRES_REAPPROVAL` event
  records the decision.

Safety rail: if any KEPT proposal is structural (touches the point list
— add / remove / reorder / replace), **close-as-minor is rejected** with
`409 — Cannot close as minor — a kept change adds, removes, or reorders
LOTO points. Re-approval is required for structural changes.` Structural
changes always force re-approval.

If the reviewer tries to close while PENDING rows remain, the API
rejects with `409 — N pending changes must be resolved first`.

#### Edits while in pending review
- Further edits accumulate into the same pending-review window (one
  cycle, many proposals).
- Edits are still allowed even after some proposals have been marked
  `KEPT` — the new row is `PENDING` like any other.
- New permits created from a standard in pending-review pick up the
  **last-approved** definition (the standard hasn't been mutated yet).
  This is the behavior change vs the prior "auto-apply" model: in-flight
  proposals are not yet part of the standard's content. A future PR may
  add a separate affordance to send permit-side edits back to the
  standard as proposals using `sourcePermitId`.

#### Who can do what
- Anyone with `CONTROL_AUTHORITY` can edit, opening the pending-review
  window if the standard was `APPROVED`.
- `CONTROL_AUTHORITY` **or** `MANAGER` can keep / dismiss individual
  proposals and close the review. The frontend offers direct buttons
  (no PIN) when the logged-in user already has one of those roles, and
  a PIN step-up affordance when escalation is needed.
- Closing as "Require re-approval" doesn't itself require `MANAGER` —
  but the eventual `approve` after the re-walk does.

#### Apply semantics on close (Model B2)
- **Scalar text/boolean** fields (`name`, `description`, prose texts,
  `removalReversesInstallOrder`) — direct setter assignment of `newValue`.
- **`pointPrerequisites`** — JSON-serialized at proposal time, parsed
  back to `Map<Long, PointPrerequisite>` and assigned wholesale.
- **`lotoPoints*`** — `newValue` is a `List<Long>.toString()` snapshot of
  the proposed ordered point IDs. Applier removes dropped points, adds
  new ones, then calls `reorderLotoPoints(targetIds)` to align order.
- **Unknown field names** — silently skipped. Keeps the applier
  forward-compatible when new proposal types are added.

#### History events
The `LotoStandardApprovalEvent` log gains three event types:

- `EDIT_PENDING_REVIEW` — first proposal that opened the current
  pending-review cycle. One per cycle.
- `EDIT_ACCEPTED_AS_MINOR` — reviewer closed the review keeping the
  standard `APPROVED`. The event's `notes` summarizes kept/dismissed counts.
- `EDIT_REQUIRES_REAPPROVAL` — reviewer closed the review and flipped to
  `NEW_PENDING_REAPPROVAL`. Same summary format.

(The legacy `INVALIDATED` event type is no longer used by this flow —
auto-invalidation is gone.)

### 3.4 Reapproval after permit closure (PLANNED — see §11)
If a closed permit has `closeDisposition = NEEDS_REVIEW` (it was modified
during Active), the source Standard should drop to `NEW_PENDING_REAPPROVAL`
**automatically**. This is the loop that closes "test in the field →
update procedure → re-approve". Currently this auto-flip is **not wired**
— the disposition is stored, but no listener acts on it.

---

## 4. LOTO Permit Lifecycle

```
              ┌─────────────┐
              │   BUILDING  │ ◄── created (from Standard or scratch)
              └─────────────┘
                     │  CA approves for hanging
                     ▼  hangers hang each point (per-point flow)
                     │  verifiers verify each point (per-point, SoD)
                     │  walkdown (optional)
                     │  Sign as Hung (SoD)
                     │  Sign as Verified (SoD)
                     │  CA activates
                     ▼
              ┌─────────────┐
        ┌────►│   ACTIVE    │◄────┐
        │     └─────────────┘     │
        │       │     │     │     │
        │  test │  mod│  cls│     │ re-activate (after re-hang)
        │       ▼     ▼     ▼     │
        │ ┌──────┐ ┌──────┐ ┌────────┐
        │ │ TEST │ │ MOD  │ │ CLOSED │ ◄── terminal
        │ └──────┘ └──────┘ └────────┘
        │       │     │
        └───────┴─────┘
```

### 4.1 State entry/exit gates

| Transition              | Who                                  | Preconditions                                                                                                                    |
| ----------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------- |
| (new) → BUILDING        | REQUESTOR or CA                      | From a Standard with `status ∈ {READY_FOR_TESTING, APPROVED, NEW_PENDING_REAPPROVAL}`, or from scratch (CA only).                |
| BUILDING → ACTIVE       | CONTROL_AUTHORITY                    | All points hung + verified (aggregates signed). LOTO Box assigned. Requestor set.                                                |
| ACTIVE → TEST           | CONTROL_AUTHORITY                    | All personnel signed off (`signedOnPersonnel.isEmpty()`).                                                                        |
| ACTIVE → MODIFICATION   | CONTROL_AUTHORITY                    | Same as TEST.                                                                                                                    |
| TEST/MODIFICATION → ACTIVE | CONTROL_AUTHORITY                 | Every `needsRehang` flag cleared. All currently-installed points are re-hung + re-verified in the latest snapshot.               |
| ANY → CLOSED            | CONTROL_AUTHORITY                    | Computes `closeDisposition` = `NEEDS_REVIEW` if `wasModifiedDuringActive` is true, else `READY_FOR_APPROVAL`. Releases locks + box. |

### 4.2 What you can do in each state

| State           | Mutations allowed                                                                                              |
| --------------- | -------------------------------------------------------------------------------------------------------------- |
| BUILDING        | Edit header fields, add/remove points, change predecessors, hang, verify, walkdown, sign aggregates, activate. |
| ACTIVE          | Sign personnel on/off, transfer requestor, accept transfer, release (requestor or CA), pull-for-test → TEST, modify → MODIFICATION. **No content edits.** |
| TEST            | Pull point for test (sets `needsRehang`), re-hang re-verify, re-activate when clean. Personnel may not sign on. |
| MODIFICATION    | Add/remove points (flips `wasModifiedDuringActive=true`), re-hang re-verify, re-activate.                      |
| CLOSED          | Read-only.                                                                                                     |

### 4.3 Status-transition button matrix on `rf-loto-form.component.ts`

| Current → Target    | Visible when                                                            | Button text         |
| ------------------- | ----------------------------------------------------------------------- | ------------------- |
| BUILDING → ACTIVE   | CA + `hungBy` set + `verifiedBy` set + `caActivatedBy` not set          | Activate            |
| BUILDING → CLOSED   | CA                                                                      | Close               |
| ACTIVE → TEST       | CA + signed-on personnel = 0                                            | Test                |
| ACTIVE → MOD        | CA + signed-on personnel = 0                                            | Modify              |
| ACTIVE → CLOSED     | CA                                                                      | Close               |
| TEST/MOD → ACTIVE   | CA + all points clean (`canReactivate()`)                               | Re-Activate         |
| TEST/MOD → CLOSED   | CA                                                                      | Close               |

---

## 5. Per-point procedure

Every point goes through up to four states inside a permit. Each transition
writes to the latest snapshot's per-point JSON map (`pointHungBy`,
`pointVerifiedBy`, `pointWalkdownBy`, `pointRemovedBy`) and emits a
timestamp.

### 5.1 Hang
- **Pre-req**: standard's predecessors for this point must be hung first
  (enforced server-side).
- **Who**: any `LOTO_QUALIFIED` user. Step-up not required.
- **Captured**: hanger identity, timestamp, optional notes, list of
  acknowledged safety conditions.

### 5.2 Verify
- **Pre-req**: aggregate "Hanging Complete" must be signed first.
- **Who**: any `LOTO_QUALIFIED` user. **Hard rule — hanger ≠ verifier
  for the same point.** Enforced server-side in `markPointVerified`: a
  per-point verify request signed by the same identity that signed the
  hang is rejected with `400 — Verifier must be a different qualified
  person than the hanger`. The UI also always opens the step-up dialog
  so the verifier signs as themselves even on the hanger's session.
- **Captured**: verifier identity (PIN bearer), timestamp, notes.

### 5.3 Walkdown
- **Pre-req**: aggregate "Verified" signed.
- **Who**: REQUESTOR or any `LOTO_QUALIFIED`. A new walkdown session is
  created per sign-on.

### 5.4 Removal
- **Pre-req**: CA released, no personnel signed on.
- **Who**: `LOTO_QUALIFIED`.
- **Reverse predecessor order** is automatic: removal sequencing inverts
  the install order unless the standard explicitly overrides it
  (`removalReverseInstall` flag on the standard).

### 5.5 Pull-for-test
- A way to temporarily remove a hung point during TEST without going
  back to BUILDING.
- Flags the point `needsRehang=true`, clears its hung/verified state.
- On Re-Activate, every `needsRehang` point must be cleared.

---

## 6. Aggregate sign-offs (Hung / Verified)

Two aggregate gates exist to prevent a CA from activating a permit where
nobody actually did the work.

| Gate            | Who can sign                                                                       | Audit field        |
| --------------- | ---------------------------------------------------------------------------------- | ------------------ |
| Sign as Hung    | `LOTO_QUALIFIED` user whose identity is present in `pointHungBy` of some point     | `hungBy`           |
| Sign as Verified| `LOTO_QUALIFIED` user whose identity is present in `pointVerifiedBy` of some point | `verifiedBy`       |

Both are enforced server-side. The frontend disables the button when the
gate fails. The (PIN) variant lets a third party walk up, PIN-step-up,
and sign — the backend check applies to the PIN bearer, not the session
holder.

---

## 7. Example: full happy-path flow

> **Roles**: Dave = CA + LOTO_QUALIFIED. Mike = CA + LOTO_QUALIFIED + MANAGER.
> Sara = LOTO_QUALIFIED. Joe = REQUESTOR. Carl = contractor (Affected Employee).

### 7.1 Build the Standard
1. Dave creates a new LOTO Standard, adds 4 points, defines install order,
   predecessors, zero-energy methods, install/removal procedures. State: `DRAFT`.
2. Dave clicks **Submit for Verification**. State: `PENDING_VERIFICATION`.
3. Sara (a different CA) clicks **Verify**. (Server enforces Sara ≠ Dave.)
   State: `VERIFIED`.
4. Joe + Dave + Sara perform a physical walkdown of the procedure. Dave
   clicks **Mark Walkdown Complete**. State: `WALKDOWN_COMPLETE`.
5. Dave clicks **Mark Ready for Testing**. State: `READY_FOR_TESTING`.

### 7.2 First-test Permit
6. Dave clicks **Flip to Permit** on the Standard. A new Permit is
   created from the Standard. State: `BUILDING`.
7. Dave (as CA) sets Joe as Requestor, picks a LOTO Box.
8. Dave clicks **Approve for Hanging**. `caApprovedForHangingBy = dave@…`.
9. Sara (hanger) walks to each point, isolates the device, locks it,
   tags it, clicks **Mark Hung** for each. Sara's email lands in
   `pointHungBy[1..4]`.
10. Sara clicks aggregate **Sign as Hung**. (She's in `pointHungBy`, so
    SoD passes.) `hungBy = sara@…`.
11. Dave clicks **Start Verifying**. The guided procedure opens. For each
    point, Dave clicks **Mark Verified** — the PIN dialog opens. Mike walks
    over, enters `MK1234`. Verify request runs as Mike. Each
    `pointVerifiedBy[N] = mike@…`.
12. Mike clicks aggregate **Sign as Verified (PIN)** from any tablet,
    enters his PIN. (SoD passes — he's in `pointVerifiedBy`.)
13. Dave clicks **Activate**. State: `ACTIVE`. `caActivatedBy = dave@…`.

### 7.3 Work under the Permit
14. Joe (Requestor) signs Carl onto the permit (Carl is the contractor
    doing the actual work). Carl signs in via PIN (he has signing
    initials `CR` and PIN `5678`). Sign-on entry stamped with Carl's
    email + role + company.
15. Joe + Carl perform a walkdown to verify isolation. New walkdown
    session created.
16. Carl works under the LOTO. Several hours pass.
17. Carl finishes, signs off (PIN). Sign-off time stamped.
18. Joe clicks **Release** — but he's not authorized to release until
    all signed-on workers are off. They are. `requestorReleasedBy = joe@…`.

### 7.4 Test / Modification (optional)
19. Joe asks Dave to verify one point can be temporarily lifted to test
    something. Dave clicks **Test** (everyone signed off). State: `TEST`.
20. In the Procedure Log tab, Dave clicks **Pull** on point #2.
    `needsRehang[2] = true`. Point #2's hung/verified state is cleared.
21. After the field test, the technician re-hangs point #2 (PIN as
    Sara or whoever's there with the role). Re-verifies (PIN).
22. Dave clicks **Re-Activate**. (Re-activate guard: `needsRehang` empty,
    every current point hung+verified.) State: `ACTIVE`.

### 7.5 Close
23. Eventually all work is done. Joe signs off, Dave signs Joe off as
    Requestor.
24. Dave clicks **Release CA**. `controlAuthorityReleasedBy = dave@…`.
25. Dave clicks **Remove Locks**. The LOTO Box is released, locks are
    flagged removed.
26. Dave clicks **Close**. State: `CLOSED`.
    - `wasModifiedDuringActive = true` (we pulled point #2)
    - therefore `closeDisposition = NEEDS_REVIEW`
27. **(PLANNED)** The source Standard auto-flips to
    `NEW_PENDING_REAPPROVAL` because this closed permit modified it
    during Active. Dave's procedure updates start the cycle over.

### 7.6 Final approval (when no modifications)
If step 26 had ended with `closeDisposition = READY_FOR_APPROVAL` (no
modifications), Mike (MANAGER) clicks **Approve** on the source Standard.
State: `APPROVED`. Event log entry: `APPROVED`. Subsequent permits derived
from this Standard skip the walkdown / ready-for-testing dance (the
standard is now production-ready).

---

## 8. Audit & traceability

Every signing action writes to either:
1. The aggregate fields on the latest `LotoSnapshot` (`hungBy`,
   `verifiedBy`, `caApprovedForHangingBy`, `caActivatedBy`, `transferredFrom`,
   `transferredTo`, `acceptedBy`, `requestorReleasedBy`,
   `controlAuthorityReleasedBy`, `locksRemovedBy`, `closedBy`), OR
2. A per-point JSON map on the same snapshot (`pointHungBy`,
   `pointVerifiedBy`, `pointWalkdownBy`, `pointRemovedBy`).

When the action was authorized via step-up PIN, the field stores
`actor via:sessionHolder` (e.g. `mike@plant.com via:dave@plant.com`).
The frontend's `formatAuditBy()` formats this as `Mike Smith [MK] via Dave
Jones [DJ]` using the user's stored signing initials.

A new snapshot is created on each state transition (Building → Active,
Active → Test, etc.). The previous snapshot is preserved verbatim. The
History tab shows the chronological list with the events that produced
each snapshot.

---

## 9. Personnel sign-on / sign-off

The `personnel` JSON list on a Permit captures every person who has signed
on. Each entry has: `personName`, `personRole`, `company`, `signOnTime`,
`signOffTime`, `comments`, `performedBy` (who signed them on).

- A contractor can sign on directly via PIN if they have an account with
  signing initials + a valid PIN. The sign-on request comes through the
  step-up auth flow; the audit captures the PIN bearer as `performedBy`.
- Sign-on adds an entry with `signOffTime = null`. The person is
  "currently on" until `signOffPerson()` stamps the time.
- An ACTIVE LOTO cannot transition to TEST or MODIFICATION while anyone
  is signed on. Enforced in the status transition gate.
- A REQUESTOR cannot Release while anyone is signed on.

---

## 10. Restrictions summary

| Rule                                                                 | Where enforced                                            |
| -------------------------------------------------------------------- | --------------------------------------------------------- |
| Only CA may submit/verify/walkdown/ready-for-testing                 | `NgLotoStandardService.requireAnyRole`                    |
| Only MANAGER may APPROVE a standard                                  | `NgLotoStandardService.approve`                           |
| Second-person rule on verify                                         | `NgLotoStandardService.verify`                            |
| APPROVED standard auto-flips on content edit                         | `NgLotoStandardService.invalidateIfApproved`              |
| Only CA can transition permit states                                 | `NgLotoService.changeStatus` + button gating              |
| Sign-as-Hung / Sign-as-Verified: signer must have per-point entry    | `NgLotoService.markHung` / `markVerified`                 |
| Only the current Requestor can Transfer or Release                   | `NgLotoService.transferRequestor` / `releaseByRequestor`  |
| Pending transfer must be Accepted before lotoRequestor changes       | `Loto.recordAccepted` (after pendingTransferTo check)     |
| Cannot Test/Mod with signed-on personnel                             | `NgLotoService.changeStatus`                              |
| Re-activation requires all `needsRehang` cleared + all points clean  | `NgLotoService.requirePerPointHangVerifyStatus`           |
| ACTIVE permit cannot edit content; must go through MODIFICATION      | `NgLotoService` mutation methods + permit form UI         |
| Close releases locks & box, flags `closeDisposition`                 | `NgLotoService.changeStatus(Closed)`                      |
| Step-up token: single-use, 90s TTL, per-account 3-strike 5-min lock  | `StepUpTokenStore`, `StepUpAuthService`                   |

---

## 11. Gaps (known, not yet wired)

1. **NEEDS_REVIEW → standard reapproval auto-link** (see §3.4 / §7.5).
   Need an `@EventListener` or transition hook to flip the source
   Standard to `NEW_PENDING_REAPPROVAL` when a permit closes with that
   disposition.
2. ~~**Per-point hanger ≠ verifier hard rule**.~~ **Resolved** — enforced
   server-side in `NgLotoService.markPointVerified` (see §5.2). The PIN
   dialog remains as a UX affordance; the rejection is now in the service.
3. **Standard approval events lack dual-attribution**. `recordEvent` in
   `NgLotoStandardService` uses `currentUserName()` not
   `currentAuditActor()`. If a MANAGER step-up'd via PIN, the audit
   shows only the actor, not the session holder.
4. **Pull-for-test on MODIFICATION** is implemented; the contrast with
   TEST is that MODIFICATION also allows adding/removing points, not
   just lifting existing ones.

---

## 12. Cross-references

- PIN auth, step-up, identity model — `project/features/users/pin-authentication.md`
- User onboarding (NEW — companion to this doc) — `project/features/users/onboarding.md`
- Counterpart standard creation — `project/features/loto-standard/create-counterpart-loto-standard.md`
- LOTO Point bulk add — `project/features/loto-standard/add-loto-point-in-bulk.md`
