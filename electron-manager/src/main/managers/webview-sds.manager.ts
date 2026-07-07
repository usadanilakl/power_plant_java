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
import type { SdsScraperConfig, SdsScrapeStatus, SdsScrapeReport, SdsGapReport, SdsScrapeOptions } from '../../shared/types';

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

// 5 instead of 15: each chemical's import upserts in H2 AND pushes the attachment to SharePoint
// (in the same request), which is ~1-3 s per item over the network — bigger batches push past the
// HTTP timeout. With 5 we stay comfortably inside a 5-minute per-batch budget.
const IMPORT_BATCH_SIZE = 5;

export class WebViewSdsManager {
  private config: SdsScraperConfig;
  private configPath: string;
  private isScraping = false;
  private lastRun: Date | null = null;
  private lastReport: SdsScrapeReport | null = null;
  private lastItemCount = 0;
  private lastError: string | undefined;
  private pendingPdfCapture: ((c: { url: string; base64?: string } | null) => void) | null = null;
  private pdfCaptureLog: Array<{ url: string; mime: string }> = [];
  private fullResponseLog: Array<{ url: string; mime: string; tMs: number }> = [];
  private scrapeStartMs = 0;
  private scrapeWindow: BrowserWindow | null = null;
  private abortRequested = false;
  // Live progress so the renderer can poll via getStatus() and survive navigation.
  private progressRow = 0;
  private progressTotal = 0;
  private progressPhase: 'list' | 'pdfs' | 'upload' | 'idle' = 'idle';
  // The most recent eBinder catalog (sourceItemId + names) scraped during getGapReport.
  // Cached so "Email Report" can reuse it without re-scraping; null until the first report runs.
  private lastScrapedCatalog: Array<{ sourceItemId: string; names: string }> | null = null;

  /**
   * Admin/test: ask Spring Boot to drop every local SDS PDF attachment. Next scrape re-downloads.
   * Returns the count deleted.
   */
  public async clearAllPdfs(): Promise<number> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    if (!(await this.springHealthy(port))) throw new Error('Spring Boot unavailable');
    const res = await this.postJson(port, '/ng/sds-chemicals/clear-pdfs', {});
    return typeof res?.responseData === 'number' ? res.responseData : 0;
  }

  /**
   * Manually match an existing DB chemical (book-only synthetic sourceId, or one removed from the
   * live eBinder) to a real eBinder Document ID — updates the row in place via
   * {@code POST /ng/sds-chemicals/{id}/match}. The next close-gaps scrape attaches the PDF.
   */
  public async matchChemical(payload: {
    chemicalId: number;
    sourceItemId: string;
    names?: string;
  }): Promise<any> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    if (!(await this.springHealthy(port))) throw new Error('Spring Boot unavailable');
    const res = await this.postJson(
      port,
      `/ng/sds-chemicals/${payload.chemicalId}/match`,
      { sourceItemId: payload.sourceItemId, names: payload.names ?? '' }
    );
    return res?.responseData ?? null;
  }

  /**
   * Cancel any in-flight scrape — destroys the headless window, which makes every pending
   * executeJavaScript / waitForSelector return false and breaks the page loop. The caller's
   * scrape() resolves with lastError set to "Aborted by user".
   */
  public requestAbort(): void {
    if (!this.isScraping) return;
    console.log('[SDS-Scraper] abort requested');
    this.abortRequested = true;
    if (this.scrapeWindow && !this.scrapeWindow.isDestroyed()) {
      try { this.scrapeWindow.destroy(); } catch { /* ignore */ }
    }
  }

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
      progressRow: this.progressRow,
      progressTotal: this.progressTotal,
      progressPhase: this.progressPhase,
      lastRun: this.lastRun?.toISOString() ?? null,
      isScraping: this.isScraping,
      lastItemCount: this.lastItemCount,
      lastReport: this.lastReport,
      error: this.lastError
    };
  }

  // ─── Scrape ───────────────────────────────────────────────────────────

  public async scrape(opts?: SdsScrapeOptions): Promise<SdsScrapeStatus> {
    if (this.isScraping) return this.getStatus();
    this.isScraping = true;
    this.abortRequested = false;
    this.lastError = undefined;
    this.progressRow = 0;
    this.progressTotal = 0;
    this.progressPhase = 'list';

    try {
      const { rows, pdfs } = await this.collectFromEbinder({ capturePdfs: true, ...opts });
      if (this.abortRequested) { this.lastError = 'Aborted by user'; this.progressPhase = 'idle'; return this.getStatus(); }
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
      this.progressPhase = 'idle';
    }
    return this.getStatus();
  }

  /**
   * Gap report (run before scraping): scrapes the eBinder list FRESH (names + ids, no PDFs) and asks
   * Spring Boot to compare it against the DB — what's on the website but not in our DB, and which DB
   * chemicals still have no SDS PDF. Uses live data (not the bundled snapshot) so it can't go stale.
   * The "Close gaps" scrape then creates the missing entries and attaches the missing PDFs.
   */
  public async getGapReport(opts?: SdsScrapeOptions): Promise<SdsGapReport> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    if (!(await this.springHealthy(port))) throw new Error('Spring Boot unavailable — start the app first');

    if (this.isScraping) throw new Error('A scrape is already running — try again shortly');
    this.isScraping = true;
    this.abortRequested = false;
    this.progressRow = 0;
    this.progressTotal = 0;
    this.progressPhase = 'list';
    let rows: ScrapedRow[] = [];
    try {
      rows = (await this.collectFromEbinder({ capturePdfs: false, ...opts })).rows;
      if (this.abortRequested) throw new Error('Aborted by user');
    } finally {
      this.isScraping = false;
      this.progressPhase = 'idle';
    }
    console.log(`[SDS-Scraper] gap-report scraped ${rows.length} chemicals from the eBinder`);

    const catalog = rows
      .filter(r => r.sourceId)
      .map(r => ({ sourceItemId: r.sourceId, names: r.names }));
    this.lastScrapedCatalog = catalog;
    const res = await this.postJson(port, '/ng/sds-chemicals/gap-report', catalog);
    const d = res?.responseData;
    if (!d) throw new Error('No gap report returned');
    return d as SdsGapReport;
  }

  /**
   * "Sync PDFs with eBinder" — walk-and-replace reconciliation. Walks the eBinder once with
   * capturePdfs=true (sharing the same capturePdf flow as scrape/close-gaps, so the frame-ID
   * pairing fix applies here too), then POSTs each captured row individually to
   * {@code /ng/sds-chemicals/sync-pdfs} at batch size 1 — bounded payloads (~few MB / request)
   * and per-chemical progress. The report accumulates across posts.
   * <p>
   * Guards:
   * <ul>
   *   <li>Shares the {@code isScraping} mutex with scrape() and getGapReport(), so we can't
   *       collide with a Close-gaps run.</li>
   *   <li>{@code dryRun=true} still performs the full eBinder walk and hash comparison but the
   *       backend skips every write — the report shows what WOULD change.</li>
   *   <li>Backend enforces hub-only role — a 403 from a non-hub instance surfaces to the UI
   *       verbatim so the operator learns the correct place to run it.</li>
   * </ul>
   */
  public async syncPdfs(opts?: SdsScrapeOptions & { dryRun?: boolean; limit?: number }): Promise<any> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    if (!(await this.springHealthy(port))) throw new Error('Spring Boot unavailable — start the app first');
    if (this.isScraping) throw new Error('A scrape is already running — try again shortly');

    this.isScraping = true;
    this.abortRequested = false;
    this.progressRow = 0;
    this.progressTotal = 0;
    this.progressPhase = 'list';

    // Streaming state — one PDF at a time. `firstBatchSent` decouples the isFirstBatch flag
    // from the row index so early transport failures don't cause the preflight to be missed.
    let report: any = null;
    let firstBatchSent = false;
    // Buffer transport errors that happen BEFORE the first successful POST — otherwise they'd
    // vanish (report is still null in the catch below). Flushed into the report on first
    // successful response.
    const pendingTransportErrors: any[] = [];
    let stoppedByPreflight = false;
    let stoppedByAbort = false;
    let stoppedByLimit = false;
    let itemsProcessed = 0;
    // Sentinel used to break out of the eBinder walk when the caller-supplied limit is reached.
    // Instance-comparison in the catch lets us distinguish it from real errors.
    const LIMIT_REACHED = new Error('__SDS_SYNC_LIMIT_REACHED__');
    const limit = (typeof opts?.limit === 'number' && opts.limit > 0) ? opts.limit : null;

    const postOne = async (row: ScrapedRow, pdf: { fileName: string; contentType: string; base64: string } | null) => {
      if (this.abortRequested) { stoppedByAbort = true; throw new Error('Aborted by user'); }
      if (stoppedByPreflight) return;

      const item: any = {
        sourceItemId: row.sourceId,
        names: row.names,
        manufacturer: row.manufacturer,
        revisionDate: row.revisionDate,
        pdf: pdf ? { fileName: pdf.fileName, contentType: pdf.contentType, base64Content: pdf.base64 } : null
      };
      const body = {
        items: [item],
        // JSON key MUST be "firstBatch" (not "isFirstBatch") to bind to Lombok's setFirstBatch.
        firstBatch: !firstBatchSent,
        dryRun: !!opts?.dryRun,
        report
      };
      try {
        const res = await this.postJson(port, '/ng/sds-chemicals/sync-pdfs', body);
        if (res?.responseData) {
          report = res.responseData;
          if (!firstBatchSent) {
            // First successful post — flush any earlier transport errors into the fresh report
            // so operators can see everything that happened even if row 0 initially failed.
            if (pendingTransportErrors.length > 0) {
              report.errors = report.errors || [];
              report.errors.push(...pendingTransportErrors);
              pendingTransportErrors.length = 0;
            }
            firstBatchSent = true;
          }
          if (Array.isArray(report.preflightBlockers) && report.preflightBlockers.length > 0) {
            console.warn('[SDS-Sync] preflight blocked:', report.preflightBlockers);
            stoppedByPreflight = true;
          }
        }
      } catch (e: any) {
        console.warn(`[SDS-Sync] transport error on sourceId=${row.sourceId}: ${e.message}`);
        const entry = {
          sourceId: row.sourceId,
          chemicalName: row.names?.split('\n')[0] || null,
          stage: 'TRANSPORT',
          message: e.message
        };
        if (report) {
          report.errors = report.errors || [];
          report.errors.push(entry);
        } else {
          pendingTransportErrors.push(entry);
        }
      }
      itemsProcessed++;
      this.progressRow = itemsProcessed;

      // Caller opted into a test-scope run — stop cleanly after N items are actually posted.
      if (limit !== null && itemsProcessed >= limit) {
        stoppedByLimit = true;
        throw LIMIT_REACHED;
      }
    };

    try {
      // Streaming walk — each captured PDF is posted immediately then discarded. Memory stays
      // bounded to a single PDF at a time regardless of catalog size. onCaptured throwing ends
      // the walk cleanly (user abort or hitting the caller-supplied limit).
      this.progressPhase = 'upload';
      try {
        await this.collectFromEbinder({
          capturePdfs: true,
          onCaptured: postOne,
          ...opts
        });
      } catch (walkErr) {
        // LIMIT_REACHED is expected termination — swallow. Anything else re-throws.
        if (walkErr !== LIMIT_REACHED) throw walkErr;
      }

      if (stoppedByAbort && report) {
        report.warnings = report.warnings || [];
        report.warnings.push(`Aborted after ${itemsProcessed} items.`);
      }
      if (stoppedByLimit && report) {
        report.warnings = report.warnings || [];
        report.warnings.push(`Test-scope limit reached: stopped after ${itemsProcessed} item(s).`);
      }
      return report;
    } finally {
      this.isScraping = false;
      this.progressPhase = 'idle';
    }
  }

  /**
   * Email the gap report to the given recipient with PDFs of every missing-from-eBinder chemical
   * attached. Reuses the catalog from the most recent {@link getGapReport} run so the email
   * matches what the user just saw — if no report has been run yet, falls back to an empty
   * catalog and the backend uses its bundled CSV.
   */
  public async emailGapReport(payload: { to: string; cc?: string; includeAttachments?: boolean }): Promise<any> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    if (!(await this.springHealthy(port))) throw new Error('Spring Boot unavailable');
    const body = {
      to: payload.to,
      cc: payload.cc ?? '',
      scrapedCatalog: this.lastScrapedCatalog ?? [],
      includeAttachments: payload.includeAttachments !== false   // default true
    };
    const res = await this.postJson(port, '/ng/sds-chemicals/email-gap-report', body);
    return res?.responseData ?? null;
  }

  /**
   * Fetch the active-users-with-email directory for the recipient typeahead. Empty list if the
   * backend is unreachable so the dialog stays usable with free-text input.
   */
  public async getEmailRecipients(): Promise<Array<{ name: string; email: string }>> {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;
    if (!(await this.springHealthy(port))) return [];
    try {
      const res = await this.getJson(port, '/ng/users/email-directory');
      const data = res?.responseData;
      return Array.isArray(data) ? data : [];
    } catch (e: any) {
      console.warn('[SDS] getEmailRecipients failed:', e?.message);
      return [];
    }
  }

  /**
   * Open the eBinder, optionally filter to a single location, load the chemical list, and scrape
   * every page. When {@code capturePdfs} is true each row's "View PDF" is fetched too (slow).
   * <p>
   * When {@code opts.onCaptured} is supplied and {@code capturePdfs} is true, the callback is
   * invoked after each row's PDF is captured — the caller is expected to consume the PDF then
   * and there. In that mode the returned {@code pdfs} dict stays empty (the pdf is discarded to
   * keep memory bounded — critical for hundreds of multi-megabyte SDSes). If the callback
   * throws, the walk aborts.
   */
  private async collectFromEbinder(
    opts: { capturePdfs: boolean;
            onCaptured?: (row: ScrapedRow, pdf: { fileName: string; contentType: string; base64: string } | null) => Promise<void> | void }
      & SdsScrapeOptions
  ): Promise<{ rows: ScrapedRow[]; pdfs: Record<string, { fileName: string; contentType: string; base64: string } | null> }> {
    const showWindow = opts.showWindow ?? this.config.showScrapeWindow === true;
    const win = new BrowserWindow({
      show: showWindow,
      width: 1400,
      height: 950,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        backgroundThrottling: false,
        plugins: true,                       // Enable Chromium's built-in PDF viewer plugin —
                                             // without this the embed never mounts the viewer
                                             // sub-frame and the Download button doesn't exist.
        partition: 'persist:webview-sds'
      }
    });
    this.scrapeWindow = win;
    const ses = win.webContents.session;

    // PDF capture: primary path uses Chrome DevTools Protocol to read the *actual* response body
    // the browser received — no re-fetch (the previous "capture URL, fetch again with net.request"
    // approach saved invalid bytes because the PDF endpoint is one-time-signed / requires the
    // original request context). Fallbacks (window-open, will-download) provide just the URL and
    // capturePdf re-fetches via net.request as a last resort.
    const notifyPdf = (capture: { url: string; base64?: string }, source: string) => {
      if (!this.pendingPdfCapture) return;
      console.log(`[SDS-Scraper] PDF captured via ${source}: url=${capture.url.slice(0, 150)} ${capture.base64 ? `bytes=${capture.base64.length}b64` : '(url-only, will re-fetch)'}`);
      const r = this.pendingPdfCapture;
      this.pendingPdfCapture = null;
      r(capture);
    };

    // (1) CDP — primary path. Setup is deferred until AFTER loadURL runs (attaching the debugger
    //     before the renderer has anything to navigate to can hang `Network.enable`, which would
    //     block `loadURL` entirely — empty window, page never loads). We declare the handlers here
    //     so the `finally` block can reference them, but the actual attach happens below.
    //
    //     The eBinder's "View PDF" first returns a small (~345 byte) HTML viewer page with
    //     Content-Type: application/pdf — pure misdirection. The actual PDF binary comes through
    //     a *second* request, sometimes as application/octet-stream. So we (a) broaden the filter
    //     to any PDF-ish mime *or* URL, (b) validate %PDF- magic on every body before notifying —
    //     non-PDF bodies are logged and we keep waiting, (c) dump all responses observed during
    //     the capture window to the diag log if nothing real is found.
    const dbg = win.webContents.debugger;
    let dbgAttached = false;
    // Keyed by `${sessionId||'root'}:${requestId}` because requestIds are unique only within a
    // single CDP session — and we're going to be observing multiple (root + every sub-target,
    // including the PDF plugin's renderer where the SDS binary actually flows).
    const pdfMeta = new Map<string, { url: string; mime: string; sessionId?: string }>();
    const childSessions = new Set<string>();
    this.pdfCaptureLog = [];
    const looksPdfish = (mime: string, url: string): boolean => {
      const m = (mime || '').toLowerCase();
      const u = (url || '').toLowerCase();
      return m.includes('application/pdf')
          || m.includes('application/octet-stream')
          || u.includes('/pdf')
          || u.includes('pdf=')
          || /\.pdf(\?|$|#)/.test(u);
    };
    const onDbgMessage = (_event: Electron.Event, method: string, params: any, sessionId?: string): void => {
      // When a sub-target attaches (PDF plugin renderer, iframe, etc.), enable Network on it so
      // its responseReceived/loadingFinished events flow through this same handler with sessionId.
      if (method === 'Target.attachedToTarget') {
        const sid = params?.sessionId;
        const targetType = params?.targetInfo?.type;
        if (sid) {
          childSessions.add(sid);
          console.log(`[SDS-Scraper] CDP sub-target attached: type=${targetType} sid=${sid.slice(0, 8)}…`);
          dbg.sendCommand('Network.enable', {
            maxResourceBufferSize: 100 * 1024 * 1024,
            maxTotalBufferSize: 500 * 1024 * 1024
          }, sid).catch((e: any) => console.warn(`[SDS-Scraper] sub-target Network.enable failed: ${e.message}`));
          // Recurse — the sub-target may itself have sub-targets.
          dbg.sendCommand('Target.setAutoAttach', {
            autoAttach: true,
            waitForDebuggerOnStart: false,
            flatten: true
          }, sid).catch(() => {});
        }
        return;
      }
      const sidKey = sessionId || 'root';
      if (method === 'Network.responseReceived') {
        const mime = String(params?.response?.mimeType || '');
        const url = String(params?.response?.url || '');
        // Per-click log (just the click window).
        if (this.pendingPdfCapture) {
          this.pdfCaptureLog.push({ url, mime });
          if (this.pdfCaptureLog.length > 60) this.pdfCaptureLog.shift();
        }
        // Whole-scrape log: PDF-ish + anything from a sub-target (where the SDS binary likely lives).
        if (looksPdfish(mime, url) || sessionId || url.includes('document') || url.includes('binary')) {
          this.fullResponseLog.push({ url: `${sidKey === 'root' ? '' : '[sub] '}${url}`, mime, tMs: Date.now() - this.scrapeStartMs });
          if (this.fullResponseLog.length > 200) this.fullResponseLog.shift();
        }
        if (looksPdfish(mime, url)) {
          pdfMeta.set(`${sidKey}:${params.requestId}`, { url, mime, sessionId });
        }
      } else if (method === 'Network.loadingFinished') {
        const key = `${sidKey}:${params.requestId}`;
        const meta = pdfMeta.get(key);
        if (!meta) return;
        pdfMeta.delete(key);
        if (!this.pendingPdfCapture) return;
        dbg.sendCommand('Network.getResponseBody', { requestId: params.requestId }, meta.sessionId)
          .then((body: { body: string; base64Encoded: boolean }) => {
            const base64 = body.base64Encoded
              ? body.body
              : Buffer.from(body.body || '', 'utf8').toString('base64');
            const head = Buffer.from(base64.slice(0, 12), 'base64').slice(0, 5).toString('ascii');
            if (head.startsWith('%PDF-')) {
              notifyPdf({ url: meta.url, base64 }, 'cdp');
            } else {
              // Not the real PDF — eBinder served a viewer shell. Dump the body so we can see
              // how the actual PDF is referenced (iframe src, embedded data, service worker, ...).
              const fullBody = Buffer.from(base64, 'base64').toString('utf8');
              console.log(`[SDS-Scraper] CDP ignored non-PDF body: mime=${meta.mime} head="${head.replace(/[^\x20-\x7e]/g, '?')}" size=${base64.length}b64 url=${meta.url.slice(0,140)}`);
              console.log(`[SDS-Scraper] >>> body content (${fullBody.length}c):\n${fullBody.replace(/\r/g, '').slice(0, 1500)}`);
            }
          })
          .catch((e: any) => {
            // Body was evicted (large) or stream-only. Fall back to a re-fetch via net.request.
            console.warn(`[SDS-Scraper] CDP getResponseBody failed for ${meta.url.slice(0,120)} — fallback re-fetch: ${e.message}`);
            notifyPdf({ url: meta.url }, 'cdp-no-body');
          });
      }
    };

    // (2) New-tab open (fallback).
    win.webContents.setWindowOpenHandler((details) => {
      notifyPdf({ url: details.url }, 'window-open');
      return { action: 'deny' };
    });
    // (3) Download events — handled per-row by capturePdf (one-shot will-download). We don't
    //     install a session-wide listener here so the per-row handler can claim the download alone.
    const onDownload = (_e: Electron.Event, _item: Electron.DownloadItem) => { /* no-op */ };

    const rows: ScrapedRow[] = [];
    const pdfs: Record<string, { fileName: string; contentType: string; base64: string } | null> = {};
    this.fullResponseLog = [];
    this.scrapeStartMs = Date.now();
    try {
      await win.loadURL(this.config.url);
      await this.sleep(3000);

      // Inject fetch/XHR instrumentation into the eBinder page. This captures every JS-initiated
      // network call regardless of whether CDP surfaces it (e.g. service-worker-intercepted requests
      // may not appear via Network.responseReceived). Re-injected after each navigation.
      const injectInstrumentation = async () => {
        await this.exec(win, `
          (function() {
            if (window.__sdsScrapeInjected) return 'already';
            window.__sdsScrapeInjected = true;
            window.__sdsScrapeCalls = [];
            try {
              var origFetch = window.fetch;
              window.fetch = function() {
                try {
                  var url = (arguments[0] && arguments[0].url) || arguments[0];
                  window.__sdsScrapeCalls.push({ kind: 'fetch', url: String(url).slice(0, 300), t: Date.now() });
                } catch (e) {}
                return origFetch.apply(this, arguments);
              };
            } catch (e) {}
            try {
              var origOpen = XMLHttpRequest.prototype.open;
              XMLHttpRequest.prototype.open = function(method, url) {
                try {
                  window.__sdsScrapeCalls.push({ kind: 'xhr', method: method, url: String(url).slice(0, 300), t: Date.now() });
                } catch (e) {}
                return origOpen.apply(this, arguments);
              };
            } catch (e) {}
            return 'installed';
          })()
        `);
      };
      await injectInstrumentation();
      win.webContents.on('did-frame-navigate', () => { injectInstrumentation().catch(() => {}); });

      // Attach CDP NOW — the renderer is alive and responsive, so `Network.enable` resolves
      // promptly. Large buffer sizes ensure PDF response bodies don't get evicted before we read
      // them via getResponseBody. Wrapped in try/catch so if CDP isn't available the scrape still
      // proceeds with the URL-only fallback paths (setWindowOpenHandler + will-download → net.request).
      try {
        dbg.attach('1.3');
        await Promise.race([
          dbg.sendCommand('Network.enable', {
            maxResourceBufferSize: 100 * 1024 * 1024,  // 100 MB / resource
            maxTotalBufferSize: 500 * 1024 * 1024       // 500 MB total
          }),
          new Promise((_, rj) => setTimeout(() => rj(new Error('Network.enable timeout')), 5000))
        ]);
        // Auto-attach to every sub-target (iframes, PDF plugin renderer, etc.) so we see their
        // Network events too — the SDS PDF binary is loaded in a separate process and is invisible
        // to the root webContents' Network domain. flatten:true routes every sub-target's events
        // through this same `message` handler with the sessionId param.
        await dbg.sendCommand('Target.setAutoAttach', {
          autoAttach: true,
          waitForDebuggerOnStart: false,
          flatten: true
        });
        dbg.on('message', onDbgMessage);
        dbgAttached = true;
        console.log('[SDS-Scraper] CDP attached for PDF body capture (auto-attach enabled)');
      } catch (e: any) {
        console.warn('[SDS-Scraper] CDP unavailable — falling back to re-fetch:', e.message);
        try { dbg.detach(); } catch { /* ignore */ }
      }

      await this.ensureListLoaded(win);

      if (opts.filterLocation && this.config.locationName) {
        await this.applyLocationFilter(win, this.config.locationName);
      }

      let page = 1;
      const maxPages = 100;
      while (page <= maxPages) {
        if (this.abortRequested) { console.log('[SDS-Scraper] abort: breaking page loop'); break; }
        const ready = await this.waitForSelector(win, 'tr.data-table__tr', 15000);
        if (this.abortRequested) break;
        if (!ready) { await this.dumpDiagnostics(win, `page-${page}-no-rows`); break; }

        const pageRows: ScrapedRow[] = await this.exec(win, this.scrapePageScript());
        console.log(`[SDS-Scraper] page ${page}: ${pageRows ? pageRows.length : 0} rows`);
        if (!pageRows || pageRows.length === 0) break;

        if (opts.capturePdfs) {
          this.progressPhase = 'pdfs';
          // Rough total: rows so far + this page; expanded on subsequent pages.
          this.progressTotal = rows.length + pageRows.length;
        } else {
          this.progressPhase = 'list';
        }
        for (let i = 0; i < pageRows.length; i++) {
          if (this.abortRequested) break;
          const row = pageRows[i];
          rows.push(row);
          this.progressRow = rows.length;
          if (opts.capturePdfs) {
            const key = row.sourceId || `idx-${page}-${i}`;
            const capturedPdf = await this.capturePdf(win, ses, i, key);
            if (opts.onCaptured) {
              // Streaming mode: hand the PDF off to the caller and drop it — memory stays
              // bounded to one PDF at a time regardless of catalog size. Aborts on callback
              // throw so partial state doesn't accumulate silently.
              await opts.onCaptured(row, capturedPdf);
            } else {
              pdfs[key] = capturedPdf;
            }
          }
        }

        const hasNext = await this.exec(win, this.nextPageScript());
        if (hasNext !== 'clicked') break;
        await this.sleep(2500);
        page++;
      }
    } finally {
      try { ses.removeListener('will-download', onDownload); } catch { /* ignore */ }
      if (dbgAttached) {
        try { dbg.removeListener('message', onDbgMessage); } catch { /* ignore */ }
        try { dbg.detach(); } catch { /* ignore */ }
      }
      if (!win.isDestroyed()) win.destroy();
      if (this.scrapeWindow === win) this.scrapeWindow = null;
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

  /**
   * Narrow the eBinder to a single location (e.g. "Jackson Generation"). The default "All Locations"
   * view spans every site in the token's scope (~5000 rows / 1203 locations).
   *
   * The picker virtualizes its list (only ~30 rows rendered at a time), so we MUST search rather
   * than scroll: open the picker, focus its in-modal search input (a react-select combobox — no
   * `type` attribute, class `Select-input`), type the location name via Chromium's input pipeline,
   * wait for the list to filter, click the resulting checkbox, click Apply.
   */
  private async applyLocationFilter(win: BrowserWindow, locationName: string): Promise<void> {
    console.log(`[SDS-Scraper] applyLocationFilter: target="${locationName}"`);

    // 0. The session persists across runs (cookies/state in `persist:webview-sds`), so on a second
    //    invocation the eBinder loads with the filter already applied — the heading button reads
    //    the location name instead of "All Locations". Detect that and skip the picker flow.
    const state = await this.exec(win, `
      (function () {
        var target = ${JSON.stringify(locationName)};
        var els = document.querySelectorAll('button, [role="button"], a');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].textContent || '').trim();
          var title = els[i].getAttribute('title') || '';
          if (t === target || title === target) return 'already';
          if (t === 'All Locations' || title === 'All Locations') return 'all-locations';
        }
        return 'unknown';
      })()
    `);
    if (state === 'already') {
      console.log(`[SDS-Scraper] Location filter already set to "${locationName}" — skipping picker`);
      return;
    }
    if (state !== 'all-locations') {
      await this.dumpDiagnostics(win, 'location-state-unknown');
      throw new Error(`Location filter failed: page is in an unexpected state (${state})`);
    }

    // 1. Open the location picker.
    const opened = await this.exec(win, `
      ${FIRE_CLICK}
      (function () {
        var els = document.querySelectorAll('button, [role="button"], a');
        for (var i = 0; i < els.length; i++) {
          var t = (els[i].textContent || '').trim();
          var title = els[i].getAttribute('title') || '';
          if (t === 'All Locations' || title === 'All Locations') { __fireClick(els[i]); return 'clicked'; }
        }
        return 'not-found';
      })()
    `);
    console.log(`[SDS-Scraper] All Locations click: ${opened}`);
    if (opened !== 'clicked') {
      await this.dumpDiagnostics(win, 'location-picker-button-missing');
      throw new Error('Location filter failed: "All Locations" button not found');
    }
    await this.sleep(1500);
    await this.dumpLocationPickerState(win);

    // 2. Find the picker's search input AND set its value the way React 16 needs (reset the
    //    component's internal _valueTracker so the dispatched 'input' event registers as a real
    //    change; otherwise React skips onChange and react-select's inputValue state stays "").
    //    Target by the `.Select-placeholder` text so we don't hit the global product search bar.
    const typed = await this.exec(win, `
      (function () {
        function visible(el){var r=el.getBoundingClientRect(); return r.width>0 && r.height>0;}
        function findInput() {
          var phs = document.querySelectorAll('.Select-placeholder');
          for (var i = 0; i < phs.length; i++) {
            if (!visible(phs[i])) continue;
            var t = (phs[i].textContent || '').toLowerCase();
            if (t.indexOf('location') !== -1) {
              var sel = phs[i].closest('.Select');
              if (sel) { var inp = sel.querySelector('input'); if (inp) return inp; }
            }
          }
          var modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
          for (var m = 0; m < modals.length; m++) {
            if (!visible(modals[m])) continue;
            if ((modals[m].textContent || '').indexOf('Filter by Location') !== -1) {
              var inp = modals[m].querySelector('input.Select-input, .Select-input input');
              if (inp) return inp;
            }
          }
          return null;
        }
        var input = findInput();
        if (!input) return 'no-input';
        input.focus();
        // React 16 quirk: skips onChange if _valueTracker thinks the value is unchanged.
        // Reset the tracker to '' first, THEN write via the native setter, THEN dispatch.
        if (input._valueTracker && typeof input._valueTracker.setValue === 'function') {
          input._valueTracker.setValue('');
        }
        var setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set;
        setter.call(input, ${JSON.stringify(locationName)});
        input.dispatchEvent(new Event('input', { bubbles: true }));
        input.dispatchEvent(new Event('change', { bubbles: true }));
        return 'set:' + input.value;
      })()
    `);
    console.log(`[SDS-Scraper] type: ${typed}`);
    if (typeof typed !== 'string' || !typed.startsWith('set:')) {
      await this.dumpLocationPickerState(win);
      throw new Error('Location filter failed: could not write to picker search input (see DIAG)');
    }
    await this.sleep(600);

    // 2b. Click the modal's Search button (the picker uses server-side filtering — typing alone
    //     doesn't apply the filter; the user's scraper.md called this out as "click enter to
    //     search", and the HTML has <button class="search-bar__btn" title="Search">).
    const searched = await this.exec(win, `
      ${FIRE_CLICK}
      (function () {
        var modal = null;
        var modals = document.querySelectorAll('[role="dialog"], .modal, [class*="modal"]');
        for (var m = 0; m < modals.length; m++) {
          if ((modals[m].textContent || '').indexOf('Filter by Location') !== -1) { modal = modals[m]; break; }
        }
        var scope = modal || document;
        var btn = scope.querySelector('.search-bar__btn, button[title="Search"]');
        if (btn) { __fireClick(btn); return 'clicked'; }
        return 'not-found';
      })()
    `);
    console.log(`[SDS-Scraper] Search button: ${searched}`);
    await this.sleep(2000);   // let the server return filtered results
    await this.dumpLocationPickerState(win);

    // 3. Click the matching row. The radios have empty id/label and the location name sits in a
    //    wrapper a level or two up — but the rows-container also contains the name (it concatenates
    //    every row's label). To avoid clicking "All Locations" because its grandparent text
    //    *includes* "Jackson Generation" among 19 other names, only match a wrapper whose textContent
    //    is roughly the size of the location name (exact equality first, then a small slack window).
    const picked = await this.exec(win, `
      ${FIRE_CLICK}
      (function () {
        var target = ${JSON.stringify(locationName)};
        var tLow = target.toLowerCase();
        var maxLen = target.length + 25;   // small slack — allow " (East)" / trailing whitespace, not the whole list
        function visible(el){var r=el.getBoundingClientRect(); return r.width>0 && r.height>0;}
        function norm(s){return (s||'').replace(/\\s+/g,' ').trim().toLowerCase();}
        var radios = document.querySelectorAll(
          'input[type=radio].input-toggle--radio, input[type=checkbox].input-toggle--cb, input[type=radio], input[type=checkbox]'
        );
        // Pass 1: exact-equality match anywhere in the parent chain.
        for (var i = 0; i < radios.length; i++) {
          if (!visible(radios[i])) continue;
          var el = radios[i].parentElement;
          for (var lev = 0; lev < 5 && el; lev++) {
            if (norm(el.textContent) === tLow) {
              radios[i].scrollIntoView({block:'center'});
              radios[i].checked = true;
              __fireClick(radios[i]);
              return 'picked-exact@lev' + lev + ':' + radios[i].className;
            }
            el = el.parentElement;
          }
        }
        // Pass 2: substring match with a tight length bound (the row's own label, not a list container).
        for (var i = 0; i < radios.length; i++) {
          if (!visible(radios[i])) continue;
          var el = radios[i].parentElement;
          for (var lev = 0; lev < 5 && el; lev++) {
            var t = norm(el.textContent);
            if (t.length > 0 && t.length <= maxLen && t.indexOf(tLow) !== -1) {
              radios[i].scrollIntoView({block:'center'});
              radios[i].checked = true;
              __fireClick(radios[i]);
              return 'picked-prefix@lev' + lev + '(' + t.length + 'ch):' + radios[i].className;
            }
            el = el.parentElement;
          }
        }
        return 'not-found';
      })()
    `);
    console.log(`[SDS-Scraper] location pick: ${picked}`);
    if (picked === 'not-found' || picked === false) {
      await this.dumpLocationPickerState(win);
      throw new Error(`Location filter failed: "${locationName}" row not found after search (see DIAG)`);
    }
    await this.sleep(1000);
    await this.dumpLocationPickerState(win);   // confirm picker state right before Apply

    // 5. Apply. There are multiple "Apply" buttons on the page, and the picker's Apply lives in a
    //    portal that's a DOM sibling of the modal body (so `.closest('[class*="modal"]')` doesn't
    //    reach the picker). The reliable trick: find the *tightest* element on the page whose
    //    textContent contains BOTH "Filter by Location" AND "Apply" — that element wraps the picker,
    //    no matter how it's portal-mounted. Click the Apply inside it.
    const applied = await this.exec(win, `
      ${FIRE_CLICK}
      (function () {
        function visible(el){var r=el.getBoundingClientRect(); return r.width>0 && r.height>0;}
        // Find the smallest visible element whose text contains both the header and the button label.
        var all = document.querySelectorAll('*');
        var smallest = null;
        var smallestLen = Infinity;
        for (var i = 0; i < all.length; i++) {
          if (!visible(all[i])) continue;
          var t = all[i].textContent || '';
          if (t.length === 0 || t.length > 4000) continue;
          if (t.indexOf('Filter by Location') === -1) continue;
          if (t.indexOf('Apply') === -1) continue;
          if (t.length < smallestLen) { smallest = all[i]; smallestLen = t.length; }
        }
        if (!smallest) return 'no-picker-container';
        var btns = smallest.querySelectorAll('button');
        for (var b = 0; b < btns.length; b++) {
          if ((btns[b].textContent || '').trim() === 'Apply' && visible(btns[b])) {
            btns[b].scrollIntoView({block:'center'});
            __fireClick(btns[b]);
            return 'clicked-in-picker(' + smallestLen + 'ch)';
          }
        }
        return 'apply-not-in-container';
      })()
    `);
    console.log(`[SDS-Scraper] Apply: ${applied}`);
    if (typeof applied !== 'string' || !applied.startsWith('clicked')) {
      await this.dumpLocationPickerState(win);
      throw new Error(`Location filter failed: Apply button not found (${applied})`);
    }
    await this.sleep(2000);

    // 5b. Verify the picker actually closed. If "Filter by Location" is still visible we clicked the
    //     wrong button (rare with the tightest-container strategy, but guard against it explicitly —
    //     better to fail loudly than silently scrape the unfiltered list).
    const stillOpen = await this.exec(win, `
      (function () {
        function visible(el){var r=el.getBoundingClientRect(); return r.width>0 && r.height>0;}
        var all = document.querySelectorAll('h1, h2, h3, [class*="title"], [class*="modal"], [role="dialog"]');
        for (var i = 0; i < all.length; i++) {
          if (!visible(all[i])) continue;
          if ((all[i].textContent || '').indexOf('Filter by Location') !== -1) return true;
        }
        return false;
      })()
    `);
    if (stillOpen === true) {
      await this.dumpLocationPickerState(win);
      throw new Error('Location filter failed: picker did not close after Apply (see DIAG)');
    }
    await this.sleep(1500);   // let the eBinder reload with the filter applied

    // 6. Verify rows reloaded.
    if (!(await this.waitForSelector(win, 'tr.data-table__tr', 10000))) {
      await this.dumpDiagnostics(win, 'post-location-filter-no-rows');
      throw new Error('Location filter applied but no rows appeared');
    }
  }

  /** Dump info about the visible location picker so we can iterate on selectors. */
  private async dumpLocationPickerState(win: BrowserWindow): Promise<void> {
    const info = await this.exec(win, `
      (function () {
        function visible(el) { var r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0; }
        function txt(el) { return (el.textContent || '').replace(/\\s+/g, ' ').trim(); }
        var modals = Array.from(document.querySelectorAll('[role="dialog"], .modal, [class*="modal"], [class*="popup"], [class*="popover"]')).filter(visible);
        // Text-like inputs include react-select's combobox (no type attribute).
        var textInputs = Array.from(document.querySelectorAll('input')).filter(function(i){
          var t = (i.type || 'text').toLowerCase();
          return visible(i) && t !== 'checkbox' && t !== 'radio' && t !== 'hidden';
        }).slice(0, 8).map(function(i){
          return { type: i.type || '(none)', cls: (i.className||'').slice(0,60), placeholder: i.placeholder || '', value: i.value || '', role: i.getAttribute('role') || '' };
        });
        var boxes = Array.from(document.querySelectorAll('input[type=checkbox], input[type=radio]')).filter(visible)
          .slice(0, 15).map(function(i){
            var label = i.labels && i.labels[0] ? txt(i.labels[0]) : '';
            // Walk up to 4 ancestors looking for one with a short, non-empty text — that's the row.
            var el = i.parentElement;
            for (var lev = 0; lev < 4 && el && !label; lev++) {
              var t = txt(el);
              if (t && t.length < 120) label = t;
              el = el.parentElement;
            }
            return { type: i.type, id: i.id, cls: (i.className||'').slice(0,60), label: label.slice(0, 80) };
          });
        return {
          modalCount: modals.length,
          modalText: modals.slice(0, 2).map(function(m){return txt(m).slice(0, 250);}),
          textInputs: textInputs,
          checkboxes: boxes
        };
      })()
    `);
    console.log(`[SDS-Scraper] DIAG (location-picker): ${JSON.stringify(info)}`);
  }

  /**
   * Click the i-th row's "View PDF" button and capture the SDS PDF.
   *
   * Architecture finding (after many iterations): the eBinder uses Chromium's native PDF plugin
   * via `<embed type="application/pdf" src='about:blank' internalid='HEX'>`. The binary is loaded
   * by the plugin's renderer process through an internal IPC path that is invisible to CDP, to JS
   * fetch/XHR instrumentation, and to webRequest. So we don't try to intercept — we use the
   * plugin's own **Download** button (`cr-icon-button#save` inside the embed's open shadow root)
   * to trigger a normal download via `ses.on('will-download')`, save to a temp file, read the
   * bytes, and validate %PDF- magic. Falls back to Ctrl+S keystroke if the shadow root isn't
   * accessible from JS.
   */
  private async capturePdf(
    win: BrowserWindow, ses: Electron.Session, rowIndex: number, key: string
  ): Promise<{ fileName: string; contentType: string; base64: string } | null> {
    const tempPath = path.join(getWorkingDir(), `sds-tmp-${key}-${Date.now()}.pdf`);

    // One-shot download interceptor — claims the next will-download fired on this session, saves
    // it to `tempPath`, reads bytes when the download completes, and resolves.
    let resolveDownload: ((b: Buffer | null) => void) | null = null;
    const downloadHandler = (_event: Electron.Event, item: Electron.DownloadItem) => {
      ses.removeListener('will-download', downloadHandler);
      console.log(`[SDS-Scraper] row ${rowIndex} (${key}): download captured url=${item.getURL().slice(0, 140)}`);
      item.setSavePath(tempPath);
      item.on('done', (_e: Electron.Event, state: string) => {
        if (state !== 'completed') {
          console.warn(`[SDS-Scraper] row ${rowIndex}: download state=${state}`);
          if (resolveDownload) resolveDownload(null);
          return;
        }
        try {
          const buf = fs.readFileSync(tempPath);
          try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
          if (resolveDownload) resolveDownload(buf);
        } catch (e: any) {
          console.warn(`[SDS-Scraper] row ${rowIndex}: failed to read ${tempPath}: ${e.message}`);
          if (resolveDownload) resolveDownload(null);
        }
      });
    };
    const downloadPromise = new Promise<Buffer | null>((resolve) => { resolveDownload = resolve; });
    ses.once('will-download', downloadHandler);

    try {
      // 0. Best-effort cleanup of any leftover viewer from a previous row's capture, then snapshot
      //    the viewer frames that STILL exist. Anything in this snapshot survived the dismiss
      //    attempt — the poll below refuses to bind to them and demands a genuinely new frame
      //    spawned by *this* click, so we can never grab a stale PDF.
      const main = win.webContents.mainFrame;
      const isViewerFrame = (f: Electron.WebFrameMain) => {
        const u = String(f.url || '');
        return u.startsWith('chrome-extension://')
            || u.startsWith('chrome-untrusted://')
            || u.includes('mhjfbmdgcfjbbpaeojofohoefgiehjai');   // Chromium PDF viewer extension id
      };
      await this.dismissPdfViewer(win).catch(() => { /* best effort */ });
      const preClickFrameIds = new Set(
        main.framesInSubtree.filter(isViewerFrame).map(f => f.frameTreeNodeId)
      );
      if (preClickFrameIds.size > 0) {
        console.log(`[SDS-Scraper] row ${rowIndex} (${key}): ${preClickFrameIds.size} leftover viewer frame(s) survived dismiss — will require a new frame ID after click`);
      }

      // 1. Click View PDF on the chemical row → eBinder spawns the viewer iframe.
      const clickedRow = await this.exec(win, `
        ${FIRE_CLICK}
        (function() {
          var rows = document.querySelectorAll('tr.data-table__tr');
          var row = rows[${rowIndex}];
          if (!row) return 'row-not-found';
          var btn = row.querySelector('.data-table__td--action button')
                 || row.querySelector('button[title="View PDF"]');
          if (!btn) { var ic = row.querySelector('.icon--ghs-pdf'); btn = ic ? ic.closest('button') : null; }
          if (!btn) return 'no-pdf-btn';
          __fireClick(btn);
          return 'clicked';
        })()
      `);
      if (clickedRow !== 'clicked') {
        ses.removeListener('will-download', downloadHandler);
        console.warn(`[SDS-Scraper] row ${rowIndex} (${key}): View PDF click failed: ${clickedRow}`);
        return null;
      }

      // 2. Poll for a viewer frame that WASN'T there before the click. Filtering by
      //    `frameTreeNodeId` guarantees we bind to this row's viewer even if a previous row's
      //    viewer is still mounted — that was the pairing bug: the poll would return the stale
      //    frame and we'd download the previous row's PDF under this row's key.
      let pdfFrame: Electron.WebFrameMain | null = null;
      for (let attempt = 0; attempt < 24 && !pdfFrame; attempt++) {   // up to 12s
        await this.sleep(500);
        const all = main.framesInSubtree;
        pdfFrame = all.find(f => isViewerFrame(f) && !preClickFrameIds.has(f.frameTreeNodeId)) || null;
      }

      if (!pdfFrame) {
        // Diagnostic: list every frame we saw so we know where the viewer actually lives.
        const all = main.framesInSubtree;
        console.warn(`[SDS-Scraper] row ${rowIndex} (${key}): no NEW PDF viewer frame after click; ${all.length} frame(s) in subtree, ${preClickFrameIds.size} pre-existing viewer(s):`);
        for (const f of all) console.warn(`  url=${String(f.url || '').slice(0, 160)} origin=${f.origin}`);
        ses.removeListener('will-download', downloadHandler);
        return null;
      }
      console.log(`[SDS-Scraper] row ${rowIndex} (${key}): fresh PDF viewer frame found (id=${pdfFrame.frameTreeNodeId}): ${pdfFrame.url.slice(0, 100)}`);

      // 3. Click the Download button by running JS *inside* the viewer frame. Walk nested shadow
      //    roots in case the toolbar's button is one or two levels deep.
      const clickResult = await pdfFrame.executeJavaScript(`
        (function() {
          function findBtn(root, depth) {
            if (!root || depth > 6) return null;
            var direct = root.querySelector('#save, cr-icon-button#save, [aria-label="Download"], [title="Download"]');
            if (direct) return direct;
            var all = root.querySelectorAll('*');
            for (var i = 0; i < all.length; i++) {
              if (all[i].shadowRoot) {
                var found = findBtn(all[i].shadowRoot, depth + 1);
                if (found) return found;
              }
            }
            return null;
          }
          var btn = findBtn(document, 0);
          if (!btn) return 'no-btn';
          btn.click();
          return 'clicked:' + (btn.id || btn.tagName.toLowerCase());
        })()
      `).catch((e: any) => 'exec-error:' + e.message);
      console.log(`[SDS-Scraper] row ${rowIndex} (${key}): Download click result: ${clickResult}`);

      if (typeof clickResult !== 'string' || !clickResult.startsWith('clicked')) {
        ses.removeListener('will-download', downloadHandler);
        return null;
      }

      // 3. Wait for the download to complete (or time out).
      const buf = await Promise.race([
        downloadPromise,
        new Promise<Buffer | null>((r) => setTimeout(() => r(null), 20000))
      ]);
      if (!buf) {
        ses.removeListener('will-download', downloadHandler);
        console.warn(`[SDS-Scraper] row ${rowIndex} (${key}): download did not complete`);
        return null;
      }

      // 4. Validate magic bytes — should always be %PDF- since the plugin downloads the actual binary.
      const head = buf.slice(0, 5).toString('ascii');
      if (!head.startsWith('%PDF-')) {
        console.warn(`[SDS-Scraper] row ${rowIndex} (${key}): downloaded bytes are not a PDF (head="${head.replace(/[^\x20-\x7e]/g, '?')}", size=${buf.length})`);
        return null;
      }
      console.log(`[SDS-Scraper] row ${rowIndex} (${key}): captured PDF ${buf.length} bytes`);
      return {
        fileName: `sds-${key}.pdf`,
        contentType: 'application/pdf',
        base64: buf.toString('base64')
      };
    } finally {
      ses.removeListener('will-download', downloadHandler);
      try { if (fs.existsSync(tempPath)) fs.unlinkSync(tempPath); } catch { /* ignore */ }
      // Dismiss the viewer so the next row starts with a clean slate. Two attempts:
      // (a) look for the eBinder's modal close affordance and click it; (b) send an ESC keystroke.
      // Neither is destructive if the viewer is already gone.
      await this.dismissPdfViewer(win).catch(() => { /* best effort */ });
    }
  }

  /**
   * Close whatever PDF viewer overlay the eBinder currently has open. Tries a JS-based close
   * (looking for common close-button selectors that surround the PDF plugin embed) and then falls
   * back to an ESC keystroke on the main window. Called from {@link capturePdf}'s finally block
   * so every row starts without a stale viewer frame in the subtree.
   */
  private async dismissPdfViewer(win: BrowserWindow): Promise<void> {
    if (win.isDestroyed()) return;
    try {
      await this.exec(win, `
        ${FIRE_CLICK}
        (function () {
          // Common close-button shapes in the eBinder's PDF modal. First hit wins.
          var selectors = [
            '.pdf-viewer-modal .close', '.pdf-modal .close',
            '.modal.pdf .close', '.modal .close-modal',
            'button[aria-label="Close"]', 'button[title="Close"]',
            '.modal__close', '.modal-close', '[data-dismiss="modal"]'
          ];
          for (var i = 0; i < selectors.length; i++) {
            var btn = document.querySelector(selectors[i]);
            if (btn) { __fireClick(btn); return 'closed:' + selectors[i]; }
          }
          return 'no-close-btn';
        })()
      `);
    } catch { /* ignore */ }
    // ESC key as a belt-and-suspenders — closes native modal-style overlays even when no explicit
    // close button matched. sendInputEvent needs both keyDown and keyUp to register as a keystroke.
    try {
      win.webContents.sendInputEvent({ type: 'keyDown', keyCode: 'Escape' });
      win.webContents.sendInputEvent({ type: 'keyUp', keyCode: 'Escape' });
    } catch { /* ignore */ }
    // Give the eBinder a beat to actually tear the frame down before the next capturePdf snapshots.
    await this.sleep(400);
  }

  /** Fetch a URL with the scrape session's cookies and return it as base64 (kept for misc reuse). */
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
    this.progressPhase = 'upload';
    this.progressTotal = rows.length;
    this.progressRow = 0;
    const totalBatches = Math.ceil(rows.length / IMPORT_BATCH_SIZE);
    for (let i = 0; i < rows.length; i += IMPORT_BATCH_SIZE) {
      const batchIdx = i / IMPORT_BATCH_SIZE;
      const batchRows = rows.slice(i, i + IMPORT_BATCH_SIZE);
      const pdfCount = batchRows.filter(r => pdfs[r.sourceId]).length;
      const totalBytes = batchRows.reduce((s, r) => s + (pdfs[r.sourceId]?.base64.length || 0), 0);
      const batch = batchRows.map(r => {
        const pdf = pdfs[r.sourceId] || null;
        return {
          names: r.names,
          manufacturer: r.manufacturer,
          revisionDate: r.revisionDate,
          sourceItemId: r.sourceId,
          pdf: pdf ? { fileName: pdf.fileName, contentType: pdf.contentType, base64Content: pdf.base64 } : null
        };
      });
      console.log(`[SDS-Scraper] import batch ${batchIdx + 1}/${totalBatches}: ${batchRows.length} chemicals, ${pdfCount} PDFs, ${(totalBytes / 1024).toFixed(0)} KB b64`);
      try {
        const res = await this.postJson(port, '/ng/sds-chemicals/import', batch);
        const d = res?.responseData;
        if (d) {
          report.created += d.created || 0;
          report.updated += d.updated || 0;
          report.pdfsAttached += d.pdfsAttached || 0;
          if (Array.isArray(d.newChemicals)) report.newChemicals.push(...d.newChemicals);
          if (Array.isArray(d.revisedChemicals)) report.revisedChemicals.push(...d.revisedChemicals);
          console.log(`[SDS-Scraper]   ↳ batch ${batchIdx + 1}/${totalBatches} done: created+${d.created || 0} updated+${d.updated || 0} pdfsAttached+${d.pdfsAttached || 0}`);
        } else {
          console.warn(`[SDS-Scraper]   ↳ batch ${batchIdx + 1}/${totalBatches}: no responseData in result`);
        }
      } catch (e: any) {
        console.warn(`[SDS-Scraper] import batch ${batchIdx + 1}/${totalBatches} failed:`, e.message);
      }
      this.progressRow = Math.min(i + IMPORT_BATCH_SIZE, rows.length);
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

  private getJson(port: number, apiPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: '127.0.0.1', port, path: apiPath, method: 'GET',
          headers: { 'Accept': 'application/json' }, timeout: 15000 },
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
          timeout: 300000   // 5 min — each import batch can include SharePoint roundtrips per item
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
