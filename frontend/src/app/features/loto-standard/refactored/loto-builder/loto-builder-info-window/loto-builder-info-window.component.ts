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
   * Close the info window
   */
  close(): void {
    this.builderState.hideLotoPointInfoWindow();
  }
}
