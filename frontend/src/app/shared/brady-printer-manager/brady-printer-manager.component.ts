import { Component, inject, ViewChild, ElementRef, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BradySdkService } from './brady-sdk.service';
import { BradyPrinterModalService } from './brady-printer-modal.service';
import { PopupProjectionComponent } from "../popup-projection/popup-projection.component";

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

  state = toSignal(this.bradySdkService.state$);
  withQr = signal(false);

  line1 = '';
  line2 = '';
  printStatus = '';

  // Computed to check if we're in queue mode
  isQueueMode = computed(() => this.bradyPrinterModalService.printQueue().length > 0);

  // Computed for current queue item
  currentQueueItem = computed(() => this.bradyPrinterModalService.getCurrentItem());

  // Track if auto-print is running
  isAutoPrinting = signal(false);

  constructor() {
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
            if (labelData.withQr !== undefined) {
              this.withQr.set(labelData.withQr);
            }
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
      this.withQr.set(item.withQr ?? true);
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
}
