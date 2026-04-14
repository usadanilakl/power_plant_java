import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PjmStatus } from '../../../services/electron.service';

@Component({
  selector: 'app-pjm-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/pjm'" [class.no-navigate]="editMode">
      <div class="feature-icon"><span class="material-icons" style="color: #eab308">bolt</span></div>
      <div class="feature-info">
        <h3>PJM</h3>
        <p class="feature-desc">Grid pricing and power data</p>

        <div class="pjm-snippet" *ngIf="pjmStatus?.unit1?.status === 'available' || pjmStatus?.unit2?.status === 'available'">
          <div class="pjm-unit-row" *ngIf="pjmStatus?.unit1?.status === 'available'">
            <span class="pjm-unit-label">U1</span>
            <span class="pjm-price" [class.price-positive]="(pjmStatus?.unit1?.lmpPrice ?? 0) >= 0"
                  [class.price-negative]="(pjmStatus?.unit1?.lmpPrice ?? 0) < 0">
              \${{ pjmStatus?.unit1?.lmpPrice?.toFixed(2) }}
            </span>
          </div>
          <div class="pjm-unit-row" *ngIf="pjmStatus?.unit2?.status === 'available'">
            <span class="pjm-unit-label">U2</span>
            <span class="pjm-price" [class.price-positive]="(pjmStatus?.unit2?.lmpPrice ?? 0) >= 0"
                  [class.price-negative]="(pjmStatus?.unit2?.lmpPrice ?? 0) < 0">
              \${{ pjmStatus?.unit2?.lmpPrice?.toFixed(2) }}
            </span>
          </div>
          <span class="pjm-unit">$/MWh</span>
        </div>

        <!-- Evolution status -->
        <div class="pjm-evo-row" *ngIf="pjmStatus?.unit1Evolution">
          <span class="pjm-evo-dot" [class]="pjmStatus!.unit1Evolution!.status"></span>
          <span class="pjm-evo-label">U1</span>
          <span class="pjm-evo-msg">{{ pjmStatus!.unit1Evolution!.message }}</span>
        </div>
        <div class="pjm-evo-row" *ngIf="pjmStatus?.unit2Evolution">
          <span class="pjm-evo-dot" [class]="pjmStatus!.unit2Evolution!.status"></span>
          <span class="pjm-evo-label">U2</span>
          <span class="pjm-evo-msg">{{ pjmStatus!.unit2Evolution!.message }}</span>
        </div>

        <!-- Expanded: price breakdown -->
        <ng-container *ngIf="isExpanded && (pjmStatus?.unit1?.status === 'available' || pjmStatus?.unit2?.status === 'available')">
          <div class="price-breakdown">
            <!-- Unit 1 breakdown -->
            <div class="breakdown-unit" *ngIf="pjmStatus?.unit1?.status === 'available'">
              <span class="breakdown-title">Unit 1 Breakdown</span>
              <div class="breakdown-row">
                <span class="breakdown-label">LMP</span>
                <span class="breakdown-value">\${{ pjmStatus!.unit1.lmpPrice!.toFixed(2) }}</span>
              </div>
              <div class="breakdown-row" *ngIf="pjmStatus!.unit1.congestionPrice != null">
                <span class="breakdown-label">Congestion</span>
                <span class="breakdown-value">\${{ pjmStatus!.unit1.congestionPrice!.toFixed(2) }}</span>
              </div>
              <div class="breakdown-row" *ngIf="pjmStatus!.unit1.marginalLossPrice != null">
                <span class="breakdown-label">Loss</span>
                <span class="breakdown-value">\${{ pjmStatus!.unit1.marginalLossPrice!.toFixed(2) }}</span>
              </div>
            </div>

            <!-- Unit 2 breakdown -->
            <div class="breakdown-unit" *ngIf="pjmStatus?.unit2?.status === 'available'">
              <span class="breakdown-title">Unit 2 Breakdown</span>
              <div class="breakdown-row">
                <span class="breakdown-label">LMP</span>
                <span class="breakdown-value">\${{ pjmStatus!.unit2.lmpPrice!.toFixed(2) }}</span>
              </div>
              <div class="breakdown-row" *ngIf="pjmStatus!.unit2.congestionPrice != null">
                <span class="breakdown-label">Congestion</span>
                <span class="breakdown-value">\${{ pjmStatus!.unit2.congestionPrice!.toFixed(2) }}</span>
              </div>
              <div class="breakdown-row" *ngIf="pjmStatus!.unit2.marginalLossPrice != null">
                <span class="breakdown-label">Loss</span>
                <span class="breakdown-value">\${{ pjmStatus!.unit2.marginalLossPrice!.toFixed(2) }}</span>
              </div>
            </div>
          </div>

          <div class="data-timestamp" *ngIf="pjmStatus?.lastUpdate">
            Data: {{ formatTimestamp(pjmStatus!.lastUpdate!) }}
          </div>
        </ng-container>

        <div class="pjm-snippet muted" *ngIf="pjmStatus?.unit1?.status !== 'available' && pjmStatus?.unit2?.status !== 'available' && !pjmPolling">
          Polling disabled
        </div>
        <div class="pjm-snippet muted" *ngIf="(pjmStatus?.unit1?.status === 'loading' || pjmStatus?.unit2?.status === 'loading') && pjmPolling && pjmStatus?.unit1?.status !== 'available' && pjmStatus?.unit2?.status !== 'available'">
          Loading...
        </div>
        <div class="pjm-snippet error-text" *ngIf="pjmStatus?.unit1?.status === 'error' && pjmStatus?.unit2?.status === 'error'">
          Error
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
    .pjm-snippet { font-size: 12px; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: baseline; gap: 4px; }
    .pjm-snippet.muted { color: var(--text-muted); }
    .pjm-snippet.error-text { color: var(--accent-error); }
    .pjm-unit-row { display: flex; align-items: baseline; gap: 6px; }
    .pjm-unit-label { font-size: 11px; color: var(--text-muted); font-weight: 600; min-width: 20px; }
    .pjm-price { font-size: 16px; font-weight: 700; }
    .pjm-price.price-positive { color: var(--accent-success); }
    .pjm-price.price-negative { color: var(--accent-error); }
    .pjm-unit { font-size: 11px; color: var(--text-muted); }
    .pjm-evo-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 11px; }
    .pjm-evo-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; }
    .pjm-evo-dot.online { background-color: var(--accent-success); }
    .pjm-evo-dot.offline { background-color: var(--accent-error); }
    .pjm-evo-dot.unknown { background-color: var(--text-muted); }
    .pjm-evo-label { font-weight: 600; color: var(--text-muted); min-width: 20px; }
    .pjm-evo-msg { color: var(--text-secondary); }

    .price-breakdown {
      margin-top: 8px; padding-top: 8px; border-top: 1px solid var(--border-color);
      display: flex; gap: 16px;
    }
    .breakdown-unit { flex: 1; display: flex; flex-direction: column; gap: 3px; }
    .breakdown-title { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-bottom: 2px; }
    .breakdown-row { display: flex; justify-content: space-between; font-size: 11px; }
    .breakdown-label { color: var(--text-muted); }
    .breakdown-value { color: var(--text-secondary); font-weight: 500; font-family: monospace; }
    .data-timestamp { font-size: 10px; color: var(--text-muted); margin-top: 4px; }
  `]
})
export class PjmWidgetComponent {
  @Input() pjmStatus: PjmStatus | null = null;
  @Input() pjmPolling = false;
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;

  get isExpanded(): boolean { return this.cols >= 2 || this.rows >= 2; }

  formatTimestamp(ts: string): string {
    try {
      return new Date(ts).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  }
}
