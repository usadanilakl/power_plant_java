/**
 * SharePointManager - Reads data from SharePoint Online using Azure certificate authentication.
 *
 * Mirrors the Java SharePointCertificateAccess pattern:
 *   - PFX certificate loaded via @azure/identity ClientCertificateCredential
 *   - Bearer token cached with 5-minute expiry buffer
 *   - SharePoint REST API (/_api/web/lists/...)
 *
 * Currently used for reading PJM Day-Ahead Award data from a SharePoint list
 * populated by a Power Automate flow.
 */

import { ClientCertificateCredential } from '@azure/identity';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { getWorkingDir } from '../paths';
import type { SharePointElectronConfig, PjmDaAward, PjmDaHourEntry } from '../../shared/types';

const DA_AWARDS_LIST = 'PJM Day Ahead Awards';

export class SharePointManager {
  private config: SharePointElectronConfig | null = null;
  private credential: ClientCertificateCredential | null = null;
  private cachedToken: string | null = null;
  private tokenExpiry: number = 0; // ms since epoch
  private initialized = false;

  constructor() {
    this.loadConfig();
  }

  /** Whether the service is configured (has clientId + tenantId). */
  public isConfigured(): boolean {
    return !!(this.config?.clientId && this.config?.tenantId);
  }

  // ── Config ──────────────────────────────────────────────────────────────

  private loadConfig(): void {
    const configPath = path.join(getWorkingDir(), 'sharepoint-config.json');
    try {
      if (fs.existsSync(configPath)) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log('[SharePoint] Config loaded');
      } else {
        console.log('[SharePoint] No config file found at', configPath);
      }
    } catch (err: any) {
      console.error('[SharePoint] Failed to load config:', err.message);
    }
  }

  // ── Initialization ──────────────────────────────────────────────────────

  private init(): void {
    if (this.initialized || !this.config) return;

    if (!this.config.clientId || !this.config.tenantId) {
      console.log('[SharePoint] clientId or tenantId not configured — skipping init');
      return;
    }

    // Resolve PFX path (relative to working dir or absolute)
    const pfxPath = path.isAbsolute(this.config.pfxPath)
      ? this.config.pfxPath
      : path.join(getWorkingDir(), this.config.pfxPath);

    if (!fs.existsSync(pfxPath)) {
      console.error('[SharePoint] PFX certificate not found at', pfxPath);
      return;
    }

    try {
      this.credential = new ClientCertificateCredential(
        this.config.tenantId,
        this.config.clientId,
        {
          certificatePath: pfxPath,
          certificatePassword: this.config.pfxPassword || undefined,
        }
      );
      this.initialized = true;
      console.log('[SharePoint] Credential initialized (PFX:', pfxPath, ')');
    } catch (err: any) {
      console.error('[SharePoint] Failed to create credential:', err.message);
    }
  }

  // ── Token Management ────────────────────────────────────────────────────

  private async ensureToken(): Promise<string> {
    this.init();
    if (!this.credential) {
      throw new Error('SharePoint not configured — check sharepoint-config.json');
    }

    const now = Date.now();
    // Reuse cached token if still valid (with 5-minute buffer)
    if (this.cachedToken && now < this.tokenExpiry - 5 * 60_000) {
      return this.cachedToken;
    }

    const scope = this.config!.siteUrl.replace(/\/sites\/.*$/, '') + '/.default';
    // e.g. "https://jpowerusa.sharepoint.com/.default"

    const token = await this.credential.getToken(scope);
    if (!token) throw new Error('Failed to get SharePoint access token');

    this.cachedToken = token.token;
    this.tokenExpiry = token.expiresOnTimestamp;
    console.log('[SharePoint] Token obtained, expires at', new Date(this.tokenExpiry).toLocaleTimeString());
    return this.cachedToken;
  }

  // ── SharePoint REST API ─────────────────────────────────────────────────

  /**
   * GET list items from a SharePoint list.
   * @param listTitle  The list title (e.g., "PJM Day Ahead Awards")
   * @param query      OData query string (e.g., "$orderby=AwardDate desc&$top=30")
   */
  public async getListItems(listTitle: string, query?: string): Promise<any[]> {
    const token = await this.ensureToken();
    const encodedTitle = encodeURIComponent(listTitle);
    const apiPath = `/_api/web/lists/getbytitle('${encodedTitle}')/items${query ? '?' + query : ''}`;

    const urlObj = new URL(this.config!.siteUrl + apiPath);

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json;odata=nometadata',
        },
        timeout: 30_000,
      };

      const req = https.request(options, (res) => {
        let body = '';
        res.on('data', (chunk) => body += chunk);
        res.on('end', () => {
          if (res.statusCode === 401) {
            // Token might be stale — clear cache for retry
            this.cachedToken = null;
            this.tokenExpiry = 0;
            reject(new Error('SharePoint returned 401 — token may be expired'));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`SharePoint returned ${res.statusCode}: ${body.substring(0, 500)}`));
            return;
          }
          try {
            const data = JSON.parse(body);
            // Handle both OData v3 (d.results) and v4 (value) response shapes
            const items = data.value || data.d?.results || [];
            resolve(items);
          } catch (err: any) {
            reject(new Error(`Failed to parse SharePoint response: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`SharePoint request failed: ${err.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('SharePoint request timed out'));
      });

      req.end();
    });
  }

  // ── PJM Day-Ahead Awards ────────────────────────────────────────────────

  /**
   * Fetch DA awards from the SharePoint list.
   * Returns most recent 30 days by default, or filtered by a specific date.
   */
  public async fetchDaAwards(dateFilter?: string): Promise<PjmDaAward[]> {
    const query = dateFilter
      ? `$filter=AwardDate eq '${dateFilter}'&$orderby=AwardDate desc`
      : `$orderby=AwardDate desc&$top=30`;

    const items = await this.getListItems(DA_AWARDS_LIST, query);
    return items.map(item => this.mapSpItemToDaAward(item));
  }

  private mapSpItemToDaAward(item: any): PjmDaAward {
    let unit1Hours: PjmDaHourEntry[] = [];
    let unit2Hours: PjmDaHourEntry[] = [];

    try {
      if (item.Unit1Data) unit1Hours = JSON.parse(item.Unit1Data);
    } catch { /* empty array fallback */ }

    try {
      if (item.Unit2Data) unit2Hours = JSON.parse(item.Unit2Data);
    } catch { /* empty array fallback */ }

    // Parse AwardDate — SP dates come as "YYYY-MM-DDT00:00:00Z" or "MM/DD/YYYY"
    let date = '';
    if (item.AwardDate) {
      const d = new Date(item.AwardDate);
      if (!isNaN(d.getTime())) {
        date = d.toISOString().split('T')[0]; // YYYY-MM-DD
      } else {
        date = item.AwardDate;
      }
    }

    return {
      date,
      unit1Hours,
      unit2Hours,
      unit1TotalAwardedHours: item.Unit1TotalHours ?? unit1Hours.filter(h => h.mw > 0).length,
      unit2TotalAwardedHours: item.Unit2TotalHours ?? unit2Hours.filter(h => h.mw > 0).length,
      unit1AvgLMP: item.Unit1AvgLMP ?? 0,
      unit2AvgLMP: item.Unit2AvgLMP ?? 0,
      processedAt: item.ProcessedAt || undefined,
    };
  }
}
