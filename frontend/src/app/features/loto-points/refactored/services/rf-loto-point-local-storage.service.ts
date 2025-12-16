import { inject, Injectable } from '@angular/core';
import { LocalStorageService } from '../../../../services/refactored/local-storage.service';
import { LotoPointModel } from '../../../../models/loto/loto-point.model';

@Injectable({
  providedIn: 'root'
})
export class LotoPointLocalStorageService {
  private readonly DRAFT_KEY = 'loto-point-draft';
    private localStorageService = inject(LocalStorageService)
  


  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<LotoPointModel>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<LotoPointModel> | null {
    return this.localStorageService.getItem<Partial<LotoPointModel>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }
}