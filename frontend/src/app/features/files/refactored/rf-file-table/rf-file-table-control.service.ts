import { inject, Injectable } from "@angular/core";
import { TableControlsService } from "../../../../shared/table/refactored/services/table-controls.service";
import { FileClipboardItem } from "../../../../models/file/file-clipboard.model";
import { ButtonColor } from "../../../../shared/menu/buttons/buttons.component";
import { RfFileStateService } from "../services/rf-file-state.service";
import { FileDto } from "../../../../models/file/file.model";
import { ExportDialogService } from "../../../../shared/export-dialog/export-dialog.service";
import { ExcelService } from "../../../../services/excel.service";

@Injectable()
export class FileTableControlService extends TableControlsService {
  private stateService = inject(RfFileStateService);
  private exportDialogService = inject(ExportDialogService);
  private excelService = inject(ExcelService);

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
      {
        name: 'Export to Excel',
        action: () => {
          this.exportDialogService.open({
            entityType: 'file',
            entityLabel: 'Files',
            searchCriteria: this.stateService.getCurrentSearchCriteria(),
            selectedIds: this.stateService.selectedItems().map(item => item.id),
            exportAllFn: () => this.excelService.exportFileAll(),
            exportByQueryFn: (criteria) => this.excelService.exportFileByQuery(criteria),
            exportByIdsFn: (ids) => this.excelService.exportFileByIds(ids),
          });
        },
        color: 'primary' as ButtonColor,
        icon: 'file_download',
      },
    ]);
  }

  override clipboardFormatter(items: FileClipboardItem[]): FileClipboardItem[] {
    return items.map(i => new FileClipboardItem(i));
  }
}
