import { DestroyRef, inject, Injectable } from '@angular/core';
import { BehaviorSubject, forkJoin, Observable, Subject } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPointSummaryDto } from '../models/loto/loto-point-summary.model';
import { RfLotoPointApiService } from '../features/loto-points/refactored/services/rf-loto-point-api.service';

/**
 * Cache service for LOTO Point summaries
 * Similar to CurrentFileService but for LOTO points
 * Loads all summaries at startup and caches them in memory
 */
@Injectable({
  providedIn: 'root'
})
export class LotoPointCacheService {
  private apiService = inject(RfLotoPointApiService);
  private destroyRef = inject(DestroyRef);

  // State
  private summariesSubject = new BehaviorSubject<LotoPointSummaryDto[]>([]);
  summaries$ = this.summariesSubject.asObservable();

  private summariesLoadedSubject = new BehaviorSubject<boolean>(false);
  summariesLoaded$ = this.summariesLoadedSubject.asObservable();

  private summariesUpdatedSubject = new Subject<void>();
  summariesUpdated$ = this.summariesUpdatedSubject.asObservable();

  private isLoadingSubject = new BehaviorSubject<boolean>(false);
  isLoading$ = this.isLoadingSubject.asObservable();

  private errorSubject = new BehaviorSubject<string | null>(null);
  error$ = this.errorSubject.asObservable();

  constructor() {
    // Load summaries at startup
    this.loadAllSummaries();
  }

  /**
   * Load all LOTO point summaries from server
   * This is called once at app startup
   */
  private loadAllSummaries(): void {
    const startTime = performance.now();
    console.log('Loading LOTO point summaries...');

    this.isLoadingSubject.next(true);
    this.errorSubject.next(null);

    this.apiService.getSummaries().pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: (response) => {
        const summaries = response.responseData.map((s: any) =>
          LotoPointSummaryDto.fromJson(s)
        );

        this.summariesSubject.next(summaries);
        this.summariesLoadedSubject.next(true);
        this.isLoadingSubject.next(false);

        const endTime = performance.now();
        console.log(`Loaded ${summaries.length} LOTO point summaries in ${endTime - startTime}ms`);
        console.log(`Payload size estimate: ${JSON.stringify(response.responseData).length / 1024}KB`);
      },
      error: (error) => {
        console.error('Error loading LOTO point summaries:', error);
        this.errorSubject.next(error.message || 'Failed to load LOTO point summaries');
        this.isLoadingSubject.next(false);
        this.summariesLoadedSubject.next(true); // Still mark as loaded to unblock UI
      }
    });
  }

  /**
   * Get all cached summaries
   */
  getAllSummaries(): LotoPointSummaryDto[] {
    return this.summariesSubject.getValue();
  }

  /**
   * Get summary by ID
   */
  getSummaryById(id: number): LotoPointSummaryDto | undefined {
    return this.summariesSubject.getValue().find(s => s.id === id);
  }

  /**
   * Filter summaries by criteria
   */
  filterSummaries(predicate: (summary: LotoPointSummaryDto) => boolean): LotoPointSummaryDto[] {
    return this.summariesSubject.getValue().filter(predicate);
  }

  /**
   * Refresh summaries from server
   */
  refresh(): void {
    this.loadAllSummaries();
  }

  /**
   * Trigger update notification without reloading
   * Use when a LOTO point is updated and you want to trigger UI refresh
   */
  notifyUpdated(): void {
    this.summariesUpdatedSubject.next();
  }
}
