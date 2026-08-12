import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { switchMap } from 'rxjs';
import { ServerApiService } from '../../services/server-api.service';
import { AuthService } from '../../auth/auth.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { PasswordToggleDirective } from '../../shared/input-fields/password-toggle.directive';

@Component({
  selector: 'app-reset-password-page',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MainLayoutComponent, PasswordToggleDirective],
  template: `
    <app-main-layout [isBottomMenuEnabled]="false" [isSideMenuEnabled]="false">
      <ng-container main-content>
        <div class="reset-container">
          <div class="reset-card">
            <h2>Set New Password</h2>

            <div *ngIf="successMessage" class="success-message">
              {{ successMessage }}
              <div *ngIf="autoLoginFailed" class="auto-login-note">
                <a [routerLink]="['/login']" [queryParams]="loginQueryParams" class="go-login-link">Go to Login</a>
              </div>
            </div>

            <div *ngIf="noticeMessage" class="notice-message">
              {{ noticeMessage }}
              <div class="auto-login-note">
                <a [routerLink]="['/login']" [queryParams]="loginQueryParams" class="go-login-link">Go to Login</a>
              </div>
            </div>

            <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>

            <div *ngIf="!token && !successMessage" class="error-message">
              Invalid reset link. No token provided.
            </div>

            <form *ngIf="token && !successMessage && !noticeMessage" (ngSubmit)="onSubmit()">
              <div class="form-group">
                <label for="newPassword">New Password</label>
                <input id="newPassword" type="password" autocomplete="new-password" [(ngModel)]="newPassword"
                       name="newPassword" placeholder="Enter new password" required autofocus appPasswordToggle>
                <div class="strength-bar">
                  <div class="strength-fill" [style.width.%]="strengthPercent" [style.background]="strengthColor"></div>
                </div>
                <span class="strength-label" [style.color]="strengthColor">{{ strengthLabel }}</span>
              </div>

              <div class="form-group">
                <label for="confirmPassword">Confirm Password</label>
                <input id="confirmPassword" type="password" autocomplete="new-password" [(ngModel)]="confirmPassword"
                       name="confirmPassword" placeholder="Confirm new password" required appPasswordToggle>
              </div>

              <button type="submit" [disabled]="isLoading">
                <span *ngIf="!isLoading">{{ isLoading ? '' : 'Set Password & Sign In' }}</span>
                <span *ngIf="isLoading" class="spinner"></span>
              </button>
            </form>

            <a [routerLink]="['/login']" [queryParams]="loginQueryParams" class="back-link">Back to Sign In</a>
          </div>
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .reset-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100%;
      background-color: var(--primary-background);
    }

    .reset-card {
      padding: 2rem;
      border-radius: 8px;
      background: var(--card-background);
      box-shadow: var(--card-shadow);
      width: 100%;
      max-width: 400px;
      color: var(--primary-text);
    }

    h2 {
      text-align: center;
      margin: 0 0 1.5rem 0;
      color: var(--primary-text);
    }

    .form-group {
      margin-bottom: 1rem;
    }

    label {
      display: block;
      margin-bottom: 0.5rem;
      font-weight: bold;
      color: var(--secondary-text);
    }

    input {
      width: 100%;
      padding: 0.75rem;
      border: 1px solid var(--border-color);
      border-radius: 4px;
      box-sizing: border-box;
      background-color: var(--primary-background);
      color: var(--primary-text);
    }

    input:focus {
      border-color: var(--accent-color);
      outline: none;
      box-shadow: 0 0 0 2px var(--accent-color-shadow);
    }

    .strength-bar {
      height: 4px;
      background: var(--border-color);
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
      font-size: 0.75rem;
      margin-top: 2px;
      display: block;
    }

    button {
      width: 100%;
      padding: 0.75rem;
      border: none;
      border-radius: 4px;
      background-color: var(--accent-color);
      color: var(--header-text);
      font-size: 1rem;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      height: 45px;
      margin-top: 0.5rem;
      transition: background-color 0.3s ease;
    }

    button:hover:not(:disabled) {
      background-color: var(--accent-color-hover);
    }

    button:disabled {
      background-color: var(--disabled-background);
      cursor: not-allowed;
    }

    .success-message {
      color: #28a745;
      background-color: rgba(40, 167, 69, 0.1);
      border: 1px solid rgba(40, 167, 69, 0.3);
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 0.9rem;
    }

    .error-message {
      color: #dc3545;
      background-color: #f8d7da;
      border: 1px solid #f5c6cb;
      padding: 0.75rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      text-align: center;
    }

    /* Not an error: the link is spent but the account is fine — the user just needs to sign in. */
    .notice-message {
      color: #856404;
      background-color: rgba(255, 193, 7, 0.12);
      border: 1px solid rgba(255, 193, 7, 0.4);
      padding: 1rem;
      border-radius: 4px;
      margin-bottom: 1rem;
      text-align: center;
      font-size: 0.9rem;
    }

    .back-link {
      display: block;
      text-align: center;
      margin-top: 1rem;
      color: var(--secondary-text);
      font-size: 0.85rem;
      text-decoration: none;
      cursor: pointer;
    }

    .back-link:hover {
      color: var(--accent-color);
      text-decoration: underline;
    }

    .go-login-link {
      display: inline-block;
      margin-top: 0.5rem;
      color: var(--accent-color);
      text-decoration: underline;
      cursor: pointer;
    }

    .spinner {
      border: 4px solid rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      border-top: 4px solid var(--header-text);
      width: 24px;
      height: 24px;
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ResetPasswordPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serverApi = inject(ServerApiService);
  private authService = inject(AuthService);

  /** Auto sign-in happens right after the hub answered the reset, so it is demonstrably up. Give it a
   *  realistic window instead of the 5s dual-auth default — a slow answer here used to be read as
   *  "hub down", fall through to a Supabase password that hasn't been mirrored yet, and dead-end the
   *  user on a page whose only way out was a spent reset link. */
  private static readonly AUTO_LOGIN_TIMEOUT_MS = 20000;

  token = '';
  newPassword = '';
  confirmPassword = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';
  /** Non-error dead-end (spent/expired link) — the account is fine, the user just needs to sign in. */
  noticeMessage = '';
  autoLoginFailed = false;
  /** Carries the account forward so "Go to Login" lands on the sign-in step, pre-filled. */
  loginQueryParams: Record<string, string> = {};

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
    if (p < 40) return '#dc3545';
    if (p < 70) return '#ffc107';
    return '#28a745';
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
    const password = this.newPassword;

    // Raw variant: the generic handleError replaces the HttpErrorResponse with a bare Error, which
    // threw away the server's reason code — every failure, including "link already used", surfaced
    // as "Failed to reset password. Please try again." and sent users back to re-use a spent link.
    this.serverApi.resetPasswordRaw(this.token, password).subscribe({
      next: (res: any) => {
        this.successMessage = 'Password set successfully. Signing you in...';
        const email = res?.email;
        if (email) {
          this.loginQueryParams = { email };
          this.authService.authenticate(email, password, ResetPasswordPageComponent.AUTO_LOGIN_TIMEOUT_MS).pipe(
            switchMap(() => this.authService.syncLocalUserData())
          ).subscribe({
            next: () => {
              this.router.navigate(['/home']);
            },
            error: () => this.onAutoLoginFailed()
          });
        } else {
          this.onAutoLoginFailed();
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.applyResetError(err);
      }
    });
  }

  /** The password IS set — say so plainly and give a link that actually navigates. */
  private onAutoLoginFailed(): void {
    this.isLoading = false;
    this.successMessage = 'Password set successfully. Sign in with your new password to continue.';
    this.autoLoginFailed = true;
  }

  /**
   * A spent or expired link is not a failed reset. In practice the user already set their password on
   * the first submit, then came back to the emailed link — telling them "failed, please try again"
   * makes them loop on a token that can never work again.
   */
  private applyResetError(err: any): void {
    const code = err?.error?.error;
    const serverMessage = err?.error?.message;

    if (code === 'TOKEN_USED') {
      this.noticeMessage = 'This link has already been used. If you set your password, sign in with it — '
        + 'otherwise request a new link from the sign-in screen.';
      return;
    }
    if (code === 'TOKEN_EXPIRED' || code === 'INVALID_TOKEN') {
      this.noticeMessage = (serverMessage || 'This reset link is no longer valid.')
        + ' Request a new one from the sign-in screen.';
      return;
    }
    if (serverMessage) {
      this.errorMessage = serverMessage;
      return;
    }
    // No response body at all (timeout / connection dropped). The hub may well have committed the
    // change, so don't assert that it failed.
    this.errorMessage = 'Could not confirm the password change. Try signing in with your new password '
      + 'first — if that fails, request a new reset link.';
  }
}
