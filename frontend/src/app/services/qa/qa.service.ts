import { Injectable, signal } from '@angular/core';
import { QaContent, QaMediaItem } from '../../models/ui/question.model';

@Injectable({ providedIn: 'root' })
export class QaService {
  private _isQaMode = signal(false);
  isQaMode = this._isQaMode.asReadonly();

  private _activeContent = signal<QaContent | null>(null);
  activeContent = this._activeContent.asReadonly();

  private _isDialogVisible = signal(false);
  isDialogVisible = this._isDialogVisible.asReadonly();

  toggleQaMode(): void {
    const newState = !this._isQaMode();
    this._isQaMode.set(newState);
    if (!newState) {
      this.closeDialog();
    }
  }

  openDialog(content: QaContent): void {
    this._activeContent.set(this.normalizeContent(content));
    this._isDialogVisible.set(true);
  }

  closeDialog(): void {
    this._isDialogVisible.set(false);
    this._activeContent.set(null);
  }

  /**
   * Handle backward compatibility with old Question formats
   * 1. Very old: { type: 'text', content: '...' }
   * 2. Legacy: { text: '...', images: [...], videoUrl: '...' }
   * 3. New: { text: '...', media: [...] }
   */
  private normalizeContent(raw: any): QaContent {
    // Handle very old format
    if (raw.content !== undefined && raw.type !== undefined) {
      return {
        text: raw.content,
        files: raw.files,
      };
    }

    const result: QaContent = { ...raw };

    // If new media array exists, use it directly
    if (result.media?.length) {
      return result;
    }

    // Convert legacy images/videoUrl to unified media array
    const media: QaMediaItem[] = [];

    // Convert legacy images (no captions)
    if (raw.images?.length) {
      for (const img of raw.images) {
        if (typeof img === 'string') {
          media.push({ type: 'image', url: img });
        } else if (img && typeof img === 'object' && img.url) {
          media.push({ type: 'image', url: img.url, caption: img.caption });
        }
      }
    }

    // Convert legacy single videoUrl
    if (raw.videoUrl) {
      media.push({ type: 'video', url: raw.videoUrl });
    }

    // Set media if we converted any legacy items
    if (media.length > 0) {
      result.media = media;
    }

    return result;
  }
}
