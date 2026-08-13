import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

/**
 * Route guard for the Instrumentation section. Requires an authenticated user holding
 * ROLE_INSTRUMENTATION (or ROLE_ADMIN) — the same rule the hub enforces on
 * /api/pwa/secured/instruments/** and /api/pwa/secured/instrument-log/**.
 *
 * A signed-out user is sent to /login with a returnUrl so a QR deep link into a specific
 * instrument survives the round-trip; a signed-in user without the role goes Home.
 */
export const instrumentationGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isLoggedIn()) {
    return router.createUrlTree(['/login'], { queryParams: { returnUrl: state.url, reason: 'login_required' } });
  }
  if (!authService.isInstrumentation()) {
    return router.createUrlTree(['/home']);
  }
  return true;
};
