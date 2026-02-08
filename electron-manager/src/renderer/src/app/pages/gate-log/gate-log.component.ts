import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ElectronService,
  GateLogEntry,
  GateLogStatus,
  GateLogConfig
} from '../../services/electron.service';

@Component({
  selector: 'app-gate-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Gate Log</h1>
        <div class="header-actions">
          <button class="btn btn-icon" (click)="showConfig = !showConfig" title="Configuration">
            &#x2699;
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" (click)="refresh()" [disabled]="status.isRefreshing">
            {{ status.isRefreshing ? 'Refreshing...' : 'Refresh' }}
          </button>

          <div class="auto-refresh-group">
            <label class="toggle-label">
              <input type="checkbox"
                     [checked]="status.autoRefreshEnabled"
                     (change)="toggleAutoRefresh($event)">
              <span>Auto</span>
            </label>
            <select class="select-small"
                    [ngModel]="status.refreshIntervalMinutes"
                    (ngModelChange)="setInterval($event)"
                    [disabled]="!status.autoRefreshEnabled">
              <option [value]="15">15 min</option>
              <option [value]="30">30 min</option>
              <option [value]="60">60 min</option>
              <option [value]="120">2 hrs</option>
            </select>
          </div>
        </div>

        <div class="toolbar-right">
          <button class="btn btn-secondary" (click)="openGateWeb()">
            Open Gate Web
          </button>
          <button class="btn btn-secondary" (click)="openOnLocation()">
            Open OnLocation
          </button>
          <button class="btn btn-secondary" (click)="print()" [disabled]="people.length === 0">
            Print
          </button>
        </div>
      </div>

      <!-- Summary cards -->
      <div class="summary-row">
        <div class="summary-card">
          <span class="summary-number">{{ people.length }}</span>
          <span class="summary-label">People on Site</span>
        </div>
        <div class="summary-card">
          <span class="summary-number source-breakdown">
            <span class="source-gate">{{ gateCount }}</span>
            <span class="source-sep">/</span>
            <span class="source-onloc">{{ onLocationCount }}</span>
          </span>
          <span class="summary-label">Gate / OnLocation</span>
        </div>
        <div class="summary-card">
          <span class="summary-number summary-time">{{ lastUpdateDisplay }}</span>
          <span class="summary-label">Last Updated</span>
        </div>
      </div>

      <!-- Error banner -->
      <div class="error-banner" *ngIf="status.error">
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
            <h4>OnLocation API</h4>
            <label>API Key
              <input type="text" [(ngModel)]="config.onLocationApiKey" class="input">
            </label>
            <label>Base URL
              <input type="text" [(ngModel)]="config.onLocationBaseUrl" class="input">
            </label>
            <label>Login Email
              <input type="text" [(ngModel)]="config.onLocationEmail" class="input">
            </label>
            <label>Login Password
              <input type="password" [(ngModel)]="config.onLocationPassword" class="input">
            </label>
          </div>
          <div class="config-section">
            <h4>Gate Website</h4>
            <label>URL
              <input type="text" [(ngModel)]="config.gateWebUrl" class="input">
            </label>
            <label>Username
              <input type="text" [(ngModel)]="config.gateUsername" class="input">
            </label>
            <label>Password
              <input type="password" [(ngModel)]="config.gatePassword" class="input">
            </label>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn btn-primary" (click)="saveConfig()">Save Configuration</button>
          <span class="config-saved" *ngIf="configSaved">Saved</span>
        </div>
      </div>

      <!-- Not configured notice -->
      <div class="notice" *ngIf="!status.configured && !showConfig">
        <span class="notice-icon">&#x2139;</span>
        <div>
          <strong>Not Configured</strong>
          <p>Gate Log requires credentials to connect. Click the gear icon above to configure.</p>
        </div>
      </div>

      <!-- People table -->
      <div class="table-container" *ngIf="people.length > 0">
        <table class="data-table">
          <thead>
            <tr>
              <th class="sortable" (click)="sortBy('name')">
                Name {{ sortField === 'name' ? (sortAsc ? '&#x25B2;' : '&#x25BC;') : '' }}
              </th>
              <th>Source</th>
              <th class="sortable" (click)="sortBy('checkIn')">
                Check In {{ sortField === 'checkIn' ? (sortAsc ? '&#x25B2;' : '&#x25BC;') : '' }}
              </th>
              <th class="sortable" (click)="sortBy('duration')">
                Duration {{ sortField === 'duration' ? (sortAsc ? '&#x25B2;' : '&#x25BC;') : '' }}
              </th>
              <th>Company</th>
              <th>Contact</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let person of people">
              <td class="name-cell">{{ person.name }}</td>
              <td>
                <span class="source-badge" [class.source-gate-badge]="person.source === 'gate'"
                      [class.source-onloc-badge]="person.source === 'onlocation'">
                  {{ person.source === 'gate' ? 'Gate' : 'OnLoc' }}
                </span>
              </td>
              <td>{{ person.checkIn || '--' }}</td>
              <td>{{ person.duration || '--' }}</td>
              <td>{{ person.company }}</td>
              <td class="contact-cell">{{ person.email || person.phone || '--' }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty state -->
      <div class="empty-state" *ngIf="people.length === 0 && status.configured && !status.isRefreshing">
        <p>No people on site. Click Refresh to load data.</p>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 1100px;
      margin: 0 auto;
    }

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

    /* Toolbar */
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
      padding: 4px 8px;
      background: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 6px;
    }

    .toggle-label {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 13px;
      color: var(--text-secondary);
      cursor: pointer;
    }

    .toggle-label input[type="checkbox"] {
      cursor: pointer;
    }

    .select-small {
      padding: 2px 6px;
      font-size: 12px;
      background: var(--bg-secondary);
      color: var(--text-secondary);
      border: 1px solid var(--border-color);
      border-radius: 4px;
    }

    /* Summary cards */
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

    .summary-time {
      font-size: 16px;
    }

    .summary-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .source-breakdown {
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .source-gate { color: #3b82f6; }
    .source-sep { color: var(--text-muted); font-size: 18px; }
    .source-onloc { color: #10b981; }

    /* Error banner */
    .error-banner {
      padding: 10px 16px;
      background: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: var(--accent-error, #ef4444);
      font-size: 13px;
      margin-bottom: 16px;
    }

    /* Config panel */
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

    .config-header h3 {
      margin: 0;
      font-size: 15px;
      color: var(--text-primary);
    }

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

    .input:focus {
      outline: none;
      border-color: var(--accent-primary);
    }

    .config-actions {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .config-saved {
      font-size: 12px;
      color: var(--accent-success, #10b981);
    }

    /* Notice */
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

    /* Table */
    .table-container {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
    }

    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .data-table th.sortable:hover {
      color: var(--text-primary);
    }

    .data-table td {
      padding: 8px 14px;
      font-size: 13px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .data-table tr:last-child td { border-bottom: none; }
    .data-table tr:hover td { background-color: rgba(255, 255, 255, 0.02); }

    .name-cell { font-weight: 500; color: var(--text-primary); }

    .contact-cell {
      font-size: 12px;
      color: var(--text-muted);
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .source-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 600;
    }

    .source-gate-badge {
      background: rgba(59, 130, 246, 0.15);
      color: #3b82f6;
    }

    .source-onloc-badge {
      background: rgba(16, 185, 129, 0.15);
      color: #10b981;
    }

    /* Empty state */
    .empty-state {
      text-align: center;
      padding: 40px;
      color: var(--text-muted);
      font-size: 14px;
    }

    /* Button overrides */
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
export class GateLogComponent implements OnInit, OnDestroy {
  people: GateLogEntry[] = [];
  status: GateLogStatus = {
    lastUpdate: null,
    autoRefreshEnabled: false,
    refreshIntervalMinutes: 60,
    isRefreshing: false,
    configured: false,
    totalPeople: 0
  };
  config: GateLogConfig = {
    onLocationApiKey: '',
    onLocationBaseUrl: '',
    gateWebUrl: '',
    gateUsername: '',
    gatePassword: '',
    onLocationEmail: '',
    onLocationPassword: '',
    autoRefresh: false,
    intervalMinutes: 60
  };

  showConfig = false;
  configSaved = false;
  sortField: 'name' | 'checkIn' | 'duration' = 'checkIn';
  sortAsc = false;

  private unsubscribePeopleUpdated?: () => void;

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    await this.loadStatus();
    await this.loadConfig();
    await this.loadPeople();

    this.unsubscribePeopleUpdated = this.electron.onGateLogPeopleUpdated(() => {
      this.loadPeople();
      this.loadStatus();
    });
  }

  ngOnDestroy(): void {
    this.unsubscribePeopleUpdated?.();
  }

  get gateCount(): number {
    return this.people.filter(p => p.source === 'gate').length;
  }

  get onLocationCount(): number {
    return this.people.filter(p => p.source === 'onlocation').length;
  }

  get lastUpdateDisplay(): string {
    if (!this.status.lastUpdate) return '--';
    const d = new Date(this.status.lastUpdate);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  async loadStatus(): Promise<void> {
    const result = await this.electron.gateLogGetStatus();
    if (result.success && result.data) {
      this.status = result.data;
    }
  }

  async loadConfig(): Promise<void> {
    const result = await this.electron.gateLogGetConfig();
    if (result.success && result.data) {
      this.config = result.data;
    }
  }

  async loadPeople(): Promise<void> {
    const result = await this.electron.gateLogGetPeople();
    if (result.success && result.data) {
      this.people = result.data;
      this.applySorting();
    }
  }

  async refresh(): Promise<void> {
    this.status.isRefreshing = true;
    const result = await this.electron.gateLogRefresh();
    if (result.success && result.data) {
      this.people = result.data;
      this.applySorting();
    }
    await this.loadStatus();
  }

  async toggleAutoRefresh(event: Event): Promise<void> {
    const enabled = (event.target as HTMLInputElement).checked;
    await this.electron.gateLogSetAutoRefresh(enabled, this.status.refreshIntervalMinutes);
    await this.loadStatus();
  }

  async setInterval(minutes: number): Promise<void> {
    await this.electron.gateLogSetAutoRefresh(this.status.autoRefreshEnabled, +minutes);
    await this.loadStatus();
  }

  async openGateWeb(): Promise<void> {
    const url = this.config.gateWebUrl || 'https://10.56.80.80/';
    await this.electron.openWebView('gate-website', url);
  }

  async openOnLocation(): Promise<void> {
    await this.electron.openWebView('onlocation', 'https://us3.whosonlocation.com/login');
  }

  async print(): Promise<void> {
    await this.electron.gateLogPrint();
  }

  async saveConfig(): Promise<void> {
    const result = await this.electron.gateLogSaveConfig(this.config);
    if (result.success) {
      this.configSaved = true;
      setTimeout(() => this.configSaved = false, 2000);
      await this.loadStatus();
    }
  }

  sortBy(field: 'name' | 'checkIn' | 'duration'): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = field === 'name';
    }
    this.applySorting();
  }

  private applySorting(): void {
    const dir = this.sortAsc ? 1 : -1;
    this.people.sort((a, b) => {
      const aVal = (a as any)[this.sortField] || '';
      const bVal = (b as any)[this.sortField] || '';
      return aVal.localeCompare(bVal) * dir;
    });
  }
}
