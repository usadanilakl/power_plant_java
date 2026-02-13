/**
 * Main App class - Orchestrates the Electron application lifecycle.
 * Manages a single Spring Boot process (PID app).
 */

import { BrowserWindow, Menu, MenuItemConstructorOptions, app, dialog, shell, powerMonitor, session } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { MainWindowManager } from './managers/main-window.manager';
import { WindowLayoutManager } from './managers/window-layout.manager';
import { IpcHandlers } from './ipc/handlers';
import { DEFAULT_SPRING_BOOT_CONFIG, DEFAULT_SYNC_SERVER, SYNC_STALE_THRESHOLD_DAYS, APP_DISPLAY_NAME } from './constants';
import { getWorkingDir, ensureWorkingDir, ensureTessdata, provisionDefaultConfigs } from './paths';
import * as events from './ipc/events';
import type { StartupAssessment } from '../shared/types';

export default class App {
  static mainWindow: BrowserWindow | null = null;
  static application: Electron.App;
  static BrowserWindow: typeof BrowserWindow;

  private static mainWindowManager: MainWindowManager;
  private static ipcHandlers: IpcHandlers;
  private static isQuitting = false;
  private static serverPollTimer: ReturnType<typeof setInterval> | null = null;

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
    // Ensure working dir and config files exist BEFORE managers are created
    // (managers read configs in their constructors)
    ensureWorkingDir();
    provisionDefaultConfigs();

    // Create layout manager (reads window-layout.json from working dir)
    const layoutManager = new WindowLayoutManager();

    App.mainWindowManager = new MainWindowManager(App.isDevelopmentMode(), layoutManager);
    App.mainWindow = App.mainWindowManager.getWindow();

    if (!App.mainWindow) {
      console.error('Failed to create main window');
      app.quit();
      return;
    }

    // Set up IPC handlers
    App.ipcHandlers = new IpcHandlers(App.mainWindow, layoutManager);
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
          message: `${APP_DISPLAY_NAME} is still running.`,
          detail: `Port ${DEFAULT_SPRING_BOOT_CONFIG.port}\n\nDo you want to stop ${APP_DISPLAY_NAME} and exit?`
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

    // Clean up staging from a previous Electron update (if any)
    App.ipcHandlers.getElectronUpdateManager().cleanupStaging();

    // Startup assessment (before Spring Boot — assess what's needed, don't auto-download)
    await App.startupAssessment();

    // Clear Chromium HTTP cache so stale Angular assets from previous JAR aren't served
    await session.defaultSession.clearCache();

    // Auto-start Spring Boot if JAR exists
    const workingDir = getWorkingDir();
    const jarPath = path.join(workingDir, DEFAULT_SPRING_BOOT_CONFIG.jar);
    if (fs.existsSync(jarPath)) {
      await App.autoStart();
    } else {
      console.log('Spring Boot JAR not found — skipping auto-start');
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

  public static createMenu(): void {
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
            label: 'Clear Application Data...',
            click: async () => {
              const workingDir = getWorkingDir();
              const { response } = await dialog.showMessageBox(App.mainWindow!, {
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
                  // Stop Spring Boot if running
                  if (springBoot?.isRunning()) {
                    await springBoot.stop();
                  }
                  // Delete working directory contents
                  if (fs.existsSync(workingDir)) {
                    fs.rmSync(workingDir, { recursive: true, force: true });
                    fs.mkdirSync(workingDir, { recursive: true });
                  }
                  App.createMenu();
                  dialog.showMessageBox(App.mainWindow!, {
                    type: 'info',
                    title: 'Data Cleared',
                    message: 'Application data has been cleared.',
                    detail: 'Restart the app or sync again to re-download data.'
                  });
                } catch (err: any) {
                  dialog.showMessageBox(App.mainWindow!, {
                    type: 'error',
                    title: 'Error',
                    message: 'Failed to clear data',
                    detail: err.message
                  });
                }
              }
            }
          },
          {
            label: 'Open Data Folder',
            click: () => {
              shell.openPath(getWorkingDir());
            }
          },
          { type: 'separator' },
          {
            label: 'Save Window Layout',
            click: () => {
              if (App.ipcHandlers) {
                App.ipcHandlers.saveAllWindowLayouts();
                dialog.showMessageBox(App.mainWindow!, {
                  type: 'info',
                  title: 'Layout Saved',
                  message: 'Window layout has been saved.',
                  detail: 'Window positions and sizes will be restored on next launch.'
                });
              }
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
        label: APP_DISPLAY_NAME,
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
                detail: `Version: ${app.getVersion()}\n\nManages ${APP_DISPLAY_NAME} application.`
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
   * Startup assessment — checks server reachability, assesses what's needed,
   * and sends findings to renderer. Does NOT auto-download anything.
   */
  private static async startupAssessment(): Promise<void> {
    // ensureWorkingDir + provisionDefaultConfigs already called in onReady before IpcHandlers
    ensureTessdata();
    const workingDir = getWorkingDir();

    const deviceMgr = App.ipcHandlers.getSpringBootManager().getDeviceConfigManager();
    const deviceConfig = deviceMgr.getConfig();
    const serverUrl = deviceConfig?.syncServerUrl || DEFAULT_SYNC_SERVER.url;

    console.log('=== Startup assessment ===');
    console.log(`Device configured: ${!!deviceConfig}${deviceConfig ? ' serverUrl=' + serverUrl : ''}`);

    // 1. Check server reachability
    const reachable = await App.checkServerReachable(serverUrl);

    if (!reachable) {
      console.log('Sync server unreachable — sending status to renderer');
      App.sendToRenderer(events.IPC_STARTUP_SERVER_STATUS, { reachable: false });

      // Build partial assessment (local checks only)
      const assessment = App.buildLocalAssessment(deviceConfig, serverUrl);
      App.ipcHandlers.setLastAssessment(assessment);
      App.sendToRenderer(events.IPC_STARTUP_ASSESSMENT, assessment);

      // Start polling for server availability
      App.startServerPolling(serverUrl);
    } else {
      // Server is reachable — run full assessment
      App.sendToRenderer(events.IPC_STARTUP_SERVER_STATUS, { reachable: true });
      const assessment = await App.performFullAssessment(deviceConfig, serverUrl);
      App.ipcHandlers.setLastAssessment(assessment);
      App.sendToRenderer(events.IPC_STARTUP_ASSESSMENT, assessment);
    }

    console.log('=== Startup assessment complete ===');
  }

  /** Build assessment with local checks only (server unreachable) */
  private static buildLocalAssessment(deviceConfig: any, serverUrl: string): StartupAssessment {
    const workingDir = getWorkingDir();
    const jarPath = path.join(workingDir, DEFAULT_SPRING_BOOT_CONFIG.jar);
    const coldResyncMgr = App.ipcHandlers.getColdResyncManager();
    const syncMgr = App.ipcHandlers.getSyncStatusManager();
    const staleness = syncMgr.isSyncStale(SYNC_STALE_THRESHOLD_DAYS);

    const resourcePackMgr = App.ipcHandlers.getResourcePackManager();

    return {
      serverReachable: false,
      serverUrl,
      deviceConfigured: !!deviceConfig,
      jar: { present: fs.existsSync(jarPath), updateAvailable: false },
      db: { present: coldResyncMgr.isDbPresent(), sizeBytes: coldResyncMgr.getDbSizeBytes() },
      files: { present: coldResyncMgr.areFilesPresent(), totalSizeBytes: coldResyncMgr.getFilesTotalSizeBytes() },
      sync: { stale: staleness.stale, daysSinceSync: staleness.daysSinceSync },
      conflict: { detected: false },
      resourcePacks: resourcePackMgr.getLocalStatus(),
      electron: {
        updateAvailable: false,
        updateStaged: App.ipcHandlers.getElectronUpdateManager().isUpdateStaged()
      }
    };
  }

  /** Build full assessment (server reachable — includes remote checks) */
  private static async performFullAssessment(deviceConfig: any, serverUrl: string): Promise<StartupAssessment> {
    const assessment = App.buildLocalAssessment(deviceConfig, serverUrl);
    assessment.serverReachable = true;

    // Check for JAR update
    try {
      const updateMgr = App.ipcHandlers.getUpdateManager();
      const updateResult = await updateMgr.checkForUpdate(serverUrl);
      if (updateResult.success && updateResult.data) {
        assessment.jar.updateAvailable = updateResult.data.isNewer;
        assessment.jar.updateInfo = updateResult.data;
        console.log(`JAR update check: ${updateResult.data.isNewer ? 'update available' : 'up to date'}`);
      }
    } catch (err) {
      console.warn('JAR update check failed:', err);
    }

    // Check device conflict
    if (deviceConfig) {
      try {
        const syncMgr = App.ipcHandlers.getSyncStatusManager();
        const conflict = await syncMgr.checkDeviceConflict(
          deviceConfig.machineId, deviceConfig.deviceNumber, serverUrl
        );
        assessment.conflict = {
          detected: conflict.conflict,
          details: conflict.details
            ? `${conflict.details}. If this is the same physical device, re-register or claim it in Settings.`
            : undefined
        };
        if (conflict.conflict) {
          console.warn('DEVICE CONFLICT:', conflict.details);
        }
      } catch (err) {
        console.warn('Device conflict check failed:', err);
      }
    }

    // Check resource packs
    try {
      const rpMgr = App.ipcHandlers.getResourcePackManager();
      const headers: Record<string, string> = deviceConfig
        ? { 'X-Machine-Id': deviceConfig.machineId, 'X-Device-Number': String(deviceConfig.deviceNumber) }
        : {};
      assessment.resourcePacks = await rpMgr.checkForUpdates(serverUrl, headers);
      const rpSummary = assessment.resourcePacks.map(p => `${p.name}:${p.missingFiles + p.updatedFiles > 0 ? p.missingFiles + p.updatedFiles + ' need sync' : 'ok'}`).join(', ');
      console.log(`Resource packs: ${rpSummary || 'none'}`);
    } catch (err) {
      console.warn('Resource pack check failed:', err);
    }

    // Check for Electron app update
    try {
      const electronMgr = App.ipcHandlers.getElectronUpdateManager();
      const electronResult = await electronMgr.checkForUpdate(serverUrl);
      if (electronResult.success && electronResult.data) {
        assessment.electron = {
          updateAvailable: electronResult.data.isNewer,
          updateStaged: electronMgr.isUpdateStaged(),
          updateInfo: electronResult.data
        };
        console.log(`Electron update: ${electronResult.data.isNewer ? 'available' : 'up to date'}`);
      }
    } catch (err) {
      console.warn('Electron update check failed:', err);
    }

    console.log(`Assessment: JAR=${assessment.jar.present ? 'yes' : 'NO'}${assessment.jar.updateAvailable ? ' (update)' : ''} DB=${assessment.db.present ? (assessment.db.sizeBytes / 1024 / 1024).toFixed(0) + 'MB' : 'NO'} Files=${assessment.files.present ? (assessment.files.totalSizeBytes / 1024 / 1024 / 1024).toFixed(1) + 'GB' : 'NO'} Stale=${assessment.sync.stale}`);
    return assessment;
  }

  /** Check if sync server is reachable */
  private static checkServerReachable(serverUrl: string): Promise<boolean> {
    return new Promise((resolve) => {
      try {
        const endpoint = new URL(`${serverUrl}/api/update/check`);
        const req = http.request(
          {
            hostname: endpoint.hostname,
            port: endpoint.port || 80,
            path: endpoint.pathname,
            method: 'GET',
            timeout: 5000
          },
          (res) => {
            // Any response means server is reachable
            res.resume(); // consume data
            resolve(true);
          }
        );
        req.on('error', () => resolve(false));
        req.on('timeout', () => { req.destroy(); resolve(false); });
        req.end();
      } catch {
        resolve(false);
      }
    });
  }

  /** Poll for server availability every 15s until reachable */
  private static startServerPolling(serverUrl: string): void {
    if (App.serverPollTimer) return;

    console.log('Starting server polling (every 15s)...');
    App.serverPollTimer = setInterval(async () => {
      const reachable = await App.checkServerReachable(serverUrl);
      if (reachable) {
        console.log('Server became reachable — running full assessment');
        if (App.serverPollTimer) {
          clearInterval(App.serverPollTimer);
          App.serverPollTimer = null;
        }

        App.sendToRenderer(events.IPC_STARTUP_SERVER_STATUS, { reachable: true });

        const deviceMgr = App.ipcHandlers.getSpringBootManager().getDeviceConfigManager();
        const deviceConfig = deviceMgr.getConfig();
        const assessment = await App.performFullAssessment(deviceConfig, serverUrl);
        App.ipcHandlers.setLastAssessment(assessment);
        App.sendToRenderer(events.IPC_STARTUP_ASSESSMENT, assessment);
      }
    }, 15000);

    // Safety: stop polling after 10 minutes
    setTimeout(() => {
      if (App.serverPollTimer) {
        clearInterval(App.serverPollTimer);
        App.serverPollTimer = null;
        console.log('Server polling stopped (10 min timeout)');
      }
    }, 600000);
  }

  /** Helper to send IPC to renderer (handles loading state) */
  private static sendToRenderer(channel: string, data: any): void {
    if (!App.mainWindow || App.mainWindow.isDestroyed()) return;
    const send = () => App.mainWindow?.webContents.send(channel, data);
    if (App.mainWindow.webContents.isLoading()) {
      App.mainWindow.webContents.once('did-finish-load', send);
    } else {
      send();
    }
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
    if (App.serverPollTimer) {
      clearInterval(App.serverPollTimer);
      App.serverPollTimer = null;
    }
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

    // Auto-stop Spring Boot on Windows sign-out or system shutdown
    electronApp.whenReady().then(() => {
      powerMonitor.on('shutdown', async () => {
        console.log('System shutdown detected — stopping Spring Boot');
        await App.cleanup();
      });

      powerMonitor.on('lock-screen', () => {
        console.log('Screen locked / user switching — Spring Boot continues running');
        // We intentionally do NOT stop Spring Boot on lock/switch.
        // If the next user opens the app, the port conflict resolver will handle it.
      });
    });
  }

  public static refreshMenu(): void {
    App.createMenu();
  }

  /**
   * Re-run the full assessment and push updated results to the renderer.
   * Called after sync completes and when the renderer explicitly requests a refresh.
   */
  public static async refreshAssessment(): Promise<StartupAssessment> {
    const deviceMgr = App.ipcHandlers.getSpringBootManager().getDeviceConfigManager();
    const deviceConfig = deviceMgr.getConfig();
    const serverUrl = deviceConfig?.syncServerUrl || DEFAULT_SYNC_SERVER.url;
    const reachable = await App.checkServerReachable(serverUrl);
    const assessment = reachable
      ? await App.performFullAssessment(deviceConfig, serverUrl)
      : App.buildLocalAssessment(deviceConfig, serverUrl);
    App.ipcHandlers.setLastAssessment(assessment);
    App.sendToRenderer(events.IPC_STARTUP_ASSESSMENT, assessment);
    return assessment;
  }
}
