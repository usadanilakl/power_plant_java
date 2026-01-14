import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { GuideFormStep } from './guide-form.types';
import { GuideHintsPanelComponent } from './guide-hints-panel.component';

@Component({
  selector: 'app-guide-file-select-step',
  standalone: true,
  imports: [MatIconModule, MatButtonModule, GuideHintsPanelComponent],
  template: `
    <div class="file-select-step">
      <h3 class="step-title">{{ step().title }}</h3>
      <p class="step-description">{{ step().description }}</p>

      <!-- Drop Zone -->
      <div
        class="drop-zone"
        [class.drag-over]="isDragOver()"
        [class.has-file]="selectedFile()"
        (dragover)="onDragOver($event)"
        (dragleave)="onDragLeave($event)"
        (drop)="onDrop($event)"
        (click)="fileInput.click()"
      >
        @if (selectedFile()) {
          <mat-icon class="file-icon">description</mat-icon>
          <span class="file-name">{{ selectedFile()?.name }}</span>
          <span class="file-size">{{ formatFileSize(selectedFile()?.size || 0) }}</span>
          <button
            mat-icon-button
            class="remove-btn"
            (click)="removeFile($event)"
            title="Remove file"
          >
            <mat-icon>close</mat-icon>
          </button>
        } @else {
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <span class="drop-text">Drag & drop your file here</span>
          <span class="or-text">or</span>
          <button mat-stroked-button color="primary" class="browse-btn">
            Browse Files
          </button>
        }
      </div>

      <input
        #fileInput
        type="file"
        class="hidden-input"
        (change)="onFileSelected($event)"
        accept=".pdf,.dwg,.png,.jpg,.jpeg,.gif,.tif,.tiff"
      />

      @if (step().hints && step().hints!.length > 0) {
        <app-guide-hints-panel [hints]="step().hints!" [compact]="true" />
      }

      @if (error()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [
    `
      .file-select-step {
        padding: 16px;
      }

      .step-title {
        margin: 0 0 8px 0;
        font-size: 16px;
        font-weight: 600;
        color: var(--text-primary, #333);
      }

      .step-description {
        margin: 0 0 16px 0;
        font-size: 14px;
        color: var(--text-secondary, #666);
      }

      .drop-zone {
        position: relative;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 32px 16px;
        border: 2px dashed var(--border-color, #ccc);
        border-radius: 12px;
        background: var(--surface-alt, #fafafa);
        cursor: pointer;
        transition: all 0.2s ease;
        min-height: 160px;
      }

      .drop-zone:hover {
        border-color: var(--primary-color, #1976d2);
        background: var(--primary-light, #e3f2fd);
      }

      .drop-zone.drag-over {
        border-color: var(--primary-color, #1976d2);
        background: var(--primary-light, #e3f2fd);
        border-style: solid;
      }

      .drop-zone.has-file {
        border-style: solid;
        border-color: var(--success-color, #4caf50);
        background: var(--success-bg, #e8f5e9);
      }

      .upload-icon {
        font-size: 48px;
        width: 48px;
        height: 48px;
        color: var(--text-tertiary, #999);
        margin-bottom: 12px;
      }

      .drop-zone:hover .upload-icon,
      .drop-zone.drag-over .upload-icon {
        color: var(--primary-color, #1976d2);
      }

      .drop-text {
        font-size: 14px;
        color: var(--text-secondary, #666);
        margin-bottom: 8px;
      }

      .or-text {
        font-size: 12px;
        color: var(--text-tertiary, #999);
        margin-bottom: 8px;
      }

      .browse-btn {
        font-size: 13px;
      }

      .file-icon {
        font-size: 40px;
        width: 40px;
        height: 40px;
        color: var(--success-color, #4caf50);
        margin-bottom: 8px;
      }

      .file-name {
        font-size: 14px;
        font-weight: 500;
        color: var(--text-primary, #333);
        max-width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      .file-size {
        font-size: 12px;
        color: var(--text-tertiary, #999);
        margin-top: 4px;
      }

      .remove-btn {
        position: absolute;
        top: 8px;
        right: 8px;
        width: 32px;
        height: 32px;
      }

      .remove-btn mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }

      .hidden-input {
        display: none;
      }

      .error-message {
        display: flex;
        align-items: center;
        gap: 8px;
        margin-top: 12px;
        padding: 10px 12px;
        background: var(--error-bg, #ffebee);
        color: var(--error-color, #c62828);
        border-radius: 8px;
        font-size: 13px;
      }

      .error-message mat-icon {
        font-size: 18px;
        width: 18px;
        height: 18px;
      }
    `,
  ],
})
export class GuideFileSelectStepComponent {
  step = input.required<GuideFormStep>();

  fileSelected = output<File>();

  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  error = signal<string | null>(null);

  private readonly maxFileSize = 50 * 1024 * 1024; // 50MB
  private readonly allowedTypes = [
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/gif',
    'image/tiff',
    // DWG files don't have a standard MIME type
  ];
  private readonly allowedExtensions = ['.pdf', '.dwg', '.png', '.jpg', '.jpeg', '.gif', '.tif', '.tiff'];

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver.set(false);

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.handleFile(input.files[0]);
      // Reset input so same file can be selected again
      input.value = '';
    }
  }

  removeFile(event: Event): void {
    event.stopPropagation();
    this.selectedFile.set(null);
    this.error.set(null);
  }

  private handleFile(file: File): void {
    this.error.set(null);

    // Check file size
    if (file.size > this.maxFileSize) {
      this.error.set(`File is too large. Maximum size is ${this.formatFileSize(this.maxFileSize)}.`);
      return;
    }

    // Check file extension
    const extension = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!this.allowedExtensions.includes(extension)) {
      this.error.set(`File type not supported. Allowed: ${this.allowedExtensions.join(', ')}`);
      return;
    }

    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
