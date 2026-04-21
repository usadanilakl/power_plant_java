import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

/** User-facing display name for the Spring Boot backend (change here to rename everywhere) */
export const APP_DISPLAY_NAME = 'JG Portal';

/**
 * Types matching the preload script API.
 * Mirrors src/shared/types.ts (can't import directly due to separate build).
 */
export type AppState = 'stopped' | 'starting' | 'running' | 'stopping' | 'error';

export interface AppStatus {
  state: AppState;
  port: number;
  pid?: number;
  uptime?: number;
  lastHealthCheck?: string;
  healthStatus: 'healthy' | 'unhealthy' | 'unknown';
  error?: string;
}

export interface IpcResult<T = void> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface DeviceConfig {
  deviceNumber: number;
  deviceName: string;
  machineId: string;
  syncServerUrl: string;
  configuredAt: string;
  springProfile?: string;  // "prod" | "test" | "dev" — Spring Boot profile (default: "prod")
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

export interface UpdateInfo {
  fileName: string;
  fileSize: number;
  checksum: string;
  lastModified: string;
  isNewer: boolean;
}

export interface UpdateProgress {
  phase: 'checking' | 'downloading' | 'verifying' | 'applying' | 'done' | 'error';
  bytesDownloaded?: number;
  totalBytes?: number;
  percent?: number;
  error?: string;
}

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

export interface SyncStatusInfo {
  lastSyncTime: string | null;
  serverAvailable: boolean;
  pendingChanges: number;
  sseConnected: boolean;
  syncInProgress: boolean;
  deviceConflict: boolean;
  conflictDetails?: string;
}

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

export interface ElectronUpdateInfo {
  fileName: string;
  fileSize: number;
  checksum: string;
  lastModified: string;
  isNewer: boolean;
}

export interface ElectronUpdateProgress {
  phase: 'checking' | 'downloading' | 'verifying' | 'staged' | 'error';
  bytesDownloaded?: number;
  totalBytes?: number;
  percent?: number;
  error?: string;
}

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
  cleanFiles?: boolean;
}

export interface SyncExecuteProgress {
  phase: 'stopping_sb' | 'jar' | 'db_download' | 'db_extract' | 'files' | 'resource-packs' | 'starting_sb' | 'done' | 'error';
  statusMessage: string;
  progressPercent: number;
  error?: string;
}

export interface WeatherStatus {
  lightningDistance?: string;
  unit?: string;
  lastUpdate?: string;
  status: 'loading' | 'available' | 'unavailable';
}

export interface WeatherForecast {
  current: {
    temperature: number;
    apparentTemperature: number;
    humidity: number;
    windSpeed: number;
    windDirection: number;
    windGusts: number;
    weatherCode: number;
  };
  hourly: {
    time: string[];
    temperature: number[];
    weatherCode: number[];
    windSpeed: number[];
    precipitation: number[];
  };
  daily: {
    time: string[];
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

export interface PerryWeatherStatus {
  lightningStatus?: string;
  lightningDistance?: string;
  lightningTimer?: string;     // "28:21" countdown when lightning is active
  temperature?: string;
  feelsLike?: string;
  wind?: string;
  lastUpdate?: string;
  status: 'loading' | 'available' | 'unavailable' | 'login-pending';
}

export interface PjmUnitLmp {
  pnodeId: number;
  pnodeName?: string;
  lmpPrice?: number;
  congestionPrice?: number;
  marginalLossPrice?: number;
  dataTimestamp?: string;
  status: 'loading' | 'available' | 'unavailable' | 'error';
  error?: string;
}

export interface PjmUnitEvolution {
  status: 'online' | 'offline' | 'unknown';
  message: string;
  date?: string;
}

export interface PjmStatus {
  unit1: PjmUnitLmp;
  unit2: PjmUnitLmp;
  unit: string;
  lastUpdate?: string;
  unit1Evolution?: PjmUnitEvolution;
  unit2Evolution?: PjmUnitEvolution;
}

export interface PjmDaHourEntry {
  he: number;
  mw: number;
  lmp: number;
}

export interface PjmDaAward {
  date: string;
  unit1Hours: PjmDaHourEntry[];
  unit2Hours: PjmDaHourEntry[];
  unit1TotalAwardedHours: number;
  unit2TotalAwardedHours: number;
  unit1AvgLMP: number;
  unit2AvgLMP: number;
  processedAt?: string;
}

export type ShiftCode = 'D' | 'N' | 'U' | 'P' | 'T' | '';

export interface PersonnelEntry {
  name: string;
  group: string;
  todayShift: ShiftCode;
  schedule: { date: string; shift: ShiftCode }[];
}

export interface PersonnelStatus {
  status: 'available' | 'loading' | 'error';
  lastUpdate?: string;
  error?: string;
  onShiftNow: PersonnelEntry[];
  allPersonnel: PersonnelEntry[];
  currentShiftLabel: string;
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

export interface ToiFile {
  name: string;
  serverRelativeUrl: string;
  size: number;
  modified: string;
}

interface ElectronAPI {
  isElectron: boolean;
  platform: string;

  // Spring Boot control (single app)
  startApp: () => Promise<IpcResult>;
  stopApp: () => Promise<IpcResult>;
  restartApp: () => Promise<IpcResult>;
  getAppStatus: () => Promise<AppStatus>;
  getAppLogs: () => Promise<string[]>;
  openAppUrl: () => Promise<IpcResult>;

  // Real-time subscriptions
  onAppStatusChange: (callback: (status: AppStatus) => void) => () => void;
  onAppLog: (callback: (line: string) => void) => () => void;

  // Fire Impairment
  fireImpList: () => Promise<IpcResult<any[]>>;
  fireImpListClosed: () => Promise<IpcResult<any[]>>;
  fireImpCount: () => Promise<IpcResult<number>>;
  fireImpGetEnums: () => Promise<IpcResult<any>>;
  fireImpCreate: (dto: any) => Promise<IpcResult<any>>;
  fireImpUpdate: (id: number, dto: any) => Promise<IpcResult<any>>;
  fireImpClose: (id: number) => Promise<IpcResult>;
  fireImpCancel: (id: number) => Promise<IpcResult>;
  fireImpOpenForm: (formData: Record<string, string>) => Promise<IpcResult>;
  onFireImpFormSubmitted: (callback: (data: Record<string, string>) => void) => () => void;

  // Permits
  getWorkRequestCount: () => Promise<IpcResult<{ newCount: number; activeCount: number }>>;
  openPermitsMonitor: () => Promise<IpcResult>;

  // Window Layout
  saveWindowLayout: () => Promise<IpcResult>;

  // Device Identity
  getDeviceConfig: () => Promise<IpcResult<DeviceConfig | null>>;
  saveDeviceConfig: (config: DeviceConfig) => Promise<IpcResult>;
  fetchDeviceRegistry: (syncServerUrl?: string) => Promise<IpcResult<DeviceRegistryResponse>>;
  registerDevice: (deviceName: string, deviceNumber?: number, syncServerUrl?: string) => Promise<IpcResult<DeviceConfig>>;
  onDeviceNeedsSetup: (callback: () => void) => () => void;

  // Update management (JAR)
  checkForUpdate: (serverUrl?: string) => Promise<IpcResult<UpdateInfo>>;
  downloadUpdate: (serverUrl?: string) => Promise<IpcResult>;
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => () => void;

  // Electron self-update
  checkForElectronUpdate: (serverUrl?: string) => Promise<IpcResult<ElectronUpdateInfo>>;
  downloadElectronUpdate: (serverUrl?: string) => Promise<IpcResult>;
  applyElectronUpdate: () => Promise<IpcResult>;
  onElectronUpdateProgress: (callback: (progress: ElectronUpdateProgress) => void) => () => void;

  // Sync management
  getSyncStatus: () => Promise<IpcResult<SyncStatusInfo>>;
  triggerResync: () => Promise<IpcResult>;
  getResyncStatus: () => Promise<IpcResult<any>>;
  onSyncStale: (callback: (data: { daysSinceSync: number | null }) => void) => () => void;
  onDeviceConflict: (callback: (data: { details: string }) => void) => () => void;

  // Gate Log
  gateLogGetPeople: () => Promise<IpcResult<GateLogEntry[]>>;
  gateLogGetStatus: () => Promise<IpcResult<GateLogStatus>>;
  gateLogRefresh: () => Promise<IpcResult<GateLogEntry[]>>;
  gateLogSetAutoRefresh: (enabled: boolean, intervalMinutes?: number) => Promise<IpcResult>;
  gateLogGetConfig: () => Promise<IpcResult<GateLogConfig>>;
  gateLogSaveConfig: (config: GateLogConfig) => Promise<IpcResult>;
  gateLogPrint: () => Promise<IpcResult>;
  onGateLogPeopleUpdated: (callback: () => void) => () => void;

  // Cold Resync
  coldResync: () => Promise<IpcResult>;
  onColdResyncProgress: (callback: (progress: ColdResyncProgress) => void) => () => void;
  onColdResyncNeeded: (callback: (data: any) => void) => () => void;

  // Startup assessment
  getStartupAssessment: () => Promise<IpcResult<StartupAssessment>>;
  onStartupAssessment: (callback: (assessment: StartupAssessment) => void) => () => void;
  onStartupServerStatus: (callback: (data: { reachable: boolean }) => void) => () => void;

  // Selective sync
  executeSync: (components: SyncComponent[], options?: SyncOptions) => Promise<IpcResult>;
  onSyncExecuteProgress: (callback: (progress: SyncExecuteProgress) => void) => () => void;

  // Weather
  getWeatherStatus: () => Promise<IpcResult<WeatherStatus> & { intervalSeconds?: number }>;
  weatherRefresh: () => Promise<IpcResult>;
  weatherSetInterval: (seconds: number) => Promise<IpcResult & { intervalSeconds?: number }>;
  onWeatherStatusChange: (callback: (status: WeatherStatus) => void) => () => void;
  getWeatherForecast: () => Promise<IpcResult<WeatherForecast>>;
  weatherRefreshForecast: () => Promise<IpcResult>;
  onWeatherForecastChange: (callback: (forecast: WeatherForecast) => void) => () => void;

  // Perry Weather
  getPerryStatus: () => Promise<IpcResult<PerryWeatherStatus> & { intervalSeconds?: number }>;
  perryRefresh: () => Promise<IpcResult>;
  perrySetInterval: (seconds: number) => Promise<IpcResult & { intervalSeconds?: number }>;
  onPerryStatusChange: (callback: (status: PerryWeatherStatus) => void) => () => void;

  // PJM
  getPjmStatus: () => Promise<IpcResult<PjmStatus> & { polling?: boolean }>;
  pjmShowWindow: () => Promise<IpcResult>;
  pjmSetPolling: (enabled: boolean) => Promise<IpcResult & { polling?: boolean }>;
  pjmRefresh: () => Promise<IpcResult>;
  pjmGetConfig: () => Promise<IpcResult<any>>;
  pjmSaveConfig: (config: any) => Promise<IpcResult<any> & { polling?: boolean }>;
  onPjmStatusChange: (callback: (status: PjmStatus) => void) => () => void;
  // PJM Day-Ahead Awards (read-only — data from SharePoint)
  pjmDaFetch: () => Promise<IpcResult<PjmDaAward[]>>;
  pjmDaRefresh: () => Promise<IpcResult<PjmDaAward[]>>;

  // Personnel
  personnelGetStatus: () => Promise<IpcResult<PersonnelStatus>>;
  personnelRefresh: () => Promise<IpcResult<PersonnelStatus>>;
  personnelGetContacts: () => Promise<IpcResult<PersonnelContact[]>>;

  // TOI/TMOD
  toiListFiles: () => Promise<IpcResult<ToiFile[]>>;

  // Print
  printHtml: (html: string, options?: { silent?: boolean }) => Promise<IpcResult>;

  // WebView
  openWebView: (target: string, url: string) => Promise<IpcResult>;

  // Menu
  popupMenu: (menuId: string, x: number, y: number) => Promise<void>;
  onMenuNavigate: (callback: (path: string) => void) => () => void;

  // Window control
  closeWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;

  // Sync entity updates
  onSyncEntityUpdated: (callback: (entityType: string, entityId: number) => void) => () => void;

  // General
  getAppVersion: () => Promise<string>;
  openExternal: (url: string) => Promise<void>;
  relaunchApp: () => void;
  quit: () => void;
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService implements OnDestroy {
  private _appStatus = new BehaviorSubject<AppStatus>({
    state: 'stopped',
    port: 0,
    healthStatus: 'unknown'
  });

  private _logs = new BehaviorSubject<string[]>([]);
  private unsubscribeStatus?: () => void;
  private unsubscribeLog?: () => void;
  private logBuffer: string[] = [];
  private logFlushTimer: any = null;
  private static readonly LOG_FLUSH_MS = 100;
  private static readonly MAX_RENDERER_LOGS = 2_000;

  constructor(private ngZone: NgZone) {
    if (this.isElectron) {
      this.initSubscriptions();
      this.loadInitialStatus();
    }
  }

  get isElectron(): boolean {
    return !!(window.electronAPI?.isElectron);
  }

  get platform(): string {
    return window.electronAPI?.platform || 'web';
  }

  get appStatus$(): Observable<AppStatus> {
    return this._appStatus.asObservable();
  }

  get logs$(): Observable<string[]> {
    return this._logs.asObservable();
  }

  private async loadInitialStatus(): Promise<void> {
    try {
      const status = await window.electronAPI!.getAppStatus();
      this.ngZone.run(() => this._appStatus.next(status));

      const logs = await window.electronAPI!.getAppLogs();
      this.ngZone.run(() => this._logs.next(logs));
    } catch (error) {
      console.error('Failed to load initial status:', error);
    }
  }

  private initSubscriptions(): void {
    this.unsubscribeStatus = window.electronAPI!.onAppStatusChange((status) => {
      this.ngZone.run(() => this._appStatus.next(status));
    });

    this.unsubscribeLog = window.electronAPI!.onAppLog((line) => {
      this.logBuffer.push(line);
      if (!this.logFlushTimer) {
        this.logFlushTimer = setTimeout(() => this.flushLogBuffer(), ElectronService.LOG_FLUSH_MS);
      }
    });
  }

  private flushLogBuffer(): void {
    this.logFlushTimer = null;
    if (this.logBuffer.length === 0) return;
    const batch = this.logBuffer;
    this.logBuffer = [];
    this.ngZone.run(() => {
      let current = this._logs.value;
      current = current.concat(batch);
      if (current.length > ElectronService.MAX_RENDERER_LOGS) {
        current = current.slice(-ElectronService.MAX_RENDERER_LOGS);
      }
      this._logs.next(current);
    });
  }

  // Spring Boot controls

  async startApp(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.startApp();
  }

  async stopApp(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.stopApp();
  }

  async restartApp(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.restartApp();
  }

  async openAppUrl(): Promise<void> {
    if (!this.isElectron) return;
    await window.electronAPI!.openAppUrl();
  }

  async refreshLogs(): Promise<void> {
    if (!this.isElectron) return;
    const logs = await window.electronAPI!.getAppLogs();
    this.ngZone.run(() => this._logs.next(logs));
  }

  // Fire Impairment

  async fireImpList(): Promise<IpcResult<any[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpList();
  }

  async fireImpListClosed(): Promise<IpcResult<any[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpListClosed();
  }

  async fireImpCount(): Promise<IpcResult<number>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpCount();
  }

  async fireImpGetEnums(): Promise<IpcResult<any>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpGetEnums();
  }

  async fireImpCreate(dto: any): Promise<IpcResult<any>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpCreate(dto);
  }

  async fireImpUpdate(id: number, dto: any): Promise<IpcResult<any>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpUpdate(id, dto);
  }

  async fireImpClose(id: number): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpClose(id);
  }

  async fireImpCancel(id: number): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpCancel(id);
  }

  async fireImpOpenForm(formData: Record<string, string>): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fireImpOpenForm(formData);
  }

  onFireImpFormSubmitted(callback: (data: Record<string, string>) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onFireImpFormSubmitted((data) => {
      this.ngZone.run(() => callback(data));
    });
  }

  // Permits

  async getWorkRequestCount(): Promise<IpcResult<{ newCount: number; activeCount: number }>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getWorkRequestCount();
  }

  async openPermitsMonitor(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.openPermitsMonitor();
  }

  // Window Layout

  async saveWindowLayout(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.saveWindowLayout();
  }

  // Device Identity

  async getDeviceConfig(): Promise<IpcResult<DeviceConfig | null>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getDeviceConfig();
  }

  async saveDeviceConfig(config: DeviceConfig): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.saveDeviceConfig(config);
  }

  async fetchDeviceRegistry(syncServerUrl?: string): Promise<IpcResult<DeviceRegistryResponse>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.fetchDeviceRegistry(syncServerUrl);
  }

  async registerDevice(deviceName: string, deviceNumber?: number, syncServerUrl?: string): Promise<IpcResult<DeviceConfig>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.registerDevice(deviceName, deviceNumber, syncServerUrl);
  }

  onDeviceNeedsSetup(callback: () => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onDeviceNeedsSetup(callback);
  }

  // Update management

  async checkForUpdate(serverUrl?: string): Promise<IpcResult<UpdateInfo>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.checkForUpdate(serverUrl);
  }

  async downloadUpdate(serverUrl?: string): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.downloadUpdate(serverUrl);
  }

  onUpdateProgress(callback: (progress: UpdateProgress) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onUpdateProgress((progress) => {
      this.ngZone.run(() => callback(progress));
    });
  }

  // Electron self-update

  async checkForElectronUpdate(serverUrl?: string): Promise<IpcResult<ElectronUpdateInfo>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.checkForElectronUpdate(serverUrl);
  }

  async downloadElectronUpdate(serverUrl?: string): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.downloadElectronUpdate(serverUrl);
  }

  async applyElectronUpdate(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.applyElectronUpdate();
  }

  onElectronUpdateProgress(callback: (progress: ElectronUpdateProgress) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onElectronUpdateProgress((progress) => {
      this.ngZone.run(() => callback(progress));
    });
  }

  // Sync management

  async getSyncStatus(): Promise<IpcResult<SyncStatusInfo>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getSyncStatus();
  }

  async triggerResync(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.triggerResync();
  }

  async getResyncStatus(): Promise<IpcResult<any>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getResyncStatus();
  }

  onSyncStale(callback: (data: { daysSinceSync: number | null }) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onSyncStale((data) => {
      this.ngZone.run(() => callback(data));
    });
  }

  onDeviceConflict(callback: (data: { details: string }) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onDeviceConflict((data) => {
      this.ngZone.run(() => callback(data));
    });
  }

  // Gate Log

  async gateLogGetPeople(): Promise<IpcResult<GateLogEntry[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.gateLogGetPeople();
  }

  async gateLogGetStatus(): Promise<IpcResult<GateLogStatus>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.gateLogGetStatus();
  }

  async gateLogRefresh(): Promise<IpcResult<GateLogEntry[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.gateLogRefresh();
  }

  async gateLogSetAutoRefresh(enabled: boolean, intervalMinutes?: number): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.gateLogSetAutoRefresh(enabled, intervalMinutes);
  }

  async gateLogGetConfig(): Promise<IpcResult<GateLogConfig>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.gateLogGetConfig();
  }

  async gateLogSaveConfig(config: GateLogConfig): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.gateLogSaveConfig(config);
  }

  async gateLogPrint(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.gateLogPrint();
  }

  onGateLogPeopleUpdated(callback: () => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onGateLogPeopleUpdated(() => {
      this.ngZone.run(() => callback());
    });
  }

  // Cold Resync

  async triggerColdResync(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.coldResync();
  }

  onColdResyncProgress(callback: (progress: ColdResyncProgress) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onColdResyncProgress((progress) => {
      this.ngZone.run(() => callback(progress));
    });
  }

  onColdResyncNeeded(callback: (data: any) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onColdResyncNeeded((data) => {
      this.ngZone.run(() => callback(data));
    });
  }

  // Startup assessment

  async getStartupAssessment(): Promise<IpcResult<StartupAssessment>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getStartupAssessment();
  }

  onStartupAssessment(callback: (assessment: StartupAssessment) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onStartupAssessment((assessment) => {
      this.ngZone.run(() => callback(assessment));
    });
  }

  onStartupServerStatus(callback: (data: { reachable: boolean }) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onStartupServerStatus((data) => {
      this.ngZone.run(() => callback(data));
    });
  }

  // Selective sync

  async executeSync(components: SyncComponent[], options?: SyncOptions): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.executeSync(components, options);
  }

  onSyncExecuteProgress(callback: (progress: SyncExecuteProgress) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onSyncExecuteProgress((progress) => {
      this.ngZone.run(() => callback(progress));
    });
  }

  // Weather

  async getWeatherStatus(): Promise<IpcResult<WeatherStatus> & { intervalSeconds?: number }> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getWeatherStatus();
  }

  async weatherRefresh(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.weatherRefresh();
  }

  async weatherSetInterval(seconds: number): Promise<IpcResult & { intervalSeconds?: number }> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.weatherSetInterval(seconds);
  }

  onWeatherStatusChange(callback: (status: WeatherStatus) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onWeatherStatusChange((status) => {
      this.ngZone.run(() => callback(status));
    });
  }

  async getWeatherForecast(): Promise<IpcResult<WeatherForecast>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getWeatherForecast();
  }

  async weatherRefreshForecast(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.weatherRefreshForecast();
  }

  onWeatherForecastChange(callback: (forecast: WeatherForecast) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onWeatherForecastChange((forecast) => {
      this.ngZone.run(() => callback(forecast));
    });
  }

  // Perry Weather

  async getPerryStatus(): Promise<IpcResult<PerryWeatherStatus> & { intervalSeconds?: number }> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getPerryStatus();
  }

  async perryRefresh(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.perryRefresh();
  }

  async perrySetInterval(seconds: number): Promise<IpcResult & { intervalSeconds?: number }> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.perrySetInterval(seconds);
  }

  onPerryStatusChange(callback: (status: PerryWeatherStatus) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onPerryStatusChange((status) => {
      this.ngZone.run(() => callback(status));
    });
  }

  // PJM

  async getPjmStatus(): Promise<IpcResult<PjmStatus>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.getPjmStatus();
  }

  async pjmShowWindow(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.pjmShowWindow();
  }

  async pjmSetPolling(enabled: boolean): Promise<IpcResult & { polling?: boolean }> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.pjmSetPolling(enabled);
  }

  async pjmRefresh(): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.pjmRefresh();
  }

  async pjmGetConfig(): Promise<IpcResult<any>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.pjmGetConfig();
  }

  async pjmSaveConfig(config: any): Promise<IpcResult<any> & { polling?: boolean }> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.pjmSaveConfig(config);
  }

  onPjmStatusChange(callback: (status: PjmStatus) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onPjmStatusChange((status) => {
      this.ngZone.run(() => callback(status));
    });
  }

  async pjmDaFetch(): Promise<IpcResult<PjmDaAward[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.pjmDaFetch();
  }

  async pjmDaRefresh(): Promise<IpcResult<PjmDaAward[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.pjmDaRefresh();
  }

  // Personnel

  async personnelGetStatus(): Promise<IpcResult<PersonnelStatus>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.personnelGetStatus();
  }

  async personnelRefresh(): Promise<IpcResult<PersonnelStatus>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.personnelRefresh();
  }

  async personnelGetContacts(): Promise<IpcResult<PersonnelContact[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.personnelGetContacts();
  }

  // TOI/TMOD

  async toiListFiles(): Promise<IpcResult<ToiFile[]>> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.toiListFiles();
  }

  // Sync entity updates

  onSyncEntityUpdated(callback: (entityType: string, entityId: number) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onSyncEntityUpdated((entityType, entityId) => {
      this.ngZone.run(() => callback(entityType, entityId));
    });
  }

  // Print

  async printHtml(html: string, options?: { silent?: boolean }): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.printHtml(html, options);
  }

  // WebView

  async openWebView(target: string, url: string): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.openWebView(target, url);
  }

  // Menu

  popupMenu(menuId: string, x: number, y: number): void {
    if (!this.isElectron) return;
    window.electronAPI!.popupMenu(menuId, x, y);
  }

  onMenuNavigate(callback: (path: string) => void): () => void {
    if (!this.isElectron) return () => {};
    return window.electronAPI!.onMenuNavigate((path) => {
      this.ngZone.run(() => callback(path));
    });
  }

  // Window controls

  closeWindow(): void {
    window.electronAPI?.closeWindow();
  }

  minimizeWindow(): void {
    window.electronAPI?.minimizeWindow();
  }

  maximizeWindow(): void {
    window.electronAPI?.maximizeWindow();
  }

  // General

  async getAppVersion(): Promise<string> {
    if (!this.isElectron) return 'dev';
    return window.electronAPI!.getAppVersion();
  }

  async openExternal(url: string): Promise<void> {
    if (this.isElectron) {
      await window.electronAPI!.openExternal(url);
    } else {
      window.open(url, '_blank');
    }
  }

  relaunchApp(): void {
    window.electronAPI?.relaunchApp();
  }

  quit(): void {
    window.electronAPI?.quit();
  }

  ngOnDestroy(): void {
    this.unsubscribeStatus?.();
    this.unsubscribeLog?.();
    if (this.logFlushTimer) {
      clearTimeout(this.logFlushTimer);
      this.logFlushTimer = null;
    }
  }
}
