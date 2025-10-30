import { Injectable } from '@angular/core';
import { ISpace } from '../../models/permits/space.model';
import { LocalStorageService } from '../../services/local-storage.service';

@Injectable({
  providedIn: 'root'
})
export class SpaceLocalStorageService {
  private readonly DRAFT_KEY = 'space-draft';
  private readonly LAST_SYNC_KEY = 'spaces_last_sync';

  constructor(
    private localStorageService: LocalStorageService
  ) { }

  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<ISpace>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<ISpace> | null {
    return this.localStorageService.getItem<Partial<ISpace>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }

  getSyncItem(): number{
    return this.localStorageService.getItem<number>(this.LAST_SYNC_KEY) || 0;
  }
  
  setSyncItem(arg0: number) {
    this.localStorageService.setItem(this.LAST_SYNC_KEY, arg0);
  }
}