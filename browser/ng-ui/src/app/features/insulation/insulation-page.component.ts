import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { switchMap, of } from 'rxjs';
import {
  InsulationApiService,
  InsulationItem,
  InsulationSourceMode,
  PwaFieldListDriftStatus,
} from './insulation-api.service';
import { AuthService } from '../../auth/auth.service';

/** Photo picked from the details dialog's file input, held as a data URL until submit. */
interface NewPhoto {
  name: string;         // fileName — dedup key too
  contentType: string;
  base64Content: string;  // raw base64 (no data-URI prefix) matching PaAttachmentDto shape
  dataUrl: string;        // pre-built `data:<ct>;base64,<b64>` for the <img> preview
}

@Component({
  selector: 'app-insulation-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page">
      <header class="page-head">
        <div>
          <h1>Insulation Work</h1>
          <p class="sub">Active items awaiting insulation. Tap an item for details, add photos + a comment, then Complete Work Order.</p>
        </div>
        <button class="refresh" (click)="load()" [disabled]="loading()">
          {{ loading() ? '…' : 'Refresh' }}
        </button>
      </header>

      <label class="toggle-row">
        <input type="checkbox" [checked]="showClosed()" (change)="toggleShowClosed($event)" />
        <span>Show recently closed (last 30 days)</span>
      </label>

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
          <li class="item" (click)="openDetails(item)">
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
              <div class="tap-hint">Tap to view / complete</div>
            </div>
          </li>
        }
      </ul>
    </div>

    <!-- Details dialog: view images + more data, add a comment, take/attach a photo, complete. -->
    @if (detailItem(); as d) {
      <div class="modal-backdrop" (click)="closeDetails()">
        <div class="modal-sheet" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <div class="modal-title">{{ d.title || 'Untitled insulation item' }}</div>
            <button type="button" class="modal-close" (click)="closeDetails()">&times;</button>
          </div>
          <div class="modal-body">
            @if (d.maximoWonum) {
              <div class="modal-pill-row">
                <span class="pill wo">{{ d.maximoWonum }}</span>
                @if (d.maximoStatus) {
                  <span class="pill status" [class]="'status-' + (d.maximoStatus || '').toLowerCase()">{{ d.maximoStatus }}</span>
                }
              </div>
            }
            @if (d.locationName || d.specificLocation) {
              <div class="modal-meta"><span class="label">Location:</span> {{ d.locationName }}{{ d.locationName && d.specificLocation ? ' — ' : '' }}{{ d.specificLocation }}</div>
            }
            @if (d.equipmentTag) {
              <div class="modal-meta"><span class="label">Equipment:</span> {{ d.equipmentTag }}</div>
            }
            @if (d.dateObserved) {
              <div class="modal-meta"><span class="label">Observed:</span> {{ d.dateObserved }} {{ d.timeObserved || '' }}</div>
            }
            @if (d.submitterName) {
              <div class="modal-meta"><span class="label">Reported by:</span> {{ d.submitterName }}</div>
            }
            @if (d.notes) {
              <div class="modal-notes">{{ d.notes }}</div>
            }

            <!-- Existing images. Tap for lightbox. -->
            @if (detailImages().length > 0) {
              <div class="detail-images">
                @for (img of detailImages(); track img.id) {
                  <img [src]="img.dataUrl" [alt]="img.fileName" class="detail-thumb"
                       (click)="lightboxSrc.set(img.dataUrl)" />
                }
              </div>
            } @else if (loadingAttachments()) {
              <div class="modal-meta">Loading photos…</div>
            }

            <!-- Comment for the WO worklog. -->
            <label class="field-label">Comment (added to WO worklog):</label>
            <textarea class="field-input" rows="3"
                      placeholder="Notes about how it was completed…"
                      [(ngModel)]="commentDraft"></textarea>

            <!-- New photos to attach. -->
            <label class="field-label">Add photo(s):</label>
            <input class="field-file" type="file" accept="image/*" capture="environment"
                   multiple (change)="onPhotoAdd($event)" />
            @if (newPhotos().length > 0) {
              <div class="new-photos">
                @for (p of newPhotos(); track p.name) {
                  <div class="new-photo-cell">
                    <img [src]="p.dataUrl" [alt]="p.name" class="new-photo-thumb" />
                    <button type="button" class="new-photo-remove"
                            (click)="removeNewPhoto(p.name)"
                            [attr.aria-label]="'Remove ' + p.name">&times;</button>
                  </div>
                }
              </div>
            }
          </div>

          <div class="modal-footer">
            <button type="button" class="footer-btn footer-btn-secondary" (click)="closeDetails()">Cancel</button>
            <!-- Save-only: persists the comment/photos WITHOUT closing the WO. Works for
                 both open and already-closed items so contractors can append photos or
                 notes to a completed job without going through reopen + re-complete. -->
            <button type="button" class="footer-btn footer-btn-save"
                    [disabled]="saving() != null || !canSave()"
                    (click)="saveProgressFromDialog()">
              {{ saving() === keyFor(d) ? 'Saving…' : 'Save' }}
            </button>
            @if (isClosed(d)) {
              <button type="button" class="footer-btn footer-btn-reopen"
                      [disabled]="reopening()"
                      (click)="reopenFromDialog()">
                {{ reopening() ? 'Reopening…' : 'Reopen' }}
              </button>
            } @else {
              <button type="button" class="footer-btn footer-btn-primary"
                      [disabled]="completing() != null"
                      (click)="completeFromDialog()">
                {{ completing() === keyFor(d) ? 'Closing…' : 'Complete Work Order' }}
              </button>
            }
          </div>
        </div>
      </div>
    }

    <!-- Simple lightbox for a tapped photo. -->
    @if (lightboxSrc()) {
      <div class="lightbox" (click)="lightboxSrc.set(null)">
        <img [src]="lightboxSrc()!" class="lightbox-img" alt="Full size" (click)="$event.stopPropagation()" />
        <button class="lightbox-close" (click)="lightboxSrc.set(null)">&times;</button>
      </div>
    }
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
    .tap-hint { margin-top: 8px; font-size: 0.75rem; color: #888; font-style: italic; }
    /* Details dialog */
    .modal-backdrop { position: fixed; inset: 0; background: rgba(0,0,0,0.55); z-index: 9999;
      display: flex; align-items: flex-end; justify-content: center; }
    .modal-sheet { background: white; width: 100%; max-width: 640px; max-height: 92vh;
      display: flex; flex-direction: column; border-radius: 12px 12px 0 0;
      box-shadow: 0 -6px 24px rgba(0,0,0,0.3); overflow: hidden; }
    @media (min-width: 641px) {
      .modal-backdrop { align-items: center; }
      .modal-sheet { border-radius: 12px; }
    }
    .modal-head { display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid #eee; background: #fafafa; }
    .modal-title { font-size: 1.05rem; font-weight: 600; color: #222; margin: 0; }
    .modal-close { background: none; border: none; font-size: 26px; line-height: 1; color: #666; cursor: pointer; padding: 0 4px; }
    .modal-body { padding: 14px 16px; overflow-y: auto; flex: 1; -webkit-overflow-scrolling: touch; }
    .modal-pill-row { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 10px; }
    .modal-meta { font-size: 0.88rem; color: #333; margin: 4px 0; }
    .modal-meta .label { color: #666; font-weight: 500; margin-right: 4px; }
    .modal-notes { margin: 10px 0; padding: 8px 10px; background: #f8f8f8; border-left: 3px solid #ccc;
      border-radius: 3px; white-space: pre-wrap; font-size: 0.85rem; color: #333; }
    .detail-images { display: grid; grid-template-columns: repeat(auto-fill, minmax(90px, 1fr));
      gap: 8px; margin: 12px 0; }
    .detail-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px;
      border: 1px solid #ddd; cursor: pointer; }
    .field-label { display: block; margin: 14px 0 6px; font-size: 0.85rem; font-weight: 600; color: #444; }
    .field-input { width: 100%; box-sizing: border-box; padding: 10px 12px; border: 1px solid #ccc;
      border-radius: 6px; font-family: inherit; font-size: 0.95rem; resize: vertical; }
    .field-file { display: block; margin-top: 4px; }
    .new-photos { display: grid; grid-template-columns: repeat(auto-fill, minmax(80px, 1fr));
      gap: 8px; margin-top: 8px; }
    .new-photo-cell { position: relative; }
    .new-photo-thumb { width: 100%; aspect-ratio: 1; object-fit: cover; border-radius: 6px; border: 1px solid #ddd; }
    .new-photo-remove { position: absolute; top: -6px; right: -6px; width: 24px; height: 24px;
      background: #b91c1c; color: white; border: 2px solid white; border-radius: 50%;
      font-size: 14px; line-height: 1; cursor: pointer; font-family: inherit;
      display: flex; align-items: center; justify-content: center; padding: 0; }
    .modal-footer { display: flex; gap: 8px; padding: 12px 16px; border-top: 1px solid #eee; background: #fafafa; }
    .footer-btn { flex: 1; padding: 12px; border: none; border-radius: 6px; font-family: inherit;
      font-size: 0.95rem; font-weight: 600; cursor: pointer; }
    .footer-btn-secondary { background: white; border: 1px solid #ccc; color: #444; }
    .footer-btn-primary { background: #4caf50; color: white; }
    .footer-btn-primary:hover:not(:disabled) { background: #43a047; }
    .footer-btn-primary:disabled { background: #999; cursor: not-allowed; }
    .footer-btn-reopen { background: #2196f3; color: white; }
    .footer-btn-reopen:hover:not(:disabled) { background: #1976d2; }
    .footer-btn-reopen:disabled { background: #999; cursor: not-allowed; }
    .footer-btn-save { background: #ff9800; color: white; }
    .footer-btn-save:hover:not(:disabled) { background: #f57c00; }
    .footer-btn-save:disabled { background: #d0d0d0; color: #888; cursor: not-allowed; }
    .toggle-row { display: flex; align-items: center; gap: 8px; margin: 4px 0 14px;
      font-size: 0.9rem; color: #555; cursor: pointer; user-select: none; }
    .toggle-row input[type="checkbox"] { width: 18px; height: 18px; cursor: pointer; }
    .lightbox { position: fixed; inset: 0; background: rgba(0,0,0,0.92); display: flex;
      align-items: center; justify-content: center; z-index: 10000; cursor: pointer; }
    .lightbox-img { max-width: 94vw; max-height: 94vh; object-fit: contain; border-radius: 4px; cursor: default; }
    .lightbox-close { position: fixed; top: 12px; right: 12px; background: none; border: none;
      color: white; font-size: 32px; cursor: pointer; padding: 8px 12px; z-index: 10001; }
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

  // Details dialog state
  detailItem = signal<InsulationItem | null>(null);
  detailImages = signal<Array<{ id: number; fileName: string; dataUrl: string }>>([]);
  loadingAttachments = signal(false);
  lightboxSrc = signal<string | null>(null);
  commentDraft = '';
  newPhotos = signal<NewPhoto[]>([]);
  showClosed = signal(false);
  reopening = signal(false);
  saving = signal<string | null>(null);

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
        const active = r.responseData ?? [];
        // If the toggle is on, fetch recently-closed and append so a contractor can find +
        // reopen an accidental complete. Closed items are marked (maximoStatus in
        // COMP/CLOSE/CAN); the isClosed() helper drives the Reopen button in the dialog.
        if (this.showClosed() && this.mode() === 'hub') {
          this.api.listRecentClosedViaHub(30).subscribe(closed => {
            const merged = active.concat(closed);
            this.items.set(merged);
            this.loading.set(false);
            const hubIds = merged.map(i => i.id).filter(id => id && id > 0);
            if (hubIds.length > 0) this.api.driftStatus(hubIds).subscribe(m => this.driftMap.set(m));
            else this.driftMap.set({});
          });
        } else {
          this.items.set(active);
          this.loading.set(false);
          const hubIds = active.map(i => i.id).filter(id => id && id > 0);
          if (hubIds.length > 0) this.api.driftStatus(hubIds).subscribe(m => this.driftMap.set(m));
          else this.driftMap.set({});
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

  /** Open the details dialog for one item. Loads attachments lazily; SP-only items (id=0)
   *  can't reach the hub attachment endpoint so we skip that call for them.
   *
   *  Also fires a live Maximo-status refresh — the cached maximoStatus can lag by up to 60s
   *  (the status-poll interval), so ops-side reopens (COMP → WAPPR done in Maximo directly)
   *  wouldn't be visible in the dialog until the next poll. Fresh status updates both the
   *  dialog's Reopen/Complete button choice AND the item in the parent list so a follow-on
   *  refresh isn't needed. */
  openDetails(item: InsulationItem): void {
    this.detailItem.set(item);
    this.commentDraft = '';
    this.newPhotos.set([]);
    this.detailImages.set([]);
    if (item?.id && item.id > 0) {
      // Live-refresh Maximo status in parallel with attachment fetch.
      this.api.refreshMaximoStatus(item.id).subscribe(fresh => {
        if (fresh) {
          // Only merge Maximo-side fields — leave any SP-only metadata (spRaw, fromSharePoint)
          // on the current dialog item untouched.
          const merged: InsulationItem = {
            ...this.detailItem()!,
            maximoStatus: fresh.maximoStatus,
            maximoWonum: fresh.maximoWonum,
          };
          this.detailItem.set(merged);
          // Also update the parent list so an ops-side change (e.g. reopen) makes the item
          // reappear in the active queue without a manual Refresh tap.
          this.items.update(list => list.map(x => x.id === item.id ? merged : x));
        }
      });
      this.loadingAttachments.set(true);
      this.api.getAttachments(item.id).subscribe(atts => {
        const imgs = (atts || [])
          .filter(a => (a.contentType || '').startsWith('image/') && a.base64Content)
          .map(a => ({
            id: a.id,
            fileName: a.fileName,
            dataUrl: a.base64Content.startsWith('data:')
              ? a.base64Content
              : `data:${a.contentType};base64,${a.base64Content}`,
          }));
        this.detailImages.set(imgs);
        this.loadingAttachments.set(false);
      });
    }
  }

  closeDetails(): void {
    this.detailItem.set(null);
    this.commentDraft = '';
    this.newPhotos.set([]);
  }

  toggleShowClosed(ev: Event): void {
    const on = (ev.target as HTMLInputElement).checked;
    this.showClosed.set(on);
    this.load(); // reload with the new inclusion flag
  }

  /** Is this item currently closed on the Maximo side? Controls whether the Reopen button shows. */
  isClosed(item: InsulationItem | null): boolean {
    if (!item) return false;
    const s = (item.maximoStatus || '').toUpperCase();
    return s === 'COMP' || s === 'CLOSE' || s === 'CAN' || s === 'CANCELLED';
  }

  /** True when the user has something to save (comment text or new photos). Used to gate
   *  the Save button so it doesn't fire on an empty tap. */
  canSave(): boolean {
    return (this.commentDraft || '').trim().length > 0 || this.newPhotos().length > 0;
  }

  /** Save-only: send comment + attachments to the hub without changing WO status. Works on
   *  open AND completed items (contractor can add a follow-up photo/note to a completed WO).
   *  On success, clear the input fields and refresh the dialog's image grid so the just-saved
   *  photos appear. Item stays in the same list (no move to/from active). */
  saveProgressFromDialog(): void {
    const item = this.detailItem();
    if (!item || !item.id || item.id <= 0) return;
    if (!this.canSave()) return;
    // Skip the hub path when we're in SP-offline mode; save-only isn't supported there.
    if (this.mode() === 'sharepoint' || item.fromSharePoint) {
      this.error.set('Save is only available online — reconnect and try again.');
      return;
    }
    const key = this.keyFor(item);
    this.saving.set(key);
    const atts = this.newPhotos().map(p => ({
      fileName: p.name, contentType: p.contentType, base64Content: p.base64Content,
    }));
    this.api.saveProgressViaHub(item.id, this.commentDraft, atts).subscribe({
      next: r => {
        this.saving.set(null);
        if (r.responseData === true) {
          this.commentDraft = '';
          this.newPhotos.set([]);
          // Refresh the existing-images grid so the just-saved photos appear inline.
          this.api.getAttachments(item.id).subscribe(list => {
            const imgs = (list || [])
              .filter(a => (a.contentType || '').startsWith('image/') && a.base64Content)
              .map(a => ({
                id: a.id, fileName: a.fileName,
                dataUrl: a.base64Content.startsWith('data:')
                  ? a.base64Content
                  : `data:${a.contentType};base64,${a.base64Content}`,
              }));
            this.detailImages.set(imgs);
          });
        } else {
          this.error.set(r.message || 'Save failed');
        }
      },
      error: e => {
        this.saving.set(null);
        this.error.set(e?.error?.message ?? e?.message ?? 'Save failed');
      },
    });
  }

  reopenFromDialog(): void {
    const item = this.detailItem();
    if (!item || !item.id || item.id <= 0) return;
    if (!confirm('Reopen this item?\n\nMaximo WO will stay COMP (terminal) — a supervisor must reopen it manually in Maximo if that is needed.')) return;
    this.reopening.set(true);
    this.api.reopenViaHub(item.id).subscribe({
      next: r => {
        this.reopening.set(false);
        if (r.responseData === true) {
          this.closeDetails();
          this.load(); // pick up the reopened item into the active list
          if (r.message && r.message.length > 0) alert(r.message);
        } else {
          this.error.set(r.message || 'Reopen failed');
        }
      },
      error: e => {
        this.reopening.set(false);
        this.error.set(e?.error?.message ?? e?.message ?? 'Reopen failed');
      },
    });
  }

  /** Read each picked file into a base64 data URL. Reused shape from field-list submit. */
  onPhotoAdd(ev: Event): void {
    const input = ev.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    const files = Array.from(input.files);
    input.value = ''; // let user re-pick the same file after removing
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = String(reader.result || '');
        const comma = dataUrl.indexOf(',');
        const base64 = comma >= 0 ? dataUrl.substring(comma + 1) : dataUrl;
        this.newPhotos.update(list => {
          if (list.some(p => p.name === file.name)) return list; // dedup by fileName
          return [...list, {
            name: file.name,
            contentType: file.type || 'application/octet-stream',
            base64Content: base64,
            dataUrl,
          }];
        });
      };
      reader.readAsDataURL(file);
    }
  }

  removeNewPhoto(name: string): void {
    this.newPhotos.update(list => list.filter(p => p.name !== name));
  }

  /** Complete the WO with the contractor's comment + any newly attached photos. Hub path
   *  only (this dialog is opened from the hub-loaded list; SP-offline still uses the older
   *  markCompleteViaSp full-item flow which doesn't carry per-attempt attachments). */
  completeFromDialog(): void {
    const item = this.detailItem();
    if (!item) return;
    if (this.mode() === 'sharepoint' || item.fromSharePoint) {
      // Fall back to the offline SP-full-item close for now — attachments not carried yet.
      this.closeDetails();
      this.markComplete(item);
      return;
    }
    const key = this.keyFor(item);
    this.completing.set(key);
    const atts = this.newPhotos().map(p => ({
      fileName: p.name,
      contentType: p.contentType,
      base64Content: p.base64Content,
    }));
    this.api.markCompleteViaHub(item.id, this.commentDraft, atts).subscribe({
      next: r => {
        this.completing.set(null);
        if (r.responseData === true) {
          this.items.update(list => list.filter(i => this.keyFor(i) !== key));
          this.closeDetails();
        } else {
          this.error.set(r.message || 'Could not close this WO — retry or see supervisor');
        }
      },
      error: e => {
        this.completing.set(null);
        this.error.set(e?.error?.message ?? e?.message ?? 'Complete failed');
      },
    });
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
