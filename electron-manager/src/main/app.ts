/**
 * Main App class - Orchestrates the Electron application lifecycle.
 * Manages a single Spring Boot process (PID app).
 */

import { BrowserWindow, Menu, MenuItemConstructorOptions, app, dialog, shell } from 'electron';
import { MainWindowManager } from './managers/main-window.manager';
import { IpcHandlers } from './ipc/handlers';
import { DEFAULT_SPRING_BOOT_CONFIG } from './constants';

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

    // Auto-start Spring Boot if configured
    await App.autoStart();
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
