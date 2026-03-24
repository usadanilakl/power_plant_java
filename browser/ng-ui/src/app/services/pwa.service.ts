import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private document = inject(DOCUMENT);
  private swUpdate = inject(SwUpdate, { optional: true });
  private promptEventSource = new BehaviorSubject<any>(null);
  /**
   * Observable that emits the 'beforeinstallprompt' event.
   * This event is captured and stored, so subscribers will get the latest event even if they subscribe late.
   */
  promptEvent$ = this.promptEventSource.asObservable();

  standaloneBypass: boolean = true;

  constructor() {
    this.initializeServiceWorkerUpdates();

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

  private initializeServiceWorkerUpdates(): void {
    if (!this.swUpdate || !this.swUpdate.isEnabled) {
      console.log('[PWA] Service worker updates are disabled');
      return;
    }

    this.swUpdate.versionUpdates
      .pipe(
        filter((event): event is VersionReadyEvent => event.type === 'VERSION_READY')
      )
      .subscribe({
        next: (event) => {
          console.log('[PWA] New app version ready', event);
          this.swUpdate!.activateUpdate()
            .then(() => {
              console.log('[PWA] Update activated, reloading application');
              this.document.location.reload();
            })
            .catch((error) => {
              console.error('[PWA] Failed to activate update', error);
            });
        },
        error: (error) => {
          console.error('[PWA] Service worker version update stream failed', error);
        }
      });

    this.swUpdate.checkForUpdate()
      .then((hasUpdate) => {
        console.log('[PWA] Initial update check complete', { hasUpdate });
      })
      .catch((error) => {
        console.error('[PWA] Initial update check failed', error);
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
