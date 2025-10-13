import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private promptEventSource = new BehaviorSubject<any>(null);
  /**
   * Observable that emits the 'beforeinstallprompt' event.
   * This event is captured and stored, so subscribers will get the latest event even if they subscribe late.
   */
  promptEvent$ = this.promptEventSource.asObservable();

  standaloneBypass: boolean = false;

  constructor() {
    window.addEventListener('beforeinstallprompt', (event: any) => {
      // Prevent the default mini-infobar from appearing on mobile
      event.preventDefault();
      // Stash the event so it can be triggered later.
      this.promptEventSource.next(event);
      console.log('beforeinstallprompt event captured');
    });

    window.addEventListener('appinstalled', () => {
      // Hide the install button, the app is now installed
      this.promptEventSource.next(null);
      console.log('PWA was installed');
    });
  }

  /**
   * Checks if the application is running in standalone mode (i.e., installed as a PWA).
   */
  isStandalone(): boolean {
    // Check for standalone mode in various browsers
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
    // Some older browsers might use the navigator property
    const isNavigatorStandalone = (window.navigator as any).standalone === true;

    return isStandalone || isNavigatorStandalone;
  }
}