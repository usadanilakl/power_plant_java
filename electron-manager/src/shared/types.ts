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
export type WebViewTarget = 'fm-global' | 'gate-website' | 'onlocation' | 'weather' | 'pjm';

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

// PJM
export interface PjmStatus {
  lmpPrice?: number;
  congestionPrice?: number;
  marginalLossPrice?: number;
  pnodeName?: string;
  dataTimestamp?: string;   // datetime_beginning_ept from PJM API
  unit: string;
  lastUpdate?: string;
  status: 'loading' | 'available' | 'unavailable' | 'error';
  error?: string;
}

export interface PjmConfig {
  apiKey: string;
  pnodeId: number;         // Default: 33092371 (ComEd zone aggregate)
  pnodeName: string;       // Display name
  pollIntervalMinutes: number;
  voyagerUsername?: string;
  voyagerPassword?: string;
}

// IPC Result wrapper
export interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

// Device Identity
export interface DeviceConfig {
  deviceNumber: number;    // 1-9
  deviceName: string;      // "Home PC"
  machineId: string;       // "HOME-PC"
  syncServerUrl: string;   // "http://10.10.190.122:8090"
  configuredAt: string;    // ISO date
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
