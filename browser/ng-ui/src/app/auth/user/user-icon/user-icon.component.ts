import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../auth.service';
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

  currentUser$ = this.authService.currentUser$;

  navigateToProfile(): void {
    this.router.navigate(['/user-profile']);
  }

  getInitials(firstName?: string, lastName?: string): string {
    const first = firstName?.charAt(0)?.toUpperCase() || '';
    const last = lastName?.charAt(0)?.toUpperCase() || '';
    return first + last || 'U';
  }
}