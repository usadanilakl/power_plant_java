import {
  Component,
  inject,
  input,
  OnInit,
  effect,
  output
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { SourceLotoPointTableComponent } from "./source-loto-point-table/source-loto-point-table.component";
import { DestinationLotoPointTableComponent } from "./destination-loto-point-table/destination-loto-point-table.component";
import { DoubleLotoPointTableService } from './double-loto-point-table.service';

@Component({
  selector: 'app-double-loto-point-table',
  standalone: true,
  imports: [CommonModule, SourceLotoPointTableComponent, DestinationLotoPointTableComponent],
  templateUrl: './double-loto-point-table.component.html',
  styleUrl: './double-loto-point-table.component.css',
})
export class DoubleLotoPointTableComponent implements OnInit {
  protected stateService = inject(RfLotoPointStateService);
  private doubleTableService = inject(DoubleLotoPointTableService)

  // Inputs
  selectedItems = input<LotoPointDto[]>([]);

  // Output signals for parent components to react to changes
  itemAdded = output<LotoPointDto>();
  itemRemoved = output<LotoPointDto>();
  itemsReordered = output<LotoPointDto[]>();

  constructor() {
    // Sync availableItems with allItems input
    effect(() => {
      const selected = this.doubleTableService.currentSelectedItems();

      // Filter out items that are in selected
      this.stateService.filterOutItems.set(selected);
      this.doubleTableService.filterOutRules.set({
        action: 'highlight',
        items: selected,
        style: { 'background-color': 'lightyellow' },
      });
    });

    // Sync currentSelectedItems with selectedItems input
    effect(() => {
      this.doubleTableService.currentSelectedItems.set(this.selectedItems());
    });

    // Listen for item added and emit output
    effect(() => {
      const addedItem = this.doubleTableService.lastAddedItem();
      if (addedItem) {
        this.itemAdded.emit(addedItem);
        this.doubleTableService.lastAddedItem.set(null);
      }
    });

    // Listen for item removed and emit output
    effect(() => {
      const removedItem = this.doubleTableService.lastRemovedItem();
      if (removedItem) {
        this.itemRemoved.emit(removedItem);
        this.doubleTableService.lastRemovedItem.set(null);
      }
    });

    // Listen for items reordered and emit output
    effect(() => {
      const reorderedItems = this.doubleTableService.lastReorderedItems();
      if (reorderedItems) {
        this.itemsReordered.emit(reorderedItems);
        this.doubleTableService.lastReorderedItems.set(null);
      }
    });
  }

  ngOnInit(): void {
    // Initialize
    this.doubleTableService.currentSelectedItems.set(this.selectedItems());
  }
}