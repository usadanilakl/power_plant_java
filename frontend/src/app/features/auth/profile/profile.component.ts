import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService, UserProfile, AccessGrantSummary } from '../../../services/auth.service';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { ThemeService } from '../../../shared/theme-toggle/theme.service';
import { GlobalMessageService } from '../../../shared/global-message/global-message.service';
import { PasswordToggleDirective } from '../../../shared/password-toggle/password-toggle.directive';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent, PasswordToggleDirective],
  template: `
    <app-main-layout header="My Profile">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
      <div class="profile-container">
        <!-- Tabs -->
        <div class="tabs">
          <button *ngFor="let tab of tabs; let i = index"
                  class="tab" [class.active]="activeTab === i"
                  (click)="activeTab = i">
            {{ tab }}
          </button>
        </div>

        <!-- Tab 1: Profile Info -->
        <div class="tab-content" *ngIf="activeTab === 0">
          <div class="profile-card" *ngIf="profile">
            <div class="profile-header">
              <div class="avatar-lg">{{ getInitials(profile.name) }}</div>
              <div class="identity">
                <h2>{{ profile.name }}</h2>
                <div class="badges">
                  <span class="role-badge" *ngFor="let r of (profile.roles || [])">{{ formatRole(r) }}</span>
                  <span class="access-badge" [ngClass]="accessLevelClass" *ngIf="accessLevel">{{ accessLevelLabel }}</span>
                </div>
              </div>
            </div>

            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">Email</span>
                <span class="info-value">{{ profile.email }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Username</span>
                <span class="info-value">{{ profile.username }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Windows Username</span>
                <span class="info-value">{{ profile.windowsUsername || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">Status</span>
                <span class="info-value" [class.active]="profile.isActive" [class.inactive]="!profile.isActive">
                  {{ profile.isActive ? 'Active' : 'Inactive' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">Last Login</span>
                <span class="info-value">{{ profile.lastLoginDate ? (profile.lastLoginDate | date:'medium') : 'Never' }}</span>
              </div>
            </div>

            <div class="edit-section">
              <h3>Edit Name</h3>
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
              <button class="btn primary" (click)="saveProfile()" [disabled]="isSaving || !hasNameChanges()">
                {{ isSaving ? 'Saving...' : 'Save Changes' }}
              </button>
            </div>
          </div>
          <div class="loading" *ngIf="!profile && !loadError">Loading profile...</div>
          <div class="error-box" *ngIf="loadError">{{ loadError }}</div>
        </div>

        <!-- Tab 2: Security -->
        <div class="tab-content" *ngIf="activeTab === 1">
          <div class="security-card">
            <h3>Change Password</h3>
            <p class="section-desc">Enter your current password and choose a new one.</p>

            <div class="form-group">
              <label for="currentPassword">Current Password</label>
              <input id="currentPassword" type="password" [(ngModel)]="currentPassword" placeholder="Enter current password" appPasswordToggle />
            </div>
            <div class="form-group">
              <label for="newPassword">New Password</label>
              <input id="newPassword" type="password" [(ngModel)]="newPassword" placeholder="Enter new password" (ngModelChange)="updateStrength()" appPasswordToggle />
            </div>
            <div class="form-group">
              <label for="confirmPassword">Confirm New Password</label>
              <input id="confirmPassword" type="password" [(ngModel)]="confirmPassword" placeholder="Confirm new password" appPasswordToggle />
            </div>

            <!-- Strength Meter -->
            <div class="strength-meter" *ngIf="newPassword">
              <div class="strength-bar">
                <div *ngFor="let i of [0,1,2,3,4]"
                     class="strength-segment"
                     [class.filled]="i < strengthScore"
                     [style.background-color]="i < strengthScore ? strengthColor : ''">
                </div>
              </div>
              <span class="strength-label" [style.color]="strengthColor">{{ strengthLabel }}</span>
            </div>

            <!-- Requirements Checklist -->
            <div class="requirements" *ngIf="newPassword">
              <div class="req-item" *ngFor="let req of requirements" [class.met]="req.met">
                <span class="req-icon">{{ req.met ? '\u2713' : '\u2717' }}</span>
                {{ req.label }}
              </div>
            </div>

            <div class="error-box" *ngIf="passwordError">{{ passwordError }}</div>

            <button class="btn primary" (click)="changePassword()" [disabled]="isSaving || !currentPassword || !newPassword">
              {{ isSaving ? 'Changing...' : 'Change Password' }}
            </button>
          </div>

          <!-- PIN section: signing-PIN management (separate credential from the
               password; used by the X-Sign-As-Token / step-up flow). -->
          <div class="security-card pin-card">
            <h3>Signing PIN</h3>
            <p class="section-desc" *ngIf="profile?.signingInitials">
              Your sign-in code:
              <strong class="initials">{{ profile?.signingInitials }}</strong>
              + your 4-digit PIN.
              Used on shared tablets to authorize signing actions without logging out.
            </p>
            <p class="section-desc" *ngIf="!profile?.signingInitials">
              You don't have signing initials yet. Ask an administrator to set them before you can use the PIN flow.
            </p>

            <div *ngIf="profile?.pinMustChange" class="error-box must-change-banner">
              ⚠ Your PIN was set by an administrator. Please change it now to one only you know.
            </div>

            <div *ngIf="profile?.signingInitials && profile?.pinResetRequestedAt" class="success-box">
              Reset requested {{ profile?.pinResetRequestedAt | date:'short' }} — waiting for an administrator to issue a new PIN.
            </div>

            <div *ngIf="profile?.signingInitials">
              <div class="form-group">
                <label for="currentPin">Current PIN</label>
                <input id="currentPin" type="password" inputmode="numeric" maxlength="6"
                       [(ngModel)]="currentPin" placeholder="4-digit PIN" autocomplete="off" />
              </div>
              <div class="form-group">
                <label for="newPin">New PIN</label>
                <input id="newPin" type="password" inputmode="numeric" maxlength="6"
                       [(ngModel)]="newPin" placeholder="New 4-digit PIN" autocomplete="off" />
              </div>
              <div class="form-group">
                <label for="confirmPin">Confirm New PIN</label>
                <input id="confirmPin" type="password" inputmode="numeric" maxlength="6"
                       [(ngModel)]="confirmPin" placeholder="Re-enter new PIN" autocomplete="off" />
              </div>

              <div class="error-box" *ngIf="pinError">{{ pinError }}</div>
              <div class="success-box" *ngIf="pinSuccess">{{ pinSuccess }}</div>

              <button class="btn primary"
                      (click)="submitPinChange()"
                      [disabled]="isSavingPin || !currentPin || !newPin || !confirmPin">
                {{ isSavingPin ? 'Updating...' : 'Update PIN' }}
              </button>
              <button class="btn secondary forgot-pin-btn"
                      *ngIf="!profile?.pinResetRequestedAt"
                      (click)="requestForgotPin()"
                      [disabled]="isSavingPin">
                Forgot PIN — request reset
              </button>
            </div>
          </div>
        </div>

        <!-- Tab 3: Sessions -->
        <div class="tab-content" *ngIf="activeTab === 2">
          <div class="sessions-card">
            <div class="section-header">
              <h3>Access Grant History</h3>
              <button class="btn secondary small" (click)="loadSessions()">Refresh</button>
            </div>

            <div *ngIf="sessions.length === 0 && !sessionsLoading" class="empty-state">
              No access grants found. Access grants are created when you request full access from outside the plant network.
            </div>
            <div *ngIf="sessionsLoading" class="loading">Loading sessions...</div>

            <table *ngIf="sessions.length > 0" class="data-table">
              <thead>
                <tr>
                  <th>Status</th>
                  <th>IP Address</th>
                  <th>Device</th>
                  <th>Requested</th>
                  <th>Approved</th>
                  <th>Expires</th>
                  <th>Last Active</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let s of sessions">
                  <td><span class="status-badge" [ngClass]="'status-' + s.status.toLowerCase()">{{ s.status }}</span></td>
                  <td>{{ s.requestIp || '-' }}</td>
                  <td class="device-cell" [title]="s.deviceInfo || ''">{{ truncateDevice(s.deviceInfo) }}</td>
                  <td>{{ s.requestedAt | date:'short' }}</td>
                  <td>{{ s.approvedAt ? (s.approvedAt | date:'short') : '-' }}</td>
                  <td>{{ s.expiresAt ? (s.expiresAt | date:'short') : '-' }}</td>
                  <td>{{ s.lastActiveAt ? (s.lastActiveAt | date:'short') : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Tab 4: Preferences -->
        <div class="tab-content" *ngIf="activeTab === 3">
          <div class="preferences-card">
            <h3>Appearance</h3>
            <div class="pref-row">
              <div class="pref-info">
                <span class="pref-label">Theme</span>
                <span class="pref-value">{{ themeService.theme() === 'dark' ? 'Dark' : 'Light' }}</span>
              </div>
              <button class="btn secondary" (click)="themeService.toggleTheme()">
                {{ themeService.theme() === 'dark' ? 'Switch to Light' : 'Switch to Dark' }}
              </button>
            </div>
          </div>
        </div>
      </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .profile-container {
      max-width: 700px;
      margin: 20px auto;
      padding: 0 16px;
    }

    .tabs {
      display: flex;
      gap: 2px;
      background: var(--secondary-background, #16213e);
      border-radius: 10px 10px 0 0;
      padding: 4px;
      margin-bottom: 0;
    }

    .tab {
      flex: 1;
      padding: 10px 16px;
      border: none;
      background: transparent;
      color: var(--secondary-text, #888);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      border-radius: 8px;
      transition: all 0.2s;
    }

    .tab:hover {
      color: var(--primary-text, #e0e0e0);
      background: rgba(255, 255, 255, 0.04);
    }

    .tab.active {
      background: var(--primary-background, #0f3460);
      color: var(--primary-text, #e0e0e0);
      font-weight: 600;
    }

    .tab-content {
      animation: fadeIn 0.2s ease;
    }

    @keyframes fadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }

    /* Profile Info Tab */
    .profile-card {
      background: var(--secondary-background, #16213e);
      border-radius: 0 0 12px 12px;
      overflow: hidden;
    }

    .profile-header {
      display: flex;
      align-items: center;
      gap: 20px;
      padding: 28px 24px;
      background: linear-gradient(135deg, var(--accent-color, #533483) 0%, #2d1b69 100%);
    }

    .avatar-lg {
      width: 96px;
      height: 96px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.2);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 2rem;
      font-weight: 700;
      flex-shrink: 0;
      border: 3px solid rgba(255, 255, 255, 0.3);
    }

    .identity h2 {
      color: white;
      margin: 0 0 8px 0;
      font-size: 1.4rem;
    }

    .badges {
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
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

    .access-badge {
      display: inline-block;
      padding: 3px 12px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      letter-spacing: 0.5px;
    }

    .access-badge.access-full {
      background: rgba(46, 204, 113, 0.3);
      color: #2ecc71;
    }

    .access-badge.access-restricted {
      background: rgba(230, 126, 34, 0.3);
      color: #e67e22;
    }

    .access-badge.access-pending {
      background: rgba(241, 196, 15, 0.3);
      color: #f1c40f;
    }

    .info-grid {
      padding: 20px 24px;
      border-bottom: 1px solid var(--border-color, #333);
    }

    .info-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 10px 0;
    }

    .info-item:not(:last-child) {
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
    }

    .info-label {
      color: var(--secondary-text, #888);
      font-size: 13px;
    }

    .info-value {
      color: var(--primary-text, #e0e0e0);
      font-size: 13px;
      font-weight: 500;
    }

    .info-value.active { color: #5cb85c; }
    .info-value.inactive { color: #d9534f; }

    .edit-section {
      padding: 20px 24px;
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
      margin-bottom: 14px;
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

    /* Buttons */
    .btn {
      padding: 9px 20px;
      border: none;
      border-radius: 6px;
      color: white;
      font-size: 13px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn.primary {
      background: var(--accent-color, #533483);
    }

    .btn.primary:hover:not(:disabled) {
      background: var(--accent-color-hover, #6b44a0);
    }

    .btn.secondary {
      background: rgba(255, 255, 255, 0.08);
      border: 1px solid var(--border-color, #333);
    }

    .btn.secondary:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.12);
    }

    .btn.small {
      padding: 6px 14px;
      font-size: 12px;
    }

    /* Security Tab */
    .security-card, .sessions-card, .preferences-card {
      background: var(--secondary-background, #16213e);
      border-radius: 0 0 12px 12px;
      padding: 24px;
    }

    .security-card h3, .sessions-card h3, .preferences-card h3 {
      color: var(--primary-text, #e0e0e0);
      margin: 0 0 8px 0;
      font-size: 16px;
    }

    .section-desc {
      color: var(--secondary-text, #888);
      font-size: 13px;
      margin: 0 0 20px 0;
    }

    .strength-meter {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .strength-bar {
      display: flex;
      gap: 3px;
      flex: 1;
      max-width: 200px;
    }

    .strength-segment {
      height: 6px;
      flex: 1;
      border-radius: 3px;
      background: rgba(255, 255, 255, 0.1);
      transition: background-color 0.3s;
    }

    .strength-label {
      font-size: 12px;
      font-weight: 600;
      white-space: nowrap;
    }

    .requirements {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 6px;
      margin-bottom: 16px;
    }

    .req-item {
      font-size: 12px;
      color: var(--secondary-text, #888);
      display: flex;
      align-items: center;
      gap: 6px;
      transition: color 0.2s;
    }

    .req-item.met {
      color: #5cb85c;
    }

    .req-icon {
      font-size: 13px;
      width: 16px;
      text-align: center;
    }

    /* Sessions Tab */
    .section-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 16px;
    }

    .section-header h3 {
      margin: 0 !important;
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
      white-space: nowrap;
    }

    .data-table td {
      padding: 8px 10px;
      color: var(--primary-text, #e0e0e0);
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .device-cell {
      max-width: 120px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .status-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      letter-spacing: 0.3px;
    }

    .status-approved { background: rgba(46, 204, 113, 0.2); color: #2ecc71; }
    .status-pending { background: rgba(241, 196, 15, 0.2); color: #f1c40f; }
    .status-expired { background: rgba(149, 165, 166, 0.2); color: #95a5a6; }
    .status-denied, .status-revoked { background: rgba(231, 76, 60, 0.2); color: #e74c3c; }

    /* Preferences Tab */
    .pref-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 16px 0;
      border-top: 1px solid rgba(255, 255, 255, 0.05);
    }

    .pref-info {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }

    .pref-label {
      color: var(--primary-text, #e0e0e0);
      font-size: 14px;
      font-weight: 500;
    }

    .pref-value {
      color: var(--secondary-text, #888);
      font-size: 12px;
    }

    /* Common */
    .error-box {
      margin-bottom: 12px;
      padding: 10px 14px;
      background: rgba(255, 68, 68, 0.12);
      border: 1px solid rgba(255, 68, 68, 0.3);
      color: #ff6b6b;
      border-radius: 6px;
      font-size: 13px;
    }

    .success-box {
      margin-bottom: 12px;
      padding: 10px 14px;
      background: rgba(46, 204, 113, 0.12);
      border: 1px solid rgba(46, 204, 113, 0.35);
      color: #81c784;
      border-radius: 6px;
      font-size: 13px;
    }

    /* Signing PIN section */
    .pin-card { margin-top: 16px; }
    .forgot-pin-btn { margin-left: 8px; }
    .pin-card .initials {
      font-family: 'Courier New', monospace;
      font-weight: 700;
      color: #82b1ff;
      background: rgba(82, 177, 255, 0.12);
      padding: 2px 8px;
      border-radius: 4px;
      letter-spacing: 2px;
    }

    .empty-state {
      text-align: center;
      color: var(--secondary-text, #888);
      padding: 40px 20px;
      font-size: 13px;
    }

    .loading {
      text-align: center;
      color: var(--secondary-text, #888);
      padding: 40px 0;
    }

    @media (max-width: 600px) {
      .form-row { flex-direction: column; gap: 0; }
      .profile-header { padding: 20px 16px; }
      .requirements { grid-template-columns: 1fr; }
      .tabs { flex-wrap: wrap; }
    }
  `]
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  private messageService = inject(GlobalMessageService);

  profile: UserProfile | null = null;
  tabs = ['Profile', 'Security', 'Sessions', 'Preferences'];
  activeTab = 0;

  // Profile info
  editFirstName = '';
  editLastName = '';

  // Security
  currentPassword = '';
  newPassword = '';
  confirmPassword = '';
  passwordError = '';
  strengthScore = 0;
  strengthLabel = '';
  strengthColor = '';
  requirements: { label: string; met: boolean }[] = [];

  // Signing PIN
  currentPin = '';
  newPin = '';
  confirmPin = '';
  pinError = '';
  pinSuccess = '';
  isSavingPin = false;

  // Sessions
  sessions: AccessGrantSummary[] = [];
  sessionsLoading = false;

  // General
  isSaving = false;
  loadError = '';

  get accessLevel(): string | undefined {
    return this.authService.currentUser?.accessLevel;
  }

  get accessLevelClass(): string {
    const level = this.accessLevel;
    if (level === 'FULL') return 'access-full';
    if (level === 'RESTRICTED') return 'access-restricted';
    if (level === 'PENDING') return 'access-pending';
    return '';
  }

  get accessLevelLabel(): string {
    const level = this.accessLevel;
    if (level === 'FULL') return 'Full Access';
    if (level === 'RESTRICTED') return 'Restricted';
    if (level === 'PENDING') return 'Pending';
    return '';
  }

  ngOnInit(): void {
    this.loadProfile();
    this.loadSessions();
  }

  loadProfile(): void {
    this.authService.getProfile().subscribe({
      next: (p) => {
        this.profile = p;
        this.editFirstName = p.firstName || '';
        this.editLastName = p.lastName || '';
      },
      error: () => {
        this.loadError = 'Failed to load profile';
      }
    });
  }

  loadSessions(): void {
    this.sessionsLoading = true;
    this.authService.getMyAccessGrants().subscribe({
      next: (data) => {
        this.sessions = data;
        this.sessionsLoading = false;
      },
      error: () => {
        this.sessionsLoading = false;
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
    this.isSaving = true;
    this.authService.updateProfile({
      firstName: this.editFirstName,
      lastName: this.editLastName
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.messageService.showSuccess('Profile updated successfully');
        this.loadProfile();
      },
      error: () => {
        this.isSaving = false;
        this.messageService.showError('Failed to update profile');
      }
    });
  }

  updateStrength(): void {
    const pw = this.newPassword;
    const checks = [
      { label: 'At least 8 characters', met: pw.length >= 8 },
      { label: '12+ characters', met: pw.length >= 12 },
      { label: 'Lowercase letter', met: /[a-z]/.test(pw) },
      { label: 'Uppercase letter', met: /[A-Z]/.test(pw) },
      { label: 'Number', met: /\d/.test(pw) },
      { label: 'Special character', met: /[^a-zA-Z0-9]/.test(pw) }
    ];
    this.requirements = checks;
    this.strengthScore = checks.filter(c => c.met).length;

    const levels = [
      { label: 'Very Weak', color: '#e74c3c' },
      { label: 'Weak', color: '#e67e22' },
      { label: 'Fair', color: '#f1c40f' },
      { label: 'Good', color: '#27ae60' },
      { label: 'Strong', color: '#2ecc71' },
      { label: 'Very Strong', color: '#1abc9c' }
    ];
    const level = levels[Math.min(this.strengthScore, levels.length - 1)];
    this.strengthLabel = level.label;
    this.strengthColor = level.color;
  }

  changePassword(): void {
    this.passwordError = '';

    if (this.newPassword !== this.confirmPassword) {
      this.passwordError = 'Passwords do not match';
      return;
    }
    if (this.newPassword.length < 8) {
      this.passwordError = 'Password must be at least 8 characters';
      return;
    }

    this.isSaving = true;
    this.authService.changePasswordVerified({
      currentPassword: this.currentPassword,
      newPassword: this.newPassword
    }).subscribe({
      next: () => {
        this.isSaving = false;
        this.currentPassword = '';
        this.newPassword = '';
        this.confirmPassword = '';
        this.strengthScore = 0;
        this.requirements = [];
        this.messageService.showSuccess('Password changed successfully');
      },
      error: (err) => {
        this.isSaving = false;
        if (err.error?.error === 'WRONG_PASSWORD') {
          this.passwordError = 'Current password is incorrect';
        } else if (err.error?.error === 'WEAK_PASSWORD') {
          this.passwordError = err.error.message;
        } else {
          this.passwordError = 'Failed to change password';
        }
      }
    });
  }

  truncateDevice(device: string | null): string {
    if (!device) return '-';
    return device.length > 40 ? device.substring(0, 40) + '...' : device;
  }

  /**
   * Submit a self-service PIN change. Mirrors changePassword but talks to the
   * dedicated /api/auth/pin/change endpoint, which validates current PIN +
   * format (4-digit, not trivial) on the server.
   */
  submitPinChange(): void {
    this.pinError = '';
    this.pinSuccess = '';

    if (!/^\d{4,6}$/.test(this.newPin)) {
      this.pinError = 'New PIN must be 4–6 digits';
      return;
    }
    if (this.newPin !== this.confirmPin) {
      this.pinError = 'PINs do not match';
      return;
    }
    if (this.newPin === this.currentPin) {
      this.pinError = 'New PIN must differ from current PIN';
      return;
    }

    this.isSavingPin = true;
    this.authService.changeOwnPin(this.currentPin, this.newPin).subscribe({
      next: () => {
        this.isSavingPin = false;
        this.currentPin = '';
        this.newPin = '';
        this.confirmPin = '';
        this.pinSuccess = 'PIN updated';
        this.messageService.showSuccess('Signing PIN updated');
      },
      error: (err) => {
        this.isSavingPin = false;
        this.pinError = err?.error?.message ?? err?.message ?? 'Failed to change PIN';
      }
    });
  }

  /** Flag account for admin-driven PIN reset (forgot-PIN flow). */
  requestForgotPin(): void {
    if (!confirm('Send a PIN reset request to your administrator? They will generate a new PIN and hand it to you in person.')) return;
    this.pinError = '';
    this.pinSuccess = '';
    this.authService.requestPinReset().subscribe({
      next: res => {
        this.pinSuccess = res.message ?? 'Reset request sent';
        this.messageService.showSuccess('Reset request sent');
        this.loadProfile();
      },
      error: err => {
        this.pinError = err?.error?.message ?? err?.message ?? 'Failed to send reset request';
      }
    });
  }
}
