import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, finalize, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SpringApiResponse } from '../../models/api/spring-api-response.model';
import { AutomationSessionState } from './red-tag-progress.service';

export type RedTagStatus = 'ACTIVE' | 'INACTIVE' | 'CANCELED' | 'CLOSED';
export type DiffAction = 'CREATE' | 'UPDATE' | 'CLOSE' | 'ORPHAN';

/**
 * One entry in the diff plan. Shape mirrors backend
 * {@code sevice.automation.redtag.statesync.DiffEntry}.
 */
export interface DiffEntry {
  key: string;
  action: DiffAction;
  skip: boolean;

  redTagLotoNumber?: string | null;
  redTagLockBox?: string | null;
  redTagJobDescription?: string | null;
  redTagRequestor?: string | null;

  localLotoId?: number | null;
  localPermitNumber?: string | null;
  localPermitStatus?: string | null;
  localJobDescription?: string | null;
  localRequestor?: string | null;
  localBoxNumber?: number | null;
  localRedTagNum?: string | null;

  matchStrategy?: string | null;
  candidateLocalLotoIds?: number[];
  changedFields?: string[];
  reason?: string | null;
}

export interface DiffPlan {
  status: RedTagStatus;
  builtAt: string;
  entries: DiffEntry[];
  matchedCount: number;
  localOnlyCount: number;
}

export interface RedTagRow {
  lotoNumber?: string | null;
  lockBox?: string | null;
  jobDescription?: string | null;
  requestor?: string | null;
}

export interface ScrapeResult {
  status: RedTagStatus;
  rows: RedTagRow[];
  scrapedAt: string;
  notes?: string | null;
}

export interface ApplyOutcome {
  entryKey: string;
  status: 'OK' | 'SKIPPED' | 'FAILED';
  affectedLotoId?: number | null;
  errorMessage?: string | null;
}

export interface ApplyResult {
  applied: number;
  skipped: number;
  failed: number;
  outcomes: ApplyOutcome[];
}

/**
 * Front-end client for the Red-Tag state-sync REST surface at
 * {@code /ng/red-tag-automation/state-sync/*}. Session progress uses the same
 * SSE stream the LOTO builder uses — subscribe via {@link RedTagAutomationService}
 * to observe it live.
 */
@Injectable({ providedIn: 'root' })
export class RedTagStateSyncService {
  private http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiUrl}/red-tag-automation/state-sync`;

  /** Cached latest plan — mirrors the server, refreshed on each poll. */
  readonly currentPlan = signal<DiffPlan | null>(null);
  /** Sticky flag: an apply is in flight (disable Apply, dim the UI). */
  readonly isApplying = signal(false);

  scrape(status: RedTagStatus): Observable<AutomationSessionState> {
    return this.http.post<SpringApiResponse<AutomationSessionState>>(
      `${this.baseUrl}/scrape?status=${status}`, {}
    ).pipe(map(r => r.responseData));
  }

  latestScrape(): Observable<ScrapeResult | null> {
    return this.http.get<SpringApiResponse<ScrapeResult | null>>(`${this.baseUrl}/latest-scrape`)
      .pipe(map(r => r.responseData));
  }

  latestPlan(): Observable<DiffPlan | null> {
    return this.http.get<SpringApiResponse<DiffPlan | null>>(`${this.baseUrl}/latest-plan`)
      .pipe(map(r => {
        this.currentPlan.set(r.responseData);
        return r.responseData;
      }));
  }

  rebuildPlan(): Observable<DiffPlan> {
    return this.http.post<SpringApiResponse<DiffPlan>>(`${this.baseUrl}/rebuild-plan`, {})
      .pipe(map(r => {
        this.currentPlan.set(r.responseData);
        return r.responseData;
      }));
  }

  apply(plan: DiffPlan, reason?: string | null): Observable<ApplyResult> {
    const q = reason && reason.trim().length ? `?reason=${encodeURIComponent(reason.trim())}` : '';
    this.isApplying.set(true);
    return this.http.post<SpringApiResponse<ApplyResult>>(`${this.baseUrl}/apply${q}`, plan)
      .pipe(
        // finalize() runs on BOTH the success and error paths, so the button
        // never gets stuck disabled after an apply failure (403 / 500 / network
        // drop). Previously the flag was only reset in the map() success side.
        finalize(() => this.isApplying.set(false)),
        map(r => {
          // Server clears its cached plan after apply — mirror that here.
          this.currentPlan.set(null);
          return r.responseData;
        })
      );
  }
}
