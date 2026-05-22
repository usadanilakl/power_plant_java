/**
 * WebViewAmsManager - Scrapes the "Rounds" Trend Table report from webviewams.com.
 *
 * Headless BrowserWindow automation, modeled on GateLogManager.scrapeGateData():
 *   login -> Reports sidebar -> set Report Name (dialog) -> set Saved Search
 *   -> Run Report -> catch Excel download -> parse with XLSX.
 *
 * webviewams.com is a DHTMLX app whose element IDs are randomized per session,
 * so every step matches by VISIBLE TEXT and stable `name` attributes — never by id.
 *
 * NOTE: selectors are verified against the saved HTML snapshots in
 * project/features/web-view-ams/. Steps marked [TUNE] interact with DHTMLX
 * widgets whose runtime click behavior can only be confirmed against the live
 * site — expect to adjust timing/selectors there on the first real run.
 */

import { BrowserWindow } from 'electron';
import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import * as crypto from 'crypto';
import * as XLSX from 'xlsx';
import { DEFAULT_WEBVIEW_AMS_CONFIG } from '../constants';
import { getWorkingDir } from '../paths';
import type { WebViewAmsConfig, WebViewAmsStatus, RoundsReport } from '../../shared/types';

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
  private cachedReport: RoundsReport | null = null;
  private lastUpdate: Date | null = null;
  private isRefreshing = false;
  private lastError: string | undefined;
  private lastScrapedShift: string | null = null;
  private shiftTimer: NodeJS.Timeout | null = null;
  private onReportUpdated: (() => void) | null = null;

  constructor() {
    this.configPath = path.join(getWorkingDir(), 'webview-ams-config.json');
    this.config = this.loadConfig();
    this.loadCachedReportFromDisk();
  }

  /** Called once after construction (mirrors WeatherManager.start()). */
  public start(): void {
    if (this.config.autoRefresh) {
      this.startShiftTimer();
    }
  }

  /** Callback invoked after a successful scrape (auto-refresh broadcasts). */
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
      rowCount: this.cachedReport?.rows.length ?? 0,
      currentShift: this.currentShiftKey(),
      error: this.lastError
    };
  }

  public getCachedReport(): RoundsReport | null {
    return this.cachedReport;
  }

  // ─── Refresh ──────────────────────────────────────────────────────────

  public async refresh(): Promise<RoundsReport | null> {
    if (this.isRefreshing) {
      return this.cachedReport;
    }
    if (!this.isConfigured()) {
      this.lastError = 'Not configured — set webviewams.com credentials';
      return this.cachedReport;
    }

    this.isRefreshing = true;
    this.lastError = undefined;

    try {
      console.log('[WebViewAMS] Starting scrape...');
      const report = await this.scrapeReport();

      this.cachedReport = report;
      this.lastUpdate = new Date();
      this.lastScrapedShift = this.currentShiftKey();
      this.saveCachedReportToDisk();

      console.log(`[WebViewAMS] Scrape complete: ${report.rows.length} rows, ${report.columns.length} columns`);
      this.onReportUpdated?.();
      return report;
    } catch (err: any) {
      this.lastError = err.message || 'Scrape failed';
      console.error('[WebViewAMS] Scrape failed:', err.message);
      return this.cachedReport;
    } finally {
      this.isRefreshing = false;
    }
  }

  // ─── Scraper ──────────────────────────────────────────────────────────

  private async scrapeReport(): Promise<RoundsReport> {
    // persist: partition keeps the login cookie so repeat scrapes skip login.
    // show:true during the tuning phase so the flow can be watched — flip to
    // false once the selectors/timing are confirmed against the live site.
    const win = new BrowserWindow({
      show: true,
      width: 1280,
      height: 900,
      webPreferences: {
        contextIsolation: true,
        nodeIntegration: false,
        partition: 'persist:webview-ams'
      }
    });

    const ses = win.webContents.session;
    // Run Report may open the export in a popup — allow it (download still
    // fires on the shared session's will-download event either way).
    win.webContents.setWindowOpenHandler(() => ({ action: 'allow' }));

    try {
      await win.loadURL(this.config.url);
      await this.sleep(2500);

      // ── Step 1: Login (only if the sign-in form is showing) ──────────
      const hasLogin = await this.exec(win, `!!document.querySelector('input[name="username"]')`);
      if (hasLogin) {
        await this.doLogin(win);
      } else {
        console.log('[WebViewAMS] Already logged in (session cookie) — skipping login');
      }

      // ── Step 2: Open the Reports sidebar item ────────────────────────
      await this.dumpDiagnostics(win, 'after-login');
      const sidebarReady = await this.waitForSelector(win, '.dhxsidebar_item_text', 25000);
      if (!sidebarReady) {
        await this.dumpDiagnostics(win, 'sidebar-timeout');
        throw new Error('Reports sidebar did not load — see the DIAG line above for page state');
      }
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
      console.log(`[WebViewAMS] Reports sidebar: ${reportsClick}`);
      await this.sleep(3000);

      // ── Step 3: Open the "Report Name" chooser -> report-type dialog ──
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

          // 1. activate the Report Name row
          var tpl = rnRow.querySelector('.dhxform_item_template');
          __fireClick(tpl || rnRow);
          await sleep(400);

          // 2. collect every "Set" button (form buttons + toolbar buttons)
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

          // 3. click the first "Set" at/after the Report Name row in DOM order
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
      console.log(`[WebViewAMS] Report Name "Set": ${JSON.stringify(chooserInfo)}`);
      if (!chooserInfo || !chooserInfo.rnRowFound) {
        await this.dumpDiagnostics(win, 'chooser-not-found');
        throw new Error('Report Name field not found on the report form');
      }
      if (!chooserInfo.clickedSet) {
        await this.dumpDiagnostics(win, 'set-button-not-found');
        throw new Error('"Set" button for Report Name not found — see the DIAG line above');
      }
      await this.sleep(3500);

      // ── Step 4: [TUNE] Pick the report in the grid dialog, hit Select ─
      const dialogReady = await this.waitForSelector(win, '.gridbox .objbox tr', 20000);
      if (!dialogReady) {
        await this.dumpDiagnostics(win, 'dialog-timeout');
        throw new Error('Report-type dialog did not open — see the DIAG line above');
      }
      const rowResult = await this.exec(win, `
        ${FIRE_CLICK}
        (function () {
          var name = ${JSON.stringify(this.config.reportName)};
          var rows = document.querySelectorAll('.gridbox .objbox tr');
          for (var i = 0; i < rows.length; i++) {
            var cells = rows[i].querySelectorAll('td');
            for (var j = 0; j < cells.length; j++) {
              if (cells[j].textContent.trim() === name) {
                __fireClick(cells[j]);
                return { found: true };
              }
            }
          }
          return { found: false };
        })()
      `);
      if (!rowResult || !rowResult.found) {
        await this.dumpDiagnostics(win, 'report-row-not-found');
        throw new Error(`Report "${this.config.reportName}" not found in the dialog grid`);
      }
      await this.sleep(800);
      const rowSelected = await this.exec(win, `!!document.querySelector('.gridbox .objbox tr.rowselected')`);
      console.log(`[WebViewAMS] Report-type row: clicked, selected=${rowSelected}`);

      // Confirm via the dialog's "Select" toolbar button, then wait for the
      // "Select Report" window to close.
      const selectClick = await this.clickToolbarButton(win, 'Select');
      console.log(`[WebViewAMS] Select button: ${selectClick}`);
      const dialogClosed = await this.waitForExpr(win, `
        !Array.from(document.querySelectorAll('.dhxwin_text_inside'))
          .some(function (e) { return e.textContent.trim() === 'Select Report'; })
      `, 10000);
      console.log(`[WebViewAMS] Report-type dialog closed: ${dialogClosed}`);
      if (!dialogClosed) {
        await this.dumpDiagnostics(win, 'dialog-still-open');
      }
      await this.sleep(1500);

      // ── Step 5: [TUNE] Set the "Saved Search" combo to "Rounds" ──────
      const comboResult = await this.selectSavedSearch(win);
      console.log(`[WebViewAMS] Saved Search combo: ${comboResult}`);
      await this.sleep(1500);

      // ── Step 6: Run Report and capture the Excel download ────────────
      const tempPath = path.join(os.tmpdir(), `webview-ams-${Date.now()}.xlsx`);
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
      console.log(`[WebViewAMS] Run Report button: ${runClick}`);
      if (runClick !== 'clicked') {
        throw new Error('Run Report button not found');
      }

      const downloadedPath = await downloadPromise;
      console.log(`[WebViewAMS] Excel downloaded: ${downloadedPath}`);

      // ── Step 7: Parse the workbook ───────────────────────────────────
      const report = this.parseWorkbook(downloadedPath);
      try { fs.unlinkSync(downloadedPath); } catch { /* ignore */ }
      return report;
    } finally {
      if (!win.isDestroyed()) {
        win.destroy();
      }
    }
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

    // Confirm the fields actually took the typed text before submitting
    // (logs lengths only — never the password value).
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

    // Wait for the sign-in form to disappear (= login accepted). If it is still
    // present after 15s, login failed or there is another step (OTP / customer).
    const gone = await this.waitForGone(win, 'input[name="username"]', 15000);
    console.log(`[WebViewAMS] Login form after submit: ${gone
      ? 'closed (login accepted)'
      : 'STILL PRESENT — login failed or needs another step'}`);
    await this.sleep(2500);
  }

  /**
   * [TUNE] Open the "Saved Search" DHTMLX combo and click the configured option.
   * DHTMLX combos render their dropdown list detached on <body>, so the list is
   * queried document-wide after opening the combo.
   */
  private selectSavedSearch(win: BrowserWindow): Promise<string> {
    return this.exec(win, `
      ${FIRE_CLICK}
      (async function () {
        function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

        // Locate the combo container next to the "Saved Search" label
        var combo = null;
        var labels = document.querySelectorAll('label');
        for (var i = 0; i < labels.length; i++) {
          if (labels[i].textContent.trim() === 'Saved Search') {
            var item = labels[i].closest('.dhxform_item_label_left');
            if (item) combo = item.querySelector('.dhxcombo_material');
            break;
          }
        }
        if (!combo) return 'combo-not-found';

        var btn = combo.querySelector('.dhxcombo_select_button');
        if (btn) __fireClick(btn);
        await sleep(700);

        var target = ${JSON.stringify(this.config.savedSearch)};
        var lists = document.querySelectorAll('.dhxcombolist, .dhxcombolist_material');
        for (var l = 0; l < lists.length; l++) {
          var opts = lists[l].querySelectorAll('div, option');
          for (var o = 0; o < opts.length; o++) {
            if (opts[o].textContent.trim() === target) { __fireClick(opts[o]); return 'option-selected'; }
          }
        }
        return 'option-not-found';
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
   * Parse the Trend Table workbook into a RoundsReport.
   * Layout (mirrors the saved CSV):
   *   row 0: title   row 1: facility   row 2: "Report generated on ..."
   *   row 3: "Date: ...; Task Template: ...; Include: ..."   row 4: "Results: N"
   *   header row: first row whose first cell is "Response Date"
   *   data rows: everything below the header
   */
  private parseWorkbook(filePath: string): RoundsReport {
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

    let headerIdx = aoa.findIndex(r => r && String(r[0] || '').trim() === 'Response Date');
    if (headerIdx < 0) headerIdx = 5; // fallback to the known fixed layout

    const columns = (aoa[headerIdx] || []).map(c => String(c || '').replace(/\s+/g, ' ').trim());
    while (columns.length && !columns[columns.length - 1]) {
      columns.pop(); // drop trailing empty columns
    }

    const rows: string[][] = [];
    for (let i = headerIdx + 1; i < aoa.length; i++) {
      const raw = aoa[i] || [];
      const row = columns.map((_, ci) => String(raw[ci] == null ? '' : raw[ci]).trim());
      if (row.every(c => !c)) continue; // skip fully-blank rows
      rows.push(row);
    }

    const contentHash = crypto
      .createHash('sha256')
      .update(JSON.stringify({ columns, rows }))
      .digest('hex');

    return {
      title, facility, generatedAt, filterLine, resultCount,
      columns, rows,
      scrapedAt: new Date().toISOString(),
      contentHash
    };
  }

  // ─── Auto-refresh (once per shift) ────────────────────────────────────

  public setAutoRefresh(enabled: boolean): void {
    this.config.autoRefresh = enabled;
    this.saveConfig(this.config); // saveConfig (re)starts/stops the timer
  }

  private startShiftTimer(): void {
    this.stopShiftTimer();
    console.log('[WebViewAMS] Shift auto-refresh enabled (checks every 15 min)');
    // Re-check every 15 min — scrape when the shift key changes
    this.shiftTimer = setInterval(() => {
      this.maybeScrapeForShift().catch(err =>
        console.warn('[WebViewAMS] Shift scrape failed:', err.message));
    }, 15 * 60 * 1000);
    // Initial check shortly after startup
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
    const dayStart = this.config.dayShiftStartHour;
    const nightStart = this.config.nightShiftStartHour;
    const h = now.getHours();
    const ymd = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (h >= dayStart && h < nightStart) {
      return `${ymd(now)}-Day`;
    }
    // Night shift — hours before dayStart belong to the previous calendar day's night
    if (h < dayStart) {
      const prev = new Date(now);
      prev.setDate(now.getDate() - 1);
      return `${ymd(prev)}-Night`;
    }
    return `${ymd(now)}-Night`;
  }

  // ─── Disk cache (survives restarts) ───────────────────────────────────

  private get reportCachePath(): string {
    return path.join(getWorkingDir(), 'webview-ams-report.json');
  }

  private loadCachedReportFromDisk(): void {
    try {
      if (fs.existsSync(this.reportCachePath)) {
        const raw = JSON.parse(fs.readFileSync(this.reportCachePath, 'utf-8'));
        this.cachedReport = raw.report || null;
        this.lastUpdate = raw.lastUpdate ? new Date(raw.lastUpdate) : null;
        this.lastScrapedShift = raw.lastScrapedShift || null;
      }
    } catch (err: any) {
      console.warn('[WebViewAMS] Failed to load cached report:', err.message);
    }
  }

  private saveCachedReportToDisk(): void {
    try {
      fs.writeFileSync(
        this.reportCachePath,
        JSON.stringify({
          report: this.cachedReport,
          lastUpdate: this.lastUpdate?.toISOString() ?? null,
          lastScrapedShift: this.lastScrapedShift
        }),
        'utf-8'
      );
    } catch (err: any) {
      console.warn('[WebViewAMS] Failed to save cached report:', err.message);
    }
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
   * seeing the live site. Used during the selector tuning phase.
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
          iframeCount: document.querySelectorAll('iframe').length,
          iframeSrcs: Array.from(document.querySelectorAll('iframe'))
            .map(function (f) { return f.src || '(no src)'; }).slice(0, 8),
          gridboxCount: document.querySelectorAll('.gridbox').length,
          gridRowCount: document.querySelectorAll('.gridbox .objbox tr').length,
          bodyText: (document.body ? document.body.innerText : '').replace(/\\s+/g, ' ').trim().slice(0, 600)
        };
      })()
    `);
    console.log(`[WebViewAMS] DIAG (${label}): ${JSON.stringify(info)}`);
  }
}
