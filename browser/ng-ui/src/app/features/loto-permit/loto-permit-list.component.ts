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
                        <span class="pl-chip">{{ it.pointCount }} pts</span>
                        @if (b.phase === 'HANG') { <span class="pl-chip">{{ it.hungCount }}/{{ it.pointCount }} hung</span> }
                        @if (b.phase === 'VERIFY') { <span class="pl-chip">{{ it.verifiedCount }}/{{ it.pointCount }} verified</span> }
                        @if (b.phase === 'WALKDOWN' && it.walkdownSessions) { <span class="pl-chip">{{ it.walkdownSessions }} session(s)</span> }
                      </div>
                      @if (grabLabel(b.phase, it); as g) { <div class="pl-grab">{{ g }}</div> }
                    </div>
                    <button class="pl-go" [disabled]="busyId() === it.id" (click)="go(b.phase, it)">
                      {{ busyId() === it.id ? '…' : b.action }}
                    </button>
                  </div>
                } @empty { <p class="pl-empty">Nothing {{ b.empty }}.</p> }
              </div>
            }
          }
        </div>
      </ng-container>
    </app-main-layout>
  `,
  styles: [`
    .pl { padding: 10px 12px; }
    .pl-net { background: #fff8e1; color: #8d6e00; border: 1px solid #ffe082; border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .pl-pending { background: #e3f2fd; color: #1565c0; border: 1px solid #90caf9; border-radius: 8px; padding: 8px 10px; font-size: 12px; margin-bottom: 8px; }
    .pl-msg { padding: 20px; text-align: center; color: #777; }
    .pl-err { color: #c62828; }
    .pl-sec { margin-bottom: 16px; }
    .pl-sec-h { font-size: 13px; font-weight: 700; color: #37474f; text-transform: uppercase; margin-bottom: 6px; }
    .pl-count { background: #eceff1; border-radius: 8px; padding: 0 7px; font-size: 11px; color: #607d8b; }
    .pl-card { display: flex; align-items: center; gap: 10px; background: #fff; border: 1px solid #e6e6e6; border-radius: 10px; padding: 12px; margin-bottom: 8px; }
    .pl-body { flex: 1; min-width: 0; }
    .pl-name { font-size: 15px; font-weight: 600; }
    .pl-meta { margin-top: 4px; }
    .pl-chip { display: inline-block; background: #eef2f7; color: #445; border-radius: 4px; padding: 2px 7px; margin: 2px 4px 0 0; font-size: 12px; }
    .pl-grab { margin-top: 5px; color: #e65100; font-size: 12px; }
    .pl-go { flex: none; background: #1976d2; color: #fff; border: none; border-radius: 8px; padding: 10px 14px; font-size: 14px; }
    .pl-go:disabled { background: #90caf9; }
    .pl-empty { color: #999; font-size: 13px; padding: 6px 2px; }
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

  items(phase: Phase): PwaLotoListItem[] { return this.all().filter(i => i.phases.includes(phase)); }

  async ngOnInit(): Promise<void> {
    this.loading.set(true);
    this.sync.refresh();
    try {
      const list = await firstValueFrom(this.api.list());
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

  grabLabel(phase: Phase, it: PwaLotoListItem): string | null {
    const g = phase === 'HANG' ? it.hangGrab : phase === 'VERIFY' ? it.verifyGrab : null;
    return g && g.byName ? `In progress · ${g.byName}` : null;
  }

  async go(phase: Phase, it: PwaLotoListItem): Promise<void> {
    if (phase === 'WALKDOWN') { this.router.navigate(['/loto', it.id, 'walkdown']); return; }
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
