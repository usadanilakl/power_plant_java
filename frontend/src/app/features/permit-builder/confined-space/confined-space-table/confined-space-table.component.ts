import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { CurrentConfinedSpaceService } from '../../../../services/current-items-services/current-confined-space.service';
import { Column } from '../../../../models/column.model';
import { ConfinedSpaceDto } from '../../../../models/permits/confined-space.model';
import { TableComponent } from '../../../../shared/table/refactored/table.component';
import { TableSelectionService } from '../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../shared/table/refactored/services/table-drag.service';
import { TableStateService } from '../../../../shared/table/refactored/services/table-state.service';
import { TableSearchService } from '../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../shared/table/refactored/services/table-sort.service';
import { TableResizeService } from '../../../../shared/table/refactored/services/table-resize.service';
import { TableSyncService } from '../../../../shared/table/refactored/services/table-sync.service';
import { TableClickService } from '../../../../shared/table/refactored/services/table-click.service';
import { TableControlsService } from '../../../../shared/table/refactored/services/table-controls.service';
import { TableDataService } from '../../../../shared/table/refactored/services/table-data.service';
import { ConfinedSpaceTableClickService } from './confined-space-table-click.service';

@Component({
  selector: 'app-confined-space-table',
  standalone: true,
  imports: [CommonModule, TableComponent],
  providers: [
    TableSelectionService,
    TableStateService,
    TableDragService,
    TableSearchService,
    TableSortService,
    TableResizeService,
    TableSyncService,
    TableControlsService,
    TableDataService,
    {
      provide: TableClickService,
      useClass: ConfinedSpaceTableClickService,
    },
  ],
  templateUrl: './confined-space-table.component.html',
  styleUrl: './confined-space-table.component.css',
})
export class ConfinedSpaceTableComponent {
  private currentConfinedSpaceService = inject(CurrentConfinedSpaceService);

  items = toSignal(this.currentConfinedSpaceService.allActiveConfinedSpaces$, { initialValue: [] });
  columns = signal<Column[]>(ConfinedSpaceDto.toTableColumns());
}
