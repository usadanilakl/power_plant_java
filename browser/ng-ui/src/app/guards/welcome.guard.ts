import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { GuestAccessService } from '../services/guest-access.service';

/**
 * Sends a first-time, signed-out visitor to the welcome page.
 *
 * Replaces userSetupGuard, which let anyone through whose localStorage held a name/email/phone/
 * company — the last remnant of the retired "known but not signed in" tier. This guard gates
 * NOTHING: it only decides whether the explainer is shown first, and the user can always continue.
 *
 * Applied to /home ONLY, and that placement is load-bearing. Home is where someone opening the app
 * cold lands ('' redirects to it), so it is the one route where an explainer is what the user wants.
 * Anywhere else it overrides an explicit destination: with it on every route, a contractor scanning
 * the orientation QR was redirected to a sign-in screen instead of the orientation page they had
 * just asked for. A deep link is intent — honour it.
 */
export const welcomeGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const guest = inject(GuestAccessService);
  const router = inject(Router);

  if (auth.isLoggedIn() || guest.allowed) return true;
  return router.createUrlTree(['/welcome']);
};
