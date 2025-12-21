import { inject, Injectable, signal } from '@angular/core';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { RfLotoPointClickService } from '../../rf-loto-point-table/rf-loto-point-click.service';


@Injectable()
export class DestinationLotoPointTableClickService extends RfLotoPointClickService {

  doubeTableService = inject(DoubleLotoPointTableService);
  doubleClickedRow = signal<LotoPointDto | null>(null);

  /**
   * Override: Handle row double click for LOTO points
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    this.doubeTableService.removeItemFromSelected(normalizedItem);
  }
}
