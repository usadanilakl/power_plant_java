import { Injectable } from '@angular/core';
import { IWorkRequest, WorkRequest } from '../../models/permits/work-request.model';
import { LocalStorageService } from '../../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class WorkRequestLocalStorageService {
  private readonly DRAFT_KEY = 'work-request-draft';

  // You are already using IndexedDbService for final storage
  constructor(
    private localStorageService: LocalStorageService
  ) { }

  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<IWorkRequest>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<IWorkRequest> | null {
    return this.localStorageService.getItem<Partial<IWorkRequest>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }
}