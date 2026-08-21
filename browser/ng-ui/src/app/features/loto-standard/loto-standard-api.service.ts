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

  /** isoPos / normPos / location / eqType Value options for in-field corrections + walkdown-pile filters. */
  getPositions(): Observable<PositionOptions> {
    return this.http.get<{ responseData: PositionOptions }>(`${this.base}/positions`).pipe(
      timeout(20000),
      map(r => r.responseData ?? { isoPos: [], normPos: [], location: [], eqType: [] })
    );
  }

  // ── Points-pile walkdown (LOTO Points, not standard-bound) ───────────────

  /** Pile of LOTO points selected by an arbitrary combination of the desktop's table filters.
   *  Multi-value filters (locationIds / eqTypeIds / systems) OR their contents inside the AND.
   *  Fat DTOs — same shape as the LotoStandard.lotoPoints[] entries the walkdown UI already handles. */
  getPointsPile(opts: {
    standardIds?: number[];
    locationIds?: number[];
    eqTypeIds?: number[];
    isoPosId?: number | null;
    normPosId?: number | null;
    systems?: string[];
    unit?: string | null;
    tagNumber?: string | null;
    description?: string | null;
    specificLocation?: string | null;
  }): Observable<LotoPointRef[]> {
    const params: string[] = [];
    // Spring picks up ?foo=1,2 as List<Long> via the built-in comma-separated binder — matches
    // the walkdown-pile endpoint's `@RequestParam(required=false) List<Long> locationIds` shape.
    if (opts.standardIds?.length) params.push(`standardIds=${opts.standardIds.join(',')}`);
    if (opts.locationIds?.length) params.push(`locationIds=${opts.locationIds.join(',')}`);
    if (opts.eqTypeIds?.length) params.push(`eqTypeIds=${opts.eqTypeIds.join(',')}`);
    if (opts.isoPosId != null) params.push(`isoPosId=${opts.isoPosId}`);
    if (opts.normPosId != null) params.push(`normPosId=${opts.normPosId}`);
    const cleanSystems = (opts.systems ?? []).map(s => s?.trim()).filter(s => !!s) as string[];
    for (const s of cleanSystems) params.push(`systems=${encodeURIComponent(s)}`);
    if (opts.unit && opts.unit.trim()) params.push(`unit=${encodeURIComponent(opts.unit.trim())}`);
    if (opts.tagNumber && opts.tagNumber.trim()) params.push(`tagNumber=${encodeURIComponent(opts.tagNumber.trim())}`);
    if (opts.description && opts.description.trim()) params.push(`description=${encodeURIComponent(opts.description.trim())}`);
    if (opts.specificLocation && opts.specificLocation.trim()) params.push(`specificLocation=${encodeURIComponent(opts.specificLocation.trim())}`);
    const qs = params.length ? '?' + params.join('&') : '';
    return this.http.get<{ responseData: LotoPointRef[] }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points/walkdown-pile${qs}`
    ).pipe(timeout(60000), map(r => r.responseData ?? []));
  }

  /** Distinct free-text `system` values across every LOTO point — feeds the "walk down by system" picker. */
  getPointSystems(): Observable<string[]> {
    return this.http.get<{ responseData: string[] }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points/systems`
    ).pipe(timeout(20000), map(r => r.responseData ?? []));
  }

  /** Distinct free-text option lists (units for now) for the walkdown-pile filter picker. */
  getPointFilterOptions(): Observable<{ units: string[] }> {
    return this.http.get<{ responseData: { units?: string[] } }>(
      `${environment.serverUrl}/api/pwa/secured/loto-points/filter-options`
    ).pipe(timeout(15000), map(r => ({ units: r.responseData?.units ?? [] })));
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

  /** Detach a point from a standard. Server enforces CA + editable-state rules. */
  removePointFromStandard(standardId: number, pointId: number): Observable<LotoStandard | null> {
    return this.http.delete<{ responseData: LotoStandard }>(
      `${this.base}/${standardId}/points/${pointId}`
    ).pipe(timeout(20000), map(r => r.responseData ?? null));
  }

  /** Detach a point from a Building-status LOTO permit. 409 if not Building. */
  removePointFromInactivePermit(lotoId: number, pointId: number): Observable<any> {
    return this.http.delete<{ responseData: any }>(
      `${environment.serverUrl}/api/pwa/secured/loto/${lotoId}/points/${pointId}`
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
