import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import {
  LotoPointRef, LotoStandard, LotoStandardWalkdown, PointCorrection, PointDrawing, PositionOptions,
  WalkdownSubmitPayload, WalkdownSubmitResult,
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

  /** isoPos / normPos / location Value options for in-field position corrections. */
  getPositions(): Observable<PositionOptions> {
    return this.http.get<{ responseData: PositionOptions }>(`${this.base}/positions`).pipe(
      timeout(20000),
      map(r => r.responseData ?? { isoPos: [], normPos: [], location: [] })
    );
  }

  // ── Points-pile walkdown (LOTO Points, not standard-bound) ───────────────

  /** Pile of LOTO points selected by standards / location / system. Fat DTOs — same shape as
   *  the LotoStandard.lotoPoints[] entries the walkdown UI already handles. */
  getPointsPile(opts: { standardIds?: number[]; locationId?: number | null; system?: string | null }): Observable<LotoPointRef[]> {
    const params: string[] = [];
    if (opts.standardIds?.length) params.push(`standardIds=${opts.standardIds.join(',')}`);
    if (opts.locationId != null) params.push(`locationId=${opts.locationId}`);
    if (opts.system && opts.system.trim()) params.push(`system=${encodeURIComponent(opts.system.trim())}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return this.http.get<{ responseData: LotoPointRef[] }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points/walkdown-pile${qs}`
    ).pipe(timeout(30000), map(r => r.responseData ?? []));
  }

  /** Distinct free-text `system` values across every LOTO point — feeds the "walk down by system" picker. */
  getPointSystems(): Observable<string[]> {
    return this.http.get<{ responseData: string[] }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points/systems`
    ).pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  /** Apply ONE correction to ONE point immediately (points-pile walkdown submits per-point). */
  applyPointCorrection(pointId: number, correction: PointCorrection): Observable<LotoPointRef | null> {
    return this.http.post<{ responseData: LotoPointRef }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points/${pointId}/apply-correction`,
      correction
    ).pipe(timeout(20000), map(r => r.responseData ?? null));
  }

  // ── Create / edit (LotoPoint + LotoStandard authoring from the PWA) ─────

  /** Existence check: every point with the exact tag (case-sensitive). Empty = tag free. */
  findPointsByTag(tag: string): Observable<LotoPointRef[]> {
    return this.http.get<{ responseData: LotoPointRef[] }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points/by-tag?tag=${encodeURIComponent(tag)}`
    ).pipe(timeout(15000), map(r => r.responseData ?? []));
  }

  /**
   * Create OR update a LOTO point. Delegates server-side to the same processLotoPointToDto the
   * desktop uses — id=0/null creates, id present updates. Optional standardId links the (new)
   * point to that standard in the same request.
   */
  savePoint(point: Omit<Partial<LotoPointRef>, 'id'> & { id?: number | null }, addToStandardId?: number | null): Observable<LotoPointRef | null> {
    // The backend expects LotoPointIdDto — flatten nested Value objects to ids.
    const body: any = {
      id: point.id ?? 0,
      tagNumber: point.tagNumber ?? null,
      description: point.description ?? null,
      specificLocation: point.specificLocation ?? null,
      isoPos: point.isoPos?.id ?? null,
      normPos: point.normPos?.id ?? null,
      location: point.location?.id ?? null,
      isLabeled: point.isLabeled ?? null,
      isLockable: point.isLockable ?? null,
      isVerified: point.isVerified ?? null,
      system: point.system ?? null,
      zeroEnergyMethod: point.zeroEnergyMethod ?? null,
    };
    const qs = addToStandardId != null ? `?addToStandardId=${addToStandardId}` : '';
    return this.http.post<{ responseData: LotoPointRef }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points${qs}`, body
    ).pipe(timeout(20000), map(r => r.responseData ?? null));
  }

  /** Create a new LOTO Standard (starts in Draft with an empty points list). */
  createStandard(body: { name: string; description?: string | null }): Observable<LotoStandard | null> {
    return this.http.post<{ responseData: LotoStandard }>(
      `${this.base}`, { name: body.name, description: body.description ?? '' }
    ).pipe(timeout(20000), map(r => r.responseData ?? null));
  }

  /** Update basic fields on an existing LOTO Standard (name, description, prose text). */
  updateStandard(id: number, patch: Partial<LotoStandard>): Observable<LotoStandard | null> {
    // Server accepts an IdDto — we pass through only the writable basic fields the PWA edits.
    const body: any = { id, ...patch };
    return this.http.put<{ responseData: LotoStandard }>(`${this.base}/${id}`, body).pipe(
      timeout(20000),
      map(r => r.responseData ?? null)
    );
  }

  /** Attach an existing point to a standard. */
  addPointToStandard(standardId: number, pointId: number): Observable<LotoStandard | null> {
    return this.http.post<{ responseData: LotoStandard }>(
      `${this.base}/${standardId}/add-point/${pointId}`, {}
    ).pipe(timeout(20000), map(r => r.responseData ?? null));
  }

  /** Edit basic fields on a Building-status LOTO permit. 409 if the permit isn't Building. */
  updateInactivePermitBasic(id: number, patch: {
    workScope?: string | null;
    equipmentSystem?: string | null;
    lotoRequestor?: string | null;
    date?: string | null;
    boxNumber?: number | null;
  }): Observable<any> {
    return this.http.put<{ responseData: any }>(
      `${environment.serverUrl}/api/pwa/secured/loto/${id}/basic`, { id, ...patch }
    ).pipe(timeout(20000), map(r => r.responseData ?? null));
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
