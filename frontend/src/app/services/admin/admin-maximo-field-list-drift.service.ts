import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';

export interface MaximoFieldListDriftRow {
  id: number;
  title: string;
  listTypeName: string | null;
  localStatus: string | null;
  maximoRecordType: 'SR' | 'WO' | null;
  maximoRecordId: string | null;
  maximoStatus: string | null;
  maximoSyncPending: boolean | null;
  maximoCancelPending: boolean | null;
  maximoCompletePending: boolean | null;
  dateModified: string | null;
  submitterName: string | null;
  deleted: boolean | null;
}

export interface MaximoFieldListDriftBucket {
  count: number;
  oldestAgeDays: number | null;
  samples: MaximoFieldListDriftRow[];
}

export interface MaximoFieldListDrift {
  createPending: MaximoFieldListDriftBucket;
  cancelPending: MaximoFieldListDriftBucket;
  completePending: MaximoFieldListDriftBucket;
  maximoClosedLocalOpen: MaximoFieldListDriftBucket;
  localClosedMaximoOpen: MaximoFieldListDriftBucket;
  /** Local rows whose listType routes to Maximo but were never submitted (maximoRecordId null). */
  localNotInMaximo: MaximoFieldListDriftBucket;
  attachmentUploadPendingCount: number;
  totalRoutedToMaximo: number;
  computedAt: string;
}

/** Result of a resolve/retry action from the admin panel. */
export interface MaximoFieldListResolveResult {
  ok: boolean;
  message: string;
}

/** Bulk-cancel preview — read-only. Samples drive the on-screen review table before executing. */
export interface MaximoBulkCancelPreview {
  candidateCount: number;
  samples: MaximoFieldListDriftRow[];
  maximoStatuses: string[];
  localStatuses: string[];
}

export interface MaximoBulkCancelFailure {
  id: number;
  wonum: string | null;
  error: string;
}

/** Bulk-cancel result — per-row failures are captured so the admin can retry/report. */
export interface MaximoBulkCancelResult {
  attempted: number;
  cancelled: number;
  failed: number;
  failures: MaximoBulkCancelFailure[];
}

/** Request shape shared by preview + execute. Empty status lists = server defaults
 *  (WAPPR/APPR/WSCH/INPRG on Maximo; Closed/Cancelled locally — the "orphan" case). */
export interface MaximoBulkCancelRequest {
  maximoStatuses?: string[];
  localStatuses?: string[];
  reason?: string;
  sampleLimit?: number;
}

@Injectable({ providedIn: 'root' })
export class AdminMaximoFieldListDriftService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/admin/maximo-field-list-drift`;

  snapshot(limit = 25): Observable<SpringApiResponse<MaximoFieldListDrift>> {
    const params = new HttpParams().set('limit', String(limit));
    return this.http.get<SpringApiResponse<MaximoFieldListDrift>>(`${this.apiUrl}/snapshot`, { params });
  }

  /** Retry Maximo submit for a row stuck in create-pending. */
  retrySubmit(id: number): Observable<SpringApiResponse<MaximoFieldListResolveResult>> {
    return this.http.post<SpringApiResponse<MaximoFieldListResolveResult>>(
      `${this.apiUrl}/retry-submit/${id}`, {});
  }

  /** Retry Maximo cancel for a soft-deleted row stuck in cancel-pending. */
  retryCancel(id: number): Observable<SpringApiResponse<MaximoFieldListResolveResult>> {
    return this.http.post<SpringApiResponse<MaximoFieldListResolveResult>>(
      `${this.apiUrl}/retry-cancel/${id}`, {});
  }

  /** Retry Maximo WO COMP for a row stuck in complete-pending. */
  retryComplete(id: number): Observable<SpringApiResponse<MaximoFieldListResolveResult>> {
    return this.http.post<SpringApiResponse<MaximoFieldListResolveResult>>(
      `${this.apiUrl}/retry-complete/${id}`, {});
  }

  /** Retry a single stuck attachment upload — id is the PermitAttachment id. */
  retryAttachment(attachmentId: number): Observable<SpringApiResponse<MaximoFieldListResolveResult>> {
    return this.http.post<SpringApiResponse<MaximoFieldListResolveResult>>(
      `${this.apiUrl}/retry-attachment/${attachmentId}`, {});
  }

  /**
   * Adopt Maximo's terminal status into the local FieldListItem — for rows where Maximo went
   * terminal via a route outside our bridge (ops closed the SR manually, etc.) and the local
   * mirror is still open. One-way local-catch-up; does not touch Maximo.
   */
  acceptMaximoStatus(id: number): Observable<SpringApiResponse<MaximoFieldListResolveResult>> {
    return this.http.post<SpringApiResponse<MaximoFieldListResolveResult>>(
      `${this.apiUrl}/accept-maximo-status/${id}`, {});
  }

  /** Re-push local Closed state to Maximo — for local-closed / WO-still-open rows. */
  pushLocalClose(id: number): Observable<SpringApiResponse<MaximoFieldListResolveResult>> {
    return this.http.post<SpringApiResponse<MaximoFieldListResolveResult>>(
      `${this.apiUrl}/push-local-close/${id}`, {});
  }

  /** Preview bulk-cancel candidates (dry-read). Empty statuses = server defaults. */
  bulkCancelPreview(req: MaximoBulkCancelRequest): Observable<SpringApiResponse<MaximoBulkCancelPreview>> {
    return this.http.post<SpringApiResponse<MaximoBulkCancelPreview>>(
      `${this.apiUrl}/bulk-cancel/preview`, req);
  }

  /** Execute the bulk cancel — one Maximo cancel per row. Batch-continues past failures. */
  bulkCancelExecute(req: MaximoBulkCancelRequest): Observable<SpringApiResponse<MaximoBulkCancelResult>> {
    return this.http.post<SpringApiResponse<MaximoBulkCancelResult>>(
      `${this.apiUrl}/bulk-cancel/execute`, req);
  }
}
