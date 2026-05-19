import { test, expect } from '@playwright/test';
import { AuthPage, TestActor } from '../../pages/auth.page';
import { LotoStandardPage } from '../../pages/loto-standard.page';

/**
 * Playwright twin of {@code LotoStandardWorkflowIT} (Java integration test).
 *
 * Provisions DK / MS / MG / JR test users with deterministic PINs via the
 * test-only admin endpoints, walks a standard from DRAFT → APPROVED using
 * PIN step-up at every transition, then exercises the pending-review flow
 * (edit on APPROVED standard captures a change row; close-as-minor keeps
 * APPROVED; require-reapproval flips to NEW_PENDING_REAPPROVAL).
 *
 * Server prerequisites:
 *  - Spring Boot up on port 8082 (clientBackendUrl) with active profile
 *    "test" OR "dev" — both have {@code e2e.test-endpoints.enabled=true}.
 *  - Seeded admin "admin" / password "admin" (AdminUserSeeder).
 *
 * Runs as API-only (no browser navigation). Java IT uses MockMvc against
 * an in-memory H2; this version runs against the actually-running backend.
 */
test.describe('LOTO Standard workflow (PIN step-up)', () => {
  // Force serial execution: every test in this suite provisions DK/MS/MG with
  // the same deterministic PIN codes (DK1111 etc.). Running in parallel would
  // produce simultaneous create-user requests with colliding emails AND
  // multiple active users with the same initials+PIN → "Code is ambiguous"
  // on step-up. Serial mode matches the Java IT (one class, one DB).
  test.describe.configure({ mode: 'serial' });

  // Use the same Title-Case status names the backend stores in the DB
  // (LotoStandardStatus.java — not enum identifiers).
  const STATUS = {
    DRAFT: 'Draft',
    PENDING_VERIFICATION: 'Pending Verification',
    VERIFIED: 'Verified',
    WALKDOWN_COMPLETE: 'Walkdown Complete',
    READY_FOR_TESTING: 'Ready For Testing',
    APPROVED: 'Approved',
    NEW_PENDING_REAPPROVAL: 'New - Pending Reapproval',
  } as const;

  let auth: AuthPage;
  let standards: LotoStandardPage;

  /** State to clean up at end of each test. */
  const createdActors: TestActor[] = [];
  let createdStandardId: number | null = null;
  let createdPointIds: number[] = [];

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
    standards = new LotoStandardPage(page);
    createdActors.length = 0;
    createdStandardId = null;
    createdPointIds = [];

    // Sweep any leftover @workflow-it.local users from a prior crashed run
    // BEFORE we provision new ones — otherwise step-up codes (DK1111, etc.)
    // collide and the server returns "Code is ambiguous".
    await sweepStaleTestUsers(auth);

    // Real admin login (uses "credential", not "email", to match the
    // backend's LoginRequest record).
    const loginRes = await auth.loginAsSeededAdmin();
    expect(loginRes.ok(), `seeded admin login failed: ${loginRes.status()}`).toBeTruthy();
  });

  test.afterEach(async () => {
    // Best-effort cleanup; don't fail the test if cleanup hits a transient
    // issue (we want the test's red/green to reflect product behavior, not
    // teardown plumbing).
    try { if (createdStandardId) await standards.deleteStandard(createdStandardId); } catch { /**/ }
    for (const pid of createdPointIds) { try { await standards.deleteLotoPoint(pid); } catch { /**/ } }
    await auth.cleanupTestActors(createdActors);
  });

  test('happy path: DRAFT → APPROVED via PIN step-up at each transition', async () => {
    const dk = await provision(auth, 'DK', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const ms = await provision(auth, 'MS', '2222', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const mg = await provision(auth, 'MG', '3333', ['MANAGER', 'CONTROL_AUTHORITY']);

    const { standardId, pointIds } = await standards.createStandardWithPoints({
      name: `IT-happy-${Date.now().toString().slice(-6)}`,
      pointCount: 4,
    });
    createdStandardId = standardId;
    createdPointIds = pointIds;

    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.DRAFT);

    // DK submits
    await expectOk(await standards.workflowTransition(standardId, 'submit-for-verification',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) }));
    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.PENDING_VERIFICATION);

    // MS (≠ submitter) verifies — second-person rule
    await expectOk(await standards.workflowTransition(standardId, 'verify',
        { stepUpToken: await auth.stepUpToken(ms.stepUpCode) }));
    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.VERIFIED);

    await expectOk(await standards.workflowTransition(standardId, 'walkdown-complete',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) }));
    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.WALKDOWN_COMPLETE);

    await expectOk(await standards.workflowTransition(standardId, 'ready-for-testing',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) }));
    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.READY_FOR_TESTING);

    // MG approves (MANAGER role)
    await expectOk(await standards.workflowTransition(standardId, 'approve',
        { stepUpToken: await auth.stepUpToken(mg.stepUpCode) }));
    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.APPROVED);
  });

  test('second-person rule: submitter cannot verify their own standard', async () => {
    const dk = await provision(auth, 'DK', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);

    const { standardId, pointIds } = await standards.createStandardWithPoints({
      name: `IT-second-person-${Date.now().toString().slice(-6)}`,
    });
    createdStandardId = standardId;
    createdPointIds = pointIds;

    await expectOk(await standards.workflowTransition(standardId, 'submit-for-verification',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) }));

    // DK is the submitter — verify must reject.
    const res = await standards.workflowTransition(standardId, 'verify',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) });
    expect(res.status(), 'verify-as-submitter should reject with 4xx').toBeGreaterThanOrEqual(400);

    expect(await standards.getStandardStatus(standardId))
        .toBe(STATUS.PENDING_VERIFICATION); // unchanged
  });

  test('role gate: a CA without MANAGER role cannot approve', async () => {
    const dk = await provision(auth, 'DK', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const ms = await provision(auth, 'MS', '2222', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);

    const { standardId, pointIds } = await standards.createStandardWithPoints({
      name: `IT-role-gate-${Date.now().toString().slice(-6)}`,
    });
    createdStandardId = standardId;
    createdPointIds = pointIds;

    await expectOk(await standards.workflowTransition(standardId, 'submit-for-verification',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) }));
    await expectOk(await standards.workflowTransition(standardId, 'verify',
        { stepUpToken: await auth.stepUpToken(ms.stepUpCode) }));
    await expectOk(await standards.workflowTransition(standardId, 'walkdown-complete',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) }));
    await expectOk(await standards.workflowTransition(standardId, 'ready-for-testing',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) }));

    // DK is CA but NOT MANAGER — approve must reject.
    const res = await standards.workflowTransition(standardId, 'approve',
        { stepUpToken: await auth.stepUpToken(dk.stepUpCode) });
    expect(res.status(), 'approve-as-non-MANAGER should reject with 4xx').toBeGreaterThanOrEqual(400);
    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.READY_FOR_TESTING);
  });

  test('edit on APPROVED captures pending changes; standard stays APPROVED', async () => {
    const dk = await provision(auth, 'DK', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const ms = await provision(auth, 'MS', '2222', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const mg = await provision(auth, 'MG', '3333', ['MANAGER', 'CONTROL_AUTHORITY']);

    const { standardId, pointIds } = await walkToApproved(auth, standards, dk, ms, mg);
    createdStandardId = standardId;
    createdPointIds = pointIds;

    // Edit a LOTO point on the approved standard.
    await expectOk(await standards.editLotoPoint(pointIds[0], {
      tagNumber: `EDITED-${pointIds[0]}`,
      description: 'modified by pending-review test',
      zeroEnergyMethod: 'modified ZE',
    }));

    expect(await standards.getStandardStatus(standardId), 'status stays APPROVED while in pending review')
        .toBe(STATUS.APPROVED);
    expect(await standards.getPendingReviewSince(standardId), 'pendingReviewSince is set on first edit')
        .not.toBeNull();

    const pending = await standards.getPendingChanges(standardId);
    expect(pending.length, 'at least one pending-change row exists').toBeGreaterThanOrEqual(1);
    for (const c of pending) expect(c.resolution).toBe('PENDING');
  });

  test('close review as minor: standard stays APPROVED; pendingReviewSince clears', async () => {
    const dk = await provision(auth, 'DK', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const ms = await provision(auth, 'MS', '2222', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const mg = await provision(auth, 'MG', '3333', ['MANAGER', 'CONTROL_AUTHORITY']);

    const { standardId, pointIds } = await walkToApproved(auth, standards, dk, ms, mg);
    createdStandardId = standardId;
    createdPointIds = pointIds;

    await expectOk(await standards.editLotoPoint(pointIds[0], {
      tagNumber: `EDITED-${pointIds[0]}`,
      description: 'minor wording tweak',
    }));

    // Resolve every pending row as KEPT (under DK's step-up identity so the
    // role gate is satisfied).
    for (const c of await standards.getPendingChanges(standardId)) {
      await expectOk(await standards.keepPendingChange(c.id, await auth.stepUpToken(dk.stepUpCode)));
    }

    await expectOk(await standards.closeReview(standardId, {
      requireReapproval: false,
      stepUpToken: await auth.stepUpToken(dk.stepUpCode),
    }));

    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.APPROVED);
    expect(await standards.getPendingReviewSince(standardId)).toBeNull();

    const types = (await standards.getWorkflowHistory(standardId)).map((e: any) => e.eventType);
    expect(types).toContain('EDIT_PENDING_REVIEW');
    expect(types).toContain('EDIT_ACCEPTED_AS_MINOR');
    expect(types, 'close-as-minor should NOT flip to re-approval')
        .not.toContain('EDIT_REQUIRES_REAPPROVAL');
  });

  test('close review requiring re-approval: status flips to NEW_PENDING_REAPPROVAL', async () => {
    const dk = await provision(auth, 'DK', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const ms = await provision(auth, 'MS', '2222', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const mg = await provision(auth, 'MG', '3333', ['MANAGER', 'CONTROL_AUTHORITY']);

    const { standardId, pointIds } = await walkToApproved(auth, standards, dk, ms, mg);
    createdStandardId = standardId;
    createdPointIds = pointIds;

    await expectOk(await standards.editLotoPoint(pointIds[0], {
      tagNumber: `EDITED-${pointIds[0]}`,
      zeroEnergyMethod: 'substantive zero-energy method change',
    }));

    for (const c of await standards.getPendingChanges(standardId)) {
      await expectOk(await standards.keepPendingChange(c.id, await auth.stepUpToken(dk.stepUpCode)));
    }

    await expectOk(await standards.closeReview(standardId, {
      requireReapproval: true,
      stepUpToken: await auth.stepUpToken(dk.stepUpCode),
    }));

    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.NEW_PENDING_REAPPROVAL);
    expect(await standards.getPendingReviewSince(standardId)).toBeNull();

    const types = (await standards.getWorkflowHistory(standardId)).map((e: any) => e.eventType);
    expect(types).toContain('EDIT_REQUIRES_REAPPROVAL');
  });

  test('close review while PENDING rows remain is rejected', async () => {
    const dk = await provision(auth, 'DK', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const ms = await provision(auth, 'MS', '2222', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const mg = await provision(auth, 'MG', '3333', ['MANAGER', 'CONTROL_AUTHORITY']);

    const { standardId, pointIds } = await walkToApproved(auth, standards, dk, ms, mg);
    createdStandardId = standardId;
    createdPointIds = pointIds;

    await expectOk(await standards.editLotoPoint(pointIds[0], {
      tagNumber: `EDITED-${pointIds[0]}`,
      description: 'unresolved test',
    }));

    // Don't resolve anything — try to close.
    const res = await standards.closeReview(standardId, {
      requireReapproval: false,
      stepUpToken: await auth.stepUpToken(dk.stepUpCode),
    });
    expect(res.status(), 'closing with unresolved rows must reject').toBeGreaterThanOrEqual(400);
    const body = await res.json();
    expect(JSON.stringify(body).toLowerCase(),
        'rejection message should mention pending rows').toContain('pending');

    expect(await standards.getStandardStatus(standardId)).toBe(STATUS.APPROVED);
    expect(await standards.getPendingReviewSince(standardId)).not.toBeNull();
  });

  // ── Local helpers ─────────────────────────────────────────────────────────

  async function provision(
    a: AuthPage, initials: string, pin: string, roles: string[]
  ): Promise<TestActor> {
    const actor = await a.provisionActor({ initials, pin, roles });
    createdActors.push(actor);
    return actor;
  }

  async function walkToApproved(
    a: AuthPage, s: LotoStandardPage, dk: TestActor, ms: TestActor, mg: TestActor
  ): Promise<{ standardId: number; pointIds: number[] }> {
    const { standardId, pointIds } = await s.createStandardWithPoints({
      name: `IT-${Date.now().toString().slice(-6)}`,
    });
    await expectOk(await s.workflowTransition(standardId, 'submit-for-verification',
        { stepUpToken: await a.stepUpToken(dk.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'verify',
        { stepUpToken: await a.stepUpToken(ms.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'walkdown-complete',
        { stepUpToken: await a.stepUpToken(dk.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'ready-for-testing',
        { stepUpToken: await a.stepUpToken(dk.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'approve',
        { stepUpToken: await a.stepUpToken(mg.stepUpCode) }));
    return { standardId, pointIds };
  }

  /**
   * Soft-delete every {@code @workflow-it.local} user so the new run's
   * deterministic PIN codes (DK1111 etc.) don't collide with an orphan from
   * a prior crashed run. The list endpoint is admin-only; we run this AFTER
   * the admin session is set up, but BEFORE provisioning new actors.
   */
  async function sweepStaleTestUsers(a: AuthPage): Promise<void> {
    // Need admin to list — log in first.
    await a.loginAsSeededAdmin();
    const res = await a['page'].request.get(`${(a as any).backendUrl}/ng/users/all-options`);
    if (!res.ok()) return; // skip silently — not catastrophic
    const body = await res.json();
    const all: any[] = body?.responseData ?? [];
    for (const u of all) {
      if (typeof u?.email === 'string' && u.email.endsWith('@workflow-it.local')) {
        try { await a.deleteUser(u.id); } catch { /**/ }
      }
    }
  }
});

async function expectOk(res: { ok(): boolean; status(): number; text(): Promise<string> }): Promise<void> {
  if (!res.ok()) {
    throw new Error(`HTTP ${res.status()}: ${await res.text()}`);
  }
}
