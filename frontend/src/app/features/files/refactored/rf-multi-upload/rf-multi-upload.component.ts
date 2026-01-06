import { Component, EventEmitter, inject, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RfFileApiService } from '../services/rf-file-api.service';
import { RfValueSelectComponent } from '../../../values/refactored/components/rf-value-select/rf-value-select.component';
import { FileDto } from '../../../../models/file/file.model';

interface UploadFileItem {
  file: File;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

@Component({
  selector: 'app-rf-multi-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RfValueSelectComponent],
  templateUrl: './rf-multi-upload.component.html',
  styleUrl: './rf-multi-upload.component.css'
})
export class RfMultiUploadComponent {
  private apiService = inject(RfFileApiService);

  @Output() close = new EventEmitter<void>();
  @Output() uploadComplete = new EventEmitter<FileDto[]>();

  // Form state
  fileTypeId = signal<number | null>(null);
  vendorId = signal<number | null>(null);
  selectedFiles = signal<UploadFileItem[]>([]);

  // Shared file name option
  useSharedFileName = signal<boolean>(false);
  sharedFileName = signal<string>('');

  // UI state
  isUploading = signal<boolean>(false);
  uploadProgress = signal<string>('');
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  // Drag and drop state
  isDragOver = signal<boolean>(false);

  onFileTypeChange(value: number | null): void {
    this.fileTypeId.set(value);
    this.errorMessage.set('');
  }

  onVendorChange(value: number | null): void {
    this.vendorId.set(value);
    this.errorMessage.set('');
  }

  onFileSelect(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.addFiles(Array.from(input.files));
    }
    // Reset input so the same file can be selected again
    input.value = '';
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

    if (event.dataTransfer?.files) {
      this.addFiles(Array.from(event.dataTransfer.files));
    }
  }

  private addFiles(files: File[]): void {
    const pdfFiles = files.filter(file => file.name.toLowerCase().endsWith('.pdf'));

    if (pdfFiles.length !== files.length) {
      this.errorMessage.set('Only PDF files are allowed. Non-PDF files were ignored.');
    }

    const newItems: UploadFileItem[] = pdfFiles.map(file => ({
      file,
      name: file.name,
      status: 'pending' as const
    }));

    this.selectedFiles.update(current => [...current, ...newItems]);
  }

  removeFile(index: number): void {
    this.selectedFiles.update(files => files.filter((_, i) => i !== index));
  }

  clearAllFiles(): void {
    this.selectedFiles.set([]);
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  canUpload(): boolean {
    return (
      this.fileTypeId() !== null &&
      this.vendorId() !== null &&
      this.selectedFiles().length > 0 &&
      !this.isUploading()
    );
  }

  onSharedFileNameToggle(enabled: boolean): void {
    this.useSharedFileName.set(enabled);
    if (!enabled) {
      this.sharedFileName.set('');
    }
  }

  onSharedFileNameChange(value: string): void {
    this.sharedFileName.set(value);
  }

  upload(): void {
    if (!this.canUpload()) return;

    const fileTypeId = this.fileTypeId()!;
    const vendorId = this.vendorId()!;
    const files = this.selectedFiles().map(item => item.file);

    // Get shared file name if enabled and provided
    const sharedFileName = this.useSharedFileName() && this.sharedFileName().trim()
      ? this.sharedFileName().trim()
      : undefined;

    this.isUploading.set(true);
    this.errorMessage.set('');
    this.successMessage.set('');
    this.uploadProgress.set(`Uploading ${files.length} file(s)...`);

    // Mark all files as uploading
    this.selectedFiles.update(items =>
      items.map(item => ({ ...item, status: 'uploading' as const }))
    );

    this.apiService.uploadMultipleFiles(files, fileTypeId, vendorId, sharedFileName).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.uploadProgress.set('');

        // Mark all files as success
        this.selectedFiles.update(items =>
          items.map(item => ({ ...item, status: 'success' as const }))
        );

        const uploadedCount = response.responseData?.length ?? 0;
        this.successMessage.set(`Successfully uploaded ${uploadedCount} file(s)!`);

        // Emit the uploaded files
        if (response.responseData) {
          this.uploadComplete.emit(response.responseData);
        }

        // Auto-close after 2 seconds on success
        setTimeout(() => {
          this.onClose();
        }, 2000);
      },
      error: (error) => {
        this.isUploading.set(false);
        this.uploadProgress.set('');

        // Mark all files as error
        this.selectedFiles.update(items =>
          items.map(item => ({
            ...item,
            status: 'error' as const,
            errorMessage: error.error?.message || 'Upload failed'
          }))
        );

        this.errorMessage.set(error.error?.message || 'Failed to upload files');
      }
    });
  }

  onClose(): void {
    this.close.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
