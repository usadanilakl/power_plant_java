import { Component, inject, ViewChild, ElementRef, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BradySdkService } from './brady-sdk.service';
import { BradyPrinterModalService } from './brady-printer-modal.service';
import { PopupProjectionComponent } from "../popup-projection/popup-projection.component";
import { RfLotoPointApiService } from '../../features/loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointCounterpartService, SyncableField } from '../../features/loto-points/refactored/services/loto-point-counterpart.service';
import { LotoPointDto } from '../../models/loto/loto-point.model';
import { LotoPointBulkCreateService } from '../../features/loto-points/refactored/services/loto-point-bulk-create.service';

@Component({
  selector: 'app-brady-printer-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupProjectionComponent],
  templateUrl: './brady-printer-manager.component.html',
  styleUrls: ['./brady-printer-manager.component.css'],
})
export class BradyPrinterManagerComponent {
  @ViewChild('previewContainer', { static: false }) previewContainer!: ElementRef<HTMLDivElement>;

  bradyPrinterModalService = inject(BradyPrinterModalService);
  private readonly bradySdkService = inject(BradySdkService);
  private readonly lotoPointApi = inject(RfLotoPointApiService);
  private readonly counterpartService = inject(LotoPointCounterpartService);
  private readonly bulkCreateService = inject(LotoPointBulkCreateService);

  state = toSignal(this.bradySdkService.state$);
  withQr = signal(false);

  line1 = '';
  line2 = '';
  printStatus = '';

  // Save-back state
  syncCounterpart = signal(false);
  saveStatus = signal<'idle' | 'saving' | 'saved' | 'error'>('idle');
  private originalLine1 = '';
  private originalLine2 = '';

  // Computed to check if we're in queue mode
  isQueueMode = computed(() => this.bradyPrinterModalService.printQueue().length > 0);

  // Computed for current queue item
  currentQueueItem = computed(() => this.bradyPrinterModalService.getCurrentItem());

  // Track if auto-print is running
  isAutoPrinting = signal(false);

  constructor() {
    // When bulk create saves items from printer context, add them to the queue
    this.bulkCreateService.savedItems$.subscribe(savedDtos => {
      if (this.bulkCreateService.sourceContext() === 'printer') {
        const newItems = savedDtos.map(dto => ({
          line1: dto.tagNumber || '',
          line2: dto.description || '',
          withQr: true,
          sourceLotoPointId: dto.id,
          sourceLotoPoint: dto,
        }));
        this.bradyPrinterModalService.addToQueue(newItems);
      }
    });

    // Effect to handle visibility changes and initialize when opened
    effect(() => {
      if (this.bradyPrinterModalService.isVisible()) {
        // Check if we're in queue mode
        const queue = this.bradyPrinterModalService.printQueue();
        if (queue.length > 0) {
          // Queue mode - load first item
          this.loadCurrentQueueItem();
        } else {
          // Single item mode - apply pre-populated data if available
          const labelData = this.bradyPrinterModalService.labelData();
          if (labelData) {
            this.line1 = labelData.line1;
            this.line2 = labelData.line2;
            this.originalLine1 = labelData.line1;
            this.originalLine2 = labelData.line2;
            if (labelData.withQr !== undefined) {
              this.withQr.set(labelData.withQr);
            }
            this.saveStatus.set('idle');
          }
        }

        // Use setTimeout to ensure ViewChild is available
        setTimeout(() => {
          this.updatePreview();
          this.bradySdkService.autoConnectOrScan();
        });
      }
    });

    // Effect to update preview when QR toggle changes
    effect(() => {
      const _ = this.withQr(); // Track the signal
      if (this.bradyPrinterModalService.isVisible() && this.previewContainer) {
        this.updatePreview();
      }
    });

    // Effect to load current queue item when index changes
    effect(() => {
      const _ = this.bradyPrinterModalService.currentIndex(); // Track index changes
      if (this.isQueueMode() && this.bradyPrinterModalService.isVisible()) {
        this.loadCurrentQueueItem();
        setTimeout(() => this.updatePreview());
      }
    });
  }

  /**
   * Loads the current queue item into the form fields.
   */
  private loadCurrentQueueItem(): void {
    const item = this.bradyPrinterModalService.getCurrentItem();
    if (item) {
      this.line1 = item.line1;
      this.line2 = item.line2;
      this.originalLine1 = item.line1;
      this.originalLine2 = item.line2;
      this.withQr.set(item.withQr ?? true);
      this.saveStatus.set('idle');
    }
  }

  async updatePreview(): Promise<void> {
    if (!this.previewContainer) return;

    try {
      const canvas = this.withQr()
        ? await this.bradySdkService.createImageFromStringsWithQr(this.line1, this.line2)
        : this.bradySdkService.createImageFromStringsNoQr(this.line1, this.line2);

      canvas.style.width = '100%';
      canvas.style.height = 'auto';

      const container = this.previewContainer.nativeElement;
      container.innerHTML = '';
      container.appendChild(canvas);
    } catch (error) {
      console.error('Failed to create preview image:', error);
      this.previewContainer.nativeElement.innerHTML = '<p class="error-message">Could not generate preview.</p>';
    }
  }

  close(): void {
    this.bradyPrinterModalService.close();
  }

  openBulkCreate(): void {
    this.bulkCreateService.open('printer');
  }

  scanForPrinters(): void {
    this.bradySdkService.scanForPrinters();
  }

  disconnect(): void {
    this.bradySdkService.disconnect();
  }

  toggleQr(): void {
    this.withQr.set(!this.withQr());
  }

  async testPrint(): Promise<void> {
    try {
      const canvas = await this.bradySdkService.createImageFromStrings('Test Print', new Date().toLocaleTimeString());
      this.bradySdkService.printCanvas(canvas).subscribe({
        next: (success) => {
          this.printStatus = success ? 'Test print sent successfully.' : 'Test print failed.';
        },
        error: (err) => {
          this.printStatus = 'Test print failed.';
          console.error('Print failed', err);
        },
      });
    } catch (error) {
      this.printStatus = 'Failed to create test print image.';
      console.error('Failed to create image for printing:', error);
    }
  }

  onPrint(): void {
    if (!this.line1 && !this.line2) {
      this.printStatus = 'Please provide text for at least one line.';
      return;
    }

    this.printStatus = 'Sending to printer...';

    // Update queue item status if in queue mode
    const currentItem = this.bradyPrinterModalService.getCurrentItem();
    if (currentItem) {
      this.bradyPrinterModalService.updateQueueItemStatus(currentItem.id, 'printing');
    }

    this.bradySdkService.printLabel(this.line1, this.line2, { withQr: this.withQr() }).subscribe({
      next: (success) => {
        if (currentItem) {
          this.bradyPrinterModalService.updateQueueItemStatus(
            currentItem.id,
            success ? 'completed' : 'error'
          );
        }
        this.printStatus = success ? 'Printing successful!' : 'Printing failed. Check printer status.';

        // If auto-printing, move to next item
        if (success && this.isAutoPrinting()) {
          this.printNextInQueue();
        }
      },
      error: (err) => {
        console.error('Print error:', err);
        if (currentItem) {
          this.bradyPrinterModalService.updateQueueItemStatus(currentItem.id, 'error');
        }
        this.printStatus = 'An error occurred during printing.';
        this.isAutoPrinting.set(false);
      }
    });
  }

  /**
   * Selects a specific item from the queue.
   */
  selectQueueItem(index: number): void {
    this.bradyPrinterModalService.currentIndex.set(index);
  }

  /**
   * Moves to the next item in the queue and optionally prints.
   */
  printNextInQueue(): void {
    const queue = this.bradyPrinterModalService.printQueue();
    const currentIndex = this.bradyPrinterModalService.currentIndex();

    // Find next pending item
    for (let i = currentIndex + 1; i < queue.length; i++) {
      if (queue[i].status === 'pending') {
        this.bradyPrinterModalService.currentIndex.set(i);
        if (this.isAutoPrinting()) {
          setTimeout(() => this.onPrint(), 500); // Small delay between prints
        }
        return;
      }
    }

    // No more pending items
    this.isAutoPrinting.set(false);
    this.printStatus = 'All items printed!';
  }

  /**
   * Starts auto-printing all items in the queue.
   */
  startAutoPrint(): void {
    const queue = this.bradyPrinterModalService.printQueue();
    if (queue.length === 0) return;

    // Find first pending item
    const firstPendingIndex = queue.findIndex(item => item.status === 'pending');
    if (firstPendingIndex === -1) {
      this.printStatus = 'No pending items to print.';
      return;
    }

    this.isAutoPrinting.set(true);
    this.bradyPrinterModalService.currentIndex.set(firstPendingIndex);
    setTimeout(() => this.onPrint(), 100);
  }

  /**
   * Stops auto-printing.
   */
  stopAutoPrint(): void {
    this.isAutoPrinting.set(false);
    this.printStatus = 'Auto-print stopped.';
  }

  /**
   * Gets the count of completed items in the queue.
   */
  getCompletedCount(): number {
    return this.bradyPrinterModalService.printQueue().filter(item => item.status === 'completed').length;
  }

  /**
   * Gets the total count of items in the queue.
   */
  getTotalCount(): number {
    return this.bradyPrinterModalService.printQueue().length;
  }

  /**
   * Gets the current source LOTO point (from queue item or single label data).
   */
  getCurrentSourceLotoPoint(): LotoPointDto | undefined {
    if (this.isQueueMode()) {
      return this.bradyPrinterModalService.getCurrentItem()?.sourceLotoPoint;
    }
    return this.bradyPrinterModalService.labelData()?.sourceLotoPoint;
  }

  /**
   * Checks if the current item has a counterpart.
   */
  hasCounterpart(): boolean {
    const source = this.getCurrentSourceLotoPoint();
    return !!source?.counterpartId;
  }

  /**
   * Saves changed fields back to the source LOTO point on blur.
   */
  onFieldBlur(field: 'line1' | 'line2'): void {
    const currentValue = field === 'line1' ? this.line1 : this.line2;
    const originalValue = field === 'line1' ? this.originalLine1 : this.originalLine2;

    if (currentValue === originalValue) return;

    const source = this.getCurrentSourceLotoPoint();
    if (!source?.id) return;

    // Update the in-memory DTO
    const updatedDto = new LotoPointDto({
      ...source,
      tagNumber: field === 'line1' ? this.line1 : source.tagNumber,
      description: field === 'line2' ? this.line2 : source.description,
    });

    // Update queue item's source reference in memory
    this.updateCurrentSourceLotoPoint(updatedDto);

    // Update original values
    if (field === 'line1') this.originalLine1 = this.line1;
    if (field === 'line2') this.originalLine2 = this.line2;

    // Save to backend
    this.saveStatus.set('saving');
    const changedField: SyncableField = field === 'line1' ? 'tagNumber' : 'description';

    this.lotoPointApi.saveLotoPoint(updatedDto).subscribe({
      next: () => {
        this.saveStatus.set('saved');
        setTimeout(() => {
          if (this.saveStatus() === 'saved') this.saveStatus.set('idle');
        }, 2000);

        // Sync counterpart if enabled
        if (this.syncCounterpart() && source.counterpartId) {
          this.saveCounterpart(updatedDto, [changedField]);
        }
      },
      error: () => {
        this.saveStatus.set('error');
        setTimeout(() => {
          if (this.saveStatus() === 'error') this.saveStatus.set('idle');
        }, 3000);
      }
    });
  }

  /**
   * Updates the source LOTO point reference on the current queue item or label data.
   */
  private updateCurrentSourceLotoPoint(updated: LotoPointDto): void {
    if (this.isQueueMode()) {
      const queue = this.bradyPrinterModalService.printQueue();
      const index = this.bradyPrinterModalService.currentIndex();
      const updatedQueue = queue.map((item, i) =>
        i === index ? { ...item, line1: this.line1, line2: this.line2, sourceLotoPoint: updated } : item
      );
      this.bradyPrinterModalService.printQueue.set(updatedQueue);
    } else {
      const labelData = this.bradyPrinterModalService.labelData();
      if (labelData) {
        this.bradyPrinterModalService.labelData.set({
          ...labelData,
          line1: this.line1,
          line2: this.line2,
          sourceLotoPoint: updated,
        });
      }
    }
  }

  /**
   * Fetches and saves the counterpart with transformed field values.
   */
  private saveCounterpart(source: LotoPointDto, changedFields: SyncableField[]): void {
    if (!source.counterpartId) return;

    this.lotoPointApi.getCounterpartById(source.counterpartId).subscribe({
      next: (response) => {
        if (!response.responseData) return;
        let counterpart = LotoPointDto.fromJson(response.responseData);
        const sourceUnit = this.counterpartService.getSourceUnit(source);
        const targetUnit = this.counterpartService.getTargetUnit(sourceUnit);

        for (const field of changedFields) {
          counterpart = this.counterpartService.syncField(source, counterpart, field, sourceUnit, targetUnit);
        }
        this.lotoPointApi.saveLotoPoint(counterpart).subscribe();
      }
    });
  }
}
