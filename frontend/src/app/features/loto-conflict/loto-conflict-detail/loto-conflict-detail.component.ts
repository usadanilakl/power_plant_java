import { Component, inject, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatChipsModule } from '@angular/material/chips';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LotoConflictStateService } from '../services/loto-conflict-state.service';
import { LotoConflictApiService } from '../services/loto-conflict-api.service';
import { RfLotoPointApiService } from '../../../features/loto-points/refactored/services/rf-loto-point-api.service';

@Component({
  selector: 'app-loto-conflict-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    MatButtonModule,
    MatChipsModule,
    MatTooltipModule,
  ],
  templateUrl: './loto-conflict-detail.component.html',
  styleUrl: './loto-conflict-detail.component.css',
})
export class LotoConflictDetailComponent {
  protected state = inject(LotoConflictStateService);
  private conflictApi = inject(LotoConflictApiService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);

  get conflictType() {
    return this.state.activeConflictType();
  }

  get point() {
    return this.state.selectedPoint();
  }

  // ========== Resolution Actions ==========

  openInBuilder(): void {
    // Navigate to LOTO Builder with the selected point's file context
    const point = this.state.selectedPoint();
    if (point) {
      this.router.navigate(['/loto-builder'], {
        queryParams: { lotoPointId: point.id },
      });
    }
  }

  openEditForm(): void {
    this.state.openForm();
  }

  openMergeDialog(): void {
    this.state.openMergeDialog();
  }

  openDualForm(): void {
    this.state.openDualForm();
  }

  generateCounterpart(): void {
    const point = this.state.selectedPoint();
    if (!point?.id) return;

    this.lotoPointApi
      .getUnitCounterpart(point.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.responseData) {
            // Open dual form with the counterpart data
            this.state.openDualForm();
          }
        },
        error: (err) => console.error('Failed to get counterpart:', err),
      });
  }

  /** Mark current point as resolved — removes from list, decrements count, auto-advances */
  markResolved(): void {
    const point = this.state.selectedPoint();
    if (!point?.id) return;

    const type = this.state.activeConflictType();
    if (type === 'DUPLICATE_TAG') {
      // For duplicates, remove the point from within its group
      const group = this.state.selectedDuplicateGroup();
      if (group) {
        this.state.removePointFromDuplicateGroup(group.normalizedTag, point.id);
        this.state.markResolved();
        // Re-select group if it still exists, else advance
        const updatedGroups = this.state.duplicateGroups();
        const stillExists = updatedGroups.find(g => g.normalizedTag === group.normalizedTag);
        if (stillExists) {
          this.state.selectedDuplicateGroup.set(stillExists);
          if (stillExists.points.length > 0) {
            this.state.selectPoint(stillExists.points[0]);
          }
        } else {
          this.state.autoAdvanceFromDetail();
        }
      }
    } else {
      // For flat lists, removePointFromList handles everything
      this.state.removePointFromList(point.id);
    }
  }
}
