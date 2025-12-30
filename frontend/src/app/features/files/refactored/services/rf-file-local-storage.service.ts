import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../../../services/refactored/local-storage.service';
import { FileModel } from '../../../../models/file/file.model';
import { BaseDraftService } from '../../../../shared/draft/base-draft.service';

/**
 * File-specific draft management service
 * Extends the base draft service with File-specific ID extraction
 *
 * Example usage of the centralized draft management system.
 * Now supports:
 * - Multiple drafts (up to 20)
 * - Drafts for both new and existing files
 * - Draft metadata (timestamp, isNewItem, etc.)
 */
@Injectable({
  providedIn: 'root',
})
export class FileLocalStorageService extends BaseDraftService<FileModel> {
  /**
   * LocalStorage key for File drafts
   */
  protected readonly DRAFTS_KEY = 'file-drafts';

  constructor(localStorageService: LocalStorageService) {
    super();
    this.localStorageService = localStorageService;
  }

  /**
   * Extract entity ID from File draft
   * Returns the ID if present, null otherwise
   */
  protected getEntityId(draft: Partial<FileModel>): number | null {
    return draft.id || null;
  }
}
