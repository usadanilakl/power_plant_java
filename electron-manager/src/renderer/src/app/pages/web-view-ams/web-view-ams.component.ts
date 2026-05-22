import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ElectronService,
  WebViewAmsConfig,
  WebViewAmsStatus,
  RoundsReport
} from '../../services/electron.service';

@Component({
  selector: 'app-web-view-ams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Rounds</h1>
        <div class="header-actions">
          <button class="btn btn-icon" (click)="showConfig = !showConfig" title="Configuration">
            <span class="material-icons">settings</span>
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" (click)="refresh()" [disabled]="status.isRefreshing || !status.configured">
            {{ status.isRefreshing ? 'Scraping…' : 'Refresh' }}
          </button>
          <div class="auto-refresh-group">
            <label class="toggle-label">
              <input type="checkbox"
                     [checked]="status.autoRefreshEnabled"
                     [disabled]="!status.configured"
                     (change)="toggleAutoRefresh($event)">
              <span>Auto (once per shift)</span>
            </label>
          </div>
        </div>
        <div class="toolbar-right">
          <span class="shift-pill" *ngIf="status.currentShift">Shift: {{ status.currentShift }}</span>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="summary-row">
        <div class="summary-card">
          <span class="summary-number">{{ report ? report.rows.length : 0 }}</span>
          <span class="summary-label">Responses</span>
        </div>
        <div class="summary-card">
          <span class="summary-number">{{ report ? report.columns.length : 0 }}</span>
          <span class="summary-label">Columns</span>
        </div>
        <div class="summary-card">
          <span class="summary-number summary-time">{{ lastUpdateDisplay }}</span>
          <span class="summary-label">Last Updated</span>
        </div>
      </div>

      <!-- Error banner -->
      <div class="error-banner" *ngIf="status.error">
        <span class="material-icons">error_outline</span>
        <span>{{ status.error }}</span>
      </div>

      <!-- Config panel (collapsible) -->
      <div class="config-panel" *ngIf="showConfig">
        <div class="config-header">
          <h3>Configuration</h3>
          <button class="btn btn-icon btn-small" (click)="showConfig = false">&times;</button>
        </div>
        <div class="config-grid">
          <div class="config-section">
            <h4>webviewams.com Login</h4>
            <label>Reports URL
              <input type="text" [(ngModel)]="config.url" class="input">
            </label>
            <label>Username
              <input type="text" [(ngModel)]="config.username" class="input" autocomplete="off">
            </label>
            <label>Password
              <input type="password" [(ngModel)]="config.password" class="input" autocomplete="off">
            </label>
          </div>
          <div class="config-section">
            <h4>Report</h4>
            <label>Report Name
              <input type="text" [(ngModel)]="config.reportName" class="input">
            </label>
            <label>Saved Search
              <input type="text" [(ngModel)]="config.savedSearch" class="input">
            </label>
            <div class="shift-hours">
              <label>Day shift starts (hr)
                <input type="number" min="0" max="23" [(ngModel)]="config.dayShiftStartHour" class="input input-small">
              </label>
              <label>Night shift starts (hr)
                <input type="number" min="0" max="23" [(ngModel)]="config.nightShiftStartHour" class="input input-small">
              </label>
            </div>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn btn-primary" (click)="saveConfig()">Save Configuration</button>
          <span class="config-saved" *ngIf="configSaved">Saved</span>
        </div>
      </div>

      <!-- Not configured notice -->
      <div class="notice" *ngIf="!status.configured && !showConfig">
        <span class="notice-icon material-icons" style="color: #3b82f6">info</span>
        <div>
          <strong>Not Configured</strong>
          <p>Enter your webviewams.com username and password to load the Rounds report. Click the gear icon above.</p>
        </div>
      </div>

      <!-- Report meta -->
      <div class="report-meta" *ngIf="report">
        <div class="meta-line"><strong>{{ report.facility }}</strong> — {{ report.title }}</div>
        <div class="meta-sub" *ngIf="report.filterLine">{{ report.filterLine }}</div>
        <div class="meta-sub" *ngIf="report.generatedAt">{{ report.generatedAt }}</div>
      </div>

      <!-- Report table -->
      <div class="table-scroll" *ngIf="report && report.rows.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th *ngFor="let col of report.columns; let i = index" [class.sticky-col]="i === 0">
                {{ col }}
              </th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of report.rows">
              <td *ngFor="let cell of row; let i = index" [class.sticky-col]="i === 0">
                {{ cell }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div class="empty-state"
           *ngIf="status.configured && (!report || report.rows.length === 0) && !status.isRefreshing">
        <p>No report data yet. Click Refresh to scrape the latest Rounds report.</p>
      </div>

      <!-- Loading state -->
      <div class="empty-state" *ngIf="status.isRefreshing && (!report || report.rows.length === 0)">
        <p>Scraping webviewams.com… this takes ~30–60 seconds.</p>
      </div>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; margin: 0 auto; }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .toolbar {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }

    .toolbar-left, .toolbar-right {
      display: flex;
      align-items: center;
      gap: 8px;
    }

    .auto-refresh-group {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 4px 10px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .shift-pill {
      font-size: 12px;
      color: var(--text-secondary);
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 4px 12px;
    }

    .summary-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 16px;
    }

    .summary-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      padding: 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .summary-number {
      font-size: 28px;
      font-weight: 700;
      color: var(--accent-primary);
    }

    .summary-time { font-size: 16px; }

    .summary-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: var(--accent-error, #ef4444);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .error-banner .material-icons { font-size: 18px; }

    .config-panel {
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      padding: 16px 20px;
      margin-bottom: 16px;
    }

    .config-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .config-header h3 { margin: 0; font-size: 15px; color: var(--text-primary); }

    .config-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      margin-bottom: 12px;
    }

    .config-section h4 {
      margin: 0 0 8px;
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .config-section label {
      display: block;
      font-size: 12px;
      color: var(--text-secondary);
      margin-bottom: 8px;
    }

    .shift-hours { display: flex; gap: 12px; }
    .input-small { width: 80px; }

    .input {
      display: block;
      width: 100%;
      margin-top: 2px;
      padding: 6px 8px;
      font-size: 13px;
      background: var(--bg-secondary);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
      box-sizing: border-box;
    }

    .input:focus { outline: none; border-color: var(--accent-primary); }

    .config-actions { display: flex; align-items: center; gap: 10px; }
    .config-saved { font-size: 12px; color: var(--accent-success, #10b981); }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      color: var(--text-secondary);
      margin-bottom: 16px;
    }

    .notice-icon { font-size: 20px; flex-shrink: 0; }
    .notice strong { color: var(--accent-primary); display: block; margin-bottom: 4px; }
    .notice p { font-size: 13px; margin: 0; }

    .report-meta {
      margin-bottom: 10px;
      padding: 10px 14px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .meta-line { font-size: 14px; color: var(--text-primary); }
    .meta-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* Wide horizontally-scrollable report table */
    .table-scroll {
      overflow: auto;
      max-height: 70vh;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .data-table {
      border-collapse: separate;
      border-spacing: 0;
      width: max-content;
      min-width: 100%;
    }

    .data-table th {
      text-align: left;
      padding: 8px 12px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      background-color: var(--bg-secondary);
      border-bottom: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
      vertical-align: bottom;
      position: sticky;
      top: 0;
      z-index: 2;
      min-width: 130px;
      max-width: 220px;
      white-space: normal;
    }

    .data-table td {
      padding: 6px 12px;
      font-size: 13px;
      color: var(--text-primary);
      border-bottom: 1px solid var(--border-color);
      border-right: 1px solid var(--border-color);
      white-space: nowrap;
    }

    .data-table tr:hover td { background-color: rgba(255, 255, 255, 0.04); }

    /* Sticky first column (Response Date) */
    .sticky-col {
      position: sticky;
      left: 0;
      z-index: 1;
      background-color: var(--bg-secondary);
      font-weight: 600;
    }

    th.sticky-col { z-index: 3; }
    .data-table td.sticky-col { background-color: var(--bg-card); }
    .data-table tr:hover td.sticky-col { background-color: var(--bg-secondary); }

    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      font-size: 14px;
    }

    .btn-icon {
      background: none;
      border: 1px solid var(--border-color);
      color: var(--text-secondary);
      padding: 4px 8px;
      border-radius: 6px;
      cursor: pointer;
      font-size: 16px;
    }

    .btn-icon:hover { color: var(--text-primary); background: var(--bg-secondary); }
    .btn-small { font-size: 18px; padding: 0 6px; line-height: 1; }
  `]
})
export class WebViewAmsComponent implements OnInit, OnDestroy {
  report: RoundsReport | null = null;

  status: WebViewAmsStatus = {
    lastUpdate: null,
    isRefreshing: false,
    configured: false,
    autoRefreshEnabled: false,
    rowCount: 0,
    currentShift: null
  };

  config: WebViewAmsConfig = {
    url: 'https://www.webviewams.com/reports.aspx',
    username: '',
    password: '',
    reportName: 'Trend Table (Recurring Task Excel)',
    savedSearch: 'Rounds',
    autoRefresh: false,
    dayShiftStartHour: 6,
    nightShiftStartHour: 18
  };

  showConfig = false;
  configSaved = false;

  private unsubscribeUpdated?: () => void;

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    await this.loadConfig();
    await this.loadStatus();
    await this.loadReport();

    this.unsubscribeUpdated = this.electron.onWebViewAmsUpdated(() => {
      this.loadReport();
      this.loadStatus();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeUpdated?.();
  }

  get lastUpdateDisplay(): string {
    if (!this.status.lastUpdate) return '--';
    const d = new Date(this.status.lastUpdate);
    return d.toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  async loadStatus(): Promise<void> {
    const result = await this.electron.webViewAmsGetStatus();
    if (result.success && result.data) {
      this.status = result.data;
    }
  }

  async loadConfig(): Promise<void> {
    const result = await this.electron.webViewAmsGetConfig();
    if (result.success && result.data) {
      this.config = result.data;
    }
  }

  async loadReport(): Promise<void> {
    const result = await this.electron.webViewAmsGetReport();
    if (result.success && result.data) {
      this.report = result.data;
    }
  }

  async refresh(): Promise<void> {
    this.status = { ...this.status, isRefreshing: true, error: undefined };
    const result = await this.electron.webViewAmsRefresh();
    if (result.data) {
      this.report = result.data;
    }
    await this.loadStatus();
  }

  async toggleAutoRefresh(event: Event): Promise<void> {
    const enabled = (event.target as HTMLInputElement).checked;
    await this.electron.webViewAmsSetAutoRefresh(enabled);
    await this.loadStatus();
    await this.loadConfig();
  }

  async saveConfig(): Promise<void> {
    const result = await this.electron.webViewAmsSaveConfig(this.config);
    if (result.success) {
      this.configSaved = true;
      setTimeout(() => this.configSaved = false, 2000);
      await this.loadStatus();
    }
  }
}
