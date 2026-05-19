import { Page, APIResponse } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '../test.config';

export interface LotoStandardFormData {
  name?: string;
  description?: string;
  isVerified?: boolean;
  groups?: string[];
}

/**
 * LOTO Standard Page Object for LOTO Standard management operations
 */
export class LotoStandardPage extends BasePage {

  constructor(page: Page) {
    super(page);
  }

  // ==================== NAVIGATION ====================

  async navigateToLotoStandardsPage() {
    await this.goto('/home');
    await this.skipOnboarding();
    await this.clickNavLink('LOTO Standard');
    await this.waitForPageLoad();
  }

  async navigateDirectToLotoStandards() {
    await this.goto('/loto-standards');
    await this.waitForPageLoad();
  }

  // ==================== CREATE ====================

  async clickAddNewLotoStandard() {
    await this.clickButton(/add.*new|new.*standard/i);
    await this.page.waitForTimeout(500);
  }

  async fillLotoStandardForm(data: LotoStandardFormData) {
    // Name (first input)
    if (data.name) {
      await this.formInputs.first().click();
      await this.formInputs.first().fill(data.name);
    }

    // Description (second input or textarea)
    if (data.description) {
      const descInput = this.page.locator('textarea, .form-input-element').nth(1);
      await descInput.click();
      await descInput.fill(data.description);
    }

    // Is Verified checkbox
    if (data.isVerified !== undefined) {
      const checkbox = this.page.locator('[formcontrolname="isVerified"], [name="isVerified"]');
      if (data.isVerified) {
        await checkbox.check();
      } else {
        await checkbox.uncheck();
      }
    }

    // Groups multi-select
    if (data.groups && data.groups.length > 0) {
      const groupsSelect = this.page.locator('app-multi-value-select, [formcontrolname="groups"]');
      await groupsSelect.click();
      for (const group of data.groups) {
        await this.page.getByText(group, { exact: true }).click();
      }
      await this.page.keyboard.press('Escape');
    }
  }

  async createLotoStandard(data: LotoStandardFormData) {
    await this.clickAddNewLotoStandard();
    await this.fillLotoStandardForm(data);
    await this.clickSave();
  }

  // ==================== READ ====================

  async searchLotoStandard(term: string) {
    await this.search(term);
  }

  async selectLotoStandard(name: string) {
    await this.clickTableRow(name);
  }

  async isLotoStandardVisible(name: string): Promise<boolean> {
    return await this.isRowVisible(name);
  }

  // ==================== UPDATE ====================

  async modifyLotoStandard(name: string, newData: LotoStandardFormData) {
    await this.clickTableRow(name);
    await this.page.waitForTimeout(300);

    if (newData.name) {
      await this.fillInputByIndex(0, newData.name);
    }

    if (newData.description) {
      const descInput = this.page.locator('textarea, .form-input-element').nth(1);
      await descInput.click();
      await descInput.clear();
      await descInput.fill(newData.description);
    }

    await this.clickSave();
  }

  // ==================== DELETE ====================

  async deleteLotoStandard(name: string) {
    await this.clickTableRow(name);
    await this.page.waitForTimeout(300);
    await this.clickDelete();
    await this.confirmDelete();
  }

  async deleteLotoStandardViaContextMenu(name: string) {
    await this.rightClickTableRow(name);
    await this.clickContextMenuItem('Delete');
    await this.confirmDelete();
  }

  // ==================== LOTO POINTS MANAGEMENT ====================

  async goToLotoPointsTab() {
    // Click on LOTO Points tab in carousel
    await this.page.locator('.nav-btn').filter({ hasText: /loto.*point/i }).click();
    await this.page.waitForTimeout(300);
  }

  async addLotoPointToStandard(tagNumber: string) {
    await this.goToLotoPointsTab();

    // Click add button in the double table
    await this.clickButton(/add/i);
    await this.page.waitForTimeout(300);

    // Search and select the LOTO point
    await this.search(tagNumber);
    await this.clickTableRow(tagNumber);
    await this.clickButton(/select|add/i);
  }

  async removeLotoPointFromStandard(tagNumber: string) {
    await this.goToLotoPointsTab();

    // Find and remove the LOTO point
    await this.clickTableRow(tagNumber);
    await this.clickButton(/remove/i);
  }

  // ==================== IMAGES TAB ====================

  async goToImagesTab() {
    await this.page.locator('.nav-btn').filter({ hasText: /image/i }).click();
    await this.page.waitForTimeout(300);
  }

  // ==================== CAROUSEL NAVIGATION ====================

  async goToGeneralInfoTab() {
    await this.page.locator('.nav-btn').filter({ hasText: /general|info/i }).click();
    await this.page.waitForTimeout(300);
  }

  async nextSlide() {
    await this.page.locator('.carousel-arrow-right').click();
    await this.page.waitForTimeout(300);
  }

  async previousSlide() {
    await this.page.locator('.carousel-arrow-left').click();
    await this.page.waitForTimeout(300);
  }

  // ==================== WORKFLOW API (no browser) ====================
  // Mirror of LotoStandardWorkflowIT (Java IT) for the standard development
  // lifecycle. All calls go through Playwright's APIRequestContext so they
  // run in the same browser session as the logged-in admin.

  private get backendUrl(): string {
    return config.clientBackendUrl;
  }

  /** Create a standard with N LOTO points. Returns {standardId, pointIds}. */
  async createStandardWithPoints(opts: {
    name: string;
    description?: string;
    pointCount?: number;
    pointPrefix?: string;
  }): Promise<{ standardId: number; pointIds: number[] }> {
    const count = opts.pointCount ?? 4;
    const prefix = opts.pointPrefix ?? `IT-${Date.now().toString().slice(-6)}`;

    const pointIds: number[] = [];
    for (let i = 1; i <= count; i++) {
      const res = await this.page.request.post(`${this.backendUrl}/ng/loto-points`, {
        data: {
          tagNumber: `${prefix}-${i}`,
          description: `${opts.name} point ${i}`,
          specificLocation: 'IT location',
          equipmentIdList: [],
          isLabeled: true,
          isLockable: true,
        },
      });
      if (!res.ok()) throw new Error(`createLotoPoint #${i} failed: ${await res.text()}`);
      const body = await res.json();
      const id: number = body?.responseData?.id;
      if (!id) throw new Error(`createLotoPoint #${i} no id: ${JSON.stringify(body)}`);
      pointIds.push(id);
    }

    const standardRes = await this.page.request.post(`${this.backendUrl}/ng/loto-standards`, {
      data: {
        name: opts.name,
        description: opts.description ?? 'IT fixture',
        lotoPoints: pointIds,
      },
    });
    if (!standardRes.ok()) throw new Error(`createStandard failed: ${await standardRes.text()}`);
    const standardBody = await standardRes.json();
    const standardId: number = standardBody?.responseData?.id;
    if (!standardId) throw new Error(`createStandard no id: ${JSON.stringify(standardBody)}`);

    return { standardId, pointIds };
  }

  /** GET /ng/loto-standards/{id} — returns parsed response. */
  async getStandard(id: number): Promise<any> {
    const res = await this.page.request.get(`${this.backendUrl}/ng/loto-standards/${id}`);
    if (!res.ok()) throw new Error(`getStandard(${id}) failed: ${await res.text()}`);
    return (await res.json())?.responseData;
  }

  /** Returns just the development status name ("Draft", "Approved", etc.) or null. */
  async getStandardStatus(id: number): Promise<string | null> {
    const dto = await this.getStandard(id);
    const ds = dto?.developmentStatus;
    if (!ds) return null;
    if (typeof ds === 'string') return ds;
    return ds.name ?? null;
  }

  /** Returns the pendingReviewSince timestamp string, or null. */
  async getPendingReviewSince(id: number): Promise<string | null> {
    const dto = await this.getStandard(id);
    const v = dto?.pendingReviewSince;
    if (!v) return null;
    return typeof v === 'string' ? v : null;
  }

  /**
   * POST /workflow/{transition} with optional step-up token. Transition is
   * one of: submit-for-verification, verify, walkdown-complete,
   * ready-for-testing, approve, send-back-to-draft.
   */
  async workflowTransition(
    standardId: number,
    transition: string,
    opts: { stepUpToken?: string; notes?: string } = {}
  ): Promise<APIResponse> {
    const headers: Record<string, string> = {};
    if (opts.stepUpToken) headers['X-Sign-As-Token'] = opts.stepUpToken;
    return this.page.request.post(
      `${this.backendUrl}/ng/loto-standards/${standardId}/workflow/${transition}`,
      {
        headers,
        data: { notes: opts.notes ?? null },
      }
    );
  }

  /** GET /workflow/history — returns the array of approval events. */
  async getWorkflowHistory(standardId: number): Promise<any[]> {
    const res = await this.page.request.get(
      `${this.backendUrl}/ng/loto-standards/${standardId}/workflow/history`
    );
    if (!res.ok()) throw new Error(`getWorkflowHistory failed: ${await res.text()}`);
    const body = await res.json();
    return body?.responseData ?? [];
  }

  // ── Pending review (loto-procedure.md §3.3) ──

  /** GET /{id}/pending-changes */
  async getPendingChanges(standardId: number): Promise<any[]> {
    const res = await this.page.request.get(
      `${this.backendUrl}/ng/loto-standards/${standardId}/pending-changes`
    );
    if (!res.ok()) throw new Error(`getPendingChanges failed: ${await res.text()}`);
    return (await res.json())?.responseData ?? [];
  }

  /** POST /pending-changes/{id}/keep with step-up. */
  async keepPendingChange(changeId: number, stepUpToken: string): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/loto-standards/pending-changes/${changeId}/keep`,
      { headers: { 'X-Sign-As-Token': stepUpToken } }
    );
  }

  /** POST /pending-changes/{id}/dismiss with step-up. */
  async dismissPendingChange(changeId: number, stepUpToken: string): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/loto-standards/pending-changes/${changeId}/dismiss`,
      { headers: { 'X-Sign-As-Token': stepUpToken } }
    );
  }

  /** POST /{id}/workflow/close-review. */
  async closeReview(
    standardId: number,
    opts: { requireReapproval: boolean; stepUpToken: string }
  ): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/loto-standards/${standardId}/workflow/close-review`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { requireReapproval: opts.requireReapproval },
      }
    );
  }

  /** Edit a LOTO point — used to trigger pending-review on APPROVED standards. */
  async editLotoPoint(pointId: number, fields: Record<string, any>): Promise<APIResponse> {
    return this.page.request.put(`${this.backendUrl}/ng/loto-points`, {
      data: { id: pointId, ...fields },
    });
  }

  /** Soft-delete a standard. */
  async deleteStandard(id: number): Promise<APIResponse> {
    return this.page.request.delete(`${this.backendUrl}/ng/loto-standards/${id}`);
  }

  /** Soft-delete a LOTO point. */
  async deleteLotoPoint(id: number): Promise<APIResponse> {
    return this.page.request.delete(`${this.backendUrl}/ng/loto-points/${id}`);
  }
}
