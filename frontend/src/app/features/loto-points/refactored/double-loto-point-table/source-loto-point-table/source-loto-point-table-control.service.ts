import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../../shared/table/refactored/services/table-controls.service";
import { ButtonColor, ButtonConfig } from "../../../../../shared/menu/buttons/buttons.component";
import { DoubleLotoPointTableService } from "../double-loto-point-table.service";

@Injectable()
export class SourceLotoPointTableControlService extends TableControlsService {

  doubleTableService = inject(DoubleLotoPointTableService);

  constructor() {
    super();
    this.addTableSelectionControls([
      {
        name: 'Add Selected',
        action: () => {
          console.log('Adding selected items to destination table');
          this.doubleTableService.onAddItemsToSelected(
            this.dataService.selectedItems()
          );
        },
        color: 'primary' as ButtonColor,
        icon: 'keyboard_double_arrow_right',
      },
    ]);
  }
}