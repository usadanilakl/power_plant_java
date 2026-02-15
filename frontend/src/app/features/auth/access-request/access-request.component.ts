import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AccessStatus, AccessGrantSummary } from '../../../services/auth.service';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';

@Component({
  selector: 'app-access-request',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout pageTitle="Access Request">
      <div class="access-container">

        <!-- Progress Steps -->
        <div class="progress-steps">
          <div class="step" [class.active]="stepIndex >= 0" [class.completed]="stepIndex > 0">
            <div class="step-circle">1</div>
            <span class="step-label">Request</span>
          </div>
          <div class="step-line" [class.active]="stepIndex >= 1"></div>
          <div class="step" [class.active]="stepIndex >= 1" [class.completed]="stepIndex > 1">
            <div class="step-circle">2</div>
            <span class="step-label">Pending</span>
          </div>
          <div class="step-line" [class.active]="stepIndex >= 2"></div>
          <div class="step" [class.active]="stepIndex >= 2">
            <div class="step-circle">3</div>
            <span class="step-label">Approved</span>
          </div>
        </div>

        <!-- Status Cards -->
        <div class="status-card">
          <!-- NONE -->
          <div *ngIf="status === 'NONE'" class="status-content">
            <div class="status-icon none-icon">&#x1F512;</div>
            <h3>Restricted Access</h3>
            <p>You currently have restricted access. To get full access to the application, you need approval from an administrator on the plant network.</p>
            <button (click)="requestAccess()" [disabled]="isLoading" class="btn primary">
              {{ isLoading ? 'Requesting...' : 'Request Full Access' }}
            </button>
          </div>

          <!-- PENDING -->
          <div *ngIf="status === 'PENDING'" class="status-content">
            <div class="status-icon pending-icon">&#9203;</div>
            <h3>Access Request Pending</h3>
            <p class="detail">Submitted {{ requestedAt | date:'medium' }}</p>
            <p>Waiting for an administrator on the plant network to approve your request.</p>
            <div class="poll-indicator">
              <span class="pulse-dot"></span>
              Checking status automatically...
            </div>
          </div>

          <!-- APPROVED -->
          <div *ngIf="status === 'APPROVED'" class="status-content">
            <div class="status-icon approved-icon">&#9989;</div>
            <h3>Full Access Granted</h3>
            <div class="countdown" *ngIf="expiresAt">
              <span class="countdown-label">Expires in</span>
              <span class="countdown-value">{{ remainingTime }}</span>
            </div>
            <button (click)="goHome()" class="btn primary">Go to Home</button>
          </div>

          <!-- DENIED / EXPIRED / REVOKED -->
          <div *ngIf="status === 'DENIED' || status === 'EXPIRED' || status === 'REVOKED'" class="status-content">
            <div class="status-icon denied-icon">&#10060;</div>
            <h3>Access {{ status | titlecase }}</h3>
            <p>Your access request was {{ status.toLowerCase() }}. You can submit a new request.</p>
            <button (click)="requestAccess()" [disabled]="isLoading" class="btn primary">
              {{ isLoading ? 'Requesting...' : 'Request Again' }}
            </button>
          </div>
        </div>

        <!-- Error -->
        <div *ngIf="errorMessage" class="error-box">{{ errorMessage }}</div>

        <!-- Sessions History -->
        <div class="sessions-section" *ngIf="sessions.length > 0">
          <div class="section-header">
            <h3>My Access History</h3>
            <button class="btn secondary small" (click)="loadSessions()">Refresh</button>
          </div>
          <table class="data-table">
            <thead>
              <tr>
                <th>Status</th>
                <th>IP</th>
                <th>Requested</th>
                <th>Approved</th>
                <th>Expires</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let s of sessions">
                <td><span class="status-badge" [ngClass]="'status-' + s.status.toLowerCase()">{{ s.status }}</span></td>
                <td>{{ s.requestIp || '-' }}</td>
                <td>{{ s.requestedAt | date:'short' }}</td>
                <td>{{ s.approvedAt ? (s.approvedAt | date:'short') : '-' }}</td>
                <td>{{ s.expiresAt ? (s.expiresAt | date:'short') : '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .access-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 0 16px;
    }

    /* Progress Steps */
    .progress-steps {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 24px;
      padding: 20px;
      background: var(--secondary-background, #16213e);
      border-radius: 12px;
    }

    .step {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
    }

    .step-circle {
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.08);
      color: var(--secondary-text, #888);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 14px;
      font-weight: 600;
      border: 2px solid rgba(255, 255, 255, 0.1);
      transition: all 0.3s;
    }

    .step.active .step-circle {
      background: var(--accent-color, #533483);
      color: white;
      border-color: var(--accent-color, #533483);
    }

    .step.completed .step-circle {
      background: #2ecc71;
      border-color: #2ecc71;
      color: white;
    }

    .step-label {
      font-size: 11px;
      color: var(--secondary-text, #888);
      font-weight: 500;
    }

    .step.active .step-label {
      color: var(--primary-text, #e0e0e0);
    }

    .step-line {
      width: 60px;
      height: 2px;
      background: rgba(255, 255, 255, 0.1);
      margin: 0 12px;
      margin-bottom: 22px;
      transition: background 0.3s;
    }

    .step-line.active {
      background: var(--accent-color, #533483);
    }

    /* Status Card */
    .status-card {
      background: var(--secondary-background, #16213e);
      border-radius: 12px;
      padding: 32px;
      text-align: center;
      margin-bottom: 20px;
    }

    .status-content h3 {
      color: var(--primary-text, #e0e0e0);
      margin: 0 0 12px 0;
      font-size: 18px;
    }

    .status-content p {
      color: var(--secondary-text, #888);
      line-height: 1.6;
      font-size: 14px;
      margin: 0 0 8px 0;
    }

    .status-icon {
      font-size: 48px;
      margin-bottom: 16px;
    }

    .detail {
      font-size: 13px !important;
      color: #666 !important;
    }

    /* Countdown */
    .countdown {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      margin: 16px 0;
      padding: 16px;
      background: rgba(46, 204, 113, 0.08);
      border-radius: 8px;
      border: 1px solid rgba(46, 204, 113, 0.2);
    }

    .countdown-label {
      font-size: 12px;
      color: var(--secondary-text, #888);
    }

    .countdown-value {
      font-size: 24px;
      font-weight: 700;
      color: #2ecc71;
      font-variant-numeric: tabular-nums;
    }

    /* Poll indicator */
    .poll-indicator {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-top: 16px;
      font-size: 12px;
      color: var(--secondary-text, #888);
    }

    .pulse-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #f1c40f;
      animation: pulse 2s infinite;
    }

    @keyframes pulse {
      0%, 100% { opacity: 1; transform: scale(1); }
      50% { opacity: 0.5; transform: scale(0.8); }
    }

    /* Buttons */
    .btn {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      font-size: 14px;
      margin-top: 16px;
      transition: all 0.2s;
    }

    .btn:disabled { opacity: 0.5; cursor: not-allowed; }

    .btn.primary { background: var(--accent-color, #533483); }
    .btn.primary:hover:not(:disabled) { background: var(--accent-color-hover, #6b44a0); }

    .btn.secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-color, #333);
      margin-top: 0;
    }
    .btn.secondary:hover { background: rgba(255, 255, 255, 0.12); }
    .btn.small { padding: 6px 14px; font-size: 12px; }

    /* Sessions */
    .sessions-section {
      background: var(--secondary-background, #16213e);
      border-radius: 12px;
      padding: 20px;
    }

    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    }

    .section-header h3 {
      color: var(--primary-text, #e0e0e0);
      margin: 0;
      font-size: 15px;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 12px;
    }

    .data-table th {
      background: var(--primary-background, #0f3460);
      color: var(--secondary-text, #888);
      padding: 8px 10px;
      text-align: left;
      font-weight: 500;
    }

    .data-table td {
      padding: 8px 10px;
      color: var(--primary-text, #e0e0e0);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

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

    .error-box {
      background: rgba(255, 68, 68, 0.12);
      border: 1px solid rgba(255, 68, 68, 0.3);
      color: #ff6b6b;
      padding: 12px;
      border-radius: 6px;
      font-size: 14px;
      margin-bottom: 16px;
    }
  `]
})
export class AccessRequestComponent implements OnInit, OnDestroy {
  private authService = inject(AuthService);
  private router = inject(Router);

  status: 'NONE' | 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED' | 'REVOKED' = 'NONE';
  requestedAt = '';
  expiresAt = '';
  remainingTime = '';
  errorMessage = '';
  isLoading = false;
  sessions: AccessGrantSummary[] = [];
  private pollInterval: any;
  private countdownInterval: any;

  get stepIndex(): number {
    if (this.status === 'APPROVED') return 2;
    if (this.status === 'PENDING') return 1;
    return 0;
  }

  ngOnInit(): void {
    this.checkStatus();
    this.loadSessions();
    this.pollInterval = setInterval(() => this.checkStatus(), 10000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
    if (this.countdownInterval) clearInterval(this.countdownInterval);
  }

  checkStatus(): void {
    this.authService.getAccessStatus().subscribe({
      next: (result) => {
        if (result.status === 'APPROVED') {
          this.status = 'APPROVED';
          this.expiresAt = result.expiresAt || '';
          this.authService.checkAuthStatus();
          this.startCountdown();
        } else if (result.status === 'PENDING' || result.status === 'ALREADY_PENDING') {
          this.status = 'PENDING';
          this.requestedAt = result.requestedAt || '';
        } else {
          this.status = 'NONE';
        }
      },
      error: () => {}
    });
  }

  requestAccess(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.authService.requestAccess().subscribe({
      next: (result) => {
        this.isLoading = false;
        if (result.status === 'PENDING' || result.status === 'ALREADY_PENDING') {
          this.status = 'PENDING';
          this.requestedAt = result.requestedAt || new Date().toISOString();
        } else if (result.status === 'ALREADY_APPROVED') {
          this.status = 'APPROVED';
          this.expiresAt = result.expiresAt || '';
          this.startCountdown();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to submit request';
      }
    });
  }

  loadSessions(): void {
    this.authService.getMyAccessGrants().subscribe({
      next: (data) => this.sessions = data,
      error: () => {}
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }

  private startCountdown(): void {
    if (this.countdownInterval) clearInterval(this.countdownInterval);
    this.updateCountdown();
    this.countdownInterval = setInterval(() => this.updateCountdown(), 60000);
  }

  private updateCountdown(): void {
    if (!this.expiresAt) { this.remainingTime = ''; return; }
    const expires = new Date(this.expiresAt).getTime();
    const now = Date.now();
    const diff = expires - now;
    if (diff <= 0) {
      this.remainingTime = 'Expired';
      this.status = 'NONE';
      if (this.countdownInterval) clearInterval(this.countdownInterval);
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    this.remainingTime = `${hours}h ${minutes}m`;
  }
}
