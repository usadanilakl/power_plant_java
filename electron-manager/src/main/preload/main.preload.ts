/**
 * Preload script - Exposes safe APIs to the renderer process via contextBridge.
 * Uses shared types from src/shared/types.ts (single source of truth).
 */

import { contextBridge, ipcRenderer } from 'electron';
import * as events from '../ipc/events';
import type { AppStatus, IpcResult, DeviceConfig, DeviceRegistryResponse } from '../../shared/types';

contextBridge.exposeInMainWorld('electronAPI', {
  // Identity
  isElectron: true,
  platform: process.platform,

  // Spring Boot control (single app)
  startApp: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_APP_START),
  stopApp: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_APP_STOP),
  restartApp: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_APP_RESTART),
  getAppStatus: (): Promise<AppStatus> => ipcRenderer.invoke(events.IPC_APP_GET_STATUS),
  getAppLogs: (): Promise<string[]> => ipcRenderer.invoke(events.IPC_APP_GET_LOGS),
  openAppUrl: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_OPEN_APP_URL),

  // Real-time subscriptions
  onAppStatusChange: (callback: (status: AppStatus) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, status: AppStatus) => callback(status);
    ipcRenderer.on(events.IPC_APP_STATUS_CHANGED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_APP_STATUS_CHANGED, sub); };
  },

  onAppLog: (callback: (line: string) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, line: string) => callback(line);
    ipcRenderer.on(events.IPC_APP_LOG, sub);
    return () => { ipcRenderer.removeListener(events.IPC_APP_LOG, sub); };
  },

  // Window control
  closeWindow: () => ipcRenderer.invoke(events.IPC_WINDOW_CLOSE),
  minimizeWindow: () => ipcRenderer.send(events.IPC_WINDOW_MINIMIZE),
  maximizeWindow: () => ipcRenderer.send(events.IPC_WINDOW_MAXIMIZE),

  // WebView (open external sites in separate Electron windows with auto-login)
  openWebView: (target: string, url: string): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_WEBVIEW_OPEN, target, url),

  // Fire Impairment
  fireImpList: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_FIRE_IMP_LIST),
  fireImpListClosed: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_FIRE_IMP_LIST_CLOSED),
  fireImpCount: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_FIRE_IMP_COUNT),
  fireImpGetEnums: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_FIRE_IMP_GET_ENUMS),
  fireImpCreate: (dto: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_FIRE_IMP_CREATE, dto),
  fireImpUpdate: (id: number, dto: any): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_FIRE_IMP_UPDATE, id, dto),
  fireImpClose: (id: number): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_FIRE_IMP_CLOSE, id),
  fireImpCancel: (id: number): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_FIRE_IMP_CANCEL, id),
  fireImpOpenForm: (formData: Record<string, string>): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_FIRE_IMP_OPEN_FORM, formData),
  onFireImpFormSubmitted: (callback: (data: Record<string, string>) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, data: Record<string, string>) => callback(data);
    ipcRenderer.on(events.IPC_FIRE_IMP_FORM_SUBMITTED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_FIRE_IMP_FORM_SUBMITTED, sub); };
  },

  // Device Identity
  getDeviceConfig: (): Promise<IpcResult<DeviceConfig | null>> =>
    ipcRenderer.invoke(events.IPC_DEVICE_CONFIG_GET),
  saveDeviceConfig: (config: DeviceConfig): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_DEVICE_CONFIG_SAVE, config),
  fetchDeviceRegistry: (syncServerUrl?: string): Promise<IpcResult<DeviceRegistryResponse>> =>
    ipcRenderer.invoke(events.IPC_DEVICE_REGISTRY_FETCH, syncServerUrl),
  registerDevice: (deviceName: string, deviceNumber?: number, syncServerUrl?: string): Promise<IpcResult<DeviceConfig>> =>
    ipcRenderer.invoke(events.IPC_DEVICE_REGISTRY_REGISTER, deviceName, deviceNumber, syncServerUrl),
  onDeviceNeedsSetup: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on(events.IPC_DEVICE_NEEDS_SETUP, sub);
    return () => { ipcRenderer.removeListener(events.IPC_DEVICE_NEEDS_SETUP, sub); };
  },

  // Update management
  checkForUpdate: (serverUrl?: string): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_UPDATE_CHECK, serverUrl),
  downloadUpdate: (serverUrl?: string): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_UPDATE_DOWNLOAD, serverUrl),
  onUpdateProgress: (callback: (progress: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, progress: any) => callback(progress);
    ipcRenderer.on(events.IPC_UPDATE_PROGRESS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_UPDATE_PROGRESS, sub); };
  },

  // Electron self-update
  checkForElectronUpdate: (serverUrl?: string): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_ELECTRON_UPDATE_CHECK, serverUrl),
  downloadElectronUpdate: (serverUrl?: string): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_ELECTRON_UPDATE_DOWNLOAD, serverUrl),
  applyElectronUpdate: (): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_ELECTRON_UPDATE_APPLY),
  onElectronUpdateProgress: (callback: (progress: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, progress: any) => callback(progress);
    ipcRenderer.on(events.IPC_ELECTRON_UPDATE_PROGRESS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_ELECTRON_UPDATE_PROGRESS, sub); };
  },

  // Sync management
  getSyncStatus: (): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_SYNC_GET_STATUS),
  triggerResync: (): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_SYNC_TRIGGER_RESYNC),
  getResyncStatus: (): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_SYNC_GET_RESYNC_STATUS),
  onSyncStale: (callback: (data: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(events.IPC_SYNC_STALE, sub);
    return () => { ipcRenderer.removeListener(events.IPC_SYNC_STALE, sub); };
  },
  onDeviceConflict: (callback: (data: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(events.IPC_DEVICE_CONFLICT, sub);
    return () => { ipcRenderer.removeListener(events.IPC_DEVICE_CONFLICT, sub); };
  },

  // Cold Resync
  coldResync: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_COLD_RESYNC),
  onColdResyncProgress: (callback: (progress: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, progress: any) => callback(progress);
    ipcRenderer.on(events.IPC_COLD_RESYNC_PROGRESS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_COLD_RESYNC_PROGRESS, sub); };
  },
  onColdResyncNeeded: (callback: (data: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(events.IPC_COLD_RESYNC_NEEDED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_COLD_RESYNC_NEEDED, sub); };
  },

  // Startup assessment
  getStartupAssessment: (): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_STARTUP_GET_ASSESSMENT),
  onStartupAssessment: (callback: (assessment: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(events.IPC_STARTUP_ASSESSMENT, sub);
    return () => { ipcRenderer.removeListener(events.IPC_STARTUP_ASSESSMENT, sub); };
  },
  onStartupServerStatus: (callback: (data: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, data: any) => callback(data);
    ipcRenderer.on(events.IPC_STARTUP_SERVER_STATUS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_STARTUP_SERVER_STATUS, sub); };
  },

  // Selective sync
  executeSync: (components: string[], options?: Record<string, any>): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_SYNC_EXECUTE, components, options),
  onSyncExecuteProgress: (callback: (progress: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, progress: any) => callback(progress);
    ipcRenderer.on(events.IPC_SYNC_EXECUTE_PROGRESS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_SYNC_EXECUTE_PROGRESS, sub); };
  },

  // Gate Log
  gateLogGetPeople: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_GATE_LOG_GET_PEOPLE),
  gateLogGetStatus: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_GATE_LOG_GET_STATUS),
  gateLogRefresh: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_GATE_LOG_REFRESH),
  gateLogSetAutoRefresh: (enabled: boolean, intervalMinutes?: number): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_GATE_LOG_SET_AUTO_REFRESH, enabled, intervalMinutes),
  gateLogGetConfig: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_GATE_LOG_GET_CONFIG),
  gateLogSaveConfig: (config: any): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_GATE_LOG_SAVE_CONFIG, config),
  gateLogPrint: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_GATE_LOG_PRINT),
  onGateLogPeopleUpdated: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on(events.IPC_GATE_LOG_PEOPLE_UPDATED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_GATE_LOG_PEOPLE_UPDATED, sub); };
  },

  // Weather
  getWeatherStatus: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_GET_STATUS),
  weatherRefresh: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_REFRESH),
  weatherSetInterval: (seconds: number): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_SET_INTERVAL, seconds),
  onWeatherStatusChange: (callback: (status: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on(events.IPC_WEATHER_STATUS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_WEATHER_STATUS, sub); };
  },
  getWeatherForecast: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_GET_FORECAST),
  weatherRefreshForecast: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_REFRESH_FORECAST),
  onWeatherForecastChange: (callback: (forecast: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, forecast: any) => callback(forecast);
    ipcRenderer.on(events.IPC_WEATHER_FORECAST, sub);
    return () => { ipcRenderer.removeListener(events.IPC_WEATHER_FORECAST, sub); };
  },

  // PJM
  getPjmStatus: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PJM_GET_STATUS),
  pjmShowWindow: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PJM_SHOW_WINDOW),
  pjmSetPolling: (enabled: boolean): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PJM_SET_POLLING, enabled),
  pjmRefresh: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PJM_REFRESH),
  pjmGetConfig: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PJM_GET_CONFIG),
  pjmSaveConfig: (config: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PJM_SAVE_CONFIG, config),
  onPjmStatusChange: (callback: (status: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on(events.IPC_PJM_STATUS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_PJM_STATUS, sub); };
  },

  // General
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(events.IPC_GET_APP_VERSION),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(events.IPC_OPEN_EXTERNAL, url),
  relaunchApp: () => ipcRenderer.send(events.IPC_RELAUNCH),
  quit: () => ipcRenderer.send(events.IPC_QUIT)
});
