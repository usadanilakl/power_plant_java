import { Component, inject, signal, HostListener, OnInit, OnDestroy, DestroyRef } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { LotoConflictStateService } from '../services/loto-conflict-state.service';
import { LotoConflictApiService } from '../services/loto-conflict-api.service';
import { LotoConflictLeftPanelComponent } from '../loto-conflict-left-panel/loto-conflict-left-panel.component';
import { LotoConflictRightPanelComponent } from '../loto-conflict-right-panel/loto-conflict-right-panel.component';
import { LotoConflictMergeComponent } from '../loto-conflict-merge/loto-conflict-merge.component';
import { LotoConflictDetailComponent } from '../loto-conflict-detail/loto-conflict-detail.component';
import { MainLayoutComponent } from '../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../shared/menu/router-menu/router-menu.component';
import { RfFloatingWindowComponent } from '../../../shared/rf-floating-window/rf-floating-window.component';
import { RfPopupProjectionComponent } from '../../../shared/popup-projection/rf-popup-projection.component';
import { RfLotoPointFormComponent } from '../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component';
import { LotoPointDualFormComponent } from '../../loto-points/refactored/loto-point-dual-form/loto-point-dual-form.component';
import { RfLotoPointApiService } from '../../loto-points/refactored/services/rf-loto-point-api.service';
import { LotoPointCounterpartService } from '../../loto-points/refactored/services/loto-point-counterpart.service';
import { LotoPointDto } from '../../../models/loto/loto-point.model';
import { ConflictType } from '../../../models/loto/loto-conflict.model';
import { MatProgressBarModule } from '@angular/material/progress-bar';

@Component({
  selector: 'app-loto-conflict-container',
  standalone: true,
  imports: [
    CommonModule,
    LotoConflictLeftPanelComponent,
    LotoConflictRightPanelComponent,
    LotoConflictMergeComponent,
    LotoConflictDetailComponent,
    MainLayoutComponent,
    RouterMenuComponent,
    RfFloatingWindowComponent,
    RfPopupProjectionComponent,
    RfLotoPointFormComponent,
    LotoPointDualFormComponent,
    MatProgressBarModule,
  ],
  templateUrl: './loto-conflict-container.component.html',
  styleUrl: './loto-conflict-container.component.css',
})
export class LotoConflictContainerComponent implements OnInit, OnDestroy {
  protected state = inject(LotoConflictStateService);
  private api = inject(LotoConflictApiService);
  private lotoPointApi = inject(RfLotoPointApiService);
  private counterpartService = inject(LotoPointCounterpartService);
  private destroyRef = inject(DestroyRef);

  isResizing = signal<boolean>(false);
  private startX = 0;
  private startWidth = 0;

  ngOnInit(): void {
    this.loadSummary();
  }

  ngOnDestroy(): void {
    this.state.reset();
  }

  loadSummary(): void {
    this.api.getSummary().subscribe({
      next: (res) => {
        if (res.responseData) {
          this.state.conflictSummary.set(res.responseData);
        }
      },
      error: (err) => console.error('Failed to load conflict summary:', err),
    });
  }

  /** Check if the selected point is unit-specific (tag starts with 01/02) */
  isSelectedPointUnitSpecific(): boolean {
    return this.counterpartService.isUnitSpecific(this.state.selectedPoint());
  }

  /** Single-form save handler */
  onFormSaved(item: LotoPointDto): void {
    this.lotoPointApi
      .saveLotoPoint(item)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (res) => {
          if (res.responseData) {
            this.handleSavedPoint(res.responseData);
            this.state.closeForm();
          }
        },
        error: (err) => console.error('Failed to save LOTO point:', err),
      });
  }

  /** Dual-form: primary saved (the dual form already called the API) */
  onPrimarySaved(point: LotoPointDto): void {
    this.handleSavedPoint(point);
  }

  /** Dual-form: counterpart saved — check if it's also in the conflict list and resolved */
  onCounterpartSaved(point: LotoPointDto): void {
    this.handleSavedPoint(point);
  }

  /** Dual-form: both saved — close the form */
  onBothSaved(_event: { primary: LotoPointDto; counterpart: LotoPointDto }): void {
    this.state.closeForm();
  }

  onDualFormClosed(): void {
    this.state.closeForm();
  }

  /**
   * After a save, check if the saved point's conflict is resolved.
   * If yes, remove from list. If still in list but unresolved, update its data.
   * Works for both the originally-selected point AND its counterpart.
   */
  private handleSavedPoint(saved: LotoPointDto): void {
    if (!saved.id) return;
    const type = this.state.activeConflictType();
    const resolved = this.isConflictResolved(saved, type);

    // Check if this point is currently in the conflict list
    const inList = this.state.conflictPoints().some((p) => p.id === saved.id);

    if (resolved && inList) {
      this.state.removePointFromList(saved.id);
    } else if (inList) {
      // Update the data in the list without removing
      this.state.conflictPoints.update((pts) =>
        pts.map((p) => (p.id === saved.id ? saved : p))
      );
    }

    // If this is the currently selected point, update it
    if (this.state.selectedPoint()?.id === saved.id && !resolved) {
      this.state.selectPoint(saved);
    }
  }

  private isConflictResolved(point: LotoPointDto, type: ConflictType | null): boolean {
    if (!type) return false;
    switch (type) {
      case 'NO_ZERO_ENERGY':
        return !!point.zeroEnergy;
      case 'NO_CHARACTERISTICS':
        return !!point.characteristicsJson && point.characteristicsJson !== '' && point.characteristicsJson !== '[]';
      case 'NO_EQUIPMENT':
        return !!(point.equipmentList?.length || point.equipmentIdList?.length);
      case 'MISSING_COUNTERPART':
        return !!point.counterpartId;
      case 'DUPLICATE_TAG':
        return false; // Duplicates require merge, not form edit
      default:
        return false;
    }
  }

  // ========== Resize Handling ==========

  onDividerMouseDown(event: MouseEvent): void {
    this.isResizing.set(true);
    this.startX = event.clientX;
    this.startWidth = this.state.leftPanelWidth();
    event.preventDefault();
  }

  @HostListener('document:mousemove', ['$event'])
  onMouseMove(event: MouseEvent): void {
    if (!this.isResizing()) return;
    const delta = event.clientX - this.startX;
    const newWidth = Math.max(300, Math.min(800, this.startWidth + delta));
    this.state.leftPanelWidth.set(newWidth);
  }

  @HostListener('document:mouseup')
  onMouseUp(): void {
    this.isResizing.set(false);
  }
}
