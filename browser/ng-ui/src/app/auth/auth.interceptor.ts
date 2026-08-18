import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Always attach token if available for any PWA API request
  const isPwaApi = req.url.includes('/api/pwa/');
  const token = isPwaApi ? authService.getToken() : null;
  if (token) {
    req = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  // Only redirect to login on 401 for explicitly secured paths. Field-list-item is here
  // because the hub tightened it to hasAnyRole("PLANT","ADMIN") — without this entry, an
  // expired-token user submitting a field list gets caught by the orchestrator's PA
  // fallback (which also 401s at the gateway) and sees "Both server and Power Automate
  // unavailable" instead of a login prompt. Matches PwaJwtAuthFilter.SECURED_PREFIXES.
  const securedPaths = [
    '/api/pwa/secured/',
    '/api/pwa/auth/me',
    '/api/pwa/auth/refresh',
    '/api/pwa/field-list-item/',
  ];
  const needsAuth = securedPaths.some(path => req.url.includes(path));

  return next(req).pipe(
    tap({
      error: (error) => {
        // Only bounce to login when a token we PRESENTED was rejected — that is what an expired
        // session looks like. A signed-out visitor has no session to expire, and several of these
        // paths are fetched on boot regardless (EquipmentDataService pulls the picker's loto-points
        // and locations for the public Work Request form). Without this check, those background
        // 401s threw every anonymous visitor straight out to the login page, so the welcome screen
        // and the whole continue-without-signing-in path were unreachable.
        if (error.status === 401 && needsAuth && token) {
          authService.logout();
          router.navigate(['/login']);
        }
      }
    })
  );
};
