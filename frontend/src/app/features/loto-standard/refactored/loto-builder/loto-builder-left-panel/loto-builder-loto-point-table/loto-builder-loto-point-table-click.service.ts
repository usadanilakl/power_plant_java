import { inject, Injectable } from '@angular/core';
import { LotoPointDto } from '../../../../../../models/loto/loto-point.model';
import { RfLotoPointClickService } from '../../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-click.service';
import { LotoBuilderLotoPointContextMenuService } from './loto-builder-loto-point-context-menu.service';
import { LotoBuilderPointOpenerService } from '../../services/loto-builder-point-opener.service';

/**
 * Click service for the LOTO Builder left-panel LOTO point table.
 * <p>
 * Delegates the "open point + highlight + populate related files"
 * flow to {@link LotoBuilderPointOpenerService} so the same behavior
 * fires from other trigger points (currently: the Build-LOTO floating
 * window's per-loto point list in {@code SimpleLotoFormComponent}).
 * The class stays thin — it only maps table-specific click events
 * onto the shared opener + wires the scoped context menu.
 */
@Injectable()
export class LotoBuilderLotoPointTableClickService extends RfLotoPointClickService {
  private builderContextMenuService = inject(LotoBuilderLotoPointContextMenuService);
  private pointOpener = inject(LotoBuilderPointOpenerService);

  /** Single click on a row: open the point (same behavior as double
   *  click) after the base selection handling. */
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    super.handleRowLeftClick(item, event);
    const normalizedItem = this.normalizeItem(item);
    if (!(normalizedItem instanceof LotoPointDto) && !normalizedItem?.id) return;
    this.pointOpener.openPoint(normalizedItem as LotoPointDto);
  }

  /** Double click: same as single click — kept in sync so users who
   *  double-click habitually don't get a different result. */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    if (!(normalizedItem instanceof LotoPointDto) && !normalizedItem?.id) return;
    this.pointOpener.openPoint(normalizedItem as LotoPointDto);
  }

  /** Right click: builder-scoped context menu (existing behavior). */
  protected override handleRowRightClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item) as LotoPointDto;
    this.builderContextMenuService.showContextMenu(normalizedItem, event);
    this.builderContextMenuService.positionContextMenu(event, 220, 320);
  }
}
