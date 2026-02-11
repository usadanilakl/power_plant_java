import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { LotoBuilderStateService } from '../services/loto-builder-state.service';
import { RfFileLeftPanelComponent } from '../../../../files/refactored/rf-file-left-panel/rf-file-left-panel.component';
import { TableClickService } from '../../../../../shared/table/refactored/services/table-click.service';
import { LotoBuilderFileTableClickService } from './loto-builder-file-table/loto-builder-file-table-click.service';
import { LotoBuilderLotoPointTableComponent } from './loto-builder-loto-point-table/loto-builder-loto-point-table.component';
import { LotoBuilderLotoPointLeftMenuComponent } from './loto-builder-loto-point-left-menu/loto-builder-loto-point-left-menu.component';
import { GuideDirective } from '../../../../../shared/guide/guide.directive';
import { ReactiveGuideDirective } from '../../../../../shared/guide/reactive-guide.directive';

@Component({
  selector: 'app-loto-builder-left-panel',
  standalone: true,
  imports: [
    CommonModule,
    MatIconModule,
    RfFileLeftPanelComponent,
    LotoBuilderLotoPointTableComponent,
    LotoBuilderLotoPointLeftMenuComponent,
    GuideDirective,
    ReactiveGuideDirective,
  ],
  providers: [
    { provide: TableClickService, useClass: LotoBuilderFileTableClickService },
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
