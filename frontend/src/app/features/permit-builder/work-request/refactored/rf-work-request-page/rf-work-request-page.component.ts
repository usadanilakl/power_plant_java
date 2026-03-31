import { Component, inject, DestroyRef } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { map } from 'rxjs';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';
import { RfWorkRequestFormComponent } from '../rf-work-request-form/rf-work-request-form.component';
import { RfWorkRequestTableComponent } from '../rf-work-request-table/rf-work-request-table.component';
import { RfWorkRequestStateService } from '../services/rf-work-request-state.service';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { ExportDialogComponent } from '../../../../../shared/export-dialog/export-dialog.component';
import { SpSyncToolbarComponent } from '../../../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';

@Component({
  selector: 'app-rf-work-request-page',
  standalone: true,
  imports: [
    RfPopupProjectionComponent,
    RfWorkRequestFormComponent,
    RfWorkRequestTableComponent,
    ExportDialogComponent,
    SpSyncToolbarComponent,
  ],
  templateUrl: './rf-work-request-page.component.html',
  styleUrl: './rf-work-request-page.component.css',
})
export class RfWorkRequestPageComponent {
  stateService = inject(RfWorkRequestStateService);

  /** IDs of currently displayed WRs — passed to toolbar for scoped verification */
  displayedIds = toSignal(
    this.stateService.allLoadedWorkRequests$.pipe(
      map(items => items.map(wr => wr.id).filter((id): id is number => id != null))
    ),
    { initialValue: [] as number[] }
  );

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

  onSyncComplete(): void {
    this.stateService.reloadData();
  }
}
