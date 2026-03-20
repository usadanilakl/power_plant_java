import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { tap } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Only add auth header for secured PWA endpoints
  const securedPaths = ['/api/pwa/secured/', '/api/pwa/auth/me', '/api/pwa/auth/refresh'];
  const needsAuth = securedPaths.some(path => req.url.includes(path));

  if (needsAuth) {
    const token = authService.getToken();
    if (token) {
      req = req.clone({
        setHeaders: { Authorization: `Bearer ${token}` }
      });
    }
  }

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
