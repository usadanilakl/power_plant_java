import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { MaximoFormSubmission, MaximoFormTemplate, ReorderLine, ReorderResult } from '../../models/maximo/maximo-form.models';

/** Client for the electronic Maximo task-forms API (/ng/maximo/forms). */
@Injectable({ providedIn: 'root' })
export class MaximoFormApiService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/maximo/forms`;

  // ── Templates ─────────────────────────────────────────────────────────────
  listTemplates(): Observable<MaximoFormTemplate[]> {
    return this.http.get<SpringApiResponse<MaximoFormTemplate[]>>(`${this.base}/templates`)
      .pipe(map(r => r.responseData ?? []));
  }

  getTemplate(id: number): Observable<MaximoFormTemplate | null> {
    return this.http.get<SpringApiResponse<MaximoFormTemplate>>(`${this.base}/templates/${id}`)
      .pipe(map(r => r.responseData ?? null));
  }

  saveTemplate(dto: MaximoFormTemplate): Observable<MaximoFormTemplate> {
    return this.http.post<SpringApiResponse<MaximoFormTemplate>>(`${this.base}/templates`, dto)
      .pipe(map(r => r.responseData));
  }

  deleteTemplate(id: number): Observable<void> {
    return this.http.delete<SpringApiResponse<void>>(`${this.base}/templates/${id}`).pipe(map(() => void 0));
  }

  /** Seed the curated procedure-form templates (idempotent). Returns the seeded templates. */
  seedTemplates(): Observable<MaximoFormTemplate[]> {
    return this.http.post<SpringApiResponse<MaximoFormTemplate[]>>(`${this.base}/templates/seed`, {})
      .pipe(map(r => r.responseData ?? []));
  }

  /** Templates whose match rule fits a WO (by pmnum and/or description). */
  templatesForWo(pmnum?: string, description?: string): Observable<MaximoFormTemplate[]> {
    let p = new HttpParams();
    if (pmnum) p = p.set('pmnum', pmnum);
    if (description) p = p.set('description', description);
    return this.http.get<SpringApiResponse<MaximoFormTemplate[]>>(`${this.base}/templates/for-wo`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  /**
   * The completion form(s) ASSIGNED to a WO's recurring PM (via PM Scheduling), matched by pmnum then
   * description. Drives the WO Complete tab: none = manual; one = auto; several = the operator picks one.
   */
  completionFormsForWo(pmnum?: string, description?: string): Observable<MaximoFormTemplate[]> {
    let p = new HttpParams();
    if (pmnum) p = p.set('pmnum', pmnum);
    if (description) p = p.set('description', description);
    return this.http.get<SpringApiResponse<MaximoFormTemplate[]>>(`${this.base}/for-wo`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  // ── Submissions ────────────────────────────────────────────────────────────
  submissionsForWo(wonum: string): Observable<MaximoFormSubmission[]> {
    const p = new HttpParams().set('wonum', wonum);
    return this.http.get<SpringApiResponse<MaximoFormSubmission[]>>(`${this.base}/submissions/for-wo`, { params: p })
      .pipe(map(r => r.responseData ?? []));
  }

  /** Newest submission of a form (any WO) — used to carry settings/values forward into a fresh run. */
  latestSubmissionForForm(formKey: string): Observable<MaximoFormSubmission | null> {
    const p = new HttpParams().set('formKey', formKey);
    return this.http.get<SpringApiResponse<MaximoFormSubmission>>(`${this.base}/submissions/latest-for-form`, { params: p })
      .pipe(map(r => r.responseData ?? null));
  }

  /** Dry-run: which reagents on a filled inventory form are below target (no email, no writes). */
  reorderPreview(dto: MaximoFormSubmission): Observable<ReorderLine[]> {
    return this.http.post<SpringApiResponse<ReorderLine[]>>(`${this.base}/submissions/reorder-preview`, dto)
      .pipe(map(r => r.responseData ?? []));
  }

  /** Send the vendor reorder email and attach the order summary to the work order. */
  reorderSend(dto: MaximoFormSubmission): Observable<ReorderResult> {
    return this.http.post<SpringApiResponse<ReorderResult>>(`${this.base}/submissions/reorder-send`, dto)
      .pipe(map(r => r.responseData));
  }

  saveDraft(dto: MaximoFormSubmission): Observable<MaximoFormSubmission> {
    return this.http.post<SpringApiResponse<MaximoFormSubmission>>(`${this.base}/submissions`, dto)
      .pipe(map(r => r.responseData));
  }

  /** Save + complete: renders a PDF, attaches it to the WO, adds worklog/write-back, advances status. */
  complete(dto: MaximoFormSubmission): Observable<MaximoFormSubmission> {
    return this.http.post<SpringApiResponse<MaximoFormSubmission>>(`${this.base}/submissions/complete`, dto)
      .pipe(map(r => r.responseData));
  }

  /**
   * Preview the completion PDF WITHOUT shipping to Maximo — the exact same bytes {@link complete} would attach,
   * returned as a Blob for viewing/testing. Nothing is saved and no work-order write-back happens.
   */
  previewPdf(dto: MaximoFormSubmission): Observable<Blob> {
    return this.http.post(`${this.base}/submissions/preview-pdf`, dto, { responseType: 'blob' });
  }
}
