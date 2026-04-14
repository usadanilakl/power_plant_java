import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
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
import { DashboardEditToolbarComponent } from './dashboard-edit-toolbar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [
    CommonModule, RouterModule,
    FireImpairmentWidgetComponent, GateLogWidgetComponent, WeatherWidgetComponent,
    PjmWidgetComponent, PermitsWidgetComponent, ExternalLinksWidgetComponent,
    ContactsWidgetComponent, PagingWidgetComponent, DashboardEditToolbarComponent,
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
        [draft]="draftLayout"
        [presets]="presets"
        [currentPresetName]="draftPresetName"
        (applyPreset)="applyPreset($event)"
        (restoreWidget)="restoreWidget($event)"
        (done)="saveDraft()"
        (cancel)="cancelEdit()" />

      <!-- Feature cards grid -->
      <div class="features-grid" [class.edit-mode]="editMode">
        <ng-container *ngFor="let widget of visibleWidgets; trackBy: trackWidget">
          <div class="widget-wrapper"
               [class.span-2]="widget.colSpan === 2"
               [class.dragging]="dragSourceId === widget.widgetId"
               [class.drag-over]="dragOverId === widget.widgetId"
               [attr.data-widget-id]="widget.widgetId"
               (dragover)="editMode ? onDragOver($event, widget.widgetId) : null"
               (drop)="editMode ? onDrop($event, widget.widgetId) : null"
               (dragleave)="onDragLeave()">

            <!-- Edit controls -->
            <div class="widget-edit-controls" *ngIf="editMode">
              <span class="drag-handle material-icons"
                    draggable="true"
                    (dragstart)="onDragStart($event, widget.widgetId)"
                    (dragend)="onDragEnd()">drag_indicator</span>
              <div class="widget-ctrl-group">
                <button class="widget-ctrl-btn" *ngIf="canResize(widget.widgetId)"
                        (click)="toggleSpan(widget.widgetId)"
                        [title]="widget.colSpan === 2 ? 'Shrink to 1 column' : 'Expand to 2 columns'">
                  <span class="material-icons">{{ widget.colSpan === 2 ? 'unfold_less' : 'unfold_more' }}</span>
                </button>
                <button class="widget-ctrl-btn" (click)="hideWidget(widget.widgetId)" title="Hide widget">
                  <span class="material-icons">visibility_off</span>
                </button>
              </div>
            </div>

            <!-- Widget content -->
            <ng-container [ngSwitch]="widget.widgetId">
              <app-fire-impairment-widget *ngSwitchCase="'fire-impairment'"
                [status]="status" [activeImpairmentCount]="activeImpairmentCount" [editMode]="editMode" />
              <app-gate-log-widget *ngSwitchCase="'gate-log'"
                [peopleCount]="gateLogPeopleCount" [gateSourceCount]="gateSourceCount"
                [onlocSourceCount]="onlocSourceCount" [lastUpdateLabel]="gateLogLastUpdateLabel"
                [gateLogStatus]="gateLogStatus" [editMode]="editMode" />
              <app-weather-widget *ngSwitchCase="'weather'"
                [weatherStatus]="weatherStatus" [perryStatus]="perryStatus" [weatherForecast]="weatherForecast"
                [lightningLevel]="lightningLevel" [lightningLabel]="lightningLabel"
                [perryLightningLevel]="perryLightningLevel" [forecastDesc]="forecastDesc" [editMode]="editMode" />
              <app-pjm-widget *ngSwitchCase="'pjm'"
                [pjmStatus]="pjmStatus" [pjmPolling]="pjmPolling" [editMode]="editMode" />
              <app-permits-widget *ngSwitchCase="'permits'"
                [status]="status" [activeWorkRequestCount]="activeWorkRequestCount"
                [newWorkRequestCount]="newWorkRequestCount" [editMode]="editMode" />
              <app-external-links-widget *ngSwitchCase="'external-links'" [editMode]="editMode" />
              <app-contacts-widget *ngSwitchCase="'contacts'" />
              <app-paging-widget *ngSwitchCase="'paging-system'" />
            </ng-container>
          </div>
        </ng-container>
      </div>
    </div>
  `,
  styles: [`
    .home {
      max-width: 1000px;
      margin: 0 auto;
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

    .customize-btn {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .btn-icon { font-size: 16px; }

    /* Spring Boot Panel */
    .sb-panel {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      padding: 20px;
      margin-bottom: 24px;
    }

    .sb-panel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
    }

    .sb-title-row {
      display: flex;
      align-items: center;
      gap: 10px;
    }

    .sb-title-row h2 {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .sb-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .sb-dot.running {
      background-color: var(--accent-success);
      box-shadow: 0 0 8px var(--accent-success);
    }

    .sb-dot.starting, .sb-dot.stopping {
      background-color: var(--accent-warning);
      animation: pulse 1.5s infinite;
    }

    .sb-dot.stopped { background-color: var(--text-muted); }
    .sb-dot.error { background-color: var(--accent-error); }

    .sb-controls { display: flex; gap: 8px; }
    .btn-sm { padding: 6px 12px; font-size: 12px; }

    .sb-details {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    }

    .detail-item { font-size: 13px; color: var(--text-secondary); }
    .detail-item.error { color: var(--accent-error); }
    .health-healthy { color: var(--accent-success); }
    .health-unhealthy { color: var(--accent-error); }
    .health-unknown { color: var(--text-muted); }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    /* Widget wrapper */
    .widget-wrapper {
      position: relative;
      border-radius: 14px;
    }

    .widget-wrapper.span-2 {
      grid-column: span 2;
    }

    @media (max-width: 640px) {
      .widget-wrapper.span-2 { grid-column: span 1; }
    }

    /* Edit mode */
    .features-grid.edit-mode .widget-wrapper {
      border: 2px dashed var(--border-color);
      padding: 2px;
      transition: border-color 150ms;
    }

    .widget-edit-controls {
      position: absolute;
      top: 6px;
      left: 6px;
      right: 6px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      z-index: 10;
      pointer-events: none;
    }

    .widget-edit-controls > * {
      pointer-events: auto;
    }

    .drag-handle {
      cursor: grab;
      color: var(--text-muted);
      font-size: 20px;
      padding: 2px;
      border-radius: 4px;
      background: var(--bg-card);
      opacity: 0.8;
      transition: opacity 150ms, color 150ms;
    }

    .drag-handle:hover { opacity: 1; color: var(--text-primary); }
    .drag-handle:active { cursor: grabbing; }

    .widget-ctrl-group {
      display: flex;
      gap: 4px;
    }

    .widget-ctrl-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      border-radius: 6px;
      border: none;
      background: var(--bg-card);
      color: var(--text-muted);
      cursor: pointer;
      opacity: 0.8;
      transition: opacity 150ms, color 150ms, background-color 150ms;
    }

    .widget-ctrl-btn:hover {
      opacity: 1;
      color: var(--text-primary);
      background: var(--bg-secondary);
    }

    .widget-ctrl-btn .material-icons { font-size: 18px; }

    /* Drag-and-drop */
    .widget-wrapper.dragging { opacity: 0.4; }
    .widget-wrapper.drag-over {
      border-color: var(--accent-primary) !important;
      background: rgba(59, 130, 246, 0.06);
    }

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
  draftLayout: WidgetPlacement[] = [];
  presets: LayoutPreset[] = [];

  // Drag-and-drop
  dragSourceId: WidgetId | null = null;
  dragOverId: WidgetId | null = null;

  constructor(
    private electronService: ElectronService,
    private router: Router,
    private layoutService: DashboardLayoutService,
  ) {
    this.presets = this.layoutService.getPresets();
  }

  get visibleWidgets(): WidgetPlacement[] {
    const source = this.editMode ? this.draftLayout : this.layoutService.layout();
    return source.filter(w => w.visible);
  }

  get draftPresetName(): string {
    if (!this.editMode) return this.layoutService.currentPresetName();
    // Check if draft matches any preset
    for (const preset of this.presets) {
      if (this.layoutsMatch(this.draftLayout, preset.widgets)) return preset.name;
    }
    return 'Custom';
  }

  trackWidget(_index: number, widget: WidgetPlacement): WidgetId {
    return widget.widgetId;
  }

  // --- Edit mode ---

  enterEditMode(): void {
    this.editMode = true;
    this.draftLayout = this.layoutService.startEditing();
  }

  saveDraft(): void {
    this.layoutService.save(this.draftLayout);
    this.editMode = false;
    this.draftLayout = [];
  }

  cancelEdit(): void {
    this.editMode = false;
    this.draftLayout = [];
  }

  applyPreset(name: string): void {
    const preset = this.presets.find(p => p.name === name);
    if (preset) {
      this.draftLayout = structuredClone(preset.widgets);
    }
  }

  hideWidget(widgetId: WidgetId): void {
    const w = this.draftLayout.find(w => w.widgetId === widgetId);
    if (w) w.visible = false;
  }

  restoreWidget(widgetId: WidgetId): void {
    const w = this.draftLayout.find(w => w.widgetId === widgetId);
    if (w) w.visible = true;
  }

  // --- Span toggle ---

  canResize(widgetId: WidgetId): boolean {
    const def = this.layoutService.getWidgetDefinition(widgetId);
    return !!def && def.allowedColSpans.length > 1;
  }

  toggleSpan(widgetId: WidgetId): void {
    const w = this.draftLayout.find(w => w.widgetId === widgetId);
    if (!w) return;
    const def = this.layoutService.getWidgetDefinition(widgetId);
    if (!def) return;
    w.colSpan = w.colSpan === 1 && def.allowedColSpans.includes(2) ? 2 : 1;
  }

  // --- Drag-and-drop ---

  onDragStart(event: DragEvent, widgetId: WidgetId): void {
    this.dragSourceId = widgetId;
    event.dataTransfer?.setData('text/plain', widgetId);
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
    }
  }

  onDragOver(event: DragEvent, widgetId: WidgetId): void {
    event.preventDefault();
    if (!this.dragSourceId || this.dragSourceId === widgetId) {
      this.dragOverId = null;
      return;
    }
    this.dragOverId = widgetId;
  }

  onDragLeave(): void {
    this.dragOverId = null;
  }

  onDrop(event: DragEvent, targetId: WidgetId): void {
    event.preventDefault();
    const sourceId = event.dataTransfer?.getData('text/plain') as WidgetId;
    if (!sourceId || sourceId === targetId) {
      this.clearDrag();
      return;
    }

    // Remove source from its current position
    const sourceIndex = this.draftLayout.findIndex(w => w.widgetId === sourceId);
    if (sourceIndex === -1) { this.clearDrag(); return; }
    const [removed] = this.draftLayout.splice(sourceIndex, 1);

    // Insert at target's current position (source takes target's slot, target shifts)
    const targetIndex = this.draftLayout.findIndex(w => w.widgetId === targetId);
    this.draftLayout.splice(targetIndex, 0, removed);

    this.clearDrag();
  }

  onDragEnd(): void {
    this.clearDrag();
  }

  private clearDrag(): void {
    this.dragSourceId = null;
    this.dragOverId = null;
  }

  private layoutsMatch(a: WidgetPlacement[], b: WidgetPlacement[]): boolean {
    if (a.length !== b.length) return false;
    return a.every((w, i) =>
      w.widgetId === b[i].widgetId && w.visible === b[i].visible && w.colSpan === b[i].colSpan
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
    this.unsubWeather = this.electronService.onWeatherStatusChange((s) => {
      this.weatherStatus = s;
    });

    this.loadWeatherForecast();
    this.unsubForecast = this.electronService.onWeatherForecastChange((f) => {
      this.weatherForecast = f;
    });

    this.loadPerryStatus();
    this.unsubPerry = this.electronService.onPerryStatusChange((s) => {
      this.perryStatus = s;
    });

    this.loadPjmStatus();
    this.unsubPjm = this.electronService.onPjmStatusChange((s) => {
      this.pjmStatus = s;
    });

    this.loadGateLogData();
    this.unsubGateLog = this.electronService.onGateLogPeopleUpdated(() => {
      this.loadGateLogData();
    });

    this.unsubSync = this.electronService.onSyncEntityUpdated((entityType) => {
      if (entityType === 'FireImpairment') {
        this.loadFireImpCount();
      }
    });
  }

  private async loadWeatherStatus(): Promise<void> {
    try {
      const result = await this.electronService.getWeatherStatus();
      if (result.success && result.data) {
        this.weatherStatus = result.data;
      }
    } catch {}
  }

  private async loadWeatherForecast(): Promise<void> {
    try {
      const result = await this.electronService.getWeatherForecast();
      if (result.success && result.data) {
        this.weatherForecast = result.data;
      }
    } catch {}
  }

  private async loadPjmStatus(): Promise<void> {
    try {
      const result = await this.electronService.getPjmStatus() as any;
      if (result.success && result.data) {
        this.pjmStatus = result.data;
      }
      if (result.polling != null) {
        this.pjmPolling = result.polling;
      }
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
      if (result.success) {
        this.activeImpairmentCount = result.data ?? 0;
      }
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
      if (result.success && result.data) {
        this.perryStatus = result.data;
      }
    } catch {}
  }

  private async loadGateLogData(): Promise<void> {
    try {
      const [peopleResult, statusResult] = await Promise.all([
        this.electronService.gateLogGetPeople(),
        this.electronService.gateLogGetStatus(),
      ]);
      if (peopleResult.success && peopleResult.data) {
        this.gateLogPeople = peopleResult.data;
      }
      if (statusResult.success && statusResult.data) {
        this.gateLogStatus = statusResult.data;
      }
    } catch {}
  }

  private get filteredGateLogPeople(): GateLogEntry[] {
    const cutoff = new Date(Date.now() - 12 * 60 * 60 * 1000);
    return this.gateLogPeople.filter(p => {
      if (!p.checkIn) return false;
      return this.parseCheckIn(p.checkIn) >= cutoff;
    });
  }

  get gateLogPeopleCount(): number {
    return this.filteredGateLogPeople.length;
  }

  get gateSourceCount(): number {
    return this.filteredGateLogPeople.filter(p => p.source === 'gate').length;
  }

  get onlocSourceCount(): number {
    return this.filteredGateLogPeople.filter(p => p.source === 'onlocation').length;
  }

  get gateLogLastUpdateLabel(): string {
    if (!this.gateLogStatus?.lastUpdate) return '';
    const update = new Date(this.gateLogStatus.lastUpdate);
    const now = new Date();
    const diffMin = Math.floor((now.getTime() - update.getTime()) / 60000);
    if (diffMin < 1) return 'just now';
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffH = Math.floor(diffMin / 60);
    return `${diffH}h ago`;
  }

  private parseCheckIn(checkIn: string): Date {
    const parts = checkIn.match(/(\d+)\/(\d+)\/(\d+)\s+(\d+):(\d+):(\d+)/);
    if (!parts) return new Date(0);
    return new Date(
      parseInt(parts[3]),
      parseInt(parts[1]) - 1,
      parseInt(parts[2]),
      parseInt(parts[4]),
      parseInt(parts[5]),
      parseInt(parts[6])
    );
  }

  get perryLightningLevel(): string {
    if (!this.perryStatus || this.perryStatus.status !== 'available') return '';
    const status = this.perryStatus.lightningStatus;
    if (status === 'Lightning Alarm') return 'danger';
    if (status === 'Lightning Watch') return 'caution';
    if (status === 'All Clear') return 'safe';
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

  async start(): Promise<void> {
    await this.electronService.startApp();
  }

  async stop(): Promise<void> {
    await this.electronService.stopApp();
  }

  async restart(): Promise<void> {
    await this.electronService.restartApp();
  }

  openPidApp(): void {
    this.router.navigate(['/pid-app']);
  }

  async openInBrowser(): Promise<void> {
    await this.electronService.openAppUrl();
  }
}
