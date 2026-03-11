import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { UserSetupService } from '../services/user-setup.service';

export const userSetupGuard: CanActivateFn = (route, state) => {
  const userSetupService = inject(UserSetupService);
  const router = inject(Router);

  const isSetupPage = state.url.includes('/setup');

  if (userSetupService.isValid()) {
    if (isSetupPage) {
      router.navigate(['/home']);
      return false;
    }
    return true;
  }

  if (!isSetupPage) {
    router.navigate(['/setup']);
    return false;
  }

  return true;
};
