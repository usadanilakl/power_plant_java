import { inject, Injectable, signal } from '@angular/core';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { RfLotoPointClickService } from '../../rf-loto-point-table/rf-loto-point-click.service';


@Injectable()
export class DestinationLotoPointTableClickService extends RfLotoPointClickService {

  doubeTableService = inject(DoubleLotoPointTableService);
  doubleClickedRow = signal<LotoPointDto | null>(null);

  /**
   * Double-click opens the details dialog. See the twin comment in
   * SourceLotoPointTableClickService for the rationale — add/remove
   * moved to the context menu + sticky arrow columns so the double-click
   * gesture is consistent across both tables and never mutates state
   * accidentally.
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    this.doubeTableService.viewPoint(normalizedItem);
  }
}
