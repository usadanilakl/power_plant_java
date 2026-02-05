import { Injectable, signal } from '@angular/core';
import { QaContent } from '../../models/ui/question.model';

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
   * Handle backward compatibility with old Question format
   * Old: { type: 'text', content: '...' }
   * New: { text: '...', images: [...], videoUrl: '...' }
   */
  private normalizeContent(raw: any): QaContent {
    if (raw.content !== undefined && raw.type !== undefined) {
      return {
        text: raw.content,
        files: raw.files,
      };
    }
    return raw as QaContent;
  }
}
