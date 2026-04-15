import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WeatherStatus, WeatherForecast, PerryWeatherStatus } from '../../../services/electron.service';

type SizeTier = 'compact' | 'standard' | 'large';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/weather'" [class.no-navigate]="editMode"
       [class.compact]="tier === 'compact'" [class.large]="tier === 'large'">

      <!-- COMPACT (1x1) -->
      <ng-container *ngIf="tier === 'compact'">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #f59e0b">thunderstorm</span>
          <h3>Weather</h3>
        </div>
        <ng-container *ngIf="hasAnyData">
          <div class="compact-metric" *ngIf="weatherStatus?.status === 'available' && weatherStatus?.lightningDistance">
            <span class="lightning-badge large-badge" [class]="lightningLevel">{{ weatherStatus!.lightningDistance }} {{ weatherStatus?.unit || 'mi' }}</span>
            <span class="compact-label">{{ lightningLabel }}</span>
          </div>
          <div class="compact-row" *ngIf="weatherForecast?.status === 'available'">
            {{ weatherForecast!.current.temperature | number:'1.0-0' }}&deg;F &middot; {{ forecastDesc }}
          </div>
        </ng-container>
        <div class="empty-hint" *ngIf="!hasAnyData">
          <span class="material-icons empty-icon">cloud_off</span>
          <span>Waiting for data...</span>
        </div>
        <span class="feature-status available">Independent</span>
      </ng-container>

      <!-- STANDARD (2x1 or 1x2) -->
      <ng-container *ngIf="tier === 'standard'">
        <div class="feature-icon"><span class="material-icons" style="color: #f59e0b">thunderstorm</span></div>
        <div class="feature-info">
          <h3>Weather</h3>
          <p class="feature-desc">Lightning and weather monitoring</p>
          <ng-container *ngIf="hasAnyData">
            <div class="weather-snippets">
              <div class="lightning-snippet" *ngIf="weatherStatus?.status === 'available' && weatherStatus?.lightningDistance">
                <span class="lightning-badge" [class]="lightningLevel">{{ weatherStatus!.lightningDistance }} {{ weatherStatus?.unit || 'mi' }}</span>
                WB: {{ lightningLabel }}
              </div>
              <div class="lightning-snippet" *ngIf="perryStatus?.status === 'available' && perryStatus?.lightningDistance">
                <span class="lightning-badge" [class]="perryLightningLevel">{{ perryStatus!.lightningDistance }}</span>
                Perry: {{ perryStatus?.lightningStatus }}
                <span class="perry-timer-badge" *ngIf="perryStatus?.lightningTimer">{{ perryStatus!.lightningTimer }}</span>
              </div>
              <div class="temp-snippet" *ngIf="weatherForecast?.status === 'available'">
                {{ weatherForecast!.current.temperature | number:'1.0-0' }}&deg;F &middot; {{ forecastDesc }}
              </div>
              <div class="detail-row" *ngIf="weatherForecast?.status === 'available' && weatherForecast!.current.windSpeed != null">
                <span class="material-icons detail-icon">air</span>
                Wind: {{ weatherForecast!.current.windSpeed | number:'1.0-0' }} mph
              </div>
            </div>
          </ng-container>
          <div class="empty-hint" *ngIf="!hasAnyData">
            <span class="material-icons empty-icon">cloud_off</span>
            <span>No weather data available.</span>
          </div>
        </div>
        <span class="feature-status available">Independent</span>
      </ng-container>

      <!-- LARGE — layout adapts to shape -->
      <ng-container *ngIf="tier === 'large'">
        <ng-container *ngIf="hasAnyData">
          <!-- Hero lightning badges — always prominent -->
          <div class="hero-row" [class.vertical]="isVertical">
            <div class="hero-source" *ngIf="weatherStatus?.status === 'available' && weatherStatus?.lightningDistance">
              <div class="hero-badge-wrap" [class]="lightningLevel">
                <span class="hero-distance">{{ weatherStatus!.lightningDistance }}</span>
                <span class="hero-unit">{{ weatherStatus?.unit || 'mi' }}</span>
              </div>
              <div class="hero-detail">
                <span class="hero-status" [class]="lightningLevel">{{ lightningLabel }}</span>
                <span class="hero-label">WeatherBug</span>
              </div>
            </div>
            <div class="hero-source" *ngIf="perryStatus?.status === 'available' && perryStatus?.lightningDistance">
              <div class="hero-badge-wrap" [class]="perryLightningLevel">
                <span class="hero-distance">{{ perryStatus!.lightningDistance }}</span>
              </div>
              <div class="hero-detail">
                <span class="hero-status" [class]="perryLightningLevel">{{ perryStatus?.lightningStatus }}</span>
                <span class="hero-label">Perry
                  <span class="perry-timer-badge" *ngIf="perryStatus?.lightningTimer">{{ perryStatus!.lightningTimer }}</span>
                </span>
              </div>
            </div>

            <!-- All clear when no lightning -->
            <div class="hero-source" *ngIf="!hasLightning">
              <div class="hero-badge-wrap safe">
                <span class="material-icons" style="font-size: 28px">check_circle</span>
              </div>
              <div class="hero-detail">
                <span class="hero-status safe">All Clear</span>
                <span class="hero-label">No lightning detected</span>
              </div>
            </div>

            <!-- Temp — always shown alongside lightning -->
            <div class="hero-temp" *ngIf="weatherForecast?.status === 'available'">
              <span class="temp-big">{{ weatherForecast!.current.temperature | number:'1.0-0' }}&deg;</span>
              <span class="temp-desc">{{ forecastDesc }}</span>
            </div>
          </div>

          <!-- Secondary data -->
          <div class="secondary-row" [class.vertical]="isVertical">
            <div class="cond-chips" *ngIf="weatherForecast?.status === 'available'">
              <span class="cond-chip" *ngIf="weatherForecast!.current.windSpeed != null">
                <span class="material-icons chip-ico">air</span>{{ weatherForecast!.current.windSpeed | number:'1.0-0' }} mph
              </span>
              <span class="cond-chip" *ngIf="weatherForecast!.current.humidity != null">
                <span class="material-icons chip-ico">water_drop</span>{{ weatherForecast!.current.humidity }}%
              </span>
              <span class="cond-chip" *ngIf="weatherForecast!.current.apparentTemperature != null">
                <span class="material-icons chip-ico">device_thermostat</span>Feels {{ weatherForecast!.current.apparentTemperature | number:'1.0-0' }}&deg;
              </span>
            </div>
            <div class="hourly-row" *ngIf="hourlyItems.length > 0">
              <div class="hourly-item" *ngFor="let h of hourlyItems">
                <span class="hourly-time">{{ h.time }}</span>
                <span class="hourly-temp">{{ h.temp }}&deg;</span>
              </div>
            </div>
          </div>
        </ng-container>

        <div class="empty-state" *ngIf="!hasAnyData">
          <span class="material-icons empty-state-icon">cloud_off</span>
          <span class="empty-state-title">No Weather Data</span>
          <span class="empty-state-desc">Data loads automatically from WeatherBug and Perry Weather.</span>
        </div>
      </ng-container>
    </a>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 10px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      overflow-y: auto; height: 100%; box-sizing: border-box;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
    :host { display: block; height: 100%; }

    /* Empty */
    .empty-hint { display: flex; align-items: center; gap: 6px; font-size: 11px; color: var(--text-muted); margin-top: 4px; }
    .empty-icon { font-size: 16px; opacity: 0.5; }
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 6px; flex: 1; text-align: center; padding: 12px; }
    .empty-state-icon { font-size: 36px; color: var(--text-muted); opacity: 0.3; }
    .empty-state-title { font-size: 14px; font-weight: 600; color: var(--text-secondary); }
    .empty-state-desc { font-size: 12px; color: var(--text-muted); max-width: 300px; }

    /* Compact */
    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-metric { display: flex; align-items: center; gap: 8px; margin-top: 2px; }
    .compact-label { font-size: 11px; color: var(--text-secondary); }
    .compact-row { font-size: 11px; color: var(--text-muted); }
    .large-badge { padding: 3px 10px; font-size: 12px; }

    /* Standard */
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); margin-top: auto; }
    .weather-snippets { margin-top: 4px; display: flex; flex-direction: column; gap: 3px; }
    .lightning-snippet { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
    .temp-snippet { font-size: 12px; color: var(--text-muted); }
    .detail-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); margin-top: 2px; }
    .detail-icon { font-size: 15px; color: var(--text-muted); }
    .lightning-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; color: #fff;
    }
    .lightning-badge.safe { background-color: var(--accent-success); }
    .lightning-badge.caution { background-color: var(--accent-warning); }
    .lightning-badge.danger { background-color: var(--accent-error); }
    .perry-timer-badge { font-size: 11px; font-weight: 700; color: var(--accent-error); margin-left: 2px; }

    /* Large — hero row */
    .hero-row { display: flex; align-items: center; gap: 16px; flex-wrap: wrap; }
    .hero-row.vertical { flex-direction: column; align-items: stretch; gap: 10px; }
    .hero-source { display: flex; align-items: center; gap: 10px; }
    .hero-badge-wrap {
      display: flex; align-items: baseline; gap: 3px;
      padding: 6px 14px; border-radius: 12px; color: #fff; font-weight: 800;
    }
    .hero-badge-wrap.safe { background-color: var(--accent-success); }
    .hero-badge-wrap.caution { background-color: var(--accent-warning); }
    .hero-badge-wrap.danger { background-color: var(--accent-error); }
    .hero-distance { font-size: 24px; line-height: 1; }
    .hero-unit { font-size: 13px; font-weight: 600; opacity: 0.85; }
    .hero-detail { display: flex; flex-direction: column; }
    .hero-status { font-size: 14px; font-weight: 700; }
    .hero-status.safe { color: var(--accent-success); }
    .hero-status.caution { color: var(--accent-warning); }
    .hero-status.danger { color: var(--accent-error); }
    .hero-label { font-size: 10px; color: var(--text-muted); }
    .hero-temp { display: flex; flex-direction: column; align-items: flex-end; }
    .hero-row:not(.vertical) .hero-temp { margin-left: auto; }
    .hero-row.vertical .hero-temp { flex-direction: row; align-items: baseline; gap: 6px; }
    .temp-big { font-size: 28px; font-weight: 700; color: var(--text-primary); line-height: 1; }
    .temp-desc { font-size: 11px; color: var(--text-muted); }

    /* Secondary row */
    .secondary-row { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .secondary-row.vertical { flex-direction: column; align-items: stretch; }
    .cond-chips { display: flex; gap: 6px; flex-wrap: wrap; }
    .cond-chip {
      display: flex; align-items: center; gap: 3px; font-size: 11px; color: var(--text-secondary);
      padding: 3px 8px; background: var(--bg-secondary); border-radius: 6px;
    }
    .chip-ico { font-size: 14px; color: var(--text-muted); }
    .hourly-row { display: flex; gap: 6px; overflow-x: auto; }
    .secondary-row:not(.vertical) .hourly-row { margin-left: auto; }
    .hourly-item {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      padding: 4px 8px; background: var(--bg-secondary); border-radius: 6px; flex-shrink: 0;
    }
    .hourly-time { font-size: 10px; color: var(--text-muted); }
    .hourly-temp { font-size: 12px; font-weight: 600; color: var(--text-primary); }
  `]
})
export class WeatherWidgetComponent {
  @Input() weatherStatus: WeatherStatus | null = null;
  @Input() perryStatus: PerryWeatherStatus | null = null;
  @Input() weatherForecast: WeatherForecast | null = null;
  @Input() lightningLevel = '';
  @Input() lightningLabel = '';
  @Input() perryLightningLevel = '';
  @Input() forecastDesc = '';
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;

  get tier(): SizeTier {
    if (this.cols >= 2 || this.rows >= 2) return 'large';
    return 'compact';
  }

  get isVertical(): boolean { return this.cols === 1 && this.rows >= 2; }

  get hasAnyData(): boolean {
    return this.weatherStatus?.status === 'available' || this.perryStatus?.status === 'available' || this.weatherForecast?.status === 'available';
  }

  get hasLightning(): boolean {
    return (this.weatherStatus?.status === 'available' && !!this.weatherStatus?.lightningDistance) ||
           (this.perryStatus?.status === 'available' && !!this.perryStatus?.lightningDistance);
  }

  get hourlyItems(): { time: string; temp: string }[] {
    const h = this.weatherForecast?.hourly;
    if (!h || !h.time?.length) return [];
    const count = this.cols >= 3 ? 8 : this.cols >= 2 ? 6 : 4;
    return h.time.slice(0, count).map((t, i) => ({
      time: this.formatHour(t),
      temp: Math.round(h.temperature[i]).toString(),
    }));
  }

  private formatHour(time: string): string {
    try { return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true }); }
    catch { return ''; }
  }
}
