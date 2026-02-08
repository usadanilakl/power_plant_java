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
import * as https from 'https';
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

  // ─── Refresh (combines both sources) ──────────────────────────────────

  public async refresh(): Promise<GateLogEntry[]> {
    if (this.isRefreshing) {
      return this.cachedPeople;
    }

    this.isRefreshing = true;
    this.lastError = undefined;

    try {
      console.log('[GateLog] Starting refresh...');
      console.log(`[GateLog] Config: OnLocation API key=${this.config.onLocationApiKey ? 'set' : 'empty'}, Gate URL=${this.config.gateWebUrl}, Gate user=${this.config.gateUsername || 'empty'}`);

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

  private async fetchOnLocationPeople(): Promise<GateLogEntry[]> {
    if (!this.config.onLocationApiKey) {
      console.log('[GateLog] OnLocation: no API key configured, skipping');
      return [];
    }

    console.log(`[GateLog] OnLocation: fetching from ${this.config.onLocationBaseUrl}/visitor/event`);
    const response = await this.onLocationGet('/visitor/event');

    // Log the response structure to help debug
    const responseType = Array.isArray(response) ? `array[${response.length}]` : typeof response;
    const responseKeys = response && typeof response === 'object' && !Array.isArray(response)
      ? Object.keys(response).join(', ')
      : '';
    console.log(`[GateLog] OnLocation: response type=${responseType}, keys=[${responseKeys}]`);

    if (!response || !Array.isArray(response)) {
      // Response might be wrapped: { event: [...] }
      const wrapped = response as any;
      if (wrapped?.event && Array.isArray(wrapped.event)) {
        console.log(`[GateLog] OnLocation: found ${wrapped.event.length} events in wrapped response`);
        return this.parseVisitorEvents(wrapped.event);
      }
      console.log(`[GateLog] OnLocation: response preview = ${JSON.stringify(response).substring(0, 300)}`);
      return [];
    }

    console.log(`[GateLog] OnLocation: ${response.length} events in array response`);
    return this.parseVisitorEvents(response);
  }

  private parseVisitorEvents(events: any[]): GateLogEntry[] {
    const people: GateLogEntry[] = [];

    // Log first few events for debugging
    for (let i = 0; i < Math.min(events.length, 3); i++) {
      const e = events[i];
      console.log(`[GateLog] OnLocation event[${i}]: name=${e.name}, signed_in=${e.signed_in}, signed_out=${e.signed_out} (type: ${typeof e.signed_out}), email=${e.email}, mobile=${e.mobile}`);
    }

    for (const event of events) {
      // Only include visitors still on site (signed_in but not signed_out)
      // Old app: if (e.get("signed_out") == null) — Java null check
      // In JSON: signed_out is null when still on-site, date string when left
      if (event.signed_out != null) continue;

      const checkIn = this.convertOnLocationDate(event.signed_in);
      const duration = checkIn ? this.calculateDuration(checkIn) : undefined;

      people.push({
        name: event.name || 'Unknown',
        company: event.company || 'Visitor',
        checkIn,
        email: event.email || undefined,
        phone: event.mobile || undefined,
        duration,
        source: 'onlocation'
      });
    }

    console.log(`[GateLog] OnLocation: ${events.length} events -> ${people.length} people on site (filtered by signed_out == null)`);
    return people;
  }

  private onLocationGet(endpoint: string, maxRedirects = 5): Promise<any> {
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
            timeout: 15000,
            rejectUnauthorized: true
          },
          (res: any) => {
            console.log(`[GateLog] OnLocation API response: ${res.statusCode} ${res.statusMessage} (url: ${targetUrl.href})`);

            // Follow redirects (302, 301, 307, 308)
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
              if (redirectsLeft <= 0) {
                reject(new Error(`OnLocation API: too many redirects`));
                return;
              }
              const redirectUrl = new URL(res.headers.location, targetUrl);
              console.log(`[GateLog] OnLocation API: following redirect to ${redirectUrl.href}`);
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

    console.log(`[GateLog] Gate: starting scrape of ${this.config.gateWebUrl}`);

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

      // Step 1: Navigate to gate website
      console.log('[GateLog] Gate: loading URL...');
      await win.loadURL(this.config.gateWebUrl);
      console.log('[GateLog] Gate: page loaded');

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
      console.log(`[GateLog] Gate: fields check = ${JSON.stringify(fieldsCheck)}`);

      if (!fieldsCheck.login || !fieldsCheck.password || !fieldsCheck.loginBtn) {
        throw new Error(`Gate login fields not found: ${JSON.stringify(fieldsCheck)}`);
      }

      // Focus username field, clear it, then type via insertText
      await win.webContents.executeJavaScript(`
        var el = document.getElementById('login');
        el.focus();
        el.click();
        el.value = '';
      `);
      await new Promise(resolve => setTimeout(resolve, 500));
      await win.webContents.insertText(this.config.gateUsername);
      console.log(`[GateLog] Gate: username typed`);

      // Focus password field, clear it, then type via insertText
      await win.webContents.executeJavaScript(`
        var el = document.getElementById('password');
        el.focus();
        el.click();
        el.value = '';
      `);
      await new Promise(resolve => setTimeout(resolve, 200));
      await win.webContents.insertText(this.config.gatePassword);
      console.log(`[GateLog] Gate: password typed`);

      // Click login button
      await win.webContents.executeJavaScript(`document.getElementById('login-button').click()`);
      console.log(`[GateLog] Gate: login button clicked`);

      // Step 3: Wait for navigation after login
      await this.waitForNavigation(win, 10000);

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

      const navResult = await win.webContents.executeJavaScript(navScript);
      console.log(`[GateLog] Gate: reports navigation = ${navResult}`);
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

      const customResult = await win.webContents.executeJavaScript(customReportsScript);
      console.log(`[GateLog] Gate: custom reports navigation = ${customResult}`);
      await this.waitForNavigation(win, 10000);

      // Step 5b: Click the specific report (matches old app's xpath)
      const reportLinkScript = `
        (function() {
          var link = document.querySelector("a[href*='/reports/5962a30f47b74045/grid']");
          if (link) {
            link.click();
            return 'navigated-to-report';
          }
          // Fallback: click first report link
          var reportLinks = document.querySelectorAll('td a[href*="/reports/"]');
          if (reportLinks.length > 0) {
            reportLinks[0].click();
            return 'navigated-to-first-report';
          }
          return 'report-link-not-found';
        })();
      `;

      const reportResult = await win.webContents.executeJavaScript(reportLinkScript);
      console.log(`[GateLog] Gate: report link = ${reportResult}`);
      await this.waitForNavigation(win, 10000);

      // Step 5c: Set rows per page to 50 (old app: By.name("rp"))
      const rowsPerPageScript = `
        (function() {
          var rpSelect = document.querySelector('select[name="rp"]');
          if (rpSelect) {
            rpSelect.value = '50';
            rpSelect.dispatchEvent(new Event('change', { bubbles: true }));
            return 'set-50-rows';
          }
          return 'rp-select-not-found';
        })();
      `;

      await win.webContents.executeJavaScript(rowsPerPageScript);

      // Click reload button (old app: By.cssSelector(".pReload.pButton"))
      const reloadScript = `
        (function() {
          var reloadBtn = document.querySelector('.pReload.pButton');
          if (reloadBtn) {
            reloadBtn.click();
            return 'reloaded';
          }
          return 'reload-btn-not-found';
        })();
      `;

      await win.webContents.executeJavaScript(reloadScript);
      await new Promise(resolve => setTimeout(resolve, 3000)); // Wait for report to load

      // Step 6: Scrape the report table
      // Old app uses: headers from div.hDiv table th/div, rows from #report_grid tr[id], cells from .//div
      const scrapeScript = `
        (function() {
          var results = [];

          // Get headers from the HEADER section specifically (div.hDiv), not global th div
          // This matches old app: tbl.findElements(By.xpath(".//th/div"))
          var headers = [];
          var hDiv = document.querySelector('div.hDiv');
          if (hDiv) {
            var headerEls = hDiv.querySelectorAll('th div');
            for (var h = 0; h < headerEls.length; h++) {
              headers.push((headerEls[h].textContent || '').trim());
            }
          }

          // Get data rows from #report_grid (matches old app: By.id("report_grid") then By.xpath("//tr[@id]"))
          var table = document.getElementById('report_grid');
          var rows = table ? table.querySelectorAll('tr[id]') : document.querySelectorAll('tr[id]');

          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].querySelectorAll('div');
            if (cells.length < 3) continue;

            // Build record map with original-case header keys (matches old app: rowData.put(headerNames.get(j), ...))
            var record = {};
            for (var c = 0; c < cells.length && c < headers.length; c++) {
              record[headers[c]] = (cells[c].getAttribute('innerText') || cells[c].textContent || '').trim();
            }

            // Extract using exact Title Case keys from old app:
            // r.get("First Name"), r.get("Last Name"), r.get("Source"), r.get("Panel Date")
            var firstName = record['First Name'] || '';
            var lastName = record['Last Name'] || '';
            var source = record['Source'] || '';
            var panelDate = record['Panel Date'] || '';

            if (firstName || lastName) {
              results.push({
                firstName: firstName,
                lastName: lastName,
                source: source,
                panelDate: panelDate
              });
            }
          }

          return JSON.stringify({ headers: headers, count: results.length, records: results });
        })();
      `;

      const rawData = await win.webContents.executeJavaScript(scrapeScript);
      const parsed = JSON.parse(rawData || '{"headers":[],"count":0,"records":[]}');
      console.log(`[GateLog] Gate: headers found = [${parsed.headers.join(', ')}]`);
      console.log(`[GateLog] Gate: scraped ${parsed.count} raw records`);
      const records: any[] = parsed.records;
      if (records.length > 0) {
        console.log(`[GateLog] Gate: first record sample = ${JSON.stringify(records[0])}`);
      }

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
   * Mirrors old app's processRetrievedData(): sorts by Panel Date, tracks Entry/Exit,
   * removes person on Exit (meaning they left), keeps remaining as on-site.
   */
  private processGateRecords(records: any[]): GateLogEntry[] {
    // Sort by panelDate ascending (oldest first) — matches old app
    records.sort((a, b) => {
      const dateA = a.panelDate || '';
      const dateB = b.panelDate || '';
      return dateA.localeCompare(dateB);
    });

    // Track person trips — matches old app: personTrips map, remove on Exit
    const personTrips = new Map<string, { name: string; entry: string | null; type: string }>();

    for (const record of records) {
      const firstName = record.firstName || '';
      const lastName = record.lastName || '';
      const name = `${firstName} ${lastName}`.trim();
      const source = record.source || '';
      const panelDate = record.panelDate || '';

      if (!name) continue;

      if (!personTrips.has(name)) {
        personTrips.set(name, { name, entry: null, type: 'card' });
      }

      const person = personTrips.get(name)!;

      // Old app: event.contains("Entry") / event.contains("Exit")
      if (source.includes('Entry')) {
        person.entry = panelDate;
      } else if (source.includes('Exit')) {
        // Person exited — remove them (they're no longer on-site)
        personTrips.delete(name);
      }
    }

    // Remaining people in the map are currently on-site
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
          <td>${this.escapeHtml(p.email || p.phone || '--')}</td>
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
