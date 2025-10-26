import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../services/local-storage.service';
import { IUser } from '../../models/auth/user.model';

@Injectable({
  providedIn: 'root'
})
export class UserLocalStorageService {
  private readonly DRAFT_KEY = 'user-draft';

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
}