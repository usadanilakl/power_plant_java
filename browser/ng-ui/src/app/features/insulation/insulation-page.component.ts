import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { InsulationApiService, InsulationItem } from './insulation-api.service';

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
        @for (item of items(); track item.id) {
          <li class="item" [class.completing]="completing() === item.id">
            <div class="item-head">
              <div class="item-title">{{ item.title || 'Untitled insulation item' }}</div>
              <span class="pill wo">{{ item.maximoWonum || 'WO?' }}</span>
              <span class="pill status" [class]="'status-' + (item.maximoStatus || '').toLowerCase()">
                {{ item.maximoStatus || '?' }}
              </span>
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
                {{ completing() === item.id ? 'Closing WO…' : 'Mark Complete' }}
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

  loading = signal(false);
  error = signal<string | null>(null);
  items = signal<InsulationItem[]>([]);
  completing = signal<number | null>(null);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.listActive().subscribe({
      next: r => {
        this.items.set(r.responseData ?? []);
        this.loading.set(false);
      },
      error: e => {
        this.error.set(e?.error?.message ?? e?.message ?? 'Failed to load active items');
        this.loading.set(false);
      }
    });
  }

  markComplete(item: InsulationItem): void {
    this.completing.set(item.id);
    this.api.markComplete(item.id).subscribe({
      next: r => {
        this.completing.set(null);
        if (r.responseData === true) {
          // Optimistic remove from local list — the backend already closed the WO and
          // the next /active call will exclude it. Kept simple: no toast, the visual
          // disappearance IS the confirmation. If the Maximo call actually failed,
          // responseData is false and we surface the hub message as an inline error.
          this.items.update(list => list.filter(i => i.id !== item.id));
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
}
