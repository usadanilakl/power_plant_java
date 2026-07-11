import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, catchError, map, of, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  CompleteWorkOrderRequest, CreateMaximoServiceRequest, MaximoLocation, MaximoOverview, MaximoServiceRequest, MaximoWorkOrder,
} from './maximo.model';

export interface WoQuery { status?: string; worktype?: string; textContains?: string; pageSize?: number; }
export interface SrQuery { status?: string; textContains?: string; pageSize?: number; }

/**
 * Mobile Maximo API. Calls the Plant-gated PWA endpoints on the hub (`/api/pwa/secured/maximo`), which proxy
 * the same desktop Maximo service beans. JWT interceptor attaches the bearer token.
 */
@Injectable({ providedIn: 'root' })
export class MaximoApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/maximo`;

  listWorkOrders(q: WoQuery = {}): Observable<MaximoWorkOrder[]> {
    let params = new HttpParams().set('pageSize', String(q.pageSize ?? 50));
    if (q.status) params = params.set('status', q.status);
    if (q.worktype) params = params.set('worktype', q.worktype);
    if (q.textContains) params = params.set('textContains', q.textContains);
    return this.http.get<{ responseData: MaximoWorkOrder[] }>(`${this.base}/work-orders`, { params }).pipe(
      timeout(30000),
      map(r => r.responseData ?? [])
    );
  }

  listServiceRequests(q: SrQuery = {}): Observable<MaximoServiceRequest[]> {
    let params = new HttpParams().set('pageSize', String(q.pageSize ?? 50));
    if (q.status) params = params.set('status', q.status);
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

  searchLocations(q: string): Observable<MaximoLocation[]> {
    const params = new HttpParams().set('q', q).set('pageSize', '25');
    return this.http.get<{ responseData: MaximoLocation[] }>(`${this.base}/locations`, { params }).pipe(
      timeout(20000),
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

  /** Complete a work order or task (by href). Blank laborcode defaults to the signed-in user server-side. */
  completeWorkOrder(href: string, body: CompleteWorkOrderRequest): Observable<MaximoWorkOrder | null> {
    const params = new HttpParams().set('href', href);
    return this.http.post<{ responseData: MaximoWorkOrder }>(`${this.base}/work-orders/complete`, body, { params }).pipe(
      timeout(40000),
      map(r => r.responseData ?? null)
    );
  }

  /** PM overview buckets (overdue / due / upcoming). mode 'leads' or 'mine'; pmOnly restricts to PM WOs. */
  getOverview(mode: 'leads' | 'mine', pmOnly = true): Observable<MaximoOverview | null> {
    const params = new HttpParams().set('mode', mode).set('pmOnly', String(pmOnly)).set('pageSize', '200');
    return this.http.get<{ responseData: MaximoOverview }>(`${this.base}/bundle/overview`, { params }).pipe(
      timeout(40000),
      map(r => r.responseData ?? null)
    );
  }

  /** Best-effort photo/file attach to a created SR (by href). Resolves false on failure. */
  uploadSrAttachment(href: string, file: File): Observable<boolean> {
    const form = new FormData();
    form.append('file', file, file.name);
    const params = new HttpParams().set('href', href);
    return this.http.post(`${this.base}/service-requests/attachment`, form, { params }).pipe(
      timeout(60000),
      map(() => true),
      catchError(() => of(false))
    );
  }
}
