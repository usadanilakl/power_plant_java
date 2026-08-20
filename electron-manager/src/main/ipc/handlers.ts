/**
 * IPC Handlers - Registers all IPC event handlers for the main process.
 */

import { app, ipcMain, shell, dialog, BrowserWindow, session, Menu, MenuItemConstructorOptions } from 'electron';
import * as http from 'http';
import * as fs from 'fs';
import * as path from 'path';
import * as events from './events';
import { SpringBootManager } from '../managers/spring-boot.manager';
import { WebViewManager } from '../managers/webview.manager';
import { UpdateManager } from '../managers/update.manager';
import { SyncStatusManager } from '../managers/sync-status.manager';
import { ColdResyncManager } from '../managers/cold-resync.manager';
import { ClientCommandManager } from '../managers/client-command.manager';
import { GateLogManager } from '../managers/gate-log.manager';
import { MaximoOverviewManager } from '../managers/maximo-overview.manager';
import { WebViewAmsManager } from '../managers/webview-ams.manager';
import { WebViewSdsManager } from '../managers/webview-sds.manager';
import { WeatherManager } from '../managers/weather.manager';
import { PerryWeatherManager } from '../managers/perry-weather.manager';
import { PjmManager } from '../managers/pjm.manager';
import { ResourcePackManager } from '../managers/resource-pack.manager';
import { ElectronUpdateManager } from '../managers/electron-update.manager';
import { WindowLayoutManager } from '../managers/window-layout.manager';
import { DaEmailManager } from '../managers/da-email.manager';
import { VoskManager } from '../managers/vosk.manager';
import { backendGet, backendPost } from '../clients/backend-client';
import { SyncUpdateManager } from '../managers/sync-update.manager';
import { getWorkingDir } from '../paths';
import { SharePointManager } from '../managers/sharepoint.manager';
import { PersonnelManager } from '../managers/personnel.manager';
import { NewsManager } from '../managers/news.manager';
import { DEFAULT_SPRING_BOOT_CONFIG, APP_DISPLAY_NAME } from '../constants';
import type { WebViewTarget, DeviceConfig, UpdateProgress, ColdResyncProgress, GateLogConfig, MaximoOverviewConfig, StartupAssessment, SyncComponent, SyncOptions, SyncExecuteProgress, ElectronUpdateProgress, WeatherStatus, WeatherForecast, PerryWeatherStatus, PjmStatus, VoskResult, WebViewAmsConfig, SdsScraperConfig, CorkBoardItem, CorkBoardAction, CorkBoardActionCreateRequest, CorkBoardActionResponse, CorkBoardActionSubmitRequest, CorkBoardActionSummary, CorkBoardActionType } from '../../shared/types';

const CORK_BOARD_FOLDER = '/sites/JG/External/Cork-Board';
const CORK_BOARD_ACTIONS_LIST = 'Cork Board Actions';
const CORK_BOARD_RESPONSES_LIST = 'Cork Board Responses';
const SHAREPOINT_FIELD_TEXT = 2;
const SHAREPOINT_FIELD_NOTE = 3;
const SHAREPOINT_FIELD_DATE_TIME = 4;
const SHAREPOINT_FIELD_BOOLEAN = 8;
const CORK_BOARD_ACTION_FIELDS = [
  { name: 'ActionType', typeKind: SHAREPOINT_FIELD_TEXT },
  { name: 'ActionDescription', typeKind: SHAREPOINT_FIELD_NOTE },
  { name: 'ActionOptionsJson', typeKind: SHAREPOINT_FIELD_NOTE },
  { name: 'ActionActive', typeKind: SHAREPOINT_FIELD_BOOLEAN },
  { name: 'ActionExpiresOn', typeKind: SHAREPOINT_FIELD_DATE_TIME },
  { name: 'ActionCreatedBy', typeKind: SHAREPOINT_FIELD_TEXT },
  { name: 'ActionCreatedAt', typeKind: SHAREPOINT_FIELD_DATE_TIME },
];
const CORK_BOARD_RESPONSE_FIELDS = [
  { name: 'ActionId', typeKind: SHAREPOINT_FIELD_TEXT },
  { name: 'ActionTitle', typeKind: SHAREPOINT_FIELD_TEXT },
  { name: 'ResponderName', typeKind: SHAREPOINT_FIELD_TEXT },
  { name: 'ResponseValue', typeKind: SHAREPOINT_FIELD_TEXT },
  { name: 'ResponseComment', typeKind: SHAREPOINT_FIELD_NOTE },
  { name: 'SubmittedAt', typeKind: SHAREPOINT_FIELD_DATE_TIME },
];

export class IpcHandlers {
  private springBoot: SpringBootManager;
  private webview: WebViewManager;
  private updateManager: UpdateManager;
  private syncStatusManager: SyncStatusManager;
  private coldResyncManager: ColdResyncManager;
  private clientCommandManager: ClientCommandManager;
  private gateLogManager: GateLogManager;
  private maximoOverviewManager: MaximoOverviewManager;
  private webViewAmsManager: WebViewAmsManager;
  private webViewSdsManager: WebViewSdsManager;
  private weatherManager: WeatherManager;
  private perryWeatherManager: PerryWeatherManager;
  private pjmManager: PjmManager;
  private daEmailManager: DaEmailManager;
  private resourcePackManager: ResourcePackManager;
  private electronUpdateManager: ElectronUpdateManager;
  private windowLayoutManager: WindowLayoutManager;
  private voskManager: VoskManager;
  private syncUpdateManager: SyncUpdateManager;
  private sharepointManager: SharePointManager;
  private personnelManager: PersonnelManager;
  private newsManager: NewsManager;
  private mainWindow: BrowserWindow;
  private permitsMonitorWindow: BrowserWindow | null = null;
  private lastAssessment: StartupAssessment | null = null;

  constructor(mainWindow: BrowserWindow, windowLayoutManager: WindowLayoutManager) {
    this.mainWindow = mainWindow;
    this.windowLayoutManager = windowLayoutManager;
    this.webview = new WebViewManager(mainWindow);
    this.updateManager = new UpdateManager();
    this.syncStatusManager = new SyncStatusManager();
    this.resourcePackManager = new ResourcePackManager();
    this.electronUpdateManager = new ElectronUpdateManager();
    this.gateLogManager = new GateLogManager();
    this.maximoOverviewManager = new MaximoOverviewManager();
    this.webViewAmsManager = new WebViewAmsManager();
    this.webViewSdsManager = new WebViewSdsManager(
      () => this.springBoot.getDeviceConfigManager().getConfig()?.syncServerUrl
    );
    this.daEmailManager = new DaEmailManager();
    this.voskManager = new VoskManager(
      (result: VoskResult) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_VOSK_RESULT, result);
        }
      },
      (error: string) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_VOSK_ERROR, error);
        }
      }
    );
    this.weatherManager = new WeatherManager(
      (status: WeatherStatus) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_WEATHER_STATUS, status);
        }
      },
      (forecast: WeatherForecast) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_WEATHER_FORECAST, forecast);
        }
      }
    );
    this.weatherManager.start();
    this.perryWeatherManager = new PerryWeatherManager(
      (status: PerryWeatherStatus) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_PERRY_STATUS, status);
        }
      }
    );
    this.perryWeatherManager.start();
    this.pjmManager = new PjmManager(this.windowLayoutManager, this.daEmailManager, (status: PjmStatus) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(events.IPC_PJM_STATUS, status);
      }
    });
    this.gateLogManager.setOnPeopleUpdated(() => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(events.IPC_GATE_LOG_PEOPLE_UPDATED);
      }
    });
    this.webViewAmsManager.setOnReportUpdated(() => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(events.IPC_WEBVIEW_AMS_UPDATED);
      }
    });
    this.webViewAmsManager.start();
    this.syncUpdateManager = new SyncUpdateManager((entityType, entityId) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(events.IPC_SYNC_ENTITY_UPDATED, entityType, entityId);
      }
    });
    // Updates/News feed — polls the local backend and pushes the merged list to the renderer.
    // Constructed before springBoot so the health callback below can prompt an immediate refresh.
    this.newsManager = new NewsManager((items) => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(events.IPC_NEWS_UPDATE, items);
      }
    });
    this.newsManager.start();
    this.springBoot = new SpringBootManager(
      (status) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_APP_STATUS_CHANGED, status);
        }
        // Connect/disconnect SSE sync updates based on Spring Boot state
        if (status.state === 'running' && status.healthStatus === 'healthy') {
          this.syncUpdateManager.connect(DEFAULT_SPRING_BOOT_CONFIG.port);
          // Backend just came up — pull a fresh feed now instead of waiting for the next poll tick.
          void this.newsManager.refresh();
        } else if (status.state === 'stopped' || status.state === 'error') {
          this.syncUpdateManager.disconnect();
        }
        // Rebuild menu to reflect new state (Start/Stop/Restart enabled/disabled)
        try {
          const App = require('../app').default;
          App.createMenu();
        } catch { /* ignore during startup */ }
      },
      (line) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_APP_LOG, line);
        }
      }
    );

    // Must init after springBoot so we can read the device config's profile
    this.coldResyncManager = new ColdResyncManager(this.springBoot.getDeviceConfigManager());
    // Poll the hub for immediate commands (shutdown/restart) targeting this client and act on them. No-ops
    // until the device config + hub URL are set, so starting it here is safe.
    this.clientCommandManager = new ClientCommandManager(
      () => this.springBoot.getDeviceConfigManager().getConfig(),
      this.springBoot
    );
    this.clientCommandManager.start();
    this.sharepointManager = new SharePointManager();
    this.personnelManager = new PersonnelManager(this.sharepointManager);

    // Intercept main-process console output and route to unified log buffer
    this.interceptConsole();
  }

  /**
   * Intercepts console.log/warn/error in the main process and feeds
   * tagged [EM] entries into the shared log buffer + IPC stream.
   */
  private interceptConsole(): void {
    const origLog = console.log.bind(console);
    const origWarn = console.warn.bind(console);
    const origError = console.error.bind(console);

    const emitLog = (level: string, args: any[]) => {
      const msg = args.map(a => typeof a === 'string' ? a : JSON.stringify(a)).join(' ');
      this.springBoot.addLog(`[EM] [${level}] ${msg}`);
    };

    console.log = (...args: any[]) => {
      origLog(...args);
      emitLog('LOG', args);
    };

    console.warn = (...args: any[]) => {
      origWarn(...args);
      emitLog('WARN', args);
    };

    console.error = (...args: any[]) => {
      origError(...args);
      emitLog('ERR', args);
    };
  }

  public register(): void {
    this.registerAppHandlers();
    this.registerDeviceHandlers();
    this.registerUpdateHandlers();
    this.registerSyncHandlers();
    this.registerWindowHandlers();
    this.registerGeneralHandlers();
    this.registerWebViewHandlers();
    this.registerFireImpairmentHandlers();
    this.registerColdResyncHandlers();
    this.registerStartupHandlers();
    this.registerPermitsHandlers();
    this.registerMaximoHandlers();
    this.registerGateLogHandlers();
    this.registerWebViewAmsHandlers();
    this.registerSdsScrapeHandlers();
    this.registerWeatherHandlers();
    this.registerPerryWeatherHandlers();
    this.registerPjmHandlers();
    this.registerElectronUpdateHandlers();
    this.registerMenuHandlers();
    this.registerPrintHandlers();
    this.registerLayoutHandlers();
    this.registerVoskHandlers();
    this.registerNewsHandlers();
    this.registerPersonnelHandlers();
    this.registerContractorHandlers();
    this.registerChatAuthHandlers();
  }

  private registerChatAuthHandlers(): void {
    ipcMain.handle(events.IPC_CHAT_GET_SUPABASE_SESSION, async () => {
      try {
        return { success: true, data: await backendGet('/api/chat/supabase-session') };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });
  }

  public getSpringBootManager(): SpringBootManager {
    return this.springBoot;
  }

  public getUpdateManager(): UpdateManager {
    return this.updateManager;
  }

  public getSyncStatusManager(): SyncStatusManager {
    return this.syncStatusManager;
  }

  public getGateLogManager(): GateLogManager {
    return this.gateLogManager;
  }

  public getWebViewAmsManager(): WebViewAmsManager {
    return this.webViewAmsManager;
  }

  public getColdResyncManager(): ColdResyncManager {
    return this.coldResyncManager;
  }

  /** Poll the LOCAL backend's health until it responds 200 or the timeout elapses. */
  private async waitForLocalBackend(port: number, timeoutMs: number): Promise<boolean> {
    const http = require('http');
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
      const ok = await new Promise<boolean>((resolve) => {
        const req = http.request(
          { hostname: 'localhost', port, path: '/actuator/health', method: 'GET', timeout: 4000 },
          (res: any) => { res.resume(); resolve(res.statusCode === 200); });
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      });
      if (ok) return true;
      await new Promise((r) => setTimeout(r, 3000));
    }
    return false;
  }

  /** POST to the LOCAL backend and resolve with the response body (rejects on non-2xx). */
  private httpPostLocal(port: number, pathAndQuery: string, timeoutMs: number = 30000): Promise<string> {
    const http = require('http');
    return new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: 'localhost', port, path: pathAndQuery, method: 'POST', timeout: timeoutMs },
        (res: any) => {
          let data = '';
          res.on('data', (c: any) => { data += c; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) resolve(data);
            else reject(new Error(`HTTP ${res.statusCode}: ${data.slice(0, 200)}`));
          });
        });
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('request timed out')); });
      req.end();
    });
  }

  public getResourcePackManager(): ResourcePackManager {
    return this.resourcePackManager;
  }

  public getWeatherManager(): WeatherManager {
    return this.weatherManager;
  }

  public getPjmManager(): PjmManager {
    return this.pjmManager;
  }

  public getElectronUpdateManager(): ElectronUpdateManager {
    return this.electronUpdateManager;
  }

  public getWindowLayoutManager(): WindowLayoutManager {
    return this.windowLayoutManager;
  }

  public setLastAssessment(assessment: StartupAssessment): void {
    this.lastAssessment = assessment;
  }

  private registerAppHandlers(): void {
    ipcMain.handle(events.IPC_APP_START, async () => {
      try {
        await this.springBoot.start();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_APP_STOP, async () => {
      try {
        await this.springBoot.stop();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_APP_RESTART, async () => {
      try {
        await this.springBoot.restart();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_APP_GET_STATUS, () => {
      return this.springBoot.getStatus();
    });

    ipcMain.handle(events.IPC_APP_GET_LOGS, () => {
      return this.springBoot.getLogs();
    });

    ipcMain.handle(events.IPC_OPEN_APP_URL, async () => {
      const status = this.springBoot.getStatus();
      if (status.state === 'running') {
        await shell.openExternal(`http://localhost:${status.port}`);
        return { success: true };
      }
      return { success: false, error: `${APP_DISPLAY_NAME} is not running` };
    });
  }

  private registerDeviceHandlers(): void {
    const deviceMgr = this.springBoot.getDeviceConfigManager();

    ipcMain.handle(events.IPC_DEVICE_CONFIG_GET, () => {
      return { success: true, data: deviceMgr.getConfig() };
    });

    ipcMain.handle(events.IPC_DEVICE_CONFIG_SAVE, async (_event, config: DeviceConfig) => {
      try {
        deviceMgr.saveConfig(config);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_DEVICE_REGISTRY_FETCH, async (_event, syncServerUrl?: string) => {
      return deviceMgr.fetchDeviceRegistry(syncServerUrl);
    });

    ipcMain.handle(events.IPC_DEVICE_REGISTRY_REGISTER, async (
      _event, deviceName: string, deviceNumber?: number, syncServerUrl?: string
    ) => {
      return deviceMgr.registerWithServer(deviceName, deviceNumber, syncServerUrl);
    });
  }

  private registerWindowHandlers(): void {
    ipcMain.handle(events.IPC_WINDOW_CLOSE, async () => {
      if (this.springBoot.isRunning()) {
        const result = await dialog.showMessageBox(this.mainWindow, {
          type: 'question',
          buttons: ['Cancel', 'Stop and Exit'],
          defaultId: 0,
          cancelId: 0,
          title: 'Confirm Exit',
          message: `${APP_DISPLAY_NAME} is still running.`,
          detail: `Port ${DEFAULT_SPRING_BOOT_CONFIG.port}\n\nDo you want to stop ${APP_DISPLAY_NAME} and exit?`
        });

        if (result.response === 1) {
          await this.springBoot.stop();
          app.quit();
        }
      } else {
        app.quit();
      }
    });

    ipcMain.on(events.IPC_WINDOW_MINIMIZE, () => {
      this.mainWindow.minimize();
    });

    ipcMain.on(events.IPC_WINDOW_MAXIMIZE, () => {
      if (this.mainWindow.isMaximized()) {
        this.mainWindow.unmaximize();
      } else {
        this.mainWindow.maximize();
      }
    });
  }

  private registerGeneralHandlers(): void {
    ipcMain.handle(events.IPC_GET_APP_VERSION, () => {
      return app.getVersion();
    });

    ipcMain.on(events.IPC_QUIT, async () => {
      await this.springBoot.stop();
      app.exit(0);
    });

    ipcMain.on(events.IPC_RELAUNCH, async () => {
      await this.springBoot.stop();
      app.relaunch();
      app.exit();
    });

    ipcMain.handle(events.IPC_OPEN_EXTERNAL, async (_event, url: string) => {
      // shell.openExternal hands the string to the OS shell. On Windows that makes non-web
      // schemes (ms-msdt:, search-ms:, file: UNC paths, ...) a code-execution vector, so only
      // real web/mail links are forwarded. Every in-app caller already passes http(s).
      let scheme: string;
      try {
        scheme = new URL(url).protocol;
      } catch {
        console.warn(`[OpenExternal] refused unparseable url: ${url}`);
        return { success: false, error: 'Invalid URL' };
      }
      if (scheme !== 'http:' && scheme !== 'https:' && scheme !== 'mailto:') {
        console.warn(`[OpenExternal] refused scheme ${scheme}: ${url}`);
        return { success: false, error: `Refused to open ${scheme} link` };
      }
      await shell.openExternal(url);
      return { success: true };
    });
  }

  private registerWebViewHandlers(): void {
    ipcMain.handle(events.IPC_WEBVIEW_OPEN, async (_event, target: WebViewTarget, url: string) => {
      try {
        await this.webview.open(target, url);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_CLOSE, async (_event, target: WebViewTarget) => {
      this.webview.close(target);
      return { success: true };
    });

    ipcMain.handle(events.IPC_WEBVIEW_INJECT, async (_event, target: WebViewTarget, script: string) => {
      try {
        const result = await this.webview.inject(target, script);
        return { success: true, data: result };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerFireImpairmentHandlers(): void {
    // List active impairments from Spring Boot API
    ipcMain.handle(events.IPC_FIRE_IMP_LIST, async () => {
      try {
        const data = await this.springBootApiGet('/api/fire-impairment/active');
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // List closed impairments
    ipcMain.handle(events.IPC_FIRE_IMP_LIST_CLOSED, async () => {
      try {
        const data = await this.springBootApiGet('/api/fire-impairment/closed');
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Get active impairment count (for home page)
    ipcMain.handle(events.IPC_FIRE_IMP_COUNT, async () => {
      try {
        const data = await this.springBootApiGet('/api/fire-impairment/active');
        return { success: true, data: Array.isArray(data) ? data.length : 0 };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Get enums (locations, protection-types, emails)
    ipcMain.handle(events.IPC_FIRE_IMP_GET_ENUMS, async () => {
      try {
        const [locations, protectionTypes, emails] = await Promise.all([
          this.springBootApiGet('/api/fire-impairment/locations'),
          this.springBootApiGet('/api/fire-impairment/protection-types'),
          this.springBootApiGet('/api/fire-impairment/emails')
        ]);
        return { success: true, data: { locations, protectionTypes, emails } };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Create impairment via Spring Boot API
    ipcMain.handle(events.IPC_FIRE_IMP_CREATE, async (_event, dto: any) => {
      try {
        const data = await this.springBootApiPost('/api/fire-impairment', dto);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Update impairment
    ipcMain.handle(events.IPC_FIRE_IMP_UPDATE, async (_event, id: number, dto: any) => {
      try {
        const data = await this.springBootApiPut(`/api/fire-impairment/${id}`, dto);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Cancel impairment
    ipcMain.handle(events.IPC_FIRE_IMP_CANCEL, async (_event, id: number) => {
      try {
        const now = new Date().toISOString().split('T')[0];
        const data = await this.springBootApiPut(
          `/api/fire-impairment/${id}/cancel`,
          { canceledDate: now }
        );
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Close impairment
    ipcMain.handle(events.IPC_FIRE_IMP_CLOSE, async (_event, id: number) => {
      try {
        const now = new Date().toISOString().split('T')[0];
        const data = await this.springBootApiPut(
          `/api/fire-impairment/${id}/close`,
          { closedDate: now }
        );
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Open FM Global form with auto-fill + button interception
    ipcMain.handle(events.IPC_FIRE_IMP_OPEN_FORM, async (_event, formData: Record<string, string>) => {
      try {
        // open() awaits loadURL which resolves on did-finish-load — landing page is ready
        await this.webview.open('fm-global', 'https://redetag.fmglobal.com');

        // Click "Create New Impairment" and wait for form page to load
        await this.webview.clickFmGlobalCreateButton();

        const fieldsSet = await this.webview.fillFmGlobalForm(formData);
        console.log(`FM Global form: ${fieldsSet} fields populated`);

        // Intercept Back/Submit buttons — broadcast gathered data to renderer
        await this.webview.interceptFmGlobalButtons((data) => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(events.IPC_FIRE_IMP_FORM_SUBMITTED, data);
          }
        });

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerColdResyncHandlers(): void {
    ipcMain.handle(events.IPC_COLD_RESYNC, async () => {
      const deviceMgr = this.springBoot.getDeviceConfigManager();
      const config = deviceMgr.getConfig();
      if (!config) {
        return { success: false, error: 'Device identity not configured' };
      }

      const onProgress = (progress: ColdResyncProgress) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_COLD_RESYNC_PROGRESS, progress);
        }
      };

      return this.coldResyncManager.performColdResync(
        config.syncServerUrl, config.machineId, config.deviceNumber, onProgress
      );
    });
  }

  private registerUpdateHandlers(): void {
    ipcMain.handle(events.IPC_UPDATE_CHECK, async (_event, serverUrl?: string) => {
      // Resolve URL: explicit param > device config > default
      const url = serverUrl || this.getSpringBootManager().getDeviceConfigManager().getConfig()?.syncServerUrl;
      return this.updateManager.checkForUpdate(url);
    });

    ipcMain.handle(events.IPC_UPDATE_DOWNLOAD, async (_event, serverUrl?: string) => {
      const url = serverUrl || this.getSpringBootManager().getDeviceConfigManager().getConfig()?.syncServerUrl;
      const onProgress = (progress: UpdateProgress) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_UPDATE_PROGRESS, progress);
        }
      };
      return this.updateManager.downloadUpdate(url, onProgress);
    });
  }

  private registerSyncHandlers(): void {
    ipcMain.handle(events.IPC_SYNC_GET_STATUS, async () => {
      return this.syncStatusManager.getSyncStatus();
    });

    ipcMain.handle(events.IPC_SYNC_TRIGGER_RESYNC, async () => {
      return this.syncStatusManager.triggerFullResync();
    });

    ipcMain.handle(events.IPC_SYNC_GET_RESYNC_STATUS, async () => {
      return this.syncStatusManager.getResyncStatus();
    });
  }

  /**
   * Make a GET request to the Spring Boot API.
   */
  private springBootApiGet(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: 'localhost',
          port: DEFAULT_SPRING_BOOT_CONFIG.port,
          path,
          method: 'GET',
          timeout: 10000
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve(body);
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      req.end();
    });
  }

  /**
   * Make a PUT request to the Spring Boot API.
   */
  private springBootApiPut(path: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const json = JSON.stringify(data);
      const req = http.request(
        {
          hostname: 'localhost',
          port: DEFAULT_SPRING_BOOT_CONFIG.port,
          path,
          method: 'PUT',
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(json)
          }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve(body);
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      req.write(json);
      req.end();
    });
  }

  /**
   * Make a POST request to the Spring Boot API.
   */
  private springBootApiPost(path: string, data: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const json = JSON.stringify(data);
      const req = http.request(
        {
          hostname: 'localhost',
          port: DEFAULT_SPRING_BOOT_CONFIG.port,
          path,
          method: 'POST',
          timeout: 10000,
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(json)
          }
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => {
            try {
              resolve(JSON.parse(body));
            } catch {
              resolve(body);
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
      req.write(json);
      req.end();
    });
  }

  private registerStartupHandlers(): void {
    // Live-refresh assessment (Sync & Updates page Refresh button)
    ipcMain.handle(events.IPC_STARTUP_GET_ASSESSMENT, async () => {
      try {
        const App = require('../app').default;
        const updated = await App.refreshAssessment();
        return { success: true, data: updated };
      } catch {
        return { success: true, data: this.lastAssessment };
      }
    });

    // Execute selective sync — delegates to the extracted method so the boot-directive auto-apply reuses it.
    ipcMain.handle(events.IPC_SYNC_EXECUTE, async (_event, components: SyncComponent[], options?: SyncOptions) =>
      this.runSyncComponents(components, options));
  }

  /**
   * The full component-sync flow (jar / db / files / resource-packs): stop Spring Boot, apply, restart,
   * bounded mark-synced, and rescue un-pushed local changes. Extracted from the IPC handler so the hub's
   * boot-directive auto-apply ({@link applyBootDirective}) drives the SAME proven path.
   */
  async runSyncComponents(components: SyncComponent[], options?: SyncOptions): Promise<{ success: boolean; error?: string }> {
      const config = this.springBoot.getDeviceConfigManager().getConfig();
      if (!config) return { success: false, error: 'Device not configured' };

      const banner = options?.bannerMessage;
      const sendProgress = (progress: SyncExecuteProgress) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_SYNC_EXECUTE_PROGRESS,
            banner ? { ...progress, bannerMessage: banner } : progress);
        }
      };

      const needsDbOrFiles = components.includes('db') || components.includes('files');
      const sbWasRunning = this.springBoot.isRunning();
      // Boot-directive path applies the update BEFORE Spring Boot starts, so there's no running process to
      // restart — start it once at the end instead. Manual sync keeps the "restart only if it was running".
      const startAtEnd = sbWasRunning || options?.startWhenDone === true;

      try {
        // 1. Stop Spring Boot if DB, files, or JAR sync requested
        //    - DB/files: H2 file is locked while running
        //    - JAR: can't replace a running JAR file
        const needsStop = needsDbOrFiles || components.includes('jar');
        if (needsStop && sbWasRunning) {
          sendProgress({ phase: 'stopping_sb', statusMessage: `Stopping ${APP_DISPLAY_NAME}...`, progressPercent: 0 });
          await this.springBoot.stop();
        }

        // 2. Sync JAR
        if (components.includes('jar')) {
          sendProgress({ phase: 'jar', statusMessage: 'Downloading JAR...', progressPercent: 5 });
          const jarResult = await this.updateManager.downloadUpdate(config.syncServerUrl, (p) => {
            sendProgress({
              phase: 'jar',
              statusMessage: `Downloading JAR... ${p.percent || 0}%`,
              progressPercent: 5 + Math.round((p.percent || 0) * 0.25)
            });
          });
          if (!jarResult.success) throw new Error(jarResult.error || 'JAR download failed');
        }

        // 3. Sync Database
        let dbSyncCutoff: string | undefined;
        let preswapAsidePath: string | undefined; // pre-swap DB copy, for local-change rescue after restart
        if (components.includes('db')) {
          sendProgress({ phase: 'db_download', statusMessage: 'Downloading database...', progressPercent: 30 });
          const dbResult = await this.coldResyncManager.syncDatabase(
            config.syncServerUrl, config.machineId, config.deviceNumber,
            (msg, pct) => sendProgress({
              phase: pct < 70 ? 'db_download' : 'db_extract',
              statusMessage: msg,
              progressPercent: 30 + Math.round(pct * 0.25)
            })
          );
          if (!dbResult.success) throw new Error(dbResult.error || 'Database sync failed');
          dbSyncCutoff = dbResult.syncCutoff;
          preswapAsidePath = dbResult.preswapAsidePath;
        }

        // 4. Sync Files
        if (components.includes('files')) {
          sendProgress({ phase: 'files', statusMessage: 'Downloading files...', progressPercent: 50 });
          const filesResult = await this.coldResyncManager.syncFiles(
            config.syncServerUrl, config.machineId, config.deviceNumber,
            (msg, pct) => sendProgress({
              phase: 'files',
              statusMessage: msg,
              progressPercent: 50 + Math.round(pct * 0.25)
            }),
            options?.cleanFiles ?? false
          );
          if (!filesResult.success) throw new Error(filesResult.error || 'Files sync failed');
        }

        // 5. Sync Resource Packs
        if (components.includes('resource-packs')) {
          sendProgress({ phase: 'resource-packs', statusMessage: 'Syncing resource packs...', progressPercent: 75 });
          const headers = { 'X-Machine-Id': config.machineId, 'X-Device-Number': String(config.deviceNumber) };
          const rpResult = await this.resourcePackManager.syncAllPacks(
            config.syncServerUrl, headers,
            (msg, pct) => sendProgress({
              phase: 'resource-packs',
              statusMessage: msg,
              progressPercent: 75 + Math.round(pct * 0.15)
            })
          );
          if (!rpResult.success) throw new Error(rpResult.error || 'Resource packs sync failed');
        }

        // 6. Clear Chromium cache (stale Angular assets in iframe) and (re)start Spring Boot. `startAtEnd` is
        //    true when SB was running (restart) OR when the boot-directive path asked us to start it fresh.
        if (needsStop && startAtEnd) {
          await session.defaultSession.clearCache();
          sendProgress({ phase: 'starting_sb', statusMessage: `Starting ${APP_DISPLAY_NAME}...`, progressPercent: 95 });
          await this.springBoot.start();
        }

        // After a smart-resync DB replace, tell the hub this client is now fully synced — ONLY here, AFTER
        // the snapshot is confirmed in place (Spring Boot restarted on it). The old
        // FullResyncService.smartResync did this BEFORE the swap, so a silently-failed swap could leave the
        // hub believing the client was caught up → permanently missed changes. Gated to the smart-resync
        // flow (markHubSyncedAfter). Failure is SAFE: pending just isn't cleared and the client catches up
        // incrementally.
        if (options?.markHubSyncedAfter && components.includes('db')) {
          // Use the BOUNDED + async endpoint: mark synced only up to the snapshot's cutoff (so hub changes
          // committed after the snapshot stay pending and still arrive by normal pull) and it returns 202
          // immediately, so a multi-million-row backlog can't time us out.
          // FAIL CLOSED: without the cutoff we cannot safely bound the mark, and the unbounded
          // mark-all-synced would clear changes the hub committed after the snapshot (silent loss). If the
          // X-Sync-Cutoff header didn't arrive (stripped by a proxy, or an older hub), SKIP the notify and let
          // normal incremental pull reconcile — correct, just slower. Never fall back to mark-all-synced here.
          if (!dbSyncCutoff) {
            console.warn('resync: no X-Sync-Cutoff from hub — skipping mark-synced (incremental pull will reconcile the backlog)');
          } else {
            sendProgress({ phase: 'starting_sb', statusMessage: 'Notifying hub…', progressPercent: 97 });
            const notifyPath = `/api/sync/changes/mark-synced-upto?cutoff=${encodeURIComponent(dbSyncCutoff)}`;
            await new Promise<void>((resolve) => {
              try {
                const u = new URL(notifyPath, config.syncServerUrl);
                const mod = u.protocol === 'https:' ? require('https') : require('http');
                const req = mod.request({
                  hostname: u.hostname,
                  port: u.port || (u.protocol === 'https:' ? 443 : 80),
                  path: u.pathname + u.search,
                  method: 'POST',
                  headers: { 'X-Machine-Id': config.machineId },
                  timeout: 20000
                }, (res: any) => { res.resume(); res.on('end', () => resolve()); });
                req.on('error', (e: any) => { console.warn('hub mark-synced after resync failed (client will catch up incrementally):', e?.message || e); resolve(); });
                req.on('timeout', () => { req.destroy(); console.warn('hub mark-synced after resync timed out'); resolve(); });
                req.end();
              } catch (e: any) { console.warn('hub mark-synced after resync error:', e?.message || e); resolve(); }
            });
          }
        }

        // Rescue this client's un-pushed local changes from the pre-swap DB copy, so a full swap can't lose
        // work made while the hub was unreachable. Best-effort: wait for the just-restarted local backend to
        // be ready, POST the preserve endpoint, then delete the aside. Any failure leaves the aside in place
        // (retryable) and never blocks the sync from completing.
        if (components.includes('db') && preswapAsidePath) {
          sendProgress({ phase: 'starting_sb', statusMessage: 'Rescuing local changes…', progressPercent: 98 });
          const localPort = this.springBoot.getStatus().port;
          const ready = await this.waitForLocalBackend(localPort, 90000);
          if (!ready) {
            console.warn('preswap: local backend not ready in time — leaving aside for a later retry:', preswapAsidePath);
          } else {
            try {
              // The preserve endpoint also marks the restored hub snapshot already-on-hub so the client
              // doesn't re-push the hub's whole history back. Generous timeout: that bulk mark can update a
              // large field_change table; the server-side work is idempotent, so a client-side timeout is
              // safe to retry.
              const body = await this.httpPostLocal(localPort,
                `/api/resync/preserve-local-changes?asidePath=${encodeURIComponent(preswapAsidePath)}`, 180000);
              console.log('preswap: preserve result:', body);
              this.coldResyncManager.deleteAside(preswapAsidePath);
            } catch (e: any) {
              console.warn('preswap: preserve call failed (aside kept for retry):', e?.message || e);
            }
          }
        }

        sendProgress({ phase: 'done', statusMessage: 'Sync complete', progressPercent: 100 });

        // Persist sync time and refresh assessment
        try {
          this.syncStatusManager.persistSyncStatus(new Date().toISOString(), 'full');
          const App = require('../app').default;
          await App.refreshAssessment();
        } catch (e) { console.warn('Assessment refresh after sync failed:', e); }

        return { success: true };
      } catch (err: any) {
        const error = err.message || 'Sync failed';
        sendProgress({ phase: 'error', statusMessage: error, progressPercent: 0, error });
        return { success: false, error };
      }
  }

  /**
   * Apply a hub next-boot directive. jar/db/files run through {@link runSyncComponents} (a "db" action uses
   * bounded mark-synced); an "electron" action downloads + applies an Electron self-update, which swaps the
   * whole install and RELAUNCHES via update.cmd. Order: jar/db/files first (app stays up), then ack, then
   * electron LAST (it terminates the app, so nothing may run after a successful apply). Best-effort: if
   * jar/db/files fail the directive is NOT acked and the hub re-offers next boot.
   */
  async applyBootDirective(policy: { id: string; actions: string[]; message?: string }, serverUrl: string, machineId: string): Promise<void> {
    const wanted = new Set((policy.actions || []).map(a => a.toLowerCase()));
    const components: SyncComponent[] = (['jar', 'db', 'files'] as const).filter(c => wanted.has(c));
    const wantsElectron = wanted.has('electron');
    if (components.length === 0 && !wantsElectron) {
      // Nothing this path applies — still ack so it isn't re-offered forever.
      await this.reportDirectiveApplied(serverUrl, machineId, policy.id);
      return;
    }
    // Surface the admin's message: a one-time popup (what the user expects to "pop up") AND a persistent banner
    // in the progress UI for the whole run. Fire-and-forget so it never blocks the update from starting.
    const directiveMessage = (policy.message || '').trim();
    if (directiveMessage && this.mainWindow && !this.mainWindow.isDestroyed()) {
      dialog.showMessageBox(this.mainWindow, {
        type: 'info',
        title: `${APP_DISPLAY_NAME} update`,
        message: `${APP_DISPLAY_NAME} is updating`,
        detail: directiveMessage,
        buttons: ['OK'],
        noLink: true
      }).catch(() => { /* window closed mid-update — ignore */ });
    }

    // 1. jar/db/files (app stays up — runSyncComponents restarts Spring Boot at the end). SKIP the re-apply if
    //    THIS exact directive already ran locally: the ack POST is best-effort (reportDirectiveApplied resolves
    //    even on a network error/timeout), so a lost ack must NOT re-swap the DB on every boot. The persisted id
    //    is the client-side mirror of the hub's lastAppliedDirectiveId.
    const alreadyAppliedLocally = this.readLastAppliedDirectiveId() === policy.id;
    if (components.length > 0 && !alreadyAppliedLocally) {
      console.log(`boot-directive: applying ${components.join(', ')} for id=${policy.id}`);
      const result = await this.runSyncComponents(components, {
        markHubSyncedAfter: components.includes('db'),
        startWhenDone: true,
        bannerMessage: directiveMessage || undefined
      });
      if (!result.success) {
        console.warn(`boot-directive: apply failed (${result.error}) — not acking; hub will re-offer next boot`);
        return;
      }
      this.writeLastAppliedDirectiveId(policy.id); // persist AFTER success, BEFORE the (best-effort) ack
    } else if (alreadyAppliedLocally && components.length > 0) {
      console.log(`boot-directive ${policy.id}: jar/db/files already applied locally — skipping re-apply, re-acking`);
    }

    // 2. Ack (best-effort) — BEFORE any electron update, which terminates the app so we could never ack after.
    //    The local guard above (not this ack) is what prevents a lost ack from re-swapping the DB next boot; the
    //    electron step is separately version-checked so it never re-downloads either.
    await this.reportDirectiveApplied(serverUrl, machineId, policy.id);
    console.log(`boot-directive: applied + reported id=${policy.id}`);

    // 3. Electron LAST — replaces the whole install and relaunches via update.cmd. Best-effort.
    if (wantsElectron) {
      await this.applyElectronDirective(serverUrl, directiveMessage);
    }
  }

  /**
   * Apply the "electron" action of a boot directive: if the hub has a newer Electron build, download it and
   * hand off to {@link ElectronUpdateManager#applyUpdate} — which launches update.cmd, waits for us to exit,
   * swaps the install, and RELAUNCHES the new build. We quit here so that hand-off can proceed. Best-effort:
   * a no-newer-build or a download/apply failure just leaves the current app running (directive already acked).
   */
  private async applyElectronDirective(serverUrl: string, message: string): Promise<void> {
    try {
      const check = await this.electronUpdateManager.checkForUpdate(serverUrl);
      if (!check.success || !check.data?.isNewer) {
        console.log('boot-directive electron: no newer Electron available — nothing to apply');
        return;
      }
      this.sendElectronDirectiveProgress('Downloading application update…', 0, message);
      const dl = await this.electronUpdateManager.downloadUpdate(serverUrl, (p) => {
        if (p.phase === 'downloading') {
          this.sendElectronDirectiveProgress(`Downloading application update… ${p.percent ?? 0}%`, p.percent ?? 0, message);
        }
      });
      if (!dl.success || !this.electronUpdateManager.isUpdateStaged()) {
        console.warn(`boot-directive electron: download/stage failed (${dl.error || 'not staged'}) — skipping the Electron update`);
        return;
      }
      const applied = this.electronUpdateManager.applyUpdate();
      if (!applied.success) {
        console.warn(`boot-directive electron: applyUpdate failed (${applied.error}) — skipping`);
        return;
      }
      // update.cmd is now launched and waiting on our PID. Stop Spring Boot and exit so it can swap + relaunch.
      this.sendElectronDirectiveProgress('Installing application update — restarting…', 100, message);
      try { await this.springBoot.stop(); } catch { /* proceed to exit regardless */ }
      app.exit(0);
    } catch (e: any) {
      console.warn('boot-directive electron: error applying Electron update:', e?.message || e);
    }
  }

  /** Push a boot-directive Electron-update step into the same progress UI the sync flow uses. */
  private sendElectronDirectiveProgress(statusMessage: string, progressPercent: number, bannerMessage: string): void {
    if (this.mainWindow && !this.mainWindow.isDestroyed()) {
      const progress: SyncExecuteProgress = { phase: 'electron', statusMessage, progressPercent };
      if (bannerMessage) progress.bannerMessage = bannerMessage;
      this.mainWindow.webContents.send(events.IPC_SYNC_EXECUTE_PROGRESS, progress);
    }
  }

  /** Client-side mirror of the hub's lastAppliedDirectiveId — persisted so a lost ack can't re-apply a directive. */
  private lastAppliedDirectivePath(): string {
    return path.join(getWorkingDir(), 'last-applied-directive.txt');
  }

  private readLastAppliedDirectiveId(): string | null {
    try {
      const p = this.lastAppliedDirectivePath();
      return fs.existsSync(p) ? (fs.readFileSync(p, 'utf8').trim() || null) : null;
    } catch {
      return null; // unreadable → treat as not-applied (worst case: one extra re-apply, never a skipped one)
    }
  }

  private writeLastAppliedDirectiveId(id: string): void {
    try {
      fs.writeFileSync(this.lastAppliedDirectivePath(), id, 'utf8');
    } catch (e: any) {
      console.warn('boot-directive: could not persist last-applied id (a lost ack could re-apply):', e?.message || e);
    }
  }

  /** POST /api/update/applied to the hub so a db/files directive runs once. Best-effort. */
  private reportDirectiveApplied(serverUrl: string, machineId: string, id: string): Promise<void> {
    return new Promise((resolve) => {
      try {
        const u = new URL('/api/update/applied', serverUrl);
        const mod = u.protocol === 'https:' ? require('https') : require('http');
        const payload = JSON.stringify({ id });
        const req = mod.request({
          hostname: u.hostname, port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname, method: 'POST',
          headers: { 'X-Machine-Id': machineId, 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          timeout: 15000
        }, (res: any) => { res.resume(); res.on('end', () => resolve()); });
        req.on('error', () => resolve());
        req.on('timeout', () => { req.destroy(); resolve(); });
        req.write(payload);
        req.end();
      } catch { resolve(); }
    });
  }

  private registerPermitsHandlers(): void {
    ipcMain.handle(events.IPC_WORK_REQUEST_COUNT, async () => {
      try {
        const [newRes, activeRes] = await Promise.all([
          this.springBootApiGet('/ng/work-requests/get-all-by-status/New'),
          this.springBootApiGet('/ng/work-requests/get-all-by-status/Active')
        ]);
        const newList = newRes?.responseData;
        const activeList = activeRes?.responseData;
        return {
          success: true,
          data: {
            newCount: Array.isArray(newList) ? newList.length : 0,
            activeCount: Array.isArray(activeList) ? activeList.length : 0
          }
        };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_PERMITS_OPEN_MONITOR, async () => {
      try {
        // If window already exists and not destroyed, focus it
        if (this.permitsMonitorWindow && !this.permitsMonitorWindow.isDestroyed()) {
          this.permitsMonitorWindow.focus();
          return { success: true };
        }

        const port = DEFAULT_SPRING_BOOT_CONFIG.port;
        const saved = this.windowLayoutManager.getBounds('permits-monitor');
        this.permitsMonitorWindow = new BrowserWindow({
          width: saved?.width ?? 1200,
          height: saved?.height ?? 800,
          ...(saved ? { x: saved.x, y: saved.y } : {}),
          title: 'Permits Monitor',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false
          }
        });

        if (saved?.isMaximized) {
          this.permitsMonitorWindow.maximize();
        }

        this.windowLayoutManager.trackWindow('permits-monitor', this.permitsMonitorWindow);

        this.permitsMonitorWindow.on('closed', () => {
          this.permitsMonitorWindow = null;
        });

        await this.permitsMonitorWindow.loadURL(`http://localhost:${port}/app/permits-monitor`);
        console.log('[Permits] Monitor window opened');
        return { success: true };
      } catch (error: any) {
        console.error('[Permits] Failed to open monitor window:', error.message);
        return { success: false, error: error.message };
      }
    });
  }

  /**
   * Maximo bundle endpoints — read-only summaries Electron home widgets consume.
   * Forwards to the Spring Boot bundle endpoint, maps to a slim {count, items[]} shape,
   * and sorts by targetStart ascending (oldest scheduled first) so the widget's
   * scrollable list shows the most-overdue work at the top.
   */
  private registerMaximoHandlers(): void {
    ipcMain.handle(events.IPC_MAXIMO_LEAD_OP_SUMMARY, async (_event, status?: string) => {
      try {
        const url = '/ng/maximo/bundle/lead-operators/work-orders'
          + '?pageSize=200'
          + (status ? '&status=' + encodeURIComponent(status) : '');
        const envelope = await this.springBootApiGet(url);
        const list: any[] = Array.isArray(envelope?.responseData) ? envelope.responseData : [];

        const items = list.map(w => ({
          href: w.href,
          wonum: w.wonum,
          description: w.description,
          assetnum: w.assetnum,
          location: w.location,
          leadCraft: w.leadCraft,
          status: w.status,
          priority: w.priority,
          targetStart: w.targetStart,
        }));

        // Oldest target-start first; WOs with no target start sink to the bottom.
        // ISO-8601 strings sort chronologically as plain strings.
        items.sort((a, b) => {
          const at = a.targetStart || '';
          const bt = b.targetStart || '';
          if (!at && !bt) return 0;
          if (!at) return 1;
          if (!bt) return -1;
          return at < bt ? -1 : at > bt ? 1 : 0;
        });

        return { success: true, data: { count: items.length, items } };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Overview: the tracked people (per this device's maximo-overview-config) bucketed by due status.
    // Spring Boot does the bucketing; here we just resolve the config into query params and return it.
    ipcMain.handle(events.IPC_MAXIMO_OVERVIEW, async () => {
      try {
        const cfg = this.maximoOverviewManager.getConfig();
        const mode = cfg.mode === 'people' ? 'people' : 'leads';
        const ids = mode === 'people' ? (cfg.personids ?? []).join(',') : '';
        const url = '/ng/maximo/bundle/overview'
          + '?mode=' + encodeURIComponent(mode)
          + '&pageSize=200'
          + (ids ? '&personids=' + encodeURIComponent(ids) : '');
        const envelope = await this.springBootApiGet(url);
        return { success: true, data: envelope?.responseData ?? null };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_MAXIMO_GET_OVERVIEW_CONFIG, async () => {
      try {
        return { success: true, data: this.maximoOverviewManager.getConfig() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_MAXIMO_SAVE_OVERVIEW_CONFIG, async (_event, config: MaximoOverviewConfig) => {
      try {
        this.maximoOverviewManager.saveConfig(config);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // The people pool for the overview config picker: active users with a resolved Maximo personid.
    ipcMain.handle(events.IPC_MAXIMO_LABOR_PEOPLE, async () => {
      try {
        const envelope = await this.springBootApiGet('/ng/maximo/labor-people');
        const people = Array.isArray(envelope?.responseData) ? envelope.responseData : [];
        return { success: true, data: people };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerGateLogHandlers(): void {
    ipcMain.handle(events.IPC_GATE_LOG_GET_PEOPLE, async () => {
      try {
        return { success: true, data: this.gateLogManager.getCachedPeople() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_GATE_LOG_GET_STATUS, async () => {
      try {
        return { success: true, data: this.gateLogManager.getStatus() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_GATE_LOG_REFRESH, async () => {
      try {
        const people = await this.gateLogManager.refresh();
        // Broadcast update to renderer
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_GATE_LOG_PEOPLE_UPDATED);
        }
        return { success: true, data: people };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_GATE_LOG_SET_AUTO_REFRESH, async (
      _event, enabled: boolean, intervalMinutes?: number
    ) => {
      try {
        this.gateLogManager.setAutoRefresh(enabled, intervalMinutes);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_GATE_LOG_GET_CONFIG, async () => {
      try {
        return { success: true, data: this.gateLogManager.getConfig() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_GATE_LOG_SAVE_CONFIG, async (_event, config: GateLogConfig) => {
      try {
        this.gateLogManager.saveConfig(config);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_GATE_LOG_PRINT, async () => {
      try {
        await this.gateLogManager.print();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_GATE_LOG_GET_CONTRACTOR_DIRECTORY, async () => {
      try {
        return { success: true, data: await this.gateLogManager.getContractorDirectory() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerSdsScrapeHandlers(): void {
    ipcMain.handle(events.IPC_SDS_SCRAPE_RUN, async (_event, opts?: any) => {
      try {
        const status = await this.webViewSdsManager.scrape(opts);
        return { success: !status.error, data: status, error: status.error };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_GAP_REPORT, async (_event, opts?: any) => {
      try {
        const report = await this.webViewSdsManager.getGapReport(opts);
        return { success: true, data: report };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_SCRAPE_ABORT, async () => {
      try {
        this.webViewSdsManager.requestAbort();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_MATCH_CHEMICAL, async (_event, payload: any) => {
      try {
        const data = await this.webViewSdsManager.matchChemical(payload);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_EMAIL_GAP_REPORT, async (_event, payload: any) => {
      try {
        const data = await this.webViewSdsManager.emailGapReport(payload);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_GET_EMAIL_RECIPIENTS, async () => {
      try {
        const data = await this.webViewSdsManager.getEmailRecipients();
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_SYNC_PDFS, async (_event, opts: any) => {
      try {
        const data = await this.webViewSdsManager.syncPdfs(opts);
        return { success: true, data };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_CLEAR_PDFS, async () => {
      try {
        const count = await this.webViewSdsManager.clearAllPdfs();
        return { success: true, data: count };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_SCRAPE_GET_STATUS, async () => {
      try {
        return { success: true, data: this.webViewSdsManager.getStatus() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_SCRAPE_GET_CONFIG, async () => {
      try {
        return { success: true, data: this.webViewSdsManager.getConfig() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_SDS_SCRAPE_SAVE_CONFIG, async (_event, config: SdsScraperConfig) => {
      try {
        this.webViewSdsManager.saveConfig(config);
        return { success: true, data: this.webViewSdsManager.getConfig() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerWebViewAmsHandlers(): void {
    ipcMain.handle(events.IPC_WEBVIEW_AMS_GET_REPORTS, async () => {
      try {
        return { success: true, data: this.webViewAmsManager.getCachedReports() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_GET_STATUS, async () => {
      try {
        return { success: true, data: this.webViewAmsManager.getStatus() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_REFRESH, async () => {
      try {
        const reports = await this.webViewAmsManager.refresh();
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_WEBVIEW_AMS_UPDATED);
        }
        // A failed scrape returns the (possibly stale) cached reports — surface
        // the error so the renderer can show it instead of looking successful.
        const status = this.webViewAmsManager.getStatus();
        return { success: !status.error, data: reports, error: status.error };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_GET_CONFIG, async () => {
      try {
        return { success: true, data: this.webViewAmsManager.getConfig() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_SAVE_CONFIG, async (_event, config: WebViewAmsConfig) => {
      try {
        this.webViewAmsManager.saveConfig(config);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_SET_AUTO_REFRESH, async (_event, enabled: boolean) => {
      try {
        this.webViewAmsManager.setAutoRefresh(enabled);
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_WIRED_GET, async () => {
      try {
        return { success: true, data: this.webViewAmsManager.getWiredItems() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_WIRED_ADD, async (
      _event, reportKey: string, mode: 'column' | 'row', key: string
    ) => {
      try {
        return { success: true, data: this.webViewAmsManager.addWiredItem(reportKey, mode, key) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_WIRED_REMOVE, async (_event, id: string) => {
      try {
        return { success: true, data: this.webViewAmsManager.removeWiredItem(id) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_HISTORY_LIST, async () => {
      try {
        return { success: true, data: await this.webViewAmsManager.getHistoryList() };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_WEBVIEW_AMS_HISTORY_GET, async (_event, id: number) => {
      try {
        return { success: true, data: await this.webViewAmsManager.getHistoryReport(id) };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerWeatherHandlers(): void {
    ipcMain.handle(events.IPC_WEATHER_GET_STATUS, () => {
      return {
        success: true,
        data: this.weatherManager.getStatus(),
        intervalSeconds: this.weatherManager.getIntervalSeconds()
      };
    });

    ipcMain.handle(events.IPC_WEATHER_REFRESH, () => {
      this.weatherManager.refresh();
      return { success: true };
    });

    ipcMain.handle(events.IPC_WEATHER_SET_INTERVAL, (_event, seconds: number) => {
      this.weatherManager.setScrapeInterval(seconds);
      return { success: true, intervalSeconds: this.weatherManager.getIntervalSeconds() };
    });

    ipcMain.handle(events.IPC_WEATHER_GET_ENABLED, () => {
      return { success: true, enabled: this.weatherManager.isEnabled() };
    });

    ipcMain.handle(events.IPC_WEATHER_SET_ENABLED, (_event, enabled: boolean) => {
      this.weatherManager.setEnabled(enabled === true);
      return { success: true, enabled: this.weatherManager.isEnabled() };
    });

    ipcMain.handle(events.IPC_WEATHER_GET_FORECAST, () => {
      return { success: true, data: this.weatherManager.getForecast() };
    });

    ipcMain.handle(events.IPC_WEATHER_REFRESH_FORECAST, () => {
      this.weatherManager.refreshForecast();
      return { success: true };
    });
  }

  private registerPerryWeatherHandlers(): void {
    ipcMain.handle(events.IPC_PERRY_GET_STATUS, () => {
      return {
        success: true,
        data: this.perryWeatherManager.getStatus(),
        intervalSeconds: this.perryWeatherManager.getIntervalSeconds()
      };
    });

    ipcMain.handle(events.IPC_PERRY_REFRESH, () => {
      this.perryWeatherManager.refresh();
      return { success: true };
    });

    ipcMain.handle(events.IPC_PERRY_SET_INTERVAL, (_event, seconds: number) => {
      this.perryWeatherManager.setScrapeInterval(seconds);
      return { success: true, intervalSeconds: this.perryWeatherManager.getIntervalSeconds() };
    });
  }

  private registerPjmHandlers(): void {
    ipcMain.handle(events.IPC_PJM_GET_STATUS, () => {
      return { success: true, data: this.pjmManager.getStatus(), polling: this.pjmManager.isPolling() };
    });

    ipcMain.handle(events.IPC_PJM_SHOW_WINDOW, () => {
      this.pjmManager.showWindow();
      return { success: true };
    });

    ipcMain.handle(events.IPC_PJM_REFRESH, () => {
      this.pjmManager.refresh();
      return { success: true };
    });

    ipcMain.handle(events.IPC_PJM_SET_POLLING, (_event, enabled: boolean) => {
      if (enabled) {
        this.pjmManager.start();
      } else {
        this.pjmManager.stop();
      }
      return { success: true, polling: this.pjmManager.isPolling() };
    });

    ipcMain.handle(events.IPC_PJM_GET_CONFIG, () => {
      return { success: true, data: this.pjmManager.getConfig() };
    });

    ipcMain.handle(events.IPC_PJM_SAVE_CONFIG, (_event, config: any) => {
      this.pjmManager.saveConfig(config);
      return { success: true, data: this.pjmManager.getConfig(), polling: this.pjmManager.isPolling() };
    });

    // Day-Ahead Awards (read-only — data comes from SharePoint via Power Automate)
    ipcMain.handle(events.IPC_PJM_DA_FETCH, async () => {
      try {
        const awards = await this.pjmManager.fetchDaAwards();
        return { success: true, data: awards };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PJM_DA_REFRESH, async () => {
      try {
        const awards = await this.pjmManager.fetchDaAwards(true);
        return { success: true, data: awards };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });
  }

  private registerElectronUpdateHandlers(): void {
    ipcMain.handle(events.IPC_ELECTRON_UPDATE_CHECK, async (_event, serverUrl?: string) => {
      try {
        const url = serverUrl || this.springBoot.getDeviceConfigManager().getConfig()?.syncServerUrl;
        return await this.electronUpdateManager.checkForUpdate(url);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_ELECTRON_UPDATE_DOWNLOAD, async (_event, serverUrl?: string) => {
      try {
        const url = serverUrl || this.springBoot.getDeviceConfigManager().getConfig()?.syncServerUrl;
        const onProgress = (progress: ElectronUpdateProgress) => {
          if (this.mainWindow && !this.mainWindow.isDestroyed()) {
            this.mainWindow.webContents.send(events.IPC_ELECTRON_UPDATE_PROGRESS, progress);
          }
        };
        return await this.electronUpdateManager.downloadUpdate(url, onProgress);
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    ipcMain.handle(events.IPC_ELECTRON_UPDATE_APPLY, async () => {
      try {
        const result = this.electronUpdateManager.applyUpdate();
        if (result.success) {
          // Batch script is launched and waiting for our PID to exit.
          // Safety timeout: ensure app.exit() runs even if springBoot.stop() hangs.
          const exitTimeout = setTimeout(() => {
            console.log('Safety timeout: forcing app exit for update');
            app.exit(0);
          }, 15000);

          try {
            await this.springBoot.stop();
          } catch (err) {
            console.warn('Error stopping Spring Boot during update (proceeding with exit):', err);
          }

          clearTimeout(exitTimeout);
          app.exit(0);
        }
        return result;
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerMenuHandlers(): void {
    ipcMain.handle(events.IPC_MENU_POPUP, (_event, menuId: string, x: number, y: number) => {
      const springBoot = this.springBoot;
      const status = springBoot.getStatus();
      const isRunning = status.state === 'running';
      const isStopped = status.state === 'stopped' || status.state === 'error';
      const win = this.mainWindow;

      let template: MenuItemConstructorOptions[] = [];

      switch (menuId) {
        case 'file':
          template = [
            {
              label: 'Settings',
              accelerator: 'CmdOrCtrl+,',
              click: () => {
                if (win && !win.isDestroyed()) {
                  win.webContents.send(events.IPC_MENU_NAVIGATE, '/settings');
                }
              }
            },
            { type: 'separator' },
            {
              label: 'Clear Application Data...',
              click: async () => {
                const { getWorkingDir } = require('../paths');
                const workingDir = getWorkingDir();
                const { response } = await dialog.showMessageBox(win, {
                  type: 'warning',
                  title: 'Clear Application Data',
                  message: 'This will delete all downloaded data:',
                  detail: `• JAR file\n• Database\n• Uploaded files\n• Device configuration\n\nLocation: ${workingDir}\n\nJG Portal will be stopped. You will need to sync again after clearing.`,
                  buttons: ['Cancel', 'Clear Data'],
                  defaultId: 0,
                  cancelId: 0
                });
                if (response === 1) {
                  try {
                    if (springBoot.isRunning()) await springBoot.stop();
                    const fs = require('fs');
                    if (fs.existsSync(workingDir)) {
                      fs.rmSync(workingDir, { recursive: true, force: true });
                      fs.mkdirSync(workingDir, { recursive: true });
                    }
                    try { const App = require('../app').default; App.createMenu(); } catch {}
                    dialog.showMessageBox(win, {
                      type: 'info', title: 'Data Cleared',
                      message: 'Application data has been cleared.',
                      detail: 'Restart the app or sync again to re-download data.'
                    });
                  } catch (err: any) {
                    dialog.showMessageBox(win, {
                      type: 'error', title: 'Error',
                      message: 'Failed to clear data', detail: err.message
                    });
                  }
                }
              }
            },
            {
              label: 'Open Data Folder',
              click: () => {
                const { getWorkingDir } = require('../paths');
                shell.openPath(getWorkingDir());
              }
            },
            { type: 'separator' },
            {
              label: 'Exit',
              accelerator: 'CmdOrCtrl+Q',
              click: () => win?.close()
            }
          ];
          break;

        case 'app':
          template = [
            {
              label: 'Start',
              enabled: isStopped,
              click: async () => {
                try {
                  await springBoot.start();
                  try { const App = require('../app').default; App.createMenu(); } catch {}
                } catch (e) { console.error('Failed to start:', e); }
              }
            },
            {
              label: 'Stop',
              enabled: isRunning || status.state === 'starting',
              click: async () => {
                try {
                  await springBoot.stop();
                  try { const App = require('../app').default; App.createMenu(); } catch {}
                } catch (e) { console.error('Failed to stop:', e); }
              }
            },
            {
              label: 'Restart',
              enabled: isRunning,
              click: async () => {
                try {
                  await springBoot.restart();
                  try { const App = require('../app').default; App.createMenu(); } catch {}
                } catch (e) { console.error('Failed to restart:', e); }
              }
            },
            { type: 'separator' },
            {
              label: `Open in Browser (port ${DEFAULT_SPRING_BOOT_CONFIG.port})`,
              enabled: isRunning,
              click: () => shell.openExternal(`http://localhost:${DEFAULT_SPRING_BOOT_CONFIG.port}`)
            }
          ];
          break;

        case 'view':
          template = [
            { role: 'reload' },
            { role: 'forceReload' },
            { type: 'separator' },
            { role: 'toggleDevTools' },
            { type: 'separator' },
            { role: 'resetZoom' },
            { role: 'zoomIn' },
            { role: 'zoomOut' },
            { type: 'separator' },
            { role: 'togglefullscreen' }
          ];
          break;

        case 'help':
          template = [
            {
              label: 'Open Guides',
              click: () => {
                const { getGuidesPath } = require('../paths');
                shell.openPath(getGuidesPath());
              }
            },
            { type: 'separator' },
            {
              label: 'About',
              click: () => {
                dialog.showMessageBox(win, {
                  type: 'info',
                  title: 'About DK Power Manager',
                  message: 'DK Power Manager',
                  detail: `Version: ${app.getVersion()}\n\nManages ${APP_DISPLAY_NAME} application.`
                });
              }
            }
          ];
          break;
      }

      if (template.length > 0) {
        const menu = Menu.buildFromTemplate(template);
        menu.popup({ window: win, x, y });
      }
    });
  }

  private registerPrintHandlers(): void {
    // Print the current page (main window) with proper settings
    ipcMain.handle(events.IPC_PRINT_CURRENT_PAGE, async (_event, options?: { silent?: boolean }) => {
      try {
        const win = this.mainWindow;
        if (!win || win.isDestroyed()) {
          return { success: false, error: 'Main window not available' };
        }

        return new Promise((resolve) => {
          win.webContents.print(
            {
              silent: options?.silent ?? false,
              printBackground: true,
              margins: { marginType: 'none' },
            },
            (success, failureReason) => {
              resolve({
                success,
                error: success ? undefined : (failureReason || 'Print failed'),
              });
            }
          );
        });
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Print arbitrary HTML content — opens a visible preview window.
    // The page should include a "Print" button calling window.print() for Chromium's dialog (with preview).
    ipcMain.handle(events.IPC_PRINT_HTML, async (_event, html: string, _options?: { silent?: boolean }) => {
      try {
        const win = new BrowserWindow({
          width: 900,
          height: 700,
          title: 'Print Preview',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
          },
        });

        win.setMenuBarVisibility(false);
        await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });

    // Print with preview — generate PDF from current page and show in a preview window
    ipcMain.handle(events.IPC_PRINT_WITH_PREVIEW, async (_event, options?: { landscape?: boolean }) => {
      try {
        const win = this.mainWindow;
        if (!win || win.isDestroyed()) {
          return { success: false, error: 'Main window not available' };
        }

        const pdfBuffer = await win.webContents.printToPDF({
          printBackground: true,
          landscape: options?.landscape ?? false,
          margins: { marginType: 'none' },
        });

        const tempPath = path.join(app.getPath('temp'), `print-preview-${Date.now()}.pdf`);
        fs.writeFileSync(tempPath, pdfBuffer);

        const previewWin = new BrowserWindow({
          width: 900,
          height: 700,
          title: 'Print Preview',
          webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            plugins: true,
          },
        });
        previewWin.setMenuBarVisibility(false);

        await previewWin.loadFile(tempPath);

        previewWin.on('closed', () => {
          try { fs.unlinkSync(tempPath); } catch { /* ignore cleanup errors */ }
        });

        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  private registerLayoutHandlers(): void {
    ipcMain.handle(events.IPC_LAYOUT_SAVE, async () => {
      try {
        this.saveAllWindowLayouts();
        return { success: true };
      } catch (error: any) {
        return { success: false, error: error.message };
      }
    });
  }

  /** Save layout of all tracked windows (main, permits, voyager). */
  public saveAllWindowLayouts(): void {
    const windows: Record<string, BrowserWindow | null> = {
      'main': this.mainWindow,
      'permits-monitor': this.permitsMonitorWindow,
      'pjm-voyager': this.pjmManager.getVoyagerWindow(),
    };
    this.windowLayoutManager.saveAll(windows);
  }

  /** Restore secondary windows that were open at last quit. */
  public restoreSecondaryWindows(): void {
    const openWindows = this.windowLayoutManager.getOpenWindows();
    if (openWindows.length === 0) return;

    console.log(`[Layout] Restoring secondary windows: [${openWindows.join(', ')}]`);

    for (const id of openWindows) {
      switch (id) {
        case 'permits-monitor':
          this.restorePermitsMonitor();
          break;
        case 'pjm-voyager':
          this.pjmManager.showWindow();
          break;
        default:
          console.log(`[Layout] Unknown window ID '${id}' — skipping`);
      }
    }
  }

  /** Restore permits monitor: open with waiting page, navigate when Spring Boot is healthy. */
  private restorePermitsMonitor(): void {
    if (this.permitsMonitorWindow && !this.permitsMonitorWindow.isDestroyed()) {
      this.permitsMonitorWindow.focus();
      return;
    }

    const saved = this.windowLayoutManager.getBounds('permits-monitor');
    this.permitsMonitorWindow = new BrowserWindow({
      width: saved?.width ?? 1200,
      height: saved?.height ?? 800,
      ...(saved ? { x: saved.x, y: saved.y } : {}),
      title: 'Permits Monitor',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
      },
    });

    if (saved?.isMaximized) {
      this.permitsMonitorWindow.maximize();
    }

    this.windowLayoutManager.trackWindow('permits-monitor', this.permitsMonitorWindow);

    this.permitsMonitorWindow.on('closed', () => {
      this.permitsMonitorWindow = null;
    });

    // Check if Spring Boot is already healthy
    const status = this.springBoot.getStatus();
    if (status.state === 'running' && status.healthStatus === 'healthy') {
      const port = DEFAULT_SPRING_BOOT_CONFIG.port;
      this.permitsMonitorWindow.loadURL(`http://localhost:${port}/app/permits-monitor`);
      console.log('[Permits] Monitor window restored (Spring Boot already healthy)');
      return;
    }

    // Load waiting page
    const waitingHtml = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Permits Monitor</title>
<style>body{margin:0;background:#1a1a2e;color:#e2e8f0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;display:flex;align-items:center;justify-content:center;height:100vh}
.c{text-align:center}h2{font-size:24px;margin-bottom:12px;color:#a78bfa}p{font-size:16px;color:#94a3b8}
.s{width:40px;height:40px;border:3px solid #334155;border-top-color:#a78bfa;border-radius:50%;animation:spin 1s linear infinite;margin:20px auto}
@keyframes spin{to{transform:rotate(360deg)}}</style></head>
<body><div class="c"><h2>Permits Monitor</h2><p>Waiting for ${APP_DISPLAY_NAME} to start...</p><div class="s"></div></div></body></html>`;

    this.permitsMonitorWindow.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(waitingHtml)}`);
    console.log('[Permits] Monitor window restored — waiting for Spring Boot');

    // Poll for Spring Boot health every 3 seconds
    const win = this.permitsMonitorWindow;
    const pollInterval = setInterval(() => {
      if (!win || win.isDestroyed()) {
        clearInterval(pollInterval);
        return;
      }
      const currentStatus = this.springBoot.getStatus();
      if (currentStatus.state === 'running' && currentStatus.healthStatus === 'healthy') {
        clearInterval(pollInterval);
        const port = DEFAULT_SPRING_BOOT_CONFIG.port;
        win.loadURL(`http://localhost:${port}/app/permits-monitor`);
        console.log('[Permits] Spring Boot healthy — loading permits monitor');
      }
    }, 3000);

    // Safety: stop polling after 5 minutes
    setTimeout(() => clearInterval(pollInterval), 300000);
  }

  private registerVoskHandlers(): void {
    ipcMain.handle(events.IPC_VOSK_START, () => {
      return this.voskManager.start();
    });

    ipcMain.handle(events.IPC_VOSK_STOP, () => {
      return this.voskManager.stop();
    });

    ipcMain.handle(events.IPC_VOSK_GET_STATUS, () => {
      return { success: true, data: this.voskManager.getStatus() };
    });

    // One-way channel: renderer sends audio chunks rapidly, no response needed
    ipcMain.on(events.IPC_VOSK_AUDIO_CHUNK, (_event, buffer: Buffer) => {
      this.voskManager.feedAudio(Buffer.from(buffer));
    });
  }

  public async cleanup(): Promise<void> {
    this.gateLogManager.cleanup();
    this.webViewAmsManager.cleanup();
    this.weatherManager.cleanup();
    this.perryWeatherManager.cleanup();
    this.pjmManager.cleanup();
    this.voskManager.cleanup();
    this.newsManager.cleanup();
    this.syncUpdateManager.disconnect();
    this.webview.closeAll();
    await this.springBoot.stop();
  }

  private registerNewsHandlers(): void {
    ipcMain.handle(events.IPC_NEWS_LIST, async () => {
      try {
        // Serve cache immediately; if empty (first open before the first poll completes), fetch once.
        const cached = this.newsManager.getFeed();
        const data = cached.length ? cached : await this.newsManager.refresh();
        return { success: true, data };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_NEWS_REFRESH, async () => {
      try {
        return { success: true, data: await this.newsManager.refresh() };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });
  }

  private registerPersonnelHandlers(): void {
    ipcMain.handle(events.IPC_PERSONNEL_GET_STATUS, async () => {
      try {
        const status = await this.personnelManager.getPersonnelStatus();
        return { success: true, data: status };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_REFRESH, async () => {
      try {
        const status = await this.personnelManager.refresh();
        return { success: true, data: status };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_GET_CONTACTS, async () => {
      try {
        const contacts = await this.personnelManager.getContacts();
        return { success: true, data: contacts };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_GET_CONFIG, async () => {
      try {
        return { success: true, data: this.personnelManager.getConfig() };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_SAVE_CONFIG, async (_evt, config) => {
      try {
        this.personnelManager.saveConfig(config);
        return { success: true, data: this.personnelManager.getConfig() };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_GET_META, async () => {
      try {
        return { success: true, data: this.personnelManager.getMeta() };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_COVERAGE_DAY, async (_evt, date: string) => {
      try {
        return { success: true, data: await this.personnelManager.getCoverageForDay(date) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_COVERAGE_SIGNUP,
      async (_evt, coverageRequestId: number, date: string, signAsToken?: string) => {
        try {
          return { success: true, data: await this.personnelManager.coverageSignup(coverageRequestId, date, signAsToken) };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      });

    ipcMain.handle(events.IPC_PERSONNEL_COVERAGE_SIGNUPS, async (_evt, from: string, to: string) => {
      try {
        return { success: true, data: await this.personnelManager.getCoverageSignups(from, to) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_COVERAGE_ELIGIBILITY, async (_evt, from: string, to: string) => {
      try {
        return { success: true, data: await this.personnelManager.getCoverageEligibility(from, to) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_COVERAGE_ELIGIBILITY_DETAIL, async (_evt, from: string, to: string) => {
      try {
        return { success: true, data: await this.personnelManager.getEligibilityDetail(from, to) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_PERSONNEL_COVERAGE_QUICK_SIGNUP,
      async (_evt, date: string, shift?: 'DAY' | 'NIGHT', signAsToken?: string) => {
        try {
          return { success: true, data: await this.personnelManager.quickSignUp(date, shift, signAsToken) };
        } catch (err: any) {
          return { success: false, error: err.message };
        }
      });

    ipcMain.handle(events.IPC_PERSONNEL_COVERAGE_WITHDRAW, async (_evt, signupId: number, signAsToken?: string) => {
      try {
        return { success: true, data: await this.personnelManager.withdrawSignup(signupId, signAsToken) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_AUTH_STEP_UP, async (_evt, code: string) => {
      try {
        return { success: true, data: await this.personnelManager.stepUpAuthorize(code) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    // TOI/TMOD file listing with metadata extraction
    ipcMain.handle(events.IPC_TOI_LIST_FILES, async () => {
      try {
        const XLSX = require('xlsx');
        const files = await this.sharepointManager.listFiles(
          '/sites/JG/External/60 - Operations/60.11 TIO-TMOD/60.20.01 Active TOI-TMOD'
        );
        // Filter to Excel files and enrich with parsed metadata
        const excelFiles = files.filter(f =>
          f.name.toLowerCase().endsWith('.xlsx') || f.name.toLowerCase().endsWith('.xls')
        );
        const enriched = await Promise.all(excelFiles.map(async (f) => {
          try {
            // SharePoint can't resolve files with # in names via REST API — skip download
            if (f.name.includes('#')) {
              return { ...f, title: f.name.replace(/\.xlsx?$/i, ''), originator: '', date: '', instructions: '' };
            }
            const buffer = await this.sharepointManager.downloadFile(f.serverRelativeUrl);
            const wb = XLSX.read(buffer, { type: 'buffer' });
            const formSheet = wb.Sheets['Form'] || wb.Sheets[wb.SheetNames[0]];
            if (!formSheet) return { ...f, title: '', originator: '', date: '', instructions: '' };
            const data: any[][] = XLSX.utils.sheet_to_json(formSheet, { header: 1, defval: '' });

            // Labels are in cols A-D, values start from col D-E onwards
            // Scan cols 2-10 to find the first non-empty value that isn't a known label
            const labels = new Set(['sequential no.#:', 'date:', 'risk assessment:', 'number from log:',
              'originator:', 'title:', 'toi/tmod instructions:', 'toi/tmod', 'instructions:',
              'risk identified:', 'countermeasures/', 'controls:', 'record', 'type:', 'check rpn*',
              'description', 'part i', 'part ii']);
            const getRowValue = (row: number): string => {
              if (!data[row]) return '';
              for (let c = 2; c < Math.min(data[row].length, 15); c++) {
                const v = String(data[row][c] || '').trim();
                if (v && !labels.has(v.toLowerCase())) return v;
              }
              return '';
            };

            const title = getRowValue(11);        // Row 12 (0-indexed 11): Title
            const originator = getRowValue(10);    // Row 11 (0-indexed 10): Originator
            const date = getRowValue(8);           // Row 9 (0-indexed 8): Date
            const instructions = getRowValue(12);  // Row 13 (0-indexed 12): Instructions

            return { ...f, title, originator, date, instructions };
          } catch (err: any) {
            console.warn(`[TOI] Failed to parse ${f.name}:`, err.message);
            return { ...f, title: '', originator: '', date: '', instructions: '' };
          }
        }));
        // Sort newest first by file name. Normalize first: filenames mix two
        // conventions ("TOI- TMOD" with a space and "TOI-TMOD" without), and a
        // raw compare would clump all space-variant names before the others.
        // Stripping whitespace + lowercasing makes the year-number the real key.
        // b vs a => descending => newest TOI/TMOD numbers on top.
        const sortKey = (n: string) => n.replace(/\s+/g, '').toLowerCase();
        enriched.sort((a, b) =>
          sortKey(b.name).localeCompare(sortKey(a.name), undefined, { numeric: true })
        );
        console.log(`[TOI] Loaded ${enriched.length} files with metadata`);
        return { success: true, data: enriched };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CORK_BOARD_LIST_ITEMS, async () => {
      try {
        const files = await this.sharepointManager.listFiles(CORK_BOARD_FOLDER);
        const mediaFiles = files
          .map(file => {
            const lower = file.name.toLowerCase();
            if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) {
              return { file, kind: 'image' as const, mimeType: 'image/jpeg' };
            }
            if (lower.endsWith('.pdf')) {
              return { file, kind: 'pdf' as const, mimeType: 'application/pdf' };
            }
            return null;
          })
          .filter((entry): entry is { file: typeof files[number]; kind: 'image' | 'pdf'; mimeType: string } => entry !== null);

        const items = await Promise.all(mediaFiles.map(async ({ file, kind, mimeType }) => {
          try {
            const parsed = this.parseCorkBoardFileName(file.name);
            if (this.isCorkBoardItemExpired(parsed.expiresOn)) {
              return null;
            }
            const buffer = await this.sharepointManager.downloadFile(file.serverRelativeUrl);
            return {
              ...file,
              ...parsed,
              kind,
              mimeType,
              dataUrl: `data:${mimeType};base64,${buffer.toString('base64')}`,
            } satisfies CorkBoardItem;
          } catch (err: any) {
            console.warn(`[CorkBoard] Failed to load ${file.name}:`, err.message);
            return null;
          }
        }));

        const loadedItems = items
          .filter((item): item is CorkBoardItem => item !== null)
          .sort((a, b) => this.compareCorkBoardItems(a, b));

        console.log(`[CorkBoard] Loaded ${loadedItems.length} media items`);
        return { success: true, data: loadedItems };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CORK_BOARD_LIST_ACTIONS, async () => {
      try {
        await this.ensureCorkBoardActionLists();
        const actions = await this.loadCorkBoardActions();
        return { success: true, data: actions };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CORK_BOARD_CREATE_ACTION, async (_event, request: CorkBoardActionCreateRequest) => {
      try {
        await this.ensureCorkBoardActionLists();
        const normalized = this.normalizeCorkBoardActionRequest(request);
        const now = new Date().toISOString();
        const fields: Record<string, unknown> = {
          Title: normalized.title,
          ActionType: normalized.type,
          ActionDescription: normalized.description || '',
          ActionOptionsJson: JSON.stringify(normalized.options || []),
          ActionActive: normalized.active !== false,
          ActionCreatedBy: normalized.createdBy || '',
          ActionCreatedAt: now,
        };
        if (normalized.expiresOn) {
          fields.ActionExpiresOn = `${normalized.expiresOn}T12:00:00Z`;
        }

        const id = await this.sharepointManager.createListItem(CORK_BOARD_ACTIONS_LIST, fields);
        console.log(`[CorkBoard] Created action item ${id}: ${normalized.title}`);
        return { success: true, data: { id } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CORK_BOARD_SUBMIT_ACTION, async (_event, request: CorkBoardActionSubmitRequest) => {
      try {
        await this.ensureCorkBoardActionLists();
        const normalized = this.normalizeCorkBoardActionResponseRequest(request);
        const now = new Date().toISOString();
        const fields: Record<string, unknown> = {
          Title: `${normalized.actionTitle} - ${normalized.responderName}`,
          ActionId: normalized.actionId,
          ActionTitle: normalized.actionTitle,
          ResponderName: normalized.responderName,
          ResponseValue: normalized.responseValue,
          ResponseComment: normalized.comment || '',
          SubmittedAt: now,
        };

        const existing = await this.sharepointManager.getListItems(
          CORK_BOARD_RESPONSES_LIST,
          `$filter=ActionId eq '${this.escapeODataString(normalized.actionId)}' and ResponderName eq '${this.escapeODataString(normalized.responderName)}'&$top=1`
        );
        const existingId = existing[0]?.ID ?? existing[0]?.Id;
        if (existingId != null) {
          await this.sharepointManager.updateListItem(CORK_BOARD_RESPONSES_LIST, existingId, fields);
          console.log(`[CorkBoard] Updated response for action ${normalized.actionId} by ${normalized.responderName}`);
          return { success: true, data: { id: String(existingId), updated: true } };
        }

        const id = await this.sharepointManager.createListItem(CORK_BOARD_RESPONSES_LIST, fields);
        console.log(`[CorkBoard] Created response ${id} for action ${normalized.actionId}`);
        return { success: true, data: { id, updated: false } };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });
  }

  private parseCorkBoardFileName(name: string): Pick<CorkBoardItem, 'displayName' | 'sortOrder' | 'expiresOn' | 'important' | 'pinned'> {
    const extensionless = name.replace(/\.[^.]+$/, '');
    const important = /\b(?:important|urgent)\b/i.test(extensionless);
    const pinned = /\b(?:pin|pinned)\b/i.test(extensionless);
    const expiresOn = this.parseCorkBoardExpirationDate(extensionless);
    const orderMatch =
      extensionless.match(/\b(?:order|index|sort)\s*[-_ ]?\s*(\d{1,4})\b/i) ||
      extensionless
        .replace(/\b(?:important|urgent|pin|pinned)\b/gi, '')
        .replace(/\b(?:expires|expire|exp)\s*[-_: ]?\s*\d{4}[-_.]\d{1,2}[-_.]\d{1,2}\b/gi, '')
        .replace(/^[\s\-_.:#()\[\]]+/, '')
        .match(/^(\d{1,4})(?:\s*[-_.):]+|\s+|$)/);

    const sortOrder = orderMatch ? Number(orderMatch[1]) : undefined;
    let displayName = extensionless
      .replace(/\b(?:order|index|sort)\s*[-_ ]?\s*\d{1,4}\b/gi, '')
      .replace(/\b(?:expires|expire|exp)\s*[-_: ]?\s*\d{4}[-_.]\d{1,2}[-_.]\d{1,2}\b/gi, '')
      .replace(/\b(?:important|urgent|pin|pinned)\b/gi, '')
      .replace(/^[\s\-_.:#()\[\]]*\d{1,4}(?:\s*[-_.):]+|\s+|$)/, '')
      .replace(/^[\s\-_.:#()\[\]]+/, '')
      .replace(/[\s\-_.:#()\[\]]+$/, '')
      .replace(/\s{2,}/g, ' ')
      .trim();

    if (!displayName) {
      displayName = extensionless.trim() || name;
    }

    return { displayName, sortOrder, expiresOn, important, pinned };
  }

  private parseCorkBoardExpirationDate(value: string): string | undefined {
    const match = value.match(/\b(?:expires|expire|exp)\s*[-_: ]?\s*(\d{4})[-_.](\d{1,2})[-_.](\d{1,2})\b/i);
    if (!match) return undefined;

    const year = Number(match[1]);
    const month = Number(match[2]);
    const day = Number(match[3]);
    const parsed = new Date(year, month - 1, day);
    if (
      parsed.getFullYear() !== year ||
      parsed.getMonth() !== month - 1 ||
      parsed.getDate() !== day
    ) {
      return undefined;
    }

    return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  private isCorkBoardItemExpired(expiresOn?: string): boolean {
    if (!expiresOn) return false;
    const match = expiresOn.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) return false;

    const expiryDate = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return expiryDate < today;
  }

  private compareCorkBoardItems(a: CorkBoardItem, b: CorkBoardItem): number {
    const attentionA = a.important || a.pinned ? 0 : 1;
    const attentionB = b.important || b.pinned ? 0 : 1;
    if (attentionA !== attentionB) return attentionA - attentionB;

    const orderA = a.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const orderB = b.sortOrder ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;

    const modifiedA = new Date(a.modified).getTime();
    const modifiedB = new Date(b.modified).getTime();
    if (Number.isFinite(modifiedA) && Number.isFinite(modifiedB) && modifiedA !== modifiedB) {
      return modifiedB - modifiedA;
    }

    return a.displayName.localeCompare(b.displayName, undefined, { numeric: true, sensitivity: 'base' });
  }

  private async ensureCorkBoardActionLists(): Promise<void> {
    await this.sharepointManager.ensureList(CORK_BOARD_ACTIONS_LIST, CORK_BOARD_ACTION_FIELDS);
    await this.sharepointManager.ensureList(CORK_BOARD_RESPONSES_LIST, CORK_BOARD_RESPONSE_FIELDS);
  }

  private async loadCorkBoardActions(): Promise<CorkBoardAction[]> {
    const [actionItems, responseItems] = await Promise.all([
      this.sharepointManager.getListItems(CORK_BOARD_ACTIONS_LIST, '$orderby=Created desc&$top=200'),
      this.sharepointManager.getListItems(CORK_BOARD_RESPONSES_LIST, '$orderby=SubmittedAt desc&$top=5000'),
    ]);

    const responses = responseItems
      .map(item => this.mapCorkBoardActionResponse(item))
      .filter((response): response is CorkBoardActionResponse => response !== null);

    const responseByResponder = new Map<string, CorkBoardActionResponse>();
    for (const response of responses) {
      const key = `${response.actionId.toLowerCase()}::${response.responderName.toLowerCase()}`;
      if (!responseByResponder.has(key)) {
        responseByResponder.set(key, response);
      }
    }

    const responsesByAction = new Map<string, CorkBoardActionResponse[]>();
    for (const response of responseByResponder.values()) {
      const list = responsesByAction.get(response.actionId) || [];
      list.push(response);
      responsesByAction.set(response.actionId, list);
    }

    return actionItems
      .map(item => this.mapCorkBoardAction(item, responsesByAction.get(String(item.ID ?? item.Id ?? '')) || []))
      .filter((action): action is CorkBoardAction => action !== null)
      .filter(action => action.active && !this.isCorkBoardItemExpired(action.expiresOn))
      .sort((a, b) => this.compareCorkBoardActions(a, b));
  }

  private mapCorkBoardAction(item: any, responses: CorkBoardActionResponse[]): CorkBoardAction | null {
    const id = String(item.ID ?? item.Id ?? '');
    const title = String(item.Title || '').trim();
    if (!id || !title) return null;

    const type = this.normalizeCorkBoardActionType(item.ActionType);
    const sortedResponses = [...responses].sort((a, b) =>
      new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
    );

    return {
      id,
      title,
      description: this.cleanOptionalString(item.ActionDescription),
      type,
      options: this.parseCorkBoardActionOptions(item.ActionOptionsJson),
      active: item.ActionActive !== false,
      expiresOn: this.toDateOnly(item.ActionExpiresOn),
      createdBy: this.cleanOptionalString(item.ActionCreatedBy),
      createdAt: this.toIsoString(item.ActionCreatedAt || item.Created),
      modified: this.toIsoString(item.Modified),
      responseCount: sortedResponses.length,
      responseSummary: this.buildCorkBoardActionSummary(type, this.parseCorkBoardActionOptions(item.ActionOptionsJson), sortedResponses),
      responses: sortedResponses,
    };
  }

  private mapCorkBoardActionResponse(item: any): CorkBoardActionResponse | null {
    const id = String(item.ID ?? item.Id ?? '');
    const actionId = String(item.ActionId || '').trim();
    const responderName = String(item.ResponderName || '').trim();
    const responseValue = String(item.ResponseValue || '').trim();
    if (!id || !actionId || !responderName || !responseValue) return null;

    return {
      id,
      actionId,
      actionTitle: String(item.ActionTitle || item.Title || '').trim(),
      responderName,
      responseValue,
      comment: this.cleanOptionalString(item.ResponseComment),
      submittedAt: this.toIsoString(item.SubmittedAt || item.Created) || new Date(0).toISOString(),
      modified: this.toIsoString(item.Modified),
    };
  }

  private buildCorkBoardActionSummary(
    type: CorkBoardActionType,
    options: string[],
    responses: CorkBoardActionResponse[]
  ): CorkBoardActionSummary[] {
    if (type === 'acknowledge') {
      return responses.length > 0 ? [{ value: 'Acknowledged', count: responses.length }] : [];
    }

    const counts = new Map<string, number>();
    for (const option of options) {
      counts.set(option, 0);
    }
    for (const response of responses) {
      counts.set(response.responseValue, (counts.get(response.responseValue) || 0) + 1);
    }
    return Array.from(counts.entries()).map(([value, count]) => ({ value, count }));
  }

  private normalizeCorkBoardActionRequest(request: CorkBoardActionCreateRequest): CorkBoardActionCreateRequest {
    const title = String(request?.title || '').trim();
    if (!title) throw new Error('Action title is required');

    const type = this.normalizeCorkBoardActionType(request?.type);
    const options = Array.from(new Set((request?.options || [])
      .map(option => String(option || '').trim())
      .filter(Boolean)));
    if (type === 'poll' && options.length < 2) {
      throw new Error('Poll action items need at least two options');
    }

    return {
      title,
      type,
      description: this.cleanOptionalString(request?.description),
      options,
      expiresOn: request?.expiresOn ? this.validateDateOnly(request.expiresOn) : undefined,
      createdBy: this.cleanOptionalString(request?.createdBy),
      active: request?.active !== false,
    };
  }

  private normalizeCorkBoardActionResponseRequest(request: CorkBoardActionSubmitRequest): CorkBoardActionSubmitRequest {
    const actionId = String(request?.actionId || '').trim();
    const actionTitle = String(request?.actionTitle || '').trim();
    const responderName = String(request?.responderName || '').trim();
    const responseValue = String(request?.responseValue || '').trim();
    if (!actionId) throw new Error('Action ID is required');
    if (!actionTitle) throw new Error('Action title is required');
    if (!responderName) throw new Error('Name is required');
    if (!responseValue) throw new Error('Response is required');

    return {
      actionId,
      actionTitle,
      responderName,
      responseValue,
      comment: this.cleanOptionalString(request?.comment),
    };
  }

  private normalizeCorkBoardActionType(value: unknown): CorkBoardActionType {
    const normalized = String(value || '').toLowerCase();
    if (normalized === 'poll' || normalized === 'signup') return normalized;
    return 'acknowledge';
  }

  private parseCorkBoardActionOptions(value: unknown): string[] {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map(option => String(option || '').trim()).filter(Boolean);
    }
    try {
      const parsed = JSON.parse(String(value));
      if (Array.isArray(parsed)) {
        return parsed.map(option => String(option || '').trim()).filter(Boolean);
      }
    } catch { /* fall through to line splitting */ }
    return String(value)
      .split(/\r?\n|,/)
      .map(option => option.trim())
      .filter(Boolean);
  }

  private compareCorkBoardActions(a: CorkBoardAction, b: CorkBoardAction): number {
    if (a.expiresOn && b.expiresOn && a.expiresOn !== b.expiresOn) {
      return a.expiresOn.localeCompare(b.expiresOn);
    }
    if (a.expiresOn && !b.expiresOn) return -1;
    if (!a.expiresOn && b.expiresOn) return 1;

    const createdA = new Date(a.createdAt || a.modified || 0).getTime();
    const createdB = new Date(b.createdAt || b.modified || 0).getTime();
    if (Number.isFinite(createdA) && Number.isFinite(createdB) && createdA !== createdB) {
      return createdB - createdA;
    }
    return a.title.localeCompare(b.title, undefined, { numeric: true, sensitivity: 'base' });
  }

  private cleanOptionalString(value: unknown): string | undefined {
    const cleaned = String(value || '').trim();
    return cleaned ? cleaned : undefined;
  }

  private toIsoString(value: unknown): string | undefined {
    if (!value) return undefined;
    const date = new Date(String(value));
    return Number.isNaN(date.getTime()) ? String(value) : date.toISOString();
  }

  private toDateOnly(value: unknown): string | undefined {
    if (!value) return undefined;
    const text = String(value);
    const match = text.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (match) return `${match[1]}-${match[2]}-${match[3]}`;
    const date = new Date(text);
    if (Number.isNaN(date.getTime())) return undefined;
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  private validateDateOnly(value: string): string {
    const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!match) throw new Error('Expiration date must use YYYY-MM-DD');
    const parsed = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    if (
      parsed.getFullYear() !== Number(match[1]) ||
      parsed.getMonth() !== Number(match[2]) - 1 ||
      parsed.getDate() !== Number(match[3])
    ) {
      throw new Error('Expiration date is not valid');
    }
    return `${match[1]}-${match[2]}-${match[3]}`;
  }

  private escapeODataString(value: string): string {
    return value.replace(/'/g, "''");
  }

  private registerContractorHandlers(): void {
    /**
     * Contractor directory, hub first.
     *
     * The hub now polls OnLocation itself and serves a cached directory, so a desktop no longer
     * needs to hold OnLocation credentials to show this list — and every desktop asking OnLocation
     * on its own multiplied the API traffic by the number of installs.
     *
     * The direct pull stays as the fallback for a hub outage, which is the whole reason this desktop
     * app keeps its own key. `source` travels back so the UI can say which answer it got.
     */
    ipcMain.handle(events.IPC_CONTRACTORS_GET_LIVE, async () => {
      try {
        const hub = await backendGet('/ng/contractors/directory');
        const contractors = hub?.responseData?.contractors ?? hub?.contractors;
        if (Array.isArray(contractors) && contractors.length > 0) {
          return {
            success: true,
            data: contractors,
            source: 'hub',
            fetchedAt: hub?.responseData?.fetchedAt ?? hub?.fetchedAt ?? null
          };
        }
        console.warn('[Contractors] Hub returned no directory — falling back to a direct OnLocation pull');
      } catch (err: any) {
        console.warn(`[Contractors] Hub unavailable (${err.message}) — falling back to a direct OnLocation pull`);
      }

      try {
        return { success: true, data: await this.gateLogManager.getContractorDirectory(), source: 'onlocation' };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    /**
     * Ask the HUB to re-pull OnLocation now. The hub owns one shared cache, so this refreshes what
     * the PWA and every other desktop sees too — unlike the local pull below, which only updates
     * this machine. Falls back to the local pull when the hub cannot be reached.
     */
    ipcMain.handle(events.IPC_CONTRACTORS_REFRESH_DIRECTORY, async () => {
      try {
        const hub = await backendPost('/ng/contractors/directory/refresh', {});
        const payload = hub?.responseData ?? hub;
        const contractors = payload?.contractors;
        if (Array.isArray(contractors) && contractors.length > 0) {
          return { success: true, data: contractors, source: 'hub', fetchedAt: payload?.fetchedAt ?? null };
        }
        console.warn('[Contractors] Hub refresh returned nothing — falling back to a direct OnLocation pull');
      } catch (err: any) {
        console.warn(`[Contractors] Hub refresh failed (${err.message}) — falling back to a direct OnLocation pull`);
      }
      try {
        return { success: true, data: await this.gateLogManager.getContractorDirectory(), source: 'onlocation' };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });





  }
}
