import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { UserService } from '../../../services/user.service';
import { UserDto } from '../../../models/user.model';

interface UserForm {
  username: string;
  firstName: string;
  lastName: string;
  email: string;
  roles: string[];
  password: string;
  windowsUsername: string;
  isActive: boolean;
  permissionLevel: string;
  phone: string;
  company: string;
  signaturePath: string;
  signingInitials: string;
}

@Component({
  selector: 'app-user-management',
  standalone: true,
  imports: [CommonModule, FormsModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout header="User Management">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
      <div class="admin-container">

        <div *ngIf="errorMessage" class="error-message">{{ errorMessage }}</div>
        <div *ngIf="successMessage" class="success-message">{{ successMessage }}</div>

        <!-- Toolbar -->
        <div class="toolbar">
          <input
            type="text"
            class="search-input"
            placeholder="Search by name or email..."
            [(ngModel)]="searchQuery"
          />
          <button class="btn create" (click)="openCreateForm()">+ New User</button>
          <button class="btn seed" (click)="seedPlantUsers()" [disabled]="isSeeding">
            {{ isSeeding ? 'Seeding...' : 'Seed Plant Users' }}
          </button>
        </div>

        <!-- Create/Edit Form -->
        <div *ngIf="showForm" class="form-card">
          <h3>{{ editingUser ? 'Edit User' : 'Create User' }}</h3>
          <form (ngSubmit)="onSubmitForm()">
            <div class="form-row">
              <div class="form-group">
                <label>First Name</label>
                <input type="text" [(ngModel)]="form.firstName" name="firstName" required />
              </div>
              <div class="form-group">
                <label>Last Name</label>
                <input type="text" [(ngModel)]="form.lastName" name="lastName" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Username</label>
                <input type="text" [(ngModel)]="form.username" name="username" required />
              </div>
              <div class="form-group">
                <label>Email</label>
                <input type="email" [(ngModel)]="form.email" name="email" required />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Access roles <span class="hint">— web/admin access</span></label>
                <div class="roles-checkboxes">
                  <label *ngFor="let r of accessRoles" class="role-checkbox">
                    <input type="checkbox" [checked]="form.roles.includes(r)" (change)="toggleRole(r, $event)" />
                    {{ formatRole(r) }}
                  </label>
                  <span *ngIf="accessRoles.length === 0" class="empty-roles">Loading…</span>
                </div>
              </div>
              <div class="form-group">
                <label>{{ editingUser ? 'New Password (leave blank to keep)' : 'Password' }}</label>
                <input type="password" [(ngModel)]="form.password" name="password" [required]="!editingUser" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group" style="flex: 2">
                <label>LOTO roles <span class="hint">— authorize LOTO operations</span></label>
                <div class="roles-checkboxes">
                  <label *ngFor="let r of lotoRoles" class="role-checkbox loto-role">
                    <input type="checkbox" [checked]="form.roles.includes(r)" (change)="toggleRole(r, $event)" />
                    <span [title]="lotoRoleTooltip(r)">{{ formatLotoRole(r) }}</span>
                  </label>
                  <span *ngIf="lotoRoles.length === 0" class="empty-roles">Loading…</span>
                </div>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Signing initials <span class="hint">— 2–3 letters, e.g. DK</span></label>
                <input type="text" [(ngModel)]="form.signingInitials" name="signingInitials" maxlength="3" style="text-transform: uppercase; font-family: 'Courier New', monospace; letter-spacing: 1px;" placeholder="DK" />
              </div>
              <div class="form-group">
                <label>Permission Level</label>
                <select [(ngModel)]="form.permissionLevel" name="permissionLevel">
                  <option value="">None</option>
                  <option value="NONE">NONE</option>
                  <option value="BASIC">BASIC</option>
                  <option value="OPERATOR">OPERATOR</option>
                </select>
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Windows Username</label>
                <input type="text" [(ngModel)]="form.windowsUsername" name="windowsUsername" />
              </div>
              <div class="form-group">
                <label>Phone</label>
                <input type="text" [(ngModel)]="form.phone" name="phone" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Company</label>
                <input type="text" [(ngModel)]="form.company" name="company" />
              </div>
              <div class="form-group">
                <label>Signature path <span class="hint">— stored signature image (optional)</span></label>
                <input type="text" [(ngModel)]="form.signaturePath" name="signaturePath" />
              </div>
            </div>
            <div class="form-row" *ngIf="editingUser">
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
                  Active
                </label>
              </div>
            </div>
            <div class="form-actions">
              <button type="submit" class="btn approve" [disabled]="isSubmitting">
                {{ isSubmitting ? 'Saving...' : (editingUser ? 'Update' : 'Create') }}
              </button>
              <button type="button" class="btn cancel" (click)="closeForm()">Cancel</button>
            </div>
          </form>
        </div>

        <!-- Users Table -->
        <table class="grant-table" *ngIf="filteredUsers.length > 0">
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Permission</th>
              <th>Status</th>
              <th>Sign-in code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td><span *ngFor="let r of user.roles" class="badge" [ngClass]="getRoleBadgeClass(r)" style="margin-right:4px">{{ formatRole(r) }}</span></td>
              <td><span class="badge" [ngClass]="getPermissionBadgeClass(user.permissionLevel)">{{ user.permissionLevel || 'NONE' }}</span></td>
              <td><span class="badge" [ngClass]="user.isActive ? 'badge-active' : 'badge-inactive'">{{ user.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td>
                <!-- Initials inline editor + PIN status -->
                <div class="pin-cell">
                  <ng-container *ngIf="editingInitialsFor === user.id; else displayInitials">
                    <input type="text" class="initials-input" maxlength="3"
                           [(ngModel)]="initialsDraft"
                           (keydown.enter)="saveInitials(user)"
                           (keydown.escape)="cancelInitialsEdit()"
                           autofocus placeholder="DK">
                    <button class="btn-mini save" (click)="saveInitials(user)">✓</button>
                    <button class="btn-mini cancel" (click)="cancelInitialsEdit()">×</button>
                  </ng-container>
                  <ng-template #displayInitials>
                    <span class="initials" *ngIf="user.signingInitials; else noInitials">{{ user.signingInitials }}</span>
                    <ng-template #noInitials><span class="initials none">—</span></ng-template>
                    <button class="btn-mini" title="Edit initials" (click)="startInitialsEdit(user)">✎</button>
                  </ng-template>
                  <span class="pin-status" *ngIf="user.pinSetAt; else noPin">
                    <span class="badge badge-pin-set">PIN set</span>
                    <span *ngIf="isPinLocked(user)" class="badge badge-pin-locked">Locked</span>
                  </span>
                  <ng-template #noPin><span class="badge badge-pin-none">no PIN</span></ng-template>
                  <button class="btn-mini reset" title="Generate new PIN" (click)="generatePin(user)" [disabled]="!user.signingInitials">
                    🔄
                  </button>
                </div>
              </td>
              <td>
                <button class="btn edit" (click)="openEditForm(user)">Edit</button>
                <button class="btn deny" (click)="confirmDelete(user)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>

        <!-- Generated-PIN one-time-display dialog -->
        <div *ngIf="generatedPinUser" class="pin-dialog-backdrop" (click)="dismissPinDialog()">
          <div class="pin-dialog" (click)="$event.stopPropagation()">
            <h3>PIN generated for {{ generatedPinUser.name }}</h3>
            <p class="pin-help">Read this aloud, write it down, or copy it now. It can't be shown again.</p>
            <div class="pin-display">
              <span class="pin-initials">{{ generatedPinUser.signingInitials }}</span><span class="pin-digits">{{ generatedPin }}</span>
            </div>
            <p class="pin-help-secondary">User will be prompted to change it on their first PIN-based action.</p>
            <div class="form-actions">
              <button class="btn approve" (click)="copyPinToClipboard()">Copy {{ generatedPinUser.signingInitials }}{{ generatedPin }}</button>
              <button class="btn cancel" (click)="dismissPinDialog()">Done</button>
            </div>
          </div>
        </div>
        <div *ngIf="filteredUsers.length === 0 && !isLoading" class="empty">No users found</div>
        <div *ngIf="isLoading" class="empty">Loading...</div>

      </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .admin-container { padding: 20px; max-width: 1000px; margin: 0 auto; }

    .toolbar {
      display: flex;
      gap: 12px;
      margin-bottom: 20px;
      align-items: center;
    }
    .search-input {
      flex: 1;
      padding: 10px 14px;
      border: 1px solid #333;
      border-radius: 6px;
      background: #0f3460;
      color: #e0e0e0;
      font-size: 14px;
    }
    .search-input:focus { outline: none; border-color: #533483; }

    .form-card {
      background: #16213e;
      border-radius: 8px;
      padding: 20px;
      margin-bottom: 20px;
      border: 1px solid #1a1a3e;
    }
    .form-card h3 { color: #e0e0e0; margin: 0 0 16px 0; }
    .form-row {
      display: flex;
      gap: 16px;
      margin-bottom: 12px;
    }
    .form-group {
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .form-group label {
      color: #aaa;
      font-size: 12px;
      margin-bottom: 4px;
    }
    .form-group input, .form-group select {
      padding: 8px 10px;
      border: 1px solid #333;
      border-radius: 4px;
      background: #0f3460;
      color: #e0e0e0;
      font-size: 13px;
    }
    .form-group input:focus, .form-group select:focus {
      outline: none;
      border-color: #533483;
    }
    .checkbox-label {
      display: flex;
      align-items: center;
      gap: 8px;
      color: #ddd;
      font-size: 13px;
      margin-top: 18px;
    }
    .checkbox-label input[type="checkbox"] {
      width: 16px;
      height: 16px;
    }
    .form-actions {
      display: flex;
      gap: 10px;
      margin-top: 16px;
    }

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

    .badge {
      padding: 3px 10px;
      border-radius: 12px;
      font-size: 11px;
      font-weight: 600;
      text-transform: uppercase;
    }
    .badge-admin { background: rgba(83, 52, 131, 0.3); color: #b388ff; }
    .badge-employee { background: rgba(45, 90, 160, 0.3); color: #82b1ff; }
    .badge-contractor { background: rgba(230, 126, 34, 0.25); color: #ffb74d; }
    .badge-active { background: rgba(45, 138, 78, 0.25); color: #81c784; }
    .badge-inactive { background: rgba(192, 57, 43, 0.25); color: #ef9a9a; }

    .btn {
      padding: 6px 14px;
      border: none;
      border-radius: 4px;
      color: white;
      cursor: pointer;
      font-size: 12px;
      margin-right: 6px;
    }
    .btn.create { background: #533483; }
    .btn.approve { background: #2d8a4e; }
    .btn.edit { background: #2d5aa0; }
    .btn.deny { background: #c0392b; }
    .btn.cancel { background: #555; }
    .btn.seed { background: #e67e22; }
    .roles-checkboxes { display: flex; flex-wrap: wrap; gap: 10px; padding: 4px 0; }
    .role-checkbox {
      display: flex; align-items: center; gap: 4px;
      color: #ddd; font-size: 12px; cursor: pointer;
    }
    .role-checkbox.loto-role { background: rgba(83, 52, 131, 0.18); padding: 4px 8px; border-radius: 4px; border: 1px solid rgba(83, 52, 131, 0.5); }
    .role-checkbox.loto-role:hover { background: rgba(83, 52, 131, 0.30); }
    .role-checkbox input[type="checkbox"] { width: 14px; height: 14px; }
    .empty-roles { color: #888; font-style: italic; font-size: 12px; }
    .hint { color: #888; font-weight: normal; font-size: 11px; font-style: italic; }
    .btn:hover { opacity: 0.85; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

    .pin-cell { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
    .initials { font-family: 'Courier New', monospace; font-weight: 700; color: #82b1ff; background: #0a1a30; padding: 3px 8px; border-radius: 4px; letter-spacing: 1px; }
    .initials.none { color: #555; background: transparent; padding: 0; }
    .initials-input { width: 60px; padding: 4px 6px; border: 1px solid #533483; border-radius: 4px; background: #0f3460; color: #e0e0e0; font-family: 'Courier New', monospace; text-transform: uppercase; font-size: 13px; }
    .btn-mini { background: none; border: 1px solid #444; color: #aaa; cursor: pointer; padding: 2px 6px; border-radius: 3px; font-size: 11px; }
    .btn-mini:hover { background: #2a2a3a; color: #fff; }
    .btn-mini.save { color: #81c784; border-color: #2d8a4e; }
    .btn-mini.cancel { color: #ef9a9a; border-color: #c0392b; }
    .btn-mini.reset { color: #82b1ff; }
    .btn-mini:disabled { opacity: 0.4; cursor: not-allowed; }
    .pin-status { display: inline-flex; gap: 4px; }
    .badge-pin-set { background: rgba(45, 138, 78, 0.25); color: #81c784; }
    .badge-pin-none { background: rgba(192, 57, 43, 0.18); color: #ef9a9a; }
    .badge-pin-locked { background: rgba(230, 126, 34, 0.25); color: #ffb74d; }

    .pin-dialog-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.7); display: flex; align-items: center; justify-content: center; z-index: 2000; }
    .pin-dialog { background: #16213e; border: 2px solid #533483; border-radius: 10px; padding: 24px; min-width: 400px; box-shadow: 0 12px 36px rgba(0,0,0,0.6); }
    .pin-dialog h3 { color: #82b1ff; margin: 0 0 8px; }
    .pin-help { color: #aaa; font-size: 13px; margin: 0 0 16px; }
    .pin-help-secondary { color: #888; font-size: 12px; font-style: italic; margin: 12px 0; }
    .pin-display { text-align: center; padding: 16px; background: #0a1a30; border-radius: 6px; margin: 8px 0; }
    .pin-initials { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #82b1ff; letter-spacing: 4px; }
    .pin-digits { font-family: 'Courier New', monospace; font-size: 32px; font-weight: 700; color: #ffd54f; letter-spacing: 6px; margin-left: 4px; }

    .empty { color: #666; font-style: italic; padding: 20px 0; text-align: center; }
    .error-message {
      background: rgba(255, 68, 68, 0.15);
      border: 1px solid #ff4444;
      color: #ff6b6b;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
    .success-message {
      background: rgba(45, 138, 78, 0.15);
      border: 1px solid #2d8a4e;
      color: #81c784;
      padding: 12px;
      border-radius: 6px;
      margin-bottom: 16px;
    }
  `]
})
export class UserManagementComponent implements OnInit {
  users: UserDto[] = [];
  /** All known role names (access + LOTO). Kept for back-compat. */
  roles: string[] = [];
  /** Spring access roles — ROLE_*. */
  accessRoles: string[] = [];
  /** LOTO role names — CONTROL_AUTHORITY / LOTO_QUALIFIED / REQUESTOR / MANAGER. */
  lotoRoles: string[] = [];
  searchQuery = '';
  showForm = false;
  editingUser: UserDto | null = null;
  isLoading = false;
  isSubmitting = false;
  isSeeding = false;
  errorMessage = '';
  successMessage = '';

  form: UserForm = this.emptyForm();

  constructor(private userService: UserService) {}

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  get filteredUsers(): UserDto[] {
    if (!this.searchQuery.trim()) return this.users;
    const q = this.searchQuery.toLowerCase();
    return this.users.filter(u =>
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }

  loadUsers(): void {
    this.isLoading = true;
    this.userService.getUsers(1, 200).subscribe({
      next: (res) => {
        this.users = (res.responseData?.content ?? []).map(u => UserDto.fromJson(u));
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load users';
        this.isLoading = false;
      }
    });
  }

  loadRoles(): void {
    this.userService.getRoles().subscribe({
      next: (res) => {
        this.roles = res.roles ?? [];
        // Prefer the server's split if present; otherwise derive locally.
        this.accessRoles = res.accessRoles ?? this.roles.filter(r => r.startsWith('ROLE_'));
        this.lotoRoles = res.lotoRoles ?? this.roles.filter(r => !r.startsWith('ROLE_'));
      },
      error: () => {
        this.accessRoles = [
          'ROLE_ADMIN',
          'ROLE_EMPLOYEE',
          'ROLE_CONTRACTOR',
          'ROLE_PLANT',
          'ROLE_LOG_DIAGNOSTICS',
        ];
        this.lotoRoles = ['CONTROL_AUTHORITY', 'LOTO_QUALIFIED', 'REQUESTOR', 'MANAGER'];
        this.roles = [...this.accessRoles, ...this.lotoRoles];
      }
    });
  }

  /** Friendly label for a LOTO role. */
  formatLotoRole(role: string): string {
    switch (role) {
      case 'CONTROL_AUTHORITY': return 'Control Authority';
      case 'LOTO_QUALIFIED':    return 'LOTO Qualified';
      case 'REQUESTOR':         return 'Requestor';
      case 'MANAGER':           return 'Manager';
      default:                  return role;
    }
  }

  /** Short permission summary shown as a tooltip on each LOTO-role checkbox. */
  lotoRoleTooltip(role: string): string {
    switch (role) {
      case 'CONTROL_AUTHORITY':
        return 'Develops standards, issues permits, approves hanging, activates, pauses, modifies, releases, closes. Can also hang/verify and be a requestor.';
      case 'LOTO_QUALIFIED':
        return 'Can hang, verify, walkdown, and remove points.';
      case 'REQUESTOR':
        return 'Can be assigned as a permit requestor — initiate transfer, accept transfer, release as requestor.';
      case 'MANAGER':
        return 'Final-approves a standard after testing.';
      default:
        return '';
    }
  }

  formatRole(role: string): string {
    if (role === 'ROLE_LOG_DIAGNOSTICS') return 'Log diagnostics';
    return role.replace('ROLE_', '').charAt(0) + role.replace('ROLE_', '').slice(1).toLowerCase();
  }

  getRoleBadgeClass(role: string): string {
    if (role.includes('ADMIN')) return 'badge-admin';
    if (role.includes('CONTRACTOR')) return 'badge-contractor';
    return 'badge-employee';
  }

  openCreateForm(): void {
    this.editingUser = null;
    this.form = this.emptyForm();
    this.showForm = true;
    this.clearMessages();
  }

  openEditForm(user: UserDto): void {
    this.editingUser = user;
    this.form = {
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      roles: user.roles ?? [],
      password: '',
      windowsUsername: user.windowsUsername,
      isActive: user.isActive,
      permissionLevel: (user as any).permissionLevel || '',
      phone: user.phone ?? '',
      company: user.company ?? '',
      signaturePath: user.signaturePath ?? '',
      signingInitials: user.signingInitials ?? '',
    };
    this.showForm = true;
    this.clearMessages();
  }

  closeForm(): void {
    this.showForm = false;
    this.editingUser = null;
  }

  onSubmitForm(): void {
    this.clearMessages();
    this.isSubmitting = true;

    // signingInitials lives on a separate admin endpoint (PIN auth concerns are
    // kept under /auth/admin). After the main user save succeeds, persist the
    // initials if changed.
    const desiredInitials = (this.form.signingInitials ?? '').trim().toUpperCase();
    const initialsChanged = (this.editingUser?.signingInitials ?? '') !== desiredInitials;

    if (this.editingUser) {
      const payload: any = { ...this.form };
      if (!payload.password) delete payload.password;
      // Strip signingInitials before sending — main UpdateUserRequest doesn't accept it.
      delete payload.signingInitials;
      this.userService.updateUser(String(this.editingUser.id), payload).subscribe({
        next: (res) => {
          if (initialsChanged && desiredInitials) {
            this.persistInitialsThenFinish(this.editingUser!.id, desiredInitials, res.message || 'User updated');
          } else {
            this.successMessage = res.message || 'User updated';
            this.isSubmitting = false;
            this.closeForm();
            this.loadUsers();
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update user';
          this.isSubmitting = false;
        }
      });
    } else {
      const payload: any = { ...this.form };
      delete payload.signingInitials;
      this.userService.createUser(payload).subscribe({
        next: (res) => {
          const createdId = res.responseData?.id;
          if (createdId && desiredInitials) {
            this.persistInitialsThenFinish(createdId, desiredInitials, res.message || 'User created');
          } else {
            this.successMessage = res.message || 'User created';
            this.isSubmitting = false;
            this.closeForm();
            this.loadUsers();
          }
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create user';
          this.isSubmitting = false;
        }
      });
    }
  }

  /** Persist signing initials via the auth admin endpoint, then close the form. */
  private persistInitialsThenFinish(userId: number, initials: string, baseMessage: string): void {
    this.userService.setSigningInitials(userId, initials).subscribe({
      next: () => {
        this.successMessage = `${baseMessage} (initials: ${initials})`;
        this.isSubmitting = false;
        this.closeForm();
        this.loadUsers();
      },
      error: (err) => {
        // User was saved successfully but initials failed — surface that explicitly.
        this.errorMessage = `User saved but initials failed: ${err?.error?.message || 'unknown error'}`;
        this.isSubmitting = false;
        this.loadUsers();
      }
    });
  }

  seedPlantUsers(): void {
    if (!confirm('Seed 27 plant users? Existing users will be skipped.')) return;
    this.clearMessages();
    this.isSeeding = true;
    this.userService.seedPlantUsers().subscribe({
      next: (res) => {
        const data = res.responseData;
        this.successMessage = res.message || `Created ${data?.created?.length ?? 0}, skipped ${data?.skipped?.length ?? 0}`;
        this.isSeeding = false;
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to seed users';
        this.isSeeding = false;
      }
    });
  }

  confirmDelete(user: UserDto): void {
    if (!confirm(`Delete user "${user.name}"? This will deactivate the account.`)) return;
    this.clearMessages();
    this.userService.deleteUser(String(user.id)).subscribe({
      next: (res) => {
        this.successMessage = res.message || 'User deleted';
        this.loadUsers();
      },
      error: (err) => {
        this.errorMessage = err.error?.message || 'Failed to delete user';
      }
    });
  }

  getPermissionBadgeClass(level: string): string {
    if (level === 'OPERATOR') return 'badge-admin';
    if (level === 'BASIC') return 'badge-employee';
    return 'badge-inactive';
  }

  // ── PIN administration ────────────────────────────────────────────────────
  editingInitialsFor: number | null = null;
  initialsDraft = '';
  generatedPinUser: UserDto | null = null;
  generatedPin = '';

  startInitialsEdit(user: UserDto): void {
    this.editingInitialsFor = user.id;
    this.initialsDraft = (user.signingInitials ?? '').toUpperCase();
  }

  cancelInitialsEdit(): void {
    this.editingInitialsFor = null;
    this.initialsDraft = '';
  }

  saveInitials(user: UserDto): void {
    const initials = (this.initialsDraft ?? '').trim().toUpperCase();
    if (!/^[A-Z]{2,3}$/.test(initials)) {
      this.errorMessage = 'Initials must be 2 or 3 letters';
      return;
    }
    this.clearMessages();
    this.userService.setSigningInitials(user.id, initials).subscribe({
      next: () => {
        user.signingInitials = initials;
        this.cancelInitialsEdit();
        this.successMessage = `Initials set to ${initials} for ${user.name}`;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to save initials';
      }
    });
  }

  generatePin(user: UserDto): void {
    if (!user.signingInitials) {
      this.errorMessage = 'Assign initials before generating a PIN';
      return;
    }
    if (!confirm(`Generate a new PIN for ${user.name}? Any existing PIN for this user will be invalidated.`)) return;
    this.clearMessages();
    this.userService.resetUserPin(user.id).subscribe({
      next: (res) => {
        this.generatedPinUser = user;
        this.generatedPin = res.pin;
        // Refresh user record so pinSetAt is reflected in the list
        user.pinSetAt = new Date().toISOString();
        user.pinLockedUntil = null;
      },
      error: (err) => {
        this.errorMessage = err?.error?.message ?? 'Failed to generate PIN';
      }
    });
  }

  copyPinToClipboard(): void {
    const code = `${this.generatedPinUser?.signingInitials ?? ''}${this.generatedPin}`;
    if (navigator.clipboard && code) {
      navigator.clipboard.writeText(code);
    }
  }

  dismissPinDialog(): void {
    this.generatedPinUser = null;
    this.generatedPin = '';
  }

  isPinLocked(user: UserDto): boolean {
    if (!user.pinLockedUntil) return false;
    return new Date(user.pinLockedUntil) > new Date();
  }

  toggleRole(role: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.form.roles.includes(role)) this.form.roles.push(role);
    } else {
      this.form.roles = this.form.roles.filter(r => r !== role);
    }
  }

  private emptyForm(): UserForm {
    return {
      username: '', firstName: '', lastName: '',
      email: '', roles: [], password: '',
      windowsUsername: '', isActive: true, permissionLevel: '',
      phone: '', company: '', signaturePath: '', signingInitials: '',
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
