import { Component, computed, effect, inject, signal } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { toSignal } from '@angular/core/rxjs-interop';
import { Instrument } from '../../../../models/equipment/instrument.model';
import { InstrumentLogEntry } from '../../../../models/equipment/instrument-log.model';
import { InstrumentStateService } from '../instrument-state.service';
import { InstrumentLogFormComponent } from '../instrument-log/instrument-log-form/instrument-log-form.component';

/**
 * One instrument: what it is, its recent log history, and the form to add a log.
 *
 * Addressed by tag (`/instruments/PT-101`) so it is deep-linkable — a QR sticker on the device can
 * open its own log form directly, which is the shortest possible path from standing at an instrument
 * to having logged it.
 */
@Component({
  selector: 'app-instrument-detail',
  imports: [InstrumentLogFormComponent],
  templateUrl: './instrument-detail.component.html',
  styleUrl: './instrument-detail.component.css'
})
export class InstrumentDetailComponent {

  private state = inject(InstrumentStateService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  private routeParams = toSignal(this.route.paramMap, { initialValue: this.route.snapshot.paramMap });

  tagNumber = computed(() => (this.routeParams()?.get('tag') ?? '').trim().toUpperCase());

  private instruments = toSignal(this.state.allInstruments$, { initialValue: [] as Instrument[] });
  instrument = computed(() => {
    const tag = this.tagNumber();
    if (!tag) return null;
    return this.instruments().find(i => (i.tagNumber ?? '').trim().toUpperCase() === tag) ?? null;
  });

  /**
   * The register may still be hydrating from IndexedDB or refreshing from the hub — don't cry
   * "unknown tag" before it lands. Once the list is populated, or the refresh has finished with
   * nothing to show (offline first run), the tag really isn't known here.
   */
  isLoading = computed(() =>
    this.instrument() === null && this.instruments().length === 0 && this.state.isRefreshing());
  notFound = computed(() => this.instrument() === null && !this.isLoading());

  logs = toSignal(this.state.instrumentLogs$, { initialValue: [] as InstrumentLogEntry[] });
  recentLogs = computed(() => this.logs().slice(0, 5));
  showAllLogs = signal(false);
  visibleLogs = computed(() => this.showAllLogs() ? this.logs() : this.recentLogs());

  private selectedTag: string | null = null;

  constructor() {
    // Selecting drives the log form's entity, the recents list and the history fetch. Guarded on the
    // tag: the register list is re-emitted on every refresh, and re-selecting would re-fetch history
    // (and re-stamp "recent") for an instrument the user is already sitting on.
    effect(() => {
      const instrument = this.instrument();
      if (!instrument || instrument.tagNumber === this.selectedTag) return;
      this.selectedTag = instrument.tagNumber;
      this.state.selectInstrument(instrument);
    });
  }

  back() {
    this.router.navigate(['/instruments']);
  }

  addThisInstrument() {
    this.router.navigate(['/instruments', 'new'], { queryParams: { tag: this.tagNumber() } });
  }

  toggleAllLogs() {
    this.showAllLogs.set(!this.showAllLogs());
  }

  statusClass(status: string | undefined): string {
    const value = (status ?? '').toLowerCase();
    if (value.includes('disconnected') || value.includes('removed')) return 'status-chip removed';
    if (value.includes('progress')) return 'status-chip progress';
    return 'status-chip normal';
  }

  logTimestamp(log: InstrumentLogEntry): string {
    const date = log.date ? new Date(log.date).toLocaleDateString() : '';
    return [date, log.time].filter(Boolean).join(' ');
  }
}
