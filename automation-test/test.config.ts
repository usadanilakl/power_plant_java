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
};
