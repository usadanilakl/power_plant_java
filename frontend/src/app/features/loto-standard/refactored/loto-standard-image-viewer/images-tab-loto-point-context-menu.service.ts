import { Injectable } from '@angular/core';
import { LotoPointContextMenuService } from '../../../loto-points/refactored/services/loto-point-context-menu.service';
import { ContextMenuAction } from '../../../../shared/menu/context-menu/context-menu.component';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';

/**
 * Context menu variant scoped to the LOTO Standard editor's Images tab.
 * Extends the plant-wide LOTO Point context menu by prepending a
 * "Remove from Standard" action that fires an injectable callback set
 * by {@link LotoStandardImageViewerComponent}. Provided at the viewer
 * component level via {@code providers: [{ provide:
 * LotoPointContextMenuService, useClass: ImagesTabLotoPointContextMenuService
 * }]}, so it only replaces the singleton inside the Images tab —
 * every other LOTO Point list on the app is unaffected.
 * <p>
 * The callback pattern (vs. a shared subject) keeps the service free
 * of framework glue and lets the viewer wire the action to the same
 * remove event pipeline the floating-arrow overlay uses.
 */
@Injectable()
export class ImagesTabLotoPointContextMenuService extends LotoPointContextMenuService {
  /** Set by LotoStandardImageViewerComponent in its constructor. */
  removeFromStandardCallback: ((point: LotoPointDto) => void) | null = null;

  constructor() {
    super();
    const removeAction: ContextMenuAction = {
      id: 'remove-from-standard',
      label: 'Remove from Standard',
      icon: '←',
      action: (item) => this.handleRemove(item as LotoPointDto),
    };
    const divider: ContextMenuAction = {
      id: 'divider-remove-from-standard',
      label: '',
      divider: true,
      action: () => {},
    };
    this.contextMenuActions = [removeAction, divider, ...this.contextMenuActions];
  }

  private handleRemove(item: LotoPointDto): void {
    if (!item?.id) return;
    if (this.removeFromStandardCallback) this.removeFromStandardCallback(item);
    this.closeContextMenu();
  }
}
