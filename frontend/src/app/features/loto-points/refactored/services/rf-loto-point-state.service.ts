
import { Injectable, signal } from "@angular/core";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";
import { BehaviorSubject, Observable } from "rxjs";

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
}