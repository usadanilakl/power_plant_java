import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatus, APP_DISPLAY_NAME } from '../../../services/electron.service';

@Component({
  selector: 'app-permits-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="feature-card permits-card" [class.disabled]="status.state !== 'running'">
      <div class="feature-icon"><span class="material-icons" style="color: #8b5cf6">assignment</span></div>
      <div class="feature-info">
        <h3>Permits</h3>
        <p class="feature-desc">Work requests, LOTOs, permits</p>
      </div>
      <div class="permit-items" *ngIf="!editMode">
        <a class="permit-item" [routerLink]="['/pid-app']" [queryParams]="{ path: 'loto/loto' }">
          <span>Active LOTOs</span>
          <span class="item-placeholder">--</span>
        </a>
        <a class="permit-item" [routerLink]="['/pid-app']" [queryParams]="{ path: 'permit-builder/work-requests' }">
          <span>Work Requests</span>
          <span class="wr-counts">
            <span class="count-badge active-badge" *ngIf="activeWorkRequestCount !== null && activeWorkRequestCount > 0"
                  title="Active">{{ activeWorkRequestCount }}</span>
            <span class="count-badge new-badge" *ngIf="newWorkRequestCount !== null && newWorkRequestCount > 0"
                  title="New">{{ newWorkRequestCount }}<span class="new-dot">*</span></span>
          </span>
        </a>
      </div>
      <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
        {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
      </span>
    </div>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 12px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal);
      overflow-y: auto;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    :host { display: block; height: 100%; }
    .feature-card { height: 100%; box-sizing: border-box; }
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); }
    .feature-status.requires-sb { color: var(--text-muted); }
    .permits-card { cursor: default; }
    .permits-card.disabled .permit-item { pointer-events: none; opacity: 0.4; }
    .permit-items { display: flex; flex-direction: column; gap: 2px; margin-top: 4px; }
    .permit-item {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 10px; border-radius: 6px; font-size: 13px;
      color: var(--text-secondary); text-decoration: none; cursor: pointer;
      transition: background-color 150ms;
    }
    .permit-item:hover { background-color: var(--bg-secondary); }
    .item-placeholder { font-size: 12px; color: var(--text-muted); }
    .wr-counts { display: flex; gap: 6px; align-items: center; }
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      font-size: 11px; font-weight: 700; color: #fff;
    }
    .count-badge.new-badge { background-color: var(--accent-warning); position: relative; }
    .count-badge.active-badge { background-color: var(--accent-primary); }
    .new-dot { position: absolute; top: -3px; right: -3px; font-size: 10px; font-weight: 700; color: var(--accent-warning); }
  `]
})
export class PermitsWidgetComponent {
  @Input() status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  @Input() activeWorkRequestCount: number | null = null;
  @Input() newWorkRequestCount: number | null = null;
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;
  appName = APP_DISPLAY_NAME;
}
