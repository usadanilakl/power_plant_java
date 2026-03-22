import { Component, inject, OnInit, OnDestroy, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';

@Component({
  selector: 'app-loto-board',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout header="LOTO Board">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="board-container">
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
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .board-container { padding: 16px; }
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
  `]
})
export class LotoBoardComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);

  lotos = signal<any[]>([]);
  loading = signal(true);
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
}
