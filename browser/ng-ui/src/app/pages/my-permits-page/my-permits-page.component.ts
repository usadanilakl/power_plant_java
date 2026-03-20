import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ServerApiService } from '../../services/server-api.service';
import { AuthService } from '../../auth/auth.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-my-permits-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout header="My Permits">
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
                    <span class="permit-number">{{ permit.permitNumber || 'No Number' }}</span>
                    <span class="permit-status" [class]="permit.permitStatus?.toLowerCase()">{{ permit.permitStatus || 'Unknown' }}</span>
                  </div>
                  <div class="permit-body">
                    <div class="field"><strong>Date:</strong> {{ permit.dateOfWork }}</div>
                    <div class="field"><strong>Location:</strong> {{ permit.location }}</div>
                    <div class="field"><strong>Scope:</strong> {{ permit.workScope }}</div>
                  </div>
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
    .permit-body { font-size: 0.875rem; color: var(--text-secondary, #666); }
    .field { margin-bottom: 0.25rem; }
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
}
