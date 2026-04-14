import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GateLogStatus, GateLogEntry } from '../../../services/electron.service';

@Component({
  selector: 'app-gate-log-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/gate-log'" [class.no-navigate]="editMode">
      <div class="feature-icon"><span class="material-icons" style="color: #06b6d4">badge</span></div>
      <div class="feature-info">
        <h3>Gate Log</h3>
        <p class="feature-desc">Monitor site access and personnel</p>
        <div class="gate-snippets" *ngIf="peopleCount > 0">
          <div class="gate-count-row">
            <span class="gate-total">{{ peopleCount }} on site</span>
            <span class="gate-breakdown">({{ gateSourceCount }} gate / {{ onlocSourceCount }} OnLoc)</span>
          </div>
          <span class="gate-update" *ngIf="gateLogStatus?.lastUpdate">Updated {{ lastUpdateLabel }}</span>
        </div>
        <div class="gate-snippets" *ngIf="peopleCount === 0 && gateLogStatus?.lastUpdate">
          <span class="gate-update">No entries (12h) &middot; Updated {{ lastUpdateLabel }}</span>
        </div>

        <!-- Expanded: recent people list -->
        <div class="people-list" *ngIf="isExpanded && recentPeople.length > 0">
          <div class="people-header">
            <span class="section-label">Recent Check-ins</span>
          </div>
          <div class="person-row" *ngFor="let p of displayPeople">
            <span class="person-name">{{ p.name }}</span>
            <span class="person-company">{{ p.company }}</span>
            <span class="person-source" [class]="p.source">{{ p.source === 'gate' ? 'Gate' : 'OnLoc' }}</span>
          </div>
          <span class="more-label" *ngIf="recentPeople.length > maxDisplay">
            +{{ recentPeople.length - maxDisplay }} more
          </span>
        </div>
      </div>
      <span class="feature-status available">Independent</span>
    </a>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 12px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      overflow-y: auto;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
    :host { display: block; height: 100%; }
    .feature-card { height: 100%; box-sizing: border-box; }
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); }
    .gate-snippets { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
    .gate-count-row { display: flex; align-items: baseline; gap: 6px; }
    .gate-total { font-weight: 600; color: var(--text-primary); }
    .gate-breakdown { font-size: 11px; color: var(--text-muted); }
    .gate-update { font-size: 11px; color: var(--text-muted); margin-top: 2px; display: block; }

    .people-list { margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color); display: flex; flex-direction: column; gap: 4px; }
    .section-label { font-size: 11px; font-weight: 600; color: var(--text-muted); }
    .person-row { display: flex; align-items: center; gap: 8px; font-size: 11px; padding: 3px 0; }
    .person-name { color: var(--text-primary); font-weight: 500; flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person-company { color: var(--text-muted); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .person-source { font-size: 10px; font-weight: 600; padding: 1px 6px; border-radius: 8px; }
    .person-source.gate { color: var(--accent-primary); background: rgba(59,130,246,0.12); }
    .person-source.onlocation { color: var(--accent-success); background: rgba(34,197,94,0.12); }
    .more-label { font-size: 10px; color: var(--text-muted); text-align: center; }
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

  get isExpanded(): boolean { return this.cols >= 2 || this.rows >= 2; }

  get maxDisplay(): number { return this.rows >= 2 ? this.rows * 4 : 5; }

  get displayPeople(): GateLogEntry[] { return this.recentPeople.slice(0, this.maxDisplay); }
}
