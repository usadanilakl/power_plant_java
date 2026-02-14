import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';

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
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout pageTitle="Access Management">
      <div class="admin-container">

        <div *ngIf="lanError" class="error-message">
          {{ lanError }}
        </div>

        <!-- Pending Requests -->
        <div class="section">
          <h3>Pending Access Requests ({{ pendingRequests.length }})</h3>
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
                <td>
                  <button (click)="approve(req.id)" class="btn approve">Approve</button>
                  <button (click)="deny(req.id)" class="btn deny">Deny</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Active Grants -->
        <div class="section">
          <h3>Active Grants ({{ activeGrants.length }})</h3>
          <div *ngIf="activeGrants.length === 0" class="empty">No active grants</div>
          <table *ngIf="activeGrants.length > 0" class="grant-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Approved By</th>
                <th>Expires</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let grant of activeGrants">
                <td>{{ grant.userName }}</td>
                <td>{{ grant.userEmail }}</td>
                <td>{{ grant.approvedByName }}</td>
                <td>{{ grant.expiresAt | date:'short' }}</td>
                <td>{{ grant.lastActiveAt | date:'short' }}</td>
                <td>
                  <button (click)="revoke(grant.id)" class="btn revoke">Revoke</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <button (click)="refresh()" class="btn refresh">Refresh</button>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .admin-container { padding: 20px; max-width: 900px; margin: 0 auto; }
    .section { margin-bottom: 30px; }
    h3 { color: #e0e0e0; margin-bottom: 12px; }
    .empty { color: #666; font-style: italic; padding: 12px 0; }
    .grant-table {
      width: 100%;
      border-collapse: collapse;
      background: #16213e;
      border-radius: 8px;
      overflow: hidden;
    }
    .grant-table th {
      background: #0f3460;
      color: #aaa;
      padding: 10px 12px;
      text-align: left;
      font-size: 13px;
      font-weight: 500;
    }
    .grant-table td {
      padding: 10px 12px;
      color: #ddd;
      border-top: 1px solid #1a1a3e;
      font-size: 13px;
    }
    .btn {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      margin-right: 6px;
    }
    .btn.approve { background: #2d8a4e; }
    .btn.deny { background: #c0392b; }
    .btn.revoke { background: #e67e22; }
    .btn.refresh { background: #2d5aa0; margin-top: 10px; }
    .btn:hover { opacity: 0.85; }
    .error-message {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      color: #ff6b6b;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 20px;
    }
  `]
})
export class AdminAccessComponent implements OnInit {
  private adminUrl = `${environment.baseApiUrl}/api/auth/admin`;

  pendingRequests: GrantInfo[] = [];
  activeGrants: GrantInfo[] = [];
  lanError = '';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.refresh();
  }

  refresh(): void {
    this.lanError = '';

    this.http.get<GrantInfo[]>(`${this.adminUrl}/pending`, { withCredentials: true }).subscribe({
      next: (data) => this.pendingRequests = data,
      error: (err) => {
        if (err.error?.error === 'LAN_REQUIRED') {
          this.lanError = 'Access management is only available from within the plant network.';
        }
      }
    });

    this.http.get<GrantInfo[]>(`${this.adminUrl}/active-grants`, { withCredentials: true }).subscribe({
      next: (data) => this.activeGrants = data,
      error: () => {}
    });
  }

  approve(id: number): void {
    this.http.post(`${this.adminUrl}/approve/${id}`, {}, { withCredentials: true }).subscribe({
      next: () => this.refresh(),
      error: (err) => alert(err.error?.message || 'Failed to approve')
    });
  }

  deny(id: number): void {
    this.http.post(`${this.adminUrl}/deny/${id}`, {}, { withCredentials: true }).subscribe({
      next: () => this.refresh(),
      error: (err) => alert(err.error?.message || 'Failed to deny')
    });
  }

  revoke(id: number): void {
    this.http.post(`${this.adminUrl}/revoke/${id}`, {}, { withCredentials: true }).subscribe({
      next: () => this.refresh(),
      error: (err) => alert(err.error?.message || 'Failed to revoke')
    });
  }
}
