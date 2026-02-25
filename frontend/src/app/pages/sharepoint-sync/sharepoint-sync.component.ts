import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  SharePointSyncStatusService,
  SharePointSyncStatus,
} from '../../services/sharepoint-sync-status.service';

interface SyncConfig {
  enabled: boolean;
  intervalMs: number;
  peerSyncIntervalSeconds: number;
  healthCheckIntervalMs: number;
}

@Component({
  selector: 'app-sharepoint-sync',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container">
      <div class="page-header">
        <h2>SharePoint Sync</h2>
        <span *ngIf="config" class="status-badge" [ngClass]="config.enabled ? 'status-online' : 'status-offline'">
          {{ config.enabled ? 'Auto-Sync On' : 'Auto-Sync Off' }}
        </span>
      </div>

      <div *ngIf="message" class="message-banner" [ngClass]="messageType" (click)="message = ''">
        <span>{{ message }}</span>
        <span class="close-btn">&times;</span>
      </div>

      <div *ngIf="loading" class="card loading-card">
        <div class="loading-text">Loading configuration...</div>
      </div>

      <div *ngIf="!loading && config" class="card">
        <h3>Auto-Sync Configuration</h3>
        <p class="card-desc">
          When enabled, Work Requests and JHAs are periodically pulled from SharePoint into the local database.
        </p>

        <div class="settings-list">
          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Auto-Sync</span>
              <span class="setting-hint">Enable automatic background syncing</span>
            </div>
            <label class="toggle">
              <input type="checkbox" [(ngModel)]="config.enabled" (change)="save()">
              <span class="toggle-track"></span>
            </label>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">SharePoint Sync Interval</span>
              <span class="setting-hint">How often to pull from SharePoint</span>
            </div>
            <select [(ngModel)]="config.intervalMs" (change)="save()" [disabled]="!config.enabled" class="interval-select">
              <option [ngValue]="60000">1 min</option>
              <option [ngValue]="120000">2 min</option>
              <option [ngValue]="300000">5 min</option>
              <option [ngValue]="600000">10 min</option>
              <option [ngValue]="900000">15 min</option>
              <option [ngValue]="1800000">30 min</option>
            </select>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Peer Sync Interval</span>
              <span class="setting-hint">Frequency for peer-to-peer sync</span>
            </div>
            <select [(ngModel)]="config.peerSyncIntervalSeconds" (change)="save()" class="interval-select">
              <option [ngValue]="15">15 sec</option>
              <option [ngValue]="30">30 sec</option>
              <option [ngValue]="60">1 min</option>
              <option [ngValue]="120">2 min</option>
              <option [ngValue]="300">5 min</option>
            </select>
          </div>

          <div class="setting-row">
            <div class="setting-info">
              <span class="setting-label">Health Check Interval</span>
              <span class="setting-hint">How often to check connection health</span>
            </div>
            <select [(ngModel)]="config.healthCheckIntervalMs" (change)="save()" class="interval-select">
              <option [ngValue]="60000">1 min</option>
              <option [ngValue]="120000">2 min</option>
              <option [ngValue]="300000">5 min</option>
              <option [ngValue]="600000">10 min</option>
              <option [ngValue]="900000">15 min</option>
              <option [ngValue]="1800000">30 min</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Entity Sync Status -->
      <div *ngIf="!loading && entityStatuses.length > 0" class="card">
        <h3>Entity Sync Status</h3>
        <p class="card-desc">Per-entity sync status and last sync details.</p>
        <div class="status-table">
          <div class="status-row header-row">
            <span class="col-type">Entity</span>
            <span class="col-hub">Hub</span>
            <span class="col-time">Last Sync</span>
            <span class="col-result">Last Result</span>
          </div>
          <div *ngFor="let s of entityStatuses" class="status-row">
            <span class="col-type">{{ s.entityType }}</span>
            <span class="col-hub">
              <span class="hub-chip" [ngClass]="s.hubOnline ? 'chip-online' : 'chip-offline'">
                {{ s.hubOnline ? 'Online' : 'Offline' }}
              </span>
              <span *ngIf="s.dataStale" class="stale-chip">Stale</span>
            </span>
            <span class="col-time">{{ s.lastSyncTimeFormatted }}</span>
            <span class="col-result" *ngIf="s.lastResult">
              {{ s.lastResult.created }}C / {{ s.lastResult.updated }}U / {{ s.lastResult.skipped }}S
            </span>
            <span class="col-result" *ngIf="!s.lastResult">—</span>
          </div>
        </div>
      </div>

      <!-- Manual Sync -->
      <div *ngIf="!loading" class="card">
        <h3>Manual Sync</h3>
        <p class="card-desc">Trigger a one-time sync from SharePoint regardless of auto-sync settings. When hub is online, requests are routed through the hub.</p>
        <div class="btn-row">
          <button class="btn btn-primary" (click)="syncEntity('WorkRequest')" [disabled]="syncing">
            <span *ngIf="syncingType === 'WorkRequest'" class="spinner"></span>
            {{ syncingType === 'WorkRequest' ? 'Syncing...' : 'Sync Work Requests' }}
          </button>
          <button class="btn btn-primary" (click)="syncEntity('Jha')" [disabled]="syncing">
            <span *ngIf="syncingType === 'Jha'" class="spinner"></span>
            {{ syncingType === 'Jha' ? 'Syncing...' : 'Sync JHAs' }}
          </button>
        </div>
        <div *ngIf="lastSyncResult" class="sync-result">
          {{ lastSyncResult }}
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container {
      padding: 20px;
      max-width: 640px;
    }

    .page-header {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .page-header h2 {
      margin: 0;
      color: var(--primary-text, #212529);
      font-size: 20px;
      font-weight: 600;
    }

    .status-badge {
      padding: 4px 10px;
      border-radius: 4px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    .status-online {
      background: var(--success-background, #c8e6c9);
      color: #155724;
    }

    .status-offline {
      background: var(--secondary-background, #f0f2f5);
      color: var(--secondary-text, #495057);
    }

    /* Cards */
    .card {
      background: var(--card-background, #ffffff);
      border-radius: 8px;
      box-shadow: var(--card-shadow, 0 2px 4px rgba(0, 0, 0, 0.1));
      padding: 20px;
      margin-bottom: 20px;
    }

    .card h3 {
      margin: 0 0 4px;
      font-size: 15px;
      font-weight: 600;
      color: var(--primary-text, #212529);
    }

    .card-desc {
      color: var(--secondary-text, #495057);
      font-size: 13px;
      margin: 0 0 16px;
      line-height: 1.4;
    }

    .loading-card {
      display: flex;
      justify-content: center;
      padding: 40px 20px;
    }

    .loading-text {
      color: var(--secondary-text, #495057);
      font-size: 14px;
    }

    /* Settings */
    .settings-list {
      border-top: 1px solid var(--border-color, #dee2e6);
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 14px 0;
      border-bottom: 1px solid var(--border-color, #dee2e6);
    }

    .setting-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .setting-label {
      font-size: 14px;
      font-weight: 500;
      color: var(--primary-text, #212529);
    }

    .setting-hint {
      font-size: 12px;
      color: var(--secondary-text, #495057);
    }

    /* Toggle switch */
    .toggle {
      position: relative;
      cursor: pointer;
      display: inline-block;
    }

    .toggle input { display: none; }

    .toggle-track {
      display: block;
      width: 44px;
      height: 24px;
      background: var(--border-color, #ccc);
      border-radius: 12px;
      position: relative;
      transition: background 0.2s;
    }

    .toggle-track::after {
      content: '';
      width: 20px;
      height: 20px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.2);
    }

    .toggle input:checked + .toggle-track {
      background: #4caf50;
    }

    .toggle input:checked + .toggle-track::after {
      transform: translateX(20px);
    }

    /* Select */
    .interval-select {
      padding: 8px 12px;
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      font-size: 14px;
      background: var(--card-background, #fff);
      color: var(--primary-text, #212529);
      min-width: 90px;
      cursor: pointer;
    }

    .interval-select:focus {
      outline: none;
      border-color: var(--accent-color, #007bff);
    }

    .interval-select:disabled {
      opacity: 0.45;
      cursor: not-allowed;
    }

    /* Status table */
    .status-table {
      border: 1px solid var(--border-color, #dee2e6);
      border-radius: 4px;
      overflow: hidden;
    }

    .status-row {
      display: flex;
      align-items: center;
      padding: 10px 12px;
      border-bottom: 1px solid var(--border-color, #dee2e6);
      font-size: 13px;
    }

    .status-row:last-child { border-bottom: none; }

    .header-row {
      font-weight: 600;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      color: var(--secondary-text, #495057);
      background: var(--secondary-background, #f8f9fa);
    }

    .col-type { flex: 1; }
    .col-hub { flex: 1; display: flex; gap: 6px; align-items: center; }
    .col-time { flex: 1; }
    .col-result { flex: 1.5; }

    .hub-chip {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
    }

    .chip-online {
      background: rgba(76, 175, 80, 0.15);
      color: #388e3c;
    }

    .chip-offline {
      background: rgba(244, 67, 54, 0.15);
      color: #d32f2f;
    }

    .stale-chip {
      padding: 2px 6px;
      border-radius: 3px;
      font-size: 10px;
      font-weight: 600;
      text-transform: uppercase;
      background: rgba(255, 152, 0, 0.15);
      color: #f57c00;
    }

    /* Buttons */
    .btn-row {
      display: flex;
      gap: 10px;
      flex-wrap: wrap;
    }

    .btn {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .btn-primary {
      background: var(--accent-color, #007bff);
      color: #fff;
    }

    .btn-primary:hover:not(:disabled) {
      background: var(--accent-color-hover, #0056b3);
    }

    /* Spinner */
    .spinner {
      display: inline-block;
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: #fff;
      border-radius: 50%;
      animation: spin 0.6s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    /* Sync result */
    .sync-result {
      margin-top: 12px;
      padding: 12px 16px;
      border-radius: 4px;
      font-size: 13px;
      background: var(--success-background, #c8e6c9);
      color: #155724;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    /* Message banner */
    .message-banner {
      padding: 12px 20px;
      border-radius: 4px;
      margin-bottom: 20px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .message-banner.success {
      background: var(--success-background, #c8e6c9);
      color: #155724;
      border: 1px solid rgba(40, 167, 69, 0.3);
    }

    .message-banner.error {
      background: var(--error-background, #ffcdd2);
      color: #721c24;
      border: 1px solid rgba(220, 53, 69, 0.3);
    }

    .message-banner.info {
      background: rgba(77, 171, 247, 0.15);
      color: var(--accent-color, #007bff);
      border: 1px solid rgba(77, 171, 247, 0.3);
    }

    .close-btn {
      font-size: 18px;
      font-weight: bold;
      opacity: 0.7;
      margin-left: 12px;
    }

    .close-btn:hover { opacity: 1; }

    /* Responsive */
    @media (max-width: 480px) {
      .setting-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 8px;
      }

      .btn-row {
        flex-direction: column;
      }

      .btn { width: 100%; justify-content: center; }
    }
  `]
})
export class SharepointSyncComponent implements OnInit {
  private syncStatusService = inject(SharePointSyncStatusService);

  config: SyncConfig | null = null;
  loading = true;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  syncingType: string | null = null;
  lastSyncResult = '';
  entityStatuses: SharePointSyncStatus[] = [];

  get syncing() { return this.syncingType !== null; }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadConfig();
    this.loadStatuses();
  }

  loadConfig(): void {
    this.http.get<{ responseData: SyncConfig }>(`${environment.baseApiUrl}/api/sharepoint-sync/config`).subscribe({
      next: (resp) => {
        this.config = resp.responseData;
        this.loading = false;
      },
      error: (err) => {
        this.showMessage('Failed to load config: ' + (err.error?.message || err.message), 'error');
        this.loading = false;
      }
    });
  }

  loadStatuses(): void {
    this.syncStatusService.getAllStatuses().subscribe({
      next: (resp) => {
        this.entityStatuses = resp.responseData || [];
      },
      error: () => {}
    });
  }

  save(): void {
    if (!this.config) return;
    this.http.put<{ responseData: SyncConfig }>(`${environment.baseApiUrl}/api/sharepoint-sync/config`, this.config).subscribe({
      next: (resp) => {
        this.config = resp.responseData;
        this.showMessage('Configuration saved', 'success');
      },
      error: (err) => {
        this.showMessage('Failed to save: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  syncEntity(entityType: string): void {
    this.syncingType = entityType;
    this.lastSyncResult = '';
    this.syncStatusService.triggerSync(entityType).subscribe({
      next: (resp) => {
        const r = resp.responseData;
        this.lastSyncResult = `${entityType}: ${r?.created ?? 0} created, ${r?.updated ?? 0} updated, ${r?.skipped ?? 0} skipped`;
        this.syncingType = null;
        this.loadStatuses();
      },
      error: (err) => {
        this.showMessage(`${entityType} sync failed: ` + (err.error?.message || err.message), 'error');
        this.syncingType = null;
      }
    });
  }

  private showMessage(msg: string, type: 'success' | 'error' | 'info'): void {
    this.message = msg;
    this.messageType = type;
    if (type === 'success') {
      setTimeout(() => { if (this.message === msg) this.message = ''; }, 5000);
    }
  }
}
