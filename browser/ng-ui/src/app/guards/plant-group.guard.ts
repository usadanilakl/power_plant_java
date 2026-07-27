import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Route guard for Personnel-section routes (schedule + contacts + plant chat). Allows any
 * authenticated user in the plant-affiliated groups (Admin / Plant / NAES / JPower). Contractors
 * and unauthenticated users are redirected to Home.
 *
 * See {@code project/features/users/communication/pwa-step-5-wiring.md}.
 */
export const plantGroupGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isLoggedIn() && authService.isPlantGroup()) {
    return true;
  }
  return router.createUrlTree(['/home']);
};
