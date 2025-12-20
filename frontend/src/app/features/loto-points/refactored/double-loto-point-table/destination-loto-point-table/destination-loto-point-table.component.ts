import { Component, inject, signal } from '@angular/core';
import { RfLotoPointTableComponent } from "../../rf-loto-point-table/rf-loto-point-table.component";
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { ButtonColor } from '../../../../../shared/menu/buttons/buttons.component';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { DestinationLotoPointTableClickService } from './destination-loto-point-table-click.service';
import { TableSelectionService } from '../../../../../shared/table/refactored/services/table-selection.service';
import { TableDragService } from '../../../../../shared/table/refactored/services/table-drag.service';
import { TableControlsService } from '../../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../../shared/table/refactored/services/table-state.service';
import { TableDataService } from '../../../../../shared/table/refactored/services/table-data.service';
import { TableSearchService } from '../../../../../shared/table/refactored/services/table-search.service';
import { TableSortService } from '../../../../../shared/table/refactored/services/table-sort.service';

@Component({
  selector: 'app-destination-loto-point-table',
  imports: [RfLotoPointTableComponent],
  providers: [
    TableSelectionService,
    TableDragService,
    TableControlsService,
    TableStateService,
    TableDataService,
    TableSelectionService,
    TableSearchService,
    TableSortService,
    {
      provide: TableClickService,
      useClass: DestinationLotoPointTableClickService,
    },
  ],
  templateUrl: './destination-loto-point-table.component.html',
  styleUrl: './destination-loto-point-table.component.css',
})
export class DestinationLotoPointTableComponent {
  doubleTableService = inject(DoubleLotoPointTableService);

  selectedTableHighlightedItems = signal<LotoPointDto[]>([]);
  bulkControlButtonsForDestinationTable = [
    {
      name: 'Remove Selected',
      action: () => {
        this.doubleTableService.onRemoveItemsFromSelected(
          this.selectedTableHighlightedItems()
        );
      },
      color: 'primary' as ButtonColor,
    },
  ];
}
