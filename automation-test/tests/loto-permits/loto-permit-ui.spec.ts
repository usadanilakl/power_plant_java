import { test, expect, Page } from '@playwright/test';
import { AuthPage, TestActor } from '../../pages/auth.page';
import { LotoStandardPage } from '../../pages/loto-standard.page';
import { LotoPermitPage } from '../../pages/loto-permit.page';
import { config } from '../../test.config';

/**
 * UI smoke test for the LOTO permit form. Walks a permit through the major
 * lifecycle transitions while clicking real workflow buttons. Per-point
 * hang/verify/walkdown/remove operations happen via API helpers (the
 * GuidedProcedureWindow modal isn't yet instrumented with data-testids).
 *
 * <p>Verifies the FE wiring is correct: the status chip updates, the
 * right transition buttons appear for the current state, the PIN dialog
 * accepts initials+PIN, and aggregate signatures fire the right backend
 * call. Deep behavioral coverage lives in {@code loto-permit-workflow.spec.ts}
 * (API-only) and {@code LotoPermitWorkflowIT} (Java MockMvc).
 *
 * <p>Run with: {@code npx playwright test loto-permits/loto-permit-ui.spec.ts}.
 * Requires the backend up on port 8082 and the Angular bundle built.
 */
test.describe('LOTO Permit UI', () => {
  test.describe.configure({ mode: 'serial' });

  let auth: AuthPage;
  let standards: LotoStandardPage;
  let permits: LotoPermitPage;

  const createdActors: TestActor[] = [];
  const createdPermitIds: number[] = [];
  let createdStandardId: number | null = null;
  let createdPointIds: number[] = [];

  test.beforeAll(async ({ browser }) => {
    const ctx = await browser.newContext();
    const page = await ctx.newPage();
    const a = new AuthPage(page);
    await a.loginAsSeededAdmin();
    await new LotoPermitPage(page).seedBoxes();
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

  test('happy path UI: navigate, create from standard, walk through lifecycle via buttons', async ({ page }) => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'ui-happy');

    // Navigate to the permit list view.
    const route = `${config.frontendUrl}${config.angularBasePath}/permit-builder/lotos`;
    await page.goto(route);
    await page.waitForLoadState('networkidle');

    // Click "From Standard" → standard selector opens → pick our fixture.
    await page.getByTestId('create-from-standard-btn').click();
    await page.getByTestId(`standard-item-${fx.standardId}`).click();
    // The form should switch to the just-created permit. Capture the id from the URL.
    await expect(page.getByTestId('permit-status')).toBeVisible({ timeout: 10000 });
    await expect(page.getByTestId('permit-status')).toHaveText(/Building/);

    const permitId = await readPermitIdFromUrl(page);
    createdPermitIds.push(permitId);

    // CA approves hanging via the PIN button (always available regardless of role).
    await clickWithStepUp(page, 'ca-approve-hanging-pin-btn', fx.ca.stepUpCode);

    // Per-point hang via API (GuidedProcedureWindow isn't testid-instrumented yet).
    for (const pid of fx.pointIds) {
      const r = await permits.markPointHung(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) });
      expect(r.ok(), `markPointHung(${pid}) failed`).toBeTruthy();
    }
    // Aggregate "Sign as Hung" via the PIN button (hanger signs).
    await page.reload();
    await page.waitForLoadState('networkidle');
    await clickWithStepUp(page, 'mark-hung-pin-btn', fx.hanger.stepUpCode);

    // Per-point verify via API + aggregate "Sign as Verified" via PIN.
    for (const pid of fx.pointIds) {
      const r = await permits.markPointVerified(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.verifier.stepUpCode) });
      expect(r.ok(), `markPointVerified(${pid}) failed`).toBeTruthy();
    }
    await page.reload();
    await page.waitForLoadState('networkidle');
    await clickWithStepUp(page, 'mark-verified-pin-btn', fx.verifier.stepUpCode);

    // Walkdown per-point via API (no aggregate signature for walkdown).
    for (const pid of fx.pointIds) {
      const r = await permits.markPointWalkdown(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) });
      expect(r.ok(), `markPointWalkdown(${pid}) failed`).toBeTruthy();
    }

    // CA-activate via PIN button, then click the status Activate button.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await clickWithStepUp(page, 'ca-activate-pin-btn', fx.ca.stepUpCode);

    await page.getByTestId('status-activate').click();
    await expect(page.getByTestId('permit-status')).toHaveText(/Active/, { timeout: 5000 });

    // Releases: requestor → CA, both via PIN.
    await clickWithStepUp(page, 'release-requestor-pin-btn', fx.requestor.stepUpCode);
    await clickWithStepUp(page, 'release-ca-pin-btn', fx.ca.stepUpCode);

    // Per-point remove via API.
    for (const pid of fx.pointIds) {
      const r = await permits.markPointRemoved(permitId, pid,
        { stepUpToken: await auth.stepUpToken(fx.hanger.stepUpCode) });
      expect(r.ok(), `markPointRemoved(${pid}) failed`).toBeTruthy();
    }

    // Aggregate remove-locks via PIN, then status → Closed.
    await page.reload();
    await page.waitForLoadState('networkidle');
    await clickWithStepUp(page, 'remove-locks-pin-btn', fx.ca.stepUpCode);
    await page.getByTestId('status-close').click();

    await expect(page.getByTestId('permit-status')).toHaveText(/Closed/, { timeout: 5000 });
  });

  test('button visibility: status-transition buttons match the current permit state', async ({ page }) => {
    const fx = await setupApprovedStandardAndActors(auth, standards, 'ui-visibility');
    const permitId = await permits.createFromStandardId(fx.standardId, {
      stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode),
      lotoRequestor: fx.requestor.email,
    });
    createdPermitIds.push(permitId);

    // Building: Activate + Close visible; Test/Modify/Re-Activate absent.
    await openPermit(page, permitId);
    await expect(page.getByTestId('permit-status')).toHaveText(/Building/);
    await expect(page.getByTestId('status-activate')).toBeVisible();
    await expect(page.getByTestId('status-close')).toBeVisible();
    await expect(page.getByTestId('status-test')).toHaveCount(0);
    await expect(page.getByTestId('status-modification')).toHaveCount(0);
    await expect(page.getByTestId('status-reactivate')).toHaveCount(0);

    // Walk via API to Active.
    await walkPermitToActiveViaApi(permits, auth, permitId, fx);
    await page.reload();
    await page.waitForLoadState('networkidle');

    // Active: Test, Modify, Close visible; Activate (initial) and Re-Activate absent.
    await expect(page.getByTestId('permit-status')).toHaveText(/Active/);
    await expect(page.getByTestId('status-test')).toBeVisible();
    await expect(page.getByTestId('status-modification')).toBeVisible();
    await expect(page.getByTestId('status-close')).toBeVisible();
    await expect(page.getByTestId('status-reactivate')).toHaveCount(0);

    // Move to Test via API; UI should switch to Re-Activate + Close.
    await expectOk(await permits.changeStatus(permitId, 'Test',
      { stepUpToken: await auth.stepUpToken(fx.ca.stepUpCode) }));
    await page.reload();
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('permit-status')).toHaveText(/Test/);
    await expect(page.getByTestId('status-reactivate')).toBeVisible();
    await expect(page.getByTestId('status-test')).toHaveCount(0);
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  interface PermitFixture {
    ca: TestActor;
    hanger: TestActor;
    verifier: TestActor;
    requestor: TestActor;
    standardId: number;
    pointIds: number[];
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
      name: `UI-${testName}-${Date.now().toString().slice(-6)}`,
      pointCount: 2, // small fixture for snappier UI runs
    });
    createdStandardId = standardId;
    createdPointIds.push(...pointIds);

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

    return { ca, hanger, verifier, requestor, standardId, pointIds };
  }

  async function provisionActor(
    a: AuthPage, initials: string, pin: string, roles: string[]
  ): Promise<TestActor> {
    const actor = await a.provisionActor({ initials, pin, roles });
    createdActors.push(actor);
    return actor;
  }

  async function walkPermitToActiveViaApi(
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
    await expectOk(await p.caActivate(permitId,
      { stepUpToken: await a.stepUpToken(fx.ca.stepUpCode) }));
    await expectOk(await p.changeStatus(permitId, 'Active',
      { stepUpToken: await a.stepUpToken(fx.ca.stepUpCode) }));
  }

  async function openPermit(page: Page, permitId: number): Promise<void> {
    const route = `${config.frontendUrl}${config.angularBasePath}/permit-builder/lotos?lotoId=${permitId}`;
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await expect(page.getByTestId('permit-status')).toBeVisible({ timeout: 10000 });
  }

  async function clickWithStepUp(page: Page, btnTestId: string, code: string): Promise<void> {
    await page.getByTestId(btnTestId).click();
    await expect(page.getByTestId('step-up-dialog')).toBeVisible({ timeout: 5000 });
    await page.getByTestId('step-up-code-input').fill(code);
    await page.getByTestId('step-up-confirm-btn').click();
    await expect(page.getByTestId('step-up-dialog')).toHaveCount(0, { timeout: 5000 });
  }

  async function readPermitIdFromUrl(page: Page): Promise<number> {
    const url = new URL(page.url());
    const id = url.searchParams.get('lotoId');
    if (!id) throw new Error(`permit id not in URL after createFromStandard: ${page.url()}`);
    return parseInt(id, 10);
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
