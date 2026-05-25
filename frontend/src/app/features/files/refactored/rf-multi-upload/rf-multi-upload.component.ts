import { Component, DestroyRef, EventEmitter, inject, OnInit, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { firstValueFrom } from 'rxjs';
import { DuplicateReport, RfFileApiService } from '../services/rf-file-api.service';
import { RfValueSelectComponent } from '../../../values/refactored/components/rf-value-select/rf-value-select.component';
import { FileDto } from '../../../../models/file/file.model';
import { SharedDataService } from '../../../../services/shared-data.service';
import { ValueDto } from '../../../../models/value.model';

interface UploadFileItem {
  file: File;
  name: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  errorMessage?: string;
}

interface PostUploadDuplicate {
  uploadedFile: FileDto;
  exactMatches: FileDto[];
  visualMatches: { file: FileDto; hammingDistance: number }[];
}

@Component({
  selector: 'app-rf-multi-upload',
  standalone: true,
  imports: [CommonModule, FormsModule, RfValueSelectComponent],
  templateUrl: './rf-multi-upload.component.html',
  styleUrl: './rf-multi-upload.component.css'
})
export class RfMultiUploadComponent implements OnInit {
  private apiService = inject(RfFileApiService);
  private sharedDataService = inject(SharedDataService);
  private destroyRef = inject(DestroyRef);

  @Output() close = new EventEmitter<void>();
  @Output() uploadComplete = new EventEmitter<FileDto[]>();

  // Form state
  fileTypeId = signal<number | null>(null);
  vendorId = signal<number | null>(null);
  selectedFiles = signal<UploadFileItem[]>([]);

  // Allowed extensions (fetched from server, lowercase, no dots)
  allowedExtensions = signal<string[]>([]);
  acceptAttr = signal<string>('');

  // PDF→JPG conversion toggle. Defaults to the selected fileType's policy
  // (and ultimately to true). User can override on a per-upload basis.
  convertToJpg = signal<boolean>(true);
  /** Set to true when the user explicitly toggles — we then stop overwriting from fileType. */
  private convertToJpgManuallySet = false;
  /** Cache of fileType ValueDtos so we can look up the convertToJpg policy on selection. */
  private fileTypeMap = new Map<number, ValueDto>();

  // Pre-upload duplicate check state
  isCheckingDuplicates = signal<boolean>(false);
  duplicateReport = signal<DuplicateReport | null>(null);
  /** When true, the user has reviewed name matches and confirmed to continue. */
  private nameDuplicateAcknowledged = false;

  // Post-upload duplicate check state (hash-based)
  isCheckingPostUpload = signal<boolean>(false);
  /** Per uploaded file: matches found via fileHash or perceptualHash. */
  postUploadDuplicates = signal<PostUploadDuplicate[]>([]);
  /** Files we just uploaded — used by Undo to delete them on cancel. */
  private uploadedFileIds: number[] = [];

  ngOnInit(): void {
    this.apiService.getAllowedExtensions().subscribe({
      next: (response) => {
        const exts = response.responseData ?? [];
        this.allowedExtensions.set(exts);
        this.acceptAttr.set(exts.map(e => '.' + e).join(','));
      },
      error: () => {
        // Fallback to common safe defaults if the endpoint is unavailable
        const fallback = ['pdf', 'png', 'jpg', 'jpeg'];
        this.allowedExtensions.set(fallback);
        this.acceptAttr.set(fallback.map(e => '.' + e).join(','));
      }
    });

    // Keep the fileType lookup map in sync with the live Value subject.
    this.sharedDataService.fileTypes$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe(values => {
      this.fileTypeMap.clear();
      for (const v of values) {
        if (v.id != null) this.fileTypeMap.set(v.id, v);
      }
      // If a fileType is already selected, refresh its policy.
      const id = this.fileTypeId();
      if (id != null) this.applyFileTypePolicy(id);
    });
    // Trigger the initial load so fileTypes$ emits.
    this.sharedDataService.loadFileTypes().pipe(takeUntilDestroyed(this.destroyRef)).subscribe();
  }

  /** Apply the selected fileType's convertToJpg policy unless the user has overridden. */
  private applyFileTypePolicy(fileTypeId: number): void {
    if (this.convertToJpgManuallySet) return;
    const ft = this.fileTypeMap.get(fileTypeId);
    // null/undefined → fall back to true (legacy behavior)
    this.convertToJpg.set(ft?.convertToJpg ?? true);
  }

  onConvertToJpgChange(value: boolean): void {
    this.convertToJpgManuallySet = true;
    this.convertToJpg.set(value);
  }

  /** True if the user has selected any PDF — toggle is only meaningful in that case. */
  hasPdfSelected(): boolean {
    return this.selectedFiles().some(item =>
      item.file.name.toLowerCase().endsWith('.pdf')
    );
  }

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
    if (value != null) this.applyFileTypePolicy(value);
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
    const allowed = this.allowedExtensions();
    const isAllowed = (f: File) => {
      const dotIdx = f.name.lastIndexOf('.');
      if (dotIdx < 0) return false;
      return allowed.includes(f.name.substring(dotIdx + 1).toLowerCase());
    };
    const acceptedFiles = allowed.length > 0 ? files.filter(isAllowed) : files;

    if (acceptedFiles.length !== files.length) {
      const allowedLabel = allowed.map(e => '.' + e).join(', ');
      this.errorMessage.set(`Some files were ignored. Allowed extensions: ${allowedLabel}`);
    }

    const newItems: UploadFileItem[] = acceptedFiles.map(file => ({
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

  async upload(): Promise<void> {
    if (!this.canUpload()) return;

    // Pre-upload duplicate check by name tokens (unless user already acknowledged).
    if (!this.nameDuplicateAcknowledged) {
      const tokens = this.collectNameTokens();
      if (tokens.length > 0) {
        this.isCheckingDuplicates.set(true);
        try {
          const res = await firstValueFrom(this.apiService.checkDuplicatesByName(tokens));
          this.isCheckingDuplicates.set(false);
          const report = res.responseData;
          if (report && report.nameMatches && report.nameMatches.length > 0) {
            // Show modal — user must explicitly continue.
            this.duplicateReport.set(report);
            return;
          }
        } catch {
          this.isCheckingDuplicates.set(false);
          // Don't block upload on a duplicate-check failure.
        }
      }
    }

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

    this.apiService.uploadMultipleFiles(files, fileTypeId, vendorId, sharedFileName, this.convertToJpg()).subscribe({
      next: (response) => {
        this.isUploading.set(false);
        this.uploadProgress.set('');

        // Mark all files as success
        this.selectedFiles.update(items =>
          items.map(item => ({ ...item, status: 'success' as const }))
        );

        const uploaded = response.responseData ?? [];
        this.successMessage.set(`Successfully uploaded ${uploaded.length} file(s)!`);

        if (uploaded.length > 0) {
          this.uploadComplete.emit(uploaded);
          this.uploadedFileIds = uploaded.map(f => f.id);
          this.runPostUploadDuplicateCheck(uploaded);
        } else {
          setTimeout(() => this.onClose(), 2000);
        }
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

  /** Collect filename-without-extension as upload candidates for duplicate matching. */
  private collectNameTokens(): string[] {
    return this.selectedFiles().map(item => {
      const name = item.file.name;
      const dot = name.lastIndexOf('.');
      return dot > 0 ? name.substring(0, dot) : name;
    }).filter(s => s.length > 0);
  }

  /** User acknowledged the name-duplicate modal and wants to continue uploading. */
  acknowledgeNameDuplicates(): void {
    this.nameDuplicateAcknowledged = true;
    this.duplicateReport.set(null);
    this.upload();
  }

  /** User canceled the upload from the duplicate modal. */
  cancelDuplicateModal(): void {
    this.duplicateReport.set(null);
  }

  /**
   * After upload succeeds, ask the backend if each new file has visual/byte duplicates.
   * If any are found, surface them as a toast with an Undo option.
   */
  private async runPostUploadDuplicateCheck(uploaded: FileDto[]): Promise<void> {
    this.isCheckingPostUpload.set(true);
    const matches: PostUploadDuplicate[] = [];
    for (const file of uploaded) {
      try {
        const res = await firstValueFrom(this.apiService.checkDuplicatesPostUpload(file.id));
        const report = res.responseData;
        if (!report) continue;
        const hasHashDupes = (report.exactMatches?.length || 0) > 0
          || (report.visualMatches?.length || 0) > 0;
        if (hasHashDupes) {
          matches.push({
            uploadedFile: file,
            exactMatches: report.exactMatches ?? [],
            visualMatches: report.visualMatches ?? [],
          });
        }
      } catch {
        // Skip — duplicate check is best-effort.
      }
    }
    this.isCheckingPostUpload.set(false);

    if (matches.length > 0) {
      this.postUploadDuplicates.set(matches);
      // Don't auto-close — user needs to decide.
    } else {
      setTimeout(() => this.onClose(), 2000);
    }
  }

  /** User dismisses the post-upload duplicate toast — keep the upload, close dialog. */
  dismissPostUploadDuplicates(): void {
    this.postUploadDuplicates.set([]);
    this.onClose();
  }

  /** Undo the upload — soft-delete every just-uploaded FileObject. */
  async undoUpload(): Promise<void> {
    if (this.uploadedFileIds.length === 0) {
      this.postUploadDuplicates.set([]);
      this.onClose();
      return;
    }
    for (const id of this.uploadedFileIds) {
      try {
        await firstValueFrom(this.apiService.deleteFile(String(id)));
      } catch {
        // Continue with the rest even if one fails.
      }
    }
    this.uploadedFileIds = [];
    this.postUploadDuplicates.set([]);
    this.onClose();
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}
