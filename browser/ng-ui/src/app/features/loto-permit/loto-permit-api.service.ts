import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { PointDrawing, PositionOptions } from '../loto-standard/loto-standard.model';
import {
  GrabInfo, HangSubmitRequest, PhaseSubmitResult, PwaLotoDetail, PwaLotoListItem, PwaWalkdownSession,
  VerifySubmitRequest, WalkdownStartRequest, WalkdownSubmitRequest,
} from './loto-permit.model';

/**
 * Mobile LOTO permit API. Calls the Plant-gated PWA endpoints on the hub (`/api/pwa/secured/loto`). The JWT
 * interceptor attaches the bearer token. Read endpoints + a grab per phase + one batch submit per flow.
 */
@Injectable({ providedIn: 'root' })
export class LotoPermitApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/loto`;

  list(): Observable<PwaLotoListItem[]> {
    return this.http.get<{ responseData: PwaLotoListItem[] }>(`${this.base}/list`)
      .pipe(timeout(30000), map(r => r.responseData ?? []));
  }

  getDetail(id: number): Observable<PwaLotoDetail | null> {
    return this.http.get<{ responseData: PwaLotoDetail | null }>(`${this.base}/${id}`)
      .pipe(timeout(30000), map(r => r.responseData ?? null));
  }

  getPositions(): Observable<PositionOptions> {
    return this.http.get<{ responseData: PositionOptions }>(`${this.base}/positions`)
      .pipe(timeout(20000), map(r => r.responseData));
  }

  getDrawings(id: number): Observable<PointDrawing[]> {
    return this.http.get<{ responseData: PointDrawing[] }>(`${this.base}/${id}/drawings`)
      .pipe(timeout(30000), map(r => r.responseData ?? []));
  }

  getDrawingImage(fileId: number): Observable<Blob> {
    return this.http.get(`${this.base}/files/${fileId}/image`, { responseType: 'blob' }).pipe(timeout(30000));
  }

  // ── grab ──
  grab(id: number, phase: 'HANG' | 'VERIFY'): Observable<GrabInfo> {
    const params = new HttpParams().set('phase', phase);
    return this.http.post<{ responseData: GrabInfo }>(`${this.base}/${id}/grab`, null, { params })
      .pipe(timeout(30000), map(r => r.responseData));
  }

  release(id: number, phase: 'HANG' | 'VERIFY'): Observable<void> {
    const params = new HttpParams().set('phase', phase);
    return this.http.post<{ responseData: void }>(`${this.base}/${id}/release`, null, { params })
      .pipe(timeout(20000), map(() => undefined));
  }

  // ── submit ──
  submitHang(id: number, body: HangSubmitRequest): Observable<PhaseSubmitResult> {
    return this.http.post<{ responseData: PhaseSubmitResult }>(`${this.base}/${id}/hang/submit`, body)
      .pipe(timeout(30000), map(r => r.responseData));
  }

  submitVerify(id: number, body: VerifySubmitRequest): Observable<PhaseSubmitResult> {
    return this.http.post<{ responseData: PhaseSubmitResult }>(`${this.base}/${id}/verify/submit`, body)
      .pipe(timeout(30000), map(r => r.responseData));
  }

  // ── walkdown (repeatable) ──
  startWalkdown(id: number, body: WalkdownStartRequest): Observable<PwaWalkdownSession> {
    return this.http.post<{ responseData: PwaWalkdownSession }>(`${this.base}/${id}/walkdown/start`, body)
      .pipe(timeout(30000), map(r => r.responseData));
  }

  walkdownSessions(id: number): Observable<PwaWalkdownSession[]> {
    return this.http.get<{ responseData: PwaWalkdownSession[] }>(`${this.base}/${id}/walkdown/sessions`)
      .pipe(timeout(30000), map(r => r.responseData ?? []));
  }

  getSession(sessionId: number): Observable<PwaWalkdownSession | null> {
    return this.http.get<{ responseData: PwaWalkdownSession | null }>(`${this.base}/walkdown/session/${sessionId}`)
      .pipe(timeout(30000), map(r => r.responseData ?? null));
  }

  submitWalkdown(sessionId: number, body: WalkdownSubmitRequest): Observable<PwaWalkdownSession> {
    return this.http.post<{ responseData: PwaWalkdownSession }>(`${this.base}/walkdown/session/${sessionId}/submit`, body)
      .pipe(timeout(30000), map(r => r.responseData));
  }
}
