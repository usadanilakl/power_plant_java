import { inject } from '@angular/core';
import { LocalStorageService } from '../../services/refactored/local-storage.service';

/**
 * Generic draft metadata interface
 * @template T - The entity type (e.g., LotoPointModel, FileModel)
 */
export interface DraftMetadata<T = any> {
  id: string; // Unique draft ID (timestamp-based)
  entityId: number | null; // null for new items, ID for existing
  timestamp: string; // ISO timestamp
  formData: Partial<T>; // Draft form data
  isNewItem: boolean; // true if this is a new item (no ID yet)
}

/**
 * Abstract base service for draft management
 * Provides common draft storage/retrieval logic that can be reused across entities
 *
 * @template T - The entity model type
 *
 * Usage:
 * ```typescript
 * @Injectable({ providedIn: 'root' })
 * export class LotoPointDraftService extends BaseDraftService<LotoPointModel> {
 *   protected readonly DRAFTS_KEY = 'loto-point-drafts';
 *
 *   constructor(localStorageService: LocalStorageService) {
 *     super(localStorageService);
 *   }
 *
 *   protected getEntityId(draft: Partial<LotoPointModel>): number | null {
 *     return draft.id || null;
 *   }
 * }
 * ```
 */
export abstract class BaseDraftService<T> {
  /**
   * LocalStorage key for storing drafts
   * Must be unique per entity type
   */
  protected abstract readonly DRAFTS_KEY: string;

  /**
   * Maximum number of drafts to keep in storage
   * Default: 20
   */
  protected readonly MAX_DRAFTS = 20;

  /**
   * LocalStorage service for persistence
   */
  protected localStorageService = inject(LocalStorageService);

  /**
   * Extract entity ID from draft data
   * Must be implemented by child class
   */
  protected abstract getEntityId(draft: Partial<T>): number | null;

  /**
   * Save a draft with metadata
   * - Updates existing draft if found for same entity
   * - Creates new draft if not found
   * - Maintains FIFO queue of MAX_DRAFTS items
   */
  saveDraft(draft: Partial<T>): void {
    const drafts = this.getAllDrafts();
    const entityId = this.getEntityId(draft);
    const isNewItem = entityId === null;

    // Find existing draft for this entity
    const existingIndex = drafts.findIndex(
      (d) => d.entityId === entityId && d.isNewItem === isNewItem
    );

    const draftMetadata: DraftMetadata<T> = {
      id: this.generateDraftId(entityId),
      entityId,
      timestamp: new Date().toISOString(),
      formData: draft,
      isNewItem,
    };

    if (existingIndex >= 0) {
      // Update existing draft
      drafts[existingIndex] = draftMetadata;
    } else {
      // Add new draft to beginning
      drafts.unshift(draftMetadata);
    }

    // Keep only last MAX_DRAFTS
    const trimmedDrafts = drafts.slice(0, this.MAX_DRAFTS);

    this.localStorageService.setItem(this.DRAFTS_KEY, trimmedDrafts);
  }

  /**
   * Load draft for a specific entity (or for new items)
   * @param entityId - Entity ID, or null for new items
   * @returns Draft metadata if found, null otherwise
   */
  loadDraft(entityId: number | null = null): DraftMetadata<T> | null {
    const drafts = this.getAllDrafts();

    // Find draft for this specific entity or for new items
    const draft = drafts.find((d) => {
      if (entityId === null) {
        return d.isNewItem;
      }
      return d.entityId === entityId;
    });

    return draft || null;
  }

  /**
   * Get all drafts sorted by timestamp (newest first)
   */
  getAllDrafts(): DraftMetadata<T>[] {
    const drafts = this.localStorageService.getItem<DraftMetadata<T>[]>(
      this.DRAFTS_KEY
    );
    return drafts || [];
  }

  /**
   * Clear a specific draft
   * @param entityId - Entity ID, or null for new items
   */
  clearDraft(entityId: number | null): void {
    const drafts = this.getAllDrafts();
    const filtered = drafts.filter((d) => {
      if (entityId === null) {
        return !d.isNewItem;
      }
      return d.entityId !== entityId;
    });

    this.localStorageService.setItem(this.DRAFTS_KEY, filtered);
  }

  /**
   * Clear all drafts for this entity type
   */
  clearAllDrafts(): void {
    this.localStorageService.removeItem(this.DRAFTS_KEY);
  }

  /**
   * Check if draft exists for a specific entity
   * @param entityId - Entity ID, or null for new items
   */
  hasDraft(entityId: number | null): boolean {
    return this.loadDraft(entityId) !== null;
  }

  /**
   * Get draft age in human-readable format
   * @param draft - Draft metadata
   * @returns Human-readable age string ("5 minutes ago", "2 hours ago", etc.)
   */
  getDraftAge(draft: DraftMetadata<T>): string {
    const now = new Date();
    const draftTime = new Date(draft.timestamp);
    const diffMs = now.getTime() - draftTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60)
      return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24)
      return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;

    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return draftTime.toLocaleDateString();
  }

  /**
   * Generate unique draft ID
   * Format: "existing-{entityId}-{timestamp}" or "new-{timestamp}"
   */
  private generateDraftId(entityId: number | null): string {
    const prefix = entityId !== null ? `existing-${entityId}` : 'new';
    return `${prefix}-${Date.now()}`;
  }
}
