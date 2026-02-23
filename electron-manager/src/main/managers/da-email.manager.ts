/**
 * DaEmailManager - Fetches PJM Day-Ahead Award emails from Microsoft Graph API
 * and parses the HTML tables using cheerio.
 *
 * Reuses the same Azure app registration (PFX certificate) as SharePointManager
 * but requests a Graph API scope instead of SharePoint scope.
 *
 * Requires the Azure app to have Mail.Read application permission with admin consent.
 */

import { ClientCertificateCredential } from '@azure/identity';
import * as cheerio from 'cheerio';
import * as https from 'https';
import * as fs from 'fs';
import * as path from 'path';
import { getWorkingDir } from '../paths';
import type { SharePointElectronConfig, PjmDaAward, PjmDaHourEntry } from '../../shared/types';

const GRAPH_SCOPE = 'https://graph.microsoft.com/.default';
const GRAPH_HOST = 'graph.microsoft.com';
const DA_SUBJECT_PREFIX = 'DA Schedule Notice - Jackson';
const DA_SENDER = 'TenaskaComm@tnsk.com';

export class DaEmailManager {
  private config: SharePointElectronConfig | null = null;
  private credential: ClientCertificateCredential | null = null;
  private cachedToken: string | null = null;
  private tokenExpiry = 0;
  private initialized = false;

  constructor() {
    this.loadConfig();
  }

  /** Whether Azure credentials are configured (clientId + tenantId present). */
  public isConfigured(): boolean {
    return !!(this.config?.clientId && this.config?.tenantId);
  }

  // ── Config ──────────────────────────────────────────────────────────────

  private loadConfig(): void {
    const configPath = path.join(getWorkingDir(), 'sharepoint-config.json');
    try {
      if (fs.existsSync(configPath)) {
        this.config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log('[DaEmail] Config loaded from sharepoint-config.json');
      } else {
        console.log('[DaEmail] No sharepoint-config.json found at', configPath);
      }
    } catch (err: any) {
      console.error('[DaEmail] Failed to load config:', err.message);
    }
  }

  // ── Initialization ──────────────────────────────────────────────────────

  private init(): void {
    if (this.initialized || !this.config) return;

    if (!this.config.clientId || !this.config.tenantId) {
      console.log('[DaEmail] clientId or tenantId not configured — skipping init');
      return;
    }

    // Prefer PEM (converted from PFX by ensureCertificate), fall back to PFX
    const basePath = this.config.pfxPath.replace(/\.pfx$/i, '');
    const pemRelative = basePath + '.pem';
    const pfxRelative = this.config.pfxPath;

    const pemPath = path.isAbsolute(pemRelative) ? pemRelative : path.join(getWorkingDir(), pemRelative);
    const pfxPath = path.isAbsolute(pfxRelative) ? pfxRelative : path.join(getWorkingDir(), pfxRelative);

    let certPath: string;
    let certPassword: string | undefined;

    if (fs.existsSync(pemPath)) {
      certPath = pemPath;
      certPassword = undefined; // PEM has no password (exported with -nodes)
    } else if (fs.existsSync(pfxPath)) {
      certPath = pfxPath;
      certPassword = this.config.pfxPassword || undefined;
    } else {
      console.error('[DaEmail] Certificate not found at', pemPath, 'or', pfxPath);
      return;
    }

    try {
      this.credential = new ClientCertificateCredential(
        this.config.tenantId,
        this.config.clientId,
        certPassword
          ? { certificatePath: certPath, certificatePassword: certPassword }
          : { certificatePath: certPath }
      );
      this.initialized = true;
      console.log('[DaEmail] Credential initialized:', certPath);
    } catch (err: any) {
      console.error('[DaEmail] Failed to create credential:', err.message);
    }
  }

  // ── Token Management ────────────────────────────────────────────────────

  private async ensureToken(): Promise<string> {
    this.init();
    if (!this.credential) {
      throw new Error('Graph API not configured — check sharepoint-config.json');
    }

    const now = Date.now();
    if (this.cachedToken && now < this.tokenExpiry - 5 * 60_000) {
      return this.cachedToken;
    }

    const token = await this.credential.getToken(GRAPH_SCOPE);
    if (!token) throw new Error('Failed to get Graph API access token');

    this.cachedToken = token.token;
    this.tokenExpiry = token.expiresOnTimestamp;
    console.log('[DaEmail] Token obtained, expires at', new Date(this.tokenExpiry).toLocaleTimeString());
    return this.cachedToken;
  }

  // ── Email Fetch ─────────────────────────────────────────────────────────

  /**
   * Fetch PJM DA award emails from the specified mailbox and parse them.
   * Returns awards sorted newest-first (last 30 days, up to 30 emails).
   */
  public async fetchDaAwards(emailAddress: string): Promise<PjmDaAward[]> {
    const token = await this.ensureToken();

    const since = new Date(Date.now() - 30 * 86_400_000).toISOString();
    // Note: from/emailAddress/address eq filter doesn't work reliably in Graph API — use subject prefix only
    const filter = `receivedDateTime ge ${since} and startsWith(subject,'${DA_SUBJECT_PREFIX}')`;
    // Build query string manually — URLSearchParams encodes $ as %24 which Graph API rejects
    const apiPath = `/v1.0/users/${encodeURIComponent(emailAddress)}/messages`
      + `?$filter=${encodeURIComponent(filter)}`
      + `&$select=${encodeURIComponent('subject,body,receivedDateTime,from')}`
      + `&$orderby=${encodeURIComponent('receivedDateTime desc')}`
      + `&$top=30`;
    const response = await this.graphGet(apiPath, token);
    const messages: any[] = response.value || [];

    console.log(`[DaEmail] Fetched ${messages.length} DA emails from ${emailAddress}`);

    const awards: PjmDaAward[] = [];
    for (const msg of messages) {
      const award = this.parseEmail(msg);
      if (award) awards.push(award);
    }
    return awards;
  }

  // ── HTML Parsing ────────────────────────────────────────────────────────

  /**
   * Parse a single PJM DA email into a PjmDaAward.
   * Email subject: "DA Schedule Notice - Jackson - MM/DD/YYYY"
   * Email body: HTML table "Day Ahead Awarded Energy Volumes" with rows:
   *   HE xx | U1 MW | U1 LMP | U2 MW | U2 LMP
   */
  private parseEmail(msg: any): PjmDaAward | null {
    // Extract date from subject: "DA Schedule Notice - Jackson - 02/21/2026"
    const subjectMatch = msg.subject?.match(/(\d{2}\/\d{2}\/\d{4})/);
    if (!subjectMatch) {
      console.log('[DaEmail] Skipping email with unexpected subject:', msg.subject);
      return null;
    }
    const [mm, dd, yyyy] = subjectMatch[1].split('/');
    const date = `${yyyy}-${mm}-${dd}`;

    const html = msg.body?.content || '';
    if (!html) return null;

    const $ = cheerio.load(html);
    const unit1Hours: PjmDaHourEntry[] = [];
    const unit2Hours: PjmDaHourEntry[] = [];

    // Find the specific table: caption contains "Day Ahead Awarded Energy Volumes"
    let targetTable: ReturnType<typeof $> | null = null;
    $('table').each(function (this: any) {
      const caption = $(this).find('caption').text().trim();
      if (caption.includes('Day Ahead Awarded Energy Volumes')) {
        targetTable = $(this);
        return false; // break
      }
    });

    // Fallback: if no caption match, look for a table containing "HE" header cells
    if (!targetTable) {
      $('table').each(function (this: any) {
        const headerText = $(this).find('th, td').first().text().trim();
        if (headerText === 'Hour' || headerText.startsWith('HE')) {
          targetTable = $(this);
          return false;
        }
      });
    }

    if (!targetTable) {
      console.log(`[DaEmail] No "Day Ahead Awarded Energy Volumes" table found for ${date}`);
      return null;
    }

    (targetTable as ReturnType<typeof $>).find('tr').each(function (this: any) {
      const cells = $(this).find('td');
      if (cells.length < 5) return;

      // Hour cells contain just "01".."24" (not "HE 01")
      const heText = $(cells[0]).text().trim();
      const he = parseInt(heText, 10);
      if (isNaN(he) || he < 1 || he > 24) return;

      unit1Hours.push({
        he,
        mw: parseFloat($(cells[1]).text().trim().replace(/,/g, '')) || 0,
        lmp: parseFloat($(cells[2]).text().trim().replace(/[$,]/g, '')) || 0,
      });
      unit2Hours.push({
        he,
        mw: parseFloat($(cells[3]).text().trim().replace(/,/g, '')) || 0,
        lmp: parseFloat($(cells[4]).text().trim().replace(/[$,]/g, '')) || 0,
      });
    });

    // DST transitions may have 23 or 25 hours; require at least 23
    if (unit1Hours.length < 23) {
      console.log(`[DaEmail] Incomplete table for ${date}: found ${unit1Hours.length} rows`);
      return null;
    }

    const hourCount = unit1Hours.length;
    return {
      date,
      unit1Hours,
      unit2Hours,
      unit1TotalAwardedHours: unit1Hours.filter(h => h.mw > 0).length,
      unit2TotalAwardedHours: unit2Hours.filter(h => h.mw > 0).length,
      unit1AvgLMP: unit1Hours.reduce((s, h) => s + h.lmp, 0) / hourCount,
      unit2AvgLMP: unit2Hours.reduce((s, h) => s + h.lmp, 0) / hourCount,
      processedAt: msg.receivedDateTime,
    };
  }

  // ── Graph API Helper ────────────────────────────────────────────────────

  private graphGet(apiPath: string, token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const options: https.RequestOptions = {
        hostname: GRAPH_HOST,
        path: apiPath,
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
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
            reject(new Error('Graph API returned 401 — token may be expired or Mail.Read permission missing'));
            return;
          }
          if (res.statusCode !== 200) {
            reject(new Error(`Graph API returned ${res.statusCode}: ${body.substring(0, 500)}`));
            return;
          }
          try {
            resolve(JSON.parse(body));
          } catch (err: any) {
            reject(new Error(`Failed to parse Graph API response: ${err.message}`));
          }
        });
      });

      req.on('error', (err) => reject(new Error(`Graph API request failed: ${err.message}`)));
      req.on('timeout', () => {
        req.destroy();
        reject(new Error('Graph API request timed out'));
      });

      req.end();
    });
  }
}
