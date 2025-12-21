import { inject, Injectable, signal } from '@angular/core';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { RfLotoPointClickService } from '../../rf-loto-point-table/rf-loto-point-click.service';


@Injectable()
export class SourceLotoPointTableClickService extends RfLotoPointClickService {

  doubleTableService = inject(DoubleLotoPointTableService);
    doubleClickedRow = signal<LotoPointDto | null>(null);

  /**
   * Override: Handle row double click for LOTO points
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    console.log('Executing SourceLotoPointTableClickService.handleRowDoubleClick()');
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    this.doubleTableService.addItemToSelected(normalizedItem);
  }

}
