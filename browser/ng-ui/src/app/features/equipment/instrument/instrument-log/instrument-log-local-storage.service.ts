import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../../../services/local-storage.service';
import { IInstrumentLogEntry } from '../../../../models/equipment/instrument-log.model';

/**
 * In-progress log drafts, keyed PER INSTRUMENT.
 *
 * There used to be one global draft key: opening a second instrument silently overwrote the first
 * one's half-typed entry (and the form only restored a draft when its tag happened to match, so the
 * lost work was invisible). Keying by tag means a tech can start a log on one instrument, get pulled
 * to another, and come back to both.
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentLogEntryLocalStorageService {
  private readonly DRAFT_KEY_PREFIX = 'instrument-log-entry-draft:';
  /** Pre-per-tag key. Read once on migration so an in-flight draft isn't dropped by the upgrade. */
  private readonly LEGACY_DRAFT_KEY = 'instrument-log-entry-draft';

  constructor(
    private localStorageService: LocalStorageService
  ) { }

  saveDraft(draft: Partial<IInstrumentLogEntry>): void {
    const tag = this.normalize(draft?.instrumentTagNumber);
    if (!tag) return;
    this.localStorageService.setItem(this.DRAFT_KEY_PREFIX + tag, draft);
  }

  loadDraft(tagNumber: string): Partial<IInstrumentLogEntry> | null {
    const tag = this.normalize(tagNumber);
    if (!tag) return null;

    const draft = this.localStorageService.getItem<Partial<IInstrumentLogEntry>>(this.DRAFT_KEY_PREFIX + tag);
    if (draft) return draft;

    // Migration: adopt the old single-slot draft if it belongs to this instrument.
    const legacy = this.localStorageService.getItem<Partial<IInstrumentLogEntry>>(this.LEGACY_DRAFT_KEY);
    if (legacy && this.normalize(legacy.instrumentTagNumber) === tag) {
      this.localStorageService.setItem(this.DRAFT_KEY_PREFIX + tag, legacy);
      this.localStorageService.removeItem(this.LEGACY_DRAFT_KEY);
      return legacy;
    }
    return null;
  }

  clearDraft(tagNumber: string): void {
    const tag = this.normalize(tagNumber);
    if (!tag) return;
    this.localStorageService.removeItem(this.DRAFT_KEY_PREFIX + tag);
    this.localStorageService.removeItem(this.LEGACY_DRAFT_KEY);
  }

  private normalize(tagNumber: string | null | undefined): string {
    return (tagNumber ?? '').trim().toUpperCase();
  }
}
