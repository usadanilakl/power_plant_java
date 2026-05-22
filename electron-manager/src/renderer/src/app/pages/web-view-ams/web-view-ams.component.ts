import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  ElectronService,
  WebViewAmsConfig,
  WebViewAmsStatus,
  WebViewAmsReport,
  WebViewAmsWiredValue
} from '../../services/electron.service';

@Component({
  selector: 'app-web-view-ams',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">WebView AMS</h1>
        <div class="header-actions">
          <button class="btn btn-secondary btn-sm" (click)="openWebView()">
            <span class="material-icons btn-ic">open_in_new</span> Open WebView
          </button>
          <button class="btn btn-icon" (click)="showConfig = !showConfig" title="Configuration">
            <span class="material-icons">settings</span>
          </button>
        </div>
      </div>

      <!-- Toolbar -->
      <div class="toolbar">
        <div class="toolbar-left">
          <button class="btn btn-primary" (click)="refresh()" [disabled]="status.isRefreshing || !status.configured">
            {{ status.isRefreshing ? 'Scraping…' : 'Refresh' }}
          </button>
          <div class="auto-refresh-group">
            <label class="toggle-label">
              <input type="checkbox" [checked]="status.autoRefreshEnabled"
                     [disabled]="!status.configured" (change)="toggleAutoRefresh($event)">
              <span>Auto (once per shift)</span>
            </label>
          </div>
        </div>
        <div class="toolbar-right">
          <span class="shift-pill" *ngIf="status.currentShift">Shift: {{ status.currentShift }}</span>
          <span class="shift-pill">Updated: {{ lastUpdateDisplay }}</span>
        </div>
      </div>

      <!-- Error banner -->
      <div class="error-banner" *ngIf="status.error">
        <span class="material-icons">error_outline</span>
        <span>{{ status.error }}</span>
      </div>

      <!-- Config panel -->
      <div class="config-panel" *ngIf="showConfig">
        <div class="config-header">
          <h3>Configuration</h3>
          <button class="btn btn-icon btn-small" (click)="showConfig = false">&times;</button>
        </div>
        <div class="config-grid">
          <div class="config-section">
            <h4>webviewams.com Login</h4>
            <label>Reports URL<input type="text" [(ngModel)]="config.url" class="input"></label>
            <label>Username<input type="text" [(ngModel)]="config.username" class="input" autocomplete="off"></label>
            <label>Password<input type="password" [(ngModel)]="config.password" class="input" autocomplete="off"></label>
          </div>
          <div class="config-section">
            <h4>Shift Hours</h4>
            <div class="shift-hours">
              <label>Day starts (hr)<input type="number" min="0" max="23" [(ngModel)]="config.dayShiftStartHour" class="input input-small"></label>
              <label>Night starts (hr)<input type="number" min="0" max="23" [(ngModel)]="config.nightShiftStartHour" class="input input-small"></label>
            </div>
            <label class="cfg-check">
              <input type="checkbox" [(ngModel)]="config.showScrapeWindow">
              <span>Show scrape window (debug — normally headless / background)</span>
            </label>
          </div>
        </div>
        <div class="config-actions">
          <button class="btn btn-primary" (click)="saveConfig()">Save Configuration</button>
          <span class="config-saved" *ngIf="configSaved">Saved</span>
        </div>
      </div>

      <!-- Not configured -->
      <div class="notice" *ngIf="!status.configured && !showConfig">
        <span class="notice-icon material-icons" style="color: #3b82f6">info</span>
        <div>
          <strong>Not Configured</strong>
          <p>Enter your webviewams.com credentials (gear icon) to load reports.</p>
        </div>
      </div>

      <!-- ── Tabs ───────────────────────────────────────────────────── -->
      <div class="tabs">
        <button class="tab" *ngFor="let t of tabs"
                [class.active]="activeKey === t.key" (click)="selectTab(t.key)">
          {{ t.label }}
          <span class="tab-count" *ngIf="t.key !== HISTORY_KEY && t.key !== WIRED_KEY && reportFor(t.key) as r">{{ r.rows.length }}</span>
          <span class="tab-count" *ngIf="t.key === WIRED_KEY">{{ wired.length }}</span>
        </button>
      </div>

      <!-- ── Wired Items tab ────────────────────────────────────────── -->
      <ng-container *ngIf="activeKey === WIRED_KEY">
        <div class="wire-hint">Pinned values from both reports — open Rounds or Alarms and click a column / row to add more.</div>
        <div class="table-scroll wired-scroll">
          <div class="wired-empty" *ngIf="wired.length === 0">
            No wired items yet. Open the Rounds or Alarms tab — click a Rounds column or an Alarms row to pin it here.
          </div>
          <div class="wired-list" *ngIf="wired.length > 0">
            <div class="wired-item" *ngFor="let w of wired">
              <span class="wired-badge" [class.alarms]="w.reportKey === 'alarms'">{{ w.reportLabel }}</span>
              <div class="wired-info">
                <span class="wired-col" [title]="w.label">{{ w.label }}</span>
                <span class="wired-row" *ngIf="w.mode === 'column'">
                  {{ w.found ? ('latest reading' + (w.time ? ' · ' + w.time : ' · no reading yet')) : 'column not in latest report' }}
                </span>
                <span class="wired-row" *ngIf="w.mode === 'row'" [title]="rowSummary(w)">
                  {{ w.found ? rowSummary(w) : 'row not in latest report' }}
                </span>
              </div>
              <span class="wired-value" [class.missing]="!w.found || !w.value">
                {{ w.found ? (w.value || '—') : '—' }}
              </span>
              <button class="wired-remove" (click)="removeWired(w.id)" title="Remove">&times;</button>
            </div>
          </div>
        </div>
      </ng-container>

      <!-- ── Server History tab ─────────────────────────────────────── -->
      <ng-container *ngIf="activeKey === HISTORY_KEY">
        <div class="hist-bar">
          <button class="btn btn-secondary btn-sm" (click)="loadHistory()" [disabled]="historyLoading">
            {{ historyLoading ? 'Loading…' : 'Reload from Spring Boot' }}
          </button>
          <button class="btn btn-secondary btn-sm" *ngIf="historyReport" (click)="historyReport = null">
            &larr; Back to list
          </button>
        </div>

        <div class="empty-state" *ngIf="!historyReport && historyList.length === 0 && !historyLoading">
          <p>No stored history. The Rounds report is saved to Spring Boot H2 on each scrape (when it's running).</p>
        </div>

        <!-- History list -->
        <div class="table-scroll" *ngIf="!historyReport && historyList.length > 0">
          <table class="data-table">
            <thead><tr><th>Scraped</th><th>Title</th><th>Rows</th><th>Results</th><th>Stored</th><th></th></tr></thead>
            <tbody>
              <tr *ngFor="let h of historyList">
                <td>{{ h.scrapedAt }}</td>
                <td>{{ h.title }}</td>
                <td>{{ h.rowCount }}</td>
                <td>{{ h.resultCount }}</td>
                <td>{{ h.dateCreated }}</td>
                <td><button class="btn btn-secondary btn-xs" (click)="viewHistory(h.id)">View</button></td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Selected historical report -->
        <ng-container *ngIf="historyReport">
          <div class="report-meta">
            <div class="meta-line"><strong>{{ historyReport.facility }}</strong> — {{ historyReport.title }}</div>
            <div class="meta-sub">{{ historyReport.generatedAt }}</div>
          </div>
          <div class="table-scroll" *ngIf="historyReport.rows?.length">
            <table class="data-table">
              <thead><tr><th *ngFor="let c of historyReport.columns; let i = index" [class.sticky-col]="i === 0">{{ c }}</th></tr></thead>
              <tbody>
                <tr *ngFor="let row of historyReport.rows">
                  <td *ngFor="let cell of row; let i = index" [class.sticky-col]="i === 0">{{ cell }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </ng-container>
      </ng-container>

      <!-- ── Report tab ─────────────────────────────────────────────── -->
      <ng-container *ngIf="activeKey !== HISTORY_KEY && activeKey !== WIRED_KEY">
        <ng-container *ngIf="activeReport as report; else noReport">
          <div class="report-meta">
            <div class="meta-line"><strong>{{ report.facility }}</strong> — {{ report.title }}</div>
            <div class="meta-sub" *ngIf="report.filterLine">{{ report.filterLine }}</div>
            <div class="meta-sub" *ngIf="report.generatedAt">{{ report.generatedAt }}</div>
          </div>

          <div class="wire-hint">
            {{ report.wireMode === 'column'
               ? 'Click a column header or cell to wire that column (latest reading) to Wired Items.'
               : 'Click any cell in a row to wire that whole row to Wired Items.' }}
          </div>

          <div class="search-bar">
            <input class="search-input" type="text" [(ngModel)]="searchQuery"
                   (keyup.enter)="runSearch()" placeholder="Search this report…">
            <button class="btn btn-secondary btn-sm" (click)="runSearch()">Search</button>
            <span class="search-result" *ngIf="searched">
              {{ searchMatches.length ? (searchIndex + 1) + ' of ' + searchMatches.length + ' found'
                                      : ('no results · scanned ' + searchScanInfo) }}
            </span>
            <button class="btn btn-icon btn-nav" (click)="prevMatch()"
                    [disabled]="searchMatches.length === 0" title="Previous match">
              <span class="material-icons">keyboard_arrow_up</span>
            </button>
            <button class="btn btn-icon btn-nav" (click)="nextMatch()"
                    [disabled]="searchMatches.length === 0" title="Next match">
              <span class="material-icons">keyboard_arrow_down</span>
            </button>
            <button class="btn btn-icon btn-nav" *ngIf="searched" (click)="clearSearch()" title="Clear search">
              <span class="material-icons">close</span>
            </button>
          </div>

          <div class="table-scroll" *ngIf="report.rows.length > 0; else emptyReport">
            <table class="data-table">
              <thead>
                <tr>
                  <th *ngFor="let col of report.columns; let i = index"
                      [class.sticky-col]="i === 0"
                      [class.col-wireable]="report.wireMode === 'column' && i > 0"
                      [class.is-wired]="report.wireMode === 'column' && i > 0 && isColWired(report.reportKey, col)"
                      [title]="report.wireMode === 'column' && i > 0 ? 'Click to wire this column' : ''"
                      (click)="headerClick(report, i)">
                    {{ col }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let row of report.rows; let r = index"
                    [class.row-wired]="report.wireMode === 'row' && isRowWired(report.reportKey, row[0])">
                  <td *ngFor="let cell of row; let c = index"
                      [class.sticky-col]="c === 0"
                      [class.wireable]="report.wireMode === 'row' || c > 0"
                      [class.is-wired]="report.wireMode === 'column' && c > 0 && isColWired(report.reportKey, report.columns[c])"
                      [title]="cellTitle(report, c)"
                      (click)="cellClick(report, row[0], c)">
                    {{ cell }}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
          <ng-template #emptyReport>
            <div class="empty-state"><p>This report returned no rows.</p></div>
          </ng-template>
        </ng-container>

        <ng-template #noReport>
          <div class="empty-state" *ngIf="status.configured">
            <p *ngIf="!status.isRefreshing">No data for this report yet. Click Refresh to scrape.</p>
            <p *ngIf="status.isRefreshing">Scraping webviewams.com… ~1–2 minutes for all reports.</p>
          </div>
        </ng-template>
      </ng-container>
    </div>
  `,
  styles: [`
    .page { max-width: 1400px; margin: 0 auto; display: flex; flex-direction: column; height: 100%; min-height: 0; box-sizing: border-box; }
    .page > *:not(.table-scroll) { flex-shrink: 0; }
    .page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
    .page-title { font-size: 22px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .header-actions { display: flex; align-items: center; gap: 8px; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }
    .btn-xs { padding: 3px 10px; font-size: 11px; }
    .btn-ic { font-size: 15px; vertical-align: -3px; }

    .toolbar { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-bottom: 14px; flex-wrap: wrap; }
    .toolbar-left, .toolbar-right { display: flex; align-items: center; gap: 8px; }
    .auto-refresh-group { display: flex; align-items: center; padding: 4px 10px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 6px; }
    .toggle-label { display: flex; align-items: center; gap: 6px; font-size: 13px; color: var(--text-secondary); cursor: pointer; }
    .shift-pill { font-size: 12px; color: var(--text-secondary); background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px; padding: 4px 12px; }

    .error-banner { display: flex; align-items: center; gap: 8px; padding: 10px 16px; background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); border-radius: 8px; color: var(--accent-error,#ef4444); font-size: 13px; margin-bottom: 14px; }
    .error-banner .material-icons { font-size: 18px; }

    .config-panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 16px 20px; margin-bottom: 14px; }
    .config-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; }
    .config-header h3 { margin: 0; font-size: 15px; color: var(--text-primary); }
    .config-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 12px; }
    .config-section h4 { margin: 0 0 8px; font-size: 12px; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; }
    .config-section label { display: block; font-size: 12px; color: var(--text-secondary); margin-bottom: 8px; }
    .shift-hours { display: flex; gap: 12px; }
    .input-small { width: 80px; }
    .input { display: block; width: 100%; margin-top: 2px; padding: 6px 8px; font-size: 13px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 4px; box-sizing: border-box; }
    .input:focus { outline: none; border-color: var(--accent-primary); }
    .config-actions { display: flex; align-items: center; gap: 10px; }
    .config-saved { font-size: 12px; color: var(--accent-success,#10b981); }

    .notice { display: flex; align-items: flex-start; gap: 12px; padding: 16px 20px; background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); border-radius: 8px; color: var(--text-secondary); margin-bottom: 14px; }
    .notice-icon { font-size: 20px; }
    .notice strong { color: var(--accent-primary); display: block; margin-bottom: 4px; }
    .notice p { font-size: 13px; margin: 0; }

    /* Wired panel */
    .wired-panel { background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; margin-bottom: 16px; }
    .wired-head { display: flex; align-items: center; gap: 8px; padding: 10px 14px; cursor: pointer; user-select: none; }
    .wired-head h3 { margin: 0; font-size: 14px; color: var(--text-primary); }
    .wired-head .caret { font-size: 20px; color: var(--text-muted); }
    .wired-count { font-size: 11px; font-weight: 700; background: var(--accent-primary); color: #fff; border-radius: 10px; padding: 0 7px; min-width: 18px; text-align: center; }
    .wired-hint { font-size: 12px; color: var(--text-muted); }
    .wired-body { padding: 0 14px 12px; }
    .wired-empty { font-size: 13px; color: var(--text-muted); padding: 8px 0; }
    .wired-list { display: flex; flex-direction: column; gap: 6px; }
    .wired-scroll { padding: 10px; }
    .wired-item { display: flex; align-items: center; gap: 10px; padding: 7px 10px; background: var(--bg-secondary); border: 1px solid var(--border-color); border-radius: 6px; }
    .wired-badge { font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.5px; padding: 2px 7px; border-radius: 6px; background: rgba(20,184,166,0.15); color: #14b8a6; flex-shrink: 0; }
    .wired-badge.alarms { background: rgba(239,68,68,0.15); color: #ef4444; }
    .wired-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .wired-col { font-size: 12px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wired-row { font-size: 11px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wired-value { font-size: 14px; font-weight: 700; color: var(--accent-primary); flex-shrink: 0; min-width: 60px; text-align: right; }
    .wired-value.missing { color: var(--text-muted); font-weight: 400; font-size: 11px; font-style: italic; }
    .wired-remove { background: none; border: none; color: var(--text-muted); font-size: 18px; cursor: pointer; line-height: 1; padding: 0 4px; flex-shrink: 0; }
    .wired-remove:hover { color: var(--accent-error,#ef4444); }

    /* Tabs */
    .tabs { display: flex; gap: 4px; margin-bottom: 12px; border-bottom: 1px solid var(--border-color); flex-wrap: wrap; }
    .tab { display: flex; align-items: center; gap: 6px; padding: 8px 16px; font-size: 13px; font-weight: 500; background: none; border: none; border-bottom: 2px solid transparent; color: var(--text-secondary); cursor: pointer; }
    .tab:hover { color: var(--text-primary); }
    .tab.active { color: var(--accent-primary); border-bottom-color: var(--accent-primary); }
    .tab-count { font-size: 11px; font-weight: 600; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; padding: 0 6px; min-width: 18px; text-align: center; }
    .tab.active .tab-count { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }

    .hist-bar { display: flex; gap: 8px; margin-bottom: 12px; }

    .report-meta { margin-bottom: 10px; padding: 10px 14px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 8px; }
    .meta-line { font-size: 14px; color: var(--text-primary); }
    .meta-sub { font-size: 12px; color: var(--text-muted); margin-top: 2px; }

    /* flex:1 so the scroll box fills the remaining viewport — its horizontal
       scrollbar then sits at the bottom of the visible area, always reachable */
    .table-scroll { overflow: auto; flex: 1; min-height: 220px; background: var(--bg-card); border: 1px solid var(--border-color); border-radius: 10px; }
    .data-table { border-collapse: separate; border-spacing: 0; width: max-content; min-width: 100%; }
    .data-table th { text-align: left; padding: 8px 12px; font-size: 11px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.3px; background: var(--bg-secondary); border-bottom: 1px solid var(--border-color); border-right: 1px solid var(--border-color); vertical-align: bottom; position: sticky; top: 0; z-index: 2; min-width: 130px; max-width: 220px; white-space: normal; }
    .data-table td { padding: 6px 12px; font-size: 13px; color: var(--text-primary); border-bottom: 1px solid var(--border-color); border-right: 1px solid var(--border-color); white-space: nowrap; }
    .data-table tr:hover td { background: rgba(255,255,255,0.04); }
    .data-table td.wireable { cursor: pointer; }
    .data-table td.wireable:hover { background: rgba(59,130,246,0.18); outline: 1px solid var(--accent-primary); outline-offset: -1px; }
    .data-table td.is-wired { background: rgba(20,184,166,0.16); }
    .data-table th.col-wireable { cursor: pointer; }
    .data-table th.col-wireable:hover { background: rgba(59,130,246,0.2); color: var(--text-primary); }
    .data-table th.is-wired { background: rgba(20,184,166,0.22); color: #14b8a6; }
    .data-table th.is-wired::after { content: ' 📌'; font-size: 10px; }
    .data-table tr.row-wired td { background: rgba(20,184,166,0.14); }
    .data-table tr.row-wired td.sticky-col { background: rgba(20,184,166,0.2); }
    .wire-hint { font-size: 12px; color: var(--text-muted); margin: 0 0 8px; }
    .search-bar { display: flex; align-items: center; gap: 8px; margin-bottom: 8px; }
    .search-input { padding: 6px 10px; font-size: 13px; width: 260px; background: var(--bg-secondary); color: var(--text-primary); border: 1px solid var(--border-color); border-radius: 6px; }
    .search-input:focus { outline: none; border-color: var(--accent-primary); }
    .search-result { font-size: 12px; color: var(--text-secondary); min-width: 84px; }
    .btn-nav { padding: 2px 6px; font-size: 16px; display: inline-flex; align-items: center; }
    .btn-nav:disabled { opacity: 0.4; cursor: default; }
    .cfg-check { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); margin-top: 8px; }
    .data-table td.search-now, .data-table th.search-now { background: rgba(234,179,8,0.6) !important; outline: 2px solid #eab308 !important; outline-offset: -2px; }

    .sticky-col { position: sticky; left: 0; z-index: 1; background: var(--bg-secondary); font-weight: 600; }
    th.sticky-col { z-index: 3; }
    .data-table td.sticky-col { background: var(--bg-card); }
    .data-table tr:hover td.sticky-col { background: var(--bg-secondary); }

    .empty-state { text-align: center; padding: 40px; color: var(--text-muted); font-size: 14px; }
    .btn-icon { background: none; border: 1px solid var(--border-color); color: var(--text-secondary); padding: 4px 8px; border-radius: 6px; cursor: pointer; font-size: 16px; }
    .btn-icon:hover { color: var(--text-primary); background: var(--bg-secondary); }
    .btn-small { font-size: 18px; padding: 0 6px; line-height: 1; }
  `]
})
export class WebViewAmsComponent implements OnInit, OnDestroy {
  readonly HISTORY_KEY = '__history';
  readonly WIRED_KEY = '__wired';

  reports: WebViewAmsReport[] = [];
  wired: WebViewAmsWiredValue[] = [];
  activeKey = '';

  status: WebViewAmsStatus = {
    lastUpdate: null, isRefreshing: false, configured: false,
    autoRefreshEnabled: false, currentShift: null, reports: []
  };

  config: WebViewAmsConfig = {
    url: 'https://www.webviewams.com/reports.aspx',
    username: '', password: '', autoRefresh: false,
    dayShiftStartHour: 6, nightShiftStartHour: 18, showScrapeWindow: false
  };

  historyList: any[] = [];
  historyReport: any | null = null;
  historyLoading = false;

  showConfig = false;
  configSaved = false;

  // ── in-table search ──
  searchQuery = '';
  searched = false;
  searchMatches: { r: number; c: number }[] = [];
  searchIndex = 0;
  searchScanInfo = '';

  private unsubscribeUpdated?: () => void;

  constructor(private electron: ElectronService) {}

  async ngOnInit(): Promise<void> {
    await this.loadConfig();
    await this.loadStatus();
    await this.loadReports();
    await this.loadWired();

    this.unsubscribeUpdated = this.electron.onWebViewAmsUpdated(() => {
      this.loadReports();
      this.loadWired();
      this.loadStatus();
      this.clearSearch(); // report data changed — drop stale matches
    });
  }

  ngOnDestroy(): void {
    this.unsubscribeUpdated?.();
  }

  get tabs(): { key: string; label: string }[] {
    return [
      ...this.status.reports,
      { key: this.WIRED_KEY, label: 'Wired Items' },
      { key: this.HISTORY_KEY, label: 'Server History' }
    ];
  }

  get activeReport(): WebViewAmsReport | undefined {
    return this.reports.find(r => r.reportKey === this.activeKey);
  }

  get lastUpdateDisplay(): string {
    if (!this.status.lastUpdate) return '--';
    return new Date(this.status.lastUpdate).toLocaleString([], {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }

  reportFor(key: string): WebViewAmsReport | undefined {
    return this.reports.find(r => r.reportKey === key);
  }

  selectTab(key: string): void {
    this.activeKey = key;
    this.clearSearch();
    if (key === this.HISTORY_KEY && this.historyList.length === 0) {
      this.loadHistory();
    }
  }

  isColWired(reportKey: string, columnName: string): boolean {
    return this.wired.some(w => w.reportKey === reportKey && w.mode === 'column' && w.key === columnName);
  }

  isRowWired(reportKey: string, rowKey: string): boolean {
    return this.wired.some(w => w.reportKey === reportKey && w.mode === 'row' && w.key === rowKey);
  }

  rowSummary(w: WebViewAmsWiredValue): string {
    return w.fields
      .filter(f => f.name !== 'Description')
      .slice(0, 4)
      .map(f => `${f.name}: ${f.value}`)
      .join('  ·  ');
  }

  // ── in-table search ───────────────────────────────────────────────

  runSearch(): void {
    const report = this.activeReport;
    // Normalize whitespace (cells can contain \r\n) so search matches what the
    // user sees on screen.
    const norm = (s: any) => String(s == null ? '' : s).replace(/\s+/g, ' ').trim().toLowerCase();
    const q = norm(this.searchQuery);
    this.searchMatches = [];
    this.searchIndex = 0;
    this.searched = !!q;
    if (!report) { this.searchScanInfo = 'no report loaded'; this.clearHighlight(); return; }
    this.searchScanInfo = `${report.rows.length} rows, ${report.columns.length} cols`;
    if (!q) { this.clearHighlight(); return; }

    // Scan the header row (r = -1) — for Rounds the question names live here.
    for (let c = 0; c < report.columns.length; c++) {
      if (norm(report.columns[c]).includes(q)) this.searchMatches.push({ r: -1, c });
    }
    // Scan the data cells.
    for (let r = 0; r < report.rows.length; r++) {
      const row = report.rows[r];
      for (let c = 0; c < row.length; c++) {
        if (norm(row[c]).includes(q)) this.searchMatches.push({ r, c });
      }
    }
    this.highlightCurrent();
  }

  nextMatch(): void {
    if (!this.searchMatches.length) return;
    this.searchIndex = (this.searchIndex + 1) % this.searchMatches.length;
    this.highlightCurrent();
  }

  prevMatch(): void {
    if (!this.searchMatches.length) return;
    this.searchIndex = (this.searchIndex - 1 + this.searchMatches.length) % this.searchMatches.length;
    this.highlightCurrent();
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searched = false;
    this.searchMatches = [];
    this.searchIndex = 0;
    this.clearHighlight();
  }

  /**
   * Highlight + scroll the current match via direct DOM (not Angular class
   * bindings) — fast and reliable on the very large report tables.
   */
  private highlightCurrent(): void {
    this.clearHighlight();
    const m = this.searchMatches[this.searchIndex];
    if (!m) return;
    setTimeout(() => {
      const sel = m.r === -1
        ? `.data-table thead th:nth-child(${m.c + 1})`
        : `.data-table tbody tr:nth-child(${m.r + 1}) td:nth-child(${m.c + 1})`;
      const cell = document.querySelector(sel) as HTMLElement | null;
      if (cell) {
        cell.classList.add('search-now');
        cell.scrollIntoView({ block: 'center', inline: 'center', behavior: 'smooth' });
      }
    }, 0);
  }

  private clearHighlight(): void {
    document.querySelectorAll('.data-table .search-now')
      .forEach(e => e.classList.remove('search-now'));
  }

  // ── data loading ──────────────────────────────────────────────────

  async loadStatus(): Promise<void> {
    const r = await this.electron.webViewAmsGetStatus();
    if (r.success && r.data) {
      this.status = r.data;
      if (!this.activeKey && this.status.reports.length) {
        this.activeKey = this.status.reports[0].key;
      }
    }
  }

  async loadConfig(): Promise<void> {
    const r = await this.electron.webViewAmsGetConfig();
    if (r.success && r.data) this.config = r.data;
  }

  async loadReports(): Promise<void> {
    const r = await this.electron.webViewAmsGetReports();
    if (r.success && r.data) this.reports = r.data;
  }

  async loadWired(): Promise<void> {
    const r = await this.electron.webViewAmsWiredGet();
    if (r.success && r.data) this.wired = r.data;
  }

  // ── actions ───────────────────────────────────────────────────────

  async refresh(): Promise<void> {
    this.status = { ...this.status, isRefreshing: true, error: undefined };
    const r = await this.electron.webViewAmsRefresh();
    if (r.data) this.reports = r.data;
    await this.loadWired();
    await this.loadStatus();
  }

  async toggleAutoRefresh(event: Event): Promise<void> {
    await this.electron.webViewAmsSetAutoRefresh((event.target as HTMLInputElement).checked);
    await this.loadStatus();
    await this.loadConfig();
  }

  async saveConfig(): Promise<void> {
    const r = await this.electron.webViewAmsSaveConfig(this.config);
    if (r.success) {
      this.configSaved = true;
      setTimeout(() => this.configSaved = false, 2000);
      await this.loadStatus();
    }
  }

  async wire(reportKey: string, mode: 'column' | 'row', key: string): Promise<void> {
    const r = await this.electron.webViewAmsWiredAdd(reportKey, mode, key);
    if (r.success && r.data) this.wired = r.data;
  }

  headerClick(report: WebViewAmsReport, colIdx: number): void {
    if (report.wireMode === 'column' && colIdx > 0) {
      this.wire(report.reportKey, 'column', report.columns[colIdx]);
    }
  }

  cellClick(report: WebViewAmsReport, rowKey: string, colIdx: number): void {
    if (report.wireMode === 'column') {
      if (colIdx > 0) this.wire(report.reportKey, 'column', report.columns[colIdx]);
    } else {
      this.wire(report.reportKey, 'row', rowKey);
    }
  }

  cellTitle(report: WebViewAmsReport, colIdx: number): string {
    if (report.wireMode === 'column') return colIdx > 0 ? 'Click to wire this column' : '';
    return 'Click to wire this row';
  }

  async removeWired(id: string): Promise<void> {
    const r = await this.electron.webViewAmsWiredRemove(id);
    if (r.success && r.data) this.wired = r.data;
  }

  async openWebView(): Promise<void> {
    await this.electron.openWebView('webview-ams', this.config.url);
  }

  // ── Spring Boot history ───────────────────────────────────────────

  async loadHistory(): Promise<void> {
    this.historyLoading = true;
    this.historyReport = null;
    const r = await this.electron.webViewAmsHistoryList();
    this.historyList = (r.success && r.data) ? r.data : [];
    this.historyLoading = false;
  }

  async viewHistory(id: number): Promise<void> {
    this.historyLoading = true;
    const r = await this.electron.webViewAmsHistoryGet(id);
    this.historyReport = (r.success && r.data) ? r.data : null;
    this.historyLoading = false;
  }
}
