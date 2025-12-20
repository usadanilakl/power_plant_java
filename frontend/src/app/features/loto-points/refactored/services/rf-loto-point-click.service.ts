
import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { RfLotoPointStateService } from './rf-loto-point-state.service';
import { LotoPointContextMenuService } from '../loto-point-context-menu/loto-point-context-menu.service';
import { Column } from '../../../../models/column.model';
import { LotoPointDto, LotoPointModel } from '../../../../models/loto/loto-point.model';

@Injectable({
  providedIn: 'root'
})
export class RfLotoPointClickService extends TableClickService {
  private lotoStateService = inject(RfLotoPointStateService);
  private contextMenuService = inject(LotoPointContextMenuService);

  constructor() {
    super();
    console.log(`��� [${this.debugInstanceId}] Initialized`);
  }

  /**
   * Override: Handle row double click for LOTO points
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('🟢 LOTO: Double click -', normalizedItem);
    console.log(`🆔 [${this.debugInstanceId}] LOTO double click:`, item);
    
    this.lotoStateService.setSelectedItem(normalizedItem);
    // Emit event or trigger form opening
  }

  /**
   * Override: Handle row right click for LOTO points
   */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('🔵 LOTO: Right click -', normalizedItem);
    
    this.contextMenuService.showContextMenu(normalizedItem, event);
    this.contextMenuService.positionContextMenu(event, 220, 320);
  }

  /**
   * Override: Handle cell double click for LOTO points
   */
  protected override handleCellDoubleClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('LOTO: Cell double click -', normalizedItem, column);
    
    this.lotoStateService.setSelectedItem(normalizedItem);
    const field = column.accessorKey as keyof LotoPointModel;
    this.lotoStateService.openForm([field]);
    // Open form with specific field
  }

  /**
   * Override: Handle cell right click for LOTO points
   */
  protected override handleCellRightClick(item: any, column: Column): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    console.log('LOTO: Cell right click -', normalizedItem, column);
    
    // Custom context menu for cell
  }
}
