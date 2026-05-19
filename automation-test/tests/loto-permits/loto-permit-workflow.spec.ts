import { test, expect } from '@playwright/test';
import { AuthPage, TestActor } from '../../pages/auth.page';
import { LotoStandardPage } from '../../pages/loto-standard.page';
import { LotoPermitPage } from '../../pages/loto-permit.page';

/**
 * Playwright twin of {@code LotoPermitWorkflowIT}. Walks a LOTO permit from
 * Building → Active → Closed against the running backend (no MockMvc), with
 * step-up tokens at every transition that requires identity attribution.
 *
 * Mirrors all 7 Java IT scenarios:
 *   1. Happy path: createFromStandard → hang/verify/walkdown → activate →
 *      release → remove locks → Closed.
 *   2. Second-person rule: hanger cannot verify their own point.
 *   3. Sequence enforcement: verify-before-hung, activate-before-walkdown,
 *      and remove-before-CA-release are all rejected.
 *   4. Role gate: LOTO_QUALIFIED-only user cannot CA-activate or change status.
 *   5. Requestor transfer: A initiates, B accepts, only B can release.
 *   6. Test mode: enter Test, pull-for-test, re-hang, re-verify, re-activate;
 *      add-point during Test rejected (phase 0.2).
 *   7. Personnel sequencing: release-requestor rejected while signed on.
 *
 * Reference: project/features/loto-standard/loto-procedure.md §4–§5.
 */
test.describe('LOTO Permit workflow (PIN step-up)', () => {
  // Tests share deterministic initials+PIN codes (CA1111, HG2222, etc.); two
  // running in parallel would create colliding users → "Code is ambiguous"
  // on step-up. Serial mode matches the Java IT.
  test.describe.configure({ mode: 'serial' });

  let auth: AuthPage;
  let standards: LotoStandardPage;
  let permits: LotoPermitPage;

  /** State to clean up at end of each test. */
  const createdActors: TestActor[] = [];
  const createdPermitIds: number[] = [];
  let createdStandardId: number | null = null;
  let createdPointIds: number[] = [];

  test.beforeAll(async ({ browser }) => {
    // Box + lock inventory has to exist before any createFromStandard call.
    // One-time seed at suite start — idempotent on the server side.
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const a = new AuthPage(page);
    await a.loginAsSeededAdmin();
    const p = new LotoPermitPage(page);
    await p.seedBoxes();
    await ctx.close();
  });

  test.beforeEach(async ({ page }) => {
    auth = new AuthPage(page);
    standards = new LotoStandardPage(page);
    permits = new LotoPermitPage(page);
    createdActors.length = 0;
    createdPermitIds.length = 0;
    createdStandardId = null;
    createdPointIds = [];

    await sweepStaleTestUsers(auth);
    const loginRes = await auth.loginAsSeededAdmin();
    expect(loginRes.ok(), `seeded admin login failed: ${loginRes.status()}`).toBeTruthy();
  });

  test.afterEach(async () => {
    for (const pid of createdPermitIds) {
      try { await permits.deletePermit(pid); } catch { /**/ }
    }
    try { if (createdStandardId) await standards.deleteStandard(createdStandardId); } catch { /**/ }
    for (const pid of createdPointIds) {
      try { await standards.deleteLotoPoint(pid); } catch { /**/ }
    }
    await auth.cleanupTestActors(createdActors);
  });

  // ── Tests ─────────────────────────────────────────────────────────────────

  test('happy path: Building → hang/verify/walkdown → Active → release → Closed', async () => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'happy-path');
    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: fx.requestor.email,
    });
    createdPermitIds.push(permitId);

    await expectOk(await permits.caApproveForHanging(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));

    for (const pid of fx.pointIds) {
      await expectOk(await permits.markPointHung(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));
    }
    await expectOk(await permits.aggregateMarkHung(permitId,
      { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));

    for (const pid of fx.pointIds) {
      await expectOk(await permits.markPointVerified(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) }));
    }
    await expectOk(await permits.aggregateMarkVerified(permitId,
      { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) }));

    for (const pid of fx.pointIds) {
      await expectOk(await permits.markPointWalkdown(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    }
    await expectOk(await permits.caActivate(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    await expectOk(await permits.changeStatus(permitId, 'Active',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    expect(await permits.getPermitStatus(permitId)).toBe('Active');

    // Sign requestor on then off — exercises personnel flow then clears it
    // so release-requestor's signed-on guard passes.
    await expectOk(await permits.signOnPerson(permitId, fx.requestor.email, 'Worker'));
    await expectOk(await permits.signOffPerson(permitId, fx.requestor.email));

    await expectOk(await permits.releaseByRequestor(permitId,
      { stepUpToken: await auth.stepUpToken(fx.requestor.stepUpCode) }));
    await expectOk(await permits.releaseByControlAuthority(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));

    for (const pid of fx.pointIds) {
      await expectOk(await permits.markPointRemoved(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));
    }
    await expectOk(await permits.removeLocks(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    await expectOk(await permits.changeStatus(permitId, 'Closed',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));

    expect(await permits.getPermitStatus(permitId)).toBe('Closed');
  });

  test('second-person rule: hanger cannot verify a point they hung', async () => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'second-person');
    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: fx.requestor.email,
    });
    createdPermitIds.push(permitId);

    await expectOk(await permits.caApproveForHanging(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    for (const pid of fx.pointIds) {
      await expectOk(await permits.markPointHung(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));
    }
    await expectOk(await permits.aggregateMarkHung(permitId,
      { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));

    // Hanger tries to verify a point they hung — must be rejected.
    const victim = fx.pointIds[0];
    const res = await permits.markPointVerified(permitId, victim,
      { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) });
    expect(res.status(), 'verify-as-hanger should reject with 4xx').toBeGreaterThanOrEqual(400);

    // Verifier (≠ hanger) succeeds.
    await expectOk(await permits.markPointVerified(permitId, victim,
      { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) }));
  });

  test('sequence: verify-before-hung / activate-before-walkdown / remove-before-CA-release rejected', async () => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'sequence');
    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: fx.requestor.email,
    });
    createdPermitIds.push(permitId);

    await expectOk(await permits.caApproveForHanging(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));

    // verify-before-hung
    const verifyRes = await permits.markPointVerified(permitId, fx.pointIds[0],
      { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) });
    expect(verifyRes.status(), 'verify-before-hung should reject').toBeGreaterThanOrEqual(400);

    // Hang + verify all but skip walkdown.
    for (const pid of fx.pointIds) {
      await expectOk(await permits.markPointHung(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));
    }
    await expectOk(await permits.aggregateMarkHung(permitId,
      { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));
    for (const pid of fx.pointIds) {
      await expectOk(await permits.markPointVerified(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) }));
    }
    await expectOk(await permits.aggregateMarkVerified(permitId,
      { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) }));

    // activate-without-CA-activate
    const activateRes = await permits.changeStatus(permitId, 'Active',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) });
    expect(activateRes.status(), 'status→Active without CA activate should reject').toBeGreaterThanOrEqual(400);

    // remove-before-CA-release
    const removeRes = await permits.markPointRemoved(permitId, fx.pointIds[0],
      { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) });
    expect(removeRes.status(), 'remove-before-CA-release should reject').toBeGreaterThanOrEqual(400);
  });

  test('role gate: LOTO_QUALIFIED-only user cannot CA-activate or change status', async () => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'role-gate');
    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: fx.requestor.email,
    });
    createdPermitIds.push(permitId);

    await walkPermitToReadyForActivate(permits, auth, permitId, fx);

    // verifier holds LOTO_QUALIFIED but NOT CA — must be rejected.
    const caActRes = await permits.caActivate(permitId,
      { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) });
    expect(caActRes.status(), 'CA activate as non-CA should reject').toBeGreaterThanOrEqual(400);

    const statusRes = await permits.changeStatus(permitId, 'Active',
      { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) });
    expect(statusRes.status(), 'status change as non-CA should reject').toBeGreaterThanOrEqual(400);

    // CA succeeds.
    await expectOk(await permits.caActivate(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    await expectOk(await permits.changeStatus(permitId, 'Active',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
  });

  test('requestor transfer: A → B, only B can release-as-requestor', async () => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'transfer');
    const reqA = fx.requestor;
    const reqB = await provisionActor(auth, 'RB', '5555',
      ['CONTROL_AUTHORITY', 'REQUESTOR', 'LOTO_QUALIFIED']);

    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: reqA.email,
    });
    createdPermitIds.push(permitId);

    await walkPermitToActive(permits, auth, permitId, fx);

    // Both A and B must be on the personnel list before transfer (service gate).
    await expectOk(await permits.signOnPerson(permitId, reqA.email, 'A'));
    await expectOk(await permits.signOnPerson(permitId, reqB.email, 'B'));

    await expectOk(await permits.transferRequestor(permitId, reqA.email, reqB.email,
      { stepUpToken: await auth.stepUpToken(reqA.stepUpCode) }));
    await expectOk(await permits.acceptTransfer(permitId,
      { stepUpToken: await auth.stepUpToken(reqB.stepUpCode) }));

    // Behavioral check: A is no longer requestor → release fails; B is → release succeeds.
    await expectOk(await permits.signOffPerson(permitId, reqA.email));
    await expectOk(await permits.signOffPerson(permitId, reqB.email));

    const resA = await permits.releaseByRequestor(permitId,
      { stepUpToken: await auth.stepUpToken(reqA.stepUpCode) });
    expect(resA.status(), 'former requestor release should reject').toBeGreaterThanOrEqual(400);

    await expectOk(await permits.releaseByRequestor(permitId,
      { stepUpToken: await auth.stepUpToken(reqB.stepUpCode) }));
  });

  test('Test mode: pull → re-hang/verify → re-activate; add-point during Test rejected', async () => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'test-mode');
    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: fx.requestor.email,
    });
    createdPermitIds.push(permitId);
    await walkPermitToActive(permits, auth, permitId, fx);

    // Enter Test (no personnel signed on).
    await expectOk(await permits.changeStatus(permitId, 'Test',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    expect(await permits.getPermitStatus(permitId)).toBe('Test');

    // Phase 0.2 gap fix: add-point during Test is rejected.
    const addRes = await permits.addPointToPermit(permitId, fx.extraPointId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) });
    expect(addRes.status(), 'add-point during Test should reject').toBeGreaterThanOrEqual(400);

    // Pull a point for re-hang.
    const victim = fx.pointIds[0];
    await expectOk(await permits.pullPointForTest(permitId, victim,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));

    // Re-activate rejected until needsRehang is cleared.
    const reactRes = await permits.changeStatus(permitId, 'Active',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) });
    expect(reactRes.status(), 'reactivate with un-rehung point should reject').toBeGreaterThanOrEqual(400);

    // Re-hang + re-verify the pulled point.
    await expectOk(await permits.markPointHung(permitId, victim,
      { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));
    await expectOk(await permits.markPointVerified(permitId, victim,
      { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) }));

    // Now re-activate succeeds.
    await expectOk(await permits.changeStatus(permitId, 'Active',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    expect(await permits.getPermitStatus(permitId)).toBe('Active');
  });

  test('release-requestor rejected while a worker is still signed on', async () => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'personnel-block');
    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: fx.requestor.email,
    });
    createdPermitIds.push(permitId);
    await walkPermitToActive(permits, auth, permitId, fx);

    await expectOk(await permits.signOnPerson(permitId, fx.requestor.email, 'Lingering Worker'));
    const res = await permits.releaseByRequestor(permitId,
      { stepUpToken: await auth.stepUpToken(fx.requestor.stepUpCode) });
    expect(res.status(), 'release while signed-on should reject').toBeGreaterThanOrEqual(400);

    // Sign off → release + remove succeed.
    await expectOk(await permits.signOffPerson(permitId, fx.requestor.email));
    await expectOk(await permits.releaseByRequestor(permitId,
      { stepUpToken: await auth.stepUpToken(fx.requestor.stepUpCode) }));
    await expectOk(await permits.releaseByControlAuthority(permitId,
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));

    await expectOk(await permits.markPointRemoved(permitId, fx.pointIds[0],
      { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) }));
  });

  // ── Fixture helpers ───────────────────────────────────────────────────────

  interface PermitFixture {
    ca: TestActor;
    hanger: TestActor;
    verifier: TestActor;
    requestor: TestActor;
    standardId: number;
    pointIds: number[];
    extraPointId: number;
  }

  async function setupApprovedStandardAndActors(
    a: AuthPage, s: LotoStandardPage, testName: string
  ): Promise<PermitFixture> {
    const ca = await provisionActor(a, 'CA', '1111', ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED']);
    const hanger = await provisionActor(a, 'HG', '2222', ['LOTO_QUALIFIED']);
    const verifier = await provisionActor(a, 'VR', '3333', ['LOTO_QUALIFIED']);
    const mg = await provisionActor(a, 'MG', '4444', ['MANAGER', 'CONTROL_AUTHORITY']);
    const requestor = await provisionActor(a, 'RA', '6666',
      ['CONTROL_AUTHORITY', 'REQUESTOR', 'LOTO_QUALIFIED']);

    const { standardId, pointIds } = await s.createStandardWithPoints({
      name: `PermitIT-${testName}-${Date.now().toString().slice(-6)}`,
      pointCount: 3,
    });
    createdStandardId = standardId;
    createdPointIds.push(...pointIds);

    // Walk standard DRAFT → APPROVED so we can flip it to a permit.
    await expectOk(await s.workflowTransition(standardId, 'submit-for-verification',
      { stepUpToken: await a.stepUpToken(ca.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'verify',
      { stepUpToken: await a.stepUpToken(mg.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'walkdown-complete',
      { stepUpToken: await a.stepUpToken(ca.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'ready-for-testing',
      { stepUpToken: await a.stepUpToken(ca.stepUpCode) }));
    await expectOk(await s.workflowTransition(standardId, 'approve',
      { stepUpToken: await a.stepUpToken(mg.stepUpCode) }));

    // One extra point NOT on the standard — used to assert Test-mode add rejection.
    const extra = await createBarePoint(s, `PermitIT-${testName}-extra`);
    createdPointIds.push(extra);

    return { ca, hanger, verifier, requestor, standardId, pointIds, extraPointId: extra };
  }

  async function createBarePoint(s: LotoStandardPage, prefix: string): Promise<number> {
    const res = await s['page'].request.post(
      `${(s as any).backendUrl}/ng/loto-points`,
      {
        data: {
          tagNumber: `${prefix}-${Date.now()}`,
          description: 'Permit IT extra',
          specificLocation: 'IT',
          equipmentIdList: [],
          isLabeled: true,
          isLockable: true,
        },
      }
    );
    if (!res.ok()) throw new Error(`createBarePoint failed: ${await res.text()}`);
    const body = await res.json();
    return body?.responseData?.id;
  }

  async function provisionActor(
    a: AuthPage, initials: string, pin: string, roles: string[]
  ): Promise<TestActor> {
    const actor = await a.provisionActor({ initials, pin, roles });
    createdActors.push(actor);
    return actor;
  }

  async function walkPermitToReadyForActivate(
    p: LotoPermitPage, a: AuthPage, permitId: number, fx: PermitFixture
  ): Promise<void> {
    await expectOk(await p.caApproveForHanging(permitId,
      { stepUpToken: await a.stepUpToken(fx.ca.stepUpCode) }));
    for (const pid of fx.pointIds) {
      await expectOk(await p.markPointHung(permitId, pid,
        { stepUpToken: await a.stepUpToken(fx.hanger.stepUpCode) }));
    }
    await expectOk(await p.aggregateMarkHung(permitId,
      { stepUpToken: await a.stepUpToken(fx.hanger.stepUpCode) }));
    for (const pid of fx.pointIds) {
      await expectOk(await p.markPointVerified(permitId, pid,
        { stepUpToken: await a.stepUpToken(fx.verifier.stepUpCode) }));
    }
    await expectOk(await p.aggregateMarkVerified(permitId,
      { stepUpToken: await a.stepUpToken(fx.verifier.stepUpCode) }));
    for (const pid of fx.pointIds) {
      await expectOk(await p.markPointWalkdown(permitId, pid,
        { stepUpToken: await a.stepUpToken(fx.ca.stepUpCode) }));
    }
  }

  async function walkPermitToActive(
    p: LotoPermitPage, a: AuthPage, permitId: number, fx: PermitFixture
  ): Promise<void> {
    await walkPermitToReadyForActivate(p, a, permitId, fx);
    await expectOk(await p.caActivate(permitId,
      { stepUpToken: await a.stepUpToken(fx.ca.stepUpCode) }));
    await expectOk(await p.changeStatus(permitId, 'Active',
      { stepUpToken: await a.stepUpToken(fx.ca.stepUpCode) }));
  }

  async function sweepStaleTestUsers(a: AuthPage): Promise<void> {
    await a.loginAsSeededAdmin();
    const res = await a['page'].request.get(`${(a as any).backendUrl}/ng/users/all-options`);
    if (!res.ok()) return;
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
