import { inject, Injectable } from '@angular/core';
import { Column } from '../../../../models/column.model';
import { WorkAreaDto } from '../../../../models/permits/work-area.model';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { WorkAreaContextMenuService } from '../services/work-area-context-menu.service';
import { WorkAreaMapStateService } from './work-area-map-state.service';

@Injectable()
export class WorkAreaNavTableClickService extends TableClickService {
  private state = inject(WorkAreaMapStateService);
  private contextMenuService = inject(WorkAreaContextMenuService);

  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    this.openContextMenu(item, event);
  }

  protected override handleCellRightClick(item: any, _column: Column): void {
    const nativeEvent = window.event;
    if (nativeEvent instanceof MouseEvent) {
      this.openContextMenu(item, nativeEvent);
    }
  }

  private openContextMenu(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as WorkAreaDto;
    if (!normalizedItem?.id) {
      return;
    }

    this.state.selectedWorkArea.set(normalizedItem);
    this.state.selectedShapeId.set(normalizedItem.shapeId ?? null);
    this.contextMenuService.showContextMenu(normalizedItem, event);
    this.contextMenuService.positionContextMenu(event, 220, 220);
  }
}
