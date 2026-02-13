/**
 * MainWindowManager - Handles the main Electron window.
 */

import { BrowserWindow, screen } from 'electron';
import * as path from 'path';
import { format } from 'url';
import { rendererAppName, rendererAppPort } from '../constants';
import { WindowLayoutManager } from './window-layout.manager';

export class MainWindowManager {
  private window: BrowserWindow | null = null;
  private isDev: boolean;
  private layoutManager: WindowLayoutManager;

  constructor(isDev: boolean, layoutManager: WindowLayoutManager) {
    this.isDev = isDev;
    this.layoutManager = layoutManager;
    this.createWindow();
  }

  private createWindow(): void {
    const saved = this.layoutManager.getBounds('main');
    const workAreaSize = screen.getPrimaryDisplay().workAreaSize;
    const width = saved?.width ?? Math.min(1200, workAreaSize.width || 1200);
    const height = saved?.height ?? Math.min(800, workAreaSize.height || 800);

    this.window = new BrowserWindow({
      width,
      height,
      ...(saved ? { x: saved.x, y: saved.y } : {}),
      minWidth: 800,
      minHeight: 600,
      frame: false,
      title: 'DK Power Manager',
      show: false,
      backgroundColor: '#1a1a2e',
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        sandbox: false,
        backgroundThrottling: false,
        preload: path.join(__dirname, '..', 'preload', 'main.preload.js')
      }
    });

    if (!saved) {
      this.window.center();
    }

    // Show window when ready
    this.window.once('ready-to-show', () => {
      if (saved?.isMaximized) {
        this.window?.maximize();
      }
      this.window?.show();
    });

    // Track window position/size for auto-save
    this.layoutManager.trackWindow('main', this.window);

    // Handle window closed
    this.window.on('closed', () => {
      this.window = null;
    });
  }

  public load(): void {
    if (!this.window) return;

    if (this.isDev) {
      // Development: load from Angular dev server
      this.window.loadURL(`http://localhost:${rendererAppPort}`);
      // Open DevTools in development
      this.window.webContents.openDevTools({ mode: 'detach' });
    } else {
      // Production: load from built files
      this.window.loadURL(
        format({
          pathname: path.join(__dirname, '..', '..', '..', rendererAppName, 'browser', 'index.html'),
          protocol: 'file:',
          slashes: true
        })
      );
    }
  }

  public getWindow(): BrowserWindow | null {
    return this.window;
  }

  public isDisposed(): boolean {
    return !this.window || this.window.isDestroyed();
  }

  public close(): void {
    if (this.window && !this.window.isDestroyed()) {
      this.window.close();
    }
  }
}
