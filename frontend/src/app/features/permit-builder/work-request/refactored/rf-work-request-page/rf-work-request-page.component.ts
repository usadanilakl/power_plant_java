import { Component, DestroyRef, inject, signal } from '@angular/core';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';
import { RfWorkRequestFormComponent } from '../rf-work-request-form/rf-work-request-form.component';
import { RfWorkRequestTableComponent } from '../rf-work-request-table/rf-work-request-table.component';
import { RfWorkRequestStateService } from '../services/rf-work-request-state.service';
import { RfWorkRequestApiService } from '../services/rf-work-request-api.service';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { tap, catchError } from 'rxjs/operators';
import { of } from 'rxjs';
import { ExportDialogComponent } from '../../../../../shared/export-dialog/export-dialog.component';

@Component({
  selector: 'app-rf-work-request-page',
  standalone: true,
  imports: [
    RfPopupProjectionComponent,
    RfWorkRequestFormComponent,
    RfWorkRequestTableComponent,
    ExportDialogComponent,
  ],
  templateUrl: './rf-work-request-page.component.html',
  styleUrl: './rf-work-request-page.component.css',
})
export class RfWorkRequestPageComponent {
  stateService = inject(RfWorkRequestStateService);
  private apiService = inject(RfWorkRequestApiService);
  private messageService = inject(GlobalMessageService);
  private destroyRef = inject(DestroyRef);

  isSyncing = signal<boolean>(false);

  onRowDoubleClicked(item: WorkRequestDto): void {
    this.stateService.loadItemById(item.id);
    this.stateService.openForm();
  }

  onSelectedItems(items: WorkRequestDto[]): void {
    this.stateService.selectedItems.set(items);
    if (items.length === 1) {
      this.stateService.setSelectedItem(items[0]);
    }
  }

  onNewWorkRequest(): void {
    this.stateService.openNewWorkRequestForm();
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
          this.stateService.clearWorkRequests();
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
