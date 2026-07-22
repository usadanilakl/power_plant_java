import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { concatMap, distinctUntilChanged, filter, from, of } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ServerStatusService } from '../../services/server-status.service';
import { LotoPointApiService } from './loto-point-api.service';

/**
 * One pending comment waiting for POST. Stored in localStorage as JSON so
 * offline drafts survive a page reload.
 * <p>
 * {@code localId} is a client-generated UUID — used to render the pending
 * bubble in the comment list optimistically and to reconcile with the
 * server-generated id once the POST succeeds.
 */
export interface PendingComment {
  localId: string;
  pointId: number;
  content: string;
  queuedAt: string; // ISO
  lastError?: string | null;
}

const STORAGE_KEY = 'loto-point-comment-queue';

/**
 * Offline queue for LOTO Point comments.
 * <p>
 * Comments typed while offline are appended to a localStorage-backed queue
 * and shown in the point's comment list as "pending" bubbles. When
 * {@link ServerStatusService} reports the server is reachable again the
 * queue drains via {@code concatMap} — one comment at a time, in-order,
 * so a burst of offline typing doesn't overload the mobile connection.
 * <p>
 * Retry policy: any HTTP error keeps the comment queued for the next
 * reconnect. There's no "give-up" state — comments are small enough that
 * indefinite retries are cheaper than surfacing a "manual retry" UX.
 * If the endpoint eventually 4xx's for a real reason (author gone, point
 * deleted) the error surfaces on {@code lastError} and the user can
 * discard from the UI.
 * <p>
 * Mirrors {@link LotoWalkdownSyncService}'s shape but with a simpler
 * queue (no draft-vs-pending distinction — a comment is either sent or
 * queued).
 */
@Injectable({ providedIn: 'root' })
export class LotoCommentQueueService {
  private api = inject(LotoPointApiService);
  private serverStatus = inject(ServerStatusService);

  /** Live queue count for a UI badge / toast. */
  pendingCount = signal(0);

  /**
   * All pending comments, keyed by pointId (multiple comments per point OK).
   * Signal-shaped so the point's comment panel can render them without a
   * subscribe. Mutated in-place on enqueue / drain via {@code .set(...)} so
   * signal consumers re-render.
   */
  private queueSignal = signal<PendingComment[]>([]);
  queue = this.queueSignal.asReadonly();

  private flushing = false;

  constructor() {
    this.load();
    this.serverStatus.isOnline$
      .pipe(
        distinctUntilChanged(),
        filter(online => online),
        takeUntilDestroyed(),
      )
      .subscribe(() => this.flush());
  }

  /** Return all pending comments waiting for a specific LOTO point. */
  pendingFor(pointId: number): PendingComment[] {
    return this.queueSignal().filter(p => p.pointId === pointId);
  }

  /**
   * Queue a new comment. Called even in the online case — the enqueue path
   * is a straight-line "add to queue, try to drain immediately"; the drain
   * either succeeds (queue empty again in ~200ms) or leaves the entry
   * pending. Avoids branching UI on network state.
   */
  enqueue(pointId: number, content: string): PendingComment {
    const item: PendingComment = {
      localId: this.makeLocalId(),
      pointId,
      content,
      queuedAt: new Date().toISOString(),
    };
    const next = [...this.queueSignal(), item];
    this.queueSignal.set(next);
    this.persist(next);
    // Best-effort immediate drain — if we're offline this fails and stays
    // pending; the isOnline$ subscription will retry on reconnect.
    this.flush();
    return item;
  }

  /**
   * Discard a queued comment (user gave up). No retry; removed from the queue.
   * Only works on items that never made it past the server — successfully
   * posted ones are gone from the queue already.
   */
  discard(localId: string): void {
    const next = this.queueSignal().filter(p => p.localId !== localId);
    this.queueSignal.set(next);
    this.persist(next);
    this.pendingCount.set(next.length);
  }

  private load(): void {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const parsed = JSON.parse(raw) as PendingComment[];
      if (Array.isArray(parsed)) {
        this.queueSignal.set(parsed);
        this.pendingCount.set(parsed.length);
      }
    } catch {
      // Corrupted queue — reset. Better a lost comment than a permanent
      // crash-loop on every page load.
      localStorage.removeItem(STORAGE_KEY);
    }
  }

  private persist(items: PendingComment[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      // localStorage full — nothing we can do here. Item stays in memory
      // for this session; will be dropped on refresh.
    }
    this.pendingCount.set(items.length);
  }

  /**
   * Drain the queue via concatMap so a burst of offline typing doesn't
   * saturate the mobile connection. Two invariants the code below defends:
   * <p>
   * 1. <b>Filter by localId, not content.</b> A prior version filtered
   *    successful posts by (pointId+content) — but two pending items with
   *    the same content on the same point (rapid double-tap, "OK" spam)
   *    would collapse into one send. Each queue entry has a unique
   *    localId; filtering by that never collapses unrelated items.
   * <p>
   * 2. <b>Re-flush on finalize if new items arrived mid-drain.</b> flush()
   *    snapshots the queue at line 1, so an enqueue() during the drain
   *    can't join this pass. enqueue's own flush() call short-circuits on
   *    the {@code flushing} guard. Without a re-check, the second comment
   *    sits with a "Sending…" bubble until the user reconnects or types a
   *    third one. The finalize hook re-invokes flush() when
   *    queueSignal().length outgrew the drained snapshot.
   */
  private flush(): void {
    if (this.flushing) return;
    const queued = this.queueSignal();
    if (!queued.length) return;
    this.flushing = true;
    const drainedIds = new Set<string>();
    from(queued)
      .pipe(
        concatMap(item =>
          this.api.addComment(item.pointId, item.content).pipe(
            // Capture the item.localId in this observable's closure so the
            // subscribe callback below can uniquely identify the row.
            catchError(err => {
              item.lastError = err?.error?.message || err?.message || 'Post failed';
              this.persist(this.queueSignal());
              return of<null>(null);
            }),
            // Wrap into {localId, result} so downstream can dedup precisely.
            concatMap(result => of({ localId: item.localId, result })),
          ),
        ),
        finalize(() => {
          this.flushing = false;
          // Re-check for items that arrived while we were draining. Without
          // this, an enqueue() mid-flush is stranded because its own
          // flush() call was rejected by the flushing guard and isOnline$
          // only re-fires on an actual offline->online edge.
          if (this.queueSignal().some(p => !drainedIds.has(p.localId))) {
            this.flush();
          }
        }),
      )
      .subscribe(({ localId, result }) => {
        drainedIds.add(localId);
        if (!result) return; // POST failed — leave the row in place with lastError
        // Success: remove ONLY this specific localId. Content-based
        // matching would wipe unrelated identical-text pending rows.
        const next = this.queueSignal().filter(p => p.localId !== localId);
        this.queueSignal.set(next);
        this.persist(next);
      });
  }

  private makeLocalId(): string {
    // crypto.randomUUID exists on modern mobile browsers; the fallback
    // is only for the odd embedded webview.
    if (typeof crypto !== 'undefined' && (crypto as any).randomUUID) {
      return (crypto as any).randomUUID();
    }
    return 'local-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
  }
}
