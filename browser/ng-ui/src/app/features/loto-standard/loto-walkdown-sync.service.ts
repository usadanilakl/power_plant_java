import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, concatMap, distinctUntilChanged, filter, from, of, tap, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ServerStatusService } from '../../services/server-status.service';
import { LotoStandardApiService } from './loto-standard-api.service';
import { LotoStandardStore } from './loto-standard-store.service';
import { WalkdownDraft, WalkdownSubmitPayload, WalkdownSubmitResult } from './loto-standard.model';

/**
 * Submits offline walkdown drafts. A completed walkdown is saved locally as a draft; this service pushes it to
 * the hub — immediately if online, otherwise it stays queued and auto-flushes when {@link ServerStatusService}
 * reports the server is reachable again.
 *
 * Retry policy: network/5xx failures stay {@code pending} (retried on every reconnect); a 409 (standard changed)
 * or 400 (validation) becomes {@code failed} and waits for the user to refresh/fix — retrying wouldn't help.
 */
@Injectable({ providedIn: 'root' })
export class LotoWalkdownSyncService {
  private store = inject(LotoStandardStore);
  private api = inject(LotoStandardApiService);
  private serverStatus = inject(ServerStatusService);

  private flushing = false;
  pendingCount = signal(0);

  constructor() {
    this.refreshPendingCount();
    this.serverStatus.isOnline$.pipe(
      distinctUntilChanged(),
      filter(online => online),
      takeUntilDestroyed()
    ).subscribe(() => this.flush());
  }

  refreshPendingCount(): void { this.pendingCount.set(this.store.listPending().length); }

  private toPayload(d: WalkdownDraft): WalkdownSubmitPayload {
    return {
      capturedVersion: d.capturedVersion,
      transition: d.transition,
      notes: d.notes,
      globalItems: d.globalItems,
      pointResults: d.pointResults,
      corrections: d.corrections,
    };
  }

  /** Submit one draft now. On success clears it; on failure re-persists it with the right retry status, then rethrows. */
  submit(draft: WalkdownDraft): Observable<WalkdownSubmitResult> {
    return this.api.submitWalkdown(draft.standardId, this.toPayload(draft)).pipe(
      tap(() => { this.store.clearDraft(draft.standardId); this.refreshPendingCount(); }),
      catchError(err => {
        const status = err?.status;
        draft.status = (status === 409 || status === 400) ? 'failed' : 'pending';
        draft.lastError = err?.error?.message || err?.message || 'Submit failed';
        this.store.saveDraft(draft);
        this.refreshPendingCount();
        return throwError(() => err);
      })
    );
  }

  /** Auto-flush queued ('pending') drafts on reconnect. 'failed' drafts are left for the user to resolve. */
  private flush(): void {
    if (this.flushing) return;
    const queued = this.store.listPending().filter(d => d.status === 'pending');
    if (!queued.length) return;
    this.flushing = true;
    from(queued).pipe(
      concatMap(d => this.submit(d).pipe(catchError(() => of(null)))),
      finalize(() => { this.flushing = false; this.refreshPendingCount(); })
    ).subscribe();
  }
}
