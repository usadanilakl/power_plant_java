import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subscription } from 'rxjs';
import { ElectronService, AppStatus } from '../../services/electron.service';

interface FireImpairmentItem {
  id: number;
  name: string;
  areaProtected: string;
  protectionType: string;
  reason: string;
  submissionDate: string;
  predictedRestorationDate: string;
  closedDate?: string;
  isActive: boolean;
  url?: string;
}

@Component({
  selector: 'app-fire-impairment',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <div class="page-header">
        <h1 class="page-title">Fire Impairment</h1>
        <div class="actions" *ngIf="isSpringBootRunning">
          <button class="btn btn-secondary" (click)="loadImpairments()" [disabled]="loading">
            {{ loading ? 'Loading...' : 'Refresh' }}
          </button>
          <button class="btn btn-primary" (click)="createNew()">+ New Impairment</button>
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
          <button class="tab" [class.active]="activeTab === 'active'" (click)="activeTab = 'active'">
            Active ({{ activeImpairments.length }})
          </button>
          <button class="tab" [class.active]="activeTab === 'closed'" (click)="activeTab = 'closed'">
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
                <span class="imp-dot closed"></span>
                <strong>{{ imp.areaProtected || imp.protectionType || 'Impairment #' + imp.id }}</strong>
              </div>
            </div>
            <div class="imp-details">
              <span *ngIf="imp.submissionDate">Submitted: {{ imp.submissionDate }}</span>
              <span *ngIf="imp.closedDate">Closed: {{ imp.closedDate }}</span>
            </div>
          </div>

          <div class="empty-state" *ngIf="closedImpairments.length === 0 && !loading">
            <p>No closed impairments.</p>
          </div>
        </div>
      </div>
    </div>
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
  impairments: FireImpairmentItem[] = [];

  private sub?: Subscription;

  constructor(private electronService: ElectronService) {}

  ngOnInit(): void {
    this.sub = this.electronService.appStatus$.subscribe(status => {
      const wasRunning = this.isSpringBootRunning;
      this.isSpringBootRunning = status.state === 'running';
      // Auto-load when Spring Boot becomes available
      if (!wasRunning && this.isSpringBootRunning) {
        this.loadImpairments();
      }
    });
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
  }

  get activeImpairments(): FireImpairmentItem[] {
    return this.impairments.filter(i => i.isActive);
  }

  get closedImpairments(): FireImpairmentItem[] {
    return this.impairments.filter(i => !i.isActive);
  }

  async loadImpairments(): Promise<void> {
    this.loading = true;
    this.error = '';
    try {
      const result = await this.electronService.fireImpList();
      if (result.success && result.data) {
        this.impairments = result.data;
      } else {
        this.error = result.error || 'Failed to load impairments';
      }
    } catch (e: any) {
      this.error = e.message || 'Failed to load impairments';
    } finally {
      this.loading = false;
    }
  }

  async createNew(): Promise<void> {
    // Default form data for new impairment
    const formData: Record<string, string> = {
      name: 'Jpower',
      clientName: 'Jpower',
      indexNumber: '3652.35',
      streetAddress: '24650 South Brandon Road',
      state: 'Illinois',
      city: 'Elwood',
      country: 'USA',
      phone: '779-242-6151',
      office: 'Chicago~engchicagocustomerservicedesk@fmglobal.com'
    };

    const result = await this.electronService.fireImpOpenForm(formData);
    if (!result.success) {
      this.error = result.error || 'Failed to open FM Global form';
    }
  }

  async openFmGlobal(imp: FireImpairmentItem): Promise<void> {
    const formData: Record<string, string> = {
      name: imp.name || 'Jpower',
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
