import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatus, APP_DISPLAY_NAME } from '../../../services/electron.service';

@Component({
  selector: 'app-fire-impairment-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/fire-impairment'" [class.no-navigate]="editMode">
      <div class="feature-icon"><span class="material-icons" style="color: #ef4444">local_fire_department</span></div>
      <div class="feature-info">
        <h3>Fire Impairment</h3>
        <p class="feature-desc">Manage fire protection impairments</p>
        <div class="imp-count" *ngIf="activeImpairmentCount !== null && activeImpairmentCount > 0">
          <span class="count-badge">{{ activeImpairmentCount }}</span>
          active impairment{{ activeImpairmentCount !== 1 ? 's' : '' }}
        </div>
      </div>
      <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
        {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
      </span>
    </a>
  `,
  styles: [`
    .feature-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: all var(--transition-normal);
      cursor: pointer;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
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
  `]
})
export class FireImpairmentWidgetComponent {
  @Input() status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  @Input() activeImpairmentCount: number | null = null;
  @Input() editMode = false;
  appName = APP_DISPLAY_NAME;
}
