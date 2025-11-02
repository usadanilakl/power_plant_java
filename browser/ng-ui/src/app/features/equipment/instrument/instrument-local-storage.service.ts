import { Injectable } from '@angular/core';
import { IInstrument } from '../../../models/equipment/instrument.model';
import { LocalStorageService } from '../../../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class InstrumentLocalStorageService {
  private readonly DRAFT_KEY = 'instrument-draft';

  constructor(
    private localStorageService: LocalStorageService
  ) { }

  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<IInstrument>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<IInstrument> | null {
    return this.localStorageService.getItem<Partial<IInstrument>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }
}