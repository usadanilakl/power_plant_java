import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

// Clean up any stale service workers when running in Electron (file:// protocol)
// Service workers don't work properly with file:// and can cause blank screens
if (window.location.protocol === 'file:' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then(registrations => {
    registrations.forEach(registration => {
      console.log('Unregistering stale service worker:', registration.scope);
      registration.unregister();
    });
  });
}

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));
