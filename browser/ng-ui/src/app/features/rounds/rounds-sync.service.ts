import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, concatMap, distinctUntilChanged, filter, from, of, tap, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ServerStatusService } from '../../services/server-status.service';
import { RoundsApiService } from './rounds-api.service';
import { RoundsStore } from './rounds-store.service';
import { AnswerInput, RoundDraft, SubmitResult, SubmitRoundRequest } from './rounds.model';

/**
 * Flushes queued round submits. A round submitted while offline is saved as a {@code pending} draft; this service
 * pushes it to the hub — immediately if online, else it stays queued and auto-flushes when {@link ServerStatusService}
 * reports the server reachable again (mirrors the LOTO walkdown sync).
 *
 * Retry policy: network/5xx → stays {@code pending} (retried each reconnect); 400/409 (validation/conflict, e.g. a
 * new out-of-range reading missing its required comment, or already-submitted) → {@code failed}, waits for the user.
 */
@Injectable({ providedIn: 'root' })
export class RoundsSyncService {
  private store = inject(RoundsStore);
  private api = inject(RoundsApiService);
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

  private toPayload(d: RoundDraft): SubmitRoundRequest {
    const answers: AnswerInput[] = Object.entries(d.answers)
      .filter(([, a]) => (a.value ?? '').trim() !== '')
      .map(([qid, a]) => ({
        questionId: Number(qid),
        value: a.value.trim(),
        comment: a.comment?.trim() || null,
      }));
    return { notes: d.notes?.trim() || null, answers };
  }

  /** Submit one draft now. Success clears it; failure re-persists with the right retry status, then rethrows. */
  submit(draft: RoundDraft): Observable<SubmitResult> {
    return this.api.submit(draft.instanceId, this.toPayload(draft)).pipe(
      tap(() => { this.store.clearDraft(draft.instanceId); this.refreshPendingCount(); }),
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

  /** Auto-flush 'pending' drafts on reconnect. 'failed' drafts are left for the user to resolve. */
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
