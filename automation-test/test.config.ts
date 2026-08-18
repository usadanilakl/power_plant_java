/**
 * Centralized test configuration.
 * All URLs and shared settings live here — no hardcoded ports in test files.
 *
 * <p>By default the Playwright suite runs against the Spring-Boot-served
 * Angular bundle (single port, no `ng serve` required). The bundle must
 * be built first — see automation-test/README.md or run
 * {@code npm run build:prod} in frontend/.
 *
 * <p>To target the dev server during local iteration set:
 *   {@code BASE_URL=http://localhost:4200 ANGULAR_BASE_PATH=/}
 */
export const config = {
  clientBackendUrl: process.env.CLIENT_BACKEND_URL || 'http://localhost:8082',
  syncServerUrl: process.env.SYNC_SERVER_URL || 'http://localhost:8090',
  /** Host of the served Angular app. Spring Boot serves it at the same port as the API. */
  frontendUrl: process.env.BASE_URL || 'http://localhost:8082',
  /**
   * Path prefix where Spring Boot serves the Angular bundle (set by the
   * production build's --base-href flag). `ng serve` serves at the root,
   * so override this to '/' when pointing at the dev server.
   */
  angularBasePath: process.env.ANGULAR_BASE_PATH || '/angular/browser',

  /**
   * The PWA (browser/ng-ui) — the lab's third node, alongside the hub and the desktop client.
   *
   * Served by its own dev server rather than by Spring: it is a separate Angular application that
   * ships to GitHub Pages in production, not part of the desktop bundle. Start it with
   * `npm run start:lab` in browser/ng-ui, which points it at pwaBackendUrl below.
   */
  pwaUrl: process.env.PWA_URL || 'http://localhost:4200',

  /**
   * The backend the PWA talks to. It must be the HUB, not the desktop client — that is the only
   * topology that exists in production, and pointing it at :8082 would test one that doesn't.
   * Kept in step with browser/ng-ui/src/environments/environment.lab.ts.
   */
  pwaBackendUrl: process.env.PWA_BACKEND_URL || process.env.SYNC_SERVER_URL || 'http://localhost:8090',
};
