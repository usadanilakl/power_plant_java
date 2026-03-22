import { Component, inject, computed, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EngraverModalService } from './engraver-modal.service';
import { EngraverApiService } from './engraver-api.service';
import { RfPopupProjectionComponent } from '../popup-projection/rf-popup-projection.component';
import { EngraverTemplateManagerComponent } from './engraver-template-manager/engraver-template-manager.component';

@Component({
  selector: 'app-engraver-manager',
  standalone: true,
  imports: [CommonModule, FormsModule, RfPopupProjectionComponent, EngraverTemplateManagerComponent],
  templateUrl: './engraver-manager.component.html',
  styleUrls: ['./engraver-manager.component.css']
})
export class EngraverManagerComponent {
  modalService = inject(EngraverModalService);
  private engraverApi = inject(EngraverApiService);

  isTemplateManagerOpen = signal(false);
  statusMessage = '';
  errorMessage = '';

  // Computed for UI
  progressPercentage = computed(() => {
    const total = this.modalService.totalBatches();
    if (total === 0) return 0;
    return Math.round((this.modalService.completedBatches() / total) * 100);
  });

  constructor() {
    // Load templates when modal becomes visible
    effect(() => {
      if (this.modalService.isVisible() && this.modalService.allTemplates().length === 0) {
        this.loadEngraverTemplates();
      }
    });
  }

  private loadEngraverTemplates(): void {
    this.engraverApi.getEngraverTemplates().subscribe({
      next: (response) => {
        if (response.responseData) {
          this.modalService.allTemplates.set(response.responseData);
        }
      },
      error: () => {
        this.errorMessage = 'Failed to load engraver templates';
      }
    });
  }

  /**
   * Delegates data structure change to modal service.
   */
  setDataStructure(ds: string): void {
    this.modalService.setDataStructure(ds);
  }

  /**
   * Returns current tag size for preview rendering.
   */
  getTagSize(): '2x3' | '2x1' {
    return this.modalService.selectedTagSize() as '2x3' | '2x1';
  }

  /**
   * Splits a description into display lines, mirroring backend logic.
   * Max 4 lines, ~20 chars per line, splits at word boundaries.
   */
  getDescriptionLines(description: string | null): string[] {
    if (!description || description.trim() === '') return [''];

    // Check for explicit line breaks
    if (description.includes('\n')) {
      return description.split('\n').map(l => l.trim()).slice(0, 4);
    }

    // Short descriptions stay on one line
    if (description.length <= 20) return [description];

    // Split by word boundaries
    const words = description.split(/\s+/);
    const lines: string[] = [];
    let currentLine = '';

    for (const word of words) {
      if (currentLine.length + word.length + 1 <= 20) {
        currentLine = currentLine ? currentLine + ' ' + word : word;
      } else {
        if (currentLine) {
          lines.push(currentLine);
          currentLine = '';
        }
        currentLine = word;
      }

      if (lines.length >= 3 && currentLine) {
        lines.push(currentLine);
        currentLine = '';
        break;
      }
    }

    if (currentLine && lines.length < 4) {
      lines.push(currentLine);
    }

    return lines;
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

    const resolved = this.modalService.resolvedTemplate();
    if (!resolved?.filename) {
      this.errorMessage = 'No template available for this tag size / data structure combination';
      return;
    }

    this.statusMessage = 'Processing batch...';
    this.errorMessage = '';
    this.modalService.startProcessingCurrentBatch();

    const withQr = this.modalService.withQr();
    const layoutVersion = this.modalService.layoutVersion();
    const characteristicNames = layoutVersion === 'info' ? this.modalService.selectedCharacteristicNames() : [];
    this.engraverApi.processBatch(ids, resolved.filename, true, withQr, layoutVersion, characteristicNames).subscribe({
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
    const resolved = this.modalService.resolvedTemplate();
    if (!resolved?.filename) {
      this.errorMessage = 'No template available';
      return;
    }

    this.statusMessage = 'Opening LightBurn...';
    this.engraverApi.openLightBurn(resolved.filename).subscribe({
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

  getCharacteristicValue(item: any, name: string): string {
    const chars = this.modalService.parseCharacteristics(item.characteristicsJson);
    const found = chars.find(c => c.name === name);
    return found?.value || '-';
  }

  /**
   * Opens the template manager popup.
   */
  openTemplateManager(): void {
    this.isTemplateManagerOpen.set(true);
  }

  /**
   * Handles template manager closed event.
   */
  onTemplateManagerClosed(): void {
    this.isTemplateManagerOpen.set(false);
  }

  /**
   * Reloads templates after changes in the template manager.
   */
  onTemplatesChanged(): void {
    this.loadEngraverTemplates();
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
