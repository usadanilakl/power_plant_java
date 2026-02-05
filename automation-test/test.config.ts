/**
 * Centralized test configuration.
 * All URLs and shared settings live here — no hardcoded ports in test files.
 */
export const config = {
  clientBackendUrl: process.env.CLIENT_BACKEND_URL || 'http://localhost:8082',
  syncServerUrl: process.env.SYNC_SERVER_URL || 'http://localhost:8090',
  frontendUrl: process.env.BASE_URL || 'http://localhost:4200',
};
