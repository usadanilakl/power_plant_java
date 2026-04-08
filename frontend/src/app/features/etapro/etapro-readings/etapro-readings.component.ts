import { Component, inject, OnInit, signal, computed, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { toSignal, takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { BehaviorSubject } from 'rxjs';
import { TableComponent } from '../../../shared/table/refactored/table.component';
import { EtaProApiService } from '../services/etapro-api.service';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProMapperService } from '../services/etapro-mapper.service';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';

@Component({
  selector: 'app-etapro-readings',
  standalone: true,
  imports: [CommonModule, FormsModule, TableComponent],
  template: `
    <div class="readings-container">
      <div class="filters">
        <div class="filter-group">
          <label>Point:</label>
          <select [(ngModel)]="selectedPointId" (ngModelChange)="onFilterChange()">
            <option value="">All Points</option>
            @for (point of points(); track point.id) {
              <option [value]="point.pointId">{{ point.pointId }} — {{ point.description }}</option>
            }
          </select>
        </div>
        <div class="filter-group">
          <label>From:</label>
          <input type="datetime-local" [(ngModel)]="startTime" (ngModelChange)="onFilterChange()">
        </div>
        <div class="filter-group">
          <label>To:</label>
          <input type="datetime-local" [(ngModel)]="endTime" (ngModelChange)="onFilterChange()">
        </div>
        <button class="btn btn-search" (click)="onSearch()">Search</button>
        <span class="result-count">{{ readings().length }} readings</span>
      </div>

      <app-table
        [tableId]="'etapro-readings-table'"
        [items]="readings()"
        [columns]="columns()">
      </app-table>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .readings-container { display: flex; flex-direction: column; flex: 1; min-height: 0; overflow: hidden; }
    .filters {
      display: flex; align-items: center; gap: 12px; flex-wrap: wrap;
      margin-bottom: 8px; flex-shrink: 0;
    }
    .filter-group { display: flex; align-items: center; gap: 4px; }
    .filter-group label { font-size: 13px; color: var(--secondary-text); white-space: nowrap; }
    .filter-group select, .filter-group input {
      padding: 5px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 13px;
    }
    .filter-group select { min-width: 200px; }
    .btn {
      padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px;
    }
    .btn-search { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }
    .btn-search:hover { opacity: 0.9; }
    .result-count { font-size: 13px; color: var(--secondary-text); }
    app-table { flex: 1; min-height: 0; overflow: hidden; }
  `]
})
export class EtaProReadingsComponent implements OnInit {
  private apiService = inject(EtaProApiService);
  private stateService = inject(EtaProStateService);
  private mapperService = inject(EtaProMapperService);
  private destroyRef = inject(DestroyRef);

  points = toSignal(this.stateService.allPoints$, { initialValue: [] as EtaProPointDto[] });
  columns = signal(this.mapperService.toReadingTableColumns());

  private readingsSubject = new BehaviorSubject<EtaProReadingDto[]>([]);
  readings = toSignal(this.readingsSubject.asObservable(), { initialValue: [] as EtaProReadingDto[] });

  selectedPointId = '';
  startTime = '';
  endTime = '';

  ngOnInit(): void {
    this.stateService.loadPoints();
    // Default: last 24 hours
    const now = new Date();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    this.endTime = this.toLocalDateTimeString(now);
    this.startTime = this.toLocalDateTimeString(yesterday);
    this.onSearch();
  }

  onFilterChange(): void {
    // Debounce is handled by explicit search button
  }

  onSearch(): void {
    if (!this.startTime || !this.endTime) return;

    if (this.selectedPointId) {
      this.apiService.getReadings(this.selectedPointId, this.startTime, this.endTime).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(res => {
        const readings = (res.responseData || []).map((r: any) => EtaProReadingDto.fromJson(r));
        this.readingsSubject.next(readings);
      });
    } else {
      this.apiService.getReadingsPaginated({
        startTime: this.startTime,
        endTime: this.endTime,
        page: 1,
        pageSize: 500
      }).pipe(
        takeUntilDestroyed(this.destroyRef)
      ).subscribe(res => {
        const readings = (res.responseData?.content || []).map((r: any) => EtaProReadingDto.fromJson(r));
        this.readingsSubject.next(readings);
      });
    }
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
