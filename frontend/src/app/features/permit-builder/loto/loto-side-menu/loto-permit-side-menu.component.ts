import { Component, DestroyRef, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { LotoPermitTableComponent } from '../loto-table/loto-permit-table.component';
import { LotoPermitLeftMenuComponent } from '../loto-left-menu/loto-permit-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentLotoService } from '../../../../services/current-items-services/current-loto.service';
import { LotoImportDialogComponent } from '../loto-import-dialog/loto-import-dialog.component';
import { RedTagAutomationService } from '../../../../services/automation/red-tag-automation.service';
import { RedTagAutomationPanelComponent } from '../../../../shared/automation/red-tag-automation-panel/red-tag-automation-panel.component';
import { RedTagBypassDialogComponent } from '../red-tag-bypass/red-tag-bypass-dialog.component';
import { ChangeBoxDialogComponent } from '../change-box/change-box-dialog.component';

@Component({
  selector: 'app-loto-permit-side-menu',
  standalone: true,
  imports: [LotoPermitTableComponent, LotoPermitLeftMenuComponent, PermitLeftPanelComponent,
    LotoImportDialogComponent, RedTagAutomationPanelComponent, RedTagBypassDialogComponent,
    ChangeBoxDialogComponent],
  templateUrl: './loto-permit-side-menu.component.html',
  styleUrl: './loto-permit-side-menu.component.css'
})
export class LotoPermitSideMenuComponent {
  currentLotoService = inject(CurrentLotoService);
  private redTagAutomation = inject(RedTagAutomationService);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  showImportDialog = signal(false);
  isBuildingInRedTag = signal(false);
  showBypassDialog = signal(false);
  showChangeBoxDialog = signal(false);

  onFormViewChanged(isPaper: boolean) {
    this.currentLotoService.isPaperViewActive.set(isPaper);
  }

  openImportDialog() {
    this.showImportDialog.set(true);
  }

  closeImportDialog() {
    this.showImportDialog.set(false);
  }

  openRedTagSync() {
    // Opens the Red-Tag → local diff/apply page. Standalone route registered in standalone.routes.ts.
    this.router.navigateByUrl('/red-tag-sync');
  }

  openBypassDialog() {
    const loto = this.currentLotoService.selectedItem();
    if (!loto?.id) {
      alert('Select a LOTO permit first.');
      return;
    }
    this.showBypassDialog.set(true);
  }

  onBypassClosed(applied: boolean) {
    this.showBypassDialog.set(false);
    if (applied) {
      // Refresh the LOTO list so the new status is reflected in the left menu / table.
      // The bypass also fires a FieldChange sync event, so other clients pick it up via SSE.
      this.currentLotoService.reloadLotos();
    }
  }

  openChangeBoxDialog() {
    const loto = this.currentLotoService.selectedItem();
    if (!loto?.id) {
      alert('Select a LOTO permit first.');
      return;
    }
    this.showChangeBoxDialog.set(true);
  }

  onChangeBoxClosed(moved: boolean) {
    this.showChangeBoxDialog.set(false);
    if (moved) {
      // Refresh the selected LOTO so the new box + locks show in the form.
      const id = this.currentLotoService.selectedItem()?.id;
      if (id) this.currentLotoService.setCurrentLotoById(id);
      this.currentLotoService.reloadLotos();
    }
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
