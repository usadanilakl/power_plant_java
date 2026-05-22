import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatus, APP_DISPLAY_NAME, MaximoLeadOpSummary } from '../../../services/electron.service';

/**
 * Maximo bundle widget — surfaces "WOs assigned to Lead Operators with status=APPR".
 * The standard tier shows the FULL list in a scrollable area, sorted oldest-target-start
 * first (sort done in the IPC handler). Click → opens the Spring Boot bundle page (iframe).
 *
 * Compact (1x1): icon + count badge only.
 * Standard (2x1+): count + scrollable list of every WO.
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
        <div class="header-row">
          <span class="material-icons" style="color: #26C6DA">engineering</span>
          <h3>Maximo · Lead Operator WOs</h3>
          <span class="count-badge" *ngIf="summary && summary.count > 0">{{ summary.count }}</span>
        </div>
        <p class="feature-desc">Approved WOs · oldest target start first</p>

        <div class="no-wo" *ngIf="!summary || summary.count === 0">
          No approved WOs right now
        </div>

        <!-- Full scrollable list -->
        <div class="wo-scroll" *ngIf="summary && summary.items.length > 0">
          <div class="wo-row" *ngFor="let w of summary.items">
            <div class="wo-line1">
              <span class="wonum">{{ w.wonum }}</span>
              <span class="wo-target" [class.no-target]="!w.targetStart">
                {{ w.targetStart ? fmtDate(w.targetStart) : 'no target' }}
              </span>
              <span class="wo-lead" *ngIf="w.leadCraft">{{ w.leadCraft }}</span>
            </div>
            <div class="wo-desc">{{ w.description }}</div>
          </div>
        </div>

        <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
          {{ status.state === 'running' ? 'Click to open full table' : 'Requires ' + appName }}
        </span>
      </ng-container>
    </a>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .feature-card {
      display: flex; flex-direction: column; gap: 8px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      height: 100%; box-sizing: border-box; overflow: hidden;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); }
    .feature-card.no-navigate { pointer-events: none; }
    .feature-card.compact { gap: 4px; padding: 20px; }

    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-metric { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
    .metric-number { font-size: 20px; font-weight: 700; color: #26C6DA; }
    .metric-label { font-size: 11px; color: var(--text-secondary); }
    .metric-label.ok { color: var(--accent-success); }

    .header-row { display: flex; align-items: center; gap: 8px; flex-shrink: 0; }
    .header-row .material-icons { font-size: 22px; }
    .header-row h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; flex: 1; }
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 22px; height: 22px; padding: 0 6px; border-radius: 11px;
      font-size: 11px; font-weight: 700; color: #fff; background-color: #26C6DA;
    }
    .feature-desc { font-size: 11px; color: var(--text-muted); margin: 0; flex-shrink: 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); flex-shrink: 0; }
    .feature-status.requires-sb { color: var(--text-muted); }
    .no-wo { font-size: 12px; color: var(--accent-success); }

    .wo-scroll {
      flex: 1; min-height: 0; overflow-y: auto;
      display: flex; flex-direction: column; gap: 2px;
      border-top: 1px solid var(--border-color); padding-top: 6px;
    }
    .wo-row { padding: 4px 2px; border-bottom: 1px solid var(--border-color); }
    .wo-row:last-child { border-bottom: 0; }
    .wo-line1 { display: flex; gap: 8px; align-items: baseline; font-size: 11px;
                font-family: ui-monospace, Consolas, monospace; }
    .wonum { color: var(--text-primary); font-weight: 600; }
    .wo-target { color: #26C6DA; }
    .wo-target.no-target { color: var(--text-muted); font-style: italic; }
    .wo-lead { color: var(--text-secondary); margin-left: auto; }
    .wo-desc { font-size: 11px; color: var(--text-muted); margin-top: 2px;
               white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
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

  /** ISO datetime → "MMM D" (target start times are usually midnight, so date is enough). */
  fmtDate(iso: string): string {
    const d = new Date(iso);
    if (isNaN(d.getTime())) return iso;
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  }
}
