import { Injectable, inject, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, catchError, of, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { LotoPointSummaryDto } from '../../../../models/loto/loto-point-summary.model';
import { RfLotoPointApiService } from './rf-loto-point-api.service';
import { LotoPointCacheService } from '../../../../services/loto-point-cache.service';
import { EquipmentDto } from '../../../../models/equipment/equipment.model';
import { FileDto } from '../../../../models/file/file.model';

export type GroupingCriteria = 'equipmentType' | 'location' | 'file' | 'system' | 'unit' | 'zeroEnergyMethod';

/**
 * Service for managing the LOTO Point left menu
 * Handles grouping, filtering, and virtual scrolling of large LOTO point datasets
 * Also manages LOTO point selection and associated equipment/file navigation
 */
@Injectable({
  providedIn: 'root'
})
export class RfLotoPointLeftMenuService {
  private apiService = inject(RfLotoPointApiService);
  private cacheService = inject(LotoPointCacheService);
  private destroyRef = inject(DestroyRef);

  // State management for menu
  private menuDataSubject = new BehaviorSubject<NestedItem[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // State management for selection
  private selectedLotoPointSubject = new BehaviorSubject<LotoPointDto | null>(null);
  private selectedEquipmentSubject = new BehaviorSubject<EquipmentDto | null>(null);
  private selectedFileSubject = new BehaviorSubject<FileDto | null>(null);

  // Public observables for menu
  menuData$ = this.menuDataSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  // Public observables for selection
  selectedLotoPoint$ = this.selectedLotoPointSubject.asObservable();
  selectedEquipment$ = this.selectedEquipmentSubject.asObservable();
  selectedFile$ = this.selectedFileSubject.asObservable();

  // Cache for grouped menu data
  private groupedDataCache = new Map<GroupingCriteria, NestedItem[]>();

  // Track the last requested grouping to load it once cache is ready
  private pendingGrouping: GroupingCriteria | null = null;

  constructor() {
    // Subscribe to cache service loaded state
    this.cacheService.summariesLoaded$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (loaded) => {
        if (loaded) {
          this.isLoadingSubject.next(false);

          // If there's a pending grouping request, load it now that cache is ready
          if (this.pendingGrouping) {
            const grouping = this.pendingGrouping;
            this.pendingGrouping = null;
            this.loadGroupedLotoPoints(grouping);
          }
        } else {
          this.isLoadingSubject.next(true);
        }
      },
      error: (error) => {
        this.errorSubject.next(error.message);
      }
    });

    // Subscribe to cache updates to invalidate grouped cache
    this.cacheService.summariesUpdated$.pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => {
        this.groupedDataCache.clear();
      }
    });
  }

  /**
   * Load LOTO points grouped by specified criteria
   * Uses cached summaries and groups them client-side for instant performance
   */
  loadGroupedLotoPoints(groupBy: GroupingCriteria): void {
    // Check grouped cache first
    const cachedGroupedData = this.groupedDataCache.get(groupBy);
    if (cachedGroupedData) {
      this.menuDataSubject.next(cachedGroupedData);
      return;
    }

    // Get all summaries from cache service
    const summaries = this.cacheService.getAllSummaries();

    if (summaries.length === 0) {
      // Store this grouping request to execute when cache is ready
      this.pendingGrouping = groupBy;
      this.isLoadingSubject.next(true);
      return;
    }

    // Group summaries client-side
    const nestedItems = this.groupSummaries(summaries, groupBy);

    // Cache the grouped result
    this.groupedDataCache.set(groupBy, nestedItems);
    this.menuDataSubject.next(nestedItems);
  }

  /**
   * Group LOTO point summaries by specified criteria (client-side)
   */
  private groupSummaries(summaries: LotoPointSummaryDto[], groupBy: GroupingCriteria): NestedItem[] {
    // Create a map to group summaries
    const grouped = new Map<string, LotoPointSummaryDto[]>();

    summaries.forEach(summary => {
      let groupKey: string;

      // Determine group key based on criteria
      switch (groupBy) {
        case 'equipmentType':
          groupKey = summary.equipmentType || 'Unknown';
          break;
        case 'location':
          groupKey = summary.location || 'Unknown';
          break;
        case 'file':
          groupKey = summary.fileName || 'Unknown';
          break;
        case 'system':
          groupKey = summary.system || 'Unknown';
          break;
        case 'unit':
          groupKey = summary.unit || 'Unknown';
          break;
        case 'zeroEnergyMethod':
          groupKey = summary.zeroEnergyMethod || 'Unknown';
          break;
        default:
          groupKey = 'Unknown';
      }

      if (!grouped.has(groupKey)) {
        grouped.set(groupKey, []);
      }
      grouped.get(groupKey)!.push(summary);
    });

    // Convert to NestedItem structure
    return Array.from(grouped.entries()).map(([groupName, summariesInGroup]) => {
      const parentItem = new NestedItemImpl({
        id: `${groupBy}_${groupName}`,
        name: `${groupName} (${summariesInGroup.length})`,
        isExpanded: false,
        objectType: groupBy,
        color: this.getGroupColor(groupBy)
      });

      parentItem.values = summariesInGroup.map(summary =>
        new NestedItemImpl({
          id: summary.id.toString(),
          name: this.getSummaryDisplayName(summary),
          isExpanded: false,
          objectType: 'LotoPoint',
          color: this.getSummaryColor(summary)
        })
      );

      return parentItem;
    });
  }

  /**
   * Get display name for a LOTO point summary in the menu
   */
  private getSummaryDisplayName(summary: LotoPointSummaryDto): string {
    const parts: string[] = [];

    if (summary.tagNumber) {
      parts.push(summary.tagNumber);
    }

    if (summary.description) {
      parts.push(summary.description);
    }

    return parts.length > 0 ? parts.join(' - ') : `LOTO Point #${summary.id}`;
  }

  /**
   * Get color for LOTO point summary based on status
   */
  private getSummaryColor(summary: LotoPointSummaryDto): string {
    // Red: Missing critical information
    if (!summary.tagNumber || !summary.description) {
      return 'red';
    }

    // Yellow: Not verified
    if (!summary.isVerified) {
      return 'yellow';
    }

    // Green: Complete and verified
    return 'green';
  }

  /**
   * Get color for group headers
   */
  private getGroupColor(groupBy: GroupingCriteria): string {
    const colorMap: Record<GroupingCriteria, string> = {
      equipmentType: '#4CAF50',
      location: '#2196F3',
      file: '#FF9800',
      system: '#9C27B0',
      unit: '#00BCD4',
      zeroEnergyMethod: '#F44336'
    };

    return colorMap[groupBy] || '#757575';
  }

  /**
   * Clear the cache for a specific grouping or all groupings
   */
  clearCache(groupBy?: GroupingCriteria): void {
    if (groupBy) {
      this.groupedDataCache.delete(groupBy);
    } else {
      this.groupedDataCache.clear();
    }
  }

  /**
   * Refresh data by clearing cache and reloading from server
   */
  refresh(groupBy?: GroupingCriteria): void {
    if (groupBy) {
      this.clearCache(groupBy);
    } else {
      this.clearCache();
    }
    // Refresh summaries from server
    this.cacheService.refresh();
  }

  /**
   * Select a LOTO point from NestedItem (toggle menu)
   * Fetches the full LOTO point data and navigates to associated equipment and file
   */
  selectLotoPointFromNestedItem(lotoPointItem: NestedItem): void {
    // Only handle leaf items (actual LOTO points, not group headers)
    if (lotoPointItem.objectType !== 'LotoPoint') {
      return;
    }

    const lotoPointId = typeof lotoPointItem.id === 'number'
      ? lotoPointItem.id.toString()
      : lotoPointItem.id;

    // Fetch the full LOTO point data to get equipment references
    this.apiService.getLotoPointById(lotoPointId).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response: any) => {
        const lotoPoint = response.responseData;
        this.selectedLotoPointSubject.next(lotoPoint);

        // Get the first equipment from the LOTO point
        const equipmentList = lotoPoint.equipmentList;
        if (equipmentList && equipmentList.length > 0) {
          const firstEquipment = equipmentList[0];
          this.selectedEquipmentSubject.next(firstEquipment);

          // Get the file from the equipment's mainFileObject
          if (firstEquipment.mainFileObject) {
            this.selectedFileSubject.next(firstEquipment.mainFileObject);
          } else if (firstEquipment.mainFileId) {
            // Create a minimal FileDto with just the ID - CurrentFileService will fetch complete data
            const minimalFile = new FileDto({ id: firstEquipment.mainFileId });
            this.selectedFileSubject.next(minimalFile);
          } else {
            this.selectedFileSubject.next(null);
          }
        } else {
          this.selectedEquipmentSubject.next(null);
          this.selectedFileSubject.next(null);
        }
      }),
      catchError((error) => {
        this.errorSubject.next(error.message || 'Failed to load LOTO point');
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Get the currently selected LOTO point
   */
  getSelectedLotoPoint(): LotoPointDto | null {
    return this.selectedLotoPointSubject.getValue();
  }

  /**
   * Get the currently selected equipment (from selected LOTO point)
   */
  getSelectedEquipment(): EquipmentDto | null {
    return this.selectedEquipmentSubject.getValue();
  }

  /**
   * Get the currently selected file (from selected equipment)
   */
  getSelectedFile(): FileDto | null {
    return this.selectedFileSubject.getValue();
  }

  /**
   * Clear all selections
   */
  clearSelections(): void {
    this.selectedLotoPointSubject.next(null);
    this.selectedEquipmentSubject.next(null);
    this.selectedFileSubject.next(null);
  }

  /**
   * Reset service state (call when closing dialog or switching modes)
   */
  reset(): void {
    this.clearSelections();
    // Note: We keep the menu data cache for performance
  }
}
