import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { filter, map, switchMap, take } from 'rxjs';
import { AuthService } from '../services/auth.service';

/**
 * Allows the deliberately narrow diagnostics surface without requiring a
 * FULL access grant. The backend remains authoritative for this permission.
 */
export const logDiagnosticsGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authChecked$.pipe(
    filter(checked => checked),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      const roles = user?.roles ?? [];
      if (roles.includes('ROLE_ADMIN') || roles.includes('ROLE_LOG_DIAGNOSTICS')) {
        return true;
      }
      return router.createUrlTree(['/home']);
    })
  );
};
