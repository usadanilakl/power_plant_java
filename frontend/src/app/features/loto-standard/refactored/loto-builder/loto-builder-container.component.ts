import { Component, inject, signal, HostListener, OnInit, OnDestroy, PLATFORM_ID, Inject } from '@angular/core';
import { CommonModule, isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';
import { LotoBuilderStateService } from './services/loto-builder-state.service';
import { LotoBuilderLeftPanelComponent } from './loto-builder-left-panel/loto-builder-left-panel.component';
import { LotoBuilderRightPanelComponent } from './loto-builder-right-panel/loto-builder-right-panel.component';
import { LotoBuilderFormPopupComponent } from './loto-builder-form-popup/loto-builder-form-popup.component';
import { LotoBuilderTablePopupComponent } from './loto-builder-table-popup/loto-builder-table-popup.component';
import { LotoFormCarouselComponent } from './loto-form-carousel/loto-form-carousel.component';
import { LotoStandardsSelectorComponent } from './loto-standards-selector/loto-standards-selector.component';
import { LotoStandardDto } from '../../../../models/loto/loto-standard.model';
import { RfPopupProjectionComponent } from '../../../../shared/popup-projection/rf-popup-projection.component';
import { RfFileFormComponent } from '../../../files/refactored/rf-file-form/rf-file-form.component';
import { RfMultiUploadComponent } from '../../../files/refactored/rf-multi-upload/rf-multi-upload.component';
import { RfFileStateService } from '../../../files/refactored/services/rf-file-state.service';
import { MainLayoutComponent } from '../../../../layout/refactored/main-layout.component';
import { RouterMenuComponent } from '../../../../shared/menu/router-menu/router-menu.component';

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
    RfPopupProjectionComponent,
    RfFileFormComponent,
    RfMultiUploadComponent,
    MainLayoutComponent,
    RouterMenuComponent,
  ],
  templateUrl: './loto-builder-container.component.html',
  styleUrl: './loto-builder-container.component.css',
})
export class LotoBuilderContainerComponent implements OnInit, OnDestroy {
  private router = inject(Router);
  protected builderState = inject(LotoBuilderStateService);
  protected fileStateService = inject(RfFileStateService);
  private isBrowser: boolean;

  constructor(@Inject(PLATFORM_ID) platformId: Object) {
    this.isBrowser = isPlatformBrowser(platformId);
  }

  // Resizing state
  isResizing = signal<boolean>(false);
  private startX = 0;
  private startWidth = 0;

  ngOnInit(): void {
    // Initialize builder state when page loads
    this.builderState.isBuilderOpen.set(true);
  }

  ngOnDestroy(): void {
    // Clean up resize listeners if active (only in browser)
    if (this.isBrowser) {
      document.removeEventListener('mousemove', this.onMouseMove);
      document.removeEventListener('mouseup', this.onMouseUp);
    }

    // Reset builder state when navigating away
    this.builderState.reset();
  }

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
   * Close the builder and navigate back to loto-standard page
   */
  onClose(): void {
    if (this.builderState.hasUnsavedChanges()) {
      const confirmed = confirm('You have unsaved changes. Are you sure you want to leave?');
      if (!confirmed) return;
    }
    this.router.navigate(['/loto-standard']);
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

  /**
   * Handle add new LOTO request from carousel
   */
  onCarouselAddNewRequested(): void {
    this.builderState.openLotoStandardsPopup();
  }
}
