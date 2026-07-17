import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';

import { routes } from './app.routes';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor } from './interceptors/auth.interceptor';
import { clientIdInterceptor } from './interceptors/client-id.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    // Order: auth first (attaches JWT), then client-id (stamps X-Client-Id
    // on non-GET writes so this tab can filter its own SSE echoes).
    provideHttpClient(withInterceptors([authInterceptor, clientIdInterceptor]))
  ]
};
