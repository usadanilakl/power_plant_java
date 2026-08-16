import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Route guard for the Insulation contractor section. Requires an authenticated user holding
 * ROLE_INSULATION (or ROLE_PLANT/ROLE_ADMIN for supervisors). Mirrors the instrumentationGuard
 * pattern — the hub enforces the same rule on /api/pwa/secured/insulation/**.
 *
 * A signed-out user is sent to /login with a returnUrl so a deep link survives the round-trip;
 * a signed-in user without the role goes Home.
 */
export const insulationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url, reason: 'login_required' } });
  }
  if (!authService.isInsulation()) {
    return router.createUrlTree(['/home']);
  }
  return true;
};
