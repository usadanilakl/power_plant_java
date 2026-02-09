import { Injectable, signal, computed } from '@angular/core';
import { LotoPointDto } from '../../models/loto/loto-point.model';

export interface EngraverBatchItem {
  batchNumber: number;
  items: LotoPointDto[];
  status: 'pending' | 'processing' | 'completed' | 'error';
  errorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EngraverModalService {
  // Core state signals
  isVisible = signal(false);
  allItems = signal<LotoPointDto[]>([]);
  currentBatchIndex = signal(0);
  batches = signal<EngraverBatchItem[]>([]);
  isProcessing = signal(false);
  withQr = signal(false);

  // Template and batch size
  availableTemplates = signal<string[]>([]);
  selectedTemplate = signal<string>('');
  batchSize = signal(4);

  // Computed signals
  totalBatches = computed(() => this.batches().length);

  currentBatch = computed(() => {
    const batchList = this.batches();
    const index = this.currentBatchIndex();
    return batchList[index] || null;
  });

  completedBatches = computed(() =>
    this.batches().filter(b => b.status === 'completed').length
  );

  totalItems = computed(() => this.allItems().length);

  hasNextBatch = computed(() =>
    this.currentBatchIndex() < this.totalBatches() - 1
  );

  hasPreviousBatch = computed(() =>
    this.currentBatchIndex() > 0
  );

  allBatchesCompleted = computed(() =>
    this.batches().every(b => b.status === 'completed')
  );

  /**
   * Opens the modal with a list of LOTO points.
   * Splits them into batches based on current batchSize.
   */
  openWithItems(items: LotoPointDto[]): void {
    this.allItems.set(items);
    this.batches.set(this.createBatches(items));
    this.currentBatchIndex.set(0);
    this.isProcessing.set(false);
    this.isVisible.set(true);
  }

  /**
   * Creates batches from the items using current batch size.
   */
  private createBatches(items: LotoPointDto[]): EngraverBatchItem[] {
    const size = this.batchSize();
    const batches: EngraverBatchItem[] = [];
    for (let i = 0; i < items.length; i += size) {
      batches.push({
        batchNumber: Math.floor(i / size) + 1,
        items: items.slice(i, i + size),
        status: 'pending'
      });
    }
    return batches;
  }

  /**
   * Re-splits batches when batch size changes.
   */
  updateBatchSize(size: number): void {
    this.batchSize.set(size);
    if (this.allItems().length > 0) {
      this.batches.set(this.createBatches(this.allItems()));
      this.currentBatchIndex.set(0);
    }
  }

  /**
   * Sets the selected template.
   */
  setTemplate(template: string): void {
    this.selectedTemplate.set(template);
  }

  /**
   * Updates the status of a batch.
   */
  updateBatchStatus(batchIndex: number, status: EngraverBatchItem['status'], errorMessage?: string): void {
    const batchList = this.batches();
    if (batchIndex >= 0 && batchIndex < batchList.length) {
      const updated = [...batchList];
      updated[batchIndex] = {
        ...updated[batchIndex],
        status,
        errorMessage
      };
      this.batches.set(updated);
    }
  }

  /**
   * Marks current batch as processing.
   */
  startProcessingCurrentBatch(): void {
    this.isProcessing.set(true);
    this.updateBatchStatus(this.currentBatchIndex(), 'processing');
  }

  /**
   * Marks current batch as completed and moves to next.
   */
  completeCurrentBatch(): void {
    this.updateBatchStatus(this.currentBatchIndex(), 'completed');
    this.isProcessing.set(false);
  }

  /**
   * Marks current batch as error.
   */
  errorCurrentBatch(errorMessage: string): void {
    this.updateBatchStatus(this.currentBatchIndex(), 'error', errorMessage);
    this.isProcessing.set(false);
  }

  /**
   * Moves to the next batch.
   */
  nextBatch(): void {
    if (this.hasNextBatch()) {
      this.currentBatchIndex.set(this.currentBatchIndex() + 1);
    }
  }

  /**
   * Moves to the previous batch.
   */
  previousBatch(): void {
    if (this.hasPreviousBatch()) {
      this.currentBatchIndex.set(this.currentBatchIndex() - 1);
    }
  }

  /**
   * Selects a specific batch by index.
   */
  selectBatch(index: number): void {
    if (index >= 0 && index < this.totalBatches()) {
      this.currentBatchIndex.set(index);
    }
  }

  /**
   * Gets the IDs of items in the current batch.
   */
  getCurrentBatchIds(): number[] {
    const batch = this.currentBatch();
    if (!batch) return [];
    return batch.items.map(item => item.id).filter((id): id is number => id !== undefined);
  }

  /**
   * Removes an item from processing. Re-splits remaining items into batches.
   */
  removeItem(itemId: number): void {
    const remaining = this.allItems().filter(item => item.id !== itemId);
    if (remaining.length === 0) {
      this.close();
      return;
    }
    this.allItems.set(remaining);
    this.batches.set(this.createBatches(remaining));
    const idx = this.currentBatchIndex();
    if (idx >= this.batches().length) {
      this.currentBatchIndex.set(Math.max(0, this.batches().length - 1));
    }
  }

  /**
   * Toggles QR code setting.
   */
  toggleQr(): void {
    this.withQr.set(!this.withQr());
  }

  /**
   * Closes the modal and resets state.
   */
  close(): void {
    this.isVisible.set(false);
    this.allItems.set([]);
    this.batches.set([]);
    this.currentBatchIndex.set(0);
    this.isProcessing.set(false);
    this.withQr.set(false);
    this.batchSize.set(4);
  }
}
