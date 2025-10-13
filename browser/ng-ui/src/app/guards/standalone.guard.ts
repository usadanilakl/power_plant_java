import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { PwaService } from '../services/pwa.service';

export const standaloneGuard: CanActivateFn = (route, state) => {
  const pwaService = inject(PwaService);
  const router = inject(Router);

  const isStandalone = pwaService.isStandalone();
  const isInstallPage = state.url.includes('/install');

  if (isStandalone && isInstallPage) {
    // If app is installed and user is on /install, redirect to home
    router.navigate(['/']);
    return false;
  }

  if (!isStandalone && !isInstallPage) {
    // If app is not installed and user is on any other page, redirect to /install
    router.navigate(['/install']);
    return false;
  }

  // Otherwise, allow navigation
  return true;
};