import { Injectable, signal, computed } from '@angular/core';
import { FileDto } from '../../../models/file/file.model';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { EquipmentDto } from '../../../models/equipment/equipment.model';
import { RfShape } from '../../../shared/image/refactored/models/fr-shape.model';
import {
  ConflictType,
  ConflictSummary,
  DuplicateGroup,
  CONFLICT_TYPE_LABELS,
} from '../../../models/loto/loto-conflict.model';

@Injectable({
  providedIn: 'root',
})
export class LotoConflictStateService {
  // ========== Conflict Summary ==========
  conflictSummary = signal<ConflictSummary | null>(null);

  // ========== Active Conflict Type ==========
  activeConflictType = signal<ConflictType | null>(null);

  // ========== Conflict Points (paginated) ==========
  conflictPoints = signal<LotoPointDto[]>([]);
  totalConflictPoints = signal<number>(0);
  currentPage = signal<number>(1);

  // ========== Duplicate Groups ==========
  duplicateGroups = signal<DuplicateGroup[]>([]);
  selectedDuplicateGroup = signal<DuplicateGroup | null>(null);

  // ========== Selected Point ==========
  selectedPoint = signal<LotoPointDto | null>(null);

  // ========== File / Image Viewer State ==========
  currentFile = signal<FileDto | null>(null);
  currentEquipment = signal<EquipmentDto[]>([]);
  currentShapes = signal<RfShape[]>([]);

  // ========== UI State ==========
  isFormOpen = signal<boolean>(false);
  isMergeDialogOpen = signal<boolean>(false);
  isDualFormOpen = signal<boolean>(false);
  leftPanelWidth = signal<number>(400);

  // ========== Progress ==========
  resolvedCount = signal<number>(0);

  /** IDs of points that have been resolved in this session — excluded from all lists */
  resolvedPointIds = signal<Set<number>>(new Set());

  // ========== Computed ==========
  activeConflictTypeLabel = computed(() => {
    const type = this.activeConflictType();
    return type ? CONFLICT_TYPE_LABELS[type] : '';
  });

  activeConflictCount = computed(() => {
    const summary = this.conflictSummary();
    const type = this.activeConflictType();
    if (!summary || !type) return 0;
    switch (type) {
      case 'DUPLICATE_TAG': return summary.duplicateTagCount;
      case 'NO_EQUIPMENT': return summary.noEquipmentCount;
      case 'NO_ZERO_ENERGY': return summary.noZeroEnergyCount;
      case 'NO_CHARACTERISTICS': return summary.noCharacteristicsCount;
      case 'MISSING_COUNTERPART': return summary.missingCounterpartCount;
    }
  });

  hasSelectedPoint = computed(() => this.selectedPoint() !== null);

  progress = computed(() => {
    const total = this.activeConflictCount();
    const resolved = this.resolvedCount();
    if (total === 0) return 0;
    return Math.round((resolved / total) * 100);
  });

  // ========== Methods ==========

  setConflictType(type: ConflictType | null): void {
    this.activeConflictType.set(type);
    this.selectedPoint.set(null);
    this.currentFile.set(null);
    this.currentEquipment.set([]);
    this.currentShapes.set([]);
    this.resolvedCount.set(0);
    this.selectedDuplicateGroup.set(null);
  }

  selectPoint(point: LotoPointDto | null): void {
    this.selectedPoint.set(point);
  }

  setConflictPoints(points: LotoPointDto[], total: number): void {
    this.conflictPoints.set(points);
    this.totalConflictPoints.set(total);
  }

  appendConflictPoints(points: LotoPointDto[], total: number): void {
    this.conflictPoints.update((existing) => [...existing, ...points]);
    this.totalConflictPoints.set(total);
  }

  setCurrentFile(file: FileDto | null): void {
    this.currentFile.set(file);
  }

  setCurrentEquipment(equipment: EquipmentDto[]): void {
    this.currentEquipment.set(equipment);
  }

  openForm(): void {
    this.isFormOpen.set(true);
  }

  closeForm(): void {
    this.isFormOpen.set(false);
  }

  openMergeDialog(): void {
    this.isMergeDialogOpen.set(true);
  }

  closeMergeDialog(): void {
    this.isMergeDialogOpen.set(false);
  }

  openDualForm(): void {
    this.isDualFormOpen.set(true);
  }

  closeDualForm(): void {
    this.isDualFormOpen.set(false);
  }

  markResolved(): void {
    this.resolvedCount.update((c) => c + 1);
  }

  /** Track point IDs as resolved so they stay hidden even after re-filter */
  private addResolvedIds(ids: number[]): void {
    this.resolvedPointIds.update((set) => {
      const next = new Set(set);
      ids.forEach((id) => next.add(id));
      return next;
    });
  }

  /** Remove a point from the flat conflict list and auto-advance */
  removePointFromList(pointId: number): void {
    this.addResolvedIds([pointId]);
    this.conflictPoints.update((points) =>
      points.filter((p) => p.id !== pointId)
    );
    this.totalConflictPoints.update((t) => Math.max(0, t - 1));
    this.decrementSummaryCount(1);
    this.markResolved();
    this.autoAdvancePoint();
  }

  /** Remove a duplicate group after merge, auto-advance to next group */
  removeDuplicateGroup(normalizedTag: string, mergedPointCount: number): void {
    // Track all point IDs from the group as resolved
    const group = this.duplicateGroups().find((g) => g.normalizedTag === normalizedTag);
    if (group) {
      this.addResolvedIds(group.points.map((p) => p.id!).filter((id) => !!id));
    }
    this.duplicateGroups.update((groups) =>
      groups.filter((g) => g.normalizedTag !== normalizedTag)
    );
    this.selectedDuplicateGroup.set(null);
    this.decrementSummaryCount(mergedPointCount);
    this.markResolved();
    this.autoAdvanceDuplicateGroup();
  }

  /** Remove a specific point from within a duplicate group.
   *  If group drops to 1 point, remove the entire group. */
  removePointFromDuplicateGroup(groupTag: string, pointId: number): void {
    this.addResolvedIds([pointId]);
    let removedGroupPointCount = 0;
    this.duplicateGroups.update((groups) => {
      return groups
        .map((g) => {
          if (g.normalizedTag !== groupTag) return g;
          const filtered = g.points.filter((p) => p.id !== pointId);
          if (filtered.length <= 1) {
            // No longer a duplicate group
            removedGroupPointCount = g.points.length;
            return null;
          }
          return { ...g, points: filtered };
        })
        .filter((g): g is DuplicateGroup => g !== null);
    });

    if (removedGroupPointCount > 0) {
      this.decrementSummaryCount(removedGroupPointCount);
    } else {
      this.decrementSummaryCount(1);
    }
  }

  /** Decrement the active conflict type count in the summary */
  private decrementSummaryCount(amount: number): void {
    const type = this.activeConflictType();
    if (!type) return;
    this.conflictSummary.update((s) => {
      if (!s) return s;
      const updated = { ...s };
      switch (type) {
        case 'DUPLICATE_TAG': updated.duplicateTagCount = Math.max(0, updated.duplicateTagCount - amount); break;
        case 'NO_EQUIPMENT': updated.noEquipmentCount = Math.max(0, updated.noEquipmentCount - amount); break;
        case 'NO_ZERO_ENERGY': updated.noZeroEnergyCount = Math.max(0, updated.noZeroEnergyCount - amount); break;
        case 'NO_CHARACTERISTICS': updated.noCharacteristicsCount = Math.max(0, updated.noCharacteristicsCount - amount); break;
        case 'MISSING_COUNTERPART': updated.missingCounterpartCount = Math.max(0, updated.missingCounterpartCount - amount); break;
      }
      updated.totalConflictCount = Math.max(0, updated.totalConflictCount - amount);
      return updated;
    });
  }

  /** Public auto-advance — picks the right strategy based on active type */
  autoAdvanceFromDetail(): void {
    if (this.activeConflictType() === 'DUPLICATE_TAG') {
      this.autoAdvanceDuplicateGroup();
    } else {
      this.autoAdvancePoint();
    }
  }

  /** Auto-select next point in flat list */
  private autoAdvancePoint(): void {
    const points = this.conflictPoints();
    if (points.length > 0) {
      this.selectPoint(points[0]);
    } else {
      this.selectPoint(null);
      this.currentFile.set(null);
      this.currentEquipment.set([]);
      this.currentShapes.set([]);
    }
  }

  /** Auto-select next duplicate group */
  private autoAdvanceDuplicateGroup(): void {
    const groups = this.duplicateGroups();
    if (groups.length > 0) {
      this.selectedDuplicateGroup.set(groups[0]);
      if (groups[0].points.length > 0) {
        this.selectPoint(groups[0].points[0]);
      }
    } else {
      this.selectedDuplicateGroup.set(null);
      this.selectPoint(null);
      this.currentFile.set(null);
      this.currentEquipment.set([]);
      this.currentShapes.set([]);
    }
  }

  reset(): void {
    this.conflictSummary.set(null);
    this.activeConflictType.set(null);
    this.conflictPoints.set([]);
    this.totalConflictPoints.set(0);
    this.currentPage.set(1);
    this.duplicateGroups.set([]);
    this.selectedDuplicateGroup.set(null);
    this.selectedPoint.set(null);
    this.currentFile.set(null);
    this.currentEquipment.set([]);
    this.currentShapes.set([]);
    this.isFormOpen.set(false);
    this.isMergeDialogOpen.set(false);
    this.isDualFormOpen.set(false);
    this.resolvedCount.set(0);
    this.resolvedPointIds.set(new Set());
  }
}
