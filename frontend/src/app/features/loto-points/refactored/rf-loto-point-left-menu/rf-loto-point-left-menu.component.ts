import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { RfLotoPointLeftMenuService, GroupingCriteria } from '../services/rf-loto-point-left-menu.service';
import { RfLotoPointStateService } from '../services/rf-loto-point-state.service';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';

@Component({
  selector: 'app-rf-loto-point-left-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, RfToggleMenuComponent],
  templateUrl: './rf-loto-point-left-menu.component.html',
  styleUrl: './rf-loto-point-left-menu.component.css'
})
export class RfLotoPointLeftMenuComponent implements OnInit {
  private menuService = inject(RfLotoPointLeftMenuService);
  private stateService = inject(RfLotoPointStateService);
  private destroyRef = inject(DestroyRef);

  // UI State
  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedGrouping = signal<GroupingCriteria>('equipmentType');

  // Available grouping options
  groupingOptions: { value: GroupingCriteria; label: string }[] = [
    { value: 'equipmentType', label: 'Equipment Type' },
    { value: 'location', label: 'Location' },
    { value: 'file', label: 'File' },
    { value: 'system', label: 'System' },
    { value: 'unit', label: 'Unit' },
    { value: 'zeroEnergyMethod', label: 'Zero Energy Method' }
  ];

  ngOnInit(): void {
    // Subscribe to menu data updates
    this.menuService.menuData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.menuItems.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading menu data:', error);
          this.error.set(error.message);
          this.isLoading.set(false);
        }
      });

    // Subscribe to loading state
    this.menuService.isLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => {
        this.isLoading.set(loading);
      });

    // Load initial data
    this.loadLotoPoints(this.selectedGrouping());
  }

  /**
   * Load LOTO points grouped by the specified criteria
   */
  loadLotoPoints(groupBy: GroupingCriteria): void {
    this.selectedGrouping.set(groupBy);
    this.isLoading.set(true);
    this.error.set(null);

    this.menuService.loadGroupedLotoPoints(groupBy);
  }

  /**
   * Handle item click - load full LOTO point from server
   */
  onItemClick(item: NestedItem): void {
    // Only handle leaf nodes (actual LOTO points, not groups)
    if (item.values && item.values.length > 0) {
      return;
    }

    // If this is a LOTO point, load its full data
    if (item.objectType === 'LotoPoint') {
      const startTime = performance.now();

      this.stateService.loadItemById(Number(item.id));

      const totalTime = performance.now() - startTime;
      console.log(`LOTO Point click handling time: ${totalTime}ms`);
    }
  }

  /**
   * Handle item double click - load and open form
   */
  onItemDoubleClick(item: NestedItem): void {
    this.onItemClick(item);

    // Open the form if it's a LOTO point
    if (item.objectType === 'LotoPoint') {
      this.stateService.openForm();
    }
  }

  /**
   * Handle item right click - show context menu
   */
  onItemRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    // TODO: Implement context menu for LOTO points
    console.log('Right click on item:', event.item);
  }

  /**
   * Refresh the current grouping
   */
  refresh(): void {
    this.loadLotoPoints(this.selectedGrouping());
  }
}
