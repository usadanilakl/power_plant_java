import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { LotoPointDisplayTableComponent } from '../../../../loto-points/refactored/loto-point-display-table/loto-point-display-table.component';

@Component({
  selector: 'app-loto-builder-table-popup',
  standalone: true,
  imports: [
    CommonModule,
    LotoPointDisplayTableComponent,
  ],
  templateUrl: './loto-builder-table-popup.component.html',
  styleUrl: './loto-builder-table-popup.component.css',
})
export class LotoBuilderTablePopupComponent {
  protected builderState = inject(LotoBuilderStateService);

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
    // Get all LOTO points from current equipment
    const equipment = this.builderState.currentEquipment();
    const allLotoPoints: any[] = [];

    equipment.forEach(eq => {
      if (eq.lotoPoints && eq.lotoPoints.length > 0) {
        allLotoPoints.push(...eq.lotoPoints);
      }
    });

    return allLotoPoints;
  });

  /**
   * Close the table popup
   */
  close(): void {
    this.builderState.closeLotoPointTable();
  }

  /**
   * Handle backdrop click to close
   */
  onBackdropClick(event: MouseEvent): void {
    // Only close if clicking the backdrop itself, not child elements
    if (event.target === event.currentTarget) {
      this.close();
    }
  }
}
