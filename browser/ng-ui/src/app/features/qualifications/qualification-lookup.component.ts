import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RouterMenuComponent } from '../../shared/menus/router-menu/router-menu.component';
import { PowerAutomateService } from '../../services/power-automate.service';
import {
  PwaQualificationDto,
  PwaQualificationPersonDto,
  ServerApiService
} from '../../services/server-api.service';

type LoadState = 'loading' | 'ready' | 'empty' | 'error';

@Component({
  selector: 'app-qualification-lookup',
  standalone: true,
  imports: [CommonModule, MainLayoutComponent, RouterMenuComponent],
  template: `
    <app-main-layout [header]="'Qualifications'">
      <ng-container header>
        <app-router-menu [layout]="'row'"></app-router-menu>
      </ng-container>

      <ng-container main-content>
        <main class="qualification-page">
          @if (state() === 'loading') {
            <div class="state-row">
              <div class="spinner"></div>
              <span>Loading qualifications...</span>
            </div>
          }

          @if (state() === 'error') {
            <section class="empty-state">
              <h2>Qualifications unavailable</h2>
              <p>{{ message() }}</p>
            </section>
          }

          @if (state() === 'empty') {
            <section class="empty-state">
              <h2>No qualifications found</h2>
              <p>{{ message() }}</p>
            </section>
          }

          @if (state() === 'ready' && person()) {
            <section class="person-header">
              <div>
                <span class="eyebrow">Personnel</span>
                <h1>{{ person()!.userName || 'Unknown User' }}</h1>
                @if (person()!.userEmail) {
                  <p>{{ person()!.userEmail }}</p>
                }
              </div>
              <div class="summary-pill">{{ activeCount() }} active</div>
            </section>

            <section class="qualification-list">
              @for (qualification of person()!.qualifications; track qualification.sharepointId || qualification.localUuid || $index) {
                <article class="qualification-row" [class.expired]="isExpired(qualification)">
                  <div class="row-main">
                    <h2>{{ qualification.qualificationName || 'Qualification' }}</h2>
                    <div class="row-meta">
                      @if (qualification.qualificationCode) { <span>{{ qualification.qualificationCode }}</span> }
                      @if (qualification.qualificationType) { <span>{{ qualification.qualificationType }}</span> }
                      @if (qualification.issuer) { <span>{{ qualification.issuer }}</span> }
                      @if (qualification.credentialNumber) { <span>{{ qualification.credentialNumber }}</span> }
                    </div>
                    @if (qualification.notes) {
                      <p class="notes">{{ qualification.notes }}</p>
                    }
                  </div>
                  <div class="row-status">
                    <span class="status" [attr.data-status]="normalizedStatus(qualification)">
                      {{ isExpired(qualification) ? 'Expired' : (qualification.status || 'Active') }}
                    </span>
                    @if (qualification.expirationDate) {
                      <span class="date">Expires {{ qualification.expirationDate }}</span>
                    } @else {
                      <span class="date">No expiration</span>
                    }
                    @if (qualification.issuedDate) {
                      <span class="date">Issued {{ qualification.issuedDate }}</span>
                    }
                  </div>
                </article>
              }
            </section>
          }
        </main>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    :host { display: block; height: 100%; }
    .qualification-page { max-width: 960px; margin: 0 auto; padding: 20px 16px 36px; }
    .state-row { display: flex; align-items: center; justify-content: center; gap: 12px; min-height: 220px; color: var(--secondary-text); }
    .spinner { width: 34px; height: 34px; border: 4px solid var(--border-color); border-top-color: var(--accent-color); border-radius: 50%; animation: spin .8s linear infinite; }
    @keyframes spin { to { transform: rotate(360deg); } }
    .empty-state { max-width: 620px; margin: 64px auto; text-align: center; color: var(--primary-text); }
    .empty-state h2 { margin: 0 0 8px; font-size: 1.35rem; }
    .empty-state p { margin: 0; color: var(--secondary-text); }
    .person-header { display: flex; align-items: flex-end; justify-content: space-between; gap: 16px; padding: 12px 0 20px; border-bottom: 1px solid var(--border-color); }
    .eyebrow { display: block; font-size: .72rem; font-weight: 700; text-transform: uppercase; color: var(--secondary-text); letter-spacing: 0; }
    .person-header h1 { margin: 4px 0 4px; font-size: clamp(1.4rem, 2.5vw, 2rem); color: var(--primary-text); }
    .person-header p { margin: 0; color: var(--secondary-text); overflow-wrap: anywhere; }
    .summary-pill { border: 1px solid var(--border-color); border-radius: 999px; padding: 6px 12px; font-size: .85rem; white-space: nowrap; background: var(--secondary-background); }
    .qualification-list { display: flex; flex-direction: column; gap: 10px; margin-top: 16px; }
    .qualification-row { display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 16px; padding: 14px 0; border-bottom: 1px solid var(--border-color); }
    .qualification-row.expired { opacity: .78; }
    .row-main h2 { margin: 0 0 6px; font-size: 1.05rem; color: var(--primary-text); }
    .row-meta { display: flex; flex-wrap: wrap; gap: 8px; color: var(--secondary-text); font-size: .86rem; }
    .row-meta span:not(:last-child)::after { content: ""; }
    .notes { margin: 8px 0 0; color: var(--secondary-text); line-height: 1.45; }
    .row-status { display: flex; flex-direction: column; align-items: flex-end; gap: 5px; min-width: 120px; }
    .status { display: inline-flex; border-radius: 999px; padding: 4px 10px; font-size: .78rem; font-weight: 700; background: #e8f5e9; color: #2e7d32; }
    .status[data-status="expired"], .status[data-status="inactive"] { background: #ffebee; color: #c62828; }
    .status[data-status="pending"] { background: #fff8e1; color: #8a5b00; }
    .date { color: var(--secondary-text); font-size: .78rem; white-space: nowrap; }
    @media (max-width: 640px) {
      .person-header { align-items: flex-start; flex-direction: column; }
      .qualification-row { grid-template-columns: 1fr; }
      .row-status { align-items: flex-start; min-width: 0; }
    }
  `]
})
export class QualificationLookupComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private serverApi = inject(ServerApiService);
  private pa = inject(PowerAutomateService);

  state = signal<LoadState>('loading');
  message = signal('');
  person = signal<PwaQualificationPersonDto | null>(null);

  activeCount = computed(() => (this.person()?.qualifications || [])
    .filter(q => {
      const status = this.normalizedStatus(q);
      return !this.isExpired(q) && status !== 'inactive' && status !== 'expired';
    }).length);

  ngOnInit(): void {
    const userId = this.route.snapshot.paramMap.get('userId') || '';
    if (!userId) {
      this.state.set('error');
      this.message.set('Missing user ID.');
      return;
    }
    this.load(userId);
  }

  private load(userId: string): void {
    this.state.set('loading');
    this.serverApi.getPublicQualifications(userId).subscribe({
      next: person => this.applyPerson(person, userId),
      error: () => this.loadViaPowerAutomate(userId)
    });
  }

  private loadViaPowerAutomate(userId: string): void {
    if (!this.pa.isV2Configured('qualifications')) {
      this.state.set('error');
      this.message.set('The server is offline and the qualifications flow is not configured.');
      return;
    }
    this.pa.submitV2('qualifications', {
      actionType: 'getByUser',
      id: userId,
      data: { UserId: userId }
    }).subscribe({
      next: response => {
        if (!response.success) {
          this.state.set('error');
          this.message.set(response.message || 'The qualifications flow returned an error.');
          return;
        }
        const qualifications = (response.data || []).map(row => this.mapPaRow(row));
        this.applyPerson(this.personFromRows(userId, qualifications), userId);
      },
      error: () => {
        this.state.set('error');
        this.message.set('Could not reach the server or the qualifications flow.');
      }
    });
  }

  private applyPerson(person: PwaQualificationPersonDto | null, userId: string): void {
    if (!person || !person.qualifications || person.qualifications.length === 0) {
      this.person.set(person || this.personFromRows(userId, []));
      this.state.set('empty');
      this.message.set('No active qualifications were returned for this person.');
      return;
    }
    this.person.set(person);
    this.state.set('ready');
  }

  private personFromRows(userId: string, qualifications: PwaQualificationDto[]): PwaQualificationPersonDto {
    const first = qualifications[0];
    return {
      userId,
      userName: first?.userName || `User ${userId}`,
      userEmail: first?.userEmail,
      windowsUsername: first?.windowsUsername,
      role: first?.role,
      qualificationCount: qualifications.length,
      qualifications
    };
  }

  private mapPaRow(row: any): PwaQualificationDto {
    return {
      sharepointId: String(row.ID ?? row.Id ?? row.id ?? ''),
      localUuid: row.PwaId,
      userId: String(row.UserId ?? ''),
      userName: row.UserName,
      userEmail: row.UserEmail,
      windowsUsername: row.WindowsUsername,
      role: row.Role,
      qualificationId: row.QualificationId,
      qualificationCode: row.QualificationCode,
      qualificationName: row.QualificationName || '',
      qualificationType: row.QualificationType,
      status: row.Status,
      issuedDate: row.IssuedDate,
      expirationDate: row.ExpirationDate,
      credentialNumber: row.CredentialNumber,
      issuer: row.Issuer,
      notes: row.Notes,
      spModifiedTime: row.Modified
    };
  }

  normalizedStatus(qualification: PwaQualificationDto): string {
    return (qualification.status || 'Active').trim().toLowerCase();
  }

  isExpired(qualification: PwaQualificationDto): boolean {
    if (!qualification.expirationDate) return false;
    const expiration = new Date(`${qualification.expirationDate}T23:59:59`);
    return !Number.isNaN(expiration.getTime()) && expiration.getTime() < Date.now();
  }
}
