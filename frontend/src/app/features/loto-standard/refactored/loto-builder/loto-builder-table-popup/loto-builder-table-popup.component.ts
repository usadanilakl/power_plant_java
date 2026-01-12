import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { LotoPointDisplayTableComponent } from '../../../../loto-points/refactored/loto-point-display-table/loto-point-display-table.component';
import { RfFloatingWindowComponent } from '../../../../../shared/rf-floating-window/rf-floating-window.component';
import { LotoPointDto } from '../../../../../models/loto/loto-point.model';

@Component({
  selector: 'app-loto-builder-table-popup',
  standalone: true,
  imports: [
    CommonModule,
    LotoPointDisplayTableComponent,
    RfFloatingWindowComponent,
  ],
  templateUrl: './loto-builder-table-popup.component.html',
  styleUrl: './loto-builder-table-popup.component.css',
})
export class LotoBuilderTablePopupComponent {
  protected builderState = inject(LotoBuilderStateService);

  // Window configuration
  readonly windowId = 'loto-table-popup';
  readonly initialPosition = { x: 20, y: 100 };
  readonly initialSize = { width: 650, height: 500 };
  readonly minSize = { width: 400, height: 300 };

  /**
   * Check if table popup should be shown
   */
  isVisible = computed(() => {
    return this.builderState.isLotoPointTableOpen();
  });

  /**
   * Get all LOTO points for the current file
   */
  lotoPoints = computed(() => {
    const equipment = this.builderState.currentEquipment();
    const allLotoPoints: LotoPointDto[] = [];

    equipment.forEach(eq => {
      if (eq.lotoPoints && eq.lotoPoints.length > 0) {
        allLotoPoints.push(...eq.lotoPoints);
      }
    });

    return allLotoPoints;
  });

  /**
   * Get the currently hovered LOTO point from state
   */
  hoveredLotoPoint = computed(() => {
    return this.builderState.hoveredLotoPoint();
  });

  /**
   * Get the ID of the clicked LOTO point to scroll to in the table.
   * This is derived from the selected shape - when a shape is clicked,
   * we find the corresponding LOTO point and scroll to it.
   */
  scrollToLotoPointId = computed(() => {
    const selectedShapeId = this.builderState.selectedShapeId();
    if (!selectedShapeId) return null;

    // Find equipment with matching shape ID
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq => eq.id === selectedShapeId);

    // Return the first LOTO point ID from that equipment
    if (matchingEquipment?.lotoPoints && matchingEquipment.lotoPoints.length > 0) {
      return matchingEquipment.lotoPoints[0].id;
    }

    return null;
  });

  /**
   * Close the table popup
   */
  close(): void {
    this.builderState.closeLotoPointTable();
  }

  /**
   * Handle row hover event from table - sync with shape highlighting
   */
  onRowHovered(lotoPoint: LotoPointDto | null): void {
    this.builderState.hoveredLotoPoint.set(lotoPoint);

    if (!lotoPoint) {
      this.builderState.hoveredShapeId.set(null);
      return;
    }

    // Find equipment that contains this LOTO point and highlight its shape
    const equipment = this.builderState.currentEquipment();
    const matchingEquipment = equipment.find(eq =>
      eq.lotoPoints?.some(lp => lp.id === lotoPoint.id)
    );

    if (matchingEquipment) {
      this.builderState.hoveredShapeId.set(matchingEquipment.id!);
    } else {
      this.builderState.hoveredShapeId.set(null);
    }
  }

  /**
   * Handle row selection event from table
   */
  onRowSelected(lotoPoints: LotoPointDto[]): void {
    if (lotoPoints.length === 0) return;

    const selectedLotoPoint = lotoPoints[0];
    const equipment = this.builderState.currentEquipment();

    const matchingEquipment = equipment.find(eq =>
      eq.lotoPoints?.some(lp => lp.id === selectedLotoPoint.id)
    );

    if (matchingEquipment) {
      this.builderState.hoveredShapeId.set(matchingEquipment.id!);
    }
  }
}
