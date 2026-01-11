
import { Component, DestroyRef, effect, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { RfToggleMenuComponent } from '../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { RfLotoStandardStateService } from '../services/rf-loto-standard-state.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type GroupingCriteria = 'groups' | 'name' | 'none';

@Component({
  selector: 'app-rf-loto-standard-left-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, RfToggleMenuComponent],
  templateUrl: './rf-loto-standard-left-menu.component.html',
  styleUrl: './rf-loto-standard-left-menu.component.css',
})
export class RfLotoStandardLeftMenuComponent implements OnInit {
  private stateService = inject(RfLotoStandardStateService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  // UI State
  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedGrouping = signal<GroupingCriteria>('none');

  // Store standards data
  private standardsData = signal<any[]>([]);

  // Available grouping options
  groupingOptions: { value: GroupingCriteria; label: string }[] = [
    { value: 'none', label: 'No Grouping' },
    { value: 'groups', label: 'By Groups' },
    { value: 'name', label: 'By Name' },
  ];

  constructor() {
    // Effect to re-organize when grouping criteria changes
    effect(() => {
      const groupBy = this.selectedGrouping();
      const standards = this.standardsData();
      if (standards.length > 0) {
        const items = this.organizeStandards(standards, groupBy);
        this.menuItems.set(items);
      }
    });
  }

  ngOnInit(): void {
    // Subscribe to state service for menu items
    this.stateService.allLoadedLotoStandards$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (standards) => {
          this.standardsData.set(standards);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Failed to load LOTO standards');
          this.isLoading.set(false);
          console.error('Error loading LOTO standards:', err);
        },
      });
  }

  /**
   * Organize standards based on grouping criteria
   */
  private organizeStandards(standards: any[], groupBy: GroupingCriteria): NestedItem[] {
    switch (groupBy) {
      case 'groups':
        return this.groupByGroups(standards);
      case 'name':
        return this.groupByName(standards);
      case 'none':
      default:
        return this.noGrouping(standards);
    }
  }

  /**
   * No grouping - flat list
   */
  private noGrouping(standards: any[]): NestedItem[] {
    return standards.map(
      (standard) =>
        new NestedItemImpl({
          id: standard.id.toString(),
          name: standard.name || `Standard ${standard.id}`,
          objectType: 'LotoStandard',
          color: '#1976d2',
          values: [],
        })
    );
  }

  /**
   * Group standards by their groups field
   */
  private groupByGroups(standards: any[]): NestedItem[] {
    const groupMap = new Map<string, any[]>();
    const ungrouped: any[] = [];

    // Organize standards by groups
    standards.forEach((standard) => {
      if (standard.groups && standard.groups.length > 0) {
        standard.groups.forEach((group: any) => {
          const groupKey = group.name || group.id?.toString() || 'Unknown';
          if (!groupMap.has(groupKey)) {
            groupMap.set(groupKey, []);
          }
          groupMap.get(groupKey)!.push(standard);
        });
      } else {
        ungrouped.push(standard);
      }
    });

    const result: NestedItem[] = [];

    // Add grouped items
    groupMap.forEach((groupStandards, groupName) => {
      const children = groupStandards.map(
        (standard) =>
          new NestedItemImpl({
            id: standard.id.toString(),
            name: standard.name || `Standard ${standard.id}`,
            objectType: 'LotoStandard',
            color: '#1976d2',
            values: [],
          })
      );

      result.push(
        new NestedItemImpl({
          id: `group-${groupName}`,
          name: groupName,
          objectType: 'Group',
          color: '#4CAF50',
          values: children,
        })
      );
    });

    // Add ungrouped items
    if (ungrouped.length > 0) {
      const ungroupedChildren = ungrouped.map(
        (standard) =>
          new NestedItemImpl({
            id: standard.id.toString(),
            name: standard.name || `Standard ${standard.id}`,
            objectType: 'LotoStandard',
            color: '#1976d2',
            values: [],
          })
      );

      result.push(
        new NestedItemImpl({
          id: 'ungrouped',
          name: 'Ungrouped',
          objectType: 'Group',
          color: '#9E9E9E',
          values: ungroupedChildren,
        })
      );
    }

    return result;
  }

  /**
   * Group standards alphabetically by name
   */
  private groupByName(standards: any[]): NestedItem[] {
    const letterMap = new Map<string, any[]>();

    standards.forEach((standard) => {
      const firstLetter = (standard.name || 'Z').charAt(0).toUpperCase();
      if (!letterMap.has(firstLetter)) {
        letterMap.set(firstLetter, []);
      }
      letterMap.get(firstLetter)!.push(standard);
    });

    const result: NestedItem[] = [];
    const sortedLetters = Array.from(letterMap.keys()).sort();

    sortedLetters.forEach((letter) => {
      const letterStandards = letterMap.get(letter)!;
      const children = letterStandards.map(
        (standard) =>
          new NestedItemImpl({
            id: standard.id.toString(),
            name: standard.name || `Standard ${standard.id}`,
            objectType: 'LotoStandard',
            color: '#1976d2',
            values: [],
          })
      );

      result.push(
        new NestedItemImpl({
          id: `letter-${letter}`,
          name: letter,
          objectType: 'Group',
          color: '#2196F3',
          values: children,
        })
      );
    });

    return result;
  }

  /**
   * Load LOTO standards with specified grouping
   */
  loadLotoStandards(groupBy: GroupingCriteria): void {
    this.selectedGrouping.set(groupBy);
    // The effect will automatically reorganize the data
  }

  /**
   * Handle item click - load full LOTO standard from server
   */
  onItemClick(item: NestedItem): void {
    // Only handle leaf nodes (actual LOTO standards, not groups)
    if (item.values && item.values.length > 0) {
      return;
    }

    // If this is a LOTO standard, load its full data
    if (item.objectType === 'LotoStandard') {
      const startTime = performance.now();

      this.stateService.loadItemById(Number(item.id));

      const totalTime = performance.now() - startTime;
      console.log(`LOTO Standard click handling time: ${totalTime}ms`);
    }
  }

  /**
   * Handle item double click - load and open form
   */
  onItemDoubleClick(item: NestedItem): void {
    this.onItemClick(item);

    // Open the form if it's a LOTO standard
    if (item.objectType === 'LotoStandard') {
      this.stateService.openForm();
    }
  }

  /**
   * Handle item right click - show context menu
   */
  onItemRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    // TODO: Implement context menu for LOTO standards
    console.log('Right click on item:', event.item);
  }

  /**
   * Refresh the current view
   */
  refresh(): void {
    this.loadLotoStandards(this.selectedGrouping());
  }

  /**
   * Create new LOTO standard
   */
  createNew(): void {
    // this.stateService.createNew();
    this.stateService.openForm();
  }

  /**
   * Open LOTO Builder page
   */
  openBuilder(): void {
    this.router.navigate(['/loto-builder']);
  }
}
