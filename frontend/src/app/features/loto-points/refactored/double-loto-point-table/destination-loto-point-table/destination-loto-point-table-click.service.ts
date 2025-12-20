import { inject, Injectable, signal } from '@angular/core';
import { RfLotoPointClickService } from '../../services/rf-loto-point-click.service';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';


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
