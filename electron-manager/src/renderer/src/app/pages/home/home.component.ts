import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus, WeatherStatus, WeatherForecast, PjmStatus, APP_DISPLAY_NAME } from '../../services/electron.service';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="home">
      <h1 class="page-title">Dashboard</h1>

      <!-- Spring Boot quick controls -->
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

      <!-- Feature overview cards -->
      <div class="features-grid">
        <a class="feature-card" routerLink="/fire-impairment">
          <div class="feature-icon"><span class="material-icons" style="color: #ef4444">local_fire_department</span></div>
          <div class="feature-info">
            <h3>Fire Impairment</h3>
            <p class="feature-desc">Manage fire protection impairments</p>
            <div class="imp-count" *ngIf="activeImpairmentCount !== null && activeImpairmentCount > 0">
              <span class="count-badge">{{ activeImpairmentCount }}</span>
              active impairment{{ activeImpairmentCount !== 1 ? 's' : '' }}
            </div>
          </div>
          <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
            {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
          </span>
        </a>

        <a class="feature-card" routerLink="/gate-log">
          <div class="feature-icon"><span class="material-icons" style="color: #06b6d4">badge</span></div>
          <div class="feature-info">
            <h3>Gate Log</h3>
            <p class="feature-desc">Monitor site access and personnel</p>
          </div>
          <span class="feature-status available">Independent</span>
        </a>

        <a class="feature-card" routerLink="/weather">
          <div class="feature-icon"><span class="material-icons" style="color: #f59e0b">thunderstorm</span></div>
          <div class="feature-info">
            <h3>Weather</h3>
            <p class="feature-desc">Lightning and weather monitoring</p>
            <div class="weather-snippets" *ngIf="weatherStatus?.status === 'available' || weatherForecast?.status === 'available'">
              <div class="lightning-snippet" *ngIf="weatherStatus?.status === 'available' && weatherStatus?.lightningDistance">
                <span class="lightning-badge" [class]="lightningLevel">{{ weatherStatus?.lightningDistance }} {{ weatherStatus?.unit || 'mi' }}</span>
                {{ lightningLabel }}
              </div>
              <div class="temp-snippet" *ngIf="weatherForecast?.status === 'available'">
                {{ weatherForecast!.current.temperature | number:'1.0-0' }}&deg;F &middot; {{ forecastDesc }}
              </div>
            </div>
            <div class="lightning-snippet loading" *ngIf="weatherStatus?.status === 'loading' && !weatherForecast">
              Loading...
            </div>
          </div>
          <span class="feature-status available">Independent</span>
        </a>

        <a class="feature-card" routerLink="/pjm">
          <div class="feature-icon"><span class="material-icons" style="color: #eab308">bolt</span></div>
          <div class="feature-info">
            <h3>PJM</h3>
            <p class="feature-desc">Grid pricing and power data</p>
            <div class="pjm-snippet" *ngIf="pjmStatus?.unit1?.status === 'available' || pjmStatus?.unit2?.status === 'available'">
              <div class="pjm-unit-row" *ngIf="pjmStatus?.unit1?.status === 'available'">
                <span class="pjm-unit-label">U1</span>
                <span class="pjm-price" [class.price-positive]="(pjmStatus?.unit1?.lmpPrice ?? 0) >= 0"
                      [class.price-negative]="(pjmStatus?.unit1?.lmpPrice ?? 0) < 0">
                  \${{ pjmStatus?.unit1?.lmpPrice?.toFixed(2) }}
                </span>
              </div>
              <div class="pjm-unit-row" *ngIf="pjmStatus?.unit2?.status === 'available'">
                <span class="pjm-unit-label">U2</span>
                <span class="pjm-price" [class.price-positive]="(pjmStatus?.unit2?.lmpPrice ?? 0) >= 0"
                      [class.price-negative]="(pjmStatus?.unit2?.lmpPrice ?? 0) < 0">
                  \${{ pjmStatus?.unit2?.lmpPrice?.toFixed(2) }}
                </span>
              </div>
              <span class="pjm-unit">$/MWh</span>
            </div>
            <div class="pjm-evo-row" *ngIf="pjmStatus?.unit1Evolution">
              <span class="pjm-evo-dot" [class]="pjmStatus!.unit1Evolution!.status"></span>
              <span class="pjm-evo-label">U1</span>
              <span class="pjm-evo-msg">{{ pjmStatus!.unit1Evolution!.message }}</span>
            </div>
            <div class="pjm-evo-row" *ngIf="pjmStatus?.unit2Evolution">
              <span class="pjm-evo-dot" [class]="pjmStatus!.unit2Evolution!.status"></span>
              <span class="pjm-evo-label">U2</span>
              <span class="pjm-evo-msg">{{ pjmStatus!.unit2Evolution!.message }}</span>
            </div>
            <div class="pjm-snippet muted" *ngIf="pjmStatus?.unit1?.status !== 'available' && pjmStatus?.unit2?.status !== 'available' && !pjmPolling">
              Polling disabled
            </div>
            <div class="pjm-snippet muted" *ngIf="(pjmStatus?.unit1?.status === 'loading' || pjmStatus?.unit2?.status === 'loading') && pjmPolling && pjmStatus?.unit1?.status !== 'available' && pjmStatus?.unit2?.status !== 'available'">
              Loading...
            </div>
            <div class="pjm-snippet error-text" *ngIf="pjmStatus?.unit1?.status === 'error' && pjmStatus?.unit2?.status === 'error'">
              Error
            </div>
          </div>
          <span class="feature-status available">Independent</span>
        </a>

        <div class="feature-card permits-card" [class.disabled]="status.state !== 'running'">
          <div class="feature-icon"><span class="material-icons" style="color: #8b5cf6">assignment</span></div>
          <div class="feature-info">
            <h3>Permits</h3>
            <p class="feature-desc">Work requests, LOTOs, permits</p>
          </div>
          <div class="permit-items">
            <a class="permit-item" [routerLink]="['/pid-app']" [queryParams]="{ path: 'loto/loto' }">
              <span>Active LOTOs</span>
              <span class="item-placeholder">--</span>
            </a>
            <a class="permit-item" [routerLink]="['/pid-app']" [queryParams]="{ path: 'permit-builder/work-requests' }">
              <span>Work Requests</span>
              <span class="wr-counts">
                <span class="count-badge active-badge" *ngIf="activeWorkRequestCount !== null && activeWorkRequestCount > 0"
                      title="Active">{{ activeWorkRequestCount }}</span>
                <span class="count-badge new-badge" *ngIf="newWorkRequestCount !== null && newWorkRequestCount > 0"
                      title="New">{{ newWorkRequestCount }}<span class="new-dot">*</span></span>
              </span>
            </a>
          </div>
          <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
            {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
          </span>
        </div>

        <div class="feature-card external-links-card">
          <div class="feature-icon"><span class="material-icons" style="color: #3b82f6">open_in_new</span></div>
          <div class="feature-info">
            <h3>External Links</h3>
            <p class="feature-desc">SharePoint, Maximo, and other tools</p>
          </div>
          <div class="ext-links">
            <a class="ext-link" (click)="openLink('toi')">
              <span class="material-icons ext-link-icon">description</span>
              <span>TOI</span>
              <span class="material-icons ext-arrow">open_in_new</span>
            </a>
            <a class="ext-link" (click)="openLink('work-requests')">
              <span class="material-icons ext-link-icon">table_chart</span>
              <span>Work Requests</span>
              <span class="material-icons ext-arrow">open_in_new</span>
            </a>
            <a class="ext-link" (click)="openLink('maximo')">
              <span class="material-icons ext-link-icon">engineering</span>
              <span>Maximo</span>
              <span class="material-icons ext-arrow">open_in_new</span>
            </a>
            <a class="ext-link" (click)="openLink('permits')">
              <span class="material-icons ext-link-icon">security</span>
              <span>Permits</span>
              <span class="material-icons ext-arrow">open_in_new</span>
            </a>
            <a class="ext-link" (click)="openLink('turnover-sheet')">
              <span class="material-icons ext-link-icon">swap_horiz</span>
              <span>Turn Over Sheet</span>
              <span class="material-icons ext-arrow">open_in_new</span>
            </a>
            <a class="ext-link" (click)="openLink('emergency-contacts')">
              <span class="material-icons ext-link-icon">contact_phone</span>
              <span>Emergency Contacts</span>
              <span class="material-icons ext-arrow">open_in_new</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .home {
      max-width: 1000px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 20px;
    }

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

    .sb-dot.stopped {
      background-color: var(--text-muted);
    }

    .sb-dot.error {
      background-color: var(--accent-error);
    }

    .sb-controls {
      display: flex;
      gap: 8px;
    }

    .btn-sm {
      padding: 6px 12px;
      font-size: 12px;
    }

    .sb-details {
      display: flex;
      gap: 20px;
      flex-wrap: wrap;
      margin-top: 12px;
      padding-top: 12px;
      border-top: 1px solid var(--border-color);
    }

    .detail-item {
      font-size: 13px;
      color: var(--text-secondary);
    }

    .detail-item.error {
      color: var(--accent-error);
    }

    .health-healthy { color: var(--accent-success); }
    .health-unhealthy { color: var(--accent-error); }
    .health-unknown { color: var(--text-muted); }

    /* Features Grid */
    .features-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 16px;
    }

    .feature-card {
      display: flex;
      flex-direction: column;
      gap: 12px;
      padding: 20px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      text-decoration: none;
      color: inherit;
      transition: all var(--transition-normal);
      cursor: pointer;
    }

    .feature-card:hover {
      border-color: var(--accent-primary);
      box-shadow: var(--shadow-md);
      transform: translateY(-2px);
    }

    .feature-icon {
      font-size: 28px;
    }

    .feature-info h3 {
      font-size: 15px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .feature-desc {
      font-size: 12px;
      color: var(--text-muted);
      margin: 4px 0 0;
    }

    .feature-status {
      font-size: 11px;
      color: var(--accent-success);
    }

    .feature-status.requires-sb {
      color: var(--text-muted);
    }

    .feature-status.available {
      color: var(--accent-success);
    }

    .imp-count {
      font-size: 12px;
      color: var(--accent-warning);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 22px;
      height: 22px;
      border-radius: 50%;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
      background-color: var(--accent-warning);
    }

    .weather-snippets {
      margin-top: 4px;
      display: flex;
      flex-direction: column;
      gap: 3px;
    }

    .lightning-snippet {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lightning-snippet.loading {
      color: var(--text-muted);
      margin-top: 4px;
    }

    .temp-snippet {
      font-size: 12px;
      color: var(--text-muted);
    }

    .lightning-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      padding: 2px 8px;
      border-radius: 10px;
      font-size: 11px;
      font-weight: 700;
      color: #fff;
    }

    .lightning-badge.safe { background-color: var(--accent-success); }
    .lightning-badge.caution { background-color: var(--accent-warning); }
    .lightning-badge.danger { background-color: var(--accent-error); }

    .pjm-snippet {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
      display: flex;
      align-items: baseline;
      gap: 4px;
    }

    .pjm-snippet.muted { color: var(--text-muted); }
    .pjm-snippet.error-text { color: var(--accent-error); }

    .pjm-unit-row {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .pjm-unit-label {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 600;
      min-width: 20px;
    }

    .pjm-price {
      font-size: 16px;
      font-weight: 700;
    }

    .pjm-price.price-positive { color: var(--accent-success); }
    .pjm-price.price-negative { color: var(--accent-error); }

    .pjm-unit {
      font-size: 11px;
      color: var(--text-muted);
    }

    .pjm-evo-row {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-top: 4px;
      font-size: 11px;
    }

    .pjm-evo-dot {
      width: 6px;
      height: 6px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .pjm-evo-dot.online { background-color: var(--accent-success); }
    .pjm-evo-dot.offline { background-color: var(--accent-error); }
    .pjm-evo-dot.unknown { background-color: var(--text-muted); }

    .pjm-evo-label {
      font-weight: 600;
      color: var(--text-muted);
      min-width: 20px;
    }

    .pjm-evo-msg {
      color: var(--text-secondary);
    }

    .permits-card {
      cursor: default;
    }

    .permits-card.disabled .permit-item {
      pointer-events: none;
      opacity: 0.4;
    }

    .permit-items {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }

    .permit-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      transition: background-color 150ms;
    }

    .permit-item:hover {
      background-color: var(--bg-secondary);
    }

    .item-placeholder {
      font-size: 12px;
      color: var(--text-muted);
    }

    .wr-counts {
      display: flex;
      gap: 6px;
      align-items: center;
    }

    .count-badge.new-badge {
      background-color: var(--accent-warning);
      position: relative;
    }

    .count-badge.active-badge {
      background-color: var(--accent-primary);
    }

    .new-dot {
      position: absolute;
      top: -3px;
      right: -3px;
      font-size: 10px;
      font-weight: 700;
      color: var(--accent-warning);
    }

    .external-links-card {
      cursor: default;
    }

    .ext-links {
      display: flex;
      flex-direction: column;
      gap: 2px;
      margin-top: 4px;
    }

    .ext-link {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 10px;
      border-radius: 6px;
      font-size: 13px;
      color: var(--text-secondary);
      text-decoration: none;
      cursor: pointer;
      transition: background-color 150ms;
    }

    .ext-link:hover {
      background-color: var(--bg-secondary);
      color: var(--text-primary);
    }

    .ext-link-icon {
      font-size: 18px;
      color: var(--text-muted);
    }

    .ext-arrow {
      font-size: 14px;
      color: var(--text-muted);
      margin-left: auto;
      opacity: 0;
      transition: opacity 150ms;
    }

    .ext-link:hover .ext-arrow {
      opacity: 1;
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
  pjmStatus: PjmStatus | null = null;
  pjmPolling = false;
  private sub?: Subscription;
  private unsubWeather?: () => void;
  private unsubForecast?: () => void;
  private unsubPjm?: () => void;

  constructor(private electronService: ElectronService, private router: Router) {}

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

    this.loadPjmStatus();
    this.unsubPjm = this.electronService.onPjmStatusChange((s) => {
      this.pjmStatus = s;
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

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.unsubWeather?.();
    this.unsubForecast?.();
    this.unsubPjm?.();
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

  private readonly externalLinks: Record<string, string> = {
    'toi': 'https://jpowerusa.sharepoint.com/sites/JG/External/Forms/AllItems.aspx?id=%2Fsites%2FJG%2FExternal%2F60%20%2D%20Operations%2F60%2E11%20TIO%2DTMOD&viewid=88b99ea1%2D77a0%2D4798%2Dbc16%2D64e9eec8fa6a',
    'work-requests': 'https://jpowerusa.sharepoint.com/sites/JG/Lists/Work%20Requests/AllItems.aspx?env=WebViewList',
    'maximo': '',
    'permits': 'https://jpowerusa.sharepoint.com/sites/JG/SitePages/Confined-Spaces.aspx',
    'turnover-sheet': 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7B0645E9F2-2CEB-4351-901C-D70C70FF775A%7D&file=Turnover%20With%20Gads(right%20click-open-open%20in%20app%20f9%20to%20refresh)new2%20-%20Copy.xlsm&action=default&mobileredirect=true',
    'emergency-contacts': 'https://jpowerusa.sharepoint.com/:x:/r/sites/JG/_layouts/15/Doc.aspx?sourcedoc=%7BE445C5F4-C235-45F7-8D29-F0613E875FA0%7D&file=EMERGENCY%20CONTACT%20LIST%20-%20EDITED%2011_2024.xlsx&action=default&mobileredirect=true'
  };

  openLink(key: string): void {
    const url = this.externalLinks[key];
    if (url) {
      this.electronService.openExternal(url);
    }
  }
}
