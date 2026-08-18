import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, from, map, of, switchMap, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompleteWorkOrderRequest, CreateMaximoServiceRequest, MaximoDoclink, MaximoFormSubmission, MaximoFormTemplate,
  MaximoInventoryItem, MaximoLocation, MaximoOverview, MaximoServiceRequest, MaximoWorkOrder, MaximoWorklog,
  PartsCheckoutRequest, PartsCheckoutResult, PhysicalObjectNode, ReorderLine, ReorderResult,
} from './maximo.model';

export interface WoQuery { status?: string; worktype?: string; location?: string; textContains?: string; wonumContains?: string; pageSize?: number; }
export interface SrQuery { status?: string; location?: string; textContains?: string; pageSize?: number; }

/** Read a File into pure base64 (no data-URL prefix) for JSON upload. FileReader is reliable on iOS Safari,
 *  unlike multipart FormData whose "file" part iOS drops in transit to the hub. */
function fileToBase64(file: File): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const s = String(reader.result ?? '');
      const marker = s.indexOf('base64,');
      resolve(marker >= 0 ? s.slice(marker + 'base64,'.length) : s);
    };
    reader.onerror = () => reject(reader.error ?? new Error('Could not read the file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Mobile Maximo API. Calls the Plant-gated PWA endpoints on the hub (`/api/pwa/secured/maximo`), which proxy
 * the same desktop Maximo service beans. JWT interceptor attaches the bearer token.
 */
@Injectable({ providedIn: 'root' })
export class MaximoApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/maximo`;
  private poBase = `${environment.serverUrl}/api/pwa/secured/physical-object`;

  listWorkOrders(q: WoQuery = {}): Observable<MaximoWorkOrder[]> {
    let params = new HttpParams().set('pageSize', String(q.pageSize ?? 50));
    if (q.status) params = params.set('status', q.status);
    if (q.worktype) params = params.set('worktype', q.worktype);
    if (q.location) params = params.set('location', q.location);
    if (q.textContains) params = params.set('textContains', q.textContains);
    if (q.wonumContains) params = params.set('wonumContains', q.wonumContains);
    return this.http.get<{ responseData: MaximoWorkOrder[] }>(`${this.base}/work-orders`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  listServiceRequests(q: SrQuery = {}): Observable<MaximoServiceRequest[]> {
    let params = new HttpParams().set('pageSize', String(q.pageSize ?? 50));
    if (q.status) params = params.set('status', q.status);
    if (q.location) params = params.set('location', q.location);
    if (q.textContains) params = params.set('textContains', q.textContains);
    return this.http.get<{ responseData: MaximoServiceRequest[] }>(`${this.base}/service-requests`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  createServiceRequest(body: CreateMaximoServiceRequest): Observable<MaximoServiceRequest | null> {
    return this.http.post<{ responseData: MaximoServiceRequest }>(`${this.base}/service-requests`, body).pipe(
      timeout(30000),
      map(r => r.responseData ?? null)
    );
  }

  searchInventory(q: string): Observable<MaximoInventoryItem[]> {
    const params = new HttpParams().set('q', q).set('pageSize', '30');
    return this.http.get<{ responseData: MaximoInventoryItem[] }>(`${this.base}/inventory`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  checkoutParts(req: PartsCheckoutRequest): Observable<PartsCheckoutResult | null> {
    return this.http.post<{ responseData: PartsCheckoutResult }>(`${this.base}/parts-checkout`, req).pipe(
      timeout(60000),
      map(r => r.responseData ?? null)
    );
  }

  searchLocations(q: string): Observable<MaximoLocation[]> {
    const params = new HttpParams().set('q', q).set('pageSize', '25');
    return this.http.get<{ responseData: MaximoLocation[] }>(`${this.base}/locations`, { params }).pipe(
      timeout(20000),
      map(r => r.responseData ?? [])
    );
  }

  /**
   * The whole Maximo-seeded PhysicalObject hierarchy as a flat list (id + parentId), for the SR target tree
   * picker. Same payload as the desktop `/ng/physical-object/tree`; the caller assembles the tree client-side.
   */
  getPhysicalObjectTree(): Observable<PhysicalObjectNode[]> {
    return this.http.get<{ responseData: PhysicalObjectNode[] }>(`${this.poBase}/tree`).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Child tasks of a work order (by parent wonum). */
  listWoTasks(wonum: string): Observable<MaximoWorkOrder[]> {
    return this.http.get<{ responseData: MaximoWorkOrder[] }>(`${this.base}/work-orders/${encodeURIComponent(wonum)}/tasks`).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** The completion form(s) assigned to a WO's PM (by pmnum then description): none / one / several. */
  getFormsForWo(pmnum: string | undefined, description: string | undefined): Observable<MaximoFormTemplate[]> {
    let params = new HttpParams();
    if (pmnum) params = params.set('pmnum', pmnum);
    if (description) params = params.set('description', description);
    return this.http.get<{ responseData: MaximoFormTemplate[] }>(`${this.base}/forms/for-wo`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Submit a completed PM form. */
  completeForm(dto: MaximoFormSubmission): Observable<MaximoFormSubmission | null> {
    return this.http.post<{ responseData: MaximoFormSubmission }>(`${this.base}/forms/complete`, dto).pipe(
      timeout(60000),
      map(r => r.responseData ?? null)
    );
  }

  /** Existing submissions for a work order (newest first) — used to prefill a form already started on this WO. */
  submissionsForWo(wonum: string): Observable<MaximoFormSubmission[]> {
    const params = new HttpParams().set('wonum', wonum);
    return this.http.get<{ responseData: MaximoFormSubmission[] }>(`${this.base}/forms/submissions/for-wo`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** A PM's previously-completed work orders (COMP/CLOSE), newest first — the per-PM history list. */
  pmCompletedHistory(pmnum: string): Observable<MaximoWorkOrder[]> {
    const params = new HttpParams().set('pmnum', pmnum);
    return this.http.get<{ responseData: MaximoWorkOrder[] }>(`${this.base}/pm-completed-history`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Newest submission of a form across all WOs — carries sticky settings forward (e.g. chem-inventory reorder config). */
  latestSubmissionForForm(formKey: string): Observable<MaximoFormSubmission | null> {
    const params = new HttpParams().set('formKey', formKey);
    return this.http.get<{ responseData: MaximoFormSubmission }>(`${this.base}/forms/submissions/latest-for-form`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? null)
    );
  }

  /** Complete a work order or task (by href). Blank laborcode defaults to the signed-in user server-side. */
  completeWorkOrder(href: string, body: CompleteWorkOrderRequest): Observable<MaximoWorkOrder | null> {
    const params = new HttpParams().set('href', href);
    return this.http.post<{ responseData: MaximoWorkOrder }>(`${this.base}/work-orders/complete`, body, { params }).pipe(
      timeout(40000),
      map(r => r.responseData ?? null)
    );
  }

  /** Grab a WO for offline work: server marks it in-progress + assigns it to you. Returns the refreshed WO. */
  grabWorkOrder(href: string): Observable<MaximoWorkOrder | null> {
    const params = new HttpParams().set('href', href);
    return this.http.post<{ responseData: MaximoWorkOrder }>(`${this.base}/work-orders/grab`, {}, { params }).pipe(
      timeout(40000),
      map(r => r.responseData ?? null)
    );
  }

  /** PM overview buckets (overdue / due / upcoming). mode 'leads' or 'mine'; pmOnly restricts to PM WOs. */
  getOverview(mode: 'leads' | 'mine' | 'custom', personids: string[] = [], pmOnly = true): Observable<MaximoOverview | null> {
    let params = new HttpParams().set('mode', mode).set('pmOnly', String(pmOnly)).set('pageSize', '200');
    if (mode === 'custom' && personids.length) params = params.set('personids', personids.join(','));
    return this.http.get<{ responseData: MaximoOverview }>(`${this.base}/bundle/overview`, { params }).pipe(
      timeout(40000),
      map(r => r.responseData ?? null)
    );
  }

  /** Active users that have a Maximo personid — the pool for the "custom" people filter. */
  getLaborPeople(): Observable<{ name: string; personid: string }[]> {
    return this.http.get<{ responseData: { name: string; personid: string }[] }>(`${this.base}/labor-people`).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Attach a photo/file to an SR (by href). Emits true on success; ERRORS on failure so the caller can
   *  surface the real Maximo message (the endpoint returns it in the response body). */
  uploadSrAttachment(href: string, file: File): Observable<boolean> {
    // Base64 JSON, NOT multipart: iOS Safari intermittently drops the multipart "file" part in transit, so the
    // hub rejects it with "Required part 'file' is not present" and Maximo never sees the photo. A JSON body has
    // no multipart boundary to lose, so it arrives intact on iPhone the same as Android.
    const params = new HttpParams().set('hrefHex', this.hex(href));
    return from(fileToBase64(file)).pipe(
      switchMap(dataBase64 => this.http.post(`${this.base}/service-requests/attachment`,
        { fileName: file.name || 'photo.jpg', contentType: file.type || 'application/octet-stream', dataBase64 },
        { params })),
      timeout(120000),
      map(() => true)
    );
  }

  /** Hex-encode a value so it can't contain characters an upstream proxy filter rejects (Maximo base64 keys
   *  can contain "--", which IIS request-filtering blocks). The hub decodes ?hrefHex back to the real href. */
  private hex(s: string): string {
    const bytes = new TextEncoder().encode(s);
    let out = '';
    for (const b of bytes) out += b.toString(16).padStart(2, '0');
    return out;
  }

  /** Edit a NEW service request's description / long description / priority. Errors surface (e.g. "not NEW"). */
  updateServiceRequest(href: string, body: { description?: string; longDescription?: string; priority?: string }): Observable<MaximoServiceRequest | null> {
    const params = new HttpParams().set('hrefHex', this.hex(href));
    return this.http.post<{ responseData: MaximoServiceRequest }>(`${this.base}/service-requests/update`, body, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? null)
    );
  }

  /** Dry-run: which reagents on a filled chem-inventory form are below target. No email/writes. */
  reorderPreview(dto: MaximoFormSubmission): Observable<ReorderLine[]> {
    return this.http.post<{ responseData: ReorderLine[] }>(`${this.base}/forms/submissions/reorder-preview`, dto).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Send the vendor reorder email + attach the order summary to the WO. */
  reorderSend(dto: MaximoFormSubmission): Observable<ReorderResult> {
    return this.http.post<{ responseData: ReorderResult }>(`${this.base}/forms/submissions/reorder-send`, dto).pipe(
      timeout(60000),
      map(r => r.responseData ?? { sent: false, message: 'No response' })
    );
  }

  /** List a service request's attachments (photos/PDFs/docs). */
  listSrAttachments(href: string): Observable<MaximoDoclink[]> {
    const params = new HttpParams().set('hrefHex', this.hex(href));
    return this.http.get<{ responseData: MaximoDoclink[] }>(`${this.base}/service-requests/attachments`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Stream one SR attachment's bytes (inline preview). */
  fetchSrAttachment(href: string, attachmentId: string): Observable<Blob> {
    const params = new HttpParams().set('hrefHex', this.hex(href)).set('attachmentId', attachmentId);
    return this.http.get(`${this.base}/service-requests/attachments/content`, { params, responseType: 'blob' }).pipe(
      timeout(60000)
    );
  }

  // ── Work-order attachments & notes ─────────────────────────────────────────

  /** List a work order's attachments (photos/PDFs/docs). */
  listWoAttachments(href: string): Observable<MaximoDoclink[]> {
    const params = new HttpParams().set('href', href);
    return this.http.get<{ responseData: MaximoDoclink[] }>(`${this.base}/work-orders/attachments`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Fetch one attachment's bytes (JWT-authed, so a plain <a href> can't be used). */
  fetchWoAttachment(href: string, attachmentId: string): Observable<Blob> {
    const params = new HttpParams().set('href', href).set('attachmentId', attachmentId);
    return this.http.get(`${this.base}/work-orders/attachments/content`, { params, responseType: 'blob' }).pipe(
      timeout(60000)
    );
  }

  /** Attach a photo/file to a work order. Emits true on success; ERRORS on failure (real message in the body). */
  uploadWoAttachment(href: string, file: File): Observable<boolean> {
    // Base64 JSON, NOT multipart — see uploadSrAttachment: iOS Safari drops the multipart "file" part in transit.
    const params = new HttpParams().set('href', href);
    return from(fileToBase64(file)).pipe(
      switchMap(dataBase64 => this.http.post(`${this.base}/work-orders/attachment`,
        { fileName: file.name || 'photo.jpg', contentType: file.type || 'application/octet-stream', dataBase64 },
        { params })),
      timeout(120000),
      map(() => true)
    );
  }

  /** List a work order's worklog notes. */
  listWoWorklog(href: string): Observable<MaximoWorklog[]> {
    const params = new HttpParams().set('href', href);
    return this.http.get<{ responseData: MaximoWorklog[] }>(`${this.base}/work-orders/worklog`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  /** Add a note (worklog) to a work order; returns the refreshed list. */
  addWoWorklog(href: string, summary: string, details?: string): Observable<MaximoWorklog[]> {
    const params = new HttpParams().set('href', href);
    return this.http.post<{ responseData: MaximoWorklog[] }>(
      `${this.base}/work-orders/worklog`, { summary, details }, { params }
    ).pipe(timeout(40000), map(r => r.responseData ?? []));
  }
}
