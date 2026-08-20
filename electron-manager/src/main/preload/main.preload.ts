/**
 * Preload script - Exposes safe APIs to the renderer process via contextBridge.
 * Uses shared types from src/shared/types.ts (single source of truth).
 */

import { contextBridge, ipcRenderer } from 'electron';
import * as events from '../ipc/events';
import type { AppStatus, IpcResult, DeviceConfig, DeviceRegistryResponse, FeedItem } from '../../shared/types';

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

  // SDS eBinder scraper (chemmanagement.ehs.com → Spring Boot import + source-audit)
  sdsScrapeRun: (opts?: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_SCRAPE_RUN, opts),
  sdsGapReport: (opts?: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_GAP_REPORT, opts),
  sdsScrapeAbort: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_SCRAPE_ABORT),
  sdsMatchChemical: (payload: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_MATCH_CHEMICAL, payload),
  sdsEmailGapReport: (payload: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_EMAIL_GAP_REPORT, payload),
  sdsGetEmailRecipients: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_GET_EMAIL_RECIPIENTS),
  sdsSyncPdfs: (opts: any): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_SYNC_PDFS, opts),
  sdsClearPdfs: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_CLEAR_PDFS),
  sdsScrapeGetStatus: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_SCRAPE_GET_STATUS),
  sdsScrapeGetConfig: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_SDS_SCRAPE_GET_CONFIG),
  sdsScrapeSaveConfig: (config: any): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_SDS_SCRAPE_SAVE_CONFIG, config),

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

  // Permits
  getWorkRequestCount: (): Promise<IpcResult<{ newCount: number; activeCount: number }>> => ipcRenderer.invoke(events.IPC_WORK_REQUEST_COUNT),
  openPermitsMonitor: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PERMITS_OPEN_MONITOR),

  // Maximo bundles
  maximoGetLeadOpSummary: (status?: string): Promise<IpcResult<{ count: number; items: any[] }>> =>
    ipcRenderer.invoke(events.IPC_MAXIMO_LEAD_OP_SUMMARY, status),
  maximoGetOverview: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_MAXIMO_OVERVIEW),
  maximoGetOverviewConfig: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_MAXIMO_GET_OVERVIEW_CONFIG),
  maximoSaveOverviewConfig: (config: any): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_MAXIMO_SAVE_OVERVIEW_CONFIG, config),
  maximoGetLaborPeople: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_MAXIMO_LABOR_PEOPLE),

  // Window Layout
  saveWindowLayout: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_LAYOUT_SAVE),

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
  gateLogGetContractorDirectory: (): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_GATE_LOG_GET_CONTRACTOR_DIRECTORY),
  onGateLogPeopleUpdated: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on(events.IPC_GATE_LOG_PEOPLE_UPDATED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_GATE_LOG_PEOPLE_UPDATED, sub); };
  },

  // Plant Chat
  chatGetSupabaseSession: (): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_CHAT_GET_SUPABASE_SESSION),

  // Contractors
  contractorsGetLive: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_CONTRACTORS_GET_LIVE),
  contractorsRefreshDirectory: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_CONTRACTORS_REFRESH_DIRECTORY),
  maximoSourceGet: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_MAXIMO_SOURCE_GET),
  maximoSourceSet: (patch: Record<string, string>): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_MAXIMO_SOURCE_SET, patch),
  maximoSourceTest: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_MAXIMO_SOURCE_TEST),

  // WebView AMS — Excel report scraper
  webViewAmsGetReports: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_GET_REPORTS),
  webViewAmsGetStatus: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_GET_STATUS),
  webViewAmsRefresh: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_REFRESH),
  webViewAmsGetConfig: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_GET_CONFIG),
  webViewAmsSaveConfig: (config: any): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_SAVE_CONFIG, config),
  webViewAmsSetAutoRefresh: (enabled: boolean): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_SET_AUTO_REFRESH, enabled),
  webViewAmsWiredGet: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_WIRED_GET),
  webViewAmsWiredAdd: (reportKey: string, mode: string, key: string): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_WIRED_ADD, reportKey, mode, key),
  webViewAmsWiredRemove: (id: string): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_WIRED_REMOVE, id),
  webViewAmsHistoryList: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_HISTORY_LIST),
  webViewAmsHistoryGet: (id: number): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_WEBVIEW_AMS_HISTORY_GET, id),
  onWebViewAmsUpdated: (callback: () => void) => {
    const sub = () => callback();
    ipcRenderer.on(events.IPC_WEBVIEW_AMS_UPDATED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_WEBVIEW_AMS_UPDATED, sub); };
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
  getWeatherEnabled: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_GET_ENABLED),
  setWeatherEnabled: (enabled: boolean): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_SET_ENABLED, enabled),
  getWeatherForecast: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_GET_FORECAST),
  weatherRefreshForecast: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_WEATHER_REFRESH_FORECAST),
  onWeatherForecastChange: (callback: (forecast: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, forecast: any) => callback(forecast);
    ipcRenderer.on(events.IPC_WEATHER_FORECAST, sub);
    return () => { ipcRenderer.removeListener(events.IPC_WEATHER_FORECAST, sub); };
  },

  // Perry Weather
  getPerryStatus: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PERRY_GET_STATUS),
  perryRefresh: (): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PERRY_REFRESH),
  perrySetInterval: (seconds: number): Promise<IpcResult> => ipcRenderer.invoke(events.IPC_PERRY_SET_INTERVAL, seconds),
  onPerryStatusChange: (callback: (status: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, status: any) => callback(status);
    ipcRenderer.on(events.IPC_PERRY_STATUS, sub);
    return () => { ipcRenderer.removeListener(events.IPC_PERRY_STATUS, sub); };
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
  // PJM Day-Ahead Awards (read-only — data from SharePoint)
  pjmDaFetch: (): Promise<any> => ipcRenderer.invoke(events.IPC_PJM_DA_FETCH),
  pjmDaRefresh: (): Promise<any> => ipcRenderer.invoke(events.IPC_PJM_DA_REFRESH),

  // TOI/TMOD
  toiListFiles: (): Promise<any> => ipcRenderer.invoke(events.IPC_TOI_LIST_FILES),
  corkBoardListItems: (): Promise<any> => ipcRenderer.invoke(events.IPC_CORK_BOARD_LIST_ITEMS),
  corkBoardListActions: (): Promise<any> => ipcRenderer.invoke(events.IPC_CORK_BOARD_LIST_ACTIONS),
  corkBoardCreateAction: (request: any): Promise<any> =>
    ipcRenderer.invoke(events.IPC_CORK_BOARD_CREATE_ACTION, request),
  corkBoardSubmitAction: (request: any): Promise<any> =>
    ipcRenderer.invoke(events.IPC_CORK_BOARD_SUBMIT_ACTION, request),

  // Updates / News feed
  newsList: (): Promise<IpcResult<FeedItem[]>> => ipcRenderer.invoke(events.IPC_NEWS_LIST),
  newsRefresh: (): Promise<IpcResult<FeedItem[]>> => ipcRenderer.invoke(events.IPC_NEWS_REFRESH),
  onNewsUpdate: (callback: (items: FeedItem[]) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, items: FeedItem[]) => callback(items);
    ipcRenderer.on(events.IPC_NEWS_UPDATE, sub);
    return () => { ipcRenderer.removeListener(events.IPC_NEWS_UPDATE, sub); };
  },

  // Personnel / Schedule
  personnelGetStatus: (): Promise<any> => ipcRenderer.invoke(events.IPC_PERSONNEL_GET_STATUS),
  personnelRefresh: (): Promise<any> => ipcRenderer.invoke(events.IPC_PERSONNEL_REFRESH),
  personnelGetContacts: (): Promise<any> => ipcRenderer.invoke(events.IPC_PERSONNEL_GET_CONTACTS),
  personnelGetConfig: (): Promise<any> => ipcRenderer.invoke(events.IPC_PERSONNEL_GET_CONFIG),
  personnelSaveConfig: (config: any): Promise<any> => ipcRenderer.invoke(events.IPC_PERSONNEL_SAVE_CONFIG, config),
  personnelGetMeta: (): Promise<any> => ipcRenderer.invoke(events.IPC_PERSONNEL_GET_META),
  personnelCoverageDay: (date: string): Promise<any> => ipcRenderer.invoke(events.IPC_PERSONNEL_COVERAGE_DAY, date),
  personnelCoverageSignup: (coverageRequestId: number, date: string, signAsToken?: string): Promise<any> =>
    ipcRenderer.invoke(events.IPC_PERSONNEL_COVERAGE_SIGNUP, coverageRequestId, date, signAsToken),
  personnelCoverageSignups: (from: string, to: string): Promise<any> =>
    ipcRenderer.invoke(events.IPC_PERSONNEL_COVERAGE_SIGNUPS, from, to),
  personnelCoverageEligibility: (from: string, to: string): Promise<any> =>
    ipcRenderer.invoke(events.IPC_PERSONNEL_COVERAGE_ELIGIBILITY, from, to),
  personnelCoverageEligibilityDetail: (from: string, to: string): Promise<any> =>
    ipcRenderer.invoke(events.IPC_PERSONNEL_COVERAGE_ELIGIBILITY_DETAIL, from, to),
  personnelCoverageQuickSignup: (date: string, shift?: 'DAY' | 'NIGHT', signAsToken?: string): Promise<any> =>
    ipcRenderer.invoke(events.IPC_PERSONNEL_COVERAGE_QUICK_SIGNUP, date, shift, signAsToken),
  personnelCoverageWithdraw: (signupId: number, signAsToken?: string): Promise<any> =>
    ipcRenderer.invoke(events.IPC_PERSONNEL_COVERAGE_WITHDRAW, signupId, signAsToken),
  authStepUp: (code: string): Promise<any> => ipcRenderer.invoke(events.IPC_AUTH_STEP_UP, code),

  // Sync entity updates (broadcast from main when sync applies changes)
  onSyncEntityUpdated: (callback: (entityType: string, entityId: number) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, entityType: string, entityId: number) => callback(entityType, entityId);
    ipcRenderer.on(events.IPC_SYNC_ENTITY_UPDATED, sub);
    return () => { ipcRenderer.removeListener(events.IPC_SYNC_ENTITY_UPDATED, sub); };
  },

  // Menu
  popupMenu: (menuId: string, x: number, y: number): Promise<void> =>
    ipcRenderer.invoke(events.IPC_MENU_POPUP, menuId, x, y),
  onMenuNavigate: (callback: (path: string) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, path: string) => callback(path);
    ipcRenderer.on(events.IPC_MENU_NAVIGATE, sub);
    return () => { ipcRenderer.removeListener(events.IPC_MENU_NAVIGATE, sub); };
  },

  // Print
  printCurrentPage: (options?: { silent?: boolean }): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_PRINT_CURRENT_PAGE, options),
  printHtml: (html: string, options?: { silent?: boolean }): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_PRINT_HTML, html, options),
  printWithPreview: (options?: { landscape?: boolean }): Promise<IpcResult> =>
    ipcRenderer.invoke(events.IPC_PRINT_WITH_PREVIEW, options),

  // Vosk STT
  voskStart: (): Promise<any> => ipcRenderer.invoke(events.IPC_VOSK_START),
  voskStop: (): Promise<any> => ipcRenderer.invoke(events.IPC_VOSK_STOP),
  voskGetStatus: (): Promise<any> => ipcRenderer.invoke(events.IPC_VOSK_GET_STATUS),
  voskSendAudio: (buffer: ArrayBuffer): void => ipcRenderer.send(events.IPC_VOSK_AUDIO_CHUNK, Buffer.from(buffer)),
  onVoskResult: (callback: (result: any) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, result: any) => callback(result);
    ipcRenderer.on(events.IPC_VOSK_RESULT, sub);
    return () => { ipcRenderer.removeListener(events.IPC_VOSK_RESULT, sub); };
  },
  onVoskError: (callback: (error: string) => void) => {
    const sub = (_event: Electron.IpcRendererEvent, error: string) => callback(error);
    ipcRenderer.on(events.IPC_VOSK_ERROR, sub);
    return () => { ipcRenderer.removeListener(events.IPC_VOSK_ERROR, sub); };
  },

  // General
  getAppVersion: (): Promise<string> => ipcRenderer.invoke(events.IPC_GET_APP_VERSION),
  openExternal: (url: string): Promise<void> => ipcRenderer.invoke(events.IPC_OPEN_EXTERNAL, url),
  relaunchApp: () => ipcRenderer.send(events.IPC_RELAUNCH),
  quit: () => ipcRenderer.send(events.IPC_QUIT)
});
