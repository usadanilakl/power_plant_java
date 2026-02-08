import { Injectable, NgZone, OnDestroy } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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
  fireImpOpenForm: (formData: Record<string, string>) => Promise<IpcResult>;
  onFireImpFormSubmitted: (callback: (data: Record<string, string>) => void) => () => void;

  // Device Identity
  getDeviceConfig: () => Promise<IpcResult<DeviceConfig | null>>;
  saveDeviceConfig: (config: DeviceConfig) => Promise<IpcResult>;
  fetchDeviceRegistry: (syncServerUrl?: string) => Promise<IpcResult<DeviceRegistryResponse>>;
  registerDevice: (deviceName: string, deviceNumber?: number, syncServerUrl?: string) => Promise<IpcResult<DeviceConfig>>;
  onDeviceNeedsSetup: (callback: () => void) => () => void;

  // Update management
  checkForUpdate: (serverUrl?: string) => Promise<IpcResult<UpdateInfo>>;
  downloadUpdate: (serverUrl?: string) => Promise<IpcResult>;
  onUpdateProgress: (callback: (progress: UpdateProgress) => void) => () => void;

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

  // WebView
  openWebView: (target: string, url: string) => Promise<IpcResult>;

  // Window control
  closeWindow: () => void;
  minimizeWindow: () => void;
  maximizeWindow: () => void;

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
      this.ngZone.run(() => {
        const current = this._logs.value;
        this._logs.next([...current, line]);
      });
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

  // WebView

  async openWebView(target: string, url: string): Promise<IpcResult> {
    if (!this.isElectron) return { success: false, error: 'Not running in Electron' };
    return window.electronAPI!.openWebView(target, url);
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
  }
}
