import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap, take } from 'rxjs';

/**
 * Gate for the Maximo feature: allow any authenticated user who holds the Plant role (ROLE_PLANT);
 * admins are allowed too. Unlike {@link fullAccessGuard}, this does NOT require the FULL access level —
 * a plant-staff user reaches Maximo on-site or remotely as long as they have the role.
 */
export const plantAccessGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authChecked$.pipe(
    filter(checked => checked),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      const roles = user?.roles ?? [];
      if (roles.includes('ROLE_PLANT') || roles.includes('ROLE_ADMIN')) return true;
      router.navigate(['/home']);
      return false;
    })
  );
};
