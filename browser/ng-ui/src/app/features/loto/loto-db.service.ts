import { Injectable, inject } from '@angular/core';
import { LotoCollection, RxdbService } from '../../services/db/rxdb.service';
import { LotoDocType } from '../../models/permits/loto/loto.schema';
import { BaseDbService } from '../../services/base-db.service';
import { Loto } from '../../models/permits/loto/loto.model';

@Injectable({
  providedIn: 'root'
})
export class LotoDbService extends BaseDbService<Loto, LotoDocType, LotoCollection> {
  constructor() {
    super(inject(RxdbService), Loto, 'lotos');
  }

  // You can still add Loto-specific methods here if needed.
  // For example, a method to find all Lotos with a certain description.
  // The generic CRUD methods (getAll, getById, add, update, remove) are inherited.
}