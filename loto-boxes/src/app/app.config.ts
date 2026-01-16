import { ApplicationConfig, provideBrowserGlobalErrorListeners, provideZoneChangeDetection, isDevMode } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideServiceWorker } from '@angular/service-worker';
import { provideHttpClient } from '@angular/common/http';

// Detect if running in Electron (file:// protocol) - service workers don't work with file://
const isElectron = typeof window !== 'undefined' &&
  (window.location.protocol === 'file:' || !!(window as any).electronAPI);

export const appConfig: ApplicationConfig = {
  providers: [
    provideBrowserGlobalErrorListeners(),
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideServiceWorker('ngsw-worker.js', {
      enabled: !isDevMode() && !isElectron,  // Disable SW in Electron
      registrationStrategy: 'registerWhenStable:30000'
    }),
    provideHttpClient()
  ]
};
