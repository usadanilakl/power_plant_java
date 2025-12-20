import { Component, inject, signal } from '@angular/core';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { ButtonColor } from '../../../../../shared/menu/buttons/buttons.component';
import { RfLotoPointTableComponent } from "../../rf-loto-point-table/rf-loto-point-table.component";
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { SourceLotoPointTableClickService } from './source-loto-point-table-click.service';
import { TableSearchService } from '../../../../../shared/table/refactored/services/table-search.service';
import { TableControlsService } from '../../../../../shared/table/refactored/services/table-controls.service';
import { TableStateService } from '../../../../../shared/table/refactored/services/table-state.service';

@Component({
  selector: 'app-source-loto-point-table',
  imports: [RfLotoPointTableComponent],
  providers: [
    TableSearchService,
    TableControlsService,
    TableStateService,
    { provide: TableClickService, useClass: SourceLotoPointTableClickService  }
  ],
  templateUrl: './source-loto-point-table.component.html',
  styleUrl: './source-loto-point-table.component.css'
})
export class SourceLotoPointTableComponent {

  doubleTableService = inject(DoubleLotoPointTableService);
  
  availableTableHighlightedItems = signal<LotoPointDto[]>([]);
  bulkControlButtonsForSourceTable = [
    { 
      name: 'Add Selected', 
      action: () => { 
        this.doubleTableService.onAddItemsToSelected(this.availableTableHighlightedItems()) 
      }, 
      color: 'primary' as ButtonColor
    },
  ]



}
