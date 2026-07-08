import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LotoStandard, LotoStandardWalkdown, PointDrawing, PositionOptions, WalkdownSubmitPayload, WalkdownSubmitResult,
} from './loto-standard.model';

/**
 * Mobile LOTO Standards API. Calls the Plant-gated PWA endpoints on the hub
 * (`/api/pwa/secured/loto-standards`). The JWT interceptor attaches the bearer token.
 *
 * Verification/walkdown is offline-first: the client caches list/detail/positions, works locally,
 * and calls {@link submitWalkdown} once. There are no per-item save calls.
 */
@Injectable({ providedIn: 'root' })
export class LotoStandardApiService {
  private http = inject(HttpClient);
  private base = `${environment.serverUrl}/api/pwa/secured/loto-standards`;

  getAll(): Observable<LotoStandard[]> {
    return this.http.get<{ responseData: LotoStandard[] }>(`${this.base}/get-all`).pipe(
      timeout(20000),
      map(r => r.responseData ?? [])
    );
  }

  getById(id: number | string): Observable<LotoStandard | null> {
    return this.http.get<{ responseData: LotoStandard }>(`${this.base}/${id}`).pipe(
      timeout(20000),
      map(r => r.responseData ?? null)
    );
  }

  /** isoPos / normPos Value options for in-field position corrections. */
  getPositions(): Observable<PositionOptions> {
    return this.http.get<{ responseData: PositionOptions }>(`${this.base}/positions`).pipe(
      timeout(20000),
      map(r => r.responseData ?? { isoPos: [], normPos: [] })
    );
  }

  /** Any server-side checklist evidence already recorded (for resuming online). */
  getWalkdown(id: number | string): Observable<LotoStandardWalkdown> {
    return this.http.get<{ responseData: LotoStandardWalkdown }>(`${this.base}/${id}/walkdown`).pipe(
      timeout(20000),
      map(r => r.responseData)
    );
  }

  /** One-shot submit: corrections + checklist + optional verify/walkdown transition. */
  submitWalkdown(id: number | string, payload: WalkdownSubmitPayload): Observable<WalkdownSubmitResult> {
    return this.http.post<{ responseData: WalkdownSubmitResult }>(`${this.base}/${id}/walkdown/submit`, payload).pipe(
      timeout(30000),
      map(r => r.responseData)
    );
  }

  // ── Drawings ─────────────────────────────────────────────────────────────

  /** Per-point drawing descriptors (file + highlight rectangle) for a standard. */
  getDrawings(id: number | string): Observable<PointDrawing[]> {
    return this.http.get<{ responseData: PointDrawing[] }>(`${this.base}/${id}/drawings`).pipe(
      timeout(20000),
      map(r => r.responseData ?? [])
    );
  }

  /** Raw JPG bytes of a drawing (for offline caching + canvas render). */
  getDrawingImage(fileId: number): Observable<Blob> {
    return this.http.get(`${this.base}/files/${fileId}/image`, { responseType: 'blob' }).pipe(timeout(30000));
  }
}
