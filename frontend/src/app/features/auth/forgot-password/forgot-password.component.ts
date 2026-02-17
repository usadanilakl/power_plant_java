import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../services/auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="container">
      <div class="card">
        <h2>Reset Password</h2>
        <p class="subtitle">Enter your email to receive a reset link</p>

        <div *ngIf="successMessage" class="success-message">
          {{ successMessage }}
        </div>

        <div *ngIf="errorMessage" class="error-message">
          {{ errorMessage }}
        </div>

        <form *ngIf="!successMessage" (ngSubmit)="onSubmit()">
          <div class="form-group">
            <label for="email">Email</label>
            <input
              id="email"
              type="email"
              [(ngModel)]="email"
              name="email"
              placeholder="Enter your email address"
              required
              autofocus
            />
          </div>

          <button type="submit" [disabled]="isLoading" class="submit-btn">
            {{ isLoading ? 'Sending...' : 'Send Reset Link' }}
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

    .success-message {
      background: rgba(46, 204, 113, 0.15);
      border: 1px solid #2ecc71;
      color: #2ecc71;
      padding: 10px 14px;
      border-radius: 6px;
      margin-bottom: 16px;
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
export class ForgotPasswordComponent {
  email = '';
  isLoading = false;
  successMessage = '';
  errorMessage = '';

  constructor(private authService: AuthService) {}

  onSubmit(): void {
    if (!this.email) {
      this.errorMessage = 'Please enter your email';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.forgotPassword(this.email).subscribe({
      next: (res) => {
        this.isLoading = false;
        this.successMessage = res.message || 'If an account with that email exists, a reset link has been sent.';
      },
      error: () => {
        this.isLoading = false;
        this.errorMessage = 'Something went wrong. Please try again.';
      }
    });
  }
}
