import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus } from '../../services/electron.service';
import { CreateImpairmentDialogComponent } from './create-impairment-dialog.component';
import { CloseImpairmentDialogComponent } from './close-impairment-dialog.component';

interface FireImpairmentItem {
  id: number;
  name: string;
  email: string;
  emailCc: string;
  areaProtected: string;
  protectionType: string;
  reason: string;
  submissionDate: string;
  predictedRestorationDate: string;
  closedDate?: string;
  canceledDate?: string;
  isActive: boolean;
  url?: string;
}

@Component({
  selector: 'app-fire-impairment',
  standalone: true,
  imports: [CommonModule, CreateImpairmentDialogComponent, CloseImpairmentDialogComponent],
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

        <div class="error-msg" *ngIf="error">{{ error }}</div>

        <!-- Active list -->
        <div class="imp-list" *ngIf="activeTab === 'active'">
          <div class="imp-card" *ngFor="let imp of activeImpairments">
            <div class="imp-header">
              <div class="imp-title">
                <span class="imp-dot active"></span>
                <strong>{{ imp.areaProtected || imp.protectionType || 'Impairment #' + imp.id }}</strong>
              </div>
              <div class="imp-actions">
                <button class="btn btn-secondary btn-xs" (click)="openFmGlobal(imp)">Open FM Global</button>
                <button class="btn btn-warning btn-xs" (click)="cancelImpairment(imp)">Cancel</button>
                <button class="btn btn-danger btn-xs" (click)="openCloseDialog(imp)">Close</button>
              </div>
            </div>
            <div class="imp-details">
              <span *ngIf="imp.protectionType">Protection: {{ imp.protectionType }}</span>
              <span *ngIf="imp.reason">Reason: {{ imp.reason }}</span>
              <span *ngIf="imp.submissionDate">Submitted: {{ imp.submissionDate }}</span>
              <span *ngIf="imp.predictedRestorationDate">Est. Restore: {{ imp.predictedRestorationDate }}</span>
            </div>
          </div>

          <div class="empty-state" *ngIf="activeImpairments.length === 0 && !loading">
            <p>No active impairments.</p>
          </div>
        </div>

        <!-- Closed list -->
        <div class="imp-list" *ngIf="activeTab === 'closed'">
          <div class="imp-card closed" *ngFor="let imp of closedImpairments">
            <div class="imp-header">
              <div class="imp-title">
                <span class="imp-dot" [class.canceled]="imp.canceledDate" [class.closed]="!imp.canceledDate"></span>
                <strong>{{ imp.areaProtected || imp.protectionType || 'Impairment #' + imp.id }}</strong>
                <span class="status-badge" [class.badge-canceled]="imp.canceledDate" [class.badge-closed]="!imp.canceledDate">
                  {{ imp.canceledDate ? 'Canceled' : 'Closed' }}
                </span>
              </div>
            </div>
            <div class="imp-details">
              <span *ngIf="imp.submissionDate">Submitted: {{ imp.submissionDate }}</span>
              <span *ngIf="imp.closedDate">Closed: {{ imp.closedDate }}</span>
              <span *ngIf="imp.canceledDate">Canceled: {{ imp.canceledDate }}</span>
            </div>
          </div>

          <div class="empty-state" *ngIf="closedImpairments.length === 0 && !loading">
            <p>No closed impairments.</p>
          </div>
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
  `,
  styles: [`
    .page {
      max-width: 1000px;
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

    .error-msg {
      padding: 12px 16px;
      background-color: rgba(239, 68, 68, 0.1);
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      color: var(--accent-error);
      font-size: 13px;
      margin-bottom: 16px;
    }

    .imp-list {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }

    .imp-card {
      background-color: var(--bg-card);
      border: 1px solid var(--border-color);
      border-radius: 8px;
      padding: 16px;
    }

    .imp-card.closed {
      opacity: 0.7;
    }

    .imp-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
    }

    .imp-title {
      display: flex;
      align-items: center;
      gap: 8px;
      color: var(--text-primary);
      font-size: 14px;
    }

    .imp-dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .imp-dot.active {
      background-color: var(--accent-warning);
      box-shadow: 0 0 6px var(--accent-warning);
    }

    .imp-dot.closed {
      background-color: var(--text-muted);
    }

    .imp-dot.canceled {
      background-color: var(--accent-warning);
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

    .imp-actions {
      display: flex;
      gap: 6px;
    }

    .btn-xs {
      padding: 4px 10px;
      font-size: 11px;
    }

    .imp-details {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      font-size: 12px;
      color: var(--text-muted);
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

  private closedLoaded = false;
  private lastCreatedId: number | null = null;
  private sub?: Subscription;
  private unsubFormSubmitted?: () => void;

  constructor(private electronService: ElectronService) {}

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

  /**
   * Called when FM Global Back/Submit button is intercepted.
   * Updates the last created impairment with gathered form data.
   */
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
    this.closedLoaded = false; // Force reload on next tab switch
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
