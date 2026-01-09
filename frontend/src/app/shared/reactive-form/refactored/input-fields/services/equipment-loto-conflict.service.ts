import { Injectable, inject } from '@angular/core';
import { LotoPointCacheService } from '../../../../../services/loto-point-cache.service';
import { LotoPointSummaryDto } from '../../../../../models/loto/loto-point-summary.model';

export interface EquipmentConflict {
  equipmentId: number;
  conflicts: LotoPointSummaryDto[];
}

/**
 * Service for detecting conflicts when equipment is associated with multiple LOTO points.
 * Uses cached LOTO point summaries for instant lookups without API calls.
 */
@Injectable({
  providedIn: 'root'
})
export class EquipmentLotoConflictService {
  private lotoPointCache = inject(LotoPointCacheService);

  /**
   * Find LOTO points that already have this equipment associated.
   * @param equipmentId The equipment ID to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude (e.g., the current one being edited)
   * @returns Array of LOTO point summaries that have this equipment
   */
  findConflicts(equipmentId: number, excludeLotoPointId?: number): LotoPointSummaryDto[] {
    return this.lotoPointCache.getAllSummaries()
      .filter(lp =>
        lp.equipmentIds?.includes(equipmentId) &&
        lp.id !== excludeLotoPointId
      );
  }

  /**
   * Check if equipment has any conflicts.
   * @param equipmentId The equipment ID to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude
   * @returns true if equipment has conflicts
   */
  hasConflicts(equipmentId: number, excludeLotoPointId?: number): boolean {
    return this.findConflicts(equipmentId, excludeLotoPointId).length > 0;
  }

  /**
   * Batch check for multiple equipment IDs (useful for multi-select).
   * @param equipmentIds Array of equipment IDs to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude
   * @returns Map of equipmentId to array of conflicting LOTO points
   */
  findAllConflicts(equipmentIds: number[], excludeLotoPointId?: number): Map<number, LotoPointSummaryDto[]> {
    const result = new Map<number, LotoPointSummaryDto[]>();

    for (const equipmentId of equipmentIds) {
      const conflicts = this.findConflicts(equipmentId, excludeLotoPointId);
      if (conflicts.length > 0) {
        result.set(equipmentId, conflicts);
      }
    }

    return result;
  }

  /**
   * Get equipment IDs that have conflicts from a list.
   * @param equipmentIds Array of equipment IDs to check
   * @param excludeLotoPointId Optional LOTO point ID to exclude
   * @returns Array of EquipmentConflict objects for equipment with conflicts
   */
  getConflictingEquipment(equipmentIds: number[], excludeLotoPointId?: number): EquipmentConflict[] {
    return equipmentIds
      .map(equipmentId => ({
        equipmentId,
        conflicts: this.findConflicts(equipmentId, excludeLotoPointId)
      }))
      .filter(item => item.conflicts.length > 0);
  }

  /**
   * Check if equipment has NO association with any LOTO point.
   * Used for zero energy fields where equipment MUST have a LOTO point.
   * @param equipmentId The equipment ID to check
   * @returns true if equipment has NO LOTO point association
   */
  hasNoAssociation(equipmentId: number): boolean {
    return this.findConflicts(equipmentId).length === 0;
  }
}
