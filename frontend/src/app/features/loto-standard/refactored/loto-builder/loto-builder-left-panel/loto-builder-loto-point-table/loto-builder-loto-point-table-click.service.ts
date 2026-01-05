import { inject, Injectable, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { TableClickService } from '../../../../../../shared/table/refactored/services/table-click.service';
import { CurrentFileService } from '../../../../../../services/current-file.service';
import { LotoBuilderStateService } from '../../services/loto-builder-state.service';
import { RfLotoPointApiService } from '../../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointDto } from '../../../../../../models/loto/loto-point.model';
import { FileDto } from '../../../../../../models/file/file.model';
import { RfLotoPointClickService } from '../../../../../loto-points/refactored/rf-loto-point-table/rf-loto-point-click.service';

/**
 * Custom click service for LOTO point table in LOTO builder.
 * Finds the equipment containing the LOTO point, gets its file,
 * opens that file, and highlights the clicked point.
 */
@Injectable()
export class LotoBuilderLotoPointTableClickService extends RfLotoPointClickService {
  private currentFileService = inject(CurrentFileService);
  private builderState = inject(LotoBuilderStateService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private localDestroyRef = inject(DestroyRef);

  /**
   * Override double click to find equipment's file and highlight the loto point
   */
  protected override handleRowDoubleClick(item: any, event: MouseEvent): void {
    const normalizedItem = this.normalizeItem(item);
    console.log('[LotoBuilderLotoPointTable] Double clicked LOTO point:', normalizedItem);

    if (!(normalizedItem instanceof LotoPointDto) && !normalizedItem.id) {
      console.warn('[LotoBuilderLotoPointTable] Invalid item:', normalizedItem);
      return;
    }

    const lotoPoint = normalizedItem as LotoPointDto;

    // Try to find the file from equipment list
    const file = this.findFileFromLotoPoint(lotoPoint);

    if (file) {
      this.openFileAndHighlightPoint(file, lotoPoint);
    } else {
      // Equipment list might be missing in partial DTO - fetch full data from server
      console.log('[LotoBuilderLotoPointTable] No equipment list, fetching full LOTO point data...');
      this.fetchFullLotoPointAndOpenFile(lotoPoint);
    }
  }

  /**
   * Open the file and highlight the loto point
   */
  private openFileAndHighlightPoint(file: FileDto, lotoPoint: LotoPointDto): void {
    console.log('[LotoBuilderLotoPointTable] Opening file:', file.id, 'and highlighting point:', lotoPoint.tagNumber);

    // Set the current file to load it
    this.currentFileService.setCurrentFile(file);

    // Highlight the loto point after file loads
    this.builderState.setCurrentLotoPoint(lotoPoint);
    this.builderState.showLotoPointInfoWindow(lotoPoint);
  }

  /**
   * Fetch full LOTO point data from server and try to open associated file
   */
  private fetchFullLotoPointAndOpenFile(partialLotoPoint: LotoPointDto): void {
    this.lotoPointApiService.getLotoPointById(partialLotoPoint.id.toString())
      .pipe(takeUntilDestroyed(this.localDestroyRef))
      .subscribe({
        next: (response) => {
          const fullLotoPoint = LotoPointDto.fromJson(response.responseData);
          console.log('[LotoBuilderLotoPointTable] Fetched full LOTO point:', fullLotoPoint);

          const file = this.findFileFromLotoPoint(fullLotoPoint);

          if (file) {
            this.openFileAndHighlightPoint(file, fullLotoPoint);
          } else {
            console.warn('[LotoBuilderLotoPointTable] No file found even after fetching full data:', fullLotoPoint.tagNumber);
            // Still show the info window even if no file is found
            this.builderState.setCurrentLotoPoint(fullLotoPoint);
            this.builderState.showLotoPointInfoWindow(fullLotoPoint);
          }
        },
        error: (error) => {
          console.error('[LotoBuilderLotoPointTable] Error fetching LOTO point:', error);
          // Fall back to showing info window with partial data
          this.builderState.setCurrentLotoPoint(partialLotoPoint);
          this.builderState.showLotoPointInfoWindow(partialLotoPoint);
        }
      });
  }

  /**
   * Find the file from the LOTO point's equipment list
   */
  private findFileFromLotoPoint(lotoPoint: LotoPointDto): FileDto | null {
    // Check if the loto point has an equipment list
    if (!lotoPoint.equipmentList || lotoPoint.equipmentList.length === 0) {
      console.log('[LotoBuilderLotoPointTable] No equipment list on loto point');
      return null;
    }

    // Find the first equipment with a mainFileObject or mainFileId
    for (const equipment of lotoPoint.equipmentList) {
      if (equipment.mainFileObject) {
        console.log('[LotoBuilderLotoPointTable] Found file from equipment.mainFileObject:', equipment.mainFileObject.id);
        return equipment.mainFileObject as FileDto;
      }

      if (equipment.mainFileId) {
        console.log('[LotoBuilderLotoPointTable] Found file ID from equipment.mainFileId:', equipment.mainFileId);
        // Return a partial FileDto with just the ID - CurrentFileService will fetch the full data
        return new FileDto({ id: equipment.mainFileId } as any);
      }
    }

    console.log('[LotoBuilderLotoPointTable] No file found in any equipment');
    return null;
  }

  /**
   * Override single click to highlight the point without opening file
   */
  protected override handleRowLeftClick(item: any, event: MouseEvent): void {
    // Call base implementation for selection handling
    super.handleRowLeftClick(item, event);

    const normalizedItem = this.normalizeItem(item);

    if (normalizedItem instanceof LotoPointDto || normalizedItem.id) {
      const lotoPoint = normalizedItem as LotoPointDto;

      // Find equipment containing this loto point in the current file
      const currentEquipment = this.builderState.currentEquipment();
      const matchingEquipment = currentEquipment.find(eq =>
        eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === lotoPoint.id)
      );

      if (matchingEquipment) {
        // Highlight the shape on the image
        this.builderState.hoveredShapeId.set(matchingEquipment.id);
        this.builderState.hoveredLotoPoint.set(lotoPoint);
      }
    }
  }
}
