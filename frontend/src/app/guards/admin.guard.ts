import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap, take } from 'rxjs';

export const adminGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authChecked$.pipe(
    filter(checked => checked),
    take(1),
    switchMap(() => authService.currentUser$),
    take(1),
    map(user => {
      if (user && user.role === 'ROLE_ADMIN') return true;
      router.navigate(['/home']);
      return false;
    })
  );
};
