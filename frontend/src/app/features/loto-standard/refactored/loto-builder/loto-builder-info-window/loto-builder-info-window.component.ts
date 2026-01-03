import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';

@Component({
  selector: 'app-loto-builder-info-window',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './loto-builder-info-window.component.html',
  styleUrl: './loto-builder-info-window.component.css',
})
export class LotoBuilderInfoWindowComponent {
  protected builderState = inject(LotoBuilderStateService);

  /**
   * Get the current LOTO point to display
   */
  lotoPoint = computed(() => {
    return this.builderState.infoWindowLotoPoint();
  });

  /**
   * Check if info window should be shown
   */
  isVisible = computed(() => {
    return this.builderState.showLotoPointInfo();
  });

  /**
   * Check if carousel is visible and there's an active standard
   */
  canAddToStandard = computed(() => {
    return this.builderState.isCarouselVisible() && this.builderState.activeLotoStandard() !== null;
  });

  /**
   * Get active standard name for button label
   */
  activeStandardName = computed(() => {
    const standard = this.builderState.activeLotoStandard();
    return standard?.name || 'LOTO Standard';
  });

  /**
   * Add current LOTO point to active standard
   */
  addToActiveStandard(): void {
    const lotoPoint = this.lotoPoint();
    if (lotoPoint) {
      this.builderState.addLotoPointToActiveStandard(lotoPoint);
      // Optionally close the info window after adding
      this.close();
    }
  }

  /**
   * Close the info window
   */
  close(): void {
    this.builderState.hideLotoPointInfoWindow();
  }
}
