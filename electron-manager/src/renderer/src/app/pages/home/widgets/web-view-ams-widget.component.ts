import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ElectronService, WebViewAmsWiredValue, WebViewAmsStatus } from '../../../services/electron.service';

/**
 * Home dashboard card for WebView AMS — shows the curated "wired" report
 * values, last scrape time, and quick actions. Self-loading widget.
 */
@Component({
  selector: 'app-web-view-ams-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="wv-card" [class.no-navigate]="editMode">
      <div class="wv-header">
        <span class="material-icons wv-icon">checklist</span>
        <h3>WebView AMS</h3>
        <span class="wv-spacer"></span>
        <button class="wv-iconbtn" (click)="openPage()" title="Open WebView AMS page">
          <span class="material-icons">open_in_full</span>
        </button>
      </div>

      <div class="wv-sub">
        <span>Updated: {{ lastUpdateLabel }}</span>
        <span class="wv-shift" *ngIf="status?.currentShift">{{ status?.currentShift }}</span>
      </div>

      <div class="wv-list">
        <div class="wv-empty" *ngIf="wired.length === 0">
          No wired items — open the page and click report cells to pin them.
        </div>
        <div class="wv-item" *ngFor="let w of wired">
          <span class="wv-badge" [class.alarms]="w.reportKey === 'alarms'">{{ w.reportLabel }}</span>
          <div class="wv-info">
            <span class="wv-col" [title]="w.label">{{ w.label }}</span>
            <span class="wv-row" [title]="w.time">{{ w.found ? (w.time || 'no reading') : 'not in latest' }}</span>
          </div>
          <span class="wv-val" [class.missing]="!w.found || !w.value">{{ w.found ? (w.value || '—') : '—' }}</span>
        </div>
      </div>

      <div class="wv-actions">
        <button class="wv-btn primary" (click)="refresh()" [disabled]="refreshing || !status?.configured">
          {{ refreshing ? 'Scraping…' : 'Refresh' }}
        </button>
        <button class="wv-btn" (click)="openWebView()">Open WebView</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .wv-card {
      display: flex; flex-direction: column; gap: 8px; padding: 14px;
      background: var(--bg-card); border: 1px solid var(--border-color);
      border-radius: 12px; height: 100%; box-sizing: border-box; overflow: hidden;
    }
    .wv-card.no-navigate { pointer-events: none; }

    .wv-header { display: flex; align-items: center; gap: 8px; }
    .wv-icon { font-size: 20px; color: #14b8a6; }
    .wv-header h3 { font-size: 14px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .wv-spacer { flex: 1; }
    .wv-iconbtn { background: none; border: none; color: var(--text-muted); cursor: pointer; padding: 2px; display: flex; }
    .wv-iconbtn:hover { color: var(--text-primary); }
    .wv-iconbtn .material-icons { font-size: 16px; }

    .wv-sub { display: flex; justify-content: space-between; font-size: 11px; color: var(--text-muted); }
    .wv-shift { color: var(--text-secondary); }

    .wv-list { flex: 1; min-height: 0; overflow-y: auto; display: flex; flex-direction: column; gap: 4px; }
    .wv-empty { font-size: 12px; color: var(--text-muted); padding: 8px 0; }

    .wv-item { display: flex; align-items: center; gap: 8px; padding: 5px 7px; background: var(--bg-secondary); border-radius: 6px; }
    .wv-badge { font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 1px 5px; border-radius: 5px; background: rgba(20,184,166,0.15); color: #14b8a6; flex-shrink: 0; }
    .wv-badge.alarms { background: rgba(239,68,68,0.15); color: #ef4444; }
    .wv-info { display: flex; flex-direction: column; min-width: 0; flex: 1; }
    .wv-col { font-size: 11px; color: var(--text-primary); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wv-row { font-size: 10px; color: var(--text-muted); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .wv-val { font-size: 13px; font-weight: 700; color: var(--accent-primary); flex-shrink: 0; }
    .wv-val.missing { color: var(--text-muted); font-weight: 400; }

    .wv-actions { display: flex; gap: 6px; }
    .wv-btn {
      flex: 1; padding: 6px 8px; font-size: 11px; font-weight: 600; cursor: pointer;
      background: var(--bg-secondary); color: var(--text-secondary);
      border: 1px solid var(--border-color); border-radius: 6px;
    }
    .wv-btn:hover:not(:disabled) { color: var(--text-primary); border-color: var(--accent-primary); }
    .wv-btn:disabled { opacity: 0.5; cursor: default; }
    .wv-btn.primary { background: var(--accent-primary); color: #fff; border-color: var(--accent-primary); }
  `]
})
export class WebViewAmsWidgetComponent implements OnInit, OnDestroy {
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;

  wired: WebViewAmsWiredValue[] = [];
  status: WebViewAmsStatus | null = null;
  refreshing = false;

  private unsub?: () => void;

  constructor(private electron: ElectronService, private router: Router) {}

  async ngOnInit(): Promise<void> {
    await this.reload();
    this.unsub = this.electron.onWebViewAmsUpdated(() => this.reload());
  }

  ngOnDestroy(): void {
    this.unsub?.();
  }

  get lastUpdateLabel(): string {
    if (!this.status?.lastUpdate) return 'never';
    const diffMin = Math.floor((Date.now() - new Date(this.status.lastUpdate).getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    if (diffMin < 1440) return `${Math.floor(diffMin / 60)}h ago`;
    return `${Math.floor(diffMin / 1440)}d ago`;
  }

  private async reload(): Promise<void> {
    const [wiredRes, statusRes] = await Promise.all([
      this.electron.webViewAmsWiredGet(),
      this.electron.webViewAmsGetStatus()
    ]);
    if (wiredRes.success && wiredRes.data) this.wired = wiredRes.data;
    if (statusRes.success && statusRes.data) this.status = statusRes.data;
  }

  openPage(): void {
    if (!this.editMode) this.router.navigate(['/web-view-ams']);
  }

  async refresh(): Promise<void> {
    this.refreshing = true;
    await this.electron.webViewAmsRefresh();
    await this.reload();
    this.refreshing = false;
  }

  async openWebView(): Promise<void> {
    const cfg = await this.electron.webViewAmsGetConfig();
    const url = (cfg.success && cfg.data) ? cfg.data.url : 'https://www.webviewams.com/reports.aspx';
    await this.electron.openWebView('webview-ams', url);
  }
}
