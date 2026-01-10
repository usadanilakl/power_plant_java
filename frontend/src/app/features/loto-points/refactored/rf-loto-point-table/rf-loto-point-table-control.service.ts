import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { LotoPointClipboardItem } from "../../../../models/loto/loto-point-clipboard.model";
import { ButtonColor } from "../../../../shared/menu/buttons/buttons.component";
import { RfLotoPointStateService } from "../services/rf-loto-point-state.service";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";
import { LotoPointBulkEditService } from "../services/loto-point-bulk-edit.service";
import { BradyPrinterModalService } from "../../../../shared/brady-printer-manager/brady-printer-modal.service";
import { ExportDialogService } from "../../../../shared/export-dialog/export-dialog.service";
import { ExcelService } from "../../../../services/excel.service";

@Injectable()
export class LotoPointTableControlService extends TableControlsService  {
    private stateService = inject(RfLotoPointStateService);
    private bulkEditService = inject(LotoPointBulkEditService);
    private bradyModalService = inject(BradyPrinterModalService);
    private exportDialogService = inject(ExportDialogService);
    private excelService = inject(ExcelService);

    constructor(){
        super();
        this.addTableControlButtons([
          {
            name: 'Add New Loto Point',
            action: () => {
              this.stateService.setSelectedItem(new LotoPointDto());
              this.stateService.openForm();
            },
            color: 'accent' as ButtonColor,
            icon: 'add_box',
            guideId: 'create-loto-point:create-button',
            guideMessage: 'Click this button to create a new LOTO point',
          },
          {
            name: 'Export to Excel',
            action: () => {
              this.exportDialogService.open({
                entityType: 'lotoPoint',
                entityLabel: 'LOTO Points',
                searchCriteria: this.stateService.getCurrentSearchCriteria(),
                selectedIds: this.stateService.selectedItems().map(item => item.id),
                exportAllFn: () => this.excelService.exportLotoPointAll(),
                exportByQueryFn: (criteria) => this.excelService.exportLotoPointByQuery(criteria),
                exportByIdsFn: (ids) => this.excelService.exportLotoPointByIds(ids),
              });
            },
            color: 'primary' as ButtonColor,
            icon: 'file_download',
          },
        ]);

        // Add bulk edit button to selection controls
        this.addTableSelectionControls([
          {
            name: 'Bulk Edit',
            action: () => {
              this.bulkEditService.openBulkEdit();
            },
            color: 'accent' as ButtonColor,
            icon: 'edit_note',
            tooltip: 'Edit multiple LOTO points at once'
          },
          {
            name: 'Print Labels',
            action: () => {
              const selectedItems = this.stateService.selectedItems();
              const printQueue = selectedItems.map(item => ({
                line1: item.tagNumber || '',
                line2: item.description || '',
                withQr: true
              }));
              this.bradyModalService.openWithQueue(printQueue);
            },
            color: 'primary' as ButtonColor,
            icon: 'print',
            tooltip: 'Print labels for selected LOTO points'
          }
        ]);
    }

    override clipboardFormatter(items: LotoPointClipboardItem[]): LotoPointClipboardItem[] {
        return items.map(i=>new LotoPointClipboardItem(i))
    }
}