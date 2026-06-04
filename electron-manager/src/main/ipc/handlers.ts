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
import { GateLogManager } from '../managers/gate-log.manager';
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
import { SharePointManager } from '../managers/sharepoint.manager';
import { PersonnelManager } from '../managers/personnel.manager';
import { DEFAULT_SPRING_BOOT_CONFIG, APP_DISPLAY_NAME } from '../constants';
import type { WebViewTarget, DeviceConfig, UpdateProgress, ColdResyncProgress, GateLogConfig, StartupAssessment, SyncComponent, SyncOptions, SyncExecuteProgress, ElectronUpdateProgress, WeatherStatus, WeatherForecast, PerryWeatherStatus, PjmStatus, VoskResult, WebViewAmsConfig, SdsScraperConfig } from '../../shared/types';

export class IpcHandlers {
  private springBoot: SpringBootManager;
  private webview: WebViewManager;
  private updateManager: UpdateManager;
  private syncStatusManager: SyncStatusManager;
  private coldResyncManager: ColdResyncManager;
  private gateLogManager: GateLogManager;
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
    this.webViewAmsManager = new WebViewAmsManager();
    this.webViewSdsManager = new WebViewSdsManager();
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
    this.springBoot = new SpringBootManager(
      (status) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_APP_STATUS_CHANGED, status);
        }
        // Connect/disconnect SSE sync updates based on Spring Boot state
        if (status.state === 'running' && status.healthStatus === 'healthy') {
          this.syncUpdateManager.connect(DEFAULT_SPRING_BOOT_CONFIG.port);
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
    this.registerPersonnelHandlers();
    this.registerContractorHandlers();
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
      await shell.openExternal(url);
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

    // Execute selective sync
    ipcMain.handle(events.IPC_SYNC_EXECUTE, async (_event, components: SyncComponent[], options?: SyncOptions) => {
      const config = this.springBoot.getDeviceConfigManager().getConfig();
      if (!config) return { success: false, error: 'Device not configured' };

      const sendProgress = (progress: SyncExecuteProgress) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_SYNC_EXECUTE_PROGRESS, progress);
        }
      };

      const needsDbOrFiles = components.includes('db') || components.includes('files');
      const sbWasRunning = this.springBoot.isRunning();

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

        // 6. Clear Chromium cache (stale Angular assets in iframe) and restart Spring Boot
        if (needsStop && sbWasRunning) {
          await session.defaultSession.clearCache();
          sendProgress({ phase: 'starting_sb', statusMessage: `Starting ${APP_DISPLAY_NAME}...`, progressPercent: 95 });
          await this.springBoot.start();
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
    this.syncUpdateManager.disconnect();
    this.webview.closeAll();
    await this.springBoot.stop();
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
  }

  private registerContractorHandlers(): void {
    ipcMain.handle(events.IPC_CONTRACTORS_GET_LIVE, async () => {
      try {
        return { success: true, data: await this.gateLogManager.getContractorDirectory() };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CONTRACTORS_PUSH_TO_BACKEND, async () => {
      try {
        const contractors = await this.gateLogManager.getContractorDirectory();
        const resp = await backendPost('/ng/contractors/sync', {
          source: 'electron-onlocation',
          contractors
        });
        return { success: true, data: resp };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CONTRACTORS_SCAN, async () => {
      try {
        return { success: true, data: await backendPost('/ng/contractors/scan', {}) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CONTRACTORS_LIST_REPORTS, async (_evt, status?: string) => {
      try {
        const qs = status ? `?status=${encodeURIComponent(status)}` : '';
        return { success: true, data: await backendGet('/ng/contractors/reports' + qs) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CONTRACTORS_ACCEPT_REPORT, async (_evt, id: number) => {
      try {
        return { success: true, data: await backendPost(`/ng/contractors/reports/${id}/accept`, {}) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });

    ipcMain.handle(events.IPC_CONTRACTORS_REJECT_REPORT, async (_evt, id: number) => {
      try {
        return { success: true, data: await backendPost(`/ng/contractors/reports/${id}/reject`, {}) };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    });
  }
}
