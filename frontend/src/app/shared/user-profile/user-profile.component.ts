import { Component, ElementRef, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-user-profile',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="user-profile" *ngIf="authService.currentUser$ | async as user">
      <button class="avatar-btn" (click)="toggleDropdown($event)" [title]="user.name">
        <span class="initials">{{ getInitials(user.name) }}</span>
      </button>

      <div class="dropdown" *ngIf="isOpen">
        <div class="dropdown-header">
          <div class="user-avatar-lg">{{ getInitials(user.name) }}</div>
          <div class="user-info">
            <div class="user-name">{{ user.name }}</div>
            <div class="user-email">{{ user.email }}</div>
            <div class="user-role">{{ formatRole(user.role) }}</div>
            <div class="access-badge restricted" *ngIf="user.accessLevel === 'RESTRICTED'">Restricted Access</div>
            <div class="access-badge pending" *ngIf="user.accessLevel === 'PENDING'">Access Pending</div>
          </div>
        </div>
        <div class="dropdown-divider"></div>
        <button class="dropdown-item" (click)="goToProfile()">
          <span class="item-icon">&#x2699;</span>
          My Profile
        </button>
        <button class="dropdown-item" *ngIf="user.accessLevel !== 'FULL'" (click)="goToAccessRequest()">
          <span class="item-icon">&#x1F511;</span>
          Access Request
        </button>
        <button class="dropdown-item last" (click)="logout()">
          <span class="item-icon">&#x2BBD;</span>
          Sign out
        </button>
      </div>
    </div>
  `,
  styles: [`
    .user-profile {
      position: relative;
    }

    .avatar-btn {
      background-color: var(--accent-color, #533483);
      color: white;
      border: none;
      border-radius: 50%;
      width: 40px;
      height: 40px;
      cursor: pointer;
      display: flex;
      justify-content: center;
      align-items: center;
      font-size: 0.85rem;
      font-weight: 600;
      letter-spacing: 0.5px;
      transition: background-color 0.2s ease, transform 0.15s ease;
    }

    .avatar-btn:hover {
      background-color: var(--accent-color-hover, #6b44a0);
      transform: scale(1.05);
    }

    .dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      background: var(--secondary-background, #16213e);
      border: 1px solid var(--border-color, #333);
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.35);
      min-width: 260px;
      z-index: 2000;
      animation: dropdownFadeIn 0.15s ease;
    }

    @keyframes dropdownFadeIn {
      from { opacity: 0; transform: translateY(-4px); }
      to { opacity: 1; transform: translateY(0); }
    }

    .dropdown-header {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
    }

    .user-avatar-lg {
      width: 44px;
      height: 44px;
      border-radius: 50%;
      background-color: var(--accent-color, #533483);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .user-info {
      min-width: 0;
    }

    .user-name {
      color: var(--primary-text, #e0e0e0);
      font-weight: 600;
      font-size: 14px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-email {
      color: var(--secondary-text, #888);
      font-size: 12px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .user-role {
      color: var(--accent-color, #533483);
      font-size: 11px;
      font-weight: 500;
      margin-top: 2px;
    }

    .access-badge {
      display: inline-block;
      padding: 2px 8px;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      margin-top: 4px;
      letter-spacing: 0.3px;
    }

    .access-badge.restricted {
      background: rgba(230, 126, 34, 0.2);
      color: #e67e22;
      border: 1px solid rgba(230, 126, 34, 0.3);
    }

    .access-badge.pending {
      background: rgba(241, 196, 15, 0.2);
      color: #f1c40f;
      border: 1px solid rgba(241, 196, 15, 0.3);
    }

    .dropdown-divider {
      height: 1px;
      background: var(--border-color, #333);
      margin: 0;
    }

    .dropdown-item {
      display: flex;
      align-items: center;
      gap: 10px;
      width: 100%;
      padding: 12px 16px;
      border: none;
      background: none;
      color: var(--primary-text, #e0e0e0);
      font-size: 13px;
      cursor: pointer;
      transition: background-color 0.15s ease;
    }

    .dropdown-item.last {
      border-radius: 0 0 10px 10px;
    }

    .dropdown-item:hover {
      background: var(--hover-background, rgba(255, 255, 255, 0.06));
    }

    .item-icon {
      font-size: 16px;
      opacity: 0.7;
    }
  `]
})
export class UserProfileComponent {
  authService = inject(AuthService);
  private router = inject(Router);
  private elementRef = inject(ElementRef);

  isOpen = false;

  toggleDropdown(event: Event): void {
    event.stopPropagation();
    this.isOpen = !this.isOpen;
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: Event): void {
    if (!this.elementRef.nativeElement.contains(event.target)) {
      this.isOpen = false;
    }
  }

  getInitials(name: string): string {
    if (!name || !name.trim()) return '?';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return parts[0][0].toUpperCase();
  }

  formatRole(role: string): string {
    if (!role) return '';
    return role.replace('ROLE_', '').replace(/_/g, ' ');
  }

  goToProfile(): void {
    this.isOpen = false;
    this.router.navigate(['/profile']);
  }

  goToAccessRequest(): void {
    this.isOpen = false;
    this.router.navigate(['/access-request']);
  }

  logout(): void {
    this.isOpen = false;
    this.authService.logout().subscribe();
  }
}
