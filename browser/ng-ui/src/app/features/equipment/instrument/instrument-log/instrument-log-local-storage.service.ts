import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../../../services/local-storage.service';
import { IInstrumentLogEntry } from '../../../../models/equipment/instrument-log.model';

@Injectable({
  providedIn: 'root'
})
export class InstrumentLogEntryLocalStorageService {
  private readonly DRAFT_KEY = 'instrument-log-entry-draft';

  constructor(
    private localStorageService: LocalStorageService
  ) { }

  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<IInstrumentLogEntry>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<IInstrumentLogEntry> | null {
    return this.localStorageService.getItem<Partial<IInstrumentLogEntry>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }
}