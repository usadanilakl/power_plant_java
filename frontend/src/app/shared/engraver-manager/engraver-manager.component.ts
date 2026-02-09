import { Component, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EngraverModalService } from './engraver-modal.service';
import { EngraverApiService } from './engraver-api.service';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';

@Component({
  selector: 'app-engraver-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RfPopupProjectionComponent],
  templateUrl: './engraver-manager.component.html',
  styleUrls: ['./engraver-manager.component.css']
})
export class EngraverManagerComponent {
  modalService = inject(EngraverModalService);
  private engraverApi = inject(EngraverApiService);

  statusMessage = '';
  errorMessage = '';
  batchSizeOptions = [1, 2, 3, 4, 5];

  // Computed for UI
  progressPercentage = computed(() => {
    const total = this.modalService.totalBatches();
    if (total === 0) return 0;
    return Math.round((this.modalService.completedBatches() / total) * 100);
  });

  constructor() {
    // Load templates when modal becomes visible
    effect(() => {
      if (this.modalService.isVisible() && this.modalService.availableTemplates().length === 0) {
        this.loadTemplates();
      }
    });
  }

  private loadTemplates(): void {
    this.engraverApi.getTemplates().subscribe({
      next: (response) => {
        if (response.responseData) {
          this.modalService.availableTemplates.set(response.responseData);
          if (!this.modalService.selectedTemplate() && response.responseData.length > 0) {
            this.modalService.selectedTemplate.set(response.responseData[0]);
          }
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to load templates';
      }
    });
  }

  onTemplateChange(template: string): void {
    this.modalService.setTemplate(template);
  }

  onBatchSizeChange(size: number): void {
    this.modalService.updateBatchSize(size);
  }

  /**
   * Process the current batch - generates CSV and opens LightBurn.
   */
  processBatch(): void {
    const ids = this.modalService.getCurrentBatchIds();
    if (ids.length === 0) {
      this.errorMessage = 'No items in current batch';
      return;
    }

    const template = this.modalService.selectedTemplate();
    if (!template) {
      this.errorMessage = 'Please select a template';
      return;
    }

    this.statusMessage = 'Processing batch...';
    this.errorMessage = '';
    this.modalService.startProcessingCurrentBatch();

    const withQr = this.modalService.withQr();
    this.engraverApi.processBatch(ids, template, true, withQr).subscribe({
      next: (response) => {
        if (response.responseData) {
          this.statusMessage = `CSV generated with ${response.responseData.itemCount} items. LightBurn opened.`;
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
   * Remove an item from processing.
   */
  removeItem(itemId: number): void {
    this.modalService.removeItem(itemId);
  }

  /**
   * Mark current batch as completed, set isLabeled on backend, and move to next.
   */
  markCompleteAndNext(): void {
    const ids = this.modalService.getCurrentBatchIds();

    this.engraverApi.markLabeled(ids).subscribe({
      next: () => {
        this.modalService.completeCurrentBatch();
        this.statusMessage = '';
        this.errorMessage = '';

        if (this.modalService.hasNextBatch()) {
          this.modalService.nextBatch();
        } else if (this.modalService.allBatchesCompleted()) {
          this.statusMessage = 'All batches completed!';
        }
      },
      error: (err) => {
        this.errorMessage = 'Failed to mark as labeled: ' + (err.message || 'unknown error');
      }
    });
  }

  /**
   * Just open LightBurn with existing CSV (for re-processing).
   */
  reopenLightBurn(): void {
    const template = this.modalService.selectedTemplate();
    if (!template) {
      this.errorMessage = 'Please select a template';
      return;
    }

    this.statusMessage = 'Opening LightBurn...';
    this.engraverApi.openLightBurn(template).subscribe({
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
