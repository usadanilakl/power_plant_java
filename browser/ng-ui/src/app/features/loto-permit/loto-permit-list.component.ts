import { Component, OnInit, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';
import { MainLayoutComponent } from '../../layouts/main-layout/main-layout.component';
import { LotoPermitApiService } from './loto-permit-api.service';
import { LotoPermitStore } from './loto-permit-store.service';
import { LotoPermitSyncService } from './loto-permit-sync.service';
import { Phase, PwaLotoListItem } from './loto-permit.model';

/** Mobile LOTO permit home: permits that are ready to be hung, verified, or walked down. Grab → perform. */
@Component({
  selector: 'app-loto-permit-list',
  standalone: true,
  imports: [MainLayoutComponent],
  template: `
    <app-main-layout header="LOTO">
      <ng-container main-content>
        <div class="pl">
          @if (offline()) { <div class="pl-net">📴 Offline — showing last synced permits.</div> }
          @if (sync.pendingCount() > 0) { <div class="pl-pending">{{ sync.pendingCount() }} submission(s) waiting to send.</div> }

          @if (loading()) { <p class="pl-msg">Loading…</p> }
          @else if (error()) { <p class="pl-msg pl-err">{{ error() }}</p> }
          @else {
            @for (b of buckets; track b.phase) {
              <div class="pl-sec">
                <div class="pl-sec-h">{{ b.label }} <span class="pl-count">{{ items(b.phase).length }}</span></div>
                @for (it of items(b.phase); track it.id) {
                  <div class="pl-card">
                    <div class="pl-body" (click)="go(b.phase, it)">
                      <div class="pl-name">{{ it.permitNumber || ('Permit #' + it.id) }}</div>
                      <div class="pl-meta">
                        @if (it.equipmentSystem) { <span class="pl-chip">{{ it.equipmentSystem }}</span> }
                        @if (it.requestor) { <span class="pl-chip">{{ it.requestor }}</span> }
                        @if (it.status) { <span class="pl-chip">{{ it.status }}</span> }
                        <span class="pl-chip">{{ it.pointCount }} pts</span>
                        @if (b.phase === 'HANG') { <span class="pl-chip">{{ it.hungCount }}/{{ it.pointCount }} hung</span> }
                        @if (b.phase === 'VERIFY') { <span class="pl-chip">{{ it.verifiedCount }}/{{ it.pointCount }} verified</span> }
                        @if (b.phase === 'WALKDOWN' && it.walkdownSessions) { <span class="pl-chip">{{ it.walkdownSessions }} session(s)</span> }
                      </div>
                      @if (grabLabel(b.phase, it); as g) { <div class="pl-grab">{{ g }}</div> }
                      @if (b.phase === 'VERIFY' && it.verifyBlockedForMe) {
                        <div class="pl-blocked">🔒 You hung this — someone else must verify</div>
                      }
                    </div>
                    <button class="pl-go" [class.view]="b.phase === 'VERIFY' && it.verifyBlockedForMe"
                            [disabled]="busyId() === it.id" (click)="go(b.phase, it)">
                      {{ busyId() === it.id ? '…' : (b.phase === 'VERIFY' && it.verifyBlockedForMe ? 'View' : b.action) }}
                    </button>
                  </div>
                } @empty { <p class="pl-empty">Nothing {{ b.empty }}.</p> }
              </div>
            }

            <!--
              Everything with no step available to this user right now. These were dropped by the
              server before they could ever render, which hid every Building permit awaiting CA
              approval and every Active one with nothing left to do. They open read-only.
            -->
            <div class="pl-sec">
              <div class="pl-sec-h">Other permits <span class="pl-count">{{ others().length }}</span></div>
              @for (it of others(); track it.id) {
                <div class="pl-card">
                  <div class="pl-body" (click)="view(it)">
                    <div class="pl-name">{{ it.permitNumber || ('Permit #' + it.id) }}</div>
                    <div class="pl-meta">
                      @if (it.status) { <span class="pl-chip">{{ it.status }}</span> }
                      @if (it.equipmentSystem) { <span class="pl-chip">{{ it.equipmentSystem }}</span> }
                      @if (it.requestor) { <span class="pl-chip">{{ it.requestor }}</span> }
                      <span class="pl-chip">{{ it.pointCount }} pts</span>
                      <span class="pl-chip">{{ it.hungCount }}/{{ it.pointCount }} hung</span>
                      <span class="pl-chip">{{ it.verifiedCount }}/{{ it.pointCount }} verified</span>
                    </div>
                  </div>
                  <button class="pl-go view" (click)="view(it)">View</button>
                </div>
              } @empty { <p class="pl-empty">Nothing else to show.</p> }
            </div>

            <button class="pl-closed" (click)="toggleClosed()" [disabled]="loading()">
              {{ includeClosed() ? 'Hide closed permits' : 'Show closed permits' }}
            </button>
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .pl { padding: 10px 12px; }
    .pl-net { background: var(--warning-bg); color: var(--warning-text); border: 1px solid var(--warning-border); border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .pl-pending { background: var(--info-bg); color: var(--info-text); border: 1px solid var(--accent-color); border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .pl-msg { padding: 20px; text-align: center; color: var(--secondary-text); }
    .pl-err { color: var(--danger-text); }
    .pl-sec { margin-bottom: 16px; }
    .pl-sec-h { font-size: 13px; font-weight: 700; color: var(--primary-text); text-transform: uppercase; margin-bottom: 6px; }
    .pl-count { background: var(--secondary-background); border-radius: 8px; padding: 0 7px; font-size: 11px; color: var(--secondary-text); }
    .pl-card { display: flex; align-items: center; gap: 10px; background: var(--card-background); border: 1px solid var(--border-color); border-radius: 10px; padding: 12px; margin-bottom: 8px; }
    .pl-body { flex: 1; min-width: 0; }
    .pl-name { font-size: 15px; font-weight: 600; color: var(--primary-text); }
    .pl-meta { margin-top: 4px; }
    .pl-chip { display: inline-block; background: var(--secondary-background); color: var(--secondary-text); border-radius: 4px; padding: 2px 7px; margin: 2px 4px 0 0; font-size: 12px; }
    .pl-grab { margin-top: 5px; color: var(--warning-text); font-size: 12px; }
    .pl-blocked { margin-top: 5px; color: var(--danger-text); font-size: 12px; }
    .pl-go.view { background: var(--secondary-text); }
    .pl-go { flex: none; min-height: 48px; background: var(--accent-color); color: var(--on-solid); border: none; border-radius: 8px; padding: 10px 16px; font-size: 15px; font-weight: 600; }
    .pl-go:disabled { opacity: 0.5; }
    .pl-empty { color: var(--secondary-text); font-size: 13px; padding: 6px 2px; }
    .pl-closed { width: 100%; min-height: 44px; margin-top: 4px; background: none; border: 1px solid var(--border-color); border-radius: 8px; color: var(--secondary-text); font-size: 14px; }
  `],
})
export class LotoPermitListComponent implements OnInit {
  private api = inject(LotoPermitApiService);
  private store = inject(LotoPermitStore);
  sync = inject(LotoPermitSyncService);
  private router = inject(Router);

  readonly buckets: { phase: Phase; label: string; action: string; empty: string }[] = [
    { phase: 'HANG', label: 'Ready to hang', action: 'Hang', empty: 'ready to hang' },
    { phase: 'VERIFY', label: 'Ready to verify', action: 'Verify', empty: 'ready to verify' },
    { phase: 'WALKDOWN', label: 'Ready to walk down', action: 'Walk down', empty: 'ready to walk down' },
  ];

  all = signal<PwaLotoListItem[]>([]);
  loading = signal(false);
  error = signal('');
  offline = signal(false);
  busyId = signal<number | null>(null);
  includeClosed = signal(false);

  items(phase: Phase): PwaLotoListItem[] { return this.all().filter(i => i.phases.includes(phase)); }

  /** Permits with no step available to this user — visible, but read-only. */
  others(): PwaLotoListItem[] { return this.all().filter(i => !i.phases.length); }

  async ngOnInit(): Promise<void> {
    await this.load();
  }

  /** Reload the list. Closed permits are fetched only on request — see PwaLotoService.list. */
  private async load(): Promise<void> {
    this.loading.set(true);
    this.sync.refresh();
    try {
      const list = await firstValueFrom(this.api.list(this.includeClosed()));
      this.all.set(list);
      this.store.cacheList(list);
    } catch (e: any) {
      const cached = this.store.getCachedList();
      if (cached) { this.all.set(cached.list); this.offline.set(true); }
      else this.error.set(e?.error?.message || e?.message || 'Failed to load permits');
    } finally {
      this.loading.set(false);
    }
  }

  async toggleClosed(): Promise<void> {
    this.includeClosed.update(v => !v);
    await this.load();
  }

  /** Open a permit read-only — no grab, since there is nothing to claim. */
  view(it: PwaLotoListItem): void { this.router.navigate(['/loto', it.id]); }

  grabLabel(phase: Phase, it: PwaLotoListItem): string | null {
    const g = phase === 'HANG' ? it.hangGrab : phase === 'VERIFY' ? it.verifyGrab : null;
    return g && g.byName ? `In progress · ${g.byName}` : null;
  }

  async go(phase: Phase, it: PwaLotoListItem): Promise<void> {
    if (phase === 'WALKDOWN') { this.router.navigate(['/loto', it.id, 'walkdown']); return; }
    // Separation of duty: the hanger may open the permit to review it, but must not grab it for verification.
    if (phase === 'VERIFY' && it.verifyBlockedForMe) { this.router.navigate(['/loto', it.id, 'verify']); return; }
    this.busyId.set(it.id);
    this.error.set('');
    try {
      await firstValueFrom(this.api.grab(it.id, phase));
      this.router.navigate(['/loto', it.id, phase.toLowerCase()]);
    } catch (e: any) {
      this.error.set(e?.error?.message || e?.message || 'Grab failed — check your connection');
    } finally {
      this.busyId.set(null);
    }
  }
}
