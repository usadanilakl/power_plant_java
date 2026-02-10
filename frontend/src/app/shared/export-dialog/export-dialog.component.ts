import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PopupProjectionComponent } from '../popup-projection/popup-projection.component';
import { ExportDialogService, ExportOption } from './export-dialog.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { DestroyRef } from '@angular/core';

@Component({
  selector: 'app-export-dialog',
  standalone: true,
  imports: [CommonModule, FormsModule, PopupProjectionComponent],
  template: `
    @if (exportDialogService.isVisible()) {
      <app-popup-projection
        [isOpen]="true"
        [title]="'Export ' + exportDialogService.getEntityLabel() + ' to Excel'"
        (close)="close()"
      >
        <div class="export-dialog-content">
          <p class="export-description">Select which {{ exportDialogService.getEntityLabel().toLowerCase() }} to export:</p>

          <div class="export-options">
            <button
              type="button"
              class="export-option-btn"
              [class.selected]="selectedOption === 'all'"
              (click)="selectedOption = 'all'"
            >
              <span class="option-label">
                <strong>All Items</strong>
                <span class="option-description">Export all {{ exportDialogService.getEntityLabel().toLowerCase() }} in the database</span>
              </span>
            </button>

            <button
              type="button"
              class="export-option-btn"
              [class.selected]="selectedOption === 'queried'"
              [class.disabled]="!exportDialogService.hasSearchCriteria()"
              [disabled]="!exportDialogService.hasSearchCriteria()"
              (click)="exportDialogService.hasSearchCriteria() && (selectedOption = 'queried')"
            >
              <span class="option-label">
                <strong>Queried Items</strong>
                <span class="option-description">
                  @if (exportDialogService.hasSearchCriteria()) {
                    Export items matching current search filters
                  } @else {
                    No search filters applied
                  }
                </span>
              </span>
            </button>

            <button
              type="button"
              class="export-option-btn"
              [class.selected]="selectedOption === 'selected'"
              [class.disabled]="!exportDialogService.hasSelectedItems()"
              [disabled]="!exportDialogService.hasSelectedItems()"
              (click)="exportDialogService.hasSelectedItems() && (selectedOption = 'selected')"
            >
              <span class="option-label">
                <strong>Selected Items</strong>
                <span class="option-description">
                  @if (exportDialogService.hasSelectedItems()) {
                    Export {{ exportDialogService.getSelectedIds().length }} selected items
                  } @else {
                    No items selected in table
                  }
                </span>
              </span>
            </button>
          </div>

          @if (exportDialogService.hasFormatOptions()) {
            <div class="format-section">
              <p class="format-label">Export format:</p>
              <div class="export-options">
                @for (option of exportDialogService.getFormatOptions(); track option.value) {
                  <button
                    type="button"
                    class="export-option-btn"
                    [class.selected]="exportDialogService.selectedFormat() === option.value"
                    (click)="exportDialogService.selectedFormat.set(option.value)"
                  >
                    <span class="option-label">
                      <strong>{{ option.label }}</strong>
                      <span class="option-description">{{ option.description }}</span>
                    </span>
                  </button>
                }
              </div>
            </div>
          }

          @if (exportDialogService.exportError()) {
            <div class="error-message">
              {{ exportDialogService.exportError() }}
            </div>
          }

          <div class="dialog-actions">
            <button
              class="btn btn-secondary"
              (click)="close()"
              [disabled]="exportDialogService.isExporting()"
            >
              Cancel
            </button>
            <button
              class="btn btn-primary"
              (click)="export()"
              [disabled]="exportDialogService.isExporting()"
            >
              @if (exportDialogService.isExporting()) {
                <span class="spinner"></span>
                Exporting...
              } @else {
                Export to Excel
              }
            </button>
          </div>
        </div>
      </app-popup-projection>
    }
  `,
  styles: [`
    .export-dialog-content {
      padding: 16px;
      min-width: 350px;
    }

    .export-description {
      margin-bottom: 16px;
      color: var(--text-secondary, #666);
    }

    .export-options {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-bottom: 20px;
    }

    .export-option-btn {
      display: flex;
      align-items: flex-start;
      width: 100%;
      padding: 14px 16px;
      border: 2px solid var(--border-color, #ddd);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.2s ease;
      background-color: var(--bg-color, #fff);
      text-align: left;
    }

    .export-option-btn:hover:not(.disabled) {
      background-color: var(--hover-bg, #f5f5f5);
      border-color: var(--primary-color, #1976d2);
    }

    .export-option-btn.selected {
      background-color: var(--primary-light, #e3f2fd);
      border-color: var(--primary-color, #1976d2);
      box-shadow: 0 0 0 1px var(--primary-color, #1976d2);
    }

    .export-option-btn.selected .option-label strong {
      color: var(--primary-color, #1976d2);
    }

    .export-option-btn.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      background-color: var(--disabled-bg, #f5f5f5);
    }

    .option-label {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .option-label strong {
      color: var(--text-primary, #333);
      font-size: 14px;
    }

    .option-description {
      font-size: 0.85em;
      color: var(--text-secondary, #666);
    }

    .format-section {
      margin-bottom: 20px;
      padding-top: 16px;
      border-top: 1px solid var(--border-color, #ddd);
    }

    .format-label {
      margin-bottom: 12px;
      color: var(--text-secondary, #666);
    }

    .error-message {
      padding: 12px;
      background-color: var(--error-bg, #ffebee);
      color: var(--error-color, #c62828);
      border-radius: 4px;
      margin-bottom: 16px;
    }

    .dialog-actions {
      display: flex;
      justify-content: flex-end;
      gap: 12px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 14px;
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-secondary {
      background-color: var(--secondary-bg, #e0e0e0);
      color: var(--text-primary, #333);
    }

    .btn-primary {
      background-color: var(--primary-color, #1976d2);
      color: white;
    }

    .btn-primary:hover:not(:disabled) {
      background-color: var(--primary-dark, #1565c0);
    }

    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid transparent;
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `]
})
export class ExportDialogComponent {
  exportDialogService = inject(ExportDialogService);
  private destroyRef = inject(DestroyRef);

  selectedOption: ExportOption = 'all';

  close(): void {
    this.exportDialogService.close();
  }

  export(): void {
    this.exportDialogService.isExporting.set(true);
    this.exportDialogService.exportError.set(null);

    let exportObservable;

    switch (this.selectedOption) {
      case 'all':
        exportObservable = this.exportDialogService.exportAll();
        break;
      case 'queried':
        const criteria = this.exportDialogService.getSearchCriteria();
        if (!criteria) {
          this.exportDialogService.exportError.set('No search criteria available');
          this.exportDialogService.isExporting.set(false);
          return;
        }
        exportObservable = this.exportDialogService.exportByQuery(criteria);
        break;
      case 'selected':
        const ids = this.exportDialogService.getSelectedIds();
        if (ids.length === 0) {
          this.exportDialogService.exportError.set('No items selected');
          this.exportDialogService.isExporting.set(false);
          return;
        }
        exportObservable = this.exportDialogService.exportByIds(ids);
        break;
    }

    if (!exportObservable) {
      this.exportDialogService.exportError.set('Export not configured');
      this.exportDialogService.isExporting.set(false);
      return;
    }

    exportObservable.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.exportDialogService.isExporting.set(false);
        this.exportDialogService.close();
      },
      error: (error) => {
        console.error('Export failed:', error);
        this.exportDialogService.exportError.set(error.error?.message || error.message || 'Export failed');
        this.exportDialogService.isExporting.set(false);
      }
    });
  }
}
