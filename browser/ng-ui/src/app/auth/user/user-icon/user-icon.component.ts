import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
import { UserSetupService } from '../../../services/user-setup.service';
import { AsyncPipe } from '@angular/common';

@Component({
  selector: 'app-user-icon',
  imports: [AsyncPipe],
  templateUrl: './user-icon.component.html',
  styleUrl: './user-icon.component.css'
})
export class UserIconComponent {
  private router = inject(Router);
  private authService = inject(AuthService);
  private userSetupService = inject(UserSetupService);

  currentUser$ = this.authService.currentUser$;

  get localUserName(): string | null {
    return this.userSetupService.getUserData()?.name ?? null;
  }

  navigateToProfile(): void {
    this.router.navigate(['/user-profile']);
  }

  getNameInitials(name?: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    const first = parts[0]?.charAt(0)?.toUpperCase() || '';
    const last = parts.length > 1 ? parts[parts.length - 1]?.charAt(0)?.toUpperCase() || '' : '';
    return first + last || 'U';
  }
}
