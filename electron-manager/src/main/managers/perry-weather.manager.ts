/**
 * PerryWeatherManager - Scrapes lightning status from Perry Weather via a hidden BrowserWindow.
 * Logs in with credentials from perry-config.json, then polls the dashboard for lightning data.
 */

import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { PerryWeatherStatus } from '../../shared/types';
import { getWorkingDir } from '../paths';

const PERRY_URL = 'https://app.perryweather.com/';
const DEFAULT_SCRAPE_INTERVAL_MS = 10_000;  // 10 seconds
const PAGE_REFRESH_INTERVAL_MS = 600_000;   // 10 minutes

export class PerryWeatherManager {
  private window: BrowserWindow | null = null;
  private scrapingInterval: NodeJS.Timeout | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private cachedStatus: PerryWeatherStatus = { status: 'loading' };
  private onStatusUpdate: (status: PerryWeatherStatus) => void;
  private scrapeIntervalMs = DEFAULT_SCRAPE_INTERVAL_MS;
  private loggedIn = false;

  constructor(onStatusUpdate: (status: PerryWeatherStatus) => void) {
    this.onStatusUpdate = onStatusUpdate;
  }

  public start(): void {
    if (this.window) return;

    console.log('[Perry] Starting Perry Weather monitor...');

    this.window = new BrowserWindow({
      show: false,
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: 'persist:perry-weather',
      },
    });

    this.window.webContents.on('did-finish-load', () => {
      const url = this.window?.webContents.getURL() || '';
      console.log(`[Perry] Page loaded: ${url}`);

      if (url.includes('/Account/Login') || url.includes('/account/login') || url === PERRY_URL) {
        // Login page detected
        this.handleLogin();
      } else {
        // Dashboard page — start scraping
        if (!this.loggedIn) {
          console.log('[Perry] Logged in successfully, starting scraper...');
          this.loggedIn = true;
        }
        this.startScraping();
      }
    });

    this.window.webContents.loadURL(PERRY_URL);

    this.window.on('closed', () => {
      this.window = null;
    });
  }

  public getStatus(): PerryWeatherStatus {
    return { ...this.cachedStatus };
  }

  public getIntervalSeconds(): number {
    return this.scrapeIntervalMs / 1000;
  }

  public refresh(): void {
    if (!this.window || this.window.isDestroyed()) return;
    console.log('[Perry] Manual refresh triggered');
    this.window.webContents.reload();
  }

  public setScrapeInterval(seconds: number): void {
    this.scrapeIntervalMs = Math.max(5, seconds) * 1000;
    console.log(`[Perry] Scrape interval set to ${seconds}s`);

    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval);
      this.scrapingInterval = setInterval(() => this.scrapeDashboard(), this.scrapeIntervalMs);
    }
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
    console.log('[Perry] Cleaned up');
  }

  private async handleLogin(): Promise<void> {
    if (!this.window || this.window.isDestroyed()) return;

    this.cachedStatus = { status: 'login-pending', lastUpdate: new Date().toLocaleTimeString() };
    this.onStatusUpdate(this.cachedStatus);

    const config = this.readConfig();
    const username = config.perryUsername || '';
    const password = config.perryPassword || '';

    if (!username || !password) {
      console.warn('[Perry] No credentials configured in perry-config.json');
      this.cachedStatus = { status: 'unavailable', lastUpdate: new Date().toLocaleTimeString() };
      this.onStatusUpdate(this.cachedStatus);
      return;
    }

    const wc = this.window.webContents;

    try {
      // Check for login form
      const hasForm = await wc.executeJavaScript(`!!document.getElementById('usernameInput')`);
      if (!hasForm) {
        console.log('[Perry] Login form not found, may already be logged in');
        return;
      }

      // Fill username via insertText
      await wc.executeJavaScript(`
        var el = document.getElementById('usernameInput');
        if (el) { el.focus(); el.click(); el.value = ''; }
      `);
      await new Promise(resolve => setTimeout(resolve, 300));
      await wc.insertText(username);

      // Fill password via insertText
      await wc.executeJavaScript(`
        var el = document.getElementById('passwordInput');
        if (el) { el.focus(); el.click(); el.value = ''; }
      `);
      await new Promise(resolve => setTimeout(resolve, 300));
      await wc.insertText(password);

      // Click login button
      await new Promise(resolve => setTimeout(resolve, 300));
      await wc.executeJavaScript(`
        var btn = document.getElementById('loginButton');
        if (btn) btn.click();
      `);
      console.log('[Perry] Login submitted');
      // did-finish-load will fire again after redirect to dashboard
    } catch (err: any) {
      console.error('[Perry] Login error:', err.message);
    }
  }

  private startScraping(): void {
    // Initial scrape after a short delay for React to render
    setTimeout(() => this.scrapeDashboard(), 3000);

    if (this.scrapingInterval) clearInterval(this.scrapingInterval);
    this.scrapingInterval = setInterval(() => this.scrapeDashboard(), this.scrapeIntervalMs);

    // Periodic page refresh
    if (this.refreshInterval) clearInterval(this.refreshInterval);
    this.refreshInterval = setInterval(() => {
      if (this.window && !this.window.isDestroyed()) {
        console.log('[Perry] Refreshing page for fresh data...');
        this.window.webContents.reload();
      }
    }, PAGE_REFRESH_INTERVAL_MS);
  }

  private async scrapeDashboard(): Promise<void> {
    if (!this.window || this.window.isDestroyed()) return;

    try {
      const data = await this.window.webContents.executeJavaScript(`
        (function() {
          var result = {};

          // Find all text nodes and elements to extract weather data
          var allText = document.body.innerText;

          // Lightning status: look for "All Clear", "Lightning Watch", "Lightning Alarm"
          if (allText.includes('All Clear')) result.lightningStatus = 'All Clear';
          else if (allText.includes('Lightning Watch')) result.lightningStatus = 'Lightning Watch';
          else if (allText.includes('Lightning Alarm')) result.lightningStatus = 'Lightning Alarm';

          // Lightning distance: look for patterns like "0-10 mi", "10-20 mi", "20-30 mi"
          var distMatch = allText.match(/(\\d+-\\d+\\s*mi)/);
          if (distMatch) result.lightningDistance = distMatch[1];

          // Lightning timer: countdown displayed when lightning is active (e.g. "28:21")
          // It's in an h6 element styled with red color near the circular progress
          var timerEls = document.querySelectorAll('h6.MuiTypography-subtitle1');
          for (var i = 0; i < timerEls.length; i++) {
            var txt = timerEls[i].textContent.trim();
            if (/^\\d{1,2}:\\d{2}$/.test(txt)) {
              result.lightningTimer = txt;
              break;
            }
          }

          // Temperature: find elements near "Weather Conditions" or look for °F pattern
          // MUI renders temperature as text in Typography elements
          var tempMatch = allText.match(/(\\d+\\.?\\d*)°F/);
          if (tempMatch) result.temperature = tempMatch[1];

          // Feels like
          var feelsSection = allText.indexOf('Feels');
          if (feelsSection >= 0) {
            var feelsText = allText.substring(Math.max(0, feelsSection - 20), feelsSection + 30);
            var feelsMatch = feelsText.match(/(\\d+\\.?\\d*)°?/);
            if (feelsMatch) result.feelsLike = feelsMatch[1];
          }

          // Wind
          var windSection = allText.indexOf('Wind');
          if (windSection >= 0) {
            var windText = allText.substring(Math.max(0, windSection - 30), windSection);
            var windMatch = windText.match(/(\\d+)\\s*([NSEW]{1,3})/);
            if (windMatch) result.wind = windMatch[1] + ' ' + windMatch[2];
          }

          return result;
        })();
      `);

      if (data && (data.lightningStatus || data.lightningDistance)) {
        const now = new Date().toLocaleTimeString();
        const newStatus: PerryWeatherStatus = {
          lightningStatus: data.lightningStatus,
          lightningDistance: data.lightningDistance,
          lightningTimer: data.lightningTimer,
          temperature: data.temperature,
          feelsLike: data.feelsLike,
          wind: data.wind,
          lastUpdate: now,
          status: 'available',
        };

        if (this.cachedStatus.lightningStatus !== newStatus.lightningStatus ||
            this.cachedStatus.lightningDistance !== newStatus.lightningDistance) {
          console.log(`[Perry] Lightning: ${newStatus.lightningStatus} (${newStatus.lightningDistance})`);
        }

        this.cachedStatus = newStatus;
        this.onStatusUpdate(newStatus);
      } else {
        if (this.cachedStatus.status !== 'unavailable') {
          console.log('[Perry] Dashboard data not found');
        }
        this.cachedStatus = {
          ...this.cachedStatus,
          status: 'unavailable',
          lastUpdate: new Date().toLocaleTimeString(),
        };
        this.onStatusUpdate(this.cachedStatus);
      }
    } catch (err: any) {
      // Silently handle scrape errors (page may be loading)
    }
  }

  private readConfig(): any {
    try {
      const configPath = path.join(getWorkingDir(), 'perry-config.json');
      if (fs.existsSync(configPath)) {
        return JSON.parse(fs.readFileSync(configPath, 'utf-8'));
      }
    } catch { /* use empty config */ }
    return {};
  }
}
