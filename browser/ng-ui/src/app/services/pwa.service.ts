import { DOCUMENT } from '@angular/common';
import { inject, Injectable } from '@angular/core';
import { SwUpdate, VersionEvent, VersionReadyEvent } from '@angular/service-worker';
import { BehaviorSubject, filter } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PwaService {
  private static readonly UPDATE_CHECK_INTERVAL_MS = 5 * 60 * 1000;

  private document = inject(DOCUMENT);
  private swUpdate = inject(SwUpdate, { optional: true });
  private promptEventSource = new BehaviorSubject<any>(null);
  private updateCheckInFlight = false;
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
      .pipe(filter((event): event is VersionEvent => !!event))
      .subscribe({
        next: (event) => {
          this.handleVersionEvent(event);
        },
        error: (error) => {
          console.error('[PWA] Service worker version update stream failed', error);
        }
      });

    this.swUpdate.unrecoverable.subscribe((event) => {
      console.error('[PWA] Unrecoverable service worker state', event);
      this.document.location.reload();
    });

    this.registerUpdateTriggers();
    void this.checkForUpdates('startup');
  }

  private handleVersionEvent(event: VersionEvent): void {
    if (event.type === 'VERSION_DETECTED') {
      console.log('[PWA] New version detected, downloading update', event);
      return;
    }

    if (event.type === 'VERSION_INSTALLATION_FAILED') {
      console.error('[PWA] Version installation failed', event);
      return;
    }

    if (event.type !== 'VERSION_READY') {
      console.log('[PWA] Service worker event', event);
      return;
    }

    console.log('[PWA] New app version ready', event);
    this.swUpdate!.activateUpdate()
      .then(() => {
        console.log('[PWA] Update activated, reloading application');
        this.document.location.reload();
      })
      .catch((error) => {
        console.error('[PWA] Failed to activate update', error);
      });
  }

  private registerUpdateTriggers(): void {
    window.addEventListener('online', () => void this.checkForUpdates('online'));
    window.addEventListener('focus', () => void this.checkForUpdates('focus'));
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        void this.checkForUpdates('visible');
      }
    });

    window.setInterval(() => {
      void this.checkForUpdates('interval');
    }, PwaService.UPDATE_CHECK_INTERVAL_MS);
  }

  private async checkForUpdates(trigger: string): Promise<void> {
    if (!this.swUpdate || !this.swUpdate.isEnabled || this.updateCheckInFlight) {
      return;
    }

    this.updateCheckInFlight = true;

    try {
      const hasUpdate = await this.swUpdate.checkForUpdate();
      console.log('[PWA] Update check complete', { trigger, hasUpdate });
    } catch (error) {
      console.error('[PWA] Update check failed', { trigger, error });
    } finally {
      this.updateCheckInFlight = false;
    }
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
