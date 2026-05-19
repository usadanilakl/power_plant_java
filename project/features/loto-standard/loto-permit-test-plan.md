# LOTO Permit — Design Gap Fixes + Test Plan

Bridge between [loto-procedure.md §4](loto-procedure.md) and the LOTO permit
implementation. Phase 0 closes documented gaps so the test suite written in
phases 1–3 reflects the design rather than the current code's bugs.

---

## Phase 0 — Design-gap fixes (before tests)

Each item is a CRITICAL or CORRECTNESS gap surfaced by the doc vs code audit.

### 0.1 Removal blocked while personnel signed on (CRITICAL)
**Where:** `NgLotoService.markPointRemoved` and `requireCaReleasedAndOpen`.
Today removal requires CA-release but does NOT check that everyone has signed
off. The design (§5.4) states removal needs "no personnel signed on" — a
worker still on the permit when isolation is being lifted is the canonical
safety failure mode.

**Change:** extend `requireCaReleasedAndOpen` to also reject when
`loto.getSignedOnPersonnel()` is non-empty.

### 0.2 Test ≠ Modification (CRITICAL)
**Where:** `addLotoPointToLoto` / `removeLotoPointFromLoto`. Today both
methods treat Test and Modification identically — flagging `needsRehang`
when status is either. Design (§4.2) says:
- **Test** — only `pullPointForTest` is allowed; you cannot add or remove
  points.
- **Modification** — you can add and remove points; both flip
  `wasModifiedDuringActive`.

**Change:** add/remove must throw when status is Test. Modification still
allows the operation.

### 0.3 `wasModifiedDuringActive` flagged for Modification only (CORRECTNESS)
**Where:** `flagIfActiveModification`. Today this flips the flag for both
Active and Test. Per design, only an actual point add/remove during
Modification should set it (Test is a pause-and-rehang, not a modification).

**Change:** narrow the predicate to `"Modification".equals(status)`.

### 0.4 Add/remove/reorder require role + state (CORRECTNESS)
**Where:** `addLotoPointToLoto`, `removeLotoPointFromLoto`, `reorderLotoPoints`.
None enforce role. None gate by status.

**Change:**
- `requireAnyRole(CONTROL_AUTHORITY)` on all three. Hangers shouldn't be
  reshaping the permit's point list.
- Reject if status is not in `{Building, Modification}`. Active permits
  are immutable except via the pause states; Test and Closed never allow
  structural edits.

### 0.5 Walkdown in Test/Modification for re-hung points (CORRECTNESS)
**Where:** `markPointWalkdown` / `unmarkPointWalkdown`. Today both reject
unless status is exactly Building. Design (§5.3) frames walkdown as a
post-verified action; re-hangs in Test/Modification should be able to
re-walkdown if needed.

**Change:** allow `Building`, `Test`, `Modification` for walkdown. Stay
blocked in Active and Closed.

### 0.6 Hanger ≠ verifier rule in the doc (DOC)
The code already enforces second-person rule in `markPointVerified`
(line 708 area). [loto-procedure.md §5.2](loto-procedure.md) mentions it
in passing — make it a first-class rule in the section text + tag the
existing §11 gap as resolved.

---

## Phase 1 — Java integration tests

Mirror of `LotoStandardWorkflowIT`. New file:
`src/test/java/com/dk_power/power_plant_java/loto/LotoPermitWorkflowIT.java`.

Setup helpers (private methods, in this file):
- `provisionActor` — reuse pattern (initials/PIN/roles).
- `walkStandardToApproved` — copy of the standard IT's `walkToApproved`,
  used as a fixture for every test.
- `createPermitFromStandard(standardId, ca)` — POST `/ng/lotos/create-from-standard/{id}` and capture the permit id.
- `signOnPersonnel`, `signOffPersonnel`, `assignLocks` — POST helpers.
- `markPointHung(permitId, pointId, hanger)`, `markPointVerified`,
  `markPointWalkdown`, `markPointRemoved` — PUT helpers each carrying the
  actor's step-up token.
- `changeStatus(permitId, status, ca)`, `releaseRequestor`, `releaseCa`,
  `removeLocks` — workflow helpers.
- `permitStatus(permitId)`, `pointHungBy(permitId, pointId)` — read helpers
  that pull the LOTO DTO and walk the latest snapshot.

Scenarios (one `@Test` each):

1. **Happy path.** CA flips an approved standard to permit → CA approves
   for hanging → hanger marks each point hung (per-point) → verifier
   (different person) marks each point verified → CA marks each point
   walkdown → CA activates → personnel signs on → requestor releases →
   CA releases → hanger marks each point removed → CA removes locks →
   status flips to Closed.

2. **Second-person rule.** Hanger attempts `markPointVerified` on a point
   they hung — rejected (400). Permit state unchanged.

3. **Sequence enforcement.** Try `markPointVerified` on an un-hung point —
   rejected. Try `changeStatus("Active")` before all points walkdown —
   rejected. Try `markPointRemoved` before CA release — rejected.

4. **Role gates.** A `LOTO_QUALIFIED` user (no CA) attempts:
   `changeStatus("Active")` rejected (CA-only). `addLotoPointToLoto`
   rejected (CA-only per 0.4). CA succeeds on both.

5. **Requestor transfer.** A initiates `transferRequestor` to B (B
   accepts) — permit `lotoRequestor` now B. A's release-as-requestor is
   rejected; B's succeeds.

6. **Test mode.** Active permit → all personnel sign off → `changeStatus("Test")` succeeds → `pullPointForTest` flips `needsRehang` → reactivate
   rejected → re-hang + re-verify → reactivate succeeds. Also verify
   `addLotoPointToLoto` is rejected during Test (0.2).

7. **Personnel-signed-on removal block (0.1).** Walk a permit to "CA released" with one worker still signed on → `markPointRemoved` rejected
   with "personnel still signed on" message.

---

## Phase 2 — Playwright API tests

New file: `automation-test/tests/loto-permits/loto-permit-workflow.spec.ts`.
Mirror of phase 1, using `page.request` + step-up tokens — no browser
navigation. Same 7 scenarios.

Page object: `automation-test/pages/loto-permit.page.ts` exposing the
same helpers (createFromStandard, markPointHung, etc.) so the spec stays
flat.

Runs alongside the existing standard workflow spec via the same
serial-mode + `@workflow-it.local` cleanup pattern.

---

## Phase 3 — Playwright UI tests

New file: `automation-test/tests/loto-permits/loto-permit-ui.spec.ts`.
Two browser-driven tests:

**3.1 Happy-path UI.** Log in as CA. Navigate to
`/permit-builder/lotos`. Click "Create from standard" → pick the
fixture standard → permit form opens. Click "CA approve hanging" → click
the first point's "Hang" button. Sign-as-someone-else through the PIN
dialog as the second user (LOTO_QUALIFIED) for verify, repeat for every
point. CA activates. Release as CA. Remove locks. Assert status = Closed.

**3.2 Button visibility.** Same fixture. As LOTO_QUALIFIED only (no CA),
assert "Activate" button is absent/disabled. Switch to CA via the
sign-as-someone-else dialog; the button appears.

Both tests use the same `@workflow-it.local` users seeded via the API
inside `beforeAll`.

---

## Run targets

- Java IT: `mvn -pl . test -Dtest=LotoPermitWorkflowIT`
- Playwright API: `npx playwright test automation-test/tests/loto-permits/loto-permit-workflow.spec.ts`
- Playwright UI: `npx playwright test automation-test/tests/loto-permits/loto-permit-ui.spec.ts`

All three suites self-clean per test (`@AfterEach` / `beforeEach` user
sweep) so they can run in any order against a shared instance.
