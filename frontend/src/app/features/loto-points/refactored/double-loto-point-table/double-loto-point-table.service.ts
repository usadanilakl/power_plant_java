import { Injectable, inject, signal } from '@angular/core';
import { LotoPointContextMenuService } from '../loto-point-context-menu/loto-point-context-menu.service';
import { Column } from '../../../../models/column.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointClickService } from '../services/rf-loto-point-click.service';

@Injectable()
export class DoubleLotoPointTableClickService extends RfLotoPointClickService {

    doubleClickedRow = signal<LotoPointDto | null>(null);

  /**
   * Override: Handle row double click for LOTO points
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('🟢 LOTO: Double click -', normalizedItem);
    console.log(`🆔 [${this.debugInstanceId}] LOTO double click:`, item);

    this.doubleClickedRow.set(normalizedItem);
    
    // this.lotoStateService.setSelectedItem(normalizedItem);
    // Emit event or trigger form opening
  }
}
