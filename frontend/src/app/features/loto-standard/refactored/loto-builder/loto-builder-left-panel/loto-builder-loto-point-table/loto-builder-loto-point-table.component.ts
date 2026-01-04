import { Component, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoPointTableComponent } from '../../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-table.component';
import { TableClickService } from '../../../../../../shared/table/refactored/services/table-click.service';
import { LotoBuilderLotoPointTableClickService } from './loto-builder-loto-point-table-click.service';

/**
 * Wrapper component for LOTO point table in LOTO builder.
 * Uses custom click service to open the file containing the equipment
 * and highlight the selected LOTO point.
 */
@Component({
  selector: 'app-loto-builder-loto-point-table',
  standalone: true,
  imports: [CommonModule, RfLotoPointTableComponent],
  providers: [
    { provide: TableClickService, useClass: LotoBuilderLotoPointTableClickService }
  ],
  template: `
    <app-rf-loto-point-table
      [tableId]="tableId()"
      [isTableIsolated]="isTableIsolated()"
      [loadMoreEnabled]="loadMoreEnabled()"
      [enableDragDrop]="enableDragDrop()"
    ></app-rf-loto-point-table>
  `,
  styles: [`
    :host {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }

    :host app-rf-loto-point-table {
      display: flex;
      flex-direction: column;
      width: 100%;
      height: 100%;
      flex: 1;
      min-height: 0;
    }
  `],
})
export class LotoBuilderLotoPointTableComponent {
  tableId = input<string>('loto-builder-loto-point-table');
  isTableIsolated = input<boolean>(false);
  loadMoreEnabled = input<boolean>(true);
  enableDragDrop = input<boolean>(false);
}
