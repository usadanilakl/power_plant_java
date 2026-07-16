import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { SpringPaginatedResponse } from '../../../../models/api/spring-pagenated.response.model';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { CounterpartStandardPreviewDto } from '../../../../models/loto/counterpart-standard-preview.model';
import { SearchCriteria } from '../../../../models/api/search-criteria.model';
import { SpringApiResponse } from '../../../../models/api/spring-api-response.model';
import { LotoStandardIdDto } from '../../../../models/loto/loto-standard-id.model';
import {
  LotoStandardApprovalEventDto,
  LotoStandardPendingChangeDto,
} from '../../../../models/loto/loto-standard-workflow.model';
import { LotoStandardMapperService } from './rf-loto-standard-mapper.service';

@Injectable({
  providedIn: 'root',
})
export class RfLotoStandardApiService {
  private apiUrl = `${environment.apiUrl}/loto-standards`;

  constructor(
    private http: HttpClient,
    private mapper: LotoStandardMapperService
  ) {}

  /**
   * Get paginated loto standards
   */
  getLotoStandards(
    page: number = 1,
    pageSize: number = 50
  ): Observable<SpringPaginatedResponse<LotoStandardDto>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString());
    return this.http.get<SpringPaginatedResponse<LotoStandardDto>>(
      `${this.apiUrl}/paginated`,
      { params }
    );
  }

  /**
   * Search loto standards with criteria
   */
  searchLotoStandards(
    criteria: SearchCriteria,
    pageSize: number
  ): Observable<SpringPaginatedResponse<LotoStandardDto>> {
    const params = new HttpParams()
      .set('page', (criteria.page ?? 1).toString())
      .set('pageSize', pageSize.toString());

    return this.http.post<SpringPaginatedResponse<LotoStandardDto>>(
      `${this.apiUrl}/search`,
      criteria,
      { params }
    );
  }

  /**
   * Get single loto standard by ID
   */
  getLotoStandardById(id: string): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.get<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${id}`
    );
  }

  /**
   * Get all loto standards as a flat list.
   * Prefer this for simple dropdowns/pickers that do not need pagination.
   */
  getAllLotoStandards(): Observable<SpringApiResponse<LotoStandardDto[]>> {
    return this.http.get<SpringApiResponse<LotoStandardDto[]>>(
      `${this.apiUrl}/get-all`
    );
  }

  /**
   * Create new loto standard
   */
  createLotoStandard(
    lotoStandard: LotoStandardDto
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    const lotoStandardIdDto = this.mapper.toIdDto(lotoStandard);

    console.log('createLotoStandard received:', lotoStandard);
    console.log('Sending to backend:', lotoStandardIdDto);

    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      this.apiUrl,
      lotoStandardIdDto
    );
  }

  /**
   * Duplicate an existing standard into a fresh independent DRAFT copy.
   * LOTO points are shared references (physical isolation points); everything
   * else — name/description/prose/prerequisites/order/groups — is deep-copied.
   * Backend gates this on CONTROL_AUTHORITY.
   */
  duplicateLotoStandard(
    standardId: number
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/duplicate`,
      null
    );
  }

  /**
   * Update existing loto standard
   * Note: lotoPoints are excluded from updates as they are managed separately via
   * addLotoPointToStandard, removeLotoPointFromStandard, and reorderLotoPoints
   */
  updateLotoStandard(
    lotoStandard: Partial<LotoStandardIdDto | LotoStandardDto>
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    // Exclude lotoPoints from update - they are managed separately
    const lotoStandardIdDto = this.mapper.toIdDto(lotoStandard, true);

    console.log('updateLotoStandard received:', lotoStandard);
    console.log('Sending to backend (lotoPoints excluded):', lotoStandardIdDto);

    const headers = new HttpHeaders().set('Content-Type', 'application/json');
    return this.http.put<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}`,
      lotoStandardIdDto,
      { headers }
    );
  }

  /**
   * Save loto standard - creates if new, updates if existing
   */
  saveLotoStandard(lotoStandard: LotoStandardDto): Observable<SpringApiResponse<LotoStandardDto>> {
    if (lotoStandard.id) {
      return this.updateLotoStandard(lotoStandard);
    } else {
      return this.createLotoStandard(lotoStandard);
    }
  }

  /**
   * Delete loto standard by ID
   */
  deleteLotoStandard(id: string): Observable<SpringApiResponse<void>> {
    return this.http.delete<SpringApiResponse<void>>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get filtered unique values for a column (for dropdown filters)
   */
  getFilteredUniqueValuesOfColumn(
    column: string,
    searchCriteria: SearchCriteria,
    page: number = 1,
    pageSize: number = 50,
    andLogicEnabled: boolean = true
  ): Observable<SpringPaginatedResponse<string>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('pageSize', pageSize.toString())
      .set('andLogicEnabled', andLogicEnabled.toString());

    return this.http.post<SpringPaginatedResponse<string>>(
      `${this.apiUrl}/unique-values/${column}/filtered`,
      searchCriteria,
      { params }
    );
  }

  /**
   * Get loto standards grouped by specified criteria for left menu
   * @param groupBy The grouping criteria: system, unit, etc.
   * @returns Map of group names to arrays of loto standards
   */
  getGroupedLotoStandards(groupBy: string): Observable<SpringApiResponse<{ [key: string]: LotoStandardDto[] }>> {
    const params = new HttpParams().set('groupBy', groupBy);

    return this.http.get<SpringApiResponse<{ [key: string]: LotoStandardDto[] }>>(
      `${this.apiUrl}/grouped`,
      { params }
    );
  }

  /**
   * Add a LOTO point to a standard
   * @param standardId The ID of the standard
   * @param lotoPointId The ID of the LOTO point to add
   */
  addLotoPointToStandard(standardId: number, lotoPointId: number): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/add-loto-point/${lotoPointId}`,
      {}
    );
  }

  /**
   * Remove a LOTO point from a standard
   * @param standardId The ID of the standard
   * @param lotoPointId The ID of the LOTO point to remove
   */
  removeLotoPointFromStandard(standardId: number, lotoPointId: number): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.delete<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/remove-loto-point/${lotoPointId}`
    );
  }

  /**
   * Reorder LOTO points in a standard
   * @param standardId The ID of the standard
   * @param lotoPointIds Ordered array of LOTO point IDs
   */
  reorderLotoPoints(standardId: number, lotoPointIds: number[]): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.put<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/reorder-loto-points`,
      lotoPointIds
    );
  }

  /**
   * Generate counterpart standard preview.
   * Returns categorized counterpart LOTO points for each point in the source standard.
   */
  generateCounterpartPreview(standardId: number): Observable<SpringApiResponse<CounterpartStandardPreviewDto>> {
    return this.http.get<SpringApiResponse<CounterpartStandardPreviewDto>>(
      `${this.apiUrl}/${standardId}/counterpart-preview`
    );
  }

  // ── Development workflow ─────────────────────────────────────────────────

  /**
   * Trigger a workflow transition by hitting the matching backend endpoint.
   * `endpointSegment` is one of: submit-for-verification, verify, walkdown-complete,
   * ready-for-testing, approve, send-back-to-draft.
   */
  workflowTransition(
    standardId: number,
    endpointSegment: string,
    notes: string | null,
    stepUpToken?: string | null
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    const body = notes ? { notes } : {};
    const options = stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {};
    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/workflow/${endpointSegment}`,
      body,
      options
    );
  }

  /** Returns oldest-first list of approval events for a standard. */
  getWorkflowHistory(standardId: number): Observable<SpringApiResponse<LotoStandardApprovalEventDto[]>> {
    return this.http.get<SpringApiResponse<LotoStandardApprovalEventDto[]>>(
      `${this.apiUrl}/${standardId}/workflow/history`
    );
  }

  // ── Pending review (loto-procedure.md §3.3) ──────────────────────────────

  /**
   * List every pending-change row for a standard (oldest-first). Rows with
   * resolution = PENDING are unresolved; KEPT / DISMISSED have already been
   * acted on by a reviewer but are kept in the list for context.
   */
  getPendingChanges(standardId: number): Observable<SpringApiResponse<LotoStandardPendingChangeDto[]>> {
    return this.http.get<SpringApiResponse<LotoStandardPendingChangeDto[]>>(
      `${this.apiUrl}/${standardId}/pending-changes`
    );
  }

  /**
   * Mark a single change as KEPT — the newValue stays on the underlying entity.
   * {@code stepUpToken} is optional: when the logged-in user already holds
   * CA or Manager role they can call this without a sign-as token; the token
   * is only needed to escalate as someone else.
   */
  keepPendingChange(changeId: number, stepUpToken?: string | null)
      : Observable<SpringApiResponse<LotoStandardPendingChangeDto>> {
    return this.http.post<SpringApiResponse<LotoStandardPendingChangeDto>>(
      `${this.apiUrl}/pending-changes/${changeId}/keep`,
      {},
      stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {}
    );
  }

  /** Mark a single change as DISMISSED — reviewer wants it reverted. */
  dismissPendingChange(changeId: number, stepUpToken?: string | null)
      : Observable<SpringApiResponse<LotoStandardPendingChangeDto>> {
    return this.http.post<SpringApiResponse<LotoStandardPendingChangeDto>>(
      `${this.apiUrl}/pending-changes/${changeId}/dismiss`,
      {},
      stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {}
    );
  }

  /**
   * Close the review window. {@code requireReapproval=false} → standard stays
   * APPROVED. {@code true} → flips to NEW_PENDING_REAPPROVAL. Rejects if any
   * PENDING rows remain. {@code stepUpToken} optional — see keepPendingChange.
   */
  closeReview(standardId: number, requireReapproval: boolean, stepUpToken?: string | null)
      : Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.post<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/workflow/close-review`,
      { requireReapproval },
      stepUpToken ? { headers: { 'X-Sign-As-Token': stepUpToken } } : {}
    );
  }

  /** Replace the entire per-point prerequisites map for a standard. */
  updatePrerequisites(
    standardId: number,
    prerequisites: Record<number, {
      installRequiredPointIds: number[];
      installSafetyConditions: string[];
      installNotes?: string | null;
      removalRequiredPointIds: number[];
      removalSafetyConditions: string[];
      removalNotes?: string | null;
      removalOrder?: number | null;
    }>
  ): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.put<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/prerequisites`,
      prerequisites
    );
  }

  /** Update procedural prose fields. Pass null to leave a field unchanged. */
  updateProceduralText(standardId: number, body: {
    installPrerequisitesText?: string | null;
    installHazardControlText?: string | null;
    installProcedureText?: string | null;
    removalPrerequisitesText?: string | null;
    removalHazardControlText?: string | null;
    removalProcedureText?: string | null;
  }): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.put<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/procedural-text`,
      body
    );
  }

  /** Toggle the standard's "removal reverses install order" flag. */
  setRemovalReverse(standardId: number, reverse: boolean): Observable<SpringApiResponse<LotoStandardDto>> {
    return this.http.put<SpringApiResponse<LotoStandardDto>>(
      `${this.apiUrl}/${standardId}/removal-reverse`,
      { reverse }
    );
  }
}
