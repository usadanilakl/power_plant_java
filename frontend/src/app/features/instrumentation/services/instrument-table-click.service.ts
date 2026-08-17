import { Injectable, inject } from '@angular/core';
import { TableClickService } from '../../../shared/table/refactored/services/table-click.service';
import { InstrumentContextMenuService } from './instrument-context-menu.service';

/**
 * Routes a right-click on an instrument row into the register's context menu. Mirrors
 * {@code RfFieldListTableClickService} — the shared table calls the base hook, so the feature swaps
 * this subclass in for {@code TableClickService} at the component's provider level.
 */
@Injectable()
export class InstrumentTableClickService extends TableClickService {
  private contextMenuService = inject(InstrumentContextMenuService);

  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalized = this.normalizeItem(item);
    this.contextMenuService.showContextMenu(normalized, event);
    this.contextMenuService.positionContextMenu(event, 200, 200);
  }
}
