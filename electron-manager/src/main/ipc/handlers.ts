/**
 * IPC Handlers - Registers all IPC event handlers for the main process.
 */

import { app, ipcMain, shell, dialog, BrowserWindow } from 'electron';
import * as http from 'http';
import * as events from './events';
import { SpringBootManager } from '../managers/spring-boot.manager';
import { WebViewManager } from '../managers/webview.manager';
import { DEFAULT_SPRING_BOOT_CONFIG } from '../constants';
import type { WebViewTarget } from '../../shared/types';

export class IpcHandlers {
  private springBoot: SpringBootManager;
  private webview: WebViewManager;
  private mainWindow: BrowserWindow;

  constructor(mainWindow: BrowserWindow) {
    this.mainWindow = mainWindow;
    this.webview = new WebViewManager(mainWindow);
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
    this.registerWindowHandlers();
    this.registerGeneralHandlers();
    this.registerWebViewHandlers();
    this.registerFireImpairmentHandlers();
  }

  public getSpringBootManager(): SpringBootManager {
    return this.springBoot;
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
    // List impairments from Spring Boot API
    ipcMain.handle(events.IPC_FIRE_IMP_LIST, async () => {
      try {
        const data = await this.springBootApiGet('/api/fire-impairment/active');
        return { success: true, data };
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

    // Open FM Global form with auto-fill
    ipcMain.handle(events.IPC_FIRE_IMP_OPEN_FORM, async (_event, formData: Record<string, string>) => {
      try {
        await this.webview.open('fm-global', 'https://redetag.fmglobal.com');

        // Wait for page to load, then fill form
        const win = this.webview['windows'].get('fm-global');
        if (win) {
          win.window.webContents.once('did-finish-load', async () => {
            try {
              const fieldsSet = await this.webview.fillFmGlobalForm(formData);
              console.log(`FM Global form: ${fieldsSet} fields populated`);
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

  public async cleanup(): Promise<void> {
    this.webview.closeAll();
    await this.springBoot.stop();
  }
}
