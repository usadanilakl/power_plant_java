import { inject } from '@angular/core';
import { CanActivateFn, Router, UrlTree } from '@angular/router';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { AuthService } from '../auth/auth.service';

export const authGuard: CanActivateFn = (route, state): Observable<boolean | UrlTree> => {
  const authService = inject(AuthService);
  const router = inject(Router);

  return authService.authData$.pipe(
    take(1),
    map(authData => {
      const isAuthenticated = !!authData;
      if (isAuthenticated) {
        return true;
      }
      // Redirect to the login page if not authenticated
      return router.createUrlTree(['/login']);
    })
  );
};