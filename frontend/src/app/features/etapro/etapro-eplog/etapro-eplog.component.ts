import { Component, computed, inject, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EtaProStateService } from '../services/etapro-state.service';

/**
 * Operator Log tab — displays scraped EtaPRO Event Log (operator/shift log) entries.
 *
 * v1 is manual-trigger: a "Refresh" button pulls the newest entries (incremental), and a
 * date range can be used to filter the view or backfill an explicit window. Auto-pull and
 * full backfill paging are planned follow-ups (see eplog-scraper-plan.md).
 */
@Component({
  selector: 'app-etapro-eplog',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="eplog-container">
      <!-- Action bar -->
      <div class="action-bar">
        <button class="btn btn-refresh" [disabled]="stateService.eplogPulling()" (click)="onRefreshLatest()">
          {{ stateService.eplogPulling() ? 'Pulling…' : 'Refresh (latest)' }}
        </button>
        <span class="status">{{ stateService.eplogLastPullMsg() }}</span>
        <span class="spacer"></span>
        <span class="total">{{ stateService.eplogTotal() }} entries</span>
      </div>

      <!-- Filter / backfill bar -->
      <div class="filter-bar">
        <label>From:</label>
        <input type="datetime-local" [(ngModel)]="rangeStart">
        <label>To:</label>
        <input type="datetime-local" [(ngModel)]="rangeEnd">
        <button class="btn-small" (click)="onApplyFilter()">Filter view</button>
        <button class="btn-small" [disabled]="!hasRange() || stateService.eplogPulling()" (click)="onBackfill()">
          Backfill range
        </button>
        <button class="btn-small" (click)="onClearFilter()">Clear</button>
        <span class="sep"></span>
        <input class="search" type="text" placeholder="Filter this page…" [(ngModel)]="searchText">
      </div>

      <!-- Table -->
      <div class="table-wrap">
        @if (stateService.eplogLoading()) {
          <div class="empty">Loading…</div>
        } @else if (filteredEntries().length === 0) {
          <div class="empty">No log entries. Click "Refresh (latest)" to pull from EtaPRO.</div>
        } @else {
          <table class="data-table">
            <thead>
              <tr>
                <th class="t-time">Create Time</th>
                <th class="t-crew">Crew</th>
                <th class="t-area">Area</th>
                <th class="t-loc">Location</th>
                <th class="t-by">Created By</th>
                <th class="t-desc">Description</th>
              </tr>
            </thead>
            <tbody>
              @for (e of filteredEntries(); track e.id) {
                <tr>
                  <td class="t-time">{{ formatTime(e.createTime) }}</td>
                  <td class="t-crew">{{ e.crew }}</td>
                  <td class="t-area">{{ e.area }}</td>
                  <td class="t-loc">{{ e.location }}</td>
                  <td class="t-by">{{ e.createdByName }}</td>
                  <td class="t-desc" [title]="e.description || ''">{{ e.description }}</td>
                </tr>
              }
            </tbody>
          </table>
        }
      </div>

      <!-- Pagination -->
      <div class="pager">
        <button class="btn-small" [disabled]="stateService.eplogPage() <= 1" (click)="onPrev()">‹ Prev</button>
        <span class="page-info">Page {{ stateService.eplogPage() }} of {{ totalPages() }}</span>
        <button class="btn-small" [disabled]="stateService.eplogPage() >= totalPages()" (click)="onNext()">Next ›</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: flex; flex-direction: column; height: 100%; overflow: hidden; }
    .eplog-container { display: flex; flex-direction: column; flex: 1; min-height: 0; gap: 8px; overflow: hidden; }

    .action-bar, .filter-bar {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap; flex-shrink: 0;
      padding: 8px; background: var(--card-background);
      border: 1px solid var(--border-color); border-radius: 6px;
    }
    .action-bar .spacer { flex: 1; }
    .status { font-size: 12px; color: var(--secondary-text); }
    .total { font-size: 12px; color: var(--secondary-text); white-space: nowrap; }
    .filter-bar label { font-size: 12px; color: var(--secondary-text); }
    .filter-bar input[type="datetime-local"], .search {
      padding: 4px 8px; border: 1px solid var(--border-color); border-radius: 4px;
      background: var(--card-background); color: var(--primary-text); font-size: 12px;
    }
    .filter-bar input[type="datetime-local"] { font-family: monospace; }
    .search { flex: 1; min-width: 140px; }
    .sep { flex: 1; }

    .btn { padding: 8px 16px; border: none; border-radius: 4px; cursor: pointer; font-size: 13px; font-weight: 600; }
    .btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .btn-refresh { background: var(--accent-color); color: var(--header-text); white-space: nowrap; }
    .btn-refresh:hover:not(:disabled) { opacity: 0.9; }
    .btn-small {
      padding: 4px 10px; border: 1px solid var(--border-color); border-radius: 3px;
      background: var(--card-background); color: var(--primary-text); cursor: pointer; font-size: 11px;
    }
    .btn-small:hover:not(:disabled) { background: var(--hover-background); }
    .btn-small:disabled { opacity: 0.5; cursor: not-allowed; }

    .table-wrap {
      flex: 1; min-height: 0; overflow: auto;
      border: 1px solid var(--border-color); border-radius: 6px; background: var(--card-background);
    }
    .empty { padding: 24px; text-align: center; color: var(--secondary-text); font-size: 13px; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 12px; }
    .data-table th {
      position: sticky; top: 0; z-index: 1;
      padding: 6px 8px; background: var(--hover-background); text-align: left;
      border-bottom: 1px solid var(--border-color); white-space: nowrap;
    }
    .data-table td { padding: 5px 8px; border-bottom: 1px solid var(--border-color); vertical-align: top; }
    .t-time { white-space: nowrap; font-family: monospace; }
    .t-crew, .t-area, .t-loc, .t-by { white-space: nowrap; }
    .t-desc { min-width: 280px; max-width: 520px; white-space: pre-wrap; word-break: break-word; }

    .pager { display: flex; align-items: center; justify-content: center; gap: 12px; flex-shrink: 0; padding: 4px; }
    .page-info { font-size: 12px; color: var(--secondary-text); }
  `]
})
export class EtaProEpLogComponent implements OnInit {
  stateService = inject(EtaProStateService);

  rangeStart = '';
  rangeEnd = '';
  searchText = signal<string>('');

  // The range currently applied to the (server-side) list, for pagination continuity.
  private appliedStart?: string;
  private appliedEnd?: string;

  filteredEntries = computed(() => {
    const q = this.searchText().trim().toLowerCase();
    const entries = this.stateService.eplogEntries();
    if (!q) return entries;
    return entries.filter(e =>
      [e.description, e.area, e.location, e.createdByName, e.crew]
        .some(v => (v || '').toLowerCase().includes(q)));
  });

  totalPages = computed(() =>
    Math.max(1, Math.ceil(this.stateService.eplogTotal() / this.stateService.eplogPageSize)));

  ngOnInit(): void {
    const now = new Date();
    const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    this.rangeEnd = this.toLocalDateTimeString(now);
    this.rangeStart = this.toLocalDateTimeString(weekAgo);
    this.stateService.loadEpLog(1);
  }

  hasRange(): boolean {
    return !!this.rangeStart && !!this.rangeEnd;
  }

  onRefreshLatest(): void {
    this.appliedStart = undefined;
    this.appliedEnd = undefined;
    this.stateService.pullEpLog();
  }

  onApplyFilter(): void {
    if (this.hasRange()) {
      this.appliedStart = this.toIso(this.rangeStart);
      this.appliedEnd = this.toIso(this.rangeEnd);
    } else {
      this.appliedStart = undefined;
      this.appliedEnd = undefined;
    }
    this.stateService.loadEpLog(1, this.appliedStart, this.appliedEnd);
  }

  onBackfill(): void {
    if (!this.hasRange()) return;
    this.stateService.pullEpLog(this.toIso(this.rangeStart), this.toIso(this.rangeEnd));
  }

  onClearFilter(): void {
    this.appliedStart = undefined;
    this.appliedEnd = undefined;
    this.searchText.set('');
    this.stateService.loadEpLog(1);
  }

  onPrev(): void {
    const p = this.stateService.eplogPage();
    if (p > 1) this.stateService.loadEpLog(p - 1, this.appliedStart, this.appliedEnd);
  }

  onNext(): void {
    const p = this.stateService.eplogPage();
    if (p < this.totalPages()) this.stateService.loadEpLog(p + 1, this.appliedStart, this.appliedEnd);
  }

  formatTime(s: string | null): string {
    if (!s) return '';
    return new Date(s).toLocaleString();
  }

  private toIso(local: string): string {
    // datetime-local gives "YYYY-MM-DDTHH:mm"; backend LocalDateTime wants seconds.
    return (local.length === 16) ? local + ':00' : local;
  }

  private toLocalDateTimeString(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
  }
}
