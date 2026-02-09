import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ElectronService, PjmStatus } from '../../services/electron.service';

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
      <div class="status-bar" [class]="'status-' + status.status">
        <span class="status-dot"></span>
        <span class="status-text">{{ statusLabel }}</span>
      </div>

      <!-- LMP Price display -->
      <div class="price-panel">
        <div class="price-header">
          <span class="price-label">Real-Time LMP</span>
          <span class="price-unit">{{ status.unit }}</span>
        </div>
        <div class="price-value" [class.price-positive]="(status.lmpPrice ?? 0) >= 0"
             [class.price-negative]="(status.lmpPrice ?? 0) < 0">
          {{ status.lmpPrice != null ? ('$' + status.lmpPrice.toFixed(2)) : '--' }}
        </div>
        <span class="price-updated" *ngIf="status.dataTimestamp">
          PJM interval: {{ status.dataTimestamp }}
        </span>
        <span class="price-updated">
          Last polled: {{ status.lastUpdate || 'Never' }}
        </span>
      </div>

      <!-- Price breakdown -->
      <div class="info-row" *ngIf="status.status === 'available'">
        <div class="info-card">
          <span class="info-label">Energy LMP</span>
          <span class="info-value">\${{ status.lmpPrice?.toFixed(2) || '--' }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Congestion</span>
          <span class="info-value">\${{ status.congestionPrice?.toFixed(2) || '0.00' }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Marginal Loss</span>
          <span class="info-value">\${{ status.marginalLossPrice?.toFixed(2) || '0.00' }}</span>
        </div>
      </div>

      <!-- Info cards -->
      <div class="info-row">
        <div class="info-card">
          <span class="info-label">Pricing Node</span>
          <span class="info-value">{{ status.pnodeName || 'ComEd' }}</span>
        </div>
        <div class="info-card">
          <span class="info-label">Data Source</span>
          <span class="info-value">PJM Data Miner</span>
        </div>
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
      </div>

      <div class="notice notice-error" *ngIf="status.status === 'error'">
        <span class="notice-icon">&#x26A0;</span>
        <div>
          <strong>Error</strong>
          <p>{{ status.error }}</p>
        </div>
      </div>

      <div class="notice notice-success" *ngIf="status.status === 'available'">
        <span class="notice-icon">&#x2713;</span>
        <div>
          <strong>Live Data Active</strong>
          <p>Receiving real-time 5-minute unverified LMP data from PJM Data Miner API.</p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 800px;
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

    .status-bar {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 13px;
    }

    .status-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .status-loading {
      background-color: rgba(234, 179, 8, 0.1);
      border: 1px solid rgba(234, 179, 8, 0.3);
      color: rgb(234, 179, 8);
    }
    .status-loading .status-dot { background-color: rgb(234, 179, 8); }

    .status-available {
      background-color: rgba(34, 197, 94, 0.1);
      border: 1px solid rgba(34, 197, 94, 0.3);
      color: rgb(34, 197, 94);
    }
    .status-available .status-dot { background-color: rgb(34, 197, 94); }

    .status-unavailable {
      background-color: rgba(148, 163, 184, 0.1);
      border: 1px solid rgba(148, 163, 184, 0.3);
      color: rgb(148, 163, 184);
    }
    .status-unavailable .status-dot { background-color: rgb(148, 163, 184); }

    .status-error {
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: rgb(239, 68, 68);
    }
    .status-error .status-dot { background-color: rgb(239, 68, 68); }

    .price-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 40px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      margin-bottom: 20px;
    }

    .price-header {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .price-label {
      font-size: 14px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .price-unit {
      font-size: 12px;
      color: var(--text-muted);
    }

    .price-value {
      font-size: 56px;
      font-weight: 700;
      color: var(--text-muted);
    }

    .price-positive {
      color: var(--accent-success);
    }

    .price-negative {
      color: var(--accent-danger, #ef4444);
    }

    .price-updated {
      font-size: 12px;
      color: var(--text-muted);
    }

    .info-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
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

    .interval-select:hover {
      border-color: var(--accent-primary, #3b82f6);
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      color: var(--text-secondary);
    }

    .notice-success {
      background-color: rgba(34, 197, 94, 0.1);
      border-color: rgba(34, 197, 94, 0.3);
    }

    .notice-error {
      background-color: rgba(239, 68, 68, 0.1);
      border-color: rgba(239, 68, 68, 0.3);
    }

    .notice-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .notice strong {
      color: var(--accent-primary);
      display: block;
      margin-bottom: 4px;
    }

    .notice-success strong {
      color: var(--accent-success);
    }

    .notice-error strong {
      color: var(--accent-danger, #ef4444);
    }

    .notice p {
      font-size: 13px;
      margin: 0;
    }
  `]
})
export class PjmComponent implements OnInit, OnDestroy {
  status: PjmStatus = { status: 'unavailable', unit: '$/MWh' };
  polling = false;
  pollIntervalMinutes = 5;
  private unsubscribe?: () => void;

  constructor(private electronService: ElectronService) {}

  get statusLabel(): string {
    if (!this.polling && this.status.status !== 'available') {
      return 'Polling disabled';
    }
    switch (this.status.status) {
      case 'loading': return 'Fetching LMP data...';
      case 'available': return 'Live';
      case 'unavailable': return 'No data available';
      case 'error': return 'Error';
      default: return 'Unknown';
    }
  }

  async ngOnInit(): Promise<void> {
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

    this.unsubscribe = this.electronService.onPjmStatusChange((status) => {
      this.status = status;
    });
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
}
