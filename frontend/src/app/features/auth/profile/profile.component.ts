import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile } from '../../../services/auth.service';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent],
  template: `
    <app-main-layout pageTitle="My Profile">
      <div class="profile-container">
        <div class="profile-card" *ngIf="profile">
          <!-- Avatar & Identity -->
          <div class="profile-header">
            <div class="avatar">{{ getInitials(profile.name) }}</div>
            <div class="identity">
              <h2>{{ profile.name }}</h2>
              <span class="role-badge">{{ formatRole(profile.role) }}</span>
            </div>
          </div>

          <!-- Info Section -->
          <div class="info-section">
            <div class="info-row">
              <span class="label">Email</span>
              <span class="value">{{ profile.email }}</span>
            </div>
            <div class="info-row">
              <span class="label">Username</span>
              <span class="value">{{ profile.username }}</span>
            </div>
            <div class="info-row">
              <span class="label">OS Username</span>
              <span class="value">{{ profile.windowsUsername || '-' }}</span>
            </div>
            <div class="info-row">
              <span class="label">Status</span>
              <span class="value" [class.active]="profile.isActive" [class.inactive]="!profile.isActive">
                {{ profile.isActive ? 'Active' : 'Inactive' }}
              </span>
            </div>
            <div class="info-row">
              <span class="label">Last Login</span>
              <span class="value">{{ profile.lastLoginDate ? (profile.lastLoginDate | date:'medium') : 'Never' }}</span>
            </div>
          </div>

          <!-- Edit Section -->
          <div class="edit-section">
            <h3>Edit Profile</h3>
            <div class="form-row">
              <div class="form-group">
                <label for="firstName">First Name</label>
                <input id="firstName" type="text" [(ngModel)]="editFirstName" />
              </div>
              <div class="form-group">
                <label for="lastName">Last Name</label>
                <input id="lastName" type="text" [(ngModel)]="editLastName" />
              </div>
            </div>
            <button class="btn save-btn" (click)="saveProfile()" [disabled]="isSaving || !hasNameChanges()">
              {{ isSaving ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>

          <!-- Password Section -->
          <div class="edit-section">
            <h3>Change Password</h3>
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input id="newPassword" type="password" [(ngModel)]="newPassword" placeholder="Enter new password" />
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm Password</label>
              <input id="confirmPassword" type="password" [(ngModel)]="confirmPassword" placeholder="Confirm new password" />
            </div>
            <div class="error-msg" *ngIf="passwordError">{{ passwordError }}</div>
            <button class="btn save-btn" (click)="changePassword()" [disabled]="isSaving || !newPassword">
              {{ isSaving ? 'Saving...' : 'Change Password' }}
            </button>
          </div>

          <!-- Feedback -->
          <div class="success-msg" *ngIf="successMessage">{{ successMessage }}</div>
          <div class="error-msg" *ngIf="errorMessage">{{ errorMessage }}</div>
        </div>

        <div class="loading" *ngIf="!profile && !errorMessage">Loading profile...</div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .profile-container {
      max-width: 600px;
      margin: 20px auto;
      padding: 0 16px;
    }

    .profile-card {
      background: var(--secondary-background, #16213e);
      border-radius: 12px;
      overflow: hidden;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 28px 24px;
      background: linear-gradient(135deg, var(--accent-color, #533483) 0%, #2d1b69 100%);
    }

    .avatar {
      width: 72px;
      height: 72px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      font-weight: 700;
      flex-shrink: 0;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .identity h2 {
      color: white;
      margin: 0 0 6px 0;
      font-size: 1.3rem;
    }

    .role-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .info-section {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #333);
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
    }

    .info-row:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .label {
      color: var(--secondary-text, #888);
      font-size: 13px;
    }

    .value {
      color: var(--primary-text, #e0e0e0);
      font-size: 13px;
      font-weight: 500;
    }

    .value.active { color: #5cb85c; }
    .value.inactive { color: #d9534f; }

    .edit-section {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #333);
    }

    .edit-section h3 {
      color: var(--primary-text, #e0e0e0);
      margin: 0 0 16px 0;
      font-size: 15px;
    }

    .form-row {
      display: flex;
      gap: 12px;
    }

    .form-group {
      flex: 1;
      margin-bottom: 12px;
    }

    .form-group label {
      display: block;
      color: var(--secondary-text, #888);
      margin-bottom: 6px;
      font-size: 12px;
    }

    .form-group input {
      width: 100%;
      padding: 9px 12px;
      border: 1px solid var(--border-color, #333);
      border-radius: 6px;
      background: var(--primary-background, #0f3460);
      color: var(--primary-text, #e0e0e0);
      font-size: 13px;
      box-sizing: border-box;
      transition: border-color 0.2s;
    }

    .form-group input:focus {
      outline: none;
      border-color: var(--accent-color, #533483);
    }

    .btn {
      padding: 9px 20px;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 13px;
      cursor: pointer;
      transition: background-color 0.2s;
    }

    .save-btn {
      background: var(--accent-color, #533483);
    }

    .save-btn:hover:not(:disabled) {
      background: var(--accent-color-hover, #6b44a0);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .success-msg {
      margin: 16px 24px;
      padding: 10px 14px;
      background: rgba(92, 184, 92, 0.15);
      border: 1px solid #5cb85c;
      color: #5cb85c;
      border-radius: 6px;
      font-size: 13px;
    }

    .error-msg {
      margin-bottom: 8px;
      padding: 8px 12px;
      background: rgba(255, 68, 68, 0.12);
      border: 1px solid rgba(255, 68, 68, 0.3);
      color: #ff6b6b;
      border-radius: 6px;
      font-size: 13px;
    }

    .loading {
      text-align: center;
      color: var(--secondary-text, #888);
      padding: 60px 0;
    }

    @media (max-width: 480px) {
      .form-row { flex-direction: column; gap: 0; }
      .profile-header { padding: 20px 16px; }
      .info-section, .edit-section { padding: 16px; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  profile: UserProfile | null = null;

  editFirstName = '';
  editLastName = '';
  newPassword = '';
  confirmPassword = '';

  isSaving = false;
  successMessage = '';
  errorMessage = '';
  passwordError = '';

  constructor(private authService: AuthService) {}

  ngOnInit(): void {
    this.loadProfile();
  }

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (p) => {
        this.profile = p;
        this.editFirstName = p.firstName || '';
        this.editLastName = p.lastName || '';
      },
      error: () => {
        this.errorMessage = 'Failed to load profile';
      }
    });
  }

  getInitials(name: string): string {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
  }

  formatRole(role: string): string {
    if (!role) return '';
    return role.replace('ROLE_', '').replace(/_/g, ' ');
  }

  hasNameChanges(): boolean {
    return this.editFirstName !== (this.profile?.firstName || '') ||
           this.editLastName !== (this.profile?.lastName || '');
  }

  saveProfile(): void {
    this.clearMessages();
    this.isSaving = true;

    this.authService.updateProfile({
      firstName: this.editFirstName,
      lastName: this.editLastName
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.successMessage = 'Profile updated successfully';
        this.loadProfile();
        this.clearMessagesAfterDelay();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Failed to update profile';
      }
    });
  }

  changePassword(): void {
    this.clearMessages();
    this.passwordError = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }
    if (this.newPassword.length < 4) {
      this.passwordError = 'Password must be at least 4 characters';
      return;
    }

    this.isSaving = true;
    this.authService.updateProfile({ password: this.newPassword }).subscribe({
      next: () => {
        this.isSaving = false;
        this.newPassword = '';
        this.confirmPassword = '';
        this.successMessage = 'Password changed successfully';
        this.clearMessagesAfterDelay();
      },
      error: () => {
        this.isSaving = false;
        this.errorMessage = 'Failed to change password';
      }
    });
  }

  private clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
  }

  private clearMessagesAfterDelay(): void {
    setTimeout(() => this.clearMessages(), 4000);
  }
}
