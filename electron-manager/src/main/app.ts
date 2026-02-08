/**
 * Main App class - Orchestrates the Electron application lifecycle.
 * Manages a single Spring Boot process (PID app).
 */

import { BrowserWindow, Menu, MenuItemConstructorOptions, app, dialog, shell } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import { MainWindowManager } from './managers/main-window.manager';
import { IpcHandlers } from './ipc/handlers';
import { DEFAULT_SPRING_BOOT_CONFIG, SYNC_STALE_THRESHOLD_DAYS } from './constants';
import * as events from './ipc/events';

export default class App {
  static mainWindow: BrowserWindow | null = null;
  static application: Electron.App;
  static BrowserWindow: typeof BrowserWindow;

  private static mainWindowManager: MainWindowManager;
  private static ipcHandlers: IpcHandlers;
  private static isQuitting = false;

  public static isDevelopmentMode(): boolean {
    const isEnvironmentSet: boolean = 'ELECTRON_IS_DEV' in process.env;
    const getFromEnvironment: boolean = parseInt(process.env.ELECTRON_IS_DEV || '0', 10) === 1;
    return isEnvironmentSet ? getFromEnvironment : !app.isPackaged;
  }

  private static onWindowAllClosed(): void {
    if (process.platform !== 'darwin') {
      App.application.quit();
    }
  }

  private static async onReady(): Promise<void> {
    App.mainWindowManager = new MainWindowManager(App.isDevelopmentMode());
    App.mainWindow = App.mainWindowManager.getWindow();

    if (!App.mainWindow) {
      console.error('Failed to create main window');
      app.quit();
      return;
    }

    // Set up IPC handlers
    App.ipcHandlers = new IpcHandlers(App.mainWindow);
    App.ipcHandlers.register();

    // Create menu
    App.createMenu();

    // Load the renderer
    App.mainWindowManager.load();

    // Handle window close - single cleanup path
    App.mainWindow.on('close', async (event) => {
      if (App.isQuitting) return; // Already quitting, let it proceed

      event.preventDefault();

      const springBoot = App.ipcHandlers.getSpringBootManager();

      if (springBoot.isRunning()) {
        const result = await dialog.showMessageBox(App.mainWindow!, {
          type: 'question',
          buttons: ['Cancel', 'Stop and Exit'],
          defaultId: 0,
          cancelId: 0,
          title: 'Confirm Exit',
          message: 'Spring Boot is still running.',
          detail: `Port ${DEFAULT_SPRING_BOOT_CONFIG.port}\n\nDo you want to stop Spring Boot and exit?`
        });

        if (result.response === 1) {
          App.isQuitting = true;
          await App.cleanup();
          App.mainWindow?.destroy();
          app.quit();
        }
      } else {
        App.isQuitting = true;
        await App.cleanup();
        App.mainWindow?.destroy();
        app.quit();
      }
    });

    App.mainWindow.on('closed', () => {
      App.mainWindow = null;
      App.mainWindowManager = null!;
    });

    // Pre-startup checks (before Spring Boot — check server, JAR update, device conflicts)
    await App.preStartupChecks();

    // Guard: don't start Spring Boot if JAR doesn't exist
    const workingDir = path.resolve(__dirname, '..', '..', '..', '..', DEFAULT_SPRING_BOOT_CONFIG.workingDir);
    const jarPath = path.join(workingDir, DEFAULT_SPRING_BOOT_CONFIG.jar);
    if (!fs.existsSync(jarPath)) {
      console.error('Spring Boot JAR not found after pre-startup checks — cannot start');
      if (App.mainWindow && !App.mainWindow.isDestroyed()) {
        const sendMsg = () => {
          App.mainWindow?.webContents.send(events.IPC_COLD_RESYNC_NEEDED, {
            reason: 'jar_missing',
            message: 'Application JAR not found. Ensure sync server is reachable and has a JAR in the updates directory.'
          });
        };
        if (App.mainWindow.webContents.isLoading()) {
          App.mainWindow.webContents.once('did-finish-load', sendMsg);
        } else {
          sendMsg();
        }
      }
    } else {
      // Auto-start Spring Boot if configured
      await App.autoStart();
    }

    // Post-startup checks (after Spring Boot — sync staleness)
    App.postStartupChecks();

    // First-run detection: notify renderer if device identity is not configured
    App.checkDeviceSetup();
  }

  private static onActivate(): void {
    if (App.mainWindow === null) {
      App.onReady();
    }
  }

  private static createMenu(): void {
    const springBoot = App.ipcHandlers?.getSpringBootManager();
    const status = springBoot?.getStatus();
    const isRunning = status?.state === 'running';
    const isStopped = status?.state === 'stopped' || status?.state === 'error';

    const template: MenuItemConstructorOptions[] = [
      {
        label: 'File',
        submenu: [
          {
            label: 'Settings',
            accelerator: 'CmdOrCtrl+,',
            click: () => {
              // TODO: Open settings page via IPC
            }
          },
          { type: 'separator' },
          {
            label: 'Exit',
            accelerator: 'CmdOrCtrl+Q',
            click: () => {
              App.mainWindow?.close();
            }
          }
        ]
      },
      {
        label: 'Spring Boot',
        submenu: [
          {
            label: 'Start',
            enabled: isStopped,
            click: async () => {
              try {
                await springBoot!.start();
                App.createMenu();
              } catch (e) {
                console.error('Failed to start Spring Boot:', e);
              }
            }
          },
          {
            label: 'Stop',
            enabled: isRunning || status?.state === 'starting',
            click: async () => {
              try {
                await springBoot!.stop();
                App.createMenu();
              } catch (e) {
                console.error('Failed to stop Spring Boot:', e);
              }
            }
          },
          {
            label: 'Restart',
            enabled: isRunning,
            click: async () => {
              try {
                await springBoot!.restart();
                App.createMenu();
              } catch (e) {
                console.error('Failed to restart Spring Boot:', e);
              }
            }
          },
          { type: 'separator' },
          {
            label: `Open in Browser (port ${DEFAULT_SPRING_BOOT_CONFIG.port})`,
            enabled: isRunning,
            click: () => {
              shell.openExternal(`http://localhost:${DEFAULT_SPRING_BOOT_CONFIG.port}`);
            }
          }
        ]
      },
      {
        label: 'View',
        submenu: [
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
        ]
      },
      {
        label: 'Help',
        submenu: [
          {
            label: 'About',
            click: () => {
              dialog.showMessageBox(App.mainWindow!, {
                type: 'info',
                title: 'About DK Power Manager',
                message: 'DK Power Manager',
                detail: `Version: ${app.getVersion()}\n\nManages Power Plant Spring Boot application.`
              });
            }
          }
        ]
      }
    ];

    const menu = Menu.buildFromTemplate(template);
    Menu.setApplicationMenu(menu);
  }

  private static async autoStart(): Promise<void> {
    const springBoot = App.ipcHandlers.getSpringBootManager();

    if (springBoot.shouldAutoStart()) {
      console.log('Auto-starting Spring Boot...');
      try {
        await springBoot.start();
      } catch (error) {
        console.error('Failed to auto-start Spring Boot:', error);
      }
      // Refresh menu after start attempt
      setTimeout(() => App.createMenu(), 1000);
    }
  }

  private static checkDeviceSetup(): void {
    const deviceMgr = App.ipcHandlers.getSpringBootManager().getDeviceConfigManager();
    if (!deviceMgr.isConfigured()) {
      console.log('Device identity not configured — prompting user for setup');
      // Wait for renderer to be ready, then notify
      App.mainWindow?.webContents.once('did-finish-load', () => {
        App.mainWindow?.webContents.send(events.IPC_DEVICE_NEEDS_SETUP);
      });
      // If already loaded, send immediately
      if (!App.mainWindow?.webContents.isLoading()) {
        App.mainWindow?.webContents.send(events.IPC_DEVICE_NEEDS_SETUP);
      }
    }
  }

  /**
   * Pre-startup checks — run BEFORE Spring Boot starts.
   * Checks sync server availability, JAR updates, and device conflicts.
   * All failures are non-fatal (graceful degradation when offline).
   */
  private static async preStartupChecks(): Promise<void> {
    const updateMgr = App.ipcHandlers.getUpdateManager();
    const syncMgr = App.ipcHandlers.getSyncStatusManager();
    const deviceMgr = App.ipcHandlers.getSpringBootManager().getDeviceConfigManager();
    const deviceConfig = deviceMgr.getConfig();

    // Ensure working directory exists before any manager operations
    const workingDir = path.resolve(__dirname, '..', '..', '..', '..', DEFAULT_SPRING_BOOT_CONFIG.workingDir);
    if (!fs.existsSync(workingDir)) {
      fs.mkdirSync(workingDir, { recursive: true });
      console.log(`Created working directory: ${workingDir}`);
    }

    const jarPath = path.join(workingDir, DEFAULT_SPRING_BOOT_CONFIG.jar);
    const jarExists = fs.existsSync(jarPath);

    const serverUrl = deviceConfig?.syncServerUrl;

    console.log('=== Pre-startup checks ===');
    console.log(`Working dir: ${workingDir}`);
    console.log(`JAR: ${jarPath} (${jarExists ? 'exists' : 'MISSING — will attempt download'})`);
    console.log(`Device configured: ${!!deviceConfig}${serverUrl ? ' serverUrl=' + serverUrl : ''}`);

    // 1. Check for JAR update (or initial download if missing)
    try {
      console.log('Checking for JAR update...');
      const updateResult = await updateMgr.checkForUpdate(serverUrl);
      if (updateResult.success && updateResult.data?.isNewer) {
        console.log(`Update available: ${updateResult.data.fileName} (${(updateResult.data.fileSize / 1024 / 1024).toFixed(1)} MB)`);
        // Send progress events to renderer during download
        const onProgress = (progress: any) => {
          if (App.mainWindow && !App.mainWindow.isDestroyed()) {
            App.mainWindow.webContents.send(events.IPC_UPDATE_PROGRESS, progress);
          }
        };
        const downloadResult = await updateMgr.downloadUpdate(serverUrl, onProgress);
        if (downloadResult.success) {
          console.log('JAR updated — will use new version on start');
        } else {
          console.warn('JAR download failed:', downloadResult.error);
        }
      } else if (updateResult.success) {
        console.log('JAR is up to date');
      } else {
        console.log('Update check skipped:', updateResult.error);
      }
    } catch (err) {
      console.warn('Pre-startup update check failed:', err);
    }

    // 2. Cold resync if needed (first run — no database file)
    const coldResyncMgr = App.ipcHandlers.getColdResyncManager();
    if (coldResyncMgr.needsColdResync() && deviceConfig) {
      try {
        console.log('First run detected — performing cold resync from server...');
        const onColdProgress = (progress: any) => {
          if (App.mainWindow && !App.mainWindow.isDestroyed()) {
            App.mainWindow.webContents.send(events.IPC_COLD_RESYNC_PROGRESS, progress);
          }
        };
        const resyncResult = await coldResyncMgr.performColdResync(
          deviceConfig.syncServerUrl, deviceConfig.machineId, deviceConfig.deviceNumber, onColdProgress
        );
        if (resyncResult.success) {
          console.log('Cold resync complete — database and files downloaded');
        } else {
          console.warn('Cold resync failed:', resyncResult.error, '— Spring Boot will start with empty DB');
        }
      } catch (err) {
        console.warn('Cold resync error:', err);
      }
    } else if (coldResyncMgr.needsColdResync()) {
      console.log('No database found but device not configured — skipping cold resync');
    }

    // 3. Check device number conflicts (only if device is configured)
    if (deviceConfig) {
      try {
        console.log('Checking device number conflicts...');
        const conflict = await syncMgr.checkDeviceConflict(
          deviceConfig.machineId,
          deviceConfig.deviceNumber,
          deviceConfig.syncServerUrl
        );
        if (conflict.conflict) {
          console.warn('DEVICE CONFLICT:', conflict.details);
          // Notify renderer
          const sendConflict = () => {
            App.mainWindow?.webContents.send(events.IPC_DEVICE_CONFLICT, { details: conflict.details });
          };
          if (App.mainWindow?.webContents.isLoading()) {
            App.mainWindow.webContents.once('did-finish-load', sendConflict);
          } else {
            sendConflict();
          }
        } else {
          console.log('No device number conflicts');
        }
      } catch (err) {
        console.warn('Device conflict check failed:', err);
      }
    }

    console.log('=== Pre-startup checks complete ===');
  }

  /**
   * Post-startup checks — run AFTER Spring Boot starts.
   * Waits for Spring Boot to be healthy, then checks sync staleness.
   * Non-blocking: runs in background after startup.
   */
  private static postStartupChecks(): void {
    const syncMgr = App.ipcHandlers.getSyncStatusManager();

    // Wait for Spring Boot to be running before checking sync
    const checkInterval = setInterval(async () => {
      const springBoot = App.ipcHandlers.getSpringBootManager();
      const status = springBoot.getStatus();

      if (status.state === 'running' && status.healthStatus === 'healthy') {
        clearInterval(checkInterval);
        console.log('=== Post-startup checks ===');

        // Check sync staleness
        try {
          const staleness = syncMgr.isSyncStale(SYNC_STALE_THRESHOLD_DAYS);
          if (staleness.stale) {
            const msg = staleness.daysSinceSync !== null
              ? `Database sync is ${staleness.daysSinceSync} days old`
              : 'Database has never been synced';
            console.warn(`SYNC STALE: ${msg}`);

            // Notify renderer
            if (App.mainWindow && !App.mainWindow.isDestroyed()) {
              App.mainWindow.webContents.send(events.IPC_SYNC_STALE, {
                daysSinceSync: staleness.daysSinceSync
              });
            }
          } else {
            console.log(`Sync is current (${staleness.daysSinceSync} days ago)`);
          }
        } catch (err) {
          console.warn('Post-startup sync check failed:', err);
        }

        console.log('=== Post-startup checks complete ===');
      }

      // Give up after 5 minutes
      if (status.state === 'error' || status.state === 'stopped') {
        clearInterval(checkInterval);
      }
    }, 5000);

    // Safety timeout — stop checking after 5 minutes
    setTimeout(() => clearInterval(checkInterval), 300000);
  }

  private static async cleanup(): Promise<void> {
    if (App.ipcHandlers) {
      await App.ipcHandlers.cleanup();
    }
  }

  static main(electronApp: Electron.App, browserWindow: typeof BrowserWindow): void {
    electronApp.disableHardwareAcceleration();

    App.BrowserWindow = browserWindow;
    App.application = electronApp;

    App.application.on('window-all-closed', App.onWindowAllClosed);
    App.application.on('ready', App.onReady);
    App.application.on('activate', App.onActivate);

    // Use before-quit only as a safety net (main cleanup is in 'close' handler)
    App.application.on('before-quit', async (event) => {
      if (!App.isQuitting && App.ipcHandlers) {
        App.isQuitting = true;
        event.preventDefault();
        await App.cleanup();
        App.application.exit();
      }
    });
  }

  public static refreshMenu(): void {
    App.createMenu();
  }
}
