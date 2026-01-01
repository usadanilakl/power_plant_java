import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { ButtonColor } from "../../../../shared/menu/buttons/buttons.component";
import { RfLotoStandardStateService } from "../services/rf-loto-standard-state.service";
import { LotoStandardDto } from "../../../../models/loto/loto-standard.model";

@Injectable()
export class LotoStandardTableControlService extends TableControlsService {
    private stateService = inject(RfLotoStandardStateService);

    constructor() {
        super();
        this.addTableControlButtons([
          {
            name: 'Add New LOTO Standard',
            action: () => {
              this.stateService.setSelectedItem(new LotoStandardDto());
              this.stateService.openForm();
            },
            color: 'accent' as ButtonColor,
            icon: 'add_box',
          },
        ]);

        // Add bulk edit button to selection controls (future implementation)
        // this.addTableSelectionControls([
        //   {
        //     name: 'Bulk Edit',
        //     action: () => {
        //       // Future: implement bulk edit for standards
        //     },
        //     color: 'accent' as ButtonColor,
        //     icon: 'edit_note',
        //     tooltip: 'Edit multiple LOTO standards at once'
        //   }
        // ]);
    }
}
