
import { inject, Injectable } from '@angular/core';
import { LocalStorageService } from '../../../../services/refactored/local-storage.service';
import { FileModel } from '../../../../models/file/file.model';

@Injectable({
  providedIn: 'root'
})
export class FileLocalStorageService {
  private readonly DRAFT_KEY = 'file-draft';
  private localStorageService = inject(LocalStorageService);

  // --- Methods for draft storage using LocalStorage ---
  saveDraft(draft: Partial<FileModel>): void {
    this.localStorageService.setItem(this.DRAFT_KEY, draft);
  }

  loadDraft(): Partial<FileModel> | null {
    return this.localStorageService.getItem<Partial<FileModel>>(this.DRAFT_KEY);
  }

  clearDraft(): void {
    this.localStorageService.removeItem(this.DRAFT_KEY);
  }
}
