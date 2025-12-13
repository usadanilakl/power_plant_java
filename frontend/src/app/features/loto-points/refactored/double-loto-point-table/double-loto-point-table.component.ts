
import {
  Component,
  DestroyRef,
  inject,
  input,
  OnInit,
  output,
  signal,
  effect
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RfLotoPointTableComponent } from '../rf-loto-point-table/rf-loto-point-table.component';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { FilterOutRules } from '../../../../shared/table/refactored/table.component';

@Component({
  selector: 'app-double-loto-point-table',
  standalone: true,
  imports: [CommonModule, RfLotoPointTableComponent],
  templateUrl: './double-loto-point-table.component.html',
  styleUrl: './double-loto-point-table.component.css',
})
export class DoubleLotoPointTableComponent implements OnInit {
  private stateService = inject(RfLotoPointStateService);
  private destroyRef = inject(DestroyRef);

  // Inputs
  selectedItems = input<LotoPointDto[]>([]);
  enableDragDropOnSelected = input<boolean>(true);
  fieldsToDisplay = input<(keyof LotoPointDto)[]>([
    'isVerified',
    'tagNumber',
    'description',
    'specificLocation',
    'isoPos',
    'normPos',
    'zeroEnergyMethod',
  ]);

  // Outputs
  selectedItemsChanged = output<LotoPointDto[]>();
  itemAddedToSelected = output<LotoPointDto>();
  itemRemovedFromSelected = output<LotoPointDto>();
  selectedItemsReordered = output<LotoPointDto[]>();

  // State
  currentSelectedItems = signal<LotoPointDto[]>([]);
  filterOutRules = signal<FilterOutRules>({
    action: 'highlight',
    items: this.selectedItems(),
    style: { 'background-color': 'lightyellow' },
  });

  constructor() {
    // Sync availableItems with allItems input
    effect(() => {
      const selected = this.currentSelectedItems();

      // Filter out items that are in selected
      const selectedIds = new Set(selected.map((item) => item.id));
      this.stateService.filterOutItems.set(selected);
      this.filterOutRules.set({
        action: 'highlight',
        items: selected,
        style: { 'background-color': 'lightyellow' },
      });
    });

    // Sync currentSelectedItems with selectedItems input
    effect(() => {
      this.currentSelectedItems.set(this.selectedItems());
    });
  }

  ngOnInit(): void {
    // Initialize
    this.currentSelectedItems.set(this.selectedItems());
  }

  /**
   * Handle double click on available items table
   */
  onAvailableItemDoubleClick(item: LotoPointDto): void {
    this.addItemToSelected(item);
  }

  /**
   * Handle double click on selected items table
   */
  onSelectedItemDoubleClick(item: LotoPointDto): void {
    this.removeItemFromSelected(item);
  }

  /**
   * Add item to selected items
   */
  private addItemToSelected(item: LotoPointDto): void {
    const selected = this.currentSelectedItems();

    // Check if item already exists
    if (selected.some((s) => s.id === item.id)) {
      return;
    }

    const updated = [...selected, item];
    this.currentSelectedItems.set(updated);
    this.itemAddedToSelected.emit(item);
    this.selectedItemsChanged.emit(updated);
  }

  /**
   * Remove item from selected items
   */
  private removeItemFromSelected(item: LotoPointDto): void {
    const selected = this.currentSelectedItems();
    const updated = selected.filter((s) => s.id !== item.id);

    this.currentSelectedItems.set(updated);
    this.itemRemovedFromSelected.emit(item);
    this.selectedItemsChanged.emit(updated);
  }

  /**
   * Handle reordering of selected items
   */
  onSelectedItemsReordered(items: LotoPointDto[]): void {
    this.currentSelectedItems.set(items);
    this.selectedItemsReordered.emit(items);
    this.selectedItemsChanged.emit(items);
  }
}
