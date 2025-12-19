import { computed, inject, Injectable, signal } from "@angular/core";
import { TableStateService } from "./table-state.service";
import { ButtonColor, ButtonConfig } from "../../../menu/buttons/buttons.component";
import { TableSelectionService } from "./table-selection.service";


@Injectable()
export class TableControlsService {
  private tableStateService = inject(TableStateService);
  private selectionService = inject(TableSelectionService);

  // ✅ Use a method instead of signals
  getTableControlButtons(
    inputButtons?: ButtonConfig[],
    defaultEnabled: boolean = true
  ): ButtonConfig[] {
    if (inputButtons && !defaultEnabled) {
      return inputButtons;
    }
    if (!inputButtons && defaultEnabled) {
      return this.getDefaultTableControlButtons();
    }
    if (inputButtons && defaultEnabled) {
      return [...this.getDefaultTableControlButtons(), ...inputButtons];
    }
    return [];
  }

  private getDefaultTableControlButtons(): ButtonConfig[] {
    return [
      {
        name: 'Row-Mode',
        action: () => this.tableStateService.setTableMode('row'),
        color: 'primary' as ButtonColor,
        icon: 'view_agenda',
      },
      {
        name: 'Cell-Mode',
        action: () => this.tableStateService.setTableMode('cell'),
        color: 'warn' as ButtonColor,
        icon: 'grid_on',
      },
      {
        name: 'Add to Clipboard',
        action: () => this.selectionService.addToClipboard(),
        color: 'accent' as ButtonColor,
        icon: 'content_copy',
      },
    ];
  }
}