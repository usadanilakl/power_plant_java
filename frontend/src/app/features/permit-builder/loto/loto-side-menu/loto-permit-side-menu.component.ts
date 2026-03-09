import { Component, inject, signal } from '@angular/core';
import { LotoPermitTableComponent } from '../loto-table/loto-permit-table.component';
import { LotoPermitLeftMenuComponent } from '../loto-left-menu/loto-permit-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentLotoService } from '../../../../services/current-items-services/current-loto.service';
import { LotoImportDialogComponent } from '../loto-import-dialog/loto-import-dialog.component';

@Component({
  selector: 'app-loto-permit-side-menu',
  standalone: true,
  imports: [LotoPermitTableComponent, LotoPermitLeftMenuComponent, PermitLeftPanelComponent, LotoImportDialogComponent],
  templateUrl: './loto-permit-side-menu.component.html',
  styleUrl: './loto-permit-side-menu.component.css'
})
export class LotoPermitSideMenuComponent {
  currentLotoService = inject(CurrentLotoService);
  showImportDialog = signal(false);

  onFormViewChanged(isPaper: boolean) {
    this.currentLotoService.isPaperViewActive.set(isPaper);
  }

  openImportDialog() {
    this.showImportDialog.set(true);
  }

  closeImportDialog() {
    this.showImportDialog.set(false);
  }
}
