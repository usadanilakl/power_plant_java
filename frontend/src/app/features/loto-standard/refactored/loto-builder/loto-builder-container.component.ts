import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from './services/loto-builder-state.service';
import { LotoBuilderLeftPanelComponent } from './loto-builder-left-panel/loto-builder-left-panel.component';
import { LotoBuilderRightPanelComponent } from './loto-builder-right-panel/loto-builder-right-panel.component';
import { LotoBuilderFormPopupComponent } from './loto-builder-form-popup/loto-builder-form-popup.component';
import { LotoBuilderTablePopupComponent } from './loto-builder-table-popup/loto-builder-table-popup.component';
import { LotoFormCarouselComponent } from './loto-form-carousel/loto-form-carousel.component';
import { LotoStandardsSelectorComponent } from './loto-standards-selector/loto-standards-selector.component';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';

@Component({
  selector: 'app-loto-builder-container',
  standalone: true,
  imports: [
    CommonModule,
    LotoBuilderLeftPanelComponent,
    LotoBuilderRightPanelComponent,
    LotoBuilderFormPopupComponent,
    LotoBuilderTablePopupComponent,
    LotoFormCarouselComponent,
    LotoStandardsSelectorComponent,
  ],
  templateUrl: './loto-builder-container.component.html',
  styleUrl: './loto-builder-container.component.css',
})
export class LotoBuilderContainerComponent {
  protected builderState = inject(LotoBuilderStateService);

  // Resizing state
  isResizing = signal<boolean>(false);
  private startX = 0;
  private startWidth = 0;

  /**
   * Start resizing the divider
   */
  onDividerMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.isResizing.set(true);
    this.startX = event.clientX;
    this.startWidth = this.builderState.leftPanelWidth();

    // Add listeners for mouse move and up
    document.addEventListener('mousemove', this.onMouseMove);
    document.addEventListener('mouseup', this.onMouseUp);
  }

  /**
   * Handle mouse move during resize
   */
  private onMouseMove = (event: MouseEvent): void => {
    if (!this.isResizing()) return;

    const deltaX = event.clientX - this.startX;
    const newWidth = Math.max(300, Math.min(800, this.startWidth + deltaX)); // Min 300px, max 800px

    this.builderState.leftPanelWidth.set(newWidth);
  };

  /**
   * Handle mouse up (end resize)
   */
  private onMouseUp = (): void => {
    this.isResizing.set(false);

    // Remove listeners
    document.removeEventListener('mousemove', this.onMouseMove);
    document.removeEventListener('mouseup', this.onMouseUp);
  };

  /**
   * Handle unsaved changes guard
   */
  @HostListener('window:beforeunload', ['$event'])
  handleBeforeUnload(event: BeforeUnloadEvent): void {
    if (this.builderState.hasUnsavedChanges()) {
      event.preventDefault();
      event.returnValue = '';
    }
  }

  /**
   * Close the builder
   */
  onClose(): void {
    this.builderState.closeBuilder();
  }

  /**
   * Handle carousel standard update
   */
  onCarouselStandardUpdated(event: { index: number; standard: LotoStandardDto }): void {
    this.builderState.updateLotoStandard(event.index, event.standard);
  }

  /**
   * Handle carousel standard submission (save and remove)
   */
  onCarouselStandardSubmitted(event: { index: number; standard: LotoStandardDto }): void {
    // Remove the standard from the carousel after submission
    this.builderState.removeLotoStandard(event.index);
  }

  /**
   * Handle carousel standard cancellation
   */
  onCarouselStandardCancelled(event: { index: number }): void {
    // Remove the standard from the carousel
    this.builderState.removeLotoStandard(event.index);
  }

  /**
   * Handle carousel close
   */
  onCarouselClose(): void {
    this.builderState.isLotoBuildingMode.set(false);
  }
}
