import { DestroyRef, inject, Injectable } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CurrentFileService } from '../../../../../services/current-file.service';
import { LotoBuilderStateService } from './loto-builder-state.service';
import { RfLotoPointApiService } from '../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';
import { FileDto } from '../../../../../models/file/file.model';

/**
 * Root-scoped orchestrator for "open a LOTO point in the LOTO Builder":
 * resolves the point's main file (fetching the full DTO if the row is a
 * partial one without equipmentList), sets the builder-state so the info
 * window + related-files chip strip render, and hands the file to
 * CurrentFileService so the right-panel image viewer switches.
 * <p>
 * Extracted so multiple places can trigger the same UX — the left-panel
 * table's click service ({@link
 * ../loto-builder-left-panel/loto-builder-loto-point-table/loto-builder-loto-point-table-click.service.ts})
 * and the Build-LOTO floating window's per-loto point list
 * ({@link ../simple-loto-form/simple-loto-form.component.ts}) both call
 * {@link #openPoint} instead of duplicating the flow. Multi-file points
 * light up the existing chip strip in
 * {@code LotoBuilderInfoWindowComponent} automatically (driven by
 * {@code builderState.relatedFiles()}), so no separate multi-file picker
 * is needed here.
 */
@Injectable({ providedIn: 'root' })
export class LotoBuilderPointOpenerService {
  private currentFileService = inject(CurrentFileService);
  private builderState = inject(LotoBuilderStateService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  /**
   * Open a LOTO point in the builder: switch the right-panel viewer to
   * the point's main file, populate related-file chips, highlight the
   * point's equipment shape, and show the info window. Handles the
   * common case where the row DTO is a shallow one (no equipmentList)
   * by fetching the full DTO from the server first.
   */
  openPoint(lotoPoint: LotoPointDto | null | undefined): void {
    if (!lotoPoint?.id) return;
    const file = this.findFileFromLotoPoint(lotoPoint);
    if (file) {
      this.openFileAndHighlightPoint(file, lotoPoint);
    } else {
      // Partial DTO (row-projection) with no equipmentList — fetch full,
      // then retry. Info window still opens (with related files if any)
      // even when no equipment/file is attached to the point.
      this.fetchFullLotoPointAndOpenFile(lotoPoint);
    }
  }

  private openFileAndHighlightPoint(file: FileDto, lotoPoint: LotoPointDto): void {
    const currentFileId = this.builderState.currentFile()?.id;
    const isSameFile = currentFileId === file.id;

    this.builderState.selectedShapeId.set(null);
    this.builderState.hoveredShapeId.set(null);

    // Set the loto point BEFORE currentFile so it's available when the
    // right-panel equipment layer loads and tries to correlate shapes.
    this.builderState.setCurrentLotoPoint(lotoPoint);
    this.builderState.showLotoPointInfoWindow(lotoPoint);
    this.builderState.setRelatedFiles(lotoPoint);

    const relatedFiles = this.builderState.relatedFiles();
    const openedIndex = relatedFiles.findIndex(rf => rf.file.id === file.id);
    if (openedIndex >= 0) {
      this.builderState.activeRelatedFileIndex.set(openedIndex);
    }

    if (isSameFile) {
      this.highlightLotoPointEquipment(lotoPoint);
    } else {
      this.currentFileService.setCurrentFile(file);
    }
  }

  private highlightLotoPointEquipment(lotoPoint: LotoPointDto): void {
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq =>
      eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === lotoPoint.id)
    );
    if (matchingEquipment) {
      this.builderState.hoveredShapeId.set(matchingEquipment.id);
      this.builderState.selectedShapeId.set(matchingEquipment.id);
      this.builderState.hoveredLotoPoint.set(lotoPoint);
    }
  }

  private fetchFullLotoPointAndOpenFile(partialLotoPoint: LotoPointDto): void {
    this.lotoPointApiService.getLotoPointById(partialLotoPoint.id.toString())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const fullLotoPoint = LotoPointDto.fromJson(response.responseData);
          const file = this.findFileFromLotoPoint(fullLotoPoint);
          if (file) {
            this.openFileAndHighlightPoint(file, fullLotoPoint);
          } else {
            // No file attached — still show the info window so the user
            // sees the point's details + can act on it.
            this.builderState.setCurrentLotoPoint(fullLotoPoint);
            this.builderState.showLotoPointInfoWindow(fullLotoPoint);
            this.builderState.setRelatedFiles(fullLotoPoint);
          }
        },
        error: (error) => {
          console.error('[LotoBuilderPointOpener] Fetch full LOTO point failed:', error);
          // Fall back to whatever partial data we have so the info window
          // isn't left blank.
          this.builderState.setCurrentLotoPoint(partialLotoPoint);
          this.builderState.showLotoPointInfoWindow(partialLotoPoint);
        }
      });
  }

  private findFileFromLotoPoint(lotoPoint: LotoPointDto): FileDto | null {
    if (!lotoPoint.equipmentList || lotoPoint.equipmentList.length === 0) return null;
    for (const equipment of lotoPoint.equipmentList) {
      if (equipment.mainFileObject) return equipment.mainFileObject as FileDto;
      if (equipment.mainFileId) return new FileDto({ id: equipment.mainFileId } as any);
    }
    return null;
  }
}
