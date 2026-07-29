/**
 * PjmManager - Polls PJM Data Miner 2 REST API for real-time LMP prices
 * for two generating units (U1 and U2 Jackson).
 *
 * API: https://api.pjm.com/api/v1/rt_unverified_fivemin_lmps
 * Auth: Ocp-Apim-Subscription-Key header
 * Data: 5-minute unverified LMP for specific pricing nodes (pnodes)
 *
 * Day-ahead awards are fetched from PJM emails via Microsoft Graph API.
 * Also provides a convenience method to open Voyager in a visible window.
 */

import { BrowserWindow } from 'electron';
import * as https from 'https';
import * as zlib from 'zlib';
import * as fs from 'fs';
import * as path from 'path';
import type { PjmStatus, PjmUnitLmp, PjmUnitEvolution, PjmUnitStep, PjmConfig, PjmUnitConfig, PjmDaAward, PjmDaHourEntry } from '../../shared/types';
import { getWorkingDir } from '../paths';
import { WindowLayoutManager } from './window-layout.manager';
import { DaEmailManager } from './da-email.manager';

const PJM_API_BASE = 'https://api.pjm.com/api/v1';
const DEFAULT_UNITS: [PjmUnitConfig, PjmUnitConfig] = [
  { pnodeId: 2156111010, pnodeName: 'U1 Jackson' },
  { pnodeId: 2156111011, pnodeName: 'U2 Jackson' },
];
const DEFAULT_POLL_INTERVAL_MIN = 5;

// Voyager auto-login (credentials loaded from pjm-config.json at runtime)
const PJM_LOGIN_URL = 'https://voyager.tnsk.com/platform/page/signin.html';

export class PjmManager {
  private pollInterval: NodeJS.Timeout | null = null;
  private voyagerWindow: BrowserWindow | null = null;
  private cachedStatus: PjmStatus = {
    unit1: { pnodeId: DEFAULT_UNITS[0].pnodeId, status: 'unavailable' },
    unit2: { pnodeId: DEFAULT_UNITS[1].pnodeId, status: 'unavailable' },
    unit: '$/MWh',
  };
  private onStatusUpdate: (status: PjmStatus) => void;
  private config: PjmConfig;
  private layoutManager: WindowLayoutManager;
  private daEmailManager: DaEmailManager;

  // DA award cache (fetched from Graph API emails)
  private daCache: PjmDaAward[] = [];
  private daCacheTime: number = 0;
  private static DA_CACHE_TTL = 15 * 60_000; // 15 minutes

  // DA email auto-polling (own schedule, tied to LMP polling enable/disable)
  private daPollingInterval: NodeJS.Timeout | null = null;
  private daScheduleTimeout: NodeJS.Timeout | null = null;
  private daDailyResetTimeout: NodeJS.Timeout | null = null;
  private static DA_POLL_START_HOUR_CT = 11;   // 11:30 AM CT
  private static DA_POLL_START_MIN_CT = 30;
  private static DA_POLL_INTERVAL_MS = 5 * 60_000; // 5 minutes

  constructor(layoutManager: WindowLayoutManager, daEmailManager: DaEmailManager, onStatusUpdate: (status: PjmStatus) => void) {
    this.layoutManager = layoutManager;
    this.daEmailManager = daEmailManager;
    this.onStatusUpdate = onStatusUpdate;
    this.config = this.loadConfig();
  }

  public start(): void {
    if (this.pollInterval) return;

    const u1 = this.config.units[0];
    const u2 = this.config.units[1];
    console.log(`[PJM] Starting LMP polling (every ${this.config.pollIntervalMinutes} min, U1=${u1.pnodeId}, U2=${u2.pnodeId})...`);

    // Immediate first fetch
    this.fetchLmpData();

    this.pollInterval = setInterval(
      () => this.fetchLmpData(),
      this.config.pollIntervalMinutes * 60_000
    );

    // Start DA email auto-polling (own schedule)
    this.scheduleDaPolling();
  }

  public getStatus(): PjmStatus {
    return { ...this.cachedStatus, unit1: { ...this.cachedStatus.unit1 }, unit2: { ...this.cachedStatus.unit2 } };
  }

  public refresh(): void {
    this.fetchLmpData();
  }

  public isPolling(): boolean {
    return this.pollInterval !== null;
  }

  public getConfig(): PjmConfig {
    return { ...this.config, units: [...this.config.units] as [PjmUnitConfig, PjmUnitConfig] };
  }

  public getVoyagerWindow(): BrowserWindow | null {
    return this.voyagerWindow && !this.voyagerWindow.isDestroyed() ? this.voyagerWindow : null;
  }

  public saveConfig(newConfig: Partial<PjmConfig>): void {
    this.config = { ...this.config, ...newConfig };
    const configPath = path.join(getWorkingDir(), 'pjm-config.json');
    try {
      fs.writeFileSync(configPath, JSON.stringify(this.config, null, 2), 'utf-8');
      console.log('[PJM] Config saved');
    } catch (err: any) {
      console.error('[PJM] Failed to save config:', err.message);
    }

    // Restart polling with new interval
    this.stop();
    this.start();
  }

  // ── Day-Ahead Awards (from Graph API emails) ────────────────────────

  /**
   * Fetch DA awards from PJM emails via Graph API. Uses in-memory cache
   * (15-min TTL) to avoid excessive API calls on repeated UI navigations.
   */
  public async fetchDaAwards(force = false): Promise<PjmDaAward[]> {
    const emailAddr = this.config.daEmailAddress;
    if (!emailAddr || !this.daEmailManager.isConfigured()) {
      console.log('[PJM] DA email not configured — awards unavailable');
      return [];
    }

    if (!force && this.daCache.length > 0 && Date.now() - this.daCacheTime < PjmManager.DA_CACHE_TTL) {
      return this.daCache;
    }

    try {
      this.daCache = await this.daEmailManager.fetchDaAwards(emailAddr);
      this.daCacheTime = Date.now();
      console.log(`[PJM] DA awards fetched from email: ${this.daCache.length} entries`);
      this.updateEvolutions();
      return this.daCache;
    } catch (err: any) {
      console.error('[PJM] Failed to fetch DA awards from email:', err.message);
      throw err;
    }
  }

  // ── Voyager Window ────────────────────────────────────────────────────

  /** Open Voyager in a visible window for manual visual reference */
  public showWindow(): void {
    if (this.voyagerWindow && !this.voyagerWindow.isDestroyed()) {
      this.voyagerWindow.show();
      this.voyagerWindow.focus();
      return;
    }

    const saved = this.layoutManager.getBounds('pjm-voyager');
    this.voyagerWindow = new BrowserWindow({
      width: saved?.width ?? 1400,
      height: saved?.height ?? 900,
      ...(saved ? { x: saved.x, y: saved.y } : {}),
      title: 'PJM Voyager',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: 'persist:pjm',
      },
    });

    if (saved?.isMaximized) {
      this.voyagerWindow.maximize();
    }

    this.layoutManager.trackWindow('pjm-voyager', this.voyagerWindow);

    this.voyagerWindow.webContents.loadURL(PJM_LOGIN_URL);

    this.voyagerWindow.webContents.on('did-finish-load', () => {
      const currentUrl = this.voyagerWindow?.webContents.getURL() || '';
      if (currentUrl.includes('signin')) {
        this.autoLoginVoyager();
      }
    });

    this.voyagerWindow.on('closed', () => {
      this.voyagerWindow = null;
    });
  }

  public cleanup(): void {
    this.stop();
    if (this.voyagerWindow && !this.voyagerWindow.isDestroyed()) {
      this.voyagerWindow.destroy();
      this.voyagerWindow = null;
    }
    console.log('[PJM] Cleaned up');
  }

  public stop(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
    this.stopDaPolling();
  }

  // ── DA Email Auto-Polling ─────────────────────────────────────────────

  /**
   * Schedule DA email polling. Starts at 11:30 AM CT, polls every 5 min,
   * stops when next-day award is received, then reschedules for 11:30 AM CT next day.
   */
  private scheduleDaPolling(): void {
    if (!this.config.daEmailAddress || !this.daEmailManager.isConfigured()) {
      console.log('[PJM] DA email not configured — skipping DA auto-polling');
      return;
    }

    const now = new Date();
    const ctMinutesSinceMidnight = now.getHours() * 60 + now.getMinutes();
    const targetMinutes = PjmManager.DA_POLL_START_HOUR_CT * 60 + PjmManager.DA_POLL_START_MIN_CT;

    if (ctMinutesSinceMidnight >= targetMinutes) {
      // Already past 11:30 AM CT — start polling now
      console.log('[PJM] DA email polling: past 11:30 AM CT, starting now');
      this.beginDaPolling();
    } else {
      // Schedule to start at 11:30 AM CT
      const delayMs = (targetMinutes - ctMinutesSinceMidnight) * 60_000;
      console.log(`[PJM] DA email polling scheduled in ${Math.round(delayMs / 60_000)} min (11:30 AM CT)`);
      this.daScheduleTimeout = setTimeout(() => {
        this.daScheduleTimeout = null;
        this.beginDaPolling();
      }, delayMs);
    }
  }

  private beginDaPolling(): void {
    if (this.daPollingInterval) return; // already running
    console.log('[PJM] DA email auto-polling started (every 5 min)');
    this.pollDaEmails(); // immediate first fetch
    this.daPollingInterval = setInterval(() => this.pollDaEmails(), PjmManager.DA_POLL_INTERVAL_MS);
  }

  private async pollDaEmails(): Promise<void> {
    try {
      const awards = await this.fetchDaAwards(true);
      this.updateEvolutions();

      // Check if we have tomorrow's award (next EPT operating day)
      const tomorrowEpt = this.getTomorrowEptDateStr();
      const hasTomorrow = awards.some(a => a.date === tomorrowEpt);
      if (hasTomorrow) {
        console.log(`[PJM] DA award for ${tomorrowEpt} received — pausing DA polling until 11:30 AM CT tomorrow`);
        this.pauseDaPollingUntilTomorrow();
      }
    } catch (err: any) {
      console.error('[PJM] DA auto-poll failed:', err.message);
    }
  }

  /** Stop active DA polling and schedule restart at 11:30 AM CT tomorrow */
  private pauseDaPollingUntilTomorrow(): void {
    if (this.daPollingInterval) {
      clearInterval(this.daPollingInterval);
      this.daPollingInterval = null;
    }

    // Calculate ms until 11:30 AM CT tomorrow
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(PjmManager.DA_POLL_START_HOUR_CT, PjmManager.DA_POLL_START_MIN_CT, 0, 0);
    const delayMs = tomorrow.getTime() - now.getTime();

    console.log(`[PJM] DA polling will restart in ~${Math.round(delayMs / 3_600_000)} hours`);
    this.daDailyResetTimeout = setTimeout(() => {
      this.daDailyResetTimeout = null;
      this.beginDaPolling();
    }, delayMs);
  }

  private stopDaPolling(): void {
    if (this.daPollingInterval) {
      clearInterval(this.daPollingInterval);
      this.daPollingInterval = null;
    }
    if (this.daScheduleTimeout) {
      clearTimeout(this.daScheduleTimeout);
      this.daScheduleTimeout = null;
    }
    if (this.daDailyResetTimeout) {
      clearTimeout(this.daDailyResetTimeout);
      this.daDailyResetTimeout = null;
    }
  }

  // ── Evolution Calculation ───────────────────────────────────────────

  /** Recalculate unit evolutions from cached DA awards and broadcast */
  private updateEvolutions(): void {
    this.cachedStatus.unit1Evolution = this.calculateUnitEvolution('unit1');
    this.cachedStatus.unit2Evolution = this.calculateUnitEvolution('unit2');
    this.broadcastStatus();
  }

  /**
   * Determine the next state change for a unit based on DA awards.
   *
   * Time conversions:
   *   HE X (hour ending, EPT) → start of hour = (X-1):00 EPT = (X-2):00 CT
   *   AGC time: (HE - 2):00 CT  (unit starts at beginning of awarded hour)
   *   OFFLINE time: (HE - 1):00 CT  (HE of first 0-MW hour, expressed in CT)
   */
  private calculateUnitEvolution(unitKey: 'unit1' | 'unit2'): PjmUnitEvolution {
    const hoursKey = unitKey === 'unit1' ? 'unit1Hours' : 'unit2Hours';

    // Current time → EPT date and HE
    const now = new Date();
    const ctHour = now.getHours();
    let eptHour = ctHour + 1; // EPT = CT + 1
    let eptDate = new Date(now);

    // Handle day wrap: 23:00 CT = 00:00 EPT next day
    if (eptHour >= 24) {
      eptHour -= 24;
      eptDate.setDate(eptDate.getDate() + 1);
    }
    const currentHeEpt = eptHour + 1; // at XX:MM EPT we're in HE (XX+1)
    // Clamp to 1-24 range
    const currentHE = Math.min(Math.max(currentHeEpt, 1), 24);

    const todayEptStr = this.toDateStr(eptDate);
    const tomorrowEpt = new Date(eptDate);
    tomorrowEpt.setDate(tomorrowEpt.getDate() + 1);
    const tomorrowEptStr = this.toDateStr(tomorrowEpt);

    const todayAward = this.daCache.find(a => a.date === todayEptStr);
    const tomorrowAward = this.daCache.find(a => a.date === tomorrowEptStr);

    // Determine current state from today's award at current HE
    let currentlyOnline = false;
    if (todayAward) {
      const hours = todayAward[hoursKey] as PjmDaHourEntry[];
      const entry = hours.find(h => h.he === currentHE);
      currentlyOnline = entry ? entry.mw > 0 : false;
    }

    // Collect EVERY transition (today's remaining hours, then tomorrow), tracking running state.
    // The first step reproduces the old single-transition message for backward compatibility;
    // callers that want the full sequence read `steps`.
    const steps: PjmUnitStep[] = [];
    let state = currentlyOnline;

    if (todayAward) {
      const hours = todayAward[hoursKey] as PjmDaHourEntry[];
      for (let he = currentHE + 1; he <= 24; he++) {
        const entry = hours.find(h => h.he === he);
        const isOn = entry ? entry.mw > 0 : false;
        if (state && !isOn) {
          steps.push({ type: 'OFFLINE', time: `${this.formatCtTime(he - 1)} CT`, he, date: todayEptStr });
          state = false;
        } else if (!state && isOn) {
          steps.push({ type: 'AGC', time: `${this.formatCtTime(he - 2)} CT`, he, date: todayEptStr });
          state = true;
        }
      }
    }

    if (tomorrowAward) {
      const hours = tomorrowAward[hoursKey] as PjmDaHourEntry[];
      const dateLabel = this.formatDateShort(tomorrowEptStr);
      for (let he = 1; he <= 24; he++) {
        const entry = hours.find(h => h.he === he);
        const isOn = entry ? entry.mw > 0 : false;
        if (state && !isOn) {
          // If the very first hour is off, unit comes off at midnight
          const time = he === 1 ? `${dateLabel} 12:00 AM CT` : `${dateLabel} ${this.formatCtTime(he - 1)} CT`;
          steps.push({ type: 'OFFLINE', time, he, date: tomorrowEptStr });
          state = false;
        } else if (!state && isOn) {
          steps.push({ type: 'AGC', time: `${dateLabel} ${this.formatCtTime(he - 2)} CT`, he, date: tomorrowEptStr });
          state = true;
        }
      }
    }

    // Derive status + backward-compatible message from the collected steps.
    if (steps.length > 0) {
      const first = steps[0];
      return {
        status: currentlyOnline ? 'online' : 'offline',
        message: `${first.type} by ${first.time}`,
        date: first.date,
        steps,
      };
    }

    // No transitions — terminal state descriptions (unchanged wording).
    if (currentlyOnline) {
      if (tomorrowAward) {
        return { status: 'online', message: `Staying online for ${this.formatDateShort(tomorrowEptStr)}`, date: tomorrowEptStr, steps };
      }
      return { status: 'online', message: 'Online — awaiting DA schedule', steps };
    }
    if (tomorrowAward) {
      return { status: 'offline', message: `Offline for ${this.formatDateShort(tomorrowEptStr)}`, date: tomorrowEptStr, steps };
    }
    return { status: 'unknown', message: 'Awaiting DA schedule', steps };
  }

  /** HE in EPT → CT time string. Handles wrap (negative/over 23). */
  private formatCtTime(hour24: number): string {
    const h = ((hour24 % 24) + 24) % 24;
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 || 12;
    return `${h12}:00 ${ampm}`;
  }

  /** Get tomorrow's EPT date as YYYY-MM-DD */
  private getTomorrowEptDateStr(): string {
    const now = new Date();
    const ctHour = now.getHours();
    const eptDate = new Date(now);
    if (ctHour + 1 >= 24) eptDate.setDate(eptDate.getDate() + 1); // EPT day wrap
    eptDate.setDate(eptDate.getDate() + 1); // +1 for tomorrow
    return this.toDateStr(eptDate);
  }

  private formatDateShort(dateStr: string): string {
    const [, m, d] = dateStr.split('-');
    return `${m}/${d}`;
  }

  private toDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  // ── Config ────────────────────────────────────────────────────────────

  private loadConfig(): PjmConfig {
    const configPath = path.join(getWorkingDir(), 'pjm-config.json');
    try {
      if (fs.existsSync(configPath)) {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

        // Migration: old single-pnode format → new multi-unit format
        if (raw.pnodeId != null && !raw.units) {
          console.log('[PJM] Migrating config from single-pnode to multi-unit format');
          const migrated: PjmConfig = {
            apiKey: raw.apiKey || '',
            units: [
              { pnodeId: raw.pnodeId, pnodeName: raw.pnodeName || 'U1 Jackson' },
              { pnodeId: raw.pnodeId + 1, pnodeName: 'U2 Jackson' },
            ],
            pollIntervalMinutes: raw.pollIntervalMinutes || DEFAULT_POLL_INTERVAL_MIN,
            voyagerUsername: raw.voyagerUsername || '',
            voyagerPassword: raw.voyagerPassword || '',
            daEmailAddress: raw.daEmailAddress || '',
          };
          fs.writeFileSync(configPath, JSON.stringify(migrated, null, 2), 'utf-8');
          return migrated;
        }

        return {
          apiKey: raw.apiKey || '',
          units: raw.units || DEFAULT_UNITS,
          pollIntervalMinutes: raw.pollIntervalMinutes || DEFAULT_POLL_INTERVAL_MIN,
          voyagerUsername: raw.voyagerUsername || '',
          voyagerPassword: raw.voyagerPassword || '',
          daEmailAddress: raw.daEmailAddress || '',
        };
      }
    } catch { /* use defaults */ }

    // Create default config (API key must be set in pjm-config.json)
    const defaultConfig: PjmConfig = {
      apiKey: '',
      units: DEFAULT_UNITS,
      pollIntervalMinutes: DEFAULT_POLL_INTERVAL_MIN,
    };

    try {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    } catch { /* best effort */ }

    return defaultConfig;
  }

  // ── LMP Data Fetching ─────────────────────────────────────────────────

  /**
   * Fetch latest LMP data for both units in parallel.
   * Each unit's pnode is queried independently.
   */
  private fetchLmpData(): void {
    if (!this.config.apiKey) {
      this.cachedStatus.unit1 = { ...this.cachedStatus.unit1, status: 'error', error: 'PJM API key not configured. Set it in pjm-config.json.' };
      this.cachedStatus.unit2 = { ...this.cachedStatus.unit2, status: 'error', error: 'PJM API key not configured. Set it in pjm-config.json.' };
      this.broadcastStatus();
      return;
    }

    this.fetchLmpDataForUnit('unit1', this.config.units[0].pnodeId, this.config.units[0].pnodeName);
    this.fetchLmpDataForUnit('unit2', this.config.units[1].pnodeId, this.config.units[1].pnodeName);
  }

  private fetchLmpDataForUnit(unitKey: 'unit1' | 'unit2', pnodeId: number, defaultPnodeName: string): void {
    const now = new Date();
    const todayStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} 00:00`;
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = `${tomorrowDate.getMonth() + 1}/${tomorrowDate.getDate()}/${tomorrowDate.getFullYear()} 00:00`;

    const params = new URLSearchParams({
      startRow: '1',
      rowCount: '1',
      pnode_id: String(pnodeId),
      datetime_beginning_ept: `${todayStr}to${tomorrowStr}`,
      sort: 'datetime_beginning_ept',
      order: 'desc',
    });

    const url = `${PJM_API_BASE}/rt_unverified_fivemin_lmps?${params.toString()}`;
    const urlObj = new URL(url);

    const options: https.RequestOptions = {
      hostname: urlObj.hostname,
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'Ocp-Apim-Subscription-Key': this.config.apiKey,
        'Accept': 'application/json',
        // Prefer an uncompressed body. PJM's CDN may still force gzip regardless
        // (see decodeResponseBody), so this is a hint, not a guarantee.
        'Accept-Encoding': 'identity',
      },
      timeout: 15_000,
    };

    const req = https.request(options, (res) => {
      // Collect raw bytes — the body may be gzip/deflate/br compressed, so we
      // cannot accumulate it as a UTF-8 string until after decompression.
      const chunks: Buffer[] = [];
      res.on('data', (chunk: Buffer) => chunks.push(chunk));
      res.on('end', () => {
        let body: string;
        try {
          body = this.decodeResponseBody(Buffer.concat(chunks), res.headers['content-encoding']);
        } catch (err: any) {
          console.error(`[PJM] ${unitKey} Failed to decode response body (content-encoding=${res.headers['content-encoding']}): ${err.message}`);
          this.updateUnitStatus(unitKey, { status: 'error', error: 'Failed to decode response', pnodeId });
          return;
        }
        if (res.statusCode !== 200) {
          console.error(`[PJM] ${unitKey} API returned ${res.statusCode}: ${body.substring(0, 300)}`);
          this.updateUnitStatus(unitKey, { status: 'error', error: `API returned ${res.statusCode}`, pnodeId });
          return;
        }
        this.parseLmpResponseForUnit(body, unitKey, pnodeId, defaultPnodeName);
      });
    });

    req.on('error', (err) => {
      console.error(`[PJM] ${unitKey} API request failed: ${err.message}`);
      this.updateUnitStatus(unitKey, { status: 'error', error: `Request failed: ${err.message}`, pnodeId });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error(`[PJM] ${unitKey} API request timed out`);
      this.updateUnitStatus(unitKey, { status: 'error', error: 'Request timed out', pnodeId });
    });

    req.end();
  }

  /**
   * Decode an HTTP response body, transparently decompressing per the
   * Content-Encoding header. PJM's CDN began gzipping responses even when the
   * request asks for `identity`; without this, gzip bytes reach JSON.parse as
   * binary garbage and the parse throws ("Failed to parse response").
   */
  private decodeResponseBody(raw: Buffer, contentEncoding?: string | string[]): string {
    const enc = String(contentEncoding || '').toLowerCase();
    if (enc.includes('gzip')) return zlib.gunzipSync(raw).toString('utf-8');
    if (enc.includes('br')) return zlib.brotliDecompressSync(raw).toString('utf-8');
    if (enc.includes('deflate')) return zlib.inflateSync(raw).toString('utf-8');
    return raw.toString('utf-8');
  }

  private parseLmpResponseForUnit(body: string, unitKey: 'unit1' | 'unit2', pnodeId: number, defaultPnodeName: string): void {
    try {
      const data = JSON.parse(body);
      const items = data.items || data;

      if (!Array.isArray(items) || items.length === 0) {
        console.log(`[PJM] ${unitKey} No LMP data returned for the current period`);
        this.updateUnitStatus(unitKey, { status: 'unavailable', pnodeId });
        return;
      }

      const latest = items[0];
      const lmp = parseFloat(latest.total_lmp_rt ?? latest.itsced_lmp ?? latest.lmp);
      const congestion = parseFloat(latest.congestion_price_rt ?? latest.marginal_congestion ?? 0);
      const loss = parseFloat(latest.marginal_loss_price_rt ?? latest.marginal_loss ?? 0);
      const pnodeName = latest.pnode_name || defaultPnodeName;
      const dataTime = latest.datetime_beginning_ept || '';

      if (isNaN(lmp)) {
        console.warn(`[PJM] ${unitKey} Could not parse LMP from response:`, JSON.stringify(latest).substring(0, 300));
        this.updateUnitStatus(unitKey, { status: 'unavailable', pnodeId });
        return;
      }

      const prev = this.cachedStatus[unitKey];
      if (prev.lmpPrice !== lmp || prev.status !== 'available') {
        console.log(`[PJM] ${unitKey} LMP: $${lmp.toFixed(2)}/MWh | Congestion: $${congestion.toFixed(2)} | Loss: $${loss.toFixed(2)} | Node: ${pnodeName} | Time: ${dataTime}`);
      }

      this.updateUnitStatus(unitKey, {
        pnodeId,
        lmpPrice: lmp,
        congestionPrice: isNaN(congestion) ? undefined : congestion,
        marginalLossPrice: isNaN(loss) ? undefined : loss,
        pnodeName,
        dataTimestamp: dataTime,
        status: 'available',
      });
    } catch (err: any) {
      console.error(`[PJM] ${unitKey} Failed to parse API response:`, err.message, body.substring(0, 300));
      this.updateUnitStatus(unitKey, { status: 'error', error: 'Failed to parse response', pnodeId });
    }
  }

  // ── Voyager Auto-Login ────────────────────────────────────────────────

  /** Auto-login for the Voyager visual reference window using insertText (Chromium input pipeline) */
  private async autoLoginVoyager(): Promise<void> {
    if (!this.voyagerWindow || this.voyagerWindow.isDestroyed()) return;
    if (!this.config.voyagerUsername || !this.config.voyagerPassword) {
      console.log('[PJM] Voyager credentials not configured in pjm-config.json, skipping auto-login');
      return;
    }

    const wc = this.voyagerWindow.webContents;

    try {
      // Check if login fields exist
      const fieldsExist = await wc.executeJavaScript(`
        (function() {
          return {
            username: !!document.getElementById('username'),
            password: !!document.getElementById('password'),
            submit: !!document.getElementById('submit')
          };
        })();
      `);

      if (!fieldsExist.username || !fieldsExist.password || !fieldsExist.submit) {
        console.log('[PJM] Voyager login fields not found (may already be logged in)');
        return;
      }

      // Focus username field, clear, and type via insertText
      await wc.executeJavaScript(`
        var el = document.getElementById('username');
        el.focus();
        el.click();
        el.value = '';
      `);
      await new Promise(resolve => setTimeout(resolve, 500));
      await wc.insertText(this.config.voyagerUsername);

      // Focus password field, clear, and type via insertText
      await wc.executeJavaScript(`
        var el = document.getElementById('password');
        el.focus();
        el.click();
        el.value = '';
      `);
      await new Promise(resolve => setTimeout(resolve, 200));
      await wc.insertText(this.config.voyagerPassword);

      // Click login button
      await new Promise(resolve => setTimeout(resolve, 200));
      await wc.executeJavaScript(`document.getElementById('submit').click()`);
      console.log('[PJM] Voyager login: submitted via insertText');
    } catch (err: any) {
      console.warn(`[PJM] Voyager login failed: ${err.message}`);
    }
  }

  // ── Status Helpers ────────────────────────────────────────────────────

  private updateUnitStatus(unitKey: 'unit1' | 'unit2', partial: Partial<PjmUnitLmp>): void {
    this.cachedStatus[unitKey] = { ...this.cachedStatus[unitKey], ...partial };
    this.broadcastStatus();
  }

  private broadcastStatus(): void {
    // Recalculate evolutions on each broadcast so they stay current as hours pass
    if (this.daCache.length > 0) {
      this.cachedStatus.unit1Evolution = this.calculateUnitEvolution('unit1');
      this.cachedStatus.unit2Evolution = this.calculateUnitEvolution('unit2');
    }
    this.cachedStatus.lastUpdate = new Date().toLocaleTimeString();
    this.onStatusUpdate({
      ...this.cachedStatus,
      unit1: { ...this.cachedStatus.unit1 },
      unit2: { ...this.cachedStatus.unit2 },
      unit1Evolution: this.cachedStatus.unit1Evolution ? { ...this.cachedStatus.unit1Evolution } : undefined,
      unit2Evolution: this.cachedStatus.unit2Evolution ? { ...this.cachedStatus.unit2Evolution } : undefined,
    });
  }
}
