import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

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
    <div class="sp-sync-container">
      <h2>SharePoint Sync</h2>

      <div *ngIf="message" class="message-banner" [ngClass]="messageType" (click)="message = ''">
        {{ message }}
        <span class="close-btn">&times;</span>
      </div>

      <div *ngIf="loading" class="loading">Loading configuration...</div>

      <div *ngIf="!loading && config" class="card">
        <h3>Auto-Sync Configuration</h3>
        <p class="card-desc">
          When enabled, Work Requests and JHAs are periodically pulled from SharePoint into the local database.
        </p>

        <div class="setting-row">
          <label class="setting-label">Auto-Sync</label>
          <label class="toggle">
            <input type="checkbox" [(ngModel)]="config.enabled" (change)="save()">
            <span class="slider"></span>
            <span class="toggle-text">{{ config.enabled ? 'ON' : 'OFF' }}</span>
          </label>
        </div>

        <div class="setting-row">
          <label class="setting-label">SharePoint Sync Interval</label>
          <select [(ngModel)]="config.intervalMs" (change)="save()" [disabled]="!config.enabled" class="interval-select">
            <option [ngValue]="60000">1 minute</option>
            <option [ngValue]="120000">2 minutes</option>
            <option [ngValue]="300000">5 minutes</option>
            <option [ngValue]="600000">10 minutes</option>
            <option [ngValue]="900000">15 minutes</option>
            <option [ngValue]="1800000">30 minutes</option>
          </select>
        </div>

        <div class="setting-row">
          <label class="setting-label">Peer Sync Interval</label>
          <select [(ngModel)]="config.peerSyncIntervalSeconds" (change)="save()" class="interval-select">
            <option [ngValue]="15">15 seconds</option>
            <option [ngValue]="30">30 seconds</option>
            <option [ngValue]="60">1 minute</option>
            <option [ngValue]="120">2 minutes</option>
            <option [ngValue]="300">5 minutes</option>
          </select>
        </div>

        <div class="setting-row">
          <label class="setting-label">Health Check Interval</label>
          <select [(ngModel)]="config.healthCheckIntervalMs" (change)="save()" class="interval-select">
            <option [ngValue]="60000">1 minute</option>
            <option [ngValue]="120000">2 minutes</option>
            <option [ngValue]="300000">5 minutes</option>
            <option [ngValue]="600000">10 minutes</option>
            <option [ngValue]="900000">15 minutes</option>
            <option [ngValue]="1800000">30 minutes</option>
          </select>
        </div>
      </div>

      <div *ngIf="!loading" class="card">
        <h3>Manual Sync</h3>
        <p class="card-desc">Trigger a one-time sync from SharePoint regardless of auto-sync settings.</p>
        <div class="btn-row">
          <button class="btn btn-primary" (click)="syncWorkRequests()" [disabled]="syncing">
            {{ syncingWr ? 'Syncing...' : 'Sync Work Requests' }}
          </button>
          <button class="btn btn-primary" (click)="syncJhas()" [disabled]="syncing">
            {{ syncingJha ? 'Syncing...' : 'Sync JHAs' }}
          </button>
        </div>
        <div *ngIf="lastSyncResult" class="sync-result">{{ lastSyncResult }}</div>
      </div>
    </div>
  `,
  styles: [`
    .sp-sync-container {
      padding: 16px;
      max-width: 600px;
    }

    h2 {
      margin: 0 0 16px;
    }

    .card {
      background: var(--card-bg, #fff);
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .card h3 {
      margin: 0 0 4px;
      font-size: 15px;
    }

    .card-desc {
      color: #888;
      font-size: 13px;
      margin: 0 0 16px;
    }

    .setting-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 12px 0;
      border-bottom: 1px solid var(--border-color, #eee);
    }

    .setting-row:last-of-type {
      border-bottom: none;
    }

    .setting-label {
      font-size: 14px;
      font-weight: 500;
    }

    /* Toggle switch */
    .toggle {
      display: flex;
      align-items: center;
      gap: 8px;
      cursor: pointer;
    }

    .toggle input { display: none; }

    .slider {
      width: 40px;
      height: 22px;
      background: #ccc;
      border-radius: 11px;
      position: relative;
      transition: background 0.2s;
    }

    .slider::after {
      content: '';
      width: 18px;
      height: 18px;
      background: #fff;
      border-radius: 50%;
      position: absolute;
      top: 2px;
      left: 2px;
      transition: transform 0.2s;
    }

    .toggle input:checked + .slider {
      background: #4caf50;
    }

    .toggle input:checked + .slider::after {
      transform: translateX(18px);
    }

    .toggle-text {
      font-size: 13px;
      font-weight: 600;
      min-width: 28px;
    }

    .interval-select {
      padding: 6px 12px;
      border: 1px solid var(--border-color, #ccc);
      border-radius: 6px;
      font-size: 13px;
      background: var(--input-bg, #fff);
      color: inherit;
    }

    .interval-select:disabled {
      opacity: 0.5;
    }

    .btn-row {
      display: flex;
      gap: 8px;
    }

    .btn {
      padding: 8px 16px;
      border: none;
      border-radius: 6px;
      font-size: 13px;
      cursor: pointer;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background: #1976d2;
      color: #fff;
    }

    .sync-result {
      margin-top: 12px;
      padding: 10px;
      border-radius: 6px;
      font-size: 13px;
      background: rgba(76, 175, 80, 0.1);
      color: #4caf50;
    }

    .message-banner {
      padding: 10px 16px;
      border-radius: 6px;
      margin-bottom: 12px;
      font-size: 13px;
      cursor: pointer;
      display: flex;
      justify-content: space-between;
    }

    .message-banner.success { background: rgba(76,175,80,0.1); color: #4caf50; }
    .message-banner.error { background: rgba(244,67,54,0.1); color: #f44336; }
    .message-banner.info { background: rgba(33,150,243,0.1); color: #2196f3; }

    .close-btn { cursor: pointer; font-weight: bold; }

    .loading { color: #888; font-size: 13px; padding: 20px 0; }
  `]
})
export class SharepointSyncComponent implements OnInit {
  config: SyncConfig | null = null;
  loading = true;
  message = '';
  messageType: 'success' | 'error' | 'info' = 'info';
  syncingWr = false;
  syncingJha = false;
  lastSyncResult = '';

  get syncing() { return this.syncingWr || this.syncingJha; }

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadConfig();
  }

  loadConfig(): void {
    this.http.get<{ data: SyncConfig }>('/api/sharepoint-sync/config').subscribe({
      next: (resp) => {
        this.config = resp.data;
        this.loading = false;
      },
      error: (err) => {
        this.showMessage('Failed to load config: ' + (err.error?.message || err.message), 'error');
        this.loading = false;
      }
    });
  }

  save(): void {
    if (!this.config) return;
    this.http.put<{ data: SyncConfig }>('/api/sharepoint-sync/config', this.config).subscribe({
      next: (resp) => {
        this.config = resp.data;
        this.showMessage('Configuration saved', 'success');
      },
      error: (err) => {
        this.showMessage('Failed to save: ' + (err.error?.message || err.message), 'error');
      }
    });
  }

  syncWorkRequests(): void {
    this.syncingWr = true;
    this.lastSyncResult = '';
    this.http.post<{ message: string }>('/work-requests-api/sync', {}).subscribe({
      next: (resp) => {
        this.lastSyncResult = 'WR: ' + resp.message;
        this.syncingWr = false;
      },
      error: (err) => {
        this.showMessage('WR sync failed: ' + (err.error?.message || err.message), 'error');
        this.syncingWr = false;
      }
    });
  }

  syncJhas(): void {
    this.syncingJha = true;
    this.lastSyncResult = '';
    this.http.post<{ message: string }>('/jha-api/sync', {}).subscribe({
      next: (resp) => {
        this.lastSyncResult = 'JHA: ' + resp.message;
        this.syncingJha = false;
      },
      error: (err) => {
        this.showMessage('JHA sync failed: ' + (err.error?.message || err.message), 'error');
        this.syncingJha = false;
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
