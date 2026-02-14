import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService, AccessStatus } from '../../../services/auth.service';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';

@Component({
  selector: 'app-access-request',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout pageTitle="Access Request">
      <div class="access-container">
        <div class="access-card">
          <h3>Full Web Access</h3>

          <div *ngIf="status === 'NONE'" class="status-section">
            <p>You currently have <strong>restricted access</strong>. To get full access, you need approval from an administrator on the plant network.</p>
            <button (click)="requestAccess()" [disabled]="isLoading" class="request-btn">
              {{ isLoading ? 'Requesting...' : 'Request Full Access' }}
            </button>
          </div>

          <div *ngIf="status === 'PENDING'" class="status-section pending">
            <div class="status-icon">&#9203;</div>
            <p><strong>Access request pending</strong></p>
            <p class="detail">Submitted at {{ requestedAt }}</p>
            <p class="detail">Waiting for an administrator on the plant network to approve your request.</p>
            <button (click)="checkStatus()" class="refresh-btn">Check Status</button>
          </div>

          <div *ngIf="status === 'APPROVED'" class="status-section approved">
            <div class="status-icon">&#9989;</div>
            <p><strong>Full access granted</strong></p>
            <p class="detail" *ngIf="expiresAt">Expires: {{ expiresAt }}</p>
            <button (click)="goHome()" class="home-btn">Go to Home</button>
          </div>

          <div *ngIf="errorMessage" class="error-message">
            {{ errorMessage }}
          </div>
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .access-container { padding: 20px; max-width: 500px; margin: 40px auto; }
    .access-card {
      background: #16213e;
      border-radius: 12px;
      padding: 30px;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
    }
    h3 { color: #e0e0e0; margin: 0 0 16px 0; }
    p { color: #ccc; line-height: 1.6; }
    .detail { color: #888; font-size: 13px; }
    .status-icon { font-size: 36px; text-align: center; margin-bottom: 12px; }
    .status-section { text-align: center; }
    .request-btn, .refresh-btn, .home-btn {
      padding: 10px 24px;
      border: none;
      border-radius: 6px;
      color: white;
      cursor: pointer;
      margin-top: 12px;
      font-size: 14px;
    }
    .request-btn { background: #533483; }
    .request-btn:hover:not(:disabled) { background: #6b44a0; }
    .refresh-btn { background: #2d5aa0; }
    .home-btn { background: #2d8a4e; }
    .error-message {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      color: #ff6b6b;
      padding: 10px;
      border-radius: 6px;
      margin-top: 16px;
      font-size: 14px;
    }
    .pending { color: #f0ad4e; }
    .approved { color: #5cb85c; }
  `]
})
export class AccessRequestComponent implements OnInit, OnDestroy {
  status: 'NONE' | 'PENDING' | 'APPROVED' = 'NONE';
  requestedAt = '';
  expiresAt = '';
  errorMessage = '';
  isLoading = false;
  private pollInterval: any;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit(): void {
    this.checkStatus();
    // Poll every 10 seconds for status changes
    this.pollInterval = setInterval(() => this.checkStatus(), 10000);
  }

  ngOnDestroy(): void {
    if (this.pollInterval) clearInterval(this.pollInterval);
  }

  checkStatus(): void {
    this.authService.getAccessStatus().subscribe({
      next: (result) => {
        this.status = result.status === 'APPROVED' ? 'APPROVED'
                    : result.status === 'PENDING' ? 'PENDING'
                    : 'NONE';
        this.requestedAt = result.requestedAt || '';
        this.expiresAt = result.expiresAt || '';

        if (this.status === 'APPROVED') {
          this.authService.checkAuthStatus();
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
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to submit request';
      }
    });
  }

  goHome(): void {
    this.router.navigate(['/home']);
  }
}
