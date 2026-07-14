import { Injectable, signal } from '@angular/core';

export interface PrintLabelData {
  line1: string;
  line2: string;
  withQr?: boolean;
  qrData?: string;
}

export interface PrintQueueItem extends PrintLabelData {
  id: number;
  status: 'pending' | 'printing' | 'completed' | 'error';
}

@Injectable({
  providedIn: 'root'
})
export class BradyPrinterModalService {
  isVisible = signal(false);
  labelData = signal<PrintLabelData | null>(null);
  printQueue = signal<PrintQueueItem[]>([]);
  currentIndex = signal(0);
  isAutoMode = signal(false);

  open(): void {
    this.isVisible.set(true);
  }

  openWithData(data: PrintLabelData): void {
    this.labelData.set(data);
    this.printQueue.set([]);
    this.currentIndex.set(0);
    this.isAutoMode.set(false);
    this.isVisible.set(true);
  }

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

  updateQueueItemStatus(id: number, status: PrintQueueItem['status']): void {
    const queue = this.printQueue();
    const updated = queue.map(item =>
      item.id === id ? { ...item, status } : item
    );
    this.printQueue.set(updated);
  }

  nextItem(): void {
    const current = this.currentIndex();
    const queue = this.printQueue();
    if (current < queue.length - 1) {
      this.currentIndex.set(current + 1);
    }
  }

  getCurrentItem(): PrintQueueItem | null {
    const queue = this.printQueue();
    const index = this.currentIndex();
    return queue[index] || null;
  }

  addToQueue(newItems: PrintLabelData[]): void {
    const existing = this.printQueue();
    const nextId = existing.length > 0 ? Math.max(...existing.map(i => i.id)) + 1 : 0;
    const newQueue: PrintQueueItem[] = newItems.map((item, index) => ({
      ...item,
      id: nextId + index,
      status: 'pending' as const,
    }));
    this.printQueue.update(q => [...q, ...newQueue]);
  }

  close(): void {
    this.isVisible.set(false);
    this.labelData.set(null);
    this.printQueue.set([]);
    this.currentIndex.set(0);
    this.isAutoMode.set(false);
  }
}
