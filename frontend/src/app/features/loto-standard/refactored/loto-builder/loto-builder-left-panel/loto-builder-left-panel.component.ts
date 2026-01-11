import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfFileLeftMenuComponent } from '../../../../files/refactored/rf-file-left-menu/rf-file-left-menu.component';
import { RfLotoPointLeftMenuComponent } from '../../../../loto-points/refactored/rf-loto-point-left-menu/rf-loto-point-left-menu.component';
import { LotoBuilderFileTableComponent } from './loto-builder-file-table/loto-builder-file-table.component';
import { LotoBuilderLotoPointTableComponent } from './loto-builder-loto-point-table/loto-builder-loto-point-table.component';
import { GuideDirective } from '../../../../../shared/guide/guide.directive';
import { ReactiveGuideDirective } from '../../../../../shared/guide/reactive-guide.directive';
import { ContextualGuideDirective } from '../../../../../shared/guide/contextual-guide.directive';

@Component({
  selector: 'app-loto-builder-left-panel',
  standalone: true,
  imports: [
    CommonModule,
    RfFileLeftMenuComponent,
    RfLotoPointLeftMenuComponent,
    LotoBuilderFileTableComponent,
    LotoBuilderLotoPointTableComponent,
    GuideDirective,
    ReactiveGuideDirective,
    ContextualGuideDirective,
  ],
  templateUrl: './loto-builder-left-panel.component.html',
  styleUrl: './loto-builder-left-panel.component.css',
})
export class LotoBuilderLeftPanelComponent {
  protected builderState = inject(LotoBuilderStateService);

  /**
   * Switch to file tab
   */
  selectFileTab(): void {
    this.builderState.leftMenuTab.set('file');
  }

  /**
   * Switch to LOTO point tab
   */
  selectLotoPointTab(): void {
    this.builderState.leftMenuTab.set('loto-point');
  }

  /**
   * Toggle display mode between table and toggle-menu
   */
  toggleDisplayMode(): void {
    const current = this.builderState.displayMode();
    this.builderState.displayMode.set(current === 'table' ? 'toggle-menu' : 'table');
  }
}
