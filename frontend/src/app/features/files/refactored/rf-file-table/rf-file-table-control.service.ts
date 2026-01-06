import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { FileClipboardItem } from "../../../../models/file/file-clipboard.model";
import { ButtonColor } from "../../../../shared/menu/buttons/buttons.component";
import { RfFileStateService } from "../services/rf-file-state.service";
import { FileDto } from "../../../../models/file/file.model";

@Injectable()
export class FileTableControlService extends TableControlsService {
  private stateService = inject(RfFileStateService);

  constructor() {
    super();
    this.addTableControlButtons([
      {
        name: 'Add New File',
        action: () => {
          this.stateService.setSelectedItem(new FileDto());
          this.stateService.openForm();
        },
        color: 'accent' as ButtonColor,
        icon: 'add_box',
      },
      {
        name: 'Multi-Upload',
        action: () => {
          this.stateService.openMultiUpload();
        },
        color: 'primary' as ButtonColor,
        icon: 'upload_file',
      },
    ]);
  }

  override clipboardFormatter(items: FileClipboardItem[]): FileClipboardItem[] {
    return items.map(i => new FileClipboardItem(i));
  }
}
