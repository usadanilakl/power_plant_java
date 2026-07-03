import { Component, OnInit, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute } from '@angular/router';
import { map } from 'rxjs';
import { WorkAreaApiService } from '../../../work-area/services/work-area-api.service';
import { RfPopupProjectionComponent } from '../../../../../shared/popup-projection/rf-popup-projection.component';
import { RfWorkRequestFormComponent } from '../rf-work-request-form/rf-work-request-form.component';
import { RfWorkRequestTableComponent } from '../rf-work-request-table/rf-work-request-table.component';
import { RfWorkRequestStateService } from '../services/rf-work-request-state.service';
import { WorkRequestDto } from '../../../../../models/permits/work-request.model';
import { ExportDialogComponent } from '../../../../../shared/export-dialog/export-dialog.component';
import { SpSyncToolbarComponent } from '../../../../../shared/sp-sync-toolbar/sp-sync-toolbar.component';
import { GlobalMessageService } from '../../../../../shared/global-message/global-message.service';
import {
  RfWorkRequestApiService,
  WorkRequestHealResult,
} from '../services/rf-work-request-api.service';

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
export class RfWorkRequestPageComponent implements OnInit {
  stateService = inject(RfWorkRequestStateService);
  private apiService = inject(RfWorkRequestApiService);
  private messageService = inject(GlobalMessageService);
  private route = inject(ActivatedRoute);
  private workAreaApi = inject(WorkAreaApiService);

  healRunning = signal(false);
  healResult = signal<WorkRequestHealResult | null>(null);

  displayedIds = toSignal(
    this.stateService.allLoadedWorkRequests$.pipe(
      map(items => items.map(wr => wr.id).filter((id): id is number => id != null))
    ),
    { initialValue: [] as number[] }
  );

  ngOnInit(): void {
    this.stateService.reloadData();
    // Started from a plant-map node ("Start permit here"): pre-open a new WR seeded with that work area.
    const workAreaId = this.route.snapshot.queryParamMap.get('workAreaId');
    if (workAreaId) {
      this.workAreaApi.getById(+workAreaId).subscribe(wa => {
        this.stateService.openNewWorkRequestForm(wa ?? undefined);
        this.stateService.openForm();
      });
    }
  }

  onRowDoubleClicked(item: WorkRequestDto): void {
    if (!item.id) {
      return;
    }
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
    this.healAndReload('manual');
  }

  healAndReload(mode: 'auto' | 'manual'): void {
    this.healRunning.set(true);
    this.apiService.healView().subscribe({
      next: (response) => {
        this.healRunning.set(false);
        this.healResult.set(response.responseData);
        this.stateService.reloadData();

        if (mode === 'manual') {
          this.messageService.showSuccess(response.responseData.message, 6000);
        }
      },
      error: (error) => {
        this.healRunning.set(false);
        const message = error?.error?.message || error?.message || 'Work request healing failed.';

        if (mode === 'manual') {
          this.messageService.showError(message, 6000);
        }
      }
    });
  }
}
