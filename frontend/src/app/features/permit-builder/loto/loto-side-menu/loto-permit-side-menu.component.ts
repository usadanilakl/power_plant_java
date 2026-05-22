import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPermitTableComponent } from '../loto-table/loto-permit-table.component';
import { LotoPermitLeftMenuComponent } from '../loto-left-menu/loto-permit-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentLotoService } from '../../../../services/current-items-services/current-loto.service';
import { LotoImportDialogComponent } from '../loto-import-dialog/loto-import-dialog.component';
import { RedTagAutomationService } from '../../../../services/automation/red-tag-automation.service';
import { RedTagAutomationPanelComponent } from '../../../../shared/automation/red-tag-automation-panel/red-tag-automation-panel.component';

@Component({
  selector: 'app-loto-permit-side-menu',
  standalone: true,
  imports: [LotoPermitTableComponent, LotoPermitLeftMenuComponent, PermitLeftPanelComponent,
    LotoImportDialogComponent, RedTagAutomationPanelComponent],
  templateUrl: './loto-permit-side-menu.component.html',
  styleUrl: './loto-permit-side-menu.component.css'
})
export class LotoPermitSideMenuComponent {
  currentLotoService = inject(CurrentLotoService);
  private redTagAutomation = inject(RedTagAutomationService);
  private destroyRef = inject(DestroyRef);
  showImportDialog = signal(false);
  isBuildingInRedTag = signal(false);

  onFormViewChanged(isPaper: boolean) {
    this.currentLotoService.isPaperViewActive.set(isPaper);
  }

  openImportDialog() {
    this.showImportDialog.set(true);
  }

  closeImportDialog() {
    this.showImportDialog.set(false);
  }

  buildInRedTag() {
    const loto = this.currentLotoService.selectedItem();
    if (!loto?.id) {
      alert('Select a LOTO permit first.');
      return;
    }
    this.isBuildingInRedTag.set(true);
    this.redTagAutomation.buildLoto(loto.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.isBuildingInRedTag.set(false),
      error: (err) => {
        this.isBuildingInRedTag.set(false);
        alert(`Failed to start LOTO build: ${err?.error?.message ?? err?.message ?? 'Unknown error'}`);
      }
    });
  }
}
