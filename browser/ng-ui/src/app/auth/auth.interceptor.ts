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
  if (isPwaApi) {
    const token = authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
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
        if (error.status === 401 && needsAuth) {
          authService.logout();
          router.navigate(['/login']);
        }
      }
    })
  );
};
