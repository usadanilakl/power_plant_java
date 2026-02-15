import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

// Auth-checking endpoints handle their own errors — don't redirect for these
const AUTH_CHECK_URLS = ['/api/auth/me', '/api/auth/profile', '/api/auth/access-status'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);

  // Add withCredentials to send cookies cross-origin
  const authReq = req.clone({ withCredentials: true });

  return next(authReq).pipe(
    catchError((error: HttpErrorResponse) => {
      const isAuthCheck = AUTH_CHECK_URLS.some(url => req.url.includes(url));

      if (error.status === 401 && !isAuthCheck) {
        // Not authenticated — redirect to login (skip for auth-checking endpoints)
        const currentUrl = router.url;
        if (currentUrl !== '/login') {
          router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
        }
      } else if (error.status === 403 && error.error?.error === 'FULL_ACCESS_REQUIRED') {
        // Authenticated but needs full access approval — don't redirect if already there
        if (router.url !== '/access-request') {
          router.navigate(['/access-request']);
        }
      }
      return throwError(() => error);
    })
  );
};
