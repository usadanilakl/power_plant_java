import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GateLogStatus, GateLogEntry } from '../../../services/electron.service';

type SizeTier = 'compact' | 'standard' | 'large';

@Component({
  selector: 'app-gate-log-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/gate-log'" [class.no-navigate]="editMode"
       [class.compact]="tier === 'compact'" [class.large]="tier === 'large'">

      <!-- COMPACT (1x1) -->
      <ng-container *ngIf="tier === 'compact'">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #06b6d4">badge</span>
          <h3>Gate Log</h3>
        </div>
        <div class="compact-metric" *ngIf="peopleCount > 0">
          <span class="metric-number">{{ peopleCount }}</span>
          <span class="metric-label">on site</span>
        </div>
        <div class="compact-metric muted" *ngIf="peopleCount === 0">
          <span class="metric-label">No entries (12h)</span>
        </div>
        <span class="compact-update" *ngIf="lastUpdateLabel">{{ lastUpdateLabel }}</span>
        <span class="feature-status available">Independent</span>
      </ng-container>

      <!-- STANDARD (2x1 or 1x2) -->
      <ng-container *ngIf="tier === 'standard'">
        <div class="feature-icon"><span class="material-icons" style="color: #06b6d4">badge</span></div>
        <div class="feature-info">
          <h3>Gate Log</h3>
          <p class="feature-desc">Monitor site access and personnel</p>
          <div class="gate-snippets" *ngIf="peopleCount > 0">
            <div class="gate-count-row">
              <span class="gate-total">{{ peopleCount }} on site</span>
              <span class="gate-breakdown">({{ gateSourceCount }} gate / {{ onlocSourceCount }} OnLoc)</span>
            </div>
            <span class="gate-update" *ngIf="lastUpdateLabel">Updated {{ lastUpdateLabel }}</span>
          </div>
          <div class="gate-snippets" *ngIf="peopleCount === 0 && gateLogStatus?.lastUpdate">
            <span class="gate-update">No entries (12h) &middot; Updated {{ lastUpdateLabel }}</span>
          </div>
          <div class="brief-list" *ngIf="recentPeople.length > 0">
            <div class="person-brief" *ngFor="let p of recentPeople.slice(0, 4)">
              <span class="person-name">{{ p.name }}</span>
              <span class="person-source" [class]="p.source">{{ p.source === 'gate' ? 'G' : 'O' }}</span>
            </div>
            <span class="more-label" *ngIf="recentPeople.length > 4">+{{ recentPeople.length - 4 }} more</span>
          </div>
        </div>
        <span class="feature-status available">Independent</span>
      </ng-container>

      <!-- LARGE — hero count + full list -->
      <ng-container *ngIf="tier === 'large'">
        <ng-container *ngIf="peopleCount > 0">
          <!-- Hero count -->
          <div class="hero-row" [class.vertical]="isVertical">
            <div class="hero-count-section">
              <div class="hero-count-wrap">
                <span class="hero-number">{{ peopleCount }}</span>
                <span class="hero-on-site">on site</span>
              </div>
              <div class="hero-breakdown">
                <div class="bd-item">
                  <span class="bd-value gate-color">{{ gateSourceCount }}</span>
                  <span class="bd-label">Gate</span>
                </div>
                <div class="bd-item">
                  <span class="bd-value onloc-color">{{ onlocSourceCount }}</span>
                  <span class="bd-label">OnLoc</span>
                </div>
              </div>
              <span class="gate-update" *ngIf="lastUpdateLabel">Updated {{ lastUpdateLabel }}</span>
            </div>

            <!-- People list -->
            <div class="people-section" *ngIf="recentPeople.length > 0">
              <div class="people-table">
                <div class="people-header">
                  <span class="ph-name">Name</span>
                  <span class="ph-company">Company</span>
                  <span class="ph-source">Src</span>
                </div>
                <div class="people-body">
                  <div class="people-row" *ngFor="let p of recentPeople.slice(0, maxDisplay)">
                    <span class="pr-name">{{ p.name }}</span>
                    <span class="pr-company">{{ p.company }}</span>
                    <span class="pr-source" [class]="p.source">{{ p.source === 'gate' ? 'Gate' : 'OnLoc' }}</span>
                  </div>
                </div>
                <span class="more-label" *ngIf="recentPeople.length > maxDisplay">+{{ recentPeople.length - maxDisplay }} more</span>
              </div>
            </div>
          </div>
        </ng-container>

        <div class="empty-state" *ngIf="peopleCount === 0">
          <span class="material-icons empty-state-icon">badge</span>
          <span class="empty-state-title">No On-Site Personnel</span>
          <span class="empty-state-desc">No gate entries in the last 12 hours.</span>
        </div>
      </ng-container>
    </a>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 10px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      overflow-y: auto; height: 100%; box-sizing: border-box;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
    :host { display: block; height: 100%; }

    /* Compact */
    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-metric { display: flex; align-items: baseline; gap: 6px; margin-top: 2px; }
    .compact-metric.muted { color: var(--text-muted); }
    .metric-number { font-size: 20px; font-weight: 700; color: var(--text-primary); }
    .metric-label { font-size: 11px; color: var(--text-secondary); }
    .compact-update { font-size: 10px; color: var(--text-muted); }

    /* Standard */
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); margin-top: auto; }
    .gate-snippets { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
    .gate-count-row { display: flex; align-items: baseline; gap: 6px; }
    .gate-total { font-weight: 600; color: var(--text-primary); }
    .gate-breakdown { font-size: 11px; color: var(--text-muted); }
    .gate-update { font-size: 11px; color: var(--text-muted); display: block; }
    .brief-list { display: flex; flex-direction: column; gap: 3px; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-color); }
    .person-brief { display: flex; justify-content: space-between; align-items: center; font-size: 11px; }
    .person-name { color: var(--text-secondary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person-source { font-size: 9px; font-weight: 700; padding: 1px 5px; border-radius: 6px; flex-shrink: 0; }
    .person-source.gate { color: var(--accent-primary); background: rgba(59,130,246,0.12); }
    .person-source.onlocation { color: var(--accent-success); background: rgba(34,197,94,0.12); }
    .more-label { font-size: 10px; color: var(--text-muted); text-align: center; margin-top: 2px; }

    /* Large — hero */
    .hero-row { display: flex; gap: 16px; flex: 1; min-height: 0; }
    .hero-row.vertical { flex-direction: column; gap: 10px; }

    .hero-count-section { display: flex; flex-direction: column; gap: 6px; flex-shrink: 0; }
    .hero-count-wrap { display: flex; align-items: baseline; gap: 6px; }
    .hero-number { font-size: 36px; font-weight: 800; color: var(--text-primary); line-height: 1; }
    .hero-on-site { font-size: 14px; color: var(--text-muted); font-weight: 500; }
    .hero-breakdown { display: flex; gap: 12px; }
    .bd-item { display: flex; align-items: baseline; gap: 4px; }
    .bd-value { font-size: 16px; font-weight: 700; }
    .bd-label { font-size: 10px; color: var(--text-muted); }
    .gate-color { color: var(--accent-primary); }
    .onloc-color { color: var(--accent-success); }

    /* People list */
    .people-section { flex: 1; min-height: 0; min-width: 0; display: flex; flex-direction: column; }
    .people-table { display: flex; flex-direction: column; flex: 1; min-height: 0; }
    .people-header {
      display: flex; gap: 8px; padding: 3px 6px; font-size: 10px; font-weight: 600;
      color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color); flex-shrink: 0;
    }
    .ph-name { flex: 2; }
    .ph-company { flex: 2; }
    .ph-source { flex: 0 0 40px; text-align: right; }
    .people-body { overflow-y: auto; flex: 1; }
    .people-row {
      display: flex; gap: 8px; padding: 3px 6px; font-size: 11px;
      border-bottom: 1px solid rgba(39,39,42,0.3);
    }
    .people-row:hover { background: var(--bg-secondary); }
    .pr-name { flex: 2; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pr-company { flex: 2; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .pr-source { flex: 0 0 40px; text-align: right; font-weight: 500; font-size: 10px; }
    .pr-source.gate { color: var(--accent-primary); }
    .pr-source.onlocation { color: var(--accent-success); }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; flex: 1; text-align: center; padding: 12px; }
    .empty-state-icon { font-size: 36px; color: var(--text-muted); opacity: 0.3; }
    .empty-state-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
    .empty-state-desc { font-size: 12px; color: var(--text-muted); max-width: 300px; }
  `]
})
export class GateLogWidgetComponent {
  @Input() peopleCount = 0;
  @Input() gateSourceCount = 0;
  @Input() onlocSourceCount = 0;
  @Input() lastUpdateLabel = '';
  @Input() gateLogStatus: GateLogStatus | null = null;
  @Input() recentPeople: GateLogEntry[] = [];
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;

  get tier(): SizeTier {
    if (this.cols >= 2 || this.rows >= 2) return 'large';
    return 'compact';
  }

  get isVertical(): boolean { return this.cols === 1 && this.rows >= 2; }

  get maxDisplay(): number {
    if (this.rows >= 3) return 20;
    if (this.cols >= 2 && this.rows >= 2) return 12;
    return 6;
  }
}
