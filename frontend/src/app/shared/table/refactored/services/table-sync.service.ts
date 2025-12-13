
import { Injectable } from '@angular/core';
import { SynchronizationState } from '../models/table.types';

@Injectable({
  providedIn: 'root'
})
export class TableSyncService {
  private syncState: SynchronizationState = {
    headerTable: null,
    bodyTable: null,
    headerContainer: null
  };

  setSyncElements(
    headerTable: HTMLTableElement | null,
    bodyTable: HTMLTableElement | null,
    headerContainer: HTMLDivElement | null
  ): void {
    this.syncState = { headerTable, bodyTable, headerContainer };
  }

  synchronizeColumnWidths(): void {
    if (!this.syncState.headerTable || !this.syncState.bodyTable) return;

    requestAnimationFrame(() => {
      const headerCells = this.syncState.headerTable!.querySelectorAll('thead tr:first-child th');
      const bodyCells = this.syncState.bodyTable!.querySelectorAll('tbody tr:first-child td');

      if (bodyCells.length === 0) return;

      // Reset widths
      this.resetCellWidths(headerCells);
      this.resetCellWidths(bodyCells);

      // Force reflow
      this.syncState.bodyTable!.offsetHeight;

      // Get natural widths
      const widths = this.getColumnWidths(bodyCells);

      // Apply widths
      this.applyCellWidths(headerCells, widths);
      this.applyCellWidths(bodyCells, widths);
    });
  }

  syncHorizontalScroll(scrollLeft: number): void {
    if (this.syncState.headerContainer) {
      this.syncState.headerContainer.scrollLeft = scrollLeft;
    }
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
}
