import { inject, Injectable } from '@angular/core';
import { LotoPointContextMenuService } from '../services/loto-point-context-menu.service';
import { DoubleLotoPointTableService } from './double-loto-point-table.service';
import { ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

/**
 * Context menu variant used only inside the LOTO Standard editor's LOTO
 * Points tab (dual-table view). Extends the plant-wide LOTO Point context
 * menu by prepending "Add to Standard" / "Remove from Standard" actions
 * whose enabled state tracks whether the right-clicked point is
 * currently in the selected set — so the same menu works for both the
 * source (available-pool) and destination (in-standard) tables.
 * <p>
 * Provided at the SourceLotoPointTableComponent /
 * DestinationLotoPointTableComponent level via
 * {@code providers: [{ provide: LotoPointContextMenuService, useClass:
 * DoubleLotoPointContextMenuService }]}, so the injection replaces the
 * root singleton only inside the dual-table scope. Other LOTO Point
 * lists (main /loto-points page, tag generator, dialogs) keep the
 * original menu unchanged.
 */
@Injectable()
export class DoubleLotoPointContextMenuService extends LotoPointContextMenuService {
  private doubleTableService = inject(DoubleLotoPointTableService);

  constructor() {
    super();
    // Prepend the add/remove pair + a divider to the parent's action list.
    // Runs AFTER super(); the base constructor already built the parent
    // list, so we're extending — not replacing — the plant-wide menu.
    const membershipActions: ContextMenuAction[] = [
      {
        id: 'add-to-standard',
        label: 'Add to Standard',
        icon: '➜',
        action: (item) => this.handleAddToStandard(item),
      },
      {
        id: 'remove-from-standard',
        label: 'Remove from Standard',
        icon: '←',
        action: (item) => this.handleRemoveFromStandard(item),
      },
      {
        id: 'divider-membership',
        label: '',
        divider: true,
        action: () => {},
      },
    ];
    this.contextMenuActions = [
      ...membershipActions,
      ...this.contextMenuActions,
    ];
  }

  /**
   * Show/hide is coarse-grained (both items always in the menu). Enabled
   * state reflects membership: "Add" is disabled if the point is already
   * selected; "Remove" is disabled if the point isn't yet selected. This
   * lets one context menu work for both tables — the operator sees only
   * the option that's meaningful for the row they clicked, without the
   * menu going stale between right-clicks.
   */
  override showContextMenu(item: any, event?: MouseEvent): void {
    const isSelected = this.isInSelectedSet(item);
    this.contextMenuActions = this.contextMenuActions.map((a) => {
      if (a.id === 'add-to-standard') {
        return { ...a, disabled: isSelected };
      }
      if (a.id === 'remove-from-standard') {
        return { ...a, disabled: !isSelected };
      }
      return a;
    });
    super.showContextMenu(item, event);
  }

  private isInSelectedSet(item: LotoPointDto | null | undefined): boolean {
    if (!item?.id) return false;
    return this.doubleTableService
      .currentSelectedItems()
      .some((s) => s?.id === item.id);
  }

  private handleAddToStandard(item: LotoPointDto): void {
    if (!item) return;
    this.doubleTableService.addItemToSelected(item);
    this.closeContextMenu();
  }

  private handleRemoveFromStandard(item: LotoPointDto): void {
    if (!item) return;
    this.doubleTableService.removeItemFromSelected(item);
    this.closeContextMenu();
  }
}
