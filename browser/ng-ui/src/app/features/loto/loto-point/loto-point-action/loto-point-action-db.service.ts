import { Injectable, inject } from '@angular/core';
import { LotoPointActionCollection, RxdbService } from '../../../../services/db/rxdb.service';
import { LotoPointAction } from '../../../../models/permits/loto/loto-point-action.model';
import { BaseDbService } from '../../../../services/base-db.service';
import { LotoPointActionDocType } from '../../../../models/permits/loto/loto-point-action.schema';


@Injectable({
  providedIn: 'root'
})
export class LotoPointActionDbService extends BaseDbService<LotoPointAction, LotoPointActionDocType, LotoPointActionCollection> {
  constructor() {
    super(inject(RxdbService), LotoPointAction, 'lotopointactions');
  }

  // You can add any LotoPointAction-specific database methods here.
  // For example, finding all actions for a specific LotoPoint.
  async findByLotoPointId(lotoPointId: string): Promise<LotoPointAction[]> {
    const collection = await this._getCollection();
    const docs = await collection.find({
      selector: {
        lotoPointId: lotoPointId
      }
    }).exec();
    return docs.map(doc => new LotoPointAction(doc.toJSON()));
  }
}