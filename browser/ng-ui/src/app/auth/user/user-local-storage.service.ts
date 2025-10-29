import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { IUser } from '../../models/auth/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserLocalStorageService {
  private readonly DRAFT_KEY = 'user-draft';
private readonly LAST_SYNC_KEY = 'users_last_sync';

  constructor(
    private localStorageService: LocalStorageService
  ) { }

  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<IUser>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<IUser> | null {
    return this.localStorageService.getItem<Partial<IUser>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }

  setSyncItem(date: number) {
    this.localStorageService.setItem(this.LAST_SYNC_KEY, date);
  }

  getSyncItem(): number{
    return this.localStorageService.getItem<number>(this.LAST_SYNC_KEY) || 0;
  }


}