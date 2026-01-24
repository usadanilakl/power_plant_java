import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EngraverModalService } from './engraver-modal.service';
import { EngraverApiService } from './engraver-api.service';
import { PopupProjectionComponent } from '../popup-projection/popup-projection.component';

@Component({
  selector: 'app-engraver-manager',
  standalone: true,
  imports: [CommonModule, PopupProjectionComponent],
  templateUrl: './engraver-manager.component.html',
  styleUrls: ['./engraver-manager.component.css']
})
export class EngraverManagerComponent {
  modalService = inject(EngraverModalService);
  private engraverApi = inject(EngraverApiService);

  statusMessage = '';
  errorMessage = '';

  // Computed for UI
  progressPercentage = computed(() => {
    const total = this.modalService.totalBatches();
    if (total === 0) return 0;
    return Math.round((this.modalService.completedBatches() / total) * 100);
  });

  /**
   * Process the current batch - generates CSV and opens LightBurn.
   */
  async processBatch(): Promise<void> {
    const ids = this.modalService.getCurrentBatchIds();
    if (ids.length === 0) {
      this.errorMessage = 'No items in current batch';
      return;
    }

    this.statusMessage = 'Processing batch...';
    this.errorMessage = '';
    this.modalService.startProcessingCurrentBatch();

    const withQr = this.modalService.withQr();
    this.engraverApi.processBatch(ids, true, withQr).subscribe({
      next: (response) => {
        if (response.responseData) {
          const qrText = withQr ? ' (with QR)' : '';
          this.statusMessage = `CSV generated with ${response.responseData.itemCount} items${qrText}. LightBurn opened.`;
          // Don't auto-complete - user must click "Mark Complete" after engraving
        } else {
          this.errorMessage = response.message || 'Failed to process batch';
          this.modalService.errorCurrentBatch(this.errorMessage);
        }
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to process batch';
        this.modalService.errorCurrentBatch(this.errorMessage);
      }
    });
  }

  /**
   * Mark current batch as completed and move to next.
   */
  markCompleteAndNext(): void {
    this.modalService.completeCurrentBatch();
    this.statusMessage = '';
    this.errorMessage = '';

    if (this.modalService.hasNextBatch()) {
      this.modalService.nextBatch();
    } else if (this.modalService.allBatchesCompleted()) {
      this.statusMessage = 'All batches completed!';
    }
  }

  /**
   * Just open LightBurn with existing CSV (for re-processing).
   */
  reopenLightBurn(): void {
    this.statusMessage = 'Opening LightBurn...';
    const withQr = this.modalService.withQr();
    this.engraverApi.openLightBurn(withQr).subscribe({
      next: () => {
        this.statusMessage = 'LightBurn opened';
      },
      error: (err) => {
        this.errorMessage = err.message || 'Failed to open LightBurn';
      }
    });
  }

  /**
   * Toggle QR code setting.
   */
  toggleQr(): void {
    this.modalService.toggleQr();
  }

  /**
   * Close the modal.
   */
  close(): void {
    this.modalService.close();
    this.statusMessage = '';
    this.errorMessage = '';
  }

  /**
   * Get status icon for a batch.
   */
  getStatusIcon(status: string): string {
    switch (status) {
      case 'completed': return '✓';
      case 'error': return '✗';
      case 'processing': return '↻';
      default: return '○';
    }
  }
}
