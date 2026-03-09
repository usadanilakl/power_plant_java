import { Component, DestroyRef, inject, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoService } from '../../../../services/loto/loto.service';
import { CurrentLotoService } from '../../../../services/current-items-services/current-loto.service';

@Component({
  selector: 'app-loto-import-dialog',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loto-import-dialog.component.html',
  styleUrl: './loto-import-dialog.component.css',
})
export class LotoImportDialogComponent {
  private lotoService = inject(LotoService);
  private currentLotoService = inject(CurrentLotoService);
  private destroyRef = inject(DestroyRef);

  closeDialog = output<void>();

  selectedFile = signal<File | null>(null);
  previewRows = signal<any[]>([]);
  isLoading = signal(false);
  isPreviewing = signal(false);
  importResult = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  isDragOver = signal(false);

  readonly previewColumns = ['lotoNumber', 'equipmentDescription', 'jobDescription', 'lockBox', 'status'];
  readonly columnLabels: Record<string, string> = {
    lotoNumber: 'LOTO Number',
    equipmentDescription: 'Equipment Description',
    jobDescription: 'Job Description',
    lockBox: 'Lock Box',
    status: 'Status',
  };

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
    }
  }

  private handleFile(file: File): void {
    const name = file.name.toLowerCase();
    if (!name.endsWith('.csv') && !name.endsWith('.xlsx') && !name.endsWith('.xls')) {
      this.errorMessage.set('Unsupported file type. Please use .csv, .xlsx, or .xls');
      return;
    }

    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.importResult.set(null);
    this.loadPreview(file);
  }

  private loadPreview(file: File): void {
    this.isPreviewing.set(true);
    this.lotoService.previewImport(file).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        this.previewRows.set(response.responseData || []);
        this.isPreviewing.set(false);
      },
      error: (err) => {
        this.errorMessage.set('Error parsing file: ' + (err.error?.message || err.message));
        this.isPreviewing.set(false);
      }
    });
  }

  doImport(): void {
    const file = this.selectedFile();
    if (!file) return;

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.currentLotoService.importLotos(file);
    // Give a moment for the import to process, then show result
    this.importResult.set(`Import started for ${this.previewRows().length} rows`);
    this.isLoading.set(false);
  }

  close(): void {
    this.closeDialog.emit();
  }

  reset(): void {
    this.selectedFile.set(null);
    this.previewRows.set([]);
    this.importResult.set(null);
    this.errorMessage.set(null);
  }
}
