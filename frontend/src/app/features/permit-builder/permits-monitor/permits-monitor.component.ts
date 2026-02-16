import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { forkJoin } from 'rxjs';
import { ContextMenuComponent, ContextMenuAction } from '../../../shared/menu/context-menu/context-menu.component';
import { RfWorkRequestApiService } from '../work-request/refactored/services/rf-work-request-api.service';

interface WorkRequest {
  id: number;
  dateOfWorkToBePerformed: string | null;
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

interface LotoDto {
  id: number;
  boxNumber: string | null;
  equipmentSystem: string | null;
  lotoRequestor: string | null;
  date: string | null;
}

interface LotoPointDto {
  id: number;
  tagNumber: string | null;
  description: string | null;
  specificLocation: string | null;
  generalLocation: string | null;
  unit: string | null;
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
  imports: [CommonModule, RouterModule, ContextMenuComponent],
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
        </nav>
        <button class="refresh-btn" (click)="loadData()" [disabled]="loading">
          <span class="material-icons" [class.spinning]="loading">refresh</span>
        </button>
      </div>

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
              <span class="card-count">{{ newWorkRequests.length + activeWorkRequests.length }}</span>
            </div>
            <div class="card-badges">
              <span class="badge badge-new" *ngIf="newWorkRequests.length">{{ newWorkRequests.length }} New</span>
              <span class="badge badge-active" *ngIf="activeWorkRequests.length">{{ activeWorkRequests.length }} Active</span>
            </div>
            <div class="card-table" *ngIf="allWorkRequests.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Status</th>
                    <th>Date</th>
                    <th>Requested By</th>
                    <th>Location</th>
                    <th>Work Scope</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let wr of allWorkRequests"
                      (contextmenu)="onRowRightClick($event, wr)"
                      style="cursor: pointer">
                    <td><span class="status-chip" [class]="'status-' + (wr.status || '').toLowerCase()">{{ wr.status }}</span></td>
                    <td>{{ wr.dateOfWorkToBePerformed | date:'shortDate' }}</td>
                    <td>{{ wr.requestedBy }}</td>
                    <td>{{ wr.location }}</td>
                    <td class="truncate">{{ wr.workScope }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-empty" *ngIf="allWorkRequests.length === 0 && !loading">No work requests</div>
          </div>

          <!-- LOTOs Under Construction -->
          <div class="monitor-card">
            <div class="card-header">
              <span class="card-title">LOTOs Under Construction</span>
              <span class="card-count">{{ lotos.length }}</span>
            </div>
            <div class="card-table" *ngIf="lotos.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Box #</th>
                    <th>Equipment System</th>
                    <th>Requestor</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let loto of lotos">
                    <td>{{ loto.boxNumber }}</td>
                    <td>{{ loto.equipmentSystem }}</td>
                    <td>{{ loto.lotoRequestor }}</td>
                    <td>{{ loto.date | date:'shortDate' }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-empty" *ngIf="lotos.length === 0 && !loading">No LOTOs</div>
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

        <!-- Active LOTOs -->
        <div class="cards-row">
          <div class="monitor-card full-width">
            <div class="card-header">
              <span class="card-title">Active LOTO Points</span>
              <span class="card-count">{{ activeLotoPoints.length }}</span>
            </div>
            <div class="card-table" *ngIf="activeLotoPoints.length > 0">
              <table>
                <thead>
                  <tr>
                    <th>Tag #</th>
                    <th>Description</th>
                    <th>Location</th>
                    <th>Unit</th>
                  </tr>
                </thead>
                <tbody>
                  <tr *ngFor="let lp of activeLotoPoints">
                    <td>{{ lp.tagNumber }}</td>
                    <td class="truncate">{{ lp.description }}</td>
                    <td>{{ lp.specificLocation || lp.generalLocation }}</td>
                    <td>{{ lp.unit }}</td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div class="card-empty" *ngIf="activeLotoPoints.length === 0 && !loading">No active LOTO points</div>
          </div>
        </div>
      </section>

      <div class="loading-overlay" *ngIf="loading">
        <span class="material-icons spinning">refresh</span>
        <span>Loading...</span>
      </div>
    </div>

    <app-context-menu
      [selectedItem]="selectedWorkRequest"
      [isVisible]="contextMenuVisible"
      [position]="contextMenuPosition"
      [actions]="contextMenuActions"
      (closeMenu)="contextMenuVisible = false"
    />
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

    .badge-new {
      background-color: #fef3c7;
      color: #92400e;
    }

    .badge-active {
      background-color: #dbeafe;
      color: #1e40af;
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

    .status-chip {
      display: inline-block;
      font-size: 11px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 4px;
    }

    .status-new {
      background-color: #fef3c7;
      color: #92400e;
    }

    .status-active {
      background-color: var(--status-complete);
      color: #166534;
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
export class PermitsMonitorComponent implements OnInit {
  loading = false;

  newWorkRequests: WorkRequest[] = [];
  activeWorkRequests: WorkRequest[] = [];
  lotos: LotoDto[] = [];
  activeLotoPoints: LotoPointDto[] = [];
  activeHotWorks: HotWorkDto[] = [];
  activeConfinedSpaces: ConfinedSpaceDto[] = [];

  private apiUrl = environment.apiUrl;

  // Context menu state
  contextMenuVisible = false;
  contextMenuPosition = { x: 0, y: 0 };
  selectedWorkRequest: WorkRequest | null = null;

  contextMenuActions: ContextMenuAction[] = [
    {
      id: 'request-details',
      label: 'Request More Details',
      icon: 'email',
      action: (item) => this.requestMoreDetails(item)
    },
    {
      id: 'cancel',
      label: 'Cancel',
      icon: 'cancel',
      action: (item) => this.cancelWorkRequest(item)
    }
  ];

  constructor(
    private http: HttpClient,
    private wrApiService: RfWorkRequestApiService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  get allWorkRequests(): WorkRequest[] {
    return [...this.newWorkRequests, ...this.activeWorkRequests];
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
      newWr: this.http.get<ApiResponse<WorkRequest[]>>(`${this.apiUrl}/work-requests/get-all-by-status/New`),
      activeWr: this.http.get<ApiResponse<WorkRequest[]>>(`${this.apiUrl}/work-requests/get-all-by-status/Active`),
      lotos: this.http.get<ApiResponse<{ content: LotoDto[] }>>(`${this.apiUrl}/lotos/paginated?page=1&pageSize=100`),
      activeLotoPoints: this.http.get<ApiResponse<LotoPointDto[]>>(`${this.apiUrl}/lotos/active`),
      hotWorks: this.http.get<ApiResponse<HotWorkDto[]>>(`${this.apiUrl}/hot-works/get-all-hot-work`),
      confinedSpaces: this.http.get<ApiResponse<ConfinedSpaceDto[]>>(`${this.apiUrl}/confined-spaces/get-all-confined-space`)
    }).subscribe({
      next: (results) => {
        this.newWorkRequests = results.newWr.responseData || [];
        this.activeWorkRequests = results.activeWr.responseData || [];

        const lotosPage = results.lotos.responseData;
        this.lotos = (lotosPage?.content || []);

        this.activeLotoPoints = results.activeLotoPoints.responseData || [];

        const allHotWorks = results.hotWorks.responseData || [];
        this.activeHotWorks = allHotWorks.filter(hw =>
          hw.permitStatus?.value?.toLowerCase() === 'active'
        );

        const allConfinedSpaces = results.confinedSpaces.responseData || [];
        this.activeConfinedSpaces = allConfinedSpaces.filter(cs =>
          cs.permitStatus?.value?.toLowerCase() === 'active'
        );

        this.loading = false;
      },
      error: (err) => {
        console.error('[PermitsMonitor] Failed to load data:', err);
        this.loading = false;
      }
    });
  }

  // ====================== Context Menu Handlers ======================

  onRowRightClick(event: MouseEvent, wr: WorkRequest): void {
    event.preventDefault();
    this.selectedWorkRequest = wr;
    this.contextMenuPosition = { x: event.clientX, y: event.clientY };
    this.contextMenuVisible = true;
  }

  requestMoreDetails(item: WorkRequest): void {
    if (!item.id) return;

    const message = prompt('Optional: Add details about what information is needed');
    if (message !== null) {  // User didn't cancel prompt
      this.wrApiService.requestMoreDetails(item.id, message || undefined).subscribe({
        next: () => {
          console.log('[PermitsMonitor] More details requested');
          this.loadData(); // Refresh
        },
        error: (err) => console.error('[PermitsMonitor] Request details failed:', err)
      });
    }
  }

  cancelWorkRequest(item: WorkRequest): void {
    if (!item.id) return;

    const confirmed = confirm(
      `Are you sure you want to cancel this work request?\n\n` +
      `Work Scope: ${item.workScope}\n` +
      `Location: ${item.location}`
    );

    if (confirmed) {
      this.wrApiService.cancelWorkRequest(item.id).subscribe({
        next: () => {
          console.log('[PermitsMonitor] Work request cancelled');
          this.loadData(); // Refresh
        },
        error: (err) => console.error('[PermitsMonitor] Cancel failed:', err)
      });
    }
  }
}
