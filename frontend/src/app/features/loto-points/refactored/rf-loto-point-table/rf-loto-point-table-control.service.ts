import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { LotoPointClipboardItem } from "../../../../models/loto/loto-point-clipboard.model";
import { ButtonColor } from "../../../../shared/menu/buttons/buttons.component";
import { RfLotoPointStateService } from "../services/rf-loto-point-state.service";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";

@Injectable()
export class LotoPointTableControlService extends TableControlsService  {
    private stateService = inject(RfLotoPointStateService);
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
    }
    override clipboardFormatter(items: LotoPointClipboardItem[]): LotoPointClipboardItem[] {
        return items.map(i=>new LotoPointClipboardItem(i))
    }
}