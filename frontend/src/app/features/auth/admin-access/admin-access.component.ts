import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { GlobalMessageService } from '../../../shared/global-message/global-message.service';

interface GrantInfo {
  id: number;
  userName: string;
  userEmail: string;
  status: string;
  requestIp: string;
  deviceInfo: string;
  requestedAt: string;
  approvedAt: string | null;
  expiresAt: string | null;
  lastActiveAt: string | null;
  approvedByName: string | null;
}

@Component({
  selector: 'app-admin-access',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  template: `
    <app-main-layout pageTitle="Access Management">
      <div class="admin-container">

        <div *ngIf="lanError" class="error-box">{{ lanError }}</div>

        <!-- Stats Bar -->
        <div class="stats-bar" *ngIf="!lanError">
          <div class="stat-card">
            <span class="stat-value pending-text">{{ pendingRequests.length }}</span>
            <span class="stat-label">Pending</span>
          </div>
          <div class="stat-card">
            <span class="stat-value active-text">{{ activeGrants.length }}</span>
            <span class="stat-label">Active</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{ grantHistory.length }}</span>
            <span class="stat-label">Total</span>
          </div>
          <div class="stat-actions">
            <label class="auto-refresh-toggle">
              <input type="checkbox" [(ngModel)]="autoRefresh" (ngModelChange)="toggleAutoRefresh()" />
              Auto-refresh
            </label>
            <select *ngIf="autoRefresh" [(ngModel)]="refreshInterval" (ngModelChange)="toggleAutoRefresh()" class="interval-select">
              <option [ngValue]="10000">10s</option>
              <option [ngValue]="30000">30s</option>
              <option [ngValue]="60000">60s</option>
            </select>
            <button class="btn secondary small" (click)="refresh()">Refresh</button>
          </div>
        </div>

        <!-- Pending Requests -->
        <div class="section" *ngIf="!lanError">
          <h3>Pending Requests <span class="count">({{ pendingRequests.length }})</span></h3>
          <div *ngIf="pendingRequests.length === 0" class="empty">No pending requests</div>
          <table *ngIf="pendingRequests.length > 0" class="grant-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>IP</th>
                <th>Requested</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let req of pendingRequests">
                <td>{{ req.userName }}</td>
                <td>{{ req.userEmail }}</td>
                <td>{{ req.requestIp }}</td>
                <td>{{ req.requestedAt | date:'short' }}</td>
                <td class="actions-cell">
                  <button (click)="approve(req.id)" class="btn approve small">Approve</button>
                  <button (click)="deny(req.id)" class="btn deny small">Deny</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Active Grants -->
        <div class="section" *ngIf="!lanError">
          <h3>Active Grants <span class="count">({{ activeGrants.length }})</span></h3>
          <div *ngIf="activeGrants.length === 0" class="empty">No active grants</div>
          <table *ngIf="activeGrants.length > 0" class="grant-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Approved By</th>
                <th>Remaining</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <ng-container *ngFor="let grant of activeGrants">
                <tr>
                  <td>{{ grant.userName }}</td>
                  <td>{{ grant.userEmail }}</td>
                  <td>{{ grant.approvedByName || '-' }}</td>
                  <td>
                    <span class="remaining-badge" [ngClass]="getRemainingClass(grant)">
                      {{ getRemainingTime(grant) }}
                    </span>
                  </td>
                  <td>{{ grant.lastActiveAt | date:'short' }}</td>
                  <td class="actions-cell">
                    <button (click)="toggleProlong(grant.id)" class="btn prolong small">Prolong</button>
                    <button *ngIf="confirmRevokeId !== grant.id" (click)="confirmRevokeId = grant.id" class="btn revoke small">Revoke</button>
                    <span *ngIf="confirmRevokeId === grant.id" class="confirm-inline">
                      Sure?
                      <button (click)="revoke(grant.id)" class="btn revoke small">Yes</button>
                      <button (click)="confirmRevokeId = null" class="btn secondary small">No</button>
                    </span>
                  </td>
                </tr>
                <!-- Prolong Row -->
                <tr *ngIf="prolongGrantId === grant.id" class="prolong-row">
                  <td colspan="6">
                    <div class="prolong-form">
                      <span class="prolong-label">Extend by:</span>
                      <button *ngFor="let h of prolongPresets" class="btn duration-btn small"
                              [class.selected]="prolongHours === h" (click)="prolongHours = h">
                        {{ h }}h
                      </button>
                      <button class="btn approve small" (click)="prolong(grant.id)" [disabled]="!prolongHours">Confirm</button>
                      <button class="btn secondary small" (click)="prolongGrantId = null">Cancel</button>
                    </div>
                  </td>
                </tr>
              </ng-container>
            </tbody>
          </table>
        </div>

        <!-- Grant History (Collapsible) -->
        <div class="section" *ngIf="!lanError">
          <div class="section-header clickable" (click)="showHistory = !showHistory">
            <h3>Grant History <span class="count">({{ grantHistory.length }})</span></h3>
            <span class="toggle-icon">{{ showHistory ? '\u25BC' : '\u25B6' }}</span>
          </div>
          <div *ngIf="showHistory">
            <div class="filter-row">
              <button *ngFor="let f of statusFilters" class="btn filter-btn small"
                      [class.active]="historyFilter === f" (click)="historyFilter = f">
                {{ f }}
              </button>
            </div>
            <div *ngIf="filteredHistory.length === 0" class="empty">No grants matching filter</div>
            <table *ngIf="filteredHistory.length > 0" class="grant-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>User</th>
                  <th>Email</th>
                  <th>IP</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Expires</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let g of filteredHistory">
                  <td><span class="status-badge" [ngClass]="'status-' + g.status.toLowerCase()">{{ g.status }}</span></td>
                  <td>{{ g.userName }}</td>
                  <td>{{ g.userEmail }}</td>
                  <td>{{ g.requestIp }}</td>
                  <td>{{ g.requestedAt | date:'short' }}</td>
                  <td>{{ g.approvedAt ? (g.approvedAt | date:'short') : '-' }}</td>
                  <td>{{ g.expiresAt ? (g.expiresAt | date:'short') : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .admin-container { padding: 20px; max-width: 1000px; margin: 0 auto; }

    /* Stats Bar */
    .stats-bar {
      display: flex;
      align-items: center;
      gap: 16px;
      margin-bottom: 24px;
      padding: 16px 20px;
      background: var(--secondary-background, #16213e);
      border-radius: 10px;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 70px;
    }

    .stat-value {
      font-size: 24px;
      font-weight: 700;
      color: var(--primary-text, #e0e0e0);
    }

    .stat-value.pending-text { color: #f1c40f; }
    .stat-value.active-text { color: #2ecc71; }

    .stat-label {
      font-size: 11px;
      color: var(--secondary-text, #888);
      margin-top: 2px;
    }

    .stat-actions {
      margin-left: auto;
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .auto-refresh-toggle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--secondary-text, #888);
      cursor: pointer;
    }

    .auto-refresh-toggle input {
      accent-color: var(--accent-color, #533483);
    }

    .interval-select {
      padding: 4px 8px;
      background: var(--primary-background, #0f3460);
      color: var(--primary-text, #e0e0e0);
      border: 1px solid var(--border-color, #333);
      border-radius: 4px;
      font-size: 12px;
    }

    /* Sections */
    .section {
      margin-bottom: 24px;
    }

    h3 {
      color: var(--primary-text, #e0e0e0);
      margin: 0 0 12px 0;
      font-size: 15px;
    }

    .count { color: var(--secondary-text, #888); font-weight: 400; }

    .empty {
      color: var(--secondary-text, #666);
      font-style: italic;
      padding: 16px 0;
      font-size: 13px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .section-header.clickable {
      cursor: pointer;
      padding: 8px 0;
    }

    .section-header.clickable:hover h3 {
      color: var(--accent-color, #533483);
    }

    .toggle-icon {
      color: var(--secondary-text, #888);
      font-size: 12px;
    }

    /* Tables */
    .grant-table {
      width: 100%;
      border-collapse: collapse;
      background: var(--secondary-background, #16213e);
      border-radius: 8px;
      overflow: hidden;
    }

    .grant-table th {
      background: var(--primary-background, #0f3460);
      color: var(--secondary-text, #aaa);
      padding: 10px 12px;
      text-align: left;
      font-size: 12px;
      font-weight: 500;
    }

    .grant-table td {
      padding: 10px 12px;
      color: var(--primary-text, #ddd);
      border-top: 1px solid rgba(255, 255, 255, 0.04);
      font-size: 13px;
    }

    .actions-cell {
      white-space: nowrap;
    }

    /* Remaining Time */
    .remaining-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 11px;
      font-weight: 600;
    }

    .remaining-green { background: rgba(46, 204, 113, 0.15); color: #2ecc71; }
    .remaining-yellow { background: rgba(241, 196, 15, 0.15); color: #f1c40f; }
    .remaining-red { background: rgba(231, 76, 60, 0.15); color: #e74c3c; }

    /* Status Badges */
    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
    }

    .status-approved { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
    .status-pending { background: rgba(241, 196, 15, 0.2); color: #f1c40f; }
    .status-expired { background: rgba(149, 165, 166, 0.2); color: #95a5a6; }
    .status-denied, .status-revoked { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }

    /* Prolong Row */
    .prolong-row td {
      background: rgba(255, 255, 255, 0.02);
    }

    .prolong-form {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }

    .prolong-label {
      font-size: 13px;
      color: var(--secondary-text, #888);
      margin-right: 4px;
    }

    .duration-btn {
      background: rgba(255, 255, 255, 0.06) !important;
      border: 1px solid var(--border-color, #333) !important;
    }

    .duration-btn.selected {
      background: var(--accent-color, #533483) !important;
      border-color: var(--accent-color, #533483) !important;
    }

    /* Filter Row */
    .filter-row {
      display: flex;
      gap: 6px;
      margin-bottom: 12px;
      flex-wrap: wrap;
    }

    .filter-btn {
      background: rgba(255, 255, 255, 0.06) !important;
      border: 1px solid var(--border-color, #333) !important;
    }

    .filter-btn.active {
      background: var(--accent-color, #533483) !important;
      border-color: var(--accent-color, #533483) !important;
    }

    /* Confirm Inline */
    .confirm-inline {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #e74c3c;
    }

    /* Buttons */
    .btn {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      margin-right: 4px;
      transition: all 0.2s;
    }

    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn:hover:not(:disabled) { opacity: 0.85; }

    .btn.approve { background: #2d8a4e; }
    .btn.deny { background: #c0392b; }
    .btn.revoke { background: #e67e22; }
    .btn.prolong { background: #2d5aa0; }
    .btn.secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-color, #333);
    }
    .btn.small { padding: 5px 12px; font-size: 11px; }

    .error-box {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      color: #ff6b6b;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
      font-size: 13px;
    }

    @media (max-width: 768px) {
      .stats-bar { flex-wrap: wrap; }
      .stat-actions { width: 100%; justify-content: flex-end; }
    }
  `]
})
export class AdminAccessComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private messageService = inject(GlobalMessageService);
  private adminUrl = `${environment.baseApiUrl}/api/auth/admin`;

  pendingRequests: GrantInfo[] = [];
  activeGrants: GrantInfo[] = [];
  grantHistory: GrantInfo[] = [];
  lanError = '';

  // Prolong
  prolongGrantId: number | null = null;
  prolongHours: number | null = null;
  prolongPresets = [1, 4, 8, 12, 24, 48, 72];

  // Revoke confirmation
  confirmRevokeId: number | null = null;

  // History
  showHistory = false;
  historyFilter = 'All';
  statusFilters = ['All', 'APPROVED', 'PENDING', 'EXPIRED', 'DENIED', 'REVOKED'];

  // Auto-refresh
  autoRefresh = false;
  refreshInterval = 30000;
  private refreshTimer: any;

  get filteredHistory(): GrantInfo[] {
    if (this.historyFilter === 'All') return this.grantHistory;
    return this.grantHistory.filter(g => g.status === this.historyFilter);
  }

  ngOnInit(): void {
    this.refresh();
  }

  ngOnDestroy(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
  }

  refresh(): void {
    this.lanError = '';
    this.confirmRevokeId = null;

    this.http.get<GrantInfo[]>(`${this.adminUrl}/pending`, { withCredentials: true }).subscribe({
      next: (data) => this.pendingRequests = data,
      error: (err) => {
        if (err.error?.error === 'LOCALHOST_REQUIRED') {
          this.lanError = 'Access management is only available from the desktop application.';
        }
      }
    });

    this.http.get<GrantInfo[]>(`${this.adminUrl}/active-grants`, { withCredentials: true }).subscribe({
      next: (data) => this.activeGrants = data,
      error: () => {}
    });

    this.http.get<GrantInfo[]>(`${this.adminUrl}/grant-history`, { withCredentials: true }).subscribe({
      next: (data) => this.grantHistory = data,
      error: () => {}
    });
  }

  approve(id: number): void {
    this.http.post(`${this.adminUrl}/approve/${id}`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.messageService.showSuccess('Access approved');
        this.refresh();
      },
      error: (err) => this.messageService.showError(err.error?.message || 'Failed to approve')
    });
  }

  deny(id: number): void {
    this.http.post(`${this.adminUrl}/deny/${id}`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.messageService.showSuccess('Access denied');
        this.refresh();
      },
      error: (err) => this.messageService.showError(err.error?.message || 'Failed to deny')
    });
  }

  revoke(id: number): void {
    this.confirmRevokeId = null;
    this.http.post(`${this.adminUrl}/revoke/${id}`, {}, { withCredentials: true }).subscribe({
      next: () => {
        this.messageService.showSuccess('Access revoked');
        this.refresh();
      },
      error: (err) => this.messageService.showError(err.error?.message || 'Failed to revoke')
    });
  }

  toggleProlong(grantId: number): void {
    if (this.prolongGrantId === grantId) {
      this.prolongGrantId = null;
    } else {
      this.prolongGrantId = grantId;
      this.prolongHours = 24;
    }
  }

  prolong(id: number): void {
    if (!this.prolongHours) return;
    this.http.post(`${this.adminUrl}/prolong/${id}`, { hours: this.prolongHours }, { withCredentials: true }).subscribe({
      next: (res: any) => {
        this.messageService.showSuccess(res.message || 'Grant extended');
        this.prolongGrantId = null;
        this.prolongHours = null;
        this.refresh();
      },
      error: (err) => this.messageService.showError(err.error?.message || 'Failed to prolong')
    });
  }

  toggleAutoRefresh(): void {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    if (this.autoRefresh) {
      this.refreshTimer = setInterval(() => this.refresh(), this.refreshInterval);
    }
  }

  getRemainingTime(grant: GrantInfo): string {
    if (!grant.expiresAt) return '-';
    const diff = new Date(grant.expiresAt).getTime() - Date.now();
    if (diff <= 0) return 'Expired';
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  getRemainingClass(grant: GrantInfo): string {
    if (!grant.expiresAt) return '';
    const diff = new Date(grant.expiresAt).getTime() - Date.now();
    const hours = diff / 3600000;
    if (hours > 4) return 'remaining-green';
    if (hours > 1) return 'remaining-yellow';
    return 'remaining-red';
  }
}
