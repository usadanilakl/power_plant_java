import { Component, DestroyRef, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem } from '../../../../../../models/ui/nested-item.model';
import { RfLotoPointLeftMenuService, GroupingCriteria } from '../../../../../loto-points/refactored/services/rf-loto-point-left-menu.service';
import { RfLotoPointStateService } from '../../../../../loto-points/refactored/services/rf-loto-point-state.service';
import { RfLotoPointApiService } from '../../../../../loto-points/refactored/services/rf-loto-point-api.service';
import { RfToggleMenuComponent } from '../../../../../../shared/menu/refactored/rf-toggle-menu/rf-toggle-menu.component';
import { LotoBuilderStateService } from '../../services/loto-builder-state.service';
import { CurrentFileService } from '../../../../../../services/current-file.service';
import { LotoPointDto } from '../../../../../../models/loto/loto-point.model';
import { FileDto } from '../../../../../../models/file/file.model';
import { LotoBuilderLotoPointContextMenuService } from '../loto-builder-loto-point-table/loto-builder-loto-point-context-menu.service';

/**
 * Builder-specific LOTO point left menu component.
 * Overrides click behavior to open the file containing the LOTO point,
 * matching the behavior in file mode and table view.
 */
@Component({
  selector: 'app-loto-builder-loto-point-left-menu',
  standalone: true,
  imports: [CommonModule, MatIconModule, RfToggleMenuComponent],
  providers: [
    LotoBuilderLotoPointContextMenuService,
  ],
  templateUrl: './loto-builder-loto-point-left-menu.component.html',
  styleUrl: './loto-builder-loto-point-left-menu.component.css'
})
export class LotoBuilderLotoPointLeftMenuComponent implements OnInit {
  private menuService = inject(RfLotoPointLeftMenuService);
  private stateService = inject(RfLotoPointStateService);
  private lotoPointApiService = inject(RfLotoPointApiService);
  private builderState = inject(LotoBuilderStateService);
  private currentFileService = inject(CurrentFileService);
  private destroyRef = inject(DestroyRef);
  protected contextMenuService = inject(LotoBuilderLotoPointContextMenuService);

  // UI State
  menuItems = signal<NestedItem[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  selectedGrouping = signal<GroupingCriteria>('equipmentType');

  // Available grouping options
  groupingOptions: { value: GroupingCriteria; label: string }[] = [
    { value: 'equipmentType', label: 'Equipment Type' },
    { value: 'location', label: 'Location' },
    { value: 'file', label: 'File' },
    { value: 'system', label: 'System' },
    { value: 'unit', label: 'Unit' },
    { value: 'zeroEnergyMethod', label: 'Zero Energy Method' }
  ];

  ngOnInit(): void {
    // Subscribe to menu data updates
    this.menuService.menuData$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (data) => {
          this.menuItems.set(data);
          this.isLoading.set(false);
        },
        error: (error) => {
          console.error('Error loading menu data:', error);
          this.error.set(error.message);
          this.isLoading.set(false);
        }
      });

    // Subscribe to loading state
    this.menuService.isLoading$
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((loading) => {
        this.isLoading.set(loading);
      });

    // Load initial data
    this.loadLotoPoints(this.selectedGrouping());
  }

  /**
   * Load LOTO points grouped by the specified criteria
   */
  loadLotoPoints(groupBy: GroupingCriteria): void {
    this.selectedGrouping.set(groupBy);
    this.isLoading.set(true);
    this.error.set(null);

    this.menuService.loadGroupedLotoPoints(groupBy);
  }

  /**
   * Handle item click - open the file containing the LOTO point
   * (uniform behavior with file mode)
   */
  onItemClick(item: NestedItem): void {
    // Only handle leaf nodes (actual LOTO points, not groups)
    if (item.values && item.values.length > 0) {
      return;
    }

    // If this is a LOTO point, fetch full data and open file
    if (item.objectType === 'LotoPoint') {
      console.log('[LotoBuilderLotoPointLeftMenu] Left clicked LOTO point:', item.id, item.name);
      this.fetchLotoPointAndOpenFile(Number(item.id));
    }
  }

  /**
   * Handle item double click - same as single click for consistency
   */
  onItemDoubleClick(item: NestedItem): void {
    this.onItemClick(item);
  }

  /**
   * Handle item right click - show builder's context menu
   */
  onItemRightClick(event: { event: MouseEvent; item: NestedItem }): void {
    // Only show context menu for leaf nodes (actual LOTO points, not groups)
    if (event.item.values && event.item.values.length > 0) {
      return;
    }

    // Show context menu with the item data
    this.contextMenuService.showContextMenu(event.item, event.event);
  }

  /**
   * Fetch full LOTO point data and open the associated file
   */
  private fetchLotoPointAndOpenFile(lotoPointId: number): void {
    this.lotoPointApiService.getLotoPointById(lotoPointId.toString())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (response) => {
          const fullLotoPoint = LotoPointDto.fromJson(response.responseData);
          console.log('[LotoBuilderLotoPointLeftMenu] Fetched full LOTO point:', fullLotoPoint.tagNumber);

          const file = this.findFileFromLotoPoint(fullLotoPoint);

          if (file) {
            this.openFileAndHighlightPoint(file, fullLotoPoint);
          } else {
            console.warn('[LotoBuilderLotoPointLeftMenu] No file found for LOTO point:', fullLotoPoint.tagNumber);
            // Still show the info window even if no file is found
            this.builderState.setCurrentLotoPoint(fullLotoPoint);
            this.builderState.showLotoPointInfoWindow(fullLotoPoint);
          }
        },
        error: (error) => {
          console.error('[LotoBuilderLotoPointLeftMenu] Error fetching LOTO point:', error);
        }
      });
  }

  /**
   * Find the file from the LOTO point's equipment list
   */
  private findFileFromLotoPoint(lotoPoint: LotoPointDto): FileDto | null {
    if (!lotoPoint.equipmentList || lotoPoint.equipmentList.length === 0) {
      console.log('[LotoBuilderLotoPointLeftMenu] No equipment list on loto point');
      return null;
    }

    for (const equipment of lotoPoint.equipmentList) {
      if (equipment.mainFileObject) {
        console.log('[LotoBuilderLotoPointLeftMenu] Found file from equipment.mainFileObject:', equipment.mainFileObject.id);
        return equipment.mainFileObject as FileDto;
      }

      if (equipment.mainFileId) {
        console.log('[LotoBuilderLotoPointLeftMenu] Found file ID from equipment.mainFileId:', equipment.mainFileId);
        return new FileDto({ id: equipment.mainFileId } as any);
      }
    }

    console.log('[LotoBuilderLotoPointLeftMenu] No file found in any equipment');
    return null;
  }

  /**
   * Open the file and highlight the loto point
   */
  private openFileAndHighlightPoint(file: FileDto, lotoPoint: LotoPointDto): void {
    console.log('[LotoBuilderLotoPointLeftMenu] Opening file:', file.id, 'and highlighting point:', lotoPoint.tagNumber);

    const currentFileId = this.builderState.currentFile()?.id;
    const isSameFile = currentFileId === file.id;

    // Clear any previous selection before switching files
    this.builderState.selectedShapeId.set(null);
    this.builderState.hoveredShapeId.set(null);

    // IMPORTANT: Set the loto point BEFORE setCurrentFile so it's available when equipment loads
    this.builderState.setCurrentLotoPoint(lotoPoint);
    this.builderState.showLotoPointInfoWindow(lotoPoint);

    if (isSameFile) {
      // File is already loaded - directly highlight the equipment
      console.log('[LotoBuilderLotoPointLeftMenu] Same file already loaded, highlighting directly');
      this.highlightLotoPointEquipment(lotoPoint);
    } else {
      // Different file - set it and let the subscription handle highlighting
      this.currentFileService.setCurrentFile(file);
    }
  }

  /**
   * Highlight equipment associated with selected LOTO point (when file is already loaded)
   */
  private highlightLotoPointEquipment(lotoPoint: LotoPointDto): void {
    const equipment = this.builderState.currentEquipment();
    console.log('[LotoBuilderLotoPointLeftMenu] Looking for equipment with lotoPoint:', lotoPoint.id);

    const matchingEquipment = equipment.find(eq =>
      eq.lotoPoints && eq.lotoPoints.some(lp => lp.id === lotoPoint.id)
    );

    if (matchingEquipment) {
      console.log('[LotoBuilderLotoPointLeftMenu] Found matching equipment:', matchingEquipment.id);
      this.builderState.hoveredShapeId.set(matchingEquipment.id);
      this.builderState.selectedShapeId.set(matchingEquipment.id);
      this.builderState.hoveredLotoPoint.set(lotoPoint);
    } else {
      console.log('[LotoBuilderLotoPointLeftMenu] No equipment found for LOTO point:', lotoPoint.tagNumber);
    }
  }

  /**
   * Refresh the current grouping
   */
  refresh(): void {
    this.loadLotoPoints(this.selectedGrouping());
  }
}
