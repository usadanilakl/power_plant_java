import { Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { LotoPointClipboardItem } from "../../../../models/loto/loto-point-clipboard.model";

@Injectable()
export class LotoPointTableControlService extends TableControlsService  {
    override clipboardFormatter(items: LotoPointClipboardItem[]): LotoPointClipboardItem[] {
        return items.map(i=>new LotoPointClipboardItem(i))
    }
}