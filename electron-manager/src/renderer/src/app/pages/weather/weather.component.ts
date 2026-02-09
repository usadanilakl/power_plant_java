import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ElectronService, WeatherStatus } from '../../services/electron.service';

@Component({
  selector: 'app-weather',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <h1 class="page-title">Weather Monitoring</h1>

      <!-- Lightning distance display -->
      <div class="lightning-panel" [class]="lightningLevel">
        <div class="lightning-icon">&#x26A1;</div>
        <div class="lightning-info">
          <span class="lightning-distance">{{ lightningDistance || '--' }}</span>
          <span class="lightning-unit">{{ unit || 'miles' }}</span>
        </div>
        <span class="lightning-label">Lightning Distance</span>
      </div>

      <!-- Status cards -->
      <div class="status-row">
        <div class="status-card">
          <span class="status-label">Status</span>
          <span class="status-value" [class]="lightningLevel">{{ statusText }}</span>
        </div>
        <div class="status-card">
          <span class="status-label">Last Update</span>
          <span class="status-value">{{ lastUpdate || 'Not connected' }}</span>
        </div>
        <div class="status-card">
          <span class="status-label">Source</span>
          <span class="status-value">WeatherBug</span>
        </div>
      </div>

      <button class="open-btn" (click)="openWeatherPage()">Open WeatherBug Lightning Page</button>

      <div class="notice">
        <span class="notice-icon">&#x2139;</span>
        <div>
          <strong>Lightning Alert Thresholds</strong>
          <p>
            <span class="threshold danger-text">Alarm (&le; 8 mi)</span> &mdash;
            <span class="threshold caution-text">Watch (8&ndash;20 mi)</span> &mdash;
            <span class="threshold safe-text">Clear (&gt; 20 mi)</span>.
            Data refreshes every 10 seconds from WeatherBug Spark.
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .page {
      max-width: 800px;
      margin: 0 auto;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin-bottom: 20px;
    }

    .lightning-panel {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      padding: 40px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 16px;
      margin-bottom: 20px;
      transition: all var(--transition-normal);
    }

    .lightning-panel.safe {
      border-color: var(--accent-success);
    }

    .lightning-panel.caution {
      border-color: var(--accent-warning);
    }

    .lightning-panel.danger {
      border-color: var(--accent-error);
      animation: pulse-border 2s infinite;
    }

    @keyframes pulse-border {
      0%, 100% { border-color: var(--accent-error); }
      50% { border-color: rgba(239, 68, 68, 0.3); }
    }

    .lightning-icon {
      font-size: 48px;
    }

    .lightning-info {
      display: flex;
      align-items: baseline;
      gap: 8px;
    }

    .lightning-distance {
      font-size: 56px;
      font-weight: 700;
      color: var(--text-primary);
    }

    .lightning-unit {
      font-size: 18px;
      color: var(--text-muted);
    }

    .lightning-label {
      font-size: 14px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 1px;
    }

    .status-row {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    }

    .status-card {
      display: flex;
      flex-direction: column;
      gap: 4px;
      padding: 16px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
    }

    .status-label {
      font-size: 11px;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .status-value {
      font-size: 14px;
      font-weight: 500;
      color: var(--text-primary);
    }

    .status-value.safe { color: var(--accent-success); }
    .status-value.caution { color: var(--accent-warning); }
    .status-value.danger { color: var(--accent-error); }

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
      margin: 0;
    }

    .open-btn {
      width: 100%;
      padding: 12px;
      margin-bottom: 20px;
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      color: var(--text-primary);
      font-size: 14px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-normal);
    }

    .open-btn:hover {
      background-color: var(--bg-hover);
      border-color: var(--accent-primary);
    }

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
  private unsubscribe?: () => void;

  constructor(private electronService: ElectronService) {}

  async ngOnInit(): Promise<void> {
    // Get initial cached status
    const result = await this.electronService.getWeatherStatus();
    if (result.success && result.data) {
      this.applyStatus(result.data);
    }

    // Subscribe to live updates
    this.unsubscribe = this.electronService.onWeatherStatusChange((status) => {
      this.applyStatus(status);
    });
  }

  ngOnDestroy(): void {
    this.unsubscribe?.();
  }

  private applyStatus(status: WeatherStatus): void {
    this.lightningDistance = status.lightningDistance ?? null;
    this.unit = status.unit || 'mi';
    this.lastUpdate = status.lastUpdate || '';
  }

  openWeatherPage(): void {
    this.electronService.openWebView('weather', 'https://www.weatherbug.com/alerts/lightning/elwood-il-60421/');
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
}
