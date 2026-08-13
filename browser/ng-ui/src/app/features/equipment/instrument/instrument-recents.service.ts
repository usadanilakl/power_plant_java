import { inject, Injectable, signal } from '@angular/core';
import { LocalStorageService } from '../../../services/local-storage.service';

/**
 * The handful of instruments this device logged most recently, newest first.
 *
 * In practice a tech works the same few tags over and over, so the empty-query state of the search
 * screen is far more useful showing those than showing the top of a 3000-row alphabetical list.
 */
@Injectable({
  providedIn: 'root'
})
export class InstrumentRecentsService {
  private readonly STORAGE_KEY = 'instrument-recent-tags-v1';
  private readonly MAX_RECENTS = 10;

  private localStorageService = inject(LocalStorageService);

  readonly recentTags = signal<string[]>(this.read());

  /** Records a visit/log against a tag, moving it to the front. */
  remember(tagNumber: string | null | undefined): void {
    const tag = (tagNumber ?? '').trim().toUpperCase();
    if (!tag) return;
    const next = [tag, ...this.recentTags().filter(t => t !== tag)].slice(0, this.MAX_RECENTS);
    this.recentTags.set(next);
    this.localStorageService.setItem(this.STORAGE_KEY, next);
  }

  clear(): void {
    this.recentTags.set([]);
    this.localStorageService.setItem(this.STORAGE_KEY, []);
  }

  private read(): string[] {
    const stored = this.localStorageService.getItem<string[]>(this.STORAGE_KEY);
    return Array.isArray(stored) ? stored.filter(t => typeof t === 'string') : [];
  }
}
