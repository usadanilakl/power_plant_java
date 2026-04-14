import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { GateLogStatus } from '../../../services/electron.service';

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
      </div>
      <span class="feature-status available">Independent</span>
    </a>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 12px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
    :host { flex: 1; display: flex; flex-direction: column; }
    .feature-card { flex: 1; }
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); }
    .gate-snippets { font-size: 12px; color: var(--text-secondary); margin-top: 4px; }
    .gate-count-row { display: flex; align-items: baseline; gap: 6px; }
    .gate-total { font-weight: 600; color: var(--text-primary); }
    .gate-breakdown { font-size: 11px; color: var(--text-muted); }
    .gate-update { font-size: 11px; color: var(--text-muted); margin-top: 2px; display: block; }
  `]
})
export class GateLogWidgetComponent {
  @Input() peopleCount = 0;
  @Input() gateSourceCount = 0;
  @Input() onlocSourceCount = 0;
  @Input() lastUpdateLabel = '';
  @Input() gateLogStatus: GateLogStatus | null = null;
  @Input() editMode = false;
}
