import { Component, Input, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AppStatus, APP_DISPLAY_NAME, ElectronService } from '../../../services/electron.service';

type SizeTier = 'compact' | 'large';

interface WrSummary {
  id: number;
  workScope: string;
  location: string;
  date: string;
  time: string;
  company: string;
  status: string;
}

interface PackageSummary {
  id: number;
  permitNumber: string;
  workScope: string;
  location: string;
  status: string;
  date: string;
}

const SPRING_BOOT_PORT = 8082;

@Component({
  selector: 'app-permits-widget',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="feature-card permits-card" [class.disabled]="status.state !== 'running'"
         [class.compact]="tier === 'compact'">

      <!-- COMPACT (1x1) -->
      <ng-container *ngIf="tier === 'compact'">
        <div class="compact-header">
          <span class="material-icons compact-icon" style="color: #8b5cf6">assignment</span>
          <h3>Permits</h3>
        </div>
        <div class="compact-counts" *ngIf="activeWorkRequestCount || newWorkRequestCount">
          <span class="count-badge active-badge" *ngIf="activeWorkRequestCount">{{ activeWorkRequestCount }}</span>
          <span class="count-badge new-badge" *ngIf="newWorkRequestCount">{{ newWorkRequestCount }}*</span>
          <span class="count-label">WRs</span>
        </div>
        <div class="compact-row" *ngIf="upcomingWrs.length > 0">
          <span class="material-icons mini-icon">schedule</span>
          {{ upcomingWrs.length }} upcoming (24h)
        </div>
        <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
          {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
        </span>
      </ng-container>

      <!-- LARGE -->
      <ng-container *ngIf="tier === 'large'">
        <div class="header-row">
          <div class="header-left">
            <span class="material-icons header-icon" style="color: #8b5cf6">assignment</span>
            <h3>Permits</h3>
          </div>
          <div class="header-badges" *ngIf="status.state === 'running'">
            <span class="count-badge active-badge" *ngIf="activeWorkRequestCount" title="Active WRs">{{ activeWorkRequestCount }}</span>
            <span class="count-badge new-badge" *ngIf="newWorkRequestCount" title="New WRs">{{ newWorkRequestCount }}*</span>
          </div>
        </div>

        <ng-container *ngIf="status.state === 'running'">
          <div class="content-body" [class.horizontal]="isWide">
            <!-- Left / Top column: Upcoming WRs -->
            <div class="section" *ngIf="upcomingWrs.length > 0">
              <span class="section-label">
                <span class="material-icons sl-icon">schedule</span> Upcoming (24h) &mdash; {{ upcomingWrs.length }}
              </span>
              <div class="item-list">
                <div class="item-row" *ngFor="let wr of upcomingWrs">
                  <span class="item-time">{{ wr.time || wr.date }}</span>
                  <span class="item-text">{{ wr.workScope }}</span>
                  <span class="item-loc" *ngIf="wr.location">{{ wr.location }}</span>
                </div>
              </div>
            </div>

            <!-- Right / Bottom column: Packages -->
            <div class="packages-col" *ngIf="activePackages.length > 0 || builtPackages.length > 0">
              <div class="section" *ngIf="activePackages.length > 0">
                <span class="section-label">
                  <span class="material-icons sl-icon">play_circle</span> Active ({{ activePackages.length }})
                </span>
                <div class="item-list">
                  <div class="item-row" *ngFor="let pkg of activePackages">
                    <span class="item-permit">#{{ pkg.permitNumber }}</span>
                    <span class="item-text">{{ pkg.workScope }}</span>
                    <span class="item-loc" *ngIf="pkg.location">{{ pkg.location }}</span>
                  </div>
                </div>
              </div>
              <div class="section" *ngIf="builtPackages.length > 0">
                <span class="section-label">
                  <span class="material-icons sl-icon">build_circle</span> Built ({{ builtPackages.length }})
                </span>
                <div class="item-list">
                  <div class="item-row" *ngFor="let pkg of builtPackages">
                    <span class="item-permit">#{{ pkg.permitNumber }}</span>
                    <span class="item-text">{{ pkg.workScope }}</span>
                    <span class="item-loc" *ngIf="pkg.location">{{ pkg.location }}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Empty state -->
          <div class="empty-hint" *ngIf="upcomingWrs.length === 0 && activePackages.length === 0 && builtPackages.length === 0 && !loading">
            No upcoming work requests or active packages
          </div>

          <!-- Links -->
          <div class="nav-links" *ngIf="!editMode">
            <a class="nav-link" [routerLink]="['/pid-app']" [queryParams]="{ path: 'permit-builder/work-requests' }">
              <span class="material-icons">description</span> WRs
            </a>
            <a class="nav-link" [routerLink]="['/pid-app']" [queryParams]="{ path: 'permit-builder/daily-packages' }">
              <span class="material-icons">folder</span> Packages
            </a>
            <a class="nav-link" [routerLink]="['/pid-app']" [queryParams]="{ path: 'loto/loto' }">
              <span class="material-icons">lock</span> LOTOs
            </a>
            <a class="nav-link sp-link" (click)="openSharePointWRs($event)">
              <span class="material-icons">open_in_new</span> SharePoint
            </a>
          </div>
        </ng-container>

        <div class="empty-hint" *ngIf="status.state !== 'running'">
          Requires {{ appName }}
        </div>
        <span class="feature-status" [class.requires-sb]="status.state !== 'running'">
          {{ status.state === 'running' ? 'Available' : 'Requires ' + appName }}
        </span>
      </ng-container>
    </div>
  `,
  styles: [`
    .feature-card {
      display: flex; flex-direction: column; gap: 8px; padding: 16px;
      background-color: var(--bg-card); border: 1px solid var(--border-color); border-radius: 12px;
      color: inherit; transition: all var(--transition-normal);
      overflow-y: auto; height: 100%; box-sizing: border-box;
    }
    .feature-card:hover { border-color: var(--accent-primary); box-shadow: var(--shadow-md); transform: translateY(-2px); }
    :host { display: block; height: 100%; }

    /* Compact */
    .compact-header { display: flex; align-items: center; gap: 6px; }
    .compact-icon { font-size: 20px; }
    .compact-header h3 { font-size: 13px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .compact-counts { display: flex; align-items: center; gap: 6px; margin-top: 2px; }
    .count-label { font-size: 11px; color: var(--text-muted); }
    .compact-row { display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted); }
    .mini-icon { font-size: 14px; }

    /* Shared */
    .count-badge {
      display: inline-flex; align-items: center; justify-content: center;
      min-width: 20px; height: 20px; border-radius: 10px; padding: 0 5px;
      font-size: 11px; font-weight: 700; color: #fff;
    }
    .count-badge.new-badge { background-color: var(--accent-warning); }
    .count-badge.active-badge { background-color: var(--accent-primary); }
    .feature-status { font-size: 11px; color: var(--accent-success); margin-top: auto; }
    .feature-status.requires-sb { color: var(--text-muted); }

    /* Large */
    .header-row { display: flex; justify-content: space-between; align-items: center; }
    .header-left { display: flex; align-items: center; gap: 8px; }
    .header-icon { font-size: 24px; }
    .header-left h3 { font-size: 15px; font-weight: 600; color: var(--text-primary); margin: 0; }
    .header-badges { display: flex; gap: 4px; }

    /* Content body — horizontal when wide */
    .content-body { display: flex; flex-direction: column; gap: 6px; flex: 1; min-height: 0; }
    .content-body.horizontal { flex-direction: row; gap: 12px; }
    .content-body.horizontal > * { flex: 1; min-width: 0; }
    .packages-col { display: flex; flex-direction: column; gap: 6px; }

    .section { }
    .section-label {
      display: flex; align-items: center; gap: 4px;
      font-size: 10px; font-weight: 600; color: var(--text-muted);
      text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 3px;
    }
    .sl-icon { font-size: 14px; }

    .item-list { display: flex; flex-direction: column; gap: 1px; }
    .item-row {
      display: flex; align-items: center; gap: 6px; font-size: 11px;
      padding: 2px 6px; border-radius: 4px;
    }
    .item-row:hover { background: var(--bg-secondary); }
    .item-time { color: var(--accent-warning); font-weight: 600; font-size: 10px; min-width: 36px; flex-shrink: 0; }
    .item-permit { color: var(--accent-primary); font-weight: 600; font-size: 10px; flex-shrink: 0; }
    .item-text { color: var(--text-secondary); flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .item-loc { color: var(--text-muted); font-size: 10px; flex-shrink: 0; max-width: 120px; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }

    .empty-hint { font-size: 11px; color: var(--text-muted); padding: 4px 0; }

    .nav-links { display: flex; gap: 6px; margin-top: auto; padding-top: 6px; border-top: 1px solid var(--border-color); }
    .nav-link {
      display: flex; align-items: center; gap: 4px; font-size: 11px; color: var(--text-muted);
      text-decoration: none; padding: 3px 8px; border-radius: 6px; background: var(--bg-secondary);
      cursor: pointer; transition: all 150ms;
    }
    .nav-link:hover { color: var(--accent-primary); border-color: var(--accent-primary); }
    .nav-link .material-icons { font-size: 14px; }

    .permits-card.disabled { opacity: 0.6; }
  `]
})
export class PermitsWidgetComponent implements OnInit, OnChanges {
  @Input() status: AppStatus = { state: 'stopped', port: 0, healthStatus: 'unknown' };
  @Input() activeWorkRequestCount: number | null = null;
  @Input() newWorkRequestCount: number | null = null;
  @Input() editMode = false;
  @Input() cols = 1;
  @Input() rows = 1;
  appName = APP_DISPLAY_NAME;

  upcomingWrs: WrSummary[] = [];
  activePackages: PackageSummary[] = [];
  builtPackages: PackageSummary[] = [];
  loading = false;
  private dataLoaded = false;

  get tier(): SizeTier {
    if (this.cols >= 2 || this.rows >= 2) return 'large';
    return 'compact';
  }

  get isWide(): boolean { return this.cols >= 2; }

  get truncLen(): number {
    if (this.cols >= 3) return 60;
    if (this.cols >= 2) return 40;
    return 25;
  }

  private readonly SP_WR_URL = 'https://jpowerusa.sharepoint.com/sites/JG/Lists/Work%20Requests/AllItems.aspx?env=WebViewList';

  constructor(private electronService: ElectronService) {}

  openSharePointWRs(event: Event): void {
    event.stopPropagation();
    this.electronService.openExternal(this.SP_WR_URL);
  }

  ngOnInit(): void {
    if (this.status.state === 'running') this.loadData();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['status']) {
      const prev = changes['status'].previousValue as AppStatus | undefined;
      if (prev?.state !== 'running' && this.status.state === 'running' && !this.dataLoaded) {
        this.loadData();
      }
    }
  }

  private async loadData(): Promise<void> {
    if (this.loading || this.status.state !== 'running') return;
    this.loading = true;
    try {
      const [wrs, packages] = await Promise.all([
        this.fetchUpcomingWrs(),
        this.fetchPackages(),
      ]);
      this.upcomingWrs = wrs;
      this.activePackages = packages.filter(p => p.status === 'Active');
      this.builtPackages = packages.filter(p => p.status === 'Built');
      this.dataLoaded = true;
    } catch (err) {
      console.error('[Permits Widget] Failed to load data:', err);
    } finally {
      this.loading = false;
    }
  }

  private async fetchUpcomingWrs(): Promise<WrSummary[]> {
    try {
      const res = await fetch(`http://localhost:${SPRING_BOOT_PORT}/ng/work-requests/get-all-by-status/Active`);
      if (!res.ok) return [];
      const data = await res.json();
      const list: any[] = data.responseData || [];

      const now = new Date();
      const cutoff = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      return list
        .filter(wr => {
          if (!wr.dateOfWorkToBePerformed) return false;
          const wrDate = new Date(wr.dateOfWorkToBePerformed);
          return wrDate >= now && wrDate <= cutoff;
        })
        .map(wr => ({
          id: wr.id,
          workScope: wr.workScope || '',
          location: wr.location || wr.workArea?.name || '',
          date: wr.dateOfWorkToBePerformed || '',
          time: wr.timeOfWorkToBePerformed || '',
          company: wr.company || '',
          status: wr.status || '',
        }));
    } catch {
      return [];
    }
  }

  private async fetchPackages(): Promise<PackageSummary[]> {
    try {
      const res = await fetch(`http://localhost:${SPRING_BOOT_PORT}/ng/daily-permit-packages`);
      if (!res.ok) return [];
      const data = await res.json();
      const list: any[] = data.responseData || [];

      return list
        .filter(pkg => pkg.packageStatus?.name === 'Active' || pkg.packageStatus?.name === 'Built')
        .map(pkg => {
          // Extract work scope from work requests within the package
          const wrs: any[] = pkg.workRequests || [];
          const workScope = wrs.map((wr: any) => wr.workScope || '').filter(Boolean).join('; ') || pkg.name || '';
          const location = wrs.map((wr: any) => wr.location || wr.workArea?.name || '').filter(Boolean)[0] || '';

          return {
            id: pkg.id,
            permitNumber: pkg.permitNumber || '',
            workScope,
            location,
            status: pkg.packageStatus?.name || '',
            date: pkg.date || '',
          };
        });
    } catch {
      return [];
    }
  }
}
