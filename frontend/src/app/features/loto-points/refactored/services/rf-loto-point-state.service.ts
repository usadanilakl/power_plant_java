
import { Injectable, signal } from "@angular/core";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";
import { BehaviorSubject, Observable } from "rxjs";
import { SearchCriteria } from "../../../../models/api/search-criteria.model";

@Injectable({
  providedIn: 'root'
})
export class RfLotoPointStateService {
  private pageSize = 50; // Load 50 items at a time
  private currentPage = 1;
  
  private allLoadedLotoPointsSubject = new BehaviorSubject<LotoPointDto[]>([]);
  allLoadedLotoPoints$ = this.allLoadedLotoPointsSubject.asObservable();
  
  filterOutItems = signal<LotoPointDto[]>([]);

  selectedItems = signal<LotoPointDto[]>([]);
  
  // Add sort state
  private currentSortColumnSubject = new BehaviorSubject<string | null>(null);
  currentSortColumn$ = this.currentSortColumnSubject.asObservable();

  private currentSortDirectionSubject = new BehaviorSubject<'ASC' | 'DESC'>('ASC');
  currentSortDirection$ = this.currentSortDirectionSubject.asObservable();

  private currentSearchCriteriaSubject = new BehaviorSubject<SearchCriteria | null>(null);
  currentSearchCriteria$ = this.currentSearchCriteriaSubject.asObservable();

  addLotoPoints(items: LotoPointDto[]): void {
    const current = this.allLoadedLotoPointsSubject.value;
    this.allLoadedLotoPointsSubject.next([...current, ...items]);
  }

  clearLotoPoints(): void {
    this.allLoadedLotoPointsSubject.next([]);
    this.currentPage = 1;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  incrementPage(): void {
    this.currentPage++;
  }
  setSelectedLotoPoints(items: LotoPointDto[]) {
    this.selectedItems.set(items);
  }
  resetPage() {
    this.currentPage = 1;
  }


  // Sorting
  
  setSortState(sortColumn: string, sortDirection: 'ASC' | 'DESC'): void {
    this.currentSortColumnSubject.next(sortColumn);
    this.currentSortDirectionSubject.next(sortDirection);
  }

  setSearchCriteria(criteria: SearchCriteria): void {
    this.currentSearchCriteriaSubject.next(criteria);
  }

  getCurrentSearchCriteria(): SearchCriteria | null {
    return this.currentSearchCriteriaSubject.value;
  }

  clearSortState(): void {
    this.currentSortColumnSubject.next(null);
    this.currentSortDirectionSubject.next('ASC');
    this.currentSearchCriteriaSubject.next(null);
  }
}