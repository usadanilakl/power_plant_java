/**
 * Application constants and default configuration.
 * Only the main Spring Boot app is a managed process.
 * Fire Impairment, Gate Log, Weather, PJM are features within Electron.
 */

// Re-export shared types
export type { AppState, AppStatus, AppSettings, IpcResult } from '../shared/types';

// Renderer configuration
export const rendererAppPort = 4201;
export const rendererAppName = 'renderer';
export const electronAppName = 'electron-manager';

// Default Spring Boot configuration
export const DEFAULT_SPRING_BOOT_CONFIG = {
  jar: 'power_plant_java-1.jar',
  port: 8082,
  healthUrl: 'http://localhost:8082/actuator/health',
  autoStart: true,
  workingDir: '../managed_apps/pid/browser',
  javaPath: 'java'
};

// Default Sync Server
export const DEFAULT_SYNC_SERVER = {
  url: 'http://10.10.190.122:8090',
  enabled: true
};

// Timing constants
export const HEALTH_CHECK_INTERVAL = 10_000;
export const HEALTH_CHECK_TIMEOUT = 5_000;
export const STARTUP_HEALTH_DELAY = 5_000;
export const GRACEFUL_SHUTDOWN_TIMEOUT = 10_000;
export const MAX_LOG_LINES = 1_000;
