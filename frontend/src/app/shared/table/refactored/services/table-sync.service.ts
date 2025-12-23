
import { DestroyRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { SynchronizationState } from '../models/table.types';
import { TableDataService } from './table-data.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableUtilService } from './table-util.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class TableSyncService {
  private dataService = inject(TableDataService);
  private utilServce = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private resizeObserver?: ResizeObserver;

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
        this.dataService.columnFilters(),
        this.dataService.columnFilterLogic
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
  initializeTable(): void {
    setTimeout(() => {
      this.detectRowHeight();
      this.calculateInitialColumnWidths();
      this.synchronizeColumnWidths();
      this.utilServce.updateItemIndices(this.dataService.filteredItems);
    });
  }

  private detectRowHeight(): void {
    if (
      this.dataService.tableBody() &&
      this.dataService.tableBody()!.nativeElement
    ) {
      const sampleRow = this.dataService
        .tableBody()!
        .nativeElement.querySelector('tr');
      if (sampleRow) {
        this.dataService.rowHeight = sampleRow.offsetHeight;
        if (this.dataService.viewport()) {
          this.dataService.viewport()!.checkViewportSize();
        }
      }
    }
  }

  private calculateInitialColumnWidths(): void {
    if (!this.dataService.columns() || this.dataService.columns().length === 0)
      return;

    this.dataService.columns().forEach((column) => {
      if (!column.width || column.width === 0) {
        // Estimate width: ~8px per character + padding
        const estimatedWidth = Math.max(
          120, // minimum width
          (column.header?.length || 10) * 8 + 24
        );
        column.width = estimatedWidth;
      }
    });
  }
  setupResizeObserver(): void {
    if (!isPlatformBrowser(this.platformId)) return;
    this.resizeObserver = new ResizeObserver(() => {
      if (this.dataService.viewport()) {
        this.dataService.viewport()!.checkViewportSize();
      }
      this.synchronizeColumnWidths();
    });

    if (this.dataService.viewport()!.elementRef.nativeElement) {
      this.resizeObserver.observe(
        this.dataService.viewport()!.elementRef.nativeElement
      );
    }

    this.destroyRef.onDestroy(() => {
      this.resizeObserver?.disconnect();
    });
  }
}
