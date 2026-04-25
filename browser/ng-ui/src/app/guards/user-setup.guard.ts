import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserSetupService } from '../services/user-setup.service';
import { AuthService } from '../auth/auth.service';

export const userSetupGuard: CanActivateFn = (route, state) => {
  const userSetupService = inject(UserSetupService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Allow if local user data exists OR user is authenticated
  if (userSetupService.isValid() || authService.isLoggedIn()) {
    return true;
  }

  // No local user data and not logged in — redirect to login/register
  router.navigate(['/login']);
  return false;
};
