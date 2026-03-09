import { Injectable } from '@angular/core';
import { IndexedDbService } from '../../../../services/indexed-db.service';
import { InstrumentLogEntry } from '../../../../models/equipment/instrument-log.model';
import { from, Observable } from 'rxjs';
import { liveQuery } from 'dexie';

@Injectable({
  providedIn: 'root'
})
export class InstrumentLogDbService {

  constructor(private indexedDbService: IndexedDbService) {}

  getByInstrumentTag(tagNumber: string): Observable<InstrumentLogEntry[]> {
    return from(liveQuery(async () => {
      const rows = await this.indexedDbService.instrumentLogs
        .where('instrumentTagNumber')
        .equals(tagNumber)
        .toArray();

      return rows.sort((a, b) => {
        const aTs = `${a.date ?? ''} ${a.time ?? ''}`;
        const bTs = `${b.date ?? ''} ${b.time ?? ''}`;
        return bTs.localeCompare(aTs);
      });
    }));
  }

  replaceForInstrument(tagNumber: string, items: InstrumentLogEntry[]): Observable<void> {
    return from(this.indexedDbService.transaction('rw', this.indexedDbService.instrumentLogs, async () => {
      await this.indexedDbService.instrumentLogs
        .where('instrumentTagNumber')
        .equals(tagNumber)
        .delete();
      if (items.length > 0) {
        await this.indexedDbService.instrumentLogs.bulkPut(items);
      }
    }));
  }
}
