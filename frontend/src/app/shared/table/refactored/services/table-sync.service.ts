
import { DestroyRef, inject, Injectable, PLATFORM_ID } from '@angular/core';
import { SynchronizationState } from '../models/table.types';
import { TableDataService } from './table-data.service';
import { Subscription } from 'rxjs';
import { TableUtilService } from './table-util.service';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class TableSyncService {
  private dataService = inject(TableDataService);
  private utilServce = inject(TableUtilService);
  private destroyRef = inject(DestroyRef);
  private platformId = inject(PLATFORM_ID);

  private resizeObserver?: ResizeObserver;

  // Tracked so horizontal-scroll-sync setup can be torn down and re-run cleanly
  // when the table is re-mounted on a long-lived service instance.
  private scrolledIndexSub?: Subscription;
  private viewportScrollEl?: HTMLElement;
  private viewportScrollHandler?: () => void;
  private headerScrollEl?: HTMLElement;
  private headerScrollHandler?: () => void;

  private syncState: SynchronizationState = {
    headerTable: null,
    bodyTable: null,
    headerContainer: null,
  };

  /** Prevents the header↔body scroll handlers from echoing each other into a loop. */
  private isSyncingScroll = false;

  setupHorizontalScrollSync(): void {
    if (!this.dataService.viewport()) return;

    // Idempotent: a re-mounted table calls this again on the same instance.
    // Clear the previous subscription/listeners before wiring new ones so they
    // don't accumulate (and keep firing against detached DOM) on every reopen.
    this.teardownScrollSync();

    this.scrolledIndexSub = this.dataService
      .viewport()!
      .scrolledIndexChange.subscribe(() => {
        this.syncHeaderScroll();
        this.checkForLoadMore();
      });

    // Body viewport scroll → move the header.
    const viewportElement =
      this.dataService.viewport()!.elementRef.nativeElement;
    const scrollHandler = () => this.syncHeaderScroll();
    viewportElement.addEventListener('scroll', scrollHandler);
    this.viewportScrollEl = viewportElement;
    this.viewportScrollHandler = scrollHandler;

    // Header is the visible horizontal scrollbar (the body's is hidden), so the
    // user can scroll columns even when there are no rows. Sync header → body.
    const headerElement = this.dataService.headerContainer()?.nativeElement;
    if (headerElement) {
      const headerScrollHandler = () => {
        if (this.isSyncingScroll) return;
        const vp = this.dataService.viewport()?.elementRef.nativeElement;
        if (!vp) return;
        this.isSyncingScroll = true;
        vp.scrollLeft = headerElement.scrollLeft;
        this.isSyncingScroll = false;
      };
      headerElement.addEventListener('scroll', headerScrollHandler);
      this.headerScrollEl = headerElement;
      this.headerScrollHandler = headerScrollHandler;
    }

    this.destroyRef.onDestroy(() => this.teardownScrollSync());
  }

  private teardownScrollSync(): void {
    this.scrolledIndexSub?.unsubscribe();
    this.scrolledIndexSub = undefined;
    if (this.viewportScrollEl && this.viewportScrollHandler) {
      this.viewportScrollEl.removeEventListener('scroll', this.viewportScrollHandler);
    }
    this.viewportScrollEl = undefined;
    this.viewportScrollHandler = undefined;
    if (this.headerScrollEl && this.headerScrollHandler) {
      this.headerScrollEl.removeEventListener('scroll', this.headerScrollHandler);
    }
    this.headerScrollEl = undefined;
    this.headerScrollHandler = undefined;
  }

  private syncHeaderScroll(): void {
    if (
      this.isSyncingScroll ||
      !this.dataService.viewport() ||
      !this.dataService.headerContainer()?.nativeElement
    )
      return;

    const scrollLeft =
      this.dataService.viewport()!.elementRef.nativeElement.scrollLeft;
    this.isSyncingScroll = true;
    this.dataService.headerContainer()!.nativeElement.scrollLeft = scrollLeft;
    this.isSyncingScroll = false;
  }

  private checkForLoadMore(): void {
    if (!this.dataService.viewport()) return;

    const end = this.dataService.viewport()!.getRenderedRange().end;
    const total = this.dataService.filteredItems().length;

    // Trigger load more when within 5 items of the end
    if (total === 0 || end < total - 5) return;

    // Ask at most once per list length. scrolledIndexChange also fires on
    // re-render / resize / column-width sync, and on a list shorter than the
    // viewport the test above never stops being true — so re-asking here
    // refetches the same page in a loop (and, on tables whose state service
    // appends without de-duplicating, grows the list on every pass).
    if (total === this.dataService.lastLoadMoreLength) return;
    this.dataService.lastLoadMoreLength = total;

    const searchCriteria = this.utilServce.buildSearchCriteria(
      this.dataService.globalSearchQuery,
      this.dataService.columnFilters(),
      this.dataService.columnFilterLogic
    );
    this.dataService.loadMoreItems.set({ ...searchCriteria });
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
      this.utilServce.updateItemIndices(this.dataService.filteredItems());
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
    // Idempotent: drop any observer from a previous table mount on this (possibly
    // longer-lived) service instance, so reopens don't stack ResizeObservers.
    this.resizeObserver?.disconnect();
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
