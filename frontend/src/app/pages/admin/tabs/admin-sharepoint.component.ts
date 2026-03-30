import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  AdminFunctionalitiesService,
  SpListStatus
} from '../../../services/admin/admin-functionalities.service';

@Component({
  selector: 'app-admin-sharepoint',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="admin-container">
      <div class="admin-section">
        <h3>SharePoint List Provisioning</h3>
        <p class="description">
          Manage SharePoint lists for all permit types. Each list shows its current status.
        </p>

        <div class="button-group">
          <button (click)="checkSpListStatuses()" [disabled]="loading.spProvision">
            {{ loading.spProvision ? 'Checking...' : 'Refresh Status' }}
          </button>
          <button class="action-btn" (click)="provisionAllLists()"
                  [disabled]="loading.spProvision || spListStatuses.length === 0 || getMissingListCount() === 0">
            Create All Missing ({{ getMissingListCount() }})
          </button>
        </div>

        <div class="error" *ngIf="errors.spProvision">{{ errors.spProvision }}</div>

        <div class="sp-list-grid" *ngIf="spListStatuses.length > 0">
          <div class="sp-list-card" *ngFor="let list of spListStatuses"
               [class.sp-exists]="list.exists"
               [class.sp-missing]="!list.exists && !list.error"
               [class.sp-error]="!!list.error">
            <div class="sp-list-header">
              <span class="sp-list-title">{{ list.title }}</span>
              <span class="badge success" *ngIf="list.exists">Exists</span>
              <span class="badge warning" *ngIf="!list.exists && !list.error">Missing</span>
              <span class="badge warning" *ngIf="list.error" [title]="list.error!">Error</span>
            </div>
            <div class="sp-list-detail">
              <span>{{ list.fieldCount }} fields</span>
            </div>
            <div class="sp-list-action">
              <button *ngIf="!list.exists"
                      class="action-btn"
                      (click)="provisionSingleList(list.title)"
                      [disabled]="spProvisioningList === list.title">
                {{ spProvisioningList === list.title ? 'Creating...' : 'Create List' }}
              </button>
              <a *ngIf="list.exists"
                 class="nav-btn sp-open-btn"
                 [href]="getSharePointListUrl(list.title)"
                 target="_blank"
                 rel="noopener noreferrer">
                Open in SharePoint
              </a>
            </div>
          </div>
        </div>

        <div *ngIf="spListStatuses.length === 0 && !loading.spProvision" class="description" style="margin-top: 8px;">
          Click "Refresh Status" to check SharePoint lists.
        </div>
      </div>
    </div>
  `,
  styles: [`
    .admin-container { max-width: 1200px; margin: 0 auto; padding: 20px; }
    .admin-section { background: #fff; border: 1px solid #ddd; border-radius: 8px; padding: 20px; margin-bottom: 20px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
    .admin-section h3 { color: #333; margin-top: 0; margin-bottom: 10px; }
    .description { color: #666; font-size: 14px; margin-bottom: 15px; line-height: 1.5; }
    .button-group { display: flex; gap: 10px; margin-bottom: 15px; }
    button { padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; transition: background-color 0.2s; }
    button:disabled { opacity: 0.6; cursor: not-allowed; }
    button:not(.action-btn):not(.toggle-btn) { background-color: #6c757d; color: white; }
    button:not(.action-btn):not(.toggle-btn):hover:not(:disabled) { background-color: #5a6268; }
    .action-btn { background-color: #007bff; color: white; }
    .action-btn:hover:not(:disabled) { background-color: #0056b3; }
    .error { background-color: #f8d7da; color: #721c24; padding: 10px 15px; border-radius: 4px; margin-bottom: 15px; }
    .badge { display: inline-block; padding: 5px 12px; border-radius: 20px; font-size: 13px; background-color: #e9ecef; color: #333; }
    .badge.success { background-color: #d4edda; color: #155724; }
    .badge.warning { background-color: #fff3cd; color: #856404; }
    .sp-list-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-top: 12px; }
    .sp-list-card { border: 1px solid #dee2e6; border-radius: 6px; padding: 12px 16px; background: #f8f9fa; display: flex; flex-direction: column; gap: 8px; }
    .sp-list-card.sp-exists { border-left: 4px solid #28a745; }
    .sp-list-card.sp-missing { border-left: 4px solid #ffc107; }
    .sp-list-card.sp-error { border-left: 4px solid #dc3545; }
    .sp-list-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
    .sp-list-title { font-weight: 600; font-size: 14px; color: #333; }
    .sp-list-detail { font-size: 12px; color: #6c757d; }
    .sp-list-action { display: flex; justify-content: flex-end; }
    .sp-list-action button, .sp-list-action .sp-open-btn { padding: 6px 14px; font-size: 13px; }
    .nav-btn { display: inline-block; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; font-size: 14px; text-decoration: none; background-color: #28a745; color: white; transition: background-color 0.2s; }
    .nav-btn:hover { background-color: #218838; }
    .sp-open-btn { background-color: #17a2b8; padding: 6px 14px; font-size: 13px; border-radius: 4px; text-decoration: none; color: white; }
    .sp-open-btn:hover { background-color: #138496; }
  `]
})
export class AdminSharepointComponent {
  loading = {
    spProvision: false
  };

  errors = {
    spProvision: ''
  };

  spListStatuses: SpListStatus[] = [];
  spProvisioningList: string = '';

  constructor(private adminService: AdminFunctionalitiesService) {}

  checkSpListStatuses() {
    this.loading.spProvision = true;
    this.errors.spProvision = '';

    this.adminService.getSharePointListStatuses().subscribe({
      next: (statuses) => {
        this.spListStatuses = statuses;
        this.loading.spProvision = false;
      },
      error: (error) => {
        this.errors.spProvision = error.error?.message || error.message || 'Failed to check list statuses';
        this.loading.spProvision = false;
      }
    });
  }

  provisionSingleList(title: string) {
    this.spProvisioningList = title;
    this.errors.spProvision = '';

    this.adminService.provisionSharePointList(title).subscribe({
      next: (result) => {
        this.spProvisioningList = '';
        if (result.success) {
          const entry = this.spListStatuses.find(s => s.title === title);
          if (entry) entry.exists = true;
        } else {
          this.errors.spProvision = `${title}: ${result.error}`;
        }
      },
      error: (error) => {
        this.spProvisioningList = '';
        this.errors.spProvision = `${title}: ${error.error?.message || error.message || 'Failed'}`;
      }
    });
  }

  provisionAllLists() {
    if (!confirm('Create all missing SharePoint lists? Existing lists will be skipped.')) return;

    this.loading.spProvision = true;
    this.errors.spProvision = '';

    this.adminService.provisionAllSharePointLists().subscribe({
      next: () => {
        this.loading.spProvision = false;
        this.checkSpListStatuses();
      },
      error: (error) => {
        this.errors.spProvision = error.error?.message || error.message || 'Failed to provision lists';
        this.loading.spProvision = false;
      }
    });
  }

  getMissingListCount(): number {
    return this.spListStatuses.filter(s => !s.exists).length;
  }

  getSharePointListUrl(title: string): string {
    return `https://jpowerusa.sharepoint.com/sites/JG/Lists/${encodeURIComponent(title)}`;
  }
}
