import { computed, inject, Injectable, signal } from '@angular/core';
import { from, Observable, Subject, take } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';
import { liveQuery } from 'dexie';
import { IndexedDbService } from '../../../services/indexed-db.service';
import { InstrumentLogEntry, InstrumentLogOutboxItem } from '../../../models/equipment/instrument-log.model';
import { IInstrument, InstrumentCreateOutboxItem } from '../../../models/equipment/instrument.model';
import { SubmissionOrchestratorService } from '../../../services/submission-orchestrator.service';
import { PwaInstrumentDto } from '../../../services/server-api.service';
import { InstrumentDbService } from './instrument-db.service';
import { AuthService } from '../../../auth/auth.service';

/**
 * Durable retry queue for everything the Instrumentation screens write: new instruments and logs.
 *
 * Field work must not depend on having signal at the moment someone taps Submit, so anything the
 * submission chain (hub → Power Automate) can't land is parked here and retried on reconnect, on app
 * start, and on demand. Every entry carries the `localUuid` minted before its first attempt, so a
 * retry the hub already accepted is recognised as a duplicate instead of creating a second row.
 *
 * Instruments replay before logs: a log for an instrument added in the same offline stretch should
 * find its register entry already there. Logs are never blocked by a failed instrument, though —
 * the hub's log submit upserts the instrument by tag anyway, so the log is still the safer thing to
 * get through.
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentOutboxService {

  private db = inject(IndexedDbService);
  private orchestrator = inject(SubmissionOrchestratorService);
  private instrumentDb = inject(InstrumentDbService);
  private auth = inject(AuthService);

  /** Announces what a flush landed, so the register can refresh without this service depending on it. */
  private flushedSubject = new Subject<{ instruments: number; logs: number }>();
  readonly flushed$ = this.flushedSubject.asObservable();

  /** True while a flush is running — the UI shows "sending…" instead of offering another flush. */
  readonly isFlushing = signal(false);

  /**
   * Live network state. Owned here rather than read ad hoc from `navigator.onLine` because the
   * indicator has to react the instant connectivity changes, and a one-shot read never re-renders.
   */
  readonly isOnline = signal(navigator.onLine);

  /** Why the last flush attempt didn't clear the queue — surfaced verbatim to the user. */
  readonly lastFlushError = signal<string | null>(null);

  readonly pendingInstruments$: Observable<InstrumentCreateOutboxItem[]> = from(liveQuery(() =>
    this.db.instrumentCreateOutbox.orderBy('createdAt').toArray()
  ));

  readonly pendingLogs$: Observable<InstrumentLogOutboxItem[]> = from(liveQuery(() =>
    this.db.instrumentLogOutbox.orderBy('createdAt').toArray()
  ));

  private pendingInstruments = toSignal(this.pendingInstruments$, { initialValue: [] as InstrumentCreateOutboxItem[] });
  private pendingLogs = toSignal(this.pendingLogs$, { initialValue: [] as InstrumentLogOutboxItem[] });

  readonly pendingInstrumentCount = computed(() => this.pendingInstruments().length);
  readonly pendingLogCount = computed(() => this.pendingLogs().length);
  /** Drives the app-wide "unsynced changes" indicator: non-zero shows it, zero removes it. */
  readonly pendingCount = computed(() => this.pendingInstrumentCount() + this.pendingLogCount());

  constructor() {
    window.addEventListener('online', () => {
      this.isOnline.set(true);
      void this.flush();
    });
    window.addEventListener('offline', () => this.isOnline.set(false));
    // Also on app start: the device may have been closed while holding queued work, and the user
    // shouldn't have to open the Instrumentation screen for it to be sent.
    void this.flush();
  }

  // ── Queueing ────────────────────────────────────────────────────────────────

  async enqueueLog(entry: InstrumentLogEntry, lastError?: string): Promise<void> {
    if (!entry.localUuid) entry.localUuid = crypto.randomUUID();
    const existing = await this.db.instrumentLogOutbox.where('localUuid').equals(entry.localUuid).first();
    if (existing) {
      await this.db.instrumentLogOutbox.update(existing.id!, { entry: { ...entry }, lastError });
      return;
    }
    await this.db.instrumentLogOutbox.add({
      localUuid: entry.localUuid,
      instrumentTagNumber: entry.instrumentTagNumber,
      entry: { ...entry },
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastError
    });
  }

  /** Queued by tag: re-submitting the same new instrument updates its payload rather than stacking. */
  async enqueueInstrument(instrument: IInstrument, lastError?: string): Promise<string> {
    const tagNumber = (instrument.tagNumber ?? '').trim().toUpperCase();
    const existing = await this.db.instrumentCreateOutbox.where('tagNumber').equals(tagNumber).first();
    if (existing) {
      await this.db.instrumentCreateOutbox.update(existing.id!, {
        payload: { ...instrument, tagNumber },
        lastError
      });
      return existing.localUuid;
    }
    const localUuid = instrument.localUuid || crypto.randomUUID();
    await this.db.instrumentCreateOutbox.add({
      localUuid,
      tagNumber,
      payload: { ...instrument, tagNumber, localUuid },
      createdAt: new Date().toISOString(),
      attempts: 0,
      lastError
    });
    return localUuid;
  }

  /** Tags still waiting to be created, so the register can mark them as unsynced. */
  async pendingInstrumentTags(): Promise<string[]> {
    const rows = await this.db.instrumentCreateOutbox.toArray();
    return rows.map(r => r.tagNumber);
  }

  async countPending(): Promise<number> {
    return (await this.db.instrumentCreateOutbox.count()) + (await this.db.instrumentLogOutbox.count());
  }

  // ── Flushing ────────────────────────────────────────────────────────────────

  /**
   * Attempts every queued item once, instruments first. Returns what landed; failures stay queued
   * with their attempt count bumped so the UI can show why something is stuck. Deliberately has no
   * give-up threshold: a log nobody can send is still the only record that the work happened.
   */
  async flush(): Promise<{ instruments: number; logs: number }> {
    if (this.isFlushing()) return { instruments: 0, logs: 0 };
    if (!navigator.onLine) {
      this.lastFlushError.set('No connection — queued items will send automatically when you are back online.');
      return { instruments: 0, logs: 0 };
    }
    // The instrument endpoints are JWT-gated, and a 401 from a background flush would trip the auth
    // interceptor into logging the user out mid-task. Hold the queue until there's a live session —
    // nothing is lost, and the next flush (reconnect, app start, or the indicator) picks it up.
    if (!this.auth.isLoggedIn()) {
      this.lastFlushError.set('Your session has expired — sign in and the queued items will send.');
      return { instruments: 0, logs: 0 };
    }

    // Claim the flush BEFORE the first await. There are four callers (constructor, the online event,
    // the state service, the indicator) and two of them can fire in the same tick on reconnect; if
    // the flag were set after the reads, both would snapshot the same rows and submit them twice.
    // The hub dedups on localUuid, but that check is a non-atomic read-then-insert, so two
    // simultaneous submissions of one entry can still both get through.
    this.isFlushing.set(true);
    let instruments = 0;
    let logs = 0;
    try {
      const instrumentItems = await this.db.instrumentCreateOutbox.orderBy('createdAt').toArray();
      const logItems = await this.db.instrumentLogOutbox.orderBy('createdAt').toArray();
      if (instrumentItems.length === 0 && logItems.length === 0) return { instruments: 0, logs: 0 };
      for (const item of instrumentItems) {
        try {
          const landed = await this.submitInstrumentOnce(item);
          if (landed.success) {
            await this.db.instrumentCreateOutbox.delete(item.id!);
            await new Promise<void>(resolve =>
              this.instrumentDb.clearPendingFlag(item.tagNumber).pipe(take(1))
                .subscribe({ next: () => resolve(), error: () => resolve() }));
            instruments++;
          } else {
            await this.db.instrumentCreateOutbox.update(item.id!, {
              attempts: (item.attempts ?? 0) + 1,
              lastError: landed.message ?? 'Creation rejected'
            });
          }
        } catch (error: any) {
          await this.db.instrumentCreateOutbox.update(item.id!, {
            attempts: (item.attempts ?? 0) + 1,
            lastError: error?.message ?? 'Network error'
          });
        }
      }

      for (const item of logItems) {
        const entry = new InstrumentLogEntry(item.entry);
        entry.localUuid = item.localUuid;
        try {
          const result = await this.submitLogOnce(entry);
          if (result?.success) {
            await this.db.instrumentLogOutbox.delete(item.id!);
            logs++;
          } else {
            await this.db.instrumentLogOutbox.update(item.id!, {
              attempts: (item.attempts ?? 0) + 1,
              lastError: result?.message ?? 'Submission rejected'
            });
          }
        } catch (error: any) {
          await this.db.instrumentLogOutbox.update(item.id!, {
            attempts: (item.attempts ?? 0) + 1,
            lastError: error?.message ?? 'Network error'
          });
        }
      }
    } finally {
      this.isFlushing.set(false);
    }
    // Anything still queued after a completed pass means the send was refused, not merely deferred —
    // report the reason the backend actually gave rather than a generic failure.
    const stuck = await this.firstStuckReason();
    this.lastFlushError.set(stuck);

    if (instruments > 0 || logs > 0) this.flushedSubject.next({ instruments, logs });
    return { instruments, logs };
  }

  /**
   * Replays one queued instrument. A tag that appeared on the hub while this device was offline
   * comes back as `requiresMerge`; there is nobody to ask during a background flush, and the user's
   * intent was "this instrument exists, here are its details" — so it retries once as a merge, which
   * the hub applies field-by-field and only for non-blank values.
   */
  private async submitInstrumentOnce(item: InstrumentCreateOutboxItem): Promise<{ success: boolean; message?: string }> {
    const dto = this.toCreateDto(item, 'none');
    const first = await this.createOnce(dto);
    if (first?.success) return { success: true };
    if (first?.requiresMerge) {
      const merged = await this.createOnce(this.toCreateDto(item, 'merge'));
      return { success: !!merged?.success, message: merged?.message };
    }
    return { success: false, message: first?.message };
  }

  private toCreateDto(item: InstrumentCreateOutboxItem, mergePolicy: 'none' | 'merge'): PwaInstrumentDto {
    const p = item.payload;
    return {
      tagNumber: item.tagNumber,
      description: p.description,
      vendor: p.vendor,
      location: p.location,
      type: p.type,
      currentStatus: p.currentStatus || 'Normal Operation',
      localUuid: item.localUuid,
      mergePolicy
    };
  }

  private createOnce(dto: PwaInstrumentDto) {
    return new Promise<{ success: boolean; message?: string; requiresMerge?: boolean } | null>((resolve) => {
      this.orchestrator.createInstrument(dto).subscribe({
        next: result => resolve(result),
        error: error => resolve({ success: false, message: error?.message ?? 'Network error' })
      });
    });
  }

  /** The error from the oldest still-queued entry — what the user needs to see first. */
  private async firstStuckReason(): Promise<string | null> {
    const instrument = await this.db.instrumentCreateOutbox.orderBy('createdAt').first();
    if (instrument?.lastError) return `${instrument.tagNumber}: ${instrument.lastError}`;
    const logRow = await this.db.instrumentLogOutbox.orderBy('createdAt').first();
    if (logRow?.lastError) return `${logRow.instrumentTagNumber}: ${logRow.lastError}`;
    return null;
  }

  private submitLogOnce(entry: InstrumentLogEntry) {
    return new Promise<{ success: boolean; message?: string } | null>((resolve) => {
      this.orchestrator.submitInstrumentLog(entry).subscribe({
        next: result => resolve(result),
        error: error => resolve({ success: false, message: error?.message ?? 'Network error' })
      });
    });
  }
}
