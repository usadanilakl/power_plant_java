import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="login-container">
      <div class="login-card">
        <h2>Power Plant Manager</h2>
        <p class="subtitle">Sign in to your account</p>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <form (ngSubmit)="onLogin()">
          <div class="form-group">
            <label for="credential">Email or Username</label>
            <input
              id="credential"
              type="text"
              [(ngModel)]="credential"
              name="credential"
              placeholder="Enter your email or username"
              required
              autofocus
            />
          </div>

          <div class="form-group">
            <label for="password">Password</label>
            <input
              id="password"
              type="password"
              [(ngModel)]="password"
              name="password"
              placeholder="Enter your password"
              required
            />
            <a routerLink="/forgot-password" class="forgot-link">Forgot password?</a>
          </div>

          <button type="submit" [disabled]="isLoading" class="login-btn">
            {{ isLoading ? 'Signing in...' : 'Sign In' }}
          </button>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .login-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: #1a1a2e;
    }

    .login-card {
      background: #16213e;
      border-radius: 12px;
      padding: 40px;
      width: 100%;
      max-width: 400px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
    }

    h2 {
      color: #e0e0e0;
      margin: 0 0 8px 0;
      text-align: center;
    }

    .subtitle {
      color: #888;
      text-align: center;
      margin: 0 0 24px 0;
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

    .login-btn {
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

    .login-btn:hover:not(:disabled) {
      background: #6b44a0;
    }

    .login-btn:disabled {
      opacity: 0.6;
      cursor: not-allowed;
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

    .forgot-link {
      display: inline-block;
      margin-top: 6px;
      color: #888;
      font-size: 13px;
      text-decoration: none;
    }

    .forgot-link:hover {
      color: #aaa;
      text-decoration: underline;
    }
  `]
})
export class LoginComponent {
  credential = '';
  password = '';
  errorMessage = '';
  isLoading = false;

  private returnUrl = '/home';

  constructor(
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';

    // If already logged in, redirect
    if (this.authService.isLoggedIn) {
      this.router.navigate([this.returnUrl]);
    }
  }

  onLogin(): void {
    if (!this.credential || !this.password) {
      this.errorMessage = 'Please enter your credentials';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.credential, this.password).subscribe({
      next: (user) => {
        if (user.accessLevel && user.accessLevel !== 'FULL') {
          // Restricted user: allow navigation to restricted-allowed routes,
          // otherwise show access-request page
          if (this.isRestrictedAllowedRoute(this.returnUrl)) {
            this.router.navigate([this.returnUrl]);
          } else {
            this.router.navigate(['/access-request']);
          }
        } else {
          this.router.navigate([this.returnUrl]);
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.errorMessage = err.error?.message || 'Invalid email or password';
      }
    });
  }

  private isRestrictedAllowedRoute(url: string): boolean {
    const restrictedRoutes = ['/qr/', '/profile'];
    return restrictedRoutes.some(prefix => url.startsWith(prefix));
  }
}
