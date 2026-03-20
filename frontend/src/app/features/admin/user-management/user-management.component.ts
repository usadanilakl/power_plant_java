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
  role: string;
  password: string;
  windowsUsername: string;
  isActive: boolean;
  permissionLevel: string;
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
                <label>Role</label>
                <select [(ngModel)]="form.role" name="role" required>
                  <option value="" disabled>Select role</option>
                  <option *ngFor="let r of roles" [value]="r">{{ formatRole(r) }}</option>
                </select>
              </div>
              <div class="form-group">
                <label>{{ editingUser ? 'New Password (leave blank to keep)' : 'Password' }}</label>
                <input type="password" [(ngModel)]="form.password" name="password" [required]="!editingUser" />
              </div>
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Windows Username</label>
                <input type="text" [(ngModel)]="form.windowsUsername" name="windowsUsername" />
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
              <th>Windows User</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let user of filteredUsers">
              <td>{{ user.name }}</td>
              <td>{{ user.email }}</td>
              <td><span class="badge" [ngClass]="getRoleBadgeClass(user.role)">{{ formatRole(user.role) }}</span></td>
              <td><span class="badge" [ngClass]="getPermissionBadgeClass(user.permissionLevel)">{{ user.permissionLevel || 'NONE' }}</span></td>
              <td><span class="badge" [ngClass]="user.isActive ? 'badge-active' : 'badge-inactive'">{{ user.isActive ? 'Active' : 'Inactive' }}</span></td>
              <td>{{ user.windowsUsername }}</td>
              <td>
                <button class="btn edit" (click)="openEditForm(user)">Edit</button>
                <button class="btn deny" (click)="confirmDelete(user)">Delete</button>
              </td>
            </tr>
          </tbody>
        </table>
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
    .btn:hover { opacity: 0.85; }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }

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
  roles: string[] = [];
  searchQuery = '';
  showForm = false;
  editingUser: UserDto | null = null;
  isLoading = false;
  isSubmitting = false;
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
      next: (res) => this.roles = res.roles ?? [],
      error: () => this.roles = ['ROLE_ADMIN', 'ROLE_EMPLOYEE', 'ROLE_CONTRACTOR']
    });
  }

  formatRole(role: string): string {
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
      role: user.role,
      password: '',
      windowsUsername: user.windowsUsername,
      isActive: user.isActive,
      permissionLevel: (user as any).permissionLevel || ''
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

    if (this.editingUser) {
      const payload: any = { ...this.form };
      if (!payload.password) delete payload.password;
      this.userService.updateUser(String(this.editingUser.id), payload).subscribe({
        next: (res) => {
          this.successMessage = res.message || 'User updated';
          this.isSubmitting = false;
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to update user';
          this.isSubmitting = false;
        }
      });
    } else {
      this.userService.createUser(this.form as any).subscribe({
        next: (res) => {
          this.successMessage = res.message || 'User created';
          this.isSubmitting = false;
          this.closeForm();
          this.loadUsers();
        },
        error: (err) => {
          this.errorMessage = err.error?.message || 'Failed to create user';
          this.isSubmitting = false;
        }
      });
    }
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

  private emptyForm(): UserForm {
    return {
      username: '', firstName: '', lastName: '',
      email: '', role: '', password: '',
      windowsUsername: '', isActive: true, permissionLevel: ''
    };
  }

  private clearMessages(): void {
    this.errorMessage = '';
    this.successMessage = '';
  }
}
