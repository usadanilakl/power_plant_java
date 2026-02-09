/**
 * WeatherManager - Scrapes lightning distance from WeatherBug via a hidden BrowserWindow.
 * Runs in the Electron main process, broadcasts updates to renderer via callback.
 */

import { BrowserWindow, net } from 'electron';
import type { WeatherStatus, WeatherForecast } from '../../shared/types';

const WEATHER_URL = 'https://www.weatherbug.com/alerts/lightning/elwood-il-60421/';
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

    // Start Open-Meteo forecast polling
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
    if (this.scrapingInterval) {
      clearInterval(this.scrapingInterval);
      this.scrapingInterval = null;
    }
    if (this.refreshInterval) {
      clearInterval(this.refreshInterval);
      this.refreshInterval = null;
    }
    if (this.forecastInterval) {
      clearInterval(this.forecastInterval);
      this.forecastInterval = null;
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
