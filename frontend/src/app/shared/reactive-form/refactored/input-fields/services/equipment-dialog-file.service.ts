import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { FileMenuService } from '../../../../../features/files/refactored/rf-file-left-menu/rf-file-menu.service';
import { FileService } from '../../../../../services/file.service';
import { FileDto } from '../../../../../models/file/file.model';
import { NestedItem } from '../../../../../models/ui/nested-item.model';

/**
 * Shared service for equipment dialog file selection
 * Used by both EquipmentShapeDrawerDialog and EquipmentBrowserDialog
 *
 * Provides:
 * - File list (as NestedItems for toggle menu)
 * - File selection state
 * - Equipment loading from selected file
 */
@Injectable()
export class EquipmentDialogFileService {
  private currentFileService = inject(CurrentFileService);
  private menuService = inject(FileMenuService);
  private fileService = inject(FileService);
  private destroyRef = inject(DestroyRef);

  // State
  selectedFile = signal<FileDto | null>(null);

  // Menu items for toggle menu component
  menuItems = this.menuService.menuItems;

  // Files map from CurrentFileService
  filesMap = toSignal(this.currentFileService.fileMapByType$);

  // Loading and error states
  isLoading = this.menuService.isLoading;
  error = this.menuService.error;

  // Computed files list (for simple list view)
  // fileMapByType is keyed by the actual fileType.name from the DB (whatever
  // casing/wording is in use, e.g. "PID", "P&ID", "pid"), so we do a
  // case-insensitive lookup for any P&ID-like key.
  files = computed(() => {
    const map = this.filesMap();
    if (!map) return [];
    for (const [key, files] of map.entries()) {
      if (key && key.toLowerCase().includes('pid')) {
        return files ?? [];
      }
    }
    return [];
  });

  // Equipment from selected file
  equipment = computed(() => {
    const file = this.selectedFile();
    if (!file) return [];
    return file.points ?? [];
  });

  // Current file link for image display
  currentFileLink = computed(() => {
    const file = this.selectedFile();
    return file ? file.fileLink : '';
  });

  /**
   * Select a file from NestedItem (toggle menu)
   */
  selectFileFromNestedItem(fileItem: NestedItem): void {
    this.menuService.getFileFromNestedItem(fileItem, this.selectedFile);
  }

  /**
   * Select a file directly (simple list)
   */
  selectFile(file: FileDto): void {
    this.selectedFile.set(file);
    this.currentFileService.setCurrentFile(file);
  }

  /**
   * Select a file by ID. Fetches the FULL FileDto (with `points` populated) so
   * the image viewer can render equipment shapes. Use this when the caller only
   * has a partial file reference (e.g. result of `getRelatedFiles` on a LOTO point).
   */
  selectFileById(fileId: number): void {
    this.fileService.getFileById(fileId.toString())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const fullFile = FileDto.fromJson(response.responseData);
          this.selectedFile.set(fullFile);
          this.currentFileService.setCurrentFile(fullFile);
        },
        error: (err) => {
          console.error('Failed to load full file by id', fileId, err);
        },
      });
  }

  /**
   * Check if a file is currently selected
   */
  isFileSelected(file: FileDto): boolean {
    return this.selectedFile()?.id === file.id;
  }

  /**
   * Clear file selection
   */
  clearSelection(): void {
    this.selectedFile.set(null);
  }

  /**
   * Reset service state (call on dialog close)
   */
  reset(): void {
    this.selectedFile.set(null);
  }
}
