import { Component, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfLotoPointFormComponent } from '../../../../loto-points/refactored/rf-loto-point-form/rf-loto-point-form.component';

@Component({
  selector: 'app-loto-builder-form-popup',
  standalone: true,
  imports: [
    CommonModule,
    RfLotoPointFormComponent,
  ],
  templateUrl: './loto-builder-form-popup.component.html',
  styleUrl: './loto-builder-form-popup.component.css',
})
export class LotoBuilderFormPopupComponent {
  protected builderState = inject(LotoBuilderStateService);

  /**
   * Check if form popup should be shown
   */
  isVisible = computed(() => {
    return this.builderState.isLotoPointFormOpen();
  });

  /**
   * Get the LOTO point to edit (or null for new)
   */
  lotoPoint = computed(() => {
    return this.builderState.selectedLotoPointForEdit();
  });

  /**
   * Close the form popup
   */
  close(): void {
    this.builderState.closeLotoPointForm();
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
