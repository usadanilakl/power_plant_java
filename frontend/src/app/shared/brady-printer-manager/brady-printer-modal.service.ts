import { Injectable, signal } from '@angular/core';
import { LotoPointDto } from '../../models/loto/loto-point.model';

export interface PrintLabelData {
  line1: string;
  line2: string;
  withQr?: boolean;
  sourceLotoPointId?: number;
  sourceLotoPoint?: LotoPointDto;
}

export interface PrintQueueItem extends PrintLabelData {
  id: number;
  status: 'pending' | 'printing' | 'completed' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class BradyPrinterModalService {
  // Signal to control the visibility of the printer manager component
  isVisible = signal(false);

  // Signal to hold pre-populated label data (single item mode)
  labelData = signal<PrintLabelData | null>(null);

  // Signal to hold print queue (multi-item mode)
  printQueue = signal<PrintQueueItem[]>([]);

  // Current item index being printed/displayed
  currentIndex = signal(0);

  // Auto-print mode
  isAutoMode = signal(false);

  open(): void {
    this.isVisible.set(true);
  }

  /**
   * Opens the printer modal with pre-populated label data (single item).
   * Use this when printing from context menus or other sources.
   */
  openWithData(data: PrintLabelData): void {
    this.labelData.set(data);
    this.printQueue.set([]);
    this.currentIndex.set(0);
    this.isAutoMode.set(false);
    this.isVisible.set(true);
  }

  /**
   * Opens the printer modal with a queue of items to print.
   * Use this for bulk printing from table selection.
   */
  openWithQueue(items: PrintLabelData[]): void {
    const queue: PrintQueueItem[] = items.map((item, index) => ({
      ...item,
      id: index,
      status: 'pending' as const
    }));
    this.printQueue.set(queue);
    this.labelData.set(null);
    this.currentIndex.set(0);
    this.isAutoMode.set(false);
    this.isVisible.set(true);
  }

  /**
   * Updates the status of a queue item.
   */
  updateQueueItemStatus(id: number, status: PrintQueueItem['status']): void {
    const queue = this.printQueue();
    const updated = queue.map(item =>
      item.id === id ? { ...item, status } : item
    );
    this.printQueue.set(updated);
  }

  /**
   * Moves to the next item in the queue.
   */
  nextItem(): void {
    const current = this.currentIndex();
    const queue = this.printQueue();
    if (current < queue.length - 1) {
      this.currentIndex.set(current + 1);
    }
  }

  /**
   * Gets the current queue item.
   */
  getCurrentItem(): PrintQueueItem | null {
    const queue = this.printQueue();
    const index = this.currentIndex();
    return queue[index] || null;
  }

  close(): void {
    this.isVisible.set(false);
    this.labelData.set(null);
    this.printQueue.set([]);
    this.currentIndex.set(0);
    this.isAutoMode.set(false);
  }
}
