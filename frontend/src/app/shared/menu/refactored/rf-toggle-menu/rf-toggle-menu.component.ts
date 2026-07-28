import { Component, computed, DestroyRef, inject, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NestedItem } from '../../../../models/ui/nested-item.model';
import { ToggleListVirtualScrollComponent } from '../../../list/toggle-list-virtual-scroll/toggle-list-virtual-scroll.component';

type SearchMode = 'AND' | 'OR';

@Component({
  selector: 'app-rf-toggle-menu',
  standalone: true,
  imports: [CommonModule, FormsModule, ToggleListVirtualScrollComponent],
  templateUrl: './rf-toggle-menu.component.html',
  styleUrl: './rf-toggle-menu.component.css'
})
export class RfToggleMenuComponent {
  private destroyRef = inject(DestroyRef);

  // Inputs
  menuItems = input<NestedItem[]>([]);
  enableSearch = input<boolean>(true);
  searchPlaceholder = input<string>('Search...');
  /** Opt-in picker interaction: caret expands, row body selects (see ToggleListVirtualScrollComponent). */
  caretToggleOnly = input<boolean>(false);

  // Outputs
  itemClick = output<NestedItem>();
  itemDblClick = output<NestedItem>();
  itemRightClick = output<{ event: MouseEvent; item: NestedItem }>();
  itemMiddleClick = output<NestedItem>();

  // Search state
  searchQuery = signal<string>('');
  searchMode = signal<SearchMode>('AND');

  // Computed filtered items based on search
  filteredItems = computed(() => {
    const query = this.searchQuery().trim();
    const items = this.menuItems();

    if (!query) {
      return items;
    }

    const mode = this.searchMode();
    const searchTerms = query.toLowerCase().split(/\s+/).filter(term => term.length > 0);

    return this.filterItems(items, searchTerms, mode);
  });

  // Check if any items match the search
  hasResults = computed(() => this.filteredItems().length > 0);

  /**
   * Recursively filter items based on search terms and mode
   */
  private filterItems(items: NestedItem[], searchTerms: string[], mode: SearchMode): NestedItem[] {
    return items
      .map(item => this.filterSingleItem(item, searchTerms, mode))
      .filter((item): item is NestedItem => item !== null);
  }

  /**
   * Filter a single item and its children
   */
  private filterSingleItem(item: NestedItem, searchTerms: string[], mode: SearchMode): NestedItem | null {
    const itemText = (item.name + (item.subtitle ? ' ' + item.subtitle : '')).toLowerCase();
    const matchesSearch = this.itemMatchesSearch(itemText, searchTerms, mode);

    // Recursively filter children
    const filteredChildren = item.values
      ? this.filterItems(item.values, searchTerms, mode)
      : [];

    // Include item if it matches or if any children match
    if (matchesSearch || filteredChildren.length > 0) {
      return {
        ...item,
        values: filteredChildren.length > 0 ? filteredChildren : item.values,
        isExpanded: filteredChildren.length > 0 ? true : item.isExpanded // Auto-expand if children match
      };
    }

    return null;
  }

  /**
   * Check if item text matches search terms based on mode
   */
  private itemMatchesSearch(itemText: string, searchTerms: string[], mode: SearchMode): boolean {
    if (mode === 'AND') {
      // All terms must be present
      return searchTerms.every(term => itemText.includes(term));
    } else {
      // Any term must be present
      return searchTerms.some(term => itemText.includes(term));
    }
  }

  /**
   * Toggle between AND/OR search mode
   */
  toggleSearchMode(): void {
    this.searchMode.update(mode => mode === 'AND' ? 'OR' : 'AND');
  }

  /**
   * Clear the search query
   */
  clearSearch(): void {
    this.searchQuery.set('');
  }

  /**
   * Handle search input change
   */
  onSearchChange(value: string): void {
    this.searchQuery.set(value);
  }

  // Event handlers
  onItemClick(item: NestedItem): void {
    this.itemClick.emit(item);
  }

  onItemDoubleClicked(item: NestedItem): void {
    this.itemDblClick.emit(item);
  }

  onItemRightClicked(event: { event: MouseEvent; item: NestedItem }): void {
    this.itemRightClick.emit(event);
  }

  onItemMiddleClicked(item: NestedItem): void {
    this.itemMiddleClick.emit(item);
  }
}
