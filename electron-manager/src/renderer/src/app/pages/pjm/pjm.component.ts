import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElectronService, PjmStatus, PjmUnitLmp, PjmUnitEvolution, PjmDaAward, PjmDaHourEntry } from '../../services/electron.service';

@Component({
  selector: 'app-pjm',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">PJM Monitoring</h1>
        <div class="header-actions">
          <button class="btn-secondary" (click)="refresh()">Refresh</button>
          <button class="btn-polling" [class.btn-polling-active]="polling" (click)="togglePolling()">
            {{ polling ? 'Stop Polling' : 'Start Polling' }}
          </button>
          <button class="btn-secondary" (click)="openLmpTrend()">LMP Trend</button>
          <button class="btn-secondary" (click)="showWindow()">Open Voyager</button>
        </div>
      </div>

      <!-- Status indicator -->
      <div class="status-bar" [class]="'status-' + overallStatus">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusLabel }}</span>
        <span class="status-meta" *ngIf="status.lastUpdate">Last polled: {{ status.lastUpdate }}</span>
      </div>

      <!-- Side-by-side unit panels -->
      <div class="units-grid">
        <div class="unit-panel" *ngFor="let unitKey of ['unit1', 'unit2']; let i = index">
          <div class="unit-header">
            <span class="unit-label">Unit {{ i + 1 }}</span>
            <span class="unit-node">{{ getUnit(unitKey).pnodeName || '—' }}</span>
          </div>

          <div class="unit-price" [class.price-positive]="(getUnit(unitKey).lmpPrice ?? 0) >= 0"
               [class.price-negative]="(getUnit(unitKey).lmpPrice ?? 0) < 0"
               [class.price-unavailable]="getUnit(unitKey).status !== 'available'">
            {{ getUnit(unitKey).lmpPrice != null ? ('$' + getUnit(unitKey).lmpPrice!.toFixed(2)) : '--' }}
            <span class="unit-price-label">$/MWh</span>
          </div>

          <div class="unit-timestamp" *ngIf="getUnit(unitKey).dataTimestamp">
            {{ getUnit(unitKey).dataTimestamp }}
          </div>

          <!-- Price breakdown -->
          <div class="unit-breakdown" *ngIf="getUnit(unitKey).status === 'available'">
            <div class="breakdown-item">
              <span class="breakdown-label">Energy</span>
              <span class="breakdown-value">\${{ getUnit(unitKey).lmpPrice?.toFixed(2) || '--' }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Congestion</span>
              <span class="breakdown-value">\${{ getUnit(unitKey).congestionPrice?.toFixed(2) || '0.00' }}</span>
            </div>
            <div class="breakdown-item">
              <span class="breakdown-label">Loss</span>
              <span class="breakdown-value">\${{ getUnit(unitKey).marginalLossPrice?.toFixed(2) || '0.00' }}</span>
            </div>
          </div>

          <div class="unit-error" *ngIf="getUnit(unitKey).status === 'error'">
            {{ getUnit(unitKey).error }}
          </div>

          <!-- Unit Schedule (all state changes from DA awards) -->
          <div class="da-next" *ngIf="getEvolution(unitKey) as evo">
            <span class="da-next-label">Schedule</span>
            <div class="da-next-content">
              <span class="da-chip" [class.online]="evo.status === 'online'"
                    [class.offline]="evo.status === 'offline'"
                    [class.idle]="evo.status === 'unknown'">
                {{ evo.status === 'online' ? 'Online' : evo.status === 'offline' ? 'Offline' : '—' }}
              </span>
              <div class="da-steps" *ngIf="evo.steps?.length; else evoMsg">
                <span class="da-step" *ngFor="let s of evo.steps || []"
                      [class.agc]="s.type === 'AGC'" [class.offline]="s.type === 'OFFLINE'">
                  <span class="da-step-type">{{ s.type }}</span>
                  <span class="da-step-time">{{ s.time }}</span>
                </span>
              </div>
              <ng-template #evoMsg><span class="da-next-info">{{ evo.message }}</span></ng-template>
            </div>
          </div>
          <div class="da-next" *ngIf="!getEvolution(unitKey)">
            <span class="da-next-label">Next Evolution</span>
            <div class="da-next-content">
              <span class="da-chip idle">No schedule</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Poll interval -->
      <div class="info-row">
        <div class="info-card">
          <span class="info-label">Poll Interval</span>
          <select class="interval-select" [(ngModel)]="pollIntervalMinutes" (ngModelChange)="onIntervalChange($event)">
            <option [ngValue]="1">1 min</option>
            <option [ngValue]="2">2 min</option>
            <option [ngValue]="5">5 min</option>
            <option [ngValue]="10">10 min</option>
            <option [ngValue]="15">15 min</option>
            <option [ngValue]="30">30 min</option>
          </select>
        </div>
        <div class="info-card">
          <span class="info-label">Data Source</span>
          <span class="info-value">PJM Data Miner</span>
        </div>
      </div>

      <!-- DA Awards section -->
      <div class="da-section">
        <div class="da-section-header">
          <h2 class="da-section-title">Day-Ahead Awards</h2>
          <div class="da-header-right">
            <span class="da-fetched" *ngIf="daLastFetched">Updated {{ daLastFetched }}</span>
            <button class="btn-secondary btn-sm" (click)="refreshAwards()" [disabled]="daLoading">
              {{ daLoading ? 'Loading...' : 'Refresh' }}
            </button>
          </div>
        </div>

        <!-- Date navigator -->
        <div class="da-date-nav">
          <button class="btn-icon-nav" (click)="prevDate()" title="Previous day">&lsaquo;</button>
          <span class="da-date-display">{{ formatSelectedDate() }}</span>
          <button class="btn-icon-nav" (click)="nextDate()" title="Next day">&rsaquo;</button>
          <button class="btn-secondary btn-sm da-today-btn" (click)="goToToday()">Today</button>
        </div>

        <div class="da-error" *ngIf="daError">{{ daError }}</div>

        <!-- Hourly table -->
        <div class="da-hourly-table" *ngIf="selectedAward">
          <div class="da-hourly-header">
            <span class="col-he">HE</span>
            <span class="col-mw">U1 MW</span>
            <span class="col-lmp">U1 LMP</span>
            <span class="col-mw">U2 MW</span>
            <span class="col-lmp">U2 LMP</span>
          </div>
          <div class="da-hourly-row" *ngFor="let row of hourlyRows"
               [class.row-awarded]="row.u1mw > 0 || row.u2mw > 0"
               [class.row-u1-awarded]="row.u1mw > 0"
               [class.row-u2-awarded]="row.u2mw > 0">
            <span class="col-he">{{ row.he }}</span>
            <span class="col-mw" [class.mw-active]="row.u1mw > 0">{{ row.u1mw }}</span>
            <span class="col-lmp">\${{ row.u1lmp.toFixed(2) }}</span>
            <span class="col-mw" [class.mw-active]="row.u2mw > 0">{{ row.u2mw }}</span>
            <span class="col-lmp">\${{ row.u2lmp.toFixed(2) }}</span>
          </div>
          <!-- Summary row -->
          <div class="da-hourly-summary">
            <span class="col-he">Avg/Total</span>
            <span class="col-mw">{{ selectedAward.unit1TotalAwardedHours }}h</span>
            <span class="col-lmp">\${{ selectedAward.unit1AvgLMP.toFixed(2) }}</span>
            <span class="col-mw">{{ selectedAward.unit2TotalAwardedHours }}h</span>
            <span class="col-lmp">\${{ selectedAward.unit2AvgLMP.toFixed(2) }}</span>
          </div>
        </div>

        <div class="da-empty" *ngIf="!selectedAward && !daLoading && !daError">
          No day-ahead award data for {{ formatSelectedDate() }}.
        </div>
      </div>

      <!-- Notices -->
      <div class="notice notice-error" *ngIf="overallStatus === 'error'">
        <span class="notice-icon material-icons" style="color: #ef4444">warning</span>
        <div>
          <strong>Error</strong>
          <p>{{ status.unit1.error || status.unit2.error }}</p>
        </div>
      </div>

      <div class="notice notice-success" *ngIf="overallStatus === 'available'">
        <span class="notice-icon material-icons" style="color: #22c55e">check_circle</span>
        <div>
          <strong>Live Data Active</strong>
          <p>Receiving real-time 5-minute unverified LMP data for both units.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .header-actions {
      display: flex;
      gap: 8px;
    }

    .btn-secondary {
      padding: 8px 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      color: var(--text-primary);
      cursor: pointer;
      font-size: 13px;
      transition: background-color 0.15s;
    }

    .btn-secondary:hover {
      background-color: var(--bg-hover);
    }

    .btn-secondary:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }

    .btn-sm {
      padding: 4px 12px;
      font-size: 12px;
    }

    .btn-polling {
      padding: 8px 16px;
      background-color: rgba(34, 197, 94, 0.15);
      border: 1px solid rgba(34, 197, 94, 0.4);
      border-radius: 8px;
      color: rgb(34, 197, 94);
      cursor: pointer;
      font-size: 13px;
      transition: all 0.15s;
    }

    .btn-polling:hover {
      background-color: rgba(34, 197, 94, 0.25);
    }

    .btn-polling-active {
      background-color: rgba(239, 68, 68, 0.15);
      border-color: rgba(239, 68, 68, 0.4);
      color: rgb(239, 68, 68);
    }

    .btn-polling-active:hover {
      background-color: rgba(239, 68, 68, 0.25);
    }

    .btn-icon-nav {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-primary);
      cursor: pointer;
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 18px;
      line-height: 1;
      transition: background-color 0.15s;
    }

    .btn-icon-nav:hover { background-color: var(--bg-hover); }

    /* Status bar */
    .status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .status-meta {
      margin-left: auto;
      font-size: 12px;
      opacity: 0.7;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-loading { background-color: rgba(234, 179, 8, 0.1); border: 1px solid rgba(234, 179, 8, 0.3); color: rgb(234, 179, 8); }
    .status-loading .status-dot { background-color: rgb(234, 179, 8); }
    .status-available { background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); color: rgb(34, 197, 94); }
    .status-available .status-dot { background-color: rgb(34, 197, 94); }
    .status-unavailable { background-color: rgba(148, 163, 184, 0.1); border: 1px solid rgba(148, 163, 184, 0.3); color: rgb(148, 163, 184); }
    .status-unavailable .status-dot { background-color: rgb(148, 163, 184); }
    .status-error { background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); color: rgb(239, 68, 68); }
    .status-error .status-dot { background-color: rgb(239, 68, 68); }

    /* Side-by-side units */
    .units-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .unit-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 24px 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
    }

    .unit-header {
      display: flex;
      align-items: center;
      gap: 8px;
      width: 100%;
      justify-content: center;
    }

    .unit-label {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .unit-node {
      font-size: 12px;
      color: var(--text-muted);
    }

    .unit-price {
      font-size: 40px;
      font-weight: 700;
      color: var(--text-muted);
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .unit-price.price-positive { color: var(--accent-success); }
    .unit-price.price-negative { color: var(--accent-danger, #ef4444); }
    .unit-price.price-unavailable { color: var(--text-muted); }
    .unit-price-label { font-size: 14px; color: var(--text-muted); font-weight: 400; }

    .unit-timestamp {
      font-size: 11px;
      color: var(--text-muted);
    }

    .unit-breakdown {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
      width: 100%;
      margin-top: 8px;
    }

    .breakdown-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .breakdown-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .breakdown-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .unit-error {
      font-size: 12px;
      color: var(--accent-danger, #ef4444);
      text-align: center;
    }

    /* DA "next up" chip */
    .da-next {
      width: 100%;
      margin-top: 12px;
      padding: 10px 12px;
      background-color: var(--bg-secondary, rgba(255,255,255,0.03));
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .da-next-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .da-next-content {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 4px;
      flex-wrap: wrap;
    }

    .da-steps {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .da-step {
      display: inline-flex;
      align-items: baseline;
      gap: 4px;
      font-size: 12px;
      padding: 2px 8px;
      border-radius: 10px;
      background-color: rgba(148, 163, 184, 0.12);
      white-space: nowrap;
    }

    .da-step-type { font-weight: 700; font-size: 10px; letter-spacing: 0.3px; }
    .da-step.agc { background-color: rgba(34, 197, 94, 0.12); }
    .da-step.agc .da-step-type { color: rgb(34, 197, 94); }
    .da-step.offline { background-color: rgba(239, 68, 68, 0.12); }
    .da-step.offline .da-step-type { color: rgb(239, 68, 68); }
    .da-step-time { color: var(--text-secondary); }

    .da-chip {
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      white-space: nowrap;
    }

    .da-chip.scheduled, .da-chip.online {
      background-color: rgba(34, 197, 94, 0.15);
      color: rgb(34, 197, 94);
    }

    .da-chip.offline {
      background-color: rgba(239, 68, 68, 0.15);
      color: rgb(239, 68, 68);
    }

    .da-chip.idle {
      background-color: rgba(148, 163, 184, 0.15);
      color: rgb(148, 163, 184);
    }

    .da-next-info {
      font-size: 12px;
      color: var(--text-secondary);
    }

    /* Info row */
    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 12px;
      margin-bottom: 20px;
    }

    .info-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .info-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .info-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .interval-select {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 4px 8px;
      cursor: pointer;
      outline: none;
    }

    .interval-select:hover { border-color: var(--accent-primary, #3b82f6); }

    /* DA Awards section */
    .da-section {
      margin-bottom: 20px;
    }

    .da-section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .da-section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .da-header-right {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .da-fetched {
      font-size: 11px;
      color: var(--text-muted);
    }

    /* Date navigator */
    .da-date-nav {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 12px;
    }

    .da-date-display {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      min-width: 140px;
      text-align: center;
    }

    .da-today-btn {
      margin-left: 8px;
    }

    .da-error {
      font-size: 13px;
      color: var(--accent-danger, #ef4444);
      padding: 10px 16px;
      background-color: rgba(239, 68, 68, 0.08);
      border: 1px solid rgba(239, 68, 68, 0.2);
      border-radius: 8px;
      margin-bottom: 12px;
    }

    /* Hourly table */
    .da-hourly-table {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
      font-variant-numeric: tabular-nums;
    }

    .da-hourly-header {
      display: grid;
      grid-template-columns: 50px 1fr 1fr 1fr 1fr;
      gap: 0;
      padding: 10px 16px;
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color);
    }

    .da-hourly-row {
      display: grid;
      grid-template-columns: 50px 1fr 1fr 1fr 1fr;
      gap: 0;
      padding: 6px 16px;
      font-size: 13px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
      transition: background-color 0.1s;
    }

    .da-hourly-row:last-child { border-bottom: none; }

    .da-hourly-row.row-awarded {
      background-color: rgba(34, 197, 94, 0.06);
    }

    .da-hourly-summary {
      display: grid;
      grid-template-columns: 50px 1fr 1fr 1fr 1fr;
      gap: 0;
      padding: 10px 16px;
      font-size: 13px;
      font-weight: 600;
      color: var(--text-primary);
      background-color: var(--bg-secondary, rgba(255,255,255,0.03));
      border-top: 2px solid var(--border-color);
    }

    .col-he {
      font-weight: 500;
      color: var(--text-muted);
    }

    .col-mw {
      text-align: right;
      padding-right: 12px;
    }

    .col-mw.mw-active {
      color: rgb(34, 197, 94);
      font-weight: 600;
    }

    .col-lmp {
      text-align: right;
      padding-right: 12px;
    }

    .da-empty {
      font-size: 13px;
      color: var(--text-muted);
      padding: 24px;
      text-align: center;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    /* Notices */
    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      border-radius: 8px;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .notice-success { background-color: rgba(34, 197, 94, 0.1); border: 1px solid rgba(34, 197, 94, 0.3); }
    .notice-error { background-color: rgba(239, 68, 68, 0.1); border: 1px solid rgba(239, 68, 68, 0.3); }
    .notice-icon { font-size: 20px; flex-shrink: 0; }
    .notice strong { display: block; margin-bottom: 4px; }
    .notice-success strong { color: var(--accent-success); }
    .notice-error strong { color: var(--accent-danger, #ef4444); }
    .notice p { font-size: 13px; margin: 0; }
  `]
})
export class PjmComponent implements OnInit, OnDestroy {
  status: PjmStatus = {
    unit1: { pnodeId: 0, status: 'unavailable' },
    unit2: { pnodeId: 0, status: 'unavailable' },
    unit: '$/MWh',
  };
  polling = false;
  pollIntervalMinutes = 5;

  // DA Awards state
  daAwards: PjmDaAward[] = [];
  selectedDaDate = '';   // YYYY-MM-DD
  daLoading = false;
  daError?: string;
  daLastFetched?: string;

  private unsubscribe?: () => void;

  constructor(private electronService: ElectronService) {}

  getUnit(key: string): PjmUnitLmp {
    return key === 'unit1' ? this.status.unit1 : this.status.unit2;
  }

  get overallStatus(): string {
    const s1 = this.status.unit1.status;
    const s2 = this.status.unit2.status;
    if (s1 === 'available' && s2 === 'available') return 'available';
    if (s1 === 'error' || s2 === 'error') return 'error';
    if (s1 === 'available' || s2 === 'available') return 'available';
    return 'unavailable';
  }

  get statusLabel(): string {
    const s1 = this.status.unit1.status;
    const s2 = this.status.unit2.status;
    if (s1 === 'available' && s2 === 'available') return 'Live — Both Units';
    if (s1 === 'available' || s2 === 'available') return 'Live — Partial';
    if (s1 === 'error' || s2 === 'error') return 'Error';
    if (!this.polling) return 'Polling disabled';
    return 'No data available';
  }

  /** Find the award matching the selected date */
  get selectedAward(): PjmDaAward | null {
    return this.daAwards.find(a => a.date === this.selectedDaDate) || null;
  }

  /** Build 24-row array for the hourly table */
  get hourlyRows(): { he: number; u1mw: number; u1lmp: number; u2mw: number; u2lmp: number }[] {
    const award = this.selectedAward;
    if (!award) return [];
    return Array.from({ length: 24 }, (_, i) => {
      const he = i + 1;
      const u1 = award.unit1Hours.find(h => h.he === he) || { he, mw: 0, lmp: 0 };
      const u2 = award.unit2Hours.find(h => h.he === he) || { he, mw: 0, lmp: 0 };
      return { he, u1mw: u1.mw, u1lmp: u1.lmp, u2mw: u2.mw, u2lmp: u2.lmp };
    });
  }

  /** Get the evolution (next state change) for a unit from PjmStatus broadcast */
  getEvolution(unitKey: string): PjmUnitEvolution | null {
    const evo = unitKey === 'unit1' ? this.status.unit1Evolution : this.status.unit2Evolution;
    return evo || null;
  }

  formatSelectedDate(): string {
    if (!this.selectedDaDate) return '—';
    const [y, m, d] = this.selectedDaDate.split('-');
    return `${m}/${d}/${y}`;
  }

  prevDate(): void {
    const dt = new Date(this.selectedDaDate + 'T12:00:00');
    dt.setDate(dt.getDate() - 1);
    this.selectedDaDate = this.toDateStr(dt);
  }

  nextDate(): void {
    const dt = new Date(this.selectedDaDate + 'T12:00:00');
    dt.setDate(dt.getDate() + 1);
    this.selectedDaDate = this.toDateStr(dt);
  }

  goToToday(): void {
    this.selectedDaDate = this.toDateStr(new Date());
  }

  async ngOnInit(): Promise<void> {
    this.selectedDaDate = this.toDateStr(new Date());

    const result = await this.electronService.getPjmStatus() as any;
    if (result.success && result.data) {
      this.status = result.data;
    }
    if (result.polling != null) {
      this.polling = result.polling;
    }

    const configResult = await this.electronService.pjmGetConfig();
    if (configResult.success && configResult.data) {
      this.pollIntervalMinutes = configResult.data.pollIntervalMinutes || 5;
    }

    await this.loadAwards();

    this.unsubscribe = this.electronService.onPjmStatusChange((status) => {
      this.status = status;
    });
  }

  async loadAwards(): Promise<void> {
    this.daLoading = true;
    this.daError = undefined;
    try {
      const result = await this.electronService.pjmDaFetch();
      if (result.success && result.data) {
        this.daAwards = result.data;
        this.daLastFetched = new Date().toLocaleTimeString();
      } else if (result.error) {
        this.daError = result.error;
      }
    } catch (e: any) {
      this.daError = e.message || 'Failed to fetch DA awards';
    } finally {
      this.daLoading = false;
    }
  }

  async refreshAwards(): Promise<void> {
    this.daLoading = true;
    this.daError = undefined;
    try {
      const result = await this.electronService.pjmDaRefresh();
      if (result.success && result.data) {
        this.daAwards = result.data;
        this.daLastFetched = new Date().toLocaleTimeString();
      } else if (result.error) {
        this.daError = result.error;
      }
    } catch (e: any) {
      this.daError = e.message || 'Failed to refresh DA awards';
    } finally {
      this.daLoading = false;
    }
  }

  async togglePolling(): Promise<void> {
    const result = await this.electronService.pjmSetPolling(!this.polling);
    if (result.success && result.polling != null) {
      this.polling = result.polling;
    }
  }

  async onIntervalChange(minutes: number): Promise<void> {
    const result = await this.electronService.pjmSaveConfig({ pollIntervalMinutes: minutes });
    if (result.success && result.polling != null) {
      this.polling = result.polling;
    }
  }

  async refresh(): Promise<void> {
    await this.electronService.pjmRefresh();
  }

  async openLmpTrend(): Promise<void> {
    await this.electronService.openWebView('pjm-lmp', 'https://dataviewer.pjm.com/dataviewer/pages/public/lmp.jsf');
  }

  async showWindow(): Promise<void> {
    await this.electronService.pjmShowWindow();
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  // --- Helpers ---

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  private formatDateShort(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${m}/${d}`;
  }
}
