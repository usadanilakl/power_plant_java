import { Page, APIResponse } from '@playwright/test';
import { BasePage } from './base.page';
import { config } from '../test.config';

/**
 * LOTO Permit page object — API-only helpers that mirror NgLotoController's
 * lifecycle endpoints. Used by the Playwright permit-workflow spec which is
 * the Playwright twin of {@code LotoPermitWorkflowIT} (Java IT). Every
 * mutation method that requires authentication carries an optional
 * {@code stepUpToken} so the spec can call the endpoint as a different
 * actor via {@code X-Sign-As-Token}, matching how the production UI's PIN
 * dialog works.
 *
 * <p>See {@code project/features/loto-standard/loto-procedure.md} §4–§5 for
 * the state machine and per-point lifecycle this object exercises.
 */
export class LotoPermitPage extends BasePage {
  readonly backendUrl: string;

  constructor(page: Page) {
    super(page);
    this.backendUrl = config.clientBackendUrl;
  }

  // ── Test fixture setup ────────────────────────────────────────────────────

  /**
   * Ensure LOTO boxes + lock inventory are seeded. The desktop seeds these on
   * startup; in a fresh test instance we have to call this explicitly or
   * createFromStandard will fail with "No available LOTO boxes". Idempotent.
   */
  async seedBoxes(): Promise<void> {
    const res = await this.page.request.post(`${this.backendUrl}/ng/loto-boxes/seed-inventory`);
    if (!res.ok()) throw new Error(`seedBoxes failed: ${await res.text()}`);
  }

  // ── Creation ──────────────────────────────────────────────────────────────

  /**
   * POST /ng/lotos/create-from-standard/{standardId}
   * Caller must hold CONTROL_AUTHORITY → step-up token required.
   */
  async createFromStandard(
    standardId: number,
    opts: { stepUpToken: string; lotoRequestor?: string }
  ): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/lotos/create-from-standard/${standardId}`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: opts.lotoRequestor ? { lotoRequestor: opts.lotoRequestor } : {},
      }
    );
  }

  /** Create from standard and return the new permit's id, or throw on failure. */
  async createFromStandardId(
    standardId: number,
    opts: { stepUpToken: string; lotoRequestor?: string }
  ): Promise<number> {
    const res = await this.createFromStandard(standardId, opts);
    if (!res.ok()) throw new Error(`createFromStandard(${standardId}) failed: ${await res.text()}`);
    const body = await res.json();
    const id: number = body?.responseData?.id;
    if (!id) throw new Error(`createFromStandard no id in body: ${JSON.stringify(body)}`);
    return id;
  }

  // ── Read ──────────────────────────────────────────────────────────────────

  async getPermit(id: number): Promise<any> {
    const res = await this.page.request.get(`${this.backendUrl}/ng/lotos/${id}`);
    if (!res.ok()) throw new Error(`getPermit(${id}) failed: ${await res.text()}`);
    return (await res.json())?.responseData;
  }

  /** Returns the current permitStatus name ("Building", "Active", ...) or null. */
  async getPermitStatus(id: number): Promise<string | null> {
    const dto = await this.getPermit(id);
    const ps = dto?.permitStatus;
    if (!ps) return null;
    if (typeof ps === 'string') return ps;
    return ps.name ?? null;
  }

  /** Returns the IDs of LOTO points on the permit's latest snapshot. */
  async getPointIds(id: number): Promise<number[]> {
    const dto = await this.getPermit(id);
    const points: any[] = dto?.lotoPoints ?? [];
    return points.map(p => p?.id).filter((n): n is number => typeof n === 'number');
  }

  // ── Status transition ─────────────────────────────────────────────────────

  /**
   * PUT /ng/lotos/{id}/status — Building → Active/Test/Modification, → Closed.
   * CA-only.
   */
  async changeStatus(
    permitId: number,
    newStatus: string,
    opts: { stepUpToken: string }
  ): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/status`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { status: newStatus },
      }
    );
  }

  // ── CA-only signatures ────────────────────────────────────────────────────

  async caApproveForHanging(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/ca-approve-hanging`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  async caActivate(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/ca-activate`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  // ── Per-point hang / verify / walkdown / removed ─────────────────────────

  async markPointHung(
    permitId: number,
    pointId: number,
    opts: { stepUpToken: string; acknowledged?: string[]; notes?: string }
  ): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/point/${pointId}/hung`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { acknowledged: opts.acknowledged ?? [], notes: opts.notes ?? '' },
      }
    );
  }

  async markPointVerified(
    permitId: number,
    pointId: number,
    opts: { stepUpToken: string; acknowledged?: string[]; notes?: string }
  ): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/point/${pointId}/verified`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { acknowledged: opts.acknowledged ?? [], notes: opts.notes ?? '' },
      }
    );
  }

  async markPointWalkdown(
    permitId: number,
    pointId: number,
    opts: { stepUpToken: string; notes?: string }
  ): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/point/${pointId}/walkdown`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { notes: opts.notes ?? '' },
      }
    );
  }

  async markPointRemoved(
    permitId: number,
    pointId: number,
    opts: { stepUpToken: string; acknowledged?: string[]; notes?: string }
  ): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/point/${pointId}/removed`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { acknowledged: opts.acknowledged ?? [], notes: opts.notes ?? '' },
      }
    );
  }

  async pullPointForTest(
    permitId: number,
    pointId: number,
    opts: { stepUpToken: string; reason?: string }
  ): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/point/${pointId}/pull-for-test`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { reason: opts.reason ?? 'Playwright pull' },
      }
    );
  }

  // ── Aggregate signatures ─────────────────────────────────────────────────

  async aggregateMarkHung(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/hung`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  async aggregateMarkVerified(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/verified`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  // ── Requestor transfer ────────────────────────────────────────────────────

  async transferRequestor(
    permitId: number,
    fromUser: string,
    toUser: string,
    opts: { stepUpToken: string }
  ): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/transfer`,
      {
        headers: { 'X-Sign-As-Token': opts.stepUpToken },
        data: { fromUser, toUser },
      }
    );
  }

  async acceptTransfer(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/accept`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  // ── Release / remove locks ────────────────────────────────────────────────

  async releaseByRequestor(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/release-requestor`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  async releaseByControlAuthority(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/release-ca`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  async removeLocks(permitId: number, opts: { stepUpToken: string }): Promise<APIResponse> {
    return this.page.request.put(
      `${this.backendUrl}/ng/lotos/${permitId}/lifecycle/remove-locks`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  // ── Add point (CA + Building/Modification only — phase 0.4) ──────────────

  async addPointToPermit(
    permitId: number,
    pointId: number,
    opts: { stepUpToken: string }
  ): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/lotos/add/${pointId}/to/${permitId}`,
      { headers: { 'X-Sign-As-Token': opts.stepUpToken } }
    );
  }

  // ── Personnel sign-on / sign-off ──────────────────────────────────────────

  async signOnPerson(
    permitId: number,
    personName: string,
    personRole: string
  ): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/lotos/${permitId}/sign-on`,
      {
        data: {
          personName,
          personRole,
          company: 'IT',
          signOnTime: new Date().toISOString(),
          performedBy: 'admin',
          foreman: false,
        },
      }
    );
  }

  async signOffPerson(permitId: number, personName: string): Promise<APIResponse> {
    return this.page.request.post(
      `${this.backendUrl}/ng/lotos/${permitId}/sign-off`,
      { data: { name: personName, comments: 'IT off' } }
    );
  }

  // ── Cleanup ───────────────────────────────────────────────────────────────

  async deletePermit(id: number): Promise<APIResponse> {
    return this.page.request.delete(`${this.backendUrl}/ng/lotos/${id}`);
  }
}
