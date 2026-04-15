import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { GridsterModule, GridsterConfig, GridsterItem, GridType, CompactType, DisplayGrid } from 'angular-gridster2';
import { ElectronService, AppStatus, WeatherStatus, WeatherForecast, PerryWeatherStatus, PjmStatus, GateLogEntry, GateLogStatus, APP_DISPLAY_NAME } from '../../services/electron.service';
import { DashboardLayoutService, WidgetPlacement, WidgetId, WIDGET_REGISTRY, LayoutPreset } from '../../services/dashboard-layout.service';
import { FireImpairmentWidgetComponent } from './widgets/fire-impairment-widget.component';
import { GateLogWidgetComponent } from './widgets/gate-log-widget.component';
import { WeatherWidgetComponent } from './widgets/weather-widget.component';
import { PjmWidgetComponent } from './widgets/pjm-widget.component';
import { PermitsWidgetComponent } from './widgets/permits-widget.component';
import { ExternalLinksWidgetComponent } from './widgets/external-links-widget.component';
import { ContactsWidgetComponent } from './widgets/contacts-widget.component';
import { PagingWidgetComponent } from './widgets/paging-widget.component';
import { ClockWidgetComponent } from './widgets/clock-widget.component';
import { NotesWidgetComponent } from './widgets/notes-widget.component';
import { DashboardEditToolbarComponent } from './dashboard-edit-toolbar.component';

interface DashboardGridsterItem extends GridsterItem {
  widgetId: WidgetId;
  visible: boolean;
  settings?: Record<string, any>;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule, GridsterModule,
    FireImpairmentWidgetComponent, GateLogWidgetComponent, WeatherWidgetComponent,
    PjmWidgetComponent, PermitsWidgetComponent, ExternalLinksWidgetComponent,
    ContactsWidgetComponent, PagingWidgetComponent, ClockWidgetComponent,
    NotesWidgetComponent, DashboardEditToolbarComponent,
  ],
  template: `
    <div class="home">
      <div class="dashboard-header">
        <h1 class="page-title">Dashboard</h1>
        <button class="btn btn-secondary btn-sm customize-btn" (click)="enterEditMode()" *ngIf="!editMode">
          <span class="material-icons btn-icon">edit</span> Customize
        </button>
      </div>

      <!-- Spring Boot quick controls — fixed, not customizable -->
      <div class="sb-panel">
        <div class="sb-panel-header">
          <div class="sb-title-row">
            <span class="sb-dot" [class]="status.state"></span>
            <h2>{{ appName }}</h2>
            <span class="status-badge" [class]="'status-' + status.state">
              {{ stateLabel }}
            </span>
          </div>
          <div class="sb-controls">
            <button class="btn btn-success btn-sm"
                    [disabled]="status.state === 'running' || status.state === 'starting'"
                    (click)="start()">Start</button>
            <button class="btn btn-danger btn-sm"
                    [disabled]="status.state === 'stopped' || status.state === 'stopping'"
                    (click)="stop()">Stop</button>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="status.state !== 'running'"
                    (click)="restart()">Restart</button>
            <button class="btn btn-primary btn-sm"
                    [disabled]="status.state !== 'running'"
                    (click)="openPidApp()">Open PID App</button>
            <button class="btn btn-secondary btn-sm"
                    [disabled]="status.state !== 'running'"
                    (click)="openInBrowser()">Open in Browser</button>
          </div>
        </div>
        <div class="sb-details">
          <span class="detail-item">Port: {{ status.port }}</span>
          <span class="detail-item" *ngIf="status.pid">PID: {{ status.pid }}</span>
          <span class="detail-item" *ngIf="status.uptime">Uptime: {{ formatUptime(status.uptime) }}</span>
          <span class="detail-item" *ngIf="status.healthStatus !== 'unknown'">
            Health: <span [class]="'health-' + status.healthStatus">{{ status.healthStatus }}</span>
          </span>
          <span class="detail-item error" *ngIf="status.error">{{ status.error }}</span>
        </div>
      </div>

      <!-- Edit toolbar -->
      <app-dashboard-edit-toolbar *ngIf="editMode"
        [draft]="draftItems"
        [presets]="presets"
        [currentPresetName]="draftPresetName"
        (applyPreset)="applyPreset($event)"
        (restoreWidget)="restoreWidget($event)"
        (done)="saveDraft()"
        (cancel)="cancelEdit()" />

      <!-- Gridster dashboard -->
      <gridster [options]="gridsterOptions">
        <gridster-item *ngFor="let item of visibleItems; trackBy: trackItem" [item]="item">
          <!-- Edit overlay (outside zoom wrapper so controls stay normal size) -->
          <div class="widget-edit-overlay" *ngIf="editMode">
            <div class="scale-controls">
              <button class="widget-ctrl-btn" (click)="decreaseScale(item.widgetId)" title="Decrease text size">
                <span class="material-icons">text_decrease</span>
              </button>
              <button class="widget-ctrl-btn" (click)="increaseScale(item.widgetId)" title="Increase text size">
                <span class="material-icons">text_increase</span>
              </button>
            </div>
            <button class="widget-ctrl-btn hide-btn" (click)="hideWidget(item.widgetId)" title="Hide widget">
              <span class="material-icons">visibility_off</span>
            </button>
          </div>

          <!-- Scaled content wrapper -->
          <div class="widget-scale-wrapper" [style.zoom]="getScale(item)">
          <ng-container [ngSwitch]="item.widgetId">
            <app-fire-impairment-widget *ngSwitchCase="'fire-impairment'"
              [status]="status" [activeImpairmentCount]="activeImpairmentCount"
              [editMode]="editMode" [cols]="item.cols" [rows]="item.rows" />
            <app-gate-log-widget *ngSwitchCase="'gate-log'"
              [peopleCount]="gateLogPeopleCount" [gateSourceCount]="gateSourceCount"
              [onlocSourceCount]="onlocSourceCount" [lastUpdateLabel]="gateLogLastUpdateLabel"
              [gateLogStatus]="gateLogStatus" [recentPeople]="recentGateLogPeople"
              [editMode]="editMode" [cols]="item.cols" [rows]="item.rows" />
            <app-weather-widget *ngSwitchCase="'weather'"
              [weatherStatus]="weatherStatus" [perryStatus]="perryStatus" [weatherForecast]="weatherForecast"
              [lightningLevel]="lightningLevel" [lightningLabel]="lightningLabel"
              [perryLightningLevel]="perryLightningLevel" [forecastDesc]="forecastDesc"
              [editMode]="editMode" [cols]="item.cols" [rows]="item.rows" />
            <app-pjm-widget *ngSwitchCase="'pjm'"
              [pjmStatus]="pjmStatus" [pjmPolling]="pjmPolling"
              [editMode]="editMode" [cols]="item.cols" [rows]="item.rows" />
            <app-permits-widget *ngSwitchCase="'permits'"
              [status]="status" [activeWorkRequestCount]="activeWorkRequestCount"
              [newWorkRequestCount]="newWorkRequestCount"
              [editMode]="editMode" [cols]="item.cols" [rows]="item.rows" />
            <app-external-links-widget *ngSwitchCase="'external-links'"
              [editMode]="editMode" [cols]="item.cols" [rows]="item.rows" />
            <app-contacts-widget *ngSwitchCase="'contacts'" />
            <app-paging-widget *ngSwitchCase="'paging-system'" />
            <app-clock-widget *ngSwitchCase="'clock'"
              [cols]="item.cols" [rows]="item.rows" [editMode]="editMode" />
            <app-notes-widget *ngSwitchCase="'notes'"
              [cols]="item.cols" [rows]="item.rows" [editMode]="editMode" />
          </ng-container>
          </div>
        </gridster-item>
      </gridster>
    </div>
  `,
  styles: [`
    .home {
      max-width: 1200px;
      margin: 0 auto;
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .dashboard-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .customize-btn { display: flex; align-items: center; gap: 4px; }
    .btn-icon { font-size: 16px; }

    /* Spring Boot Panel */
    .sb-panel {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 16px;
    }

    .sb-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .sb-title-row { display: flex; align-items: center; gap: 10px; }
    .sb-title-row h2 { font-size: 16px; font-weight: 600; color: var(--text-primary); margin: 0; }

    .sb-dot { width: 10px; height: 10px; border-radius: 50%; flex-shrink: 0; }
    .sb-dot.running { background-color: var(--accent-success); box-shadow: 0 0 8px var(--accent-success); }
    .sb-dot.starting, .sb-dot.stopping { background-color: var(--accent-warning); animation: pulse 1.5s infinite; }
    .sb-dot.stopped { background-color: var(--text-muted); }
    .sb-dot.error { background-color: var(--accent-error); }

    .sb-controls { display: flex; gap: 8px; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }

    .sb-details {
      display: flex; gap: 20px; flex-wrap: wrap;
      margin-top: 12px; padding-top: 12px; border-top: 1px solid var(--border-color);
    }

    .detail-item { font-size: 13px; color: var(--text-secondary); }
    .detail-item.error { color: var(--accent-error); }
    .health-healthy { color: var(--accent-success); }
    .health-unhealthy { color: var(--accent-error); }
    .health-unknown { color: var(--text-muted); }

    /* Gridster overrides */
    :host ::ng-deep gridster {
      background: transparent !important;
      flex: 1;
    }

    :host ::ng-deep gridster-item {
      border-radius: 12px;
      overflow: visible;
      background: transparent !important;
    }

    :host ::ng-deep gridster-item > * {
      height: 100%;
      width: 100%;
    }

    :host ::ng-deep .gridster-item-resizable-handler {
      opacity: 0;
      transition: opacity 150ms;
    }

    :host ::ng-deep gridster-item:hover .gridster-item-resizable-handler {
      opacity: 0.5;
    }

    /* Widget edit overlay */
    .widget-edit-overlay {
      position: absolute;
      top: 6px;
      left: 6px;
      right: 6px;
      z-index: 10;
      display: flex;
      justify-content: space-between;
      pointer-events: none;
    }

    .widget-edit-overlay > * { pointer-events: auto; }
    .scale-controls { display: flex; gap: 2px; }
    .widget-scale-wrapper { height: 100%; width: 100%; }

    .widget-ctrl-btn {
      display: flex; align-items: center; justify-content: center;
      width: 28px; height: 28px; border-radius: 6px; border: none;
      background: var(--bg-card); color: var(--text-muted); cursor: pointer;
      opacity: 0.8; transition: opacity 150ms, color 150ms, background-color 150ms;
      box-shadow: 0 1px 3px rgba(0,0,0,0.3);
    }
    .widget-ctrl-btn:hover { opacity: 1; color: var(--text-primary); background: var(--bg-secondary); }
    .widget-ctrl-btn .material-icons { font-size: 18px; }

    @keyframes pulse {
      0%, 100% { opacity: 1; }
      50% { opacity: 0.4; }
    }
  `]
})
export class HomeComponent implements OnInit, OnDestroy {
  appName = APP_DISPLAY_NAME;
  status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  activeImpairmentCount: number | null = null;
  newWorkRequestCount: number | null = null;
  activeWorkRequestCount: number | null = null;
  weatherStatus: WeatherStatus | null = null;
  weatherForecast: WeatherForecast | null = null;
  perryStatus: PerryWeatherStatus | null = null;
  pjmStatus: PjmStatus | null = null;
  pjmPolling = false;
  gateLogStatus: GateLogStatus | null = null;
  private gateLogPeople: GateLogEntry[] = [];
  private sub?: Subscription;
  private unsubWeather?: () => void;
  private unsubForecast?: () => void;
  private unsubPerry?: () => void;
  private unsubPjm?: () => void;
  private unsubGateLog?: () => void;
  private unsubSync?: () => void;

  // Layout
  editMode = false;
  draftItems: DashboardGridsterItem[] = [];
  presets: LayoutPreset[] = [];
  gridsterOptions: GridsterConfig = {};

  constructor(
    private electronService: ElectronService,
    private router: Router,
    private layoutService: DashboardLayoutService,
  ) {
    this.presets = this.layoutService.getPresets();
    this.initGridsterOptions();
  }

  private initGridsterOptions(): void {
    this.gridsterOptions = {
      gridType: GridType.VerticalFixed,
      compactType: CompactType.CompactUp,
      margin: 8,
      outerMargin: false,
      fixedRowHeight: 200,
      minCols: 3,
      maxCols: 3,
      minRows: 1,
      maxRows: 100,
      pushItems: true,
      draggable: { enabled: false },
      resizable: { enabled: false },
      displayGrid: DisplayGrid.None,
    };
  }

  private setEditGridsterOptions(): void {
    this.gridsterOptions = {
      ...this.gridsterOptions,
      draggable: { enabled: true },
      resizable: { enabled: true },
      displayGrid: DisplayGrid.OnDragAndResize,
    };
  }

  private setViewGridsterOptions(): void {
    this.gridsterOptions = {
      ...this.gridsterOptions,
      draggable: { enabled: false },
      resizable: { enabled: false },
      displayGrid: DisplayGrid.None,
    };
  }

  get visibleItems(): DashboardGridsterItem[] {
    if (this.editMode) {
      return this.draftItems.filter(i => i.visible);
    }
    return this.toGridsterItems(this.layoutService.layout().filter(w => w.visible));
  }

  get draftPresetName(): string {
    if (!this.editMode) return this.layoutService.currentPresetName();
    const draft = this.draftItems.map(i => this.toPlacement(i));
    for (const preset of this.presets) {
      if (this.layoutsMatch(draft, preset.widgets)) return preset.name;
    }
    return 'Custom';
  }

  trackItem(_index: number, item: DashboardGridsterItem): WidgetId {
    return item.widgetId;
  }

  // --- Edit mode ---

  enterEditMode(): void {
    this.editMode = true;
    this.draftItems = this.toGridsterItems(this.layoutService.startEditing());
    this.setEditGridsterOptions();
  }

  saveDraft(): void {
    this.layoutService.save(this.draftItems.map(i => this.toPlacement(i)));
    this.editMode = false;
    this.draftItems = [];
    this.setViewGridsterOptions();
  }

  cancelEdit(): void {
    this.editMode = false;
    this.draftItems = [];
    this.setViewGridsterOptions();
  }

  applyPreset(name: string): void {
    const preset = this.presets.find(p => p.name === name);
    if (preset) {
      this.draftItems = this.toGridsterItems(structuredClone(preset.widgets));
    }
  }

  hideWidget(widgetId: WidgetId): void {
    const item = this.draftItems.find(i => i.widgetId === widgetId);
    if (item) item.visible = false;
  }

  restoreWidget(widgetId: WidgetId): void {
    const item = this.draftItems.find(i => i.widgetId === widgetId);
    if (item) {
      item.visible = true;
      // Place at bottom
      const maxY = this.draftItems
        .filter(i => i.visible && i.widgetId !== widgetId)
        .reduce((max, i) => Math.max(max, i.y + i.rows), 0);
      item.x = 0;
      item.y = maxY;
    }
  }

  // --- Content scale ---

  getScale(item: DashboardGridsterItem): number {
    return item.settings?.['contentScale'] ?? 1;
  }

  increaseScale(widgetId: WidgetId): void {
    const item = this.draftItems.find(i => i.widgetId === widgetId);
    if (!item) return;
    if (!item.settings) item.settings = {};
    const current = item.settings['contentScale'] ?? 1;
    item.settings['contentScale'] = Math.min(current + 0.1, 1.5);
  }

  decreaseScale(widgetId: WidgetId): void {
    const item = this.draftItems.find(i => i.widgetId === widgetId);
    if (!item) return;
    if (!item.settings) item.settings = {};
    const current = item.settings['contentScale'] ?? 1;
    item.settings['contentScale'] = Math.max(current - 0.1, 0.7);
  }

  // --- Helpers ---

  private toGridsterItems(placements: WidgetPlacement[]): DashboardGridsterItem[] {
    return placements.map(w => ({
      x: w.x, y: w.y, cols: w.cols, rows: w.rows,
      widgetId: w.widgetId, visible: w.visible, settings: w.settings,
    }));
  }

  private toPlacement(item: DashboardGridsterItem): WidgetPlacement {
    return {
      widgetId: item.widgetId, visible: item.visible,
      x: item.x, y: item.y, cols: item.cols, rows: item.rows,
      settings: item.settings,
    };
  }

  private layoutsMatch(a: WidgetPlacement[], b: WidgetPlacement[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((w, i) =>
      w.widgetId === b[i].widgetId && w.visible === b[i].visible &&
      w.x === b[i].x && w.y === b[i].y && w.cols === b[i].cols && w.rows === b[i].rows
    );
  }

  // === Data loading (unchanged) ===

  ngOnInit(): void {
    this.sub = this.electronService.appStatus$.subscribe(s => {
      const wasRunning = this.status.state === 'running';
      this.status = s;
      if (!wasRunning && s.state === 'running') {
        this.loadFireImpCount();
        this.loadWorkRequestCount();
      }
    });

    this.loadWeatherStatus();
    this.unsubWeather = this.electronService.onWeatherStatusChange((s) => { this.weatherStatus = s; });

    this.loadWeatherForecast();
    this.unsubForecast = this.electronService.onWeatherForecastChange((f) => { this.weatherForecast = f; });

    this.loadPerryStatus();
    this.unsubPerry = this.electronService.onPerryStatusChange((s) => { this.perryStatus = s; });

    this.loadPjmStatus();
    this.unsubPjm = this.electronService.onPjmStatusChange((s) => { this.pjmStatus = s; });

    this.loadGateLogData();
    this.unsubGateLog = this.electronService.onGateLogPeopleUpdated(() => { this.loadGateLogData(); });

    this.unsubSync = this.electronService.onSyncEntityUpdated((entityType) => {
      if (entityType === 'FireImpairment') { this.loadFireImpCount(); }
    });
  }

  private async loadWeatherStatus(): Promise<void> {
    try {
      const result = await this.electronService.getWeatherStatus();
      if (result.success && result.data) this.weatherStatus = result.data;
    } catch {}
  }

  private async loadWeatherForecast(): Promise<void> {
    try {
      const result = await this.electronService.getWeatherForecast();
      if (result.success && result.data) this.weatherForecast = result.data;
    } catch {}
  }

  private async loadPjmStatus(): Promise<void> {
    try {
      const result = await this.electronService.getPjmStatus() as any;
      if (result.success && result.data) this.pjmStatus = result.data;
      if (result.polling != null) this.pjmPolling = result.polling;
    } catch {}
  }

  get lightningLevel(): string {
    const d = parseFloat(this.weatherStatus?.lightningDistance || '');
    if (isNaN(d)) return '';
    if (d <= 8) return 'danger';
    if (d <= 20) return 'caution';
    return 'safe';
  }

  get lightningLabel(): string {
    const d = parseFloat(this.weatherStatus?.lightningDistance || '');
    if (isNaN(d)) return '';
    if (d <= 8) return 'Lightning Alarm';
    if (d <= 20) return 'Lightning Watch';
    return 'All Clear';
  }

  get forecastDesc(): string {
    if (!this.weatherForecast?.current) return '';
    const codes: Record<number, string> = {
      0: 'Clear', 1: 'Mostly clear', 2: 'Partly cloudy', 3: 'Overcast',
      45: 'Fog', 48: 'Fog', 51: 'Drizzle', 53: 'Drizzle', 55: 'Drizzle',
      61: 'Rain', 63: 'Rain', 65: 'Heavy rain', 66: 'Freezing rain', 67: 'Freezing rain',
      71: 'Snow', 73: 'Snow', 75: 'Heavy snow', 77: 'Snow grains',
      80: 'Showers', 81: 'Showers', 82: 'Heavy showers',
      85: 'Snow showers', 86: 'Snow showers',
      95: 'Thunderstorm', 96: 'Thunderstorm', 99: 'Thunderstorm'
    };
    return codes[this.weatherForecast.current.weatherCode] || 'Unknown';
  }

  private async loadFireImpCount(): Promise<void> {
    try {
      const result = await this.electronService.fireImpCount();
      if (result.success) this.activeImpairmentCount = result.data ?? 0;
    } catch {}
  }

  private async loadWorkRequestCount(): Promise<void> {
    try {
      const result = await this.electronService.getWorkRequestCount();
      if (result.success && result.data) {
        this.newWorkRequestCount = result.data.newCount;
        this.activeWorkRequestCount = result.data.activeCount;
      }
    } catch {}
  }

  private async loadPerryStatus(): Promise<void> {
    try {
      const result = await this.electronService.getPerryStatus();
      if (result.success && result.data) this.perryStatus = result.data;
    } catch {}
  }

  private async loadGateLogData(): Promise<void> {
    try {
      const [peopleResult, statusResult] = await Promise.all([
        this.electronService.gateLogGetPeople(),
        this.electronService.gateLogGetStatus(),
      ]);
      if (peopleResult.success && peopleResult.data) this.gateLogPeople = peopleResult.data;
      if (statusResult.success && statusResult.data) this.gateLogStatus = statusResult.data;
    } catch {}
  }

  private get filteredGateLogPeople(): GateLogEntry[] {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    return this.gateLogPeople.filter(p => {
      if (!p.checkIn) return false;
      return this.parseCheckIn(p.checkIn) >= cutoff;
    });
  }

  get gateLogPeopleCount(): number { return this.filteredGateLogPeople.length; }
  get recentGateLogPeople(): GateLogEntry[] { return this.filteredGateLogPeople; }
  get gateSourceCount(): number { return this.filteredGateLogPeople.filter(p => p.source === 'gate').length; }
  get onlocSourceCount(): number { return this.filteredGateLogPeople.filter(p => p.source === 'onlocation').length; }

  get gateLogLastUpdateLabel(): string {
    if (!this.gateLogStatus?.lastUpdate) return '';
    const update = new Date(this.gateLogStatus.lastUpdate);
    const diffMin = Math.floor((Date.now() - update.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    return `${Math.floor(diffMin / 60)}h ago`;
  }

  private parseCheckIn(checkIn: string): Date {
    const parts = checkIn.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/);
    if (!parts) return new Date(0);
    return new Date(+parts[3], +parts[1] - 1, +parts[2], +parts[4], +parts[5], +parts[6]);
  }

  get perryLightningLevel(): string {
    if (!this.perryStatus || this.perryStatus.status !== 'available') return '';
    const s = this.perryStatus.lightningStatus;
    if (s === 'Lightning Alarm') return 'danger';
    if (s === 'Lightning Watch') return 'caution';
    if (s === 'All Clear') return 'safe';
    return '';
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.unsubWeather?.();
    this.unsubForecast?.();
    this.unsubPerry?.();
    this.unsubPjm?.();
    this.unsubGateLog?.();
    this.unsubSync?.();
  }

  get stateLabel(): string {
    const labels: Record<string, string> = {
      stopped: 'Stopped', starting: 'Starting...', running: 'Running',
      stopping: 'Stopping...', error: 'Error'
    };
    return labels[this.status.state] || this.status.state;
  }

  formatUptime(ms: number): string {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
  }

  async start(): Promise<void> { await this.electronService.startApp(); }
  async stop(): Promise<void> { await this.electronService.stopApp(); }
  async restart(): Promise<void> { await this.electronService.restartApp(); }
  openPidApp(): void { this.router.navigate(['/pid-app']); }
  async openInBrowser(): Promise<void> { await this.electronService.openAppUrl(); }
}
