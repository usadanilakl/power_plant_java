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
   * Applies a delta from the hub: each incoming row replaces the local one with the same tag, and
   * anything new is added. Rows the delta doesn't mention are left alone — that is the whole point.
   *
   * A locally-created row that the delta now carries loses its `pendingSync` marker, since the hub
   * having it is exactly what "synced" means.
   */
  upsertMany(items: Instrument[]): Observable<number> {
    if (items.length === 0) return from(Promise.resolve(0));
    return from(this.indexedDbService.transaction('rw', this.indexedDbService.instruments, async () => {
      const tags = items.map(i => (i.tagNumber ?? '').trim().toUpperCase());
      const existing = await this.indexedDbService.instruments.toArray();
      const idByTag = new Map<string, number>();
      for (const row of existing) {
        idByTag.set((row.tagNumber ?? '').trim().toUpperCase(), row.id);
      }

      const rows = items.map((item, index) => {
        const id = idByTag.get(tags[index]);
        const { id: _ignored, ...rest } = item as any;
        return (id === undefined ? rest : { ...rest, id }) as Instrument;
      });
      await this.indexedDbService.instruments.bulkPut(rows);
      return rows.length;
    }));
  }

  /** Row count of the local mirror — reconciles against the hub's reported count after a delta. */
  count(): Observable<number> {
    return from(this.indexedDbService.instruments.count());
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
