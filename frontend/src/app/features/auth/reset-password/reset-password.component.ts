import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';
import { PasswordToggleDirective } from '../../../shared/password-toggle/password-toggle.directive';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, PasswordToggleDirective],
  template: `
    <div class="container">
      <div class="card">
        <h2>Set New Password</h2>

        <div *ngIf="successMessage" class="success-message">
          {{ successMessage }}
          <a routerLink="/login" class="go-login-btn">Go to Login</a>
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <div *ngIf="!token && !successMessage" class="error-message">
          Invalid reset link. No token provided.
          <a routerLink="/forgot-password" class="retry-link">Request a new link</a>
        </div>

        <form *ngIf="token && !successMessage" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="newPassword">New Password</label>
            <input
              id="newPassword"
              type="password"
              [(ngModel)]="newPassword"
              name="newPassword"
              placeholder="Enter new password"
              required
              autofocus
              appPasswordToggle
            />
            <div class="strength-bar">
              <div class="strength-fill" [style.width.%]="strengthPercent" [style.background]="strengthColor"></div>
            </div>
            <span class="strength-label" [style.color]="strengthColor">{{ strengthLabel }}</span>
          </div>

          <div class="form-group">
            <label for="confirmPassword">Confirm Password</label>
            <input
              id="confirmPassword"
              type="password"
              [(ngModel)]="confirmPassword"
              name="confirmPassword"
              placeholder="Confirm new password"
              required
              appPasswordToggle
            />
          </div>

          <button type="submit" [disabled]="isLoading" class="submit-btn">
            {{ isLoading ? 'Resetting...' : 'Reset Password' }}
          </button>
        </form>

        <a routerLink="/login" class="back-link">Back to Sign In</a>
      </div>
    </div>
  `,
  styles: [`
    .container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
    }

    .card {
      background: #16213e;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    h2 {
      color: #e0e0e0;
      margin: 0 0 24px 0;
      text-align: center;
    }

    .form-group {
      margin-bottom: 16px;
    }

    label {
      display: block;
      color: #aaa;
      margin-bottom: 6px;
      font-size: 14px;
    }

    input {
      width: 100%;
      padding: 10px 12px;
      border: 1px solid #333;
      border-radius: 6px;
      background: #0f3460;
      color: #e0e0e0;
      font-size: 14px;
      box-sizing: border-box;
    }

    input:focus {
      outline: none;
      border-color: #533483;
    }

    .strength-bar {
      height: 4px;
      background: #333;
      border-radius: 2px;
      margin-top: 6px;
      overflow: hidden;
    }

    .strength-fill {
      height: 100%;
      border-radius: 2px;
      transition: width 0.3s ease, background 0.3s ease;
    }

    .strength-label {
      font-size: 11px;
      margin-top: 2px;
      display: block;
    }

    .submit-btn {
      width: 100%;
      padding: 12px;
      border: none;
      border-radius: 6px;
      background: #533483;
      color: white;
      font-size: 16px;
      cursor: pointer;
      margin-top: 8px;
    }

    .submit-btn:hover:not(:disabled) {
      background: #6b44a0;
    }

    .submit-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .back-link {
      display: block;
      text-align: center;
      margin-top: 16px;
      color: #888;
      font-size: 13px;
      text-decoration: none;
    }

    .back-link:hover {
      color: #aaa;
      text-decoration: underline;
    }

    .go-login-btn {
      display: block;
      margin-top: 12px;
      padding: 10px;
      background: #533483;
      color: white;
      border-radius: 6px;
      text-align: center;
      text-decoration: none;
      font-size: 14px;
    }

    .go-login-btn:hover {
      background: #6b44a0;
    }

    .retry-link {
      display: block;
      margin-top: 8px;
      color: #ff6b6b;
      text-decoration: underline;
      font-size: 13px;
    }

    .success-message {
      background: rgba(46, 204, 113, 0.15);
      border: 1px solid #2ecc71;
      color: #2ecc71;
      padding: 16px;
      border-radius: 6px;
      font-size: 14px;
    }

    .error-message {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      color: #ff6b6b;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
      font-size: 14px;
    }
  `]
})
export class ResetPasswordComponent implements OnInit {
  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.queryParams['token'] || '';
  }

  get strengthPercent(): number {
    const len = this.newPassword.length;
    if (len === 0) return 0;
    let score = 0;
    if (len >= 8) score += 25;
    if (len >= 12) score += 15;
    if (/[a-z]/.test(this.newPassword) && /[A-Z]/.test(this.newPassword)) score += 20;
    if (/\d/.test(this.newPassword)) score += 20;
    if (/[^a-zA-Z0-9]/.test(this.newPassword)) score += 20;
    return Math.min(100, score);
  }

  get strengthColor(): string {
    const p = this.strengthPercent;
    if (p < 40) return '#ff4444';
    if (p < 70) return '#f1c40f';
    return '#2ecc71';
  }

  get strengthLabel(): string {
    const p = this.strengthPercent;
    if (p === 0) return '';
    if (p < 40) return 'Weak';
    if (p < 70) return 'Fair';
    return 'Strong';
  }

  onSubmit(): void {
    this.errorMessage = '';

    if (!this.newPassword || this.newPassword.length < 8) {
      this.errorMessage = 'Password must be at least 8 characters.';
      return;
    }

    if (this.newPassword !== this.confirmPassword) {
      this.errorMessage = 'Passwords do not match.';
      return;
    }

    this.isLoading = true;

    this.authService.resetPassword(this.token, this.newPassword).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'Password has been reset successfully.';
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Failed to reset password. Please try again.';
      }
    });
  }
}
