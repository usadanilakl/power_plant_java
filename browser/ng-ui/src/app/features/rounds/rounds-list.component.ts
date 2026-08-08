import { Component, OnInit, inject, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { RoundsApiService } from './rounds-api.service';
import { RoundsStore } from './rounds-store.service';
import { RoundsSyncService } from './rounds-sync.service';
import { RoundListItem } from './rounds.model';

/** Mobile rounds home: the active rounds an operator can perform. Grab (online) creates an instance, then perform. */
@Component({
  selector: 'app-rounds-list',
  standalone: true,
  imports: [MainLayoutComponent, DatePipe],
  template: `
    <app-main-layout header="Rounds">
      <ng-container main-content>
        <div class="rl">
          @if (offline()) { <div class="rl-offline">Offline — showing your last synced rounds.</div> }
          @if (sync.pendingCount() > 0) {
            <div class="rl-pending">{{ sync.pendingCount() }} round(s) waiting to submit — will send when back online.</div>
          }
          <button class="rl-issues" (click)="openIssues()">⚠ Active out-of-range</button>

          @if (loading()) {
            <p class="rl-msg">Loading…</p>
          } @else if (error()) {
            <p class="rl-msg rl-error">{{ error() }}</p>
          } @else if (!rounds().length) {
            <p class="rl-msg">No active rounds.</p>
          } @else {
            @for (r of rounds(); track r.id) {
              <div class="rl-card">
                <div class="rl-body">
                  <div class="rl-name">{{ r.name || '(unnamed round)' }}</div>
                  <div class="rl-meta">
                    @if (r.due && !r.myActiveInstanceId) { <span class="rl-chip due">Due</span> }
                    @if (r.area) { <span class="rl-chip">{{ r.area }}</span> }
                    @if (r.cadence) { <span class="rl-chip">{{ r.cadence }}</span> }
                    <span class="rl-chip">{{ r.questionCount }} checks</span>
                  </div>
                  <div class="rl-last">
                    @if (r.lastPerformedAt) { Last done {{ r.lastPerformedAt | date:'MMM d, h:mm a' }} }
                    @else { Never performed }
                  </div>
                  @if (r.grabbedBy && !r.myActiveInstanceId) {
                    <div class="rl-grabbed">In progress · {{ r.grabbedBy }}</div>
                  }
                </div>
                @if (r.myActiveInstanceId) {
                  <button class="rl-go rl-continue" (click)="perform(r)">Continue</button>
                } @else {
                  <button class="rl-go" [disabled]="busyId() === r.id" (click)="start(r)">
                    {{ busyId() === r.id ? '…' : 'Start' }}
                  </button>
                }
              </div>
            }
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .rl { padding: 10px 12px; }
    .rl-offline { background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .rl-pending { background: var(--info-bg); color: var(--info-text); border: 1px solid var(--accent-color); border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .rl-issues { width: 100%; background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); border-radius: 8px; padding: 12px; font-size: 14px; margin-bottom: 12px; }
    .rl-msg { padding: 20px; text-align: center; color: var(--secondary-text); }
    .rl-error { color: var(--danger-text); }
    .rl-card { display: flex; align-items: center; gap: 10px; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 10px; }
    .rl-body { flex: 1; min-width: 0; }
    .rl-name { font-size: 15px; font-weight: 600; color: var(--primary-text); }
    .rl-meta { margin-top: 4px; }
    .rl-chip { display: inline-block; background: var(--secondary-background); color: var(--secondary-text); border-radius: 4px; padding: 2px 7px; margin: 2px 4px 0 0; font-size: 12px; }
    .rl-chip.due { background: var(--danger-bg); color: var(--danger-text); font-weight: 600; }
    .rl-last { margin-top: 4px; color: var(--secondary-text); font-size: 12px; }
    .rl-grabbed { margin-top: 5px; color: var(--warning-text); font-size: 12px; }
    .rl-go { flex: none; min-height: 48px; background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 8px; padding: 10px 18px; font-size: 15px; font-weight: 600; }
    .rl-go:disabled { opacity: 0.5; }
    .rl-continue { background: var(--success-solid); }
  `],
})
export class RoundsListComponent implements OnInit {
  private api = inject(RoundsApiService);
  private store = inject(RoundsStore);
  sync = inject(RoundsSyncService);
  private router = inject(Router);

  rounds = signal<RoundListItem[]>([]);
  loading = signal(false);
  error = signal('');
  offline = signal(false);
  busyId = signal<number | null>(null);

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.sync.refreshPendingCount();
    try {
      const list = await firstValueFrom(this.api.listRounds());
      this.rounds.set(list);
      this.store.cacheList(list);
    } catch (e: any) {
      const cached = this.store.getCachedList();
      if (cached) { this.rounds.set(cached.list); this.offline.set(true); }
      else this.error.set(e?.error?.message || e?.message || 'Failed to load rounds');
    } finally {
      this.loading.set(false);
    }
  }

  async start(r: RoundListItem): Promise<void> {
    this.busyId.set(r.id);
    this.error.set('');
    try {
      await firstValueFrom(this.api.grab(r.id));
      this.perform(r);
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Grab failed — check your connection');
    } finally {
      this.busyId.set(null);
    }
  }

  perform(r: RoundListItem): void {
    this.router.navigate(['/rounds', r.id, 'perform']);
  }

  openIssues(): void {
    this.router.navigate(['/rounds/issues']);
  }
}
