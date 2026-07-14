import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, concatMap, distinctUntilChanged, filter, from, of, tap, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ServerStatusService } from '../../services/server-status.service';
import { LotoPermitApiService } from './loto-permit-api.service';
import { LotoPermitStore } from './loto-permit-store.service';
import {
  HangSubmitRequest, PhaseDraft, PhaseSubmitResult, PointAck, PointCheck, PwaWalkdownSession,
  VerifySubmitRequest, WalkdownDraft, WalkdownSubmitRequest,
} from './loto-permit.model';

/**
 * Flushes queued LOTO permit submits (hang/verify phase drafts + walkdown drafts). A submit made offline stays a
 * 'pending' draft and auto-flushes when {@link ServerStatusService} reports the server reachable again — mirrors the
 * LOTO-Standards / Rounds sync. Retry policy: network/5xx → 'pending' (retried each reconnect); 400/409 → 'failed'
 * (terminal, waits for the user). The batch endpoints are idempotent (already-done points are skipped server-side),
 * so a re-flush safely applies only the remainder.
 */
@Injectable({ providedIn: 'root' })
export class LotoPermitSyncService {
  private store = inject(LotoPermitStore);
  private api = inject(LotoPermitApiService);
  private serverStatus = inject(ServerStatusService);

  private flushing = false;
  pendingCount = signal(0);

  constructor() {
    this.refresh();
    this.serverStatus.isOnline$.pipe(
      distinctUntilChanged(),
      filter(online => online),
      takeUntilDestroyed()
    ).subscribe(() => this.flush());
  }

  refresh(): void { this.pendingCount.set(this.store.pendingCount()); }

  private phasePayload(d: PhaseDraft): HangSubmitRequest | VerifySubmitRequest {
    const points: PointAck[] = Object.entries(d.answers)
      .filter(([, a]) => a.checked)
      .map(([pid, a]) => ({ pointId: Number(pid), acknowledged: a.acknowledged ?? [], notes: a.notes?.trim() || null }));
    return d.phase === 'HANG'
      ? { points, signHung: d.sign, hungNotes: d.aggregateNotes?.trim() || null }
      : { points, signVerified: d.sign, verifiedNotes: d.aggregateNotes?.trim() || null };
  }

  submitPhase(draft: PhaseDraft): Observable<PhaseSubmitResult> {
    const call = draft.phase === 'HANG'
      ? this.api.submitHang(draft.lotoId, this.phasePayload(draft) as HangSubmitRequest)
      : this.api.submitVerify(draft.lotoId, this.phasePayload(draft) as VerifySubmitRequest);
    return call.pipe(
      tap(() => { this.store.clearPhaseDraft(draft.lotoId, draft.phase); this.refresh(); }),
      catchError(err => {
        const status = err?.status;
        draft.status = (status === 409 || status === 400) ? 'failed' : 'pending';
        draft.lastError = err?.error?.message || err?.message || 'Submit failed';
        this.store.savePhaseDraft(draft);
        this.refresh();
        return throwError(() => err);
      })
    );
  }

  private walkdownPayload(d: WalkdownDraft): WalkdownSubmitRequest {
    const points: PointCheck[] = Object.entries(d.answers)
      .map(([pid, a]) => ({ pointId: Number(pid), checked: a.checked, notes: a.notes?.trim() || null }));
    return { points, complete: d.complete, notes: d.notes?.trim() || null };
  }

  submitWalkdown(draft: WalkdownDraft): Observable<PwaWalkdownSession> {
    return this.api.submitWalkdown(draft.sessionId, this.walkdownPayload(draft)).pipe(
      tap(() => { this.store.clearWalkdownDraft(draft.sessionId); this.refresh(); }),
      catchError(err => {
        const status = err?.status;
        draft.status = (status === 409 || status === 400) ? 'failed' : 'pending';
        draft.lastError = err?.error?.message || err?.message || 'Submit failed';
        this.store.saveWalkdownDraft(draft);
        this.refresh();
        return throwError(() => err);
      })
    );
  }

  /** Auto-flush queued ('pending') drafts on reconnect. 'failed' drafts wait for the user. */
  private flush(): void {
    if (this.flushing) return;
    const phase = this.store.pendingPhaseDrafts().filter(d => d.status === 'pending');
    const wd = this.store.pendingWalkdownDrafts().filter(d => d.status === 'pending');
    if (!phase.length && !wd.length) return;
    this.flushing = true;
    from([
      ...phase.map(d => this.submitPhase(d).pipe(catchError(() => of(null)))),
      ...wd.map(d => this.submitWalkdown(d).pipe(catchError(() => of(null)))),
    ]).pipe(
      concatMap(o => o),
      finalize(() => { this.flushing = false; this.refresh(); })
    ).subscribe();
  }
}
