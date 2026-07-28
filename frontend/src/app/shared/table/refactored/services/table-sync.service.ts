
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
        // Vertical virtualization: rows that were off-screen are freshly
        // mounted without our transform → re-apply on every virtual scroll
        // change so sticky cells stay pinned after a scroll-in.
        this.applyStickyBodyOffsets();
        this.checkForLoadMore();
      });

    // Body viewport scroll → move the header AND re-apply sticky-cell
    // offsets. position:sticky on body <td>s is a no-op here because
    // cdk-virtual-scroll injects a .cdk-virtual-scroll-content-wrapper
    // with `transform: translateY(...)` as an ancestor, which becomes
    // the containing block for sticky and pins the cell to the wrapper
    // (not the viewport) — so sticky-left/right cells scroll with the
    // row instead of pinning to the viewport edge. We compensate with a
    // translateX derived from viewport.scrollLeft. Header <th>s are
    // outside the CDK viewport, so their native sticky still works.
    const viewportElement =
      this.dataService.viewport()!.elementRef.nativeElement;
    const scrollHandler = () => {
      this.syncHeaderScroll();
      this.applyStickyBodyOffsets();
    };
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
        this.applyStickyBodyOffsets();
      };
      headerElement.addEventListener('scroll', headerScrollHandler);
      this.headerScrollEl = headerElement;
      this.headerScrollHandler = headerScrollHandler;
    }

    this.destroyRef.onDestroy(() => this.teardownScrollSync());
  }

  /**
   * Manually pin body sticky-left/right cells to the viewport edges via
   * position:relative + inline `left` offset. Required because cdk-
   * virtual-scroll-viewport's transformed .cdk-virtual-scroll-content-
   * wrapper breaks native position:sticky on <td> (spec: sticky pins to
   * the containing block, and a transformed ancestor becomes the
   * containing block — but that ancestor doesn't scroll horizontally
   * relative to the viewport, so sticky effectively resolves to
   * static-in-flow and the cell scrolls with the row).
   * <p>
   * Sticky-left cell natural position is at row's left edge. With
   * position:relative + left:scrollLeft it shifts right to viewport's
   * left edge. Sticky-right cell natural position is at row's right
   * edge; left:(scrollLeft - overflow) shifts it left to viewport's
   * right edge (overflow = tableWidth - viewportWidth = the amount by
   * which the row extends beyond the visible viewport).
   * <p>
   * Called on every scroll (header or body sync) and after every
   * vertical virtual-scroll change (new rows arrive with no inline left
   * and would flash at their natural position for one frame otherwise).
   */
  applyStickyBodyOffsets(): void {
    const viewport = this.dataService.viewport()?.elementRef.nativeElement;
    const bodyTable = this.dataService.bodyTable()?.nativeElement;
    if (!viewport || !bodyTable) return;
    const scrollLeft = viewport.scrollLeft;
    const overflow = Math.max(0, bodyTable.offsetWidth - viewport.clientWidth);
    const leftPx = scrollLeft + 'px';
    const rightPx = (scrollLeft - overflow) + 'px';
    const leftCells = bodyTable.querySelectorAll<HTMLElement>('.table-cell.sticky-left');
    const rightCells = bodyTable.querySelectorAll<HTMLElement>('.table-cell.sticky-right');
    for (let i = 0; i < leftCells.length; i++) leftCells[i].style.left = leftPx;
    for (let i = 0; i < rightCells.length; i++) rightCells[i].style.left = rightPx;
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
      // Column widths just changed → the row's total width and the
      // sticky-right anchor shift with it.
      this.applyStickyBodyOffsets();
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
      // Viewport width just changed → overflow amount changed → the
      // sticky-right pin target shifted.
      this.applyStickyBodyOffsets();
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
