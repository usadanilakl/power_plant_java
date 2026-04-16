import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PjmStatus, PjmDaAward, ElectronService } from '../../../services/electron.service';

type SizeTier = 'compact' | 'standard' | 'large';

@Component({
  selector: 'app-pjm-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/pjm'" [class.no-navigate]="editMode"
       [class.compact]="tier === 'compact'" [class.large]="tier === 'large'">

      <!-- COMPACT (1x1) -->
      <ng-container *ngIf="tier === 'compact'">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #eab308">bolt</span>
          <h3>PJM</h3>
        </div>
        <div class="compact-prices" *ngIf="hasData">
          <div class="compact-unit" *ngIf="pjmStatus?.unit1?.status === 'available'">
            <span class="unit-tag">U1</span>
            <span class="compact-price" [class.price-positive]="(pjmStatus?.unit1?.lmpPrice ?? 0) >= 0"
                  [class.price-negative]="(pjmStatus?.unit1?.lmpPrice ?? 0) < 0">
              \${{ pjmStatus!.unit1.lmpPrice!.toFixed(2) }}
            </span>
          </div>
          <div class="compact-unit" *ngIf="pjmStatus?.unit2?.status === 'available'">
            <span class="unit-tag">U2</span>
            <span class="compact-price" [class.price-positive]="(pjmStatus?.unit2?.lmpPrice ?? 0) >= 0"
                  [class.price-negative]="(pjmStatus?.unit2?.lmpPrice ?? 0) < 0">
              \${{ pjmStatus!.unit2.lmpPrice!.toFixed(2) }}
            </span>
          </div>
        </div>
        <div class="compact-status" *ngIf="!hasData">{{ pjmPolling ? 'Loading...' : 'Polling off' }}</div>
        <span class="feature-status available">Independent</span>
      </ng-container>

      <!-- STANDARD (2x1 or 1x2) -->
      <ng-container *ngIf="tier === 'standard'">
        <div class="feature-icon"><span class="material-icons" style="color: #eab308">bolt</span></div>
        <div class="feature-info">
          <h3>PJM</h3>
          <p class="feature-desc">Grid pricing and power data</p>
          <div class="pjm-snippet" *ngIf="hasData">
            <div class="pjm-unit-row" *ngIf="pjmStatus?.unit1?.status === 'available'">
              <span class="pjm-unit-label">U1</span>
              <span class="pjm-price" [class.price-positive]="(pjmStatus?.unit1?.lmpPrice ?? 0) >= 0"
                    [class.price-negative]="(pjmStatus?.unit1?.lmpPrice ?? 0) < 0">
                \${{ pjmStatus!.unit1.lmpPrice!.toFixed(2) }}
              </span>
            </div>
            <div class="pjm-unit-row" *ngIf="pjmStatus?.unit2?.status === 'available'">
              <span class="pjm-unit-label">U2</span>
              <span class="pjm-price" [class.price-positive]="(pjmStatus?.unit2?.lmpPrice ?? 0) >= 0"
                    [class.price-negative]="(pjmStatus?.unit2?.lmpPrice ?? 0) < 0">
                \${{ pjmStatus!.unit2.lmpPrice!.toFixed(2) }}
              </span>
            </div>
            <span class="pjm-unit">$/MWh</span>
          </div>
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
          <div class="pjm-snippet muted" *ngIf="!hasData && !pjmPolling">Polling disabled</div>
          <div class="pjm-snippet muted" *ngIf="!hasData && pjmPolling">Loading...</div>
        </div>
        <span class="feature-status available">Independent</span>
      </ng-container>

      <!-- LARGE — hero prices + DA -->
      <ng-container *ngIf="tier === 'large'">
        <ng-container *ngIf="hasData">
          <!-- Hero prices -->
          <div class="hero-row" [class.vertical]="isVertical">
            <div class="hero-unit" *ngIf="pjmStatus?.unit1?.status === 'available'">
              <div class="hero-price-wrap" [class.price-positive]="(pjmStatus!.unit1.lmpPrice ?? 0) >= 0"
                   [class.price-negative]="(pjmStatus!.unit1.lmpPrice ?? 0) < 0">
                <span class="hero-dollar">$</span>
                <span class="hero-amount">{{ pjmStatus!.unit1.lmpPrice!.toFixed(2) }}</span>
              </div>
              <div class="hero-detail">
                <span class="hero-unit-name">Unit 1</span>
                <span class="hero-unit-sub">$/MWh LMP</span>
                <div class="hero-evo" *ngIf="pjmStatus?.unit1Evolution">
                  <span class="pjm-evo-dot" [class]="pjmStatus!.unit1Evolution!.status"></span>
                  {{ pjmStatus!.unit1Evolution!.message }}
                </div>
              </div>
            </div>
            <div class="hero-unit" *ngIf="pjmStatus?.unit2?.status === 'available'">
              <div class="hero-price-wrap" [class.price-positive]="(pjmStatus!.unit2.lmpPrice ?? 0) >= 0"
                   [class.price-negative]="(pjmStatus!.unit2.lmpPrice ?? 0) < 0">
                <span class="hero-dollar">$</span>
                <span class="hero-amount">{{ pjmStatus!.unit2.lmpPrice!.toFixed(2) }}</span>
              </div>
              <div class="hero-detail">
                <span class="hero-unit-name">Unit 2</span>
                <span class="hero-unit-sub">$/MWh LMP</span>
                <div class="hero-evo" *ngIf="pjmStatus?.unit2Evolution">
                  <span class="pjm-evo-dot" [class]="pjmStatus!.unit2Evolution!.status"></span>
                  {{ pjmStatus!.unit2Evolution!.message }}
                </div>
              </div>
            </div>
          </div>

          <!-- Breakdown chips -->
          <div class="breakdown-chips">
            <ng-container *ngIf="pjmStatus?.unit1?.status === 'available'">
              <span class="bd-chip" *ngIf="pjmStatus!.unit1.congestionPrice != null">U1 Cong: \${{ pjmStatus!.unit1.congestionPrice!.toFixed(2) }}</span>
              <span class="bd-chip" *ngIf="pjmStatus!.unit1.marginalLossPrice != null">U1 Loss: \${{ pjmStatus!.unit1.marginalLossPrice!.toFixed(2) }}</span>
            </ng-container>
            <ng-container *ngIf="pjmStatus?.unit2?.status === 'available'">
              <span class="bd-chip" *ngIf="pjmStatus!.unit2.congestionPrice != null">U2 Cong: \${{ pjmStatus!.unit2.congestionPrice!.toFixed(2) }}</span>
              <span class="bd-chip" *ngIf="pjmStatus!.unit2.marginalLossPrice != null">U2 Loss: \${{ pjmStatus!.unit2.marginalLossPrice!.toFixed(2) }}</span>
            </ng-container>
          </div>

          <!-- DA Awards (when tall or wide enough) -->
          <div class="da-section" *ngIf="latestDa && (rows >= 2 || (cols >= 2 && rows >= 2))">
            <div class="da-header">
              <span class="section-label">Day-Ahead Awards</span>
              <span class="da-date">{{ latestDa.date }}</span>
            </div>
            <div class="da-summary">
              <div class="da-sum-item">
                <span class="da-sum-label">U1</span>
                <span class="da-sum-value">{{ latestDa.unit1TotalAwardedHours }}h</span>
                <span class="da-sum-avg">\${{ latestDa.unit1AvgLMP.toFixed(2) }} avg</span>
              </div>
              <div class="da-sum-item">
                <span class="da-sum-label">U2</span>
                <span class="da-sum-value">{{ latestDa.unit2TotalAwardedHours }}h</span>
                <span class="da-sum-avg">\${{ latestDa.unit2AvgLMP.toFixed(2) }} avg</span>
              </div>
            </div>

            <!-- Full DA table when really big -->
            <div class="da-table" *ngIf="rows >= 3 || (cols >= 2 && rows >= 2)">
              <div class="da-table-header">
                <span class="da-th">HE</span>
                <span class="da-th">U1 MW</span>
                <span class="da-th">U1 LMP</span>
                <span class="da-th">U2 MW</span>
                <span class="da-th">U2 LMP</span>
              </div>
              <div class="da-table-body">
                <div class="da-row" *ngFor="let row of daRows">
                  <span class="da-td">{{ row.he }}</span>
                  <span class="da-td" [class.awarded]="row.u1mw > 0">{{ row.u1mw || '-' }}</span>
                  <span class="da-td">\${{ row.u1lmp.toFixed(1) }}</span>
                  <span class="da-td" [class.awarded]="row.u2mw > 0">{{ row.u2mw || '-' }}</span>
                  <span class="da-td">\${{ row.u2lmp.toFixed(1) }}</span>
                </div>
              </div>
            </div>
          </div>

          <div class="data-timestamp" *ngIf="pjmStatus?.lastUpdate">
            Updated {{ formatTimestamp(pjmStatus!.lastUpdate!) }}
          </div>
        </ng-container>

        <div class="empty-state" *ngIf="!hasData">
          <span class="material-icons empty-state-icon">bolt</span>
          <span class="empty-state-title">{{ pjmPolling ? 'Loading...' : 'Polling Disabled' }}</span>
          <span class="empty-state-desc" *ngIf="!pjmPolling">Enable PJM polling from the PJM page to see real-time LMP pricing.</span>
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

    .price-positive { color: var(--accent-success); }
    .price-negative { color: var(--accent-error); }

    /* Compact */
    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-prices { display: flex; gap: 12px; margin-top: 2px; }
    .compact-unit { display: flex; align-items: baseline; gap: 4px; }
    .unit-tag { font-size: 10px; color: var(--text-muted); font-weight: 600; }
    .compact-price { font-size: 16px; font-weight: 700; }
    .compact-status { font-size: 11px; color: var(--text-muted); }

    /* Standard */
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); margin-top: auto; }
    .pjm-snippet { font-size: 12px; color: var(--text-secondary); margin-top: 4px; display: flex; align-items: baseline; gap: 4px; }
    .pjm-snippet.muted { color: var(--text-muted); }
    .pjm-unit-row { display: flex; align-items: baseline; gap: 6px; }
    .pjm-unit-label { font-size: 11px; color: var(--text-muted); font-weight: 600; min-width: 20px; }
    .pjm-price { font-size: 16px; font-weight: 700; }
    .pjm-unit { font-size: 11px; color: var(--text-muted); }
    .pjm-evo-row { display: flex; align-items: center; gap: 6px; margin-top: 4px; font-size: 11px; }
    .pjm-evo-dot { width: 6px; height: 6px; border-radius: 50%; flex-shrink: 0; display: inline-block; }
    .pjm-evo-dot.online { background-color: var(--accent-success); }
    .pjm-evo-dot.offline { background-color: var(--accent-error); }
    .pjm-evo-dot.unknown { background-color: var(--text-muted); }
    .pjm-evo-label { font-weight: 600; color: var(--text-muted); min-width: 20px; }
    .pjm-evo-msg { color: var(--text-secondary); }

    /* Large — hero */
    .hero-row { display: flex; gap: 20px; flex-wrap: wrap; }
    .hero-row.vertical { flex-direction: column; gap: 12px; }
    .hero-unit { display: flex; align-items: center; gap: 10px; }
    .hero-price-wrap {
      display: flex; align-items: baseline; font-weight: 800;
      padding: 4px 12px; border-radius: 10px; background: var(--bg-secondary);
    }
    .hero-price-wrap.price-positive { color: var(--accent-success); }
    .hero-price-wrap.price-negative { color: var(--accent-error); }
    .hero-dollar { font-size: 16px; }
    .hero-amount { font-size: 26px; line-height: 1; }
    .hero-detail { display: flex; flex-direction: column; }
    .hero-unit-name { font-size: 12px; font-weight: 700; color: var(--text-primary); }
    .hero-unit-sub { font-size: 10px; color: var(--text-muted); }
    .hero-evo { display: flex; align-items: center; gap: 4px; font-size: 10px; color: var(--text-secondary); margin-top: 2px; }

    /* Breakdown chips */
    .breakdown-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .bd-chip {
      font-size: 10px; color: var(--text-muted); padding: 2px 8px;
      background: var(--bg-secondary); border-radius: 6px; font-family: monospace;
    }

    /* DA section */
    .da-section { border-top: 1px solid var(--border-color); padding-top: 8px; }
    .da-header { display: flex; justify-content: space-between; align-items: center; }
    .section-label { font-size: 10px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .da-date { font-size: 10px; color: var(--text-muted); }
    .da-summary { display: flex; gap: 16px; margin-top: 6px; }
    .da-sum-item { display: flex; align-items: baseline; gap: 6px; }
    .da-sum-label { font-size: 10px; font-weight: 600; color: var(--text-muted); }
    .da-sum-value { font-size: 14px; font-weight: 700; color: var(--text-primary); }
    .da-sum-avg { font-size: 10px; color: var(--text-muted); }

    /* DA table */
    .da-table { margin-top: 6px; font-size: 10px; }
    .da-table-header {
      display: flex; padding: 3px 0; border-bottom: 1px solid var(--border-color);
      font-weight: 600; color: var(--text-muted); text-transform: uppercase;
    }
    .da-table-body { max-height: 160px; overflow-y: auto; }
    .da-row { display: flex; padding: 2px 0; border-bottom: 1px solid rgba(39,39,42,0.3); }
    .da-th, .da-td { flex: 1; text-align: center; }
    .da-td { color: var(--text-secondary); font-family: monospace; }
    .da-td.awarded { color: var(--accent-success); font-weight: 600; }

    .data-timestamp { font-size: 10px; color: var(--text-muted); margin-top: auto; }

    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; flex: 1; text-align: center; padding: 12px; }
    .empty-state-icon { font-size: 36px; color: var(--text-muted); opacity: 0.3; }
    .empty-state-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
    .empty-state-desc { font-size: 12px; color: var(--text-muted); max-width: 300px; }
  `]
})
export class PjmWidgetComponent implements OnInit {
  @Input() pjmStatus: PjmStatus | null = null;
  @Input() pjmPolling = false;
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;

  latestDa: PjmDaAward | null = null;

  constructor(private electronService: ElectronService) {}

  ngOnInit(): void {
    this.loadDa();
  }

  private async loadDa(): Promise<void> {
    try {
      const result = await this.electronService.pjmDaFetch();
      if (result.success && result.data?.length) {
        this.latestDa = result.data[result.data.length - 1];
      }
    } catch {}
  }

  get tier(): SizeTier {
    if (this.cols >= 2 || this.rows >= 2) return 'large';
    return 'compact';
  }

  get isVertical(): boolean { return this.cols === 1 && this.rows >= 2; }
  get hasData(): boolean { return this.pjmStatus?.unit1?.status === 'available' || this.pjmStatus?.unit2?.status === 'available'; }

  get daRows(): { he: number; u1mw: number; u1lmp: number; u2mw: number; u2lmp: number }[] {
    if (!this.latestDa) return [];
    const maxHe = 24;
    const rows = [];
    for (let i = 0; i < maxHe; i++) {
      const u1 = this.latestDa.unit1Hours[i];
      const u2 = this.latestDa.unit2Hours[i];
      rows.push({
        he: i + 1,
        u1mw: u1?.mw ?? 0, u1lmp: u1?.lmp ?? 0,
        u2mw: u2?.mw ?? 0, u2lmp: u2?.lmp ?? 0,
      });
    }
    return rows;
  }

  formatTimestamp(ts: string): string {
    try {
      const d = new Date(isNaN(Number(ts)) ? ts : Number(ts));
      if (isNaN(d.getTime())) return ts;
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch { return ts; }
  }
}
