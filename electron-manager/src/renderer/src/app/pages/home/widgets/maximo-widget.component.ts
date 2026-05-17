import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatus, APP_DISPLAY_NAME, MaximoLeadOpSummary } from '../../../services/electron.service';

/**
 * Maximo bundle widget — currently surfaces "WOs assigned to Lead Operators with status=APPR".
 * Click → opens the Spring Boot bundle page via SpringBootUiComponent (iframe), so the live
 * filtering/sorting table users already know is the destination.
 *
 * Compact (1x1): icon + count badge.
 * Standard (2x1+): adds a brief list of the top WO numbers + leads.
 */
@Component({
  selector: 'app-maximo-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card"
       [routerLink]="editMode ? null : '/pid-app'"
       [queryParams]="{ path: 'maximo/bundles/lead-operators' }"
       [class.no-navigate]="editMode"
       [class.compact]="isCompact">

      <!-- COMPACT (1x1) -->
      <ng-container *ngIf="isCompact">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #26C6DA">engineering</span>
          <h3>Maximo · Lead Op</h3>
        </div>
        <div class="compact-metric" *ngIf="summary && summary.count > 0">
          <span class="metric-number">{{ summary.count }}</span>
          <span class="metric-label">APPR WO{{ summary.count !== 1 ? 's' : '' }}</span>
        </div>
        <div class="compact-metric" *ngIf="!summary || summary.count === 0">
          <span class="metric-label ok">No approved WOs</span>
        </div>
        <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
          {{ status.state === 'running' ? 'Click to view' : 'Requires ' + appName }}
        </span>
      </ng-container>

      <!-- STANDARD (2x1+) -->
      <ng-container *ngIf="!isCompact">
        <div class="feature-icon"><span class="material-icons" style="color: #26C6DA">engineering</span></div>
        <div class="feature-info">
          <h3>Maximo · Lead Operator WOs</h3>
          <p class="feature-desc">Approved work orders assigned to Lead Operators</p>

          <div class="wo-count" *ngIf="summary && summary.count > 0">
            <span class="count-badge">{{ summary.count }}</span>
            APPR WO{{ summary.count !== 1 ? 's' : '' }}
          </div>
          <div class="no-wo" *ngIf="!summary || summary.count === 0">
            No approved WOs right now
          </div>

          <div class="wo-list" *ngIf="summary && summary.top.length > 0">
            <div class="wo-row" *ngFor="let w of topToShow">
              <span class="wonum">{{ w.wonum }}</span>
              <span class="wo-lead muted" *ngIf="w.leadCraft">· {{ w.leadCraft }}</span>
              <span class="wo-desc">{{ w.description }}</span>
            </div>
            <span class="more-label" *ngIf="summary.count > topToShow.length">
              +{{ summary.count - topToShow.length }} more
            </span>
          </div>
        </div>
        <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
          {{ status.state === 'running' ? 'Click to view' : 'Requires ' + appName }}
        </span>
      </ng-container>
    </a>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .feature-card {
      display: flex; flex-direction: column; gap: 10px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      overflow-y: auto; height: 100%; box-sizing: border-box;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }

    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-metric { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
    .metric-number { font-size: 20px; font-weight: 700; color: #26C6DA; }
    .metric-label { font-size: 11px; color: var(--text-secondary); }
    .metric-label.ok { color: var(--accent-success); }

    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 6px; }
    .feature-status { font-size: 11px; color: var(--accent-success); }
    .feature-status.requires-sb { color: var(--text-muted); }

    .wo-count { font-size: 12px; color: #26C6DA; display: flex; align-items: center; gap: 6px; margin-bottom: 4px; }
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      width: 22px; height: 22px; border-radius: 50%;
      font-size: 11px; font-weight: 700; color: #fff; background-color: #26C6DA;
    }
    .no-wo { font-size: 12px; color: var(--accent-success); }

    .wo-list { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; }
    .wo-row { display: flex; gap: 6px; align-items: baseline; font-size: 11px;
              white-space: nowrap; overflow: hidden; }
    .wonum { font-family: ui-monospace, Consolas, monospace; color: var(--text-primary); font-weight: 600; }
    .wo-lead { font-family: ui-monospace, Consolas, monospace; }
    .wo-desc { color: var(--text-muted); overflow: hidden; text-overflow: ellipsis; }
    .more-label { font-size: 11px; color: var(--text-muted); font-style: italic; margin-top: 2px; }
    .muted { color: var(--text-muted); }
  `]
})
export class MaximoWidgetComponent {
  @Input() status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  @Input() summary: MaximoLeadOpSummary | null = null;
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;
  appName = APP_DISPLAY_NAME;

  get isCompact(): boolean { return this.cols === 1 && this.rows === 1; }

  /** Show 3 rows on 2x1, 5 on anything larger — keeps the card from overflowing. */
  get topToShow() {
    if (!this.summary) return [];
    const limit = this.cols > 1 && this.rows > 1 ? 5 : 3;
    return this.summary.top.slice(0, limit);
  }
}
