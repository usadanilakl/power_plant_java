import { Component, computed, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EtaProStateService } from '../services/etapro-state.service';
import { EtaProApiService } from '../services/etapro-api.service';
import { EtaProReadingDto } from '../../../models/etapro/etapro-reading.model';
import { EtaProPointDto } from '../../../models/etapro/etapro-point.model';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-etapro-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard">
      <!-- Scraper control bar -->
      <div class="control-bar">
        <div class="status-section">
          <span class="status-dot" [class.active]="scrapeStatus().processRunning"
                [class.busy]="scrapeStatus().scrapeInProgress"></span>
          <span class="status-text">{{ scrapeStatus().lastStatus }}</span>
        </div>
        <div class="control-actions">
          @if (!scrapeStatus().processRunning) {
            <button class="btn btn-start" (click)="onStartProcess()">Start Scraper</button>
          } @else {
            <button class="btn btn-stop" (click)="onStopProcess()">Stop</button>
          }
          <button class="btn btn-scrape" (click)="onManualScrape()"
                  [disabled]="scrapeStatus().scrapeInProgress">
            {{ scrapeStatus().scrapeInProgress ? 'Scraping...' : 'Scrape Now' }}
          </button>
        </div>
      </div>

      <!-- Reading cards grouped by category -->
      @if (latestReadings().length === 0) {
        <div class="empty-state">
          <p>No readings yet. Configure points in the Points tab and start the scraper.</p>
        </div>
      } @else {
        @for (category of categories(); track category) {
          <div class="category-group">
            <h3 class="category-header">{{ category || 'Uncategorized' }}</h3>
            <div class="cards-grid">
              @for (reading of readingsByCategory()[category]; track reading.pointId) {
                <div class="reading-card clickable" [class]="getFreshnessClass(reading)"
                     (click)="onCardClick(reading.pointId)" title="Click to view trend">
                  <div class="card-header">
                    <span class="point-id">{{ reading.pointId }}</span>
                    <span class="quality-badge" [class.good]="reading.quality === 'Good'"
                          [class.bad]="reading.quality !== 'Good'">{{ reading.quality }}</span>
                  </div>
                  <div class="card-value">
                    {{ reading.readingValue != null ? reading.readingValue.toFixed(2) : 'N/A' }}
                    <span class="unit">{{ getUnit(reading.pointId!) }}</span>
                  </div>
                  <div class="card-time">{{ formatTimestamp(reading.readingTime) }}</div>
                  <div class="card-desc">{{ getDescription(reading.pointId!) }}</div>
                </div>
              }
            </div>
          </div>
        }
      }
    </div>
  `,
  styles: [`
    :host { display: block; height: 100%; overflow: auto; }
    .dashboard { padding: 8px; }

    .control-bar {
      display: flex; justify-content: space-between; align-items: center;
      padding: 8px 12px; margin-bottom: 12px;
      background: var(--card-background); border: 1px solid var(--border-color); border-radius: 6px;
    }
    .status-section { display: flex; align-items: center; gap: 8px; }
    .status-dot {
      width: 10px; height: 10px; border-radius: 50%; background: #9e9e9e;
    }
    .status-dot.active { background: #4caf50; }
    .status-dot.busy { background: #ff9800; animation: pulse 1s infinite; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.4; } }
    .status-text { font-size: 13px; color: var(--secondary-text); }
    .control-actions { display: flex; gap: 6px; }
    .btn {
      padding: 6px 14px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 13px;
    }
    .btn:hover { background: var(--hover-background); }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-start { background: #4caf50; color: white; border-color: #4caf50; }
    .btn-start:hover { background: #43a047; }
    .btn-stop { background: #f44336; color: white; border-color: #f44336; }
    .btn-stop:hover { background: #e53935; }
    .btn-scrape { background: var(--accent-color); color: var(--header-text); border-color: var(--accent-color); }

    .empty-state {
      text-align: center; padding: 60px 20px; color: var(--secondary-text);
    }

    .category-group { margin-bottom: 16px; }
    .category-header {
      font-size: 14px; font-weight: 600; color: var(--secondary-text);
      text-transform: uppercase; letter-spacing: 0.5px;
      margin: 0 0 8px 4px; padding-bottom: 4px;
      border-bottom: 1px solid var(--border-color);
    }
    .cards-grid {
      display: grid; grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 8px;
    }

    .reading-card {
      padding: 12px; border-radius: 6px;
      background: var(--card-background); border: 1px solid var(--border-color);
      border-left: 4px solid #4caf50;
    }
    .reading-card.stale { border-left-color: #ff9800; }
    .reading-card.old { border-left-color: #f44336; }
    .reading-card.clickable { cursor: pointer; transition: transform 0.1s; }
    .reading-card.clickable:hover { transform: translateY(-2px); box-shadow: 0 2px 4px rgba(0,0,0,0.1); }

    .card-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; }
    .point-id { font-size: 12px; font-weight: 600; color: var(--primary-text); }
    .quality-badge {
      font-size: 10px; padding: 2px 6px; border-radius: 8px; background: #e0e0e0;
    }
    .quality-badge.good { background: #e8f5e9; color: #2e7d32; }
    .quality-badge.bad { background: #ffebee; color: #c62828; }

    .card-value {
      font-size: 28px; font-weight: 700; color: var(--primary-text); line-height: 1.1;
    }
    .unit { font-size: 14px; font-weight: 400; color: var(--secondary-text); }

    .card-time { font-size: 11px; color: var(--secondary-text); margin-top: 4px; }
    .card-desc { font-size: 11px; color: var(--secondary-text); margin-top: 2px; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; }
  `]
})
export class EtaProDashboardComponent implements OnInit, OnDestroy {
  stateService = inject(EtaProStateService);
  private apiService = inject(EtaProApiService);

  latestReadings = this.stateService.latestReadings;
  scrapeStatus = this.stateService.scrapeStatus;

  points = toSignal(this.stateService.allPoints$, { initialValue: [] as EtaProPointDto[] });

  private pointMap = computed(() => {
    const map = new Map<string, EtaProPointDto>();
    for (const p of this.points()) {
      if (p.pointId) map.set(p.pointId, p);
    }
    return map;
  });

  categories = computed(() => {
    const cats = new Set<string>();
    for (const r of this.latestReadings()) {
      const point = this.pointMap().get(r.pointId || '');
      cats.add(point?.category || '');
    }
    return Array.from(cats).sort();
  });

  readingsByCategory = computed(() => {
    const grouped: { [key: string]: EtaProReadingDto[] } = {};
    for (const r of this.latestReadings()) {
      const point = this.pointMap().get(r.pointId || '');
      const cat = point?.category || '';
      if (!grouped[cat]) grouped[cat] = [];
      grouped[cat].push(r);
    }
    return grouped;
  });

  ngOnInit(): void {
    this.stateService.loadPoints();
    this.stateService.refreshLatestReadings();
    this.stateService.refreshStatus();
    this.stateService.startPolling(5000);
  }

  ngOnDestroy(): void {
    this.stateService.stopPolling();
  }

  getUnit(pointId: string): string {
    return this.pointMap().get(pointId)?.unit || '';
  }

  getDescription(pointId: string): string {
    return this.pointMap().get(pointId)?.description || '';
  }

  getFreshnessClass(reading: EtaProReadingDto): string {
    if (!reading.readingTime) return 'old';
    const age = Date.now() - new Date(reading.readingTime).getTime();
    if (age < 2 * 60 * 1000) return 'fresh';
    if (age < 5 * 60 * 1000) return 'stale';
    return 'old';
  }

  formatTimestamp(ts: string | null): string {
    if (!ts) return 'N/A';
    return new Date(ts).toLocaleString();
  }

  onStartProcess(): void {
    this.apiService.startProcess().subscribe(() => this.stateService.refreshStatus());
  }

  onStopProcess(): void {
    this.apiService.stopProcess().subscribe(() => this.stateService.refreshStatus());
  }

  onCardClick(pointId: string | null): void {
    if (pointId) {
      this.stateService.openTrend([pointId]);
    }
  }

  onManualScrape(): void {
    const end = new Date().toISOString().slice(0, 19);
    const start = new Date(Date.now() - 5 * 60 * 1000).toISOString().slice(0, 19);
    this.apiService.triggerScrape(start, end).subscribe(() => {
      this.stateService.refreshStatus();
      this.stateService.refreshLatestReadings();
    });
  }
}
