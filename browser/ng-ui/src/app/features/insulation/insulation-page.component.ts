import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { switchMap, of } from 'rxjs';
import {
  InsulationApiService,
  InsulationItem,
  InsulationSourceMode,
  PwaFieldListDriftStatus,
} from './insulation-api.service';
import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-insulation-page',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Insulation Work</h1>
          <p class="sub">Active items awaiting insulation. Tap "Mark Complete" when finished — this closes the work order.</p>
        </div>
        <button class="refresh" (click)="load()" [disabled]="loading()">
          {{ loading() ? '…' : 'Refresh' }}
        </button>
      </header>

      @if (mode() === 'sharepoint') {
        <div class="offline-banner">
          <span class="dot"></span>
          <div>
            <strong>Offline mode</strong> — hub is unreachable. Closes are queued in SharePoint and
            will process on the plant side when the hub reconnects.
          </div>
        </div>
      }

      @if (pendingCount() > 0) {
        <div class="queue-note">
          {{ pendingCount() }} offline close{{ pendingCount() > 1 ? 's' : '' }} in queue waiting for hub confirmation.
        </div>
      }

      @if (error()) {
        <div class="error">{{ error() }}</div>
      }

      @if (!loading() && items().length === 0 && !error()) {
        <div class="empty">
          <div class="empty-icon">✓</div>
          <div class="empty-title">All caught up</div>
          <div class="empty-sub">No active insulation items right now.</div>
        </div>
      }

      <ul class="items">
        @for (item of items(); track trackFn(item)) {
          <li class="item" [class.completing]="completing() === keyFor(item)">
            <div class="item-head">
              <div class="item-title">{{ item.title || 'Untitled insulation item' }}</div>
              @if (item.maximoWonum) {
                <span class="pill wo">{{ item.maximoWonum }}</span>
              }
              @if (item.maximoStatus) {
                <span class="pill status" [class]="'status-' + (item.maximoStatus || '').toLowerCase()">
                  {{ item.maximoStatus }}
                </span>
              }
              @if (item.fromSharePoint) {
                <span class="pill sp">SharePoint</span>
              }
              @if (driftFor(item); as d) {
                <span class="drift-badge"
                      [title]="driftTooltip(d)">
                  &#9888; sync
                </span>
              }
            </div>

            <div class="item-body">
              @if (item.locationName || item.specificLocation) {
                <div class="meta">
                  <span class="label">Location:</span>
                  {{ item.locationName || '' }}
                  @if (item.locationName && item.specificLocation) { <span> — </span> }
                  {{ item.specificLocation || '' }}
                </div>
              }
              @if (item.equipmentTag) {
                <div class="meta"><span class="label">Equipment:</span> {{ item.equipmentTag }}</div>
              }
              @if (item.dateObserved) {
                <div class="meta">
                  <span class="label">Observed:</span>
                  {{ item.dateObserved }}
                  @if (item.timeObserved) { <span> {{ item.timeObserved }}</span> }
                </div>
              }
              @if (item.submitterName) {
                <div class="meta"><span class="label">Reported by:</span> {{ item.submitterName }}</div>
              }
              @if (item.notes) {
                <div class="notes">{{ item.notes }}</div>
              }
            </div>

            <div class="item-actions">
              <button class="complete-btn"
                      [disabled]="completing() != null"
                      (click)="markComplete(item)">
                {{ completing() === keyFor(item) ? 'Closing…' : 'Mark Complete' }}
              </button>
            </div>
          </li>
        }
      </ul>
    </div>
  `,
  styles: [`
    :host { display: block; padding: 16px; max-width: 800px; margin: 0 auto; }
    .page-head { display: flex; align-items: flex-start; justify-content: space-between; gap: 16px; margin-bottom: 20px; }
    .page-head h1 { margin: 0 0 4px; font-size: 1.4rem; }
    .sub { margin: 0; color: #555; font-size: 0.9rem; line-height: 1.4; }
    .refresh { padding: 10px 16px; border: 1px solid #ccc; background: white; border-radius: 6px; cursor: pointer; font-size: 0.9rem; }
    .refresh:disabled { opacity: 0.5; cursor: not-allowed; }
    .offline-banner {
      display: flex; align-items: center; gap: 12px;
      background: #fff3cd; border: 1px solid #f0c674; border-radius: 6px;
      padding: 12px 14px; margin-bottom: 14px; color: #664d03;
    }
    .offline-banner strong { display: block; margin-bottom: 2px; }
    .offline-banner .dot {
      width: 10px; height: 10px; border-radius: 50%; background: #f0c674;
      animation: pulse 1.6s ease-in-out infinite;
    }
    @keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.4; } }
    .queue-note {
      background: #e3f2fd; color: #1565c0; padding: 10px 12px;
      border-radius: 6px; margin-bottom: 14px; font-size: 0.85rem;
    }
    .error { background: #fee; color: #900; padding: 12px; border-radius: 6px; margin: 12px 0; }
    .empty { text-align: center; padding: 40px 20px; color: #666; }
    .empty-icon { font-size: 3rem; color: #4caf50; margin-bottom: 12px; }
    .empty-title { font-size: 1.2rem; font-weight: 600; margin-bottom: 4px; }
    .empty-sub { font-size: 0.9rem; color: #888; }
    .items { list-style: none; padding: 0; margin: 0; }
    .item { background: white; border: 1px solid #e0e0e0; border-radius: 8px; padding: 14px; margin-bottom: 12px; transition: opacity 0.2s; }
    .item.completing { opacity: 0.6; }
    .item-head { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 10px; }
    .item-title { flex: 1 1 200px; font-weight: 600; color: #222; }
    .pill { padding: 2px 8px; border-radius: 12px; font-size: 0.75rem; font-family: ui-monospace, monospace; }
    .pill.wo { background: #e3f2fd; color: #0d47a1; }
    .pill.status { background: #f0f0f0; color: #555; }
    .pill.status.status-wappr { background: #fff3cd; color: #856404; }
    .pill.status.status-appr { background: #d1ecf1; color: #0c5460; }
    .pill.status.status-inprg { background: #d4edda; color: #155724; }
    .pill.sp { background: #f3e5f5; color: #6a1b9a; }
    .drift-badge {
      display: inline-flex; align-items: center; gap: 3px;
      padding: 2px 8px; border-radius: 12px; font-size: 0.75rem;
      background: #fff3cd; color: #856404; border: 1px solid #f0c674;
      cursor: help;
    }
    .item-body { font-size: 0.9rem; color: #333; line-height: 1.5; }
    .meta { margin: 2px 0; }
    .label { color: #666; font-weight: 500; }
    .notes { margin-top: 8px; padding: 8px 10px; background: #f8f8f8; border-left: 3px solid #ccc; border-radius: 3px; white-space: pre-wrap; }
    .item-actions { margin-top: 12px; }
    .complete-btn {
      width: 100%; padding: 12px; border: none; border-radius: 6px; background: #4caf50; color: white;
      font-size: 1rem; font-weight: 600; cursor: pointer; transition: background 0.15s;
    }
    .complete-btn:hover:not(:disabled) { background: #43a047; }
    .complete-btn:disabled { background: #999; cursor: not-allowed; }
  `]
})
export class InsulationPageComponent implements OnInit {
  private api = inject(InsulationApiService);
  private authService = inject(AuthService);

  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<InsulationItem[]>([]);
  /**
   * Tracks which item is currently completing. Uses `keyFor(item)` (id or sharepointId)
   * so both hub-sourced and SP-sourced rows can be distinguished — an SP-only row has
   * id=0 and would collide with any other SP-only row if we keyed on id alone.
   */
  completing = signal<string | null>(null);
  mode = signal<InsulationSourceMode>('hub');
  pendingCount = signal(0);
  /** Per-item drift status keyed by hub id. SP-only items (id=0) never appear here. */
  driftMap = signal<Record<number, PwaFieldListDriftStatus>>({});

  ngOnInit(): void {
    // Prune anything the hub has already picked up so the queue-count is honest.
    this.api.pruneAckedCompletions();
    this.pendingCount.set(this.api.getPendingCompletions().length);
    this.load();
  }

  /**
   * Two-step load: probe hub reachability first, then either fetch via hub or fall back
   * to PA/SharePoint. Deliberately does NOT try both paths and merge — SP data lacks
   * Maximo status and wonum, so mixing sources would show confusing rows.
   */
  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.isHubReachable().pipe(
      switchMap(reachable => {
        if (reachable) {
          this.mode.set('hub');
          return this.api.listActiveViaHub();
        }
        // Hub not reachable — fall back to SharePoint via PA gateway (Supabase JWT auth).
        // Only viable if user has a Supabase session — signed-out or hub-only auth loses.
        if (!this.hasSupabaseSession()) {
          this.mode.set('error');
          this.error.set('Hub unreachable and no offline session — please sign in and try again.');
          this.loading.set(false);
          return of({ responseData: [] as InsulationItem[], message: '', timestamp: '' });
        }
        this.mode.set('sharepoint');
        return this.api.listActiveViaSp().pipe(
          switchMap(rows => of({ responseData: rows, message: 'via SP', timestamp: '' }))
        );
      })
    ).subscribe({
      next: r => {
        const items = r.responseData ?? [];
        this.items.set(items);
        this.loading.set(false);
        // Only hub-mode items have a hub id; drift lookup uses that id — SP-only items
        // (id=0) are skipped by the service. Fail-quiet on hub outage.
        const hubIds = items.map(i => i.id).filter(id => id && id > 0);
        if (hubIds.length > 0) {
          this.api.driftStatus(hubIds).subscribe(m => this.driftMap.set(m));
        } else {
          this.driftMap.set({});
        }
      },
      error: e => {
        this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load active items');
        this.loading.set(false);
      }
    });
  }

  /**
   * Drift signal for one item, or null if nothing to flag. A row appears in the badge only
   * when at least ONE drift dimension is true (hub / sp / maximo-pending / divergence).
   */
  driftFor(item: InsulationItem): PwaFieldListDriftStatus | null {
    if (!item.id || item.id <= 0) return null;
    const d = this.driftMap()[item.id];
    if (!d) return null;
    const any = d.hubDrift || d.spDrift || d.maximoPending
        || d.maximoClosedLocalOpen || d.localClosedMaximoOpen;
    return any ? d : null;
  }

  driftTooltip(d: PwaFieldListDriftStatus): string {
    const parts: string[] = [];
    if (d.hubDrift) parts.push('Local differs from hub');
    if (d.spDrift) parts.push('Missing from SharePoint');
    if (d.maximoPending) parts.push('Maximo action pending');
    if (d.maximoClosedLocalOpen) parts.push('Maximo closed — local still open');
    if (d.localClosedMaximoOpen) parts.push('Local closed — WO still open in Maximo');
    return parts.length > 0
        ? parts.join('; ') + '. Escalate to admin — Drift Center will resolve.'
        : 'Out of sync — escalate to admin';
  }

  markComplete(item: InsulationItem): void {
    const key = this.keyFor(item);
    this.completing.set(key);

    // Route by the mode we're currently in (which was determined by the last load).
    if (this.mode() === 'sharepoint' || item.fromSharePoint) {
      const actor = this.currentUserHandle();
      this.api.markCompleteViaSp(item, actor).subscribe({
        next: ok => {
          this.completing.set(null);
          if (ok) {
            this.items.update(list => list.filter(i => this.keyFor(i) !== key));
            this.pendingCount.set(this.api.getPendingCompletions().length);
          } else {
            this.error.set('Could not close via SharePoint — check your connection and retry');
          }
        },
        error: e => {
          this.completing.set(null);
          this.error.set(e?.error?.message ?? e?.message ?? 'Offline close failed');
        }
      });
      return;
    }

    // Hub online path.
    this.api.markCompleteViaHub(item.id).subscribe({
      next: r => {
        this.completing.set(null);
        if (r.responseData === true) {
          this.items.update(list => list.filter(i => this.keyFor(i) !== key));
        } else {
          this.error.set(r.message || 'Could not close this WO — retry or see supervisor');
        }
      },
      error: e => {
        this.completing.set(null);
        this.error.set(e?.error?.message ?? e?.message ?? 'Complete failed');
      }
    });
  }

  /**
   * Composite key for optimistic UI operations. Hub rows have a unique numeric id;
   * SP-only rows have id=0 and are keyed by sharepointId. A single track/completing key
   * shape avoids collisions across the two.
   */
  keyFor(item: InsulationItem): string {
    return item.id ? `hub:${item.id}` : `sp:${item.sharepointId ?? '?'}`;
  }
  trackFn = (item: InsulationItem) => this.keyFor(item);

  private hasSupabaseSession(): boolean {
    // AuthService exposes AuthData with source='hub'|'supabase'. Offline mode requires
    // the caller to have a valid Supabase session (the PA gateway validates it).
    // Use a defensive access path — if the auth API shape changes, we fail closed to
    // "no offline path available" rather than crashing.
    try {
      const anyAuth = this.authService as any;
      const data = typeof anyAuth.getAuthData === 'function' ? anyAuth.getAuthData() : null;
      return !!(data && (data.source === 'supabase' || data.supabaseRefreshToken));
    } catch { return false; }
  }

  private currentUserHandle(): string {
    try {
      const anyAuth = this.authService as any;
      const data = typeof anyAuth.getAuthData === 'function' ? anyAuth.getAuthData() : null;
      return data?.user?.email || data?.user?.name || 'insulation-contractor';
    } catch { return 'insulation-contractor'; }
  }
}
