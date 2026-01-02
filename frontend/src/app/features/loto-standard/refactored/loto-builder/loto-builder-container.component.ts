import { Component, inject, signal, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from './services/loto-builder-state.service';
import { LotoBuilderLeftPanelComponent } from './loto-builder-left-panel/loto-builder-left-panel.component';
import { LotoBuilderRightPanelComponent } from './loto-builder-right-panel/loto-builder-right-panel.component';
import { LotoBuilderFormPopupComponent } from './loto-builder-form-popup/loto-builder-form-popup.component';
import { LotoBuilderTablePopupComponent } from './loto-builder-table-popup/loto-builder-table-popup.component';

@Component({
  selector: 'app-loto-builder-container',
  standalone: true,
  imports: [
    CommonModule,
    LotoBuilderLeftPanelComponent,
    LotoBuilderRightPanelComponent,
    LotoBuilderFormPopupComponent,
    LotoBuilderTablePopupComponent,
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
    if (this.builderState.hasUnsavedChanges()) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to close?');
      if (!confirmed) return;
    }

    // TODO: Navigate away or emit close event
    this.builderState.reset();
  }
}
