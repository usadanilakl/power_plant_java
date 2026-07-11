import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, concat, concatMap, distinctUntilChanged, filter, from, of, tap, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ServerStatusService } from '../../services/server-status.service';
import { MaximoApiService } from './maximo-api.service';
import { MaximoOfflineStore } from './maximo-offline.service';
import { MaximoCompletionDraft } from './maximo.model';

/**
 * Submits offline PM completion drafts. A completed-while-offline PM is saved as a draft and pushed to Maximo —
 * immediately if online, otherwise it stays queued and auto-flushes when {@link ServerStatusService} reports the
 * server is reachable again (same pattern as the LOTO walkdown sync).
 */
@Injectable({ providedIn: 'root' })
export class MaximoSyncService {
  private store = inject(MaximoOfflineStore);
  private api = inject(MaximoApiService);
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

  refreshPendingCount(): void {
    this.pendingCount.set(this.store.listPending().length + this.store.listTaskQueue().length);
  }

  /** Complete a queued task (child WO) by href; dequeues on success, stays queued on failure. */
  submitTask(href: string, wonum: string): Observable<unknown> {
    return this.api.completeWorkOrder(href, { complete: true }).pipe(
      tap(() => { this.store.dequeueTask(wonum); this.refreshPendingCount(); }),
      catchError(err => { this.refreshPendingCount(); return throwError(() => err); })
    );
  }

  /** Submit one draft. On success clears the grab; on failure re-saves it with a retry status, then rethrows. */
  submit(draft: MaximoCompletionDraft): Observable<unknown> {
    const call: Observable<unknown> = draft.mode === 'form'
      ? this.api.completeForm({
          templateFormKey: draft.templateFormKey ?? '',
          wonum: draft.wonum,
          woHref: draft.href,
          siteid: draft.siteid,
          valuesJson: JSON.stringify(draft.formValues ?? {}),
          status: 'COMPLETED',
        })
      : this.api.completeWorkOrder(draft.href, {
          labor: draft.hours && Number(draft.hours) > 0 ? [{ regularhrs: Number(draft.hours) }] : undefined,
          summary: draft.summary || undefined,
          details: draft.details || undefined,
          complete: true,
        });
    return call.pipe(
      tap(() => { this.store.clearGrab(draft.wonum); this.refreshPendingCount(); }),
      catchError(err => {
        const status = err?.status;
        draft.status = (status === 400 || status === 409) ? 'failed' : 'pending';
        draft.lastError = err?.error?.message || err?.message || 'Submit failed';
        this.store.saveDraft(draft);
        this.refreshPendingCount();
        return throwError(() => err);
      })
    );
  }

  private flush(): void {
    if (this.flushing) return;
    const queued = this.store.listPending();
    const tasks = this.store.listTaskQueue();
    if (!queued.length && !tasks.length) return;
    this.flushing = true;
    const drafts$ = from(queued).pipe(concatMap(d => this.submit(d).pipe(catchError(() => of(null)))));
    const tasks$ = from(tasks).pipe(concatMap(t => this.submitTask(t.href, t.wonum).pipe(catchError(() => of(null)))));
    concat(drafts$, tasks$).pipe(
      finalize(() => { this.flushing = false; this.refreshPendingCount(); })
    ).subscribe();
  }
}
