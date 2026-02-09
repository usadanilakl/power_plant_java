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

const PJM_API_BASE = 'https://api.pjm.com/api/v1';
const DEFAULT_PNODE_ID = 33092371; // ComEd zone aggregate
const DEFAULT_POLL_INTERVAL_MIN = 5;

// Voyager auto-login (for the "Open PJM Window" visual reference)
const PJM_LOGIN_URL = 'https://voyager.tnsk.com/platform/page/signin.html';
const PJM_USERNAME = 'PJMjackson';
const PJM_PASSWORD = 'pjm@jackson2025';

export class PjmManager {
  private pollInterval: NodeJS.Timeout | null = null;
  private voyagerWindow: BrowserWindow | null = null;
  private cachedStatus: PjmStatus = { status: 'loading', unit: '$/MWh' };
  private onStatusUpdate: (status: PjmStatus) => void;
  private config: PjmConfig;

  constructor(onStatusUpdate: (status: PjmStatus) => void) {
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

  public getConfig(): PjmConfig {
    return { ...this.config };
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

    this.voyagerWindow = new BrowserWindow({
      width: 1400,
      height: 900,
      title: 'PJM Voyager',
      webPreferences: {
        nodeIntegration: false,
        contextIsolation: true,
        partition: 'persist:pjm',
      },
    });

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

  private stop(): void {
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
        };
      }
    } catch { /* use defaults */ }

    // Create default config with the user's primary key
    const defaultConfig: PjmConfig = {
      apiKey: '4cb6a11b05634135a07cff815bfb1aeb',
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
      pnode_id: String(this.config.pnodeId),
      datetime_beginning_ept: `${todayStr}to${tomorrowStr}`,
      rowCount: '1',
      sort: 'datetime_beginning_ept',
      order: 'desc',
      fields: 'datetime_beginning_ept,pnode_id,pnode_name,voltage,equipment,type,zone,itsced_lmp,marginal_congestion,marginal_loss',
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
      const lmp = parseFloat(latest.itsced_lmp ?? latest.total_lmp_rt ?? latest.lmp);
      const congestion = parseFloat(latest.marginal_congestion ?? latest.congestion_price_rt ?? 0);
      const loss = parseFloat(latest.marginal_loss ?? latest.marginal_loss_price_rt ?? 0);
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

  /** Auto-login for the Voyager visual reference window */
  private autoLoginVoyager(): void {
    if (!this.voyagerWindow || this.voyagerWindow.isDestroyed()) return;

    const loginScript = `
      (function() {
        var emailInput = document.getElementById('username');
        var passwordInput = document.getElementById('password');
        var loginBtn = document.getElementById('submit');

        if (emailInput && passwordInput && loginBtn) {
          emailInput.value = ${JSON.stringify(PJM_USERNAME)};
          passwordInput.value = ${JSON.stringify(PJM_PASSWORD)};
          emailInput.dispatchEvent(new Event('input', { bubbles: true }));
          passwordInput.dispatchEvent(new Event('input', { bubbles: true }));
          loginBtn.click();
          return 'login-submitted';
        }
        return 'login-fields-not-found';
      })();
    `;

    this.voyagerWindow.webContents.executeJavaScript(loginScript)
      .then((result: string) => console.log(`[PJM] Voyager login: ${result}`))
      .catch((err: Error) => console.warn(`[PJM] Voyager login failed: ${err.message}`));
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
