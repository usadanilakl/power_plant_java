import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus, WeatherStatus, APP_DISPLAY_NAME } from '../../services/electron.service';

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
          <div class="feature-icon">&#x2622;</div>
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
          <div class="feature-icon">&#x2706;</div>
          <div class="feature-info">
            <h3>Gate Log</h3>
            <p class="feature-desc">Monitor site access and personnel</p>
          </div>
          <span class="feature-status available">Independent</span>
        </a>

        <a class="feature-card" routerLink="/weather">
          <div class="feature-icon">&#x26A1;</div>
          <div class="feature-info">
            <h3>Weather</h3>
            <p class="feature-desc">Lightning and weather monitoring</p>
            <div class="lightning-snippet" *ngIf="weatherStatus?.status === 'available' && weatherStatus?.lightningDistance">
              <span class="lightning-badge" [class]="lightningLevel">{{ weatherStatus?.lightningDistance }} {{ weatherStatus?.unit || 'mi' }}</span>
              {{ lightningLabel }}
            </div>
            <div class="lightning-snippet loading" *ngIf="weatherStatus?.status === 'loading'">
              Loading...
            </div>
          </div>
          <span class="feature-status available">Independent</span>
        </a>

        <a class="feature-card" routerLink="/pjm">
          <div class="feature-icon">&#x26A1;</div>
          <div class="feature-info">
            <h3>PJM</h3>
            <p class="feature-desc">Grid pricing and power data</p>
          </div>
          <span class="feature-status available">Independent</span>
        </a>
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

    .lightning-snippet {
      font-size: 12px;
      color: var(--text-secondary);
      margin-top: 4px;
      display: flex;
      align-items: center;
      gap: 6px;
    }

    .lightning-snippet.loading {
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
  weatherStatus: WeatherStatus | null = null;
  private sub?: Subscription;
  private unsubWeather?: () => void;

  constructor(private electronService: ElectronService, private router: Router) {}

  ngOnInit(): void {
    this.sub = this.electronService.appStatus$.subscribe(s => {
      const wasRunning = this.status.state === 'running';
      this.status = s;
      if (!wasRunning && s.state === 'running') {
        this.loadFireImpCount();
      }
    });

    this.loadWeatherStatus();
    this.unsubWeather = this.electronService.onWeatherStatusChange((s) => {
      this.weatherStatus = s;
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

  private async loadFireImpCount(): Promise<void> {
    try {
      const result = await this.electronService.fireImpCount();
      if (result.success) {
        this.activeImpairmentCount = result.data ?? 0;
      }
    } catch {}
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.unsubWeather?.();
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
