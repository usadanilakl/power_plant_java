import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { TrendWindowComponent } from '../../../shared/trend-chart/trend-window.component';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProTrendAdapterService } from '../services/etapro-trend-adapter.service';
import { EtaProLiveComponent } from '../etapro-live/etapro-live.component';
import { EtaProHistoryComponent } from '../etapro-history/etapro-history.component';
import { EtaProPointsComponent } from '../etapro-points/etapro-points.component';
import { EtaProEpLogComponent } from '../etapro-eplog/etapro-eplog.component';

@Component({
  selector: 'app-etapro-page',
  standalone: true,
  imports: [
    CommonModule,
    MainLayoutComponent,
    RouterMenuComponent,
    TrendWindowComponent,
    EtaProLiveComponent,
    EtaProHistoryComponent,
    EtaProPointsComponent,
    EtaProEpLogComponent,
  ],
  template: `
    <app-main-layout>
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <ng-container main-content>
        <div class="etapro-content">
          <div class="tab-bar">
            <button [class.active]="stateService.activeTab() === 'trend'"
                    (click)="stateService.activeTab.set('trend')">Trend</button>
            <button [class.active]="stateService.activeTab() === 'live'"
                    (click)="stateService.activeTab.set('live')">Live</button>
            <button [class.active]="stateService.activeTab() === 'history'"
                    (click)="stateService.activeTab.set('history')">History</button>
            <button [class.active]="stateService.activeTab() === 'eplog'"
                    (click)="stateService.activeTab.set('eplog')">Operator Log</button>
            <button [class.active]="stateService.activeTab() === 'points'"
                    (click)="stateService.activeTab.set('points')">Points</button>
          </div>

          <div class="tab-content">
            @switch (stateService.activeTab()) {
              @case ('trend') {
                <app-trend-window
                  [adapter]="trendAdapter"
                  [seriesIds]="stateService.trendPointIds()"
                  [initialPreset]="'60m'"
                  (pointsChange)="stateService.trendPointIds.set($event)">
                </app-trend-window>
              }
              @case ('live') {
                <app-etapro-live></app-etapro-live>
              }
              @case ('history') {
                <app-etapro-history></app-etapro-history>
              }
              @case ('eplog') {
                <app-etapro-eplog></app-etapro-eplog>
              }
              @case ('points') {
                <app-etapro-points></app-etapro-points>
              }
            }
          </div>
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .etapro-content {
      display: flex; flex-direction: column; flex: 1; min-height: 0; height: 100%; overflow: hidden;
    }
    .tab-bar { display: flex; gap: 4px; flex-shrink: 0; margin-bottom: 8px; }
    .tab-bar button {
      padding: 8px 20px; border: 1px solid var(--border-color); border-radius: 4px 4px 0 0;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px;
      border-bottom: 2px solid transparent;
    }
    .tab-bar button.active {
      background: var(--accent-color); color: var(--header-text);
      border-color: var(--accent-color); border-bottom-color: var(--accent-color);
    }
    .tab-bar button:hover:not(.active) { background: var(--hover-background); }
    .tab-content {
      flex: 1; min-height: 0; overflow: hidden;
      display: flex; flex-direction: column;
    }
    .tab-content > * { flex: 1; min-height: 0; }
  `]
})
export class EtaProPageComponent {
  stateService = inject(EtaProStateService);
  trendAdapter = inject(EtaProTrendAdapterService);
}
