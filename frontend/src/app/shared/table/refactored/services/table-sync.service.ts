
import { DestroyRef, inject, Injectable } from '@angular/core';
import { SynchronizationState } from '../models/table.types';
import { TableDataService } from './table-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableUtilService } from './table-util.service';

@Injectable({
  providedIn: 'root',
})
export class TableSyncService {
  private dataService = inject(TableDataService);
  private utilServce = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);

  private syncState: SynchronizationState = {
    headerTable: null,
    bodyTable: null,
    headerContainer: null,
  };

  setupHorizontalScrollSync(): void {
    if (!this.dataService.viewport()) return;

    this.dataService
      .viewport()!
      .scrolledIndexChange.pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.syncHeaderScroll();
        this.checkForLoadMore();
      });

    // Store the handler reference so it can be removed
    const scrollHandler = () => this.syncHeaderScroll();
    const viewportElement =
      this.dataService.viewport()!.elementRef.nativeElement;

    viewportElement.addEventListener('scroll', scrollHandler);

    this.destroyRef.onDestroy(() => {
      viewportElement.removeEventListener('scroll', scrollHandler);
    });
  }

  private syncHeaderScroll(): void {
    if (
      !this.dataService.viewport() ||
      !this.dataService.headerContainer()?.nativeElement
    )
      return;

    const scrollLeft =
      this.dataService.viewport()!.elementRef.nativeElement.scrollLeft;
    this.dataService.headerContainer()!.nativeElement.scrollLeft = scrollLeft;
  }

  private checkForLoadMore(): void {
    if (!this.dataService.viewport()) return;

    const end = this.dataService.viewport()!.getRenderedRange().end;
    const total = this.dataService.filteredItems.length;

    if (end >= total - 5 && total > 0) {
      // Trigger load more when within 5 items of the end
      const searchCriteria = this.utilServce.buildSearchCriteria(
        this.dataService.globalSearchQuery,
        this.dataService.columnFilters()
      );
      this.dataService.loadMoreItems.set({ ...searchCriteria });
    }
  }

  synchronizeColumnWidths(): void {
    if (!this.syncState.headerTable || !this.syncState.bodyTable) return;

    requestAnimationFrame(() => {
      const headerCells =
        this.syncState.headerTable!.querySelectorAll('thead th');
      const allBodyCells =
        this.syncState.bodyTable!.querySelectorAll('tbody td');

      if (headerCells.length === 0 || allBodyCells.length === 0) return;

      // Get widths from header only (source of truth)
      const headerWidths: number[] = [];
      headerCells.forEach((cell) => {
        headerWidths.push((cell as HTMLElement).offsetWidth);
      });

      // Apply header widths to ALL body cells (not just first row)
      allBodyCells.forEach((cell, index) => {
        const columnIndex = index % headerWidths.length;
        const width = headerWidths[columnIndex];

        if (width > 0) {
          (cell as HTMLElement).style.width = width + 'px';
          (cell as HTMLElement).style.minWidth = width + 'px';
          (cell as HTMLElement).style.maxWidth = width + 'px';
        }
      });
    });
  }

  private resetCellWidths(cells: NodeListOf<Element>): void {
    cells.forEach((cell: Element) => {
      const htmlCell = cell as HTMLElement;
      htmlCell.style.width = '';
      htmlCell.style.minWidth = '';
      htmlCell.style.maxWidth = '';
    });
  }

  private getColumnWidths(cells: NodeListOf<Element>): string[] {
    const widths: string[] = [];
    cells.forEach((cell: Element) => {
      const width = Math.max((cell as HTMLElement).offsetWidth, 100);
      widths.push(`${width}px`);
    });
    return widths;
  }

  private applyCellWidths(cells: NodeListOf<Element>, widths: string[]): void {
    cells.forEach((cell: Element, index: number) => {
      const htmlCell = cell as HTMLElement;
      htmlCell.style.width = widths[index];
      htmlCell.style.minWidth = widths[index];
      htmlCell.style.maxWidth = widths[index];
    });
  }
  getRowStyle(item: any): { [key: string]: string } {
    if (this.dataService.highlightedItemIds.has(item.id)) {
      return this.dataService.highlightStyle;
    }
    return {};
  }
}
