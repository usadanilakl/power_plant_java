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
  readonly scanning = signal(false);

  refreshSummary(): void {
    this.http.get<NgApiResponse<any>>(`${this.base}/summary`).pipe(
      map(r => r?.responseData ?? {}), catchError(() => of({}))
    ).subscribe(s => this.summary.set({
      flagged: s.flagged ?? 0, acknowledged: s.acknowledged ?? 0, reconciled: s.reconciled ?? 0
    }));
  }

  /** Run a full content-hash + SharePoint drift scan and persist/refresh the records. */
  scanAll(): Observable<DriftScanResult | null> {
    this.scanning.set(true);
    return this.http.post<NgApiResponse<DriftScanResult>>(`${this.base}/scan`, {}).pipe(
      map(r => r?.responseData ?? null),
      tap(() => { this.scanning.set(false); this.refreshSummary(); }),
      catchError(() => { this.scanning.set(false); return of(null); })
    );
  }

  /** Scan a single type (hub + SharePoint) — used to refresh one table after a reconcile. */
  scanType(entityType: string): Observable<DriftScanResult | null> {
    this.scanning.set(true);
    return this.http.post<NgApiResponse<DriftScanResult>>(`${this.base}/scan/${entityType}`, {}).pipe(
      map(r => r?.responseData ?? null),
      tap(() => { this.scanning.set(false); this.refreshSummary(); }),
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
          const row = m.get(rec.entityId) ?? {};
          if (rec.peer === 'HUB') row.hub = rec;
          else if (rec.peer === 'SHAREPOINT') row.sp = rec;
          m.set(rec.entityId, row);
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
}
