import { inject, Injectable, signal } from '@angular/core';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';
import { IndexedDbService } from '../../../../services/indexed-db.service';
import { InstrumentLogEntry, InstrumentLogOutboxItem } from '../../../../models/equipment/instrument-log.model';
import { SubmissionOrchestratorService } from '../../../../services/submission-orchestrator.service';

/**
 * Durable retry queue for instrument logs.
 *
 * A log written in the field is real work: it must not depend on the phone having signal at the
 * moment the tech taps Submit. Anything the submission chain (hub → Power Automate) can't land goes
 * in here and is retried on reconnect, on app start, and on demand. The `localUuid` travels with the
 * entry, so a retry that the hub already accepted comes back as a duplicate and is simply dropped.
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentLogOutboxService {

  private db = inject(IndexedDbService);
  private orchestrator = inject(SubmissionOrchestratorService);

  /** True while a flush is running — the UI shows "sending…" instead of offering another flush. */
  readonly isFlushing = signal(false);

  readonly pending$: Observable<InstrumentLogOutboxItem[]> = from(liveQuery(() =>
    this.db.instrumentLogOutbox.orderBy('createdAt').toArray()
  ));

  constructor() {
    window.addEventListener('online', () => void this.flush());
  }

  async enqueue(entry: InstrumentLogEntry, lastError?: string): Promise<void> {
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

  async countPending(): Promise<number> {
    return this.db.instrumentLogOutbox.count();
  }

  async remove(id: number): Promise<void> {
    await this.db.instrumentLogOutbox.delete(id);
  }

  /**
   * Attempts every queued log once. Returns how many landed; failures stay queued with their
   * attempt count bumped so the UI can show why something is stuck.
   */
  async flush(): Promise<number> {
    if (this.isFlushing()) return 0;
    if (!navigator.onLine) return 0;

    const items = await this.db.instrumentLogOutbox.orderBy('createdAt').toArray();
    if (items.length === 0) return 0;

    this.isFlushing.set(true);
    let sent = 0;
    try {
      for (const item of items) {
        const entry = new InstrumentLogEntry(item.entry);
        entry.localUuid = item.localUuid;
        try {
          const result = await this.submitOnce(entry);
          // A 'local' result means the hub stored it but SharePoint is still pending — that is the
          // hub's problem to finish syncing, not something this device should keep retrying.
          if (result?.success) {
            await this.db.instrumentLogOutbox.delete(item.id!);
            sent++;
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
    return sent;
  }

  private submitOnce(entry: InstrumentLogEntry) {
    return new Promise<{ success: boolean; message?: string } | null>((resolve) => {
      this.orchestrator.submitInstrumentLog(entry).subscribe({
        next: result => resolve(result),
        error: error => resolve({ success: false, message: error?.message ?? 'Network error' })
      });
    });
  }
}
