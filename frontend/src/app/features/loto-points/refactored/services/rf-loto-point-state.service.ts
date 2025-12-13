
import { Injectable } from "@angular/core";
import { LotoPointDto } from "../../../../models/loto/loto-point.model";
import { BehaviorSubject, Observable } from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class RfLotoPointStateService {
  private pageSize = 50; // Load 50 items at a time
  private currentPage = 1;
  
  private allLoadedLotoPoints = new BehaviorSubject<LotoPointDto[]>([]);
  allShapes$ = this.allLoadedLotoPoints.asObservable();

  addLotoPoints(items: LotoPointDto[]): void {
    const current = this.allLoadedLotoPoints.value;
    this.allLoadedLotoPoints.next([...current, ...items]);
  }

  clearLotoPoints(): void {
    this.allLoadedLotoPoints.next([]);
    this.currentPage = 1;
  }

  getCurrentPage(): number {
    return this.currentPage;
  }

  incrementPage(): void {
    this.currentPage++;
  }
}