import { Component, inject, ViewChild, ElementRef, effect, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal } from '@angular/core/rxjs-interop';
import { BradySdkService } from './brady-sdk.service';
import { BradyPrinterModalService } from './brady-printer-modal.service';
import { PopupComponent } from '../menus/popup/popup.component';

@Component({
  selector: 'app-brady-printer-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupComponent],
  templateUrl: './brady-printer-manager.component.html',
  styleUrls: ['./brady-printer-manager.component.css'],
})
export class BradyPrinterManagerComponent {
  @ViewChild('previewContainer', { static: false }) previewContainer!: ElementRef<HTMLDivElement>;

  bradyPrinterModalService = inject(BradyPrinterModalService);
  private readonly bradySdkService = inject(BradySdkService);

  state = toSignal(this.bradySdkService.state$);
  withQr = signal(true);

  line1 = '';
  line2 = '';
  qrData: string | undefined;
  printStatus = '';

  isQueueMode = computed(() => this.bradyPrinterModalService.printQueue().length > 0);
  currentQueueItem = computed(() => this.bradyPrinterModalService.getCurrentItem());
  isAutoPrinting = signal(false);

  constructor() {
    // Handle visibility changes and initialize when opened
    effect(() => {
      if (this.bradyPrinterModalService.isVisible()) {
        const queue = this.bradyPrinterModalService.printQueue();
        if (queue.length > 0) {
          this.loadCurrentQueueItem();
        } else {
          const labelData = this.bradyPrinterModalService.labelData();
          if (labelData) {
            this.line1 = labelData.line1;
            this.line2 = labelData.line2;
            this.qrData = labelData.qrData;
            if (labelData.withQr !== undefined) {
              this.withQr.set(labelData.withQr);
            }
          }
        }

        setTimeout(() => {
          this.updatePreview();
          // Catch any rejection from the async chain so it doesn't surface as
          // an unhandled promise rejection (setTimeout callbacks can't
          // propagate async errors). SDK-side errors already update state.
          this.bradySdkService.autoConnectOrScan().catch(err => {
            console.warn('[Brady] autoConnectOrScan failed:', err?.message ?? err);
          });
        });
      }
    });

    // Update preview when QR toggle changes
    effect(() => {
      const _ = this.withQr();
      if (this.bradyPrinterModalService.isVisible() && this.previewContainer) {
        this.updatePreview();
      }
    });

    // Reload current queue item when index changes
    effect(() => {
      const _ = this.bradyPrinterModalService.currentIndex();
      if (this.isQueueMode() && this.bradyPrinterModalService.isVisible()) {
        this.loadCurrentQueueItem();
        setTimeout(() => this.updatePreview());
      }
    });
  }

  private loadCurrentQueueItem(): void {
    const item = this.bradyPrinterModalService.getCurrentItem();
    if (item) {
      this.line1 = item.line1;
      this.line2 = item.line2;
      this.qrData = item.qrData;
      this.withQr.set(item.withQr ?? true);
    }
  }

  async updatePreview(): Promise<void> {
    if (!this.previewContainer) return;

    try {
      const canvas = this.withQr()
        ? await this.bradySdkService.createImageFromStringsWithQr(this.line1, this.line2, this.qrData)
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
      const canvas = this.bradySdkService.createImageFromStringsNoQr('Test Print', new Date().toLocaleTimeString());
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

    const currentItem = this.bradyPrinterModalService.getCurrentItem();
    if (currentItem) {
      this.bradyPrinterModalService.updateQueueItemStatus(currentItem.id, 'printing');
    }

    this.bradySdkService.printLabel(this.line1, this.line2, { withQr: this.withQr(), qrData: this.qrData }).subscribe({
      next: (success) => {
        if (currentItem) {
          this.bradyPrinterModalService.updateQueueItemStatus(currentItem.id, success ? 'completed' : 'error');
        }
        this.printStatus = success ? 'Printing successful!' : 'Printing failed. Check printer status.';

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

  selectQueueItem(index: number): void {
    this.bradyPrinterModalService.currentIndex.set(index);
  }

  printNextInQueue(): void {
    const queue = this.bradyPrinterModalService.printQueue();
    const currentIndex = this.bradyPrinterModalService.currentIndex();

    for (let i = currentIndex + 1; i < queue.length; i++) {
      if (queue[i].status === 'pending') {
        this.bradyPrinterModalService.currentIndex.set(i);
        if (this.isAutoPrinting()) {
          setTimeout(() => this.onPrint(), 500);
        }
        return;
      }
    }

    this.isAutoPrinting.set(false);
    this.printStatus = 'All items printed!';
  }

  startAutoPrint(): void {
    const queue = this.bradyPrinterModalService.printQueue();
    if (queue.length === 0) return;

    const firstPendingIndex = queue.findIndex(item => item.status === 'pending');
    if (firstPendingIndex === -1) {
      this.printStatus = 'No pending items to print.';
      return;
    }

    this.isAutoPrinting.set(true);
    this.bradyPrinterModalService.currentIndex.set(firstPendingIndex);
    setTimeout(() => this.onPrint(), 100);
  }

  stopAutoPrint(): void {
    this.isAutoPrinting.set(false);
    this.printStatus = 'Auto-print stopped.';
  }

  getCompletedCount(): number {
    return this.bradyPrinterModalService.printQueue().filter(item => item.status === 'completed').length;
  }

  getTotalCount(): number {
    return this.bradyPrinterModalService.printQueue().length;
  }
}
