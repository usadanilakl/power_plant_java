import { inject, Injectable, signal } from '@angular/core';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { RfLotoPointClickService } from '../../rf-loto-point-table/rf-loto-point-click.service';


@Injectable()
export class SourceLotoPointTableClickService extends RfLotoPointClickService {

  doubleTableService = inject(DoubleLotoPointTableService);
    doubleClickedRow = signal<LotoPointDto | null>(null);

  /**
   * Double-click opens the details dialog (LotoPointDualForm in a popup).
   * <p>
   * Previously double-click added the item to the selected set — but the
   * matching remove-on-double-click behavior on the destination table
   * was reported as confusing (same gesture, opposite effects depending
   * on which table). Add / remove now live on the context menu and on
   * the sticky arrow columns. The dialog is view-only from the caller's
   * perspective; edits to the point itself go through the dual form's
   * own save flow.
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    this.doubleTableService.viewPoint(normalizedItem);
  }

}
