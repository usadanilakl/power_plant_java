/**
 * IPC Handlers - Registers all IPC event handlers for the main process.
 */

import { app, ipcMain, shell, dialog, BrowserWindow } from 'electron';
import * as http from 'http';
import * as events from './events';
import { SpringBootManager } from '../managers/spring-boot.manager';
import { WebViewManager } from '../managers/webview.manager';
import { UpdateManager } from '../managers/update.manager';
import { SyncStatusManager } from '../managers/sync-status.manager';
import { ColdResyncManager } from '../managers/cold-resync.manager';
import { GateLogManager } from '../managers/gate-log.manager';
import { DEFAULT_SPRING_BOOT_CONFIG } from '../constants';
import type { WebViewTarget, DeviceConfig, UpdateProgress, ColdResyncProgress, GateLogConfig } from '../../shared/types';

export class IpcHandlers {
  private springBoot: SpringBootManager;
  private webview: WebViewManager;
  private updateManager: UpdateManager;
  private syncStatusManager: SyncStatusManager;
  private coldResyncManager: ColdResyncManager;
  private gateLogManager: GateLogManager;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.webview = new WebViewManager(mainWindow);
    this.updateManager = new UpdateManager();
    this.syncStatusManager = new SyncStatusManager();
    this.coldResyncManager = new ColdResyncManager();
    this.gateLogManager = new GateLogManager();
    this.gateLogManager.setOnPeopleUpdated(() => {
      if (this.mainWindow && !this.mainWindow.isDestroyed()) {
        this.mainWindow.webContents.send(events.IPC_GATE_LOG_PEOPLE_UPDATED);
      }
    });
    this.springBoot = new SpringBootManager(
      (status) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_APP_STATUS_CHANGED, status);
        }
      },
      (line) => {
        if (this.mainWindow && !this.mainWindow.isDestroyed()) {
          this.mainWindow.webContents.send(events.IPC_APP_LOG, line);
        }
      }
    );
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
    this.registerGateLogHandlers();
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

  public getColdResyncManager(): ColdResyncManager {
    return this.coldResyncManager;
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
      return { success: false, error: 'Spring Boot is not running' };
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
          message: 'Spring Boot is still running.',
          detail: `Port ${DEFAULT_SPRING_BOOT_CONFIG.port}\n\nDo you want to stop Spring Boot and exit?`
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
        await this.webview.open('fm-global', 'https://redetag.fmglobal.com');

        // Wait for landing page to load, click Create, then fill form
        const win = this.webview['windows'].get('fm-global');
        if (win) {
          win.window.webContents.once('did-finish-load', async () => {
            try {
              // Click "Create New Impairment" button and wait for form page to load
              await this.webview.clickFmGlobalCreateButton();

              const fieldsSet = await this.webview.fillFmGlobalForm(formData);
              console.log(`FM Global form: ${fieldsSet} fields populated`);

              // Intercept Back/Submit buttons — broadcast gathered data to renderer
              await this.webview.interceptFmGlobalButtons((data) => {
                if (this.mainWindow && !this.mainWindow.isDestroyed()) {
                  this.mainWindow.webContents.send(events.IPC_FIRE_IMP_FORM_SUBMITTED, data);
                }
              });
            } catch (err) {
              console.error('Failed to fill FM Global form:', err);
            }
          });
        }

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
  }

  public async cleanup(): Promise<void> {
    this.gateLogManager.cleanup();
    this.webview.closeAll();
    await this.springBoot.stop();
  }
}
