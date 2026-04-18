import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, WeatherStatus, WeatherForecast, PerryWeatherStatus } from '../../services/electron.service';

/** WMO weather code → description + icon */
const WMO_CODES: Record<number, { desc: string; icon: string }> = {
  0:  { desc: 'Clear sky',       icon: '\u2600' },
  1:  { desc: 'Mainly clear',    icon: '\uD83C\uDF24' },
  2:  { desc: 'Partly cloudy',   icon: '\u26C5' },
  3:  { desc: 'Overcast',        icon: '\u2601' },
  45: { desc: 'Fog',             icon: '\uD83C\uDF2B' },
  48: { desc: 'Depositing fog',  icon: '\uD83C\uDF2B' },
  51: { desc: 'Light drizzle',   icon: '\uD83C\uDF26' },
  53: { desc: 'Drizzle',         icon: '\uD83C\uDF26' },
  55: { desc: 'Dense drizzle',   icon: '\uD83C\uDF26' },
  61: { desc: 'Slight rain',     icon: '\uD83C\uDF27' },
  63: { desc: 'Rain',            icon: '\uD83C\uDF27' },
  65: { desc: 'Heavy rain',      icon: '\uD83C\uDF27' },
  66: { desc: 'Freezing rain',   icon: '\uD83C\uDF27' },
  67: { desc: 'Heavy frz rain',  icon: '\uD83C\uDF27' },
  71: { desc: 'Slight snow',     icon: '\uD83C\uDF28' },
  73: { desc: 'Snow',            icon: '\uD83C\uDF28' },
  75: { desc: 'Heavy snow',      icon: '\uD83C\uDF28' },
  77: { desc: 'Snow grains',     icon: '\uD83C\uDF28' },
  80: { desc: 'Slight showers',  icon: '\uD83C\uDF26' },
  81: { desc: 'Showers',         icon: '\uD83C\uDF27' },
  82: { desc: 'Violent showers', icon: '\uD83C\uDF27' },
  85: { desc: 'Snow showers',    icon: '\uD83C\uDF28' },
  86: { desc: 'Heavy snow shw',  icon: '\uD83C\uDF28' },
  95: { desc: 'Thunderstorm',    icon: '\u26C8' },
  96: { desc: 'T-storm w/ hail', icon: '\u26C8' },
  99: { desc: 'T-storm w/ hail', icon: '\u26C8' },
};

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1 class="page-title">Weather Monitoring</h1>

      <!-- Top row: Two lightning panels + Current conditions -->
      <div class="top-row triple">
        <!-- WeatherBug Lightning -->
        <div class="lightning-panel clickable" [class]="lightningLevel" (click)="openWeatherPage()">
          <span class="source-label">WeatherBug</span>
          <div class="lightning-icon"><span class="material-icons">bolt</span></div>
          <div class="lightning-info">
            <span class="lightning-distance">{{ lightningDistance || '--' }}</span>
            <span class="lightning-unit">{{ unit || 'mi' }}</span>
          </div>
          <span class="lightning-label">Lightning Distance</span>
          <span class="lightning-status" [class]="lightningLevel">{{ statusText }}</span>
        </div>

        <!-- Perry Weather Lightning -->
        <div class="lightning-panel clickable" [class]="perryLightningLevel" (click)="openPerryPage()">
          <span class="source-label">Perry Weather</span>
          <div class="lightning-icon"><span class="material-icons">bolt</span></div>
          <div class="lightning-info">
            <span class="lightning-distance">{{ perryStatus?.lightningDistance || '--' }}</span>
          </div>
          <span class="lightning-label">Lightning Status</span>
          <span class="lightning-status" [class]="perryLightningLevel">{{ perryStatusText }}</span>
          <div class="perry-timer" *ngIf="perryStatus?.lightningTimer">
            <span class="material-icons timer-icon">timer</span>
            <span class="timer-value">{{ perryStatus!.lightningTimer }}</span>
          </div>
          <div class="perry-extra" *ngIf="perryStatus?.status === 'available' && perryStatus?.temperature">
            <span>{{ perryStatus!.temperature }}&deg;F</span>
            <span *ngIf="perryStatus?.wind">&middot; Wind {{ perryStatus!.wind }}</span>
          </div>
          <span class="perry-login-hint" *ngIf="perryStatus?.status === 'login-pending'">Logging in...</span>
        </div>

        <!-- Current conditions -->
        <div class="current-panel" *ngIf="forecast?.status === 'available'">
          <div class="current-main">
            <span class="current-icon">{{ wmoIcon(forecast!.current.weatherCode) }}</span>
            <span class="current-temp">{{ forecast!.current.temperature | number:'1.0-0' }}&deg;F</span>
          </div>
          <span class="current-desc">{{ wmoDesc(forecast!.current.weatherCode) }}</span>
          <span class="current-feels">Feels like {{ forecast!.current.apparentTemperature | number:'1.0-0' }}&deg;F</span>
          <div class="current-details">
            <div class="detail-item">
              <span class="detail-label">Wind</span>
              <span class="detail-value">{{ forecast!.current.windSpeed | number:'1.0-0' }} mph {{ windDir(forecast!.current.windDirection) }}</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Gusts</span>
              <span class="detail-value">{{ forecast!.current.windGusts | number:'1.0-0' }} mph</span>
            </div>
            <div class="detail-item">
              <span class="detail-label">Humidity</span>
              <span class="detail-value">{{ forecast!.current.humidity }}%</span>
            </div>
          </div>
        </div>
        <div class="current-panel loading-panel" *ngIf="!forecast || forecast.status === 'loading'">
          <span class="loading-text">Loading forecast...</span>
        </div>
        <div class="current-panel error-panel" *ngIf="forecast?.status === 'error'">
          <span class="error-text">Forecast unavailable</span>
          <span class="error-detail">{{ forecast!.error }}</span>
        </div>
      </div>

      <!-- Hourly forecast -->
      <div class="section" *ngIf="forecast?.status === 'available'">
        <h2 class="section-title">Hourly Forecast</h2>
        <div class="hourly-scroll">
          <div class="hourly-item" *ngFor="let h of hourlySlice">
            <span class="hourly-time">{{ h.time }}</span>
            <span class="hourly-icon">{{ wmoIcon(h.weatherCode) }}</span>
            <span class="hourly-temp">{{ h.temperature | number:'1.0-0' }}&deg;</span>
            <span class="hourly-wind">{{ h.windSpeed | number:'1.0-0' }}</span>
            <span class="hourly-precip" *ngIf="h.precipitation > 0">{{ h.precipitation | number:'1.2-2' }}"</span>
          </div>
        </div>
      </div>

      <!-- Daily forecast -->
      <div class="section" *ngIf="forecast?.status === 'available'">
        <h2 class="section-title">7-Day Forecast</h2>
        <div class="daily-list">
          <div class="daily-item" *ngFor="let d of dailySlice">
            <span class="daily-day">{{ d.dayName }}</span>
            <span class="daily-icon">{{ wmoIcon(d.weatherCode) }}</span>
            <span class="daily-desc">{{ wmoDesc(d.weatherCode) }}</span>
            <span class="daily-precip" *ngIf="d.precipitationSum > 0">{{ d.precipitationSum | number:'1.2-2' }}"</span>
            <span class="daily-wind">{{ d.windSpeedMax | number:'1.0-0' }} mph</span>
            <div class="daily-temps">
              <span class="daily-hi">{{ d.temperatureMax | number:'1.0-0' }}&deg;</span>
              <span class="daily-lo">{{ d.temperatureMin | number:'1.0-0' }}&deg;</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Live Weather Stream -->
      <div class="live-stream-btn-row">
        <button class="btn btn-live" (click)="openMaxVelocity()">
          <span class="material-icons">live_tv</span>
          <span>Max Velocity — Live Weather Radar</span>
          <span class="live-badge">LIVE</span>
        </button>
      </div>

      <!-- Controls -->
      <div class="controls-row">
        <button class="btn btn-primary" (click)="refresh()" [disabled]="refreshing">
          {{ refreshing ? 'Refreshing...' : 'Refresh Now' }}
        </button>
        <div class="interval-control">
          <label>Lightning polling:</label>
          <select [value]="intervalSeconds" (change)="onIntervalChange($event)">
            <option value="5">5s</option>
            <option value="10">10s</option>
            <option value="30">30s</option>
            <option value="60">1 min</option>
            <option value="300">5 min</option>
          </select>
        </div>
        <button class="btn btn-secondary" (click)="openWeatherPage()">Open WeatherBug</button>
        <button class="btn btn-secondary" (click)="openPerryPage()">Open Perry Weather</button>
      </div>

      <div class="notice">
        <span class="notice-icon material-icons" style="color: #3b82f6">info</span>
        <div>
          <strong>Data Sources</strong>
          <p>
            Lightning: WeatherBug Spark (polling {{ intervalLabel }}) + Perry Weather.
            Forecast: Open-Meteo (updates every 15 min). Elwood, IL 60421.
          </p>
          <p>
            <span class="threshold danger-text">Alarm (&le; 8 mi)</span> &mdash;
            <span class="threshold caution-text">Watch (8&ndash;20 mi)</span> &mdash;
            <span class="threshold safe-text">Clear (&gt; 20 mi)</span>.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 900px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 20px;
    }

    /* Top row: lightning panels + current side by side */
    .top-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 16px;
      margin-bottom: 20px;
    }

    .top-row.triple {
      grid-template-columns: 1fr 1fr 1fr;
    }

    .lightning-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      padding: 32px 20px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      transition: all var(--transition-normal);
    }

    .lightning-panel.safe { border-color: var(--accent-success); }
    .lightning-panel.caution { border-color: var(--accent-warning); }
    .lightning-panel.danger {
      border-color: var(--accent-error);
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0%, 100% { border-color: var(--accent-error); }
      50% { border-color: rgba(239, 68, 68, 0.3); }
    }

    .lightning-icon { font-size: 40px; }

    .lightning-info {
      display: flex;
      align-items: baseline;
      gap: 6px;
    }

    .lightning-distance {
      font-size: 48px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .lightning-unit {
      font-size: 16px;
      color: var(--text-muted);
    }

    .lightning-label {
      font-size: 12px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .lightning-status {
      font-size: 13px;
      font-weight: 600;
    }
    .lightning-status.safe { color: var(--accent-success); }
    .lightning-status.caution { color: var(--accent-warning); }
    .lightning-status.danger { color: var(--accent-error); }

    .lightning-panel.clickable {
      cursor: pointer;
    }

    .lightning-panel.clickable:hover {
      background-color: var(--bg-hover);
      border-color: var(--accent-primary);
    }

    .source-label {
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .perry-timer {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--accent-error);
      font-weight: 600;
    }

    .timer-icon {
      font-size: 18px;
    }

    .timer-value {
      font-size: 20px;
    }

    .perry-extra {
      font-size: 12px;
      color: var(--text-secondary);
      display: flex;
      gap: 6px;
    }

    .perry-login-hint {
      font-size: 12px;
      color: var(--text-muted);
      font-style: italic;
    }

    /* Current conditions panel */
    .current-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 6px;
      padding: 32px 20px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
    }

    .current-main {
      display: flex;
      align-items: center;
      gap: 12px;
    }

    .current-icon { font-size: 40px; }

    .current-temp {
      font-size: 48px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .current-desc {
      font-size: 14px;
      color: var(--text-secondary);
    }

    .current-feels {
      font-size: 12px;
      color: var(--text-muted);
    }

    .current-details {
      display: flex;
      gap: 20px;
      margin-top: 8px;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
    }

    .detail-label {
      font-size: 10px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .detail-value {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .loading-panel, .error-panel {
      justify-content: center;
    }

    .loading-text {
      font-size: 14px;
      color: var(--text-muted);
    }

    .error-text {
      font-size: 14px;
      color: var(--accent-error);
      font-weight: 500;
    }

    .error-detail {
      font-size: 12px;
      color: var(--text-muted);
    }

    /* Sections */
    .section {
      margin-bottom: 20px;
    }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 12px;
    }

    /* Hourly forecast */
    .hourly-scroll {
      display: flex;
      gap: 4px;
      overflow-x: auto;
      padding-bottom: 8px;
    }

    .hourly-scroll::-webkit-scrollbar {
      height: 6px;
    }

    .hourly-scroll::-webkit-scrollbar-track {
      background: var(--bg-card);
      border-radius: 3px;
    }

    .hourly-scroll::-webkit-scrollbar-thumb {
      background: var(--border-color);
      border-radius: 3px;
    }

    .hourly-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 4px;
      min-width: 60px;
      padding: 10px 8px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      flex-shrink: 0;
    }

    .hourly-time {
      font-size: 11px;
      color: var(--text-muted);
      font-weight: 500;
    }

    .hourly-icon { font-size: 20px; }

    .hourly-temp {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .hourly-wind {
      font-size: 10px;
      color: var(--text-muted);
    }

    .hourly-precip {
      font-size: 10px;
      color: var(--accent-primary);
      font-weight: 500;
    }

    /* Daily forecast */
    .daily-list {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }

    .daily-item {
      display: grid;
      grid-template-columns: 80px 30px 1fr auto auto 80px;
      align-items: center;
      gap: 12px;
      padding: 12px 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .daily-day {
      font-size: 13px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .daily-icon { font-size: 20px; }

    .daily-desc {
      font-size: 12px;
      color: var(--text-secondary);
    }

    .daily-precip {
      font-size: 11px;
      color: var(--accent-primary);
      font-weight: 500;
    }

    .daily-wind {
      font-size: 11px;
      color: var(--text-muted);
      text-align: right;
    }

    .daily-temps {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .daily-hi {
      font-size: 14px;
      font-weight: 600;
      color: var(--text-primary);
    }

    .daily-lo {
      font-size: 14px;
      color: var(--text-muted);
    }

    /* Controls */
    /* Live stream button */
    .live-stream-btn-row { margin-bottom: 16px; }
    .btn-live {
      display: flex; align-items: center; gap: 8px; width: 100%;
      padding: 12px 16px; border-radius: 10px; border: 1px solid var(--border-color);
      background: var(--bg-card); color: var(--text-primary); font-size: 14px; font-weight: 500;
      cursor: pointer; transition: all 150ms;
    }
    .btn-live:hover { border-color: var(--accent-error); background: var(--bg-card-hover); }
    .btn-live .material-icons { font-size: 22px; color: var(--accent-error); }
    .live-badge {
      font-size: 10px; font-weight: 700; color: #fff; background: var(--accent-error);
      padding: 2px 8px; border-radius: 4px; letter-spacing: 0.5px; margin-left: auto;
      animation: pulse-live 2s infinite;
    }
    @keyframes pulse-live { 0%, 100% { opacity: 1; } 50% { opacity: 0.6; } }

    .controls-row {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;
    }

    .btn {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 13px;
      font-weight: 500;
      border: 1px solid var(--border-color);
      cursor: pointer;
      transition: all var(--transition-normal);
    }

    .btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .btn-primary {
      background-color: var(--accent-primary);
      color: #fff;
      border-color: var(--accent-primary);
    }

    .btn-primary:hover:not(:disabled) { opacity: 0.9; }

    .btn-secondary {
      background-color: var(--bg-card);
      color: var(--text-primary);
    }

    .btn-secondary:hover:not(:disabled) {
      background-color: var(--bg-hover);
      border-color: var(--accent-primary);
    }

    .interval-control {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
    }

    .interval-control label {
      font-size: 13px;
      color: var(--text-muted);
    }

    .interval-control select {
      padding: 8px 12px;
      border-radius: 8px;
      border: 1px solid var(--border-color);
      background-color: var(--bg-card);
      color: var(--text-primary);
      font-size: 13px;
      cursor: pointer;
    }

    .interval-control select:hover {
      border-color: var(--accent-primary);
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background-color: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      color: var(--text-secondary);
    }

    .notice-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .notice strong {
      color: var(--accent-primary);
      display: block;
      margin-bottom: 4px;
    }

    .notice p {
      font-size: 13px;
      margin: 0 0 4px 0;
    }

    .notice p:last-child { margin-bottom: 0; }

    .threshold { font-weight: 500; }
    .danger-text { color: var(--accent-error); }
    .caution-text { color: var(--accent-warning); }
    .safe-text { color: var(--accent-success); }
  `]
})
export class WeatherComponent implements OnInit, OnDestroy {
  lightningDistance: string | null = null;
  unit = '';
  lastUpdate = '';
  intervalSeconds = 10;
  refreshing = false;
  forecast: WeatherForecast | null = null;
  perryStatus: PerryWeatherStatus | null = null;
  private unsubLightning?: () => void;
  private unsubForecast?: () => void;
  private unsubPerry?: () => void;

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    // Load lightning status
    const result = await this.electronService.getWeatherStatus();
    if (result.success && result.data) {
      this.applyStatus(result.data);
    }
    if ((result as any).intervalSeconds) {
      this.intervalSeconds = (result as any).intervalSeconds;
    }

    this.unsubLightning = this.electronService.onWeatherStatusChange((status) => {
      this.applyStatus(status);
    });

    // Load forecast
    const forecastResult = await this.electronService.getWeatherForecast();
    if (forecastResult.success && forecastResult.data) {
      this.forecast = forecastResult.data;
    }

    this.unsubForecast = this.electronService.onWeatherForecastChange((f) => {
      this.forecast = f;
    });

    // Load Perry Weather status
    const perryResult = await this.electronService.getPerryStatus();
    if (perryResult.success && perryResult.data) {
      this.perryStatus = perryResult.data;
    }

    this.unsubPerry = this.electronService.onPerryStatusChange((status) => {
      this.perryStatus = status;
    });
  }

  ngOnDestroy(): void {
    this.unsubLightning?.();
    this.unsubForecast?.();
    this.unsubPerry?.();
  }

  private applyStatus(status: WeatherStatus): void {
    this.lightningDistance = status.lightningDistance ?? null;
    this.unit = status.unit || 'mi';
    this.lastUpdate = status.lastUpdate || '';
  }

  async refresh(): Promise<void> {
    this.refreshing = true;
    await Promise.all([
      this.electronService.weatherRefresh(),
      this.electronService.weatherRefreshForecast(),
      this.electronService.perryRefresh()
    ]);
    setTimeout(() => this.refreshing = false, 3000);
  }

  async onIntervalChange(event: Event): Promise<void> {
    const seconds = parseInt((event.target as HTMLSelectElement).value, 10);
    const [r] = await Promise.all([
      this.electronService.weatherSetInterval(seconds),
      this.electronService.perrySetInterval(seconds)
    ]);
    if (r.intervalSeconds) {
      this.intervalSeconds = r.intervalSeconds;
    }
  }

  openWeatherPage(): void {
    this.electronService.openWebView('weather', 'https://www.weatherbug.com/alerts/lightning/elwood-il-60421/');
  }

  openPerryPage(): void {
    this.electronService.openWebView('perry-weather', 'https://app.perryweather.com/');
  }

  openMaxVelocity(): void {
    this.electronService.openWebView('weather', 'https://maxvelocitywx.com');
  }

  get perryLightningLevel(): string {
    if (!this.perryStatus || this.perryStatus.status !== 'available') return '';
    const status = this.perryStatus.lightningStatus;
    if (status === 'Lightning Alarm') return 'danger';
    if (status === 'Lightning Watch') return 'caution';
    if (status === 'All Clear') return 'safe';
    // Try parsing distance range like "0-10 mi"
    const match = this.perryStatus.lightningDistance?.match(/(\d+)-(\d+)/);
    if (match) {
      const low = parseInt(match[1], 10);
      if (low <= 8) return 'danger';
      if (low <= 20) return 'caution';
      return 'safe';
    }
    return '';
  }

  get perryStatusText(): string {
    if (!this.perryStatus) return 'Loading...';
    if (this.perryStatus.status === 'login-pending') return 'Logging in...';
    if (this.perryStatus.status === 'unavailable') return 'Unavailable';
    return this.perryStatus.lightningStatus || 'No data';
  }

  get intervalLabel(): string {
    if (this.intervalSeconds >= 60) return `${this.intervalSeconds / 60} min`;
    return `${this.intervalSeconds}s`;
  }

  get lightningLevel(): string {
    if (!this.lightningDistance) return '';
    const d = parseFloat(this.lightningDistance);
    if (isNaN(d)) return '';
    if (d <= 8) return 'danger';
    if (d <= 20) return 'caution';
    return 'safe';
  }

  get statusText(): string {
    if (!this.lightningDistance) return 'Not monitored';
    const d = parseFloat(this.lightningDistance);
    if (isNaN(d)) return 'No data';
    if (d <= 8) return 'Lightning Alarm';
    if (d <= 20) return 'Lightning Watch';
    return 'All Clear';
  }

  /** Next 24 hourly items starting from current hour */
  get hourlySlice(): { time: string; temperature: number; weatherCode: number; windSpeed: number; precipitation: number }[] {
    if (!this.forecast?.hourly?.time) return [];
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours()).getTime();
    const startIdx = this.forecast.hourly.time.findIndex(t => new Date(t).getTime() >= currentHour);
    if (startIdx < 0) return [];
    const items: { time: string; temperature: number; weatherCode: number; windSpeed: number; precipitation: number }[] = [];
    for (let i = startIdx; i < Math.min(startIdx + 24, this.forecast.hourly.time.length); i++) {
      const dt = new Date(this.forecast.hourly.time[i]);
      items.push({
        time: dt.toLocaleTimeString([], { hour: 'numeric' }),
        temperature: this.forecast.hourly.temperature[i],
        weatherCode: this.forecast.hourly.weatherCode[i],
        windSpeed: this.forecast.hourly.windSpeed[i],
        precipitation: this.forecast.hourly.precipitation[i],
      });
    }
    return items;
  }

  /** 7-day daily items */
  get dailySlice(): { dayName: string; temperatureMax: number; temperatureMin: number; weatherCode: number; precipitationSum: number; windSpeedMax: number }[] {
    if (!this.forecast?.daily?.time) return [];
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    return this.forecast.daily.time.map((t, i) => {
      const dt = new Date(t + 'T12:00:00');
      const isToday = i === 0;
      return {
        dayName: isToday ? 'Today' : dayNames[dt.getDay()],
        temperatureMax: this.forecast!.daily.temperatureMax[i],
        temperatureMin: this.forecast!.daily.temperatureMin[i],
        weatherCode: this.forecast!.daily.weatherCode[i],
        precipitationSum: this.forecast!.daily.precipitationSum[i],
        windSpeedMax: this.forecast!.daily.windSpeedMax[i],
      };
    });
  }

  wmoIcon(code: number): string {
    return WMO_CODES[code]?.icon || '\u2601';
  }

  wmoDesc(code: number): string {
    return WMO_CODES[code]?.desc || 'Unknown';
  }

  windDir(degrees: number): string {
    const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
    return dirs[Math.round(degrees / 45) % 8];
  }
}
