import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { LotoBoxGridComponent } from '../../loto/loto-boxes/loto-box-grid/loto-box-grid.component';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { GlobalMessageService } from '../../../shared/global-message/global-message.service';

@Component({
  selector: 'app-loto-board',
  standalone: true,
  imports: [CommonModule, MatButtonToggleModule, MatButtonModule, MatIconModule, MatTooltipModule, LotoBoxGridComponent],
  template: `
        <div class="board-container">
          <div class="board-toolbar">
            <mat-button-toggle-group [value]="viewMode()" (change)="viewMode.set($event.value)">
              <mat-button-toggle value="grid"><mat-icon>grid_view</mat-icon> Box Grid</mat-button-toggle>
              <mat-button-toggle value="table"><mat-icon>table_rows</mat-icon> Table</mat-button-toggle>
            </mat-button-toggle-group>

            @if (viewMode() === 'grid') {
              <button mat-stroked-button color="primary"
                      [disabled]="resyncing()"
                      (click)="resyncLightsToLotoStatus()"
                      matTooltip="Overwrites every box's LED color from the current LOTO permit status in the database. Use when the physical box lights are out of sync with the DB."
                      class="resync-btn">
                <mat-icon>sync</mat-icon>
                {{ resyncing() ? 'Syncing…' : 'Sync Lights to LOTO Status' }}
              </button>
            }
          </div>

          @if (viewMode() === 'table') {
            <!-- TABLE VIEW -->
            @if (loading()) {
              <div class="loading">Loading active LOTOs...</div>
            } @else if (lotos().length === 0) {
              <div class="empty">No LOTOs in Building/Active/Test at this time.</div>
            } @else {
              <div class="board-header">
                <span class="count">{{ lotos().length }} LOTO(s) — Building/Active/Test</span>
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
            <!-- BOX GRID VIEW: full-featured grid with edit mode + lock/comment management -->
            <app-loto-box-grid></app-loto-box-grid>
          }
        </div>
  `,
  styles: [`
    .board-container { padding: 16px; }
    .board-toolbar { display: flex; gap: 12px; align-items: center; margin-bottom: 16px; flex-wrap: wrap; }
    .resync-btn { margin-left: auto; }
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
    .status-badge[data-status="Building"] { background: rgba(158,158,158,0.2); color: #bdbdbd; }

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
  private messageService = inject(GlobalMessageService);

  lotos = signal<any[]>([]);
  loading = signal(true);
  // Grid is the primary at-a-glance view of the LOTO board — the physical box wall the ops team
  // reads. The table is a secondary flat listing kept behind the toggle.
  viewMode = signal<'table' | 'grid'>('grid');
  resyncing = signal(false);
  private refreshInterval: any;

  ngOnInit(): void {
    this.loadLotos();
    this.refreshInterval = setInterval(() => this.loadLotos(), 60000);
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

  /**
   * Rebuild every box's LED color from current LOTO state in the database and push to the
   * physical WLED controllers. Uses the existing /ng/loto-boxes/reconcile endpoint which:
   *   1. Clears every box→loto link,
   *   2. Re-links each open LOTO (by boxNumber) to its box,
   *   3. Repaints via updateBoxColorForStatus → queues a WLED full-array push per ESP.
   * This is the recovery path when physical lights drift from DB reality.
   */
  resyncLightsToLotoStatus(): void {
    if (this.resyncing()) return;
    if (!confirm('Overwrite every box\'s LED color from current LOTO state in the DB? Manual-override boxes are preserved.')) return;
    this.resyncing.set(true);
    this.messageService.showLoading('Syncing lights to LOTO status…');
    this.http.post<any>('/ng/loto-boxes/reconcile', {}).subscribe({
      next: (res) => {
        this.resyncing.set(false);
        this.messageService.showSuccess(res?.message ?? 'Lights synced');
      },
      error: (err) => {
        this.resyncing.set(false);
        this.messageService.showError(err?.error?.message ?? err?.message ?? 'Failed to sync lights');
      },
    });
  }
}
