import { inject, Injectable } from "@angular/core";
import { ButtonColor } from "../../../../../shared/menu/buttons/buttons.component";
import { DoubleLotoPointTableService } from "../double-loto-point-table.service";
import { LotoPointTableControlService } from "../../rf-loto-point-table/rf-loto-point-table-control.service";

@Injectable()
export class DestinationLotoPointTableControlService extends LotoPointTableControlService {
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