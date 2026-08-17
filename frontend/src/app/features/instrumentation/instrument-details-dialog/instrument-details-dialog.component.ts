import { Component, computed, effect, inject, input, output, signal } from '@angular/core';
import { RfPopupProjectionComponent } from '../../../shared/popup-projection/rf-popup-projection.component';
import { InstrumentDto } from '../../../models/instrumentation/instrument.model';
import { InstrumentLogDto } from '../../../models/instrumentation/instrument-log.model';
import { InstrumentLogApiService } from '../../../services/instrumentation/instrument-log-api.service';

/**
 * Everything known about one instrument, plus its recent log history and the delete action.
 *
 * The register table previously had no detail view at all — double-clicking a row swapped the whole
 * page over to that instrument's logs, which lost the instrument's own fields (vendor, location,
 * type, SharePoint id) and had no way back to them. This shows the record and the history together,
 * so the table stays put behind it.
 */
@Component({
  selector: 'app-instrument-details-dialog',
  standalone: true,
  imports: [RfPopupProjectionComponent],
  template: `
    <app-rf-popup-projection
      [isOpen]="!!instrument()"
      [title]="instrument()?.tagNumber || 'Instrument'"
      [size]="'large'"
      (close)="close.emit()"
    >
      @if (instrument(); as item) {
        <div class="details">
          <div class="detail-grid">
            <div class="field"><span class="label">Tag Number</span><span class="value strong">{{ item.tagNumber }}</span></div>
            <div class="field"><span class="label">Status</span>
              <span class="value"><span class="status-chip" [class]="statusClass(item.currentStatus)">{{ item.currentStatus || '—' }}</span></span>
            </div>
            <div class="field wide"><span class="label">Description</span><span class="value">{{ item.description || '—' }}</span></div>
            <div class="field"><span class="label">Vendor</span><span class="value">{{ item.vendor || '—' }}</span></div>
            <div class="field"><span class="label">Location</span><span class="value">{{ item.location || '—' }}</span></div>
            <div class="field"><span class="label">Type</span><span class="value">{{ item.type || '—' }}</span></div>
            <div class="field"><span class="label">Last updated</span>
              <span class="value">{{ item.lastUpdatedDate || '—' }} {{ item.lastUpdatedTime || '' }}</span>
            </div>
            <div class="field"><span class="label">Updated by</span><span class="value">{{ item.lastUpdatedBy || '—' }}</span></div>
            <div class="field"><span class="label">SharePoint id</span>
              <span class="value">{{ item.sharepointId || 'not synced' }}</span>
            </div>
            @if (item.lastComment) {
              <div class="field wide"><span class="label">Last comment</span><span class="value comment">{{ item.lastComment }}</span></div>
            }
          </div>

          <h3 class="section">Log history</h3>
          @if (loadingLogs()) {
            <p class="hint">Loading…</p>
          } @else if (logs().length === 0) {
            <p class="hint">No logs recorded for this instrument.</p>
          } @else {
            <ul class="log-list">
              @for (log of logs(); track log.id) {
                <li class="log-item">
                  <div class="log-top">
                    <span class="status-chip" [class]="statusClass(log.status)">{{ log.status }}</span>
                    <span class="log-when">{{ log.date }} {{ log.time }}</span>
                  </div>
                  <div class="log-who">{{ log.submitterName }}</div>
                  @if (log.comment) { <div class="log-comment">{{ log.comment }}</div> }
                </li>
              }
            </ul>
          }

          <div class="actions">
            <button type="button" class="btn" (click)="viewLogs.emit(item)">View all logs</button>
            <button type="button" class="btn danger" (click)="requestDelete.emit(item)">Delete instrument</button>
          </div>
        </div>
      }
    </app-rf-popup-projection>
  `,
  styles: [`
    .details { display: flex; flex-direction: column; gap: 1rem; padding: 0.5rem 0.25rem; }
    .detail-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 0.75rem 1.25rem; }
    .field { display: flex; flex-direction: column; gap: 0.15rem; }
    .field.wide { grid-column: 1 / -1; }
    .label { font-size: 0.72rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text); }
    .value { font-size: 0.92rem; color: var(--primary-text); word-break: break-word; }
    .value.strong { font-weight: 700; font-size: 1.05rem; }
    .value.comment { font-style: italic; }
    .section { margin: 0.25rem 0 0; font-size: 0.8rem; text-transform: uppercase; letter-spacing: 0.05em; color: var(--secondary-text); }
    .hint { color: var(--secondary-text); font-size: 0.85rem; margin: 0; }
    .log-list { list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 0.4rem; max-height: 260px; overflow-y: auto; }
    .log-item { padding: 0.5rem 0.65rem; border: 1px solid var(--border-color); border-radius: 6px; }
    .log-top { display: flex; justify-content: space-between; gap: 0.5rem; align-items: center; }
    .log-when, .log-who { font-size: 0.78rem; color: var(--secondary-text); }
    .log-comment { margin-top: 0.2rem; font-size: 0.86rem; color: var(--primary-text); }
    .status-chip { padding: 0.1rem 0.45rem; border-radius: 999px; font-size: 0.72rem; font-weight: 600; white-space: nowrap; }
    .status-chip.normal { background: var(--status-complete); color: var(--primary-text); }
    .status-chip.progress { background: var(--status-attention); color: var(--primary-text); }
    .status-chip.removed { background: var(--status-not-processed); color: var(--primary-text); }
    .actions { display: flex; gap: 0.5rem; justify-content: flex-end; border-top: 1px solid var(--border-color); padding-top: 0.75rem; }
    .btn { padding: 0.4rem 0.9rem; border: 1px solid var(--border-color); border-radius: 4px; background: var(--accent-color); color: var(--primary-text); cursor: pointer; font-size: 0.85rem; }
    .btn.danger { background: var(--status-not-processed); }
    .btn:hover { opacity: 0.85; }
  `]
})
export class InstrumentDetailsDialogComponent {

  private logApi = inject(InstrumentLogApiService);

  /** Null closes the dialog; setting an instrument opens it and loads that tag's history. */
  instrument = input<InstrumentDto | null>(null);

  close = output<void>();
  viewLogs = output<InstrumentDto>();
  requestDelete = output<InstrumentDto>();

  private logsByTag = signal<Record<string, InstrumentLogDto[]>>({});
  private loadingTag = signal<string | null>(null);

  logs = computed(() => {
    const tag = this.instrument()?.tagNumber;
    return tag ? (this.logsByTag()[tag] ?? []) : [];
  });

  loadingLogs = computed(() => this.loadingTag() === this.instrument()?.tagNumber);

  constructor() {
    // Fetch from an effect, not from the computed that reads the result — a computed must stay pure,
    // and writing the cache signal from inside one is exactly the reentrancy Angular forbids.
    effect(() => {
      const tag = this.instrument()?.tagNumber;
      if (tag && !this.logsByTag()[tag]) this.fetchLogs(tag);
    });
  }

  statusClass(status: string | null | undefined): string {
    const value = (status ?? '').toLowerCase();
    if (value.includes('disconnected') || value.includes('removed')) return 'removed';
    if (value.includes('progress')) return 'progress';
    return 'normal';
  }

  /** Fetched lazily per tag and cached, so reopening the same instrument doesn't re-hit the hub. */
  private fetchLogs(tag: string): void {
    if (this.loadingTag() === tag) return;
    this.loadingTag.set(tag);
    this.logApi.getByInstrument(tag).subscribe({
      next: res => {
        this.logsByTag.update(m => ({ ...m, [tag]: res.responseData ?? [] }));
        this.loadingTag.set(null);
      },
      error: () => {
        this.logsByTag.update(m => ({ ...m, [tag]: [] }));
        this.loadingTag.set(null);
      }
    });
  }
}
