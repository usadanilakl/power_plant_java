import { Injectable, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable, Subject, concatMap, distinctUntilChanged, filter, from, of, tap, throwError } from 'rxjs';
import { catchError, finalize } from 'rxjs/operators';
import { ServerStatusService } from '../../services/server-status.service';
import { ServerApiService } from '../../services/server-api.service';

/** One queued WO-Q&A action. An 'ask' starts a new WO thread; a 'reply' posts to an existing one. */
export interface QaOutboxItem {
  id: string;
  kind: 'ask' | 'reply';
  workorderid?: number;   // ask
  wonum?: string;         // ask — stamps maximo_wonum for display
  subject?: string;       // ask
  directedUserIds?: string; // ask — comma-joined User.id routing hint (optional)
  conversationId?: number; // reply
  content: string;
  createdAt: number;
  status: 'pending' | 'failed';
  error?: string;
}

/**
 * Offline outbox for WO Q&A. Composing a question or a reply always goes through here: the action is persisted to
 * localStorage first (so it survives an app kill / no signal) and then flushed — immediately when online, otherwise
 * automatically when {@link ServerStatusService} reports the server is reachable again (the exact reconnect-edge
 * pattern MaximoSyncService uses for offline PM completions). A root singleton so a flush isn't cancelled by the WO
 * sheet closing. Hard rejections (400/409) are parked as 'failed' rather than retried forever.
 */
@Injectable({ providedIn: 'root' })
export class MaximoQaOutboxService {
  private serverStatus = inject(ServerStatusService);
  private serverApi = inject(ServerApiService);
  private readonly key = 'maximoQaOutbox';
  private flushing = false;

  pendingCount = signal(0);
  /** Emits after a flush pass so open Q&A panels can reload their threads/messages. */
  flushed$ = new Subject<void>();

  constructor() {
    this.pendingCount.set(this.load().length);
    this.serverStatus.isOnline$.pipe(
      distinctUntilChanged(),
      filter(online => online),
      takeUntilDestroyed()
    ).subscribe(() => this.flush());
  }

  // ── queue (localStorage, guarded) ───────────────────────────────────────────
  private load(): QaOutboxItem[] {
    try { return JSON.parse(localStorage.getItem(this.key) || '[]'); } catch { return []; }
  }
  private save(items: QaOutboxItem[]): void {
    try { localStorage.setItem(this.key, JSON.stringify(items)); } catch { /* storage full/blocked — best effort */ }
    this.pendingCount.set(items.length);
  }
  private add(item: QaOutboxItem): void { const items = this.load(); items.push(item); this.save(items); }
  private remove(id: string): void { this.save(this.load().filter(i => i.id !== id)); }
  private mark(id: string, status: 'pending' | 'failed', error?: string): void {
    this.save(this.load().map(i => i.id === id ? { ...i, status, error } : i));
  }
  private uid(): string { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }

  // ── public API ──────────────────────────────────────────────────────────────
  /** Queue a new WO question (optimistic + offline-safe); flushes immediately when online. directedUserIds is an
   *  optional comma-joined User.id routing hint. */
  enqueueAsk(workorderid: number, wonum: string, subject: string, content: string, directedUserIds?: string): void {
    this.add({ id: this.uid(), kind: 'ask', workorderid, wonum, subject, content, directedUserIds, createdAt: Date.now(), status: 'pending' });
    this.flush();
  }
  /** Queue a reply to an existing WO thread. */
  enqueueReply(conversationId: number, content: string): void {
    this.add({ id: this.uid(), kind: 'reply', conversationId, content, createdAt: Date.now(), status: 'pending' });
    this.flush();
  }
  /** Pending (not-yet-sent) questions for a WO — shown optimistically in the panel. */
  pendingAsksForWo(workorderid: number): QaOutboxItem[] {
    return this.load().filter(i => i.kind === 'ask' && i.workorderid === workorderid);
  }
  /** Pending replies for a thread — shown optimistically at the bottom of the thread. */
  pendingRepliesFor(conversationId: number): QaOutboxItem[] {
    return this.load().filter(i => i.kind === 'reply' && i.conversationId === conversationId);
  }
  /** Re-arm any parked ('failed') items and flush. */
  retryFailed(): void { this.save(this.load().map(i => ({ ...i, status: 'pending' as const, error: undefined }))); this.flush(); }

  // ── flush ─────────────────────────────────────────────────────────────────────
  private flush(): void {
    if (this.flushing) return;
    const items = this.load().filter(i => i.status !== 'failed');   // don't auto-retry hard rejections
    if (!items.length) return;
    this.flushing = true;
    from(items).pipe(
      concatMap(item => this.submit(item).pipe(catchError(() => of(null)))),
      finalize(() => { this.flushing = false; this.flushed$.next(); })
    ).subscribe();
  }

  private submit(item: QaOutboxItem): Observable<unknown> {
    const call: Observable<unknown> = item.kind === 'ask'
      ? this.serverApi.startConversation({
          entityType: 'MaximoWorkOrder',
          entityId: item.workorderid!,
          subject: item.subject || ('WO ' + (item.wonum || '')),
          initialMessageContent: item.content,
          maximoWonum: item.wonum,
          directedUserIds: item.directedUserIds,
        })
      : this.serverApi.sendMessage(item.conversationId!, item.content);
    return call.pipe(
      tap(() => this.remove(item.id)),
      catchError(err => {
        const s = err?.status;
        if (s === 400 || s === 409) {
          this.mark(item.id, 'failed', err?.error?.message || err?.message || 'Rejected');
        }
        // Any other error (offline / 5xx / timeout) leaves the item 'pending' for the next reconnect flush.
        return throwError(() => err);
      })
    );
  }
}
