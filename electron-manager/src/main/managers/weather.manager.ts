/**
 * WeatherManager - two independent sources, deliberately separated:
 *
 *   1. Open-Meteo forecast  - a plain HTTPS API call. No browser window, no third-party content,
 *                             no ads. Always runs.
 *   2. WeatherBug lightning - scraped from an ad-funded page in a hidden BrowserWindow. This is
 *                             the surface that delivered the 2026-07-30 malvertising locker, so it
 *                             is OFF by default and enabled per machine in
 *                             Settings > Data Polling. Enable it on as few machines as possible.
 *
 * Runs in the Electron main process, broadcasts updates to renderer via callback.
 */

import { BrowserWindow, net, session } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import type { WeatherStatus, WeatherForecast } from '../../shared/types';
import { pinWindowToHosts } from './window-guards';
import { getWorkingDir } from '../paths';

const WEATHER_URL = 'https://www.weatherbug.com/alerts/lightning/elwood-il-60421/';
const WEATHER_PARTITION = 'persist:weatherbug';
const WEATHER_CONFIG_FILE = 'weather-config.json';
const DEFAULT_SCRAPE_INTERVAL_MS = 10_000;  // 10 seconds
const PAGE_REFRESH_INTERVAL_MS = 600_000;   // 10 minutes

// Elwood, IL 60421
const LATITUDE = 41.4039;
const LONGITUDE = -88.1115;
const OPEN_METEO_URL = `https://api.open-meteo.com/v1/forecast?latitude=${LATITUDE}&longitude=${LONGITUDE}`
  + '&current=temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m'
  + '&hourly=temperature_2m,weather_code,wind_speed_10m,precipitation'
  + '&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_sum,wind_speed_10m_max'
  + '&temperature_unit=fahrenheit&wind_speed_unit=mph&precipitation_unit=inch&timezone=America%2FChicago&forecast_days=7';
const FORECAST_POLL_INTERVAL_MS = 900_000;  // 15 minutes

export class WeatherManager {
  private window: BrowserWindow | null = null;
  private scrapingInterval: NodeJS.Timeout | null = null;
  private refreshInterval: NodeJS.Timeout | null = null;
  private forecastInterval: NodeJS.Timeout | null = null;
  private cachedStatus: WeatherStatus = { status: 'loading' };
  private cachedForecast: WeatherForecast = {
    current: { temperature: 0, apparentTemperature: 0, humidity: 0, windSpeed: 0, windDirection: 0, windGusts: 0, weatherCode: 0 },
    hourly: { time: [], temperature: [], weatherCode: [], windSpeed: [], precipitation: [] },
    daily: { time: [], temperatureMax: [], temperatureMin: [], weatherCode: [], precipitationSum: [], windSpeedMax: [] },
    lastUpdate: '',
    status: 'loading'
  };
  private onStatusUpdate: (status: WeatherStatus) => void;
  private onForecastUpdate: ((forecast: WeatherForecast) => void) | null = null;
  private scrapeIntervalMs = DEFAULT_SCRAPE_INTERVAL_MS;

  constructor(onStatusUpdate: (status: WeatherStatus) => void, onForecastUpdate?: (forecast: WeatherForecast) => void) {
    this.onStatusUpdate = onStatusUpdate;
    this.onForecastUpdate = onForecastUpdate || null;
  }

  /**
   * Starts the forecast unconditionally; starts the WeatherBug lightning scraper only if this
   * machine has it enabled. Safe to call more than once.
   */
  public start(): void {
    this.startForecastPolling();

    if (!this.readEnabled()) {
      console.log('[Weather] WeatherBug lightning scraper is DISABLED on this machine '
        + `(enable in Settings > Data Polling, or set lightningEnabled:true in ${WEATHER_CONFIG_FILE})`);
      this.publishDisabledStatus();
      return;
    }

    console.log('[Weather] WeatherBug lightning scraper ENABLED — starting...');
    this.startLightningScraper();
  }

  /** Is the WeatherBug scraper enabled on this machine? */
  public isEnabled(): boolean {
    return this.readEnabled();
  }

  /** Turn the WeatherBug scraper on/off for this machine, persist it, and apply immediately. */
  public setEnabled(enabled: boolean): void {
    this.writeEnabled(enabled);
    if (enabled) {
      console.log('[Weather] WeatherBug lightning scraper enabled');
      this.startLightningScraper();
    } else {
      console.log('[Weather] WeatherBug lightning scraper disabled — tearing down window');
      this.stopLightningScraper();
      this.publishDisabledStatus();
    }
  }

  private publishDisabledStatus(): void {
    this.cachedStatus = { status: 'unavailable', lastUpdate: new Date().toLocaleTimeString() };
    this.onStatusUpdate(this.cachedStatus);
  }

  private readEnabled(): boolean {
    try {
      const configPath = path.join(getWorkingDir(), WEATHER_CONFIG_FILE);
      if (fs.existsSync(configPath)) {
        const cfg = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return cfg.lightningEnabled === true;
      }
    } catch (err: any) {
      console.warn(`[Weather] Could not read ${WEATHER_CONFIG_FILE}: ${err.message}`);
    }
    // Default OFF. A machine only renders the ad-funded page if someone deliberately opted in.
    return false;
  }

  private writeEnabled(enabled: boolean): void {
    try {
      const configPath = path.join(getWorkingDir(), WEATHER_CONFIG_FILE);
      fs.writeFileSync(configPath, JSON.stringify({ lightningEnabled: enabled }, null, 2), 'utf-8');
    } catch (err: any) {
      console.error(`[Weather] Could not write ${WEATHER_CONFIG_FILE}: ${err.message}`);
    }
  }

  private startLightningScraper(): void {
    if (this.window) return;

    // WeatherBug is an ad-funded page: its third-party ad frames get their own session so their
    // cookies/storage/service workers never touch the session the app's own windows run in, and
    // every permission request (notifications, geolocation, pointer lock, ...) is refused — a
    // scraper needs none of them.
    const scrapeSession = session.fromPartition(WEATHER_PARTITION);
    scrapeSession.setPermissionRequestHandler((_wc, _permission, callback) => callback(false));

    this.window = new BrowserWindow({
      show: false,
      width: 1200,
      height: 900,
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: WEATHER_PARTITION,
        disableDialogs: true,   // headless scraper: alert()/confirm() loops can never reach an operator
      },
    });

    // Ads on this page can call window.open() and can redirect the top frame. Both are blocked:
    // see window-guards.ts for the incident this prevents.
    pinWindowToHosts(this.window, ['weatherbug.com'], 'Weather');

    this.window.webContents.loadURL(WEATHER_URL);

    this.window.webContents.on('did-finish-load', () => {
      console.log('[Weather] Page loaded, starting scraping...');
      this.scrapeLightningDistance();

      if (this.scrapingInterval) clearInterval(this.scrapingInterval);
      this.scrapingInterval = setInterval(() => this.scrapeLightningDistance(), this.scrapeIntervalMs);
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

  /** Tear down the WeatherBug window and its timers. Leaves forecast polling running. */
  private stopLightningScraper(): void {
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
    }
    this.window = null;
  }

  /**
   * Open-Meteo is a plain API call — no browser window, no third-party scripts — so it runs on
   * every machine regardless of the WeatherBug toggle. Temperature/wind/forecast keep working
   * even where the lightning scraper is off.
   */
  private startForecastPolling(): void {
    if (this.forecastInterval) return;
    this.fetchForecast();
    this.forecastInterval = setInterval(() => this.fetchForecast(), FORECAST_POLL_INTERVAL_MS);
  }

  public getStatus(): WeatherStatus {
    return { ...this.cachedStatus };
  }

  public getForecast(): WeatherForecast {
    return this.cachedForecast;
  }

  public getIntervalSeconds(): number {
    return this.scrapeIntervalMs / 1000;
  }

  /**
   * Force an immediate scrape (page reload + scrape).
   */
  public refresh(): void {
    if (!this.window || this.window.isDestroyed()) return;
    console.log('[Weather] Manual refresh triggered');
    this.window.webContents.reload();
    // The did-finish-load handler will re-scrape automatically
  }

  /**
   * Change the scraping interval. Restarts the scraping timer.
   */
  public setScrapeInterval(seconds: number): void {
    this.scrapeIntervalMs = Math.max(5, seconds) * 1000; // minimum 5s
    console.log(`[Weather] Scrape interval set to ${seconds}s`);

    // Restart the scraping timer with the new interval
    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval);
      this.scrapingInterval = setInterval(() => this.scrapeLightningDistance(), this.scrapeIntervalMs);
    }
  }

  public cleanup(): void {
    this.stopLightningScraper();
    if (this.forecastInterval) {
      clearInterval(this.forecastInterval);
      this.forecastInterval = null;
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
   * Force a forecast refresh from Open-Meteo.
   */
  public refreshForecast(): void {
    this.fetchForecast();
  }

  private fetchForecast(): void {
    console.log('[Weather] Fetching Open-Meteo forecast...');
    const request = net.request(OPEN_METEO_URL);

    let body = '';
    request.on('response', (response) => {
      response.on('data', (chunk) => { body += chunk.toString(); });
      response.on('end', () => {
        try {
          const data = JSON.parse(body);
          const forecast: WeatherForecast = {
            current: {
              temperature: data.current.temperature_2m,
              apparentTemperature: data.current.apparent_temperature,
              humidity: data.current.relative_humidity_2m,
              windSpeed: data.current.wind_speed_10m,
              windDirection: data.current.wind_direction_10m,
              windGusts: data.current.wind_gusts_10m,
              weatherCode: data.current.weather_code,
            },
            hourly: {
              time: data.hourly.time,
              temperature: data.hourly.temperature_2m,
              weatherCode: data.hourly.weather_code,
              windSpeed: data.hourly.wind_speed_10m,
              precipitation: data.hourly.precipitation,
            },
            daily: {
              time: data.daily.time,
              temperatureMax: data.daily.temperature_2m_max,
              temperatureMin: data.daily.temperature_2m_min,
              weatherCode: data.daily.weather_code,
              precipitationSum: data.daily.precipitation_sum,
              windSpeedMax: data.daily.wind_speed_10m_max,
            },
            lastUpdate: new Date().toLocaleTimeString(),
            status: 'available',
          };
          this.cachedForecast = forecast;
          console.log(`[Weather] Forecast updated: ${forecast.current.temperature}°F`);
          this.onForecastUpdate?.(forecast);
        } catch (err) {
          console.error('[Weather] Failed to parse Open-Meteo response:', err);
          this.cachedForecast = { ...this.cachedForecast, status: 'error', error: 'Parse error' };
          this.onForecastUpdate?.(this.cachedForecast);
        }
      });
    });

    request.on('error', (err) => {
      console.error('[Weather] Open-Meteo fetch failed:', err);
      this.cachedForecast = { ...this.cachedForecast, status: 'error', error: err.message };
      this.onForecastUpdate?.(this.cachedForecast);
    });

    request.end();
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
