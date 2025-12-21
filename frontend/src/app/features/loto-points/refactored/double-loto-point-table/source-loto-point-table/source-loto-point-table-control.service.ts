import { inject, Injectable } from "@angular/core";
import { ButtonColor } from "../../../../../shared/menu/buttons/buttons.component";
import { DoubleLotoPointTableService } from "../double-loto-point-table.service";
import { LotoPointTableControlService } from "../../rf-loto-point-table/rf-loto-point-table-control.service";

@Injectable()
export class SourceLotoPointTableControlService extends LotoPointTableControlService {
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