import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserSetupService } from '../services/user-setup.service';

export const userSetupGuard: CanActivateFn = (route, state) => {
  const userSetupService = inject(UserSetupService);
  const router = inject(Router);

  if (userSetupService.isValid()) {
    return true;
  }

  // No local user data — redirect to login/register
  router.navigate(['/login']);
  return false;
};
