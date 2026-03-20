import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { ServerApiService } from '../../services/server-api.service';
import { AuthService } from '../../auth/auth.service';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';

@Component({
  selector: 'app-permit-detail-page',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent],
  template: `
    <app-main-layout header="Permit Detail">
      <div main-content>
        <div class="detail-container">
          @if (loading) {
            <div class="loading">Loading...</div>
          } @else if (error) {
            <div class="error-msg">{{ error }}</div>
          } @else if (permit) {
            <div class="detail-card">
              <div class="detail-header">
                <h2>{{ permit.permitNumber || 'Work Request' }}</h2>
                <span class="status-badge" [class]="permit.permitStatus?.toLowerCase()">{{ permit.permitStatus }}</span>
              </div>

              <div class="detail-grid">
                <div class="detail-field"><label>Date</label><span>{{ permit.dateOfWork }}</span></div>
                <div class="detail-field"><label>Location</label><span>{{ permit.location }}</span></div>
                <div class="detail-field"><label>Company</label><span>{{ permit.company }}</span></div>
                <div class="detail-field"><label>Requested By</label><span>{{ permit.requestedBy }}</span></div>
                <div class="detail-field"><label>Affected Equipment</label><span>{{ permit.affectedEquipment }}</span></div>
                <div class="detail-field full-width"><label>Work Scope</label><span>{{ permit.workScope }}</span></div>
                <div class="detail-field"><label>LOTO Required</label><span>{{ permit.isLotoRequired ? 'Yes' : 'No' }}</span></div>
                <div class="detail-field"><label>Hot Work Required</label><span>{{ permit.isHotWorkRequired ? 'Yes' : 'No' }}</span></div>
                <div class="detail-field"><label>Confined Space</label><span>{{ permit.isConfinedSpaceEntryRequired ? 'Yes' : 'No' }}</span></div>
                <div class="detail-field"><label>Submitted</label><span>{{ permit.timeSubmitted }}</span></div>
              </div>

              @if (permit.signedOnBy) {
                <div class="sign-info">
                  <strong>Signed On:</strong> {{ permit.signedOnBy }} ({{ permit.signedOnAt }})
                </div>
              }
              @if (permit.signedOffBy) {
                <div class="sign-info">
                  <strong>Signed Off:</strong> {{ permit.signedOffBy }} ({{ permit.signedOffAt }})
                </div>
              }

              @if (canSign) {
                <div class="actions">
                  @if (!permit.signedOnBy) {
                    <button class="btn btn-primary" (click)="signOn()" [disabled]="actionLoading">Sign On</button>
                  } @else if (!permit.signedOffBy) {
                    <button class="btn btn-secondary" (click)="signOff()" [disabled]="actionLoading">Sign Off</button>
                  }
                </div>
              }

              @if (actionMessage) {
                <div class="action-msg" [class.success]="!actionError" [class.error]="actionError">
                  {{ actionMessage }}
                </div>
              }
            </div>

            <button class="back-btn" (click)="goBack()">Back to Permits</button>
          }
        </div>
      </div>
    </app-main-layout>
  `,
  styles: [`
    .detail-container { padding: 1rem; max-width: 700px; margin: 0 auto; }
    .loading, .error-msg { text-align: center; padding: 2rem; color: var(--text-secondary, #666); }
    .error-msg { color: var(--error-color, #dc3545); }
    .detail-card {
      background: var(--background-secondary, #fff);
      border: 1px solid var(--border-color, #ddd);
      border-radius: 12px; padding: 1.5rem;
    }
    .detail-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; }
    .detail-header h2 { margin: 0; font-size: 1.25rem; }
    .status-badge {
      padding: 4px 12px; border-radius: 12px; font-size: 0.8rem; font-weight: 500;
      background: #e0e0e0;
    }
    .status-badge.active { background: #c8e6c9; color: #2e7d32; }
    .detail-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0.75rem; }
    .detail-field { display: flex; flex-direction: column; }
    .detail-field.full-width { grid-column: 1 / -1; }
    .detail-field label { font-size: 0.75rem; color: var(--text-secondary, #999); text-transform: uppercase; }
    .detail-field span { font-size: 0.9rem; color: var(--text-primary, #333); }
    .sign-info { margin-top: 0.75rem; font-size: 0.875rem; color: #4caf50; }
    .actions { margin-top: 1rem; display: flex; gap: 0.5rem; }
    .btn {
      padding: 0.5rem 1.5rem; border: none; border-radius: 8px;
      font-size: 0.9rem; cursor: pointer; font-weight: 500;
    }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .btn-primary { background: var(--primary-color, #007bff); color: white; }
    .btn-secondary { background: #ff9800; color: white; }
    .action-msg { margin-top: 0.75rem; padding: 0.5rem; border-radius: 6px; font-size: 0.875rem; }
    .action-msg.success { background: rgba(76,175,80,0.1); color: #4caf50; }
    .action-msg.error { background: rgba(244,67,54,0.1); color: #f44336; }
    .back-btn {
      margin-top: 1rem; background: none; border: 1px solid var(--border-color, #ddd);
      padding: 0.5rem 1rem; border-radius: 8px; cursor: pointer; color: var(--text-secondary, #666);
    }
  `]
})
export class PermitDetailPageComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private serverApi = inject(ServerApiService);
  private authService = inject(AuthService);

  permit: any = null;
  loading = true;
  error: string | null = null;
  canSign = false;
  actionLoading = false;
  actionMessage: string | null = null;
  actionError = false;

  ngOnInit(): void {
    this.canSign = this.authService.hasPermission('OPERATOR');
    const id = Number(this.route.snapshot.paramMap.get('id'));

    this.serverApi.getPermitDetail(id).subscribe({
      next: (data) => { this.permit = data; this.loading = false; },
      error: (err) => { this.error = err.message || 'Failed to load permit'; this.loading = false; }
    });
  }

  signOn(): void {
    this.actionLoading = true;
    this.serverApi.signOnPermit(this.permit.id).subscribe({
      next: () => {
        this.actionMessage = 'Signed on successfully';
        this.actionError = false;
        this.actionLoading = false;
        this.permit.signedOnBy = this.authService.getAuthData()?.user.name;
        this.permit.signedOnAt = new Date().toISOString();
      },
      error: (err) => {
        this.actionMessage = err.message || 'Sign on failed';
        this.actionError = true;
        this.actionLoading = false;
      }
    });
  }

  signOff(): void {
    this.actionLoading = true;
    this.serverApi.signOffPermit(this.permit.id).subscribe({
      next: () => {
        this.actionMessage = 'Signed off successfully';
        this.actionError = false;
        this.actionLoading = false;
        this.permit.signedOffBy = this.authService.getAuthData()?.user.name;
        this.permit.signedOffAt = new Date().toISOString();
      },
      error: (err) => {
        this.actionMessage = err.message || 'Sign off failed';
        this.actionError = true;
        this.actionLoading = false;
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/my-permits']);
  }
}
