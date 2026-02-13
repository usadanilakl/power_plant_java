import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';
import { RfJhaFormComponent } from '../rf-jha-form/rf-jha-form.component';
import { RfJhaTableComponent } from '../rf-jha-table/rf-jha-table.component';
import { RfJhaStateService } from '../services/rf-jha-state.service';
import { RfJhaApiService } from '../services/rf-jha-api.service';
import { JhaDto } from '../../../../../models/permits/jha.model';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

@Component({
  selector: 'app-rf-jha-page',
  standalone: true,
  imports: [
    RfPopupProjectionComponent,
    RfJhaFormComponent,
    RfJhaTableComponent,
  ],
  templateUrl: './rf-jha-page.component.html',
  styleUrl: './rf-jha-page.component.css',
})
export class RfJhaPageComponent {
  stateService = inject(RfJhaStateService);
  private apiService = inject(RfJhaApiService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  isSyncing = signal<boolean>(false);

  onRowDoubleClicked(item: JhaDto): void {
    this.stateService.loadItemById(item.id);
    this.stateService.openForm();
  }

  onSelectedItems(items: JhaDto[]): void {
    this.stateService.selectedItems.set(items);
    if (items.length === 1) {
      this.stateService.setSelectedItem(items[0]);
    }
  }

  onNewJha(): void {
    this.stateService.openNewJhaForm();
    this.stateService.openForm();
  }

  onTriggerSync(): void {
    this.isSyncing.set(true);

    this.apiService.triggerSync()
      .pipe(
        tap((response) => {
          const changes = response.responseData ?? 0;
          this.messageService.showSuccess(`Sync completed with ${changes} changes`);
          this.isSyncing.set(false);
          this.stateService.clearJhas();
          this.stateService.resetPage();
        }),
        catchError((error) => {
          console.error('Error triggering sync:', error);
          this.messageService.showError('Sync failed: ' + (error.error?.message || error.message));
          this.isSyncing.set(false);
          return of(null);
        }),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe();
  }
}
