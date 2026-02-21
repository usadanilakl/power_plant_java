/**
 * Application constants and default configuration.
 * Only the main Spring Boot app is a managed process.
 * Fire Impairment, Gate Log, Weather, PJM are features within Electron.
 */

// Re-export shared types
export type { AppState, AppStatus, AppSettings, IpcResult } from '../shared/types';

// User-facing display name for the Spring Boot backend (change here to rename everywhere)
export const APP_DISPLAY_NAME = 'JG Portal';

// Renderer configuration
export const rendererAppPort = 4201;
export const rendererAppName = 'renderer';
export const electronAppName = 'electron-manager';

// Spring Boot profile — controls which database file and uploads dir are used.
// Must match the profile passed to Spring Boot via --spring.profiles.active.
// Profile → database name / uploads dir mapping (mirrors application-{profile}.properties):
//   prod → proddb / uploads-prod
//   test → testdb / uploads-test
//   dev  → devdb  / uploads
export const SPRING_PROFILE = 'prod';

const PROFILE_DB_MAP: Record<string, string> = { prod: 'proddb', test: 'testdb', dev: 'devdb' };
const PROFILE_UPLOADS_MAP: Record<string, string> = { prod: 'uploads-prod', test: 'uploads-test', dev: 'uploads' };

export const SPRING_DB_NAME = PROFILE_DB_MAP[SPRING_PROFILE] || 'proddb';
export const SPRING_UPLOADS_DIR = PROFILE_UPLOADS_MAP[SPRING_PROFILE] || 'uploads';

// Default Spring Boot configuration
export const DEFAULT_SPRING_BOOT_CONFIG = {
  jar: 'power_plant_java-1.jar',
  port: 8082,
  healthUrl: 'http://localhost:8082/actuator/health',
  autoStart: true
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

// Sync staleness threshold
export const SYNC_STALE_THRESHOLD_DAYS = 14;

// Gate Log defaults (credentials loaded from gate-log-config.json at runtime)
export const DEFAULT_GATE_LOG_CONFIG = {
  onLocationApiKey: '',
  onLocationBaseUrl: 'https://api.whosonlocation.com/v1',
  gateWebUrl: 'https://10.56.80.80/',
  gateUsername: '',
  gatePassword: '',
  onLocationEmail: '',
  onLocationPassword: '',
  autoRefresh: false,
  intervalMinutes: 60
};
