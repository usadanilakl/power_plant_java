import { computed, inject, Injectable, signal } from '@angular/core';
import { TableStateService } from './table-state.service';
import {
  ButtonColor,
  ButtonConfig,
} from '../../../menu/buttons/buttons.component';
import { TableSelectionService } from './table-selection.service';
import { TableDataService } from './table-data.service';

@Injectable()
export class TableControlsService {
  protected tableStateService = inject(TableStateService);
  protected selectionService = inject(TableSelectionService);
  protected dataService = inject(TableDataService);

  // ✅ Allow parent services to override with custom buttons
  customTableControlButtons = signal<ButtonConfig[] | undefined>(undefined);
  customTableSelectionControls = signal<ButtonConfig[] | undefined>(undefined);

  // ✅ Use computed signal with fallback to default buttons
  tableControlButtons = computed<ButtonConfig[]>(() => {
    const customButtons = this.customTableControlButtons();

    // If custom buttons are provided, use them
    if (customButtons) {
      return customButtons;
    }

    // Otherwise, use default buttons
    return this.getDefaultTableControlButtons();
  });

  tableSelectionControls = computed<ButtonConfig[]>(() => {
    const customButtons = this.customTableSelectionControls();

    // If custom buttons are provided, use them
    if (customButtons) {
      return customButtons;
    }

    // Otherwise, use default buttons
    return this.getDefaultTableSelectionControls();
  });

  /**
   * Default table control buttons
   */
  protected getDefaultTableControlButtons(): ButtonConfig[] {
    const currentMode = this.tableStateService.tableMode();

    return [
      {
        name: currentMode === 'row' ? 'Cell-Mode' : 'Row-Mode',
        action: () =>
          this.tableStateService.setTableMode(
            currentMode === 'row' ? 'cell' : 'row'
          ),
        color: currentMode === 'row' ? 'warn' : ('primary' as ButtonColor),
        icon: currentMode === 'row' ? 'grid_on' : 'view_agenda',
      },
    ];
  }

  /**
   * Default table selection controls
   */
  protected getDefaultTableSelectionControls(): ButtonConfig[] {
    return [
      {
        name: 'Clear Selection',
        action: () => this.selectionService.clearSelection(),
        color: 'accent' as ButtonColor,
        icon: 'clear_all',
      },
      {
        name: 'Add to Clipboard',
        action: () => this.selectionService.addToClipboard(),
        color: 'accent' as ButtonColor,
        icon: 'content_copy',
      },
    ];
  }

  /**
   * Allow parent services to set custom control buttons (fully override)
   */
  setCustomTableControlButtons(buttons: ButtonConfig[]): void {
    this.customTableControlButtons.set(buttons);
  }

  /**
   * Allow parent services to set custom selection controls (fully override)
   */
  setCustomTableSelectionControls(buttons: ButtonConfig[]): void {
    this.customTableSelectionControls.set(buttons);
  }

  /**
   * Allow parent services to combine custom buttons with defaults
   */
  addTableControlButtons(buttons: ButtonConfig[]): void {
    const current =
      this.customTableControlButtons() ?? this.getDefaultTableControlButtons();
    this.customTableControlButtons.set([...current, ...buttons]);
  }

  /**
   * Allow parent services to combine custom selection controls with defaults
   */
  addTableSelectionControls(buttons: ButtonConfig[]): void {
    const current =
      this.customTableSelectionControls() ??
      this.getDefaultTableSelectionControls();
    this.customTableSelectionControls.set([...current, ...buttons]);
  }

  /**
   * Reset to default buttons
   */
  resetTableControlButtons(): void {
    this.customTableControlButtons.set(undefined);
  }

  /**
   * Reset to default selection controls
   */
  resetTableSelectionControls(): void {
    this.customTableSelectionControls.set(undefined);
  }
}
