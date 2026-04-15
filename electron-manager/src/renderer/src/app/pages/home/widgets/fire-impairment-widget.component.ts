import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatus, APP_DISPLAY_NAME } from '../../../services/electron.service';

@Component({
  selector: 'app-fire-impairment-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/fire-impairment'" [class.no-navigate]="editMode"
       [class.compact]="isCompact">

      <!-- COMPACT (1x1) -->
      <ng-container *ngIf="isCompact">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #ef4444">local_fire_department</span>
          <h3>Fire Impairment</h3>
        </div>
        <div class="compact-metric" *ngIf="activeImpairmentCount !== null && activeImpairmentCount > 0">
          <span class="metric-number warning">{{ activeImpairmentCount }}</span>
          <span class="metric-label">active</span>
        </div>
        <div class="compact-metric" *ngIf="!activeImpairmentCount || activeImpairmentCount === 0">
          <span class="metric-label ok">No active impairments</span>
        </div>
        <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
          {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
        </span>
      </ng-container>

      <!-- STANDARD (2x1+) -->
      <ng-container *ngIf="!isCompact">
        <div class="feature-icon"><span class="material-icons" style="color: #ef4444">local_fire_department</span></div>
        <div class="feature-info">
          <h3>Fire Impairment</h3>
          <p class="feature-desc">Manage fire protection impairments</p>
          <div class="imp-count" *ngIf="activeImpairmentCount !== null && activeImpairmentCount > 0">
            <span class="count-badge">{{ activeImpairmentCount }}</span>
            active impairment{{ activeImpairmentCount !== 1 ? 's' : '' }}
          </div>
          <div class="no-imp" *ngIf="!activeImpairmentCount || activeImpairmentCount === 0">
            No active impairments
          </div>
        </div>
        <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
          {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
        </span>
      </ng-container>
    </a>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 10px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      overflow-y: auto; height: 100%; box-sizing: border-box;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
    :host { display: block; height: 100%; }

    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-metric { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
    .metric-number { font-size: 20px; font-weight: 700; }
    .metric-number.warning { color: var(--accent-warning); }
    .metric-label { font-size: 11px; color: var(--text-secondary); }
    .metric-label.ok { color: var(--accent-success); }

    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); }
    .feature-status.requires-sb { color: var(--text-muted); }
    .imp-count { font-size: 12px; color: var(--accent-warning); margin-top: 4px; display: flex; align-items: center; gap: 6px; }
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      font-size: 11px; font-weight: 700; color: #fff; background-color: var(--accent-warning);
    }
    .no-imp { font-size: 12px; color: var(--accent-success); margin-top: 4px; }
  `]
})
export class FireImpairmentWidgetComponent {
  @Input() status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  @Input() activeImpairmentCount: number | null = null;
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;
  appName = APP_DISPLAY_NAME;

  get isCompact(): boolean { return this.cols === 1 && this.rows === 1; }
}
