import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { WizardStep } from '../wizard-stack.types';

@Component({
  selector: 'app-wizard-file-upload-step',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <div
      class="upload-container"
      [class.dragover]="isDragOver()"
      (dragover)="onDragOver($event)"
      (dragleave)="onDragLeave($event)"
      (drop)="onDrop($event)"
    >
      @if (!selectedFile()) {
        <div class="upload-prompt">
          <mat-icon class="upload-icon">cloud_upload</mat-icon>
          <p class="upload-text">Drag and drop a file here</p>
          <p class="upload-subtext">or</p>
          <button mat-stroked-button (click)="fileInput.click()">
            <mat-icon>folder_open</mat-icon>
            Browse Files
          </button>
          <input
            #fileInput
            type="file"
            hidden
            [accept]="step().uploadConfig?.accept || '*'"
            (change)="onFileSelected($event)"
          />
          @if (step().uploadConfig?.accept) {
            <p class="file-types">
              Supported: {{ step().uploadConfig?.accept }}
            </p>
          }
        </div>
      } @else {
        <div class="file-preview">
          <div class="file-info">
            <mat-icon class="file-icon">{{ getFileIcon() }}</mat-icon>
            <div class="file-details">
              <span class="file-name">{{ selectedFile()?.name }}</span>
              <span class="file-size">{{ formatFileSize(selectedFile()?.size || 0) }}</span>
            </div>
          </div>
          <button mat-icon-button (click)="removeFile()" matTooltip="Remove file">
            <mat-icon>close</mat-icon>
          </button>
        </div>
      }

      @if (error()) {
        <div class="error-message">
          <mat-icon>error</mat-icon>
          {{ error() }}
        </div>
      }
    </div>
  `,
  styles: [`
    .upload-container {
      border: 2px dashed #ccc;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      transition: all 0.3s ease;
      background: #fafafa;
    }

    .upload-container.dragover {
      border-color: #1976d2;
      background: #e3f2fd;
    }

    .upload-prompt {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
    }

    .upload-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      color: #bbb;
    }

    .upload-text {
      font-size: 16px;
      color: #666;
      margin: 0;
    }

    .upload-subtext {
      font-size: 14px;
      color: #999;
      margin: 0;
    }

    .file-types {
      font-size: 12px;
      color: #999;
      margin-top: 16px;
    }

    .file-preview {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 16px;
      background: white;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
    }

    .file-info {
      display: flex;
      align-items: center;
      gap: 16px;
    }

    .file-icon {
      font-size: 40px;
      width: 40px;
      height: 40px;
      color: #1976d2;
    }

    .file-details {
      display: flex;
      flex-direction: column;
    }

    .file-name {
      font-weight: 500;
    }

    .file-size {
      font-size: 12px;
      color: #666;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 12px;
      background: #ffebee;
      border-radius: 8px;
      color: #c62828;
    }

    .error-message mat-icon {
      font-size: 20px;
    }
  `],
})
export class WizardFileUploadStepComponent {
  step = input.required<WizardStep>();
  currentFile = input<File | null>(null);

  fileSelected = output<{ fieldName: string; file: File }>();

  selectedFile = signal<File | null>(null);
  isDragOver = signal(false);
  error = signal<string | null>(null);

  constructor() {
    // Initialize from currentFile if provided
  }

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
      this.processFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    this.error.set(null);

    // Validate file type
    const accept = this.step().uploadConfig?.accept;
    if (accept) {
      const acceptedTypes = accept.split(',').map(t => t.trim().toLowerCase());
      const fileExt = '.' + file.name.split('.').pop()?.toLowerCase();
      const mimeType = file.type.toLowerCase();

      const isValid = acceptedTypes.some(type =>
        type === fileExt || type === mimeType || type === '*'
      );

      if (!isValid) {
        this.error.set(`Invalid file type. Supported: ${accept}`);
        return;
      }
    }

    // Validate file size
    const maxSize = this.step().uploadConfig?.maxSize;
    if (maxSize && file.size > maxSize) {
      this.error.set(`File too large. Maximum size: ${this.formatFileSize(maxSize)}`);
      return;
    }

    this.selectedFile.set(file);
    const fieldName = this.step().uploadConfig?.fieldName || 'uploadedFile';
    this.fileSelected.emit({ fieldName, file });
  }

  removeFile(): void {
    this.selectedFile.set(null);
    this.error.set(null);
  }

  getFileIcon(): string {
    const file = this.selectedFile();
    if (!file) return 'insert_drive_file';

    const ext = file.name.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'picture_as_pdf';
      case 'png':
      case 'jpg':
      case 'jpeg':
      case 'gif': return 'image';
      case 'dwg': return 'architecture';
      default: return 'insert_drive_file';
    }
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
