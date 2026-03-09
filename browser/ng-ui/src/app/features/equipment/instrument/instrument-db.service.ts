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

  replaceAll(items: Instrument[]): Observable<void> {
    return from(this.indexedDbService.transaction('rw', this.indexedDbService.instruments, async () => {
      await this.indexedDbService.instruments.clear();
      if (items.length > 0) {
        await this.indexedDbService.instruments.bulkPut(items);
      }
    }));
  }
}

