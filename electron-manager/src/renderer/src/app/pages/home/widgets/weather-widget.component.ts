import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WeatherStatus, WeatherForecast, PerryWeatherStatus } from '../../../services/electron.service';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/weather'" [class.no-navigate]="editMode"
       [class.expanded]="isExpanded">
      <div class="feature-icon"><span class="material-icons" style="color: #f59e0b">thunderstorm</span></div>
      <div class="feature-info">
        <h3>Weather</h3>
        <p class="feature-desc">Lightning and weather monitoring</p>

        <div class="weather-snippets" *ngIf="weatherStatus?.status === 'available' || perryStatus?.status === 'available' || weatherForecast?.status === 'available'">
          <!-- WeatherBug lightning -->
          <div class="lightning-snippet" *ngIf="weatherStatus?.status === 'available' && weatherStatus?.lightningDistance">
            <span class="lightning-badge" [class]="lightningLevel">{{ weatherStatus?.lightningDistance }} {{ weatherStatus?.unit || 'mi' }}</span>
            WB: {{ lightningLabel }}
          </div>

          <!-- Perry lightning -->
          <div class="lightning-snippet" *ngIf="perryStatus?.status === 'available' && perryStatus?.lightningDistance">
            <span class="lightning-badge" [class]="perryLightningLevel">{{ perryStatus?.lightningDistance }}</span>
            Perry: {{ perryStatus?.lightningStatus }}
            <span class="perry-timer-badge" *ngIf="perryStatus?.lightningTimer">{{ perryStatus!.lightningTimer }}</span>
          </div>

          <!-- Temperature -->
          <div class="temp-snippet" *ngIf="weatherForecast?.status === 'available'">
            {{ weatherForecast!.current.temperature | number:'1.0-0' }}&deg;F &middot; {{ forecastDesc }}
          </div>

          <!-- Expanded: additional forecast detail -->
          <ng-container *ngIf="isExpanded && weatherForecast?.status === 'available'">
            <div class="expanded-section">
              <div class="detail-row" *ngIf="weatherForecast!.current.windSpeed != null">
                <span class="material-icons detail-icon">air</span>
                <span>Wind: {{ weatherForecast!.current.windSpeed | number:'1.0-0' }} mph</span>
              </div>
              <div class="detail-row" *ngIf="weatherForecast!.current.humidity != null">
                <span class="material-icons detail-icon">water_drop</span>
                <span>Humidity: {{ weatherForecast!.current.humidity }}%</span>
              </div>
              <div class="detail-row" *ngIf="weatherForecast!.current.apparentTemperature != null">
                <span class="material-icons detail-icon">thermostat</span>
                <span>Feels like: {{ weatherForecast!.current.apparentTemperature | number:'1.0-0' }}&deg;F</span>
              </div>
            </div>

            <!-- Hourly forecast preview -->
            <div class="hourly-section" *ngIf="hourlyItems.length > 0">
              <span class="section-label">Next hours</span>
              <div class="hourly-row">
                <div class="hourly-item" *ngFor="let h of hourlyItems">
                  <span class="hourly-time">{{ h.time }}</span>
                  <span class="hourly-temp">{{ h.temp }}&deg;</span>
                </div>
              </div>
            </div>
          </ng-container>
        </div>

        <div class="lightning-snippet loading" *ngIf="weatherStatus?.status === 'loading' && !weatherForecast">
          Loading...
        </div>
      </div>
      <span class="feature-status available">Independent</span>
    </a>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 12px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
      overflow-y: auto;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
    :host { display: block; height: 100%; }
    .feature-card { height: 100%; box-sizing: border-box; }
    .feature-icon { font-size: 28px; }
    .feature-info h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .feature-desc { font-size: 12px; color: var(--text-muted); margin: 4px 0 0; }
    .feature-status { font-size: 11px; color: var(--accent-success); }
    .weather-snippets { margin-top: 4px; display: flex; flex-direction: column; gap: 3px; }
    .lightning-snippet { font-size: 12px; color: var(--text-secondary); display: flex; align-items: center; gap: 6px; }
    .lightning-snippet.loading { color: var(--text-muted); margin-top: 4px; }
    .temp-snippet { font-size: 12px; color: var(--text-muted); }
    .lightning-badge {
      display: inline-flex; align-items: center; justify-content: center;
      padding: 2px 8px; border-radius: 10px; font-size: 11px; font-weight: 700; color: #fff;
    }
    .lightning-badge.safe { background-color: var(--accent-success); }
    .lightning-badge.caution { background-color: var(--accent-warning); }
    .lightning-badge.danger { background-color: var(--accent-error); }
    .perry-timer-badge { font-size: 11px; font-weight: 700; color: var(--accent-error); margin-left: 2px; }

    .expanded-section { display: flex; flex-direction: column; gap: 4px; margin-top: 6px; padding-top: 6px; border-top: 1px solid var(--border-color); }
    .detail-row { display: flex; align-items: center; gap: 6px; font-size: 12px; color: var(--text-secondary); }
    .detail-icon { font-size: 15px; color: var(--text-muted); }
    .section-label { font-size: 11px; font-weight: 600; color: var(--text-muted); margin-top: 6px; }
    .hourly-row { display: flex; gap: 8px; margin-top: 4px; }
    .hourly-item { display: flex; flex-direction: column; align-items: center; gap: 2px; }
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

  get isExpanded(): boolean { return this.cols >= 2 || this.rows >= 2; }

  get hourlyItems(): { time: string; temp: string }[] {
    const h = this.weatherForecast?.hourly;
    if (!h || !h.time?.length) return [];
    const count = this.cols >= 2 ? 6 : 3;
    return h.time.slice(0, count).map((t, i) => ({
      time: this.formatHour(t),
      temp: Math.round(h.temperature[i]).toString(),
    }));
  }

  private formatHour(time: string): string {
    try {
      return new Date(time).toLocaleTimeString('en-US', { hour: 'numeric', hour12: true });
    } catch { return ''; }
  }
}
