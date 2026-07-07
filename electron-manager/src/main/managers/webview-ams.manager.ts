/**
 * WebViewAmsManager - Scrapes Excel reports from webviewams.com.
 *
 * Headless BrowserWindow automation, modeled on GateLogManager.scrapeGateData():
 *   login -> for each report def: Reports sidebar -> set Report Name (dialog)
 *   -> set Saved Search -> Run Report -> catch Excel download -> parse with XLSX.
 *
 * The set of reports pulled each refresh is WEBVIEW_AMS_REPORTS (in constants).
 * All reports are scraped within a single login session.
 *
 * webviewams.com is a DHTMLX app whose element IDs are randomized per session,
 * so every step matches by VISIBLE TEXT and stable `name` attributes — never by id.
 */

import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import * as http from 'http';
import * as XLSX from 'xlsx';
import { DEFAULT_WEBVIEW_AMS_CONFIG, DEFAULT_SPRING_BOOT_CONFIG, WEBVIEW_AMS_REPORTS } from '../constants';
import type { WebViewAmsReportDef } from '../constants';
import { getWorkingDir } from '../paths';
import type {
  WebViewAmsConfig, WebViewAmsStatus, WebViewAmsReport,
  WebViewAmsWiredItem, WebViewAmsWiredValue
} from '../../shared/types';

/**
 * JS helper injected into every automation script. DHTMLX widgets are <div>s
 * wired via mouse-event listeners — a bare element.click() does NOT trigger
 * them — so dispatch the full mouseover/mousedown/mouseup/click sequence.
 */
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

export class WebViewAmsManager {
  private config: WebViewAmsConfig;
  private configPath: string;
  /** Latest report per report key. */
  private cachedReports: Record<string, WebViewAmsReport> = {};
  private lastUpdate: Date | null = null;
  private isRefreshing = false;
  private lastError: string | undefined;
  private lastScrapedShift: string | null = null;
  private shiftTimer: NodeJS.Timeout | null = null;
  private onReportUpdated: (() => void) | null = null;
  /** Curated cells pinned by the user (desktop-local). */
  private wiredItems: WebViewAmsWiredItem[] = [];

  constructor() {
    this.configPath = path.join(getWorkingDir(), 'webview-ams-config.json');
    this.config = this.loadConfig();
    this.loadCachedReportsFromDisk();
    this.loadWiredItemsFromDisk();
  }

  /** Called once after construction (mirrors WeatherManager.start()). */
  public start(): void {
    if (this.config.autoRefresh) {
      this.startShiftTimer();
    }
  }

  /** Callback invoked after a scrape completes (auto-refresh broadcasts). */
  public setOnReportUpdated(callback: () => void): void {
    this.onReportUpdated = callback;
  }

  // ─── Configuration ────────────────────────────────────────────────────

  public loadConfig(): WebViewAmsConfig {
    try {
      if (fs.existsSync(this.configPath)) {
        const raw = fs.readFileSync(this.configPath, 'utf-8');
        return { ...DEFAULT_WEBVIEW_AMS_CONFIG, ...JSON.parse(raw) };
      }
    } catch (err) {
      console.warn('[WebViewAMS] Failed to load config, using defaults:', err);
    }
    return { ...DEFAULT_WEBVIEW_AMS_CONFIG };
  }

  public saveConfig(config: WebViewAmsConfig): void {
    this.config = { ...DEFAULT_WEBVIEW_AMS_CONFIG, ...config };
    const dir = path.dirname(this.configPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(this.configPath, JSON.stringify(this.config, null, 2), 'utf-8');
    console.log('[WebViewAMS] Config saved');

    // Restart the shift timer so new shift-hour settings take effect
    if (this.config.autoRefresh) {
      this.startShiftTimer();
    } else {
      this.stopShiftTimer();
    }
  }

  public getConfig(): WebViewAmsConfig {
    return { ...this.config };
  }

  public isConfigured(): boolean {
    return !!(this.config.username && this.config.password);
  }

  // ─── Status & Cached Data ─────────────────────────────────────────────

  public getStatus(): WebViewAmsStatus {
    return {
      lastUpdate: this.lastUpdate?.toISOString() ?? null,
      isRefreshing: this.isRefreshing,
      configured: this.isConfigured(),
      autoRefreshEnabled: this.config.autoRefresh,
      currentShift: this.currentShiftKey(),
      reports: WEBVIEW_AMS_REPORTS.map(d => ({ key: d.key, label: d.label })),
      error: this.lastError
    };
  }

  /** Cached reports, in WEBVIEW_AMS_REPORTS order, omitting any never scraped. */
  public getCachedReports(): WebViewAmsReport[] {
    return WEBVIEW_AMS_REPORTS
      .map(d => this.cachedReports[d.key])
      .filter((r): r is WebViewAmsReport => !!r);
  }

  // ─── Refresh ──────────────────────────────────────────────────────────

  public async refresh(): Promise<WebViewAmsReport[]> {
    if (this.isRefreshing) {
      return this.getCachedReports();
    }
    if (!this.isConfigured()) {
      this.lastError = 'Not configured — set webviewams.com credentials';
      return this.getCachedReports();
    }

    this.isRefreshing = true;
    this.lastError = undefined;

    try {
      console.log(`[WebViewAMS] Starting scrape of ${WEBVIEW_AMS_REPORTS.length} report(s)...`);
      const { results, errors } = await this.scrapeAllReports();

      // Merge fresh results — a failed report keeps its previously cached data
      for (const [key, report] of Object.entries(results)) {
        this.cachedReports[key] = report;
      }
      if (Object.keys(results).length > 0) {
        this.lastUpdate = new Date();
        this.lastScrapedShift = this.currentShiftKey();
      }
      this.lastError = errors.length ? errors.join(' | ') : undefined;
      this.saveCachedReportsToDisk();

      console.log(`[WebViewAMS] Scrape complete: ${Object.keys(results).length} ok, ${errors.length} failed`);
      this.onReportUpdated?.();

      // Stage 2: persist the "rounds" report to Spring Boot H2 (best-effort).
      // Only the rounds report is persisted — others are Electron-only.
      const rounds = results['rounds'];
      if (rounds) {
        this.pushToSpringBoot(rounds);
      }
      return this.getCachedReports();
    } catch (err: any) {
      this.lastError = err.message || 'Scrape failed';
      console.error('[WebViewAMS] Scrape failed:', err.message);
      return this.getCachedReports();
    } finally {
      this.isRefreshing = false;
    }
  }

  // ─── Stage 2: best-effort persistence to Spring Boot H2 ───────────────

  /**
   * Push the "rounds" report to the local Spring Boot instance for H2 storage.
   * Best-effort: health-checks first and never throws into the scrape flow.
   */
  private pushToSpringBoot(report: WebViewAmsReport): void {
    const port = DEFAULT_SPRING_BOOT_CONFIG.port;

    const healthReq = http.request(
      { hostname: '127.0.0.1', port, path: '/actuator/health', method: 'GET', timeout: 3000 },
      (res) => {
        res.resume();
        if (res.statusCode && res.statusCode < 400) {
          this.postReportToSpringBoot(port, report);
        } else {
          console.log(`[WebViewAMS] Spring Boot health ${res.statusCode} — skipping DB save`);
        }
      }
    );
    healthReq.on('error', () => console.log('[WebViewAMS] Spring Boot unavailable — skipping DB save'));
    healthReq.on('timeout', () => { healthReq.destroy(); });
    healthReq.end();
  }

  private postReportToSpringBoot(port: number, report: WebViewAmsReport): void {
    const body = JSON.stringify(report);
    const req = http.request(
      {
        hostname: '127.0.0.1',
        port,
        path: '/ng/rounds/report',
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(body)
        },
        timeout: 15000
      },
      (res) => {
        let data = '';
        res.on('data', (chunk) => { data += chunk; });
        res.on('end', () => {
          if (res.statusCode && res.statusCode < 400) {
            console.log('[WebViewAMS] Rounds report saved to Spring Boot H2');
          } else {
            console.warn(`[WebViewAMS] Spring Boot save failed: HTTP ${res.statusCode} ${data.slice(0, 200)}`);
          }
        });
      }
    );
    req.on('error', (err) => console.warn('[WebViewAMS] Spring Boot save error:', err.message));
    req.on('timeout', () => { req.destroy(); console.warn('[WebViewAMS] Spring Boot save timed out'); });
    req.write(body);
    req.end();
  }

  // ─── Scraper ──────────────────────────────────────────────────────────

  /**
   * Open one headless window, log in once, and scrape every report def.
   * Per-report failures are collected so one bad report doesn't sink the rest.
   */
  private async scrapeAllReports(): Promise<{ results: Record<string, WebViewAmsReport>; errors: string[] }> {
    // persist: partition keeps the login cookie so repeat scrapes skip login.
    // Headless by default — config.showScrapeWindow flips it visible for debugging.
    const win = new BrowserWindow({
      show: this.config.showScrapeWindow === true,
      width: 1280,
      height: 900,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        // Headless windows are "backgrounded" by Chromium and have their JS
        // timers throttled to ~1Hz — which stalls webviewams' heavy DHTMLX
        // login/bootstrap. Disable throttling so headless runs full-speed.
        backgroundThrottling: false,
        partition: 'persist:webview-ams'
      }
    });

    const ses = win.webContents.session;
    // Run Report may open the export in a popup — allow it (download still
    // fires on the shared session's will-download event either way).
    win.webContents.setWindowOpenHandler(() => ({ action: 'allow' }));

    const results: Record<string, WebViewAmsReport> = {};
    const errors: string[] = [];

    try {
      await win.loadURL(this.config.url);
      await this.sleep(2500);

      // ── Login (only if the sign-in form is showing) ──────────────────
      const hasLogin = await this.exec(win, `!!document.querySelector('input[name="username"]')`);
      if (hasLogin) {
        await this.doLogin(win);
      } else {
        console.log('[WebViewAMS] Already logged in (session cookie) — skipping login');
      }

      await this.dumpDiagnostics(win, 'after-login');
      const sidebarReady = await this.waitForSelector(win, '.dhxsidebar_item_text', 25000);
      if (!sidebarReady) {
        await this.dumpDiagnostics(win, 'sidebar-timeout');
        throw new Error('Reports sidebar did not load — login may have failed');
      }

      // ── Scrape each report def in turn ───────────────────────────────
      for (const def of WEBVIEW_AMS_REPORTS) {
        try {
          console.log(`[WebViewAMS] [${def.key}] scraping "${def.label}"...`);
          const report = await this.scrapeOneReport(win, ses, def);
          results[def.key] = report;
          console.log(`[WebViewAMS] [${def.key}] done: ${report.rows.length} rows, ${report.columns.length} columns`);
        } catch (err: any) {
          console.error(`[WebViewAMS] [${def.key}] failed:`, err.message);
          errors.push(`${def.label}: ${err.message}`);
        }
      }
    } catch (err: any) {
      // Login / sidebar failure affects all reports
      errors.push(err.message || 'Scrape failed');
    } finally {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    }

    return { results, errors };
  }

  /**
   * Scrape a single report: Reports sidebar -> Report Name dialog -> Saved
   * Search -> Run Report -> download -> parse. Assumes the user is logged in.
   */
  private async scrapeOneReport(win: BrowserWindow, ses: Electron.Session, def: WebViewAmsReportDef): Promise<WebViewAmsReport> {
    const tag = `[WebViewAMS] [${def.key}]`;

    // ── Step 1: (re)open the Reports section for a fresh form ───────────
    const reportsClick = await this.exec(win, `
      ${FIRE_CLICK}
      (function () {
        var items = document.querySelectorAll('.dhxsidebar_item, .dhxsidebar_item_selected');
        for (var i = 0; i < items.length; i++) {
          var t = items[i].querySelector('.dhxsidebar_item_text');
          if (t && t.textContent.trim() === 'Reports') { __fireClick(items[i]); return 'clicked'; }
        }
        return 'reports-item-not-found';
      })()
    `);
    console.log(`${tag} Reports sidebar: ${reportsClick}`);
    await this.sleep(3000);

    // ── Step 2: open the "Report Name" chooser -> report-type dialog ────
    const formReady = await this.waitForSelector(win, '.chooser-textfield', 20000);
    if (!formReady) {
      throw new Error('Report form did not load');
    }
    // The Report Name field is a "chooser" — activate the field, then click
    // its "Set" button (a DHTMLX form button) to open the report-type dialog.
    const chooserInfo = await this.exec(win, `
      ${FIRE_CLICK}
      (async function () {
        function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

        var rows = document.querySelectorAll('.chooser-textfield');
        var rnRow = null;
        for (var i = 0; i < rows.length; i++) {
          var lbl = rows[i].querySelector('label');
          if (lbl && lbl.textContent.replace('*', '').trim() === 'Report Name') { rnRow = rows[i]; break; }
        }
        if (!rnRow) return { rnRowFound: false };

        var tpl = rnRow.querySelector('.dhxform_item_template');
        __fireClick(tpl || rnRow);
        await sleep(400);

        var sets = [];
        var fb = document.querySelectorAll('.dhxform_btn');
        for (var b = 0; b < fb.length; b++) {
          var ft = fb[b].querySelector('.dhxform_btn_txt');
          if (ft && ft.textContent.trim() === 'Set') sets.push(fb[b]);
        }
        var tb = document.querySelectorAll('.dhx_toolbar_btn');
        for (var c = 0; c < tb.length; c++) {
          var tt = tb[c].querySelector('.dhxtoolbar_text');
          if (tt && tt.textContent.trim() === 'Set') sets.push(tb[c]);
        }

        var chosen = null;
        for (var k = 0; k < sets.length; k++) {
          if (rnRow.compareDocumentPosition(sets[k]) & Node.DOCUMENT_POSITION_FOLLOWING) {
            chosen = sets[k];
            break;
          }
        }
        if (!chosen && sets.length > 0) chosen = sets[0];
        if (chosen) __fireClick(chosen);

        return { rnRowFound: true, setButtonCount: sets.length, clickedSet: !!chosen };
      })()
    `);
    console.log(`${tag} Report Name "Set": ${JSON.stringify(chooserInfo)}`);
    if (!chooserInfo || !chooserInfo.rnRowFound) {
      await this.dumpDiagnostics(win, `${def.key}-chooser-not-found`);
      throw new Error('Report Name field not found on the report form');
    }
    if (!chooserInfo.clickedSet) {
      await this.dumpDiagnostics(win, `${def.key}-set-button-not-found`);
      throw new Error('"Set" button for Report Name not found');
    }
    await this.sleep(3500);

    // ── Step 3: pick the report in the grid dialog, hit Select ─────────
    const dialogReady = await this.waitForSelector(win, '.gridbox .objbox tr', 20000);
    if (!dialogReady) {
      await this.dumpDiagnostics(win, `${def.key}-dialog-timeout`);
      throw new Error('Report-type dialog did not open');
    }
    // The dialog grid uses DHTMLX virtual rendering — only on-screen rows are
    // in the DOM — so scroll the grid until the target report row renders.
    const rowResult = await this.exec(win, `
      ${FIRE_CLICK}
      (async function () {
        function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
        var name = ${JSON.stringify(def.reportName)};
        var box = document.querySelector('.gridbox .objbox');
        if (!box) return { found: false, reason: 'no-grid' };

        function findCell() {
          var cells = document.querySelectorAll('.gridbox .objbox td');
          for (var i = 0; i < cells.length; i++) {
            if (cells[i].textContent.trim() === name) return cells[i];
          }
          return null;
        }

        var cell = findCell();
        var guard = 0;
        while (!cell && guard < 120) {
          var atBottom = box.scrollTop + box.clientHeight >= box.scrollHeight - 2;
          box.scrollTop += 220;
          box.dispatchEvent(new Event('scroll', { bubbles: true }));
          await sleep(130);
          cell = findCell();
          if (atBottom) break;
          guard++;
        }
        if (!cell) return { found: false, reason: 'not-in-grid' };

        cell.scrollIntoView({ block: 'center' });
        await sleep(250);
        cell = findCell(); // re-find — scrollIntoView may have re-rendered the grid
        if (!cell) return { found: false, reason: 'stale-after-scroll' };
        __fireClick(cell);
        return { found: true };
      })()
    `);
    if (!rowResult || !rowResult.found) {
      await this.dumpDiagnostics(win, `${def.key}-report-row-not-found`);
      throw new Error(`Report "${def.reportName}" not found in the dialog grid (${rowResult ? rowResult.reason : 'exec-failed'})`);
    }
    await this.sleep(800);
    const rowSelected = await this.exec(win, `!!document.querySelector('.gridbox .objbox tr.rowselected')`);
    console.log(`${tag} report-type row: clicked, selected=${rowSelected}`);

    const selectClick = await this.clickToolbarButton(win, 'Select');
    console.log(`${tag} Select button: ${selectClick}`);
    const dialogClosed = await this.waitForExpr(win, `
      !Array.from(document.querySelectorAll('.dhxwin_text_inside'))
        .some(function (e) { return e.textContent.trim() === 'Select Report'; })
    `, 10000);
    console.log(`${tag} report-type dialog closed: ${dialogClosed}`);
    if (!dialogClosed) {
      await this.dumpDiagnostics(win, `${def.key}-dialog-still-open`);
    }
    await this.sleep(1500);

    // ── Step 4: set the "Saved Search" combo ───────────────────────────
    const comboResult = await this.selectSavedSearch(win, def.savedSearch);
    console.log(`${tag} Saved Search "${def.savedSearch}": ${JSON.stringify(comboResult)}`);
    if (!comboResult || comboResult.result !== 'option-selected') {
      // Running without the saved search would dump the whole unfiltered
      // report — fail loudly with the available options instead.
      await this.dumpDiagnostics(win, `${def.key}-saved-search-failed`);
      const avail = comboResult && comboResult.options ? comboResult.options.join(' | ') : '?';
      throw new Error(
        `Saved Search "${def.savedSearch}" not applied ` +
        `(${comboResult ? comboResult.result : 'exec-failed'}) — available: ${avail}`
      );
    }
    await this.sleep(1500);

    // ── Step 5: Run Report and capture the Excel download ──────────────
    const tempPath = path.join(os.tmpdir(), `webview-ams-${def.key}-${Date.now()}.xlsx`);
    const downloadPromise = new Promise<string>((resolve, reject) => {
      const timeout = setTimeout(() => {
        ses.removeAllListeners('will-download');
        reject(new Error('Run Report download timed out after 90s'));
      }, 90000);

      ses.on('will-download', (_event, item) => {
        item.setSavePath(tempPath);
        item.once('done', (_e, state) => {
          clearTimeout(timeout);
          ses.removeAllListeners('will-download');
          if (state === 'completed') {
            resolve(tempPath);
          } else {
            reject(new Error(`Run Report download failed: ${state}`));
          }
        });
      });
    });

    const runClick = await this.clickToolbarButton(win, 'Run Report');
    console.log(`${tag} Run Report button: ${runClick}`);
    if (runClick !== 'clicked') {
      ses.removeAllListeners('will-download');
      throw new Error('Run Report button not found');
    }

    const downloadedPath = await downloadPromise;
    console.log(`${tag} Excel downloaded: ${downloadedPath}`);

    // ── Step 6: parse the workbook ─────────────────────────────────────
    const report = this.parseWorkbook(downloadedPath, def);
    try { fs.unlinkSync(downloadedPath); } catch { /* ignore */ }
    return report;
  }

  /** Fill the sign-in form via Chromium's input pipeline (insertText) and submit. */
  private async doLogin(win: BrowserWindow): Promise<void> {
    const wc = win.webContents;
    console.log('[WebViewAMS] Login form detected — signing in');

    // Username — focus + clear, then type through Chromium (DHTMLX validation
    // ignores plain `.value=`, same trap documented in WebViewManager/GateLog).
    await wc.executeJavaScript(`
      (function () {
        var e = document.querySelector('input[name="username"]');
        if (e) { e.focus(); e.click(); e.value = ''; }
      })();
    `);
    await this.sleep(400);
    await wc.insertText(this.config.username);

    await wc.executeJavaScript(`
      (function () {
        var e = document.querySelector('input[name="password"]');
        if (e) { e.focus(); e.click(); e.value = ''; }
      })();
    `);
    await this.sleep(300);
    await wc.insertText(this.config.password);

    const fillCheck = await wc.executeJavaScript(`
      (function () {
        var u = document.querySelector('input[name="username"]');
        var p = document.querySelector('input[name="password"]');
        return { usernameLen: u ? u.value.length : -1, passwordLen: p ? p.value.length : -1 };
      })();
    `);
    console.log(`[WebViewAMS] Login fields filled: ${JSON.stringify(fillCheck)}`);

    // Sign In is a DHTMLX <div> button — bare .click() does not fire its
    // handler, so dispatch the full mouse-event sequence via __fireClick.
    const clicked = await wc.executeJavaScript(`
      ${FIRE_CLICK}
      (function () {
        var btns = document.querySelectorAll('.dhxform_btn');
        for (var i = 0; i < btns.length; i++) {
          var t = btns[i].querySelector('.dhxform_btn_txt');
          if (t && t.textContent.trim() === 'Sign In') { __fireClick(btns[i]); return 'clicked'; }
        }
        return 'signin-button-not-found';
      })();
    `);
    console.log(`[WebViewAMS] Sign In button: ${clicked}`);

    const gone = await this.waitForGone(win, 'input[name="username"]', 15000);
    console.log(`[WebViewAMS] Login form after submit: ${gone
      ? 'closed (login accepted)'
      : 'STILL PRESENT — login failed or needs another step'}`);
    await this.sleep(2500);
  }

  /**
   * Open the "Saved Search" DHTMLX combo and click the given option.
   * The combo repopulates after the report type changes, so the dropdown is
   * polled until options appear. Returns { result, options } — `options` lists
   * the available saved-search names (for diagnosing a mismatch).
   */
  private selectSavedSearch(win: BrowserWindow, savedSearch: string): Promise<any> {
    return this.exec(win, `
      ${FIRE_CLICK}
      (async function () {
        function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

        var combo = null;
        var labels = document.querySelectorAll('label');
        for (var i = 0; i < labels.length; i++) {
          if (labels[i].textContent.trim() === 'Saved Search') {
            var item = labels[i].closest('.dhxform_item_label_left');
            if (item) combo = item.querySelector('.dhxcombo_material');
            break;
          }
        }
        if (!combo) return { result: 'combo-not-found', options: [] };

        var btn = combo.querySelector('.dhxcombo_select_button');
        if (btn) __fireClick(btn);

        function readOptions() {
          var out = [];
          var lists = document.querySelectorAll('.dhxcombolist, .dhxcombolist_material');
          for (var l = 0; l < lists.length; l++) {
            var opts = lists[l].querySelectorAll('div, option');
            for (var o = 0; o < opts.length; o++) {
              var t = (opts[o].textContent || '').replace(/\\s+/g, ' ').trim();
              if (t) out.push({ text: t, el: opts[o] });
            }
          }
          return out;
        }

        // The combo reloads its options when the report type changes — poll.
        var options = [];
        for (var tries = 0; tries < 16; tries++) {
          options = readOptions();
          if (options.length > 0) break;
          await sleep(300);
        }

        var names = options.map(function (o) { return o.text; });
        var target = ${JSON.stringify(savedSearch)}.toLowerCase();
        for (var k = 0; k < options.length; k++) {
          if (options[k].text.toLowerCase() === target) {
            __fireClick(options[k].el);
            return { result: 'option-selected', options: names };
          }
        }
        return { result: 'option-not-found', options: names };
      })()
    `);
  }

  /** Click a DHTMLX toolbar button by its visible label. */
  private clickToolbarButton(win: BrowserWindow, label: string): Promise<string> {
    return this.exec(win, `
      ${FIRE_CLICK}
      (function () {
        var label = ${JSON.stringify(label)};
        var btns = document.querySelectorAll('.dhx_toolbar_btn');
        for (var i = 0; i < btns.length; i++) {
          var t = btns[i].querySelector('.dhxtoolbar_text');
          if (t && t.textContent.trim() === label) { __fireClick(btns[i]); return 'clicked'; }
        }
        return 'toolbar-button-not-found';
      })()
    `);
  }

  // ─── Workbook parsing ─────────────────────────────────────────────────

  /**
   * Parse a WebView AMS Excel export into a WebViewAmsReport.
   * All these reports share one template:
   *   row 0: title   row 1: facility   row 2: "Report generated on ..."
   *   row 3: filter line   row 4: "Results: N"
   *   header row: the first row with more than one non-empty cell
   *   data rows: everything below the header
   */
  private parseWorkbook(filePath: string, def: WebViewAmsReportDef): WebViewAmsReport {
    const wb = XLSX.readFile(filePath);
    const sheet = wb.Sheets[wb.SheetNames[0]];
    const aoa: any[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: false, defval: '' });

    const metaCell = (r: number): string =>
      aoa[r] && aoa[r][0] != null ? String(aoa[r][0]).trim() : '';

    const title = metaCell(0);
    const facility = metaCell(1);
    const generatedAt = metaCell(2);
    const filterLine = metaCell(3);
    const resultsLine = metaCell(4);
    const resultCount = parseInt((resultsLine.match(/\d+/) || ['0'])[0], 10);

    // Header = first row with >1 non-empty cell (metadata rows have exactly one).
    let headerIdx = aoa.findIndex(
      r => r && r.filter(c => String(c == null ? '' : c).trim()).length > 1
    );
    if (headerIdx < 0) headerIdx = 5; // fallback to the known fixed layout

    let columns = (aoa[headerIdx] || []).map(c => String(c || '').replace(/\s+/g, ' ').trim());
    while (columns.length && !columns[columns.length - 1]) {
      columns.pop(); // drop trailing empty columns
    }

    let rows: string[][] = [];
    for (let i = headerIdx + 1; i < aoa.length; i++) {
      const raw = aoa[i] || [];
      const row = columns.map((_, ci) => String(raw[ci] == null ? '' : raw[ci]).trim());
      if (row.every(c => !c)) continue; // skip fully-blank rows
      rows.push(row);
    }

    // Trend-Table exports carry one row per round (many per shift). Collapse
    // them to a single merged row per Day/Night shift so the table reads as
    // two rows per day instead of a confusing wall of timestamps.
    if (def.aggregateByShift) {
      const agg = this.aggregateRowsByShift(columns, rows);
      columns = agg.columns;
      rows = agg.rows;
    }

    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ key: def.key, columns, rows }))
      .digest('hex');

    return {
      reportKey: def.key,
      reportLabel: def.label,
      wireMode: def.wireMode,
      title, facility, generatedAt, filterLine, resultCount,
      columns, rows,
      scrapedAt: new Date().toISOString(),
      contentHash
    };
  }

  /**
   * Collapse a Trend-Table's many per-round rows into ONE merged row per shift
   * (Day / Night), newest shift first. Each merged row keeps the latest
   * non-empty reading for every question column, so a single row shows every
   * value recorded across all of that shift's rounds. Column 0 (the raw
   * "Response Date") becomes a readable "<weekday>, <Mon> <D> · <Shift>" label
   * — the entry's date, so a pinned value's freshness is obvious.
   *
   * Rows are ordered newest-shift-first; getWiredItems() relies on that to
   * surface the most recent non-empty reading.
   */
  private aggregateRowsByShift(columns: string[], rows: string[][]): { columns: string[]; rows: string[][] } {
    if (rows.length === 0) return { columns, rows };

    interface Bucket { dateKey: string; shift: string; latest: number; entries: { t: number; row: string[] }[]; }
    const buckets = new Map<string, Bucket>();
    const passthrough: string[][] = []; // rows whose date won't parse — kept verbatim

    for (const row of rows) {
      const t = Date.parse(row[0]);
      if (isNaN(t)) { passthrough.push(row); continue; }
      const { dateKey, shift } = this.shiftForDate(new Date(t));
      const bk = `${dateKey}|${shift}`;
      let b = buckets.get(bk);
      if (!b) { b = { dateKey, shift, latest: t, entries: [] }; buckets.set(bk, b); }
      b.entries.push({ t, row });
      if (t > b.latest) b.latest = t;
    }

    const merged: string[][] = [];
    const ordered = Array.from(buckets.values()).sort((a, b) => b.latest - a.latest); // newest shift first
    for (const b of ordered) {
      b.entries.sort((x, y) => x.t - y.t); // oldest → newest so the latest non-empty reading wins
      const out = columns.map(() => '');
      for (const { row } of b.entries) {
        for (let c = 1; c < columns.length; c++) {
          if (row[c]) out[c] = row[c];
        }
      }
      out[0] = this.shiftLabel(b.dateKey, b.shift);
      merged.push(out);
    }
    // Keep any unparseable rows visible below the shift rows rather than dropping them.
    for (const row of passthrough) merged.push(row);

    const cols = columns.slice();
    cols[0] = 'Shift'; // was "Response Date" — now a per-shift bucket label
    return { columns: cols, rows: merged };
  }

  /** Human date label for a shift bucket, e.g. "Wed, May 20 · Night". */
  private shiftLabel(dateKey: string, shift: string): string {
    const d = new Date(`${dateKey}T12:00:00`);
    const nice = isNaN(d.getTime())
      ? dateKey
      : d.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    return `${nice} · ${shift}`;
  }

  // ─── Auto-refresh (once per shift) ────────────────────────────────────

  public setAutoRefresh(enabled: boolean): void {
    this.config.autoRefresh = enabled;
    this.saveConfig(this.config); // saveConfig (re)starts/stops the timer
  }

  private startShiftTimer(): void {
    this.stopShiftTimer();
    console.log('[WebViewAMS] Shift auto-refresh enabled (checks every 15 min)');
    this.shiftTimer = setInterval(() => {
      this.maybeScrapeForShift().catch(err =>
        console.warn('[WebViewAMS] Shift scrape failed:', err.message));
    }, 15 * 60 * 1000);
    setTimeout(() => {
      this.maybeScrapeForShift().catch(err =>
        console.warn('[WebViewAMS] Initial shift scrape failed:', err.message));
    }, 8000);
  }

  private stopShiftTimer(): void {
    if (this.shiftTimer) {
      clearInterval(this.shiftTimer);
      this.shiftTimer = null;
    }
  }

  /** Scrape if the current shift hasn't been scraped yet. */
  private async maybeScrapeForShift(): Promise<void> {
    if (!this.config.autoRefresh || !this.isConfigured()) return;
    const shift = this.currentShiftKey();
    if (shift === this.lastScrapedShift) return;
    console.log(`[WebViewAMS] New shift "${shift}" — auto-scraping`);
    await this.refresh();
  }

  /** Shift key for a moment in time, e.g. "2026-05-21-Day" / "2026-05-21-Night". */
  private currentShiftKey(now = new Date()): string {
    const { dateKey, shift } = this.shiftForDate(now);
    return `${dateKey}-${shift}`;
  }

  /**
   * Which shift a moment belongs to, honoring the configured day/night start
   * hours. Pre-dawn hours (before day start) belong to the PREVIOUS calendar
   * day's Night shift. Returns the bucket's owning date + shift name.
   */
  private shiftForDate(d: Date): { dateKey: string; shift: 'Day' | 'Night' } {
    const dayStart = this.config.dayShiftStartHour;
    const nightStart = this.config.nightShiftStartHour;
    const h = d.getHours();
    const ymd = (x: Date) =>
      `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;

    if (h >= dayStart && h < nightStart) {
      return { dateKey: ymd(d), shift: 'Day' };
    }
    if (h < dayStart) {
      const prev = new Date(d);
      prev.setDate(d.getDate() - 1);
      return { dateKey: ymd(prev), shift: 'Night' };
    }
    return { dateKey: ymd(d), shift: 'Night' };
  }

  // ─── Disk cache (survives restarts) ───────────────────────────────────

  private get reportCachePath(): string {
    return path.join(getWorkingDir(), 'webview-ams-report.json');
  }

  private loadCachedReportsFromDisk(): void {
    try {
      if (fs.existsSync(this.reportCachePath)) {
        const raw = JSON.parse(fs.readFileSync(this.reportCachePath, 'utf-8'));
        this.cachedReports = raw.reports || {};
        this.lastUpdate = raw.lastUpdate ? new Date(raw.lastUpdate) : null;
        this.lastScrapedShift = raw.lastScrapedShift || null;
      }
    } catch (err: any) {
      console.warn('[WebViewAMS] Failed to load cached reports:', err.message);
    }
  }

  private saveCachedReportsToDisk(): void {
    try {
      fs.writeFileSync(
        this.reportCachePath,
        JSON.stringify({
          reports: this.cachedReports,
          lastUpdate: this.lastUpdate?.toISOString() ?? null,
          lastScrapedShift: this.lastScrapedShift
        }),
        'utf-8'
      );
    } catch (err: any) {
      console.warn('[WebViewAMS] Failed to save cached reports:', err.message);
    }
  }

  // ─── Wired items (curated cells, desktop-local) ───────────────────────

  private get wiredItemsPath(): string {
    return path.join(getWorkingDir(), 'webview-ams-wired.json');
  }

  private loadWiredItemsFromDisk(): void {
    try {
      if (fs.existsSync(this.wiredItemsPath)) {
        const raw = JSON.parse(fs.readFileSync(this.wiredItemsPath, 'utf-8'));
        // Keep only current-format items (mode + key) — drops any old cell-based entries.
        this.wiredItems = (Array.isArray(raw.items) ? raw.items : [])
          .filter((i: any) => i && i.mode && i.key);
      }
    } catch (err: any) {
      console.warn('[WebViewAMS] Failed to load wired items:', err.message);
    }
  }

  private saveWiredItemsToDisk(): void {
    try {
      fs.writeFileSync(
        this.wiredItemsPath,
        JSON.stringify({ items: this.wiredItems }, null, 2),
        'utf-8'
      );
    } catch (err: any) {
      console.warn('[WebViewAMS] Failed to save wired items:', err.message);
    }
  }

  /** Trailing "(N)" question-ordinal stripped — the stable part of a column header. */
  private stripColumnOrdinal(header: string): string {
    return header.replace(/\s*\(\d+\)\s*$/, '').trim();
  }

  /** The trailing "(N)" question-ordinal of a column header (0 if none). */
  private columnOrdinal(header: string): number {
    const m = header.match(/\((\d+)\)\s*$/);
    return m ? parseInt(m[1], 10) : 0;
  }

  /** Wired items resolved against the latest cached reports. */
  public getWiredItems(): WebViewAmsWiredValue[] {
    // Rank the column pins that share a base name (ordinal-stripped) within a
    // report, ordered by their stored ordinal. Used to pair duplicate-named
    // columns positionally when the checklist changes and ordinals drift.
    const rankById = new Map<string, number>();
    const groups = new Map<string, WebViewAmsWiredItem[]>();
    for (const it of this.wiredItems) {
      if (it.mode !== 'column') continue;
      const g = `${it.reportKey} ${this.stripColumnOrdinal(it.key)}`;
      (groups.get(g) ?? groups.set(g, []).get(g)!).push(it);
    }
    for (const arr of groups.values()) {
      arr.sort((a, b) => this.columnOrdinal(a.key) - this.columnOrdinal(b.key));
      arr.forEach((it, i) => rankById.set(it.id, i));
    }

    return this.wiredItems.map(item => {
      const report = this.cachedReports[item.reportKey];
      const base: WebViewAmsWiredValue = {
        ...item, found: false, label: item.key, value: '', time: '', fields: []
      };
      if (!report) return base;

      if (item.mode === 'column') {
        // Resolve the pinned column tolerantly — the checklist grows over time
        // and shifts every column's "(N)" ordinal, so an exact header match
        // silently breaks. Fall back to the ordinal-stripped base name.
        const colIdx = this.resolveColumnIndex(report, item, rankById.get(item.id) ?? 0);
        if (colIdx < 0) return base;
        const colName = report.columns[colIdx];
        // Latest non-empty reading in the column. Aggregated rows are
        // newest-shift-first, so scan top-down and take the first shift that
        // actually recorded a value — a pin never blanks out just because the
        // most recent shift skipped that reading. `time` carries the shift/date
        // label of the reading so the user can tell fresh from stale.
        for (let i = 0; i < report.rows.length; i++) {
          const cell = (report.rows[i][colIdx] || '').trim();
          if (cell) {
            return { ...base, found: true, label: colName, value: cell, time: report.rows[i][0] || '' };
          }
        }
        return { ...base, found: true, label: colName }; // column exists, no readings yet
      }

      // row mode — the whole row by its first-column key
      const row = report.rows.find(r => r[0] === item.key);
      if (!row) return base;
      const fields = report.columns
        .map((name, i) => ({ name, value: (row[i] || '').trim() }))
        .filter(f => f.value);
      const descIdx = report.columns.indexOf('Description');
      const condIdx = report.columns.indexOf('Condition');
      const dateIdx = report.columns.indexOf('Date Created');
      return {
        ...base,
        found: true,
        label: descIdx >= 0 ? (row[descIdx] || item.key) : (row[1] || item.key),
        value: condIdx >= 0 ? (row[condIdx] || '') : '',
        time: dateIdx >= 0 ? (row[dateIdx] || '') : '',
        fields
      };
    });
  }

  /**
   * Map a pinned column to a current column index, tolerant of the volatile
   * trailing "(N)" question-ordinal that shifts whenever the round checklist
   * gains or loses questions:
   *   1) exact header match (checklist unchanged),
   *   2) unique ordinal-stripped base-name match (the common case),
   *   3) duplicate base names → pair by rank, since both the pins and the
   *      current columns are ordered (e.g. the two "…injection strainer DP").
   */
  private resolveColumnIndex(report: WebViewAmsReport, item: WebViewAmsWiredItem, rank: number): number {
    const exact = report.columns.indexOf(item.key);
    if (exact >= 0) return exact;

    const base = this.stripColumnOrdinal(item.key);
    const matches: number[] = [];
    for (let i = 1; i < report.columns.length; i++) { // skip col 0 (the Shift label)
      if (this.stripColumnOrdinal(report.columns[i]) === base) matches.push(i);
    }
    if (matches.length === 0) return -1;
    if (matches.length === 1) return matches[0];
    return matches[Math.min(rank, matches.length - 1)];
  }

  /**
   * Pin a report column ('column' mode) or row ('row' mode) to the curated
   * view. Deduplicates on report + mode + key.
   */
  public addWiredItem(reportKey: string, mode: 'column' | 'row', key: string): WebViewAmsWiredValue[] {
    const exists = this.wiredItems.some(
      i => i.reportKey === reportKey && i.mode === mode && i.key === key
    );
    if (!exists) {
      const def = WEBVIEW_AMS_REPORTS.find(d => d.key === reportKey);
      this.wiredItems.push({
        id: `w${Date.now()}${Math.floor(Math.random() * 1000)}`,
        reportKey,
        reportLabel: def ? def.label : reportKey,
        mode,
        key,
        addedAt: new Date().toISOString()
      });
      this.saveWiredItemsToDisk();
    }
    return this.getWiredItems();
  }

  public removeWiredItem(id: string): WebViewAmsWiredValue[] {
    this.wiredItems = this.wiredItems.filter(i => i.id !== id);
    this.saveWiredItemsToDisk();
    return this.getWiredItems();
  }

  // ─── Spring Boot history (read-only) ──────────────────────────────────

  /** Fetch the stored report metadata list from the local Spring Boot. */
  public getHistoryList(): Promise<any[]> {
    return this.springBootGet('/ng/rounds/list')
      .then(d => (Array.isArray(d) ? d : []))
      .catch(() => []);
  }

  /** Fetch one stored report (full table) from the local Spring Boot. */
  public getHistoryReport(id: number): Promise<any> {
    return this.springBootGet(`/ng/rounds/${id}`).catch(() => null);
  }

  /** GET a Spring Boot endpoint, resolving to the NgApiResponse `responseData`. */
  private springBootGet(apiPath: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const req = http.request(
        {
          hostname: '127.0.0.1',
          port: DEFAULT_SPRING_BOOT_CONFIG.port,
          path: apiPath,
          method: 'GET',
          timeout: 8000
        },
        (res) => {
          let body = '';
          res.on('data', (c) => { body += c; });
          res.on('end', () => {
            if (!res.statusCode || res.statusCode >= 400) {
              reject(new Error(`HTTP ${res.statusCode}`));
              return;
            }
            try {
              resolve(JSON.parse(body).responseData);
            } catch {
              reject(new Error('bad JSON'));
            }
          });
        }
      );
      req.on('error', reject);
      req.on('timeout', () => { req.destroy(); reject(new Error('timeout')); });
      req.end();
    });
  }

  // ─── Cleanup ──────────────────────────────────────────────────────────

  public cleanup(): void {
    this.stopShiftTimer();
  }

  // ─── Utilities ────────────────────────────────────────────────────────

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /** Run JS in the page; resolves to false on any error so callers can fall through. */
  private async exec(win: BrowserWindow, script: string): Promise<any> {
    if (win.isDestroyed()) return false;
    try {
      return await win.webContents.executeJavaScript(script);
    } catch (err: any) {
      console.warn('[WebViewAMS] executeJavaScript failed:', err.message);
      return false;
    }
  }

  /** Poll the page until `selector` exists or the timeout elapses. */
  private async waitForSelector(win: BrowserWindow, selector: string, timeoutMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (win.isDestroyed()) return false;
      const found = await this.exec(win, `!!document.querySelector(${JSON.stringify(selector)})`);
      if (found) return true;
      await this.sleep(300);
    }
    return false;
  }

  /** Poll a JS boolean expression until it returns true (or the timeout elapses). */
  private async waitForExpr(win: BrowserWindow, expr: string, timeoutMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (win.isDestroyed()) return false;
      const ok = await this.exec(win, `(${expr})`);
      if (ok) return true;
      await this.sleep(300);
    }
    return false;
  }

  /** Poll the page until `selector` is GONE (or the timeout elapses). */
  private async waitForGone(win: BrowserWindow, selector: string, timeoutMs: number): Promise<boolean> {
    const start = Date.now();
    while (Date.now() - start < timeoutMs) {
      if (win.isDestroyed()) return true;
      const found = await this.exec(win, `!!document.querySelector(${JSON.stringify(selector)})`);
      if (!found) return true;
      await this.sleep(400);
    }
    return false;
  }

  /**
   * Log a snapshot of the current page — URL, key DHTMLX elements, button
   * labels, visible text — so scrape failures can be diagnosed without
   * seeing the live site.
   */
  private async dumpDiagnostics(win: BrowserWindow, label: string): Promise<void> {
    const info = await this.exec(win, `
      (function () {
        function list(sel) {
          return Array.from(document.querySelectorAll(sel))
            .map(function (e) { return (e.textContent || '').replace(/\\s+/g, ' ').trim(); })
            .filter(Boolean);
        }
        return {
          url: document.URL,
          title: document.title,
          loginFormPresent: !!document.querySelector('input[name="username"]'),
          dhxWindows: list('.dhxwin_text_inside'),
          sidebarItems: list('.dhxsidebar_item_text'),
          toolbarButtons: list('.dhxtoolbar_text'),
          formButtons: list('.dhxform_btn_txt'),
          formMessages: list('.dhxform_item_template'),
          statusBar: list('.dhx_cell_statusbar_text'),
          gridboxCount: document.querySelectorAll('.gridbox').length,
          gridRowCount: document.querySelectorAll('.gridbox .objbox tr').length,
          bodyText: (document.body ? document.body.innerText : '').replace(/\\s+/g, ' ').trim().slice(0, 600)
        };
      })()
    `);
    console.log(`[WebViewAMS] DIAG (${label}): ${JSON.stringify(info)}`);
  }
}
