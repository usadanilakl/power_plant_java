import { inject, Injectable } from '@angular/core';
import { LocalStorageService } from '../../services/refactored/local-storage.service';
import { ClipboardModel } from './clipboard.model';

@Injectable({
  providedIn: 'root',
})
export class ClipboardLocalStorageService {
  private readonly CLIPBOARD_KEY = 'clipboardState';
  private localStorageService = inject(LocalStorageService);

  /**
   * Save entire clipboard state to localStorage
   */
  saveClipboard(clipboard: ClipboardModel): void {
    this.localStorageService.setItem(this.CLIPBOARD_KEY, clipboard.toJson());
  }

  /**
   * Load entire clipboard state from localStorage
   */
  loadClipboard(): ClipboardModel | null {
    const saved = this.localStorageService.getItem<any>(this.CLIPBOARD_KEY);
    return saved ? ClipboardModel.fromJson(saved) : null;
  }

  /**
   * Clear clipboard from localStorage
   */
  clearClipboard(): void {
    this.localStorageService.removeItem(this.CLIPBOARD_KEY);
  }
}
