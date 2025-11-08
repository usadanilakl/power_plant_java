import { Injectable } from '@angular/core';
import { LotoPointCollection, RxdbService } from '../../services/db/rxdb.service';
import { LotoPoint } from '../../models/permits/loto-point.model';
import { LotoPointDocType } from '../../models/permits/loto/loto-point.schema';
import { BaseDbService } from '../../services/db/base-db.service';

import { Injectable, inject } from '@angular/core';
import { LotoPointCollection, RxdbService } from '../../services/db/rxdb.service';
import { LotoPoint } from '../../models/permits/loto-point.model';
import { LotoPointDocType } from '../../models/permits/loto/loto-point.schema';
import { BaseDbService } from '../../services/db/base-db.service';

@Injectable({
  providedIn: 'root'
})
export class LotoPointDbService extends BaseDbService<LotoPoint, LotoPointDocType, LotoPointCollection> {
  constructor() {
    super(inject(RxdbService), LotoPoint, 'lotopoints');
  }

  // Add any LotoPoint-specific database methods here.
}