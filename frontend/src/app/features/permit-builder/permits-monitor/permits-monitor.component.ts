import { Component, OnInit, OnDestroy, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin, Subject } from 'rxjs';
import { debounceTime, takeUntil } from 'rxjs/operators';
import { CorrespondenceCellComponent } from '../../../shared/correspondence-dialog/correspondence-cell.component';
import { SpSyncToolbarComponent } from '../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';
import { WrDetailDialogService } from '../../../shared/wr-detail-dialog/wr-detail-dialog.service';
import { WorkRequestContextMenuService } from '../work-request/refactored/services/work-request-context-menu.service';
import { SyncUpdateService } from '../../../services/sync/sync-update.service';

interface WorkRequest {
  id: number;
  dateOfWorkToBePerformed: string | null;
  timeOfWorkToBePerformed: string | null;
  requestedBy: string | null;
  company: string | null;
  location: string | null;
  workScope: string | null;
  foreman: string | null;
  status: string | null;
  isHotWorkRequired: boolean | null;
  isLotoRequired: boolean | null;
  isConfinedSpaceEntryRequired: boolean | null;
}

interface HotWorkDto {
  id: number;
  date: string | null;
  location: string | null;
  workScope: string | null;
  foreman: string | null;
  permitStatus: { value: string } | null;
}

interface ConfinedSpaceDto {
  id: number;
  date: string | null;
  space: string | null;
  workScope: string | null;
  issuedTo: string | null;
  permitStatus: { value: string } | null;
}

interface ApiResponse<T> {
  responseData: T;
  message: string;
}

@Component({
  selector: 'app-permits-monitor',
  standalone: true,
  imports: [CommonModule, RouterModule, CorrespondenceCellComponent, SpSyncToolbarComponent],
  template: `
    <div class="monitor-container">
      <div class="monitor-header">
        <h1>Permits Monitor</h1>
        <nav class="monitor-nav">
          <a routerLink="/permits-monitor" routerLinkActive="nav-active" [routerLinkActiveOptions]="{ exact: true }">Overview</a>
          <a routerLink="/permit-builder/work-requests" routerLinkActive="nav-active">Work Requests</a>
          <a routerLink="/permit-builder/daily-packages" routerLinkActive="nav-active">Daily Packages</a>
          <a routerLink="/permit-builder/safe-works" routerLinkActive="nav-active">Safe Works</a>
          <a routerLink="/permit-builder/hot-works" routerLinkActive="nav-active">Hot Works</a>
          <a routerLink="/permit-builder/confined-spaces" routerLinkActive="nav-active">Confined Spaces</a>
          <a routerLink="/permit-builder/lotos" routerLinkActive="nav-active">LOTO</a>
          <a routerLink="/permit-builder/loto-board" routerLinkActive="nav-active">LOTO Board</a>
        </nav>
        <button class="refresh-btn" (click)="loadData()" [disabled]="loading">
          <span class="material-icons" [class.spinning]="loading">refresh</span>
        </button>
      </div>

      <app-sp-sync-toolbar
        entityType="WorkRequest"
        [entityIds]="displayedWrIds"
        (syncComplete)="loadData()"
      ></app-sp-sync-toolbar>

      <!-- Planning Section -->
      <section class="monitor-section">
        <h2 class="section-title">
          <span class="material-icons section-icon">schedule</span>
          Planning
        </h2>

        <div class="cards-row">
          <!-- Work Requests -->
          <div class="monitor-card">
            <div class="card-header">
              <span class="card-title">Work Requests</span>
              <span class="card-count">{{ activeWorkRequests.length + updatedWorkRequests.length }}</span>
            </div>
            <div class="card-badges">
              <span class="badge badge-active">{{ activeWorkRequests.length }} Active</span>
              <span class="badge badge-updated"
                    *ngIf="updatedWorkRequests.length">
                {{ updatedWorkRequests.length }} Updated
              </span>
              <span class="badge badge-processed clickable"
                    [class.badge-toggled]="showProcessed"
                    *ngIf="processedWorkRequests.length"
                    (click)="showProcessed = !showProcessed">
                {{ processedWorkRequests.length }} Processed
              </span>
              <span class="badge badge-expired clickable"
                    [class.badge-toggled]="showExpired"
                    *ngIf="expiredWorkRequests.length"
                    (click)="showExpired = !showExpired">
                {{ expiredWorkRequests.length }} Expired
              </span>
            </div>
            <div class="card-table" *ngIf="allWorkRequests.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Time</th>
                    <th>Requested By</th>
                    <th>Location</th>
                    <th>Work Scope</th>
                    <th class="icon-col" title="Hot Work">HW</th>
                    <th class="icon-col" title="Confined Space">CS</th>
                    <th class="icon-col" title="LOTO">LO</th>
                    <th>Responses</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let wr of allWorkRequests"
                      (click)="onRowLeftClick(wr)"
                      (contextmenu)="onRowRightClick($event, wr)"
                      style="cursor: pointer">
                    <td><span class="status-chip" [class]="'status-' + (wr.status || '').toLowerCase()">{{ wr.status }}</span></td>
                    <td>{{ wr.dateOfWorkToBePerformed | date:'shortDate' }}</td>
                    <td>{{ wr.timeOfWorkToBePerformed || '-' }}</td>
                    <td>{{ wr.requestedBy }}</td>
                    <td>{{ wr.location }}</td>
                    <td class="truncate">{{ wr.workScope }}</td>
                    <td class="icon-col"><span class="permit-icon hw" [class.active]="wr.isHotWorkRequired" [title]="wr.isHotWorkRequired ? 'Hot Work Required' : 'No Hot Work'">HW</span></td>
                    <td class="icon-col"><span class="permit-icon cs" [class.active]="wr.isConfinedSpaceEntryRequired" [title]="wr.isConfinedSpaceEntryRequired ? 'Confined Space Required' : 'No Confined Space'">CS</span></td>
                    <td class="icon-col"><span class="permit-icon lo" [class.active]="wr.isLotoRequired" [title]="wr.isLotoRequired ? 'LOTO Required' : 'No LOTO'">LO</span></td>
                    <td>
                      <app-correspondence-cell
                        [entityType]="'WorkRequest'"
                        [entityId]="wr.id">
                      </app-correspondence-cell>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-empty" *ngIf="allWorkRequests.length === 0 && !loading">No work requests</div>
          </div>

          <!-- Daily Packages -->
          <div class="monitor-card">
            <div class="card-header">
              <span class="card-title">Daily Packages</span>
              <span class="card-count">{{ activePackages.length + buildingPackages.length }}</span>
            </div>
            <div class="card-badges">
              <span class="badge badge-active">{{ activePackages.length }} Active</span>
              <span class="badge badge-building" *ngIf="buildingPackages.length">{{ buildingPackages.length }} Building</span>
              <span class="badge badge-closed" *ngIf="recentlyClosedPackages.length">{{ recentlyClosedPackages.length }} Recently Closed</span>
            </div>
            <div class="card-table" *ngIf="activePackages.length > 0 || buildingPackages.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Permit #</th>
                    <th>Name</th>
                    <th>Company</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let pkg of activePackages.concat(buildingPackages)"
                      [routerLink]="['/permit-builder/daily-packages']"
                      [queryParams]="{packageId: pkg.id}"
                      style="cursor: pointer">
                    <td>
                      <span class="status-chip" [class]="'status-' + (pkg.packageStatus?.name || 'building').toLowerCase()">
                        {{ pkg.packageStatus?.name === 'Test' ? 'Paused' : (pkg.packageStatus?.name || 'Building') }}
                      </span>
                    </td>
                    <td>{{ pkg.permitNumber }}</td>
                    <td class="truncate">{{ pkg.name }}</td>
                    <td>{{ pkg.companyName }}</td>
                    <td>{{ pkg.date }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-empty" *ngIf="activePackages.length === 0 && buildingPackages.length === 0 && !loading">No active packages</div>
          </div>
        </div>
      </section>

      <!-- Active Section -->
      <section class="monitor-section">
        <h2 class="section-title">
          <span class="material-icons section-icon">play_circle</span>
          Active
        </h2>

        <div class="cards-row">
          <!-- Work Locations -->
          <div class="monitor-card card-compact">
            <div class="card-header">
              <span class="card-title">Work Locations</span>
              <span class="card-count">{{ uniqueLocations.length }}</span>
            </div>
            <div class="chip-list" *ngIf="uniqueLocations.length > 0">
              <span class="chip" *ngFor="let loc of uniqueLocations">{{ loc }}</span>
            </div>
            <div class="card-empty" *ngIf="uniqueLocations.length === 0 && !loading">None</div>
          </div>

          <!-- Foremen -->
          <div class="monitor-card card-compact">
            <div class="card-header">
              <span class="card-title">Foremen in Charge</span>
              <span class="card-count">{{ uniqueForemen.length }}</span>
            </div>
            <div class="chip-list" *ngIf="uniqueForemen.length > 0">
              <span class="chip" *ngFor="let f of uniqueForemen">{{ f }}</span>
            </div>
            <div class="card-empty" *ngIf="uniqueForemen.length === 0 && !loading">None</div>
          </div>
        </div>

        <div class="cards-row">
          <!-- Active Confined Spaces -->
          <div class="monitor-card">
            <div class="card-header">
              <span class="card-title">Active Confined Spaces</span>
              <span class="card-count">{{ activeConfinedSpaces.length }}</span>
            </div>
            <div class="card-table" *ngIf="activeConfinedSpaces.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Space</th>
                    <th>Work Scope</th>
                    <th>Issued To</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let cs of activeConfinedSpaces">
                    <td>{{ cs.space }}</td>
                    <td class="truncate">{{ cs.workScope }}</td>
                    <td>{{ cs.issuedTo }}</td>
                    <td>{{ cs.date | date:'shortDate' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-empty" *ngIf="activeConfinedSpaces.length === 0 && !loading">None</div>
          </div>

          <!-- Active Hot Works -->
          <div class="monitor-card">
            <div class="card-header">
              <span class="card-title">Active Hot Works</span>
              <span class="card-count">{{ activeHotWorks.length }}</span>
            </div>
            <div class="card-table" *ngIf="activeHotWorks.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Location</th>
                    <th>Work Scope</th>
                    <th>Foreman</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let hw of activeHotWorks">
                    <td>{{ hw.location }}</td>
                    <td class="truncate">{{ hw.workScope }}</td>
                    <td>{{ hw.foreman }}</td>
                    <td>{{ hw.date | date:'shortDate' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-empty" *ngIf="activeHotWorks.length === 0 && !loading">None</div>
          </div>
        </div>
      </section>

      <div class="loading-overlay" *ngIf="loading">
        <span class="material-icons spinning">refresh</span>
        <span>Loading...</span>
      </div>
    </div>

  `,
  styles: [`
    :host {
      display: block;
      height: 100%;
      overflow: auto;
    }

    .monitor-container {
      padding: 24px;
      max-width: 1400px;
      margin: 0 auto;
      position: relative;
    }

    .monitor-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }

    .monitor-header h1 {
      font-size: 24px;
      font-weight: 600;
      color: var(--primary-text);
      margin: 0;
    }

    .monitor-nav {
      display: flex;
      gap: 4px;
      background: var(--secondary-background);
      border-radius: 8px;
      padding: 4px;
    }

    .monitor-nav a {
      padding: 6px 14px;
      border-radius: 6px;
      font-size: 13px;
      font-weight: 500;
      color: var(--secondary-text);
      text-decoration: none;
      transition: all 150ms ease;
    }

    .monitor-nav a:hover {
      background: var(--hover-color);
      color: var(--primary-text);
    }

    .monitor-nav a.nav-active {
      background: var(--accent-color);
      color: #fff;
    }

    .refresh-btn {
      background: none;
      border: 1px solid var(--border-color);
      border-radius: 6px;
      padding: 6px 10px;
      cursor: pointer;
      color: var(--secondary-text);
      display: flex;
      align-items: center;
    }

    .refresh-btn:hover {
      background: var(--hover-color);
      color: var(--primary-text);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .spinning {
      animation: spin 1s linear infinite;
    }

    @keyframes spin {
      100% { transform: rotate(360deg); }
    }

    .monitor-section {
      margin-bottom: 32px;
    }

    .section-title {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 18px;
      font-weight: 600;
      color: var(--primary-text);
      margin: 0 0 16px;
      padding-bottom: 8px;
      border-bottom: 2px solid var(--accent-color);
    }

    .section-icon {
      font-size: 22px;
      color: var(--accent-color);
    }

    .cards-row {
      display: flex;
      gap: 16px;
      margin-bottom: 16px;
    }

    .monitor-card {
      flex: 1;
      background: var(--card-background);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
      box-shadow: var(--card-shadow);
    }

    .monitor-card.full-width {
      flex: 1 1 100%;
    }

    .monitor-card.card-compact {
      min-height: 80px;
    }

    .card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;
    }

    .card-title {
      font-size: 14px;
      font-weight: 600;
      color: var(--primary-text);
    }

    .card-count {
      font-size: 20px;
      font-weight: 700;
      color: var(--accent-color);
    }

    .card-badges {
      display: flex;
      gap: 8px;
      margin-bottom: 12px;
    }

    .badge {
      font-size: 12px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
    }

    .badge.clickable {
      cursor: pointer;
      opacity: 0.6;
      transition: all 150ms ease;
    }

    .badge.clickable:hover {
      opacity: 0.85;
    }

    .badge.badge-toggled {
      opacity: 1;
      box-shadow: 0 0 0 2px var(--accent-color, #3b82f6);
    }

    .badge-active {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .badge-processed {
      background-color: #d1fae5;
      color: #065f46;
    }

    .badge-updated {
      background-color: #fef3c7;
      color: #92400e;
    }

    .badge-expired {
      background-color: #fecaca;
      color: #991b1b;
    }

    .card-table {
      overflow-x: auto;
    }

    .card-table table {
      width: 100%;
      border-collapse: collapse;
      font-size: 13px;
    }

    .card-table th {
      text-align: left;
      padding: 6px 10px;
      font-weight: 600;
      color: var(--secondary-text);
      border-bottom: 1px solid var(--border-color);
      white-space: nowrap;
    }

    .card-table td {
      padding: 6px 10px;
      color: var(--primary-text);
      border-bottom: 1px solid var(--border-color);
    }

    .card-table tr:last-child td {
      border-bottom: none;
    }

    .card-table tr:hover td {
      background: var(--hover-color);
    }

    .truncate {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .icon-col {
      text-align: center;
      width: 32px;
      padding: 6px 2px !important;
    }

    .permit-icon {
      display: inline-block;
      font-size: 10px;
      font-weight: 700;
      padding: 2px 4px;
      border-radius: 3px;
      background: rgba(255,255,255,0.05);
      color: rgba(255,255,255,0.15);
      letter-spacing: 0.5px;
    }

    .permit-icon.active.hw {
      background: rgba(255, 87, 34, 0.2);
      color: #ff7043;
    }

    .permit-icon.active.cs {
      background: rgba(255, 193, 7, 0.2);
      color: #ffc107;
    }

    .permit-icon.active.lo {
      background: rgba(156, 39, 176, 0.2);
      color: #ce93d8;
    }

    .status-chip {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status-active {
      background-color: #dbeafe;
      color: #1e40af;
    }

    .status-processed {
      background-color: #d1fae5;
      color: #065f46;
    }

    .status-updated {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-expired {
      background-color: #fecaca;
      color: #991b1b;
    }

    .chip-list {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }

    .chip {
      font-size: 12px;
      padding: 4px 10px;
      border-radius: 14px;
      background: var(--secondary-background);
      color: var(--primary-text);
      border: 1px solid var(--border-color);
    }

    .card-empty {
      font-size: 13px;
      color: var(--secondary-text);
      font-style: italic;
    }

    .loading-overlay {
      position: absolute;
      top: 80px;
      left: 50%;
      transform: translateX(-50%);
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--secondary-text);
      font-size: 14px;
    }
  `]
})
export class PermitsMonitorComponent implements OnInit, OnDestroy {
  loading = false;

  activeWorkRequests: WorkRequest[] = [];
  updatedWorkRequests: WorkRequest[] = [];
  processedWorkRequests: WorkRequest[] = [];
  expiredWorkRequests: WorkRequest[] = [];
  activeHotWorks: HotWorkDto[] = [];
  activeConfinedSpaces: ConfinedSpaceDto[] = [];
  activePackages: any[] = [];
  buildingPackages: any[] = [];
  recentlyClosedPackages: any[] = [];

  showProcessed = false;
  showExpired = false;

  private apiUrl = environment.apiUrl;
  private destroy$ = new Subject<void>();
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

  private http = inject(HttpClient);
  private wrDetailDialogService = inject(WrDetailDialogService);
  private syncUpdateService = inject(SyncUpdateService);
  contextMenuService = inject(WorkRequestContextMenuService);

  ngOnInit(): void {
    this.loadData();
    this.setupReactiveUpdates();
    this.setupPeriodicRefresh();

    // Reload when WR detail dialog performs a status-changing action
    this.wrDetailDialogService.onAction$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => this.loadData());
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  get allWorkRequests(): WorkRequest[] {
    return [
      ...this.activeWorkRequests,
      ...this.updatedWorkRequests,
      ...(this.showProcessed ? this.processedWorkRequests : []),
      ...(this.showExpired ? this.expiredWorkRequests : [])
    ];
  }

  /** IDs of active + updated WRs — scoped verification target */
  get displayedWrIds(): number[] {
    return [...this.activeWorkRequests, ...this.updatedWorkRequests]
      .map(wr => wr.id)
      .filter((id): id is number => id != null);
  }

  get uniqueLocations(): string[] {
    const locations = this.activeWorkRequests
      .map(wr => wr.location)
      .filter((loc): loc is string => !!loc);
    return [...new Set(locations)];
  }

  get uniqueForemen(): string[] {
    const foremen = this.activeWorkRequests
      .map(wr => wr.foreman)
      .filter((f): f is string => !!f);
    return [...new Set(foremen)];
  }

  loadData(): void {
    this.loading = true;

    forkJoin({
      activeWr: this.http.get<ApiResponse<WorkRequest[]>>(`${this.apiUrl}/work-requests/get-all-by-status/Active`),
      updatedWr: this.http.get<ApiResponse<WorkRequest[]>>(`${this.apiUrl}/work-requests/get-all-by-status/Updated`),
      processedWr: this.http.get<ApiResponse<WorkRequest[]>>(`${this.apiUrl}/work-requests/get-all-by-status/Processed`),
      expiredWr: this.http.get<ApiResponse<WorkRequest[]>>(`${this.apiUrl}/work-requests/get-all-by-status/Expired`),
      hotWorks: this.http.get<ApiResponse<HotWorkDto[]>>(`${this.apiUrl}/hot-works/get-all-hot-work`),
      confinedSpaces: this.http.get<ApiResponse<ConfinedSpaceDto[]>>(`${this.apiUrl}/confined-spaces/get-all-confined-space`),
      packages: this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/daily-permit-packages`)
    }).subscribe({
      next: (results) => {
        this.activeWorkRequests = results.activeWr.responseData || [];
        this.updatedWorkRequests = results.updatedWr.responseData || [];
        this.processedWorkRequests = results.processedWr.responseData || [];
        this.expiredWorkRequests = results.expiredWr.responseData || [];

        const allHotWorks = results.hotWorks.responseData || [];
        this.activeHotWorks = allHotWorks.filter(hw =>
          hw.permitStatus?.value?.toLowerCase() === 'active'
        );

        const allConfinedSpaces = results.confinedSpaces.responseData || [];
        this.activeConfinedSpaces = allConfinedSpaces.filter(cs =>
          cs.permitStatus?.value?.toLowerCase() === 'active'
        );

        // Categorize packages
        const allPkgs = results.packages.responseData || [];
        this.activePackages = allPkgs.filter((p: any) => p.packageStatus?.name === 'Active' || p.packageStatus?.name === 'Test');
        this.buildingPackages = allPkgs.filter((p: any) => p.packageStatus?.name === 'Building' || !p.packageStatus);
        this.recentlyClosedPackages = allPkgs.filter((p: any) => p.packageStatus?.name === 'Closed')
          .sort((a: any, b: any) => (b.modifiedDate || '').localeCompare(a.modifiedDate || ''))
          .slice(0, 10);

        this.loading = false;
      },
      error: (err) => {
        console.error('[PermitsMonitor] Failed to load data:', err);
        this.loading = false;
      }
    });
  }

  // ====================== Reactive Updates ======================

  private setupReactiveUpdates(): void {
    this.syncUpdateService.getEntityTypeUpdates$('WorkRequest')
      .pipe(
        debounceTime(1000),
        takeUntil(this.destroy$)
      )
      .subscribe(() => {
        console.log('[PermitsMonitor] SSE update received, refreshing...');
        this.loadData();
      });
  }

  private setupPeriodicRefresh(): void {
    this.refreshIntervalId = setInterval(() => {
      if (!this.loading) {
        console.log('[PermitsMonitor] Periodic refresh');
        this.loadData();
      }
    }, 60000);
  }

  // ====================== Row Click Handlers ======================

  onRowLeftClick(wr: WorkRequest): void {
    this.wrDetailDialogService.open(wr.id);
  }

  onRowRightClick(event: MouseEvent, wr: WorkRequest): void {
    this.contextMenuService.showContextMenu(wr, event);
  }
}
