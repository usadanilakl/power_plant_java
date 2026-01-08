import { Component, inject, ViewChild, ElementRef, effect, signal } from '@angular/core';
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

  constructor() {
    // Effect to handle visibility changes and initialize when opened
    effect(() => {
      if (this.bradyPrinterModalService.isVisible()) {
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

  async onPrint(): Promise<void> {
    if (!this.line1 && !this.line2) {
      this.printStatus = 'Please provide text for at least one line.';
      return;
    }

    this.printStatus = 'Creating label...';

    try {
      const canvas = this.withQr()
        ? await this.bradySdkService.createImageFromStringsWithQr(this.line1, this.line2)
        : this.bradySdkService.createImageFromStringsNoQr(this.line1, this.line2);

      this.printStatus = 'Sending to printer...';

      this.bradySdkService.printCanvasWithOffset(canvas, -50).subscribe({
        next: (success) => {
          this.printStatus = success ? 'Printing successful!' : 'Printing failed. Check printer status.';
        },
        error: (err) => {
          console.error('Print subscription error:', err);
          this.printStatus = 'An error occurred during printing.';
        }
      });
    } catch (error) {
      console.error('Failed to create or print image:', error);
      this.printStatus = 'Failed to create image for printing.';
    }
  }
}
