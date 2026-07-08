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

type SharePointListFieldDefinition = {
  name: string;
  typeKind: number;
};

type SharePointHttpError = Error & {
  statusCode?: number;
};

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

    // Resolve certificate path — prefer PEM, fall back to PFX
    const basePath = path.isAbsolute(this.config.pfxPath)
      ? path.dirname(this.config.pfxPath)
      : path.join(getWorkingDir(), path.dirname(this.config.pfxPath));
    const pemPath = path.join(basePath, 'certificate.pem');
    const pfxPath = path.isAbsolute(this.config.pfxPath)
      ? this.config.pfxPath
      : path.join(getWorkingDir(), this.config.pfxPath);

    // @azure/identity v4+ requires PEM format for certificatePath
    const certPath = fs.existsSync(pemPath) ? pemPath : pfxPath;

    if (!fs.existsSync(certPath)) {
      console.error('[SharePoint] Certificate not found at', certPath);
      return;
    }

    try {
      this.credential = new ClientCertificateCredential(
        this.config.tenantId,
        this.config.clientId,
        {
          certificatePath: certPath,
          certificatePassword: this.config.pfxPassword || undefined,
        }
      );
      this.initialized = true;
      console.log('[SharePoint] Credential initialized (cert:', certPath, ')');
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

  private listEndpoint(listTitle: string): string {
    return `/_api/web/lists/getbytitle('${encodeURIComponent(listTitle)}')`;
  }

  private makeHttpError(statusCode: number | undefined, body: string, context: string): SharePointHttpError {
    const message = statusCode
      ? `SharePoint ${context} returned ${statusCode}: ${body.substring(0, 500)}`
      : `SharePoint ${context} failed: ${body.substring(0, 500)}`;
    const err = new Error(message) as SharePointHttpError;
    err.statusCode = statusCode;
    return err;
  }

  private async requestJson(
    apiPath: string,
    method: 'GET' | 'POST' = 'GET',
    body?: unknown,
    extraHeaders: Record<string, string> = {},
    retry = true
  ): Promise<any> {
    const token = await this.ensureToken();
    const urlObj = new URL(this.config!.siteUrl + apiPath);
    const payload = body === undefined ? undefined : (typeof body === 'string' ? body : JSON.stringify(body));

    return new Promise((resolve, reject) => {
      const headers: Record<string, string> = {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json;odata=nometadata',
        ...extraHeaders,
      };
      if (payload !== undefined && !headers['Content-Type']) {
        headers['Content-Type'] = 'application/json';
      }

      const options: https.RequestOptions = {
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method,
        headers,
        timeout: 30_000,
      };

      const req = https.request(options, (res) => {
        let responseBody = '';
        res.on('data', (chunk) => responseBody += chunk);
        res.on('end', async () => {
          if (res.statusCode === 401 && retry) {
            this.cachedToken = null;
            this.tokenExpiry = 0;
            try {
              resolve(await this.requestJson(apiPath, method, body, extraHeaders, false));
            } catch (err) {
              reject(err);
            }
            return;
          }

          if (!res.statusCode || res.statusCode < 200 || res.statusCode >= 300) {
            reject(this.makeHttpError(res.statusCode, responseBody, `${method} ${apiPath}`));
            return;
          }

          if (!responseBody.trim()) {
            resolve(null);
            return;
          }

          try {
            resolve(JSON.parse(responseBody));
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

      if (payload !== undefined) {
        req.write(payload);
      }
      req.end();
    });
  }

  public async listExists(listTitle: string): Promise<boolean> {
    try {
      await this.requestJson(`${this.listEndpoint(listTitle)}?$select=Title`);
      return true;
    } catch (err: any) {
      if (err?.statusCode === 404) return false;
      throw err;
    }
  }

  public async fieldExists(listTitle: string, fieldName: string): Promise<boolean> {
    try {
      await this.requestJson(`${this.listEndpoint(listTitle)}/fields/getbyinternalnameortitle('${encodeURIComponent(fieldName)}')`);
      return true;
    } catch (err: any) {
      if (err?.statusCode === 400 || err?.statusCode === 404) return false;
      throw err;
    }
  }

  public async createList(listTitle: string): Promise<void> {
    await this.requestJson('/_api/web/lists', 'POST', {
      Title: listTitle,
      BaseTemplate: 100,
      Description: 'Auto-provisioned by DK Power Manager',
    });
    console.log(`[SharePoint] Created list '${listTitle}'`);
  }

  public async addFieldToList(listTitle: string, fieldName: string, fieldTypeKind: number): Promise<void> {
    await this.requestJson(`${this.listEndpoint(listTitle)}/fields`, 'POST', {
      Title: fieldName,
      FieldTypeKind: fieldTypeKind,
      Required: false,
    });
    console.log(`[SharePoint] Added field '${fieldName}' to '${listTitle}'`);
  }

  public async addFieldToDefaultView(listTitle: string, fieldName: string): Promise<void> {
    try {
      await this.requestJson(`${this.listEndpoint(listTitle)}/DefaultView/ViewFields/addviewfield('${encodeURIComponent(fieldName)}')`, 'POST', {});
    } catch (err: any) {
      console.warn(`[SharePoint] Failed to add '${fieldName}' to '${listTitle}' default view:`, err.message);
    }
  }

  public async ensureList(listTitle: string, fields: SharePointListFieldDefinition[]): Promise<void> {
    const exists = await this.listExists(listTitle);
    if (!exists) {
      await this.createList(listTitle);
    }

    for (const field of fields) {
      const exists = await this.fieldExists(listTitle, field.name);
      if (exists) continue;
      await this.addFieldToList(listTitle, field.name, field.typeKind);
      await this.addFieldToDefaultView(listTitle, field.name);
    }
  }

  public async createListItem(listTitle: string, fields: Record<string, unknown>): Promise<string> {
    const data = await this.requestJson(`${this.listEndpoint(listTitle)}/items`, 'POST', fields);
    const id = data?.ID ?? data?.Id ?? data?.d?.ID ?? data?.d?.Id;
    if (id == null) {
      throw new Error(`SharePoint did not return an ID for new item in '${listTitle}'`);
    }
    return String(id);
  }

  public async updateListItem(listTitle: string, itemId: string | number, fields: Record<string, unknown>): Promise<void> {
    await this.requestJson(`${this.listEndpoint(listTitle)}/items(${itemId})`, 'POST', fields, {
      'IF-MATCH': '*',
      'X-HTTP-Method': 'MERGE',
    });
  }

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

  // ── Folder Listing ──────────────────────────────────────────────────────

  /**
   * List files in a SharePoint folder.
   * @param folderRelativeUrl  e.g., "/sites/JG/External/60 - Operations/..."
   */
  public async listFiles(folderRelativeUrl: string): Promise<{ name: string; serverRelativeUrl: string; size: number; modified: string }[]> {
    const token = await this.ensureToken();
    const encodedPath = folderRelativeUrl.split('/').map(s => encodeURIComponent(s)).join('/');
    const apiPath = `/_api/web/GetFolderByServerRelativeUrl('${encodedPath}')/Files`;
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
            this.cachedToken = null;
            this.tokenExpiry = 0;
            reject(new Error('SharePoint returned 401'));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`SharePoint folder listing returned ${res.statusCode}: ${body.substring(0, 300)}`));
            return;
          }
          try {
            const data = JSON.parse(body);
            const files = (data.value || []).map((f: any) => ({
              name: f.Name || '',
              serverRelativeUrl: f.ServerRelativeUrl || '',
              size: f.Length || 0,
              modified: f.TimeLastModified || '',
            }));
            resolve(files);
          } catch (err: any) {
            reject(new Error(`Failed to parse folder listing: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`SharePoint folder listing failed: ${err.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('SharePoint folder listing timed out')); });
      req.end();
    });
  }

  // ── File Downloads ──────────────────────────────────────────────────────

  /**
   * Download a file from a SharePoint document library as a Buffer.
   * @param serverRelativeUrl  e.g., "/sites/JG/Shared Documents/file.xlsx"
   */
  public async downloadFile(serverRelativeUrl: string): Promise<Buffer> {
    const token = await this.ensureToken();
    // Use @a parameter syntax to pass the path separately in the query string
    // This avoids issues with #, &, etc. in filenames breaking the URL path
    const siteUrl = this.config!.siteUrl;
    const hostname = siteUrl.replace(/^https?:\/\//, '').split('/')[0];
    const sitePath = '/' + siteUrl.replace(/^https?:\/\//, '').split('/').slice(1).join('/');
    const encodedParam = encodeURIComponent("'" + serverRelativeUrl + "'");
    const fullPath = `${sitePath}/_api/web/GetFileByServerRelativeUrl(@a)/$value?@a=${encodedParam}`;
    console.log('[SharePoint] Downloading:', serverRelativeUrl.substring(serverRelativeUrl.lastIndexOf('/') + 1));

    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname,
        path: fullPath,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        timeout: 60_000,
      };

      const req = https.request(options, (res) => {
        if (res.statusCode === 401) {
          this.cachedToken = null;
          this.tokenExpiry = 0;
          reject(new Error('SharePoint returned 401 — token may be expired'));
          return;
        }
        if (res.statusCode === 302 || res.statusCode === 301) {
          // Follow redirect
          const location = res.headers.location;
          if (location) {
            this.downloadFromUrl(location, token).then(resolve).catch(reject);
            return;
          }
        }
        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => reject(new Error(`SharePoint file download returned ${res.statusCode}: ${body.substring(0, 300)}`)));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          console.log(`[SharePoint] Downloaded ${buf.length} bytes`);
          resolve(buf);
        });
      });

      req.on('error', (err) => reject(new Error(`SharePoint file download failed: ${err.message}`)));
      req.on('timeout', () => { req.destroy(); reject(new Error('SharePoint file download timed out')); });
      req.end();
    });
  }

  private downloadFromUrl(url: string, token: string): Promise<Buffer> {
    const urlObj = new URL(url);
    return new Promise((resolve, reject) => {
      const req = https.request({
        hostname: urlObj.hostname,
        path: urlObj.pathname + urlObj.search,
        method: 'GET',
        headers: { 'Authorization': `Bearer ${token}` },
        timeout: 60_000,
      }, (res) => {
        if (res.statusCode !== 200) {
          let body = '';
          res.on('data', (chunk) => body += chunk);
          res.on('end', () => reject(new Error(`Redirect download returned ${res.statusCode}`)));
          return;
        }
        const chunks: Buffer[] = [];
        res.on('data', (chunk) => chunks.push(chunk));
        res.on('end', () => resolve(Buffer.concat(chunks)));
      });
      req.on('error', (err) => reject(err));
      req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
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
