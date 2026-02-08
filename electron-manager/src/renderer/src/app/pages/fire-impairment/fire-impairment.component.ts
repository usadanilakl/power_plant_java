import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus } from '../../services/electron.service';
import { CreateImpairmentDialogComponent } from './create-impairment-dialog.component';
import { CloseImpairmentDialogComponent } from './close-impairment-dialog.component';
import { ImpairmentDetailDialogComponent } from './impairment-detail-dialog.component';

interface FireImpairmentItem {
  id: number;
  name: string;
  email: string;
  emailCc: string;
  clientName: string;
  indexNumber: string;
  streetAddress: string;
  state: string;
  city: string;
  country: string;
  phone: string;
  valveNumber: string;
  areaProtected: string;
  reason: string;
  office: string;
  protectionType: string;
  submissionDate: string;
  predictedRestorationDate: string;
  closedDate?: string;
  canceledDate?: string;
  precautions?: string;
  isActive: boolean;
  url?: string;
  location?: string;
}

@Component({
  selector: 'app-fire-impairment',
  standalone: true,
  imports: [CommonModule, FormsModule, CreateImpairmentDialogComponent, CloseImpairmentDialogComponent, ImpairmentDetailDialogComponent],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Fire Impairment</h1>
        <div class="actions" *ngIf="isSpringBootRunning">
          <button class="btn btn-secondary" (click)="refresh()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
          <button class="btn btn-primary" (click)="showCreateDialog = true">+ New Impairment</button>
        </div>
      </div>

      <div class="notice" *ngIf="!isSpringBootRunning">
        <span class="notice-icon">&#x26A0;</span>
        <div>
          <strong>Spring Boot Required</strong>
          <p>The Fire Impairment feature requires the Spring Boot application to be running.
             Start it from the Home page or the Spring Boot menu.</p>
        </div>
      </div>

      <div class="content" *ngIf="isSpringBootRunning">
        <!-- Tab bar -->
        <div class="tab-bar">
          <button class="tab" [class.active]="activeTab === 'active'" (click)="switchTab('active')">
            Active ({{ activeImpairments.length }})
          </button>
          <button class="tab" [class.active]="activeTab === 'closed'" (click)="switchTab('closed')">
            Closed ({{ closedImpairments.length }})
          </button>
        </div>

        <!-- Search bar -->
        <div class="search-bar">
          <input type="text"
                 class="search-input"
                 placeholder="Search by area, protection type, reason, location..."
                 [(ngModel)]="searchTerm">
          <span class="search-count" *ngIf="searchTerm.trim()">
            {{ activeTab === 'active' ? filteredActiveImpairments.length : filteredClosedImpairments.length }} results
          </span>
        </div>

        <div class="error-msg" *ngIf="error">{{ error }}</div>

        <!-- Active table -->
        <div class="table-container" *ngIf="activeTab === 'active' && filteredActiveImpairments.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sortBy('areaProtected')">
                  Area Protected {{ sortIndicator('areaProtected') }}
                </th>
                <th class="sortable" (click)="sortBy('protectionType')">
                  Protection {{ sortIndicator('protectionType') }}
                </th>
                <th>Reason</th>
                <th class="sortable" (click)="sortBy('submissionDate')">
                  Submitted {{ sortIndicator('submissionDate') }}
                </th>
                <th class="sortable" (click)="sortBy('predictedRestorationDate')">
                  Est. Restore {{ sortIndicator('predictedRestorationDate') }}
                </th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let imp of filteredActiveImpairments"
                  class="clickable-row"
                  (click)="openDetail(imp)">
                <td class="name-cell">{{ imp.areaProtected || '--' }}</td>
                <td>{{ imp.protectionType || '--' }}</td>
                <td class="reason-cell">{{ imp.reason || '--' }}</td>
                <td>{{ imp.submissionDate || '--' }}</td>
                <td>{{ imp.predictedRestorationDate || '--' }}</td>
                <td class="actions-cell" (click)="$event.stopPropagation()">
                  <button class="btn btn-secondary btn-xs" (click)="openFmGlobal(imp)">FM Global</button>
                  <button class="btn btn-warning btn-xs" (click)="cancelImpairment(imp)">Cancel</button>
                  <button class="btn btn-danger btn-xs" (click)="openCloseDialog(imp)">Close</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="activeTab === 'active' && filteredActiveImpairments.length === 0 && !loading">
          <p *ngIf="!searchTerm.trim()">No active impairments.</p>
          <p *ngIf="searchTerm.trim()">No active impairments match "{{ searchTerm }}".</p>
        </div>

        <!-- Closed table -->
        <div class="table-container" *ngIf="activeTab === 'closed' && filteredClosedImpairments.length > 0">
          <table class="data-table">
            <thead>
              <tr>
                <th class="sortable" (click)="sortBy('areaProtected')">
                  Area Protected {{ sortIndicator('areaProtected') }}
                </th>
                <th class="sortable" (click)="sortBy('protectionType')">
                  Protection {{ sortIndicator('protectionType') }}
                </th>
                <th>Status</th>
                <th class="sortable" (click)="sortBy('submissionDate')">
                  Submitted {{ sortIndicator('submissionDate') }}
                </th>
                <th class="sortable" (click)="sortBy('closedDate')">
                  Closed/Canceled {{ sortIndicator('closedDate') }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr *ngFor="let imp of filteredClosedImpairments"
                  class="clickable-row"
                  (click)="openDetail(imp)">
                <td class="name-cell">{{ imp.areaProtected || '--' }}</td>
                <td>{{ imp.protectionType || '--' }}</td>
                <td>
                  <span class="status-badge"
                        [class.badge-canceled]="imp.canceledDate"
                        [class.badge-closed]="!imp.canceledDate">
                    {{ imp.canceledDate ? 'Canceled' : 'Closed' }}
                  </span>
                </td>
                <td>{{ imp.submissionDate || '--' }}</td>
                <td>{{ imp.canceledDate || imp.closedDate || '--' }}</td>
              </tr>
            </tbody>
          </table>
        </div>

        <div class="empty-state" *ngIf="activeTab === 'closed' && filteredClosedImpairments.length === 0 && !loading">
          <p *ngIf="!searchTerm.trim()">No closed impairments.</p>
          <p *ngIf="searchTerm.trim()">No closed impairments match "{{ searchTerm }}".</p>
        </div>
      </div>
    </div>

    <!-- Create dialog -->
    <app-create-impairment-dialog
        *ngIf="showCreateDialog"
        (submitted)="onCreateSubmit($event)"
        (cancelled)="showCreateDialog = false">
    </app-create-impairment-dialog>

    <!-- Close dialog -->
    <app-close-impairment-dialog
        *ngIf="showCloseDialog"
        [impairment]="closingImpairment"
        (confirmed)="onCloseConfirm()"
        (cancelled)="showCloseDialog = false">
    </app-close-impairment-dialog>

    <!-- Detail dialog -->
    <app-impairment-detail-dialog
        *ngIf="showDetailDialog"
        [impairment]="selectedImpairment"
        (closed)="showDetailDialog = false"
        (openFmGlobal)="openFmGlobal($event)"
        (closeImpairment)="openCloseDialog($event)"
        (cancelImpairment)="cancelImpairment($event)">
    </app-impairment-detail-dialog>
  `,
  styles: [`
    .page {
      max-width: 1100px;
      margin: 0 auto;
    }

    .page-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 20px;
    }

    .page-title {
      font-size: 22px;
      font-weight: 600;
      color: var(--text-primary);
      margin: 0;
    }

    .actions {
      display: flex;
      gap: 8px;
    }

    .notice {
      display: flex;
      align-items: flex-start;
      gap: 12px;
      padding: 16px 20px;
      background-color: rgba(245, 158, 11, 0.1);
      border: 1px solid rgba(245, 158, 11, 0.3);
      border-radius: 8px;
      color: var(--text-secondary);
    }

    .notice-icon {
      font-size: 20px;
      flex-shrink: 0;
    }

    .notice strong {
      color: var(--accent-warning);
      display: block;
      margin-bottom: 4px;
    }

    .notice p {
      font-size: 13px;
      margin: 0;
    }

    .tab-bar {
      display: flex;
      gap: 4px;
      margin-bottom: 16px;
      border-bottom: 1px solid var(--border-color);
    }

    .tab {
      padding: 10px 20px;
      background: none;
      border: none;
      border-bottom: 2px solid transparent;
      color: var(--text-muted);
      font-size: 13px;
      font-weight: 500;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .tab:hover {
      color: var(--text-primary);
    }

    .tab.active {
      color: var(--accent-primary);
      border-bottom-color: var(--accent-primary);
    }

    .search-bar {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 16px;
    }

    .search-input {
      flex: 1;
      padding: 8px 14px;
      font-size: 13px;
      background: var(--bg-card);
      color: var(--text-primary);
      border: 1px solid var(--border-color);
      border-radius: 8px;
    }

    .search-input:focus {
      outline: none;
      border-color: var(--accent-primary);
    }

    .search-input::placeholder {
      color: var(--text-muted);
    }

    .search-count {
      font-size: 12px;
      color: var(--text-muted);
      white-space: nowrap;
    }

    .error-msg {
      padding: 12px 16px;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: var(--accent-error);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .table-container {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 10px;
      overflow: hidden;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
    }

    .data-table th {
      text-align: left;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid var(--border-color);
      background-color: var(--bg-secondary);
    }

    .data-table th.sortable {
      cursor: pointer;
      user-select: none;
    }

    .data-table th.sortable:hover {
      color: var(--text-primary);
    }

    .data-table td {
      padding: 8px 14px;
      font-size: 13px;
      color: var(--text-secondary);
      border-bottom: 1px solid var(--border-color);
    }

    .data-table tr:last-child td { border-bottom: none; }

    .clickable-row { cursor: pointer; }
    .clickable-row:hover td { background-color: rgba(255, 255, 255, 0.03); }

    .name-cell { font-weight: 500; color: var(--text-primary); }

    .reason-cell {
      max-width: 200px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .actions-cell {
      white-space: nowrap;
    }

    .actions-cell .btn-xs {
      margin-right: 4px;
    }

    .actions-cell .btn-xs:last-child {
      margin-right: 0;
    }

    .status-badge {
      font-size: 10px;
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .badge-closed {
      background-color: rgba(107, 114, 128, 0.15);
      color: var(--text-muted);
    }

    .badge-canceled {
      background-color: rgba(245, 158, 11, 0.15);
      color: var(--accent-warning);
    }

    .btn-warning {
      background-color: rgba(245, 158, 11, 0.15);
      color: var(--accent-warning);
      border: 1px solid rgba(245, 158, 11, 0.3);
    }

    .btn-warning:hover {
      background-color: rgba(245, 158, 11, 0.25);
    }

    .btn-xs {
      padding: 4px 10px;
      font-size: 11px;
    }

    .empty-state {
      text-align: center;
      padding: 40px 20px;
      background-color: var(--bg-card);
      border-radius: 12px;
      border: 1px dashed var(--border-color);
      color: var(--text-secondary);
      font-size: 13px;
    }
  `]
})
export class FireImpairmentComponent implements OnInit, OnDestroy {
  isSpringBootRunning = false;
  loading = false;
  error = '';
  activeTab: 'active' | 'closed' = 'active';

  activeImpairments: FireImpairmentItem[] = [];
  closedImpairments: FireImpairmentItem[] = [];

  showCreateDialog = false;
  showCloseDialog = false;
  closingImpairment: FireImpairmentItem | null = null;

  showDetailDialog = false;
  selectedImpairment: FireImpairmentItem | null = null;

  searchTerm = '';
  sortField = 'submissionDate';
  sortAsc = false;

  private closedLoaded = false;
  private lastCreatedId: number | null = null;
  private sub?: Subscription;
  private unsubFormSubmitted?: () => void;

  constructor(private electronService: ElectronService) {}

  // Filtered + sorted getters

  get filteredActiveImpairments(): FireImpairmentItem[] {
    return this.sortItems(this.filterItems(this.activeImpairments));
  }

  get filteredClosedImpairments(): FireImpairmentItem[] {
    return this.sortItems(this.filterItems(this.closedImpairments));
  }

  private filterItems(items: FireImpairmentItem[]): FireImpairmentItem[] {
    if (!this.searchTerm.trim()) return items;
    const term = this.searchTerm.toLowerCase().trim();
    return items.filter(imp =>
      (imp.areaProtected || '').toLowerCase().includes(term) ||
      (imp.protectionType || '').toLowerCase().includes(term) ||
      (imp.reason || '').toLowerCase().includes(term) ||
      (imp.email || '').toLowerCase().includes(term) ||
      (imp.emailCc || '').toLowerCase().includes(term) ||
      (imp.location || '').toLowerCase().includes(term) ||
      (imp.valveNumber || '').toLowerCase().includes(term)
    );
  }

  private sortItems(items: FireImpairmentItem[]): FireImpairmentItem[] {
    const dir = this.sortAsc ? 1 : -1;
    return [...items].sort((a, b) => {
      const aVal = (a as any)[this.sortField] || '';
      const bVal = (b as any)[this.sortField] || '';
      return aVal.localeCompare(bVal) * dir;
    });
  }

  sortBy(field: string): void {
    if (this.sortField === field) {
      this.sortAsc = !this.sortAsc;
    } else {
      this.sortField = field;
      this.sortAsc = field === 'areaProtected' || field === 'protectionType';
    }
  }

  sortIndicator(field: string): string {
    if (this.sortField !== field) return '';
    return this.sortAsc ? '\u25B2' : '\u25BC';
  }

  openDetail(imp: FireImpairmentItem): void {
    this.selectedImpairment = imp;
    this.showDetailDialog = true;
  }

  // Lifecycle

  ngOnInit(): void {
    this.sub = this.electronService.appStatus$.subscribe(status => {
      const wasRunning = this.isSpringBootRunning;
      this.isSpringBootRunning = status.state === 'running';
      if (!wasRunning && this.isSpringBootRunning) {
        this.loadActive();
      }
    });

    // Listen for FM Global form data (Back/Submit button interception)
    this.unsubFormSubmitted = this.electronService.onFireImpFormSubmitted((data) => {
      this.onFmGlobalFormData(data);
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.unsubFormSubmitted?.();
  }

  switchTab(tab: 'active' | 'closed'): void {
    this.activeTab = tab;
    if (tab === 'closed' && !this.closedLoaded) {
      this.loadClosed();
    }
  }

  async refresh(): Promise<void> {
    await this.loadActive();
    if (this.closedLoaded) {
      await this.loadClosed();
    }
  }

  async loadActive(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.electronService.fireImpList();
      if (result.success && result.data) {
        this.activeImpairments = result.data;
      } else {
        this.error = result.error || 'Failed to load impairments';
      }
    } catch (e: any) {
      this.error = e.message || 'Failed to load impairments';
    } finally {
      this.loading = false;
    }
  }

  async loadClosed(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.electronService.fireImpListClosed();
      if (result.success && result.data) {
        this.closedImpairments = result.data;
        this.closedLoaded = true;
      } else {
        this.error = result.error || 'Failed to load closed impairments';
      }
    } catch (e: any) {
      this.error = e.message || 'Failed to load closed impairments';
    } finally {
      this.loading = false;
    }
  }

  async onCreateSubmit(dto: Record<string, string>): Promise<void> {
    this.showCreateDialog = false;
    this.error = '';

    // Save to Spring Boot DB
    const createResult = await this.electronService.fireImpCreate(dto);
    if (!createResult.success) {
      this.error = createResult.error || 'Failed to create impairment';
      return;
    }

    // Track the created record ID for FM Global form data callback
    this.lastCreatedId = createResult.data?.id ?? null;
    console.log('Create response data:', JSON.stringify(createResult.data), '=> lastCreatedId:', this.lastCreatedId);

    // Refresh list first so we can use it as fallback for ID
    await this.loadActive();

    // Fallback: if create response didn't include id, use the first active impairment
    if (!this.lastCreatedId && this.activeImpairments.length > 0) {
      this.lastCreatedId = this.activeImpairments[0].id;
      console.log('Fallback lastCreatedId from active list:', this.lastCreatedId);
    }

    // Open FM Global with form data
    const formResult = await this.electronService.fireImpOpenForm(dto);
    if (!formResult.success) {
      this.error = formResult.error || 'Failed to open FM Global form';
    }
  }

  private async onFmGlobalFormData(data: Record<string, string>): Promise<void> {
    if (!this.lastCreatedId) {
      console.log('FM Global form data received but no impairment to update');
      return;
    }

    console.log('FM Global form data received, updating impairment', this.lastCreatedId);
    const result = await this.electronService.fireImpUpdate(this.lastCreatedId, data);
    if (!result.success) {
      this.error = result.error || 'Failed to update impairment with FM Global data';
    }

    this.lastCreatedId = null;
    await this.loadActive();
  }

  async cancelImpairment(imp: FireImpairmentItem): Promise<void> {
    this.error = '';
    const result = await this.electronService.fireImpCancel(imp.id);
    if (!result.success) {
      this.error = result.error || 'Failed to cancel impairment';
    }
    await this.loadActive();
    this.closedLoaded = false;
  }

  openCloseDialog(imp: FireImpairmentItem): void {
    this.closingImpairment = imp;
    this.showCloseDialog = true;
  }

  async onCloseConfirm(): Promise<void> {
    if (!this.closingImpairment) return;

    this.showCloseDialog = false;
    this.error = '';

    const result = await this.electronService.fireImpClose(this.closingImpairment.id);
    if (!result.success) {
      this.error = result.error || 'Failed to close impairment';
    }

    this.closingImpairment = null;
    await this.loadActive();
    this.closedLoaded = false;
  }

  async openFmGlobal(imp: FireImpairmentItem): Promise<void> {
    // Track this impairment for FM Global button interception
    this.lastCreatedId = imp.id;

    const formData: Record<string, string> = {
      name: imp.name || 'Jpower',
      email: imp.email || '',
      emailCc: imp.emailCc || '',
      areaProtected: imp.areaProtected || '',
      protectionType: imp.protectionType || '',
      reason: imp.reason || ''
    };

    const result = await this.electronService.fireImpOpenForm(formData);
    if (!result.success) {
      this.error = result.error || 'Failed to open FM Global form';
    }
  }
}
