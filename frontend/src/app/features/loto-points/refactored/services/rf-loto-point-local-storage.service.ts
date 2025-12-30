import { Injectable } from '@angular/core';
import { LocalStorageService } from '../../../../services/refactored/local-storage.service';
import { LotoPointModel } from '../../../../models/loto/loto-point.model';
import { BaseDraftService } from '../../../../shared/draft/base-draft.service';

/**
 * LotoPoint-specific draft management service
 * Extends the base draft service with LotoPoint-specific ID extraction
 */
@Injectable({
  providedIn: 'root',
})
export class LotoPointLocalStorageService extends BaseDraftService<LotoPointModel> {
  /**
   * LocalStorage key for LotoPoint drafts
   */
  protected readonly DRAFTS_KEY = 'loto-point-drafts';

  constructor(localStorageService: LocalStorageService) {
    super();
    this.localStorageService = localStorageService;
  }

  /**
   * Extract entity ID from LotoPoint draft
   * Returns the ID if present, null otherwise
   */
  protected getEntityId(draft: Partial<LotoPointModel>): number | null {
    return draft.id || null;
  }
}