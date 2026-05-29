/**
 * WebViewSdsManager — scrapes the VelocityEHS ChemManagement eBinder (chemmanagement.ehs.com)
 * for the Jackson Generation location and feeds chemicals + SDS PDFs to Spring Boot.
 *
 * Flow (see project/features/sds/scraper/scraper.md):
 *   loadURL(eBinder) -> "All Locations" -> type location -> Apply
 *   -> for each page: scrape rows (stable data-table__* BEM classes) + capture each PDF
 *      ("View PDF" opens the PDF in a new tab; setWindowOpenHandler captures the URL,
 *       which we fetch with the session's cookies) -> next page until none
 *   -> batched POST /ng/sds-chemicals/import (upsert by sourceId + attach PDF)
 *   -> POST /ng/sds-chemicals/source-reconcile (missing-from-source) -> combined report.
 *
 * Anonymous token link — no login. Modeled on WebViewAmsManager.
 */

import { BrowserWindow, net } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as http from 'http';
import { DEFAULT_SDS_SCRAPER_CONFIG, DEFAULT_SPRING_BOOT_CONFIG } from '../constants';
import { getWorkingDir } from '../paths';
import type { SdsScraperConfig, SdsScrapeStatus, SdsScrapeReport, SdsGapReport } from '../../shared/types';

const FIRE_CLICK = `
  function __fireClick(el) {
    if (!el) return false;
    var o = { bubbles: true, cancelable: true, view: window };
    el.dispatchEvent(new MouseEvent('mouseover', o));
    el.dispatchEvent(new MouseEvent('mousedown', o));
    el.dispatchEvent(new MouseEvent('mouseup', o));
    el.dispatchEvent(new MouseEvent('click', o));
    if (typeof el.click === 'function') { try { el.click(); } catch (e) {} }
    return true;
  }
`;

interface ScrapedRow {
  sourceId: string;
  names: string;
  manufacturer: string;
  revisionDate: string;
  cas: string;
  dateAdded: string;
}

const IMPORT_BATCH_SIZE = 15;

export class WebViewSdsManager {
  private config: SdsScraperConfig;
  private configPath: string;
  private isScraping = false;
  private lastRun: Date | null = null;
  private lastReport: SdsScrapeReport | null = null;
  private lastItemCount = 0;
  private lastError: string | undefined;
  private pendingPdfUrl: ((url: string) => void) | null = null;

  constructor() {
    this.configPath = path.join(getWorkingDir(), 'sds-scraper-config.json');
    this.config = this.loadConfig();
  }

  // ─── Config ───────────────────────────────────────────────────────────

  public loadConfig(): SdsScraperConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        return { ...DEFAULT_SDS_SCRAPER_CONFIG, ...JSON.parse(fs.readFileSync(this.configPath, 'utf-8')) };
      }
    } catch (err) {
      console.warn('[SDS-Scraper] Failed to load config, using defaults:', err);
    }
    return { ...DEFAULT_SDS_SCRAPER_CONFIG };
  }

  public saveConfig(config: SdsScraperConfig): void {
    this.config = { ...DEFAULT_SDS_SCRAPER_CONFIG, ...config };
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
  }

  public getConfig(): SdsScraperConfig { return { ...this.config }; }

  public getStatus(): SdsScrapeStatus {
    return {
      lastRun: this.lastRun?.toISOString() ?? null,
      isScraping: this.isScraping,
      lastItemCount: this.lastItemCount,
      lastReport: this.lastReport,
      error: this.lastError
    };
  }

  // ─── Scrape ───────────────────────────────────────────────────────────

  public async scrape(): Promise<SdsScrapeStatus> {
    if (this.isScraping) return this.getStatus();
    this.isScraping = true;
    this.lastError = undefined;

    try {
      const { rows, pdfs } = await this.collectFromEbinder(true);
      this.lastItemCount = rows.length;
      console.log(`[SDS-Scraper] scraped ${rows.length} chemicals`);

      const report = await this.pushToSpringBoot(rows, pdfs);
      if (report) {
        this.lastReport = report;
        this.lastRun = new Date();
        this.saveReportToDisk();
      } else {
        this.lastError = 'Spring Boot import unavailable — scrape not persisted';
      }
    } catch (err: any) {
      this.lastError = err.message || 'Scrape failed';
      console.error('[SDS-Scraper] Scrape failed:', err.message);
    } finally {
      this.isScraping = false;
    }
    return this.getStatus();
  }

  /**
   * Gap report (run before scraping): scrapes the eBinder list FRESH (names + ids, no PDFs) and asks
   * Spring Boot to compare it against the DB — what's on the website but not in our DB, and which DB
   * chemicals still have no SDS PDF. Uses live data (not the bundled snapshot) so it can't go stale.
   * The "Close gaps" scrape then creates the missing entries and attaches the missing PDFs.
   */
  public async getGapReport(): Promise<SdsGapReport> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    if (!(await this.springHealthy(port))) throw new Error('Spring Boot unavailable — start the app first');

    if (this.isScraping) throw new Error('A scrape is already running — try again shortly');
    this.isScraping = true;
    let rows: ScrapedRow[] = [];
    try {
      rows = (await this.collectFromEbinder(false)).rows;
    } finally {
      this.isScraping = false;
    }
    console.log(`[SDS-Scraper] gap-report scraped ${rows.length} chemicals from the eBinder`);

    const catalog = rows
      .filter(r => r.sourceId)
      .map(r => ({ sourceItemId: r.sourceId, names: r.names }));
    const res = await this.postJson(port, '/ng/sds-chemicals/gap-report', catalog);
    const d = res?.responseData;
    if (!d) throw new Error('No gap report returned');
    return d as SdsGapReport;
  }

  /**
   * Open the eBinder, load the chemical list, and scrape every page. When {@code capturePdfs} is true
   * each row's "View PDF" is fetched too (slow). Returns the scraped rows and (optionally) their PDFs.
   */
  private async collectFromEbinder(
    capturePdfs: boolean
  ): Promise<{ rows: ScrapedRow[]; pdfs: Record<string, { fileName: string; contentType: string; base64: string } | null> }> {
    const win = new BrowserWindow({
      show: this.config.showScrapeWindow === true,
      width: 1400,
      height: 950,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        partition: 'persist:webview-sds'
      }
    });
    const ses = win.webContents.session;

    // "View PDF" opens the PDF in a new tab — capture the URL and deny the popup.
    win.webContents.setWindowOpenHandler((details) => {
      if (this.pendingPdfUrl) { const r = this.pendingPdfUrl; this.pendingPdfUrl = null; r(details.url); }
      return { action: 'deny' };
    });

    const rows: ScrapedRow[] = [];
    const pdfs: Record<string, { fileName: string; contentType: string; base64: string } | null> = {};
    try {
      await win.loadURL(this.config.url);
      await this.sleep(3000);
      await this.ensureListLoaded(win);

      let page = 1;
      const maxPages = 100;
      while (page <= maxPages) {
        const ready = await this.waitForSelector(win, 'tr.data-table__tr', 15000);
        if (!ready) { await this.dumpDiagnostics(win, `page-${page}-no-rows`); break; }

        const pageRows: ScrapedRow[] = await this.exec(win, this.scrapePageScript());
        console.log(`[SDS-Scraper] page ${page}: ${pageRows ? pageRows.length : 0} rows`);
        if (!pageRows || pageRows.length === 0) break;

        for (let i = 0; i < pageRows.length; i++) {
          const row = pageRows[i];
          rows.push(row);
          if (capturePdfs) {
            const key = row.sourceId || `idx-${page}-${i}`;
            pdfs[key] = await this.capturePdf(win, ses, i, key);
          }
        }

        const hasNext = await this.exec(win, this.nextPageScript());
        if (hasNext !== 'clicked') break;
        await this.sleep(2500);
        page++;
      }
    } finally {
      if (!win.isDestroyed()) win.destroy();
    }
    return { rows, pdfs };
  }

  /**
   * Make sure the chemical list is showing. The eBinder loads "eBinder for All Locations" with every
   * chemical by default, so we do NOT type a location into the product search (doing so filtered the
   * list to "no results"). If a stale search filter is active (no rows but a "Reset Search" affordance
   * exists), clear it so the full list reloads. Best-effort; logs diagnostics if rows never appear.
   */
  private async ensureListLoaded(win: BrowserWindow): Promise<void> {
    if (await this.waitForSelector(win, 'tr.data-table__tr', 8000)) return;

    // No rows yet — clear any active search/filter that might be hiding the list.
    const reset = await this.exec(win, `
      ${FIRE_CLICK}
      (function () {
        var btns = document.querySelectorAll('button, a');
        for (var i = 0; i < btns.length; i++) {
          var t = (btns[i].textContent || '').trim().toLowerCase();
          if (t === 'reset search' || t === 'clear search' || t === 'clear all') { __fireClick(btns[i]); return 'reset'; }
        }
        return 'no-reset';
      })()
    `);
    console.log(`[SDS-Scraper] ensureListLoaded reset=${reset}`);
    await this.sleep(2500);

    if (!(await this.waitForSelector(win, 'tr.data-table__tr', 10000))) {
      await this.dumpDiagnostics(win, 'ensure-list-no-rows');
    }
  }

  /** Click the i-th row's "View PDF" button and fetch the PDF the new tab would have opened. */
  private async capturePdf(
    win: BrowserWindow, ses: Electron.Session, rowIndex: number, key: string
  ): Promise<{ fileName: string; contentType: string; base64: string } | null> {
    const url = await new Promise<string | null>((resolve) => {
      const timer = setTimeout(() => { this.pendingPdfUrl = null; resolve(null); }, 9000);
      this.pendingPdfUrl = (u: string) => { clearTimeout(timer); resolve(u); };
      this.exec(win, `
        ${FIRE_CLICK}
        (function () {
          var rows = document.querySelectorAll('tr.data-table__tr');
          var row = rows[${rowIndex}];
          if (!row) return 'row-not-found';
          var btn = row.querySelector('.data-table__td--action button')
                 || row.querySelector('button[title="View PDF"]');
          if (!btn) { var ic = row.querySelector('.icon--ghs-pdf'); btn = ic ? ic.closest('button') : null; }
          if (!btn) return 'pdf-btn-not-found';
          __fireClick(btn);
          return 'clicked';
        })()
      `).then(r => { if (r !== 'clicked') { this.pendingPdfUrl = null; clearTimeout(timer); resolve(null); } });
    });
    if (!url) { console.warn(`[SDS-Scraper] no PDF url for row ${rowIndex} (${key})`); return null; }
    return this.fetchPdf(ses, url, `sds-${key}.pdf`);
  }

  /** Fetch a URL with the scrape session's cookies and return it as base64. */
  private fetchPdf(
    ses: Electron.Session, url: string, fileName: string
  ): Promise<{ fileName: string; contentType: string; base64: string } | null> {
    return new Promise((resolve) => {
      try {
        const request = net.request({ url, session: ses });
        const chunks: Buffer[] = [];
        request.on('response', (response) => {
          const ctRaw = response.headers['content-type'];
          const contentType = Array.isArray(ctRaw) ? ctRaw[0] : (ctRaw || 'application/pdf');
          response.on('data', (c: Buffer) => chunks.push(Buffer.from(c)));
          response.on('end', () => {
            const buf = Buffer.concat(chunks);
            if (buf.length === 0) { resolve(null); return; }
            resolve({ fileName, contentType, base64: buf.toString('base64') });
          });
        });
        request.on('error', (e) => { console.warn('[SDS-Scraper] PDF fetch error:', e.message); resolve(null); });
        request.end();
      } catch (e: any) {
        console.warn('[SDS-Scraper] PDF fetch threw:', e.message);
        resolve(null);
      }
    });
  }

  // ─── Push to Spring Boot ──────────────────────────────────────────────

  private async pushToSpringBoot(
    rows: ScrapedRow[],
    pdfs: Record<string, { fileName: string; contentType: string; base64: string } | null>
  ): Promise<SdsScrapeReport | null> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    const healthy = await this.springHealthy(port);
    if (!healthy) { console.warn('[SDS-Scraper] Spring Boot unavailable — skipping import'); return null; }

    const report: SdsScrapeReport = {
      scrapedAt: new Date().toISOString(),
      sourceCount: rows.length, created: 0, updated: 0, pdfsAttached: 0,
      newChemicals: [], revisedChemicals: [], missingFromSource: []
    };

    // Import in batches (PDFs are large — keep each request under the 50 MB cap).
    for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
      const batch = rows.slice(i, i + IMPORT_BATCH_SIZE).map(r => {
        const key = r.sourceId || `idx-?`;
        const pdf = pdfs[r.sourceId] || null;
        return {
          names: r.names,
          manufacturer: r.manufacturer,
          revisionDate: r.revisionDate,
          sourceItemId: r.sourceId,
          pdf: pdf ? { fileName: pdf.fileName, contentType: pdf.contentType, base64Content: pdf.base64 } : null
        };
      });
      try {
        const res = await this.postJson(port, '/ng/sds-chemicals/import', batch);
        const d = res?.responseData;
        if (d) {
          report.created += d.created || 0;
          report.updated += d.updated || 0;
          report.pdfsAttached += d.pdfsAttached || 0;
          if (Array.isArray(d.newChemicals)) report.newChemicals.push(...d.newChemicals);
          if (Array.isArray(d.revisedChemicals)) report.revisedChemicals.push(...d.revisedChemicals);
        }
      } catch (e: any) {
        console.warn(`[SDS-Scraper] import batch ${i / IMPORT_BATCH_SIZE} failed:`, e.message);
      }
    }

    // Reconcile missing-from-source against the full sourceId set.
    try {
      const sourceIds = rows.map(r => r.sourceId).filter(Boolean);
      const res = await this.postJson(port, '/ng/sds-chemicals/source-reconcile', sourceIds);
      if (Array.isArray(res?.responseData)) report.missingFromSource = res.responseData;
    } catch (e: any) {
      console.warn('[SDS-Scraper] source-reconcile failed:', e.message);
    }

    console.log(`[SDS-Scraper] import done: ${report.created} new, ${report.updated} updated, `
      + `${report.pdfsAttached} PDFs, ${report.missingFromSource.length} missing`);
    return report;
  }

  private springHealthy(port: number): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.request(
        { hostname: '127.0.0.1', port, path: '/actuator/health', method: 'GET', timeout: 3000 },
        (res) => { res.resume(); resolve(!!res.statusCode && res.statusCode < 400); }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => { req.destroy(); resolve(false); });
      req.end();
    });
  }

  private postJson(port: number, apiPath: string, body: any): Promise<any> {
    const payload = JSON.stringify(body);
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1', port, path: apiPath, method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) },
          timeout: 60000
        },
        (res) => {
          let data = '';
          res.on('data', (c) => { data += c; });
          res.on('end', () => {
            if (!res.statusCode || res.statusCode >= 400) { reject(new Error(`HTTP ${res.statusCode}`)); return; }
            try { resolve(JSON.parse(data)); } catch { reject(new Error('bad JSON')); }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.write(payload);
      req.end();
    });
  }

  // ─── Page scripts ─────────────────────────────────────────────────────

  private scrapePageScript(): string {
    return `
      (function () {
        function txt(el) { return el ? (el.textContent || '').replace(/\\s+/g, ' ').trim() : ''; }
        var rows = document.querySelectorAll('tr.data-table__tr');
        var out = [];
        for (var i = 0; i < rows.length; i++) {
          var r = rows[i];
          var cb = r.querySelector('input[type="checkbox"]');
          var sourceId = cb ? cb.id : '';
          var a = r.querySelector('.data-table__td--primary a');
          if (!sourceId && a && a.getAttribute('href')) {
            var parts = a.getAttribute('href').split('/');
            sourceId = parts[parts.length - 1];
          }
          var names = txt(a);
          var manufacturer = txt(r.querySelector('.data-table__subdata'));
          var revisionDate = '', cas = '', dateAdded = '';
          var fields = r.querySelectorAll('.data-field');
          for (var f = 0; f < fields.length; f++) {
            var lbl = txt(fields[f].querySelector('.data-field__label')).toLowerCase();
            var val = txt(fields[f].querySelector('.data-field__value'));
            if (lbl.indexOf('revision') >= 0) revisionDate = val;
            else if (lbl.indexOf('cas') >= 0) cas = val;
            else if (lbl.indexOf('date added') >= 0) dateAdded = val;
          }
          if (names || sourceId) out.push({ sourceId: sourceId, names: names, manufacturer: manufacturer, revisionDate: revisionDate, cas: cas, dateAdded: dateAdded });
        }
        return out;
      })()
    `;
  }

  private nextPageScript(): string {
    return `
      ${FIRE_CLICK}
      (function () {
        var li = document.querySelector('.pagination__item[title="Next page"]');
        if (!li) return 'no-next';
        var btn = li.querySelector('button');
        if (!btn || btn.disabled || li.className.indexOf('disabled') >= 0) return 'next-disabled';
        __fireClick(btn);
        return 'clicked';
      })()
    `;
  }

  // ─── Disk cache + utils ───────────────────────────────────────────────

  private get reportPath(): string { return path.join(getWorkingDir(), 'sds-scraper-report.json'); }

  private saveReportToDisk(): void {
    try {
      fs.writeFileSync(this.reportPath, JSON.stringify({
        lastRun: this.lastRun?.toISOString() ?? null,
        lastItemCount: this.lastItemCount,
        lastReport: this.lastReport
      }), 'utf-8');
    } catch (err: any) {
      console.warn('[SDS-Scraper] Failed to save report:', err.message);
    }
  }

  private sleep(ms: number): Promise<void> { return new Promise(r => setTimeout(r, ms)); }

  private async exec(win: BrowserWindow, script: string): Promise<any> {
    if (win.isDestroyed()) return false;
    try { return await win.webContents.executeJavaScript(script); }
    catch (err: any) { console.warn('[SDS-Scraper] executeJavaScript failed:', err.message); return false; }
  }

  private async waitForSelector(win: BrowserWindow, selector: string, timeoutMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (win.isDestroyed()) return false;
      if (await this.exec(win, `!!document.querySelector(${JSON.stringify(selector)})`)) return true;
      await this.sleep(300);
    }
    return false;
  }

  private async dumpDiagnostics(win: BrowserWindow, label: string): Promise<void> {
    const info = await this.exec(win, `
      (function () {
        function list(sel){return Array.from(document.querySelectorAll(sel)).map(function(e){return (e.textContent||'').replace(/\\s+/g,' ').trim();}).filter(Boolean).slice(0,40);}
        return {
          url: document.URL,
          rowCount: document.querySelectorAll('tr.data-table__tr').length,
          buttons: list('button').slice(0, 30),
          hasSearchInput: !!document.querySelector('.search-bar__inputs input, .Select-input input'),
          bodyText: (document.body ? document.body.innerText : '').replace(/\\s+/g,' ').trim().slice(0, 500)
        };
      })()
    `);
    console.log(`[SDS-Scraper] DIAG (${label}): ${JSON.stringify(info)}`);
  }
}
