import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Route guard for the Plant-only mobile sections (e.g. LOTO Standards).
 * Allows only an authenticated user who holds the Plant (or Admin) role; everyone else goes Home.
 */
export const plantGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn() && authService.isPlant()) {
    return true;
  }
  return router.createUrlTree(['/home']);
};
