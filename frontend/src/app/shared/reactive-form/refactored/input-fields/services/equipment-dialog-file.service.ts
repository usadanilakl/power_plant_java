import { Injectable, inject, signal, computed, DestroyRef } from '@angular/core';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { FileMenuService, FileMenuGroupKey } from '../../../../../features/files/refactored/rf-file-left-menu/rf-file-menu.service';
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
 *
 * Type selection here is **dialog-local**: changing the picked file type only
 * rebuilds this service's menu, never the global FileMenuService selection
 * used by the main file feature.
 */
@Injectable()
export class EquipmentDialogFileService {
  private currentFileService = inject(CurrentFileService);
  private menuService = inject(FileMenuService);
  private fileService = inject(FileService);
  private destroyRef = inject(DestroyRef);

  // State
  selectedFile = signal<FileDto | null>(null);

  // Files map from CurrentFileService
  filesMap = toSignal(this.currentFileService.fileMapByType$);

  // All available file-type names (e.g. "P&ID", "Manual", "Electrical Panel
  // Schedule") — populated dynamically by CurrentFileService from the DB.
  availableTypes = toSignal(this.currentFileService.fileTypes$, { initialValue: [] as string[] });

  // Dialog-local file-type selection. Empty until resolved to the default
  // (first P&ID-like type, falling back to the first available type).
  private explicitType = signal<string>('');

  /**
   * The effective picked type: explicit user pick if any, else the first
   * P&ID-like type from the dynamic list, else the first type at all.
   */
  selectedType = computed<string>(() => {
    const explicit = this.explicitType();
    if (explicit) return explicit;
    const types = this.availableTypes();
    return types.find(t => t.toLowerCase().includes('pid')) ?? types[0] ?? '';
  });

  // Dialog-local grouping override. `null` means "use the per-type default"
  // (P&ID→vendor, electrical/iso/heat-trace→system, else fileType).
  private explicitGroupBy = signal<FileMenuGroupKey | null>(null);

  /** Available grouping options surfaced in the dropdown. */
  availableGroupKeys: FileMenuGroupKey[] = ['vendor', 'system', 'fileType'];

  /** Effective group key: explicit override if any, else the per-type default. */
  selectedGroupBy = computed<FileMenuGroupKey>(() =>
    this.explicitGroupBy() ?? this.menuService.defaultGroupForType(this.selectedType())
  );

  // Menu items for the dialog's toggle menu — built locally so switching the
  // type picker here does NOT affect the global file feature's menu.
  menuItems = computed<NestedItem[]>(() =>
    this.menuService.buildItemsForType(this.selectedType(), this.selectedGroupBy())
  );

  // Loading and error states — still observed from the singleton because
  // currentFileService drives both (one-shot bulk load on startup).
  isLoading = this.menuService.isLoading;
  error = this.menuService.error;

  // Computed files list (for the legacy simple list view) — kept P&ID-only
  // for backwards compatibility. The toggle menu above is the new path.
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

  /**
   * Pick a different file type. Local to this dialog instance.
   * Also clears any manual group-by override — each type has its own sensible
   * default, so switching types resets the grouping rather than carrying the
   * previous override (which may not make sense for the new type).
   */
  selectType(type: string): void {
    this.explicitType.set(type ?? '');
    this.explicitGroupBy.set(null);
  }

  /** Override the grouping for the current file type. Local to this dialog. */
  selectGroupBy(key: FileMenuGroupKey): void {
    this.explicitGroupBy.set(key);
  }

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
   * Reset service state (call on dialog close).
   * Also clears the dialog-local type pick so a re-opened dialog starts on the
   * default (P&ID) again.
   */
  reset(): void {
    this.selectedFile.set(null);
    this.explicitType.set('');
    this.explicitGroupBy.set(null);
  }
}
