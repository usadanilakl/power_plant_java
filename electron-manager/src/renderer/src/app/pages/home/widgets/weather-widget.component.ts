import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { WeatherStatus, WeatherForecast, PerryWeatherStatus } from '../../../services/electron.service';

@Component({
  selector: 'app-weather-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <a class="feature-card" [routerLink]="editMode ? null : '/weather'" [class.no-navigate]="editMode">
      <div class="feature-icon"><span class="material-icons" style="color: #f59e0b">thunderstorm</span></div>
      <div class="feature-info">
        <h3>Weather</h3>
        <p class="feature-desc">Lightning and weather monitoring</p>
        <div class="weather-snippets" *ngIf="weatherStatus?.status === 'available' || perryStatus?.status === 'available' || weatherForecast?.status === 'available'">
          <div class="lightning-snippet" *ngIf="weatherStatus?.status === 'available' && weatherStatus?.lightningDistance">
            <span class="lightning-badge" [class]="lightningLevel">{{ weatherStatus?.lightningDistance }} {{ weatherStatus?.unit || 'mi' }}</span>
            WB: {{ lightningLabel }}
          </div>
          <div class="lightning-snippet" *ngIf="perryStatus?.status === 'available' && perryStatus?.lightningDistance">
            <span class="lightning-badge" [class]="perryLightningLevel">{{ perryStatus?.lightningDistance }}</span>
            Perry: {{ perryStatus?.lightningStatus }}
            <span class="perry-timer-badge" *ngIf="perryStatus?.lightningTimer">{{ perryStatus!.lightningTimer }}</span>
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
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 12px; padding: 20px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      text-decoration: none; color: inherit; transition: all var(--transition-normal); cursor: pointer;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    .feature-card.no-navigate { pointer-events: none; }
    :host { flex: 1; display: flex; flex-direction: column; }
    .feature-card { flex: 1; }
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
}
