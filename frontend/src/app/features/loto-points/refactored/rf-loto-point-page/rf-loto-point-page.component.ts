import { Component, computed, inject } from '@angular/core';
import { MainLayoutComponent } from "../../../../layout/refactored/main-layout.component";
import { RouterMenuComponent } from "../../../../shared/menu/router-menu/router-menu.component";
import { RfLotoPointLeftPanelComponent } from "../rf-loto-point-left-panel/rf-loto-point-left-panel.component";
import { RouterOutlet } from "@angular/router";
import { RfPopupProjectionComponent } from "../../../../shared/popup-projection/rf-popup-projection.component";
import { RfLotoPointFormComponent } from "../rf-loto-point-form/rf-loto-point-form.component";
import { LotoPointDualFormComponent } from "../loto-point-dual-form/loto-point-dual-form.component";
import { RfLotoPointStateService } from "../services/rf-loto-point-state.service";
import { LotoPointCounterpartService } from "../services/loto-point-counterpart.service";
import { ExportDialogComponent } from "../../../../shared/export-dialog/export-dialog.component";

@Component({
  selector: 'app-rf-loto-point-page',
  imports: [
    MainLayoutComponent,
    RouterMenuComponent,
    RfLotoPointLeftPanelComponent,
    RouterOutlet,
    RfPopupProjectionComponent,
    RfLotoPointFormComponent,
    LotoPointDualFormComponent,
    ExportDialogComponent
  ],
  templateUrl: './rf-loto-point-page.component.html',
  styleUrl: './rf-loto-point-page.component.css',
})
export class RfLotoPointPageComponent {
  stateService = inject(RfLotoPointStateService);
  private counterpartService = inject(LotoPointCounterpartService);

  /**
   * Check if the currently selected item is unit-specific (01/02)
   * to determine whether to show dual form or single form
   */
  isUnitSpecific = computed(() => {
    const selectedItem = this.stateService.selectedItem();
    return this.counterpartService.isUnitSpecific(selectedItem);
  });

  /**
   * Handle primary saved from dual form
   */
  onPrimarySaved(): void {
    // Could reload data or show message
  }

  /**
   * Handle counterpart saved from dual form
   */
  onCounterpartSaved(): void {
    // Could reload data or show message
  }

  /**
   * Handle both saved from dual form
   */
  onBothSaved(): void {
    this.stateService.closeForm();
  }

  /**
   * Handle dual form closed
   */
  onDualFormClosed(): void {
    this.stateService.closeForm();
  }
}
