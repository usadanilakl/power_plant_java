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
  static readonly BATCH_SIZE = 4;

  // Core state signals
  isVisible = signal(false);
  allItems = signal<LotoPointDto[]>([]);
  currentBatchIndex = signal(0);
  batches = signal<EngraverBatchItem[]>([]);
  isProcessing = signal(false);

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
   * Automatically splits them into batches of 4.
   */
  openWithItems(items: LotoPointDto[]): void {
    this.allItems.set(items);
    this.batches.set(this.createBatches(items));
    this.currentBatchIndex.set(0);
    this.isProcessing.set(false);
    this.isVisible.set(true);
  }

  /**
   * Creates batches from the items.
   */
  private createBatches(items: LotoPointDto[]): EngraverBatchItem[] {
    const batches: EngraverBatchItem[] = [];
    for (let i = 0; i < items.length; i += EngraverModalService.BATCH_SIZE) {
      batches.push({
        batchNumber: Math.floor(i / EngraverModalService.BATCH_SIZE) + 1,
        items: items.slice(i, i + EngraverModalService.BATCH_SIZE),
        status: 'pending'
      });
    }
    return batches;
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
   * Closes the modal and resets state.
   */
  close(): void {
    this.isVisible.set(false);
    this.allItems.set([]);
    this.batches.set([]);
    this.currentBatchIndex.set(0);
    this.isProcessing.set(false);
  }
}
