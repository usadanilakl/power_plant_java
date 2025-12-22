import {
  Component,
  inject,
  input,
  OnInit,
  effect
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

  constructor() {
    // Sync availableItems with allItems input
    effect(() => {
      const selected = this.doubleTableService.currentSelectedItems();

      // Filter out items that are in selected
      const selectedIds = new Set(selected.map((item) => item.id));
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
  }

  ngOnInit(): void {
    // Initialize
    this.doubleTableService.currentSelectedItems.set(this.selectedItems());
  }
}