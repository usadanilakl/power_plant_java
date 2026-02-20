/**
 * PjmManager - Polls PJM Data Miner 2 REST API for real-time LMP prices.
 *
 * API: https://api.pjm.com/api/v1/rt_unverified_fivemin_lmps
 * Auth: Ocp-Apim-Subscription-Key header
 * Data: 5-minute unverified LMP for a specific pricing node (pnode)
 *
 * Also provides a convenience method to open Voyager in a visible window
 * for manual inspection (auto-login included).
 */

import { BrowserWindow } from 'electron';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import type { PjmStatus, PjmConfig } from '../../shared/types';
import { getWorkingDir } from '../paths';
import { WindowLayoutManager } from './window-layout.manager';

const PJM_API_BASE = 'https://api.pjm.com/api/v1';
const DEFAULT_PNODE_ID = 2156111010; // U1 Jackson
// const DEFAULT_PNODE_ID = 33092371; // ComEd zone aggregate
const DEFAULT_POLL_INTERVAL_MIN = 5;

// Voyager auto-login (credentials loaded from pjm-config.json at runtime)
const PJM_LOGIN_URL = 'https://voyager.tnsk.com/platform/page/signin.html';

export class PjmManager {
  private pollInterval: NodeJS.Timeout | null = null;
  private voyagerWindow: BrowserWindow | null = null;
  private cachedStatus: PjmStatus = { status: 'unavailable', unit: '$/MWh' };
  private onStatusUpdate: (status: PjmStatus) => void;
  private config: PjmConfig;
  private layoutManager: WindowLayoutManager;

  constructor(layoutManager: WindowLayoutManager, onStatusUpdate: (status: PjmStatus) => void) {
    this.layoutManager = layoutManager;
    this.onStatusUpdate = onStatusUpdate;
    this.config = this.loadConfig();
  }

  public start(): void {
    if (this.pollInterval) return;

    console.log(`[PJM] Starting LMP polling (every ${this.config.pollIntervalMinutes} min, pnode=${this.config.pnodeId})...`);

    // Immediate first fetch
    this.fetchLmpData();

    this.pollInterval = setInterval(
      () => this.fetchLmpData(),
      this.config.pollIntervalMinutes * 60_000
    );
  }

  public getStatus(): PjmStatus {
    return { ...this.cachedStatus };
  }

  public refresh(): void {
    this.fetchLmpData();
  }

  public isPolling(): boolean {
    return this.pollInterval !== null;
  }

  public getConfig(): PjmConfig {
    return { ...this.config };
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
  }

  private loadConfig(): PjmConfig {
    const configPath = path.join(getWorkingDir(), 'pjm-config.json');
    try {
      if (fs.existsSync(configPath)) {
        const raw = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        return {
          apiKey: raw.apiKey || '',
          pnodeId: raw.pnodeId || DEFAULT_PNODE_ID,
          pnodeName: raw.pnodeName || 'ComEd',
          pollIntervalMinutes: raw.pollIntervalMinutes || DEFAULT_POLL_INTERVAL_MIN,
          voyagerUsername: raw.voyagerUsername || '',
          voyagerPassword: raw.voyagerPassword || '',
        };
      }
    } catch { /* use defaults */ }

    // Create default config (API key must be set in pjm-config.json)
    const defaultConfig: PjmConfig = {
      apiKey: '',
      pnodeId: DEFAULT_PNODE_ID,
      pnodeName: 'ComEd',
      pollIntervalMinutes: DEFAULT_POLL_INTERVAL_MIN,
    };

    try {
      fs.writeFileSync(configPath, JSON.stringify(defaultConfig, null, 2), 'utf-8');
    } catch { /* best effort */ }

    return defaultConfig;
  }

  /**
   * Fetch latest LMP data from PJM Data Miner 2 API.
   * Endpoint: rt_unverified_fivemin_lmps
   * Returns the most recent 5-minute LMP for the configured pnode.
   */
  private fetchLmpData(): void {
    if (!this.config.apiKey) {
      this.updateStatus({
        status: 'error',
        error: 'PJM API key not configured. Set it in pjm-config.json.',
      });
      return;
    }

    // Build query: get latest row, sorted descending by time
    const now = new Date();
    const todayStr = `${now.getMonth() + 1}/${now.getDate()}/${now.getFullYear()} 00:00`;
    const tomorrowDate = new Date(now);
    tomorrowDate.setDate(tomorrowDate.getDate() + 1);
    const tomorrowStr = `${tomorrowDate.getMonth() + 1}/${tomorrowDate.getDate()}/${tomorrowDate.getFullYear()} 00:00`;

    const params = new URLSearchParams({
      startRow: '1',
      rowCount: '1',
      pnode_id: String(this.config.pnodeId),
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
      },
      timeout: 15_000,
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode !== 200) {
          console.error(`[PJM] API returned ${res.statusCode}: ${body.substring(0, 300)}`);
          this.updateStatus({
            status: 'error',
            error: `API returned ${res.statusCode}`,
          });
          return;
        }else{
          console.log(`Options: ${JSON.stringify(options)}, response: ${body.substring(0, 500)}`)
        }

        this.parseLmpResponse(body);
      });
    });

    req.on('error', (err) => {
      console.error(`[PJM] API request failed: ${err.message}`);
      this.updateStatus({
        status: 'error',
        error: `Request failed: ${err.message}`,
      });
    });

    req.on('timeout', () => {
      req.destroy();
      console.error('[PJM] API request timed out');
      this.updateStatus({ status: 'error', error: 'Request timed out' });
    });

    req.end();
  }

  private parseLmpResponse(body: string): void {
    try {
      const data = JSON.parse(body);

      // PJM API returns { items: [...], totalRows: n, ... }
      const items = data.items || data;

      if (!Array.isArray(items) || items.length === 0) {
        console.log('[PJM] No LMP data returned for the current period');
        this.updateStatus({ status: 'unavailable' });
        return;
      }

      const latest = items[0];
      console.log('[PJM] Response fields:', Object.keys(latest).join(', '));
      const lmp = parseFloat(latest.total_lmp_rt ?? latest.itsced_lmp ?? latest.lmp);
      const congestion = parseFloat(latest.congestion_price_rt ?? latest.marginal_congestion ?? 0);
      const loss = parseFloat(latest.marginal_loss_price_rt ?? latest.marginal_loss ?? 0);
      const pnodeName = latest.pnode_name || this.config.pnodeName;
      const dataTime = latest.datetime_beginning_ept || '';

      if (isNaN(lmp)) {
        console.warn('[PJM] Could not parse LMP from response:', JSON.stringify(latest).substring(0, 300));
        this.updateStatus({ status: 'unavailable' });
        return;
      }

      const now = new Date().toLocaleTimeString();
      const newStatus: PjmStatus = {
        lmpPrice: lmp,
        congestionPrice: isNaN(congestion) ? undefined : congestion,
        marginalLossPrice: isNaN(loss) ? undefined : loss,
        pnodeName,
        dataTimestamp: dataTime,
        unit: '$/MWh',
        lastUpdate: now,
        status: 'available',
      };

      if (this.cachedStatus.lmpPrice !== lmp || this.cachedStatus.status !== 'available') {
        console.log(`[PJM] LMP: $${lmp.toFixed(2)}/MWh | Congestion: $${congestion.toFixed(2)} | Loss: $${loss.toFixed(2)} | Node: ${pnodeName} | Time: ${dataTime}`);
      }

      this.cachedStatus = newStatus;
      this.onStatusUpdate(newStatus);
    } catch (err: any) {
      console.error('[PJM] Failed to parse API response:', err.message, body.substring(0, 300));
      this.updateStatus({ status: 'error', error: 'Failed to parse response' });
    }
  }

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

  private updateStatus(partial: Partial<PjmStatus>): void {
    this.cachedStatus = {
      ...this.cachedStatus,
      ...partial,
      lastUpdate: new Date().toLocaleTimeString(),
    };
    this.onStatusUpdate(this.cachedStatus);
  }
}
