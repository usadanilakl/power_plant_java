import { computed, inject, Injectable, signal } from '@angular/core';
import { TableStateService } from './table-state.service';
import {
  ButtonColor,
  ButtonConfig,
} from '../../../menu/buttons/buttons.component';
import { TableSelectionService } from './table-selection.service';
import { TableDataService } from './table-data.service';
import { ClipboardService } from '../../../clipboard/clipboard.service';

@Injectable()
export class TableControlsService {
  protected tableStateService = inject(TableStateService);
  protected selectionService = inject(TableSelectionService);
  protected dataService = inject(TableDataService);
  private clipboardService = inject(ClipboardService);

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
    return [
      {
        name: computed(() => this.tableStateService.tableMode() === 'row' ? 'Cell-Mode' : 'Row-Mode'),
        action: () =>
          this.tableStateService.setTableMode(
            this.tableStateService.tableMode() === 'row' ? 'cell' : 'row'
          ),
        color: computed(() => this.tableStateService.tableMode() === 'row' ? 'warn' : ('primary' as ButtonColor)),
        icon: computed(() => this.tableStateService.tableMode() === 'row' ? 'grid_on' : 'view_agenda'),
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
        action: () => {
          this.addToClipboard();
          this.showFeedbackButton('check_circle', 1500);
        },
        color: 'accent' as ButtonColor,
        icon: computed(() => this.feedbackIcon() ?? 'content_copy'),
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

  //======================Clipboard============================
  itemsToPutInClipboard = computed(() =>
    this.clipboardFormatter(this.dataService.selectedItems())
  );
  clipboardFormatter(items: any[]): any[] {
    return items;
  }

  /**
   * Add items to specific section
   */
  addToClipboard(): void {
    if (
      !this.itemsToPutInClipboard() ||
      this.itemsToPutInClipboard().length === 0
    )
      return;
    const objectType = this.itemsToPutInClipboard()[0].objectType ?? 'Other';
    const items = this.itemsToPutInClipboard();
    items.forEach((item) => {
      if (!item.objectType) {
        item.objectType = objectType;
      }
    });
    this.clipboardService.addItems(this.itemsToPutInClipboard());
  }

  //=================Button Feedback======================

  private feedbackIcon = signal<string | null>(null);
  private feedbackTimeout: any;

  /**
   * Show feedback icon temporarily on button
   */
  private showFeedbackButton(icon: string, duration: number): void {
    this.feedbackIcon.set(icon);

    if (this.feedbackTimeout) {
      clearTimeout(this.feedbackTimeout);
    }

    this.feedbackTimeout = setTimeout(() => {
      this.feedbackIcon.set(null);
    }, duration);
  }
}
