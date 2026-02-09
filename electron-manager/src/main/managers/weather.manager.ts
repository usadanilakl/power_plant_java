/**
 * WeatherManager - Scrapes lightning distance from WeatherBug via a hidden BrowserWindow.
 * Runs in the Electron main process, broadcasts updates to renderer via callback.
 */

import { BrowserWindow } from 'electron';
import type { WeatherStatus } from '../../shared/types';

const WEATHER_URL = 'https://www.weatherbug.com/alerts/lightning/elwood-il-60421/';
const SCRAPE_INTERVAL_MS = 10_000;       // 10 seconds
const PAGE_REFRESH_INTERVAL_MS = 600_000; // 10 minutes

export class WeatherManager {
  private window: BrowserWindow | null = null;
  private scrapingInterval: NodeJS.Timeout | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private cachedStatus: WeatherStatus = { status: 'loading' };
  private onStatusUpdate: (status: WeatherStatus) => void;

  constructor(onStatusUpdate: (status: WeatherStatus) => void) {
    this.onStatusUpdate = onStatusUpdate;
  }

  public start(): void {
    if (this.window) return;

    console.log('[Weather] Starting weather monitor...');

    this.window = new BrowserWindow({
      show: false,
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    this.window.webContents.loadURL(WEATHER_URL);

    this.window.webContents.on('did-finish-load', () => {
      console.log('[Weather] Page loaded, starting scraping...');
      this.scrapeLightningDistance();

      if (this.scrapingInterval) clearInterval(this.scrapingInterval);
      this.scrapingInterval = setInterval(() => this.scrapeLightningDistance(), SCRAPE_INTERVAL_MS);
    });

    // Refresh the page periodically for fresh data
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (this.window && !this.window.isDestroyed()) {
        console.log('[Weather] Refreshing page for fresh data...');
        this.window.webContents.reload();
      }
    }, PAGE_REFRESH_INTERVAL_MS);

    // Handle window being destroyed unexpectedly
    this.window.on('closed', () => {
      this.window = null;
    });
  }

  public getStatus(): WeatherStatus {
    return { ...this.cachedStatus };
  }

  public cleanup(): void {
    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval);
      this.scrapingInterval = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.window && !this.window.isDestroyed()) {
      this.window.destroy();
      this.window = null;
    }
    console.log('[Weather] Cleaned up');
  }

  private scrapeLightningDistance(): void {
    if (!this.window || this.window.isDestroyed()) return;

    const script = `
      new Promise((resolve, reject) => {
        const el = document.getElementById('sparkDistanceTxt');
        if (el && el.innerText) {
          resolve(el.innerText);
        } else {
          reject('Element not found or has no text in this frame.');
        }
      })
    `;

    const webContents = this.window.webContents;
    const frames = webContents.mainFrame.framesInSubtree;

    // Search all frames (WeatherBug loads Spark data in an iframe)
    const promises = [
      webContents.executeJavaScript(script, true),
      ...frames.map(frame => frame.executeJavaScript(script, true))
    ];

    Promise.any(promises)
      .then((distanceText: string) => {
        if (distanceText) {
          const parsed = this.parseDistanceText(distanceText.trim());
          const now = new Date().toLocaleTimeString();

          const newStatus: WeatherStatus = {
            lightningDistance: parsed.distance,
            unit: parsed.unit,
            lastUpdate: now,
            status: 'available',
          };

          // Only broadcast if something changed
          if (this.cachedStatus.lightningDistance !== newStatus.lightningDistance ||
              this.cachedStatus.status !== newStatus.status) {
            console.log(`[Weather] Lightning: ${parsed.distance} ${parsed.unit}`);
          }

          this.cachedStatus = newStatus;
          this.onStatusUpdate(newStatus);
        }
      })
      .catch(() => {
        // All frames failed — data not available yet
        if (this.cachedStatus.status !== 'unavailable') {
          console.log('[Weather] Lightning data not available from any frame');
        }

        const newStatus: WeatherStatus = {
          ...this.cachedStatus,
          status: 'unavailable',
          lastUpdate: new Date().toLocaleTimeString(),
        };
        this.cachedStatus = newStatus;
        this.onStatusUpdate(newStatus);
      });
  }

  /**
   * Parse distance text like "5.2 mi", "12 miles", "N/A", etc.
   */
  private parseDistanceText(text: string): { distance: string; unit: string } {
    // Match number + optional unit
    const match = text.match(/(\d+\.?\d*)\s*(mi|km|miles|kilometers)?/i);
    if (match) {
      return {
        distance: match[1],
        unit: match[2] ? match[2].toLowerCase() : 'mi',
      };
    }
    // No number found — return raw text
    return { distance: text, unit: '' };
  }
}
