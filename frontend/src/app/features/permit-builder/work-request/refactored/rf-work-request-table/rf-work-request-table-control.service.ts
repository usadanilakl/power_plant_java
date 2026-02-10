import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../../shared/table/refactored/services/table-controls.service";
import { ButtonColor } from "../../../../../shared/menu/buttons/buttons.component";
import { RfWorkRequestStateService } from "../services/rf-work-request-state.service";
import { ExportDialogService } from "../../../../../shared/export-dialog/export-dialog.service";
import { ExcelService } from "../../../../../services/excel.service";

@Injectable()
export class WorkRequestTableControlService extends TableControlsService {
    private stateService = inject(RfWorkRequestStateService);
    private exportDialogService = inject(ExportDialogService);
    private excelService = inject(ExcelService);

    constructor() {
        super();
        this.addTableControlButtons([
          {
            name: 'Export to Excel',
            action: () => {
              this.exportDialogService.open({
                entityType: 'workRequest',
                entityLabel: 'Work Requests',
                searchCriteria: this.stateService.getCurrentSearchCriteria(),
                selectedIds: this.stateService.selectedItems().map(item => item.id),
                exportAllFn: () => this.excelService.exportWorkRequestAll(),
                exportByQueryFn: (criteria) => this.excelService.exportWorkRequestByQuery(criteria),
                exportByIdsFn: (ids) => this.excelService.exportWorkRequestByIds(ids),
              });
            },
            color: 'primary' as ButtonColor,
            icon: 'file_download',
          },
        ]);
    }
}
