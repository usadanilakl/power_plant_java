import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { ButtonColor } from "../../../../shared/menu/buttons/buttons.component";
import { RfLotoStandardStateService } from "../services/rf-loto-standard-state.service";
import { LotoStandardDto } from "../../../../models/loto/loto-standard.model";
import { ExportDialogService } from "../../../../shared/export-dialog/export-dialog.service";
import { ExcelService } from "../../../../services/excel.service";

@Injectable()
export class LotoStandardTableControlService extends TableControlsService {
    private stateService = inject(RfLotoStandardStateService);
    private exportDialogService = inject(ExportDialogService);
    private excelService = inject(ExcelService);

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
          {
            name: 'Export to Excel',
            action: () => {
              this.exportDialogService.open({
                entityType: 'lotoStandard',
                entityLabel: 'LOTO Standards',
                searchCriteria: this.stateService.getCurrentSearchCriteria(),
                selectedIds: this.stateService.selectedItems().map(item => item.id),
                exportAllFn: () => this.excelService.exportLotoStandardAll(),
                exportByQueryFn: (criteria) => this.excelService.exportLotoStandardByQuery(criteria),
                exportByIdsFn: (ids) => this.excelService.exportLotoStandardByIds(ids),
              });
            },
            color: 'primary' as ButtonColor,
            icon: 'file_download',
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
