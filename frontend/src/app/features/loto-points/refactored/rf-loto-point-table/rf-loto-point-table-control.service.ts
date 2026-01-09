import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { LotoPointClipboardItem } from "../../../../models/loto/loto-point-clipboard.model";
import { ButtonColor } from "../../../../shared/menu/buttons/buttons.component";
import { RfLotoPointStateService } from "../services/rf-loto-point-state.service";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";
import { LotoPointBulkEditService } from "../services/loto-point-bulk-edit.service";
import { BradyPrinterModalService } from "../../../../shared/brady-printer-manager/brady-printer-modal.service";

@Injectable()
export class LotoPointTableControlService extends TableControlsService  {
    private stateService = inject(RfLotoPointStateService);
    private bulkEditService = inject(LotoPointBulkEditService);
    private bradyModalService = inject(BradyPrinterModalService);

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