/**
 * GateLogManager - Manages gate log data from two sources:
 * 1. OnLocation API (visitor events via REST)
 * 2. Gate Website (card reader data via hidden BrowserWindow scraping)
 *
 * Combines both sources into a unified people-on-site list.
 */

import { BrowserWindow, session } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as https from 'https';
import * as XLSX from 'xlsx';
import { DEFAULT_GATE_LOG_CONFIG } from '../constants';
import { getWorkingDir } from '../paths';
import type { GateLogEntry, GateLogStatus, GateLogConfig } from '../../shared/types';

export class GateLogManager {
  private config: GateLogConfig;
  private cachedPeople: GateLogEntry[] = [];
  private lastUpdate: Date | null = null;
  private autoRefreshTimer: NodeJS.Timeout | null = null;
  private isRefreshing = false;
  private lastError: string | undefined;
  private configPath: string;
  private onPeopleUpdated: (() => void) | null = null;

  constructor() {
    this.configPath = path.join(getWorkingDir(), 'gate-log-config.json');
    this.config = this.loadConfig();

    // Accept self-signed certs for gate website
    this.setupCertificateHandling();

    // Restore auto-refresh if enabled
    if (this.config.autoRefresh) {
      this.startAutoRefreshTimer();
    }
  }

  /**
   * Set callback for when people data is updated (auto-refresh broadcasts).
   */
  public setOnPeopleUpdated(callback: () => void): void {
    this.onPeopleUpdated = callback;
  }

  // ─── Configuration ────────────────────────────────────────────────────

  public loadConfig(): GateLogConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return { ...DEFAULT_GATE_LOG_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('Failed to load gate-log config, using defaults:', err);
    }
    return { ...DEFAULT_GATE_LOG_CONFIG };
  }

  public saveConfig(config: GateLogConfig): void {
    this.config = config;
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2), 'utf-8');
    console.log('Gate log config saved');
  }

  public getConfig(): GateLogConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return !!(this.config.onLocationApiKey || this.config.gateUsername);
  }

  // ─── Status & Cached Data ─────────────────────────────────────────────

  public getStatus(): GateLogStatus {
    return {
      lastUpdate: this.lastUpdate?.toISOString() ?? null,
      autoRefreshEnabled: this.config.autoRefresh,
      refreshIntervalMinutes: this.config.intervalMinutes,
      isRefreshing: this.isRefreshing,
      configured: this.isConfigured(),
      totalPeople: this.cachedPeople.length,
      error: this.lastError
    };
  }

  public getCachedPeople(): GateLogEntry[] {
    return [...this.cachedPeople];
  }

  /**
   * Full contractor directory from OnLocation (not just the people on site).
   * Fetches /sp/member + /sp/org via the same caching path as the gate-log refresh,
   * then flattens into ContractorEntry shape that mirrors the backend's ContractorDto.
   */
  public async getContractorDirectory(): Promise<Array<{
    onLocationMemberId: string;
    name: string;
    email?: string;
    phone?: string;
    company?: string;
    title?: string;
    validFrom?: string;
    validTo?: string;
    status?: string;
  }>> {
    await this.ensureContractorDirectories();

    const out: Array<{
      onLocationMemberId: string; name: string; email?: string; phone?: string; company?: string;
      title?: string; validFrom?: string; validTo?: string; status?: string;
    }> = [];
    for (const [id, member] of this.contractorMemberMap.entries()) {
      const name = member.name
        || [member.first_name, member.last_name].filter(Boolean).join(' ')
        || 'Unknown';
      const spOrg = Array.isArray(member.sp_orgs) && member.sp_orgs.length > 0 ? member.sp_orgs[0] : null;
      const company = spOrg?.name
        || (spOrg?.id != null ? this.contractorOrgCache.get(spOrg.id) : undefined)
        || member.company
        || 'Contractor';
      out.push({
        onLocationMemberId: String(id),
        name,
        email: member.email || member.altemail || undefined,
        phone: member.mobile || member.phone || undefined,
        company,
        title: member.title || undefined,
        validFrom: member.valid_from || undefined,
        validTo: member.valid_to || undefined,
        status: member.status || undefined
      });
    }
    return out;
  }

  // ─── Refresh (combines both sources) ──────────────────────────────────

  public async refresh(): Promise<GateLogEntry[]> {
    if (this.isRefreshing) {
      return this.cachedPeople;
    }

    this.isRefreshing = true;
    this.lastError = undefined;

    try {
      console.log('[GateLog] Starting refresh...');

      const [onLocationPeople, gatePeople] = await Promise.allSettled([
        this.fetchOnLocationPeople(),
        this.scrapeGateData()
      ]);

      const combined: GateLogEntry[] = [];
      const errors: string[] = [];

      if (onLocationPeople.status === 'fulfilled') {
        console.log(`[GateLog] OnLocation: ${onLocationPeople.value.length} people`);
        combined.push(...onLocationPeople.value);
      } else {
        const errMsg = onLocationPeople.reason?.message || String(onLocationPeople.reason);
        console.error('[GateLog] OnLocation fetch failed:', errMsg);
        errors.push(`OnLocation: ${errMsg}`);
      }

      if (gatePeople.status === 'fulfilled') {
        console.log(`[GateLog] Gate: ${gatePeople.value.length} people`);
        combined.push(...gatePeople.value);
      } else {
        const errMsg = gatePeople.reason?.message || String(gatePeople.reason);
        console.error('[GateLog] Gate scrape failed:', errMsg);
        errors.push(`Gate: ${errMsg}`);
      }

      if (errors.length === 2) {
        this.lastError = errors.join(' | ');
      } else if (errors.length === 1) {
        this.lastError = errors[0];
      }

      // Sort by check-in time (most recent first)
      combined.sort((a, b) => {
        if (!a.checkIn) return 1;
        if (!b.checkIn) return -1;
        return new Date(b.checkIn).getTime() - new Date(a.checkIn).getTime();
      });

      this.cachedPeople = combined;
      this.lastUpdate = new Date();

      console.log(`Gate log refreshed: ${combined.length} people on site`);
      return combined;
    } catch (err: any) {
      this.lastError = err.message || 'Refresh failed';
      console.error('Gate log refresh error:', err);
      return this.cachedPeople;
    } finally {
      this.isRefreshing = false;
    }
  }

  // ─── OnLocation API ──────────────────────────────────────────────────

  /**
   * Fetches all people from OnLocation: visitors + contractors in parallel.
   */
  private async fetchOnLocationPeople(): Promise<GateLogEntry[]> {
    if (!this.config.onLocationApiKey) {
      console.log('[GateLog] OnLocation: no API key configured, skipping');
      return [];
    }

    const [visitors, contractors] = await Promise.allSettled([
      this.fetchOnLocationVisitors(),
      this.fetchOnLocationContractors()
    ]);

    const combined: GateLogEntry[] = [];

    if (visitors.status === 'fulfilled') {
      combined.push(...visitors.value);
    } else {
      console.error('[GateLog] OnLocation visitors fetch failed:', visitors.reason?.message);
    }

    if (contractors.status === 'fulfilled') {
      combined.push(...contractors.value);
    } else {
      console.error('[GateLog] OnLocation contractors fetch failed:', contractors.reason?.message);
    }

    console.log(`[GateLog] OnLocation total: ${combined.length} people (visitors + contractors)`);
    return combined;
  }

  private async fetchOnLocationVisitors(): Promise<GateLogEntry[]> {
    const response = await this.onLocationGet('/visitor/event');
    const events = this.unwrapResponse(response);
    return this.parseVisitorEvents(events);
  }

  // Cached contractor member + org directories (rarely change, expensive to fetch)
  private contractorMemberMap: Map<number, any> = new Map();  // id → member record
  private contractorOrgCache: Map<number, string> = new Map();
  private contractorDirCacheTime = 0;
  private static CONTRACTOR_DIR_CACHE_TTL = 60 * 60_000; // 1 hour

  /**
   * Fetch contractors currently on site:
   * 1. GET /sp/member/movement — all movements (no date filter; overnight-safe)
   * 2. Filter by signed_out == null (still on site)
   * 3. Join with cached member directory for names/email/phone
   */
  private async fetchOnLocationContractors(): Promise<GateLogEntry[]> {
    // Fetch movements AND member directories in parallel
    const [movementResp, _dirResp] = await Promise.allSettled([
      this.onLocationGet('/sp/member/movement', 5, 60_000),
      this.ensureContractorDirectories()
    ]);

    if (movementResp.status !== 'fulfilled') {
      console.error(`[GateLog] OnLocation contractor movements failed: ${movementResp.reason?.message}`);
      return [];
    }

    const movements = this.unwrapResponse(movementResp.value);

    const people: GateLogEntry[] = [];
    for (const mov of movements) {
      if (mov.signed_out != null) continue;

      const member = this.contractorMemberMap.get(mov.sp_member_id);
      const name = member
        ? (member.name || [member.first_name, member.last_name].filter(Boolean).join(' ') || 'Unknown')
        : (mov.name || 'Unknown');
      // Company: embedded in member's sp_orgs array
      const spOrg = member && Array.isArray(member.sp_orgs) && member.sp_orgs.length > 0 ? member.sp_orgs[0] : null;
      const company = spOrg?.name
        || this.contractorOrgCache.get(mov.sp_org_id)
        || member?.company || 'Contractor';

      const checkIn = this.convertOnLocationDate(mov.signed_in);
      const duration = checkIn ? this.calculateDuration(checkIn) : undefined;

      people.push({
        name,
        company,
        checkIn,
        email: member?.email || undefined,
        phone: member?.mobile || member?.phone || undefined,
        duration,
        source: 'onlocation'
      });
    }

    console.log(`[GateLog] OnLocation contractors: ${movements.length} total -> ${people.length} on site`);
    return people;
  }

  /** Fetch and cache contractor member + org directories. Non-blocking — uses cached/file data on failure. */
  private async ensureContractorDirectories(): Promise<void> {
    // Use in-memory cache if fresh
    if (this.contractorMemberMap.size > 0 && Date.now() - this.contractorDirCacheTime < GateLogManager.CONTRACTOR_DIR_CACHE_TTL) {
      return;
    }

    // Try loading from file cache first (survives process restarts + API timeouts)
    if (this.contractorMemberMap.size === 0) {
      this.loadMemberCacheFromDisk();
    }

    const [memberResult, orgResult] = await Promise.allSettled([
      this.onLocationGet('/sp/member', 5, 120_000),
      this.onLocationGet('/sp/org', 5, 30_000)
    ]);

    if (memberResult.status === 'fulfilled') {
      const members = this.unwrapResponse(memberResult.value);
      this.contractorMemberMap.clear();
      for (const m of members) {
        this.contractorMemberMap.set(m.id, m);
      }
      this.saveMemberCacheToDisk(members);
    } else {
      console.warn(`[GateLog] Member directory failed: ${memberResult.reason?.message} (using ${this.contractorMemberMap.size} cached)`);
    }

    if (orgResult.status === 'fulfilled') {
      const orgs = this.unwrapResponse(orgResult.value);
      this.contractorOrgCache.clear();
      for (const o of orgs) {
        this.contractorOrgCache.set(o.id, o.name || o.company_name || o.org_name || 'Contractor');
      }
    } else {
      console.warn(`[GateLog] Org directory failed: ${orgResult.reason?.message} (using ${this.contractorOrgCache.size} cached)`);
    }

    if (this.contractorMemberMap.size > 0 || this.contractorOrgCache.size > 0) {
      this.contractorDirCacheTime = Date.now();
    }
  }

  private get memberCachePath(): string {
    return path.join(getWorkingDir(), 'contractor-members-cache.json');
  }

  private loadMemberCacheFromDisk(): void {
    try {
      if (fs.existsSync(this.memberCachePath)) {
        const members: any[] = JSON.parse(fs.readFileSync(this.memberCachePath, 'utf-8'));
        for (const m of members) {
          this.contractorMemberMap.set(m.id, m);
        }
      }
    } catch (err: any) {
      console.warn(`[GateLog] OnLocation: failed to load member cache from disk: ${err.message}`);
    }
  }

  private saveMemberCacheToDisk(members: any[]): void {
    try {
      fs.writeFileSync(this.memberCachePath, JSON.stringify(members), 'utf-8');
    } catch (err: any) {
      console.warn(`[GateLog] OnLocation: failed to save member cache to disk: ${err.message}`);
    }
  }

  /** Unwrap OnLocation API response — tries array, then finds first array-valued key in object */
  private unwrapResponse(response: any): any[] {
    if (Array.isArray(response)) return response;
    if (response && typeof response === 'object') {
      // Find the first key whose value is an array
      for (const key of Object.keys(response)) {
        if (Array.isArray(response[key])) {
          return response[key];
        }
      }
    }
    return [];
  }

  private parseVisitorEvents(events: any[]): GateLogEntry[] {
    const people: GateLogEntry[] = [];

    for (const event of events) {
      if (event.signed_out != null) continue;

      const checkIn = this.convertOnLocationDate(event.signed_in);
      const duration = checkIn ? this.calculateDuration(checkIn) : undefined;

      people.push({
        name: event.name || 'Unknown',
        company: event.company || 'Visitor',
        checkIn,
        email: event.email || undefined,
        phone: event.mobile || event.phone || undefined,
        duration,
        source: 'onlocation'
      });
    }

    console.log(`[GateLog] OnLocation visitors: ${events.length} events -> ${people.length} on site`);
    return people;
  }

  private onLocationGet(endpoint: string, maxRedirects = 5, timeoutMs = 15_000): Promise<any> {
    const apiKey = this.config.onLocationApiKey;

    const doRequest = (targetUrl: URL, redirectsLeft: number): Promise<any> => {
      const mod = targetUrl.protocol === 'https:' ? https : require('http');

      return new Promise((resolve, reject) => {
        const req = mod.request(
          targetUrl,
          {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `APIKEY ${apiKey}`,
              'Accept': 'application/json'
            },
            timeout: timeoutMs,
            rejectUnauthorized: true
          },
          (res: any) => {

            // Follow redirects (302, 301, 307, 308)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              if (redirectsLeft <= 0) {
                reject(new Error(`OnLocation API: too many redirects`));
                return;
              }
              const redirectUrl = new URL(res.headers.location, targetUrl);
              // Consume response body before following redirect
              res.resume();
              doRequest(redirectUrl, redirectsLeft - 1).then(resolve, reject);
              return;
            }

            let body = '';
            res.on('data', (chunk: string) => body += chunk);
            res.on('end', () => {
              if (res.statusCode && res.statusCode >= 400) {
                reject(new Error(`OnLocation API HTTP ${res.statusCode}: ${body.substring(0, 200)}`));
                return;
              }
              try {
                resolve(JSON.parse(body));
              } catch {
                reject(new Error(`OnLocation API returned non-JSON: ${body.substring(0, 200)}`));
              }
            });
          }
        );

        req.on('error', (err: Error) => reject(new Error(`OnLocation API error: ${err.message}`)));
        req.on('timeout', () => { req.destroy(); reject(new Error('OnLocation API timeout')); });
        req.end();
      });
    };

    // Ensure base URL ends with / and endpoint doesn't start with /
    // (new URL('/visitor/event', 'https://host/v1') drops /v1 — absolute path replaces base)
    const base = this.config.onLocationBaseUrl.replace(/\/$/, '');
    const ep = endpoint.replace(/^\//, '');
    const url = new URL(`${base}/${ep}`);
    return doRequest(url, maxRedirects);
  }

  // ─── Gate Website Scraper ─────────────────────────────────────────────

  private async scrapeGateData(): Promise<GateLogEntry[]> {
    if (!this.config.gateUsername || !this.config.gateWebUrl) {
      console.log('[GateLog] Gate: no username or URL configured, skipping');
      return [];
    }


    const win = new BrowserWindow({
      show: false,
      width: 1200,
      height: 900,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        partition: 'persist:gate-scraper'
      }
    });

    try {
      // Allow self-signed cert for gate website
      const ses = win.webContents.session;
      ses.setCertificateVerifyProc((_request, callback) => {
        callback(0); // Accept all certs for this session
      });

      await win.loadURL(this.config.gateWebUrl);

      // Step 2: Login using Chromium-level insertText() — JS keyboard events don't
      // trigger this form's validation. insertText goes through Chromium's input pipeline,
      // equivalent to real keyboard typing (like Selenium sendKeys / Robot keyPress).

      // Check if login fields exist
      const fieldsCheck = await win.webContents.executeJavaScript(`
        (function() {
          return {
            login: !!document.getElementById('login'),
            password: !!document.getElementById('password'),
            loginBtn: !!document.getElementById('login-button')
          };
        })();
      `);

      if (fieldsCheck.login && fieldsCheck.password && fieldsCheck.loginBtn) {
        // Login page detected — fill credentials
        await win.webContents.executeJavaScript(`
          var el = document.getElementById('login');
          el.focus();
          el.click();
          el.value = '';
        `);
        await new Promise(resolve => setTimeout(resolve, 500));
        await win.webContents.insertText(this.config.gateUsername);

        await win.webContents.executeJavaScript(`
          var el = document.getElementById('password');
          el.focus();
          el.click();
          el.value = '';
        `);
        await new Promise(resolve => setTimeout(resolve, 200));
        await win.webContents.insertText(this.config.gatePassword);

        await win.webContents.executeJavaScript(`document.getElementById('login-button').click()`);

        // Wait for navigation after login
        await this.waitForNavigation(win, 10000);
      } else {
        // Already logged in (session cookie persisted) — skip login
        console.log('[GateLog] Gate: already logged in, skipping login');
      }

      // Step 4: Navigate to reports — use exact ID from old app
      const navScript = `
        (function() {
          var reportsLink = document.getElementById('main_reports_link');
          if (reportsLink) {
            reportsLink.click();
            return 'navigated';
          }
          return 'reports-link-not-found';
        })();
      `;

      await win.webContents.executeJavaScript(navScript);
      await this.waitForNavigation(win, 10000);

      // Step 5: Navigate to custom reports — use exact ID from old app
      const customReportsScript = `
        (function() {
          var customLink = document.getElementById('sub_custom_report_reports_link');
          if (customLink) {
            customLink.click();
            return 'navigated';
          }
          return 'custom-reports-not-found';
        })();
      `;

      await win.webContents.executeJavaScript(customReportsScript);
      await this.waitForNavigation(win, 10000);

      // Step 5b: Click the Excel download button on the Custom Reports listing page.
      // Old Java app: By.className("excel") — this is on the listing, NOT inside the report grid.
      // Register will-download handler BEFORE clicking.
      const tempPath = path.join(os.tmpdir(), `gate-report-${Date.now()}.csv`);

      const downloadPromise = new Promise<string>((resolve, reject) => {
        const timeout = setTimeout(() => {
          ses.removeAllListeners('will-download');
          reject(new Error('Gate CSV download timed out after 30s'));
        }, 30_000);

        ses.on('will-download', (_event, item) => {
          item.setSavePath(tempPath);
          item.once('done', (_e, state) => {
            clearTimeout(timeout);
            ses.removeAllListeners('will-download');
            if (state === 'completed') {
              resolve(tempPath);
            } else {
              reject(new Error(`Gate download failed: ${state}`));
            }
          });
        });
      });

      // Click the .excel element on the custom reports listing page
      const exportScript = `
        (function() {
          var excelBtn = document.querySelector('.excel');
          if (excelBtn) { excelBtn.click(); return 'ok'; }
          return 'excel-btn-not-found';
        })();
      `;

      const exportResult = await win.webContents.executeJavaScript(exportScript);
      if (exportResult !== 'ok') {
        throw new Error('Gate Excel download button not found on custom reports page');
      }

      // Wait for the download to complete
      const downloadedPath = await downloadPromise;

      // Parse the downloaded file (CSV or Excel)
      const workbook = XLSX.readFile(downloadedPath);
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const rows: any[] = XLSX.utils.sheet_to_json(sheet);

      // Clean up temp file
      try { fs.unlinkSync(downloadedPath); } catch { /* ignore */ }

      // Map Excel rows to the format processGateRecords expects
      const records = rows.map(row => ({
        firstName: row['First Name'] || '',
        lastName: row['Last Name'] || '',
        source: row['Source'] || '',
        panelDate: this.convertExcelDate(row['Panel Date'])
      }));

      return this.processGateRecords(records);
    } catch (err: any) {
      console.error('Gate scrape failed:', err.message);
      throw err;
    } finally {
      win.destroy();
    }
  }

  /**
   * Process raw gate records into GateLogEntry objects.
   * Sorts by Panel Date, tracks Entry/Exit per person.
   * Person whose last event is Exit is removed (they left).
   * Remaining = currently on site.
   */
  private processGateRecords(records: any[]): GateLogEntry[] {
    // Sort by panelDate ascending (oldest first)
    records.sort((a, b) => (a.panelDate || '').localeCompare(b.panelDate || ''));

    const personTrips = new Map<string, { name: string; entry: string | null }>();

    for (const record of records) {
      const firstName = record.firstName || '';
      const lastName = record.lastName || '';
      const name = `${firstName} ${lastName}`.trim();
      const source = record.source || '';
      const panelDate = record.panelDate || '';

      if (!name) continue;

      if (!personTrips.has(name)) {
        personTrips.set(name, { name, entry: null });
      }

      const person = personTrips.get(name)!;

      if (source.includes('Entry')) {
        person.entry = panelDate;
      } else if (source.includes('Exit')) {
        personTrips.delete(name);
      }
    }

    const people: GateLogEntry[] = [];
    for (const [, trip] of personTrips) {
      if (trip.name && trip.name.trim()) {
        const checkIn = this.convertGateDate(trip.entry || '');
        people.push({
          name: trip.name,
          company: 'Card Access',
          checkIn,
          duration: checkIn ? this.calculateDuration(checkIn) : undefined,
          source: 'gate'
        });
      }
    }

    console.log(`[GateLog] Gate: ${records.length} CSV rows -> ${people.length} on site`);
    return people;
  }

  // ─── Auto-Refresh ─────────────────────────────────────────────────────

  public setAutoRefresh(enabled: boolean, intervalMinutes?: number): void {
    this.config.autoRefresh = enabled;
    if (intervalMinutes !== undefined) {
      this.config.intervalMinutes = intervalMinutes;
    }

    this.stopAutoRefreshTimer();

    if (enabled) {
      this.startAutoRefreshTimer();
    }

    // Persist the setting
    this.saveConfig(this.config);
  }

  private startAutoRefreshTimer(): void {
    this.stopAutoRefreshTimer();
    const intervalMs = this.config.intervalMinutes * 60 * 1000;
    console.log(`Gate log auto-refresh started: every ${this.config.intervalMinutes} minutes`);

    this.autoRefreshTimer = setInterval(async () => {
      console.log('Gate log auto-refresh triggered');
      await this.refresh();
      this.onPeopleUpdated?.();
    }, intervalMs);
  }

  private stopAutoRefreshTimer(): void {
    if (this.autoRefreshTimer) {
      clearInterval(this.autoRefreshTimer);
      this.autoRefreshTimer = null;
    }
  }

  // ─── Print ────────────────────────────────────────────────────────────

  public async print(): Promise<void> {
    const html = this.generatePrintHtml();

    const win = new BrowserWindow({
      show: false,
      width: 800,
      height: 600,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false
      }
    });

    await win.loadURL(`data:text/html;charset=utf-8,${encodeURIComponent(html)}`);

    return new Promise((resolve, reject) => {
      win.webContents.print({ silent: false }, (success, failureReason) => {
        win.destroy();
        if (success) {
          resolve();
        } else {
          reject(new Error(failureReason || 'Print failed'));
        }
      });
    });
  }

  private generatePrintHtml(): string {
    const now = new Date().toLocaleString();
    const rows = this.cachedPeople
      .map(
        (p) => `
        <tr>
          <td>${this.escapeHtml(p.name)}</td>
          <td>${this.escapeHtml(p.company)}</td>
          <td>${p.checkIn || '--'}</td>
          <td>${p.duration || '--'}</td>
          <td>${this.escapeHtml([p.email, p.phone].filter(Boolean).join(' / ') || '--')}</td>
          <td>${p.source}</td>
        </tr>`
      )
      .join('');

    return `<!DOCTYPE html>
<html>
<head>
  <title>Gate Log - People On Site</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; color: #333; }
    h1 { font-size: 18px; margin-bottom: 4px; }
    .meta { font-size: 12px; color: #666; margin-bottom: 16px; }
    table { width: 100%; border-collapse: collapse; font-size: 12px; }
    th { text-align: left; padding: 6px 8px; border-bottom: 2px solid #333; font-weight: 600; }
    td { padding: 4px 8px; border-bottom: 1px solid #ddd; }
    .footer { margin-top: 16px; font-size: 11px; color: #999; }
  </style>
</head>
<body>
  <h1>People On Site</h1>
  <div class="meta">Printed: ${now} | Total: ${this.cachedPeople.length}</div>
  <table>
    <thead>
      <tr><th>Name</th><th>Company</th><th>Check In</th><th>Duration</th><th>Contact</th><th>Source</th></tr>
    </thead>
    <tbody>${rows}</tbody>
  </table>
  <div class="footer">Generated by DK Power Manager</div>
</body>
</html>`;
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────

  public cleanup(): void {
    this.stopAutoRefreshTimer();
  }

  // ─── Utilities ────────────────────────────────────────────────────────

  /**
   * Convert OnLocation ISO timestamp to display format.
   * Input: "2024-10-14T09:30:00-05:00"
   * Output: "10/14/2024 09:30:00"
   */
  private convertOnLocationDate(isoDate: string | null | undefined): string | undefined {
    if (!isoDate) return undefined;
    try {
      const d = new Date(isoDate);
      if (isNaN(d.getTime())) return isoDate;
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      const year = d.getFullYear();
      const hours = String(d.getHours()).padStart(2, '0');
      const minutes = String(d.getMinutes()).padStart(2, '0');
      const seconds = String(d.getSeconds()).padStart(2, '0');
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    } catch {
      return isoDate;
    }
  }

  /**
   * Convert gate date format to display format.
   * Input: "MM/dd/yyyy HH:mm:ss"
   * Output: same (already in display format)
   */
  private convertGateDate(dateStr: string): string | undefined {
    if (!dateStr) return undefined;
    // Gate dates are already in MM/dd/yyyy HH:mm:ss format
    return dateStr;
  }

  /**
   * Calculate duration string from check-in time to now.
   */
  private calculateDuration(checkInStr: string): string | undefined {
    try {
      // Parse MM/dd/yyyy HH:mm:ss
      const parts = checkInStr.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/);
      if (!parts) return undefined;

      const entryDate = new Date(
        parseInt(parts[3]),
        parseInt(parts[1]) - 1,
        parseInt(parts[2]),
        parseInt(parts[4]),
        parseInt(parts[5]),
        parseInt(parts[6])
      );

      const now = new Date();
      const diffMs = now.getTime() - entryDate.getTime();
      const diffHours = diffMs / (1000 * 60 * 60);

      if (diffHours < 1) {
        return `${Math.round(diffHours * 60)} min`;
      }
      return `${diffHours.toFixed(1)} hrs`;
    } catch {
      return undefined;
    }
  }

  private waitForNavigation(win: BrowserWindow, timeoutMs: number): Promise<void> {
    return new Promise((resolve) => {
      let resolved = false;

      const onFinish = () => {
        if (!resolved) {
          resolved = true;
          resolve();
        }
      };

      win.webContents.once('did-finish-load', onFinish);
      win.webContents.once('did-navigate', onFinish);

      // Resolve after timeout even if no navigation occurred
      setTimeout(onFinish, timeoutMs);
    });
  }

  /**
   * Convert Excel serial date number to MM/dd/yyyy HH:mm:ss format.
   * Excel serial = days since 1900-01-01. XLSX parses CSV dates as these numbers.
   */
  private convertExcelDate(value: any): string {
    if (typeof value === 'number') {
      // 25569 = days between Excel epoch (1900-01-01) and Unix epoch (1970-01-01)
      const d = new Date((value - 25569) * 86400000);
      const month = String(d.getUTCMonth() + 1).padStart(2, '0');
      const day = String(d.getUTCDate()).padStart(2, '0');
      const year = d.getUTCFullYear();
      const hours = String(d.getUTCHours()).padStart(2, '0');
      const minutes = String(d.getUTCMinutes()).padStart(2, '0');
      const seconds = String(d.getUTCSeconds()).padStart(2, '0');
      return `${month}/${day}/${year} ${hours}:${minutes}:${seconds}`;
    }
    if (typeof value === 'string') return value;
    return '';
  }

  private setupCertificateHandling(): void {
    // The gate-scraper partition handles its own certs in scrapeGateData().
    // For the user-facing gate-website WebView, we handle it in the WebViewManager.
  }

  private escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }
}
