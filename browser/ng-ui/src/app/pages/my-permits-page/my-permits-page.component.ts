import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServerApiService } from '../../services/server-api.service';
import { AuthService } from '../../auth/auth.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';

@Component({
  selector: 'app-my-permits-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout header="My Permits">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>
      <div main-content>
        <div class="permits-container">
          @if (loading) {
            <div class="loading">Loading permits...</div>
          } @else if (error) {
            <div class="error-msg">{{ error }}</div>
          } @else if (permits.length === 0) {
            <div class="empty">No permits found for your account.</div>
          } @else {
            <div class="permits-list">
              @for (permit of permits; track permit.id) {
                <div class="permit-card" (click)="viewDetail(permit.id)">
                  <div class="permit-header">
                    <span class="permit-number">{{ permit.permitNumber || 'Work Request' }}</span>
                    <span class="permit-status" [class]="getStatusClass(permit.permitStatus)">
                      {{ permit.permitStatus || 'Submitted' }}
                    </span>
                  </div>

                  <!-- Status timeline -->
                  <div class="timeline">
                    <div class="timeline-step done">
                      <div class="dot"></div>
                      <span>Submitted</span>
                    </div>
                    <div class="timeline-line" [class.done]="permit.packageNumber"></div>
                    <div class="timeline-step" [class.done]="permit.packageNumber">
                      <div class="dot"></div>
                      <span>Processed</span>
                    </div>
                    <div class="timeline-line" [class.done]="permit.packageStatus === 'Active'"></div>
                    <div class="timeline-step" [class.done]="permit.packageStatus === 'Active' || permit.workCompleted">
                      <div class="dot"></div>
                      <span>Active</span>
                    </div>
                    <div class="timeline-line" [class.done]="permit.workCompleted"></div>
                    <div class="timeline-step" [class.done]="permit.workCompleted">
                      <div class="dot"></div>
                      <span>Completed</span>
                    </div>
                  </div>

                  <div class="permit-body">
                    <div class="field"><strong>Date:</strong> {{ permit.dateOfWork }}</div>
                    <div class="field"><strong>Location:</strong> {{ permit.location }}</div>
                    <div class="field"><strong>Scope:</strong> {{ permit.workScope }}</div>
                  </div>

                  @if (permit.packageNumber) {
                    <div class="package-info">
                      <span class="package-number">Package: {{ permit.packageNumber }}</span>
                      @if (permit.packageStatus) {
                        <span class="package-status" [class]="getStatusClass(permit.packageStatus)">
                          {{ permit.packageStatus }}
                        </span>
                      }
                    </div>
                  }

                  @if (permit.signedOnBy) {
                    <div class="signed-info">Signed on by: {{ permit.signedOnBy }}</div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .permits-container { padding: 1rem; max-width: 800px; margin: 0 auto; }
    .loading, .error-msg, .empty {
      text-align: center; padding: 2rem; color: var(--text-secondary, #666);
    }
    .error-msg { color: var(--error-color, #dc3545); }
    .permits-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .permit-card {
      background: var(--background-secondary, #fff);
      border: 1px solid var(--border-color, #ddd);
      border-radius: 8px; padding: 1rem; cursor: pointer;
      transition: box-shadow 0.2s;
    }
    .permit-card:hover { box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
    .permit-header {
      display: flex; justify-content: space-between; align-items: center;
      margin-bottom: 0.5rem;
    }
    .permit-number { font-weight: 600; color: var(--text-primary, #333); }
    .permit-status {
      padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-weight: 500;
      background: #e0e0e0; color: #333;
    }
    .permit-status.active { background: #c8e6c9; color: #2e7d32; }
    .permit-status.completed, .permit-status.closed { background: #bbdefb; color: #1565c0; }
    .permit-status.draft { background: #f5f5f5; color: #757575; }

    /* Timeline */
    .timeline {
      display: flex; align-items: center; gap: 0; margin: 0.5rem 0;
      padding: 0.5rem 0;
    }
    .timeline-step {
      display: flex; flex-direction: column; align-items: center; gap: 2px;
      flex-shrink: 0;
    }
    .timeline-step .dot {
      width: 10px; height: 10px; border-radius: 50%;
      background: #e0e0e0; border: 2px solid #bdbdbd;
    }
    .timeline-step.done .dot {
      background: #4caf50; border-color: #388e3c;
    }
    .timeline-step span { font-size: 0.65rem; color: var(--text-secondary, #999); }
    .timeline-step.done span { color: #4caf50; font-weight: 500; }
    .timeline-line {
      flex: 1; height: 2px; background: #e0e0e0; min-width: 16px;
      margin-bottom: 14px;
    }
    .timeline-line.done { background: #4caf50; }

    .permit-body { font-size: 0.875rem; color: var(--text-secondary, #666); }
    .field { margin-bottom: 0.25rem; }

    .package-info {
      display: flex; justify-content: space-between; align-items: center;
      margin-top: 0.5rem; padding-top: 0.5rem;
      border-top: 1px solid var(--border-color, #eee);
    }
    .package-number { font-size: 0.8rem; color: var(--primary-color, #007bff); font-weight: 500; }
    .package-status {
      padding: 2px 6px; border-radius: 10px; font-size: 0.7rem; font-weight: 500;
      background: #e0e0e0; color: #333;
    }

    .signed-info { margin-top: 0.5rem; font-size: 0.8rem; color: #4caf50; }
  `]
})
export class MyPermitsPageComponent implements OnInit {
  private serverApi = inject(ServerApiService);
  private authService = inject(AuthService);
  private router = inject(Router);

  permits: any[] = [];
  loading = true;
  error: string | null = null;

  ngOnInit(): void {
    if (!this.authService.hasPermission('BASIC')) {
      this.error = 'Insufficient permissions. BASIC or higher required.';
      this.loading = false;
      return;
    }

    this.serverApi.getMyPermits().subscribe({
      next: (res) => {
        this.permits = res.permits;
        this.loading = false;
      },
      error: (err) => {
        this.error = err.message || 'Failed to load permits';
        this.loading = false;
      }
    });
  }

  viewDetail(id: number): void {
    this.router.navigate(['/my-permits', id]);
  }

  getStatusClass(status: string | null): string {
    if (!status) return '';
    return status.toLowerCase().replace(/\s+/g, '-');
  }
}
