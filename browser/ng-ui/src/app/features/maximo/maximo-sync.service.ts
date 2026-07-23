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
export type MaximoSubmitPhase = 'submitting' | 'done' | 'queued' | 'failed';
export interface MaximoSubmitState { phase: MaximoSubmitPhase; error?: string; }

@Injectable({ providedIn: 'root' })
export class MaximoSyncService {
  private store = inject(MaximoOfflineStore);
  private api = inject(MaximoApiService);
  private serverStatus = inject(ServerStatusService);

  private flushing = false;
  pendingCount = signal(0);

  /**
   * Live submit state per WO, keyed by wonum. Held here (a root singleton) rather than in the WO-detail
   * component so a submit SURVIVES the sheet being closed: closing the sheet destroys the component and would
   * otherwise cancel the in-flight HTTP request (while the server keeps going — the duplicate-attachment trap).
   * Reopening the same WO reads this state, so the operator sees "Submitting…/done" instead of a fresh button.
   */
  submitStates = signal<Record<string, MaximoSubmitState>>({});
  stateFor(wonum: string): MaximoSubmitState | undefined { return this.submitStates()[wonum]; }
  clearState(wonum: string): void {
    const next = { ...this.submitStates() }; delete next[wonum]; this.submitStates.set(next);
  }
  private setState(wonum: string, phase: MaximoSubmitPhase, error?: string): void {
    this.submitStates.set({ ...this.submitStates(), [wonum]: { phase, error } });
  }

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

  /**
   * Submit a completion draft, owning the subscription here so it can't be cancelled by the sheet closing.
   * The draft is marked 'pending' up front so an app kill mid-flight still recovers on reconnect; the backend
   * de-duplicates a repeat attach, so a recovery resubmit is safe. Progress is exposed via {@link stateFor}.
   */
  submitOwned(draft: MaximoCompletionDraft): void {
    draft.status = 'pending';
    this.store.saveDraft(draft);
    this.refreshPendingCount();
    this.setState(draft.wonum, 'submitting');
    // submit() drives the terminal state (done / failed / queued); errors are already recorded there, so swallow.
    this.submit(draft).subscribe({ error: () => {} });
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
          pmnum: draft.pmnum,
          woHref: draft.href,
          siteid: draft.siteid,
          valuesJson: JSON.stringify(draft.formValues ?? {}),
          status: 'COMPLETED',
          completeWo: true,   // performing a PM via the form closes its work order (COMP)
        })
      : this.api.completeWorkOrder(draft.href, {
          labor: draft.hours && Number(draft.hours) > 0 ? [{ regularhrs: Number(draft.hours) }] : undefined,
          summary: draft.summary || undefined,
          details: draft.details || undefined,
          complete: true,
        });
    return call.pipe(
      // Drive the durable submit state here (not just in submitOwned) so a reconnect flush also flips any open
      // sheet from "Saved on this device" to "completed".
      tap(() => { this.store.clearGrab(draft.wonum); this.setState(draft.wonum, 'done'); this.refreshPendingCount(); }),
      catchError(err => {
        const status = err?.status;
        const failed = status === 400 || status === 409;
        draft.status = failed ? 'failed' : 'pending';
        draft.lastError = err?.error?.message || err?.message || 'Submit failed';
        this.store.saveDraft(draft);
        this.setState(draft.wonum, failed ? 'failed' : 'queued',
          failed ? (err?.error?.message || err?.message || 'Could not complete.') : undefined);
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
