import { Injectable, inject, DestroyRef } from '@angular/core';
import { BehaviorSubject, Observable, map, tap, catchError, of } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NestedItem, NestedItemImpl } from '../../../../models/ui/nested-item.model';
import { LotoPointDto } from '../../../../models/loto/loto-point.model';
import { RfLotoPointApiService } from './rf-loto-point-api.service';

export type GroupingCriteria = 'equipmentType' | 'location' | 'file' | 'system' | 'unit' | 'zeroEnergyMethod';

/**
 * Service for managing the LOTO Point left menu
 * Handles grouping, filtering, and virtual scrolling of large LOTO point datasets
 */
@Injectable({
  providedIn: 'root'
})
export class RfLotoPointLeftMenuService {
  private apiService = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  // State management
  private menuDataSubject = new BehaviorSubject<NestedItem[]>([]);
  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  private errorSubject = new BehaviorSubject<string | null>(null);

  // Public observables
  menuData$ = this.menuDataSubject.asObservable();
  isLoading$ = this.isLoadingSubject.asObservable();
  error$ = this.errorSubject.asObservable();

  // Cache for loaded data
  private groupedDataCache = new Map<GroupingCriteria, NestedItem[]>();

  /**
   * Load LOTO points grouped by specified criteria
   * Uses cache if available, otherwise fetches from server
   */
  loadGroupedLotoPoints(groupBy: GroupingCriteria): void {
    // Check cache first
    const cachedData = this.groupedDataCache.get(groupBy);
    if (cachedData) {
      console.log(`Loading ${groupBy} from cache`);
      this.menuDataSubject.next(cachedData);
      return;
    }

    // Load from server
    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    // TODO: Replace with actual server endpoint when backend is ready
    // For now, load all and group client-side
    this.loadAllAndGroup(groupBy);
  }

  /**
   * Load LOTO points from server grouped by the specified criteria
   */
  private loadAllAndGroup(groupBy: GroupingCriteria): void {
    this.apiService.getGroupedLotoPoints(groupBy).pipe(
      takeUntilDestroyed(this.destroyRef),
      tap((response) => {
        const nestedItems = this.transformToNestedItems(response.responseData, groupBy);
        this.groupedDataCache.set(groupBy, nestedItems);
        this.menuDataSubject.next(nestedItems);
        this.isLoadingSubject.next(false);
      }),
      catchError((error) => {
        console.error('Error loading grouped LOTO points:', error);
        this.errorSubject.next(error.message || 'Failed to load LOTO points');
        this.isLoadingSubject.next(false);
        return of(null);
      })
    ).subscribe();
  }

  /**
   * Transform server response to NestedItem structure for the toggle menu
   */
  private transformToNestedItems(groupedData: { [key: string]: LotoPointDto[] }, groupBy: GroupingCriteria): NestedItem[] {
    // groupedData structure expected from server:
    // {
    //   "Equipment Type": [LotoPointDto, LotoPointDto, ...],
    //   "Valve": [LotoPointDto, LotoPointDto, ...],
    //   ...
    // }

    return Object.entries(groupedData).map(([groupName, lotoPoints]: [string, any]) => {
      const parentItem = new NestedItemImpl({
        id: `${groupBy}_${groupName}`,
        name: `${groupName} (${lotoPoints.length})`,
        isExpanded: false,
        objectType: groupBy,
        color: this.getGroupColor(groupBy)
      });

      parentItem.values = (lotoPoints as LotoPointDto[]).map(lotoPoint =>
        new NestedItemImpl({
          id: lotoPoint.id.toString(),
          name: this.getLotoPointDisplayName(lotoPoint),
          isExpanded: false,
          objectType: 'LotoPoint',
          color: this.getLotoPointColor(lotoPoint)
        })
      );

      return parentItem;
    });
  }

  /**
   * Get display name for a LOTO point in the menu
   */
  private getLotoPointDisplayName(lotoPoint: LotoPointDto): string {
    const parts: string[] = [];

    if (lotoPoint.tagNumber) {
      parts.push(lotoPoint.tagNumber);
    }

    if (lotoPoint.description) {
      parts.push(lotoPoint.description);
    }

    return parts.length > 0 ? parts.join(' - ') : `LOTO Point #${lotoPoint.id}`;
  }

  /**
   * Get color for LOTO point based on status
   */
  private getLotoPointColor(lotoPoint: LotoPointDto): string {
    // Red: Missing critical information
    if (!lotoPoint.tagNumber || !lotoPoint.description) {
      return 'red';
    }

    // Yellow: Not verified
    if (!lotoPoint.isVerified) {
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
   * Refresh data by clearing cache and reloading
   */
  refresh(groupBy: GroupingCriteria): void {
    this.clearCache(groupBy);
    this.loadGroupedLotoPoints(groupBy);
  }
}
