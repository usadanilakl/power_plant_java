import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { LotoBoxService } from '../../loto/loto-boxes/loto-box-grid/loto-box.service';
import { LotoBoxDto } from '../../../models/loto/loto-box.model';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-loto-board',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule, MatButtonModule, MatIconModule],
  template: `
        <div class="board-container">
          <div class="board-toolbar">
            <mat-button-toggle-group [value]="viewMode()" (change)="viewMode.set($event.value)">
              <mat-button-toggle value="table"><mat-icon>table_rows</mat-icon> Table</mat-button-toggle>
              <mat-button-toggle value="grid"><mat-icon>grid_view</mat-icon> Box Grid</mat-button-toggle>
            </mat-button-toggle-group>
            @if (viewMode() === 'grid') {
              <button mat-stroked-button (click)="syncAllBoxes()"><mat-icon>sync</mat-icon> Sync All</button>
            }
          </div>

          @if (viewMode() === 'table') {
            <!-- TABLE VIEW -->
            @if (loading()) {
              <div class="loading">Loading active LOTOs...</div>
            } @else if (lotos().length === 0) {
              <div class="empty">No active LOTOs at this time.</div>
            } @else {
              <div class="board-header">
                <span class="count">{{ lotos().length }} Active LOTO(s)</span>
              </div>
              <table class="loto-table">
                <thead>
                  <tr>
                    <th>Permit #</th>
                    <th>Equipment / System</th>
                    <th>Work Area</th>
                    <th>Package</th>
                    <th>Locks</th>
                    <th>Points</th>
                    <th>Box</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  @for (loto of lotos(); track loto.id) {
                    <tr>
                      <td class="permit-num">{{ loto.permitNumber }}</td>
                      <td>{{ loto.equipmentSystem || '-' }}</td>
                      <td>{{ loto.workArea || '-' }}</td>
                      <td class="pkg-num">{{ loto.packageNumber }}</td>
                      <td class="center">{{ loto.lockCount }}</td>
                      <td class="center">{{ loto.pointCount }}</td>
                      <td class="center">{{ loto.boxNumber || '-' }}</td>
                      <td>
                        <span class="status-badge" [attr.data-status]="loto.packageStatus">
                          {{ loto.packageStatus === 'Test' ? 'Paused' : loto.packageStatus }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          } @else {
            <!-- BOX GRID VIEW -->
            <div class="box-grid">
              @for (box of boxes(); track box.id) {
                <div class="box-tile"
                     [style.background-color]="'rgb(' + box.r + ',' + box.g + ',' + box.b + ')'"
                     [style.opacity]="(box.brightness ?? 255) / 255"
                     [class.has-loto]="box.loto?.id"
                     (click)="onBoxClick(box)">
                  <span class="box-number">{{ box.number }}</span>
                  @if (box.loto?.id) {
                    <span class="box-loto-indicator">LOTO</span>
                  }
                </div>
              }
            </div>
          }
        </div>
  `,
  styles: [`
    .board-container { padding: 16px; }
    .board-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; }
    .loading, .empty { text-align: center; padding: 3rem; color: #888; font-style: italic; }
    .board-header { margin-bottom: 12px; }
    .count { font-size: 1rem; font-weight: 600; color: #ddd; }

    .loto-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--surface-color, #16213e);
      border-radius: 8px;
      overflow: hidden;
    }
    .loto-table th {
      background: var(--header-background, #0f3460);
      color: #aaa;
      padding: 10px 12px;
      text-align: left;
      font-size: 0.8rem;
      font-weight: 500;
      text-transform: uppercase;
    }
    .loto-table td {
      padding: 10px 12px;
      color: #ddd;
      border-top: 1px solid rgba(255,255,255,0.05);
      font-size: 0.85rem;
    }
    .loto-table tr:hover td { background: rgba(255,255,255,0.03); }
    .permit-num { font-weight: 600; color: var(--accent-color, #82b1ff); }
    .pkg-num { color: #aaa; }
    .center { text-align: center; }

    .status-badge {
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
    }
    .status-badge[data-status="Active"] { background: rgba(76,175,80,0.2); color: #81c784; }
    .status-badge[data-status="Test"] { background: rgba(255,152,0,0.2); color: #ffb74d; }

    .box-grid {
      display: grid;
      grid-template-columns: repeat(12, 1fr);
      gap: 6px;
    }
    .box-tile {
      aspect-ratio: 1;
      border-radius: 8px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border: 2px solid transparent;
      transition: border-color 0.2s, transform 0.1s;
      min-height: 60px;
    }
    .box-tile:hover { border-color: rgba(255,255,255,0.4); transform: scale(1.05); }
    .box-tile.has-loto { border-color: rgba(255,255,255,0.2); }
    .box-number { font-size: 1.1rem; font-weight: 700; color: white; text-shadow: 0 1px 3px rgba(0,0,0,0.8); }
    .box-loto-indicator { font-size: 0.55rem; font-weight: 600; color: white; text-shadow: 0 1px 2px rgba(0,0,0,0.8); }
  `]
})
export class LotoBoardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private lotoBoxService = inject(LotoBoxService);
  private router = inject(Router);

  lotos = signal<any[]>([]);
  boxes = signal<LotoBoxDto[]>([]);
  loading = signal(true);
  viewMode = signal<'table' | 'grid'>('table');
  private refreshInterval: any;

  ngOnInit(): void {
    this.loadLotos();
    this.loadBoxGrid();
    this.refreshInterval = setInterval(() => {
      this.loadLotos();
      if (this.viewMode() === 'grid') this.loadBoxGrid();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.refreshInterval) clearInterval(this.refreshInterval);
  }

  private loadLotos(): void {
    this.http.get<any>('/ng/daily-permit-packages/loto-board').subscribe({
      next: (res) => {
        this.lotos.set(res.responseData ?? []);
        this.loading.set(false);
      },
      error: () => this.loading.set(false)
    });
  }

  private loadBoxGrid(): void {
    this.lotoBoxService.getBoxGrid().subscribe({
      next: (res) => {
        if (res.responseData) {
          this.boxes.set(res.responseData.map((b: any) => LotoBoxDto.fromJson(b)));
        }
      }
    });
  }

  onBoxClick(box: LotoBoxDto): void {
    if (box.loto?.id) {
      this.router.navigate(['/permit-builder/lotos'], { queryParams: { id: box.loto?.id } });
    }
  }

  syncAllBoxes(): void {
    this.lotoBoxService.syncAllBoxesToEsp().subscribe(() => this.loadBoxGrid());
  }
}
