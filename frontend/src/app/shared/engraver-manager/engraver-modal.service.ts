import { Injectable, signal, computed, effect } from '@angular/core';
import { LotoPointDto, LotoPointCharacteristic } from '../../models/loto/loto-point.model';
import { EngraverTemplateDto } from './models/engraver-template.model';

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
  layoutVersion = signal<'standard' | 'info'>('standard');
  selectedCharacteristicNames = signal<string[]>([]);
  maxEngraveCharacteristics = 4;

  // Template-based signals
  allTemplates = signal<EngraverTemplateDto[]>([]);
  selectedTagSize = signal<string>('2x3');
  selectedDataStructure = signal<string>('standard');

  // Resolved template: finds matching template by tagSize + dataStructure
  resolvedTemplate = computed(() => {
    const templates = this.allTemplates();
    const tagSize = this.selectedTagSize();
    const ds = this.selectedDataStructure();
    const matches = templates.filter(t => t.tagSize === tagSize && t.dataStructure === ds);
    if (matches.length === 0) return null;
    return matches.find(t => t.isDefault) ?? matches[0];
  });

  // Batch size derived from resolved template
  batchSize = computed(() => this.resolvedTemplate()?.batchSize ?? 4);

  // Available tag sizes from all templates
  availableTagSizes = computed(() => [...new Set(this.allTemplates().map(t => t.tagSize))]);

  // Available data structures filtered by current tag size
  availableDataStructures = computed(() => {
    const tagSize = this.selectedTagSize();
    const matching = this.allTemplates().filter(t => t.tagSize === tagSize);
    return [...new Set(matching.map(t => t.dataStructure))];
  });

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

  /** All unique characteristic names across all items */
  availableCharacteristicNames = computed(() => {
    const names = new Set<string>();
    for (const item of this.allItems()) {
      const chars = this.parseCharacteristics(item.characteristicsJson);
      for (const c of chars) {
        if (c.name) names.add(c.name);
      }
    }
    return Array.from(names);
  });

  constructor() {
    // Re-create batches when batchSize changes (template selection change)
    effect(() => {
      const size = this.batchSize();
      const items = this.allItems();
      if (items.length > 0) {
        this.batches.set(this.createBatches(items));
        this.currentBatchIndex.set(0);
      }
    });
  }

  /**
   * Sets data structure and syncs layoutVersion.
   */
  setDataStructure(ds: string): void {
    this.selectedDataStructure.set(ds);
    this.layoutVersion.set(ds === 'info' ? 'info' : 'standard');
    if (ds === 'info' && this.selectedCharacteristicNames().length === 0) {
      const available = this.availableCharacteristicNames();
      this.selectedCharacteristicNames.set(available.slice(0, this.maxEngraveCharacteristics));
    }
  }

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

  toggleCharacteristicName(name: string): void {
    const current = this.selectedCharacteristicNames();
    if (current.includes(name)) {
      this.selectedCharacteristicNames.set(current.filter(n => n !== name));
    } else if (current.length < this.maxEngraveCharacteristics) {
      this.selectedCharacteristicNames.set([...current, name]);
    }
  }

  parseCharacteristics(json: string | null): LotoPointCharacteristic[] {
    if (!json || json.trim() === '') return [];
    try {
      const parsed = JSON.parse(json);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
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
    this.layoutVersion.set('standard');
    this.selectedCharacteristicNames.set([]);
    this.allTemplates.set([]);
    this.selectedTagSize.set('2x3');
    this.selectedDataStructure.set('standard');
  }
}
