import { Injectable } from '@angular/core';

/**
 * Remembers that a visitor chose "continue without signing in".
 *
 * This is a UI preference, NOT a credential: it only decides whether the welcome page is shown, and
 * every public screen is reachable regardless. Nothing is gated on it, so there is nothing to forge.
 *
 * It replaces the old tier-1 test, which asked whether localStorage happened to hold a name, email,
 * phone and company — that treated typed-in details as if they were an identity.
 */
@Injectable({ providedIn: 'root' })
export class GuestAccessService {
  private static readonly KEY = 'pwaGuestAcknowledged';

  allow(): void {
    try {
      localStorage.setItem(GuestAccessService.KEY, '1');
    } catch {
      // Private mode / quota — the welcome page just shows again next launch.
    }
  }

  get allowed(): boolean {
    try {
      return localStorage.getItem(GuestAccessService.KEY) === '1';
    } catch {
      return false;
    }
  }

  reset(): void {
    try {
      localStorage.removeItem(GuestAccessService.KEY);
    } catch {
      // Nothing to clean up.
    }
  }
}
