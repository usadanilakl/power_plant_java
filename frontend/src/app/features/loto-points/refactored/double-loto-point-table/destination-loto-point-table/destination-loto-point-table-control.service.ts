import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../../shared/table/refactored/services/table-controls.service";
import { ButtonColor, ButtonConfig } from "../../../../../shared/menu/buttons/buttons.component";
import { DoubleLotoPointTableService } from "../double-loto-point-table.service";

@Injectable()
export class DestinationLotoPointTableControlService extends TableControlsService {

  doubleTableService = inject(DoubleLotoPointTableService);

  constructor() {
    super();
    this.addTableSelectionControls([
      {
        name: 'Remove Selected',
        action: () => {
          console.log('Adding selected items to destination table');
          this.doubleTableService.onRemoveItemsFromSelected(
            this.dataService.selectedItems()
          );
          this.selectionService.clearSelection();
        },
        color: 'primary' as ButtonColor,
        icon: 'delete',
      },
    ]);
  }
}