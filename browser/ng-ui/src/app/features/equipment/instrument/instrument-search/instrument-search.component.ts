import { Component, computed, ElementRef, inject, signal, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Instrument } from '../../../../models/equipment/instrument.model';
import { InstrumentStateService } from '../instrument-state.service';
import { InstrumentRecentsService } from '../instrument-recents.service';
import { InstrumentLogOutboxService } from '../instrument-log/instrument-log-outbox.service';
import { matchesTokens, SearchLogic, tokenizeQuery } from '../../../../shared/search/word-bucket-search';

/**
 * The Instrumentation entry point: a search over the register, and nothing else.
 *
 * This replaces a "what would you like to do?" chooser that put a modal between the user and the
 * list. Scanning a QR code lands here with the search box focused; the create path is an escape
 * hatch shown when the search comes up short, not a peer of searching.
 */
@Component({
  selector: 'app-instrument-search',
  imports: [],
  templateUrl: './instrument-search.component.html',
  styleUrl: './instrument-search.component.css'
})
export class InstrumentSearchComponent {

  private state = inject(InstrumentStateService);
  private recents = inject(InstrumentRecentsService);
  private outbox = inject(InstrumentLogOutboxService);
  private router = inject(Router);

  @ViewChild('searchInput') searchInput?: ElementRef<HTMLInputElement>;

  /** Rendering every match of a 1-token query would mean thousands of cards; the count line tells
   *  the user what's hidden so a truncated list never reads as "that's all there is". */
  private static readonly MAX_RENDERED = 60;

  query = signal('');
  logic = signal<SearchLogic>('AND');

  instruments = toSignal(this.state.allInstruments$, { initialValue: [] as Instrument[] });
  recentTags = this.recents.recentTags;
  isRefreshing = this.state.isRefreshing;
  isOffline = this.state.isOffline;
  lastSyncedAt = this.state.lastSyncedAt;

  pendingLogs = toSignal(this.outbox.pending$, { initialValue: [] });
  isFlushing = this.outbox.isFlushing;

  private matches = computed(() => {
    const tokens = tokenizeQuery(this.query());
    const all = this.instruments();
    if (tokens.length === 0) return [] as Instrument[];
    const logic = this.logic();
    return all.filter(i => matchesTokens(
      [i.tagNumber, i.description, i.location, i.type, i.vendor], tokens, logic));
  });

  matchCount = computed(() => this.matches().length);
  results = computed(() => this.matches().slice(0, InstrumentSearchComponent.MAX_RENDERED));
  isTruncated = computed(() => this.matchCount() > InstrumentSearchComponent.MAX_RENDERED);
  hasQuery = computed(() => tokenizeQuery(this.query()).length > 0);
  noMatches = computed(() => this.hasQuery() && this.matchCount() === 0);

  /** Empty-query state: the tags this device logged recently, resolved against the register. */
  recentInstruments = computed(() => {
    const byTag = new Map(this.instruments().map(i => [(i.tagNumber ?? '').toUpperCase(), i]));
    return this.recentTags()
      .map(tag => byTag.get(tag))
      .filter((i): i is Instrument => !!i);
  });

  onQueryChange(value: string) {
    this.query.set(value);
  }

  toggleLogic() {
    this.logic.set(this.logic() === 'AND' ? 'OR' : 'AND');
  }

  clearQuery() {
    this.query.set('');
    this.searchInput?.nativeElement.focus();
  }

  open(instrument: Instrument) {
    this.router.navigate(['/instruments', instrument.tagNumber]);
  }

  /** Carries whatever the user typed into the create form, so they don't retype the tag. */
  addNew() {
    const typed = this.query().trim();
    this.router.navigate(['/instruments', 'new'], typed ? { queryParams: { tag: typed } } : {});
  }

  refresh() {
    this.state.loadAllInstruments();
  }

  flushOutbox() {
    void this.outbox.flush();
  }

  statusClass(instrument: Instrument): string {
    const status = (instrument.currentStatus ?? '').toLowerCase();
    if (status.includes('disconnected') || status.includes('removed')) return 'status-chip removed';
    if (status.includes('progress')) return 'status-chip progress';
    return 'status-chip normal';
  }

  lastActivity(instrument: Instrument): string {
    const date = instrument.lastUpdatedDate;
    if (!date) return '';
    const by = instrument.lastUpdatedBy ? ` · ${instrument.lastUpdatedBy}` : '';
    return `${date}${by}`;
  }

  syncedLabel = computed(() => {
    const iso = this.lastSyncedAt();
    if (!iso) return 'Not synced yet';
    const minutes = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (minutes < 1) return 'Updated just now';
    if (minutes < 60) return `Updated ${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `Updated ${hours} h ago`;
    return `Updated ${Math.floor(hours / 24)} d ago`;
  });
}
