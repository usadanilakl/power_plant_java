/**
 * Shared type definitions used by both Electron main process and Angular renderer.
 * This is the single source of truth for all IPC-related types.
 */

// Spring Boot app states
export type AppState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface AppStatus {
  state: AppState;
  port: number;
  pid?: number;
  uptime?: number;         // milliseconds since start
  lastHealthCheck?: string; // ISO date string (serializable)
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  error?: string;
}

// WebView targets
export type WebViewTarget = 'fm-global' | 'gate-website' | 'onlocation' | 'weather' | 'pjm' | 'perry-weather' | 'webview-ams';

export interface WebViewRequest {
  target: WebViewTarget;
  url: string;
  data?: Record<string, string>; // Form data to inject
}

// Fire Impairment
export interface FireImpairment {
  id?: number;
  name: string;
  email: string;
  emailCc?: string;
  clientName: string;
  phone?: string;
  streetAddress?: string;
  state?: string;
  city?: string;
  country?: string;
  office?: string;
  indexNumber?: string;
  valveNumber?: string;
  areaProtected?: string;
  protectionType?: string;
  reason?: string;
  precautions?: string;
  submissionDate?: string;
  predictedRestorationDate?: string;
  closedDate?: string;
  isActive: boolean;
  url?: string;
}

// Gate Log
export interface GateLogEntry {
  name: string;
  company: string;
  checkIn?: string;
  checkOut?: string;
  location?: string;
  duration?: string;
  email?: string;
  phone?: string;
  source: 'gate' | 'onlocation';
}

export interface GateLogStatus {
  lastUpdate: string | null;
  autoRefreshEnabled: boolean;
  refreshIntervalMinutes: number;
  isRefreshing: boolean;
  configured: boolean;
  totalPeople: number;
  error?: string;
}

export interface GateLogConfig {
  onLocationApiKey: string;
  onLocationBaseUrl: string;
  gateWebUrl: string;
  gateUsername: string;
  gatePassword: string;
  onLocationEmail: string;
  onLocationPassword: string;
  autoRefresh: boolean;
  intervalMinutes: number;
}

// Weather
export interface WeatherStatus {
  lightningDistance?: string;
  unit?: string;
  lastUpdate?: string;
  status: 'loading' | 'available' | 'unavailable';
}

export interface WeatherForecast {
  current: {
    temperature: number;       // °F
    apparentTemperature: number;
    humidity: number;          // %
    windSpeed: number;         // mph
    windDirection: number;     // degrees
    windGusts: number;         // mph
    weatherCode: number;       // WMO code
  };
  hourly: {
    time: string[];            // ISO timestamps
    temperature: number[];
    weatherCode: number[];
    windSpeed: number[];
    precipitation: number[];   // inches
  };
  daily: {
    time: string[];            // YYYY-MM-DD
    temperatureMax: number[];
    temperatureMin: number[];
    weatherCode: number[];
    precipitationSum: number[];
    windSpeedMax: number[];
  };
  lastUpdate: string;
  status: 'loading' | 'available' | 'error';
  error?: string;
}

// Perry Weather
export interface PerryWeatherStatus {
  lightningStatus?: string;    // "All Clear", "Lightning Watch", "Lightning Alarm"
  lightningDistance?: string;   // "0-10 mi", "10-20 mi", etc.
  lightningTimer?: string;     // "28:21" countdown when lightning is active
  temperature?: string;        // "67.6"
  feelsLike?: string;          // "59"
  wind?: string;               // "10 S"
  lastUpdate?: string;         // HH:mm:ss
  status: 'loading' | 'available' | 'unavailable' | 'login-pending';
}

// PJM

// Per-unit LMP data
export interface PjmUnitLmp {
  pnodeId: number;
  pnodeName?: string;
  lmpPrice?: number;
  congestionPrice?: number;
  marginalLossPrice?: number;
  dataTimestamp?: string;   // datetime_beginning_ept from PJM API
  status: 'loading' | 'available' | 'unavailable' | 'error';
  error?: string;
}

// Unit evolution — next state change derived from DA awards
export interface PjmUnitEvolution {
  status: 'online' | 'offline' | 'unknown';
  message: string;              // e.g. "AGC by 1:00 PM CT" or "OFFLINE by 2:00 PM CT"
  date?: string;                // YYYY-MM-DD of the award this is based on
}

// Composite status for both units
export interface PjmStatus {
  unit1: PjmUnitLmp;
  unit2: PjmUnitLmp;
  unit: string;            // '$/MWh'
  lastUpdate?: string;
  unit1Evolution?: PjmUnitEvolution;
  unit2Evolution?: PjmUnitEvolution;
}

// Per-hour entry within a DA award (matches email table row)
export interface PjmDaHourEntry {
  he: number;        // Hour ending (1-24)
  mw: number;        // Awarded MW
  lmp: number;       // LMP price $/MWh
}

// Full day-ahead award for one date (both units combined in one record)
export interface PjmDaAward {
  date: string;                   // YYYY-MM-DD (operating date)
  unit1Hours: PjmDaHourEntry[];   // 24 entries
  unit2Hours: PjmDaHourEntry[];   // 24 entries
  unit1TotalAwardedHours: number; // count of hours with MW > 0
  unit2TotalAwardedHours: number;
  unit1AvgLMP: number;            // daily average LMP
  unit2AvgLMP: number;
  processedAt?: string;           // email receivedDateTime
}

// SharePoint config (separate from PJM config)
export interface SharePointElectronConfig {
  clientId: string;
  tenantId: string;
  pfxPath: string;        // relative to working dir (e.g., "data/certificate.pfx")
  pfxPassword: string;
  siteUrl: string;        // "https://jpowerusa.sharepoint.com/sites/JG"
}

// Per-unit config
export interface PjmUnitConfig {
  pnodeId: number;
  pnodeName: string;
}

export interface PjmConfig {
  apiKey: string;
  units: [PjmUnitConfig, PjmUnitConfig];
  pollIntervalMinutes: number;
  voyagerUsername?: string;
  voyagerPassword?: string;
  daEmailAddress?: string;        // mailbox UPN for PJM DA email polling via Graph API
}

// WebView AMS — Excel report scraper (webviewams.com)
export interface WebViewAmsConfig {
  url: string;                 // https://www.webviewams.com/reports.aspx
  username: string;
  password: string;
  autoRefresh: boolean;        // scrape once per shift when true
  dayShiftStartHour: number;   // 6  — Day shift begins
  nightShiftStartHour: number; // 18 — Night shift begins
  showScrapeWindow: boolean;   // debug — show the scrape window (default headless)
}

// One parsed report from a single scrape. The scraper pulls a fixed set of
// reports (see WEBVIEW_AMS_REPORTS in the main process) each refresh.
export interface WebViewAmsReport {
  reportKey: string;    // stable id — "rounds", "alarms"
  reportLabel: string;  // display name — "Rounds", "Alarms"
  wireMode: 'column' | 'row'; // how cells pin: column (latest reading) or row
  title: string;        // "Trend Table (Recurring Task Excel)" / "Alarm List (Excel)"
  facility: string;     // "Jackson Generation"
  generatedAt: string;  // "Report generated on Thursday, May 21, 2026 at ..."
  filterLine: string;   // report filter summary line
  resultCount: number;  // "Results: N" count
  columns: string[];    // header row
  rows: string[][];     // each row: cell strings aligned to columns
  scrapedAt: string;    // ISO timestamp of the scrape
  contentHash: string;  // sha256 of columns+rows — used to dedup unchanged reports
}

export interface WebViewAmsStatus {
  lastUpdate: string | null;
  isRefreshing: boolean;
  configured: boolean;
  autoRefreshEnabled: boolean;
  currentShift: string | null;              // e.g. "2026-05-21-Day"
  reports: { key: string; label: string }[]; // known report definitions
  error?: string;
}

// A "wired" item the user pinned to the curated combined view. Stored
// desktop-locally (webview-ams-wired.json). 'column' mode pins a report
// column (Rounds — shows the latest reading); 'row' mode pins a report
// row (Alarms — shows the row's description + fields).
export interface WebViewAmsWiredItem {
  id: string;
  reportKey: string;            // 'rounds' | 'alarms'
  reportLabel: string;
  mode: 'column' | 'row';
  key: string;                  // column header ('column' mode) or row key ('row' mode)
  addedAt: string;              // ISO timestamp
}

// A wired item resolved against the latest scraped report.
export interface WebViewAmsWiredValue extends WebViewAmsWiredItem {
  found: boolean;               // false if the column/row no longer exists
  label: string;                // column name, or the row's description
  value: string;                // column: latest reading; row: status/condition
  time: string;                 // column: timestamp of the reading; row: date created
  fields: { name: string; value: string }[]; // row mode: the row's columns
}

// IPC Result wrapper
export interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Device Identity
export interface DeviceConfig {
  deviceNumber: number;    // 0-99
  deviceName: string;      // "Home PC"
  machineId: string;       // "HOME-PC"
  syncServerUrl: string;   // "http://10.10.190.122:8090"
  configuredAt: string;    // ISO date
  springProfile?: string;  // "prod" | "test" — Spring Boot profile (default: "prod")
}

export interface DeviceRegistryEntry {
  deviceNumber: number;
  deviceName: string;
  machineId: string;
  lastSeen?: string;
  status: string;
}

export interface DeviceRegistryResponse {
  devices: DeviceRegistryEntry[];
  takenNumbers: number[];
  availableNumbers: number[];
}

// Update management
export interface UpdateInfo {
  fileName: string;
  fileSize: number;
  checksum: string;        // SHA-256
  lastModified: string;    // ISO date
  isNewer: boolean;        // Compared to local JAR
}

export interface UpdateProgress {
  phase: 'checking' | 'downloading' | 'verifying' | 'applying' | 'done' | 'error';
  bytesDownloaded?: number;
  totalBytes?: number;
  percent?: number;
  error?: string;
}

// Sync status
export interface SyncStatusInfo {
  lastSyncTime: string | null;
  serverAvailable: boolean;
  pendingChanges: number;
  sseConnected: boolean;
  syncInProgress: boolean;
  deviceConflict: boolean;
  conflictDetails?: string;
}

// Cold Resync (external database + file download before Spring Boot starts)
export interface ColdResyncProgress {
  phase: 'db_download' | 'db_extract' | 'file_manifest' | 'file_download' | 'finalizing' | 'done' | 'error';
  statusMessage: string;
  progressPercent: number;
  filesTotal?: number;
  filesDownloaded?: number;
  bytesDownloaded?: number;
  totalBytes?: number;
  error?: string;
}

// Electron self-update
export interface ElectronUpdateInfo {
  fileName: string;
  fileSize: number;
  checksum: string;        // SHA-256
  lastModified: string;    // ISO date
  isNewer: boolean;        // Compared to local electron-version.json
}

export interface ElectronUpdateProgress {
  phase: 'checking' | 'downloading' | 'verifying' | 'staged' | 'error';
  bytesDownloaded?: number;
  totalBytes?: number;
  percent?: number;
  error?: string;
}

// Startup Assessment (sent from main process on startup)
export interface StartupAssessment {
  serverReachable: boolean;
  serverUrl: string | null;
  deviceConfigured: boolean;
  jar: { present: boolean; updateAvailable: boolean; updateInfo?: UpdateInfo };
  db: { present: boolean; sizeBytes: number };
  files: { present: boolean; totalSizeBytes: number };
  sync: { stale: boolean; daysSinceSync: number | null };
  conflict: { detected: boolean; details?: string };
  resourcePacks?: ResourcePackStatus[];
  electron?: { updateAvailable: boolean; updateStaged: boolean; updateInfo?: ElectronUpdateInfo };
}

export type SyncComponent = 'jar' | 'db' | 'files' | 'resource-packs';

export interface ResourcePackStatus {
  name: string;
  localPresent: boolean;
  totalFiles: number;
  missingFiles: number;
  updatedFiles: number;
}

export interface SyncOptions {
  /** When true, deletes all local files before downloading from server. Default: false (only download missing). */
  cleanFiles?: boolean;
}

export interface SyncExecuteProgress {
  phase: 'stopping_sb' | 'jar' | 'db_download' | 'db_extract' | 'files' | 'resource-packs' | 'starting_sb' | 'done' | 'error';
  statusMessage: string;
  progressPercent: number;
  error?: string;
}

// Window Layout
export interface WindowBounds {
  x: number;
  y: number;
  width: number;
  height: number;
  isMaximized: boolean;
}

export interface WindowLayoutConfig {
  [windowId: string]: WindowBounds;
}

// Vosk STT
export interface VoskResult {
  transcript: string;
  isFinal: boolean;
}

export interface VoskStatus {
  available: boolean;
  listening: boolean;
  modelPath: string;
}

// Settings
export interface AppSettings {
  springBoot: {
    jar: string;
    port: number;
    healthUrl: string;
    autoStart: boolean;
  };
  syncServer: {
    url: string;
    enabled: boolean;
  };
  features: {
    weatherEnabled: boolean;
    pjmEnabled: boolean;
    gateLogEnabled: boolean;
    fireImpairmentEnabled: boolean;
  };
}

// Personnel / Schedule
export type ShiftCode = 'D' | 'N' | 'U' | 'P' | 'T' | 'OCM' | '';

export interface PersonnelEntry {
  name: string;
  group: string;        // "A", "B", "C", "D", "Rel", "OCM"
  todayShift: ShiftCode;
  schedule: { date: string; shift: ShiftCode }[];
  /** Group assignment per month index (0-11). Some people rotate groups across months. */
  groupByMonth?: Record<string, string>;
  /** Row index within the month's roster (0-based). Used to preserve spreadsheet order
   *  per month — top=lead, middle=CRO, bottom=AO. Missing if person isn't in that month. */
  monthOrder?: Record<string, number>;
}

export interface PersonnelStatus {
  status: 'available' | 'loading' | 'error';
  lastUpdate?: string;
  error?: string;
  onShiftNow: PersonnelEntry[];  // people working today (D or N based on current time)
  allPersonnel: PersonnelEntry[];
  currentShiftLabel: string;     // "Day Shift" or "Night Shift"
}

export interface PersonnelContact {
  name: string;
  title?: string;
  phone?: string;
  secondaryPhone?: string;
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
}
