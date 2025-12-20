import { Component, inject, signal } from '@angular/core';
import { RfLotoPointTableComponent } from "../../rf-loto-point-table/rf-loto-point-table.component";
import { DoubleLotoPointTableService } from '../double-loto-point-table.service';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { ButtonColor } from '../../../../../shared/menu/buttons/buttons.component';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { DestinationLotoPointTableClickService } from './destination-loto-point-table-click.service';

@Component({
  selector: 'app-destination-loto-point-table',
  imports: [RfLotoPointTableComponent],
    providers: [
      { provide: TableClickService, useClass: DestinationLotoPointTableClickService  }
    ],
  templateUrl: './destination-loto-point-table.component.html',
  styleUrl: './destination-loto-point-table.component.css'
})
export class DestinationLotoPointTableComponent {
  doubleTableService = inject(DoubleLotoPointTableService);
  
  
  selectedTableHighlightedItems = signal<LotoPointDto[]>([]);
  bulkControlButtonsForDestinationTable = [
    { 
      name: 'Remove Selected', 
      action: () => { 
        this.doubleTableService.onRemoveItemsFromSelected(this.selectedTableHighlightedItems()) 
      }, 
      color: 'primary' as ButtonColor
    },
  ]

}
