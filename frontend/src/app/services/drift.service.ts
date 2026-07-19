import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError, tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export type DriftPeer = 'HUB' | 'SHAREPOINT';
export type DriftKind = 'DIFFERING' | 'MISSING_LOCALLY' | 'MISSING_ON_PEER';
export type DriftStatus = 'FLAGGED' | 'ACKNOWLEDGED' | 'RECONCILED';

/** One persisted drift record (mirrors the backend DriftRecord). */
export interface DriftRecord {
  id: number;
  entityType: string;
  entityId: number;
  fieldName: string;
  peer: DriftPeer;
  kind: DriftKind;
  status: DriftStatus;
  localValue?: string;
  hubValue?: string;
  firstDetectedAt?: string;
  lastDetectedAt?: string;
  resolvedAt?: string;
  resolution?: string;
}

export interface DriftScanResult {
  typesScanned: number;
  typesDrifting: number;
  flagged: number;
  stillDrifting: number;
  reconciled: number;
  errors: number;
}

/** Row-level drift for a single entity: does it drift against the hub and/or SharePoint. */
export interface RowDrift {
  hub?: DriftRecord;
  sp?: DriftRecord;
}

/** Per-type scan bookkeeping (mirrors backend DriftScanState) — powers green-on-load + the Drift Center. */
export interface DriftScanState {
  entityType: string;
  lastScannedAt?: string;
  spBacked: boolean;
  flaggedCount: number;
  lastError?: string;
}

/** 3-way field diff (mirrors backend ThreeWayFieldDiff) — the Drift Center compare drawer. */
export interface ThreeWayFieldEntry {
  fieldName: string;
  localValue?: string; hubValue?: string; spValue?: string;
  spMapped: boolean; allMatch: boolean; localHubMatch: boolean; localSpMatch: boolean; hubSpMatch: boolean;
}
export interface ThreeWayFieldDiff {
  entityType: string; entityId: number; spBacked: boolean;
  fields: ThreeWayFieldEntry[]; mismatchCount: number;
}

interface NgApiResponse<T> { responseData: T; message: string; }

/**
 * Front door to the persisted drift tooling (backend /ng/sync/drift/*). Feeds the header indicator's
 * trustworthy count and the per-row table badge, and triggers the content-hash + SharePoint scan.
 */
@Injectable({ providedIn: 'root' })
export class DriftService {
  private http = inject(HttpClient);
  private base = `${environment.baseApiUrl}/ng/sync/drift`;

  /** Global counts — the accurate, field-level replacement for the count/timestamp "sync indicator". */
  readonly summary = signal<{ flagged: number; acknowledged: number; reconciled: number }>(
    { flagged: 0, acknowledged: 0, reconciled: 0 });
  /** Active drift broken down by direction/peer — the Drift Center's "what is drifting" panel. */
  readonly breakdown = signal<{ hubDiffers: number; onHubNotLocal: number; localNotOnHub: number; sharePoint: number }>(
    { hubDiffers: 0, onHubNotLocal: 0, localNotOnHub: 0, sharePoint: 0 });
  readonly scanning = signal(false);
  /** Types a detection scan has completed for THIS session — so a row with no drift can show a
   *  confident GREEN "verified in sync" instead of an ambiguous "not checked yet". */
  readonly scannedTypes = signal<Set<string>>(new Set());
  private readonly scannedAll = signal(false);
  /** Per-type scan state from the server (survives reload) — the background scheduler keeps it fresh. */
  readonly scanState = signal<Map<string, DriftScanState>>(new Map());

  /** True once we can trust "no drift record ⇒ in sync" for this type — a scan has run this session OR
   *  the server's overview shows it was scanned (e.g. by the background scheduler). */
  isScanned(type?: string): boolean {
    return !!type && (this.scannedAll() || this.scannedTypes().has(type)
      || !!this.scanState().get(type)?.lastScannedAt);
  }

  /** Load the per-type scan overview (which types were scanned, when, counts) — cheap; cached in a signal. */
  loadOverview(): void {
    this.refreshOverview().subscribe();
  }

  /** Fetch the overview, update the shared {@link scanState} signal, AND return the list — so a poller can
   *  both refresh every consumer's "last scan" time and inspect whether a type's scan just advanced. */
  refreshOverview(): Observable<DriftScanState[]> {
    return this.overview$().pipe(tap((list) => {
      const m = new Map<string, DriftScanState>();
      for (const s of list) m.set(s.entityType, s);
      this.scanState.set(m);
    }));
  }
  private markScanned(type: string): void {
    this.scannedTypes.update((s) => { const n = new Set(s); n.add(type); return n; });
  }

  refreshSummary(): void {
    this.http.get<NgApiResponse<any>>(`${this.base}/summary`).pipe(
      map(r => r?.responseData ?? {}), catchError(() => of({}))
    ).subscribe(s => this.summary.set({
      flagged: s.flagged ?? 0, acknowledged: s.acknowledged ?? 0, reconciled: s.reconciled ?? 0
    }));
  }

  /** Refresh the direction/peer breakdown (hub differs / on-hub-not-here / here-not-on-hub / SharePoint). */
  refreshBreakdown(): void {
    this.http.get<NgApiResponse<any>>(`${this.base}/breakdown`).pipe(
      map(r => r?.responseData ?? {}), catchError(() => of({}))
    ).subscribe(b => this.breakdown.set({
      hubDiffers: b.hubDiffers ?? 0, onHubNotLocal: b.onHubNotLocal ?? 0,
      localNotOnHub: b.localNotOnHub ?? 0, sharePoint: b.sharePoint ?? 0
    }));
  }

  /** Run a full content-hash + SharePoint drift scan and persist/refresh the records. */
  scanAll(): Observable<DriftScanResult | null> {
    this.scanning.set(true);
    return this.http.post<NgApiResponse<DriftScanResult>>(`${this.base}/scan`, {}).pipe(
      map(r => r?.responseData ?? null),
      tap(() => { this.scanning.set(false); this.scannedAll.set(true); this.refreshSummary(); }),
      catchError(() => { this.scanning.set(false); return of(null); })
    );
  }

  /** Scan a single type (hub + SharePoint) — used to refresh one table after a reconcile. */
  scanType(entityType: string): Observable<DriftScanResult | null> {
    this.scanning.set(true);
    return this.http.post<NgApiResponse<DriftScanResult>>(`${this.base}/scan/${entityType}`, {}).pipe(
      map(r => r?.responseData ?? null),
      // Only trust "no record ⇒ in sync" (green) when the scan actually COMPLETED both peers cleanly —
      // a partial/errored scan must not paint confident green over rows it never really checked.
      tap((r) => {
        this.scanning.set(false);
        if (r && r.errors === 0) this.markScanned(entityType);
        this.refreshSummary();
      }),
      catchError(() => { this.scanning.set(false); return of(null); })
    );
  }

  /** Active drift records for a type -> map entityId -> {hub, sp} for the per-row badge. */
  statusForType(entityType: string): Observable<Map<number, RowDrift>> {
    return this.http.get<NgApiResponse<DriftRecord[]>>(`${this.base}/status/${entityType}`).pipe(
      map(r => r?.responseData ?? []),
      map(records => {
        const m = new Map<number, RowDrift>();
        for (const rec of records) {
          if (rec.fieldName !== '_entity_') continue; // only row-level records drive the badge
          const key = Number(rec.entityId); // normalise so a string-vs-number id never misses the lookup
          const row = m.get(key) ?? {};
          if (rec.peer === 'HUB') row.hub = rec;
          else if (rec.peer === 'SHAREPOINT') row.sp = rec;
          m.set(key, row);
        }
        return m;
      }),
      catchError(() => of(new Map<number, RowDrift>()))
    );
  }

  /** Every record (row + field, both peers) for one entity — the drill-down feed. */
  rowRecords(entityType: string, entityId: number): Observable<DriftRecord[]> {
    return this.http.get<NgApiResponse<DriftRecord[]>>(`${this.base}/row/${entityType}/${entityId}`).pipe(
      map(r => r?.responseData ?? []), catchError(() => of([])));
  }

  acknowledge(recordId: number): Observable<any> {
    return this.http.post<NgApiResponse<any>>(`${this.base}/acknowledge/${recordId}`, {}).pipe(
      map(r => r?.responseData), catchError(() => of(null)));
  }

  // ==================== Reconcile actions (whole-row) ====================
  private resolveBase = `${environment.baseApiUrl}/ng/sync/resolve`;

  /** Use the HUB's version of the whole row — via the dependency-aware pull, so relationship fields whose
   *  referenced entity is missing locally get that entity pulled too (a plain accept-remote can't resolve them). */
  acceptHub(entityType: string, entityId: number): Observable<any> {
    return this.http.post<NgApiResponse<any>>(`${this.resolveBase}/execute-pull/${entityType}/${entityId}`, {})
      .pipe(map(r => r?.responseData), catchError(() => of(null)));
  }
  /** Keep the LOCAL version — push it up to the hub (overwrites hub). */
  keepLocal(entityType: string, entityId: number): Observable<any> {
    return this.http.post<NgApiResponse<any>>(`${this.resolveBase}/accept-local/${entityType}/${entityId}`, {})
      .pipe(map(r => r?.responseData), catchError(() => of(null)));
  }
  /** Push the local row to SharePoint (resolves a missing-from-SP drift). */
  pushToSp(entityType: string, entityId: number): Observable<any> {
    return this.http.post<NgApiResponse<any>>(`${this.resolveBase}/accept-sp/${entityType}/${entityId}`, {})
      .pipe(map(r => r?.responseData), catchError(() => of(null)));
  }
  /** Accept a SINGLE field's value from hub or local (no whole-entity clobber) — the compare drawer. */
  acceptField(entityType: string, entityId: number, fieldName: string, source: 'hub' | 'local'): Observable<any> {
    return this.http.post<NgApiResponse<any>>(
      `${this.resolveBase}/accept-field/${entityType}/${entityId}/${encodeURIComponent(fieldName)}?source=${source}`, {})
      .pipe(map(r => r?.responseData), catchError(() => of(null)));
  }

  // ==================== Drift Center queries ====================

  /** Raw active drift records for a type (id/peer/kind/status) — the Drift Center's drifted-rows list. */
  statusRecords(entityType: string): Observable<DriftRecord[]> {
    return this.http.get<NgApiResponse<DriftRecord[]>>(`${this.base}/status/${entityType}`)
      .pipe(map(r => r?.responseData ?? []), catchError(() => of([])));
  }

  /** Per-type scan overview as an observable (for the Drift Center to (re)load on demand). */
  overview$(): Observable<DriftScanState[]> {
    return this.http.get<NgApiResponse<DriftScanState[]>>(`${this.base}/overview`)
      .pipe(map(r => r?.responseData ?? []), catchError(() => of([])));
  }

  /** 3-way field diff (Local / Hub / SharePoint) for one entity — the compare drawer. */
  fieldDiff(entityType: string, entityId: number): Observable<ThreeWayFieldDiff | null> {
    return this.http.get<NgApiResponse<ThreeWayFieldDiff>>(
      `${environment.baseApiUrl}/ng/sync/compare/verify/${entityType}/${entityId}/diff`)
      .pipe(map(r => r?.responseData ?? null), catchError(() => of(null)));
  }

  /** Friendly labels (id -> tag/name/description) for HUB-ONLY rows the local list can't render — the
   *  "missing from local" strip. Best-effort; ids with no hub data come back as "#id". */
  hubLabels(entityType: string, ids: number[]): Observable<Map<number, string>> {
    if (!ids.length) return of(new Map<number, string>());
    return this.http.post<NgApiResponse<Record<string, string>>>(`${this.base}/hub-labels/${entityType}`, ids).pipe(
      map(r => {
        const m = new Map<number, string>();
        const data = r?.responseData ?? {};
        for (const k of Object.keys(data)) m.set(Number(k), data[k]);
        return m;
      }),
      catchError(() => of(new Map<number, string>()))
    );
  }
}
