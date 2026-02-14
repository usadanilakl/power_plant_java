import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { filter, map, switchMap, take } from 'rxjs';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Wait for the initial /me check to complete before deciding
  return authService.authChecked$.pipe(
    filter(checked => checked),
    take(1),
    switchMap(() => authService.isLoggedIn$),
    take(1),
    map(isLoggedIn => {
      if (isLoggedIn) return true;
      router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    })
  );
};
