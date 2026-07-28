/**
 * Application constants and default configuration.
 * Only the main Spring Boot app is a managed process.
 * Fire Impairment, Gate Log, Weather, PJM are features within Electron.
 */

// Re-export shared types
export type { AppState, AppStatus, AppSettings, IpcResult } from '../shared/types';
import type { MaximoOverviewConfig } from '../shared/types';

// User-facing display name for the Spring Boot backend (change here to rename everywhere)
export const APP_DISPLAY_NAME = 'JG Portal';

// Renderer configuration
export const rendererAppPort = 4201;
export const rendererAppName = 'renderer';
export const electronAppName = 'electron-manager';

// Spring Boot profile — controls which database file and uploads dir are used.
// Default profile used when no device config exists. Overridden by DeviceConfig.springProfile.
// Profile → database name / uploads dir mapping (mirrors application-{profile}.properties):
//   prod → proddb / uploads-prod
//   test → testdb / uploads-test
//   dev  → devdb  / uploads
export const SPRING_PROFILE = 'prod';

export const PROFILE_DB_MAP: Record<string, string> = { prod: 'proddb', test: 'testdb', dev: 'devdb' };
export const PROFILE_UPLOADS_MAP: Record<string, string> = { prod: 'uploads-prod', test: 'uploads-test', dev: 'uploads' };

/** Resolve DB name for the given profile (falls back to proddb) */
export function getDbNameForProfile(profile?: string): string {
  return PROFILE_DB_MAP[profile || SPRING_PROFILE] || 'proddb';
}

/** Resolve uploads dir for the given profile (falls back to uploads-prod) */
export function getUploadsDirForProfile(profile?: string): string {
  return PROFILE_UPLOADS_MAP[profile || SPRING_PROFILE] || 'uploads-prod';
}

// Legacy constants — resolve for default profile
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

// Maximo overview widget defaults (loaded from maximo-overview-config.json at runtime).
// Default tracks the local Lead Operators, matching the previous hard-coded behavior.
export const DEFAULT_MAXIMO_OVERVIEW_CONFIG: MaximoOverviewConfig = {
  mode: 'leads',
  personids: []
};

// WebView AMS defaults (credentials loaded from webview-ams-config.json at runtime)
export const DEFAULT_WEBVIEW_AMS_CONFIG = {
  url: 'https://www.webviewams.com/reports.aspx',
  username: '',
  password: '',
  autoRefresh: false,
  dayShiftStartHour: 6,
  nightShiftStartHour: 18,
  showScrapeWindow: false
};

// Personnel / Schedule defaults — controls per-client SharePoint schedule auto-refresh.
// Multiple desktops can safely have autoRefresh enabled at different intervals; ShiftDayService
// short-circuits when content matches existing rows so unchanged pushes emit no FieldChange rows.
export const DEFAULT_PERSONNEL_CONFIG = {
  autoRefresh: false,
  intervalMinutes: 30,
  // Local HTTP listener port for hub-initiated refresh triggers (via desktop Spring Boot SSE).
  refreshTriggerPort: 8083,
};

// SDS eBinder scraper defaults (anonymous token link; overridable via sds-scraper-config.json).
export const DEFAULT_SDS_SCRAPER_CONFIG = {
  url: 'https://chemmanagement.ehs.com/9/92a2f98a-0e59-4ba4-b8dd-7b45ad65d25d/ebinder/?nas=True',
  locationName: 'Jackson Generation',
  showScrapeWindow: false
};

// Reports the scraper pulls on each refresh. `reportName` is the row to pick in
// the report-type dialog; `savedSearch` is the saved-search preset to apply.
// `wireMode` controls how cells are pinned: 'column' wires a whole column
// (latest reading), 'row' wires a whole row.
// `aggregateByShift` collapses the many timestamped rows of a Trend-Table export
// into ONE merged row per shift (Day / Night) — see WebViewAmsManager.
export interface WebViewAmsReportDef {
  key: string;
  label: string;
  reportName: string;
  savedSearch: string;
  wireMode: 'column' | 'row';
  aggregateByShift?: boolean;
}

export const WEBVIEW_AMS_REPORTS: WebViewAmsReportDef[] = [
  { key: 'rounds', label: 'Rounds',
    reportName: 'Trend Table (Recurring Task Excel)', savedSearch: 'Rounds', wireMode: 'column',
    aggregateByShift: true },
  { key: 'alarms', label: 'Alarms',
    reportName: 'Alarm List (Excel)', savedSearch: 'All active alarms', wireMode: 'row' }
];
