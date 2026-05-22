import { Component, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { SafeWorkTableComponent } from '../safe-work-table/safe-work-table.component';
import { SafeWorkLeftMenuComponent } from '../safe-work-left-menu/safe-work-left-menu.component';
import { PermitLeftPanelComponent } from '../../shared/permit-left-panel/permit-left-panel.component';
import { CurrentSafeWorkService } from '../../../../services/current-items-services/current-safe-work.service';
import { RedTagAutomationService } from '../../../../services/automation/red-tag-automation.service';
import { RedTagAutomationPanelComponent } from '../../../../shared/automation/red-tag-automation-panel/red-tag-automation-panel.component';

@Component({
  selector: 'app-safe-work-side-menu',
  standalone: true,
  imports: [SafeWorkTableComponent, SafeWorkLeftMenuComponent, PermitLeftPanelComponent,
    RedTagAutomationPanelComponent],
  templateUrl: './safe-work-side-menu.component.html',
  styleUrl: './safe-work-side-menu.component.css'
})
export class SafeWorkSideMenuComponent {
  currentSafeWorkService = inject(CurrentSafeWorkService);
  private redTagAutomation = inject(RedTagAutomationService);
  private destroyRef = inject(DestroyRef);
  isBuildingInRedTag = signal(false);

  onFormViewChanged(isPaper: boolean) {
    this.currentSafeWorkService.isPaperViewActive.set(isPaper);
  }

  /** Sends the selected Safe Work permit to the Red Tag automation backend. */
  buildInRedTag() {
    const sw = this.currentSafeWorkService.selectedItem();
    if (!sw?.id) {
      alert('Select a Safe Work permit first.');
      return;
    }
    this.isBuildingInRedTag.set(true);
    this.redTagAutomation.buildSafeWork(sw.id).pipe(
      takeUntilDestroyed(this.destroyRef)
    ).subscribe({
      next: () => this.isBuildingInRedTag.set(false),
      error: (err) => {
        this.isBuildingInRedTag.set(false);
        alert(`Failed to start Safe Work build: ${err?.error?.message ?? err?.message ?? 'Unknown error'}`);
      }
    });
  }
}
