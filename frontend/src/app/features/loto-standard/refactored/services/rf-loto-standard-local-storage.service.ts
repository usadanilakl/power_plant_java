import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../../../services/refactored/local-storage.service';
import { LotoStandardModel } from '../../../../models/loto/loto-standard.model';
import { BaseDraftService } from '../../../../shared/draft/base-draft.service';

/**
 * LotoStandard-specific draft management service
 * Extends the base draft service with LotoStandard-specific ID extraction
 */
@Injectable({
  providedIn: 'root',
})
export class LotoStandardLocalStorageService extends BaseDraftService<LotoStandardModel> {
  /**
   * LocalStorage key for LotoStandard drafts
   */
  protected readonly DRAFTS_KEY = 'loto-standard-drafts';

  constructor(localStorageService: LocalStorageService) {
    super();
    this.localStorageService = localStorageService;
  }

  /**
   * Extract entity ID from LotoStandard draft
   * Returns the ID if present, null otherwise
   */
  protected getEntityId(draft: Partial<LotoStandardModel>): number | null {
    return draft.id || null;
  }
}
