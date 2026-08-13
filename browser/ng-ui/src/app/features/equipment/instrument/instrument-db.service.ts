import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../../services/indexed-db.service';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';
import { Instrument } from '../../../models/equipment/instrument.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentDbService {

  constructor(private indexedDbService: IndexedDbService) {}

  getAllInstruments(): Observable<Instrument[]> {
    return from(liveQuery(() =>
      this.indexedDbService.instruments.orderBy('tagNumber').toArray()
    ));
  }

  /**
   * Swaps in a fresh register from the hub while preserving instruments this device created offline.
   *
   * Those rows exist nowhere else yet — they are still in the create outbox — so a blind clear would
   * delete the only copy and strand the logs written against them. A pending row is dropped only
   * once the incoming register contains its tag, which is exactly the moment its create landed.
   */
  replaceAll(items: Instrument[]): Observable<void> {
    return from(this.indexedDbService.transaction('rw', this.indexedDbService.instruments, async () => {
      const pending = (await this.indexedDbService.instruments.toArray())
        .filter(i => i.pendingSync);

      await this.indexedDbService.instruments.clear();
      if (items.length > 0) {
        await this.indexedDbService.instruments.bulkPut(items);
      }

      const incomingTags = new Set(items.map(i => (i.tagNumber ?? '').trim().toUpperCase()));
      const survivors = pending.filter(p => !incomingTags.has((p.tagNumber ?? '').trim().toUpperCase()));
      if (survivors.length > 0) {
        // Drop the old auto-increment keys so they can't collide with the keys just written.
        await this.indexedDbService.instruments.bulkPut(
          survivors.map(s => { const { id, ...rest } = s as any; return rest as Instrument; })
        );
      }
    }));
  }

  /**
   * Drops the `pendingSync` marker once the queued create has been accepted, so the row stops
   * advertising itself as unsent without waiting for the next full register refresh.
   */
  clearPendingFlag(tagNumber: string): Observable<void> {
    return from(this.indexedDbService.transaction('rw', this.indexedDbService.instruments, async () => {
      const tag = (tagNumber ?? '').trim().toUpperCase();
      const row = (await this.indexedDbService.instruments.toArray())
        .find(i => (i.tagNumber ?? '').trim().toUpperCase() === tag && i.pendingSync);
      if (row) await this.indexedDbService.instruments.update(row.id, { pendingSync: false } as any);
    }));
  }

  /** Adds or updates a single instrument by tag — used for instruments created offline. */
  upsertByTag(instrument: Instrument): Observable<void> {
    return from(this.indexedDbService.transaction('rw', this.indexedDbService.instruments, async () => {
      const tag = (instrument.tagNumber ?? '').trim().toUpperCase();
      const existing = (await this.indexedDbService.instruments.toArray())
        .find(i => (i.tagNumber ?? '').trim().toUpperCase() === tag);
      if (existing) {
        await this.indexedDbService.instruments.update(existing.id, { ...instrument, id: existing.id } as any);
        return;
      }
      const { id, ...rest } = instrument as any;
      await this.indexedDbService.instruments.add(rest as Instrument);
    }));
  }
}
